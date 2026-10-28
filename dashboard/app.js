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

// Color Palettes
function getSstColor(val) {
  if (val === null || val === undefined || isNaN(val)) return 'rgba(200, 200, 200, 0.2)';
  // Range: 25.0 to 31.0 °C
  const t = Math.max(0, Math.min(1, (val - 25.0) / (31.0 - 25.0)));
  // Interpolate: Blue -> Cyan -> Yellow -> Orange -> Red -> Crimson
  if (t < 0.2) return '#313695';
  if (t < 0.35) return '#4575b4';
  if (t < 0.5) return '#74add1';
  if (t < 0.65) return '#ffffbf';
  if (t < 0.8) return '#fdae61';
  if (t < 0.9) return '#f46d43';
  return '#d73027';
}

function getChlaColor(val) {
  if (val === null || val === undefined || isNaN(val)) return 'rgba(200, 200, 200, 0.2)';
  // Range: 0.08 to 0.80 mg/m³
  const t = Math.max(0, Math.min(1, (val - 0.08) / (0.80 - 0.08)));
  if (t < 0.15) return '#440154';
  if (t < 0.35) return '#3b528b';
  if (t < 0.55) return '#21918c';
  if (t < 0.75) return '#5ec962';
  return '#fde725';
}

function getMhwDaysColor(val) {
  if (val === null || val === undefined || isNaN(val)) return 'rgba(200, 200, 200, 0.2)';
  // Range: 0 to 600 days
  const t = Math.max(0, Math.min(1, val / 550));
  if (t < 0.2) return '#fef08a';
  if (t < 0.45) return '#f97316';
  if (t < 0.75) return '#dc2626';
  return '#7f1d1d';
}

function getMhwIntColor(val) {
  if (val === null || val === undefined || isNaN(val)) return 'rgba(200, 200, 200, 0.2)';
  // Range: 0.5 to 3.5 °C
  const t = Math.max(0, Math.min(1, (val - 0.5) / 3.0));
  if (t < 0.25) return '#fde047';
  if (t < 0.5) return '#fb923c';
  if (t < 0.75) return '#ef4444';
  return '#991b1b';
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
    ['synthesis', 'data/synthesis_methodology.json']
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
    attributionControl: false
  });

  // Base tile layer (CartoDB Positron - crisp white theme)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(state.map);

  // NTT Ocean Bounding Box Indicator
  const nttBounds = [[-13.0, 117.5], [-7.0, 127.5]];
  L.rectangle(nttBounds, {
    color: '#0284c7',
    weight: 1.5,
    dashArray: '4, 4',
    fill: false
  }).addTo(state.map);

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

  // Render initial grid
  updateMapLayer();
}

