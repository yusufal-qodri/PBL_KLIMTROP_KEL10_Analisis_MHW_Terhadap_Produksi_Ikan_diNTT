# PROMPT ANTIGRAVITY — PERBAIKAN KUALITAS VISUALISASI SELURUH PETA PBL MHW NTT

## Tujuan Utama

Lakukan audit dan perbaikan kualitas visualisasi peta pada seluruh notebook dalam proyek:

https://github.com/yusuf-al-qodri/PBL_KLIMTROP_KEL10_Analisis_MHW_Terhadap_Produksi_Ikan_diNTT

Gunakan gambar peta chlorophyll-a yang diberikan sebagai **referensi visual utama**. Peta tersebut memiliki gradasi warna yang lembut, transisi spasial yang lebih natural, dan tidak menampilkan blok-blok grid secara mencolok.

Saat ini, banyak peta lain masih terlihat kasar dan berbentuk kotak-kotak. Saya ingin seluruh peta memiliki kualitas visual yang konsisten dengan referensi tersebut.

**Penting:** Yang diperbaiki adalah kualitas visualisasi, bukan mengubah data atau memanipulasi hasil ilmiah agar terlihat lebih bagus.

## 1. Audit Seluruh Notebook

Periksa seluruh notebook yang menghasilkan peta, termasuk tetapi tidak terbatas pada:

- Peta Sea Surface Temperature (SST).
- Peta klimatologi SST dan anomali suhu.
- Peta distribusi Marine Heatwave (MHW).
- Peta total hari MHW.
- Peta frekuensi kejadian MHW.
- Peta intensitas maksimum MHW.
- Peta intensitas rata-rata MHW.
- Peta durasi kejadian MHW.
- Peta chlorophyll-a.
- Peta perbandingan MHW dan non-MHW.
- Peta analisis gabungan MHW dan chlorophyll-a.
- Peta lain yang ditemukan dalam notebook proyek.

Identifikasi fungsi plotting, metode rendering, resolusi grid, penggunaan interpolasi, colormap, pengaturan extent, dan cara menangani missing value.

Jangan hanya memperbaiki satu notebook atau satu gambar. Terapkan pendekatan yang konsisten pada seluruh visualisasi spasial yang relevan.

## 2. Referensi Gaya Visual

Gunakan karakteristik berikut sebagai standar visual:

- Gradasi warna lembut dan natural.
- Transisi spasial yang tidak terlalu terlihat berbentuk kotak.
- Tampilan ilmiah yang bersih dan profesional.
- Latar belakang putih.
- Garis pantai dan pulau tetap jelas.
- Daratan tidak tertutupi warna data laut.
- Grid koordinat, label sumbu, judul, dan colorbar tetap mudah dibaca.
- Resolusi gambar cukup tinggi untuk laporan akademik.
- Skala warna dan rentang nilai konsisten ketika beberapa peta dibandingkan.

Hindari tampilan yang terlalu pixelated, blok warna kasar, garis grid yang terlalu dominan, atau interpolasi berlebihan yang membuat pola terlihat tidak realistis.

## 3. Perbaiki Rendering agar Tidak Kotak-Kotak

Evaluasi setiap metode plotting yang saat ini digunakan, misalnya `pcolormesh`, `imshow`, `contourf`, atau metode lain.

Pilih metode rendering berdasarkan jenis data, struktur koordinat, dan kebutuhan ilmiah. Jangan menggunakan satu metode secara membabi buta untuk semua variabel.

### A. Untuk data kontinu

Untuk SST, anomali SST, intensitas MHW, intensitas rata-rata, dan chlorophyll-a:

