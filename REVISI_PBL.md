# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Revisi Notebook Analisis Marine Heatwave (MHW), Chlorophyll-a, dan Konteks Produksi Ikan di Nusa Tenggara Timur

## 1. Informasi Proyek

**Nama proyek:** Analisis Marine Heatwave terhadap Kondisi Chlorophyll-a dan Konteks Produksi Ikan di Nusa Tenggara Timur

**Repositori GitHub:**  
https://github.com/yusuf-al-qodri/PBL_KLIMTROP_KEL10_Analisis_MHW_Terhadap_Produksi_Ikan_diNTT

**Wilayah penelitian:** Perairan Nusa Tenggara Timur (NTT)

**Periode utama analisis SST dan MHW:** 1 Januari 2000–31 Desember 2020

**Variabel utama:**
- Sea Surface Temperature (SST)
- Marine Heatwave (MHW)
- Chlorophyll-a
- Produksi atau hasil tangkapan ikan sebagai konteks pendukung

**Mode kerja awal:** Audit repositori, evaluasi metode, dan penyusunan rancangan revisi notebook.

**Batasan penting:** Jangan menjalankan notebook, mengubah kode, menghapus file, mengunduh data baru, atau mengganti struktur repositori sebelum pengguna memberikan persetujuan eksplisit.

---

## 2. Latar Belakang

Penelitian ini bertujuan menganalisis kejadian Marine Heatwave di perairan Nusa Tenggara Timur pada periode 2000–2020, mengidentifikasi karakteristik spasial dan temporalnya, serta mengevaluasi keterkaitannya dengan variasi konsentrasi chlorophyll-a.

Analisis tidak hanya dilakukan berdasarkan rata-rata suhu permukaan laut secara umum. Deteksi MHW perlu dilakukan pada setiap grid spasial agar perbedaan waktu kejadian, durasi, dan intensitas antarwilayah dapat dipertahankan.

Selanjutnya, kondisi chlorophyll-a selama kejadian MHW dibandingkan dengan kondisi non-MHW menggunakan periode pembanding yang relevan. Hasilnya kemudian diinterpretasikan bersama data produksi atau hasil tangkapan ikan sesuai dengan resolusi temporal dan spasial data yang tersedia.

Penelitian ini bersifat analitis dan eksploratif. Hubungan yang ditemukan tidak boleh langsung dinyatakan sebagai hubungan sebab-akibat, terutama apabila data produksi ikan hanya tersedia pada skala tahunan atau tingkat provinsi.

---

## 3. Tujuan Proyek

### 3.1 Tujuan Umum

Menganalisis karakteristik kejadian MHW di perairan NTT selama 2000–2020, mengevaluasi perubahan chlorophyll-a pada periode MHW dibandingkan periode non-MHW, dan menginterpretasikan hasilnya dalam konteks produksi atau hasil tangkapan ikan.

### 3.2 Tujuan Khusus

1. Memeriksa kelengkapan, kualitas, resolusi, dan konsistensi data SST, chlorophyll-a, dan produksi ikan.
2. Mendeteksi MHW pada setiap grid SST berdasarkan metode yang terdokumentasi dan dapat dipertanggungjawabkan.
3. Mengidentifikasi setiap kejadian MHW beserta tanggal mulai, tanggal berakhir, durasi, intensitas, dan cakupan spasialnya.
4. Menghasilkan peta spasial untuk setiap kejadian MHW yang telah diidentifikasi.
5. Menganalisis pola chlorophyll-a harian dan bulanan sesuai ketersediaan data.
6. Membandingkan chlorophyll-a selama MHW dengan periode non-MHW menggunakan pembanding temporal yang relevan.
7. Mengevaluasi konteks produksi atau hasil tangkapan ikan berdasarkan resolusi data yang benar-benar tersedia.
8. Menyusun hasil analisis yang transparan, dapat direproduksi, dan tidak mengandung klaim berlebihan.

---

## 4. Pertanyaan Penelitian

1. Bagaimana distribusi spasial dan temporal kejadian MHW di perairan NTT selama 2000–2020?
2. Bagaimana karakteristik durasi dan intensitas MHW pada setiap grid?
3. Bagaimana kondisi chlorophyll-a selama MHW dibandingkan dengan kondisi non-MHW?
4. Apakah pola perbedaan chlorophyll-a tetap terlihat ketika periode pembanding mempertimbangkan variasi musim?
5. Bagaimana hasil analisis MHW dan chlorophyll-a dapat diinterpretasikan bersama data produksi ikan yang tersedia?
6. Apa keterbatasan data dan metode yang memengaruhi interpretasi hasil penelitian?

---

## 5. Ruang Lingkup

### 5.1 Termasuk dalam Penelitian

- Pemeriksaan data dan metadata.
- Analisis SST harian periode 2000–2020.
- Deteksi MHW per grid.
- Penyusunan katalog kejadian MHW.
- Peta cakupan spasial, durasi, dan intensitas setiap kejadian.
- Analisis chlorophyll-a pada periode yang tersedia.
- Perbandingan kondisi MHW dan non-MHW.
- Ringkasan bulanan dan tahunan sebagai analisis tambahan.
- Interpretasi kualitatif data produksi atau hasil tangkapan ikan.
- Evaluasi keterbatasan data, asumsi, dan ketidakpastian.

### 5.2 Tidak Termasuk dalam Ruang Lingkup

