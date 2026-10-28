import sys
from pathlib import Path
import pandas as pd
import xarray as xr
import numpy as np

sys.path.insert(0, 'config')
import project_config as cfg

print("=== INSPEKSI FILE TANGKAPAN IKAN ===")
df_catch = pd.read_csv(cfg.CATCH_DATA_FILE, sep=';')
print("Kolom:", df_catch.columns.tolist())
print("Bentuk:", df_catch.shape)
print("Missing values:\n", df_catch.isnull().sum())

# Load MHW annual metrics
df_mhw_annual = pd.read_csv(cfg.MHW_METRICS_OUTPUT).set_index('tahun')

# Load combined dataset for annual SST and Chla
ds_combined = xr.open_dataset(cfg.COMBINED_OUTPUT)
sst_annual = ds_combined['sst'].groupby('time.year').mean(dim=['time', 'lat', 'lon']).to_series()
chla_annual = ds_combined['chlor_a'].groupby('time.year').mean(dim=['time', 'lat', 'lon']).to_series()

# Prepare catch dataframe
df_catch.columns = ['tahun', 'produksi_laut_ton']
df_catch['tahun'] = df_catch['tahun'].astype(int)
df_catch = df_catch.set_index('tahun')

# Merge all into annual synthesis dataframe
df_synthesis = pd.DataFrame(index=range(2000, 2021))
df_synthesis.index.name = 'Tahun'
df_synthesis['SST_Rerata_C'] = sst_annual.round(2)
df_synthesis['Frekuensi_MHW'] = df_mhw_annual['frekuensi_kejadian'].reindex(df_synthesis.index).fillna(0).astype(int)
df_synthesis['Total_Hari_MHW'] = df_mhw_annual['total_hari_mhw'].reindex(df_synthesis.index).fillna(0).astype(int)
df_synthesis['Intensitas_Maks_C'] = df_mhw_annual['intensitas_maks_tertinggi'].reindex(df_synthesis.index).fillna(0).round(2)
df_synthesis['Chla_Rerata_mg_m3'] = chla_annual.round(4)
df_synthesis['Produksi_Laut_Ton'] = df_catch['produksi_laut_ton']

print("\n=== TABEL SINTESIS TAHUNAN (2000-2020) ===")
print(df_synthesis.to_string())
