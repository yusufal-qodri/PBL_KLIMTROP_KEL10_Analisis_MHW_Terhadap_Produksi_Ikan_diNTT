# PRD — Pipeline Analisis SST, Marine Heatwave (MHW), dan Chlorophyll-a di Perairan NTT

**Dokumen eksekusi untuk Antigravity**  
**Periode target SST:** 1 Januari 2000–31 Desember 2020.  
**Periode chlorophyll-a:** mengikuti cakupan data aktual yang berhasil diverifikasi.  
**Luaran:** enam Jupyter Notebook yang terhubung, dataset olahan, laporan kualitas data, visualisasi, dan tabel ringkasan.

---

## 1. Instruksi utama

Bangun pipeline penelitian berbasis Python dan Jupyter Notebook untuk menganalisis Sea Surface Temperature (SST), mendeteksi Marine Heatwave (MHW), menganalisis chlorophyll-a, membandingkan pola MHW dan chlorophyll-a secara hati-hati, serta menyusun interpretasi kualitatif bersama data tangkapan tongkol dan cakalang jika data tangkapan tersedia.

**Kerjakan Notebook 1 terlebih dahulu.** Inspeksi file dan validasi struktur data sebelum membuat asumsi atau menjalankan analisis. Setelah Notebook 1 selesai dan hasilnya diverifikasi, berhenti dan laporkan statusnya. Jangan membuat seluruh enam notebook sekaligus sebelum struktur input dan keluaran Notebook 1 dipastikan.

Notebook harus ditulis dalam Bahasa Indonesia yang natural, jelas, dan mudah diikuti anggota kelompok. Setiap notebook wajib memiliki tujuan, instruksi, alasan metode, langkah kerja, keluaran yang diharapkan, evaluasi keberhasilan, serta keterbatasan.

## 2. Tujuan dan batasan penelitian

### Tujuan
1. Menyiapkan dan memvalidasi data SST harian di wilayah studi NTT untuk periode 2000–2020.
2. Mendeteksi dan mendeskripsikan kejadian MHW menggunakan metode yang terdokumentasi.
3. Mendeskripsikan variasi spasial dan temporal chlorophyll-a berdasarkan cakupan aktual.
4. Membandingkan pola chlorophyll-a pada kondisi MHW dan non-MHW dengan penyelarasan waktu dan ruang yang transparan.
5. Menghasilkan peta, grafik, dan tabel yang siap digunakan dalam laporan kelompok.
6. Menginterpretasikan hasil oseanografi secara deskriptif bersama data tangkapan tongkol dan cakalang jika tersedia.

### Batasan wajib
- **Jangan menggunakan ONI.** Jangan menambahkan ONI ke kode, variabel, grafik, analisis, atau narasi.
- Jangan membuat klaim bahwa MHW atau chlorophyll-a menyebabkan perubahan tangkapan ikan.
- Data tangkapan hanya digunakan untuk konteks deskriptif/kualitatif, bukan korelasi kuantitatif yang tidak direncanakan.
- Jangan mengganti missing value dengan nol.
- Jangan mengarang cakupan tanggal, variabel, unit, angka hasil, atau metadata.
- Jangan menganggap batas administrasi kabupaten/kota sebagai batas laut atau batas ekosistem.
- Jangan mengklaim SST memiliki resolusi 4 km hanya karena diinterpolasi ke grid chlorophyll-a.
- Jangan menimpa atau menghapus data mentah.

## 3. Data awal dan asumsi yang harus diverifikasi

### SST
- Sumber rencana: NOAA OISST v2.1 daily AVHRR.
- URL: https://www.ncei.noaa.gov/data/sea-surface-temperature-optimum-interpolation/v2.1/access/avhrr/
- Resolusi sumber sekitar 0,25°; verifikasi metadata file yang digunakan.
- Periode target 2000–2020.
- Batas awal yang pernah digunakan: longitude 117,5°–127,5° BT dan latitude 13° LS–7° LS. Jadikan parameter yang mudah diubah dan minta konfirmasi jika batas ini belum dipastikan.
- File dapat berupa NetCDF tahunan. Jangan mengasumsikan nama variabel atau dimensi sebelum memeriksa file.

