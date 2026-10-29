"""
Modul Deteksi Marine Heatwave (MHW) Spasial NTT
================================================
Sesuai Metodologi Hobday et al. (2016, 2018) dan Pedoman REVISI_PBL.md

Fungsi:
1. compute_climatology_and_threshold: Menghitung klimatologi harian & persentil-90 musiman per deret waktu.
2. detect_mhw_events_1d: Deteksi kejadian MHW lokal pada 1 deret waktu (1 titik grid atau rata-rata).
3. run_spatial_mhw_detection: Menjalankan deteksi grid-by-grid pada seluruh sel laut NTT (0.25°),
   membuat peta spasial (durasi, intensitas, frekuensi), mengidentifikasi kejadian MHW regional NTT
   (berdasarkan ambang batas cakupan spasial >= 15% luas perairan NTT), dan mengekspor katalog lengkap.
"""

import numpy as np
import pandas as pd
import xarray as xr
from scipy.ndimage import uniform_filter1d
from datetime import datetime
from pathlib import Path
import sys

# Tambahkan project root ke sys.path jika belum ada
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from config import project_config as cfg


def compute_climatology_and_threshold(time_index, sst_series, window_half=15, pct=90, smooth_window=31, doy=None):
    """
    Menghitung klimatologi harian dan ambang persentil ke-90 musiman
    sesuai standar Hobday et al. (2016).
    """
    if doy is None:
        doy = time_index.day_of_year.values
    sst = np.asarray(sst_series, dtype=np.float32)
    
    clim_raw = np.full(366, np.nan, dtype=np.float32)
    thresh_raw = np.full(366, np.nan, dtype=np.float32)
    
    valid_mask = ~np.isnan(sst)
    if not np.any(valid_mask):
        return clim_raw, thresh_raw
        
    for d in range(1, 367):
        d_min = (d - window_half - 1) % 366 + 1
        d_max = (d + window_half - 1) % 366 + 1
        
        if d_min <= d_max:
            in_window = (doy >= d_min) & (doy <= d_max)
        else:
            in_window = (doy >= d_min) | (doy <= d_max)
            
        vals = sst[in_window & valid_mask]
        if len(vals) >= 10:
            clim_raw[d-1] = np.mean(vals)
            thresh_raw[d-1] = np.percentile(vals, pct)
            
    # Interpolasi jika ada hari kabisat (doy 366) yang kosong
    if np.isnan(clim_raw[365]) and not np.isnan(clim_raw[364]):
        clim_raw[365] = (clim_raw[364] + clim_raw[0]) / 2.0
        thresh_raw[365] = (thresh_raw[364] + thresh_raw[0]) / 2.0
        
    clim_smoothed = uniform_filter1d(clim_raw, size=smooth_window, mode='wrap')
    thresh_smoothed = uniform_filter1d(thresh_raw, size=smooth_window, mode='wrap')
    
    return clim_smoothed, thresh_smoothed


def detect_mhw_events_1d(time_index, sst_series, clim_doy, thresh_doy, min_duration=5, max_gap=2, doy=None):
    """
    Mendeteksi kejadian MHW pada 1 titik deret waktu berdasarkan kriteria durasi dan gap Hobday et al. (2016).
    Mengembalikan dataframe kejadian dan boolean array is_mhw (time,).
    """
    if doy is None:
        doy = time_index.day_of_year.values
    sst = np.asarray(sst_series, dtype=np.float32)
    n_days = len(sst)
    
    clim_ts = clim_doy[doy - 1]
    thresh_ts = thresh_doy[doy - 1]
    
    is_above = (sst > thresh_ts) & (~np.isnan(sst))
    
    events = []
    in_event = False
    start_idx = None
    
    for i in range(n_days):
        if is_above[i] and not in_event:
            in_event = True
            start_idx = i
        elif not is_above[i] and in_event:
            in_event = False
            events.append((start_idx, i - 1))
    if in_event:
        events.append((start_idx, n_days - 1))
        
    # Penggabungan kejadian dengan jeda <= max_gap hari jika suhu selama jeda > klimatologi
    merged_events = []
    if events:
        curr_start, curr_end = events[0]
        for next_start, next_end in events[1:]:
            gap = next_start - curr_end - 1
            if gap <= max_gap and np.all(sst[curr_end+1:next_start] > clim_ts[curr_end+1:next_start]):
                curr_end = next_end
            else:
                merged_events.append((curr_start, curr_end))
                curr_start, curr_end = next_start, next_end
        merged_events.append((curr_start, curr_end))
        
    final_events = []
    is_mhw_ts = np.zeros(n_days, dtype=bool)
    
    for s_idx, e_idx in merged_events:
        duration = e_idx - s_idx + 1
        if duration >= min_duration:
            is_mhw_ts[s_idx:e_idx+1] = True
            ev_sst = sst[s_idx:e_idx+1]
            ev_clim = clim_ts[s_idx:e_idx+1]
            ev_thresh = thresh_ts[s_idx:e_idx+1]
            anom = ev_sst - ev_clim
            delta_thresh = ev_thresh - ev_clim
            
            i_max = float(np.max(anom))
            peak_offset = int(np.argmax(anom))
            peak_idx = s_idx + peak_offset
            i_mean = float(np.mean(anom))
            i_cum = float(np.sum(anom))
            
            d_thresh_peak = delta_thresh[peak_offset]
            ratio = i_max / d_thresh_peak if d_thresh_peak > 0 else 1.0
            
            if ratio < 2.0:
                cat = "I (Moderat)"
                cat_num = 1
            elif ratio < 3.0:
                cat = "II (Kuat)"
                cat_num = 2
            elif ratio < 4.0:
                cat = "III (Parah)"
                cat_num = 3
            else:
                cat = "IV (Ekstrem)"
                cat_num = 4
                
            final_events.append({
                'event_id': len(final_events) + 1,
                'start_date': str(time_index[s_idx].date()),
                'end_date': str(time_index[e_idx].date()),
                'peak_date': str(time_index[peak_idx].date()),
                'duration_days': int(duration),
                'i_max': round(i_max, 3),
                'i_mean': round(i_mean, 3),
                'i_cum': round(i_cum, 3),
                'category': cat,
                'category_num': cat_num,
                'start_idx': s_idx,
                'end_idx': e_idx
            })
            
    df_events = pd.DataFrame(final_events)
    return df_events, clim_ts, thresh_ts, is_mhw_ts