- Analisis ONI atau ENSO.
- Klaim bahwa MHW secara langsung menyebabkan kenaikan atau penurunan hasil tangkapan ikan.
- Penentuan lokasi penangkapan ikan berdasarkan data yang tidak memiliki informasi spasial memadai.
- Interpolasi atau peningkatan resolusi yang menciptakan detail spasial semu.
- Penggantian nilai chlorophyll-a yang hilang dengan nol.
- Penggunaan data atau periode yang belum diverifikasi.
- Pembuatan dashboard atau aplikasi baru sebagai bagian dari revisi notebook ini, kecuali diminta secara terpisah.

---

## 6. Persyaratan Data

### 6.1 Data SST

Sumber yang direncanakan adalah NOAA Optimum Interpolation Sea Surface Temperature (OISST) v2.1 harian.

Periode target adalah 1 Januari 2000 sampai 31 Desember 2020, yaitu 21 tahun kalender.

Resolusi spasial produk OISST yang digunakan diperkirakan sekitar 0,25°. Antigravity wajib memverifikasi resolusi aktual berdasarkan metadata file, bukan hanya berdasarkan asumsi.

Pemeriksaan data meliputi:
- Rentang tanggal.
- Jumlah file tahunan.
- Jumlah observasi waktu.
- Konsistensi koordinat latitude dan longitude.
- Resolusi grid.
- Satuan suhu.
- Nilai yang hilang.
- Duplikasi waktu.
- Keseragaman format variabel.
- Konsistensi batas wilayah NTT.

Periode 2000–2020 harus dipertahankan secara konsisten untuk analisis utama SST dan MHW, kecuali ditemukan masalah data yang harus dijelaskan dan disetujui pengguna.

Perlu diperhatikan bahwa periode 21 tahun ini bukan klimatologi standar 30 tahun. Jika digunakan sebagai baseline klimatologi dan persentil, keterbatasan tersebut harus dijelaskan.

### 6.2 Data Chlorophyll-a

Data chlorophyll-a dapat berasal dari produk satelit ocean-colour, termasuk produk Copernicus Marine yang telah tersedia dalam bentuk file NetCDF atau arsip ZIP.

Antigravity harus terlebih dahulu memeriksa:
- Nama produk dan sumber.
- Rentang tanggal yang benar-benar tersedia.
- Resolusi spasial.
- Resolusi temporal.
- Variabel dan satuan chlorophyll-a.
- Sistem koordinat.
- Nilai fill value dan missing value.
- Persentase data valid.
- Ketersediaan observasi pada setiap kejadian MHW.
- Konsistensi struktur file.

Jangan mengasumsikan data chlorophyll-a tersedia lengkap sejak tahun 2000. Produk satelit ocean-colour tertentu baru tersedia mulai periode setelah tahun tersebut.

Jika data chlorophyll-a hanya tersedia untuk sebagian periode 2000–2020, analisis gabungan harus menggunakan rentang waktu yang benar-benar tumpang tindih antara SST/MHW dan chlorophyll-a.

Rentang waktu yang lebih pendek tidak boleh disajikan seolah-olah mewakili keseluruhan periode penelitian.

**Ketentuan penanganan missing value:**

Nilai chlorophyll-a yang hilang akibat awan, kualitas pengamatan, atau keterbatasan sensor harus tetap ditandai sebagai data tidak tersedia. Nilai tersebut tidak boleh diubah menjadi nol.

Ringkasan statistik harus menggunakan observasi valid dan mencantumkan jumlah atau proporsi data valid jika memungkinkan.

### 6.3 Data Produksi atau Hasil Tangkapan Ikan

Data produksi ikan harus diperiksa langsung dari file yang tersedia.

Antigravity wajib mengidentifikasi:
- Rentang tahun.
- Nama provinsi.
- Jenis ikan atau kategori komoditas.
- Jenis penangkapan atau kategori produksi.
- Satuan produksi.
- Frekuensi temporal.
- Ketersediaan data untuk NTT.
- Nilai kosong, duplikasi, dan perubahan kategori antarperiode.

Jangan mengasumsikan data ikan memiliki resolusi bulanan atau spasial jika informasi tersebut tidak tersedia.

Jika data hanya tersedia pada skala tahunan dan tingkat provinsi, hasilnya hanya boleh digunakan sebagai konteks tahunan produksi ikan NTT.

Dalam kondisi tersebut, data tidak cukup untuk menghubungkan perubahan hasil tangkapan dengan satu kejadian MHW tertentu secara langsung.

---

## 7. Metode Deteksi MHW

### 7.1 Deteksi pada Setiap Grid

Deteksi MHW harus dilakukan terhadap deret waktu SST harian pada setiap grid yang dianalisis.

Jangan terlebih dahulu merata-ratakan seluruh wilayah NTT menjadi satu deret waktu, karena langkah tersebut dapat menghilangkan variasi spasial dan perbedaan waktu kejadian antargrid.

Setiap grid dapat memiliki tanggal mulai, tanggal berakhir, durasi, dan intensitas MHW yang berbeda.

### 7.2 Ambang Deteksi

Metode yang direncanakan mengikuti pendekatan Hobday dan kolega atau implementasi yang setara, dengan prinsip umum:
- Menghitung klimatologi SST.
- Menghitung ambang persentil ke-90 berdasarkan siklus musiman.
- Mengidentifikasi hari ketika SST melampaui ambang.
- Menentukan kejadian yang memenuhi durasi minimum lima hari berturut-turut.

