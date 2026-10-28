/**
 * NTT Marine Insight - Interactive Oceanographic & Fisheries Web Dashboard
 * Pure ES6+, Leaflet, Chart.js, Lucide Icons, and Zero-Lag Preprocessed Datasets.
 */

// Global State
const state = {
  currentPage: 'overview',
  timeMode: 'tahunan',
  selectedYear: 2016,
  selectedMonth: 6,
  selectedDate: '2016-06-25',
  selectedDecade: '2010_2019',
  selectedRegion: 'all',
  selectedMapLayer: 'sst',
  datasets: {},
  map: null,
  gridLayer: null,
  activeCellMarker: null,
  charts: {}
};

// Region Coordinates Bounds Definitions
const REGIONS = {
  all: { name: 'Seluruh Perairan NTT', bounds: [[-13.0, 117.5], [-7.0, 127.5]], center: [-9.5, 122.5], zoom: 7 },
  sawu: { name: 'Laut Sawu (Kawasan Konservasi)', bounds: [[-10.5, 120.0], [-8.5, 124.0]], center: [-9.5, 122.0], zoom: 8 },
  flores: { name: 'Laut Flores (Utara NTT)', bounds: [[-8.5, 118.5], [-7.0, 124.5]], center: [-7.8, 121.5], zoom: 8 },
  timor: { name: 'Laut Timor (Selatan NTT)', bounds: [[-12.8, 122.0], [-9.8, 127.4]], center: [-11.0, 124.5], zoom: 8 },
  sumba: { name: 'Selat Sumba & Barat NTT', bounds: [[-10.2, 118.0], [-8.8, 120.5]], center: [-9.5, 119.5], zoom: 8 }
};

// Color Palettes (kept for backward compat; smooth versions used by map)
function getSstColor(val) {
  return getSstColorSmooth(val) || 'rgba(200, 200, 200, 0.2)';
}

function getChlaColor(val) {
  return getChlaColorSmooth(val) || 'rgba(200, 200, 200, 0.2)';
}

function getMhwDaysColor(val) {
  return getMhwDaysColorSmooth(val) || 'rgba(200, 200, 200, 0.2)';
}

function getMhwIntColor(val) {
  return getMhwIntColorSmooth(val) || 'rgba(200, 200, 200, 0.2)';
}

// Sub-region detector from coordinates
function detectSubRegion(lat, lon) {
  if (lat > -8.5 && lon >= 118.5 && lon <= 124.5) return 'Laut Flores';
  if (lat <= -8.5 && lat >= -10.5 && lon >= 120.0 && lon <= 124.2) return 'Laut Sawu';
  if (lat < -10.0 && lon >= 122.0) return 'Laut Timor';
  if (lon < 120.5 && lat >= -10.5 && lat <= -8.8) return 'Selat Sumba & Pesisir Barat';
  return 'Perairan Terbuka NTT';
}

// Main Initialization
document.addEventListener('DOMContentLoaded', async () => {
  console.log('NTT Marine Insight Dashboard initializing...');
  
  // Render initial icons
  lucide.createIcons();

  // Load all pre-extracted JSON datasets
  await loadDatasets();

  // Initialize UI controls
  setupNavigation();
  setupFilterControls();
  setupMap();
  setupModalViewer();

  // Populate dynamic UI tables and cards
  populateYearDropdown();
  populateMhwTable();
  populateSpeciesCards();
  populateSynthesisFindings();
  populatePrdCompliance();

  // Initialize Charts
  initSstDailyChart();
  initSstSeasonalChart();
  initMhwAnnualChart();
  initChlaSeasonalChart();
  initFisheriesChart();

  // Update initial views based on default filters
  updateDashboardViews();

  console.log('Dashboard initialization completed successfully.');
});

// Load JSON Datasets
async function loadDatasets() {
  const files = [
    ['metadata', 'data/metadata.json'],
    ['annual', 'data/annual_summary.json'],
    ['mhw_events', 'data/mhw_events.json'],
    ['climatology_doy', 'data/climatology_doy.json'],
    ['monthly_clim', 'data/monthly_climatology.json'],
    ['spatial', 'data/spatial_grids.json'],
    ['daily_series', 'data/daily_regional_series.json'],
    ['chla_analysis', 'data/chla_analysis.json'],
    ['fisheries', 'data/fisheries_data.json'],
    ['synthesis', 'data/synthesis_methodology.json'],
    ['coastline', 'data/ntt_coastline.geojson']
  ];

  for (const [key, path] of files) {
    try {
      const res = await fetch(path);
      state.datasets[key] = await res.json();
    } catch (err) {
      console.error(`Failed to load dataset ${key} from ${path}:`, err);
    }
  }
}

// Navigation between the 8 PRD pages
function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const pages = document.querySelectorAll('.page-content');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');

  function switchPage(pageId) {
    state.currentPage = pageId;

    // Toggle Nav Button Classes
    navBtns.forEach(btn => {
      if (btn.dataset.page === pageId) {
        btn.classList.add('nav-item-active');
      } else {
        btn.classList.remove('nav-item-active');
      }
    });

    // Toggle Pages
    pages.forEach(p => {
      if (p.id === `page-${pageId}`) {
        p.classList.remove('hidden');
      } else {
        p.classList.add('hidden');
      }
    });

    // Resize Leaflet Map when overview is activated
    if (pageId === 'overview' && state.map) {
      setTimeout(() => state.map.invalidateSize(), 150);
    }

    // Close mobile sidebar if open
    if (!sidebar.classList.contains('hidden') && window.innerWidth < 768) {
      sidebar.classList.add('hidden');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    lucide.createIcons();
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
  });

  // Quick nav cards on Overview page
  document.querySelectorAll('.quick-nav-card').forEach(card => {
    card.addEventListener('click', () => switchPage(card.dataset.target));
  });

  // Mobile menu toggle
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
    });
  }
}

