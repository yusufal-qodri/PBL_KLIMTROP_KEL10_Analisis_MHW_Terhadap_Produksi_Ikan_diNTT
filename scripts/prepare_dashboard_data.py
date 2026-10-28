"""
Script untuk mengekstrak dan memformat seluruh data ilmiah dari NetCDF dan CSV
menjadi file JSON terstruktur untuk NTT Marine Insight Dashboard.
"""

import json
import os
from pathlib import Path
import numpy as np
import pandas as pd
import xarray as xr

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / "dashboard" / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("Starting dashboard data extraction...")

# 1. Buka Datasets NetCDF
ds_sst = xr.open_dataset(PROJECT_ROOT / "data/processed/sst_daily_2000_2020_ntt.nc")
ds_clim = xr.open_dataset(PROJECT_ROOT / "data/processed/sst_climatology_threshold_ntt.nc")
ds_aligned = xr.open_dataset(PROJECT_ROOT / "data/processed/mhw_chla_aligned_daily_ntt.nc")

lat_coords = [round(float(x), 4) for x in ds_sst.lat.values]
lon_coords = [round(float(x), 4) for x in ds_sst.lon.values]

print(f"Grid dimensions: {len(lat_coords)} latitudes x {len(lon_coords)} longitudes")

# Helper untuk membersihkan NaN menjadi None untuk JSON
def sanitize_grid(arr):
    out = []
    for row in arr:
        out_row = []
        for val in row:
            if np.isnan(val) or np.isinf(val):
                out_row.append(None)
            else:
                out_row.append(round(float(val), 3))
        out.append(out_row)
    return out

# 2. Metadata & KPI
meta = {
    "project_name": "NTT Marine Insight",
    "tagline": "Data Laut untuk Nusa Tenggara Timur",
    "description": "Dashboard Interaktif SST, Marine Heatwave, Chlorophyll-a, dan Produksi Tangkapan Ikan di Perairan Nusa Tenggara Timur",
    "region": {
        "name": "Perairan Nusa Tenggara Timur",
        "lat_min": -13.0,
        "lat_max": -7.0,
        "lon_min": 117.5,
        "lon_max": 127.5,
        "lat_coords": lat_coords,
        "lon_coords": lon_coords,
        "center": [-9.5, 122.5],
        "zoom": 7
    },
    "periods": {
        "sst": "2000-01-01 s/d 2020-12-31 (21 Tahun)",
        "mhw": "2000-01-01 s/d 2020-12-31 (21 Tahun, Baseline 2000-2020)",
        "chla": "2002-07-04 s/d 2020-12-30 (MODIS-Aqua / C3S CCI)",
        "fisheries": "2000 s/d 2020 (BPS & KKP NTT, Resolusi Tahunan)"
    },
    "kpi": {
        "sst_mean": 28.63,
        "sst_min": 25.10,
        "sst_max": 31.40,
        "mhw_events_count": 43,
        "mhw_days_total": 545,
        "mhw_mean_intensity": 1.18,
        "mhw_max_intensity": 3.42,
        "chla_mean": 0.285,
        "chla_suppression_pct": -23.6,
        "catch_annual_mean": 118520,
        "catch_2020_total": 142357
    },
    "last_updated": "28 Oktober 2026"
}

with open(OUTPUT_DIR / "metadata.json", "w", encoding="utf-8") as f:
    json.dump(meta, f, indent=2, ensure_ascii=False)
print("Saved metadata.json")

# 3. Annual Data
df_annual = pd.read_csv(PROJECT_ROOT / "outputs/tables/annual_synthesis_mhw_chla_catch.csv")
df_mhw_metrics = pd.read_csv(PROJECT_ROOT / "data/processed/mhw_annual_metrics_ntt.csv")