Antigravity wajib memeriksa implementasi aktual pada notebook, termasuk:
- Periode baseline.
- Metode penghitungan klimatologi.
- Metode persentil.
- Lebar jendela musiman.
- Penanganan tahun kabisat dan 29 Februari.
- Penanganan missing value.
- Penggabungan jeda singkat antahari jika diterapkan.
- Definisi intensitas dan durasi.
- Perlakuan terhadap kejadian di awal atau akhir periode data.

Jangan menyatakan metode telah sesuai sebelum kode dan parameternya diperiksa.

Jika metode yang ada berbeda dari rancangan di atas, dokumentasikan perbedaannya dan usulkan revisi tanpa langsung mengubah kode.

### 7.3 Karakteristik MHW

Setidaknya, hasil deteksi harus dapat menghasilkan informasi berikut untuk setiap kejadian lokal pada setiap grid:

- Tanggal mulai.
- Tanggal berakhir.
- Durasi dalam hari.
- Intensitas rata-rata.
- Intensitas maksimum.
- Anomali SST jika tersedia.
- Koordinat grid.
- Status kelengkapan data.

Definisi intensitas harus dinyatakan secara jelas, misalnya anomali suhu di atas ambang klimatologi atau ambang persentil yang digunakan.

Durasi dihitung dari hari-hari yang memenuhi definisi kejadian, bukan berdasarkan selisih tanggal yang tidak konsisten.

### 7.4 Kejadian Lokal dan Kejadian Regional

Penting untuk membedakan dua konsep:

**Kejadian lokal:** MHW yang terdeteksi pada satu grid berdasarkan deret waktu SST grid tersebut.

**Kejadian regional:** Kelompok kejadian lokal yang secara spasial dan temporal memiliki hubungan yang cukup kuat berdasarkan aturan pengelompokan yang eksplisit.

Beberapa grid yang mengalami MHW pada waktu berdekatan tidak otomatis berarti mengalami satu kejadian regional yang sama.

Jika penelitian membutuhkan katalog kejadian regional, Antigravity harus terlebih dahulu mengusulkan metode pengelompokan yang jelas, misalnya berdasarkan kedekatan waktu dan konektivitas spasial, kemudian menjelaskan keterbatasannya.

Jika tidak tersedia metode pengelompokan regional yang dapat dipertanggungjawabkan, gunakan istilah kejadian lokal per grid dan susun ringkasan spasial-temporal secara terpisah.

Jangan menggabungkan semua grid menjadi satu kejadian hanya berdasarkan kesamaan tahun atau bulan.

### 7.5 Kejadian yang Melintasi Bulan atau Tahun

Kejadian MHW yang berlangsung melewati pergantian bulan atau tahun harus dipertahankan sebagai satu kejadian lokal apabila syarat kejadian tetap terpenuhi.

Jangan memotong satu kejadian menjadi beberapa kejadian baru hanya karena pergantian kalender.

Ringkasan bulanan atau tahunan boleh dibuat sebagai analisis tambahan, tetapi harus dibedakan dari identitas kejadian aslinya.

---

## 8. Persyaratan Visualisasi MHW

### 8.1 Peta Setiap Kejadian

Tujuan utama visualisasi adalah memperlihatkan karakteristik setiap kejadian MHW, bukan hanya status MHW pada tanggal tertentu.

Setiap kejadian yang telah diidentifikasi harus dapat ditampilkan melalui peta yang menggambarkan informasi spasial yang relevan.

Minimal, sediakan tiga jenis visualisasi atau layer.

**A. Peta cakupan kejadian**
- Memperlihatkan grid yang mengalami MHW.
- Menampilkan batas wilayah atau garis pantai yang relevan.
- Menampilkan ID kejadian dan tanggal periode kejadian.
- Menjelaskan grid mana yang memenuhi definisi kejadian.

**B. Peta intensitas**
- Menampilkan intensitas rata-rata atau intensitas maksimum selama kejadian.
- Menyatakan metrik yang dipakai dan satuannya.
- Mempertahankan variasi nilai antargrid.
- Tidak menggantikan nilai hilang dengan nol.

**C. Peta durasi**
- Menampilkan durasi MHW dalam hari pada setiap grid.
- Menggunakan durasi lokal per grid.
- Tidak mengasumsikan semua grid memiliki durasi yang sama hanya karena dikelompokkan dalam satu kejadian regional.

Ketiga peta tersebut harus memiliki informasi tanggal, legenda, satuan, dan identitas kejadian yang jelas.

### 8.2 Katalog Kejadian MHW

Buat atau evaluasi kelayakan tabel katalog kejadian yang sekurang-kurangnya memuat:

| Kolom | Keterangan |
|---|---|
| Event ID | Identitas kejadian |
| Grid ID | Identitas grid jika kejadian lokal |
| Tanggal mulai | Tanggal pertama kejadian |
| Tanggal berakhir | Tanggal terakhir kejadian |
| Durasi | Durasi kejadian dalam hari |
| Intensitas rata-rata | Intensitas rata-rata selama kejadian |
| Intensitas maksimum | Intensitas maksimum selama kejadian |
| Latitude | Koordinat lintang grid |
| Longitude | Koordinat bujur grid |
| Cakupan spasial | Jumlah grid atau ukuran area, jika dihitung dengan metode yang jelas |
| Data chlorophyll-a | Ketersediaan data valid untuk periode kejadian |
| Periode pembanding | Referensi periode non-MHW yang digunakan |

Jika menggunakan kejadian regional, tambahkan informasi metode pengelompokan dan metrik cakupan area.

Jangan mengisi nilai yang belum dihitung dengan angka perkiraan.

