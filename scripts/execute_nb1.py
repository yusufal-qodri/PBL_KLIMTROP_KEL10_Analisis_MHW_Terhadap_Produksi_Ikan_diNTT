import nbformat
from nbclient import NotebookClient
from pathlib import Path
import sys
import time

project_root = Path(__file__).resolve().parent.parent
nb_path = project_root / "notebooks" / "01_Persiapan_dan_Penggabungan_Data.ipynb"

print(f"Membuka notebook: {nb_path}")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = nbformat.read(f, as_version=4)

client = NotebookClient(
    nb,
    timeout=1800,
    kernel_name="python3",
    resources={"metadata": {"path": str(project_root / "notebooks")}}
)

print("Memulai eksekusi Notebook 1...")
t0 = time.time()
try:
    client.execute()
    print(f"Eksekusi selesai dalam {time.time() - t0:.1f} detik.")
    
    print(f"Menyimpan output notebook ke: {nb_path}")
    with open(nb_path, "w", encoding="utf-8") as f:
        nbformat.write(nb, f)
    print("Notebook 1 berhasil dieksekusi dan disimpan.")
except Exception as e:
    print(f"ERROR saat eksekusi: {e}")
    # Simpan kondisi terakhir notebook
    with open(nb_path, "w", encoding="utf-8") as f:
        nbformat.write(nb, f)
    sys.exit(1)
