# NTT Marine Insight - Dashboard (revisi)

Jalankan dari folder utama proyek (yang berisi `dashboard/` dan `run_dashboard.py`):

    python run_dashboard.py

Dashboard statis (HTML + JS + JSON), tanpa CDN: Chart.js sudah ada di `vendor/`, peta digambar langsung di canvas
dengan garis pantai `data/ntt_coastline.geojson`.

## Halaman (sidebar)
| Menu | Isi |
|---|---|
| Beranda | 5 kejadian MHW terlama; peta MHW terkuat dan peta Chlorophyll a pada periode yang sama |
| Sebaran Data | skala Harian/Mingguan/Bulanan/Tahunan/Dekadal + statistik (rata-rata, maks, min, median, std); peta SST dan Chlorophyll a mentah, histogram, rentang tanggal |
| Peta Kejadian MHW | pilih dari semua 43 kejadian; pilih tahun -> peta semua kejadian di tahun itu + penjelasan jumlah hari MHW |
| Chlorophyll a vs MHW | peta MHW dan Chlorophyll a pada periode tiap kejadian, dampak per kejadian, ringkasan Mann-Whitney |
| MHW vs Non-MHW | 4 peta/grafik: saat MHW vs tanggal sama pada tahun tanpa MHW |
| SST, Chlorophyll a | bulanan, tahunan, musiman (DJF/MAM/JJA/SON), dekadal + tabel statistik |
| Produksi Ikan, Sintesis Hasil, Metodologi | konteks perikanan (deskriptif), galeri figur, pipeline dan kepatuhan PRD |

## Dua mode data
1. **Mode terbatas (default, data yang sudah ada di repo).** Peta tahunan, bulanan, musiman, dekadal, semua grafik regional,
   tabel, dan statistik memakai data asli. Peta harian/mingguan dan peta per kejadian hanya untuk 4 hari contoh
   (`spatial_grids.json -> sample_days`). Statistik selain rata-rata dinonaktifkan.
2. **Data pack harian (penuh).** Jalankan sekali di komputer yang menyimpan NetCDF `data/processed/*.nc`:

        python dashboard/tools/build_daily_grids.py

   Hasil di `dashboard/data/grids/` (~40-50 MB). Banner mode terbatas hilang dan semua peta/statistik aktif.
   Nilai hilang (awan/daratan) tidak pernah diganti nol (diarsir abu-abu pada peta).

## Catatan perubahan data
- `data/synthesis_methodology.json`: 757 nilai `NaN` diganti `null` (JSON dengan `NaN` tidak valid di browser).
- Jumlah kejadian mengikuti `mhw_events.json` (43 kejadian, 589 hari MHW).
