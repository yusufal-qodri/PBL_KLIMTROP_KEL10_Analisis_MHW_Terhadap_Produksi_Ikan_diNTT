
from pathlib import Path
from urllib.parse import quote
import time
import requests

# ============================================================
# DOWNLOAD KLOROFIL-a HARIAN MODIS-AQUA UNTUK WILAYAH NTT
# Output: satu file NetCDF (.nc) per tahun
# ============================================================

# Sumber data ERDDAP NOAA OceanWatch
BASE_URL = (
    "https://oceanwatch.pifsc.noaa.gov/erddap/griddap/"
    "aqua_chla_1d_2018_0"
)

# Wilayah NTT
LON_MIN = 117.5
LON_MAX = 127.5
LAT_MIN = -13.0
LAT_MAX = -7.0

# Rentang tahun yang ingin dicoba
START_YEAR = 2003
END_YEAR = 2024

# Folder penyimpanan output
OUTPUT_DIR = Path("data_klorofil_ntt")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Pengaturan koneksi
TIMEOUT = 180
MAX_RETRIES = 3
DELAY_SECONDS = 2

# Variabel utama pada dataset
VARIABLE = "chlor_a"

# Session HTTP
session = requests.Session()
session.headers.update({
    "User-Agent": "NTT-Chlorophyll-Data-Downloader/1.0"
})


def build_url(year):
    """
    Membuat URL subset data klorofil-a untuk satu tahun.
    Wilayah dibatasi pada koordinat NTT.
    """

    start_date = f"{year}-01-01T00:00:00Z"
    end_date = f"{year}-12-31T23:59:59Z"

    query = (
        f"{VARIABLE}"
        f"[({start_date}):1:({end_date})]"
        f"[({LAT_MIN}):1:({LAT_MAX})]"
        f"[({LON_MIN}):1:({LON_MAX})]"
    )

    # Mengodekan query agar aman digunakan pada URL
    encoded_query = quote(query, safe="[]():,-TZ.")
    return f"{BASE_URL}.nc?{encoded_query}"


def download_year(year):
    """
    Mengunduh satu tahun data ke file NetCDF.
    File yang sudah ada dan tidak kosong tidak diunduh ulang.
    """

    output_file = OUTPUT_DIR / f"chla_ntt_{year}.nc"
    temp_file = OUTPUT_DIR / f"chla_ntt_{year}.part"

    if output_file.exists() and output_file.stat().st_size > 0:
        print(f"[LEWATI] {year}: file sudah tersedia.")
        return True

    url = build_url(year)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(
                f"[DOWNLOAD] Tahun {year} "
                f"(percobaan {attempt}/{MAX_RETRIES})"
            )

            with session.get(
                url,
                stream=True,
                timeout=TIMEOUT
            ) as response:

                if response.status_code != 200:
                    error_text = response.text[:500]
                    raise RuntimeError(
                        f"HTTP {response.status_code}: {error_text}"
                    )

                content_type = response.headers.get(
                    "Content-Type", ""
                ).lower()

                # Server terkadang mengembalikan halaman error
                # walaupun respons HTTP berhasil.
                if "text/html" in content_type:
                    raise RuntimeError(
                        "Server mengembalikan HTML, bukan NetCDF."
                    )

                bytes_written = 0

                with open(temp_file, "wb") as file:
                    for chunk in response.iter_content(
                        chunk_size=1024 * 1024
                    ):
                        if chunk:
                            file.write(chunk)
                            bytes_written += len(chunk)

            if bytes_written == 0:
                raise RuntimeError("File hasil unduhan kosong.")

            # NetCDF klasik dimulai dengan CDF; NetCDF4/HDF5
            # umumnya dimulai dengan signature HDF.
            with open(temp_file, "rb") as file:
                signature = file.read(8)

            valid_signature = (
                signature.startswith(b"CDF")
                or signature == b"\x89HDF\r\n\x1a\n"
            )

            if not valid_signature:
                raise RuntimeError(
                    "Hasil unduhan bukan file NetCDF yang valid. "
                    "Periksa ketersediaan dataset dan nama variabel."
                )

            temp_file.replace(output_file)

            size_mb = output_file.stat().st_size / (1024 * 1024)

            print(
                f"[BERHASIL] {year}: {output_file} "
                f"({size_mb:.2f} MB)"
            )

            return True

        except Exception as error:
            print(f"[GAGAL] {year}: {error}")

            if temp_file.exists():
                temp_file.unlink()

            if attempt < MAX_RETRIES:
                print("Mencoba kembali...")
                time.sleep(DELAY_SECONDS * attempt)

    print(
        f"[TIDAK BERHASIL] {year}. "
        "Tahun ini dilewati; periksa log di atas."
    )
    return False


def main():
    print("=" * 65)
    print("DOWNLOAD DATA KLOROFIL-a HARIAN MODIS-AQUA - NTT")
    print("=" * 65)
    print(f"Sumber       : {BASE_URL}")
    print(f"Tahun        : {START_YEAR}–{END_YEAR}")
    print(f"Bujur        : {LON_MIN} sampai {LON_MAX}")
    print(f"Lintang      : {LAT_MIN} sampai {LAT_MAX}")
    print(f"Folder output: {OUTPUT_DIR.resolve()}")
    print("=" * 65)

    berhasil = []
    gagal = []

    for year in range(START_YEAR, END_YEAR + 1):
        success = download_year(year)

        if success:
            berhasil.append(year)
        else:
            gagal.append(year)

        time.sleep(DELAY_SECONDS)

    print("\n" + "=" * 65)
    print("RINGKASAN DOWNLOAD")
    print("=" * 65)
    print(f"Berhasil: {len(berhasil)} tahun")
    print(f"Gagal   : {len(gagal)} tahun")

    if berhasil:
        print("Tahun berhasil:", ", ".join(map(str, berhasil)))

    if gagal:
        print("Tahun gagal   :", ", ".join(map(str, gagal)))
        print(
            "\nTahun yang gagal belum tentu berarti tidak ada data. "
            "Bisa juga karena server, koneksi, atau batas cakupan data."
        )

    print(f"\nFolder hasil: {OUTPUT_DIR.resolve()}")


if __name__ == "__main__":
    main()