### Chlorophyll-a
- Data yang tersedia disebut berupa ZIP bulanan yang berisi NetCDF harian.
- Periode yang diinginkan 2000–2020, tetapi ketersediaan aktual mungkin baru dimulai Januari 2003. Notebook 1 wajib memeriksa tanggal awal dan akhir yang benar-benar ada.
- Resolusi sumber diperkirakan sekitar 4 km; verifikasi dari metadata.
- Pertahankan data harian pada tahap persiapan. Agregasi bulanan hanya dilakukan di notebook analisis bila ada alasan yang jelas.
- Tangani fill value, mask, dan unit berdasarkan metadata.

### SHP
- Data yang tersedia berupa batas administrasi kabupaten/kota.
- SHP bersifat opsional untuk overlay peta, bukan syarat analisis numerik.
- Periksa CRS, geometri, atribut, dan cakupan. Jika mengganggu keterbacaan pola laut, jangan tampilkan pada peta utama.
- SHP tidak menggantikan garis pantai dan tidak menentukan batas analisis laut.

### Data tangkapan
- Spesies yang dibahas hanya tongkol dan cakalang.
- Periksa sumber, tahun, satuan, cakupan wilayah, definisi produksi/tangkapan, dan missing value.
- Jika data tidak tersedia atau metadata tidak cukup, dokumentasikan keterbatasannya dan jangan membuat data pengganti.

## 4. Struktur folder yang disarankan

Pertahankan struktur folder yang sudah ada jika kelompok memiliki struktur sendiri. Jangan memindahkan data mentah secara otomatis.

```text
MHW_NTT/
├── data/
│   ├── raw/
│   │   ├── sst/
│   │   ├── chlorophyll_a_zip/
│   │   ├── chlorophyll_a_nc/
│   │   ├── catch/
│   │   └── shp/
│   ├── interim/
│   └── processed/
├── notebooks/
│   ├── 01_Persiapan_dan_Penggabungan_Data.ipynb
│   ├── 02_Analisis_SST_dan_Deteksi_MHW.ipynb
│   ├── 03_Analisis_Chlorophyll_a.ipynb
│   ├── 04_Analisis_Gabungan_MHW_dan_Chlorophyll_a.ipynb
│   ├── 05_Visualisasi_dan_Sintesis_Hasil.ipynb
│   └── 06_Interpretasi_Kualitatif_dan_Konteks_Tangkapan_Ikan.ipynb
├── outputs/
│   ├── figures/
│   ├── tables/
│   ├── reports/
│   └── logs/
├── config/
│   └── project_config.py
├── requirements.txt
└── README.md
```

## 5. Rancangan enam notebook

# Notebook 1 — Persiapan dan Penggabungan Data

**File:** `01_Persiapan_dan_Penggabungan_Data.ipynb`

### Tujuan
Menginventarisasi file, memeriksa struktur data, menggabungkan file yang kompatibel, memvalidasi kualitas data, dan menyiapkan dataset untuk analisis berikutnya.