### 8.3 Ringkasan Bulanan dan Tahunan

Ringkasan bulanan dan tahunan tetap diperbolehkan untuk:
- Jumlah hari MHW.
- Jumlah kejadian.
- Intensitas.
- Distribusi spasial.
- Perubahan karakteristik dari waktu ke waktu.

Namun, ringkasan ini merupakan pelengkap. Ringkasan bulanan atau tahunan tidak boleh menggantikan analisis setiap kejadian yang menjadi fokus utama.

---

## 9. Metode Analisis Chlorophyll-a

### 9.1 Analisis Harian

Jika data harian tersedia, analisis chlorophyll-a pada tanggal-tanggal yang sesuai dengan kejadian MHW.

Untuk setiap kejadian atau grid yang dianalisis, evaluasi:
- Konsentrasi chlorophyll-a selama kejadian.
- Perubahan relatif terhadap periode pembanding.
- Jumlah observasi valid.
- Proporsi missing value.
- Perbedaan pola antarwilayah jika data mencukupi.

Jangan memaksa analisis harian apabila data yang tersedia sebenarnya merupakan komposit dengan periode yang berbeda.

Frekuensi aktual produk harus menjadi dasar interpretasi.

### 9.2 Analisis Bulanan

Analisis bulanan dilakukan sebagai ringkasan tambahan.

Jika data harian tersedia, agregasi bulanan dapat digunakan untuk merangkum pola temporal. Jika produk yang tersedia memang bulanan, gunakan data sesuai resolusi aslinya.

Jelaskan apakah nilai bulanan merupakan:
- Rata-rata observasi valid.
- Median observasi valid.
- Agregasi lain yang dapat dijelaskan.

Cantumkan aturan penanganan data hilang. Jangan menganggap bulan tanpa observasi valid memiliki konsentrasi nol.

### 9.3 Penyelarasan Resolusi Spasial

Resolusi SST OISST dan chlorophyll-a kemungkinan berbeda.

Jangan langsung meningkatkan resolusi SST dari sekitar 0,25° menjadi sekitar 4 km hanya agar terlihat lebih detail. Peningkatan resolusi melalui interpolasi tidak menghasilkan informasi SST baru yang benar-benar terobservasi pada skala tersebut.

Pendekatan yang perlu dievaluasi terlebih dahulu adalah mengagregasi chlorophyll-a ke grid SST, misalnya dengan menghitung rata-rata atau median dari piksel chlorophyll-a yang valid dalam setiap grid SST.

Namun, metode final harus mempertimbangkan:
- Perbedaan proyeksi atau sistem koordinat.
- Bentuk dan ukuran grid.
- Jumlah piksel chlorophyll-a yang valid.
- Pengaruh piksel daratan dan perairan.
- Proporsi area perairan yang tercakup.
- Potensi bias akibat tutupan awan atau kualitas observasi.

Jangan melakukan agregasi sebelum memastikan koordinat dan batas grid kedua produk sesuai.

Simpan atau dokumentasikan jumlah piksel valid pada setiap agregasi apabila memungkinkan.

Jika penyelarasan pada grid SST tidak sesuai untuk suatu produk, usulkan metode alternatif dan jelaskan konsekuensinya sebelum implementasi.

---

## 10. Perbandingan MHW dan Non-MHW

Analisis chlorophyll-a harus membandingkan kondisi selama MHW dengan kondisi non-MHW. Perbandingan tidak cukup hanya dengan menampilkan grafik chlorophyll-a ketika MHW terjadi.

Gunakan dua jenis periode pembanding apabila data mencukupi.

### 10.1 Pembanding Temporal di Sekitar Kejadian

Bandingkan chlorophyll-a selama MHW dengan periode non-MHW sebelum dan/atau sesudah kejadian.

Tujuannya adalah mengevaluasi perubahan temporal di sekitar kejadian.

Antigravity perlu mengusulkan jendela pembanding yang masuk akal dan konsisten. Panjang jendela tidak boleh ditentukan secara sembarangan atau dipilih hanya karena menghasilkan perbedaan yang menarik.

Perhatikan:
- Ketersediaan data.
- Musim.
- Kejadian MHW lain yang berdekatan.
- Keterbatasan pengamatan satelit.
- Potensi pengaruh kejadian lain yang berlangsung berdekatan.

Periode sebelum dan sesudah MHW tidak boleh dianggap sebagai kondisi non-MHW apabila ternyata masih memenuhi definisi MHW.

### 10.2 Pembanding Musiman Antar-Tahun

Bandingkan kondisi chlorophyll-a selama MHW dengan periode non-MHW pada musim yang sebanding di tahun lain.

Tujuannya adalah mengurangi pengaruh perbedaan musim yang dapat memengaruhi SST maupun chlorophyll-a.

Periode pembanding harus:
- Memiliki cakupan spasial yang sebanding.
- Menggunakan definisi grid yang konsisten.
- Memiliki data chlorophyll-a yang valid.
- Tidak memenuhi definisi MHW pada grid dan tanggal yang dibandingkan.
- Mempertimbangkan musim atau kalender yang sebanding.

Jika data tidak cukup untuk membangun pembanding musiman, keterbatasan tersebut harus dinyatakan secara eksplisit.

### 10.3 Statistik Perbandingan

Statistik harus dipilih berdasarkan karakteristik data, distribusi nilai, jumlah sampel, dan struktur ketergantungan observasi.

