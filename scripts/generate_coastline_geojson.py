"""
Mengekstrak garis pantai dan pulau NTT dari data Natural Earth (via Cartopy)
dan menyimpannya sebagai GeoJSON untuk digunakan di dashboard Leaflet.
Juga memperbarui spatial_grids.json dengan data multi-temporal:
- Rata-rata tahunan (2000 - 2020)
- Rata-rata bulanan (1 - 12)
- Rata-rata musiman (DJF, MAM, JJA, SON)
- Rata-rata dekadal (2000-2009, 2010-2019, 2020)
- Sampel harian representatif
- Metrik spasial MHW (total_mhw_days, max_intensity)
dengan mask daratan pulau NTT (land=null) yang ketat.
"""

import json
import numpy as np
from pathlib import Path
import xarray as xr
import pandas as pd

try:
    import geopandas as gpd
    import cartopy.io.shapereader as shpreader
    from shapely.geometry import box, mapping
except ImportError as e:
    print(f"Missing dependency: {e}")
    exit(1)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "dashboard" / "data" / "ntt_coastline.geojson"
DASHBOARD_DATA = PROJECT_ROOT / "dashboard" / "data"

# NTT bounding box (slight buffer beyond the data extent)
NTT_BOX = box(117.0, -13.5, 128.0, -6.0)

print("Loading Natural Earth land polygons (10m resolution)...")
shp_land = shpreader.natural_earth(resolution='10m', category='physical', name='land')
gdf_land = gpd.read_file(shp_land)

# Clip to NTT area
print("Clipping to NTT bounding box...")
gdf_clip = gdf_land[gdf_land.geometry.intersects(NTT_BOX)].copy()
gdf_clip["geometry"] = gdf_clip.geometry.intersection(NTT_BOX)
gdf_clip = gdf_clip[~gdf_clip.geometry.is_empty]

print(f"Found {len(gdf_clip)} land features in NTT region.")

features = []
for _, row in gdf_clip.iterrows():
    geom = row.geometry
    if geom is None or geom.is_empty:
        continue
    features.append({
        "type": "Feature",
        "geometry": mapping(geom),
        "properties": {}
    })

geojson = {
    "type": "FeatureCollection",
    "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
    "features": features
}

with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(geojson, f, separators=(',', ':'))

size_kb = OUTPUT_PATH.stat().st_size / 1024
print(f"Saved NTT coastline GeoJSON: {OUTPUT_PATH.name} ({size_kb:.1f} KB)")

print("\nUpdating spatial_grids.json with multi-temporal data and land masking...")

ds_sst = xr.open_dataset(PROJECT_ROOT / "data/processed/sst_daily_2000_2020_ntt.nc")
ds_clim = xr.open_dataset(PROJECT_ROOT / "data/processed/sst_climatology_threshold_ntt.nc")
ds_aligned = xr.open_dataset(PROJECT_ROOT / "data/processed/mhw_chla_aligned_daily_ntt.nc")

# Land mask: cells where SST is NaN in the time-mean
sst_mean_grid = ds_sst.sst.mean(dim="time").values  # shape (24, 40)
land_mask = np.isnan(sst_mean_grid)                 # True = land

lat_coords = [round(float(x), 4) for x in ds_sst.lat.values]
lon_coords = [round(float(x), 4) for x in ds_sst.lon.values]

def sanitize_grid(arr, mask=None):
    out = []
    for r in range(arr.shape[0]):
        row_out = []
        for c in range(arr.shape[1]):
            if mask is not None and mask[r, c]:
                row_out.append(None)
            elif np.isnan(arr[r, c]) or np.isinf(arr[r, c]):
                row_out.append(None)
            else:
                row_out.append(round(float(arr[r, c]), 3))
        out.append(row_out)
    return out

# 1. Overall mean
sst_mean_masked = sanitize_grid(sst_mean_grid, mask=land_mask)

mhw_days_arr = ds_clim.total_mhw_days.values.copy()
mhw_days_arr[land_mask] = np.nan
mhw_days_masked = sanitize_grid(mhw_days_arr, mask=land_mask)

mhw_int_arr = ds_clim.max_intensity.values.copy()
mhw_int_arr[land_mask] = np.nan
mhw_int_masked = sanitize_grid(mhw_int_arr, mask=land_mask)

chla_mean_arr = ds_aligned.chlor_a.mean(dim="time").values.copy()
chla_land_mask = land_mask | np.isnan(chla_mean_arr)
chla_mean_masked = sanitize_grid(chla_mean_arr, mask=chla_land_mask)

# 2. Annual grids (2000 - 2020)
print("Computing annual spatial grids...")
sst_annual_da = ds_sst.sst.groupby("time.year").mean(dim="time")
chla_annual_da = ds_aligned.chlor_a.groupby("time.year").mean(dim="time")

sst_annual = {}
chla_annual = {}
for yr in range(2000, 2021):
    yr_str = str(yr)
    if yr in sst_annual_da.year.values:
        s_arr = sst_annual_da.sel(year=yr).values
        sst_annual[yr_str] = sanitize_grid(s_arr, mask=land_mask)
    if yr in chla_annual_da.year.values:
        c_arr = chla_annual_da.sel(year=yr).values
        chla_annual[yr_str] = sanitize_grid(c_arr, mask=(land_mask | np.isnan(c_arr)))

