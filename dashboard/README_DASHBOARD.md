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
| Peta Kejadian MHW | pilih dari semua 56 kejadian regional (katalog spasial); pilih tahun -> peta semua kejadian di tahun itu + penjelasan jumlah hari MHW |
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
- **Katalog utama = 56 kejadian regional berbasis spasial** (`data/mhw_events_spatial.json`, dari
  `mhw_events_spatial_catalog_ntt.csv`): deteksi MHW per grid (P90 musiman, >=5 hari, jeda <=2 hari); satu kejadian regional
  dicatat bila >=15% luas perairan laut NTT berstatus MHW serentak. Satu sel MHW yang berdiri sendiri tetap dipetakan,
  tetapi bukan kejadian regional.
- Katalog 43 kejadian berbasis rata-rata SST regional (`data/mhw_events.json`) **disimpan sebagai metode pembanding**
  dan hanya tampil di halaman Metodologi/Sintesis (ekspor CSV).
- `chla_analysis.json`: perbandingan Chlorophyll a MHW vs non-MHW dihitung ulang dengan katalog spasial
  (975 hari MHW vs 6.606 hari non-MHW; hasil lama disimpan di `reference_regional_mean`).
- `daily_regional_series.json` (+`is_mhw_spatial`), `annual_summary.json` dan `fisheries_data.json`
  (+`mhw_events_spatial`, `mhw_days_spatial`) diperbarui. Semua dapat dibuat ulang dengan
  `python dashboard/tools/build_spatial_catalog_data.py`.
- Katalog spasial tidak punya kolom kategori (I-IV), jadi kategori tidak ditampilkan; yang ditampilkan adalah
  cakupan puncak/rata-rata (% luas laut) dan intensitas.

## Pemecahan masalah
- **Peta kosong padahal "Data pack harian aktif"**: pack dibuat dengan script lama (stempel waktu NetCDF jam 12:00 tidak cocok).
  Pakai `tools/build_daily_grids.py` terbaru dan jalankan ulang. Dashboard sekarang mendeteksi pack kosong dan menampilkan
  banner "Data pack bermasalah".
- **Arsir abu-abu pada peta** = sel tanpa data (mis. tertutup awan), bukan nol. Pada peta MHW, sel yang tidak mengalami MHW
  diberi warna paling pucat (0), tidak diarsir.

## Analisis per grid (versi ini)
Semua perbandingan MHW vs non-MHW dihitung **per sel 0.05 derajat (~5 km, Copernicus)**, bukan dari rata-rata regional.

Definisi (agar tidak ada hari non-MHW yang terhitung MHW):
- **Hari MHW sel** = SST > P90 sel itu, pada hari yang menjadi anggota kejadian (aturan `detect_mhw.py`).
- **Hari jeda sel** = anggota kejadian tetapi SST <= P90 (digabung karena jeda <= 2 hari). **Bukan hari MHW**;
  dikeluarkan dari kelompok MHW maupun non-MHW.
- **Hari MHW regional** = >= 15% sel laut berstatus anggota kejadian. **Hari jeda regional** = hari di dalam kejadian
  regional dengan cakupan < 15% (bagian kejadian, bukan hari MHW).
- **Hari non-MHW sel** = bukan anggota kejadian pada sel itu.

Cara membuat (sekali, di komputer yang menyimpan `data/processed/*.nc`):

    python dashboard/tools/build_daily_grids.py     # membuat data pack + analisis per grid

`build_daily_grids.py` versi ini memakai aturan deteksi per sel yang identik dengan `detect_mhw_events_1d`
(jeda <= 2 hari digabung hanya bila SST jeda > klimatologi; diuji pada 60 deret acak, 0 beda).
**Jalankan ulang walau data pack lama sudah ada**, karena mask MHW lama menggabungkan jeda tanpa syarat klimatologi.
Analisis saja (tanpa NetCDF, dari data pack yang ada): `python dashboard/tools/grid_analysis.py`.

Keluaran `dashboard/data/analysis/`:
`daily_extent.json` (cakupan harian), `catalog_check.json` (pemeriksaan katalog: hari MHW regional vs hari jeda,
deteksi ulang vs katalog), `grid_stats.json` (per sel: anomali Chlorophyll a saat MHW, Mann-Whitney U, koreksi FDR,
per musim), `pooled.json`, `event_grid_stats.json`.

Perubahan tampilan: grafik "Cakupan MHW harian" (per grid, garis ambang 15%) menggantikan grafik SST regional yang
dulu diberi warna merah pada periode katalog; pita biru = hari MHW regional, pita kuning = hari jeda.
Grafik SST rata-rata regional tetap ada hanya sebagai konteks dan tidak lagi menandai hari MHW.
Peta Chlorophyll a kejadian hanya menghitung sel-hari MHW; sel tanpa MHW berwarna krem (bukan tanpa data).

## Menu dan tampilan (revisi terbaru)
- Sidebar: **Utama** (Beranda), **Analisis** (Peta Kejadian MHW dengan 3 sub-menu, Chlorophyll a vs MHW, MHW vs Non-MHW, SST, Chlorophyll a),
  **Lainnya** (Sebaran Data, Produksi Ikan, Sintesis Hasil, Metodologi).
- Peta Kejadian MHW punya 3 sub-halaman dengan tata letak yang sama (pilih kejadian -> peta + detail + grafik; pilih tahun -> peta tahun + penjelasan):
  1. **Intensitas maks.**: intensitas MHW maksimum per grid.
  2. **Anomali SST**: per grid, anomali = rata-rata SST pada periode kejadian (mis. 26-30 Jun 2000) dikurangi rata-rata SST pada tanggal
     kalender yang sama (26-30 Jun) selama 2000-2020 pada grid itu. Dihitung untuk seluruh hari periode kejadian dan seluruh grid
     (setara dengan rata-rata anomali harian: SST hari itu dikurangi rata-rata 21 tahun pada hari-ke-tahun yang sama).
     Pilihan: rata-rata selama kejadian atau maksimum harian. Peta tahun memakai hari-hari kejadian regional pada tahun itu.
  3. **Durasi kejadian**: durasi beruntun terpanjang per grid (anggota kejadian, aturan Hobday) atau jumlah hari di atas P90.
  Pilihan kejadian dan tahun dipertahankan saat berpindah antar sub-halaman.
- Setiap grafik dan peta punya tombol **Perbesar** (zoom; grafik deret waktu bisa di-zoom dengan roda mouse atau tombol +/-/geser)
  dan **Tab baru** (gambar PNG resolusi tinggi). Di layar sentuh tombol selalu terlihat.
- Tombol menu (tiga garis) selalu terlihat di kiri atas, juga saat menu terbuka di ponsel (berubah jadi tanda x; klik area gelap menutup menu).

Peta anomali SST membutuhkan klimatologi harian per grid (`data/grids/sst_daymean_doy.bin`). File ini dibuat oleh
`python dashboard/tools/grid_analysis.py` (dari data pack yang sudah ada, tanpa NetCDF) dan otomatis oleh `build_daily_grids.py`.
