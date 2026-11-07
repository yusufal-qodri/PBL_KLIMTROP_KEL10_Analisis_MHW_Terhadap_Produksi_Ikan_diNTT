"""
build_spatial_catalog_data.py
=============================
Menjadikan katalog kejadian MHW berbasis spasial (per grid, >=15% luas perairan NTT, >=5 hari)
sebagai katalog utama dashboard. Katalog berbasis rata-rata SST regional (43 kejadian,
mhw_events.json) tetap disimpan sebagai metode pembanding.

Pakai (opsional, hanya jika katalog spasial berubah):
    python dashboard/tools/build_spatial_catalog_data.py            # dijalankan dari folder utama proyek
    python dashboard/tools/build_spatial_catalog_data.py <folder_proyek>

Masukan : data/processed/mhw_events_spatial_catalog_ntt.csv (atau outputs/tables/...)
Keluaran: dashboard/data/mhw_events_spatial.json, serta pembaruan
          daily_regional_series.json (+is_mhw_spatial), annual_summary.json, fisheries_data.json,
          chla_analysis.json (perbandingan MHW vs non-MHW dihitung ulang dengan katalog spasial;
          hasil lama disimpan di 'reference_regional_mean').
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

DASH = Path(__file__).resolve().parents[1]
ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else DASH.parent
DATA = DASH / "data"

def rd(n):
    return json.loads((DATA / n).read_text(encoding="utf-8").replace("NaN", "null"))

def wr(n, obj):
    (DATA / n).write_text(json.dumps(obj, ensure_ascii=False), encoding="utf-8")

cands = [ROOT / "data/processed/mhw_events_spatial_catalog_ntt.csv", ROOT / "outputs/tables/mhw_events_spatial_catalog_ntt.csv"]
src = next((p for p in cands if p.exists()), None)
if src is None:
    sys.exit("Katalog spasial tidak ditemukan: " + ", ".join(map(str, cands)))
cat = pd.read_csv(src)
events = [{
    "event_id": int(r.regional_event_id), "start_date": r.start_date, "end_date": r.end_date, "peak_date": r.peak_date,
    "duration": int(r.duration_days), "peak_extent_pct": float(r.peak_extent_pct), "mean_extent_pct": float(r.mean_extent_pct),
    "i_max": float(r.i_max_regional), "i_mean": float(r.i_mean_regional), "i_cum": float(r.cum_intensity_regional),
    "year": int(str(r.start_date)[:4])} for r in cat.itertuples()]
wr("mhw_events_spatial.json", events)
print(f"{len(events)} kejadian spasial ditulis")

# ---- hari MHW regional (union tanggal kejadian)
days = set()
for e in events:
    days.update(pd.date_range(e["start_date"], e["end_date"]).strftime("%Y-%m-%d"))
series = rd("daily_regional_series.json")
for x in series:
    x["is_mhw_spatial"] = x["date"] in days
wr("daily_regional_series.json", series)

# ---- ringkasan tahunan
per_year = {}
for e in events:
    for d in pd.date_range(e["start_date"], e["end_date"]):
        per_year.setdefault(d.year, set()).add(e["event_id"])
ycount = {y: sum(1 for d in days if d.startswith(str(y))) for y in range(2000, 2021)}
for name in ("annual_summary.json", "fisheries_data.json"):
    obj = rd(name)
    rows = obj if isinstance(obj, list) else obj["annual_data"]
    for r in rows:
        r["mhw_events_spatial"] = len(per_year.get(r["year"], ()))
        r["mhw_days_spatial"] = ycount.get(r["year"], 0)
    wr(name, obj)

# ---- Chlorophyll a: MHW vs non-MHW dengan katalog spasial
df = pd.DataFrame(series)
df["date"] = pd.to_datetime(df["date"])
df["doy"] = df["date"].dt.dayofyear
df["mhw"] = df["is_mhw_spatial"]
ok = df.dropna(subset=["chla"]).copy()
base = ok[~ok["mhw"]]
clim = np.full(367, np.nan)
for d in range(1, 367):
    dist = np.minimum(abs(base["doy"] - d), 366 - abs(base["doy"] - d))
    v = base.loc[dist <= 15, "chla"]
    if len(v):
        clim[d] = v.mean()
ok["anom"] = ok["chla"] - clim[ok["doy"].values]
M, N = ok[ok["mhw"]], ok[~ok["mhw"]]
iqr = lambda s: float(s.quantile(.75) - s.quantile(.25))
r4 = lambda v: round(float(v), 4)
summary = [{"Kondisi": k, "N_Hari": int(len(g)), "Chla_Mean": r4(g.chla.mean()), "Chla_Median": r4(g.chla.median()), "Chla_Std": r4(g.chla.std()),
            "Chla_IQR": r4(iqr(g.chla)), "Anomali_Mean": r4(g.anom.mean()), "Anomali_Median": r4(g.anom.median())} for k, g in (("MHW", M), ("Non-MHW", N))]
seasons = [("DJF (Monsun Barat)", [12, 1, 2]), ("MAM (Peralihan I)", [3, 4, 5]), ("JJA (Monsun Timur / Upwelling)", [6, 7, 8]), ("SON (Peralihan II)", [9, 10, 11])]
seas = []
for name, ms in seasons:
    a, b = M[M.date.dt.month.isin(ms)], N[N.date.dt.month.isin(ms)]
    p = float(stats.mannwhitneyu(a.chla, b.chla, alternative="two-sided").pvalue) if len(a) and len(b) else None
    seas.append({"Musim": name, "N_MHW": int(len(a)), "N_NonMHW": int(len(b)), "Chla_Median_MHW": r4(a.chla.median()), "Chla_Median_NonMHW": r4(b.chla.median()),
                 "Anomali_Median_MHW": r4(a.anom.median()), "Anomali_Median_NonMHW": r4(b.anom.median()), "p_value": p})
p_all = float(stats.mannwhitneyu(M.chla, N.chla, alternative="two-sided").pvalue)
sig = "Signifikan (p < 0.001, uji non-parametrik Mann-Whitney U)" if p_all < 0.001 else (f"p = {p_all:.3f} (Mann-Whitney U)")
sup = {"mhw_mean": r4(M.chla.mean()), "non_mhw_mean": r4(N.chla.mean()), "diff_absolute": r4(M.chla.mean() - N.chla.mean()),
       "diff_percent": round(float((M.chla.mean() - N.chla.mean()) / N.chla.mean() * 100), 1), "mhw_n_days": int(len(M)), "non_mhw_n_days": int(len(N)), "significance": sig}
ca = rd("chla_analysis.json")
if "reference_regional_mean" not in ca:
    ca["reference_regional_mean"] = {k: ca[k] for k in ("comparison_summary", "seasonal_comparison", "suppression_summary")}
ca.update({"comparison_summary": summary, "seasonal_comparison": seas, "suppression_summary": sup,
           "basis": "Katalog kejadian regional spasial (per grid, >=15% luas laut). Dihitung ulang dari deret harian rata-rata regional Chlorophyll a."})
wr("chla_analysis.json", ca)
print("MHW:", sup["mhw_n_days"], "hari | non-MHW:", sup["non_mhw_n_days"], "| selisih", sup["diff_percent"], "% |", sig)
