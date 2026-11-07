"""
grid_analysis.py
================
Analisis PER GRID (sel 0.25 derajat) dari data pack harian, tanpa butuh NetCDF:

    python dashboard/tools/grid_analysis.py

Dijalankan otomatis di akhir build_daily_grids.py. Keluaran: dashboard/data/analysis/
  daily_extent.json     cakupan harian (% sel laut) MHW per grid: aturan Hobday (termasuk sel jeda) dan
                        hanya sel yang benar-benar di atas ambang P90
  catalog_check.json    pemeriksaan katalog 56 kejadian terhadap data per grid: hari MHW regional (>=15%),
                        hari jeda (<15%), kecocokan hasil deteksi ulang dengan katalog
  grid_stats.json       tiap sel: Chlorophyll a saat MHW vs non-MHW (anomali, uji Mann-Whitney U, koreksi FDR
                        Benjamini-Hochberg), per musim (ALL/DJF/MAM/JJA/SON)
  pooled.json           ringkasan seluruh sel per musim
  ../grids/sst_daymean_doy.bin  klimatologi harian per sel (rata-rata 21 tahun) untuk peta anomali SST
  event_grid_stats.json ringkasan Chlorophyll a per kejadian MHW (sel-hari MHW)

Definisi yang dipakai (agar tidak ada hari non-MHW yang terhitung MHW):
  * hari MHW sel      = SST > P90 sel itu, pada hari yang menjadi anggota kejadian (mask Hobday)
  * hari jeda sel     = anggota kejadian tetapi SST <= P90 (digabung karena jeda <= 2 hari)  -> BUKAN hari MHW
  * hari non-MHW sel  = bukan anggota kejadian (hari jeda dikeluarkan dari kedua kelompok)
  * hari MHW regional = cakupan sel anggota kejadian >= 15% luas laut (aturan katalog)
"""
import json
from pathlib import Path

import numpy as np
from scipy import stats

DASH = Path(__file__).resolve().parents[1]
GR, OUT = DASH / "data" / "grids", DASH / "data" / "analysis"
NODATA, NR, NC = -32768, 24, 40
CELLS = NR * NC
MIN_N, THR = 10, 15.0
SEASONS = {"ALL": None, "DJF": [12, 1, 2], "MAM": [3, 4, 5], "JJA": [6, 7, 8], "SON": [9, 10, 11]}

def bh(p):
    q = np.full(p.shape, np.nan)
    idx = np.where(np.isfinite(p))[0]
    if not len(idx):
        return q
    order = np.argsort(p[idx]); n = len(idx)
    r = p[idx][order] * n / np.arange(1, n + 1)
    r = np.minimum.accumulate(r[::-1])[::-1]
    q[idx[order]] = np.minimum(r, 1.0)
    return q

def runs(flag, max_gap=2, min_dur=5):
    d = np.diff(np.concatenate(([0], flag.astype(np.int8), [0])))
    st, en = np.where(d == 1)[0], np.where(d == -1)[0] - 1
    out = []
    for s, e in zip(st, en):
        if out and s - out[-1][1] - 1 <= max_gap:
            out[-1][1] = e
        else:
            out.append([s, e])
    return [(s, e) for s, e in out if e - s + 1 >= min_dur]

def grid(a, nd=4):
    return [[None if not np.isfinite(v) else round(float(v), nd) for v in row] for row in a.reshape(NR, NC)]