Metode yang dapat dievaluasi meliputi:
- Selisih rata-rata atau median.
- Persentase perubahan jika penyebutnya valid dan interpretasinya sesuai.
- Ukuran variasi dan interval ketidakpastian.
- Uji statistik yang sesuai apabila asumsi dan ukuran sampel memadai.

Jika menggunakan p-value:
- Nyatakan hipotesis yang diuji.
- Nyatakan metode uji.
- Periksa asumsi yang relevan.
- Jelaskan unit analisis dan jumlah observasi.
- Pertimbangkan autokorelasi temporal dan ketergantungan spasial.
- Hindari menganggap setiap hari atau setiap piksel sebagai sampel independen tanpa justifikasi.
- Pertimbangkan pengujian berganda jika banyak kejadian atau grid diuji secara terpisah.

Nilai p < 0,05 tidak otomatis menunjukkan pengaruh yang besar, penting secara ekologis, atau bersifat kausal.

Jika asumsi statistik tidak terpenuhi atau sampel terlalu terbatas, tampilkan hasil deskriptif dan jelaskan batasan inferensinya.

---

## 11. Analisis Konteks Produksi Ikan

### 11.1 Prinsip Umum

Data produksi ikan digunakan untuk memberikan konteks terhadap hasil analisis MHW dan chlorophyll-a.

Interpretasi harus mempertimbangkan bahwa hasil tangkapan ikan juga dipengaruhi oleh faktor lain, seperti:
- Upaya penangkapan.
- Perubahan armada dan teknologi.
- Musim penangkapan.
- Kondisi ekonomi.
- Kebijakan perikanan.
- Perubahan komposisi jenis ikan.
- Faktor oseanografi lain yang tidak dianalisis dalam proyek ini.

Oleh karena itu, korelasi atau kesamaan pola waktu tidak boleh langsung dianggap sebagai bukti bahwa MHW menyebabkan perubahan produksi ikan.

### 11.2 Jika Data Ikan Berskala Tahunan dan Provinsi

Jika data hanya mencakup produksi tahunan tingkat provinsi:
- Buat ringkasan produksi ikan NTT per tahun.
- Pastikan kategori ikan dan kategori penangkapan konsisten.
- Bandingkan secara deskriptif dengan ringkasan MHW tahunan pada periode yang sama.
- Jelaskan bahwa data tahunan tidak mampu mengidentifikasi respons terhadap tanggal kejadian MHW tertentu.
- Jangan menyimpulkan perubahan produksi akibat satu kejadian MHW.
- Jangan membuat peta distribusi spasial hasil tangkapan apabila koordinat lokasi penangkapan tidak tersedia.

Jika diperlukan, tampilkan grafik deret waktu produksi ikan dan ringkasan karakteristik MHW pada panel terpisah agar pola keduanya dapat dibandingkan tanpa menyiratkan hubungan kausal.

### 11.3 Jika Data Memiliki Resolusi Bulanan atau Lebih Detail

Apabila pemeriksaan menemukan data yang lebih terperinci, evaluasi kemungkinan analisis tambahan berdasarkan resolusi aktualnya.

Analisis tersebut tetap harus mempertimbangkan:
- Konsistensi periode.
- Kesetaraan wilayah.
- Keterbatasan data.
- Faktor pengganggu.
- Ketidakpastian hubungan antara kondisi oseanografi dan tangkapan ikan.

Jangan mengembangkan analisis lebih kompleks sebelum kualitas dan resolusi data dikonfirmasi.

---

## 12. Rancangan Revisi Notebook

Antigravity harus membaca notebook aktual yang tersedia di repositori sebelum menyarankan perubahan. Nama notebook berikut merupakan rancangan struktur yang diusulkan, bukan pernyataan bahwa file tersebut sudah tersedia.

### Notebook 01 — Persiapan dan Pemeriksaan Data

Nama yang diusulkan: `01_Persiapan_dan_Pemeriksaan_Data.ipynb`

Fungsi:
1. Inventarisasi seluruh file yang digunakan.
2. Membaca metadata SST, chlorophyll-a, dan data ikan.
3. Memeriksa dimensi, koordinat, variabel, satuan, dan resolusi.
4. Memeriksa kelengkapan waktu.
5. Mengidentifikasi duplikasi, missing value, dan nilai tidak valid.
6. Memeriksa konsistensi wilayah penelitian.
7. Menghasilkan tabel ringkasan kualitas data.

Keluaran yang diharapkan:
- Tabel inventarisasi data.
- Ringkasan rentang tanggal.
- Ringkasan dimensi dan resolusi.
- Ringkasan kualitas data.
- Daftar masalah yang perlu ditangani sebelum analisis.

Notebook ini tidak boleh mengasumsikan semua sumber data mempunyai rentang waktu yang sama.

### Notebook 02 — Analisis SST dan Deteksi MHW

Nama yang diusulkan: `02_Analisis_SST_dan_Deteksi_MHW.ipynb`

Fungsi:
1. Memeriksa penggabungan file SST tahunan.
2. Memastikan urutan waktu dan koordinat konsisten.
3. Memeriksa apakah variabel SST dan satuannya benar.
4. Membuat atau memvalidasi klimatologi dan ambang persentil.
5. Mendeteksi MHW per grid.
6. Menghitung durasi, intensitas rata-rata, dan intensitas maksimum.
7. Mempertahankan kejadian yang melintasi bulan atau tahun.
8. Menyusun tabel kejadian lokal.
9. Mengevaluasi apakah pengelompokan kejadian regional dapat dilakukan secara defensibel.
10. Menyusun keluaran yang dapat digunakan notebook visualisasi.

