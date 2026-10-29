"""
Eksekutor Notebook 3 sampai 6
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

results = []

for nb_name in NOTEBOOKS:
    nb_path = notebooks_dir / nb_name
    print()
    print("=" * 65)
    print(f"MEMULAI: {nb_name}")
    print("=" * 65)

    with open(nb_path, "r", encoding="utf-8") as f:
        nb = nbformat.read(f, as_version=4)

    client = NotebookClient(
        nb,
        timeout=3600,
        kernel_name="python3",
        resources={"metadata": {"path": str(notebooks_dir)}}
    )

    t0 = time.time()
    status = "OK"
    error_msg = ""
    try:
        client.execute()
        elapsed = time.time() - t0
        print(f"[BERHASIL] {nb_name} selesai dalam {elapsed:.1f} detik.")
    except Exception as e:
        elapsed = time.time() - t0
        status = "ERROR"
        error_msg = str(e)[:300]
        print(f"[ERROR] {nb_name} gagal setelah {elapsed:.1f} detik: {error_msg}")

    with open(nb_path, "w", encoding="utf-8") as f:
        nbformat.write(nb, f)

    results.append({
        "notebook": nb_name,
        "status": status,
        "elapsed_s": round(elapsed, 1),
        "error": error_msg,
    })

    if status == "ERROR":
        print(f"Pipeline dihentikan karena error di {nb_name}.")
        break

print()
print("=" * 65)
print("RINGKASAN EKSEKUSI PIPELINE NB3-NB6")
print("=" * 65)
for r in results:
    tag = "[OK]   " if r["status"] == "OK" else "[ERROR]"
    print(f"  {tag} {r['notebook']} ({r['elapsed_s']}s)")
    if r["error"]:
        print(f"         -> {r['error']}")
print()

