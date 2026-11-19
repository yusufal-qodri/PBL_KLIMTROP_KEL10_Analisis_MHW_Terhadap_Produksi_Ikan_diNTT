"""
spatial_extent.py
=================
Modul utilitas untuk menghitung batas spasial dinamis (dynamic map extent / spatial cropping)
secara konsisten dan reusable pada visualisasi data kelautan wilayah NTT.

Mendukung berbagai struktur data:
- xarray.DataArray
- xarray.Dataset
- netCDF4.Dataset atau path file NetCDF
- pandas.DataFrame / geopandas.GeoDataFrame
- numpy.ndarray 2D (beserta vektor koordinat)

Ketentuan PRD & Kebijakan Data:
- Nilai NaN / missing value tetap dipertahankan dan tidak diubah menjadi nol.
- Menangani kondisi data kosong / seluruh grid NaN dengan aman (safe fallback).
- Mendukung penggabungan extent (multi-layer extent) agar overlay peta tetap sejajar.
- Mendukung penyesuaian rasio aspek (aspect ratio) tanpa distorsi geografis.
"""

from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np


# Batas default wilayah laut NTT (Copernicus / ESA SST CCI v3.0)
DEFAULT_EXTENT_NTT = {
    "lon_min": 118.025,
    "lon_max": 125.975,
    "lat_min": -11.975,
    "lat_max": -7.525,
    "lon_span": 7.95,
    "lat_span": 4.45,
    "is_valid": True,
    "extent_tuple": (118.025, 125.975, -11.975, -7.525)
}


def fit_extent_to_aspect(
    extent: Dict[str, Any],
    target_aspect: Optional[float] = 800.0 / 480.0,
    margin: float = 0.1
) -> Dict[str, Any]:
    """
    Menambahkan margin dan menyesuaikan batas koordinat agar sesuai rasio aspek target
    (mis. lebar/tinggi canvas = 800/480) tanpa mendistorsi proporsi geografis.
    """
    lon_min = float(extent["lon_min"]) - margin
    lon_max = float(extent["lon_max"]) + margin
    lat_min = float(extent["lat_min"]) - margin
    lat_max = float(extent["lat_max"]) + margin

    lon_span = lon_max - lon_min
    lat_span = lat_max - lat_min

    if target_aspect is not None and target_aspect > 0 and lat_span > 0:
        current_aspect = lon_span / lat_span
        if current_aspect < target_aspect:
            # Terlalu tinggi; lebarkan bujur secara simetris
            extra_lon = (lat_span * target_aspect - lon_span) / 2.0
            lon_min -= extra_lon
            lon_max += extra_lon
        elif current_aspect > target_aspect:
            # Terlalu lebar; tinggikan lintang secara simetris
            extra_lat = (lon_span / target_aspect - lat_span) / 2.0
            lat_min -= extra_lat
            lat_max += extra_lat

    lon_span = lon_max - lon_min
    lat_span = lat_max - lat_min

    return {
        "lon_min": round(lon_min, 4),
        "lon_max": round(lon_max, 4),
        "lat_min": round(lat_min, 4),
        "lat_max": round(lat_max, 4),
        "lon_span": round(lon_span, 4),
        "lat_span": round(lat_span, 4),
        "is_valid": extent.get("is_valid", True),
        "extent_tuple": (round(lon_min, 4), round(lon_max, 4), round(lat_min, 4), round(lat_max, 4))
    }