// Populate Year Selectors
function populateYearDropdown() {
  const selectYear = document.getElementById('select-year');
  if (!selectYear || !state.datasets.annual) return;

  selectYear.innerHTML = '';
  // Years 2000 to 2020 descending
  const years = state.datasets.annual.map(d => d.year).sort((a, b) => b - a);
  years.forEach(yr => {
    const opt = document.createElement('option');
    opt.value = yr;
    opt.textContent = `Tahun ${yr}${yr === 2016 ? ' (MHW Ekstrem)' : yr === 2010 ? ' (MHW Kuat)' : ''}`;
    if (yr === state.selectedYear) opt.selected = true;
    selectYear.appendChild(opt);
  });
}

// Filter Controls & Mode Switching
function setupFilterControls() {
  const modeBtns = document.querySelectorAll('.time-mode-btn');
  const yearGroup = document.getElementById('filter-year-group');
  const monthGroup = document.getElementById('filter-month-group');
  const dayGroup = document.getElementById('filter-day-group');
  const decadeGroup = document.getElementById('filter-decade-group');

  const selectYear = document.getElementById('select-year');
  const selectMonth = document.getElementById('select-month');
  const selectDate = document.getElementById('select-date');
  const selectDecade = document.getElementById('select-decade');
  const selectRegion = document.getElementById('select-region');
  const resetBtn = document.getElementById('reset-filter-btn');

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => {
        b.classList.remove('bg-brand-600', 'text-white');
        b.classList.add('bg-slate-100', 'text-slate-700');
      });
      btn.classList.add('bg-brand-600', 'text-white');
      btn.classList.remove('bg-slate-100', 'text-slate-700');

      state.timeMode = btn.dataset.mode;

      // Adjust visible controls
      yearGroup.classList.remove('hidden');
      monthGroup.classList.add('hidden');
      dayGroup.classList.add('hidden');
      decadeGroup.classList.add('hidden');

      if (state.timeMode === 'harian') {
        dayGroup.classList.remove('hidden');
      } else if (state.timeMode === 'mingguan') {
        // Year + Month context
        monthGroup.classList.remove('hidden');
      } else if (state.timeMode === 'bulanan') {
        monthGroup.classList.remove('hidden');
      } else if (state.timeMode === 'dekadal') {
        yearGroup.classList.add('hidden');
        decadeGroup.classList.remove('hidden');
      }

      updateDashboardViews();
    });
  });

  if (selectYear) {
    selectYear.addEventListener('change', (e) => {
      state.selectedYear = parseInt(e.target.value);
      updateDashboardViews();
    });
  }

  if (selectMonth) {
    selectMonth.addEventListener('change', (e) => {
      state.selectedMonth = parseInt(e.target.value);
      updateDashboardViews();
    });
  }

  if (selectDate) {
    selectDate.addEventListener('change', (e) => {
      state.selectedDate = e.target.value;
      state.selectedYear = parseInt(e.target.value.split('-')[0]);
      updateDashboardViews();
    });
  }

  if (selectDecade) {
    selectDecade.addEventListener('change', (e) => {
      state.selectedDecade = e.target.value;
      updateDashboardViews();
    });
  }

  if (selectRegion) {
    selectRegion.addEventListener('change', (e) => {
      state.selectedRegion = e.target.value;
      const reg = REGIONS[state.selectedRegion];
      if (reg && state.map) {
        state.map.flyTo(reg.center, reg.zoom, { duration: 1 });
      }
      updateDashboardViews();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.timeMode = 'tahunan';
      state.selectedYear = 2016;
      state.selectedRegion = 'all';
      if (selectYear) selectYear.value = 2016;
      if (selectRegion) selectRegion.value = 'all';
      
      modeBtns.forEach(b => {
        if (b.dataset.mode === 'tahunan') {
          b.classList.add('bg-brand-600', 'text-white');
          b.classList.remove('bg-slate-100', 'text-slate-700');
        } else {
          b.classList.remove('bg-brand-600', 'text-white');
          b.classList.add('bg-slate-100', 'text-slate-700');
        }
      });
      yearGroup.classList.remove('hidden');
      monthGroup.classList.add('hidden');
      dayGroup.classList.add('hidden');
      decadeGroup.classList.add('hidden');

      if (state.map) {
        state.map.flyTo([-9.5, 122.5], 7, { duration: 1 });
      }
      updateDashboardViews();
    });
  }
}

