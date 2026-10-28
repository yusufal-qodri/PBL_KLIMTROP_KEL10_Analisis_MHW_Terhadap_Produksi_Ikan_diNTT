import json
from pathlib import Path

nb_path = Path("notebooks/01_Persiapan_dan_Penggabungan_Data.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

new_cell_22 = """# Ekstraksi dan penggabungan chlorophyll-a dari ZIP
from concurrent.futures import ThreadPoolExecutor

print("Memproses chlorophyll-a dari file ZIP...")
print("=" * 60)

# Tentukan sumber ZIP utama
chla_zip_dir = None
for d in [cfg.CHLA_ZIP_DIR_PRIMARY, cfg.CHLA_ZIP_DIR_SECONDARY]:
    if d.exists() and len(list(d.glob("chla_ntt_*.zip"))) > 0:
        chla_zip_dir = d
        break

if chla_zip_dir is None:
    print("Tidak ada folder ZIP chlorophyll-a yang ditemukan!")
    print("Proses chlorophyll-a dilewati.")
    ds_chla_combined = None
else:
    zip_files = sorted(chla_zip_dir.glob("chla_ntt_*.zip"))
    print(f"Sumber ZIP   : {chla_zip_dir}")
    print(f"Jumlah ZIP   : {len(zip_files)}")
    
    yearly_datasets = []
    files_gagal = []
    files_berhasil = 0
    total_nc_files = 0
    
    # Kelompokkan zip berdasarkan tahun untuk pemrosesan per tahun
    zip_by_year = {}
    for zf in zip_files:
        parts = zf.stem.replace("chla_ntt_", "").split("_")
        yr = int(parts[0]) if parts[0].isdigit() else 0
        zip_by_year.setdefault(yr, []).append(zf)
    
    def _read_nc_from_zip(zf_path):
        daily = []
        gagal = []
        with zipfile.ZipFile(zf_path) as z:
            nc_names = sorted([n for n in z.namelist() if n.endswith('.nc')])
            for nc_name in nc_names:
                try:
                    with z.open(nc_name) as nc_file:
                        nc_bytes = nc_file.read()
                    with xr.open_dataset(io.BytesIO(nc_bytes)) as ds_daily:
                        vars_to_keep = [v for v in ['chlor_a', 'total_nobs'] if v in ds_daily]
                        if vars_to_keep:
                            daily.append(ds_daily[vars_to_keep].load())
                except Exception as e:
                    gagal.append({"zip": zf_path.name, "nc": nc_name, "error": str(e)})
        return daily, gagal, len(nc_names)

    for yr in sorted(zip_by_year.keys()):
        interim_file = cfg.INTERIM_DIR / f"chla_daily_{yr}.nc"
        if interim_file.exists():
            ds_yr = xr.open_dataset(interim_file).load()
            yearly_datasets.append(ds_yr)
            n_d = len(ds_yr.time)
            files_berhasil += n_d
            total_nc_files += n_d
            print(f"  Tahun {yr}: {n_d} hari dimuat dari cache interim.")
            continue
            
        yr_zips = zip_by_year[yr]
        yr_daily = []
        with ThreadPoolExecutor(max_workers=6) as executor:
            results = list(executor.map(_read_nc_from_zip, yr_zips))
            
        for daily_list, fail_list, n_nc in results:
            yr_daily.extend(daily_list)
            files_gagal.extend(fail_list)
            total_nc_files += n_nc
            files_berhasil += len(daily_list)
        
        if yr_daily:
            ds_yr = xr.concat(yr_daily, dim="time").sortby("time")
            encoding = {v: {"zlib": True, "complevel": 3, "dtype": "float32"} for v in ds_yr.data_vars}
            ds_yr.to_netcdf(interim_file, encoding=encoding)
            yearly_datasets.append(ds_yr)
            print(f"  Tahun {yr}: {len(yr_daily)} hari digabung dan disimpan ke interim.")
    
    print(f"\\nHasil pemrosesan:")
    print(f"  Total file NC dalam ZIP : {total_nc_files}")
    print(f"  Berhasil dibaca         : {files_berhasil}")
    print(f"  Gagal                   : {len(files_gagal)}")
    
    if files_gagal:
        df_gagal = pd.DataFrame(files_gagal)
        print(f"\\nFile gagal:")
        print(df_gagal.head(20).to_string(index=False))
        df_gagal.to_csv(cfg.LOGS_DIR / "chla_extraction_failures.csv", index=False)
    
    # Gabungkan semua dataset tahunan
    if yearly_datasets:
        print(f"\\nMenggabungkan {len(yearly_datasets)} tahun dataset chlorophyll-a...")
        ds_chla_combined = xr.concat(yearly_datasets, dim="time")
        ds_chla_combined = ds_chla_combined.sortby("time")
        
        # Cek dan hapus duplikat waktu
        times = pd.DatetimeIndex(ds_chla_combined.time.values)
        n_dup = times.duplicated().sum()
        if n_dup > 0:
            print(f"Peringatan: {n_dup} timestamp duplikat. Mengambil nilai pertama...")
            ds_chla_combined = ds_chla_combined.sel(time=~times.duplicated())
        
        print(f"\\nDataset chlorophyll-a gabungan:")
        print(f"  Variabel  : {list(ds_chla_combined.data_vars)}")
        print(f"  Dimensi   : {dict(ds_chla_combined.sizes)}")
        print(f"  Waktu     : {str(ds_chla_combined.time.values[0])[:10]} s.d. "
              f"{str(ds_chla_combined.time.values[-1])[:10]}")
        print(f"  Jumlah hari: {len(ds_chla_combined.time)}")
        print(f"  Lat       : {float(ds_chla_combined.lat.min()):.4f} s.d. "
              f"{float(ds_chla_combined.lat.max()):.4f}")
        print(f"  Lon       : {float(ds_chla_combined.lon.min()):.4f} s.d. "
              f"{float(ds_chla_combined.lon.max()):.4f}")
        print(f"  Grid      : {len(ds_chla_combined.lat)} lat x {len(ds_chla_combined.lon)} lon")
        
        # Statistik
        if 'chlor_a' in ds_chla_combined:
            chla_vals = ds_chla_combined['chlor_a'].values.flatten()
            valid = chla_vals[~np.isnan(chla_vals)]
            print(f"\\n  Statistik chlor_a:")
            print(f"    Total piksel : {len(chla_vals):,}")
            print(f"    Valid        : {len(valid):,} ({100*len(valid)/len(chla_vals):.1f}%)")
            print(f"    Min          : {valid.min():.6f} mg/m³")
            print(f"    Max          : {valid.max():.4f} mg/m³")
            print(f"    Mean         : {valid.mean():.4f} mg/m³")
            print(f"    Median       : {np.median(valid):.4f} mg/m³")
    else:
        print("Tidak ada dataset chlorophyll-a berhasil diproses!")
        ds_chla_combined = None"""

lines = [l + "\n" for l in new_cell_22.split("\n")]
lines[-1] = lines[-1].rstrip("\n")
nb["cells"][22]["source"] = lines

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)
print("Updated cell 22 successfully.")
