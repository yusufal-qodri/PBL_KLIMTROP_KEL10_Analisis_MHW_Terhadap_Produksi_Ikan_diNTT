# PRD — Kerangka Notebook Proyek MHW, Klorofil-a, dan Produksi Ikan di NTT

## 1. Tujuan dan batasan

PRD ini menjadi instruksi untuk menyusun kerangka kerja penelitian dalam bentuk notebook Jupyter (`.ipynb`), dokumen pembagian tugas, template jadwal, dan daftar pertanyaan metodologi.

**Topik:** Marine Heatwave (MHW), klorofil-a, serta produksi ikan cakalang dan tongkol di Nusa Tenggara Timur (NTT).

**PENTING: pada tahap ini hanya susun kerangka dan instruksi. Jangan mengunduh data, menjalankan kode, melakukan analisis, membuat hasil atau visualisasi aktual, membuat dashboard/website, maupun menimpa atau menghapus file yang sudah ada.**

Klorofil-a menjadi variabel klorofil yang direncanakan; jangan menambahkan klorofil-b sebagai variabel utama. Periode dan metode final harus ditetapkan setelah audit data. Klorofil-a bukan pengukuran langsung kelimpahan ikan atau nutrien. Korelasi tidak membuktikan sebab-akibat.

## 2. Anggota dan pembagian tugas awal

| No. | Nama | NIM | Tanggung jawab utama |
|---:|---|---|---|
| 1 | Luthficka Suci F. | G2401241019 | Literatur MHW dan metode identifikasi |
| 2 | Nahar Latifah | G2401241026 | Audit sumber dan karakteristik data SST/MHW |
| 3 | Fakhriya Nadhifa | G2401241040 | Audit data klorofil-a dan rancangan pengolahan |
| 4 | Puput Dwiyanti N. | G2401241060 | Audit data produksi cakalang dan tongkol |
| 5 | Alisa Rabila Putri | G2401241072 | Literatur klorofil-a, produktivitas perairan, dan perikanan |
| 6 | Yusuf Al-Qodri | G2401241089 | Kerangka teknis SST/MHW dan rancangan integrasi data |
| 7 | M. Ghifari Nadeta H. | G2401241099 | Rancangan statistik, pemeriksaan kualitas, dan keterbatasan |
| 8 | Naisyilla Hasna R. | G2401241111 | Kerangka sintesis, struktur laporan, dan checklist akhir |

Pembagian ini merupakan rancangan awal dan dapat disesuaikan setelah kemampuan serta preferensi anggota dibahas. Yusuf juga harus mengerjakan bagian teknis, bukan hanya koordinasi. Semua anggota perlu meninjau integrasi akhir.

## 3. Struktur folder yang direncanakan

```text
Proyek_MHW_Klorofil_NTT/
├── README.md
├── pembagian_tugas.md
├── jadwal_pengerjaan.md
├── pertanyaan_metodologi.md
├── notebooks/
│   ├── 00_perencanaan_dan_pertanyaan_penelitian.ipynb
│   ├── 01_studi_literatur.ipynb
│   ├── 02_audit_ketersediaan_data.ipynb
│   ├── 03_metodologi_dan_desain_analisis.ipynb
│   ├── 04_persiapan_data_SST_dan_MHW.ipynb
│   ├── 05_analisis_klorofil_a.ipynb
│   ├── 06_analisis_produksi_ikan.ipynb
│   ├── 07_analisis_keterkaitan_dan_integrasi.ipynb
│   └── 08_sintesis_hasil_dan_pemeriksaan_akhir.ipynb
├── data/
│   ├── raw/
│   └── processed/
├── references/
├── figures/
└── reports/
```

Struktur di atas hanya rancangan. Jangan menganggap data atau direktori sudah tersedia. Jangan mengubah isi proyek yang sudah ada tanpa izin eksplisit.

## 4. Format wajib setiap notebook

Setiap notebook harus berisi:
1. Judul dan tujuan.
2. Penanggung jawab dan pemeriksa.
3. Konteks singkat.
4. Daftar tugas.
5. Instruksi langkah demi langkah.
6. Sumber data atau referensi yang perlu diperiksa.
7. Keluaran yang harus diserahkan.
8. Checklist penyelesaian.
9. Catatan, kendala, dan pertanyaan terbuka.