// Leaflet Map Initialization
function setupMap() {
  const mapContainer = document.getElementById('main-map');
  if (!mapContainer) return;

  state.map = L.map('main-map', {
    center: [-9.5, 122.5],
    zoom: 7,
    minZoom: 6,
    maxZoom: 10,
    zoomControl: true,
    attributionControl: true
  });

  // -------------------------------------------------------------------------
  // Basemap options (Semua GRATIS, Tanpa Watermark "API KEY REQUIRED")
  // -------------------------------------------------------------------------
  const esriOceanBase = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Basemap &copy; <a href="https://www.esri.com">Esri</a>, GEBCO, NOAA, Nat. Geo.',
      maxZoom: 13,
      opacity: 1.0
    }
  );

  const esriGrayBase = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Basemap &copy; <a href="https://www.esri.com">Esri</a>, HERE, Garmin',
      maxZoom: 16,
      opacity: 1.0
    }
  );

  const osmBase = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      opacity: 1.0
    }
  );

  // Basemap default: ESRI Ocean
  esriOceanBase.addTo(state.map);

  const baseMaps = {
    "ESRI Ocean (Oseanografi)": esriOceanBase,
    "ESRI Light Gray (Minimalis)": esriGrayBase,
    "OpenStreetMap (Standar)": osmBase
  };

  L.control.layers(baseMaps, null, { position: 'topright' }).addTo(state.map);

  // Ocean Reference overlay (nama pulau & batas administrasi - dirender di atas data)
  const esriOceanRef = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: '',
      maxZoom: 13,
      opacity: 0.9,
      pane: 'overlayPane'
    }
  );

  // -------------------------------------------------------------------------
  // Coastline / Land polygon overlay dari Natural Earth 10m
  // Menampilkan daratan & pulau-pulau NTT dengan garis pantai tegas
  // -------------------------------------------------------------------------
  state.coastlineLayer = null;
  if (state.datasets.coastline) {
    state.coastlineLayer = L.geoJSON(state.datasets.coastline, {
      style: {
        color: '#1e293b',        // garis batas pantai tegas
        weight: 1.0,
        fillColor: '#cbd5e1',    // warna daratan pulau NTT (slate-300 yang kontras)
        fillOpacity: 0.95,
        interactive: false       // klik diteruskan ke inspektor grid
      }
    });
    state.coastlineLayer.addTo(state.map);
  }

  // Lapisan label referensi laut di atas daratan dan raster
  esriOceanRef.addTo(state.map);
  state.esriOceanRef = esriOceanRef;

  // Indikator batas bounding box wilayah kajian NTT (garis putus-putus biru)
  L.rectangle([[-13.0, 117.5], [-7.0, 127.5]], {
    color: '#0284c7',
    weight: 1.5,
    dashArray: '5, 6',
    fill: false,
    interactive: false
  }).addTo(state.map);

  // Skala peta metrik
  L.control.scale({ imperial: false, metric: true, position: 'bottomright' }).addTo(state.map);

  // Layer selector change
  const layerSelect = document.getElementById('map-layer-select');
  if (layerSelect) {
    layerSelect.addEventListener('change', (e) => {
      state.selectedMapLayer = e.target.value;
      updateMapLayer();
    });
  }

  // Reset Map View button
  const resetZoomBtn = document.getElementById('reset-map-zoom-btn');
  if (resetZoomBtn) {
    resetZoomBtn.addEventListener('click', () => {
      state.map.flyTo([-9.5, 122.5], 7, { duration: 0.8 });
    });
  }

  // Render layer peta awal
  updateMapLayer();
}

// ---------------------------------------------------------------------------
// Linear color interpolation helper
// ---------------------------------------------------------------------------
function lerpColor(a, b, t) {
  const ah = parseInt(a.replace('#',''), 16);
  const bh = parseInt(b.replace('#',''), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl2 = Math.round(ab + (bb - ab) * t);
  return '#' + [r,g,bl2].map(v => v.toString(16).padStart(2,'0')).join('');
}

// Smooth SST colormap (blue-white-red, range 25–32°C, realistic NTT range)
function getSstColorSmooth(val) {
  if (val === null || val === undefined || isNaN(val)) return null;
  const stops = [
    [25.0, '#313695'],
    [26.0, '#4575b4'],
    [27.0, '#74add1'],
    [27.8, '#abd9e9'],
    [28.3, '#e0f3f8'],
    [28.8, '#fffec8'],
    [29.3, '#fee090'],
    [29.8, '#fdae61'],
    [30.3, '#f46d43'],
    [31.0, '#d73027'],
    [32.0, '#a50026'],
  ];
  if (val <= stops[0][0]) return stops[0][1];
  if (val >= stops[stops.length-1][0]) return stops[stops.length-1][1];
  for (let i = 1; i < stops.length; i++) {
    if (val <= stops[i][0]) {
      const t = (val - stops[i-1][0]) / (stops[i][0] - stops[i-1][0]);
      return lerpColor(stops[i-1][1], stops[i][1], t);
    }
  }
  return '#d73027';
}

// Smooth Chl-a colormap (viridis-like, log-scaled, range 0.05–0.8 mg/m³)
function getChlaColorSmooth(val) {
  if (val === null || val === undefined || isNaN(val)) return null;
  // log-transform agar variasi konsentrasi rendah tetap kontras
  const logMin = Math.log10(0.05);
  const logMax = Math.log10(0.80);
  const logVal = Math.log10(Math.max(0.05, Math.min(0.80, val)));
  const t = (logVal - logMin) / (logMax - logMin);
  const stops = [
    [0.00, '#440154'],
    [0.15, '#3b528b'],
    [0.35, '#21918c'],
    [0.60, '#5ec962'],
    [0.80, '#b5de2b'],
    [1.00, '#fde725'],
  ];
  if (t <= 0) return stops[0][1];
  if (t >= 1) return stops[stops.length-1][1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const s = (t - stops[i-1][0]) / (stops[i][0] - stops[i-1][0]);
      return lerpColor(stops[i-1][1], stops[i][1], s);
    }
  }
  return '#fde725';
}

// Smooth MHW days colormap (0–550 days)
function getMhwDaysColorSmooth(val) {
  if (val === null || val === undefined || isNaN(val)) return null;
  const t = Math.max(0, Math.min(1, val / 520));
  const stops = [
    [0.00, '#fff7bc'],
    [0.15, '#fee391'],
    [0.35, '#fec44f'],
    [0.55, '#fe9929'],
    [0.70, '#ec7014'],
    [0.85, '#cc4c02'],
    [1.00, '#8c2d04'],
  ];
  if (t <= 0) return stops[0][1];
  if (t >= 1) return stops[stops.length-1][1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const s = (t - stops[i-1][0]) / (stops[i][0] - stops[i-1][0]);
      return lerpColor(stops[i-1][1], stops[i][1], s);
    }
  }
  return '#8c2d04';
}

