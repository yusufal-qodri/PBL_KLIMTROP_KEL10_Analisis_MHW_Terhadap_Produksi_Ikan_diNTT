import json
from pathlib import Path

nb_path = Path("notebooks/05_Visualisasi_dan_Sintesis_Hasil.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Cell 6: Peta SST di Figure 1 (Panel c)
cell_6_src = "".join(nb["cells"][6]["source"])
old_ax3_code = """im3 = ax3.pcolormesh(ds_sst.lon, ds_sst.lat, sst_annual_map, cmap=cfg.COLORMAP_SST, vmin=27.0, vmax=30.0, shading='auto')
ax3.set_xlabel('Bujur (°BT)')
ax3.set_ylabel('Lintang (°LS)')
ax3.set_title('(c) Sebaran Spasial SST Rata-rata Tahunan', fontweight='bold')
ax3.set_aspect('equal')
cb3 = plt.colorbar(im3, ax=ax3, fraction=0.046, pad=0.04)
cb3.set_label('SST (°C)')"""

new_ax3_code = """from scripts.visualization_utils import load_ntt_coastline, add_land_mask, setup_spatial_axis
gdf_land = load_ntt_coastline()

levels_sst_fig1 = np.linspace(27.0, 30.0, 35)
im3 = ax3.contourf(ds_sst.lon.values, ds_sst.lat.values, sst_annual_map.values,
                   levels=levels_sst_fig1, cmap=cfg.COLORMAP_SST, vmin=27.0, vmax=30.0, extend='both', zorder=2)
add_land_mask(ax3, gdf_land=gdf_land)
setup_spatial_axis(ax3, (ds_sst.lon.min(), ds_sst.lon.max()), (ds_sst.lat.min(), ds_sst.lat.max()),
                   title='(c) Sebaran Spasial SST Rata-rata Tahunan')
cb3 = plt.colorbar(im3, ax=ax3, fraction=0.046, pad=0.04)
cb3.set_label('SST (°C)', fontsize=9)"""

if old_ax3_code in cell_6_src:
    cell_6_src = cell_6_src.replace(old_ax3_code, new_ax3_code)
else:
    # Fallback replace line by line
    cell_6_src = cell_6_src.replace("im3 = ax3.pcolormesh(ds_sst.lon, ds_sst.lat, sst_annual_map, cmap=cfg.COLORMAP_SST, vmin=27.0, vmax=30.0, shading='auto')",
                                    "from scripts.visualization_utils import load_ntt_coastline, add_land_mask, setup_spatial_axis\ngdf_land = load_ntt_coastline()\nlevels_sst_fig1 = np.linspace(27.0, 30.0, 35)\nim3 = ax3.contourf(ds_sst.lon.values, ds_sst.lat.values, sst_annual_map.values, levels=levels_sst_fig1, cmap=cfg.COLORMAP_SST, vmin=27.0, vmax=30.0, extend='both', zorder=2)\nadd_land_mask(ax3, gdf_land=gdf_land)")

nb["cells"][6]["source"] = [line + "\n" for line in cell_6_src.split("\n")]
if nb["cells"][6]["source"]:
    nb["cells"][6]["source"][-1] = nb["cells"][6]["source"][-1].rstrip("\n")

# Cell 10: Fig 3 Sintesis Spasial Multiparameter (4 Panel Halus)
cell_10_code = """# Gambar 3: Sintesis Spasial Multiparameter (MHW dan Respons Klorofil-a)
from scripts.visualization_utils import plot_smooth_map, load_ntt_coastline

gdf_land = load_ntt_coastline()
fig, axes = plt.subplots(2, 2, figsize=(16, 11))

# Panel (a): Total Hari MHW Spasial Kumulatif (Kontinu)
cs1, cb1 = plot_smooth_map(
    axes[0, 0], ds_spatial_mhw.lon.values, ds_spatial_mhw.lat.values, ds_spatial_mhw['total_mhw_days'].values,
    var_type="continuous", cmap='YlOrRd', levels=30,
    title='(a) Total Hari Kondisi MHW Kumulatif (2000–2020)',
    cbar_label='Hari MHW Kumulatif', gdf_land=gdf_land
)

# Panel (b): Intensitas Maksimum MHW (Kontinu)
cs2, cb2 = plot_smooth_map(
    axes[0, 1], ds_spatial_mhw.lon.values, ds_spatial_mhw.lat.values, ds_spatial_mhw['max_intensity'].values,
    var_type="continuous", cmap='hot_r', levels=30,
    title='(b) Intensitas Maksimum MHW ($i_{max}$)',
    cbar_label='Intensitas Maksimum (°C)', gdf_land=gdf_land
)

# Panel (c): Rata-rata Spasial Chlorophyll-a (Skala Logaritmik)
chla_spatial_mean = ds_chla['chlor_a'].mean(dim='time', skipna=True).values
cs3, cb3 = plot_smooth_map(
    axes[1, 0], ds_chla.lon.values, ds_chla.lat.values, chla_spatial_mean,
    var_type="log", cmap=cfg.COLORMAP_CHLA, vmin=0.08, vmax=2.5, levels=35,
    title='(c) Rata-rata Konsentrasi Chlorophyll-a (2000–2020)',
    cbar_label='Chlorophyll-a (mg/m³, log)', gdf_land=gdf_land
)

# Panel (d): Anomali Chlorophyll-a Komposit Periode MHW
mhw_dates = pd.to_datetime(df_events['start_date'])
mhw_in_overlap = df_events[pd.to_datetime(df_events['end_date']) <= '2020-12-31']

mhw_all_times = []
for _, row in mhw_in_overlap.iterrows():
    mhw_all_times.extend(pd.date_range(row['start_date'], row['end_date']))

mhw_times_dt64 = np.array(list(set(mhw_all_times)), dtype='datetime64[ns]')
common_mhw_times = np.intersect1d(ds_combined.time.values, mhw_times_dt64)

if len(common_mhw_times) > 0:
    chla_during_mhw = ds_combined['chlor_a'].sel(time=common_mhw_times).mean(dim='time')
    chla_clim_all = ds_combined['chlor_a'].mean(dim='time')
    chla_anom_mhw = (chla_during_mhw - chla_clim_all).values
    
    cs4, cb4 = plot_smooth_map(
        axes[1, 1], ds_combined.lon.values, ds_combined.lat.values, chla_anom_mhw,
        var_type="continuous", cmap='BrBG', vmin=-0.15, vmax=0.15, levels=30,
        title='(d) Rata-rata Anomali Chlorophyll-a saat Periode MHW',
        cbar_label='Anomali Chl-a (mg/m³)', gdf_land=gdf_land
    )
else:
    axes[1, 1].text(0.5, 0.5, "Data overlap MHW-Chla tidak cukup", ha='center', va='center')

plt.suptitle('Gambar 3: Sintesis Spasial Karakteristik MHW dan Dinamika Chlorophyll-a di Perairan NTT',
             fontsize=14, fontweight='bold', y=0.99)
plt.tight_layout()
fig_path = cfg.FIGURES_DIR / "fig3_sintesis_spasial_multiparameter.png"
fig.savefig(fig_path, bbox_inches='tight')
print(f"✅ Gambar 3 disimpan: {fig_path}")
plt.show()
"""
nb["cells"][10]["source"] = [line + "\n" for line in cell_10_code.split("\n")]
if nb["cells"][10]["source"]:
    nb["cells"][10]["source"][-1] = nb["cells"][10]["source"][-1].rstrip("\n")

# Cell 15: Per-Event Spatial Maps (3 Top MHW)
cell_15_code = """# Pembuatan Peta Spasial Per Kejadian (Per-Event Maps) untuk 3 Kejadian Terbesar NTT
from scripts.detect_mhw import run_spatial_mhw_detection
from scripts.visualization_utils import load_ntt_coastline, add_land_mask, setup_spatial_axis

print("Menyiapkan data spasial untuk 3 kejadian MHW regional terbesar...")
gdf_land = load_ntt_coastline()

# Jalankan deteksi spasial
spatial_res = run_spatial_mhw_detection(ds_sst, regional_extent_threshold=0.15, verbose=False)
is_mhw_3d = spatial_res['is_mhw_3d']
intensity_3d = spatial_res['intensity_3d']
df_reg = spatial_res['df_regional_events']
ocean_mask = spatial_res['ocean_mask']
time_dt = pd.DatetimeIndex(ds_sst.time.values)

# Pilih 3 kejadian teratas berdasarkan durasi
top3_events = df_reg.sort_values('duration_days', ascending=False).head(3).copy()

fig, axes = plt.subplots(3, 3, figsize=(18, 14))
lon_vals = ds_sst.lon.values
lat_vals = ds_sst.lat.values

for row_idx, (_, ev) in enumerate(top3_events.iterrows()):
    s_idx = int(ev['start_idx'])
    e_idx = int(ev['end_idx'])
    ev_id = int(ev['regional_event_id'])
    s_date = str(ev['start_date'])
    e_date = str(ev['end_date'])
    dur = int(ev['duration_days'])
    pk_ext = float(ev['peak_extent_pct'])
    
    # Sub-volume kejadian
    sub_mhw = is_mhw_3d[s_idx:e_idx+1]
    sub_int = intensity_3d[s_idx:e_idx+1]
    
    # Peta A: Apakah sel pernah aktif MHW (Luas Sebaran)
    ever_active = np.any(sub_mhw, axis=0).astype(float)
    ever_active[~ocean_mask] = np.nan
    
    # Peta B: Intensitas Maksimum per grid
    max_int_ev = np.max(sub_int, axis=0)
    max_int_ev[~ocean_mask] = np.nan
    
    # Peta C: Durasi lokal per grid
    dur_local_ev = np.sum(sub_mhw, axis=0).astype(float)
    dur_local_ev[~ocean_mask] = np.nan
    
    # Plot Kolom 1: Luas Sebaran (Biner)
    im_a = axes[row_idx, 0].pcolormesh(lon_vals, lat_vals, ever_active,
                                      cmap='Oranges', vmin=0, vmax=1, shading='auto', zorder=2)
    add_land_mask(axes[row_idx, 0], gdf_land=gdf_land)
    setup_spatial_axis(axes[row_idx, 0], (lon_vals.min(), lon_vals.max()), (lat_vals.min(), lat_vals.max()),
                       title=f"Kejadian #{ev_id} ({s_date} s.d. {e_date})\\n(a) Luas Sebaran (Cakupan Puncak: {pk_ext:.1f}%)")
    cb_a = plt.colorbar(im_a, ax=axes[row_idx, 0], ticks=[0, 1], shrink=0.8, pad=0.03)
    cb_a.ax.set_yticklabels(['Tidak Aktif', 'Aktif MHW'])
    cb_a.ax.tick_params(labelsize=8)
    
    # Plot Kolom 2: Intensitas Maksimum (Kontinu Halus)
    levels_b = np.linspace(0.5, 3.0, 30)
    im_b = axes[row_idx, 1].contourf(lon_vals, lat_vals, max_int_ev,
                                    levels=levels_b, cmap='hot_r', extend='both', zorder=2)
    add_land_mask(axes[row_idx, 1], gdf_land=gdf_land)
    setup_spatial_axis(axes[row_idx, 1], (lon_vals.min(), lon_vals.max()), (lat_vals.min(), lat_vals.max()),
                       title=f"Kejadian #{ev_id}: {dur} Hari\\n(b) Intensitas Puncak ($i_{{max}}$)")
    cb_b = plt.colorbar(im_b, ax=axes[row_idx, 1], shrink=0.8, pad=0.03)
    cb_b.set_label('Intensitas Maks (°C)', fontsize=8.5)
    cb_b.ax.tick_params(labelsize=8)
    
    # Plot Kolom 3: Durasi Lokal (Kontinu Halus)
    levels_c = np.linspace(0, dur, 30)
    im_c = axes[row_idx, 2].contourf(lon_vals, lat_vals, dur_local_ev,
                                    levels=levels_c, cmap='YlOrRd', extend='max', zorder=2)
    add_land_mask(axes[row_idx, 2], gdf_land=gdf_land)
    setup_spatial_axis(axes[row_idx, 2], (lon_vals.min(), lon_vals.max()), (lat_vals.min(), lat_vals.max()),
                       title=f"Kejadian #{ev_id}: {s_date}\\n(c) Durasi Lokal per Grid")
    cb_c = plt.colorbar(im_c, ax=axes[row_idx, 2], shrink=0.8, pad=0.03)
    cb_c.set_label('Durasi Lokal (Hari)', fontsize=8.5)
    cb_c.ax.tick_params(labelsize=8)

plt.suptitle('Peta Spasial Per Kejadian (Per-Event Maps) untuk 3 Kejadian MHW Regional Terbesar NTT', fontsize=14, fontweight='bold', y=0.995)
plt.tight_layout()
out_per_event_fig = cfg.FIGURES_DIR / "nb5_per_event_spatial_maps.png"
fig.savefig(out_per_event_fig, dpi=cfg.FIGURE_DPI, bbox_inches='tight')
print(f"✅ Peta spasial per-kejadian disimpan: {out_per_event_fig}")
plt.show()
"""
nb["cells"][15]["source"] = [line + "\n" for line in cell_15_code.split("\n")]
if nb["cells"][15]["source"]:
    nb["cells"][15]["source"][-1] = nb["cells"][15]["source"][-1].rstrip("\n")

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print("Notebook 05 visual updates applied successfully.")