Gunakan sel Markdown untuk instruksi. Sel kode, jika diperlukan, harus kosong atau hanya berisi komentar `TODO`. Jangan menambahkan kode yang melakukan pengunduhan, pembacaan, pengolahan, analisis, atau visualisasi data.

## 5. Spesifikasi notebook

### Notebook 00 — Perencanaan dan Pertanyaan Penelitian
**File:** `00_perencanaan_dan_pertanyaan_penelitian.ipynb`  
**Penanggung jawab:** Yusuf Al-Qodri; masukan seluruh anggota.

Tugas:
- Tuliskan topik dan alasan pemilihan.
- Rumuskan pertanyaan tentang MHW dan perubahan klorofil-a.
- Rumuskan pertanyaan tentang produksi cakalang dan tongkol sebagai analisis lanjutan yang bergantung pada ketersediaan data.
- Catat batas wilayah NTT yang perlu disepakati.
- Pisahkan tujuan analisis MHW, klorofil-a, dan produksi ikan.
- Buat diagram kerangka berpikir konseptual.
- Buat daftar keputusan yang memerlukan persetujuan kelompok/dosen.

**Keluaran:** Rumusan masalah, tujuan, batasan, diagram konseptual, dan daftar keputusan terbuka.

### Notebook 01 — Studi Literatur
**File:** `01_studi_literatur.ipynb`  
**Penanggung jawab:** Luthficka Suci F.; kontributor: Alisa Rabila Putri.

Tugas:
- Cari literatur definisi dan metode deteksi MHW.
- Cari studi hubungan SST/MHW dengan klorofil-a.
- Cari studi klorofil-a, produktivitas perairan, dan perikanan.
- Cari studi cakalang dan tongkol di NTT atau wilayah pembanding yang relevan.
- Catat penulis/tahun, judul, lokasi, data, metode, temuan, keterbatasan, DOI/URL.
- Bedakan jurnal ilmiah, laporan resmi, dan sumber lain.
- Jangan menuliskan temuan yang tidak dapat dilacak ke sumber.

**Template tabel:** Penulis/tahun | Judul | Wilayah | Data | Metode | Temuan relevan | Keterbatasan | DOI/URL.  
**Keluaran:** Tabel literatur, ringkasan konsep, celah penelitian sementara, dan daftar referensi.

### Notebook 02 — Audit Ketersediaan Data
**File:** `02_audit_ketersediaan_data.ipynb`  
**Penanggung jawab:** Nahar Latifah; kontributor: Fakhriya Nadhifa dan Puput Dwiyanti N.

Tugas:
- Identifikasi kandidat SST, misalnya NOAA OISST.
- Identifikasi kandidat klorofil-a dari NASA OceanColor/Aqua MODIS jika sesuai.
- Identifikasi sumber resmi produksi/hasil tangkapan cakalang dan tongkol.
- Catat periode, resolusi temporal/spasial, cakupan, format, satuan, lisensi, dan URL.
- Periksa konsistensi spesies, wilayah, dan waktu pada data ikan.
- Catat data hilang, perubahan pencatatan, akses, dan masalah kualitas.
- Bandingkan rentang waktu semua data untuk mengusulkan periode penelitian.
- Tandai status sumber: belum diperiksa, ditemukan, akses terverifikasi, atau tidak memadai.

**Template inventaris:** Variabel | Produk/sumber | Periode | Resolusi waktu | Resolusi spasial | Cakupan | Format | Satuan | URL | Status verifikasi | Catatan.  
**Keluaran:** Inventaris data, tautan sumber resmi, masalah yang ditemukan, dan rekomendasi periode berbasis audit.

### Notebook 03 — Metodologi dan Desain Analisis
**File:** `03_metodologi_dan_desain_analisis.ipynb`  
**Penanggung jawab:** M. Ghifari Nadeta H.; kontributor: Yusuf Al-Qodri.

Tugas:
- Definisikan variabel, satuan, dan skala waktu.
- Tinjau definisi MHW dari literatur. Persentil ke-90 dan durasi minimal lima hari berturut-turut boleh dicantumkan sebagai kandidat, bukan keputusan otomatis.
- Tinjau kandidat periode klimatologi.
- Rancang perbandingan klorofil-a saat MHW dan non-MHW.
- Tentukan unit analisis yang mungkin dipakai bersama.
- Pilih metode statistik setelah karakteristik data diketahui.
- Catat asumsi, bias, keterbatasan, dan faktor perancu.
- Hindari klaim kausal yang tidak didukung.

