import json
from pathlib import Path

nb_path = Path("notebooks/02_Analisis_SST_dan_Deteksi_MHW.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Cell 8: Pola spasial musiman SST dengan rendering halus dan overlay daratan
cell_8_code = """# Hitung dan visualisasikan rata-rata spasial musiman SST dengan rendering halus
from scripts.visualization_utils import plot_smooth_map, load_ntt_coastline, add_land_mask, setup_spatial_axis

gdf_land = load_ntt_coastline()

seasons = {
    'Tahunan (2000–2020)': ds_sst['sst'].mean(dim='time'),
    'DJF (Monsun Barat)': ds_sst['sst'].sel(time=ds_sst.time.dt.month.isin([12, 1, 2])).mean(dim='time'),
    'MAM (Peralihan I)': ds_sst['sst'].sel(time=ds_sst.time.dt.month.isin([3, 4, 5])).mean(dim='time'),
    'JJA (Monsun Timur / Upwelling)': ds_sst['sst'].sel(time=ds_sst.time.dt.month.isin([6, 7, 8])).mean(dim='time'),
    'SON (Peralihan II)': ds_sst['sst'].sel(time=ds_sst.time.dt.month.isin([9, 10, 11])).mean(dim='time')
}

fig, axes = plt.subplots(2, 3, figsize=(17, 9.5))
axes_flat = axes.flatten()

vmin_sst = 26.5
vmax_sst = 30.5
levels_sst = np.linspace(vmin_sst, vmax_sst, 35)

last_cs = None
for i, (title, sst_map) in enumerate(seasons.items()):
    ax = axes_flat[i]
    last_cs = ax.contourf(
        ds_sst.lon.values, ds_sst.lat.values, sst_map.values,
        levels=levels_sst, cmap=cfg.COLORMAP_SST, vmin=vmin_sst, vmax=vmax_sst,
        extend='both', zorder=2
    )
    add_land_mask(ax, gdf_land=gdf_land, facecolor='#e4e4e4', edgecolor='#3a3a3a', linewidth=0.6, zorder=5)
    setup_spatial_axis(ax, (ds_sst.lon.min(), ds_sst.lon.max()), (ds_sst.lat.min(), ds_sst.lat.max()), title=title)

# Panel ke-6 digunakan untuk colorbar yang proporsional dan ringkasan nilai
ax_cbar = axes_flat[5]
ax_cbar.axis('off')
cbar_box = [0.68, 0.22, 0.24, 0.035]
cbar_ax = fig.add_axes(cbar_box)
cb = fig.colorbar(last_cs, cax=cbar_ax, orientation='horizontal')
cb.set_label('Suhu Permukaan Laut / SST (°C)', fontsize=10, fontweight='bold')
cb.ax.tick_params(labelsize=8.5)

# Teks keterangan oseanografi di panel kosong
ax_cbar.text(
    0.5, 0.70,
    "Catatan Dinamika Oseanografi:\n"
    "• Pendinginan upwelling kuat terlihat pada JJA di Laut Sawu & Selat Sumba.\n"
    "• Pemanasan maksimum terjadi pada musim peralihan (MAM & SON).\n"
    "• Garis pulau NTT di-overlay dari data vektor presisi.",
    transform=ax_cbar.transAxes, fontsize=9.5, va='top', ha='center',
    bbox=dict(boxstyle='round,pad=0.5', facecolor='#f8f9fa', edgecolor='#cccccc', alpha=0.9)
)

plt.suptitle('Variabilitas Spasial Siklus Musiman SST di Perairan NTT (2000–2020)', fontsize=14, fontweight='bold', y=0.99)
plt.tight_layout(rect=[0, 0, 1.0, 0.96])
fig.savefig(cfg.FIGURES_DIR / "nb2_sst_spatial_patterns.png", dpi=cfg.FIGURE_DPI, bbox_inches='tight')
plt.show()
"""
nb["cells"][8]["source"] = [line + "\n" for line in cell_8_code.split("\n")]
if nb["cells"][8]["source"]:
    nb["cells"][8]["source"][-1] = nb["cells"][8]["source"][-1].rstrip("\n")

# Cell 20: Visualisasi 4-Panel Metrik MHW dengan contourf dan diskret norm
cell_20_part = """# Visualisasi 4-Panel Peta Spasial Metrik MHW NTT (Resolusi Publikasi 300 DPI)
from scripts.visualization_utils import plot_smooth_map, load_ntt_coastline

gdf_land = load_ntt_coastline()
fig, axes = plt.subplots(2, 2, figsize=(16, 11))

# Panel (a): Total Hari MHW Kumulatif (Kontinu)
cs1, cb1 = plot_smooth_map(
    axes[0, 0], ds_sst.lon.values, ds_sst.lat.values, spatial_mhw_days,
    var_type="continuous", cmap='YlOrRd', levels=30,
    title='(a) Total Hari MHW Kumulatif (2000–2020)',
    cbar_label='Hari MHW Kumulatif', gdf_land=gdf_land
)

# Panel (b): Frekuensi Kejadian MHW (Diskret - mempertahankan integritas integer)
cs2, cb2 = plot_smooth_map(
    axes[0, 1], ds_sst.lon.values, ds_sst.lat.values, spatial_mhw_events_count,
    var_type="discrete", cmap='magma', vmin=0, vmax=float(np.nanmax(spatial_mhw_events_count)),
    title='(b) Frekuensi Kejadian MHW (Jumlah Kejadian)',
    cbar_label='Jumlah Kejadian', gdf_land=gdf_land
)

# Panel (c): Intensitas Maksimum MHW (Kontinu)
cs3, cb3 = plot_smooth_map(
    axes[1, 0], ds_sst.lon.values, ds_sst.lat.values, spatial_max_intensity,
    var_type="continuous", cmap='hot_r', levels=30,
    title='(c) Intensitas Maksimum MHW ($i_{max}$)',
    cbar_label='Intensitas Maksimum (°C)', gdf_land=gdf_land
)

# Panel (d): Intensitas Rata-rata MHW (Kontinu)
cs4, cb4 = plot_smooth_map(
    axes[1, 1], ds_sst.lon.values, ds_sst.lat.values, spatial_mean_intensity,
    var_type="continuous", cmap='YlGnBu_r', levels=30,
    title='(d) Intensitas Rata-rata MHW ($i_{mean}$)',
    cbar_label='Intensitas Rata-rata (°C)', gdf_land=gdf_land
)

plt.suptitle('Sebaran Spasial Karakteristik Marine Heatwaves (MHW) di Perairan NTT (2000–2020)', fontsize=14, fontweight='bold', y=0.99)
plt.tight_layout()
fig.savefig(cfg.FIGURES_DIR / "nb2_mhw_spatial_maps.png", dpi=cfg.FIGURE_DPI, bbox_inches='tight')
plt.show()
"""

# Replace the plot part in Cell 20
cell_20_src = "".join(nb["cells"][20]["source"])
split_marker = "# Visualisasi 4-Panel Peta Spasial Metrik MHW"
if split_marker in cell_20_src:
    base_src = cell_20_src.split(split_marker)[0]
    new_cell_20 = base_src + cell_20_part
else:
    new_cell_20 = cell_20_src

nb["cells"][20]["source"] = [line + "\n" for line in new_cell_20.split("\n")]
if nb["cells"][20]["source"]:
    nb["cells"][20]["source"][-1] = nb["cells"][20]["source"][-1].rstrip("\n")

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print("Notebook 02 visual updates applied successfully.")