// Smooth MHW max intensity colormap (0.5–3.5°C)
function getMhwIntColorSmooth(val) {
  if (val === null || val === undefined || isNaN(val)) return null;
  const t = Math.max(0, Math.min(1, (val - 0.3) / (3.5 - 0.3)));
  const stops = [
    [0.00, '#feebe2'],
    [0.25, '#fcc5c0'],
    [0.45, '#fa9fb5'],
    [0.65, '#f768a1'],
    [0.80, '#c51b8a'],
    [1.00, '#7a0177'],
  ];
  if (t <= 0) return stops[0][1];
  if (t >= 1) return stops[stops.length-1][1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const s = (t - stops[i-1][0]) / (stops[i][0] - stops[i-1][0]);
      return lerpColor(stops[i-1][1], stops[i][1], s);
    }
  }
  return '#7a0177';
}

// Update Map Layer based on selected layer & time state
function updateMapLayer() {
  if (!state.map || !state.datasets.spatial || !state.datasets.metadata) return;

  // Remove existing data grid layer
  if (state.gridLayer) {
    state.map.removeLayer(state.gridLayer);
    state.gridLayer = null;
  }

  const { lat_coords, lon_coords } = state.datasets.metadata.region;
  const spatial = state.datasets.spatial;
  const layer = state.selectedMapLayer;
  const mode = state.timeMode;
  const year = state.selectedYear ? String(state.selectedYear) : "2016";
  const month = state.selectedMonth ? String(state.selectedMonth) : "6";
  const decade = state.selectedDecade || "2010_2019";
  const date = state.selectedDate || "2016-06-25";

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  let matrix = null;
  let getColorFn = getSstColorSmooth;
  let unit = '°C';
  let legendConfig = {};

  if (layer === 'sst') {
    getColorFn = getSstColorSmooth;
    unit = '°C';
    let periodLabel = 'Rerata 2000–2020';

    if (mode === 'tahunan') {
      matrix = (spatial.sst_annual && spatial.sst_annual[year]) || spatial.sst_mean_all;
      periodLabel = `Tahun ${year}`;
    } else if (mode === 'bulanan') {
      matrix = (spatial.sst_monthly && spatial.sst_monthly[month]) || spatial.sst_mean_all;
      periodLabel = `Bulan ${monthNames[parseInt(month) - 1]}`;
    } else if (mode === 'mingguan') {
      matrix = (spatial.sst_monthly && spatial.sst_monthly[month]) || spatial.sst_mean_all;
      periodLabel = `Siklus Bulanan (${monthNames[parseInt(month) - 1]})`;
    } else if (mode === 'dekadal') {
      matrix = (spatial.sst_decadal && spatial.sst_decadal[decade]) || spatial.sst_mean_all;
      periodLabel = `Dekade ${decade.replace('_', '–')}`;
    } else if (mode === 'harian') {
      let sampleMatch = Object.values(spatial.sample_days || {}).find(s => s.date === date);
      if (sampleMatch && sampleMatch.sst) {
        matrix = sampleMatch.sst;
        periodLabel = `${date} (${sampleMatch.desc.split('(')[0].trim()})`;
      } else {
        const yrStr = date.split('-')[0];
        matrix = (spatial.sst_annual && spatial.sst_annual[yrStr]) || spatial.sst_mean_all;
        periodLabel = `Tanggal ${date}`;
      }
    } else {
      matrix = spatial.sst_mean_all;
    }

    legendConfig = {
      title: `SST ${periodLabel} (°C)`,
      min: '25°C', mid: '28.5°C', max: '32°C',
      barClass: 'colorbar-sst',
      range: '25 – 32'
    };

  } else if (layer === 'chla') {
    getColorFn = getChlaColorSmooth;
    unit = 'mg/m³';
    let periodLabel = 'Rerata 2002–2020';

    if (mode === 'tahunan') {
      matrix = (spatial.chla_annual && spatial.chla_annual[year]) || spatial.chla_mean_all;
      periodLabel = `Tahun ${year}`;
    } else if (mode === 'bulanan') {
      matrix = (spatial.chla_monthly && spatial.chla_monthly[month]) || spatial.chla_mean_all;
      periodLabel = `Bulan ${monthNames[parseInt(month) - 1]}`;
    } else if (mode === 'mingguan') {
      matrix = (spatial.chla_monthly && spatial.chla_monthly[month]) || spatial.chla_mean_all;
      periodLabel = `Siklus Bulanan (${monthNames[parseInt(month) - 1]})`;
    } else if (mode === 'dekadal') {
      matrix = (spatial.chla_decadal && spatial.chla_decadal[decade]) || spatial.chla_mean_all;
      periodLabel = `Dekade ${decade.replace('_', '–')}`;
    } else if (mode === 'harian') {
      let sampleMatch = Object.values(spatial.sample_days || {}).find(s => s.date === date);
      if (sampleMatch && sampleMatch.chla) {
        matrix = sampleMatch.chla;
        periodLabel = `${date} (${sampleMatch.desc.split('(')[0].trim()})`;
      } else {
        const yrStr = date.split('-')[0];
        matrix = (spatial.chla_annual && spatial.chla_annual[yrStr]) || spatial.chla_mean_all;
        periodLabel = `Tanggal ${date}`;
      }
    } else {
      matrix = spatial.chla_mean_all;
    }

    legendConfig = {
      title: `Chlorophyll-a ${periodLabel} (mg/m³)`,
      min: '0.05', mid: '0.25', max: '0.80 mg/m³',
      barClass: 'colorbar-chla',
      range: '0.05 – 0.80'
    };

  } else if (layer === 'mhw_days') {
    matrix = spatial.total_mhw_days;
    getColorFn = getMhwDaysColorSmooth;
    unit = 'Hari MHW';
    legendConfig = {
      title: 'Total Hari MHW 2000–2020',
      min: '0 Hari', mid: '260 Hari', max: '520 Hari',
      barClass: 'colorbar-mhw',
      range: '0 – 520'
    };

  } else if (layer === 'mhw_int') {
    matrix = spatial.max_intensity;
    getColorFn = getMhwIntColorSmooth;
    unit = '°C anomali';
    legendConfig = {
      title: 'Intensitas Maks MHW (°C anomali)',
      min: '0.3°C', mid: '1.8°C', max: '3.5°C',
      barClass: 'colorbar-mhw-int',
      range: '0.3 – 3.5'
    };
  }

  // Update floating legend
  const legendBar   = document.getElementById('legend-bar');
  const legendTitle = document.getElementById('legend-title');
  const legendRange = document.getElementById('legend-range');
  const lMin        = document.getElementById('legend-min');
  const lMid        = document.getElementById('legend-mid');
  const lMax        = document.getElementById('legend-max');

  if (legendBar && legendTitle && legendConfig.title) {
    legendBar.className = `h-3 rounded-full border border-slate-200 ${legendConfig.barClass}`;
    legendTitle.textContent  = legendConfig.title;
    legendRange.textContent  = legendConfig.range;
    if (lMin) lMin.textContent = legendConfig.min;
    if (lMid) lMid.textContent = legendConfig.mid;
    if (lMax) lMax.textContent = legendConfig.max;
  }

  if (!matrix) return;

  // Simpan matriks aktif pada state agar dapat dibaca langsung oleh inspektor titik
  state.activeMatrix = matrix;
  state.activeUnit = unit;

  // -------------------------------------------------------------------------
  // Render grid data oseanografi 0.25°
  // Nilai daratan/hilang (null) dilewati sehingga pulau NTT tampak alami
  // -------------------------------------------------------------------------
  const gridGroup = L.layerGroup();
  const halfLat = 0.125;   // setengah resolusi 0.25°
  const halfLon = 0.125;

  for (let r = 0; r < lat_coords.length; r++) {
    const lat = lat_coords[r];
    for (let c = 0; c < lon_coords.length; c++) {
      const lon = lon_coords[c];
      const val = matrix[r] ? matrix[r][c] : null;

      // Lewati sel daratan (null) dan data kosong
      if (val === null || val === undefined) continue;

      const color = getColorFn(val);
      if (!color) continue;

      const bounds = [
        [lat - halfLat, lon - halfLon],
        [lat + halfLat, lon + halfLon]
      ];

      const cell = L.rectangle(bounds, {
        color:       'none',
        weight:      0,
        fillColor:   color,
        fillOpacity: 0.75,
        interactive: true
      });

      const valDisplay = typeof val === 'number' ? val.toFixed(3) : val;
      cell.bindTooltip(
        `<div style="font-family:sans-serif;font-size:12px;line-height:1.5">
           <strong>${detectSubRegion(lat, lon)}</strong><br>
           <span style="color:#475569">${Math.abs(lat).toFixed(3)}°LS, ${lon.toFixed(3)}°BT</span><br>
           <span style="font-size:13px;font-weight:700;color:#1e293b">${valDisplay} ${unit}</span>
         </div>`,
        { sticky: true, opacity: 0.97, className: 'leaflet-tooltip-ntt' }
      );

      cell.on('click', () => inspectCell(lat, lon, r, c));

      gridGroup.addLayer(cell);
    }
  }

  state.gridLayer = gridGroup;
  state.gridLayer.addTo(state.map);

  // Pastikan layer garis pantai dan pulau selalu berada di atas layer raster laut
  if (state.coastlineLayer) {
    state.coastlineLayer.bringToFront();
  }
  // Pastikan label referensi laut (nama selat, pulau) tetap di paling atas
  if (state.esriOceanRef) {
    state.esriOceanRef.bringToFront();
  }
}

