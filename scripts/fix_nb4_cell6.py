"""
Perbaikan Notebook 4 — Analisis Gabungan MHW dan Chlorophyll-a
===================================================================
Bug: Cell 6 menggunakan xr.interp (bilinear) untuk menggrid ulang chlorophyll-a
dari resolusi 4km ke 0.25deg SST. Metode ini menghasilkan NaN jika salah satu
dari 4 titik sekitar bernilai NaN, sehingga dengan tutupan awan tinggi (~62%)
hampir semua piksel target menjadi NaN.

Perbaikan: gunakan metode block-average (nanmean dalam kotak 0.25deg) yang lebih
tepat untuk agregasi spasial ke resolusi yang lebih kasar.
"""

import json
import numpy as np
import xarray as xr
import pandas as pd
from pathlib import Path
from datetime import datetime

project_root = Path(__file__).resolve().parent.parent
nb_path = project_root / "notebooks" / "04_Analisis_Gabungan_MHW_dan_Chlorophyll_a.ipynb"

with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# --- Cell 6 baru: gunakan block-average regrid ---
new_cell_6 = """# Penyelarasan grid chlorophyll-a ke grid SST (0.25deg) menggunakan block-average
# Catatan metode: bilinear interp tidak cocok untuk data dengan banyak NaN (tutupan awan).
# Block-average (nanmean) mengakomodasi missing value: suatu piksel SST tetap valid
# jika ada minimal satu piksel 4km dalam kotak 0.25deg yang tidak bernilai NaN.
print("Melakukan penyelarasan grid klorofil-a ke grid SST (0.25 deg) via block-average...")
print("=" * 65)

chla_lats = ds_chla_sub.lat.values
chla_lons = ds_chla_sub.lon.values
sst_lats = ds_sst_sub.lat.values
sst_lons = ds_sst_sub.lon.values
half = 0.125  # setengah resolusi SST

# Pra-hitung indeks bin lat/lon untuk efisiensi
lat_bin_idx = []
lon_bin_idx = []
for i, slat in enumerate(sst_lats):
    lat_bin_idx.append(np.where((chla_lats >= slat - half) & (chla_lats < slat + half))[0])
for j, slon in enumerate(sst_lons):
    lon_bin_idx.append(np.where((chla_lons >= slon - half) & (chla_lons < slon + half))[0])

n_time = len(ds_chla_sub.time)
chla_regrid_arr = np.full((n_time, len(sst_lats), len(sst_lons)), np.nan, dtype=np.float32)

for t in range(n_time):
    chla_day = ds_chla_sub['chlor_a'].isel(time=t).values
    for i, li in enumerate(lat_bin_idx):
        for j, lj in enumerate(lon_bin_idx):
            block = chla_day[np.ix_(li, lj)]
            if (~np.isnan(block)).any():
                chla_regrid_arr[t, i, j] = float(np.nanmean(block))
    if t % 500 == 0:
        pct = 100 * t / n_time
        n_valid = int((~np.isnan(chla_regrid_arr[t])).sum())
        print(f"  Progres: {t}/{n_time} hari ({pct:.1f}%) - hari ini {n_valid} piksel valid")

print(f"  Selesai: {n_time} hari diproses.")

# Normalisasi timestamp chla ke 12:00 (konsisten dengan SST OISST)
chla_times_noon = pd.DatetimeIndex([
    pd.Timestamp(t).replace(hour=12)
    for t in pd.DatetimeIndex(ds_chla_sub.time.values)
]).values

# Susun DataArray regridded
chla_regrid_da = xr.DataArray(
    chla_regrid_arr,
    coords={"time": chla_times_noon, "lat": sst_lats, "lon": sst_lons},
    dims=["time", "lat", "lon"],
    attrs={
        "long_name": ds_chla_sub['chlor_a'].attrs.get("long_name", "Chlorophyll-a"),
        "units": "mg/m3",
        "regrid_method": "block-average (nanmean) from 4km to 0.25deg SST grid",
        "source_resolution": "~4 km (0.0417 deg)",
        "target_resolution": "0.25 deg (~25 km)",
        "note": "Piksel NaN berarti tidak ada data 4km yang valid dalam kotak 0.25deg (tutupan awan atau daratan)."
    }
)

# Selaraskan waktu antara SST dan chlorophyll-a (inner join pada waktu)
sst_times_set = set(pd.DatetimeIndex(ds_sst_sub.time.values))
chla_times_set = set(pd.DatetimeIndex(chla_times_noon))
common_times = sorted(sst_times_set & chla_times_set)
print(f"\\nTotal hari waktu bersama (SST & Chla): {len(common_times)}")

ds_sst_aligned = ds_sst_sub.sel(time=np.array(common_times, dtype='datetime64[ns]'))
chla_regrid_aligned = chla_regrid_da.sel(time=np.array(common_times, dtype='datetime64[ns]'))

# Buat dataset gabungan
ds_combined = xr.Dataset(
    data_vars={
        'sst': ds_sst_aligned['sst'],
        'chlor_a': chla_regrid_aligned
    },
    attrs={
        'title': 'Dataset Gabungan SST dan Chlorophyll-a Perairan NTT',
        'sst_source': 'NOAA OISST v2.1 AVHRR-only daily (0.25 deg)',
        'chla_source': 'ESA CCI OC v6.0 (Copernicus C3S, ~4km), diregrid ke 0.25 deg via block-average',
        'grid_resolution': '0.25 degree (~25 km)',
        'regrid_method': 'block-average (nanmean) — metode tepat untuk downsampling data dengan banyak gap',
        'note': 'SST timestamps: 12:00 UTC. Chla timestamps dikonversi ke 12:00 UTC sebelum penyelarasan.',
        'created_by': 'Notebook 4 - Analisis Gabungan MHW dan Chlorophyll-a (perbaikan regrid)',
        'created_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
)

print(f"\\nDataset gabungan berhasil dibuat:")
print(f"  Dimensi  : {dict(ds_combined.sizes)}")
print(f"  Waktu    : {str(ds_combined.time.values[0])[:10]} s.d. {str(ds_combined.time.values[-1])[:10]}")
print(f"  SST valid: {(~np.isnan(ds_combined['sst'].values)).sum():,}")
print(f"  Chla valid: {(~np.isnan(ds_combined['chlor_a'].values)).sum():,}")
pct_chla = (~np.isnan(ds_combined['chlor_a'].values)).sum() / ds_combined['chlor_a'].values.size * 100
print(f"  Chla valid pct: {pct_chla:.1f}%")
print(f"\\n--- Verifikasi regrid: spot check ---")
for t_idx in [0, 10, 100, 200, 500]:
    n = int((~np.isnan(ds_combined['chlor_a'].isel(time=t_idx).values)).sum())
    date = str(ds_combined.time.values[t_idx])[:10]
    print(f"  [{t_idx}] {date}: {n} valid chla piksel (dari 960 total)")

# Simpan dataset gabungan NetCDF
ds_combined.to_netcdf(
    cfg.COMBINED_OUTPUT,
    encoding={
        'sst': {'zlib': True, 'complevel': 4, 'dtype': 'float32'},
        'chlor_a': {'zlib': True, 'complevel': 4, 'dtype': 'float32'}
    }
)
print(f"\\nDataset gabungan disimpan: {cfg.COMBINED_OUTPUT}")
"""

lines = [l + "\n" for l in new_cell_6.split("\n")]
lines[-1] = lines[-1].rstrip("\n")
nb["cells"][6]["source"] = lines
# Clear old outputs for cell 6
nb["cells"][6]["outputs"] = []

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print("Notebook 4 cell 6 berhasil diperbarui (fix regrid block-average).")
