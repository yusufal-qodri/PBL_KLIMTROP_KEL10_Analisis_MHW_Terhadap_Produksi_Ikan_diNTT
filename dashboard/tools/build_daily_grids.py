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

def hobday_mask(exceed):
    """exceed: bool (T, ncell). Kembalikan mask MHW: run >= MIN_DUR, jeda <= MAX_GAP digabung."""
    T, n = exceed.shape
    mask = np.zeros((T, n), dtype=np.uint8)
    for c in range(n):
        e = exceed[:, c]
        if not e.any():
            continue
        d = np.diff(np.concatenate(([0], e.astype(np.int8), [0])))
        starts, ends = np.where(d == 1)[0], np.where(d == -1)[0]      # [start, end)
        keep = [(s, t) for s, t in zip(starts, ends) if t - s >= MIN_DUR]
        if not keep:
            continue
        merged = [list(keep[0])]
        for s, t in keep[1:]:
            if s - merged[-1][1] <= MAX_GAP:
                merged[-1][1] = t
            else:
                merged.append([s, t])
        for s, t in merged:
            mask[s:t, c] = 1
    return mask

def main():
    f_sst, f_clim, f_chl = PROC / "sst_daily_2000_2020_ntt.nc", PROC / "sst_climatology_threshold_ntt.nc", PROC / "mhw_chla_aligned_daily_ntt.nc"
    for f in (f_sst, f_clim, f_chl):
        if not f.exists():
            sys.exit(f"[ERROR] Berkas tidak ditemukan: {f}\nJalankan notebook 01-04 terlebih dahulu.")
    print("Membuka NetCDF ...")
    sst = xr.open_dataset(f_sst).sst.sortby("lat")
    clim = xr.open_dataset(f_clim)
    chl = xr.open_dataset(f_chl).chlor_a.sortby("lat")
    cl, th = clim.climatology.sortby("lat"), clim.threshold.sortby("lat")
    lat, lon = sst.lat.values, sst.lon.values
    nr, nc = len(lat), len(lon)
    print(f"Grid {nr} x {nc}")
    if (nr, nc) != (24, 40):
        sys.exit("[ERROR] Dashboard mengharapkan grid 24 x 40 (0.25 derajat).")

    # reindex ke deret harian lengkap 2000-2020
    # Normalkan koordinat waktu ke tengah hari (floor ke D) agar reindex cocok
    # (data NetCDF sering menyimpan timestamp 12:00:00 UTC, bukan tengah malam)
    target_days = pd.date_range("2000-01-01", "2020-12-31", freq="D")
    sst_dates = pd.to_datetime(sst.time.values).floor("D")
    chl_dates = pd.to_datetime(chl.time.values).floor("D")
    sst = sst.assign_coords(time=sst_dates).reindex(time=target_days).transpose("time", "lat", "lon")
    chl = chl.assign_coords(time=chl_dates).reindex(time=target_days).transpose("time", "lat", "lon")
    days = target_days.values.astype("datetime64[D]")
    dim_doy = [d for d in cl.dims if d not in ("lat", "lon")][0]
    cl = cl.transpose(dim_doy, "lat", "lon").values.astype("float64")
    th = th.transpose(dim_doy, "lat", "lon").values.astype("float64")
    if cl.shape[0] != 366:
        sys.exit(f"[ERROR] Klimatologi harus 366 hari-ke-tahun, ditemukan {cl.shape[0]}")
    S, C = sst.values.astype("float64"), chl.values.astype("float64")
    doy = (days - days.astype("datetime64[Y]")).astype(int) + 1     # 1..366
    T = len(days)

    print("Menghitung mask MHW per sel (Hobday) ...")
    thr_t = th[doy - 1]
    exceed = (S > thr_t) & np.isfinite(S) & np.isfinite(thr_t)
    mask = hobday_mask(exceed.reshape(T, -1)).reshape(T, nr, nc)

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
    manifest = {
        "version": 1, "shape": [nr, nc], "lat": [round(float(x), 4) for x in lat], "lon": [round(float(x), 4) for x in lon],
        "years": years, "scale": {"sst": SST_SCALE, "chla": CHL_SCALE}, "nodata": NODATA,
        "chla_first_valid_day": str(days[valid_chl][0]) if valid_chl.any() else None,
        "mhw_rule": f"Hobday et al. (2016): SST > P90 musiman, durasi >= {MIN_DUR} hari, jeda <= {MAX_GAP} hari",
        "chla_baseline": "rata-rata hari non-MHW pada jendela +-7 hari-ke-tahun (2000-2020)",
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Selesai. Data pack ditulis ke {OUT}")
    print("Muat ulang dashboard (python run_dashboard.py) - banner 'Mode data terbatas' akan hilang.")

if __name__ == "__main__":
    main()
