import json
from pathlib import Path

notebooks = [
    'notebooks/01_Persiapan_dan_Penggabungan_Data.ipynb',
    'notebooks/02_Analisis_SST_dan_Deteksi_MHW.ipynb',
    'notebooks/03_Analisis_Chlorophyll_a.ipynb',
    'notebooks/04_Analisis_Gabungan_MHW_dan_Chlorophyll_a.ipynb',
    'notebooks/05_Visualisasi_dan_Sintesis_Hasil.ipynb',
    'notebooks/06_Interpretasi_Kualitatif_dan_Konteks_Tangkapan_Ikan.ipynb'
]

for nb_p in notebooks:
    with open(nb_p, 'r', encoding='utf-8') as f:
        nb = json.load(f)
    c2 = nb['cells'][2]
    src = ''.join(c2['source'])
    if 'sys.path.insert(0, str(project_root))' not in src:
        target = "sys.path.insert(0, str(project_root / 'config'))"
        replacement = "sys.path.insert(0, str(project_root))\nsys.path.insert(0, str(project_root / 'config'))"
        src = src.replace(target, replacement)
        c2['source'] = [line + '\n' for line in src.split('\n')]
        if c2['source']:
            c2['source'][-1] = c2['source'][-1].rstrip('\n')
        with open(nb_p, 'w', encoding='utf-8') as f:
            json.dump(nb, f, indent=1, ensure_ascii=False)
        print('Updated sys.path in', nb_p)
    else:
        print('Already ok in', nb_p)

