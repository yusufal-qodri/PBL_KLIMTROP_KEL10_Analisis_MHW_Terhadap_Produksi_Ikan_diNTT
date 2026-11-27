
import cdsapi
import calendar
import time
from pathlib import Path

# ============================================
# DOWNLOAD CHLOROPHYLL-a HARIAN ESA CCI
# WILAYAH NTT | 2000-2020
# ============================================

DATASET = "satellite-ocean-colour"

OUTPUT_DIR = Path("chla_ntt_daily")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Batas wilayah: utara, barat, selatan, timur
AREA = [-7.0, 117.5, -13.0, 127.5]

START_YEAR = 2014
END_YEAR = 2020

MONTHS = [f"{m:02d}" for m in range(1, 13)]

client = cdsapi.Client()


def download_month(year, month):
    filename = OUTPUT_DIR / f"chla_ntt_{year}_{month}.zip"

    if filename.exists() and filename.stat().st_size > 0:
        print(f"[LEWATI] {year}-{month}: file sudah ada")
        return True

    number_of_days = calendar.monthrange(year, month)[1]
    days = [f"{d:02d}" for d in range(1, number_of_days + 1)]

    request = {
        "variable": ["mass_concentration_of_chlorophyll_a"],
        "projection": "regular_latitude_longitude_grid",
        "temporal_resolution": "daily",
        "year": [str(year)],
        "month": [f"{month:02d}"],
        "day": days,
        "version": "6_0",
        "area": AREA,
    }

    print(f"\n[DOWNLOAD] {year}-{month:02d}")

    try:
        result = client.retrieve(DATASET, request)
        result.download(str(filename))

        if filename.exists() and filename.stat().st_size > 0:
            size_mb = filename.stat().st_size / (1024 * 1024)
            print(f"[BERHASIL] {filename} ({size_mb:.2f} MB)")
            return True

        print(f"[GAGAL] {year}-{month:02d}: file kosong")
        return False

    except Exception as error:
        print(f"[GAGAL] {year}-{month:02d}: {error}")
        return False


def main():
    berhasil = []
    gagal = []

    total = (END_YEAR - START_YEAR + 1) * 12
    counter = 0

    for year in range(START_YEAR, END_YEAR + 1):
        for month in range(1, 13):
            counter += 1

            print(f"\nProgres: {counter}/{total}")

            ok = download_month(year, month)
            key = f"{year}-{month:02d}"

            if ok:
                berhasil.append(key)
            else:
                gagal.append(key)

            # Jeda singkat antarpemintaan
            time.sleep(2)

    print("\n" + "=" * 55)
    print("RINGKASAN")
    print("=" * 55)
    print(f"Berhasil: {len(berhasil)}")
    print(f"Gagal   : {len(gagal)}")

    if gagal:
        print("\nBulan yang gagal:")
        for item in gagal:
            print("-", item)

    print(f"\nFolder output: {OUTPUT_DIR.resolve()}")


if __name__ == "__main__":
    main()
