# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# NTT MARINE INSIGHT
## Dashboard Interaktif SST, Marine Heatwave, Chlorophyll-a, dan Produksi Tangkapan Ikan

**Versi:** 1.0  
**Status:** Rancangan produk  
**Platform:** Website dashboard interaktif  
**Wilayah kajian:** Perairan Nusa Tenggara Timur (NTT), Indonesia  
**Bahasa antarmuka:** Bahasa Indonesia  
**Pengguna utama:** Mahasiswa, peneliti, dosen, dan pembaca hasil penelitian

---

# 1. Ringkasan Produk

NTT Marine Insight merupakan dashboard web interaktif untuk mengeksplorasi kondisi lingkungan laut dan produksi tangkapan ikan di wilayah Nusa Tenggara Timur (NTT).

Dashboard mengintegrasikan empat komponen utama:

- Sea Surface Temperature (SST) atau suhu permukaan laut.
- Marine Heatwave (MHW).
- Chlorophyll-a.
- Produksi tangkapan ikan laut.

Dashboard memungkinkan pengguna melihat sebaran suhu permukaan laut pada tanggal tertentu, mengeksplorasi kejadian MHW berdasarkan waktu dan lokasi, memeriksa variasi chlorophyll-a, serta melihat data produksi tangkapan ikan pada periode yang tersedia.

Semua komponen disajikan melalui peta interaktif, grafik, kartu ringkasan, tabel, dan filter waktu. Pengguna dapat berpindah dari ringkasan umum ke halaman analisis yang lebih terperinci tanpa harus membuka notebook atau menjalankan kode secara manual.

Dashboard ini berfungsi sebagai media eksplorasi dan penyajian hasil penelitian, bukan sebagai sistem prediksi atau peringatan dini operasional.

## Prinsip utama produk

1. Peta merupakan elemen visual utama pada halaman Overview dan SST.
2. Tata letak mengikuti desain referensi yang telah disepakati.
3. Antarmuka menggunakan latar putih dengan tampilan sederhana, rapi, dan ilmiah.
4. Filter waktu menyediakan mode harian, mingguan, bulanan, tahunan, dan 10 tahunan.
5. Setiap nilai, grafik, dan peta harus berasal dari data yang tersedia dan telah diproses.
6. Perbedaan periode ketersediaan data antarvariabel harus ditampilkan secara transparan.
7. Dashboard tidak boleh membuat nilai observasi, statistik, atau kejadian MHW yang tidak terdapat dalam hasil analisis.
8. ONI tidak termasuk dalam ruang lingkup proyek dan tidak boleh ditampilkan di dashboard.

---

# 2. Latar Belakang

Analisis kondisi laut melibatkan beberapa dataset dengan karakteristik berbeda. SST dan chlorophyll-a memiliki dimensi spasial dan temporal, sedangkan data produksi tangkapan ikan dapat memiliki resolusi tahunan.

Jika seluruh hasil analisis hanya disimpan dalam notebook, pengguna harus membuka beberapa file untuk memahami pola suhu laut, kejadian MHW, perubahan chlorophyll-a, dan produksi tangkapan ikan.

NTT Marine Insight dirancang untuk menyatukan hasil tersebut ke dalam satu antarmuka yang mudah digunakan. Pengguna dapat memilih waktu, mengeklik lokasi pada peta, melihat nilai variabel, membandingkan periode, dan memahami hasil analisis melalui visualisasi yang saling terhubung.

Dashboard juga harus membantu pengguna membedakan hasil pengamatan, hasil perhitungan, dan interpretasi. Hubungan antara kondisi lingkungan dan produksi tangkapan ikan tidak boleh langsung dianggap sebagai hubungan sebab-akibat.

---

# 3. Tujuan Produk

## 3.1 Tujuan utama

- Menyediakan dashboard interaktif untuk mengeksplorasi SST, MHW, chlorophyll-a, dan produksi tangkapan ikan di NTT.
- Menampilkan sebaran spasial variabel laut melalui peta interaktif.
- Memungkinkan pengguna memilih waktu berdasarkan beberapa tingkat temporal.
- Menyajikan informasi MHW, termasuk tanggal kejadian, durasi, intensitas, dan lokasi jika tersedia dari hasil analisis.
- Menampilkan variasi chlorophyll-a pada periode yang tersedia.
- Menyediakan visualisasi produksi tangkapan ikan berdasarkan data yang benar-benar tersedia.
- Membantu pengguna membandingkan kondisi MHW dan non-MHW menggunakan keluaran analisis yang telah divalidasi.
- Menyediakan informasi sumber data, metode, satuan, dan keterbatasan penelitian.

## 3.2 Hal yang tidak menjadi tujuan

Dashboard bukan:

- Sistem prediksi SST atau MHW.
- Sistem peringatan dini real-time.
- Sistem rekomendasi lokasi penangkapan ikan.
- Sistem yang secara otomatis membuktikan pengaruh MHW terhadap produksi tangkapan ikan.
- Pengganti proses analisis ilmiah di notebook.
- Sistem yang mengubah data tahunan menjadi data harian melalui interpolasi tanpa dasar metodologis.
- Dashboard yang menggunakan ONI sebagai variabel analisis.

---

# 4. Pengguna Sasaran

## 4.1 Pengguna utama

**Tim penelitian**

Menggunakan dashboard untuk memeriksa keluaran notebook, membandingkan hasil analisis, dan mengeksplorasi kondisi laut.

**Dosen dan asisten praktikum**

Menggunakan dashboard untuk meninjau metode, data, visualisasi, dan hasil penelitian.

**Pembaca laporan**

Menggunakan dashboard untuk memahami hasil penelitian melalui peta, grafik, dan informasi ringkas tanpa perlu memahami kode pemrograman.

## 4.2 Kebutuhan pengguna

Pengguna harus dapat:

- Melihat kondisi umum laut NTT.
- Memilih tanggal atau rentang waktu.
- Melihat nilai SST pada lokasi yang dipilih.
- Mengetahui kapan dan di mana MHW terdeteksi.
- Melihat durasi dan intensitas MHW jika tersedia.
- Mengeksplorasi distribusi chlorophyll-a.
- Membandingkan chlorophyll-a pada kondisi MHW dan non-MHW.
- Melihat produksi tangkapan ikan sesuai periode yang tersedia.
- Memahami sumber, metode, dan keterbatasan data.