def run_spatial_mhw_detection(ds_sst, regional_extent_threshold=0.15, verbose=True):
    """
    Menjalankan analisis MHW penuh secara spasial (per sel grid 0.25°) pada seluruh perairan NTT.
    """
    sst_data = ds_sst['sst'].values  # (time, lat, lon)
    n_time, n_lat, n_lon = sst_data.shape
    time_index = pd.DatetimeIndex(ds_sst.time.values)
    doy = time_index.day_of_year.values
    lats = ds_sst.lat.values
    lons = ds_sst.lon.values
    
    if verbose:
        print(f"Memulai Deteksi MHW Grid-by-Grid NTT ({n_lat} x {n_lon} grid, {n_time} hari)...")
        print(f"Ambang Batas Spasial Regional NTT: {regional_extent_threshold*100:.1f}% luas perairan laut.")
    
    # Pre-alokasi array spasial
    spatial_clim = np.full((366, n_lat, n_lon), np.nan, dtype=np.float32)
    spatial_thresh = np.full((366, n_lat, n_lon), np.nan, dtype=np.float32)
    spatial_mhw_days = np.zeros((n_lat, n_lon), dtype=np.float32)
    spatial_mhw_events_count = np.zeros((n_lat, n_lon), dtype=np.int32)
    spatial_max_intensity = np.zeros((n_lat, n_lon), dtype=np.float32)
    spatial_mean_intensity = np.zeros((n_lat, n_lon), dtype=np.float32)
    
    # 3D binary array: apakah (time, lat, lon) mengalami MHW aktif
    is_mhw_3d = np.zeros((n_time, n_lat, n_lon), dtype=bool)
    intensity_3d = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    
    ocean_mask = ~np.isnan(sst_data[0])
    total_ocean_cells = int(np.sum(ocean_mask))
    
    if verbose:
        print(f"Total sel laut terdeteksi: {total_ocean_cells} sel grid (dari {n_lat*n_lon} total sel).")
        
    local_events_list = []
    
    for j in range(n_lat):
        lat_val = float(lats[j])
        for i in range(n_lon):
            lon_val = float(lons[i])
            pix_sst = sst_data[:, j, i]
            if np.isnan(pix_sst).all():
                continue
                
            c_doy, t_doy = compute_climatology_and_threshold(
                time_index, pix_sst,
                window_half=15, pct=cfg.MHW_PERCENTILE, smooth_window=cfg.MHW_SMOOTHING_WINDOW,
                doy=doy
            )
            spatial_clim[:, j, i] = c_doy
            spatial_thresh[:, j, i] = t_doy
            
            df_ev, c_ts, t_ts, is_mhw_ts = detect_mhw_events_1d(
                time_index, pix_sst, c_doy, t_doy,
                min_duration=cfg.MHW_MIN_DURATION_DAYS, max_gap=2,
                doy=doy
            )
            
            is_mhw_3d[:, j, i] = is_mhw_ts
            anom = pix_sst - c_ts
            intensity_3d[:, j, i] = np.where(is_mhw_ts, anom, 0.0)
            
            if len(df_ev) > 0:
                spatial_mhw_days[j, i] = df_ev['duration_days'].sum()
                spatial_mhw_events_count[j, i] = len(df_ev)
                spatial_max_intensity[j, i] = df_ev['i_max'].max()
                spatial_mean_intensity[j, i] = df_ev['i_mean'].mean()
                
                for _, row in df_ev.iterrows():
                    row_dict = row.to_dict()
                    row_dict['lat'] = lat_val
                    row_dict['lon'] = lon_val
                    local_events_list.append(row_dict)
                    
    # Masking kembali titik darat dengan NaN
    spatial_mhw_days[~ocean_mask] = np.nan
    spatial_mhw_events_count[~ocean_mask] = -1
    spatial_max_intensity[~ocean_mask] = np.nan
    spatial_mean_intensity[~ocean_mask] = np.nan
    
    # DataFrame kejadian lokal
    df_local_events = pd.DataFrame(local_events_list)
    
    # =========================================================================
    # DETEKSI KEJADIAN REGIONAL NTT BERBASIS CAKUPAN SPASIAL (SPATIAL EXTENT)
    # =========================================================================
    # Hitung rasio cakupan spasial harian: jumlah sel laut yang MHW / total sel laut
    daily_mhw_cells = np.sum(is_mhw_3d[:, ocean_mask], axis=1)
    daily_extent_ratio = daily_mhw_cells / float(total_ocean_cells)
    
    is_regional_mhw_day = daily_extent_ratio >= regional_extent_threshold
    
    # Identifikasi blok kejadian regional NTT (durasi >= 5 hari berturut-turut, gap <= 2 hari)
    reg_events = []
    in_reg = False
    start_idx = None
    
    for t in range(n_time):
        if is_regional_mhw_day[t] and not in_reg:
            in_reg = True
            start_idx = t
        elif not is_regional_mhw_day[t] and in_reg:
            in_reg = False
            reg_events.append((start_idx, t - 1))
    if in_reg:
        reg_events.append((start_idx, n_time - 1))
        
    merged_reg_events = []
    if reg_events:
        curr_start, curr_end = reg_events[0]
        for next_start, next_end in reg_events[1:]:
            gap = next_start - curr_end - 1
            if gap <= 2:
                curr_end = next_end
            else:
                merged_reg_events.append((curr_start, curr_end))
                curr_start, curr_end = next_start, next_end
        merged_reg_events.append((curr_start, curr_end))
        
    final_reg_events = []
    for s_idx, e_idx in merged_reg_events:
        duration = e_idx - s_idx + 1
        if duration >= cfg.MHW_MIN_DURATION_DAYS:
            ev_extents = daily_extent_ratio[s_idx:e_idx+1]
            peak_offset = int(np.argmax(ev_extents))
            peak_idx = s_idx + peak_offset
            
            # Sub-volume intensitas selama kejadian
            ev_intensities = intensity_3d[s_idx:e_idx+1]
            active_intensities = ev_intensities[ev_intensities > 0]
            
            i_max_reg = float(np.max(active_intensities)) if len(active_intensities) > 0 else 0.0
            i_mean_reg = float(np.mean(active_intensities)) if len(active_intensities) > 0 else 0.0
            cum_intensity_reg = float(np.sum(active_intensities))
            
            # Kategori dominan di puncak
            peak_intensities = intensity_3d[peak_idx]
            peak_active = peak_intensities[peak_intensities > 0]
            
            final_reg_events.append({
                'regional_event_id': len(final_reg_events) + 1,
                'start_date': str(time_index[s_idx].date()),
                'end_date': str(time_index[e_idx].date()),
                'peak_date': str(time_index[peak_idx].date()),
                'duration_days': int(duration),
                'peak_extent_pct': round(float(np.max(ev_extents) * 100), 2),
                'mean_extent_pct': round(float(np.mean(ev_extents) * 100), 2),
                'i_max_regional': round(i_max_reg, 3),
                'i_mean_regional': round(i_mean_reg, 3),
                'cum_intensity_regional': round(cum_intensity_reg, 1),
                'start_idx': s_idx,
                'end_idx': e_idx
            })
            
    df_regional_events = pd.DataFrame(final_reg_events)
    
    if verbose:
        print(f"Deteksi selesai:")
        print(f"  Total Kejadian MHW Lokal (per-grid) : {len(df_local_events)}")
        print(f"  Total Kejadian MHW Regional NTT     : {len(df_regional_events)} kejadian (ambang >= {regional_extent_threshold*100:.0f}%)")
        print(f"  Rentang Hari MHW Spasial            : {np.nanmin(spatial_mhw_days):.0f} s.d. {np.nanmax(spatial_mhw_days):.0f} hari")
        print(f"  Rentang Intensitas Puncak Spasial   : {np.nanmin(spatial_max_intensity):.2f} s.d. {np.nanmax(spatial_max_intensity):.2f} °C")
        
    return {
        'spatial_clim': spatial_clim,
        'spatial_thresh': spatial_thresh,
        'spatial_mhw_days': spatial_mhw_days,
        'spatial_mhw_events_count': spatial_mhw_events_count,
        'spatial_max_intensity': spatial_max_intensity,
        'spatial_mean_intensity': spatial_mean_intensity,
        'is_mhw_3d': is_mhw_3d,
        'intensity_3d': intensity_3d,
        'daily_extent_ratio': daily_extent_ratio,
        'df_local_events': df_local_events,
        'df_regional_events': df_regional_events,
        'ocean_mask': ocean_mask,
        'total_ocean_cells': total_ocean_cells
    }

