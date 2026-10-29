import json
from pathlib import Path

nb_path = Path("notebooks/01_Persiapan_dan_Penggabungan_Data.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Cell 12: Peta cakupan SST berkualitas tinggi
cell_12_code = """# Peta cakupan SST dengan rendering halus dan overlay daratan NTT
from scripts.visualization_utils import plot_smooth_map, load_ntt_coastline

gdf_land = load_ntt_coastline()
fig, axes = plt.subplots(1, 2, figsize=(16, 5.5))

# Panel 1: Peta rata-rata SST (Kontinu, contourf 35 level halus)
sst_mean = ds_sst["sst"].mean(dim="time").values
cs1, cb1 = plot_smooth_map(
    axes[0], ds_sst.lon.values, ds_sst.lat.values, sst_mean,
    var_type="continuous", cmap=cfg.COLORMAP_SST, levels=35,
    title="(a) Rata-rata SST Harian (2000–2020)",
    cbar_label="SST (°C)", gdf_land=gdf_land
)

# Panel 2: Persentase data valid per piksel
valid_pct = (ds_sst["sst"].notnull().sum(dim="time") / len(ds_sst.time) * 100).values
cs2, cb2 = plot_smooth_map(
    axes[1], ds_sst.lon.values, ds_sst.lat.values, valid_pct,
    var_type="continuous", cmap="YlOrRd", vmin=0, vmax=100, levels=20,
    title="(b) Persentase Data SST Valid per Piksel",
    cbar_label="Data Valid (%)", gdf_land=gdf_land
)

plt.suptitle("Cakupan Spasial dan Integritas Data Suhu Permukaan Laut (NOAA OISST v2.1)", fontsize=13, fontweight="bold", y=0.99)
plt.tight_layout()
fig.savefig(cfg.FIGURES_DIR / "nb1_sst_coverage_map.png", dpi=cfg.FIGURE_DPI, bbox_inches="tight")
plt.show()
"""
nb["cells"][12]["source"] = [line + "\n" for line in cell_12_code.split("\n")]
if nb["cells"][12]["source"]:
    nb["cells"][12]["source"][-1] = nb["cells"][12]["source"][-1].rstrip("\n")

# Cell 24: Peta cakupan chlorophyll-a berkualitas tinggi
cell_24_code = """# Peta cakupan chlorophyll-a dengan overlay batas pulau NTT
if ds_chla_combined is not None and 'chlor_a' in ds_chla_combined:
    fig, axes = plt.subplots(1, 2, figsize=(16, 5.5))
    
    # Panel 1: Rata-rata chlor_a (log scale karena distribusi miring ke kanan)
    chla_mean = ds_chla_combined["chlor_a"].mean(dim="time").values
    cs1, cb1 = plot_smooth_map(
        axes[0], ds_chla_combined.lon.values, ds_chla_combined.lat.values, chla_mean,
        var_type="log", cmap=cfg.COLORMAP_CHLA, vmin=0.05, vmax=2.5, levels=35,
        title="(a) Rata-rata Chlorophyll-a (Skala Logaritmik)",
        cbar_label="Chlorophyll-a (mg/m³)", gdf_land=gdf_land
    )
    
    # Panel 2: Persentase data valid (mengevaluasi tutupan awan satelit)
    valid_pct_chla = (ds_chla_combined["chlor_a"].notnull().sum(dim="time") / len(ds_chla_combined.time) * 100).values
    cs2, cb2 = plot_smooth_map(
        axes[1], ds_chla_combined.lon.values, ds_chla_combined.lat.values, valid_pct_chla,
        var_type="continuous", cmap="YlGn", vmin=0, vmax=100, levels=20,
        title="(b) Persentase Observasi Klorofil Valid per Piksel",
        cbar_label="Data Valid (%)", gdf_land=gdf_land
    )
    
    plt.suptitle("Cakupan Spasial dan Ketersediaan Data Chlorophyll-a Satelit di Perairan NTT", fontsize=13, fontweight="bold", y=0.99)
    plt.tight_layout()
    fig.savefig(cfg.FIGURES_DIR / "nb1_chla_coverage_map.png", dpi=cfg.FIGURE_DPI, bbox_inches="tight")
    plt.show()
else:
    print("Dataset chlorophyll-a tidak tersedia untuk divisualisasikan.")
"""
nb["cells"][24]["source"] = [line + "\n" for line in cell_24_code.split("\n")]
if nb["cells"][24]["source"]:
    nb["cells"][24]["source"][-1] = nb["cells"][24]["source"][-1].rstrip("\n")

# Cell 28: Verifikasi GeoJSON batas daratan pulau NTT
cell_28_code = """# Pemeriksaan data batas wilayah dan garis pantai kepulauan NTT
print("Pemeriksaan Data Garis Pantai dan Pulau-Pulau NTT")
print("=" * 60)

from scripts.visualization_utils import load_ntt_coastline, COASTLINE_GEOJSON

gdf_land = load_ntt_coastline()
if gdf_land is not None:
    print(f"✅ Data garis pantai GeoJSON NTT ditemukan: {COASTLINE_GEOJSON.name}")
    print(f"  Jumlah fitur pulau/wilayah : {len(gdf_land)}")
    print(f"  Sistem Koordinat (CRS)     : {gdf_land.crs}")
    print(f"  Batas Wilayah (Bounds)     : {gdf_land.total_bounds}")
    shp_found = True
else:
    print("ℹ️ File GeoJSON garis pantai tidak ditemukan. Menggunakan fallback batas grid.")
    shp_found = False
"""
nb["cells"][28]["source"] = [line + "\n" for line in cell_28_code.split("\n")]
if nb["cells"][28]["source"]:
    nb["cells"][28]["source"][-1] = nb["cells"][28]["source"][-1].rstrip("\n")

# Bersihkan sel kosong redundan jika ada di akhir (Section 13)
cleaned_cells = []
for c in nb["cells"]:
    src = "".join(c.get("source", [])).strip()
    if c["cell_type"] == "markdown" and src == "---":
        # Lewati sel pemisah ganda kosong
        continue
    cleaned_cells.append(c)

nb["cells"] = cleaned_cells

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print(f"Notebook 01 visual updates applied successfully. Total cells now: {len(nb['cells'])}")