---

# 5. Ruang Lingkup Data

## 5.1 Data SST

Sumber kandidat: NOAA Optimum Interpolation Sea Surface Temperature (OISST) v2.1 daily AVHRR.

Tautan sumber:

https://www.ncei.noaa.gov/data/sea-surface-temperature-optimum-interpolation/v2.1/access/avhrr/

Periode penelitian yang direncanakan adalah 1 Januari 2000 sampai 31 Desember 2020.

Bounding box awal wilayah NTT:

- Bujur: 117,5°–127,5° BT.
- Lintang: 13°–7° LS.

Rentang koordinat tersebut harus diverifikasi terhadap data dan batas wilayah penelitian sebelum digunakan sebagai konfigurasi final.

Sebelum integrasi, periksa:

- Nama variabel.
- Satuan suhu.
- Resolusi spasial.
- Resolusi temporal.
- Kalender dan format waktu.
- Penanda nilai hilang.
- Rentang waktu aktual.
- Sistem koordinat.

SST ditampilkan dalam °C jika metadata telah memastikan satuan dan proses konversinya.

## 5.2 Data Marine Heatwave

Data MHW berasal dari hasil deteksi yang telah dikerjakan pada notebook analisis.

Dashboard harus menggunakan definisi dan keluaran yang sama dengan penelitian. Metode tidak boleh diubah secara diam-diam saat data dimasukkan ke website.

Informasi yang dapat ditampilkan jika tersedia:

- Status MHW pada tanggal tertentu.
- Tanggal mulai kejadian.
- Tanggal akhir kejadian.
- Durasi kejadian dalam hari.
- Intensitas.
- Anomali suhu.
- Lokasi atau sel grid yang mengalami kejadian.
- Ringkasan jumlah kejadian dalam periode tertentu.

Jika penelitian menggunakan pendekatan berbasis persentil ke-90 dan durasi minimal lima hari, informasi tersebut harus dicantumkan dalam metodologi hanya setelah dikonfirmasi sesuai notebook.

Periode 2000–2020 mencakup 21 tahun. Jika digunakan sebagai baseline klimatologi, keterbatasan dibandingkan klimatologi 30 tahun perlu dijelaskan.

Dashboard tidak boleh menghitung ulang MHW dengan metode yang berbeda dari notebook tanpa dokumentasi perubahan.

## 5.3 Data chlorophyll-a

Data chlorophyll-a direncanakan mulai sekitar Januari 2003, mengikuti ketersediaan data yang berhasil diperoleh.

Tanggal awal dan akhir yang sebenarnya harus dibaca dari file, bukan ditetapkan hanya berdasarkan rencana.

Informasi yang harus diverifikasi:

- Nama variabel.
- Satuan konsentrasi.
- Resolusi spasial.
- Resolusi temporal.
- Quality flag.
- Penanda nilai hilang.
- Rentang waktu yang tersedia.
- Metode agregasi dan penyelarasan grid jika dilakukan.

Nilai chlorophyll-a tidak boleh diisi nol ketika data tidak tersedia.

Jika grid chlorophyll-a diselaraskan dengan grid SST, proses tersebut harus dijelaskan. Agregasi ke grid yang lebih kasar tidak boleh diklaim sebagai peningkatan resolusi observasi.

## 5.4 Data produksi tangkapan ikan

Data produksi berasal dari dataset nasional yang telah difilter untuk Provinsi NTT.

Periode sasaran penelitian adalah 2000–2020, menyesuaikan rentang yang tersedia pada file.

Ruang lingkup jenis ikan mengikuti kategori yang terdapat pada dataset aktual. Jika file mencakup seluruh kategori ikan, dashboard tidak membatasi analisis hanya pada tongkol dan cakalang.

Sebelum digunakan, periksa:

- Nama indikator pada dataset.
- Satuan produksi.
- Tahun.
- Provinsi.
- Kategori jenis ikan.
- Kategori jenis penangkapan jika tersedia.
- Kelengkapan data.
- Perubahan definisi atau kategori antartahun.

Dashboard harus mengikuti istilah yang benar-benar digunakan oleh sumber data. Istilah produksi, jumlah tangkapan, dan indikator lainnya tidak boleh dipertukarkan tanpa verifikasi.

Jika data produksi hanya tahunan, grafik harus tetap menggunakan resolusi tahunan.

## 5.5 Data geografis

Shapefile dapat digunakan untuk menampilkan batas administratif atau referensi geografis jika sesuai.

Sebelum digunakan, periksa sistem koordinat dan cakupan geografisnya.

Batas administratif kabupaten/kota bukan batas ekologis laut. Batas tersebut tidak boleh dipakai untuk menyimpulkan bahwa distribusi MHW atau chlorophyll-a berhenti pada batas administrasi.

## 5.6 Aturan umum kualitas data

- Tidak mengganti data hilang dengan nol secara otomatis.
- Tidak mengarang nilai, koordinat, tanggal, kejadian, atau hasil statistik.
- Tidak mengisi periode yang tidak tersedia dengan data buatan.
- Tidak menampilkan angka ilustrasi sebagai hasil penelitian aktual.
- Mencatat perubahan satuan dan metode agregasi.
- Menampilkan periode data yang benar-benar tersedia.
- Memisahkan hasil observasi, hasil perhitungan, dan interpretasi.
- Mencantumkan keterbatasan yang dapat memengaruhi interpretasi.

---

# 6. Struktur Website dan Navigasi

Website menggunakan sidebar di sebelah kiri dengan urutan menu:

1. Overview
2. SST
3. MHW
4. Chlorophyll-a
5. Analisis Gabungan
6. Produksi Tangkapan Ikan
7. Sintesis
8. Metodologi

## 6.1 Header

Header memuat:

- Nama produk: NTT Marine Insight.
- Deskripsi: Data Laut untuk Nusa Tenggara Timur.
- Kontrol waktu yang sedang aktif.
- Indikator periode data.
- Informasi pembaruan data.