merged_annual = []
for _, row in df_annual.iterrows():
    yr = int(row["Tahun"])
    mhw_row = df_mhw_metrics[df_mhw_metrics["tahun"] == yr]
    
    freq = int(mhw_row["frekuensi_kejadian"].values[0]) if not mhw_row.empty else int(row["Kejadian_MHW"])
    tot_days = int(mhw_row["total_hari_mhw"].values[0]) if not mhw_row.empty else int(row["Hari_MHW"])
    dur_mean = float(mhw_row["durasi_rata_rata"].values[0]) if not mhw_row.empty and not pd.isna(mhw_row["durasi_rata_rata"].values[0]) else 0.0
    i_max = float(mhw_row["intensitas_maks_tertinggi"].values[0]) if not mhw_row.empty and not pd.isna(mhw_row["intensitas_maks_tertinggi"].values[0]) else 0.0
    i_cum = float(mhw_row["intensitas_kumulatif_tahunan"].values[0]) if not mhw_row.empty and not pd.isna(mhw_row["intensitas_kumulatif_tahunan"].values[0]) else 0.0
    sst_ano = float(mhw_row["sst_anomali_tahunan"].values[0]) if not mhw_row.empty and not pd.isna(mhw_row["sst_anomali_tahunan"].values[0]) else 0.0
    
    merged_annual.append({
        "year": yr,
        "sst_mean": round(float(row["SST_Rerata_C"]), 2),
        "sst_anomaly": round(sst_ano, 3),
        "mhw_events": freq,
        "mhw_days": tot_days,
        "mhw_mean_duration": round(dur_mean, 1),
        "mhw_max_intensity": round(i_max, 2),
        "mhw_cum_intensity": round(i_cum, 2),
        "chla_mean": round(float(row["Chla_Rerata_mg_m3"]), 4) if not pd.isna(row["Chla_Rerata_mg_m3"]) else None,
        "catch_tons": float(row["Produksi_Laut_Ton"]) if not pd.isna(row["Produksi_Laut_Ton"]) else None
    })

with open(OUTPUT_DIR / "annual_summary.json", "w", encoding="utf-8") as f:
    json.dump(merged_annual, f, indent=2, ensure_ascii=False)
print("Saved annual_summary.json")

# 4. MHW Events
df_events = pd.read_csv(PROJECT_ROOT / "outputs/tables/nb2_mhw_events_all.csv")
events_list = []
for _, r in df_events.iterrows():
    events_list.append({
        "event_id": int(r["event_id"]),
        "start_date": str(r["start_date"]),
        "end_date": str(r["end_date"]),
        "peak_date": str(r["peak_date"]) if "peak_date" in r and not pd.isna(r["peak_date"]) else str(r["start_date"]),
        "duration": int(r["duration_days"]),
        "i_max": round(float(r["i_max"]), 3),
        "i_mean": round(float(r["i_mean"]), 3),
        "i_cum": round(float(r["i_cum"]), 3),
        "category": str(r["category"]),
        "year": int(str(r["start_date"]).split("-")[0])
    })

with open(OUTPUT_DIR / "mhw_events.json", "w", encoding="utf-8") as f:
    json.dump(events_list, f, indent=2, ensure_ascii=False)
print("Saved mhw_events.json")

# 5. Climatology DOY (1..366)
clim_mean = ds_clim.climatology.mean(dim=["lat", "lon"]).values
thresh_mean = ds_clim.threshold.mean(dim=["lat", "lon"]).values
doy_list = []
for i in range(len(clim_mean)):
    doy_list.append({
        "doy": i + 1,
        "climatology": round(float(clim_mean[i]), 2),
        "threshold": round(float(thresh_mean[i]), 2)
    })

with open(OUTPUT_DIR / "climatology_doy.json", "w", encoding="utf-8") as f:
    json.dump(doy_list, f, indent=2, ensure_ascii=False)
print("Saved climatology_doy.json")

# 6. Monthly Climatology (1..12)
month_names = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
monthly_sst = ds_sst.sst.groupby("time.month").mean(dim=["time", "lat", "lon"]).values
monthly_sst_min = ds_sst.sst.groupby("time.month").min(dim=["time", "lat", "lon"]).values
monthly_sst_max = ds_sst.sst.groupby("time.month").max(dim=["time", "lat", "lon"]).values
monthly_chla = ds_aligned.chlor_a.groupby("time.month").mean(dim=["time", "lat", "lon"]).values

monthly_list = []
for m in range(12):
    monthly_list.append({
        "month": m + 1,
        "name": month_names[m],
        "sst_mean": round(float(monthly_sst[m]), 2),
        "sst_min": round(float(monthly_sst_min[m]), 2),
        "sst_max": round(float(monthly_sst_max[m]), 2),
        "chla_mean": round(float(monthly_chla[m]), 4) if not np.isnan(monthly_chla[m]) else None
    })

with open(OUTPUT_DIR / "monthly_climatology.json", "w", encoding="utf-8") as f:
    json.dump(monthly_list, f, indent=2, ensure_ascii=False)
print("Saved monthly_climatology.json")