// Point Inspector on Click
function inspectCell(lat, lon, r, c) {
  const spatial = state.datasets.spatial;
  const activeMat = state.activeMatrix;

  // Baca nilai dari matriks aktif atau data rata-rata
  let currentVal = activeMat && activeMat[r] ? activeMat[r][c] : null;
  const sstVal = spatial && spatial.sst_mean_all && spatial.sst_mean_all[r] ? spatial.sst_mean_all[r][c] : null;
  const chlaVal = spatial && spatial.chla_mean_all && spatial.chla_mean_all[r] ? spatial.chla_mean_all[r][c] : null;
  const mhwDays = spatial && spatial.total_mhw_days && spatial.total_mhw_days[r] ? spatial.total_mhw_days[r][c] : null;
  const regionName = detectSubRegion(lat, lon);

  // Update inspector DOM
  const inspectCoords = document.getElementById('inspect-coords');
  const inspectRegion = document.getElementById('inspect-region-name');
  const inspectSst = document.getElementById('inspect-sst');
  const inspectMhw = document.getElementById('inspect-mhw');
  const inspectChla = document.getElementById('inspect-chla');
  const inspectorTag = document.getElementById('inspector-tag');

  if (inspectCoords) inspectCoords.textContent = `${lat.toFixed(3)}° LS, ${lon.toFixed(3)}° BT`;
  if (inspectRegion) inspectRegion.textContent = regionName;

  if (inspectSst) {
    if (sstVal === null) {
      inspectSst.innerHTML = `<span class="text-slate-400 italic">Daratan / Pulau NTT</span>`;
    } else {
      inspectSst.textContent = `${sstVal.toFixed(2)} °C`;
    }
  }

  if (inspectChla) {
    if (chlaVal === null) {
      inspectChla.innerHTML = `<span class="text-slate-400 italic">Data Tidak Tersedia / Daratan</span>`;
    } else {
      inspectChla.textContent = `${chlaVal.toFixed(3)} mg/m³`;
    }
  }

  if (inspectMhw) {
    if (mhwDays === null) {
      inspectMhw.innerHTML = `<span class="text-slate-400 italic">Daratan (Bukan Laut)</span>`;
    } else if (mhwDays > 400) {
      inspectMhw.innerHTML = `<span class="text-rose-600 font-bold">Rentan MHW (${mhwDays} Hari)</span>`;
    } else {
      inspectMhw.innerHTML = `<span class="text-emerald-600 font-semibold">Normal (${mhwDays} Hari)</span>`;
    }
  }

  if (inspectorTag) inspectorTag.textContent = 'Terpilih';

  // Highlight active cell marker on map
  if (state.activeCellMarker) {
    state.map.removeLayer(state.activeCellMarker);
  }
  state.activeCellMarker = L.circleMarker([lat, lon], {
    radius: 7,
    color: '#0f172a',
    weight: 2.5,
    fillColor: '#ffffff',
    fillOpacity: 1
  }).addTo(state.map);
}