Tanggal pembaruan menunjukkan kapan data terakhir diproses atau dashboard terakhir diperbarui, bukan berarti data tersebut real-time.

## 6.2 Sidebar

Sidebar harus:

- Tetap berada di sisi kiri pada tampilan desktop.
- Menggunakan ikon sederhana dan label yang jelas.
- Menandai halaman aktif dengan warna yang lembut.
- Mempertahankan navigasi yang konsisten di seluruh halaman.
- Tidak menggunakan animasi atau efek dekoratif berlebihan.

Pada layar kecil, sidebar dapat diubah menjadi menu yang dapat dibuka dan ditutup.

## 6.3 Perpindahan halaman

Klik menu akan membuka halaman terkait.

Filter waktu global dapat dipertahankan ketika pengguna berpindah halaman jika periode tersebut masih relevan. Jika suatu halaman tidak memiliki data pada periode tersebut, dashboard harus menjelaskan kondisi itu dengan jelas.

---

# 7. Sistem Filter Waktu

Filter waktu merupakan salah satu fitur terpenting dashboard.

## 7.1 Mode waktu

Dashboard menyediakan lima mode utama:

**Harian**

Menampilkan data untuk satu tanggal tertentu.

**Mingguan**

Menampilkan ringkasan untuk satu minggu atau rentang tujuh hari. Definisi minggu harus ditetapkan secara konsisten.

**Bulanan**

Menampilkan ringkasan untuk satu bulan dalam tahun yang dipilih.

**Tahunan**

Menampilkan ringkasan untuk satu tahun penuh.

**10 Tahunan**

Menampilkan ringkasan untuk rentang sepuluh tahun atau dekade yang telah ditentukan secara konsisten.

## 7.2 Perilaku kontrol waktu

Saat pengguna memilih mode, kontrol waktu menyesuaikan pilihan yang relevan.

| Mode | Kontrol yang ditampilkan | Bentuk data |
|---|---|---|
| Harian | Tahun, bulan, tanggal | Data harian |
| Mingguan | Tahun dan minggu/rentang tanggal | Ringkasan mingguan |
| Bulanan | Tahun dan bulan | Ringkasan bulanan |
| Tahunan | Tahun | Ringkasan tahunan |
| 10 Tahunan | Pilihan rentang sepuluh tahun | Ringkasan dekadal |

Kontrol waktu harus:

- Membatasi pilihan pada periode data yang tersedia.
- Menampilkan rentang tanggal yang sedang aktif.
- Memungkinkan pengguna mengubah periode dengan mudah.
- Menampilkan indikator loading jika pembaruan membutuhkan waktu.
- Mempertahankan pilihan yang masih relevan ketika berpindah halaman.
- Menampilkan pesan jika periode yang dipilih tidak memiliki data.

## 7.3 Perilaku pada data yang berbeda

Tidak semua variabel memiliki resolusi waktu yang sama.

SST dapat ditampilkan secara harian jika data tersedia. MHW mengikuti resolusi dan keluaran deteksi. Chlorophyll-a mengikuti periode ketersediaan sumbernya. Produksi tangkapan ikan mengikuti resolusi asli dataset, misalnya tahunan.

Karena itu, pilihan waktu harus menyesuaikan variabel.

Contoh: ketika pengguna membuka halaman produksi ikan yang hanya menyediakan data tahunan, mode harian, mingguan, dan bulanan harus dinonaktifkan atau disertai penjelasan bahwa data tidak tersedia pada resolusi tersebut.

Dashboard tidak boleh membuat nilai harian atau bulanan dari data tahunan hanya agar semua pilihan waktu tampak aktif.

## 7.4 Aturan agregasi

- Harian: menggunakan nilai harian yang valid.
- Mingguan: menghitung statistik dari data valid dalam minggu tersebut.
- Bulanan: menghitung statistik dari data valid dalam bulan tersebut.
- Tahunan: menghitung statistik dari data valid sepanjang tahun.
- 10 tahunan: menghitung statistik dari data valid dalam rentang sepuluh tahun.

Jenis statistik harus disesuaikan dengan variabel. Rata-rata SST, jumlah kejadian MHW, intensitas maksimum, konsentrasi chlorophyll-a, dan total produksi ikan bukan ukuran yang dapat dipertukarkan.

Untuk setiap ringkasan, dashboard harus menyebutkan apakah nilai tersebut merupakan rata-rata, minimum, maksimum, total, jumlah kejadian, durasi, atau statistik lain.

---

# 8. Desain Visual dan Tata Letak

## 8.1 Acuan desain

Gunakan desain NTT Marine Insight yang telah disepakati sebagai acuan utama.

Tata letak tidak boleh diubah secara besar-besaran tanpa persetujuan.

Komposisi utama:

- Sidebar di sebelah kiri.
- Header pada bagian atas.
- Kartu ringkasan di bagian atas konten.
- Peta SST besar di bagian tengah.
- Panel filter waktu dan filter lokasi di sebelah kanan.
- Panel informasi titik di bawah filter atau pada bagian kanan peta.
- Deretan kartu analisis ringkas di bagian bawah.

## 8.2 Warna

Gunakan tema terang:

- Latar utama putih.
- Panel dan kartu putih.
- Garis pembatas abu-abu muda.
- Teks utama abu-abu gelap atau navy.
- Aksen biru atau teal secukupnya.
- Warna peta digunakan untuk menyampaikan nilai data.

Hindari:

- Background gelap penuh.
- Neon berlebihan.
- Efek glow.
- Gradien dekoratif.
- Glassmorphism.
- Kartu dengan terlalu banyak bayangan.
- Animasi yang tidak mendukung fungsi.
- Tampilan futuristik yang berlebihan.

## 8.3 Tipografi

- Gunakan jenis huruf yang mudah dibaca.
- Bedakan judul, label, nilai, dan keterangan secara konsisten.
- Jangan menggunakan ukuran font terlalu kecil untuk legenda, tabel, atau informasi peta.
- Gunakan format angka dan tanggal yang konsisten.

## 8.4 Responsivitas

Pada desktop, pertahankan komposisi utama sesuai referensi.