Keluaran yang diharapkan:
- Data SST harian yang telah diperiksa.
- Informasi klimatologi dan ambang MHW.
- Hasil deteksi per grid.
- Tabel kejadian lokal.
- Dokumentasi parameter metode.
- Jika relevan, usulan katalog regional beserta aturan pengelompokannya.

### Notebook 03 — Analisis Chlorophyll-a

Nama yang diusulkan: `03_Analisis_Chlorophyll_a.ipynb`

Fungsi:
1. Membaca dan menggabungkan data chlorophyll-a sesuai struktur aktual.
2. Memeriksa cakupan tanggal dan resolusi temporal.
3. Memeriksa kualitas dan missing value.
4. Menentukan periode data valid.
5. Menganalisis distribusi spasial chlorophyll-a.
6. Menyusun ringkasan temporal harian dan bulanan sesuai ketersediaan.
7. Menilai kelayakan penyelarasan spasial dengan SST.
8. Menyiapkan keluaran yang dapat digunakan untuk analisis gabungan.

Keluaran yang diharapkan:
- Dataset chlorophyll-a yang telah diperiksa.
- Peta atau ringkasan spasial.
- Ringkasan temporal.
- Informasi ketersediaan data valid.
- Dokumentasi metode agregasi dan penyelarasan spasial jika diterapkan.

### Notebook 04 — Analisis Gabungan MHW dan Chlorophyll-a

Nama yang diusulkan: `04_Analisis_Gabungan_MHW_dan_Chlorophyll_a.ipynb`

Fungsi:
1. Menentukan periode tumpang tindih antara SST/MHW dan chlorophyll-a.
2. Menyelaraskan data pada dimensi waktu dan ruang yang sesuai.
3. Menghubungkan tanggal kejadian MHW dengan observasi chlorophyll-a.
4. Menentukan periode pembanding non-MHW.
5. Melakukan perbandingan sebelum/sesudah kejadian jika data mendukung.
6. Melakukan perbandingan musiman antar-tahun jika data mendukung.
7. Menghitung statistik deskriptif.
8. Mengevaluasi kelayakan uji statistik.
9. Mendokumentasikan ukuran sampel dan keterbatasan.

Keluaran yang diharapkan:
- Tabel gabungan MHW dan chlorophyll-a.
- Informasi periode MHW dan non-MHW.
- Ringkasan statistik perbandingan.
- Informasi jumlah observasi valid.
- Hasil uji statistik jika layak.
- Dokumentasi asumsi dan keterbatasan.

### Notebook 05 — Visualisasi dan Sintesis Hasil

Nama yang diusulkan: `05_Visualisasi_dan_Sintesis_Hasil.ipynb`

Fungsi:
1. Menampilkan katalog kejadian MHW.
2. Menghasilkan peta cakupan setiap kejadian.
3. Menghasilkan peta intensitas setiap kejadian.
4. Menghasilkan peta durasi setiap kejadian.
5. Menampilkan chlorophyll-a selama kejadian dan periode pembanding.
6. Membuat grafik deret waktu dan ringkasan bulanan.
7. Membuat ringkasan tahunan sebagai pelengkap.
8. Memastikan semua visualisasi memiliki judul, satuan, legenda, dan rentang waktu yang jelas.

Keluaran yang diharapkan:
- Katalog kejadian.
- Peta per kejadian.
- Grafik perbandingan MHW dan non-MHW.
- Ringkasan temporal.
- Visualisasi yang dapat digunakan dalam laporan.

Peta per kejadian merupakan prioritas. Peta harian atau ringkasan tahunan saja tidak cukup untuk menggantikan kebutuhan tersebut.

### Notebook 06 — Konteks Produksi Ikan dan Interpretasi Kualitatif

Nama yang diusulkan: `06_Interpretasi_Kualitatif_dan_Konteks_Tangkapan_Ikan.ipynb`

Fungsi:
1. Memeriksa struktur dan resolusi data ikan.
2. Menyiapkan ringkasan produksi ikan NTT sesuai kategori yang tersedia.
3. Menyesuaikan periode analisis dengan rentang data yang valid.
4. Membandingkan pola produksi tahunan dengan ringkasan MHW dan chlorophyll-a secara deskriptif jika sesuai.
5. Mengidentifikasi kemungkinan interpretasi dan keterbatasannya.
6. Menghindari klaim sebab-akibat yang tidak didukung data.

Keluaran yang diharapkan:
- Tabel atau grafik produksi ikan.
- Ringkasan karakteristik MHW yang relevan.
- Interpretasi kualitatif yang mempertimbangkan resolusi data.
- Catatan keterbatasan dan faktor lain yang mungkin memengaruhi produksi.

Notebook ini tidak boleh memaksakan analisis statistik apabila resolusi data ikan tidak mendukungnya.

---

## 13. Standar Implementasi Notebook

Jika implementasi telah mendapat persetujuan pengguna, seluruh notebook yang direvisi harus memenuhi standar berikut.

### 13.1 Struktur

- Setiap notebook memiliki judul dan tujuan yang jelas.
- Setiap bagian didahului penjelasan singkat.
- Urutan proses mengikuti alur analisis.
- Variabel dan parameter penting mudah ditemukan.
- Jalur data tidak ditulis secara sembarangan atau tidak konsisten.
- Keluaran setiap notebook dapat digunakan oleh notebook berikutnya.
- Hindari pengulangan proses yang tidak diperlukan.

### 13.2 Kualitas Kode