**Keluaran:** Rancangan metodologi, definisi variabel, alasan pemilihan metode, asumsi, dan pertanyaan terbuka.

### Notebook 04 — Persiapan Data SST dan MHW
**File:** `04_persiapan_data_SST_dan_MHW.ipynb`  
**Penanggung jawab:** Nahar Latifah; kontributor teknis: Yusuf Al-Qodri.

Tugas:
- Rencanakan pemeriksaan struktur data, kalender waktu, koordinat, satuan, nilai hilang, dan kualitas.
- Rencanakan pembatasan data ke wilayah kajian.
- Rancang perhitungan klimatologi dan ambang berdasarkan metodologi yang disetujui.
- Rancang identifikasi kejadian MHW: tanggal mulai/berakhir, durasi, dan intensitas jika didukung data.
- Rencanakan validasi identifikasi MHW.
- Definisikan kolom tabel kejadian MHW untuk notebook berikutnya.
- Catat asumsi dan kendala yang mungkin muncul.

**Keluaran:** Alur pengolahan, skema tabel kejadian MHW, dan checklist validasi. Jangan melakukan perhitungan aktual.

### Notebook 05 — Analisis Klorofil-a
**File:** `05_analisis_klorofil_a.ipynb`  
**Penanggung jawab:** Fakhriya Nadhifa; kontributor: Alisa Rabila Putri.

Tugas:
- Jelaskan makna klorofil-a sebagai indikator yang berkaitan dengan fitoplankton.
- Pilih kandidat produk setelah audit data.
- Rencanakan pemeriksaan satuan, resolusi, nilai kosong, kualitas piksel, awan, dan keterbatasan satelit.
- Rancang penyelarasan wilayah dan waktu dengan data MHW.
- Rancang perbandingan klorofil-a saat MHW dan non-MHW.
- Pertimbangkan statistik ringkasan seperti rerata, median, variasi, dan selisih jika sesuai.
- Rancang tabel dan jenis grafik untuk tahap analisis nanti.
- Catat perbedaan spasial/temporal dan hindari klaim sebab-akibat.
- Jangan menyamakan klorofil-a dengan nutrien, biomassa ikan, atau hasil tangkapan secara langsung.

**Keluaran:** Rencana pengolahan, definisi variabel, rancangan perbandingan, skema tabel/grafik, dan template interpretasi.

### Notebook 06 — Analisis Produksi Ikan
**File:** `06_analisis_produksi_ikan.ipynb`  
**Penanggung jawab:** Puput Dwiyanti N.

Tugas:
- Tentukan sumber resmi dan definisi data produksi/hasil tangkapan.
- Periksa nama spesies, wilayah, satuan, dan periode.
- Bedakan produksi, hasil tangkapan, dan volume pendaratan sesuai definisi sumber.
- Rancang pemeriksaan nilai kosong, perubahan pelaporan, dan konsistensi cakupan.
- Rancang analisis tren cakalang dan tongkol secara terpisah sesuai resolusi data.
- Rancang grafik yang sesuai dengan data yang nantinya tersedia.
- Catat faktor lain seperti upaya penangkapan, musim, cuaca, kebijakan, dan perubahan pelaporan.
- Jangan menganggap perubahan produksi semata-mata disebabkan MHW atau klorofil-a.

**Keluaran:** Metadata data ikan, rencana pemeriksaan kualitas, rancangan analisis per spesies, dan keterbatasan interpretasi.

### Notebook 07 — Analisis Keterkaitan dan Integrasi
**File:** `07_analisis_keterkaitan_dan_integrasi.ipynb`  
**Penanggung jawab:** Yusuf Al-Qodri; kontributor: M. Ghifari Nadeta H. dan Alisa Rabila Putri.

Tugas:
- Periksa kesesuaian wilayah, periode, dan resolusi waktu.
- Tentukan apakah data layak dibandingkan atau dianalisis bersama.
- Prioritaskan kajian MHW dan klorofil-a.
- Evaluasi hubungan klorofil-a dengan produksi ikan hanya jika data kompatibel.
- Pilih metode sesuai jumlah observasi, distribusi, dan asumsi.
- Jangan memperlakukan data produksi tahunan sebagai observasi bulanan/harian.
- Jelaskan bahwa korelasi tidak membuktikan sebab-akibat.
- Jika data tidak memadai, dokumentasikan keterbatasan dan jangan memaksakan analisis.
- Rancang tabel integrasi dan kerangka interpretasi.