Pada layar yang lebih kecil:

- Sidebar dapat berubah menjadi menu ringkas.
- Kartu ringkasan dapat ditata ulang.
- Peta tetap mendapat ruang yang memadai.
- Filter dapat dipindahkan ke panel yang dapat dibuka.
- Kartu analisis dapat ditampilkan dalam beberapa baris.

Responsivitas tidak boleh menghilangkan fitur inti.

---

# 9. Halaman Overview

## 9.1 Tujuan

Overview memberikan ringkasan umum kondisi laut dan produksi tangkapan ikan di NTT.

Halaman ini menjadi titik awal pengguna sebelum masuk ke halaman analisis terperinci.

## 9.2 Komponen utama

### A. Kartu ringkasan

Empat kartu utama:

1. SST.
2. MHW.
3. Chlorophyll-a.
4. Produksi Tangkapan Ikan.

Setiap kartu menampilkan:

- Nama variabel.
- Nilai ringkasan.
- Satuan.
- Periode yang digunakan.
- Keterangan singkat.

Nilai harus diperbarui berdasarkan filter yang relevan. Jika data tidak tersedia, tampilkan keterangan yang sesuai.

### B. Peta SST utama

Peta merupakan elemen terbesar pada halaman.

Peta harus menampilkan:

- Wilayah NTT dan perairan sekitarnya.
- Lapisan SST sesuai periode terpilih.
- Legenda suhu dalam °C.
- Garis pantai.
- Skala peta.
- Kontrol zoom.
- Kontrol untuk mengembalikan tampilan ke wilayah NTT.

### C. Panel filter waktu

Panel di sisi kanan memuat mode waktu dan pilihan periode yang relevan.

### D. Filter lokasi

Pengguna dapat memilih seluruh wilayah NTT atau wilayah yang didukung data.

Filter kabupaten/kota hanya digunakan jika batas dan metode pengaitan datanya benar-benar tersedia.

### E. Informasi titik

Ketika pengguna mengeklik peta, tampilkan informasi yang tersedia untuk lokasi tersebut:

- Koordinat.
- SST.
- Status MHW.
- Chlorophyll-a.
- Periode yang sedang dipilih.

Variabel yang tidak memiliki data pada lokasi atau periode tersebut harus diberi keterangan tersendiri.

### F. Kartu analisis bagian bawah

Lima kartu ringkas:

1. SST.
2. MHW.
3. Chlorophyll-a.
4. Produksi Tangkapan Ikan.
5. Analisis Gabungan.

Setiap kartu menampilkan visualisasi singkat dan tautan menuju halaman detail.

## 9.3 Interaksi

- Mengubah mode waktu memperbarui kontrol periode.
- Mengubah periode memperbarui komponen yang relevan.
- Mengeklik lokasi pada peta memperbarui panel informasi titik.
- Mengeklik kartu analisis membuka halaman terkait.
- Mengubah filter lokasi memperbarui peta dan ringkasan yang mendukung filter tersebut.

## 9.4 Kriteria penerimaan

- Pengguna dapat memahami periode aktif.
- Peta tetap menjadi elemen utama.
- Nilai kartu dan peta sesuai dengan data aktual.
- Data hilang tidak ditampilkan sebagai nol.
- Kartu analisis mengarah ke halaman yang benar.

---

# 10. Halaman SST

## 10.1 Tujuan

Menampilkan sebaran suhu permukaan laut dan variasinya dalam ruang dan waktu.

## 10.2 Komponen

- Peta SST besar.
- Filter waktu.
- Filter lokasi jika didukung.
- Legenda suhu.
- Panel informasi titik.
- Grafik perubahan SST selama periode aktif.
- Ringkasan statistik.
- Informasi sumber dan resolusi data.

## 10.3 Interaksi

- Pengguna memilih tanggal dan peta menampilkan SST untuk tanggal tersebut.
- Mode mingguan menampilkan ringkasan untuk minggu yang dipilih.
- Mode bulanan menampilkan ringkasan bulanan.
- Mode tahunan menampilkan ringkasan tahunan.
- Mode 10 tahunan menampilkan ringkasan dekadal.
- Klik pada lokasi menampilkan nilai SST dan koordinat.
- Tooltip grafik menampilkan waktu dan nilai.

## 10.4 Statistik

Statistik yang dapat ditampilkan meliputi rata-rata, minimum, dan maksimum SST, selama dihitung dari data yang valid.

Label statistik harus jelas dan konsisten dengan mode waktu.

## 10.5 Kriteria penerimaan

- Peta dan grafik mengikuti periode yang sama.
- Legenda menampilkan satuan.
- Nilai titik dapat ditelusuri ke grid sumber.
- Statistik agregat memiliki keterangan metode.
- Periode tanpa data ditampilkan secara eksplisit.

---

# 11. Halaman MHW

## 11.1 Tujuan

Mengeksplorasi kejadian Marine Heatwave berdasarkan tanggal, lokasi, durasi, dan intensitas.

## 11.2 Komponen

- Peta status MHW.
- Filter waktu.
- Grafik timeline kejadian.
- Tabel kejadian MHW.
- Ringkasan jumlah kejadian.
- Ringkasan durasi dan intensitas jika tersedia.
- Panel detail kejadian.
- Keterangan metode deteksi.

## 11.3 Tabel kejadian

Kolom yang dapat ditampilkan sesuai ketersediaan keluaran notebook:

- ID kejadian.
- Tanggal mulai.
- Tanggal akhir.
- Durasi dalam hari.
- Intensitas rata-rata.
- Intensitas maksimum.
- Lokasi atau indeks grid.
- Status validitas.

Kolom yang tidak tersedia pada hasil analisis tidak boleh diisi dengan angka buatan.

## 11.4 Interaksi

- Klik kejadian pada tabel menyorot lokasi atau periode terkait.
- Klik titik pada peta menampilkan status MHW.
- Memilih periode mengubah ringkasan frekuensi dan intensitas.
- Memilih mode bulanan atau tahunan merangkum kejadian pada periode tersebut.
- Mode 10 tahunan merangkum kejadian dalam rentang dekadal yang tersedia.

## 11.5 Kondisi tanpa data