- Gunakan nama variabel yang jelas dan konsisten.
- Hindari menutupi error dengan penanganan exception yang tidak tepat.
- Berikan pesan yang jelas jika file tidak ditemukan atau variabel tidak tersedia.
- Pastikan pemrosesan data mempertimbangkan memori dan ukuran file.
- Hindari memuat seluruh data ke memori jika pendekatan yang lebih efisien tersedia.
- Pastikan penggabungan file mempertahankan koordinat dan indeks waktu dengan benar.
- Dokumentasikan parameter yang memengaruhi hasil ilmiah.

### 13.3 Reprodusibilitas

- Dokumentasikan sumber data.
- Dokumentasikan rentang tanggal.
- Dokumentasikan resolusi spasial dan temporal.
- Dokumentasikan parameter deteksi MHW.
- Dokumentasikan penanganan missing value.
- Dokumentasikan metode agregasi dan penyelarasan.
- Simpan keluaran dengan nama yang konsisten.
- Jangan mengklaim notebook berhasil dijalankan jika belum benar-benar diuji.

---

## 14. Ketentuan Statistik dan Interpretasi

1. Seluruh hasil statistik harus berasal dari data aktual.
2. Jangan mengarang nilai statistik, p-value, jumlah kejadian, atau ukuran sampel.
3. Jangan mengasumsikan hasil signifikan sebelum pengujian dilakukan.
4. Jelaskan perbedaan signifikansi statistik dan arti ilmiah.
5. Pertimbangkan autokorelasi temporal serta ketergantungan spasial.
6. Pastikan kelompok MHW dan non-MHW didefinisikan secara konsisten.
7. Jangan menggunakan periode yang tidak sebanding tanpa menjelaskan konsekuensinya.
8. Jangan menyatakan chlorophyll-a meningkat atau menurun jika hasil pengolahan belum mendukung kesimpulan tersebut.
9. Jangan menyatakan produksi ikan dipengaruhi MHW hanya karena kedua variabel menunjukkan pola yang berdekatan.
10. Nyatakan keterbatasan periode data, resolusi, missing value, dan cakupan wilayah.

---

## 15. Kriteria Penerimaan

Revisi notebook nantinya dianggap memenuhi kebutuhan apabila seluruh kriteria berikut dapat diverifikasi.

### A. Data
- [ ] Rentang SST 2000–2020 telah diperiksa.
- [ ] Metadata dan resolusi SST telah diverifikasi.
- [ ] Rentang waktu chlorophyll-a telah ditentukan berdasarkan data aktual.
- [ ] Missing value telah ditangani tanpa mengubahnya menjadi nol secara sembarangan.
- [ ] Resolusi data ikan telah diverifikasi.
- [ ] Periode analisis gabungan sesuai dengan ketersediaan data yang sebenarnya.

### B. Deteksi MHW
- [ ] Deteksi dilakukan per grid.
- [ ] Metode dan parameter terdokumentasi.
- [ ] Durasi dan intensitas dihitung secara konsisten.
- [ ] Kejadian yang melintasi pergantian bulan atau tahun tidak terpotong secara keliru.
- [ ] Kejadian lokal dibedakan dari kejadian regional.
- [ ] Pengelompokan regional, jika dilakukan, mempunyai aturan yang jelas.

### C. Visualisasi
- [ ] Tersedia peta cakupan setiap kejadian.
- [ ] Tersedia peta intensitas setiap kejadian.
- [ ] Tersedia peta durasi setiap kejadian.
- [ ] Tersedia katalog kejadian MHW.
- [ ] Ringkasan bulanan dan tahunan bersifat pelengkap.
- [ ] Semua peta memiliki informasi tanggal, legenda, dan satuan.

### D. Analisis Chlorophyll-a
- [ ] Analisis menggunakan periode data valid.
- [ ] Penyelarasan spasial memiliki justifikasi.
- [ ] Analisis harian dilakukan jika frekuensi data mendukung.
- [ ] Ringkasan bulanan dilakukan sesuai ketersediaan data.
- [ ] Perbandingan MHW dan non-MHW menggunakan definisi yang jelas.
- [ ] Pembanding musiman dievaluasi jika data mendukung.
- [ ] Jumlah observasi valid dilaporkan.

### E. Produksi Ikan
- [ ] Resolusi temporal dan spasial data ikan telah diperiksa.
- [ ] Interpretasi sesuai dengan tingkat detail data.
- [ ] Tidak ada klaim kausal yang tidak didukung.
- [ ] Keterbatasan data dijelaskan.

### F. Reprodusibilitas
- [ ] Struktur notebook konsisten.
- [ ] Jalur input dan output terdokumentasi.
- [ ] Parameter analisis mudah diperiksa.
- [ ] Tidak ada hasil yang dikarang.
- [ ] Seluruh perubahan kode nantinya dapat ditelusuri.

---

## 16. Instruksi Kerja untuk Antigravity

### Fase 1 — Audit Repositori

Lakukan pemeriksaan terhadap repositori GitHub yang diberikan dan file yang tersedia di lingkungan kerja.

Identifikasi:
- Struktur folder.
- Daftar notebook.
- Dataset yang digunakan.
- File konfigurasi.
- Dependensi.
- Alur pemrosesan data.
- Keluaran yang sudah tersedia.
- Bagian yang telah sesuai.
- Bagian yang bermasalah atau belum lengkap.

Jangan berasumsi nama notebook atau struktur file sama dengan rancangan PRD. Gunakan struktur aktual repositori.

