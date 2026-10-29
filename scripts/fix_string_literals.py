import json
from pathlib import Path

# 1. Fix Notebook 02 Cell 8
nb2_path = Path("notebooks/02_Analisis_SST_dan_Deteksi_MHW.ipynb")
with open(nb2_path, "r", encoding="utf-8") as f:
    nb2 = json.load(f)

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

note_text = (
    "Catatan Dinamika Oseanografi:\\n"
    "• Pendinginan upwelling kuat terlihat pada JJA di Laut Sawu & Selat Sumba.\\n"
    "• Pemanasan maksimum terjadi pada musim peralihan (MAM & SON).\\n"
    "• Garis pulau NTT di-overlay dari data vektor presisi."
)
ax_cbar.text(
    0.5, 0.70, note_text,
    transform=ax_cbar.transAxes, fontsize=9.5, va='top', ha='center',
    bbox=dict(boxstyle='round,pad=0.5', facecolor='#f8f9fa', edgecolor='#cccccc', alpha=0.9)
)

plt.suptitle('Variabilitas Spasial Siklus Musiman SST di Perairan NTT (2000–2020)', fontsize=14, fontweight='bold', y=0.99)
plt.tight_layout(rect=[0, 0, 1.0, 0.96])
fig.savefig(cfg.FIGURES_DIR / "nb2_sst_spatial_patterns.png", dpi=cfg.FIGURE_DPI, bbox_inches='tight')
plt.show()
"""

nb2["cells"][8]["source"] = [line + "\n" for line in cell_8_code.split("\n")]
if nb2["cells"][8]["source"]:
    nb2["cells"][8]["source"][-1] = nb2["cells"][8]["source"][-1].rstrip("\n")

with open(nb2_path, "w", encoding="utf-8") as f:
    json.dump(nb2, f, indent=1, ensure_ascii=False)
print("Notebook 02 Cell 8 string literal fixed.")

# 2. Fix Notebook 03 Cell 12
nb3_path = Path("notebooks/03_Analisis_Chlorophyll_a.ipynb")
with open(nb3_path, "r", encoding="utf-8") as f:
    nb3 = json.load(f)

cell_12_code = """# Hitung dan visualisasikan rata-rata spasial musiman chlorophyll-a dengan overlay batas pulau NTT
from scripts.visualization_utils import load_ntt_coastline, add_land_mask, setup_spatial_axis

print("Menghitung rata-rata spasial musiman chlorophyll-a...")
gdf_land = load_ntt_coastline()

chla_annual_map = ds_chla['chlor_a'].mean(dim='time', skipna=True)

chla_seasons = {
    'Tahunan (2000–2020)': chla_annual_map,
    'DJF (Monsun Barat)': ds_chla['chlor_a'].sel(time=ds_chla.time.dt.month.isin([12, 1, 2])).mean(dim='time', skipna=True),
    'MAM (Peralihan I)': ds_chla['chlor_a'].sel(time=ds_chla.time.dt.month.isin([3, 4, 5])).mean(dim='time', skipna=True),
    'JJA (Monsun Timur / Upwelling)': ds_chla['chlor_a'].sel(time=ds_chla.time.dt.month.isin([6, 7, 8])).mean(dim='time', skipna=True),
    'SON (Peralihan II)': ds_chla['chlor_a'].sel(time=ds_chla.time.dt.month.isin([9, 10, 11])).mean(dim='time', skipna=True)
}

fig, axes = plt.subplots(2, 3, figsize=(17, 9.5))
axes_flat = axes.flatten()

# Skala logaritmik klorofil-a: 0.05 s.d. 2.5 mg/m3
norm_chla = mcolors.LogNorm(vmin=0.05, vmax=2.5)

im = None
for i, (title, chla_map) in enumerate(chla_seasons.items()):
    ax = axes_flat[i]
    im = ax.pcolormesh(
        ds_chla.lon.values, ds_chla.lat.values, chla_map.values,
        cmap=cfg.COLORMAP_CHLA, norm=norm_chla, shading='auto', zorder=2
    )
    # Overlay batas daratan pulau-pulau NTT (Flores, Timor, Sumba, dll.)
    add_land_mask(ax, gdf_land=gdf_land, facecolor='#e4e4e4', edgecolor='#3a3a3a', linewidth=0.6, zorder=5)
    setup_spatial_axis(ax, (ds_chla.lon.min(), ds_chla.lon.max()), (ds_chla.lat.min(), ds_chla.lat.max()), title=title)

# Panel ke-6: Penataan profesional untuk colorbar bersama dan ringkasan biogeokimia
ax_cbar = axes_flat[5]
ax_cbar.axis('off')

# Colorbar horizontal proporsional
cbar_box = [0.68, 0.22, 0.24, 0.035]
cbar_ax = fig.add_axes(cbar_box)
cb = fig.colorbar(im, cax=cbar_ax, orientation='horizontal')
cb.set_label('Konsentrasi Chlorophyll-a (mg/m³, skala logaritmik)', fontsize=10, fontweight='bold')
cb.ax.tick_params(labelsize=8.5)

# Keterangan ilmiah di panel ke-6
note_chla = (
    "Karakteristik Biogeokimia Spasial NTT:\\n"
    "• Peningkatan produktivitas primer (Chl-a > 0.8 mg/m³)\\n"
    "  terkonsentrasi pada JJA (upwelling monsun timur).\\n"
    "• Koridor utama: Selat Sumba, Laut Sawu, & Selatan Timor.\\n"
    "• Garis pulau NTT di-overlay presisi dari data vektor."
)
ax_cbar.text(
    0.5, 0.70, note_chla,
    transform=ax_cbar.transAxes, fontsize=9.5, va='top', ha='center',
    bbox=dict(boxstyle='round,pad=0.5', facecolor='#f8f9fa', edgecolor='#cccccc', alpha=0.9)
)

plt.suptitle('Sebaran Spasial Musiman Chlorophyll-a di Perairan NTT (2000–2020)', fontsize=14, fontweight='bold', y=0.99)
plt.tight_layout(rect=[0, 0, 1.0, 0.96])
fig.savefig(cfg.FIGURES_DIR / "nb3_chla_spatial_patterns.png", dpi=cfg.FIGURE_DPI, bbox_inches='tight')
plt.show()
"""

nb3["cells"][12]["source"] = [line + "\n" for line in cell_12_code.split("\n")]
if nb3["cells"][12]["source"]:
    nb3["cells"][12]["source"][-1] = nb3["cells"][12]["source"][-1].rstrip("\n")

with open(nb3_path, "w", encoding="utf-8") as f:
    json.dump(nb3, f, indent=1, ensure_ascii=False)
print("Notebook 03 Cell 12 string literal fixed.")