Bedakan dua kondisi berikut:

**Tidak ada kejadian terdeteksi**

Data valid tersedia, tetapi tidak ditemukan MHW pada periode tersebut.

**Data tidak tersedia**

Tidak ada data valid untuk periode atau lokasi tersebut.

Kedua kondisi tidak boleh menggunakan pesan atau visualisasi yang sama.

## 11.6 Kriteria penerimaan

- Semua informasi kejadian berasal dari hasil deteksi.
- Durasi dan intensitas ditampilkan sesuai definisi metode.
- Pengguna dapat mengetahui tanggal kejadian.
- Metode deteksi dapat diperiksa.
- Tidak ada klaim bahwa kejadian MHW menyebabkan dampak tertentu tanpa analisis pendukung.

---

# 12. Halaman Chlorophyll-a

## 12.1 Tujuan

Mengeksplorasi konsentrasi dan sebaran spasial chlorophyll-a di perairan NTT.

## 12.2 Komponen

- Peta chlorophyll-a.
- Filter waktu.
- Filter lokasi jika tersedia.
- Legenda dengan satuan yang sesuai.
- Grafik perubahan chlorophyll-a.
- Ringkasan statistik.
- Panel informasi titik.
- Keterangan periode dan kualitas data.

## 12.3 Interaksi

- Pengguna memilih tanggal atau periode yang tersedia.
- Peta menampilkan data sesuai periode.
- Klik lokasi menampilkan nilai chlorophyll-a jika tersedia.
- Grafik mengikuti filter waktu.
- Mode agregat menampilkan statistik sesuai metode.
- Periode yang tidak tersedia menampilkan keterangan yang jelas.

## 12.4 Kualitas data

Jika sumber menggunakan quality flag, dashboard harus mengikuti aturan kualitas yang ditetapkan dalam proses analisis.

Data yang tidak valid tidak boleh otomatis dianggap sebagai konsentrasi nol.

## 12.5 Kriteria penerimaan

- Satuan sesuai metadata.
- Periode aktual ditampilkan.
- Data hilang dibedakan dari nilai rendah.
- Metode agregasi atau penyelarasan grid terdokumentasi.

---

# 13. Halaman Analisis Gabungan

## 13.1 Tujuan

Membandingkan kondisi MHW dan non-MHW dengan variasi chlorophyll-a berdasarkan data yang memiliki periode dan cakupan spasial yang sesuai.

## 13.2 Komponen

- Filter waktu.
- Peta atau panel perbandingan.
- Visualisasi chlorophyll-a pada kondisi MHW dan non-MHW.
- Grafik statistik per kelompok.
- Jumlah observasi valid.
- Ringkasan hasil analisis.
- Keterangan metode dan keterbatasan.

## 13.3 Perbandingan MHW dan non-MHW

Dashboard harus menggunakan definisi kelompok yang sama dengan notebook.

Pengguna harus dapat memahami:

- Bagaimana kondisi MHW ditentukan.
- Bagaimana kondisi non-MHW ditentukan.
- Periode yang digunakan.
- Grid atau wilayah yang dibandingkan.
- Jumlah data valid untuk setiap kelompok.

Jika data chlorophyll-a dan SST tidak memiliki periode yang sama, analisis hanya menggunakan periode tumpang tindih yang valid.

## 13.4 Interpretasi

Visualisasi dapat menunjukkan perbedaan pola atau statistik antarkelompok, tetapi perbedaan tersebut tidak otomatis membuktikan hubungan sebab-akibat.

Dashboard tidak boleh menampilkan koefisien korelasi, p-value, atau klaim signifikansi statistik jika hasil tersebut tidak benar-benar dihitung dan diverifikasi.

## 13.5 Kriteria penerimaan

- Periode analisis ditampilkan.
- Definisi kelompok jelas.
- Jumlah observasi valid tersedia jika keluaran mendukungnya.
- Statistik sesuai hasil notebook.
- Narasi tidak menyatakan kausalitas tanpa bukti yang memadai.

---

# 14. Halaman Produksi Tangkapan Ikan

## 14.1 Tujuan

Menampilkan produksi tangkapan ikan laut di NTT dan perubahan antartahun.

## 14.2 Komponen

- Grafik produksi tahunan.
- Filter tahun.
- Pilihan rentang tahun.
- Filter kategori ikan jika tersedia.
- Filter jenis penangkapan jika tersedia.
- Tabel data produksi.
- Satuan dan definisi indikator.
- Sumber data.

## 14.3 Perilaku filter waktu

Jika data hanya tersedia tahunan:

- Mode tahunan diaktifkan.
- Mode 10 tahunan dapat diaktifkan jika rentang dan agregasinya sesuai.
- Mode harian, mingguan, dan bulanan dinonaktifkan atau disertai penjelasan.

Produksi tahunan tidak boleh diinterpolasi menjadi produksi harian hanya agar tampilan seragam dengan SST.

## 14.4 Grafik produksi

Grafik harus menampilkan:

- Tahun pada sumbu waktu.
- Nilai produksi pada sumbu vertikal.
- Satuan produksi.
- Legenda kategori jika lebih dari satu kategori ditampilkan.
- Tooltip berisi tahun dan nilai.

Jika grafik menampilkan total semua kategori, pastikan kategori tidak tumpang tindih dan tidak dihitung dua kali.

## 14.5 Hubungan dengan kondisi laut

Dashboard dapat menyajikan data produksi sebagai konteks untuk membaca kondisi laut pada tahun yang sama.

Namun, perubahan produksi dapat dipengaruhi oleh faktor lain, seperti:

- Upaya penangkapan.
- Alat tangkap.
- Perubahan kebijakan.
- Ketersediaan ikan.
- Kondisi oseanografi lain.
- Perubahan sistem pencatatan.
- Perubahan kategori pada sumber data.

Jika faktor-faktor tersebut tidak dianalisis, keterbatasan ini perlu disampaikan.

## 14.6 Kriteria penerimaan

- Angka sesuai dengan dataset yang telah divalidasi.
- Tahun dan satuan terlihat jelas.
- Kategori mengikuti sumber data.
- Data tidak diubah ke resolusi waktu yang tidak didukung.
- Interpretasi tidak mengklaim sebab-akibat secara langsung.

