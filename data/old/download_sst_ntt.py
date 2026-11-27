"""
Unduh NOAA OISST v2.1 resolusi harian (2000-2020), potong wilayah sekitar NTT,
lalu gabungkan data harian menjadi SATU file NetCDF per tahun.

Output:
  data_sst_ntt/sst_ntt_2000.nc
  ...
  data_sst_ntt/sst_ntt_2020.nc

Catatan:
- Setiap file tahunan tetap berisi data HARIAN pada dimensi waktu (time).
- Batas wilayah adalah bounding box perkiraan NTT, bukan batas laut resmi:
  longitude 117.5–127.5°E, latitude 7–13°S.
- Data sumber NOAA OISST v2.1 diunduh per hari. File harian hasil potongan
  disimpan sementara agar proses bisa dilanjutkan jika koneksi terputus.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
from pathlib import Path
import os
import time

import requests
import xarray as xr

# ========================= PENGATURAN =========================
START_YEAR = 2013
END_YEAR = 2020

LAT_MIN = -13.0
LAT_MAX = -7.0
LON_MIN = 117.5
LON_MAX = 127.5

# Mulai dari 3. Jika koneksi/server stabil, bisa dinaikkan menjadi 4.
MAX_WORKERS = 3

OUTPUT_DIR = Path(__file__).resolve().parent / "data_sst_ntt"
CACHE_DIR = OUTPUT_DIR / "_cache_harian"

BASE_URL = (
    "https://www.ncei.noaa.gov/data/sea-surface-temperature-optimum-interpolation/"
    "v2.1/access/avhrr"
)
# =============================================================

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

SESSION_HEADERS = {"User-Agent": "SST-NTT-research-downloader/1.0"}


def tanggal_tahunan(tahun):
    """Menghasilkan semua tanggal dalam satu tahun."""
    t = date(tahun, 1, 1)
    akhir = date(tahun + 1, 1, 1)
    while t < akhir:
        yield t
        t += timedelta(days=1)


def url_harian(tanggal):
    """URL resmi NOAA untuk satu file OISST harian."""
    ymd = tanggal.strftime("%Y%m%d")
    ym = tanggal.strftime("%Y%m")
    nama = f"oisst-avhrr-v02r01.{ymd}.nc"
    return f"{BASE_URL}/{ym}/{nama}"


def unduh_dan_potong(tanggal, folder_tahun):
    """
    Unduh satu file harian NOAA, potong wilayah NTT, dan simpan file sementara.
    File sumber mentah dihapus setelah potongan berhasil dibuat.
    """
    ymd = tanggal.strftime("%Y%m%d")
    file_potong = folder_tahun / f"{ymd}.nc"
    if file_potong.exists() and file_potong.stat().st_size > 0:
        return True, "sudah ada"

    folder_unduhan = CACHE_DIR / "_unduhan"
    folder_unduhan.mkdir(parents=True, exist_ok=True)
    file_mentah = folder_unduhan / f"{ymd}.nc"
    file_part = folder_unduhan / f"{ymd}.part"
    file_potong_part = folder_tahun / f"{ymd}.part"

    url = url_harian(tanggal)
    error_terakhir = None

    for percobaan in range(1, 5):
        try:
            # Unduh ke .part supaya file setengah terunduh tidak dianggap selesai.
            with requests.get(
                url, headers=SESSION_HEADERS, stream=True, timeout=(20, 120)
            ) as response:
                response.raise_for_status()
                with open(file_part, "wb") as f:
                    for chunk in response.iter_content(chunk_size=1024 * 256):
                        if chunk:
                            f.write(chunk)
            os.replace(file_part, file_mentah)

            # Buka file NOAA dan ambil hanya variabel SST pada kotak NTT.
            with xr.open_dataset(file_mentah) as ds:
                if "sst" not in ds:
                    raise ValueError(f"Variabel 'sst' tidak ditemukan pada {ymd}")

                lat = ds["lat"].values
                if lat[0] > lat[-1]:  # koordinat latitude menurun
                    subset = ds[["sst"]].sel(
                        lat=slice(LAT_MAX, LAT_MIN),
                        lon=slice(LON_MIN, LON_MAX),
                    )
                else:
                    subset = ds[["sst"]].sel(
                        lat=slice(LAT_MIN, LAT_MAX),
                        lon=slice(LON_MIN, LON_MAX),
                    )

                if subset.sizes.get("lat", 0) == 0 or subset.sizes.get("lon", 0) == 0:
                    raise ValueError(f"Potongan wilayah kosong pada {ymd}")

                subset.to_netcdf(
                    file_potong_part,
                    encoding={"sst": {"zlib": True, "complevel": 4}},
                )

            os.replace(file_potong_part, file_potong)
            file_mentah.unlink(missing_ok=True)
            return True, "berhasil"

        except Exception as exc:
            error_terakhir = exc
            file_part.unlink(missing_ok=True)
            file_potong_part.unlink(missing_ok=True)
            # Hapus file mentah rusak/parsial agar bisa diunduh ulang.
            if file_mentah.exists():
                try:
                    file_mentah.unlink()
                except OSError:
                    pass
            if percobaan < 4:
                time.sleep(2 * percobaan)

    return False, str(error_terakhir)


def gabungkan_tahunan(tahun, folder_tahun):
    """Gabungkan potongan harian menjadi satu file NetCDF tahunan."""
    daftar_harian = sorted(folder_tahun.glob("????????.nc"))
    jumlah_hari = 366 if (
        tahun % 4 == 0 and (tahun % 100 != 0 or tahun % 400 == 0)
    ) else 365

    if len(daftar_harian) != jumlah_hari:
        print(
            f"[{tahun}] Belum lengkap: {len(daftar_harian)}/{jumlah_hari} file harian. "
            "Jalankan ulang skrip untuk melanjutkan."
        )
        return False

    datasets = []
    file_output = OUTPUT_DIR / f"sst_ntt_{tahun}.nc"
    file_part = OUTPUT_DIR / f"sst_ntt_{tahun}.part.nc"

    try:
        for nama_file in daftar_harian:
            datasets.append(xr.open_dataset(nama_file))

        tahunan = xr.concat(datasets, dim="time").sortby("time")
        # Tambahkan keterangan sumber dan batas area.
        tahunan.attrs["source"] = "NOAA NCEI OISST v2.1 AVHRR-only daily"
        tahunan.attrs["region"] = (
            f"Bounding box NTT: lon {LON_MIN} to {LON_MAX} E; "
            f"lat {LAT_MIN} to {LAT_MAX} degrees"
        )
        tahunan.attrs["temporal_resolution"] = "daily"
        tahunan.attrs["note"] = (
            "Bounding box perkiraan; gunakan mask darat/laut atau batas wilayah "
            "studi sebelum analisis spasial final."
        )
        tahunan.to_netcdf(
            file_part,
            encoding={"sst": {"zlib": True, "complevel": 4}},
        )
        tahunan.close()
        os.replace(file_part, file_output)
        print(f"[{tahun}] Selesai: {file_output} ({file_output.stat().st_size / 1e6:.1f} MB)")

        # Hapus cache harian tahun ini hanya setelah file tahunan berhasil dibuat.
        for nama_file in daftar_harian:
            nama_file.unlink(missing_ok=True)
        try:
            folder_tahun.rmdir()
        except OSError:
            pass
        return True

    except Exception as exc:
        file_part.unlink(missing_ok=True)
        print(f"[{tahun}] Gagal menggabungkan file: {exc}")
        return False
    finally:
        for ds in datasets:
            try:
                ds.close()
            except Exception:
                pass


def main():
    print("NOAA OISST v2.1 — SST harian, keluaran satu file per tahun")
    print(f"Periode       : {START_YEAR}-{END_YEAR}")
    print(f"Bounding box  : lon {LON_MIN}–{LON_MAX} E, lat {LAT_MIN}–{LAT_MAX}")
    print(f"Folder output : {OUTPUT_DIR}")
    print(f"Worker        : {MAX_WORKERS}")
    print("Perhatian: proses mengunduh ribuan file harian; perlu koneksi stabil.\n")

    semua_gagal = []

    for tahun in range(START_YEAR, END_YEAR + 1):
        file_output = OUTPUT_DIR / f"sst_ntt_{tahun}.nc"
        if file_output.exists() and file_output.stat().st_size > 0:
            print(f"[{tahun}] File tahunan sudah ada, dilewati.")
            continue

        folder_tahun = CACHE_DIR / str(tahun)
        folder_tahun.mkdir(parents=True, exist_ok=True)
        tanggal = list(tanggal_tahunan(tahun))
        sudah_ada = sum(
            1 for t in tanggal
            if (folder_tahun / f"{t:%Y%m%d}.nc").exists()
        )
        print(f"\n[{tahun}] Memproses {len(tanggal)} hari; cache tersedia: {sudah_ada}")

        gagal = []
        selesai = 0
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {
                executor.submit(unduh_dan_potong, t, folder_tahun): t
                for t in tanggal
                if not (folder_tahun / f"{t:%Y%m%d}.nc").exists()
            }
            total_baru = len(futures)
            for future in as_completed(futures):
                t = futures[future]
                try:
                    ok, pesan = future.result()
                except Exception as exc:
                    ok, pesan = False, str(exc)
                selesai += 1
                if not ok:
                    gagal.append((t.isoformat(), pesan))
                if selesai % 25 == 0 or selesai == total_baru:
                    print(
                        f"[{tahun}] Progres unduh/potong: "
                        f"{selesai}/{total_baru} file baru; gagal: {len(gagal)}"
                    )

        if gagal:
            file_log = OUTPUT_DIR / f"gagal_{tahun}.csv"
            with open(file_log, "w", encoding="utf-8") as f:
                f.write("tanggal,error\n")
                for t, pesan in gagal:
                    f.write(f'"{t}","{pesan.replace(chr(34), chr(39))}"\n')
            print(f"[{tahun}] Ada {len(gagal)} kegagalan. Log: {file_log}")

        if gabungkan_tahunan(tahun, folder_tahun):
            log_gagal = OUTPUT_DIR / f"gagal_{tahun}.csv"
            if log_gagal.exists():
                log_gagal.unlink()

    print("\nProses selesai atau berhenti pada tahun yang belum lengkap.")
    print(f"Periksa file sst_ntt_2000.nc sampai sst_ntt_{END_YEAR}.nc di:")
    print(OUTPUT_DIR)
    print("Jika ada tahun belum lengkap, jalankan skrip ini lagi untuk melanjutkan.")


if __name__ == "__main__":
    main()