### Isi dan langkah kerja
1. **Ringkasan dan tujuan:** jelaskan peran notebook serta alur data.
2. **Konfigurasi:** path input/output, periode target, batas koordinat, dan parameter yang mudah diedit.
3. **Inventarisasi SST:** daftar file, ukuran file, tahun yang tersedia, dan tahun/file yang hilang.
4. **Inspeksi SST:** tampilkan nama variabel, dimensi, koordinat, unit, kalender waktu, fill value, rentang waktu, dan rentang nilai.
5. **Penggabungan SST:** gabungkan file yang kompatibel, urutkan waktu, periksa timestamp duplikat, tanggal hilang, dan konsistensi grid.
6. **Subset wilayah:** terapkan batas koordinat yang telah dikonfirmasi dan periksa hasil cakupan peta.
7. **Inventarisasi chlorophyll-a:** temukan ZIP bulanan, daftar isi ZIP, file NetCDF harian, bulan yang tersedia, dan file yang gagal dibaca.
8. **Inspeksi chlorophyll-a:** verifikasi variabel, dimensi, koordinat, unit, resolusi, waktu, fill value, dan rentang nilai.
9. **Ekstraksi/penggabungan chlorophyll-a:** ekstrak bila diperlukan, hindari ekstraksi duplikat, pertahankan resolusi harian, dan jangan menggabungkan grid berbeda secara diam-diam.
10. **Pemeriksaan SHP opsional:** temukan file SHP dan file pendampingnya; periksa CRS, geometri, atribut, dan cakupan. SHP tidak boleh menjadi syarat analisis SST.
11. **Pemeriksaan kualitas:** hitung timestamp valid, duplikasi, tanggal hilang, proporsi missing value, unit, cakupan spasial, dan status tiap file.
12. **Ekspor:** simpan dataset NetCDF terverifikasi dan laporan inventaris/kualitas data.

### Keluaran
- Dataset SST harian gabungan sesuai cakupan aktual, idealnya `sst_daily_2000_2020_ntt.nc`.
- Dataset chlorophyll-a harian sesuai cakupan aktual, misalnya `chlorophyll_a_daily_ntt.nc`.
- `data_inventory.csv`.
- `data_quality_report.csv` atau laporan setara.
- Peta cakupan data untuk quality control.
- Catatan periode yang tersedia, data hilang, dan masalah yang ditemukan.

### Evaluasi
Semua file yang ditemukan tercatat; variabel dan unit diverifikasi; timestamp duplikat ditangani secara eksplisit; missing value tidak diubah menjadi nol; dan hasil ekspor dapat dibuka kembali. Jika input tidak tersedia, notebook harus memberi pesan jelas dan tidak membuat output palsu.

# Notebook 2 — Analisis SST dan Deteksi MHW

**File:** `02_Analisis_SST_dan_Deteksi_MHW.ipynb`

### Tujuan
Mendeskripsikan variasi SST dan mendeteksi MHW menggunakan metode yang transparan dan dapat ditelusuri.

### Isi dan langkah kerja
1. Muat hasil Notebook 1 dan validasi kembali dimensi, unit, waktu, serta missing value.
2. Tampilkan statistik SST dan grafik deret waktu regional yang sesuai.
3. Buat peta SST pada tanggal/periode representatif dengan unit dan colorbar yang jelas.
4. Bangun klimatologi dan ambang persentil ke-90 berdasarkan baseline yang dipilih.
5. Jelaskan bahwa 2000–2020 hanya mencakup 21 tahun, sehingga bukan klimatologi standar 30 tahun. Nyatakan konsekuensi pilihan baseline.
6. Deteksi MHW dengan metode yang terdokumentasi. Pendekatan awal yang dipertimbangkan mengikuti definisi Hobday: SST di atas persentil ke-90 musiman selama sedikitnya lima hari berturut-turut. Dokumentasikan kalender, baseline, aturan musim, serta apakah jeda pendek digabung.
7. Hitung metrik yang relevan: jumlah kejadian, durasi, intensitas rata-rata, intensitas maksimum, dan jumlah hari MHW.
8. Buat peta pola spasial dan ringkasan temporal metrik MHW.
9. Validasi contoh kejadian dengan membandingkan SST, ambang, tanggal, dan durasinya; perhatikan data hilang dan batas awal/akhir periode.
10. Ekspor hasil deteksi, tabel kejadian, ringkasan tahunan, serta visualisasi.

### Keluaran
- Tabel kejadian MHW dengan tanggal mulai/akhir, durasi, dan metrik intensitas.
- Ringkasan metrik per tahun dan/atau per piksel.
- Peta SST dan MHW.
- Dataset hasil deteksi untuk Notebook 4.
- Dokumentasi metode dan keterbatasan.