Jika repositori tidak dapat diakses, jangan mengarang isi atau status notebook. Laporkan kendala akses dan minta akses atau file yang diperlukan.

### Fase 2 — Evaluasi Metode

Periksa kode aktual dan bandingkan dengan persyaratan dalam PRD.

Buat tabel audit dengan format:

| Komponen | Kondisi aktual | Masalah atau risiko | Rekomendasi revisi | Prioritas |
|---|---|---|---|---|
| Data SST | Berdasarkan pemeriksaan | Berdasarkan pemeriksaan | Usulan | Tinggi/Sedang/Rendah |
| Deteksi MHW | Berdasarkan pemeriksaan | Berdasarkan pemeriksaan | Usulan | Tinggi/Sedang/Rendah |
| Katalog kejadian | Berdasarkan pemeriksaan | Berdasarkan pemeriksaan | Usulan | Tinggi/Sedang/Rendah |
| Chlorophyll-a | Berdasarkan pemeriksaan | Berdasarkan pemeriksaan | Usulan | Tinggi/Sedang/Rendah |
| Analisis gabungan | Berdasarkan pemeriksaan | Berdasarkan pemeriksaan | Usulan | Tinggi/Sedang/Rendah |
| Visualisasi | Berdasarkan pemeriksaan | Berdasarkan pemeriksaan | Usulan | Tinggi/Sedang/Rendah |
| Data ikan | Berdasarkan pemeriksaan | Berdasarkan pemeriksaan | Usulan | Tinggi/Sedang/Rendah |

Jangan mengisi tabel dengan asumsi yang belum diverifikasi.

### Fase 3 — Susun Rencana Revisi

Berdasarkan hasil audit:
1. Tentukan notebook mana yang perlu dipertahankan.
2. Tentukan bagian yang perlu diperbaiki.
3. Tentukan bagian yang perlu ditambahkan.
4. Jelaskan alasan ilmiah setiap perubahan.
5. Tentukan dependensi antar-notebook.
6. Tentukan input dan output setiap notebook.
7. Identifikasi risiko komputasi dan kualitas data.
8. Tentukan pengujian yang perlu dilakukan setelah implementasi.
9. Pisahkan perbaikan wajib dari perbaikan opsional.

Jangan membuat notebook baru hanya karena nama tersebut tercantum dalam PRD. Periksa apakah struktur yang sudah ada dapat digunakan atau disempurnakan.

### Fase 4 — Tunggu Persetujuan

Setelah menyelesaikan audit dan rencana revisi, berhenti dan tampilkan hasilnya kepada pengguna.

**Jangan melanjutkan ke implementasi sebelum pengguna menyetujui rencana revisi.**

Tahap ini harus menghasilkan rekomendasi yang cukup jelas agar pengguna dapat memutuskan apakah revisi layak dilanjutkan.

### Fase 5 — Implementasi Setelah Persetujuan

Tahap ini hanya boleh dimulai setelah pengguna memberikan persetujuan eksplisit.

Jika disetujui:
- Lakukan revisi berdasarkan rencana yang disepakati.
- Pertahankan file asli atau gunakan version control agar perubahan dapat dipulihkan.
- Jangan menghapus data mentah.
- Jangan mengganti sumber data tanpa persetujuan.
- Jangan mengubah metode ilmiah secara diam-diam.
- Dokumentasikan perubahan setiap notebook.
- Uji kode secara bertahap setelah lingkungan dan data tersedia.
- Laporkan pengujian yang benar-benar telah dijalankan dan hasilnya.

---

## 17. Format Laporan Akhir Audit

Setelah Fase 1–3 selesai, Antigravity harus menyampaikan laporan dengan struktur:

1. **Ringkasan kondisi repositori**
2. **Daftar notebook dan fungsi aktualnya**
3. **Alur analisis yang sedang diterapkan**
4. **Temuan audit data**
5. **Temuan audit metode deteksi MHW**
6. **Temuan audit analisis chlorophyll-a**
7. **Temuan audit perbandingan MHW dan non-MHW**
8. **Temuan audit data produksi ikan**
9. **Daftar masalah dan prioritas perbaikan**
10. **Rancangan revisi per notebook**
11. **Rencana pengujian**
12. **Risiko, asumsi, dan keterbatasan**
13. **Daftar keputusan yang membutuhkan persetujuan pengguna**

Setiap temuan harus merujuk pada file, sel notebook, variabel, fungsi, atau bagian kode yang benar-benar diperiksa jika informasi tersebut tersedia.

Pisahkan dengan tegas:
- Fakta yang ditemukan dari repositori.
- Masalah yang terverifikasi.
- Dugaan yang masih perlu diperiksa.
- Rekomendasi perubahan.
- Keputusan yang belum disetujui.

---

## 18. Instruksi Utama

Prioritas proyek ini adalah validitas metode ilmiah, keterlacakan hasil, dan konsistensi analisis.

Jangan langsung mengubah kode hanya untuk menyesuaikan nama notebook atau struktur yang diusulkan.

Periksa terlebih dahulu apakah metode yang digunakan saat ini sudah benar, apakah data mendukung analisis yang direncanakan, dan apakah perubahan benar-benar diperlukan.

**Tugas pertama Antigravity adalah mengaudit repositori dan menyusun rancangan revisi. Jangan menjalankan notebook atau mengubah file sebelum pengguna memberikan persetujuan eksplisit.**

Akhir dari tahap awal harus berupa laporan audit dan rencana revisi yang lengkap, bukan implementasi kode.