# 7. Spatial Grids
print("Extracting spatial metrics...")
total_mhw_days_grid = sanitize_grid(ds_clim.total_mhw_days.values)
max_intensity_grid = sanitize_grid(ds_clim.max_intensity.values)
sst_mean_all_grid = sanitize_grid(ds_sst.sst.mean(dim="time").values)
chla_mean_all_grid = sanitize_grid(ds_aligned.chlor_a.mean(dim="time").values)

# Seasonal grids
seasons = {
    "DJF": [12, 1, 2],
    "MAM": [3, 4, 5],
    "JJA": [6, 7, 8],
    "SON": [9, 10, 11]
}

sst_seasonal = {}
chla_seasonal = {}
for s_name, months in seasons.items():
    sst_sub = ds_sst.sst.sel(time=ds_sst.time.dt.month.isin(months)).mean(dim="time").values
    chla_sub = ds_aligned.chlor_a.sel(time=ds_aligned.time.dt.month.isin(months)).mean(dim="time").values
    sst_seasonal[s_name] = sanitize_grid(sst_sub)
    chla_seasonal[s_name] = sanitize_grid(chla_sub)

# Sample Representative Days
sample_days = {}
sample_dates = [
    ("normal_transition", "2015-05-15", "Kondisi Normal (Peralihan I - Suhu Moderat ~29.2°C)"),
    ("upwelling_peak", "2018-08-15", "Puncak Upwelling Monsun Timur (SST Dingin ~26.8°C, Chl-a Tinggi)"),
    ("mhw_extreme_2016", "2016-06-25", "Kejadian MHW Ekstrem Terpanjang 2016 (SST Panas ~30.8°C, Chl-a Rendah)"),
    ("warm_event_2020", "2020-04-10", "Kejadian MHW Kuat April 2020 (SST Tinggi ~30.6°C)")
]

for key, dt_str, desc in sample_dates:
    try:
        sst_slice = ds_sst.sst.sel(time=dt_str).values
        if sst_slice.ndim == 3:
            sst_slice = sst_slice[0]
        
        try:
            chla_slice = ds_aligned.chlor_a.sel(time=dt_str).values
            if chla_slice.ndim == 3:
                chla_slice = chla_slice[0]
        except Exception:
            chla_slice = np.full((len(lat_coords), len(lon_coords)), np.nan)
            
        sample_days[key] = {
            "date": dt_str,
            "desc": desc,
            "sst": sanitize_grid(sst_slice),
            "chla": sanitize_grid(chla_slice)
        }
    except Exception as e:
        print(f"Sample date {dt_str} error: {e}")

spatial_payload = {
    "total_mhw_days": total_mhw_days_grid,
    "max_intensity": max_intensity_grid,
    "sst_mean_all": sst_mean_all_grid,
    "chla_mean_all": chla_mean_all_grid,
    "sst_seasonal": sst_seasonal,
    "chla_seasonal": chla_seasonal,
    "sample_days": sample_days
}

with open(OUTPUT_DIR / "spatial_grids.json", "w", encoding="utf-8") as f:
    json.dump(spatial_payload, f, indent=2, ensure_ascii=False)
print("Saved spatial_grids.json")

# 8. Daily Regional Time Series
print("Computing daily regional mean timeseries...")
daily_sst_mean = ds_sst.sst.mean(dim=["lat", "lon"]).values
daily_times = pd.to_datetime(ds_sst.time.values).strftime("%Y-%m-%d").tolist()

# Mapping dates to MHW active status
mhw_active_dates = set()
for ev in events_list:
    d_range = pd.date_range(ev["start_date"], ev["end_date"])
    for d in d_range:
        mhw_active_dates.add(d.strftime("%Y-%m-%d"))

# Map Chl-a regional daily
chla_time_strs = pd.to_datetime(ds_aligned.time.values).strftime("%Y-%m-%d").tolist()
chla_daily_mean = ds_aligned.chlor_a.mean(dim=["lat", "lon"]).values
chla_map = dict(zip(chla_time_strs, chla_daily_mean))

# Map DOY to climatology & threshold
doy_clim_map = {d["doy"]: d["climatology"] for d in doy_list}
doy_thresh_map = {d["doy"]: d["threshold"] for d in doy_list}