- Gunakan rendering kontinu yang sesuai, misalnya `contourf` dengan level yang cukup rapat atau metode raster dengan interpolasi visual yang tepat.
- Evaluasi `shading="auto"` atau pengaturan rendering lain yang sesuai apabila memakai `pcolormesh`.
- Jika diperlukan, gunakan interpolasi visual seperti bilinear untuk menghasilkan transisi warna lebih halus.
- Pertimbangkan penghalusan visual yang ringan hanya apabila hasilnya tidak mengubah interpretasi pola spasial.
- Pastikan rentang koordinat dan orientasi data tetap benar.
- Hindari interpolasi di luar area yang memiliki dukungan observasi.
- Jangan menampilkan data yang hilang sebagai nilai nol.

Pilih pendekatan yang paling sesuai setelah menguji beberapa alternatif pada data aktual.

### B. Untuk data kategori atau hitungan diskret

Untuk frekuensi kejadian MHW dan variabel berupa jumlah kejadian:

- Pertahankan makna nilai diskret.
- Jangan menggunakan smoothing yang menciptakan nilai kejadian pecahan seolah-olah merupakan hasil pengamatan.
- Jika interpolasi hanya digunakan untuk tampilan, bedakan dengan jelas antara visualisasi hasil interpolasi dan data asli.
- Pertimbangkan tampilan raster yang lebih halus atau metode kontur yang sesuai tanpa menyembunyikan ketidakpastian data.
- Nilai nol dan missing value harus dibedakan secara tegas.

Untuk peta total hari MHW, tentukan apakah visualisasi kontinu layak digunakan, tetapi jangan sampai penghalusan mengubah nilai statistik asli.

### C. Untuk peta status MHW

Jika peta menunjukkan status MHW atau non-MHW pada tanggal tertentu:

- Pertahankan batas kategori status.
- Jangan menghaluskan batas sehingga status MHW terlihat menyebar ke grid yang sebenarnya tidak memenuhi kriteria.
- Gunakan tampilan yang jelas untuk membedakan status MHW, non-MHW, daratan, dan data tidak tersedia.

## 4. Jangan Menciptakan Detail Spasial Palsu

Data SST yang digunakan memiliki resolusi spasial tertentu, diperkirakan sekitar 0,25° untuk NOAA OISST v2.1.

Jangan menganggap hasil interpolasi menjadi data baru dengan resolusi lebih tinggi.

Interpolasi visual hanya boleh digunakan untuk memperhalus tampilan, bukan untuk menyatakan bahwa data awal memiliki resolusi lebih tinggi.

Ketentuan:

1. Jangan mengganti resolusi ilmiah data sumber hanya demi tampilan.
2. Jangan melakukan upsampling secara agresif tanpa alasan.
3. Jangan mengubah nilai asli yang digunakan dalam analisis statistik.
4. Jangan menjalankan ulang deteksi MHW berdasarkan data yang sudah dihaluskan untuk keperluan visual.
5. Jangan menghitung ulang intensitas, frekuensi, atau durasi dari data hasil smoothing visual.
6. Pertahankan data asli sebagai sumber perhitungan seluruh metrik.
7. Jika membuat array khusus untuk visualisasi, pisahkan dari array analisis dan beri nama yang jelas.

Gunakan prinsip:

**Data asli untuk perhitungan ilmiah; interpolasi visual hanya untuk penyajian.**

## 5. Perlakuan Missing Value, Daratan, dan Garis Pantai

Salah satu risiko visualisasi adalah warna interpolasi menyebar ke daratan atau menutupi pulau.

Perbaiki hal ini dengan:

- Mempertahankan mask daratan dan mask missing value.
- Memastikan interpolasi tidak mengisi celah daratan dengan warna laut.
- Tidak melakukan interpolasi melintasi wilayah daratan.
- Menggunakan mask yang sesuai dengan koordinat dan resolusi grid.
- Memastikan pulau-pulau NTT tetap memiliki bentuk yang jelas.
- Menggunakan data garis pantai atau batas geografis yang sesuai jika tersedia.
- Memeriksa bahwa batas wilayah tidak menyebabkan artefak pada tepi peta.