### Evaluasi
Aturan durasi minimum diterapkan konsisten; kejadian dapat ditelusuri ke SST dan threshold; unit/baseline jelas; dan tidak ada klaim penggunaan klimatologi 30 tahun.

# Notebook 3 — Analisis Chlorophyll-a

**File:** `03_Analisis_Chlorophyll_a.ipynb`

### Tujuan
Menganalisis kualitas serta variasi spasial dan temporal chlorophyll-a berdasarkan periode aktual yang tersedia.

### Isi dan langkah kerja
1. Muat data chlorophyll-a dari Notebook 1 dan verifikasi variabel, unit, koordinat, waktu, serta resolusi.
2. Periksa ketersediaan data harian, tanggal yang hilang, nilai fill, dan cakupan spasial.
3. Tangani missing value sesuai metadata; jangan menyamakan nilai nol dengan data hilang tanpa bukti.
4. Buat statistik deskriptif dan grafik deret waktu regional yang sesuai.
5. Buat peta chlorophyll-a pada waktu/periode representatif dengan satuan dan skala warna jelas.
6. Analisis variasi musiman atau tahunan hanya jika cakupan dan kualitas data mendukungnya.
7. Jika membuat anomali, jelaskan baseline dan persyaratan data minimum; jangan membuat anomali jika baseline tidak memadai.
8. Data harian asli tetap dipertahankan. Agregasi bulanan boleh dibuat untuk analisis tertentu, dengan metode dan alasan terdokumentasi.
9. Ekspor tabel, grafik, dan data yang dibutuhkan Notebook 4.

### Keluaran
- Laporan kualitas chlorophyll-a.
- Grafik temporal dan peta spasial.
- Statistik deskriptif dan ringkasan tambahan jika didukung data.
- Dataset/tabel untuk Notebook 4.

### Evaluasi
Periode aktual dinyatakan; unit tidak ditebak; missing value ditangani dengan benar; dan semua agregasi dapat direproduksi.

# Notebook 4 — Analisis Gabungan MHW dan Chlorophyll-a

**File:** `04_Analisis_Gabungan_MHW_dan_Chlorophyll_a.ipynb`

### Tujuan
Membandingkan pola chlorophyll-a pada kondisi MHW dan non-MHW dengan penyelarasan waktu dan ruang yang terdokumentasi.

### Isi dan langkah kerja
1. Jelaskan pertanyaan analisis dan batas interpretasi: hasil menunjukkan pola/perbedaan, bukan hubungan sebab-akibat.
2. Muat keluaran Notebook 2 dan 3; periksa periode tumpang tindih dan metadata.
3. Gunakan hanya timestamp valid pada periode bersama yang benar-benar tersedia.
4. Tentukan grid bersama. Pendekatan awal yang disarankan adalah mempertahankan grid SST untuk analisis gabungan dan mengagregasikan chlorophyll-a ke grid SST bila metode dan data mendukungnya.
5. Jangan memperhalus/interpolasi SST ke grid 4 km lalu menyebutnya pengamatan SST beresolusi 4 km.
6. Dokumentasikan metode agregasi, grid target, aturan missing value, dan jumlah piksel valid.
7. Tandai kondisi MHW/non-MHW hanya untuk data valid.
8. Bandingkan chlorophyll-a pada kedua kondisi menggunakan ringkasan yang sesuai, seperti median, rerata jika bermakna, rentang, dan jumlah sampel.
9. Gunakan uji statistik hanya jika asumsi serta ketergantungan waktu/spasial diperhatikan. Jika tidak memadai, prioritaskan statistik deskriptif.
10. Jika didukung data, buat komposit sebelum, selama, dan sesudah MHW dengan jendela waktu yang didefinisikan jelas.
11. Buat peta/grafik perbandingan yang benar-benar didukung data.
12. Ekspor tabel dan hasil gabungan untuk Notebook 5.

### Keluaran
- Tabel chlorophyll-a pada kondisi MHW dan non-MHW.
- Peta/grafik perbandingan yang relevan.
- Dataset hasil penyelarasan dengan grid dan periode yang dinyatakan.
- Dokumentasi jumlah sampel dan keterbatasan.

