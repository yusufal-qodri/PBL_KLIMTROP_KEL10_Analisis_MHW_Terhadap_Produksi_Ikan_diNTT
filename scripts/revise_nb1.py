import json
from pathlib import Path

nb_path = Path("notebooks/01_Persiapan_dan_Penggabungan_Data.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Update Cell 0: Framework Metodologis Lengkap
cell_0_text = """# Notebook 1 — Persiapan, Inventarisasi, dan Penggabungan Data Oseanografi NTT (2000–2020)

**Proyek:** Analisis Spatiotemporal Marine Heatwaves (MHW), Klorofil-a, dan Konteks Perikanan Tangkap Provinsi Nusa Tenggara Timur  
**Dokumen Rujukan Metodologis:** `REVISI_PBL.md` & Standar Hobday et al. (2016, 2018)

---

## 1. Landasan dan Batasan Metodologis (Methodological Framework)

1. **Pemilihan Periode Baseline 2000–2020 (21 Tahun):**
   - Standar Organisasi Meteorologi Dunia (WMO) umumnya merekomendasikan periode klimatologi 30 tahun.
   - Namun, konsensus ilmiah deteksi Marine Heatwave terkini (Hobday et al., 2016; Oliver et al., 2018) secara eksplisit menetapkan bahwa baseline 20–30 tahun dapat diterima dan valid secara saintifik ketika kajian melibatkan data satelit multi-sensor modern.
   - Pada penelitian ini, periode 2000–2020 (21 tahun) dipilih secara konsisten untuk menyelaraskan ketersediaan deret waktu suhu permukaan laut harian (NOAA OISST v2.1) dengan era observasi satelit klorofil-a (MODIS-Aqua / Ocean Colour CCI v6.0 yang dimulai pertengahan 2002) serta ketersediaan data statistik perikanan tangkap resmi BPS Provinsi NTT (2000–2020).

2. **Domain Geografis dan Resolusi Grid Spasial:**
   - Wilayah studi mencakup perairan Provinsi Nusa Tenggara Timur (8.0°LS – 12.0°LS, 118.0°BT – 125.0°BT).
   - Grid SST harian beresolusi 0.25° × 0.25° (24 grid lintang × 40 grid bujur = 960 titik sel total, di mana 884 sel laut dianalisis dan 76 sel darat NTT dimasker secara permanen).

3. **Integritas Observasi dan Penanganan Nilai Hilang (Missing Values):**
   - Data klorofil-a (~4 km) diselaraskan ke grid 0.25° OISST melalui teknik *conservative block-averaging*.
   - Nilai hilang akibat tutupan awan monsun barat dipertahankan secara transparan sebagai `NaN` (tidak ada pengisian nol sintetis/palsu).

4. **Batasan Ruang Lingkup (Scope Boundaries):**
   - Analisis difokuskan murni pada dinamika termal lokal dan respon biogeokimia klorofil di perairan NTT. Indeks osilasi iklim global makro seperti Oceanic Niño Index (ONI / ENSO) dan DMI (IOD) dikecualikan untuk menjaga ketajaman fokus spasial regional.
   - Integrasi data produksi perikanan tangkap tahunan BPS dibatasi sebagai interpretasi kesesuaian habitat termal spesies (*thermal ecological niche*) dan matriks faktor perancu, tanpa menarik klaim kausalitas langsung yang keliru.

---

## 2. Alur Kerja Notebook 1
1. Verifikasi konfigurasi dan path repositori terpusat (`config/project_config.py`).
2. Inventarisasi dan verifikasi kelengkapan file NetCDF tahunan NOAA OISST v2.1 (2000–2020).
3. Penggabungan deret waktu SST harian kontinu (7.671 hari observasi).
4. Inventarisasi dan ekstraksi data harian klorofil-a (ESA CCI OC v6.0).
5. Verifikasi dataset pendukung (data statistik perikanan tangkap BPS NTT).
6. Pembuatan laporan inventaris dan validasi kualitas data.
"""

nb["cells"][0]["source"] = [line + "\n" for line in cell_0_text.split("\n")]
if nb["cells"][0]["source"]:
    nb["cells"][0]["source"][-1] = nb["cells"][0]["source"][-1].rstrip("\n")

# Update Cell 30: Deteksi data tangkapan ikan agar mengenali cfg.CATCH_DATA_FILE
cell_30_text = """# Pemeriksaan data tangkapan ikan
print("Pemeriksaan Data Tangkapan Ikan BPS Provinsi NTT")
print("=" * 60)

catch_found = False
catch_dirs = [
    cfg.CATCH_DIR,
    cfg.DATA_DIR / "catch",
    cfg.DATA_DIR / "raw" / "catch",
    cfg.DATA_DIR / "tangkapan",
    cfg.PROCESSED_DIR
]

catch_files = []
for d in catch_dirs:
    if d.exists():
        for ext in ["*.csv", "*.xlsx", "*.xls"]:
            for f in d.glob(ext):
                if "perikanan" in f.name.lower() or "tangkap" in f.name.lower() or "catch" in f.name.lower():
                    if f not in catch_files:
                        catch_files.append(f)

if cfg.CATCH_DATA_FILE.exists() and cfg.CATCH_DATA_FILE not in catch_files:
    catch_files.append(cfg.CATCH_DATA_FILE)

if catch_files:
    print(f"File data tangkapan terverifikasi: {len(catch_files)}")
    for cf in catch_files:
        print(f"  ✅ {cf.name} ({cf.stat().st_size / 1024:.1f} KB)")
    catch_found = True
else:
    print("ℹ️ Tidak ada file data tangkapan ditemukan.")
    print("  Data tangkapan digunakan pada Notebook 6.")
"""

nb["cells"][30]["source"] = [line + "\n" for line in cell_30_text.split("\n")]
if nb["cells"][30]["source"]:
    nb["cells"][30]["source"][-1] = nb["cells"][30]["source"][-1].rstrip("\n")

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print("Notebook 01 updated successfully.")