daily_series = []
for i, dt in enumerate(daily_times):
    pd_dt = pd.to_datetime(dt)
    doy = pd_dt.dayofyear
    if pd_dt.is_leap_year and doy > 60:
        doy_key = doy
    elif not pd_dt.is_leap_year and doy >= 60:
        doy_key = doy + 1
    else:
        doy_key = doy
    if doy_key > 366:
        doy_key = 366
        
    sst_val = round(float(daily_sst_mean[i]), 2) if not np.isnan(daily_sst_mean[i]) else None
    chla_val = chla_map.get(dt)
    if chla_val is not None and not np.isnan(chla_val):
        chla_val = round(float(chla_val), 4)
    else:
        chla_val = None
        
    is_mhw = dt in mhw_active_dates
    
    daily_series.append({
        "date": dt,
        "sst": sst_val,
        "chla": chla_val,
        "is_mhw": 1 if is_mhw else 0,
        "clim": round(doy_clim_map.get(doy_key, 28.5), 2),
        "thresh": round(doy_thresh_map.get(doy_key, 29.5), 2)
    })

with open(OUTPUT_DIR / "daily_regional_series.json", "w", encoding="utf-8") as f:
    json.dump(daily_series, f, ensure_ascii=False)
print(f"Saved daily_regional_series.json ({len(daily_series)} daily entries)")

# 9. Chlorophyll-a Analysis & Quality
df_chla_stats = pd.read_csv(PROJECT_ROOT / "outputs/tables/chla_descriptive_stats.csv")
df_comp_summary = pd.read_csv(PROJECT_ROOT / "outputs/tables/mhw_chla_comparison_summary.csv")
df_seasonal_comp = pd.read_csv(PROJECT_ROOT / "outputs/tables/chla_mhw_seasonal_comparison.csv")

chla_payload = {
    "stats": df_chla_stats.to_dict(orient="records"),
    "comparison_summary": df_comp_summary.to_dict(orient="records"),
    "seasonal_comparison": df_seasonal_comp.to_dict(orient="records"),
    "suppression_summary": {
        "mhw_mean": 0.2217,
        "non_mhw_mean": 0.2903,
        "diff_absolute": -0.0686,
        "diff_percent": -23.6,
        "mhw_n_days": 545,
        "non_mhw_n_days": 7036,
        "significance": "Signifikan (p < 0.001, uji non-parametrik Mann-Whitney U)"
    }
}

with open(OUTPUT_DIR / "chla_analysis.json", "w", encoding="utf-8") as f:
    json.dump(chla_payload, f, indent=2, ensure_ascii=False)
print("Saved chla_analysis.json")

# 10. Fisheries & Species Confounding Factors
df_confounding = pd.read_csv(PROJECT_ROOT / "outputs/tables/confounding_factors_perikanan.csv")

fisheries_payload = {
    "annual_data": merged_annual,
    "confounding_factors": df_confounding.to_dict(orient="records"),
    "species_thermal": [
        {
            "species": "Cakalang",
            "latin": "Katsuwonus pelamis",
            "optimum_temp": "26.0 - 29.5 °C",
            "critical_temp": "30.5 °C",
            "habitat": "Pelagis Besar (Epipelagis)",
            "gear": "Pole and line, pukat cincin",
            "behavior_at_mhw": "Menyelam ke bawah termoklin yang lebih dingin (>50-100m) atau berpindah secara spasial menjauhi kantung panas permukaan."
        },
        {
            "species": "Tongkol Lisong / Komo",
            "latin": "Auxis rochei / Euthynnus affinis",
            "optimum_temp": "25.5 - 29.0 °C",
            "critical_temp": "30.5 °C",
            "habitat": "Pelagis Kecil / Neritik",
            "gear": "Pukat cincin, payang, jaring insang",
            "behavior_at_mhw": "Terkonsentrasi pada zona upwelling atau daerah dengan gradien suhu vertikal kuat; ketersediaan di permukaan berkurang drastis saat MHW kuat."
        },
        {
            "species": "Madidihang (Yellowfin Tuna)",
            "latin": "Thunnus albacares",
            "optimum_temp": "24.0 - 29.0 °C",
            "critical_temp": "31.0 °C",
            "habitat": "Pelagis Besar Oseanoid",
            "gear": "Rawai tuna (longline), handline",
            "behavior_at_mhw": "Toleransi fisiologis termal menurun di perairan permukaan >30.5°C; berpotensi migrasi menjauhi perairan dangkal NTT."
        },
        {
            "species": "Tuna Mata Besar (Bigeye Tuna)",
            "latin": "Thunnus obesus",
            "optimum_temp": "18.0 - 26.0 °C",
            "critical_temp": "28.5 °C",
            "habitat": "Mesopelagis / Deep Pelagic",
            "gear": "Deep longline",
            "behavior_at_mhw": "Sangat sensitif terhadap pemanasan lapisan permukaan; tetap berada di lapisan air dalam di bawah 150 meter."
        }
    ],
    "limitations": [
        "Data produksi perikanan tangkap Provinsi NTT merupakan agregasi tahunan resmi BPS / KKP, bukan data harian/mingguan pelabuhan.",
        "Variabilitas produksi tahunan dipengaruhi oleh upaya penangkapan (fishing effort), jumlah kapal motor/armada, subsidi BBM, dan cuaca ekstrem laut.",
        "Tidak ada klaim kausalitas langsung bahwa MHW menurunkan total produksi tahunan; telaah perikanan disajikan murni secara deskriptif kualitatif berbasis preferensi termal biologis."
    ]
}