// Update Dashboard Views based on State
function updateDashboardViews() {
  const headerFilterStatus = document.getElementById('header-filter-status');
  if (headerFilterStatus) {
    let modeText = state.timeMode.charAt(0).toUpperCase() + state.timeMode.slice(1);
    let periodText = state.timeMode === 'harian' ? state.selectedDate : state.timeMode === 'dekadal' ? state.selectedDecade.replace('_', '–') : state.selectedYear;
    headerFilterStatus.textContent = `Mode: ${modeText} | Periode: ${periodText}`;
  }

  // Update Top KPI Cards
  if (state.datasets.annual) {
    const yrData = state.datasets.annual.find(d => d.year === state.selectedYear) || state.datasets.annual[state.datasets.annual.length - 1];
    
    const kpiSst = document.getElementById('kpi-sst-val');
    const kpiSstAno = document.getElementById('kpi-sst-anomaly');
    const kpiMhwDays = document.getElementById('kpi-mhw-days');
    const kpiChla = document.getElementById('kpi-chla-val');
    const kpiCatch = document.getElementById('kpi-catch-val');

    if (kpiSst) kpiSst.textContent = yrData.sst_mean.toFixed(2);
    if (kpiSstAno) {
      const sign = yrData.sst_anomaly >= 0 ? '+' : '';
      kpiSstAno.textContent = `${sign}${yrData.sst_anomaly}° anomali`;
      kpiSstAno.className = yrData.sst_anomaly >= 0 ? 'font-medium text-rose-600' : 'font-medium text-brand-600';
    }
    if (kpiMhwDays) kpiMhwDays.textContent = yrData.mhw_days;
    if (kpiChla) kpiChla.textContent = yrData.chla_mean !== null ? yrData.chla_mean.toFixed(3) : '0.285';
    if (kpiCatch) kpiCatch.textContent = yrData.catch_tons !== null ? Number(yrData.catch_tons).toLocaleString('id-ID') : '142,357';
  }

  // Update Charts if active
  if (state.charts.sstDaily) {
    updateSstDailyChart();
  }

  // Update Map Layer based on active filters
  if (state.map) {
    updateMapLayer();
  }
}

// -----------------------------------------------------------------------------
// CHARTS IMPLEMENTATIONS
// -----------------------------------------------------------------------------