**Keluaran:** Rencana integrasi, pertimbangan statistik, template tabel, dan kerangka interpretasi.

### Notebook 08 — Sintesis Hasil dan Pemeriksaan Akhir
**File:** `08_sintesis_hasil_dan_pemeriksaan_akhir.ipynb`  
**Penanggung jawab:** Naisyilla Hasna R.; kontributor seluruh anggota.

Tugas:
- Susun alur pembahasan dari MHW ke klorofil-a dan, jika layak, produksi ikan.
- Buat daftar tabel dan gambar yang direncanakan.
- Buat kerangka hasil/pembahasan tanpa angka atau temuan fiktif.
- Buat checklist agar kesimpulan didukung data dan referensi.
- Periksa konsistensi istilah, satuan, wilayah, periode, dan spesies.
- Pastikan keterbatasan dicatat.
- Buat daftar pekerjaan tersisa beserta penanggung jawab dan status.

**Keluaran:** Kerangka laporan, daftar tabel/gambar, checklist mutu, dan daftar pekerjaan tersisa.

## 6. Dokumen koordinasi

### `pembagian_tugas.md`
Buat tabel berisi nama, NIM, tugas utama, notebook terkait, keluaran, pemeriksa, status, dan catatan. Status: Belum dimulai, Sedang dikerjakan, Perlu revisi, Selesai.

### `jadwal_pengerjaan.md`
Buat tabel: tahap, penanggung jawab, tanggal mulai, tenggat, ketergantungan, status, dan catatan. Isi tanggal dengan `Menyusul`; jangan mengarang jadwal.

### `pertanyaan_metodologi.md`
Catat pertanyaan terbuka:
- Batas wilayah NTT.
- Periode yang didukung seluruh data.
- Produk dan resolusi SST.
- Produk klorofil-a dan kriteria kualitas.
- Definisi/periode klimatologi MHW.
- Sumber dan resolusi data produksi cakalang/tongkol.
- Skala waktu dan metode statistik yang layak.
- Kelayakan analisis integrasi.

Untuk setiap pertanyaan, sediakan kolom alasan, pilihan yang perlu ditinjau, penanggung jawab, dan status keputusan.

## 7. Persyaratan kualitas

- Gunakan bahasa Indonesia yang jelas dan konsisten.
- Notebook adalah panduan kerja, bukan laporan hasil yang sudah selesai.
- Setiap tugas harus memiliki keluaran konkret dan bisa diperiksa.
- Jangan mengarang sumber, kutipan, angka, hasil, atau kesimpulan.
- Jangan menganggap data tersedia sebelum diverifikasi.
- Tandai ketidakpastian sebagai pertanyaan terbuka.
- Pembagian tugas harus jelas; semua anggota ikut memeriksa integrasi.
- Dashboard dan website berada di luar ruang lingkup tahap ini.

## 8. Batasan eksekusi

**Boleh:** membuat kerangka notebook, instruksi Markdown, checklist, tabel kosong, dokumen pembagian tugas, template jadwal, dan daftar pertanyaan metodologi.

**Dilarang:** mengunduh/mengolah data, menjalankan kode, menghitung MHW/statistik, membuat visualisasi aktual, mengarang hasil, membuat dashboard/website, menimpa atau menghapus file.

## 9. Kriteria penerimaan

1. Sembilan notebook memiliki judul, tujuan, penanggung jawab, instruksi, keluaran, checklist, dan catatan.
2. Nama serta NIM delapan anggota benar.
3. Dokumen pembagian tugas dan jadwal tersedia.
4. Pertanyaan metodologi terbuka terdokumentasi.
5. Tidak ada data atau hasil analisis aktual.
6. Tidak ada kode analisis yang dijalankan.
7. Tidak ada dashboard atau website.
8. Tidak ada file yang ditimpa atau dihapus.

**Instruksi akhir untuk Antigravity:** Selesaikan hanya penyusunan kerangka dan template. Setelah itu berhenti dan laporkan file perencanaan yang dibuat. Jangan lanjut ke pengumpulan data atau analisis.
