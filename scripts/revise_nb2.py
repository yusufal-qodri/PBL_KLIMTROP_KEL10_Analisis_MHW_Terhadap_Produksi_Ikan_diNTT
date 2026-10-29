import json
from pathlib import Path

nb_path = Path("notebooks/02_Analisis_SST_dan_Deteksi_MHW.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# 1. Update Cell 0: Framework Metodologis Deteksi MHW Spasial & Regional
cell_0_text = """# Notebook 2 — Analisis Suhu Permukaan Laut (SST) dan Deteksi Spasial Marine Heatwave (MHW)

**Proyek:** Analisis Spatiotemporal Marine Heatwaves (MHW), Klorofil-a, dan Konteks Perikanan Tangkap Provinsi Nusa Tenggara Timur  
**Dokumen Rujukan Metodologis:** `REVISI_PBL.md` & Standar Hobday et al. (2016, 2018)

---

## 1. Landasan Metodologis Deteksi MHW

### A. Definisi dan Standar Ilmiah (Hobday et al., 2016)
Marine Heatwave (MHW) didefinisikan sebagai fenomena anomali suhu air laut hangat ekstrem yang berkepanjangan secara tidak wajar (*anomalously warm water event*), dengan kriteria:
1. **Ambang Batas Suhu:** Suhu Permukaan Laut (SST) melampaui persentil ke-90 musiman harian lokal (klimatologi harian dihitung dalam jendela bergerak 11–31 hari).
2. **Durasi Minimal:** Kondisi di atas ambang batas berlangsung minimal **5 hari berturut-turut**.
3. **Penggabungan Kejadian (Gap Merging):** Jeda waktu $\le 2$ hari di bawah ambang batas digabungkan menjadi satu kejadian tunggal selama suhu air laut tidak turun di bawah nilai klimatologi rata-rata.
4. **Kategorisasi Intensitas (Hobday et al., 2018):** Berdasarkan kelipatan selisih antara persentil ke-90 dan nilai klimatologi harian ($2\times = \text{Kategori II/Kuat}$, $3\times = \text{Kategori III/Parah}$, $4\times = \text{Kategori IV/Ekstrem}$).

### B. Justifikasi Ilmiah Periode Baseline 2000–2020 (21 Tahun)
Standar WMO menyarankan baseline 30 tahun. Namun, sejalan dengan konsensus Hobday et al. (2016) dan Oliver et al. (2018), baseline 20–30 tahun dapat diterima secara ilmiah untuk penginderaan jauh multi-sensor satelit modern. Periode 2000–2020 (21 tahun) digunakan secara konsisten untuk menyelaraskan pengamatan SST (NOAA OISST v2.1), data klorofil-a (MODIS-Aqua / CCI v6.0 era 2002+), dan data produksi perikanan BPS.

### C. Pendekatan Deteksi Dua Tingkat (Two-Tier Detection Strategy):
1. **Tingkat 1 — Deteksi Spasial Grid-by-Grid (Lokal):**
   Deteksi MHW dilakukan secara independen pada setiap 884 sel laut NTT (0.25° × 0.25°). Pendekatan ini melestarikan heterogenitas oseanografi lokal di Laut Sawu, Laut Flores, Selat Sumba, dan Laut Timor.
2. **Tingkat 2 — Identifikasi Kejadian Regional NTT:**
   Agregasi spasial harian untuk menentukan luas cakupan (*spatial extent*). Kejadian diklasifikasikan sebagai **Kejadian Regional NTT** jika minimal **15% luas perairan laut NTT** ($\ge 95$ sel grid laut) secara simultan mengalami status MHW selama $\ge 5$ hari berturut-turut.
3. **Tingkat 3 — Referensi Rata-Rata Regional 1D:**
   Deret waktu 1D rata-rata regional NTT tetap disajikan sebagai referensi pembanding transparan terhadap literatur konvensional.
"""

nb["cells"][0]["source"] = [line + "\n" for line in cell_0_text.split("\n")]
if nb["cells"][0]["source"]:
    nb["cells"][0]["source"][-1] = nb["cells"][0]["source"][-1].rstrip("\n")

# 2. Update Cell 11 & 12: Narasi & Eksekusi Deret Waktu 1D NTT Rata-rata
cell_11_text = """---
## 5. Deteksi MHW Referensi: Deret Waktu Rata-Rata Regional 1D (Metode Konvensional)

Sebagai tahap awal dan pembanding metodologis, deteksi MHW di bawah ini diterapkan pada deret waktu rata-rata spasial regional 1D perairan NTT.
*Catatan Penting:* Pendekatan 1D ini meratakan suhu seluruh NTT sehingga dapat mengaburkan fenomena MHW lokal. Analisis definitif spasial per-grid akan dieksekusi pada Bagian 7.
"""
nb["cells"][11]["source"] = [line + "\n" for line in cell_11_text.split("\n")]
if nb["cells"][11]["source"]:
    nb["cells"][11]["source"][-1] = nb["cells"][11]["source"][-1].rstrip("\n")

# 3. Update Cell 19 & 20: Deteksi MHW Grid-by-Grid Penuh dan Katalog Regional NTT
cell_19_text = """---
## 7. Deteksi MHW Spasial Grid-by-Grid Penuh dan Identifikasi Kejadian Regional NTT

Sesuai arahan `REVISI_PBL.md` dan standar Hobday et al. (2016):
1. Algoritma deteksi MHW dieksekusi pada **seluruh 884 titik sel grid laut NTT (0.25° × 0.25°)** secara independen.
2. Setiap sel grid memiliki kurva klimatologi harian (366 hari) dan persentil ke-90 lokalnya sendiri.
3. Menghasilkan peta akumulasi hari MHW, frekuensi kejadian, intensitas maksimum ($i_{max}$), dan intensitas rata-rata ($i_{mean}$).
4. Mengelompokkan kejadian regional berbasis cakupan spasial harian ($\ge 15\%$ perairan NTT aktif MHW selama $\ge 5$ hari).
5. Mengekspor katalog kejadian regional spasial ke `outputs/tables/mhw_events_spatial_catalog_ntt.csv`.
"""
nb["cells"][19]["source"] = [line + "\n" for line in cell_19_text.split("\n")]
if nb["cells"][19]["source"]:
    nb["cells"][19]["source"][-1] = nb["cells"][19]["source"][-1].rstrip("\n")

cell_20_text = """# Eksekusi Deteksi MHW Spasial Grid-by-Grid dan Pembentukan Katalog Regional
from scripts.detect_mhw import run_spatial_mhw_detection

print("Memulai komputasi MHW spasial penuh untuk 884 sel laut NTT...")
spatial_results = run_spatial_mhw_detection(ds_sst, regional_extent_threshold=0.15, verbose=True)

# Ekstraksi hasil
spatial_clim = spatial_results['spatial_clim']
spatial_thresh = spatial_results['spatial_thresh']
spatial_mhw_days = spatial_results['spatial_mhw_days']
spatial_mhw_events_count = spatial_results['spatial_mhw_events_count']
spatial_max_intensity = spatial_results['spatial_max_intensity']
spatial_mean_intensity = spatial_results['spatial_mean_intensity']
df_regional_events = spatial_results['df_regional_events']
df_local_events = spatial_results['df_local_events']
daily_extent_ratio = spatial_results['daily_extent_ratio']

# Simpan NetCDF Klimatologi dan Metrik Spasial
ds_spatial_out = xr.Dataset(
    data_vars={
        'climatology': (['doy', 'lat', 'lon'], spatial_clim),
        'threshold': (['doy', 'lat', 'lon'], spatial_thresh),
        'total_mhw_days': (['lat', 'lon'], spatial_mhw_days),
        'mhw_event_count': (['lat', 'lon'], spatial_mhw_events_count),
        'max_intensity': (['lat', 'lon'], spatial_max_intensity),
        'mean_intensity': (['lat', 'lon'], spatial_mean_intensity)
    },
    coords={
        'doy': np.arange(1, 367),
        'lat': ds_sst.lat,
        'lon': ds_sst.lon
    },
    attrs={
        'title': 'Klimatologi, Ambang Batas, dan Metrik Spasial MHW NTT (Hobday et al., 2016)',
        'baseline_period': '2000-2020 (21 tahun)',
        'method': 'Grid-by-grid 0.25deg Hobday detection',
        'created_by': 'Notebook 2 - Analisis SST dan Deteksi MHW',
        'created_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
)

ds_spatial_out.to_netcdf(cfg.SST_CLIMATOLOGY_OUTPUT)
print(f"✅ Dataset spasial tersimpan: {cfg.SST_CLIMATOLOGY_OUTPUT}")

# Simpan Tabel Katalog Kejadian Regional NTT
spatial_catalog_path = cfg.TABLES_DIR / "mhw_events_spatial_catalog_ntt.csv"
df_regional_events.to_csv(spatial_catalog_path, index=False)
df_regional_events.to_csv(cfg.PROCESSED_DIR / "mhw_events_spatial_catalog_ntt.csv", index=False)
print(f"✅ Katalog MHW Regional Spasial tersimpan: {spatial_catalog_path}")

# Simpan Ringkasan Kejadian Lokal per Grid
local_summary_path = cfg.TABLES_DIR / "mhw_local_events_summary_ntt.csv"
df_local_summary = df_local_events.groupby(['lat', 'lon']).agg(
    total_events=('event_id', 'count'),
    total_days=('duration_days', 'sum'),
    max_intensity=('i_max', 'max'),
    mean_intensity=('i_mean', 'mean')
).reset_index()
df_local_summary.to_csv(local_summary_path, index=False)
print(f"✅ Ringkasan Kejadian Lokal per Grid tersimpan: {local_summary_path}")

# Tampilkan Top 10 Kejadian MHW Regional Berdasarkan Durasi dan Cakupan Spasial
print("\\n" + "=" * 80)
print("TOP 10 KEJADIAN MHW REGIONAL NTT BERDASARKAN DURASI (AMBANG SPASIAL >= 15%):")
print("=" * 80)
cols_disp = ['regional_event_id', 'start_date', 'end_date', 'peak_date', 'duration_days', 'peak_extent_pct', 'mean_extent_pct', 'i_max_regional', 'cum_intensity_regional']
print(df_regional_events.sort_values('duration_days', ascending=False)[cols_disp].head(10).to_string(index=False))

# Visualisasi 4-Panel Peta Spasial Metrik MHW NTT (Resolusi Publikasi 300 DPI)
fig, axes = plt.subplots(2, 2, figsize=(16, 11))

# Panel (a): Total Hari MHW Kumulatif
im1 = axes[0, 0].pcolormesh(ds_sst.lon, ds_sst.lat, spatial_mhw_days, cmap='YlOrRd', shading='auto')
axes[0, 0].set_title('(a) Total Hari MHW Kumulatif (2000–2020)', fontsize=12, fontweight='bold')
axes[0, 0].set_xlabel('Bujur (°BT)')
axes[0, 0].set_ylabel('Lintang (°LS)')
axes[0, 0].set_aspect('equal')
cb1 = plt.colorbar(im1, ax=axes[0, 0], label='Hari MHW Kumulatif')

# Panel (b): Frekuensi Kejadian MHW (Jumlah Kejadian)
im2 = axes[0, 1].pcolormesh(ds_sst.lon, ds_sst.lat, spatial_mhw_events_count, cmap='magma', shading='auto')
axes[0, 1].set_title('(b) Frekuensi Kejadian MHW (Jumlah Kejadian)', fontsize=12, fontweight='bold')
axes[0, 1].set_xlabel('Bujur (°BT)')
axes[0, 1].set_ylabel('Lintang (°LS)')
axes[0, 1].set_aspect('equal')
cb2 = plt.colorbar(im2, ax=axes[0, 1], label='Jumlah Kejadian')

# Panel (c): Intensitas Maksimum MHW
im3 = axes[1, 0].pcolormesh(ds_sst.lon, ds_sst.lat, spatial_max_intensity, cmap='hot_r', shading='auto')
axes[1, 0].set_title('(c) Intensitas Maksimum MHW ($i_{max}$)', fontsize=12, fontweight='bold')
axes[1, 0].set_xlabel('Bujur (°BT)')
axes[1, 0].set_ylabel('Lintang (°LS)')
axes[1, 0].set_aspect('equal')
cb3 = plt.colorbar(im3, ax=axes[1, 0], label='Intensitas Maksimum (°C)')

# Panel (d): Intensitas Rata-rata MHW
im4 = axes[1, 1].pcolormesh(ds_sst.lon, ds_sst.lat, spatial_mean_intensity, cmap='YlGnBu_r', shading='auto')
axes[1, 1].set_title('(d) Intensitas Rata-rata MHW ($i_{mean}$)', fontsize=12, fontweight='bold')
axes[1, 1].set_xlabel('Bujur (°BT)')
axes[1, 1].set_ylabel('Lintang (°LS)')
axes[1, 1].set_aspect('equal')
cb4 = plt.colorbar(im4, ax=axes[1, 1], label='Intensitas Rata-rata (°C)')

plt.suptitle('Sebaran Spasial Karakteristik Marine Heatwaves (MHW) di Perairan NTT (2000–2020)', fontsize=14, fontweight='bold', y=0.99)
plt.tight_layout()
fig.savefig(cfg.FIGURES_DIR / "nb2_mhw_spatial_maps.png", dpi=cfg.FIGURE_DPI, bbox_inches='tight')
plt.show()
"""
nb["cells"][20]["source"] = [line + "\n" for line in cell_20_text.split("\n")]
if nb["cells"][20]["source"]:
    nb["cells"][20]["source"][-1] = nb["cells"][20]["source"][-1].rstrip("\n")

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print("Notebook 02 updated successfully.")

