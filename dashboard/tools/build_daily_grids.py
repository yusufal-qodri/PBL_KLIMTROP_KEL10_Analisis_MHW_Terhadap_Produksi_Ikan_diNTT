"""
build_daily_grids.py
====================
Membuat "data pack harian" untuk NTT Marine Insight Dashboard dari file NetCDF hasil
notebook (data/processed/*.nc). Data pack ini mengaktifkan:
  - peta harian / mingguan / bulanan / tahunan / dekadal dengan statistik rata-rata,
    maksimum, minimum, median, dan simpangan baku (halaman Sebaran Data, SST, Chlorophyll a)
  - peta tiap kejadian MHW dan peta Chlorophyll a pada periode yang sama
    (halaman Beranda, Peta Kejadian MHW, Chlorophyll a vs MHW)
  - peta perbandingan MHW vs tahun tanpa MHW pada tanggal yang sama
  - peta jumlah hari MHW per tahun

Cara pakai (dari folder utama proyek, tempat folder data/ dan dashboard/ berada):
    python dashboard/tools/build_daily_grids.py

Hasil ditulis ke dashboard/data/grids/ (sekitar 40-50 MB, boleh di-.gitignore).
Tidak ada nilai yang dibuat-buat: semua nilai berasal langsung dari NetCDF. Nilai hilang
(awan / daratan) disimpan sebagai NODATA dan tidak pernah diganti nol.

Format berkas (semua little-endian, urutan [hari-dalam-tahun, lintang(selatan->utara), bujur]):
    sst/<tahun>.bin        int16  = SST (degC) x 100
    chla/<tahun>.bin       int16  = Chlorophyll a (mg/m3) x 1000   (maks. 32.0)
    mask/<tahun>.bin       uint8  = 1 bila sel sedang dalam MHW (Hobday et al., 2016)
    clim_doy.bin           int16  = klimatologi SST per hari-ke-tahun (366 x 24 x 40) x 100
    thresh_doy.bin         int16  = ambang P90 per hari-ke-tahun x 100
    chla_base_doy.bin      int16  = baseline Chlorophyll a (hanya hari non-MHW, jendela +-7 hari) x 1000
    manifest.json          metadata
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

ROOT = Path(__file__).resolve().parents[2]
PROC = ROOT / "data" / "processed"
OUT = ROOT / "dashboard" / "data" / "grids"
NODATA = -32768
SST_SCALE, CHL_SCALE = 100, 1000
MIN_DUR, MAX_GAP = 5, 2          # kriteria Hobday et al. (2016) seperti pada NB2

def to_int16(a, scale):
    out = np.full(a.shape, NODATA, dtype=np.int16)
    ok = np.isfinite(a)
    out[ok] = np.clip(np.rint(a[ok] * scale), -32767, 32767).astype(np.int16)
    return out

def detect_cell(sst_c, clim_c, thr_c):
    """Replikasi detect_mhw_events_1d (scripts/detect_mhw.py): SST > P90, jeda <= MAX_GAP digabung
    hanya jika SST selama jeda > klimatologi, durasi >= MIN_DUR. Hari jeda ikut ditandai (anggota kejadian)."""
    T = len(sst_c)
    flags = np.zeros(T, dtype=np.uint8)
    above = np.isfinite(sst_c) & np.isfinite(thr_c) & (sst_c > thr_c)
    if not above.any():
        return flags
    d = np.diff(np.concatenate(([0], above.astype(np.int8), [0])))
    st, en = np.where(d == 1)[0], np.where(d == -1)[0] - 1          # [start, end] inklusif
    merged, cs, ce = [], st[0], en[0]
    for s, e in zip(st[1:], en[1:]):
        gap = s - ce - 1
        if gap <= MAX_GAP and np.all(sst_c[ce + 1:s] > clim_c[ce + 1:s]):
            ce = e
        else:
            merged.append((cs, ce)); cs, ce = s, e
    merged.append((cs, ce))
    for s, e in merged:
        if e - s + 1 >= MIN_DUR:
            flags[s:e + 1] = 1
    return flags

def hobday_mask(S, cl_t, thr_t):
    """S, cl_t, thr_t: (T, nr, nc) -> mask anggota kejadian MHW (uint8)."""
    T, nr, nc = S.shape
    mask = np.zeros((T, nr * nc), dtype=np.uint8)
    S2, C2, H2 = S.reshape(T, -1), cl_t.reshape(T, -1), thr_t.reshape(T, -1)
    for c in range(nr * nc):
        if np.isfinite(S2[:, c]).any():
            mask[:, c] = detect_cell(S2[:, c], C2[:, c], H2[:, c])
    return mask.reshape(T, nr, nc)

def to_daily(da):
    """Samakan stempel waktu ke hari (mis. OISST/ERDDAP memakai 12:00) lalu reindex ke deret harian lengkap."""
    t = pd.to_datetime(da.time.values).floor("D")
    da = da.assign_coords(time=t.values.astype("datetime64[ns]"))
    da = da.isel(time=~pd.Index(da.time.values).duplicated())
    days_ns = np.arange("2000-01-01", "2021-01-01", dtype="datetime64[D]").astype("datetime64[ns]")
    return da.reindex(time=days_ns).transpose("time", "lat", "lon")

def main():
    f_sst, f_clim, f_chl = PROC / "sst_daily_2000_2020_ntt.nc", PROC / "sst_climatology_threshold_ntt.nc", PROC / "mhw_chla_aligned_daily_ntt.nc"
    for f in (f_sst, f_clim, f_chl):
        if not f.exists():
            sys.exit(f"[ERROR] Berkas tidak ditemukan: {f}\nJalankan notebook 01-04 terlebih dahulu.")
    print("Membuka NetCDF ...")
    sst = xr.open_dataset(f_sst).sst.sortby("lat")
    sst_raw_time = str(sst.time.values[:2])
    clim = xr.open_dataset(f_clim)
    chl = xr.open_dataset(f_chl).chlor_a.sortby("lat")
    cl, th = clim.climatology.sortby("lat"), clim.threshold.sortby("lat")
    lat, lon = sst.lat.values, sst.lon.values
    nr, nc = len(lat), len(lon)
    print(f"Grid {nr} x {nc}")
    if (nr, nc) != (24, 40):
        sys.exit("[ERROR] Dashboard mengharapkan grid 24 x 40 (0.25 derajat).")

    # samakan waktu ke hari & reindex ke deret harian lengkap 2000-2020
    days = np.arange("2000-01-01", "2021-01-01", dtype="datetime64[D]")
    sst, chl = to_daily(sst), to_daily(chl)
    dim_doy = [d for d in cl.dims if d not in ("lat", "lon")][0]
    cl = cl.transpose(dim_doy, "lat", "lon").values.astype("float64")
    th = th.transpose(dim_doy, "lat", "lon").values.astype("float64")
    if cl.shape[0] != 366:
        sys.exit(f"[ERROR] Klimatologi harus 366 hari-ke-tahun, ditemukan {cl.shape[0]}")
    S, C = sst.values.astype("float64"), chl.values.astype("float64")
    pct_sst, pct_chl = 100 * np.isfinite(S).mean(), 100 * np.isfinite(C).mean()
    print(f"Sel-hari SST valid: {pct_sst:.1f}% | Chlorophyll a valid: {pct_chl:.1f}%")
    if pct_sst < 20:
        sys.exit("[ERROR] Hampir seluruh SST kosong setelah penyelarasan waktu. Periksa dimensi/variabel NetCDF "
                 f"(contoh waktu: {sst_raw_time})")
    doy = (days - days.astype("datetime64[Y]")).astype(int) + 1     # 1..366
    T = len(days)

    print("Menghitung mask MHW per sel (Hobday) ...")
    mask = hobday_mask(S, cl[doy - 1], th[doy - 1])

    print("Menghitung baseline Chlorophyll a (hari non-MHW, jendela +-7 hari) ...")
    Cn = np.where(mask == 1, np.nan, C)
    ssum, scnt = np.zeros((366, nr, nc)), np.zeros((366, nr, nc))
    for d in range(1, 367):
        sel = doy == d
        if sel.any():
            v = Cn[sel]
            ssum[d - 1] = np.nansum(v, axis=0)
            scnt[d - 1] = np.isfinite(v).sum(axis=0)
    wsum, wcnt = np.zeros_like(ssum), np.zeros_like(scnt)
    for k in range(-7, 8):
        wsum += np.roll(ssum, k, axis=0)
        wcnt += np.roll(scnt, k, axis=0)
    with np.errstate(invalid="ignore", divide="ignore"):
        base = np.where(wcnt > 0, wsum / wcnt, np.nan)

    OUT.mkdir(parents=True, exist_ok=True)
    for sub in ("sst", "chla", "mask"):
        (OUT / sub).mkdir(exist_ok=True)
    years = list(range(2000, 2021))
    ymap = days.astype("datetime64[Y]").astype(int) + 1970
    for y in years:
        i = ymap == y
        to_int16(S[i], SST_SCALE).tofile(OUT / "sst" / f"{y}.bin")
        to_int16(C[i], CHL_SCALE).tofile(OUT / "chla" / f"{y}.bin")
        mask[i].astype(np.uint8).tofile(OUT / "mask" / f"{y}.bin")
    to_int16(cl, SST_SCALE).tofile(OUT / "clim_doy.bin")
    to_int16(th, SST_SCALE).tofile(OUT / "thresh_doy.bin")
    to_int16(base, CHL_SCALE).tofile(OUT / "chla_base_doy.bin")
    valid_chl = np.isfinite(C).any(axis=(1, 2))
    n_mhw = int(mask.sum())
    print(f"Sel-hari MHW (mask Hobday): {n_mhw}")
    if n_mhw == 0:
        print("[PERINGATAN] Tidak ada sel MHW terdeteksi; periksa berkas klimatologi/ambang.")
    manifest = {
        "stats": {"sst_valid_pct": round(float(pct_sst), 2), "chla_valid_pct": round(float(pct_chl), 2), "mhw_cell_days": n_mhw},
        "version": 1, "shape": [nr, nc], "lat": [round(float(x), 4) for x in lat], "lon": [round(float(x), 4) for x in lon],
        "years": years, "scale": {"sst": SST_SCALE, "chla": CHL_SCALE}, "nodata": NODATA,
        "chla_first_valid_day": str(days[valid_chl][0]) if valid_chl.any() else None,
        "mhw_rule": f"Per sel (detect_mhw.py): SST > P90 musiman, durasi >= {MIN_DUR} hari, jeda <= {MAX_GAP} hari digabung bila SST jeda > klimatologi; mask = anggota kejadian (termasuk hari jeda)",
        "chla_baseline": "rata-rata hari non-MHW pada jendela +-7 hari-ke-tahun (2000-2020)",
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Selesai. Data pack ditulis ke {OUT}")
    print("Menjalankan analisis per grid ...")
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        import grid_analysis
        grid_analysis.run()
    except Exception as exc:                                  # pack tetap valid walau analisis gagal
        print(f"[PERINGATAN] Analisis per grid gagal: {exc}\nJalankan terpisah: python dashboard/tools/grid_analysis.py")
    print("Muat ulang dashboard (python run_dashboard.py) - banner 'Mode data terbatas' akan hilang.")

if __name__ == "__main__":
    main()