---

# 15. Halaman Sintesis

## 15.1 Tujuan

Merangkum hasil utama dari seluruh analisis agar pengguna dapat memahami gambaran umum penelitian.

## 15.2 Komponen

- Ringkasan pola SST.
- Ringkasan kejadian MHW.
- Ringkasan chlorophyll-a.
- Ringkasan perbandingan MHW dan non-MHW.
- Ringkasan produksi tangkapan ikan.
- Interpretasi hasil.
- Keterbatasan penelitian.
- Tautan menuju grafik atau peta yang mendukung setiap temuan.

## 15.3 Ketentuan isi

Narasi sintesis harus berdasarkan hasil yang benar-benar tersedia.

Hasil, interpretasi, dan keterbatasan harus dibedakan.

Dashboard tidak boleh menghasilkan kesimpulan otomatis yang tidak dapat ditelusuri ke hasil analisis.

---

# 16. Halaman Metodologi

## 16.1 Tujuan

Menjelaskan bagaimana data diproses dan bagaimana setiap hasil visualisasi diperoleh.

## 16.2 Informasi yang ditampilkan

- Sumber data.
- Rentang waktu setiap dataset.
- Resolusi spasial.
- Resolusi temporal.
- Satuan variabel.
- Definisi SST dan chlorophyll-a.
- Metode deteksi MHW yang digunakan.
- Aturan agregasi mingguan, bulanan, tahunan, dan 10 tahunan.
- Penanganan data hilang.
- Quality flag jika digunakan.
- Penyelarasan grid jika dilakukan.
- Tanggal pemrosesan data.
- Keterbatasan penelitian.

Metodologi harus sesuai dengan notebook yang digunakan. Halaman ini tidak boleh menjelaskan metode yang sebenarnya tidak dijalankan.

---

# 17. Interaksi Peta

## 17.1 Fitur dasar

Peta harus mendukung:

- Zoom in dan zoom out.
- Menggeser peta.
- Klik lokasi.
- Tooltip atau popup informasi.
- Legenda.
- Skala peta.
- Reset tampilan ke wilayah NTT.
- Pengaktifan atau penonaktifan layer jika diperlukan.

## 17.2 Informasi lokasi

Ketika pengguna mengeklik peta, tampilkan:

- Koordinat.
- Tanggal atau periode aktif.
- Nilai SST jika tersedia.
- Status MHW jika tersedia.
- Nilai chlorophyll-a jika tersedia.

Informasi yang tidak tersedia harus ditandai sebagai tidak tersedia, bukan diisi dengan nol.

## 17.3 Nilai grid

Dashboard harus menjelaskan bagaimana nilai lokasi diperoleh.

Contohnya:

- Nilai sel grid yang diklik.
- Nilai sel grid terdekat.
- Nilai hasil interpolasi.

Interpolasi tidak boleh dilakukan secara diam-diam.

## 17.4 Legenda dan warna

Setiap variabel menggunakan legenda yang sesuai.

- SST menggunakan skala suhu.
- MHW menggunakan kategori status atau skala intensitas.
- Chlorophyll-a menggunakan skala konsentrasi.
- Data tidak tersedia menggunakan penanda netral yang berbeda dari nilai rendah.

Warna harus mudah dibedakan dan tidak menjadi satu-satunya cara untuk menyampaikan informasi.

---

# 18. Grafik dan Tabel

## 18.1 Grafik

Setiap grafik harus memiliki:

- Judul yang jelas.
- Nama variabel.
- Satuan.
- Label sumbu.
- Rentang waktu.
- Tooltip.
- Legenda jika diperlukan.
- Keterangan agregasi.

Grafik harus mengikuti filter yang relevan.

Jika data tidak tersedia, tampilkan pesan yang menjelaskan penyebabnya.

## 18.2 Tabel

Tabel harus memiliki:

- Nama kolom yang jelas.
- Satuan.
- Pengurutan data jika relevan.
- Pencarian atau filter jika diperlukan.
- Keterangan sumber data.
- Informasi periode.

Ekspor CSV dapat ditambahkan jika dibutuhkan. File ekspor harus mempertahankan nilai, satuan, dan metadata penting.

---

# 19. Integrasi dengan Enam Notebook Analisis

Dashboard menggunakan keluaran enam notebook yang menjadi bagian pipeline penelitian.

Nama file final harus mengikuti notebook yang benar-benar tersedia. Nama berikut merupakan rancangan fungsi, bukan keharusan mengganti nama file yang sudah ada.

## Notebook 1 — Persiapan dan Penggabungan Data

Fungsi:

- Memeriksa dataset dan metadata.
- Memvalidasi data SST dan chlorophyll-a.
- Memeriksa cakupan waktu dan wilayah.
- Menangani nilai hilang sesuai metode yang ditetapkan.
- Menyiapkan data dan metadata yang diperlukan untuk analisis berikutnya.

Keluaran yang dapat digunakan dashboard:

- Inventaris data.
- Metadata sumber.
- Laporan kualitas data.
- Data hasil persiapan yang tervalidasi.

## Notebook 2 — Analisis SST dan Deteksi MHW

Fungsi:

- Menganalisis SST.
- Menyusun klimatologi dan ambang sesuai metode penelitian.
- Mendeteksi MHW.
- Menghasilkan statistik dan visualisasi kejadian.

Keluaran yang dapat digunakan dashboard:

- Data SST.
- Status MHW.
- Statistik kejadian.
- Durasi dan intensitas jika tersedia.
- Metadata metode deteksi.

## Notebook 3 — Analisis Chlorophyll-a

Fungsi:

- Memeriksa kualitas data chlorophyll-a.
- Menganalisis distribusi spasial dan temporal.
- Menyusun statistik sesuai kebutuhan penelitian.

Keluaran yang dapat digunakan dashboard:

- Data chlorophyll-a tervalidasi.
- Ringkasan statistik.
- Metadata periode dan kualitas data.

## Notebook 4 — Analisis Gabungan MHW dan Chlorophyll-a

Fungsi:

