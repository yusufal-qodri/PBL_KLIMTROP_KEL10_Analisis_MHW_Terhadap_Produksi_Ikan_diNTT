import json
from pathlib import Path

# 1. Update Notebook 3
nb3_path = Path('notebooks/03_Analisis_Chlorophyll_a.ipynb')
with open(nb3_path, 'r', encoding='utf-8') as f:
    nb3 = json.load(f)

for cell in nb3['cells']:
    new_source = []
    for line in cell['source']:
        line = line.replace('2000–2013', '2000–2020')
        line = line.replace('2000-2013', '2000–2020')
        line = line.replace('14 tahun', '21 tahun')
        new_source.append(line)
    cell['source'] = new_source

with open(nb3_path, 'w', encoding='utf-8') as f:
    json.dump(nb3, f, indent=1, ensure_ascii=False)
print("Updated Notebook 3.")

# 2. Update Notebook 4
nb4_path = Path('notebooks/04_Analisis_Gabungan_MHW_dan_Chlorophyll_a.ipynb')
with open(nb4_path, 'r', encoding='utf-8') as f:
    nb4 = json.load(f)

for cell in nb4['cells']:
    new_source = []
    for line in cell['source']:
        line = line.replace('2000–2013', '2000–2020')
        line = line.replace('2000-2013', '2000–2020')
        line = line.replace('14 tahun', '21 tahun')
        line = line.replace("<= '2013-12-31'", "<= '2020-12-31'")
        new_source.append(line)
    cell['source'] = new_source

with open(nb4_path, 'w', encoding='utf-8') as f:
    json.dump(nb4, f, indent=1, ensure_ascii=False)
print("Updated Notebook 4.")

# 3. Update Notebook 5
nb5_path = Path('notebooks/05_Visualisasi_dan_Sintesis_Hasil.ipynb')
with open(nb5_path, 'r', encoding='utf-8') as f:
    nb5 = json.load(f)

for cell in nb5['cells']:
    new_source = []
    for line in cell['source']:
        line = line.replace('2000–2013', '2000–2020')
        line = line.replace('2000-2013', '2000–2020')
        line = line.replace('14 tahun', '21 tahun')
        new_source.append(line)
    cell['source'] = new_source

with open(nb5_path, 'w', encoding='utf-8') as f:
    json.dump(nb5, f, indent=1, ensure_ascii=False)
print("Updated Notebook 5.")
