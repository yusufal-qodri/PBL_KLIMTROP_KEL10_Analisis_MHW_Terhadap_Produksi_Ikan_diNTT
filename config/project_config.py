"""
Konfigurasi Terpusat untuk Pipeline Analisis MHW, SST, dan Chlorophyll-a di NTT
================================================================================
File ini memuat seluruh path direktori, batas wilayah geografis, parameter deteksi
MHW, dan nama file keluaran terstandarisasi untuk memastikan portabilitas pipeline.
"""

from pathlib import Path

# =============================================================================
# 1. ROOT DIREKTORI & STRUKTUR FOLDER
# =============================================================================
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Direktori Data
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
INTERIM_DIR = DATA_DIR / "interim"
PROCESSED_DIR = DATA_DIR / "processed"

# Lokasi Data Mentah
# Prioritaskan folder aktual yang sudah ada di workspace
SST_RAW_DIR = DATA_DIR / "data_sst_ntt"
if not SST_RAW_DIR.exists():
    SST_RAW_DIR = RAW_DIR / "sst"

CHLA_ZIP_DIR_PRIMARY = DATA_DIR / "chla_ntt_daily"
CHLA_ZIP_DIR_SECONDARY = RAW_DIR / "chlorophyll_a_zip"
CHLA_NC_DIR = RAW_DIR / "chlorophyll_a_nc"

SHP_DIR = RAW_DIR / "shp"
CATCH_DIR = RAW_DIR / "catch"
CATCH_DATA_FILE = PROCESSED_DIR / "Produksi Perikanan Tangkap Menurut Provinsi ntt 2000-2020.csv"
if not CATCH_DATA_FILE.exists():
    CATCH_DATA_FILE = CATCH_DIR / "produksi_tangkap_ntt_2000_2020.csv"

# Direktori Luaran (Outputs)
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
FIGURES_DIR = OUTPUTS_DIR / "figures"
TABLES_DIR = OUTPUTS_DIR / "tables"
REPORTS_DIR = OUTPUTS_DIR / "reports"
LOGS_DIR = OUTPUTS_DIR / "logs"

# Pastikan folder luaran utama tersedia
for d in [INTERIM_DIR, PROCESSED_DIR, FIGURES_DIR, TABLES_DIR, REPORTS_DIR, LOGS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# =============================================================================
# 2. PARAMETER GEOGRAFIS & WAKTU
# =============================================================================
# Bounding box tentatif perairan NTT (dapat dikonfirmasi kembali)
LON_MIN = 117.5
LON_MAX = 127.5
LAT_MIN = -13.0
LAT_MAX = -7.0

# Rentang tahun target
SST_START_YEAR = 2000
SST_END_YEAR = 2020

# =============================================================================
# 3. PARAMETER DETEKSI MHW (Hobday et al., 2016)
# =============================================================================
# Baseline 21 tahun (2000-2020). Catatan PRD: Nyatakan bahwa ini baseline 21 tahun, bukan 30 tahun.
MHW_BASELINE_START = 2000
MHW_BASELINE_END = 2020
MHW_PERCENTILE = 90
MHW_MIN_DURATION_DAYS = 5
MHW_SMOOTHING_WINDOW = 31

# =============================================================================
# 4. PARAMETER VISUALISASI & SPESIES
# =============================================================================
FIGURE_DPI = 300
COLORMAP_SST = "coolwarm"
COLORMAP_CHLA = "viridis"

# Target perikanan tangkap laut umum (general marine capture fisheries)
TARGET_FISHERIES_SCOPE = "Perikanan Tangkap Laut Umum (General Marine Capture Fisheries)"
TARGET_SPECIES = ["Perikanan Laut Umum", "Pelagis Besar", "Pelagis Kecil", "Demersal/Karang"]

# =============================================================================
# 5. PATH FILE KELUARAN STANDAR
# =============================================================================
# Notebook 1 outputs
SST_MERGED_OUTPUT = PROCESSED_DIR / "sst_daily_2000_2020_ntt.nc"
CHLA_MERGED_OUTPUT = PROCESSED_DIR / "chlorophyll_a_daily_ntt.nc"
DATA_INVENTORY_OUTPUT = REPORTS_DIR / "data_inventory.csv"
DATA_QUALITY_OUTPUT = REPORTS_DIR / "data_quality_report.csv"

# Notebook 2 outputs
MHW_EVENTS_OUTPUT = PROCESSED_DIR / "mhw_events_ntt.csv"
MHW_METRICS_OUTPUT = PROCESSED_DIR / "mhw_annual_metrics_ntt.csv"
SST_CLIMATOLOGY_OUTPUT = PROCESSED_DIR / "sst_climatology_threshold_ntt.nc"

# Notebook 3 outputs
CHLA_QUALITY_OUTPUT = REPORTS_DIR / "chla_quality_report.csv"
CHLA_STATS_OUTPUT = TABLES_DIR / "chla_descriptive_stats.csv"

# Notebook 4 outputs
COMBINED_GRID = "sst"  # Mereferensikan grid SST 0.25 deg
COMBINED_OUTPUT = PROCESSED_DIR / "mhw_chla_aligned_daily_ntt.nc"
COMBINED_COMPARISON_OUTPUT = TABLES_DIR / "mhw_chla_comparison_summary.csv"

# Notebook 6 outputs
INTERPRETATION_OUTPUT = TABLES_DIR / "annual_synthesis_mhw_chla_catch.csv"