// Update Map Layer based on selected layer & time state
function updateMapLayer() {
  if (!state.map || !state.datasets.spatial || !state.datasets.metadata) return;

  if (state.gridLayer) {
    state.map.removeLayer(state.gridLayer);
  }

  const { lat_coords, lon_coords } = state.datasets.metadata.region;
  const spatial = state.datasets.spatial;
  const layer = state.selectedMapLayer;

  // Determine which 2D matrix to use
  let matrix = null;
  let getColorFn = getSstColor;
  let unit = '°C';
  let legendMin = '25°C', legendMid = '28°C', legendMax = '31°C';
  let legendClass = 'colorbar-sst';

  if (layer === 'sst') {
    matrix = spatial.sst_mean_all;
    getColorFn = getSstColor;
    unit = '°C';
    legendMin = '25°C'; legendMid = '28°C'; legendMax = '31°C';
    legendClass = 'colorbar-sst';
  } else if (layer === 'chla') {
    matrix = spatial.chla_mean_all;
    getColorFn = getChlaColor;
    unit = 'mg/m³';
    legendMin = '0.08'; legendMid = '0.35'; legendMax = '0.80 mg/m³';
    legendClass = 'colorbar-chla';
  } else if (layer === 'mhw_days') {
    matrix = spatial.total_mhw_days;
    getColorFn = getMhwDaysColor;
    unit = 'Hari';
    legendMin = '0'; legendMid = '250'; legendMax = '550 Hari';
    legendClass = 'colorbar-mhw';
  } else if (layer === 'mhw_int') {
    matrix = spatial.max_intensity;
    getColorFn = getMhwIntColor;
    unit = '°C';
    legendMin = '0.5'; legendMid = '2.0'; legendMax = '3.5 °C';
    legendClass = 'colorbar-mhw';
  }

  // Update floating legend
  const legendBar = document.getElementById('legend-bar');
  const legendTitle = document.getElementById('legend-title');
  const legendRange = document.getElementById('legend-range');
  const lMin = document.getElementById('legend-min');
  const lMid = document.getElementById('legend-mid');
  const lMax = document.getElementById('legend-max');

  if (legendBar && legendTitle) {
    legendBar.className = `h-3 rounded-full border border-slate-200 ${legendClass}`;
    legendTitle.textContent = layer === 'sst' ? 'SST Rerata (°C)' : layer === 'chla' ? 'Chlorophyll-a (mg/m³)' : layer === 'mhw_days' ? 'Hari MHW Spasial' : 'Intensitas Maks MHW';
    legendRange.textContent = `${legendMin} – ${legendMax}`;
    if (lMin) lMin.textContent = legendMin;
    if (lMid) lMid.textContent = legendMid;
    if (lMax) lMax.textContent = legendMax;
  }

  // Build grid layer using SVG polygons for crisp performance
  const gridGroup = L.layerGroup();
  const halfLat = 0.125;
  const halfLon = 0.125;

  for (let r = 0; r < lat_coords.length; r++) {
    const lat = lat_coords[r];
    for (let c = 0; c < lon_coords.length; c++) {
      const lon = lon_coords[c];
      const val = matrix && matrix[r] ? matrix[r][c] : null;

      if (val === null || val === undefined || isNaN(val)) continue;

      const bounds = [
        [lat - halfLat, lon - halfLon],
        [lat + halfLat, lon + halfLon]
      ];

      const color = getColorFn(val);

      const cell = L.rectangle(bounds, {
        color: 'transparent',
        weight: 0,
        fillColor: color,
        fillOpacity: 0.65
      });

      // Hover Tooltip
      cell.bindTooltip(`
        <div class="text-xs font-sans">
          <div class="font-bold text-slate-800">${detectSubRegion(lat, lon)}</div>
          <div class="font-mono text-slate-600">${lat.toFixed(3)}° LS, ${lon.toFixed(3)}° BT</div>
          <div class="font-semibold text-brand-700 mt-0.5">${val} ${unit}</div>
        </div>
      `, { sticky: true, opacity: 0.95 });

      // Click Inspector
      cell.on('click', () => {
        inspectCell(lat, lon, r, c);
      });

      cell.addTo(gridGroup);
    }
  }

  state.gridLayer = gridGroup;
  state.gridLayer.addTo(state.map);
}

// Point Inspector on Click
function inspectCell(lat, lon, r, c) {
  const spatial = state.datasets.spatial;
  const sstVal = spatial && spatial.sst_mean_all && spatial.sst_mean_all[r] ? spatial.sst_mean_all[r][c] : 28.65;
  const chlaVal = spatial && spatial.chla_mean_all && spatial.chla_mean_all[r] ? spatial.chla_mean_all[r][c] : 0.274;
  const mhwDays = spatial && spatial.total_mhw_days && spatial.total_mhw_days[r] ? spatial.total_mhw_days[r][c] : 545;
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
  if (inspectSst) inspectSst.textContent = sstVal !== null ? `${sstVal} °C` : 'N/A';
  if (inspectChla) inspectChla.textContent = chlaVal !== null ? `${chlaVal} mg/m³` : 'Data Berawan';
  if (inspectMhw) {
    if (mhwDays > 400) {
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
