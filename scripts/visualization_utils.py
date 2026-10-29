"""
Modul Utilitas Visualisasi Spasial Oseanografi NTT
==================================================
Sesuai Ketentuan revisigrafik.md dan Standar Publikasi Akademik

Fungsi:
- load_ntt_coastline: Memuat poligon batas daratan & pulau NTT dari GeoJSON presisi.
- plot_smooth_map: Merender peta spasial dengan transisi gradasi halus (contourf / regularized raster),
  overlay poligon daratan pulau NTT (Flores, Timor, Sumba, dll.), dan styling kartografis bersih.
- add_land_mask: Menambahkan poligon daratan ke sumbu peta Matplotlib.
- setup_spatial_axis: Memformat sumbu koordinat geografis (°BT, °LS), grid tipis, dan aspect ratio.
"""

from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
from matplotlib.colors import LogNorm, Normalize, BoundaryNorm

try:
    import geopandas as gpd
    HAS_GEOPANDAS = True
except ImportError:
    HAS_GEOPANDAS = False

# Path GeoJSON batas daratan pulau NTT
PROJECT_ROOT = Path(__file__).resolve().parent.parent
COASTLINE_GEOJSON = PROJECT_ROOT / "dashboard" / "data" / "ntt_coastline.geojson"

_CACHED_LAND_GDF = None


def load_ntt_coastline():
    """Memuat dan meng-cache GeoDataFrame poligon daratan kepulauan NTT."""
    global _CACHED_LAND_GDF
    if _CACHED_LAND_GDF is not None:
        return _CACHED_LAND_GDF
        
    if HAS_GEOPANDAS and COASTLINE_GEOJSON.exists():
        try:
            _CACHED_LAND_GDF = gpd.read_file(COASTLINE_GEOJSON)
            return _CACHED_LAND_GDF
        except Exception as e:
            print(f"Warning: Gagal memuat ntt_coastline.geojson: {e}")
            return None
    return None


def add_land_mask(ax, gdf_land=None, facecolor="#e4e4e4", edgecolor="#3a3a3a", linewidth=0.6, zorder=5):
    """Menambahkan poligon pulau-pulau NTT ke axis Matplotlib."""
    if gdf_land is None:
        gdf_land = load_ntt_coastline()
    if gdf_land is not None:
        gdf_land.plot(ax=ax, facecolor=facecolor, edgecolor=edgecolor, linewidth=linewidth, zorder=zorder)


def setup_spatial_axis(ax, lon_extent=None, lat_extent=None, title=None, fontsize_title=11, xlabel="Bujur (°BT)", ylabel="Lintang (°LS)"):
    """Format sumbu kartografi standar dengan label koordinat presisi dan grid tipis."""
    if lon_extent is not None:
        ax.set_xlim(lon_extent)
    if lat_extent is not None:
        ax.set_ylim(lat_extent)
        
    ax.set_aspect("equal")
    ax.grid(True, linestyle=":", alpha=0.35, color="gray", zorder=1)
    
    if title:
        ax.set_title(title, fontsize=fontsize_title, fontweight="bold", pad=7)
    if xlabel:
        ax.set_xlabel(xlabel, fontsize=9.5)
    if ylabel:
        ax.set_ylabel(ylabel, fontsize=9.5)
        
    ax.tick_params(axis="both", labelsize=8.5)


def plot_smooth_map(
    ax, lon, lat, data,
    var_type="continuous",
    cmap="coolwarm",
    vmin=None, vmax=None,
    norm=None,
    levels=35,
    title=None,
    cbar=True,
    cbar_label="",
    cbar_shrink=0.8,
    cbar_fraction=0.046,
    cbar_pad=0.04,
    extend="both",
    gdf_land=None,
    land_color="#e4e4e4",
    land_edge="#3a3a3a"
):
    """
    Merender peta spasial berkualitas tinggi sesuai rekomendasi revisigrafik.md.
    
    Parameters:
    -----------
    var_type : str, 'continuous', 'discrete', 'binary', atau 'log'
    """
    if gdf_land is None:
        gdf_land = load_ntt_coastline()
        
    lon_min, lon_max = float(np.nanmin(lon)), float(np.nanmax(lon))
    lat_min, lat_max = float(np.nanmin(lat)), float(np.nanmax(lat))
    
    # 1. Rendering Berdasarkan Tipe Variabel
    if var_type == "continuous":
        if vmin is None:
            vmin = float(np.nanmin(data))
        if vmax is None:
            vmax = float(np.nanmax(data))
        contour_levels = np.linspace(vmin, vmax, levels)
        cs = ax.contourf(
            lon, lat, data,
            levels=contour_levels,
            cmap=cmap,
            vmin=vmin,
            vmax=vmax,
            extend=extend,
            zorder=2
        )
    elif var_type == "log":
        # Untuk klorofil-a
        if norm is None:
            vmin_val = vmin if vmin is not None else 0.05
            vmax_val = vmax if vmax is not None else 2.5
            norm = LogNorm(vmin=vmin_val, vmax=vmax_val)
        # Gunakan contourf dengan log-spaced levels atau pcolormesh/contourf rapat
        log_levels = np.geomspace(norm.vmin, norm.vmax, levels)
        cs = ax.contourf(
            lon, lat, data,
            levels=log_levels,
            cmap=cmap,
            norm=norm,
            extend=extend,
            zorder=2
        )
    elif var_type == "discrete":
        # Untuk data hitungan/integer (misal frekuensi kejadian MHW)
        d_min = int(np.floor(np.nanmin(data))) if vmin is None else int(vmin)
        d_max = int(np.ceil(np.nanmax(data))) if vmax is None else int(vmax)
        discrete_levels = np.arange(d_min - 0.5, d_max + 1.5, 1.0)
        norm_disc = BoundaryNorm(discrete_levels, ncolors=256)
        cs = ax.pcolormesh(
            lon, lat, data,
            cmap=cmap,
            norm=norm_disc,
            shading="auto",
            zorder=2
        )
    elif var_type == "binary":
        # Untuk masker atau kehadiran MHW (0 atau 1)
        cs = ax.pcolormesh(
            lon, lat, data,
            cmap=cmap,
            vmin=0,
            vmax=1,
            shading="auto",
            zorder=2
        )
    else:
        # Default pcolormesh fallback
        cs = ax.pcolormesh(lon, lat, data, cmap=cmap, vmin=vmin, vmax=vmax, shading="auto", zorder=2)
        
    # 2. Overlay Garis Pantai & Daratan NTT
    add_land_mask(ax, gdf_land=gdf_land, facecolor=land_color, edgecolor=land_edge, linewidth=0.6, zorder=5)
    
    # 3. Format Sumbu Koordinat
    setup_spatial_axis(ax, (lon_min, lon_max), (lat_min, lat_max), title=title)
    
    # 4. Colorbar jika diminta
    cb = None
    if cbar:
        cb = plt.colorbar(cs, ax=ax, shrink=cbar_shrink, fraction=cbar_fraction, pad=cbar_pad)
        if cbar_label:
            cb.set_label(cbar_label, fontsize=9)
        cb.ax.tick_params(labelsize=8)
        
    return cs, cb

