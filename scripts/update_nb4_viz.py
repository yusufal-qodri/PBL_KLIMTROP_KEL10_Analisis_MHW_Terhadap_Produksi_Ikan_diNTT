import json
from pathlib import Path

nb_path = Path("notebooks/04_Analisis_Gabungan_MHW_dan_Chlorophyll_a.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

cell_14_code = """# Studi Kasus MHW Regional Mayor: Evaluasi Fase Pra-MHW, Puncak MHW, dan Pasca-MHW
# Menggunakan kejadian terpanjang tahun 2016 dari katalog spasial atau 1D
from scripts.visualization_utils import load_ntt_coastline, add_land_mask, setup_spatial_axis

gdf_land = load_ntt_coastline()

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
sst_pre = ds_combined['sst'].sel(time=slice(pre_window[0], pre_window[1])).mean(dim='time').values
sst_peak = ds_combined['sst'].sel(time=slice(peak_window[0], peak_window[1])).mean(dim='time').values
sst_post = ds_combined['sst'].sel(time=slice(post_window[0], post_window[1])).mean(dim='time').values

chla_pre = ds_combined['chlor_a'].sel(time=slice(pre_window[0], pre_window[1])).mean(dim='time').values
chla_peak = ds_combined['chlor_a'].sel(time=slice(peak_window[0], peak_window[1])).mean(dim='time').values
chla_post = ds_combined['chlor_a'].sel(time=slice(post_window[0], post_window[1])).mean(dim='time').values

# Baseline musiman (klimatologi bulan yang sama)
case_months = pd.date_range(pre_window[0], post_window[1]).month.unique()
chla_base = ds_combined['chlor_a'].sel(time=ds_combined.time.dt.month.isin(case_months)).mean(dim='time').values
sst_base = ds_combined['sst'].sel(time=ds_combined.time.dt.month.isin(case_months)).mean(dim='time').values

anom_sst_pre = sst_pre - sst_base
anom_sst_peak = sst_peak - sst_base
anom_sst_post = sst_post - sst_base

anom_chla_pre = chla_pre - chla_base
anom_chla_peak = chla_peak - chla_base
anom_chla_post = chla_post - chla_base

# Visualisasi Multi-Fase Spasial dengan contourf halus dan overlay pulau NTT
fig, axes = plt.subplots(2, 3, figsize=(18, 9))
lon_vals = ds_combined.lon.values
lat_vals = ds_combined.lat.values

levels_sst = np.linspace(-1.5, 1.5, 35)
levels_chl = np.linspace(-0.25, 0.25, 35)

# Baris 1: SST Anomali (Pra, Puncak, Pasca)
im_sst0 = axes[0, 0].contourf(lon_vals, lat_vals, anom_sst_pre, levels=levels_sst, cmap='RdBu_r', extend='both', zorder=2)
add_land_mask(axes[0, 0], gdf_land=gdf_land)
setup_spatial_axis(axes[0, 0], (lon_vals.min(), lon_vals.max()), (lat_vals.min(), lat_vals.max()),
                   title=f"(a) Anomali SST: Pra-MHW\\n({pre_window[0]} s.d. {pre_window[1]})")
plt.colorbar(im_sst0, ax=axes[0, 0], shrink=0.8, pad=0.03, label='Anomali SST (°C)')

im_sst1 = axes[0, 1].contourf(lon_vals, lat_vals, anom_sst_peak, levels=levels_sst, cmap='RdBu_r', extend='both', zorder=2)
add_land_mask(axes[0, 1], gdf_land=gdf_land)
setup_spatial_axis(axes[0, 1], (lon_vals.min(), lon_vals.max()), (lat_vals.min(), lat_vals.max()),
                   title=f"(b) Anomali SST: Puncak MHW\\n({peak_window[0]} s.d. {peak_window[1]})")
plt.colorbar(im_sst1, ax=axes[0, 1], shrink=0.8, pad=0.03, label='Anomali SST (°C)')

im_sst2 = axes[0, 2].contourf(lon_vals, lat_vals, anom_sst_post, levels=levels_sst, cmap='RdBu_r', extend='both', zorder=2)
add_land_mask(axes[0, 2], gdf_land=gdf_land)
setup_spatial_axis(axes[0, 2], (lon_vals.min(), lon_vals.max()), (lat_vals.min(), lat_vals.max()),
                   title=f"(c) Anomali SST: Pasca-MHW\\n({post_window[0]} s.d. {post_window[1]})")
plt.colorbar(im_sst2, ax=axes[0, 2], shrink=0.8, pad=0.03, label='Anomali SST (°C)')

# Baris 2: Chl-a Anomali (Pra, Puncak, Pasca)
im_chl0 = axes[1, 0].contourf(lon_vals, lat_vals, anom_chla_pre, levels=levels_chl, cmap='BrBG', extend='both', zorder=2)
add_land_mask(axes[1, 0], gdf_land=gdf_land)
setup_spatial_axis(axes[1, 0], (lon_vals.min(), lon_vals.max()), (lat_vals.min(), lat_vals.max()),
                   title=f"(d) Anomali Chl-a: Pra-MHW (mg/m³)")
plt.colorbar(im_chl0, ax=axes[1, 0], shrink=0.8, pad=0.03, label='Anomali Chl-a (mg/m³)')

im_chl1 = axes[1, 1].contourf(lon_vals, lat_vals, anom_chla_peak, levels=levels_chl, cmap='BrBG', extend='both', zorder=2)
add_land_mask(axes[1, 1], gdf_land=gdf_land)
setup_spatial_axis(axes[1, 1], (lon_vals.min(), lon_vals.max()), (lat_vals.min(), lat_vals.max()),
                   title=f"(e) Anomali Chl-a: Puncak MHW (mg/m³)")
plt.colorbar(im_chl1, ax=axes[1, 1], shrink=0.8, pad=0.03, label='Anomali Chl-a (mg/m³)')

im_chl2 = axes[1, 2].contourf(lon_vals, lat_vals, anom_chla_post, levels=levels_chl, cmap='BrBG', extend='both', zorder=2)
add_land_mask(axes[1, 2], gdf_land=gdf_land)
setup_spatial_axis(axes[1, 2], (lon_vals.min(), lon_vals.max()), (lat_vals.min(), lat_vals.max()),
                   title=f"(f) Anomali Chl-a: Pasca-MHW (mg/m³)")
plt.colorbar(im_chl2, ax=axes[1, 2], shrink=0.8, pad=0.03, label='Anomali Chl-a (mg/m³)')

plt.suptitle(f'Dinamika Evolusi Spasial Anomali SST dan Chlorophyll-a Lintas Fase MHW ({ev_name})',
             fontsize=14, fontweight='bold', y=0.99)
plt.tight_layout()
fig.savefig(cfg.FIGURES_DIR / "nb4_mhw_case_study_spatial.png", dpi=cfg.FIGURE_DPI, bbox_inches='tight')
plt.show()
"""

nb["cells"][14]["source"] = [line + "\n" for line in cell_14_code.split("\n")]
if nb["cells"][14]["source"]:
    nb["cells"][14]["source"][-1] = nb["cells"][14]["source"][-1].rstrip("\n")

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print("Notebook 04 visual updates applied successfully.")