### Evaluasi
Periode dan grid bersama jelas; proses resampling tidak menciptakan klaim resolusi semu; missing value tidak disalahartikan; dan tidak ada klaim kausal.

# Notebook 5 — Visualisasi dan Sintesis Hasil

**File:** `05_Visualisasi_dan_Sintesis_Hasil.ipynb`

### Tujuan
Menyusun hasil utama Notebook 2–4 menjadi visualisasi dan tabel yang konsisten serta siap dipakai dalam laporan kelompok.

### Isi dan langkah kerja
1. Muat hasil analisis Notebook 2–4; jangan mengulang analisis besar tanpa alasan.
2. Terapkan gaya visual konsisten: judul, unit, label sumbu, legenda, periode, sumber, dan resolusi.
3. Susun peta SST, metrik MHW, chlorophyll-a, serta perbandingan MHW/non-MHW yang didukung data.
4. Gunakan skala warna konsisten untuk peta yang dibandingkan.
5. Tampilkan missing value secara jelas dan jangan menyamarkannya sebagai nol.
6. SHP batas kabupaten/kota hanya ditampilkan jika membantu orientasi geografis; gunakan garis tipis dan hilangkan jika mengganggu pola laut.
7. Buat tabel ringkasan angka utama, periode, resolusi, dan jumlah data valid.
8. Susun poin temuan yang didukung hasil aktual dengan bahasa hati-hati.
9. Ekspor gambar resolusi tinggi, tabel, dan caption yang mencantumkan sumber serta periode.
10. Periksa kesesuaian angka pada narasi dengan tabel keluaran.

### Keluaran
- PNG grafik/peta siap laporan.
- CSV tabel ringkasan.
- Caption dan sumber visualisasi.
- Daftar temuan berbasis hasil aktual.

### Evaluasi
Semua visual memiliki unit, periode, legenda, dan sumber; angka sesuai hasil; peta tidak terlalu ramai; dan tidak ada klaim yang melampaui data.

# Notebook 6 — Interpretasi Kualitatif dan Konteks Tangkapan Ikan

**File:** `06_Interpretasi_Kualitatif_dan_Konteks_Tangkapan_Ikan.ipynb`

### Tujuan
Menyandingkan temuan SST/MHW/chlorophyll-a dengan data tangkapan tongkol dan cakalang secara deskriptif, tanpa klaim kausal.

### Isi dan langkah kerja
1. Jelaskan tujuan dan batasan interpretasi kualitatif.
2. Muat ringkasan oseanografi dan data tangkapan yang tersedia.
3. Periksa spesies, tahun, satuan, wilayah, sumber, definisi produksi/tangkapan, serta nilai hilang.
4. Jika data tangkapan tidak tersedia atau metadata tidak memadai, dokumentasikan keterbatasan dan jangan membuat angka pengganti.
5. Jika perlu membandingkan dengan data tangkapan tahunan, ringkas indikator oseanografi ke skala tahunan dengan metode yang dijelaskan.
6. Tampilkan grafik deskriptif secara berdampingan atau dalam panel terpisah; hindari visualisasi yang menyiratkan hubungan yang belum dibuktikan.
7. Bahas periode yang bertepatan atau berbeda sebagai pengamatan deskriptif, bukan bukti sebab-akibat.
8. Jelaskan faktor lain yang dapat memengaruhi tangkapan, seperti upaya penangkapan, musim, alat tangkap, lokasi operasi, dan pengelolaan perikanan. Tandai faktor yang tidak tersedia sebagai keterbatasan.
9. Susun poin temuan, batasan, dan rekomendasi lanjutan berdasarkan hasil nyata.
10. Ekspor tabel/grafik yang relevan untuk laporan kelompok.

### Keluaran
- Grafik deskriptif oseanografi dan tangkapan.
- Tabel ringkasan tahunan jika data mendukung.
- Draft poin interpretasi dan keterbatasan.
- Catatan keterbatasan data tangkapan.