def run():
    man = json.loads((GR / "manifest.json").read_text(encoding="utf-8"))
    years, sc = man["years"], man["scale"]
    rd = lambda sub, dt: np.concatenate([np.fromfile(GR / sub / f"{y}.bin", dtype=dt).reshape(-1, CELLS) for y in years])
    sst, chl, mask = rd("sst", "<i2"), rd("chla", "<i2"), rd("mask", "u1")
    T = sst.shape[0]
    days = np.arange("2000-01-01", "2021-01-01", dtype="datetime64[D]")[:T]
    doy = (days - days.astype("datetime64[Y]")).astype(int) + 1
    month = days.astype("datetime64[M]").astype(int) % 12 + 1
    thr = np.fromfile(GR / "thresh_doy.bin", dtype="<i2").reshape(366, CELLS)[doy - 1]
    base = np.fromfile(GR / "chla_base_doy.bin", dtype="<i2").reshape(366, CELLS)[doy - 1]
    valid_s = sst != NODATA
    member = mask == 1
    strict = member & valid_s & (thr != NODATA) & (sst > thr)           # hari MHW sebenarnya (di atas P90)
    ocean = valid_s.any(axis=0)
    n_ocean = int(ocean.sum())
    # klimatologi harian sederhana per sel: rata-rata 21 tahun pada hari-ke-tahun yang sama (tanpa penghalusan).
    # Dipakai untuk peta anomali SST saat MHW (SST hari MHW dikurangi rata-rata 21 tahun sel itu pada hari yang sama).
    dm = np.full((366, CELLS), NODATA, dtype="<i2")
    for d in range(1, 367):
        sel = doy == d
        if sel.any():
            v = np.where(valid_s[sel], sst[sel].astype("float64"), np.nan)
            with np.errstate(all="ignore"):
                m = np.nanmean(v, axis=0)
            ok = np.isfinite(m)
            dm[d - 1, ok] = np.rint(m[ok]).astype("<i2")
    dm.tofile(GR / "sst_daymean_doy.bin")
    OUT.mkdir(parents=True, exist_ok=True)
    wr = lambda n, o: (OUT / n).write_text(json.dumps(o, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    # ---- cakupan harian
    mem_pct = member[:, ocean].sum(1) / n_ocean * 100
    str_pct = strict[:, ocean].sum(1) / n_ocean * 100
    wr("daily_extent.json", {"start": "2000-01-01", "n_ocean_cells": n_ocean, "threshold_pct": THR,
                             "member_pct": [round(float(v), 1) for v in mem_pct], "strict_pct": [round(float(v), 1) for v in str_pct]})

    # ---- pemeriksaan katalog
    cat_file = DASH / "data" / "mhw_events_spatial.json"
    chk = {"threshold_pct": THR, "n_ocean_cells": n_ocean}
    if cat_file.exists():
        cat = json.loads(cat_file.read_text(encoding="utf-8"))
        d0 = np.datetime64("2000-01-01")
        rows, tot_cat = [], 0
        for e in cat:
            s, t = int((np.datetime64(e["start_date"]) - d0).astype(int)), int((np.datetime64(e["end_date"]) - d0).astype(int))
            seg = mem_pct[s:t + 1]
            reg = int((seg >= THR).sum()); n = t - s + 1; tot_cat += n
            rows.append({"event_id": e["event_id"], "days": n, "regional_days": reg, "gap_days": n - reg,
                         "strict_ge15_days": int((str_pct[s:t + 1] >= THR).sum()), "max_member_pct": round(float(seg.max()), 1),
                         "max_strict_pct": round(float(str_pct[s:t + 1].max()), 1), "catalog_peak_pct": e["peak_extent_pct"]})
        det = [(str(days[s]), str(days[t])) for s, t in runs(mem_pct >= THR)]
        cs = {(e["start_date"], e["end_date"]) for e in cat}
        chk.update({"events": rows, "summary": {
            "catalog_events": len(cat), "catalog_days": tot_cat, "regional_days": sum(r["regional_days"] for r in rows),
            "gap_days": sum(r["gap_days"] for r in rows), "strict_ge15_days": sum(r["strict_ge15_days"] for r in rows),
            "redetected_events": len(det), "matched_exact": len(cs & set(det)),
            "only_in_catalog": sorted(cs - set(det))[:20], "only_in_redetection": sorted(set(det) - cs)[:20]}})
    wr("catalog_check.json", chk)

    # ---- Chlorophyll a per sel: sel-hari MHW (di atas P90) vs sel-hari non-MHW (bukan anggota kejadian)
    cv = chl != NODATA
    chl_f = np.where(cv, chl / sc["chla"], np.nan).astype(np.float32)
    base_f = np.where(base != NODATA, base / sc["chla"], np.nan).astype(np.float32)
    anom = chl_f - base_f
    va = np.isfinite(anom)
    G_M, G_N = strict & va, (~member) & va & valid_s
    gs = {"seasons": list(SEASONS), "min_n": MIN_N, "fdr": 0.05}
    pooled = {}
    for sea, ms in SEASONS.items():
        sm = np.ones(T, bool) if ms is None else np.isin(month, ms)
        M, N = G_M & sm[:, None], G_N & sm[:, None]
        n_m, n_n = M.sum(0), N.sum(0)
        cm = np.where(n_m > 0, np.nansum(np.where(M, chl_f, 0), 0) / np.maximum(n_m, 1), np.nan)
        cn = np.where(n_n > 0, np.nansum(np.where(N, chl_f, 0), 0) / np.maximum(n_n, 1), np.nan)
        am = np.where(n_m > 0, np.nansum(np.where(M, anom, 0), 0) / np.maximum(n_m, 1), np.nan)
        bm = np.where(n_m > 0, np.nansum(np.where(M, base_f, 0), 0) / np.maximum(n_m, 1), np.nan)
        pct = am / bm * 100
        p = np.full(CELLS, np.nan)
        for c in np.where(ocean & (n_m >= MIN_N) & (n_n >= MIN_N))[0]:
            p[c] = stats.mannwhitneyu(anom[M[:, c], c], anom[N[:, c], c], alternative="two-sided").pvalue
        q = bh(p)
        ok = np.isfinite(q)
        dirn = np.where(~ok, np.nan, np.where(q < 0.05, np.sign(am), 0.0))
        gs[sea] = {"n_mhw": grid(np.where(ocean, n_m, np.nan), 0), "n_non": grid(np.where(ocean, n_n, np.nan), 0), "chl_mhw": grid(cm), "chl_non": grid(cn),
                   "anom": grid(am), "pct": grid(pct, 2), "p": grid(p, 6), "q": grid(q, 6), "dir": grid(dirn, 0)}
        okc = ok & np.isfinite(am)
        pooled[sea] = {"cells_tested": int(okc.sum()), "cells_with_mhw": int((ocean & (n_m > 0)).sum()),
                       "n_mhw_celldays": int(M.sum()), "n_non_celldays": int(N.sum()),
                       "chl_mhw_mean": float(np.nanmean(chl_f[M])) if M.any() else None, "chl_mhw_median": float(np.nanmedian(chl_f[M])) if M.any() else None,
                       "chl_non_mean": float(np.nanmean(chl_f[N])) if N.any() else None, "chl_non_median": float(np.nanmedian(chl_f[N])) if N.any() else None,
                       "anom_mhw_mean": float(np.nanmean(anom[M])) if M.any() else None, "anom_mhw_median": float(np.nanmedian(anom[M])) if M.any() else None,
                       "pct_cells_decrease": float((am[okc] < 0).mean() * 100) if okc.any() else None,
                       "pct_cells_sig_decrease": float(((dirn[okc]) == -1).mean() * 100) if okc.any() else None,
                       "pct_cells_sig_increase": float(((dirn[okc]) == 1).mean() * 100) if okc.any() else None,
                       "median_cell_pct": float(np.nanmedian(pct[okc])) if okc.any() else None}
    wr("grid_stats.json", gs)
    wr("pooled.json", pooled)

    # ---- ringkasan per kejadian (sel-hari MHW pada periode kejadian)
    if cat_file.exists():
        evs = []
        for e in cat:
            s, t = int((np.datetime64(e["start_date"]) - d0).astype(int)), int((np.datetime64(e["end_date"]) - d0).astype(int))
            M = G_M[s:t + 1]; cnt = M.sum(0)
            has = (cnt > 0) & ocean
            ca = np.where(cnt > 0, np.nansum(np.where(M, anom[s:t + 1], 0), 0) / np.maximum(cnt, 1), np.nan)
            evs.append({"event_id": e["event_id"], "cells_mhw": int(((strict[s:t + 1].sum(0) > 0) & ocean).sum()), "cells_with_chl": int(has.sum()),
                        "celldays": int(M.sum()), "chl_mean": float(np.nanmean(chl_f[s:t + 1][M])) if M.any() else None,
                        "anom_mean": float(np.nanmean(anom[s:t + 1][M])) if M.any() else None,
                        "pct_cells_decrease": float((ca[has] < 0).mean() * 100) if has.any() else None})
        wr("event_grid_stats.json", evs)
    sm = chk.get("summary")
    print(f"Analisis per grid selesai -> {OUT}")
    if sm:
        print(f"Katalog: {sm['catalog_events']} kejadian, {sm['catalog_days']} hari durasi; hari MHW regional (>=15%): {sm['regional_days']}; "
              f"hari jeda (<15%): {sm['gap_days']}; deteksi ulang {sm['redetected_events']} kejadian, cocok persis {sm['matched_exact']}")

if __name__ == "__main__":
    run()
