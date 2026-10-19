# Template Jadwal Pengerjaan Proyek

Dokumen ini memuat urutan tahapan pelaksanaan kerja, penanggung jawab utama, ketergantungan antar-tahap (*dependencies*), serta status pelaksanaan. 

> **Catatan Pengisian Tanggal:**
> Sesuai ketentuan PRD, kolom tanggal awal dan tenggat waktu diisi dengan status `Menyusul` sampai kesepakatan bersama kelompok dan dosen pembimbing ditetapkan. Dilarang mengarang tanggal fiktif.

## 1. Matriks Rencana Jadwal Kerja

| No. | Tahapan Kerja | Dokumen / Notebook Acuan | Penanggung Jawab Utama | Ketergantungan Tahap (*Predecessor*) | Tanggal Mulai | Tenggat Waktu | Status Pelaksanaan | Catatan / Target Antara |
|---:|---|---|---|---|---|---|---|---|
| 1 | Penetapan Konsep & Perumusan Masalah | `00_perencanaan_dan_pertanyaan_penelitian.ipynb` | Yusuf Al-Qodri | - | Menyusul | Menyusul | Belum dimulai | Menghasilkan diagram alir konseptual & batas studi NTT |
| 2 | Studi Pustaka & Literatur Terkait | `01_studi_literatur.ipynb` | Luthficka Suci F., Alisa Rabila Putri | Tahap 1 | Menyusul | Menyusul | Belum dimulai | Mengumpulkan min. 15 rujukan relevan bersumber resmi/DOI |
| 3 | Audit Ketersediaan & Karakteristik Data | `02_audit_ketersediaan_data.ipynb` | Nahar Latifah, Fakhriya Nadhifa, Puput Dwiyanti N. | Tahap 1 | Menyusul | Menyusul | Belum dimulai | Inventarisasi periode tumpang-tindih SST, Klorofil-a, & Ikan |
| 4 | Perumusan Metodologi & Desain Analisis | `03_metodologi_dan_desain_analisis.ipynb` | M. Ghifari Nadeta H., Yusuf Al-Qodri | Tahap 2, 3 | Menyusul | Menyusul | Belum dimulai | Menetapkan ambang batas MHW & pemilihan uji statistik |
| 5 | Rancangan Pengolahan SST & Deteksi MHW | `04_persiapan_data_SST_dan_MHW.ipynb` | Nahar Latifah, Yusuf Al-Qodri | Tahap 3, 4 | Menyusul | Menyusul | Belum dimulai | Memvalidasi formula klimatologi harian & skema event MHW |
| 6 | Rancangan Analisis Klorofil-a | `05_analisis_klorofil_a.ipynb` | Fakhriya Nadhifa, Alisa Rabila Putri | Tahap 3, 4 | Menyusul | Menyusul | Belum dimulai | Menyusun prosedur spasial-temporal matching klorofil-a |
| 7 | Rancangan Analisis Data Produksi Ikan | `06_analisis_produksi_ikan.ipynb` | Puput Dwiyanti N. | Tahap 3, 4 | Menyusul | Menyusul | Belum dimulai | Memisahkan data cakalang vs tongkol serta eksplorasi tren |
| 8 | Rancangan Analisis Keterkaitan & Integrasi | `07_analisis_keterkaitan_dan_integrasi.ipynb` | Yusuf Al-Qodri, M. Ghifari Nadeta H., Alisa Rabila Putri | Tahap 5, 6, 7 | Menyusul | Menyusul | Belum dimulai | Menilai kelayakan integrasi trilateral & mitigasi confounder |
| 9 | Sintesis Hasil, Checklist Mutu & Laporan | `08_sintesis_hasil_dan_pemeriksaan_akhir.ipynb` | Naisyilla Hasna R., Seluruh Anggota | Tahap 8 | Menyusul | Menyusul | Belum dimulai | Finalisasi struktur laporan, review komprehensif seluruh tim |

---

## 2. Mekanisme Pembaruan Jadwal
1. Tanggal pengerjaan akan disepakati pada rapat pleno internal tim setelah penelaahan awal ketersediaan data selesai.
2. Setiap keterlambatan pada tahapan yang memiliki dependensi langsung (misalnya audit data terhadap desain metodologi) wajib segera dikomunikasikan untuk penyesuaian jadwal berikutnya.