- Menentukan periode tumpang tindih.
- Menyelaraskan data secara metodologis jika diperlukan.
- Membandingkan chlorophyll-a pada kondisi MHW dan non-MHW.

Keluaran yang dapat digunakan dashboard:

- Dataset perbandingan.
- Statistik per kelompok.
- Jumlah observasi valid.
- Metadata metode perbandingan.

## Notebook 5 — Visualisasi dan Sintesis Hasil

Fungsi:

- Menghasilkan grafik dan peta untuk pelaporan.
- Menyusun ringkasan visualisasi.
- Menyiapkan hasil yang dibutuhkan untuk halaman Sintesis.

Keluaran yang dapat digunakan dashboard:

- Grafik final.
- Tabel ringkasan.
- Keterangan visualisasi.
- Ringkasan hasil yang telah ditinjau.

## Notebook 6 — Interpretasi Kualitatif dan Konteks Produksi Tangkapan Ikan

Fungsi:

- Memeriksa data produksi tangkapan ikan.
- Menyajikan perubahan produksi sesuai resolusi sumber.
- Menyusun interpretasi deskriptif bersama hasil kondisi laut.
- Mencatat keterbatasan interpretasi.

Keluaran yang dapat digunakan dashboard:

- Data produksi tangkapan ikan.
- Grafik produksi.
- Tabel ringkasan.
- Catatan interpretasi dan keterbatasan.

## Prinsip integrasi

Notebook menjadi sumber perhitungan ilmiah. Dashboard menjadi lapisan visualisasi dan eksplorasi.

Dashboard tidak boleh menyalin atau mengganti logika analisis secara terpisah tanpa alasan yang jelas. Nilai yang ditampilkan harus dapat dibandingkan dengan keluaran notebook.

Sebelum implementasi, nama file, format, nama kolom, satuan, dan skema data yang benar-benar tersedia harus diperiksa.

---

# 20. Kebutuhan Teknis

## 20.1 Antarmuka

Rekomendasi awal:

- React.
- TypeScript.
- CSS atau sistem komponen UI yang konsisten.
- Desain responsif.

Pilihan teknologi final dapat ditentukan setelah struktur proyek yang sudah ada diperiksa. Jika proyek frontend telah menggunakan teknologi tertentu, utamakan konsistensi dengan proyek tersebut.

## 20.2 Peta

MapLibre GL JS atau pustaka peta sejenis dapat digunakan jika sesuai dengan format data dan kebutuhan interaksi.

Untuk dataset grid yang besar:

- Hindari mengirim seluruh data harian ke browser sebagai satu objek JSON besar.
- Pertimbangkan raster tiles, layanan data, atau format penyajian spasial yang efisien.
- Pastikan sumber basemap dan data geografis sesuai lisensinya.
- Pertahankan resolusi data yang benar-benar didukung sumber.

## 20.3 Grafik

Pustaka grafik harus mendukung:

- Sumbu waktu.
- Tooltip.
- Legenda.
- Pembaruan berdasarkan filter.
- Label satuan.
- Tampilan yang konsisten antarhalaman.

## 20.4 Pengolahan data

- Pengolahan ilmiah tetap dilakukan pada notebook atau pipeline analisis.
- Data yang sudah diproses disiapkan untuk digunakan oleh dashboard.
- Agregasi yang sering digunakan dapat diproses sebelumnya jika data besar.
- Perubahan filter tidak boleh membuat browser menghitung ulang seluruh dataset besar.
- Hasil yang ditampilkan harus konsisten dengan data sumber.

## 20.5 Penyimpanan dan format

Format akhir ditentukan berdasarkan ukuran dan struktur data.

Format yang dapat dipertimbangkan:

- NetCDF untuk data grid ilmiah.
- Parquet atau CSV untuk tabel.
- GeoJSON untuk data geografis berukuran sesuai.
- Raster tiles atau format lain untuk peta berukuran besar.

Tidak perlu menggunakan satu format untuk seluruh jenis data.

## 20.6 Deployment

Platform deployment ditentukan setelah mempertimbangkan:

- Ukuran data.
- Kebutuhan backend.
- Kebutuhan penyimpanan.
- Batas bandwidth.
- Kebutuhan pembaruan data.
- Biaya operasional.

Credential atau API key rahasia tidak boleh disimpan dalam kode frontend atau repository publik.

---

# 21. Performa, Aksesibilitas, dan Penanganan Error

## 21.1 Performa

- Navigasi antarhalaman harus responsif.
- Filter menampilkan indikator loading jika diperlukan.
- Peta tidak perlu memuat ulang seluruh aplikasi ketika tanggal berubah.
- Data besar disajikan dengan pendekatan yang efisien.
- Grafik hanya memuat data yang diperlukan untuk periode aktif jika memungkinkan.

## 21.2 Penanganan error

Jika data gagal dibaca, tampilkan pesan yang jelas.

Jika pengguna memilih periode di luar cakupan data, tampilkan periode yang tersedia.

Jika tidak ada kejadian MHW pada data valid, tampilkan bahwa tidak ada kejadian yang terdeteksi.

Jika tidak ada data valid, tampilkan bahwa data tidak tersedia.

Kedua kondisi tersebut harus dibedakan.

## 21.3 Aksesibilitas

- Kontras teks memadai.
- Font mudah dibaca.
- Kontrol memiliki label yang jelas.
- Tombol memiliki area klik yang nyaman.
- Navigasi keyboard didukung jika memungkinkan.
- Warna bukan satu-satunya penanda status.

---

# 22. Keamanan dan Lisensi

- Jangan menyimpan API key atau token rahasia dalam repository publik.
- Pastikan lisensi sumber data, shapefile, dan basemap sesuai.
- Cantumkan atribusi sumber data jika diwajibkan.
- Jangan menampilkan informasi pribadi yang tidak dibutuhkan.
- Dokumentasikan sumber dan tanggal pemrosesan data.
- Pastikan data yang dipublikasikan memang boleh dibagikan secara publik.

---

# 23. Tahapan Pengembangan

Tahapan berikut merupakan rencana pengembangan produk. Urutan ini tidak berarti seluruh aplikasi harus langsung dibuat sekaligus.

## Tahap A — Audit data dan notebook

