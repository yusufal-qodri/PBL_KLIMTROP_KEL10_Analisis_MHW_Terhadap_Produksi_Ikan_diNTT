import json
from pathlib import Path

nb_path = Path("notebooks/05_Visualisasi_dan_Sintesis_Hasil.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Update Cell 0: Header Metodologis
cell_0_text = """# Notebook 5 — Visualisasi Spasial Terpadu, Peta per Kejadian (Per-Event Maps), dan Sintesis Oseanografi

**Proyek:** Analisis Spatiotemporal Marine Heatwaves (MHW), Klorofil-a, dan Konteks Perikanan Tangkap Provinsi Nusa Tenggara Timur  
**Dokumen Rujukan Metodologis:** `REVISI_PBL.md` (Bagian 8.1 & 8.2)

---

## 1. Tujuan dan Standar Visualisasi

1. **Sintesis Komposit 2000–2020:** Menggambarkan variabilitas SST, anomali termal, dan respons klorofil-a lintas dekade di NTT.
2. **Peta Spasial per Kejadian (Per-Event Maps — Mandat Utama PRD):**
   - Menghasilkan visualisasi resolusi tinggi untuk 3 kejadian MHW paling masif di perairan NTT:
     - **Peta A (Luas Sebaran):** Sel-sel perairan yang teridentifikasi mengalami kondisi MHW selama kejadian.
     - **Peta B (Intensitas Maksimum):** Suhu anomali puncak ($^\circ\\text{C}$ di atas klimatologi) pada masing-masing sel grid.
     - **Peta C (Durasi Lokal):** Jumlah hari aktif MHW pada masing-masing sel grid selama kejadian berlangsung.
3. **Penyelarasan Kartografi:** Menggunakan skala warna perceptually-uniform, rasio aspek geografis presisi, dan garis kontur pulau-pulau utama NTT.
"""
nb["cells"][0]["source"] = [line + "\n" for line in cell_0_text.split("\n")]
if nb["cells"][0]["source"]:
    nb["cells"][0]["source"][-1] = nb["cells"][0]["source"][-1].rstrip("\n")

# Update Cell 4 to ensure df_reg_events is loaded
cell_4_text = """# Pemuatan data terpadu
print("Memuat dataset untuk visualisasi dan sintesis spasial...")
ds_sst = xr.open_dataset(cfg.SST_MERGED_OUTPUT)
ds_chla = xr.open_dataset(cfg.CHLA_MERGED_OUTPUT)
ds_spatial_mhw = xr.open_dataset(cfg.SST_CLIMATOLOGY_OUTPUT)
ds_combined = xr.open_dataset(cfg.COMBINED_OUTPUT)

df_events = pd.read_csv(cfg.MHW_EVENTS_OUTPUT)
df_annual_mhw = pd.read_csv(cfg.MHW_METRICS_OUTPUT)

# Buka katalog spasial regional jika ada
catalog_file = cfg.TABLES_DIR / "mhw_events_spatial_catalog_ntt.csv"
if not catalog_file.exists():
    catalog_file = cfg.PROCESSED_DIR / "mhw_events_spatial_catalog_ntt.csv"

if catalog_file.exists():
    df_reg_events = pd.read_csv(catalog_file)
    print(f"✅ Katalog MHW Regional Spasial: {len(df_reg_events)} kejadian.")
else:
    df_reg_events = df_events

print(f"✅ Seluruh dataset berhasil dimuat ke memori.")
"""
nb["cells"][4]["source"] = [line + "\n" for line in cell_4_text.split("\n")]
if nb["cells"][4]["source"]:
    nb["cells"][4]["source"][-1] = nb["cells"][4]["source"][-1].rstrip("\n")

# Check if per-event cells already exist, if not insert before summary
has_per_event = any("per_event" in "".join(c.get("source", "")).lower() for c in nb["cells"])

per_event_md = {
    "cell_type": "markdown",
    "metadata": {},
    "source": [
        "---\n",
        "## 5. Peta Spasial Per Kejadian (Per-Event Maps) untuk Kejadian MHW Terbesar NTT\n",
        "\n",
        "Sesuai mandat `REVISI_PBL.md` Bagian 8.1, analisis MHW tidak hanya menyajikan satu peta rata-rata umum seluruh periode, melainkan memetakan secara detail struktur spasial dari masing-masing kejadian MHW terkuat:\n",
        "- **Kolom 1 (Luas Sebaran):** Sel grid yang aktif mengalami MHW selama kejadian (persentase luasan terdampak).\n",
        "- **Kolom 2 (Intensitas Maksimum):** Anomali termal puncak di atas batas klimatologi ($^\\circ\\text{C}$).\n",
        "- **Kolom 3 (Durasi Lokal):** Jumlah hari suatu sel grid mengalami kondisi MHW selama kejadian.\n"
    ]
}

per_event_code = {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
        "# Pembuatan Peta Spasial Per Kejadian (Per-Event Maps) untuk 3 Kejadian Terbesar NTT\n",
        "from scripts.detect_mhw import run_spatial_mhw_detection\n",
        "\n",
        "print(\"Menyiapkan data spasial untuk 3 kejadian MHW regional terbesar...\")\n",
        "\n",
        "# Jalankan atau muat deteksi spasial\n",
        "spatial_res = run_spatial_mhw_detection(ds_sst, regional_extent_threshold=0.15, verbose=False)\n",
        "is_mhw_3d = spatial_res['is_mhw_3d']\n",
        "intensity_3d = spatial_res['intensity_3d']\n",
        "df_reg = spatial_res['df_regional_events']\n",
        "ocean_mask = spatial_res['ocean_mask']\n",
        "time_dt = pd.DatetimeIndex(ds_sst.time.values)\n",
        "\n",
        "# Pilih 3 kejadian teratas berdasarkan durasi dan luas cakupan\n",
        "top3_events = df_reg.sort_values('duration_days', ascending=False).head(3).copy()\n",
        "\n",
        "fig, axes = plt.subplots(3, 3, figsize=(18, 14))\n",
        "\n",
        "for row_idx, (_, ev) in enumerate(top3_events.iterrows()):\n",
        "    s_idx = int(ev['start_idx'])\n",
        "    e_idx = int(ev['end_idx'])\n",
        "    ev_id = int(ev['regional_event_id'])\n",
        "    s_date = str(ev['start_date'])\n",
        "    e_date = str(ev['end_date'])\n",
        "    dur = int(ev['duration_days'])\n",
        "    pk_ext = float(ev['peak_extent_pct'])\n",
        "    \n",
        "    # Sub-volume kejadian\n",
        "    sub_mhw = is_mhw_3d[s_idx:e_idx+1]\n",
        "    sub_int = intensity_3d[s_idx:e_idx+1]\n",
        "    \n",
        "    # Peta A: Apakah sel pernah aktif MHW (Luas Sebaran)\n",
        "    ever_active = np.any(sub_mhw, axis=0).astype(float)\n",
        "    ever_active[~ocean_mask] = np.nan\n",
        "    \n",
        "    # Peta B: Intensitas Maksimum per grid\n",
        "    max_int_ev = np.max(sub_int, axis=0)\n",
        "    max_int_ev[~ocean_mask] = np.nan\n",
        "    \n",
        "    # Peta C: Durasi lokal per grid\n",
        "    dur_local_ev = np.sum(sub_mhw, axis=0).astype(float)\n",
        "    dur_local_ev[~ocean_mask] = np.nan\n",
        "    \n",
        "    # Plot Kolom 1: Luas Sebaran (Extent)\n",
        "    im_a = axes[row_idx, 0].pcolormesh(ds_sst.lon, ds_sst.lat, ever_active,\n",
        "                                      cmap='Oranges', vmin=0, vmax=1, shading='auto')\n",
        "    axes[row_idx, 0].set_title(f\"Kejadian #{ev_id} ({s_date} s.d. {e_date})\\n(a) Luas Sebaran (Cakupan Puncak: {pk_ext:.1f}%)\", fontsize=10, fontweight='bold')\n",
        "    axes[row_idx, 0].set_aspect('equal')\n",
        "    cb_a = plt.colorbar(im_a, ax=axes[row_idx, 0], ticks=[0, 1])\n",
        "    cb_a.ax.set_yticklabels(['Tidak Aktif', 'Aktif MHW'])\n",
        "    \n",
        "    # Plot Kolom 2: Intensitas Maksimum ($i_{max}$)\n",
        "    im_b = axes[row_idx, 1].pcolormesh(ds_sst.lon, ds_sst.lat, max_int_ev,\n",
        "                                      cmap='hot_r', vmin=0.5, vmax=3.0, shading='auto')\n",
        "    axes[row_idx, 1].set_title(f\"Kejadian #{ev_id}: {dur} Hari\\n(b) Intensitas Puncak ($i_{{max}}$)\", fontsize=10, fontweight='bold')\n",
        "    axes[row_idx, 1].set_aspect('equal')\n",
        "    plt.colorbar(im_b, ax=axes[row_idx, 1], label='Intensitas Maks (°C)')\n",
        "    \n",
        "    # Plot Kolom 3: Durasi Lokal (Hari)\n",
        "    im_c = axes[row_idx, 2].pcolormesh(ds_sst.lon, ds_sst.lat, dur_local_ev,\n",
        "                                      cmap='YlOrRd', vmin=0, vmax=dur, shading='auto')\n",
        "    axes[row_idx, 2].set_title(f\"Kejadian #{ev_id}: {s_date}\\n(c) Durasi Lokal per Grid\", fontsize=10, fontweight='bold')\n",
        "    axes[row_idx, 2].set_aspect('equal')\n",
        "    plt.colorbar(im_c, ax=axes[row_idx, 2], label='Durasi Lokal (Hari)')\n",
        "\n",
        "for ax in axes.flat:\n",
        "    ax.set_xlabel('Bujur (°BT)', fontsize=9)\n",
        "    ax.set_ylabel('Lintang (°LS)', fontsize=9)\n",
        "\n",
        "plt.suptitle('Peta Spasial Per Kejadian (Per-Event Maps) untuk 3 Kejadian MHW Regional Terbesar NTT', fontsize=14, fontweight='bold', y=0.995)\n",
        "plt.tight_layout()\n",
        "out_per_event_fig = cfg.FIGURES_DIR / \"nb5_per_event_spatial_maps.png\"\n",
        "fig.savefig(out_per_event_fig, dpi=cfg.FIGURE_DPI, bbox_inches='tight')\n",
        "print(f\"✅ Peta spasial per-kejadian disimpan: {out_per_event_fig}\")\n",
        "plt.show()\n"
    ]
}

if not has_per_event:
    # Insert before the last markdown/code summary cells
    nb["cells"].insert(-2, per_event_md)
    nb["cells"].insert(-2, per_event_code)

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print("Notebook 05 updated successfully.")