### Evaluasi
Hanya tongkol dan cakalang yang dibahas; satuan/wilayah jelas; tidak ada data rekaan; dan interpretasi tidak mengklaim kausalitas.

## 6. Persyaratan teknis semua notebook

### Pustaka
Pertimbangkan pustaka berikut setelah memeriksa kebutuhan aktual:
- `xarray` untuk data NetCDF multidimensi.
- `netCDF4` atau `h5netcdf` bila diperlukan oleh format file.
- `numpy` dan `pandas` untuk pengolahan data.
- `matplotlib` untuk grafik.
- `geopandas`, `shapely`, `pyproj`, atau `cartopy` untuk pemetaan jika lingkungan mendukung.
- Pustaka deteksi MHW yang terdokumentasi atau implementasi yang dapat diverifikasi.
- `tqdm` untuk progres file besar jika diperlukan.

Jangan memasang seluruh pustaka tanpa kebutuhan. Buat `requirements.txt` dari pustaka yang benar-benar dipakai. Jika pustaka tertentu tidak tersedia, jelaskan dan gunakan alternatif yang valid, bukan visualisasi palsu.

### Struktur wajib tiap notebook
1. Judul dan ringkasan.
2. Tujuan.
3. Data input dan sumber.
4. Instruksi penggunaan.
5. Alasan metode.
6. Konfigurasi.
7. Pemeriksaan kualitas.
8. Langkah analisis dengan penjelasan sebelum kode.
9. Tabel/grafik keluaran.
10. Interpretasi berbasis hasil aktual.
11. Keterbatasan.
12. Checklist evaluasi.
13. Ringkasan keluaran untuk notebook selanjutnya.

### Standar kode
- Jalankan sel secara berurutan dari atas ke bawah setelah path dikonfigurasi.
- Jangan mengasumsikan nama variabel NetCDF sebelum inspeksi.
- Jangan menggunakan `except: pass`; tampilkan error dengan konteks file/operasi.
- Jangan memuat semua data besar ke memori tanpa mempertimbangkan ukuran dan chunking.
- Jangan menimpa data mentah.
- Gunakan nama output konsisten.
- Simpan parameter penting dan versi pustaka.
- Jika input wajib tidak ditemukan, hentikan langkah terkait dengan pesan yang jelas.
- Jangan mengeklaim output berhasil jika proses gagal.

## 7. Konfigurasi terpusat

Buat `config/project_config.py` untuk menyimpan parameter yang mudah diubah:
- root folder proyek dan lokasi data;
- periode target SST;
- batas longitude/latitude;
- path SST, chlorophyll-a, data tangkapan, dan SHP opsional;
- nama variabel setelah diverifikasi;
- pilihan grid analisis gabungan;
- parameter deteksi MHW;
- direktori keluaran.

Hindari path absolut yang hanya berlaku di komputer pembuat. Jangan menaruh kredensial atau rahasia dalam notebook.

## 8. Standar visualisasi

- Cantumkan variabel, unit, periode/tanggal, legenda/colorbar, dan sumber.
- Catat resolusi sumber atau grid analisis.
- Pastikan longitude dan latitude tidak tertukar.
- Bedakan daratan, lautan, dan missing value.
- Gunakan skala warna konsisten saat membandingkan peta.
- SHP kabupaten/kota hanyalah overlay opsional.
- Jangan menyebut interpolasi sebagai peningkatan resolusi observasi.
- Hindari dekorasi yang tidak membantu pembacaan ilmiah.

## 9. Alur antarnotebook

```text
Notebook 1: inspeksi, validasi, dan persiapan
       ├── SST ───────────────> Notebook 2: SST dan MHW ──┐
       └── Chlorophyll-a ─────> Notebook 3: chlorophyll-a ─┤
                                                           v
                                      Notebook 4: analisis gabungan
                                                           |
                                                           v
                                      Notebook 5: visualisasi/sintesis
                                                           |
                                                           v
                                      Notebook 6: interpretasi kualitatif
```