Jangan menganggap seluruh nilai kosong sebagai daratan. Missing value dapat berasal dari awan, kualitas pengamatan, batas produk, atau penyebab lain.

Untuk chlorophyll-a, pertahankan missing value satelit dan jangan menggantinya dengan nol.

## 6. Konsistensi Colormap

Pilih colormap sesuai makna variabel dan karakteristik datanya.

Rekomendasi umum:

- SST: colormap kontinu yang mudah dibaca dan sesuai untuk suhu.
- Anomali SST: colormap divergen dengan titik tengah nol.
- Intensitas MHW: colormap kontinu yang menunjukkan peningkatan intensitas dengan jelas.
- Total hari MHW: colormap berurutan.
- Frekuensi MHW: colormap berurutan yang sesuai untuk hitungan.
- Chlorophyll-a: colormap yang sesuai dengan distribusi konsentrasi, termasuk penggunaan skala logaritmik jika memang tepat untuk data.
- Status MHW: colormap kategorikal yang membedakan status secara jelas.

Jangan menyamakan semua colormap hanya demi konsistensi estetika.

Konsistensi berarti gaya visual, tata letak, dan keterbacaan seragam, sedangkan pemilihan warna tetap mengikuti makna variabel.

Untuk beberapa peta dari variabel yang sama dan ditujukan untuk perbandingan langsung:

- Gunakan rentang warna yang konsisten jika layak.
- Gunakan satuan yang konsisten.
- Pastikan colorbar tidak menyesatkan.
- Jangan menyesuaikan rentang warna secara berbeda untuk membuat satu peta terlihat lebih ekstrem daripada peta lain.

Jika skala logaritmik digunakan, tampilkan informasi skala tersebut pada colorbar.

## 7. Tingkatkan Resolusi dan Kualitas Ekspor

Periksa pengaturan ukuran gambar dan ekspor pada semua notebook.

Standar yang diharapkan:

- Resolusi ekspor yang memadai, misalnya 300 DPI untuk gambar laporan.
- Ukuran gambar dan rasio aspek yang proporsional.
- Font judul, sumbu, dan colorbar terbaca jelas.
- Tidak ada judul terpotong.
- Tidak ada colorbar yang menabrak panel lain.
- Tidak ada ruang kosong yang tidak proporsional.
- Tidak ada label koordinat yang saling bertumpuk.
- Grid koordinat tipis dan tidak mendominasi peta.
- Peta multi-panel memiliki ukuran panel yang konsisten.
- Semua peta memiliki judul dan satuan yang benar.

Jika menggunakan Matplotlib, evaluasi `figsize`, `dpi`, `constrained_layout`, `tight_layout`, `interpolation`, `levels`, dan parameter lain sesuai kebutuhan. Jangan menambahkan semua parameter tersebut secara membabi buta.

Jika menggunakan Cartopy atau pustaka pemetaan lain, pertahankan proyeksi dan transformasi koordinat yang benar.

## 8. Standar Khusus Peta Multi-Panel

Untuk visualisasi yang memiliki beberapa panel, seperti empat karakteristik MHW atau lima peta musiman chlorophyll-a:

- Samakan ukuran dan posisi panel.
- Samakan extent wilayah penelitian.
- Samakan tick koordinat.
- Letakkan colorbar dengan jarak yang konsisten.
- Hindari colorbar yang terlalu sempit atau terlalu panjang.
- Gunakan font dan ukuran judul yang konsisten.
- Pastikan seluruh panel dapat dibandingkan secara langsung.
- Gunakan satu colorbar bersama jika variabel, satuan, dan skala yang digunakan memang sama.
- Jangan menggunakan satu colorbar untuk variabel berbeda atau skala berbeda tanpa penjelasan.
- Pastikan tidak ada panel yang terpotong atau tertutup.

## 9. Implementasi yang Efisien dan Konsisten

Jika ditemukan banyak fungsi plotting yang berulang, pertimbangkan membuat fungsi visualisasi bersama agar semua notebook menggunakan standar yang sama.