# 3. Monthly grids (1 - 12)
print("Computing monthly spatial grids...")
sst_monthly_da = ds_sst.sst.groupby("time.month").mean(dim="time")
chla_monthly_da = ds_aligned.chlor_a.groupby("time.month").mean(dim="time")

sst_monthly = {}
chla_monthly = {}
for m in range(1, 13):
    m_str = str(m)
    s_arr = sst_monthly_da.sel(month=m).values
    c_arr = chla_monthly_da.sel(month=m).values
    sst_monthly[m_str] = sanitize_grid(s_arr, mask=land_mask)
    chla_monthly[m_str] = sanitize_grid(c_arr, mask=(land_mask | np.isnan(c_arr)))

# 4. Seasonal grids
print("Computing seasonal grids...")
seasons = {"DJF": [12, 1, 2], "MAM": [3, 4, 5], "JJA": [6, 7, 8], "SON": [9, 10, 11]}
sst_seasonal = {}
chla_seasonal = {}
for s_name, months in seasons.items():
    sst_sub = ds_sst.sst.sel(time=ds_sst.time.dt.month.isin(months)).mean(dim="time").values
    chla_sub = ds_aligned.chlor_a.sel(time=ds_aligned.time.dt.month.isin(months)).mean(dim="time").values
    sst_seasonal[s_name] = sanitize_grid(sst_sub, mask=land_mask)
    chla_seasonal[s_name] = sanitize_grid(chla_sub, mask=(land_mask | np.isnan(chla_sub)))

# 5. Decadal grids
print("Computing decadal grids...")
decades = {
    "2000_2009": range(2000, 2010),
    "2010_2019": range(2010, 2020),
    "2020": [2020]
}
sst_decadal = {}
chla_decadal = {}
for dec_key, yr_range in decades.items():
    s_dec = ds_sst.sst.sel(time=ds_sst.time.dt.year.isin(yr_range)).mean(dim="time").values
    c_dec = ds_aligned.chlor_a.sel(time=ds_aligned.time.dt.year.isin(yr_range)).mean(dim="time").values
    sst_decadal[dec_key] = sanitize_grid(s_dec, mask=land_mask)
    chla_decadal[dec_key] = sanitize_grid(c_dec, mask=(land_mask | np.isnan(c_dec)))

# 6. Sample Representative Days
sample_days = {}
sample_dates = [
    ("normal_transition", "2015-05-15", "Kondisi Normal (Peralihan I - Suhu Moderat ~29.2°C)"),
    ("upwelling_peak", "2018-08-15", "Puncak Upwelling Monsun Timur (SST Dingin ~26.8°C, Chl-a Tinggi)"),
    ("mhw_extreme_2016", "2016-06-25", "Kejadian MHW Ekstrem Terpanjang 2016 (SST Panas ~30.8°C, Chl-a Rendah)"),
    ("warm_event_2020", "2020-04-10", "Kejadian MHW Kuat April 2020 (SST Tinggi ~30.6°C)")
]

for key, dt_str, desc in sample_dates:
    try:
        sst_slice = ds_sst.sst.sel(time=dt_str, method="nearest").values
        if sst_slice.ndim == 3:
            sst_slice = sst_slice[0]
        try:
            chla_slice = ds_aligned.chlor_a.sel(time=dt_str, method="nearest").values
            if chla_slice.ndim == 3:
                chla_slice = chla_slice[0]
        except Exception:
            chla_slice = np.full((len(lat_coords), len(lon_coords)), np.nan)

        sample_days[key] = {
            "date": dt_str,
            "desc": desc,
            "sst": sanitize_grid(sst_slice, mask=land_mask),
            "chla": sanitize_grid(chla_slice, mask=(land_mask | np.isnan(chla_slice)))
        }
    except Exception as e:
        print(f"  Sample {dt_str}: {e}")

spatial_payload = {
    "total_mhw_days": mhw_days_masked,
    "max_intensity": mhw_int_masked,
    "sst_mean_all": sst_mean_masked,
    "chla_mean_all": chla_mean_masked,
    "sst_annual": sst_annual,
    "chla_annual": chla_annual,
    "sst_monthly": sst_monthly,
    "chla_monthly": chla_monthly,
    "sst_seasonal": sst_seasonal,
    "chla_seasonal": chla_seasonal,
    "sst_decadal": sst_decadal,
    "chla_decadal": chla_decadal,
    "sample_days": sample_days
}

existing_path = DASHBOARD_DATA / "spatial_grids.json"
with open(existing_path, "w", encoding="utf-8") as f:
    json.dump(spatial_payload, f, separators=(',', ':'))

new_size = existing_path.stat().st_size / 1024
print(f"Saved complete spatial_grids.json ({new_size:.1f} KB)")
print("ALL SPATIAL DATA GENERATION COMPLETED SUCCESSFULLY.")
