"""
Re-eksekusi Notebooks 3, 4, 5, 6 dengan cakupan penuh 2000–2020.
"""
import nbformat
from nbclient import NotebookClient
from pathlib import Path
import sys
import time

project_root = Path(__file__).resolve().parent.parent
notebooks_dir = project_root / "notebooks"

NOTEBOOKS = [
    "03_Analisis_Chlorophyll_a.ipynb",
    "04_Analisis_Gabungan_MHW_dan_Chlorophyll_a.ipynb",
    "05_Visualisasi_dan_Sintesis_Hasil.ipynb",
    "06_Interpretasi_Kualitatif_dan_Konteks_Tangkapan_Ikan.ipynb",
]

for nb_name in NOTEBOOKS:
    nb_path = notebooks_dir / nb_name
    print()
    print("=" * 65)
    print(f"MEMULAI EKSEKUSI: {nb_name}")
    print("=" * 65)

    with open(nb_path, "r", encoding="utf-8") as f:
        nb = nbformat.read(f, as_version=4)

    client = NotebookClient(
        nb,
        timeout=600,
        kernel_name="python3",
        resources={"metadata": {"path": str(notebooks_dir)}},
    )

    t0 = time.time()
    try:
        client.execute()
        dur = time.time() - t0
        print(f"SELESAI SUKSES: {nb_name} ({dur:.1f} detik)")

        with open(nb_path, "w", encoding="utf-8") as f:
            nbformat.write(nb, f)
        print(f"File tersimpan: {nb_name}")
    except Exception as e:
        dur = time.time() - t0
        print(f"GAGAL: {nb_name} ({dur:.1f} detik) - Error: {e}")
        sys.exit(1)

print("\n" + "=" * 65)
print("SELURUH NOTEBOOK (3-6) BERHASIL DIRE-EKSEKUSI PENUH (2000–2020)!")
print("=" * 65)