Sebagai contoh, fungsi dapat menangani:

- Pengaturan ukuran gambar.
- Extent dan koordinat.
- Colormap.
- Colorbar.
- Masking.
- Pengaturan garis pantai.
- Label sumbu.
- Resolusi ekspor.
- Metode rendering yang sesuai dengan tipe variabel.

Namun, jangan memaksakan satu fungsi yang sama jika kebutuhan peta kontinu, kategori, dan hitungan berbeda.

Fungsi bersama harus tetap mendukung konfigurasi khusus untuk masing-masing variabel.

Jangan mengubah struktur proyek secara besar-besaran apabila perbaikan lokal sudah cukup.

## 10. Pengujian Sebelum dan Sesudah

Sebelum melakukan perubahan, simpan atau dokumentasikan kondisi visualisasi saat ini.

Setelah perubahan, bandingkan peta sebelum dan sesudah menggunakan data dan rentang yang sama.

Evaluasi:

1. Apakah tampilan kotak-kotak berkurang?
2. Apakah transisi warna menjadi lebih halus?
3. Apakah batas daratan dan pulau tetap akurat?
4. Apakah pola spasial utama tetap konsisten?
5. Apakah nilai statistik asli tetap tidak berubah?
6. Apakah missing value tetap ditangani dengan benar?
7. Apakah skala warna dan satuan tetap tepat?
8. Apakah peta dapat dibaca dengan baik pada ukuran laporan?
9. Apakah perubahan menimbulkan artefak baru di garis pantai atau tepi wilayah?

Jika tampilan lebih halus tetapi pola spasial menjadi menyesatkan, jangan gunakan metode tersebut.

Prioritaskan validitas ilmiah di atas estetika.

## 11. Alur Kerja Antigravity

### Tahap 1 — Audit

Baca seluruh notebook yang relevan dan identifikasi semua kode pembuatan peta.

Buat tabel berisi:
- Nama notebook.
- Sel atau fungsi plotting.
- Jenis variabel yang dipetakan.
- Metode rendering saat ini.
- Penyebab tampilan kasar.
- Metode perbaikan yang direkomendasikan.

### Tahap 2 — Rencana Perbaikan

Sebelum mengubah kode, susun rencana per notebook.

Bedakan perbaikan untuk:
- Variabel kontinu.
- Variabel diskret atau hitungan.
- Status kategorikal.
- Chlorophyll-a dengan missing value.
- Peta multi-panel.

Jelaskan metode yang akan digunakan dan alasannya.

### Tahap 3 — Tunggu Persetujuan

Jangan mengubah notebook sebelum pengguna menyetujui rencana perbaikan.

### Tahap 4 — Implementasi

Setelah disetujui, terapkan perbaikan pada seluruh peta yang relevan.

Jangan hanya memperbaiki satu peta sebagai contoh lalu membiarkan peta lain tetap kasar.

Pertahankan hasil analisis, variabel, metode ilmiah, dan struktur data yang sudah benar.

### Tahap 5 — Validasi

Lakukan perbandingan visual dan pemeriksaan bahwa data analisis tidak berubah.

Laporkan notebook yang sudah diperbaiki, metode rendering yang digunakan, dan hasil validasinya.

Jika notebook tidak dapat dijalankan karena data atau dependensi tidak tersedia, laporkan keterbatasan tersebut secara jujur.

## 12. Kriteria Keberhasilan

Pekerjaan dinyatakan berhasil apabila:

- Seluruh peta yang relevan telah diaudit.
- Tampilan peta kontinu menjadi lebih halus dan tidak terlalu kotak-kotak.
- Peta hitungan dan kategori tetap mempertahankan makna nilai aslinya.
- Mask daratan dan missing value tetap benar.
- Tidak ada peningkatan resolusi ilmiah yang diklaim hanya dari interpolasi.
- Data yang digunakan untuk perhitungan tidak berubah akibat penghalusan visual.
- Gaya visual antarnotebook konsisten.
- Peta siap digunakan dalam laporan akademik.
- Perubahan kode dan hasil pengujiannya terdokumentasi.

