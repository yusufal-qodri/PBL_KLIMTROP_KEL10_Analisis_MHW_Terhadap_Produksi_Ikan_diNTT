"""
Skrip Ekstraksi dan Pembuatan Cache Interim Chlorophyll-a
=========================================================
Mengekstrak file NetCDF dari 252 ZIP bulanan (2000-2020),
menyimpan cache interim per tahun di data/interim/chla_daily_{year}.nc,
dan menggabungkan seluruh tahun menjadi data/processed/chlorophyll_a_daily_ntt.nc.
"""

import sys
from pathlib import Path
import zipfile
import io
import time
from concurrent.futures import ThreadPoolExecutor
import xarray as xr
import pandas as pd
import numpy as np

# Impor config
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root / "config"))
import project_config as cfg

def read_one_zip(zf_path):
    daily = []
    fails = []
    with zipfile.ZipFile(zf_path) as z:
        nc_names = sorted([n for n in z.namelist() if n.endswith('.nc')])
        for nc_name in nc_names:
            try:
                b = z.open(nc_name).read()
                with xr.open_dataset(io.BytesIO(b)) as ds:
                    vars_to_keep = [v for v in ['chlor_a', 'total_nobs'] if v in ds]
                    if vars_to_keep:
                        daily.append(ds[vars_to_keep].load())
            except Exception as e:
                fails.append({"zip": zf_path.name, "nc": nc_name, "error": str(e)})
    return daily, fails, len(nc_names)

def main():
    print("=" * 60)
    print("PROSES EKSTRAKSI CHLOROPHYLL-A HARIAN (2000-2020)")
    print("=" * 60)
    
    zip_dir = cfg.CHLA_ZIP_DIR_PRIMARY
    if not zip_dir.exists():
        zip_dir = cfg.CHLA_ZIP_DIR_SECONDARY
        
    zip_files = sorted(zip_dir.glob("chla_ntt_*.zip"))
    print(f"Direktori ZIP: {zip_dir}")
    print(f"Total ZIP    : {len(zip_files)}")
    
    # Kelompokkan per tahun
    zip_by_year = {}
    for zf in zip_files:
        parts = zf.stem.replace("chla_ntt_", "").split("_")
        yr = int(parts[0]) if parts[0].isdigit() else 0
        zip_by_year.setdefault(yr, []).append(zf)
        
    cfg.INTERIM_DIR.mkdir(parents=True, exist_ok=True)
    cfg.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    
    yearly_datasets = []
    total_fails = []
    t_start = time.time()
    
    for yr in sorted(zip_by_year.keys()):
        t0 = time.time()
        interim_path = cfg.INTERIM_DIR / f"chla_daily_{yr}.nc"
        
        if interim_path.exists() and interim_path.stat().st_size > 1000:
            print(f"[{yr}] Memuat dari cache: {interim_path.name}")
            ds_yr = xr.open_dataset(interim_path).load()
            yearly_datasets.append(ds_yr)
            continue
            
        yr_zips = zip_by_year[yr]
        print(f"[{yr}] Mengekstrak {len(yr_zips)} zip bulanan...")
        with ThreadPoolExecutor(max_workers=6) as ex:
            results = list(ex.map(read_one_zip, yr_zips))
            
        yr_daily = []
        for daily_list, fail_list, _ in results:
            yr_daily.extend(daily_list)
            total_fails.extend(fail_list)
            
        if yr_daily:
            ds_yr = xr.concat(yr_daily, dim="time").sortby("time")
            encoding = {v: {"zlib": True, "complevel": 3, "dtype": "float32"} for v in ds_yr.data_vars}
            ds_yr.to_netcdf(interim_path, encoding=encoding)
            yearly_datasets.append(ds_yr)
            print(f"[{yr}] Berhasil: {len(yr_daily)} hari dalam {time.time()-t0:.1f}s -> {interim_path.name}")
        else:
            print(f"[{yr}] ⚠️ Tidak ada data berhasil diekstrak!")
            
    print("\n" + "=" * 60)
    print("MENGGABUNGKAN SELURUH TAHUN (2000-2020)...")
    print("=" * 60)
    
    if yearly_datasets:
        ds_combined = xr.concat(yearly_datasets, dim="time").sortby("time")
        
        # Cek dan hapus duplikat timestamp jika ada
        times = pd.DatetimeIndex(ds_combined.time.values)
        n_dup = times.duplicated().sum()
        if n_dup > 0:
            print(f"⚠️ {n_dup} timestamp duplikat ditemukan. Mengambil nilai pertama...")
            ds_combined = ds_combined.sel(time=~times.duplicated())
            
        # Metadata sesuai PRD
        ds_combined.attrs["title"] = "Chlorophyll-a Harian Gabungan - Perairan NTT"
        ds_combined.attrs["source"] = "ESA CCI Ocean Colour v6.0 (Copernicus C3S)"
        ds_combined.attrs["spatial_resolution"] = "~4 km (~0.0417 degree)"
        ds_combined.attrs["region"] = f"Bounding box NTT: lon {cfg.LON_MIN}–{cfg.LON_MAX}°E, lat {cfg.LAT_MIN}–{cfg.LAT_MAX}°"
        ds_combined.attrs["created_by"] = "Pipeline PBL KLIMTROP Kelompok 10"
        ds_combined.attrs["created_date"] = time.strftime("%Y-%m-%d %H:%M:%S")
        ds_combined.attrs["note"] = (
            "Data harian asli dipertahankan. Missing value (NaN) berasal dari tutupan awan "
            "dan tidak diubah menjadi nol. Agregasi bulanan dilakukan di notebook analisis."
        )
        
        out_file = cfg.CHLA_MERGED_OUTPUT
        print(f"Menyimpan dataset gabungan ke: {out_file} ...")
        encoding = {v: {"zlib": True, "complevel": 4, "dtype": "float32"} for v in ds_combined.data_vars}
        ds_combined.to_netcdf(out_file, encoding=encoding)
        
        size_mb = out_file.stat().st_size / (1024 * 1024)
        print(f"✅ Selesai! Ukuran file: {size_mb:.1f} MB")
        print(f"   Dimensi  : {dict(ds_combined.sizes)}")
        print(f"   Periode  : {str(ds_combined.time.values[0])[:10]} s.d. {str(ds_combined.time.values[-1])[:10]}")
        print(f"   Total waktu: {(time.time() - t_start)/60:.1f} menit")
    else:
        print("❌ Gagal: tidak ada dataset yang dapat digabung!")

if __name__ == "__main__":
    main()
