import json
from pathlib import Path

nb_path = Path("notebooks/03_Analisis_Chlorophyll_a.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

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
ax_cbar.text(
    0.5, 0.70,
    "Karakteristik Biogeokimia Spasial NTT:\n"
    "• Peningkatan produktivitas primer (Chl-a > 0.8 mg/m³)\n"
    "  terkonsentrasi pada JJA (upwelling monsun timur).\n"
    "• Koridor utama: Selat Sumba, Laut Sawu, & Selatan Timor.\n"
    "• Garis pulau NTT di-overlay presisi dari data vektor.",
    transform=ax_cbar.transAxes, fontsize=9.5, va='top', ha='center',
    bbox=dict(boxstyle='round,pad=0.5', facecolor='#f8f9fa', edgecolor='#cccccc', alpha=0.9)
)

plt.suptitle('Sebaran Spasial Musiman Chlorophyll-a di Perairan NTT (2000–2020)', fontsize=14, fontweight='bold', y=0.99)
plt.tight_layout(rect=[0, 0, 1.0, 0.96])
fig.savefig(cfg.FIGURES_DIR / "nb3_chla_spatial_patterns.png", dpi=cfg.FIGURE_DPI, bbox_inches='tight')
plt.show()
"""

nb["cells"][12]["source"] = [line + "\n" for line in cell_12_code.split("\n")]
if nb["cells"][12]["source"]:
    nb["cells"][12]["source"][-1] = nb["cells"][12]["source"][-1].rstrip("\n")

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print("Notebook 03 visual updates applied successfully.")