**Instruksi akhir:** Gunakan gambar chlorophyll-a yang diberikan sebagai referensi kualitas visual. Terapkan standar visual yang sebanding ke seluruh peta dalam proyek, tetapi pilih metode rendering yang tepat untuk setiap jenis variabel. Jangan mengorbankan validitas ilmiah demi tampilan yang halus.

## 13. Audit dan Pembersihan Notebook dari Komponen yang Tidak Diperlukan

Selain memperbaiki kualitas visualisasi, lakukan audit terhadap seluruh notebook untuk mengidentifikasi kode, variabel, fungsi, visualisasi, tabel, output, dan bagian analisis yang tidak diperlukan atau tidak relevan dengan tujuan penelitian.

**Hapus atau rapikan komponen yang tidak berkontribusi langsung terhadap tujuan analisis MHW, chlorophyll-a, dan konteks produksi ikan di NTT periode 2000–2020.** Jangan mempertahankan bagian hanya karena sudah ada di notebook sebelumnya.

### A. Komponen yang Perlu Dihapus atau Dipertimbangkan untuk Dihapus

1. **Kode duplikat**, termasuk pengolahan data, perhitungan statistik, dan pembuatan peta yang dilakukan berulang tanpa tujuan yang berbeda.
2. **Visualisasi yang tidak relevan**, tidak digunakan untuk menjawab pertanyaan penelitian, atau hanya mengulang informasi yang sudah ditampilkan dengan lebih baik pada visualisasi lain.
3. **Variabel, fungsi, dan import pustaka yang tidak digunakan** oleh alur analisis.
4. **Output debugging**, seperti hasil pemeriksaan sementara yang terlalu panjang, print berulang, dan tabel mentah yang tidak diperlukan dalam laporan.
5. **Kode eksplorasi sementara** yang sudah tidak digunakan dalam metode final.
6. **Grafik atau peta percobaan** yang tidak memberikan informasi ilmiah tambahan.
7. **File keluaran perantara yang berlebihan**, duplikat, atau tidak digunakan oleh notebook berikutnya.
8. **Analisis di luar ruang lingkup penelitian**, termasuk analisis ONI/ENSO, apabila ditemukan.
9. **Peta atau tabel dengan informasi berulang** yang tidak menambah pemahaman terhadap hasil.
10. **Komentar, markdown, dan judul yang sudah tidak sesuai** dengan metode atau hasil aktual.
11. **Pengolahan data yang tidak diperlukan** dan hanya menambah waktu komputasi atau penggunaan memori.
12. **Kode yang menghasilkan klaim atau statistik yang tidak memiliki dasar dari data aktual.**

### B. Komponen Analisis yang Harus Dipertahankan

Jangan menghapus komponen yang diperlukan untuk validitas ilmiah, reproduksibilitas, atau pemahaman hasil, termasuk:

- Pemeriksaan kualitas data dan metadata.
- Penanganan missing value.
- Pemeriksaan koordinat, resolusi, satuan, dan rentang waktu.
- Perhitungan klimatologi dan ambang deteksi MHW.
- Deteksi MHW per grid.
- Perhitungan durasi, intensitas, frekuensi, dan total hari MHW.
- Identifikasi dan dokumentasi kejadian MHW.
- Pemeriksaan kesesuaian waktu dan ruang SST dengan chlorophyll-a.
- Perbandingan MHW dengan periode non-MHW.
- Evaluasi kelayakan statistik dan pelaporan ketidakpastian.
- Analisis produksi ikan sesuai resolusi data yang tersedia.
- Visualisasi utama yang menjawab pertanyaan penelitian.
- Informasi sumber data, parameter metode, dan keterbatasan analisis.

### C. Standar Pemilihan Visualisasi

