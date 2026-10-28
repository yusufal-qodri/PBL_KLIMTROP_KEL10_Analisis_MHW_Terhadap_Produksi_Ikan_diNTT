import nbformat
from nbclient import NotebookClient
from pathlib import Path
import time
import sys

nb_path = Path("notebooks/06_Interpretasi_Kualitatif_dan_Konteks_Tangkapan_Ikan.ipynb")
print(f"Mengeksekusi {nb_path.name}...")

with open(nb_path, "r", encoding="utf-8") as f:
    nb = nbformat.read(f, as_version=4)

client = NotebookClient(
    nb,
    timeout=600,
    kernel_name="python3",
    resources={"metadata": {"path": "notebooks"}},
)

t0 = time.time()
client.execute()
dur = time.time() - t0
print(f"Eksekusi selesai dalam {dur:.1f} detik.")

with open(nb_path, "w", encoding="utf-8") as f:
    nbformat.write(nb, f)

print("Notebook 6 berhasil disimpan dengan seluruh output terbaru.")