// 1. SST Daily Time Series Chart
function initSstDailyChart() {
  const ctx = document.getElementById('sstDailyChart');
  if (!ctx || !state.datasets.daily_series) return;

  const series = state.datasets.daily_series;
  // Sample series for smooth rendering
  const step = series.length > 2000 ? 3 : 1;
  const filtered = series.filter((_, idx) => idx % step === 0);

  const labels = filtered.map(d => d.date);
  const sstValues = filtered.map(d => d.sst);
  const climValues = filtered.map(d => d.clim);
  const threshValues = filtered.map(d => d.thresh);

  state.charts.sstDaily = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'SST Harian Regional (°C)',
          data: sstValues,
          borderColor: '#ef4444',
          borderWidth: 1.2,
          pointRadius: 0,
          tension: 0.1
        },
        {
          label: 'Klimatologi Rerata (°C)',
          data: climValues,
          borderColor: '#94a3b8',
          borderWidth: 1.2,
          pointRadius: 0,
          tension: 0.1
        },
        {
          label: 'Ambang Batas P90 MHW (°C)',
          data: threshValues,
          borderColor: '#f59e0b',
          borderWidth: 1.2,
          borderDash: [4, 4],
          pointRadius: 0,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} °C`
          }
        }
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 12, font: { size: 10 } },
          grid: { color: '#f1f5f9' }
        },
        y: {
          min: 25.0,
          max: 31.5,
          title: { display: true, text: 'Suhu Permukaan Laut (°C)', font: { size: 11 } },
          grid: { color: '#e2e8f0' }
        }
      }
    }
  });

  const yearFilter = document.getElementById('sst-chart-year-filter');
  if (yearFilter) {
    yearFilter.addEventListener('change', (e) => {
      updateSstDailyChart(e.target.value);
    });
  }
}

function updateSstDailyChart(selectedYear = 'all') {
  if (!state.charts.sstDaily || !state.datasets.daily_series) return;

  let series = state.datasets.daily_series;
  if (selectedYear !== 'all') {
    series = series.filter(d => d.date.startsWith(selectedYear));
  }

  const step = series.length > 1000 ? 2 : 1;
  const filtered = series.filter((_, idx) => idx % step === 0);

  state.charts.sstDaily.data.labels = filtered.map(d => d.date);
  state.charts.sstDaily.data.datasets[0].data = filtered.map(d => d.sst);
  state.charts.sstDaily.data.datasets[1].data = filtered.map(d => d.clim);
  state.charts.sstDaily.data.datasets[2].data = filtered.map(d => d.thresh);
  state.charts.sstDaily.update();
}

// 2. SST Seasonal Cycle Chart
function initSstSeasonalChart() {
  const ctx = document.getElementById('sstSeasonalChart');
  if (!ctx || !state.datasets.monthly_clim) return;

  const data = state.datasets.monthly_clim;
  const labels = data.map(d => d.name);
  const meanVals = data.map(d => d.sst_mean);
  const minVals = data.map(d => d.sst_min);
  const maxVals = data.map(d => d.sst_max);

  state.charts.sstSeasonal = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'SST Maksimum (°C)',
          data: maxVals,
          borderColor: '#fca5a5',
          backgroundColor: 'rgba(254, 202, 202, 0.2)',
          fill: '+1',
          pointRadius: 3,
          borderWidth: 1.5
        },
        {
          label: 'SST Rerata Bulanan (°C)',
          data: meanVals,
          borderColor: '#dc2626',
          backgroundColor: '#dc2626',
          pointRadius: 4,
          borderWidth: 2.5
        },
        {
          label: 'SST Minimum (°C)',
          data: minVals,
          borderColor: '#93c5fd',
          backgroundColor: 'rgba(147, 197, 253, 0.2)',
          fill: '-1',
          pointRadius: 3,
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } }
      },
      scales: {
        y: {
          min: 25.0,
          max: 31.5,
          title: { display: true, text: 'SST (°C)' },
          grid: { color: '#e2e8f0' }
        }
      }
    }
  });
}

// 3. MHW Annual Chart
function initMhwAnnualChart() {
  const ctx = document.getElementById('mhwAnnualChart');
  if (!ctx || !state.datasets.annual) return;

  const data = state.datasets.annual;
  const labels = data.map(d => d.year);
  const days = data.map(d => d.mhw_days);
  const events = data.map(d => d.mhw_events);

  state.charts.mhwAnnual = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total Hari MHW (Hari)',
          data: days,
          backgroundColor: labels.map(yr => yr === 2016 ? '#dc2626' : yr === 2010 ? '#ea580c' : '#f59e0b'),
          borderRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'Frekuensi Kejadian',
          data: events,
          type: 'line',
          borderColor: '#1e293b',
          backgroundColor: '#1e293b',
          pointRadius: 3,
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Total Hari MHW' },
          grid: { color: '#e2e8f0' }
        },
        y1: {
          position: 'right',
          beginAtZero: true,
          max: 6,
          title: { display: true, text: 'Jumlah Kejadian' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

// 4. Chlorophyll-a Seasonal Chart
function initChlaSeasonalChart() {
  const ctx = document.getElementById('chlaSeasonalChart');
  if (!ctx || !state.datasets.monthly_clim) return;

  const data = state.datasets.monthly_clim;
  const labels = data.map(d => d.name);
  const chlaVals = data.map(d => d.chla_mean);

  state.charts.chlaSeasonal = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Konsentrasi Klorofil-a (mg/m³)',
          data: chlaVals,
          backgroundColor: labels.map((_, i) => (i >= 6 && i <= 8) ? '#0d9488' : '#14b8a6'),
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 0.5,
          title: { display: true, text: 'Chlorophyll-a (mg/m³)' },
          grid: { color: '#e2e8f0' }
        }
      }
    }
  });
}

// 5. Fisheries Production Chart
function initFisheriesChart() {
  const ctx = document.getElementById('fisheriesChart');
  if (!ctx || !state.datasets.annual) return;

  const data = state.datasets.annual;
  const labels = data.map(d => d.year);
  const catchTons = data.map(d => d.catch_tons);
  const mhwDays = data.map(d => d.mhw_days);

  state.charts.fisheries = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Produksi Ikan Laut NTT (Ton)',
          data: catchTons,
          backgroundColor: '#0284c7',
          borderRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'Hari MHW Tahunan',
          data: mhwDays,
          type: 'line',
          borderColor: '#f97316',
          backgroundColor: '#f97316',
          pointRadius: 4,
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 60000,
          title: { display: true, text: 'Produksi Ikan (Ton)' },
          grid: { color: '#e2e8f0' }
        },
        y1: {
          position: 'right',
          beginAtZero: true,
          title: { display: true, text: 'Hari MHW' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

// -----------------------------------------------------------------------------
// DYNAMIC TABLES & UI POPULATION
// -----------------------------------------------------------------------------

// Populate MHW 43 Events Table
function populateMhwTable() {
  const tbody = document.getElementById('mhw-table-body');
  const countEl = document.getElementById('mhw-table-count');
  const searchInput = document.getElementById('mhw-search-input');
  const categoryFilter = document.getElementById('mhw-category-filter');
  const exportBtn = document.getElementById('export-mhw-csv-btn');

  if (!tbody || !state.datasets.mhw_events) return;

  const events = state.datasets.mhw_events;

  function renderRows(filteredList) {
    tbody.innerHTML = '';
    filteredList.forEach(ev => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition cursor-pointer';

      let catBadge = 'bg-yellow-50 text-yellow-800 border-yellow-200';
      if (ev.category.includes('Kuat') && !ev.category.includes('Sangat')) catBadge = 'bg-orange-50 text-orange-800 border-orange-200';
      if (ev.category.includes('Sangat Kuat')) catBadge = 'bg-rose-50 text-rose-800 border-rose-200';

      tr.innerHTML = `
        <td class="p-2.5 font-bold text-slate-900">#${ev.event_id}</td>
        <td class="p-2.5 text-slate-700">${ev.start_date}</td>
        <td class="p-2.5 text-slate-700">${ev.end_date}</td>
        <td class="p-2.5 text-slate-500">${ev.peak_date || '-'}</td>
        <td class="p-2.5 text-right font-bold text-brand-700">${ev.duration}</td>
        <td class="p-2.5 text-right text-rose-600 font-semibold">${ev.i_max.toFixed(2)}</td>
        <td class="p-2.5 text-right text-slate-700">${ev.i_mean.toFixed(2)}</td>
        <td class="p-2.5 text-right text-slate-700">${ev.i_cum.toFixed(2)}</td>
        <td class="p-2.5">
          <span class="px-2 py-0.5 text-[10px] rounded-full border font-sans font-medium ${catBadge}">${ev.category}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (countEl) countEl.textContent = `Menampilkan ${filteredList.length} dari 43 kejadian`;
  }

  function applyFilter() {
    const q = (searchInput?.value || '').toLowerCase();
    const cat = categoryFilter?.value || 'all';

    const filtered = events.filter(ev => {
      const matchQ = ev.event_id.toString().includes(q) || ev.start_date.includes(q) || ev.end_date.includes(q);
      const matchCat = cat === 'all' || ev.category.includes(cat);
      return matchQ && matchCat;
    });

    renderRows(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', applyFilter);
  if (categoryFilter) categoryFilter.addEventListener('change', applyFilter);

  // Initial render
  renderRows(events);

  // Export CSV
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      let csv = 'event_id,start_date,end_date,peak_date,duration_days,i_max,i_mean,i_cum,category\n';
      events.forEach(ev => {
        csv += `${ev.event_id},${ev.start_date},${ev.end_date},${ev.peak_date || ''},${ev.duration},${ev.i_max},${ev.i_mean},${ev.i_cum},"${ev.category}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ntt_mhw_events_2000_2020.csv';
      a.click();
    });
  }
}

// Populate Species Thermal Cards
function populateSpeciesCards() {
  const container = document.getElementById('species-cards-container');
  if (!container || !state.datasets.fisheries) return;

  const species = state.datasets.fisheries.species_thermal;
  container.innerHTML = '';

  species.forEach(sp => {
    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 card-hover';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-sm text-slate-900">${sp.species}</h4>
        <span class="text-[10px] font-mono bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded">${sp.habitat}</span>
      </div>
      <div class="text-[11px] italic text-slate-500 font-serif">${sp.latin}</div>
      <div class="space-y-1 text-xs pt-1 border-t border-slate-100">
        <div class="flex justify-between">
          <span class="text-slate-500">Optimum Termal:</span>
          <span class="font-bold text-emerald-600">${sp.optimum_temp}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Batas Kritis:</span>
          <span class="font-bold text-rose-600">${sp.critical_temp}</span>
        </div>
      </div>
      <p class="text-[11px] text-slate-600 leading-tight pt-1">
        <span class="font-semibold text-slate-700">Respon MHW:</span> ${sp.behavior_at_mhw}
      </p>
    `;
    container.appendChild(card);
  });
}

// Populate Synthesis Findings Table
function populateSynthesisFindings() {
  const tbody = document.getElementById('synthesis-findings-body');
  if (!tbody || !state.datasets.synthesis) return;

  const findings = state.datasets.synthesis.summary_findings;
  tbody.innerHTML = '';

  findings.forEach(f => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition';
    tr.innerHTML = `
      <td class="p-2.5 font-bold text-slate-900 whitespace-nowrap">${f.Komponen || f.komponen}</td>
      <td class="p-2.5 text-slate-800 font-medium">${f['Temuan Kunci'] || f.temuan_kunci}</td>
      <td class="p-2.5 font-mono text-brand-700 whitespace-nowrap">${f['Besaran / Metrik Kuantitatif'] || f.metrik_kuantitatif || '-'}</td>
      <td class="p-2.5 text-slate-600">${f['Keterangan'] || f.keterangan || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Populate PRD Compliance Table
function populatePrdCompliance() {
  const tbody = document.getElementById('prd-compliance-body');
  if (!tbody || !state.datasets.synthesis) return;

  const rules = state.datasets.synthesis.prd_compliance;
  tbody.innerHTML = '';

  rules.forEach(r => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition';
    tr.innerHTML = `
      <td class="p-2.5 font-bold text-slate-900">${r.rule}</td>
      <td class="p-2.5 whitespace-nowrap">
        <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          ${r.status}
        </span>
      </td>
      <td class="p-2.5 text-slate-600">${r.detail}</td>
    `;
    tbody.appendChild(tr);
  });
}

// High-Res Figure Modal Viewer
function setupModalViewer() {
  const modal = document.getElementById('figure-modal');
  const modalImg = document.getElementById('modal-figure-img');
  const modalTitle = document.getElementById('modal-figure-title');
  const modalDownload = document.getElementById('modal-figure-download');
  const closeBtn = document.getElementById('modal-close-btn');

  document.querySelectorAll('.figure-thumbnail').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src = thumb.dataset.src;
      const title = thumb.dataset.title;

      modalImg.src = src;
      modalTitle.textContent = title;
      modalDownload.href = src;
      modal.classList.remove('hidden');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
}

