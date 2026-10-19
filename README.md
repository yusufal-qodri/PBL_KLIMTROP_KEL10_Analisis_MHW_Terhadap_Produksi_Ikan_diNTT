# Kerangka Kerja Proyek Analisis MHW, Klorofil-a, dan Produksi Ikan di NTT

## 1. Deskripsi Proyek
Proyek ini merupakan penelitian terpadu untuk mengkaji kejadian **Marine Heatwaves (MHW)**, variabilitas konsentrasi **klorofil-a**, serta dinamika **produksi ikan cakalang (*Katsuwonus pelamis*) dan tongkol (*Euthynnus affinis* / *Auxis spp.*)** di wilayah perairan Nusa Tenggara Timur (NTT).

Tujuan penyusunan dokumen dan notebook pada repositori ini adalah sebagai **kerangka kerja penelitian (*research framework & guidelines*)**, instrumen koordinasi tim, audit data, serta standardisasi alur kerja sebelum tahapan komputasi dan analisis aktual dijalankan.

> **PENTING / PERINGATAN:**
> Pada tahap ini, proyek hanya berisi kerangka kerja konseptual, instruksi metodologis, template koordinasi, dan checklist mutu. **Tidak ada pengunduhan data, pemrosesan data, pemodelan statistik, pembuatan grafik aktual, maupun kesimpulan fiktif pada repositori ini.** Seluruh analisis akan dimulai setelah audit data dan metodologi disepakati bersama.

---

## 2. Struktur Tim Peneliti

| No. | Nama | NIM | Tanggung Jawab Utama |
|---:|---|---|---|
| 1 | Luthficka Suci F. | G2401241019 | Literatur MHW dan metode identifikasi |
| 2 | Nahar Latifah | G2401241026 | Audit sumber dan karakteristik data SST/MHW |
| 3 | Fakhriya Nadhifa | G2401241040 | Audit data klorofil-a dan rancangan pengolahan |
| 4 | Puput Dwiyanti N. | G2401241060 | Audit data produksi cakalang dan tongkol |
| 5 | Alisa Rabila Putri | G2401241072 | Literatur klorofil-a, produktivitas perairan, dan perikanan |
| 6 | Yusuf Al-Qodri | G2401241089 | Kerangka teknis SST/MHW dan rancangan integrasi data |
| 7 | M. Ghifari Nadeta H. | G2401241099 | Rancangan statistik, pemeriksaan kualitas, dan keterbatasan |
| 8 | Naisyilla Hasna R. | G2401241111 | Kerangka sintesis, struktur laporan, dan checklist akhir |

---

## 3. Struktur Direktori Proyek

```text
Proyek_MHW_Klorofil_NTT/
├── README.md                                          # Gambaran umum, panduan repositori, dan anggota tim
├── pembagian_tugas.md                                 # Matriks tugas terperinci, status kerja, dan reviewer
├── jadwal_pengerjaan.md                               # Matriks rencana jadwal dan dependensi antar-tahap
├── pertanyaan_metodologi.md                           # Log pertanyaan terbuka metodologis dan audit data
├── PRD_Kerangka_Notebook_MHW_Klorofil_NTT.md          # Dokumen PRD acuan perancangan proyek
├── notebooks/                                         # 9 Notebook panduan kerja berurutan
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
│   ├── raw/                                           # Direktori penyimpanan data mentah (kosong pada tahap kerangka)
│   └── processed/                                     # Direktori data hasil pra-pengolahan (kosong pada tahap kerangka)
├── references/                                        # Daftar pustaka, file PDF, dan catatan referensi
├── figures/                                           # Tempat penyimpanan gambar/grafik luaran analisis
└── reports/                                           # Naskah laporan kemajuan dan laporan akhir penelitian
```

---

## 4. Alur Kerja Penelitian

Pengerjaan penelitian disusun dalam alur sequential dan iteratif melalui sembilan notebook:
1. **00_perencanaan_dan_pertanyaan_penelitian.ipynb**: Perumusan fokus masalah, tujuan, batasan wilayah NTT, dan diagram alir konseptual.
2. **01_studi_literatur.ipynb**: Kompilasi referensi saintifik terkait MHW, klorofil-a, dan perikanan cakalang/tongkol.
3. **02_audit_ketersediaan_data.ipynb**: Inventarisasi dan verifikasi data empiris (SST, satelit klorofil-a, data perikanan tangkap resmi).
4. **03_metodologi_dan_desain_analisis.ipynb**: Penetapan definisi operasional, ambang batas, metode statistik, dan mitigasi bias.
5. **04_persiapan_data_SST_dan_MHW.ipynb**: Desain alur pengolahan SST dan deteksi kejadian MHW (*start, end, duration, intensity*).
6. **05_analisis_klorofil_a.ipynb**: Desain komparasi variabilitas klorofil-a pada periode kejadian MHW vs non-MHW.
7. **06_analisis_produksi_ikan.ipynb**: Desain telaah tren produksi ikan per spesies, identifikasi keterbatasan agregasi dan faktor perancu tangkapan.
8. **07_analisis_keterkaitan_dan_integrasi.ipynb**: Integrasi trilateral bersyarat (SST/MHW - Klorofil-a - Produksi Ikan), pertimbangan kecocokan resolusi waktu, dan kehati-hatian statistika.
9. **08_sintesis_hasil_dan_pemeriksaan_akhir.ipynb**: Sintesis narasi laporan ilmiah, checklist mutu data, dan verifikasi keterbatasan temuan.

---

## 5. Batasan dan Etika Penelitian

- **Bebas dari Klaim Kausalitas Palsu**: Korelasi statistik tidak membuktikan hubungan sebab-akibat. Perubahan produksi ikan dipengaruhi oleh banyak faktor eksternal (upaya penangkapan/fishing effort, armada, dinamika pasar, cuaca laut, regulasi pelaporan) yang tidak boleh disederhanakan hanya akibat MHW atau klorofil-a.
- **Klorofil-a Bukan Biomassa Ikan Langsung**: Konsentrasi klorofil-a merupakan proksi biomassa fitoplankton permukaan, bukan pengukuran langsung ketersediaan nutrien terlarut atau biomassa ikan pelagis.
- **Integritas Ilmiah**: Seluruh data dan referensi wajib diverifikasi dari institusi kredibel (misal: NOAA, NASA, BMKG, KKP, BPS) dengan DOI/URL resmi. Tidak ada fabrikasi atau ekstrapolasi data tanpa dasar metodologi yang valid.
