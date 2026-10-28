import json, sys
sys.stdout.reconfigure(encoding='utf-8')

notebooks = [
    ('03', '03_Analisis_Chlorophyll_a.ipynb'),
    ('04', '04_Analisis_Gabungan_MHW_dan_Chlorophyll_a.ipynb'),
    ('05', '05_Visualisasi_dan_Sintesis_Hasil.ipynb'),
    ('06', '06_Interpretasi_Kualitatif_dan_Konteks_Tangkapan_Ikan.ipynb'),
]

for nb_num, nb_name in notebooks:
    with open(f'notebooks/{nb_name}', 'r', encoding='utf-8') as f:
        nb = json.load(f)
    n_code = sum(1 for c in nb['cells'] if c['cell_type'] == 'code')
    n_total = len(nb['cells'])
    print(f'NB{nb_num} ({nb_name}): {n_total} cells ({n_code} code cells)')
    for i, cell in enumerate(nb['cells']):
        if cell['cell_type'] == 'code':
            src = ''.join(cell['source']).strip().split('\n')[0]
            print(f'  Cell {i:02d}: {src[:80]}')
