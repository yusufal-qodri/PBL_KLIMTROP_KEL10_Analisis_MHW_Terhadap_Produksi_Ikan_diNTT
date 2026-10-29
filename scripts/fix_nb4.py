import json
from pathlib import Path

nb_path = Path("notebooks/04_Analisis_Gabungan_MHW_dan_Chlorophyll_a.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Cell 4 yang lengkap dan benar
cell_4_text = """# Buka dataset input dan katalog MHW
print("Memuat dataset SST, Chlorophyll-a, dan Katalog MHW...")

ds_sst = xr.open_dataset(cfg.SST_MERGED_OUTPUT)
ds_chla = xr.open_dataset(cfg.CHLA_MERGED_OUTPUT)
df_events = pd.read_csv(cfg.MHW_EVENTS_OUTPUT)

# Buka katalog MHW regional spasial jika tersedia
spatial_catalog_file = cfg.PROCESSED_DIR / "mhw_events_spatial_catalog_ntt.csv"
if not spatial_catalog_file.exists():
    spatial_catalog_file = cfg.TABLES_DIR / "mhw_events_spatial_catalog_ntt.csv"

if spatial_catalog_file.exists():
    df_regional_events = pd.read_csv(spatial_catalog_file)
    print(f"✅ Katalog MHW Regional Spasial dimuat: {len(df_regional_events)} kejadian.")
else:
    df_regional_events = None

print(f"Dataset SST  : {str(ds_sst.time.values[0])[:10]} s.d. {str(ds_sst.time.values[-1])[:10]} ({len(ds_sst.time)} hari)")
print(f"Dataset Chl-a: {str(ds_chla.time.values[0])[:10]} s.d. {str(ds_chla.time.values[-1])[:10]} ({len(ds_chla.time)} hari)")
print(f"Katalog MHW  : {len(df_events)} kejadian teridentifikasi")

# Tentukan periode tumpang tindih
t_start = max(ds_sst.time.values[0], ds_chla.time.values[0])
t_end = min(ds_sst.time.values[-1], ds_chla.time.values[-1])

print(f"\\nPeriode Overlap Analisis Gabungan:")
print(f"  Mulai   : {str(t_start)[:10]}")
print(f"  Selesai : {str(t_end)[:10]}")

# Potong kedua dataset ke periode overlap
ds_sst_sub = ds_sst.sel(time=slice(t_start, t_end))
ds_chla_sub = ds_chla.sel(time=slice(t_start, t_end))
print(f"Jumlah hari overlap yang dianalisis: {len(ds_sst_sub.time)} hari (2000–2020)")
"""
nb["cells"][4]["source"] = [line + "\n" for line in cell_4_text.split("\n")]
if nb["cells"][4]["source"]:
    nb["cells"][4]["source"][-1] = nb["cells"][4]["source"][-1].rstrip("\n")

# Cell 6 yang cerdas: muat jika cache ada, atau hitung jika belum ada
cell_6_text = """# Penyelarasan grid chlorophyll-a ke grid SST (0.25deg) menggunakan block-average
# Catatan metode: bilinear interp tidak cocok untuk data dengan banyak NaN (tutupan awan).
# Block-average (nanmean) mengakomodasi missing value: suatu piksel SST tetap valid
# jika ada minimal satu piksel 4km dalam kotak 0.25deg yang tidak bernilai NaN.
print("Melakukan penyelarasan grid klorofil-a ke grid SST (0.25 deg) via block-average...")
print("=" * 65)

if cfg.COMBINED_OUTPUT.exists():
    print(f"Dataset gabungan terselaraskan ditemukan di cache: {cfg.COMBINED_OUTPUT.name}")
    ds_combined = xr.open_dataset(cfg.COMBINED_OUTPUT)
    print(f"Dataset berhasil dimuat:")
    print(f"  Dimensi  : {dict(ds_combined.sizes)}")
    print(f"  Waktu    : {str(ds_combined.time.values[0])[:10]} s.d. {str(ds_combined.time.values[-1])[:10]}")
    print(f"  SST valid: {(~np.isnan(ds_combined['sst'].values)).sum():,}")
    print(f"  Chla valid: {(~np.isnan(ds_combined['chlor_a'].values)).sum():,}")
    pct_chla = (~np.isnan(ds_combined['chlor_a'].values)).sum() / ds_combined['chlor_a'].values.size * 100
    print(f"  Chla valid pct: {pct_chla:.1f}%")
else:
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
    
    chla_times_noon = pd.DatetimeIndex([
        pd.Timestamp(t).replace(hour=12)
        for t in pd.DatetimeIndex(ds_chla_sub.time.values)
    ]).values
    
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
    
    sst_times_set = set(pd.DatetimeIndex(ds_sst_sub.time.values))
    chla_times_set = set(pd.DatetimeIndex(chla_times_noon))
    common_times = sorted(sst_times_set & chla_times_set)
    print(f"\\nTotal hari waktu bersama (SST & Chla): {len(common_times)}")
    
    ds_sst_aligned = ds_sst_sub.sel(time=np.array(common_times, dtype='datetime64[ns]'))
    chla_regrid_aligned = chla_regrid_da.sel(time=np.array(common_times, dtype='datetime64[ns]'))
    
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
    
    ds_combined.to_netcdf(
        cfg.COMBINED_OUTPUT,
        encoding={
            'sst': {'zlib': True, 'complevel': 4, 'dtype': 'float32'},
            'chlor_a': {'zlib': True, 'complevel': 4, 'dtype': 'float32'}
        }
    )
    print(f"\\nDataset gabungan disimpan: {cfg.COMBINED_OUTPUT}")
"""
nb["cells"][6]["source"] = [line + "\n" for line in cell_6_text.split("\n")]
if nb["cells"][6]["source"]:
    nb["cells"][6]["source"][-1] = nb["cells"][6]["source"][-1].rstrip("\n")

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print("Notebook 04 Cell 4 and Cell 6 successfully fixed.")

