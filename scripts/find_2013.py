import json
from pathlib import Path

for nb_name in [
    '03_Analisis_Chlorophyll_a.ipynb',
    '04_Analisis_Gabungan_MHW_dan_Chlorophyll_a.ipynb',
    '05_Visualisasi_dan_Sintesis_Hasil.ipynb',
    '06_Interpretasi_Kualitatif_dan_Konteks_Tangkapan_Ikan.ipynb'
]:
    p = Path('notebooks') / nb_name
    with open(p, 'r', encoding='utf-8') as f:
        nb = json.load(f)
    print("=" * 60)
    print(f"FILE: {nb_name}")
    print("=" * 60)
    for i, c in enumerate(nb['cells']):
        src = ''.join(c['source'])
        if '2013' in src:
            print(f"--- Cell {i} ({c['cell_type']}) ---")
            for line in c['source']:
                if '2013' in line:
                    print("  ", line.rstrip())