- Periksa seluruh notebook dan keluaran yang tersedia.
- Validasi cakupan waktu, satuan, resolusi, dan struktur data.
- Catat variabel yang dapat ditampilkan.
- Tentukan kontrak data untuk dashboard.

**Hasil:** inventaris dataset dan spesifikasi keluaran.

## Tahap B — Finalisasi desain

- Gunakan desain referensi yang telah disepakati.
- Pertahankan sidebar, kartu ringkasan, peta utama, filter kanan, dan kartu analisis bawah.
- Terapkan tema putih.
- Finalisasi perilaku filter waktu.
- Tentukan kondisi saat data tidak tersedia.

**Hasil:** desain antarmuka dan daftar interaksi.

## Tahap C — Prototipe antarmuka

- Bangun layout dan navigasi.
- Buat komponen filter.
- Buat kartu ringkasan dan panel peta.
- Gunakan data ilustratif hanya untuk pengujian tampilan.
- Beri label yang jelas pada data ilustratif.

**Hasil:** prototipe antarmuka.

## Tahap D — Integrasi data

- Hubungkan halaman dengan keluaran notebook.
- Sambungkan peta dan grafik.
- Validasi satuan, tanggal, koordinat, dan agregasi.
- Pastikan data hilang ditangani dengan benar.

**Hasil:** dashboard dengan data penelitian aktual.

## Tahap E — Pengujian

- Uji mode harian, mingguan, bulanan, tahunan, dan 10 tahunan.
- Uji periode di luar ketersediaan data.
- Uji klik lokasi.
- Uji setiap halaman dan navigasi.
- Bandingkan nilai dashboard dengan keluaran notebook.
- Tinjau ulang interpretasi dan klaim ilmiah.

**Hasil:** dashboard tervalidasi dan daftar perbaikan.

## Tahap F — Deployment dan dokumentasi

- Siapkan konfigurasi deployment.
- Uji aplikasi pada lingkungan deployment.
- Dokumentasikan cara menjalankan aplikasi.
- Dokumentasikan cara memperbarui data.
- Pastikan sumber data dan keterbatasan terlihat.

**Hasil:** dashboard siap dibagikan dan dokumentasi penggunaan.

---

# 24. Kriteria Penerimaan Akhir

Dashboard dinyatakan memenuhi kebutuhan produk apabila:

- [ ] Seluruh halaman tersedia: Overview, SST, MHW, Chlorophyll-a, Analisis Gabungan, Produksi Tangkapan Ikan, Sintesis, dan Metodologi.
- [ ] Tema putih diterapkan.
- [ ] Tata letak sesuai desain referensi.
- [ ] Sidebar berada di kiri.
- [ ] Kartu ringkasan berada di atas.
- [ ] Peta utama berukuran besar.
- [ ] Panel filter berada di kanan peta pada tampilan desktop.
- [ ] Panel analisis ringkas berada di bagian bawah.
- [ ] Mode harian, mingguan, bulanan, tahunan, dan 10 tahunan tersedia pada variabel yang mendukungnya.
- [ ] Filter mengikuti periode data yang tersedia.
- [ ] Peta dan grafik mengikuti filter yang relevan.
- [ ] Pengguna dapat mengeklik lokasi untuk melihat nilai dan koordinat.
- [ ] MHW menampilkan tanggal, durasi, dan intensitas jika tersedia.
- [ ] Chlorophyll-a tidak mengisi data hilang dengan nol.
- [ ] Produksi tangkapan ikan ditampilkan pada resolusi waktu asli.
- [ ] Analisis gabungan hanya menggunakan data yang sesuai dan tersedia.
- [ ] Sumber, satuan, metode, resolusi, dan keterbatasan dapat ditemukan.
- [ ] Tidak ada variabel atau analisis ONI.
- [ ] Tidak ada angka ilustratif yang disajikan sebagai hasil penelitian.
- [ ] Tidak ada klaim kausal yang tidak didukung analisis.
- [ ] Data tidak tersedia dibedakan dari nilai nol atau tidak adanya kejadian.
- [ ] Dokumentasi penggunaan dan pembaruan data tersedia.

---

# 25. Keputusan yang Perlu Dikonfirmasi

Sebelum implementasi final, beberapa hal perlu dipastikan berdasarkan file aktual:

1. Nama dan format keluaran setiap notebook.
2. Rentang waktu aktual SST, MHW, dan chlorophyll-a.
3. Definisi minggu yang akan digunakan.
4. Definisi periode 10 tahunan.
5. Statistik yang ditampilkan pada setiap mode waktu.
6. Metode deteksi MHW yang benar-benar digunakan.
7. Satuan dan definisi indikator produksi tangkapan ikan.
8. Kategori produksi ikan yang tersedia dalam dataset.
9. Metode penyelarasan grid jika analisis gabungan membutuhkannya.
10. Format penyajian peta yang sesuai dengan ukuran data.
11. Teknologi frontend dan backend berdasarkan struktur proyek yang ada.
12. Platform deployment.
13. Kebutuhan ekspor tabel atau grafik.

Keputusan tersebut tidak boleh diisi dengan asumsi yang belum diperiksa.

---

# 26. Kesimpulan

NTT Marine Insight dirancang sebagai dashboard ilmiah yang interaktif, mudah dipahami, dan berfokus pada eksplorasi data laut NTT.

Pengalaman utamanya adalah peta SST yang besar, filter waktu yang fleksibel, halaman khusus untuk MHW dan chlorophyll-a, analisis gabungan yang transparan, serta visualisasi produksi tangkapan ikan berdasarkan resolusi asli data.

Dashboard menggunakan hasil analisis dari enam notebook sebagai sumber perhitungan. Setiap visualisasi harus dapat ditelusuri ke data, metode, dan periode yang jelas.

Desain visual mengikuti referensi yang disepakati: latar putih, sidebar kiri, kartu ringkasan di bagian atas, peta utama di tengah, filter di kanan, dan kartu analisis di bawah.

**Prinsip terakhir: dashboard harus membantu pengguna memahami data yang benar-benar ada, bukan membuat data terlihat lengkap ketika sebenarnya tidak tersedia.**