Setiap visualisasi harus memiliki tujuan yang jelas dan menjawab pertanyaan penelitian tertentu.

Prioritaskan:
1. Peta distribusi spasial karakteristik MHW.
2. Katalog dan visualisasi setiap kejadian MHW jika metode identifikasi kejadian sudah ditetapkan.
3. Peta atau grafik chlorophyll-a pada periode yang tersedia.
4. Perbandingan chlorophyll-a saat MHW dan non-MHW.
5. Ringkasan temporal MHW dan chlorophyll-a.
6. Grafik konteks produksi ikan sesuai resolusi data.
7. Visualisasi diagnostik yang memang diperlukan untuk memvalidasi metode.

Hapus atau gabungkan grafik yang hanya mengulang informasi tanpa memberikan sudut pandang baru. Namun, jangan menghapus visualisasi diagnostik yang diperlukan untuk memeriksa kualitas metode hanya karena tidak akan dimasukkan ke laporan akhir.

### D. Jangan Menghapus File Secara Sembarangan

Sebelum menghapus atau memodifikasi komponen, lakukan hal berikut:

1. Identifikasi lokasi dan fungsi komponen.
2. Periksa apakah komponen digunakan oleh sel lain, notebook lain, atau proses lanjutan.
3. Bedakan file data mentah, file perantara, dan file keluaran akhir.
4. Pastikan tidak ada dependensi yang rusak akibat pembersihan.
5. Buat daftar komponen yang diusulkan untuk dihapus beserta alasannya.
6. Pertahankan data mentah dan sumber data asli.
7. Jangan menghapus file hanya karena namanya tampak tidak relevan.
8. Jika suatu komponen masih memiliki fungsi yang belum jelas, tandai untuk ditinjau alih-alih langsung menghapusnya.

### E. Tahapan Pembersihan

**Tahap 1 — Audit:** Identifikasi komponen yang tidak diperlukan dan kelompokkan menjadi duplikat, tidak relevan, tidak digunakan, output sementara, atau berpotensi penting.

**Tahap 2 — Rekomendasi:** Buat tabel yang berisi nama notebook atau file, komponen yang diusulkan untuk dihapus, alasan, risiko, dan rekomendasi tindakan.

**Tahap 3 — Persetujuan:** Tampilkan rekomendasi kepada pengguna. Jangan menghapus file atau mengubah notebook sebelum pengguna menyetujui rencana pembersihan.

**Tahap 4 — Implementasi:** Setelah disetujui, hapus atau rapikan hanya komponen yang telah disepakati. Pertahankan alur analisis dan semua perhitungan yang diperlukan.

**Tahap 5 — Validasi:** Pastikan notebook tetap memiliki dependensi yang benar, alur analisis yang lengkap, dan hasil yang konsisten. Bandingkan hasil utama sebelum dan sesudah pembersihan untuk memastikan tidak ada perubahan yang tidak disengaja.

### F. Kriteria Keberhasilan Pembersihan

Pembersihan dinyatakan berhasil apabila:

- Notebook lebih ringkas dan mudah dipahami.
- Tidak ada kode duplikat yang tidak diperlukan.
- Tidak ada analisis di luar ruang lingkup penelitian.
- Visualisasi utama tidak saling mengulang tanpa alasan.
- Data mentah dan proses penting tetap dipertahankan.
- Seluruh perhitungan ilmiah yang diperlukan tetap tersedia.
- Tidak ada dependensi yang rusak.
- Hasil utama tetap konsisten setelah pembersihan.
- Setiap penghapusan dapat dijelaskan berdasarkan tujuan analisis.

**Instruksi tambahan:** Jangan menghapus komponen hanya untuk mengurangi jumlah baris kode atau jumlah notebook. Prioritaskan relevansi ilmiah, kejelasan alur analisis, efisiensi komputasi, dan reproduksibilitas. Semua penghapusan harus memiliki alasan yang jelas dan dapat ditelusuri.