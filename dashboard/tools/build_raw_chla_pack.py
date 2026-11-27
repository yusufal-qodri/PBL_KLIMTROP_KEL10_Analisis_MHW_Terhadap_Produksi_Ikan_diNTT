"""
build_raw_chla_pack.py
======================
Membangun data pack Chlorophyll-a resolusi asli (~4 km, 108 x 192) dari
data/chla_ntt_daily/data_klorofil_ntt_118-126E_12-75S.nc khusus untuk halaman
"Marine Heatwaves vs Non-Marine Heatwaves (peta penuh)" agar perhitungan dan
tabelnya identik dengan notebook anomaliklorofil.ipynb.
"""
import json
from pathlib import Path
import numpy as np
import pandas as pd
import xarray as xr

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "data" / "chla_ntt_daily" / "data_klorofil_ntt_118-126E_12-75S.nc"
OUT = ROOT / "dashboard" / "data" / "grids" / "chla_raw"


def main():
    if not SRC.exists():
        raise FileNotFoundError(f"File mentah Chlorophyll-a tidak ditemukan: {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)

    print(f"Membuka {SRC.name} ...")
    ds = xr.open_dataset(SRC)
    chl = ds["chlor_a"].sortby(["time", "lat", "lon"])
    chl = chl.sel(lat=slice(-12.0, -7.5), lon=slice(118.0, 126.0))

    # Reindex ke deret harian lengkap 2000-01-01..2020-12-31
    t = pd.to_datetime(chl.time.values).floor("D")
    chl = chl.assign_coords(time=t.values.astype("datetime64[ns]"))
    chl = chl.isel(time=~pd.Index(chl.time.values).duplicated())
    days_ns = np.arange("2000-01-01", "2021-01-01", dtype="datetime64[D]").astype("datetime64[ns]")
    chl = chl.reindex(time=days_ns).transpose("time", "lat", "lon").load()

    lats = chl.lat.values
    lons = chl.lon.values
    nr, nc = len(lats), len(lons)
    step = float(np.median(np.diff(lons)))
    print(f"Grid mentah Chl-a: {nr} lat x {nc} lon (step={step:.6f})")

    times = pd.to_datetime(chl.time.values)
    data = chl.values.astype(np.float32)  # (T, nr, nc)

    # 1. Tulis file tahunan float32 (tanpa kompresi/kuantisasi int16 agar persis NetCDF)
    years = list(range(2000, 2021))
    for y in years:
        m = times.year == y
        arr = np.ascontiguousarray(data[m], dtype="<f4")
        arr.tofile(OUT / f"{y}.bin")
    print(f"Tulis {len(years)} file tahunan ke {OUT}")

    # 2. Precompute baseline bulanan (12 x nr x nc) untuk 2000-2020
    # Format: 12 * nr * nc float64 (sum) diikuti 12 * nr * nc uint16 (count)
    b_sum = np.zeros((12, nr, nc), dtype="<f8")
    b_cnt = np.zeros((12, nr, nc), dtype="<u2")
    for m_idx in range(12):
        sub = data[times.month == (m_idx + 1)]
        valid = np.isfinite(sub)
        b_cnt[m_idx] = valid.sum(axis=0).astype("<u2")
        b_sum[m_idx] = np.where(valid, sub, 0.0).sum(axis=0, dtype=np.float64)

    with open(OUT / "baseline_monthly.bin", "wb") as f:
        f.write(b_sum.tobytes())
        f.write(b_cnt.tobytes())

    manifest = {
        "shape": [int(nr), int(nc)],
        "lat0": float(lats[0]),
        "lon0": float(lons[0]),
        "step": step,
        "dtype": "float32",
        "years": years,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("Selesai menulis baseline_monthly.bin dan manifest.json")
    ds.close()


if __name__ == "__main__":
    main()
