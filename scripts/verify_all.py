import json
import glob
from pathlib import Path

print("=== VERIFIKASI SEMUA NOTEBOOK ===")
for f in sorted(glob.glob('notebooks/*.ipynb')):
    with open(f, 'r', encoding='utf-8') as fp:
        nb = json.load(fp)
    code_cells = [c for c in nb['cells'] if c['cell_type'] == 'code']
    exec_counts = [c.get('execution_count') for c in code_cells]
    errors = []
    for idx, c in enumerate(code_cells):
        for out in c.get('outputs', []):
            if out.get('output_type') == 'error':
                errors.append((idx, out.get('ename'), out.get('evalue')))
    print(f"{Path(f).name}: Total {len(nb['cells'])} sel, {len(code_cells)} sel kode, dieksekusi: {sum(x is not None for x in exec_counts)}/{len(code_cells)}, Error: {len(errors)}")
    if errors:
        for err in errors:
            print(f"   Cell {err[0]}: {err[1]} - {err[2]}")

print("\n=== DAFTAR OUTPUT ARTIFAK ===")
for folder in ['outputs/figures', 'outputs/tables', 'outputs/reports', 'data/processed']:
    files = list(Path(folder).glob('*'))
    print(f"\n[{folder}] ({len(files)} file):")
    for fl in sorted(files):
        size_kb = fl.stat().st_size / 1024
        print(f"  - {fl.name} ({size_kb:.1f} KB)")
