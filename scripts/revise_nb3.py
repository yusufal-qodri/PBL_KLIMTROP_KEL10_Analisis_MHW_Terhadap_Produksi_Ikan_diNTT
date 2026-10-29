import json
from pathlib import Path

nb_path = Path("notebooks/03_Analisis_Chlorophyll_a.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Update Cell 0: Landasan Metodologis Klorofil-a
cell_0_text = """# Notebook 3 — Analisis Karakteristik Temporal dan Spasial Chlorophyll-a di Perairan NTT

**Proyek:** Analisis Spatiotemporal Marine Heatwaves (MHW), Klorofil-a, dan Konteks Perikanan Tangkap Provinsi Nusa Tenggara Timur  
**Dokumen Rujukan Metodologis:** `REVISI_PBL.md`

---

## 1. Landasan Metodologis dan Integritas Data Klorofil-a

1. **Resolusi dan Sensor Satelit:**
   - Menggunakan dataset ESA CCI Ocean Colour v6.0 / MODIS-Aqua daily merged product (~4 km, 0.0416°).
   - Observasi operasional kontinu multi-sensor tersedia mulai Juli 2002 hingga Desember 2020.
2. **Preservasi Nilai Hilang (Zero-Filling Prevention):**
   - Area perairan yang tertutup awan monsun (terutama pada periode Monsun Barat / DJF) dipertahankan sebagai `NaN`.
   - **Ketentuan Mutlak:** Tidak ada pengisian sintetis nilai nol (`0.0`) pada sel grid tanpa data, karena nilai nol akan mengacaukan rata-rata biologis dan memberikan ilusi anomali negatif ekstrem palsu.
3. **Penyelarasan Spasial (Regridding Strategy):**
   - Data resolusi ~4 km diselaraskan dengan grid 0.25° OISST melalui pendekatan *conservative block-averaging* di Notebook 4 untuk menjaga konservasi fluks massa pigmen fitoplankton.
4. **Dokumentasi Tutupan Observasi (Pixel Coverage Ratio):**
   - Setiap analisis deret waktu dan komposit spasial wajib melaporkan persentase piksel laut yang memiliki data valid (*valid observation percentage*).
"""

nb["cells"][0]["source"] = [line + "\n" for line in cell_0_text.split("\n")]
if nb["cells"][0]["source"]:
    nb["cells"][0]["source"][-1] = nb["cells"][0]["source"][-1].rstrip("\n")

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print("Notebook 03 updated successfully.")