Setiap notebook harus mencatat file input dan output yang digunakan. Notebook 5 tidak boleh mengubah hasil ilmiah secara diam-diam. Bila hasil berubah, perubahan harus dilakukan pada notebook analisis yang sesuai dan didokumentasikan.

## 10. Tahapan eksekusi Antigravity

### Tahap A — inspeksi
1. Periksa struktur folder dan file yang sudah ada.
2. Temukan file SST, ZIP chlorophyll-a, NetCDF harian, SHP beserta file pendamping, dan data tangkapan jika ada.
3. Laporkan file yang ditemukan dan tidak ditemukan.
4. Pertahankan data mentah dan kode yang sudah ada.

### Tahap B — Notebook 1
1. Buat kerangka Markdown Notebook 1 sesuai spesifikasi.
2. Implementasikan inventarisasi dan inspeksi file terlebih dahulu.
3. Jalankan sel inspeksi jika lingkungan memungkinkan.
4. Gunakan metadata nyata untuk menetapkan variabel, dimensi, unit, dan kalender.
5. Implementasikan penggabungan setelah struktur data dipahami.
6. Buka kembali file keluaran untuk memverifikasi hasil.
7. Simpan laporan kualitas data dan daftar masalah.

### Tahap C — notebook selanjutnya
Setelah Notebook 1 divalidasi, lanjutkan Notebook 2, 3, 4, 5, dan 6 secara berurutan. Sebelum membuat notebook berikutnya, pastikan skema dan keluaran notebook sebelumnya sudah diketahui. Jika data yang diperlukan belum tersedia, buat bagian yang menjelaskan kebutuhan input dan hentikan analisis terkait dengan pesan yang jelas.

### Tahap D — laporan status
Setelah setiap notebook, laporkan:
- input yang digunakan;
- periode dan wilayah aktual;
- langkah yang berhasil/gagal/dilewati;
- output yang benar-benar dibuat;
- keterbatasan yang ditemukan;
- tindakan berikutnya.

## 11. Kriteria penerimaan akhir

Proyek dianggap memenuhi spesifikasi apabila:
- Enam notebook tersedia dengan nama dan urutan yang benar.
- Setiap notebook mempunyai tujuan, instruksi, alasan metode, keluaran, evaluasi, dan keterbatasan.
- Semua path dapat dikonfigurasi.
- Cakupan aktual SST dan chlorophyll-a dilaporkan.
- Deteksi MHW terdokumentasi dan keterbatasan baseline 21 tahun dinyatakan.
- Data chlorophyll-a harian asli dipertahankan.
- Penyelarasan waktu/grid pada Notebook 4 terdokumentasi.
- Visualisasi Notebook 5 konsisten dan dapat ditelusuri.
- Notebook 6 hanya menggunakan data tangkapan aktual untuk tongkol/cakalang dan membatasi interpretasi pada deskripsi.
- SHP opsional dan hanya untuk konteks geografis.
- Tidak ada ONI di seluruh proyek.
- Tidak ada data, angka, atau output yang dikarang.
- Status pengujian setiap notebook dilaporkan secara jujur.

## 12. Instruksi akhir kepada Antigravity

Bangun pipeline penelitian yang dapat diaudit, bukan sekadar kumpulan grafik. Mulai dengan inspeksi file dan data nyata. Jangan mengasumsikan struktur NetCDF, nama variabel, unit, tanggal, resolusi, atau cakupan sebelum diverifikasi.

**Prioritas pertama adalah Notebook 1.** Buat Notebook 1, jalankan pengujian yang memungkinkan, validasi hasil ekspor, lalu berhenti dan tampilkan laporan inspeksi beserta daftar file yang dibuat, masalah yang ditemukan, dan langkah berikutnya. Jangan membuat enam notebook sekaligus sebelum Notebook 1 tervalidasi. Jangan memasukkan ONI dalam bentuk apa pun.