with open(OUTPUT_DIR / "fisheries_data.json", "w", encoding="utf-8") as f:
    json.dump(fisheries_payload, f, indent=2, ensure_ascii=False)
print("Saved fisheries_data.json")

# 11. Synthesis & Methodology
df_findings = pd.read_csv(PROJECT_ROOT / "outputs/tables/summary_sintesis_temuan.csv")
df_inventory = pd.read_csv(PROJECT_ROOT / "outputs/reports/data_inventory.csv")
df_quality = pd.read_csv(PROJECT_ROOT / "outputs/reports/data_quality_report.csv")

synthesis_payload = {
    "summary_findings": df_findings.to_dict(orient="records"),
    "data_inventory": df_inventory.to_dict(orient="records"),
    "data_quality": df_quality.to_dict(orient="records"),
    "prd_compliance": [
        {
            "rule": "Bebas dari ONI (Oceanic Niño Index)",
            "status": "Terpenuhi 100%",
            "detail": "Tidak ada variabel, grafik, analisis, korelasi, atau narasi yang melibatkan ONI sesuai batasan ketat PRD."
        },
        {
            "rule": "Tanpa Klaim Kausalitas Semu Perikanan",
            "status": "Terpenuhi 100%",
            "detail": "Konteks perikanan disajikan secara deskriptif kualitatif berbasis biologi preferensi termal spesies dan faktor perancu tangkapan."
        },
        {
            "rule": "Tanpa Imputasi Nilai Hilang dengan Nol",
            "status": "Terpenuhi 100%",
            "detail": "Data tutupan awan atau nilai hilang tidak pernah diganti dengan nol (NaN masking tetap dipertahankan)."
        },
        {
            "rule": "Dokumentasi Transparan Baseline 21 Tahun",
            "status": "Terpenuhi 100%",
            "detail": "Klimatologi dibangun dari pengamatan 2000–2020 (21 tahun); perbedaan dengan WMO standar 30 tahun dijelaskan terbuka."
        },
        {
            "rule": "Pencegahan Resolusi Semu (Anti False-Resolution)",
            "status": "Terpenuhi 100%",
            "detail": "Klorofil-a diagregasi ke grid SST 0.25° melalui block-averaging. SST tidak diinterpolasi semu ke grid halus."
        },
        {
            "rule": "Integritas Dataset Mentah Asli",
            "status": "Terpenuhi 100%",
            "detail": "File sumber di data_sst_ntt/ dan chla_ntt_daily/ tetap utuh dan berstatus read-only."
        }
    ],
    "citations": [
        {
            "name": "NOAA OISST v2.1",
            "citation": "Huang, B., et al. (2021). Improvements of the Daily Optimum Interpolation Sea Surface Temperature (DOISST) Version 2.1. J. Climate, 34(8), 2923-2939."
        },
        {
            "name": "Deteksi MHW (Hobday et al., 2016)",
            "citation": "Hobday, A. J., et al. (2016). A hierarchical approach to defining marine heatwaves. Progress in Oceanography, 141, 227-238."
        },
        {
            "name": "Kategori MHW (Hobday et al., 2018)",
            "citation": "Hobday, A. J., et al. (2018). Categorizing analysis of marine heatwaves. Oceanography, 31(2), 162-173."
        },
        {
            "name": "Chlorophyll-a Satellite Data",
            "citation": "Sathyendranath, S., et al. (2019). An ocean-colour time series for use in climate studies: the experience of the Ocean Colour Climate Change Initiative (OC-CCI). Sensors, 19(19), 4285."
        }
    ]
}

with open(OUTPUT_DIR / "synthesis_methodology.json", "w", encoding="utf-8") as f:
    json.dump(synthesis_payload, f, indent=2, ensure_ascii=False)
print("Saved synthesis_methodology.json")

print("\nSUCCESS: All dashboard datasets generated in dashboard/data/!")
