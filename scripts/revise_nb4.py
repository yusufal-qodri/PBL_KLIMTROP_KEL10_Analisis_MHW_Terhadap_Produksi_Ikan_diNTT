import json
from pathlib import Path

nb_path = Path("notebooks/04_Analisis_Gabungan_MHW_dan_Chlorophyll_a.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Update Cell 0: Framework Metodologis Gabungan MHW & Chl-a
cell_0_text = """# Notebook 4 — Analisis Gabungan Marine Heatwave (MHW) dan Respons Biogeokimia Chlorophyll-a

**Proyek:** Analisis Spatiotemporal Marine Heatwaves (MHW), Klorofil-a, dan Konteks Perikanan Tangkap Provinsi Nusa Tenggara Timur  
**Dokumen Rujukan Metodologis:** `REVISI_PBL.md`

---

## 1. Landasan Metodologis Analisis Gabungan

1. **Penyelarasan Spasial Konservatif (Conservative Regridding):**
   - Data klorofil-a asli beresolusi ~4 km diagregasikan secara spasial ke grid 0.25° OISST melalui teknik *block-averaging* tanpa pengisian nol palsu (`NaN` dipertahankan).
2. **Standardisasi Perbandingan MHW vs Non-MHW:**
   - Kondisi non-MHW didefinisikan secara ketat sebagai hari-hari yang terbebas dari kondisi MHW (*MHW-free days*) pada sel grid yang bersangkutan.
   - Perbandingan distribusi klorofil-a diuji secara statistik menggunakan uji non-parametrik Mann-Whitney U untuk memvalidasi apakah penurunan klorofil selama MHW signifikan secara statistik ($p < 0.05$).
3. **Analisis Fase Kejadian Terstandarisasi (Event Phase Analysis):**
   - Untuk kejadian MHW regional signifikan (studi kasus peristiwa 2016 yang merupakan MHW terpanjang dalam rekor pengamatan), analisis dibagi ke dalam 3 jendela waktu terstandarisasi:
     - **Fase Pra-MHW:** 14 hari sebelum kejadian dimulai ($T_{\text{start}} - 14$ s.d. $T_{\text{start}} - 1$).
     - **Fase Puncak MHW:** Jendela di sekitar hari intensitas maksimum ($T_{\text{peak}} \pm 7$ hari).
     - **Fase Pasca-MHW:** 14 hari setelah kejadian berakhir ($T_{\text{end}} + 1$ s.d. $T_{\text{end}} + 14$).
   - Dilengkapi pelaporan persentase tutupan piksel observasi valid (*valid pixel coverage ratio*) untuk mengontrol bias tutupan awan.
"""
nb["cells"][0]["source"] = [line + "\n" for line in cell_0_text.split("\n")]
if nb["cells"][0]["source"]:
    nb["cells"][0]["source"][-1] = nb["cells"][0]["source"][-1].rstrip("\n")

# Update Cell 4: Load Katalog Kejadian Spasial Regional NTT
cell_4_text = """# Buka dataset input dan katalog MHW
print("Memuat dataset SST, Chlorophyll-a, dan Katalog MHW...")

ds_sst = xr.open_dataset(cfg.SST_MERGED_OUTPUT)
ds_chla = xr.open_dataset(cfg.CHLA_MERGED_OUTPUT)

# Buka katalog MHW regional spasial jika tersedia, atau mhw_events_ntt.csv
spatial_catalog_file = cfg.PROCESSED_DIR / "mhw_events_spatial_catalog_ntt.csv"
if not spatial_catalog_file.exists():
    spatial_catalog_file = cfg.TABLES_DIR / "mhw_events_spatial_catalog_ntt.csv"

if spatial_catalog_file.exists():
    df_regional_events = pd.read_csv(spatial_catalog_file)
    print(f"✅ Katalog MHW Regional Spasial dimuat: {len(df_regional_events)} kejadian.")
else:
    df_regional_events = None

df_events = pd.read_csv(cfg.MHW_EVENTS_OUTPUT)
print(f"✅ Katalog MHW 1D dimuat: {len(df_events)} kejadian.")

print(f"  SST  : {len(ds_sst.time)} hari, {len(ds_sst.lat)}×{len(ds_sst.lon)} grid")
print(f"  Chl-a: {len(ds_chla.time)} hari, {len(ds_chla.lat)}×{len(ds_chla.lon)} grid")
"""
nb["cells"][4]["source"] = [line + "\n" for line in cell_4_text.split("\n")]
if nb["cells"][4]["source"]:
    nb["cells"][4]["source"][-1] = nb["cells"][4]["source"][-1].rstrip("\n")

# Update Cell 10: Uji Statistik Mann-Whitney U dan Evaluasi Non-MHW
cell_10_text = """# Perbandingan Global MHW vs Non-MHW dengan Uji Statistik Signifikansi
from scipy.stats import mannwhitneyu

mhw_chla = df_analysis[df_analysis['is_mhw']]['chlor_a'].dropna()
nonmhw_chla = df_analysis[~df_analysis['is_mhw']]['chlor_a'].dropna()

mhw_anom = df_analysis[df_analysis['is_mhw']]['chla_anom'].dropna()
nonmhw_anom = df_analysis[~df_analysis['is_mhw']]['chla_anom'].dropna()

# Uji Mann-Whitney U untuk konsentrasi absolut
stat_abs, p_val_abs = mannwhitneyu(mhw_chla, nonmhw_chla, alternative='two-sided')

# Uji Mann-Whitney U untuk nilai anomali
stat_anom, p_val_anom = mannwhitneyu(mhw_anom, nonmhw_anom, alternative='two-sided')

print("=" * 70)
print("HASIL PERBANDINGAN STATISTIK CHLOROPHYLL-A: KONDISI MHW vs NON-MHW")
print("=" * 70)
print(f"Jumlah sampel hari valid MHW     : {len(mhw_chla):,} hari")
print(f"Jumlah sampel hari valid Non-MHW : {len(nonmhw_chla):,} hari")
print("-" * 70)
print(f"Konsentrasi Chlorophyll-a Absolut (mg/m³):")
print(f"  Non-MHW : Mean = {nonmhw_chla.mean():.4f}, Median = {nonmhw_chla.median():.4f}, Std = {nonmhw_chla.std():.4f}")
print(f"  MHW     : Mean = {mhw_chla.mean():.4f}, Median = {mhw_chla.median():.4f}, Std = {mhw_chla.std():.4f}")
print(f"  Perbedaan Median (MHW - Non-MHW) : {mhw_chla.median() - nonmhw_chla.median():.4f} mg/m³")
print(f"  Uji Mann-Whitney U               : U = {stat_abs:.1f}, p-value = {p_val_abs:.4e}")
if p_val_abs < 0.05:
    print("  -> Perbedaan konsentrasi Chl-a antara MHW dan Non-MHW SIGNIFIKAN secara statistik (p < 0.05).")
else:
    print("  -> Perbedaan konsentrasi Chl-a TIDAK signifikan secara statistik (p >= 0.05).")

print("-" * 70)
print(f"Anomali Chlorophyll-a Terhadap Klimatologi (mg/m³):")
print(f"  Non-MHW : Mean = {nonmhw_anom.mean():.4f}, Median = {nonmhw_anom.median():.4f}")
print(f"  MHW     : Mean = {mhw_anom.mean():.4f}, Median = {mhw_anom.median():.4f}")
print(f"  Uji Mann-Whitney U Anomali       : U = {stat_anom:.1f}, p-value = {p_val_anom:.4e}")
"""
nb["cells"][10]["source"] = [line + "\n" for line in cell_10_text.split("\n")]
if nb["cells"][10]["source"]:
    nb["cells"][10]["source"][-1] = nb["cells"][10]["source"][-1].rstrip("\n")

# Update Cell 14: Analisis Fase Kejadian (Pra, Puncak, Pasca) untuk MHW Mayor
cell_14_text = """# Studi Kasus MHW Regional Mayor: Evaluasi Fase Pra-MHW, Puncak MHW, dan Pasca-MHW
# Menggunakan kejadian terpanjang tahun 2016 dari katalog spasial atau 1D

if df_regional_events is not None and len(df_regional_events) > 0:
    target_event = df_regional_events.sort_values('duration_days', ascending=False).iloc[0]
    ev_name = f"Regional Event #{target_event['regional_event_id']}"
    case_start = str(target_event['start_date'])
    case_end = str(target_event['end_date'])
    case_peak = str(target_event['peak_date'])
    case_dur = int(target_event['duration_days'])
    case_imax = float(target_event['i_max_regional'])
else:
    target_event = df_events[pd.to_datetime(df_events['end_date']) <= '2020-12-31'].sort_values('duration_days', ascending=False).iloc[0]
    ev_name = f"Event #{target_event['event_id']}"
    case_start = str(target_event['start_date'])
    case_end = str(target_event['end_date'])
    case_peak = str(target_event['peak_date'])
    case_dur = int(target_event['duration_days'])
    case_imax = float(target_event['i_max'])

print("=" * 75)
print(f"STUDI KASUS MHW UTAMA: {ev_name} ({case_start} s.d. {case_end}, {case_dur} hari)")
print("=" * 75)

# Tentukan jendela waktu: Pra-MHW (14 hari sebelum), Puncak MHW (peak ± 7 hari), Pasca-MHW (14 hari setelah)
dt_start = pd.to_datetime(case_start)
dt_end = pd.to_datetime(case_end)
dt_peak = pd.to_datetime(case_peak)

pre_window = (str((dt_start - pd.Timedelta(days=14)).date()), str((dt_start - pd.Timedelta(days=1)).date()))
peak_window = (str((dt_peak - pd.Timedelta(days=7)).date()), str((dt_peak + pd.Timedelta(days=7)).date()))
post_window = (str((dt_end + pd.Timedelta(days=1)).date()), str((dt_end + pd.Timedelta(days=14)).date()))

print(f"  Fase Pra-MHW    : {pre_window[0]} s.d. {pre_window[1]} (14 hari)")
print(f"  Fase Puncak MHW : {peak_window[0]} s.d. {peak_window[1]} (15 hari)")
print(f"  Fase Pasca-MHW  : {post_window[0]} s.d. {post_window[1]} (14 hari)")

# Ekstraksi komposit rata-rata per fase
sst_pre = ds_combined['sst'].sel(time=slice(pre_window[0], pre_window[1])).mean(dim='time')
sst_peak = ds_combined['sst'].sel(time=slice(peak_window[0], peak_window[1])).mean(dim='time')
sst_post = ds_combined['sst'].sel(time=slice(post_window[0], post_window[1])).mean(dim='time')

chla_pre = ds_combined['chlor_a'].sel(time=slice(pre_window[0], pre_window[1])).mean(dim='time')
chla_peak = ds_combined['chlor_a'].sel(time=slice(peak_window[0], peak_window[1])).mean(dim='time')
chla_post = ds_combined['chlor_a'].sel(time=slice(post_window[0], post_window[1])).mean(dim='time')

# Baseline musiman (klimatologi bulan yang sama)
case_months = pd.date_range(pre_window[0], post_window[1]).month.unique()
chla_base = ds_combined['chlor_a'].sel(time=ds_combined.time.dt.month.isin(case_months)).mean(dim='time')
sst_base = ds_combined['sst'].sel(time=ds_combined.time.dt.month.isin(case_months)).mean(dim='time')

anom_chla_pre = chla_pre - chla_base
anom_chla_peak = chla_peak - chla_base
anom_chla_post = chla_post - chla_base

# Visualisasi Multi-Fase Spasial (3 Kolom: Pra, Puncak, Pasca)
fig, axes = plt.subplots(2, 3, figsize=(18, 9))

# Baris 1: SST Anomali
im_sst0 = axes[0, 0].pcolormesh(ds_combined.lon, ds_combined.lat, sst_pre - sst_base, cmap='RdBu_r', vmin=-1.5, vmax=1.5, shading='auto')
axes[0, 0].set_title(f"(a) Anomali SST: Pra-MHW\\n({pre_window[0]} s.d. {pre_window[1]})", fontsize=11, fontweight='bold')
axes[0, 0].set_aspect('equal')
plt.colorbar(im_sst0, ax=axes[0, 0], label='Anomali SST (°C)')

im_sst1 = axes[0, 1].pcolormesh(ds_combined.lon, ds_combined.lat, sst_peak - sst_base, cmap='RdBu_r', vmin=-1.5, vmax=1.5, shading='auto')
axes[0, 1].set_title(f"(b) Anomali SST: Puncak MHW\\n({peak_window[0]} s.d. {peak_window[1]})", fontsize=11, fontweight='bold')
axes[0, 1].set_aspect('equal')
plt.colorbar(im_sst1, ax=axes[0, 1], label='Anomali SST (°C)')

im_sst2 = axes[0, 2].pcolormesh(ds_combined.lon, ds_combined.lat, sst_post - sst_base, cmap='RdBu_r', vmin=-1.5, vmax=1.5, shading='auto')
axes[0, 2].set_title(f"(c) Anomali SST: Pasca-MHW\\n({post_window[0]} s.d. {post_window[1]})", fontsize=11, fontweight='bold')
axes[0, 2].set_aspect('equal')
plt.colorbar(im_sst2, ax=axes[0, 2], label='Anomali SST (°C)')

# Baris 2: Chl-a Anomali
im_chl0 = axes[1, 0].pcolormesh(ds_combined.lon, ds_combined.lat, anom_chla_pre, cmap='BrBG', vmin=-0.25, vmax=0.25, shading='auto')
axes[1, 0].set_title(f"(d) Anomali Chl-a: Pra-MHW (mg/m³)", fontsize=11, fontweight='bold')
axes[1, 0].set_aspect('equal')
plt.colorbar(im_chl0, ax=axes[1, 0], label='Anomali Chl-a (mg/m³)')

im_chl1 = axes[1, 1].pcolormesh(ds_combined.lon, ds_combined.lat, anom_chla_peak, cmap='BrBG', vmin=-0.25, vmax=0.25, shading='auto')
axes[1, 1].set_title(f"(e) Anomali Chl-a: Puncak MHW (mg/m³)", fontsize=11, fontweight='bold')
axes[1, 1].set_aspect('equal')
plt.colorbar(im_chl1, ax=axes[1, 1], label='Anomali Chl-a (mg/m³)')

im_chl2 = axes[1, 2].pcolormesh(ds_combined.lon, ds_combined.lat, anom_chla_post, cmap='BrBG', vmin=-0.25, vmax=0.25, shading='auto')
axes[1, 2].set_title(f"(f) Anomali Chl-a: Pasca-MHW (mg/m³)", fontsize=11, fontweight='bold')
axes[1, 2].set_aspect('equal')
plt.colorbar(im_chl2, ax=axes[1, 2], label='Anomali Chl-a (mg/m³)')

for ax in axes.flat:
    ax.set_xlabel('Bujur (°BT)', fontsize=9)
    ax.set_ylabel('Lintang (°LS)', fontsize=9)

plt.suptitle(f'Dinamika Evolusi Spasial Anomali SST dan Chlorophyll-a Lintas Fase MHW ({ev_name})',
             fontsize=13, fontweight='bold', y=0.99)
plt.tight_layout()
fig.savefig(cfg.FIGURES_DIR / "nb4_mhw_case_study_spatial.png", dpi=cfg.FIGURE_DPI, bbox_inches='tight')
plt.show()
"""
nb["cells"][14]["source"] = [line + "\n" for line in cell_14_text.split("\n")]
if nb["cells"][14]["source"]:
    nb["cells"][14]["source"][-1] = nb["cells"][14]["source"][-1].rstrip("\n")

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print("Notebook 04 updated successfully.")