def get_valid_spatial_extent(
    data: Any,
    lat_coord: Optional[Union[np.ndarray, List[float], str]] = None,
    lon_coord: Optional[Union[np.ndarray, List[float], str]] = None,
    margin: float = 0.1,
    target_aspect: Optional[float] = 800.0 / 480.0,
    default_extent: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Mendeteksi cakupan spasial dari data valid (non-NaN / non-null) dari berbagai struktur data.

    Parameters
    ----------
    data : xarray.DataArray, xarray.Dataset, pandas.DataFrame, np.ndarray, list, atau str (path NetCDF).
    lat_coord : Nama koordinat lintang atau array koordinat 1D.
    lon_coord : Nama koordinat bujur atau array koordinat 1D.
    margin : Margin/padding tambahan dalam derajat (default: 0.1 derajat).
    target_aspect : Rasio aspek target (lebar / tinggi) untuk visualisasi (default: 800/480).
    default_extent : Fallback extent jika data kosong atau seluruhnya NaN.

    Returns
    -------
    dict: { 'lon_min', 'lon_max', 'lat_min', 'lat_max', 'lon_span', 'lat_span', 'is_valid', 'extent_tuple' }
    """
    fallback = default_extent or DEFAULT_EXTENT_NTT.copy()

    if data is None:
        return fit_extent_to_aspect(fallback, target_aspect, margin) if target_aspect else fallback

    # 1. Penanganan xarray.Dataset
    if hasattr(data, "data_vars"):
        # Pilih variabel 2D/3D pertama yang memiliki koordinat spasial
        selected_var = None
        for v in data.data_vars:
            dims = data[v].dims
            if any("lat" in d.lower() or "y" in d.lower() for d in dims) and any("lon" in d.lower() or "x" in d.lower() for d in dims):
                selected_var = v
                break
        if selected_var is None and len(data.data_vars) > 0:
            selected_var = list(data.data_vars.keys())[0]
        if selected_var is not None:
            return get_valid_spatial_extent(
                data[selected_var],
                lat_coord=lat_coord,
                lon_coord=lon_coord,
                margin=margin,
                target_aspect=target_aspect,
                default_extent=default_extent
            )
        return fit_extent_to_aspect(fallback, target_aspect, margin) if target_aspect else fallback

    # 2. Penanganan xarray.DataArray
    if hasattr(data, "values") and hasattr(data, "coords"):
        vals = data.values
        if vals.ndim > 2:
            # Reduksi dimensi waktu jika ada (ambil mean atau any valid)
            valid_mask = ~np.isnan(vals)
            # Gabungkan dimensi waktu / ekstra menjadi mask 2D
            while valid_mask.ndim > 2:
                valid_mask = valid_mask.any(axis=0)
        else:
            valid_mask = ~np.isnan(vals)

        # Cari nama koordinat lat dan lon
        lat_name = None
        lon_name = None
        for c in data.coords:
            c_low = str(c).lower()
            if "lat" in c_low or c_low == "y":
                lat_name = c
            elif "lon" in c_low or c_low == "x":
                lon_name = c

        if lat_name is not None and lon_name is not None:
            lats = np.asarray(data.coords[lat_name].values)
            lons = np.asarray(data.coords[lon_name].values)
            return _extent_from_mask_and_coords(valid_mask, lats, lons, margin, target_aspect, fallback)

    # 3. Penanganan pandas.DataFrame
    if hasattr(data, "columns"):
        cols = {str(c).lower(): c for c in data.columns}
        lat_c = None
        lon_c = None
        for cand in ["latitude", "lat", "lintang", "y"]:
            if cand in cols:
                lat_c = cols[cand]
                break
        for cand in ["longitude", "lon", "bujur", "x"]:
            if cand in cols:
                lon_c = cols[cand]
                break

        if lat_c is not None and lon_c is not None:
            # Buang baris dengan NaN pada lat atau lon
            df_clean = data.dropna(subset=[lat_c, lon_c])
            if len(df_clean) > 0:
                raw_ext = {
                    "lon_min": float(df_clean[lon_c].min()),
                    "lon_max": float(df_clean[lon_c].max()),
                    "lat_min": float(df_clean[lat_c].min()),
                    "lat_max": float(df_clean[lat_c].max()),
                    "is_valid": True
                }
                return fit_extent_to_aspect(raw_ext, target_aspect, margin)

        # Cek apakah geopandas GeoDataFrame
        if hasattr(data, "total_bounds"):
            tb = data.total_bounds
            if len(tb) == 4 and not np.any(np.isnan(tb)):
                raw_ext = {
                    "lon_min": float(tb[0]),
                    "lat_min": float(tb[1]),
                    "lon_max": float(tb[2]),
                    "lat_max": float(tb[3]),
                    "is_valid": True
                }
                return fit_extent_to_aspect(raw_ext, target_aspect, margin)

    # 4. Penanganan numpy.ndarray 2D atau nested list
    arr = np.asarray(data)
    if arr.ndim == 2:
        valid_mask = ~np.isnan(arr) & (arr != None)
        lats = np.asarray(lat_coord) if lat_coord is not None else None
        lons = np.asarray(lon_coord) if lon_coord is not None else None

        if lats is not None and lons is not None and len(lats) == arr.shape[0] and len(lons) == arr.shape[1]:
            return _extent_from_mask_and_coords(valid_mask, lats, lons, margin, target_aspect, fallback)

    # 5. Fallback aman jika struktur data tidak teridentifikasi
    return fit_extent_to_aspect(fallback, target_aspect, margin) if target_aspect else fallback


def _extent_from_mask_and_coords(
    valid_mask: np.ndarray,
    lats: np.ndarray,
    lons: np.ndarray,
    margin: float,
    target_aspect: Optional[float],
    fallback: Dict[str, Any]
) -> Dict[str, Any]:
    """Fungsi internal untuk mengekstrak batas koordinat dari mask boolean dan vektor koordinat."""
    if not np.any(valid_mask):
        return fit_extent_to_aspect(fallback, target_aspect, margin) if target_aspect else fallback

    rows_with_data = np.where(valid_mask.any(axis=1))[0]
    cols_with_data = np.where(valid_mask.any(axis=0))[0]

    r_min, r_max = int(rows_with_data[0]), int(rows_with_data[-1])
    c_min, c_max = int(cols_with_data[0]), int(cols_with_data[-1])

    lat_a, lat_b = float(lats[r_min]), float(lats[r_max])
    lon_a, lon_b = float(lons[c_min]), float(lons[c_max])

    raw_ext = {
        "lon_min": min(lon_a, lon_b),
        "lon_max": max(lon_a, lon_b),
        "lat_min": min(lat_a, lat_b),
        "lat_max": max(lat_a, lat_b),
        "is_valid": True
    }

    return fit_extent_to_aspect(raw_ext, target_aspect, margin)


def combine_spatial_extents(
    extents: List[Dict[str, Any]],
    margin: float = 0.0,
    target_aspect: Optional[float] = 800.0 / 480.0
) -> Dict[str, Any]:
    """
    Menggabungkan beberapa batas extent (multi-layer) menjadi satu kesatuan bounding box
    sehingga layer-layer peta yang ditampilkan berdampingan atau overlay tetap sejajar dan sinkron.
    """
    valid_exts = [e for e in extents if e and e.get("is_valid", False)]
    if not valid_exts:
        valid_exts = [DEFAULT_EXTENT_NTT]

    lon_min = min(float(e["lon_min"]) for e in valid_exts)
    lon_max = max(float(e["lon_max"]) for e in valid_exts)
    lat_min = min(float(e["lat_min"]) for e in valid_exts)
    lat_max = max(float(e["lat_max"]) for e in valid_exts)

    combined = {
        "lon_min": lon_min,
        "lon_max": lon_max,
        "lat_min": lat_min,
        "lat_max": lat_max,
        "is_valid": True
    }

    return fit_extent_to_aspect(combined, target_aspect, margin)
