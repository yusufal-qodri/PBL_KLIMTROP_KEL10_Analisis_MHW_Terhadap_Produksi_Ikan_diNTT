'use strict';
/* NTT Marine Insight - app.js (revisi) : router, peta halus berbasis canvas, data pack harian opsional */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const S = { D: {}, pack: null, page: 'beranda', st: {}, charts: [], cache: {} };
const MON = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const MONF = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const SEAS = [
  { k: 'DJF', n: 'Monsun Barat', per: 'Des–Feb', m: [12,1,2] },
  { k: 'MAM', n: 'Peralihan I', per: 'Mar–Mei', m: [3,4,5] },
  { k: 'JJA', n: 'Monsun Timur / Upwelling', per: 'Jun–Agu', m: [6,7,8] },
  { k: 'SON', n: 'Peralihan II', per: 'Sep–Nov', m: [9,10,11] }
];
const START = '2000-01-01', END = '2020-12-31';
const fmt = (x, d = 2) => (x == null || Number.isNaN(x)) ? '—' : Number(x).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const dstr = d => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = pd(s); d.setUTCDate(d.getUTCDate() + n); return dstr(d); };
const diffDays = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
const clampDate = s => s < START ? START : (s > END ? END : s);
const doy = s => diffDays(s.slice(0, 4) + '-01-01', s) + 1;
const shiftYears = (s, n) => { const d = pd(s); d.setUTCFullYear(d.getUTCFullYear() + n); return dstr(d); };
const fdate = s => { const d = pd(s); return `${String(d.getUTCDate()).padStart(2, '0')} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
function frange(a, b) {
  if (a === b) return fdate(a);
  const A = pd(a), B = pd(b), dd = x => String(x.getUTCDate()).padStart(2, '0');
  if (A.getUTCFullYear() === B.getUTCFullYear() && A.getUTCMonth() === B.getUTCMonth()) return `${dd(A)}–${dd(B)} ${MON[A.getUTCMonth()]} ${A.getUTCFullYear()}`;
  if (A.getUTCFullYear() === B.getUTCFullYear()) return `${dd(A)} ${MON[A.getUTCMonth()]} – ${dd(B)} ${MON[B.getUTCMonth()]} ${A.getUTCFullYear()}`;
  return `${fdate(a)} – ${fdate(b)}`;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mean = a => { a = a.filter(v => v != null && !Number.isNaN(v)); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; };
function qtile(sorted, q) { if (!sorted.length) return null; const p = (sorted.length - 1) * q, i = Math.floor(p), f = p - i; return sorted[i] + (sorted[Math.min(i + 1, sorted.length - 1)] - sorted[i]) * f; }
function vstats(vals) {
  const a = vals.filter(v => v != null && !Number.isNaN(v)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.reduce((x, y) => x + y, 0) / a.length, sd = Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
  return { n: a.length, mean: m, median: qtile(a, .5), min: a[0], max: a[a.length - 1], std: sd, p10: qtile(a, .1), p90: qtile(a, .9) };
}
const gridVals = g => (g || []).flat().filter(v => v != null && !Number.isNaN(v));
const stOf = page => (S.st[page] = S.st[page] || {});

/* ---------- warna ---------- */
const CMAPS = {
  viridis: ['#440154','#482878','#3E4A89','#31688E','#26828E','#1F9E89','#35B779','#6DCD59','#B4DE2C','#FDE725'],
  ylorrd: ['#FFFFCC','#FFEDA0','#FED976','#FEB24C','#FD8D3C','#FC4E2A','#E31A1C','#BD0026','#800026'],
  rdylbu: ['#313695','#4575B4','#74ADD1','#ABD9E9','#E0F3F8','#FFFFBF','#FEE090','#FDAE61','#F46D43','#D73027','#A50026'],
  brbg: ['#543005','#8C510A','#BF812D','#DFC27D','#F6E8C3','#F5F5F5','#C7EAE5','#80CDC1','#35978F','#01665E','#003C30']
};
const LUT = {};
function lut(name) {
  if (LUT[name]) return LUT[name];
  const st = CMAPS[name].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))), out = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255 * (st.length - 1), k = Math.min(Math.floor(t), st.length - 2), f = t - k;
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(st[k][c] + (st[k + 1][c] - st[k][c]) * f);
  }
  return (LUT[name] = out);
}
const cssGrad = name => { const L = lut(name); return 'linear-gradient(90deg,' + Array.from({ length: 12 }, (_, i) => { const j = Math.round(i / 11 * 255); return `rgb(${L[j * 3]},${L[j * 3 + 1]},${L[j * 3 + 2]})`; }).join(',') + ')'; };
function rangeOf(grid, log, sym) {
  const a = gridVals(grid).sort((x, y) => x - y);
  if (!a.length) return [0, 1];
  let lo = qtile(a, .02), hi = qtile(a, .98);
  if (sym) { const m = Math.max(Math.abs(lo), Math.abs(hi)) || 1; return [-m, m]; }
  if (log) lo = Math.max(lo, 0.03);
  if (hi <= lo) hi = lo + 1e-6;
  return [lo, hi];
}
function legendHTML(def) {
  const f = v => fmt(v, def.dec ?? (Math.abs(def.max) < 1 ? 3 : 2));
  return `<div class="legend"><div class="bar" style="background:${cssGrad(def.cmap)}"></div><div class="t"><span>${f(def.min)}</span><span>${f(def.max)} ${def.unit || ''}${def.log ? ' · skala log' : ''}</span></div></div>`;
}

/* ---------- data ---------- */
async function loadDatasets() {
  const files = [['meta','metadata'],['annual','annual_summary'],['events','mhw_events'],['doy','climatology_doy'],['monthly','monthly_climatology'],['grids','spatial_grids'],['series','daily_regional_series'],['chl','chla_analysis'],['fish','fisheries_data'],['syn','synthesis_methodology'],['coast','ntt_coastline']];
  await Promise.all(files.map(async ([k, f]) => {
    try { const r = await fetch(`data/${f}.${f === 'ntt_coastline' ? 'geojson' : 'json'}`); S.D[k] = JSON.parse((await r.text()).replace(/\bNaN\b/g, 'null')); }
    catch (e) { console.error('Gagal memuat', f, e); }
  }));
  S.ds = S.D.series || [];
  S.events = (S.D.events || []).slice().sort((a, b) => a.event_id - b.event_id);
  const g = S.D.grids;
  if (g) S.landCell = g.sst_mean_all.map(r => r.map(v => v == null));
  try {
    const r = await fetch('data/grids/manifest.json');
    if (r.ok) { S.pack = await r.json(); S.pack.files = {}; }
  } catch (e) { /* mode terbatas */ }
}
const meta = () => S.D.meta;
const LAT0 = -12.875, LON0 = 117.625, STEP = 0.25, NR = 24, NC = 40;
const dsAt = d => S.ds[diffDays(START, d)];
function seriesRange(a, b) { a = clampDate(a); b = clampDate(b); const i = diffDays(START, a), j = diffDays(START, b); return S.ds.slice(i, j + 1); }
const sampleDay = date => { const sd = S.D.grids.sample_days; return Object.values(sd).find(x => x.date === date); };

/* ---------- data pack harian (opsional) ---------- */
async function packFile(path, Type) {
  const P = S.pack; if (!P) return null;
  if (!P.files[path]) P.files[path] = fetch(`data/grids/${path}`).then(r => { if (!r.ok) throw new Error(path); return r.arrayBuffer(); }).then(b => new Type(b));
  return P.files[path];
}
const packYear = async (kind, y) => packFile(`${kind}/${y}.bin`, kind === 'mask' ? Uint8Array : Int16Array);
const NOD = -32768, CELLS = NR * NC;
const sc = kind => (S.pack.scale || { sst: 100, chla: 1000 })[kind];
async function winAgg(start, end, stats) {
  /* satu lintasan: SST, klorofil, anomali, intensitas MHW, hari MHW per sel */
  start = clampDate(start); end = clampDate(end);
  const o = { sstSum: new Float64Array(CELLS), sstN: new Uint16Array(CELLS), anSum: new Float64Array(CELLS), anN: new Uint16Array(CELLS), chSum: new Float64Array(CELLS), chN: new Uint16Array(CELLS), caSum: new Float64Array(CELLS), caN: new Uint16Array(CELLS), mhwMax: new Float32Array(CELLS).fill(-1), mhwDays: new Uint16Array(CELLS), nDays: 0 };
  const clim = await packFile('clim_doy.bin', Int16Array), base = await packFile('chla_base_doy.bin', Int16Array);
  const ys = [], y0 = +start.slice(0, 4), y1 = +end.slice(0, 4);
  for (let y = y0; y <= y1; y++) ys.push(y);
  const ssc = sc('sst'), csc = sc('chla');
  for (const y of ys) {
    const [sst, chl, msk] = await Promise.all([packYear('sst', y), packYear('chla', y), packYear('mask', y)]);
    const a = y === y0 ? start : `${y}-01-01`, b = y === y1 ? end : `${y}-12-31`;
    for (let d = a; d <= b; d = addDays(d, 1)) {
      const k = doy(d) - 1, off = k * CELLS; o.nDays++;
      for (let c = 0; c < CELLS; c++) {
        const s = sst[off + c], cl = clim[off + c];
        if (s !== NOD) { o.sstSum[c] += s / ssc; o.sstN[c]++; if (cl !== NOD) { const an = (s - cl) / ssc; o.anSum[c] += an; o.anN[c]++; if (msk[off + c] === 1) { o.mhwDays[c]++; if (an > o.mhwMax[c]) o.mhwMax[c] = an; } } }
        const h = chl[off + c];
        if (h !== NOD) { o.chSum[c] += h / csc; o.chN[c]++; const bb = base[off + c]; if (bb !== NOD) { o.caSum[c] += (h - bb) / csc; o.caN[c]++; } }
      }
    }
  }
  return o;
}
const toGrid = (arr, fn) => Array.from({ length: NR }, (_, r) => Array.from({ length: NC }, (_, c) => fn(r * NC + c)));
function aggGrid(o, what) {
  switch (what) {
    case 'sstMean': return toGrid(0, i => o.sstN[i] ? o.sstSum[i] / o.sstN[i] : null);
    case 'sstAnom': return toGrid(0, i => o.anN[i] ? o.anSum[i] / o.anN[i] : null);
    case 'mhwMax': return toGrid(0, i => o.mhwDays[i] ? o.mhwMax[i] : null);
    case 'mhwDays': return toGrid(0, i => S.landCell[Math.floor(i / NC)][i % NC] ? null : o.mhwDays[i]);
    case 'chlMean': return toGrid(0, i => o.chN[i] ? o.chSum[i] / o.chN[i] : null);
    case 'chlAnom': return toGrid(0, i => o.caN[i] ? o.caSum[i] / o.caN[i] : null);
  }
}
async function statGrid(kind, start, end, stat, filter) {
  /* statistik temporal per sel dari grid harian; filter(tanggal) opsional (mis. bulan/musim) */
  start = clampDate(start); end = clampDate(end);
  const y0 = +start.slice(0, 4), y1 = +end.slice(0, 4), scl = sc(kind), keep = stat === 'Median' ? Array.from({ length: CELLS }, () => []) : null;
  const sum = new Float64Array(CELLS), sq = new Float64Array(CELLS), n = new Uint16Array(CELLS), mx = new Float32Array(CELLS).fill(-1e9), mn = new Float32Array(CELLS).fill(1e9);
  for (let y = y0; y <= y1; y++) {
    const arr = await packYear(kind, y), a = y === y0 ? start : `${y}-01-01`, b = y === y1 ? end : `${y}-12-31`;
    for (let d = a; d <= b; d = addDays(d, 1)) {
      if (filter && !filter(d)) continue;
      const off = (doy(d) - 1) * CELLS;
      for (let c = 0; c < CELLS; c++) { const v = arr[off + c]; if (v === NOD) continue; const x = v / scl; n[c]++; sum[c] += x; sq[c] += x * x; if (x > mx[c]) mx[c] = x; if (x < mn[c]) mn[c] = x; if (keep) keep[c].push(x); }
    }
  }
  return toGrid(0, i => {
    if (!n[i]) return null;
    if (stat === 'Maksimum') return mx[i];
    if (stat === 'Minimum') return mn[i];
    if (stat === 'Simpangan baku') return Math.sqrt(Math.max(0, sq[i] / n[i] - (sum[i] / n[i]) ** 2));
    if (stat === 'Median') return qtile(keep[i].sort((p, q) => p - q), .5);
    return sum[i] / n[i];
  });
}

/* ---------- peta canvas ---------- */
const MAPG = { ML: 46, MT: 8, MR: 10, MB: 28, W: 800, H: 480, SC: 2 };
const LABELS = [['Sumba', 120.0, -9.75], ['Flores', 121.6, -8.55], ['Timor', 125.0, -9.7], ['Laut Sawu', 122.0, -9.95], ['Laut Flores', 120.4, -7.45]];
function gridAt(grid, lat, lon) {
  const c = Math.round((lon - LON0) / STEP), r = Math.round((lat - LAT0) / STEP);
  if (r < 0 || c < 0 || r >= NR || c >= NC) return { r, c, v: null };
  return { r, c, v: grid[r][c] };
}
function drawMap(canvas, grid, def, opts = {}) {
  const { ML, MT, MR, MB, W, H, SC } = MAPG, TW = ML + W + MR, TH = MT + H + MB;
  canvas.width = TW * SC; canvas.height = TH * SC;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.setTransform(SC, 0, 0, SC, 0, 0);
  ctx.fillStyle = '#EAF1F5'; ctx.fillRect(0, 0, TW, TH);
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const octx = off.getContext('2d');
  if (octx && octx.createImageData && grid) {
    const img = octx.createImageData(W, H), px = img.data, L = lut(def.cmap), lg = def.log;
    const lo = lg ? Math.log(def.min) : def.min, hi = lg ? Math.log(def.max) : def.max, span = hi - lo || 1;
    for (let y = 0; y < H; y++) {
      const lat = -7 - (y + .5) / H * 6, gy = (lat - LAT0) / STEP, j0 = Math.floor(gy), fy = gy - j0;
      for (let x = 0; x < W; x++) {
        const lon = 117.5 + (x + .5) / W * 10, gx = (lon - LON0) / STEP, i0 = Math.floor(gx), fx = gx - i0, p = (y * W + x) * 4;
        let sw = 0, sv = 0;
        for (let dj = 0; dj < 2; dj++) for (let di = 0; di < 2; di++) {
          const r = Math.min(NR - 1, Math.max(0, j0 + dj)), c = Math.min(NC - 1, Math.max(0, i0 + di)), v = grid[r][c];
          if (v == null || Number.isNaN(v)) continue;
          const w = (di ? fx : 1 - fx) * (dj ? fy : 1 - fy); sw += w; sv += w * v;
        }
        const nr = Math.min(NR - 1, Math.max(0, Math.round(gy))), nc = Math.min(NC - 1, Math.max(0, Math.round(gx)));
        const nearNull = grid[nr][nc] == null || Number.isNaN(grid[nr][nc]);
        if (nearNull && !S.landCell[nr][nc]) { const hv = ((x + y) % 12) < 3; px[p] = hv ? 174 : 227; px[p + 1] = hv ? 183 : 231; px[p + 2] = hv ? 190 : 234; px[p + 3] = 255; continue; }
        if (sw < 1e-6) { px[p + 3] = 0; continue; }
        let v = sv / sw; if (lg) v = Math.log(Math.max(v, def.min));
        const t = Math.min(1, Math.max(0, (v - lo) / span)), k = Math.round(t * 255) * 3;
        px[p] = L[k]; px[p + 1] = L[k + 1]; px[p + 2] = L[k + 2]; px[p + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(off, ML, MT, W, H);
  }
  const X = lon => ML + (lon - 117.5) / 10 * W, Y = lat => MT + (-7 - lat) / 6 * H;
  ctx.save(); ctx.beginPath(); ctx.rect(ML, MT, W, H); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = .6;
  for (const lo of [118, 120, 122, 124, 126]) { ctx.beginPath(); ctx.moveTo(X(lo), MT); ctx.lineTo(X(lo), MT + H); ctx.stroke(); }
  for (const la of [-8, -9, -10, -11, -12]) { ctx.beginPath(); ctx.moveTo(ML, Y(la)); ctx.lineTo(ML + W, Y(la)); ctx.stroke(); }
  const feats = (S.D.coast && S.D.coast.features) || [];
  ctx.fillStyle = '#E6E6E6'; ctx.strokeStyle = '#444'; ctx.lineWidth = .8; ctx.lineJoin = 'round';
  for (const f of feats) {
    const g = f.geometry, polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    for (const poly of polys) { ctx.beginPath(); for (const ring of poly) { ring.forEach(([lo, la], i) => i ? ctx.lineTo(X(lo), Y(la)) : ctx.moveTo(X(lo), Y(la))); ctx.closePath(); } ctx.fill('evenodd'); ctx.stroke(); }
  }
  ctx.fillStyle = '#2B2B2B'; ctx.font = '600 11px system-ui,sans-serif'; ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  for (const [t, lo, la] of LABELS) {
    const sea = t.startsWith('Laut'); ctx.font = (sea ? 'italic 11px' : '600 11px') + ' system-ui,sans-serif';
    if (sea) { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(11,37,54,.75)'; ctx.strokeText(t, X(lo), Y(la)); ctx.fillStyle = '#fff'; } else ctx.fillStyle = '#333';
    ctx.fillText(t, X(lo), Y(la));
  }
  ctx.restore();
  ctx.strokeStyle = '#8FA1AE'; ctx.lineWidth = 1; ctx.strokeRect(ML, MT, W, H);
  ctx.fillStyle = '#4A5D6B'; ctx.font = '11px system-ui,sans-serif';
  ctx.textAlign = 'center'; for (const lo of [118, 120, 122, 124, 126]) ctx.fillText(lo + '°BT', X(lo), MT + H + 17);
  ctx.textAlign = 'right'; for (const la of [-8, -9, -10, -11, -12]) ctx.fillText(-la + '°LS', ML - 5, Y(la) + 4);
  canvas._grid = grid; canvas._def = def; canvas._fmt = opts.fmt;
  if (!canvas._wired) {
    canvas._wired = true;
    canvas.addEventListener('click', e => {
      const b = canvas.getBoundingClientRect(), sx = TW / b.width, mx = (e.clientX - b.left) * sx, my = (e.clientY - b.top) * sx;
      const lon = 117.5 + (mx - ML) / W * 10, lat = -7 - (my - MT) / H * 6, out = canvas.parentElement.parentElement.querySelector('.inspect');
      if (!out || lon < 117.5 || lon > 127.5 || lat > -7 || lat < -13) return;
      const { r, c, v } = gridAt(canvas._grid, lat, lon), u = canvas._def.unit || '';
      const sub = typeof detectSubRegion === 'function' ? detectSubRegion(lat, lon) : '';
      out.textContent = `Sel ${fmt(Math.abs(LAT0 + r * STEP), 3)}°LS, ${fmt(LON0 + c * STEP, 3)}°BT${sub ? ' · ' + sub : ''}: ` + (v == null ? (S.landCell[r] && S.landCell[r][c] ? 'daratan / tanpa data laut' : 'tanpa data (tertutup awan, tidak diisi nol)') : `${fmt(v, canvas._def.dec ?? 3)} ${u}`);
    });
  }
}
function detectSubRegion(lat, lon) {
  if (lat > -8.6 && lon < 123.2) return 'Laut Flores / pesisir utara Flores';
  if (lon > 119 && lon < 123.2 && lat < -9.0 && lat > -11.2) return 'Selat Sumba – Laut Sawu';
  if (lon >= 123.2 && lat < -9.6) return 'Selatan Timor / Laut Timor';
  if (lon >= 123.2 && lat >= -9.6) return 'Selat Ombai / Alor';
  if (lat <= -11.2) return 'Samudra Hindia (selatan)';
  return '';
}
function mapCard(id, title, sub, extra = '') {
  return `<section class="card"><div class="card-h"><h2>${title}</h2><span>${sub || ''}</span></div><div class="mapwrap"><canvas id="${id}" aria-label="${esc(title)}"></canvas></div><div id="${id}-lg"></div><div class="inspect">Klik peta untuk membaca nilai sel.</div>${extra}</section>`;
}
function showMap(id, grid, def, opts) {
  const cv = $('#' + id); if (!cv) return;
  const parent = cv.parentElement;
  let nodataEl = parent.querySelector('.nodata');
  if (!grid || !gridVals(grid).length) {
    cv.style.display = 'none';
    const msg = (opts && opts.msg) || 'Data tidak tersedia untuk periode ini.';
    if (!nodataEl) {
      nodataEl = document.createElement('div');
      nodataEl.className = 'nodata';
      parent.appendChild(nodataEl);
    }
    nodataEl.textContent = msg;
    nodataEl.style.display = '';
    const lg = $('#' + id + '-lg'); if (lg) lg.innerHTML = '';
    return;
  }
  if (nodataEl) nodataEl.style.display = 'none';
  cv.style.display = '';
  drawMap(cv, grid, def, opts);
  const lg = $('#' + id + '-lg'); if (lg) lg.innerHTML = legendHTML(def);
}
const DEF = {
  sst: (g, fixed) => { const [a, b] = fixed || rangeOf(g); return { cmap: 'rdylbu', min: a, max: b, unit: '°C', dec: 2 }; },
  chl: g => { const [a, b] = rangeOf(g, true); return { cmap: 'viridis', min: a, max: b, log: true, unit: 'mg/m³', dec: 3 }; },
  sstAnom: g => { const [a, b] = rangeOf(g, false, true); return { cmap: 'rdylbu', min: a, max: b, unit: '°C', dec: 2 }; },
  chlAnom: g => { const [a, b] = rangeOf(g, false, true); return { cmap: 'brbg', min: a, max: b, unit: 'mg/m³', dec: 3 }; },
  mhw: g => { const a = gridVals(g); return { cmap: 'ylorrd', min: 0, max: Math.max(...a, 0.5), unit: '°C', dec: 2 }; },
  days: g => { const a = gridVals(g); return { cmap: 'ylorrd', min: 0, max: Math.max(...a, 1), unit: 'hari', dec: 0 }; }
};
/* ---------- UI helper ---------- */
const seg = (key, opts, act, dis = []) => `<div class="seg" role="group">${opts.map(o => `<button data-set="${key}" data-val="${esc(o)}" class="${String(o) === String(act) ? 'on' : ''}" ${dis.includes(o) ? 'disabled title="Butuh data pack harian (lihat catatan di atas)"' : ''}>${o}</button>`).join('')}</div>`;
const kpi = (l, v, s) => `<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${s || ''}</div></div>`;
const card = (t, sub, inner, id = '') => `<section class="card" ${id ? `id="${id}"` : ''}><div class="card-h"><h2>${t}</h2><span>${sub || ''}</span></div>${inner}</section>`;
const kv = rows => `<div class="kv">${rows.map(([a, b]) => `<div>${a}</div><div>${b}</div>`).join('')}</div>`;
const pill = t => `<span class="pill">${t}</span>`;
const lab = t => `<div class="lab">${t}</div>`;
function chart(id, cfg) {
  const el = $('#' + id); if (!el || typeof Chart === 'undefined') return null;
  cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: false }, cfg.options || {});
  const c = new Chart(el, cfg); S.charts.push(c); return c;
}
const chartBox = (id, cls = '') => `<div class="chart ${cls}"><canvas id="${id}"></canvas></div>`;
const COL = { teal: '#0A7C8C', red: '#B52A1B', orange: '#E8A27C', green: '#35978F', navy: '#13607A', grey: '#8FA1AE' };

/* ---------- kejadian MHW ---------- */
const evById = id => S.events.find(e => e.event_id === Number(id));
function sortEv(mode) {
  const a = S.events.slice();
  if (mode === 'Terlama') a.sort((x, y) => y.duration - x.duration || y.i_cum - x.i_cum);
  else if (mode === 'Terkuat') a.sort((x, y) => y.i_max - x.i_max);
  else a.sort((x, y) => y.start_date.localeCompare(x.start_date));
  return a;
}
const evChip = (e, on) => `<button class="ev ${on ? 'on' : ''}" data-set="ev" data-val="${e.event_id}"><div class="a">Event #${e.event_id} · ${e.category.split(' ')[0]}</div><div class="b">${e.duration} hari</div><div class="c">${frange(e.start_date, e.end_date)}</div></button>`;
function stripInner(page) {
  const st = stOf(page), q = (st.q || '').toLowerCase().trim();
  return sortEv(st.sort || 'Terlama').filter(e => !q || `#${e.event_id} ${e.event_id} ${e.year} ${e.start_date} ${e.end_date} ${e.category}`.toLowerCase().includes(q)).map(e => evChip(e, e.event_id === Number(st.ev))).join('') || '<div class="note">Tidak ada kejadian yang cocok.</div>';
}
function evStrip(page) {
  const st = stOf(page);
  return `<section class="card"><div class="card-h"><h2>Pilih kejadian MHW</h2><span>semua ${S.events.length} kejadian (2000–2020), geser ke samping</span></div>
  <div class="row" style="margin-bottom:10px;align-items:center"><input type="text" data-search aria-label="Cari kejadian" placeholder="Cari tahun atau nomor event" value="${esc(st.q || '')}" style="width:220px">${seg('sort', ['Terlama', 'Terkuat', 'Terbaru'], st.sort || 'Terlama')}</div>
  <div class="strip">${stripInner(page)}</div></section>`;
}
const evCache = {};
function evMetrics(ev) {
  if (evCache[ev.event_id]) return evCache[ev.event_id];
  const a = ev.start_date, b = ev.end_date, win = seriesRange(a, b);
  const m = { chl: mean(win.map(x => x.chla)), sst: mean(win.map(x => x.sst)), anom: mean(win.map(x => x.sst - x.clim)), n: win.length, chlN: win.filter(x => x.chla != null).length };
  const sy = +a.slice(0, 4), cands = [];
  for (let y = 2000; y <= 2020; y++) {
    const d = y - sy; if (d === 0) continue;
    const ws = shiftYears(a, d), we = shiftYears(b, d); if (ws < START || we > END) continue;
    const w = seriesRange(ws, we); if (w.length < win.length - 1 || w.some(x => x.is_mhw)) continue;
    if (w.filter(x => x.chla != null).length < w.length * .5) continue;
    cands.push({ year: y, start: ws, end: we, chl: mean(w.map(x => x.chla)), sst: mean(w.map(x => x.sst)), anom: mean(w.map(x => x.sst - x.clim)) });
  }
  m.cands = cands; m.base = mean(cands.map(c => c.chl)); m.baseSst = mean(cands.map(c => c.sst)); m.baseAnom = mean(cands.map(c => c.anom));
  m.delta = (m.chl != null && m.base != null) ? m.chl - m.base : null; m.pct = m.delta != null && m.base ? m.delta / m.base * 100 : null;
  return (evCache[ev.event_id] = m);
}
async function eventMaps(ev) {
  if (S.pack) { const o = await winAgg(ev.start_date, ev.end_date); return { mode: 'pack', mhw: aggGrid(o, 'mhwMax'), chl: aggGrid(o, 'chlAnom'), sstAnom: aggGrid(o, 'sstAnom') }; }
  const g = S.D.grids;
  for (const sd of Object.values(g.sample_days)) if (sd.date >= ev.start_date && sd.date <= ev.end_date) {
    const mo = +sd.date.slice(5, 7), cm = g.sst_monthly[mo], hm = g.chla_monthly[mo];
    return { mode: 'sample', date: sd.date, mhw: sd.sst.map((r, i) => r.map((v, j) => v == null || cm[i][j] == null ? null : v - cm[i][j])), chl: sd.chla.map((r, i) => r.map((v, j) => v == null || hm[i][j] == null ? null : v - hm[i][j])) };
  }
  return { mode: 'none' };
}
const NOPACK_MSG = 'Grid harian untuk periode ini belum dibuat. Jalankan tools/build_daily_grids.py (lihat catatan di atas) untuk mengaktifkan peta tiap kejadian.';
async function paintEventMaps(ev, idA, idB, subA, subB) {
  const r = await eventMaps(ev), per = frange(ev.start_date, ev.end_date);
  if (r.mode === 'pack') {
    showMap(idA, r.mhw, DEF.mhw(r.mhw), { msg: 'Tidak ada sel MHW pada periode ini.' });
    showMap(idB, r.chl, DEF.chlAnom(r.chl), { msg: 'Chlorophyll a tidak tersedia pada periode ini (awan/tanpa data).' });
    $(subA).textContent = `intensitas maks. per sel · ${per}`; $(subB).textContent = `anomali rata-rata vs baseline non-MHW · ${per}`;
  } else if (r.mode === 'sample') {
    showMap(idA, r.mhw, DEF.sstAnom(r.mhw)); showMap(idB, r.chl, DEF.chlAnom(r.chl));
    $(subA).textContent = `hari contoh ${fdate(r.date)} · anomali vs klimatologi bulanan`; $(subB).textContent = `hari contoh ${fdate(r.date)} · anomali vs klimatologi bulanan`;
  } else {
    showMap(idA, null, null, { msg: NOPACK_MSG }); showMap(idB, null, null, { msg: NOPACK_MSG });
    $(subA).textContent = per; $(subB).textContent = per;
  }
  return r;
}
function regionalEventChart(id, ev, pad = 30) {
  const a = addDays(ev.start_date, -pad), b = addDays(ev.end_date, pad), w = seriesRange(a, b);
  const lo = Math.floor(Math.min(...w.map(x => x.sst)) - .3), hi = Math.ceil(Math.max(...w.map(x => x.thresh)) + .3);
  chart(id, { data: { labels: w.map(x => x.date), datasets: [
    { type: 'bar', label: 'Periode MHW', data: w.map(x => x.is_mhw ? hi : null), backgroundColor: 'rgba(224,74,36,.16)', barPercentage: 1, categoryPercentage: 1, order: 9 },
    { type: 'line', label: 'SST regional', data: w.map(x => x.sst), borderColor: COL.red, pointRadius: 0, borderWidth: 2 },
    { type: 'line', label: 'Klimatologi', data: w.map(x => x.clim), borderColor: COL.teal, pointRadius: 0, borderWidth: 1.5 },
    { type: 'line', label: 'Ambang P90', data: w.map(x => x.thresh), borderColor: '#E04A24', borderDash: [5, 3], pointRadius: 0, borderWidth: 1.5 }] },
    options: { scales: { y: { min: lo, max: hi, title: { display: true, text: '°C' } }, x: { ticks: { maxTicksLimit: 8, callback(v) { return fdate(this.getLabelForValue(v)); } } } }, plugins: { legend: { position: 'bottom' } } } });
}

/* ---------- Beranda ---------- */
const P = {};
P.beranda = {
  title: 'Beranda', sub: 'Kejadian MHW terlama dan respon Chlorophyll a pada waktu yang sama · Perairan NTT',
  html() {
    const st = stOf('beranda'), top = sortEv('Terlama').slice(0, 5); if (!st.ev) st.ev = top[0].event_id;
    const ev = evById(st.ev), m = evMetrics(ev), k = meta().kpi;
    const cards = top.map((e, i) => `<button class="ev ${e.event_id === ev.event_id ? 'on' : ''}" data-set="ev" data-val="${e.event_id}"><div class="a">Peringkat ${i + 1} · Event #${e.event_id}</div><div class="b">${e.duration} hari</div><div class="c">${frange(e.start_date, e.end_date)}</div><div class="a">Intensitas maks. +${fmt(e.i_max)} °C · ${e.category}</div></button>`).join('');
    return `${card('5 kejadian MHW terlama', 'pilih salah satu · peta ikut berubah', `<div class="top5">${cards}</div>`)}
    <div class="note">${pill('Event #' + ev.event_id + ' · ' + frange(ev.start_date, ev.end_date) + ' · puncak ' + fdate(ev.peak_date))} Kedua peta memakai periode yang sama dengan kejadian terpilih.</div>
    <div class="grid2">${mapCard('b-mhw', 'Peta MHW', '<span id="b-mhw-sub"></span>')}${mapCard('b-chl', 'Peta Chlorophyll a', '<span id="b-chl-sub"></span>')}</div>
    <div class="kpis">${kpi('Durasi', ev.duration + ' hari', frange(ev.start_date, ev.end_date))}${kpi('Intensitas maksimum', '+' + fmt(ev.i_max) + ' °C', 'Kategori ' + ev.category)}${kpi('Intensitas kumulatif', fmt(ev.i_cum, 1) + ' °C·hari', 'rata-rata +' + fmt(ev.i_mean) + ' °C')}${kpi('Chlorophyll a saat event', m.chl != null ? fmt(m.chl, 3) + ' mg/m³' : '—', m.base != null ? `tahun tanpa MHW (tanggal sama): ${fmt(m.base, 3)} (${m.pct >= 0 ? '+' : ''}${fmt(m.pct, 1)}%)` : 'tidak ada tahun pembanding')}</div>
    ${card('SST regional dan ambang MHW', 'event terpilih ±30 hari · rata-rata regional NTT', chartBox('b-chart'))}
    <div class="note">Seluruh MHW 2000–2020: ${S.events.length} kejadian, ${S.events.reduce((s, e) => s + e.duration, 0)} hari MHW. Filter waktu (harian–dekadal) ada di menu Sebaran Data. Klik sel peta untuk membaca nilainya.</div>`;
  },
  async mount() {
    const ev = evById(stOf('beranda').ev);
    $('#b-mhw').closest('.card').querySelector('h2').textContent = 'Peta MHW terkuat';
    $('#b-chl').closest('.card').querySelector('h2').textContent = 'Peta Chlorophyll a (anomali)';
    regionalEventChart('b-chart', ev);
    await paintEventMaps(ev, 'b-mhw', 'b-chl', '#b-mhw-sub', '#b-chl-sub');
  }
};

/* ---------- Sebaran Data ---------- */
const STATS = ['Rata-rata', 'Maksimum', 'Minimum', 'Median', 'Simpangan baku'];
function rangeFor(scale, d) {
  const y = +d.slice(0, 4), mo = +d.slice(5, 7);
  if (scale === 'Harian') return [d, d];
  if (scale === 'Mingguan') return [d, clampDate(addDays(d, 6))];
  if (scale === 'Bulanan') return [`${d.slice(0, 7)}-01`, dstr(new Date(Date.UTC(y, mo, 0)))];
  if (scale === 'Tahunan') return [`${y}-01-01`, `${y}-12-31`];
  return y < 2010 ? ['2000-01-01', '2009-12-31'] : y < 2020 ? ['2010-01-01', '2019-12-31'] : ['2020-01-01', '2020-12-31'];
}
const SCALES = ['Harian', 'Mingguan', 'Bulanan', 'Tahunan', 'Dekadal'];
function stepDate(scale, d, dir) {
  const [a, b] = rangeFor(scale, d);
  if (scale === 'Harian') return clampDate(addDays(d, dir));
  if (scale === 'Mingguan') return clampDate(addDays(d, 7 * dir));
  return clampDate(dir > 0 ? addDays(b, 1) : addDays(a, -1));
}
function sebaranFallback(scale, d) {
  const g = S.D.grids, y = d.slice(0, 4), mo = +d.slice(5, 7);
  if (scale === 'Tahunan') return { sst: g.sst_annual[y], chl: g.chla_annual[y], note: `rata-rata tahunan ${y}` };
  if (scale === 'Bulanan') return { sst: g.sst_monthly[mo], chl: g.chla_monthly[mo], note: `klimatologi bulan ${MONF[mo - 1]} (rata-rata semua tahun 2000–2020), bukan bulan kalender tertentu` };
  if (scale === 'Dekadal') { const y1 = +y, k = y1 < 2010 ? '2000_2009' : y1 < 2020 ? '2010_2019' : '2020'; return { sst: g.sst_decadal[k], chl: g.chla_decadal[k], note: `rata-rata ${k.replace('_', '–')}` }; }
  const sd = sampleDay(d); if (scale === 'Harian' && sd) return { sst: sd.sst, chl: sd.chla, note: sd.desc };
  return null;
}
function histConfig(vals, color, unit, bins = 14) {
  const a = vals.filter(v => v != null), lo = Math.min(...a), hi = Math.max(...a), w = (hi - lo) / bins || 1, c = new Array(bins).fill(0);
  a.forEach(v => c[Math.min(bins - 1, Math.floor((v - lo) / w))]++);
  return { type: 'bar', data: { labels: c.map((_, i) => fmt(lo + w * (i + .5), hi < 5 ? 2 : 1)), datasets: [{ data: c, backgroundColor: color }] }, options: { plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: 'jumlah sel' } }, x: { title: { display: true, text: unit } } } } };
}
const statKV = (s, u, d = 2) => s ? kv([['Rata-rata', `${fmt(s.mean, d)} ${u}`], ['Median', `${fmt(s.median, d)} ${u}`], ['Minimum', `${fmt(s.min, d)} ${u}`], ['Maksimum', `${fmt(s.max, d)} ${u}`], ['Simpangan baku', `${fmt(s.std, d)} ${u}`], ['Persentil 10 / 90', `${fmt(s.p10, d)} / ${fmt(s.p90, d)}`], ['Jumlah sel valid', s.n]]) : '<div class="note">Tidak ada sel valid.</div>';
P.sebaran = {
  title: 'Sebaran Data Mentah', sub: 'Pilih skala waktu dan statistik, lihat peta SST dan Chlorophyll a beserta sebaran nilainya',
  html() {
    const st = stOf('sebaran'); st.scale = st.scale || 'Harian'; st.stat = st.stat || 'Rata-rata'; st.date = st.date || (S.pack ? '2000-01-01' : '2016-06-25');
    const [a, b] = rangeFor(st.scale, st.date), n = diffDays(a, b) + 1;
    const modes = SCALES.map(s => { const [x, y] = rangeFor(s, st.date); return `<div class="mode ${s === st.scale ? 'on' : ''}"><div class="a">${s}</div><div class="b">${s === 'Dekadal' ? x.slice(0, 4) + '–' + y.slice(0, 4) : s === 'Tahunan' ? x.slice(0, 4) : s === 'Bulanan' ? MONF[+x.slice(5, 7) - 1] + ' ' + x.slice(0, 4) : frange(x, y)}</div><div class="a">${diffDays(x, y) + 1} hari data</div></div>`; }).join('');
    const dis = S.pack ? [] : STATS.slice(1);
    const samples = S.pack ? '' : `<div class="note">Mode terbatas — tanggal contoh yang tersedia: ${Object.values(S.D.grids.sample_days).map(x => `<button class="btn" data-set="date" data-val="${x.date}" data-force-scale="Harian">${fdate(x.date)}</button>`).join(' ')}</div>`;
    return `<section class="card"><div class="row"><div>${lab('Skala waktu')}${seg('scale', SCALES, st.scale)}</div><div>${lab('Statistik agregasi')}${seg('stat', STATS, st.stat, dis)}</div>
      <div>${lab('Tanggal acuan')}<div class="row" style="gap:6px"><button class="btn" aria-label="Periode sebelumnya" data-set="date" data-val="${stepDate(st.scale, st.date, -1)}">‹</button><input type="date" data-in="date" min="${START}" max="${END}" value="${st.date}"><button class="btn" aria-label="Periode berikutnya" data-set="date" data-val="${stepDate(st.scale, st.date, 1)}">›</button></div></div></div>
      <div style="margin-top:12px">${lab('Rentang waktu yang dipakai untuk tiap skala (dari tanggal acuan)')}<div class="modes">${modes}</div></div>
      <div style="margin-top:12px;font-size:13px">Ditampilkan: ${pill(st.stat + ' ' + st.scale.toLowerCase())} ${pill(frange(a, b))} <span class="note">Piksel Chlorophyll a tertutup awan tidak dihitung (tidak diganti nol).</span></div>${samples}</section>
      <div class="grid2">${mapCard('s-sst', 'SST', '<span id="s-sst-sub"></span>')}${mapCard('s-chl', 'Chlorophyll a', '<span id="s-chl-sub"></span>')}</div>
      <div class="grid2"><section class="card"><div class="card-h"><h2>Statistik SST</h2><span id="s-sst-n"></span></div><div id="s-sst-kv"></div>${chartBox('s-sst-h', 's')}</section><section class="card"><div class="card-h"><h2>Statistik Chlorophyll a</h2><span id="s-chl-n"></span></div><div id="s-chl-kv"></div>${chartBox('s-chl-h', 's')}</section></div>
      <div class="kpis">${kpi('Periode dipilih', frange(a, b), st.scale.toLowerCase() + ' · ' + n + ' hari')}${kpi('Ketersediaan data', '2000–2020', `SST ${S.ds.length} hari · Chlorophyll a ${S.ds.filter(x => x.chla != null).length} hari (rata-rata regional)`)}<div id="s-kpi1"></div><div id="s-kpi2"></div></div>`;
  },
  async mount() {
    const st = stOf('sebaran'), [a, b] = rangeFor(st.scale, st.date), win = seriesRange(a, b);
    let g = null, note = '';
    if (S.pack) { g = { sst: await statGrid('sst', a, b, st.stat), chl: await statGrid('chla', a, b, st.stat) }; note = `${st.stat.toLowerCase()} ${st.scale.toLowerCase()}`; }
    else { const f = sebaranFallback(st.scale, st.date); if (f) { g = f; note = f.note; } }
    const ssub = $('#s-sst-sub'), csub = $('#s-chl-sub');
    if (!g) {
      const msg = `Skala ${st.scale.toLowerCase()} untuk tanggal ini membutuhkan data pack harian (grid harian dari NetCDF). Pilih skala Bulanan/Tahunan/Dekadal, atau salah satu tanggal contoh.`;
      showMap('s-sst', null, null, { msg }); showMap('s-chl', null, null, { msg }); ssub.textContent = csub.textContent = frange(a, b);
      $('#s-sst-kv').innerHTML = $('#s-chl-kv').innerHTML = '<div class="note">Tidak ada grid untuk ditampilkan.</div>';
    } else {
      const cvAvail = win.some(x => x.chla != null);
      showMap('s-sst', g.sst, DEF.sst(g.sst, S.pack ? null : null));
      showMap('s-chl', g.chl, DEF.chl(g.chl), { msg: cvAvail ? 'Seluruh sel tertutup awan / tanpa data pada periode ini.' : 'Chlorophyll a tidak tersedia pada periode ini (data satelit belum ada atau tertutup awan).' });
      ssub.textContent = csub.textContent = note;
      const sv = vstats(gridVals(g.sst)), cv = vstats(gridVals(g.chl));
      $('#s-sst-kv').innerHTML = statKV(sv, '°C', 2); $('#s-chl-kv').innerHTML = statKV(cv, 'mg/m³', 3);
      $('#s-sst-n').textContent = `${sv ? sv.n : 0} sel`; $('#s-chl-n').textContent = `${cv ? cv.n : 0} sel`;
      if (sv) chart('s-sst-h', histConfig(gridVals(g.sst), COL.red, '°C'));
      if (cv) chart('s-chl-h', histConfig(gridVals(g.chl), COL.green, 'mg/m³'));
      const ocean = S.landCell.flat().filter(x => !x).length;
      $('#s-kpi1').outerHTML = kpi('Sel SST valid', sv ? Math.round(sv.n / ocean * 100) + '%' : '—', `${sv ? sv.n : 0} dari ${ocean} sel laut`);
      $('#s-kpi2').outerHTML = kpi('Sel Chlorophyll a valid', cv ? Math.round(cv.n / ocean * 100) + '%' : '—', 'sisanya tertutup awan (arsir abu-abu)');
    }
    if (!g) { $('#s-kpi1').outerHTML = kpi('Sel SST valid', '—', ''); $('#s-kpi2').outerHTML = kpi('Sel Chlorophyll a valid', '—', ''); }
  }
};

/* ---------- Peta Kejadian MHW ---------- */
function yearDays(y) {
  const per = new Array(12).fill(0), list = []; let tot = 0;
  for (const e of S.events) {
    const a = e.start_date < `${y}-01-01` ? `${y}-01-01` : e.start_date, b = e.end_date > `${y}-12-31` ? `${y}-12-31` : e.end_date;
    if (a > b) continue;
    list.push(e); for (let d = a; d <= b; d = addDays(d, 1)) { per[+d.slice(5, 7) - 1]++; tot++; }
  }
  return { per, list, tot };
}
P.mhw = {
  title: 'Peta Kejadian MHW', sub: 'Pilih satu kejadian, atau pilih tahun untuk melihat semua kejadian MHW pada tahun itu',
  html() {
    const st = stOf('mhw'); if (!st.ev) st.ev = sortEv('Terlama')[0].event_id; if (!st.year) st.year = 2000;
    const ev = evById(st.ev), yd = yearDays(st.year), leap = (st.year % 4 === 0), tot = leap ? 366 : 365;
    const yrs = Array.from({ length: 21 }, (_, i) => 2000 + i).map(y => `<button data-set="year" data-val="${y}" class="${y === Number(st.year) ? 'on' : ''}">${y}</button>`).join('');
    const rows = yd.list.map(e => `<tr class="click ${e.event_id === ev.event_id ? 'on' : ''}" data-set="ev" data-val="${e.event_id}"><td>#${e.event_id}</td><td>${frange(e.start_date, e.end_date)}</td><td>${e.duration} hari</td><td>+${fmt(e.i_max)} °C</td><td>${e.category}</td></tr>`).join('');
    return `${evStrip('mhw')}
    <div class="grid2">${mapCard('m-ev', 'Peta kejadian MHW', '<span id="m-ev-sub"></span>')}${card('Detail kejadian', 'Event #' + ev.event_id, kv([['Kategori', ev.category], ['Mulai', fdate(ev.start_date)], ['Puncak', fdate(ev.peak_date)], ['Selesai', fdate(ev.end_date)], ['Durasi', ev.duration + ' hari'], ['Intensitas maksimum', '+' + fmt(ev.i_max) + ' °C'], ['Intensitas rata-rata', '+' + fmt(ev.i_mean) + ' °C'], ['Intensitas kumulatif', fmt(ev.i_cum, 1) + ' °C·hari']]) + chartBox('m-chart', 's'))}</div>
    <section class="card"><div class="card-h"><h2>Pilih tahun</h2><span>menampilkan semua kejadian MHW di tahun itu</span></div><div class="yrs">${yrs}</div></section>
    <div class="grid2">${mapCard('m-yr', 'Semua kejadian MHW tahun ' + st.year, '<span id="m-yr-sub"></span>')}${card('Penjelasan tahun ' + st.year, yd.list.length ? 'dihitung dari katalog kejadian' : '', yd.list.length ? `<p style="font-size:15px;line-height:1.6;margin:0 0 10px">Pada tahun <b>${st.year}</b> terjadi <b>${yd.list.length} kejadian MHW</b> dengan total <b>${yd.tot} hari MHW</b> (${fmt(yd.tot / tot * 100, 1)}% dari ${tot} hari).</p><div class="tw" style="max-height:200px"><table><thead><tr><th>Event</th><th>Periode</th><th>Durasi</th><th>Imax</th><th>Kategori</th></tr></thead><tbody>${rows}</tbody></table></div><div class="lab" style="margin-top:10px">Hari MHW per bulan</div>${chartBox('m-bars', 's')}` : `<p style="font-size:15px;margin:0">Tidak ada kejadian MHW pada tahun ${st.year} (0 hari).</p>`)}</div>`;
  },
  async mount() {
    const st = stOf('mhw'), ev = evById(st.ev), yd = yearDays(st.year);
    regionalEventChart('m-chart', ev, 20);
    { const r = await eventMaps(ev), per = frange(ev.start_date, ev.end_date);
      if (r.mode === 'pack') { showMap('m-ev', r.mhw, DEF.mhw(r.mhw), { msg: 'Tidak ada sel MHW pada periode ini.' }); $('#m-ev-sub').textContent = `intensitas maks. per sel · ${per}`; }
      else if (r.mode === 'sample') { showMap('m-ev', r.mhw, DEF.sstAnom(r.mhw)); $('#m-ev-sub').textContent = `hari contoh ${fdate(r.date)} · anomali vs klimatologi bulanan`; }
      else { showMap('m-ev', null, null, { msg: NOPACK_MSG }); $('#m-ev-sub').textContent = per; } }
    if (!yd.list.length) { showMap('m-yr', null, null, { msg: `Tidak ada kejadian MHW pada tahun ${st.year} (0 hari).` }); $('#m-yr-sub').textContent = ''; return; }
    if (S.pack) { const o = await winAgg(`${st.year}-01-01`, `${st.year}-12-31`), g = aggGrid(o, 'mhwDays'); showMap('m-yr', g, DEF.days(g)); $('#m-yr-sub').textContent = 'jumlah hari MHW per sel'; }
    else { const g = S.D.grids.total_mhw_days; showMap('m-yr', g, DEF.days(g)); $('#m-yr-sub').textContent = 'total 2000–2020 (grid per tahun butuh data pack)'; }
    chart('m-bars', { type: 'bar', data: { labels: MON, datasets: [{ data: yd.per, backgroundColor: '#E04A24' }] }, options: { plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: 'hari' }, ticks: { precision: 0 } } } } });
  }
};

/* ---------- Chlorophyll a vs MHW (dampak per kejadian) ---------- */
function offsetSeries(startDate, from, to, pick) {
  const i0 = diffDays(START, startDate), out = [];
  for (let o = from; o <= to; o++) { const x = S.ds[i0 + o]; out.push(x ? pick(x) : null); }
  return out;
}
const pFmt = p => p == null ? '—' : (p < 0.001 ? '< 0.001' : fmt(p, 3));
P.dampak = {
  title: 'Chlorophyll a vs MHW', sub: 'Dampak MHW terhadap Chlorophyll a pada periode tiap kejadian · pilih salah satu dari semua kejadian',
  html() {
    const st = stOf('dampak'); if (!st.ev) st.ev = sortEv('Terlama')[0].event_id;
    const ev = evById(st.ev), m = evMetrics(ev), ca = S.D.chl;
    const rows = S.events.map(e => { const x = evMetrics(e); return `<tr class="click ${e.event_id === ev.event_id ? 'on' : ''}" data-set="ev" data-val="${e.event_id}"><td>#${e.event_id}</td><td>${frange(e.start_date, e.end_date)}</td><td>${e.duration}</td><td>+${fmt(e.i_max)}</td><td>${fmt(x.chl, 3)}</td><td>${fmt(x.base, 3)}</td><td>${x.pct == null ? '—' : (x.pct >= 0 ? '+' : '') + fmt(x.pct, 1) + '%'}</td><td>${x.cands.length}</td></tr>`; }).join('');
    const cmp = ca.comparison_summary, sup = ca.suppression_summary;
    const srows = ca.seasonal_comparison.map(r => `<tr><td>${r.Musim}</td><td>${r.N_MHW}</td><td>${r.N_NonMHW}</td><td>${fmt(r.Chla_Median_MHW, 3)}</td><td>${fmt(r.Chla_Median_NonMHW, 3)}</td><td>${fmt(r.Anomali_Median_MHW, 3)}</td><td>${pFmt(r.p_value)}</td></tr>`).join('');
    return `${evStrip('dampak')}
    <div class="note">${pill('Event #' + ev.event_id + ' · ' + frange(ev.start_date, ev.end_date) + ' · ' + ev.duration + ' hari')} Kedua peta memakai periode yang sama dengan kejadian MHW terpilih.</div>
    <div class="grid2">${mapCard('d-mhw', 'Peta MHW', '<span id="d-mhw-sub"></span>')}${mapCard('d-chl', 'Peta Chlorophyll a (anomali)', '<span id="d-chl-sub"></span>')}</div>
    <div class="kpis">${kpi('Chlorophyll a selama event', m.chl != null ? fmt(m.chl, 3) + ' mg/m³' : '—', 'rata-rata regional · ' + m.chlN + ' hari data')}${kpi('Baseline tanggal sama (tanpa MHW)', m.base != null ? fmt(m.base, 3) + ' mg/m³' : '—', m.cands.length + ' tahun pembanding')}${kpi('Selisih', m.pct != null ? (m.pct >= 0 ? '+' : '') + fmt(m.pct, 1) + '%' : '—', m.delta != null ? fmt(m.delta, 3) + ' mg/m³' : '')}${kpi('SST anomali event', '+' + fmt(m.anom) + ' °C', 'vs klimatologi harian')}</div>
    ${card('Respon Chlorophyll a selama periode event', 'sebelum · selama · sesudah (rata-rata regional)', chartBox('d-chart'))}
    ${card('Dampak per kejadian', 'klik baris untuk memilih · dihitung dari deret harian regional', `<div class="tw"><table><thead><tr><th>Event</th><th>Periode</th><th>Hari</th><th>Imax °C</th><th>Chl saat event</th><th>Baseline</th><th>Selisih</th><th>Thn pembanding</th></tr></thead><tbody>${rows}</tbody></table></div>`)}
    <div class="note"><b>Ringkasan seluruh kejadian MHW</b></div>
    <div class="grid2">${card('Chlorophyll a rata-rata', 'MHW vs non-MHW · mg/m³', chartBox('d-sum', 's'))}${card('Uji statistik', 'Mann-Whitney U', kv([['Hari MHW (data valid)', sup.mhw_n_days], ['Hari non-MHW', sup.non_mhw_n_days], ['Rata-rata MHW', fmt(sup.mhw_mean, 4) + ' mg/m³'], ['Rata-rata non-MHW', fmt(sup.non_mhw_mean, 4) + ' mg/m³'], ['Selisih', fmt(sup.diff_absolute, 4) + ' (' + fmt(sup.diff_percent, 1) + '%)'], ['Signifikansi', sup.significance]]) + '<p class="note">Disajikan deskriptif; tidak diklaim sebagai hubungan sebab-akibat.</p>')}</div>
    ${card('Perbandingan per musim', 'median Chlorophyll a (mg/m³)', `<div class="tw"><table><thead><tr><th>Musim</th><th>N MHW</th><th>N non-MHW</th><th>Median MHW</th><th>Median non-MHW</th><th>Anomali median MHW</th><th>p-value</th></tr></thead><tbody>${srows}</tbody></table></div>`)}`;
  },
  async mount() {
    const ev = evById(stOf('dampak').ev), m = evMetrics(ev), ca = S.D.chl;
    await paintEventMaps(ev, 'd-mhw', 'd-chl', '#d-mhw-sub', '#d-chl-sub');
    const from = -15, to = ev.duration + 14, labels = []; for (let o = from; o <= to; o++) labels.push(o);
    const evS = offsetSeries(ev.start_date, from, to, x => x.chla), ds = [
      { type: 'bar', label: 'Periode MHW', data: labels.map(o => o >= 0 && o < ev.duration ? 1 : null), backgroundColor: 'rgba(224,74,36,.14)', barPercentage: 1, categoryPercentage: 1, yAxisID: 'y2', order: 9 },
      { type: 'line', label: 'Event #' + ev.event_id, data: evS, borderColor: COL.red, pointRadius: 0, borderWidth: 2, spanGaps: false, yAxisID: 'y' }];
    if (m.cands.length) { const arr = m.cands.map(c => offsetSeries(c.start, from, to, x => x.chla)); ds.push({ type: 'line', label: 'Rata-rata tahun tanpa MHW (' + m.cands.length + ' th)', data: labels.map((_, i) => mean(arr.map(a => a[i]))), borderColor: COL.green, pointRadius: 0, borderWidth: 2, yAxisID: 'y' }); }
    chart('d-chart', { data: { labels, datasets: ds }, options: { scales: { y: { title: { display: true, text: 'mg/m³' } }, y2: { display: false, min: 0, max: 1 }, x: { title: { display: true, text: 'hari sejak onset' }, ticks: { maxTicksLimit: 10 } } }, plugins: { legend: { position: 'bottom' } } } });
    const cs = ca.comparison_summary;
    chart('d-sum', { type: 'bar', data: { labels: cs.map(r => `${r.Kondisi} (${r.N_Hari} hari)`), datasets: [{ data: cs.map(r => r.Chla_Mean), backgroundColor: [COL.red, COL.green] }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
  }
};

/* ---------- MHW vs Non-MHW ---------- */
P.banding = {
  title: 'Perbandingan MHW vs Non-MHW', sub: 'Periode kejadian MHW dibandingkan dengan tanggal yang sama pada tahun tanpa MHW',
  html() {
    const st = stOf('banding'); if (!st.ev) st.ev = sortEv('Terlama')[0].event_id;
    const ev = evById(st.ev), m = evMetrics(ev), sy = +ev.start_date.slice(0, 4);
    if (!m.cands.length) return `${evStrip('banding')}${card('Tahun pembanding', '', '<p>Tidak ada tahun tanpa MHW pada rentang tanggal yang sama untuk kejadian ini.</p>')}`;
    if (!st.cmp || (st.cmp !== 'avg' && !m.cands.find(c => c.year === Number(st.cmp)))) st.cmp = String(m.cands.slice().sort((a, b) => Math.abs(a.year - sy) - Math.abs(b.year - sy))[0].year);
    const opts = ['avg', ...m.cands.map(c => String(c.year))];
    const cur = st.cmp === 'avg' ? null : m.cands.find(c => c.year === Number(st.cmp));
    const cmpLab = cur ? `${frange(cur.start, cur.end)}` : `rata-rata ${m.cands.length} tahun tanpa MHW`;
    const rows = m.cands.map(c => `<tr class="click ${cur && c.year === cur.year ? 'on' : ''}" data-set="cmp" data-val="${c.year}"><td>${c.year}</td><td>${frange(c.start, c.end)}</td><td>${fmt(c.chl, 3)}</td><td>${(c.anom >= 0 ? '+' : '') + fmt(c.anom)}</td></tr>`).join('');
    const cChl = cur ? cur.chl : m.base, cAn = cur ? cur.anom : m.baseAnom, pct = cChl ? (m.chl - cChl) / cChl * 100 : null;
    return `${evStrip('banding')}
    <section class="card"><div>${pill('Event #' + ev.event_id + ' · ' + frange(ev.start_date, ev.end_date) + ' (' + ev.duration + ' hari)')} <span style="font-size:13px">dibandingkan dengan tanggal yang sama: <b>${cmpLab}</b> (tanpa MHW)</span></div>
    <div style="margin-top:10px">${lab('Tahun pembanding (otomatis hanya tahun tanpa MHW pada rentang tanggal yang sama)')}<div class="yrs">${opts.map(o => `<button data-set="cmp" data-val="${o}" class="${o === st.cmp ? 'on' : ''}" style="min-width:${o === 'avg' ? 240 : 56}px">${o === 'avg' ? 'Rata-rata semua tahun non-MHW' : o}</button>`).join('')}</div></div></section>
    <div class="grid2">${mapCard('c-a', 'A · SST anomali, saat MHW', '<span id="c-a-sub"></span>')}${mapCard('c-b', 'B · Chlorophyll a, saat MHW', '<span id="c-b-sub"></span>')}${mapCard('c-c', 'C · SST anomali, tanpa MHW', '<span id="c-c-sub"></span>')}${mapCard('c-d', 'D · Chlorophyll a, tanpa MHW', '<span id="c-d-sub"></span>')}</div>
    <div class="kpis">${kpi('Chlorophyll a saat MHW', fmt(m.chl, 3) + ' mg/m³', frange(ev.start_date, ev.end_date))}${kpi('Chlorophyll a tanpa MHW', fmt(cChl, 3) + ' mg/m³', cmpLab)}${kpi('Selisih', pct == null ? '—' : (pct >= 0 ? '+' : '') + fmt(pct, 1) + '%', 'MHW dibanding non-MHW')}${kpi('SST anomali', `+${fmt(m.anom)} vs ${cAn >= 0 ? '+' : ''}${fmt(cAn)} °C`, 'saat MHW vs tanpa MHW')}</div>
    <div class="grid2">${card('SST regional', 'MHW vs non-MHW · sejajar hari sejak onset', chartBox('c-sst'))}${card('Chlorophyll a regional', 'MHW vs non-MHW · mg/m³', chartBox('c-chl'))}</div>
    <div class="grid2">${card('Tahun pembanding yang tersedia', 'klik untuk memilih', `<div class="tw"><table><thead><tr><th>Tahun</th><th>Periode</th><th>Chl (mg/m³)</th><th>SST anomali °C</th></tr></thead><tbody>${rows}</tbody></table></div>`)}${card('Cara membaca', '', '<p class="note" style="font-size:13px">Peta A dan B memakai periode persis kejadian MHW terpilih. Peta C dan D memakai tanggal kalender yang sama pada tahun yang tidak mengalami MHW sama sekali, dengan skala warna yang sama sehingga dapat dibandingkan. Grafik memakai rata-rata regional dari deret harian. Pembandingan bersifat deskriptif, bukan pembuktian sebab-akibat.</p>')}</div>`;
  },
  async mount() {
    const st = stOf('banding'), ev = evById(st.ev), m = evMetrics(ev); if (!m.cands.length) return;
    const cur = st.cmp === 'avg' ? null : m.cands.find(c => c.year === Number(st.cmp)), per = frange(ev.start_date, ev.end_date);
    const wins = cur ? [cur] : m.cands, labC = cur ? frange(cur.start, cur.end) : `rata-rata ${wins.length} tahun`;
    if (S.pack) {
      const oe = await winAgg(ev.start_date, ev.end_date), A = aggGrid(oe, 'sstAnom'), B = aggGrid(oe, 'chlAnom');
      const os = []; for (const c of wins) os.push(await winAgg(c.start, c.end));
      const avg = what => toGrid(0, i => mean(os.map(o => aggGrid(o, what)[Math.floor(i / NC)][i % NC])));
      const C = os.length === 1 ? aggGrid(os[0], 'sstAnom') : avg('sstAnom'), D = os.length === 1 ? aggGrid(os[0], 'chlAnom') : avg('chlAnom');
      const dS = DEF.sstAnom(A.concat(C)), dC = DEF.chlAnom(B.concat(D));
      showMap('c-a', A, dS); showMap('c-b', B, dC, { msg: 'Chlorophyll a tidak tersedia (awan/tanpa data).' }); showMap('c-c', C, dS); showMap('c-d', D, dC, { msg: 'Chlorophyll a tidak tersedia (awan/tanpa data).' });
      $('#c-a-sub').textContent = $('#c-b-sub').textContent = per; $('#c-c-sub').textContent = $('#c-d-sub').textContent = labC;
    } else {
      const r = await eventMaps(ev);
      if (r.mode === 'sample') { showMap('c-a', r.mhw, DEF.sstAnom(r.mhw)); showMap('c-b', r.chl, DEF.chlAnom(r.chl)); $('#c-a-sub').textContent = $('#c-b-sub').textContent = 'hari contoh ' + fdate(r.date); }
      else { for (const id of ['c-a', 'c-b']) showMap(id, null, null, { msg: NOPACK_MSG }); $('#c-a-sub').textContent = $('#c-b-sub').textContent = per; }
      for (const id of ['c-c', 'c-d']) showMap(id, null, null, { msg: 'Peta tahun pembanding membutuhkan data pack harian. Lihat grafik regional di bawah.' });
      $('#c-c-sub').textContent = $('#c-d-sub').textContent = labC;
    }
    const to = ev.duration - 1, labels = []; for (let o = 0; o <= to; o++) labels.push(o);
    const mk = (pick, name) => { const e = offsetSeries(ev.start_date, 0, to, pick), arr = wins.map(c => offsetSeries(c.start, 0, to, pick)); return [
      { label: 'Saat MHW (' + ev.start_date.slice(0, 4) + ')', data: e, borderColor: COL.red, pointRadius: 0, borderWidth: 2 },
      { label: 'Tanpa MHW (' + (cur ? cur.year : 'rata-rata') + ')', data: labels.map((_, i) => mean(arr.map(a => a[i]))), borderColor: COL.green, pointRadius: 0, borderWidth: 2 }]; };
    const opt = u => ({ scales: { y: { title: { display: true, text: u } }, x: { title: { display: true, text: 'hari sejak onset' }, ticks: { maxTicksLimit: 10 } } }, plugins: { legend: { position: 'bottom' } } });
    chart('c-sst', { type: 'line', data: { labels, datasets: mk(x => x.sst) }, options: opt('°C') });
    chart('c-chl', { type: 'line', data: { labels, datasets: mk(x => x.chla) }, options: opt('mg/m³') });
  }
};

/* ---------- SST & Chlorophyll a (halaman variabel) ---------- */
const DECS = ['2000–2009', '2010–2019', '2020'];
function varPage(kind) {
  const isS = kind === 'sst', gk = isS ? 'sst' : 'chla', unit = isS ? '°C' : 'mg/m³', dec = isS ? 2 : 3, nm = isS ? 'SST' : 'Chlorophyll a', key = isS ? 'sst' : 'chla';
  const pick = x => isS ? x.sst : x.chla, def = g => isS ? DEF.sst(g) : DEF.chl(g), SCL = ['Seluruh periode', 'Bulanan', 'Tahunan', 'Musiman', 'Dekadal'];
  const dflt = st => { st.scale = st.scale || 'Musiman'; st.season = st.season || 'JJA'; st.month = st.month || 'Jun'; st.year = st.year || 2016; st.dec = st.dec || DECS[0]; st.stat = st.stat || 'Rata-rata'; st.cy = st.cy || 2016; return st; };
  const selOf = st => {
    const G = S.D.grids, mo = MON.indexOf(st.month) + 1, sea = SEAS.find(s => s.k === st.season);
    switch (st.scale) {
      case 'Bulanan': return { a: START, b: END, f: d => +d.slice(5, 7) === mo, lbl: `bulan ${MONF[mo - 1]} (rata-rata semua tahun 2000–2020)`, g: G[gk + '_monthly'][mo] };
      case 'Tahunan': return { a: `${st.year}-01-01`, b: `${st.year}-12-31`, f: null, lbl: `tahun ${st.year}`, g: G[gk + '_annual'][st.year] };
      case 'Musiman': return { a: START, b: END, f: d => sea.m.includes(+d.slice(5, 7)), lbl: `${sea.k} · ${sea.per} · ${sea.n} (2000–2020)`, g: G[gk + '_seasonal'][sea.k] };
      case 'Dekadal': { const [x, y] = st.dec.split('–'); return { a: `${x}-01-01`, b: `${y || x}-12-31`, f: null, lbl: `dekade ${st.dec}`, g: G[gk + '_decadal'][st.dec.replace('–', '_')] }; }
      default: return { a: START, b: END, f: null, lbl: 'seluruh periode 2000–2020', g: G[gk + '_mean_all'] };
    }
  };
  const seasonTable = act => {
    const rows = SEAS.map(s => { const v = vstats(S.ds.filter(x => s.m.includes(+x.date.slice(5, 7))).map(pick)); return `<tr class="${act === s.k ? 'on' : ''}"><td><b>${s.k}</b></td><td>${s.per}</td><td>${s.n}</td><td>${v.n}</td><td>${fmt(v.mean, dec)}</td><td>${fmt(v.median, dec)}</td><td>${fmt(v.min, dec)}</td><td>${fmt(v.max, dec)}</td><td>${fmt(v.std, dec)}</td></tr>`; }).join('');
    return `<div class="tw"><table><thead><tr><th>Musim</th><th>Periode</th><th>Fase</th><th>Hari</th><th>Rata-rata</th><th>Median</th><th>Min</th><th>Maks</th><th>Std</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  };
  return {
    title: nm, sub: `${nm} per skala waktu: bulanan, tahunan, musiman, dekadal, dengan statistiknya`,
    html() {
      const st = dflt(stOf(key)), sl = selOf(st), dis = S.pack ? [] : STATS.slice(1);
      let dep = '';
      if (st.scale === 'Bulanan') dep = seg('month', MON, st.month);
      else if (st.scale === 'Tahunan') dep = `<div class="yrs">${Array.from({ length: 21 }, (_, i) => 2000 + i).map(y => `<button data-set="year" data-val="${y}" class="${y === Number(st.year) ? 'on' : ''}">${y}</button>`).join('')}</div>`;
      else if (st.scale === 'Musiman') dep = seg('season', SEAS.map(s => s.k), st.season);
      else if (st.scale === 'Dekadal') dep = seg('dec', DECS, st.dec);
      const sea = SEAS.find(s => s.k === st.season), series = S.ds.filter(x => (!sl.f || sl.f(x.date)) && x.date >= sl.a && x.date <= sl.b).map(pick), sv = vstats(series);
      const stats = S.D.chl.stats, sg = k => (stats.find(r => r['Unnamed: 0'] === k) || {}).Nilai;
      const mini = SEAS.map(s => mapCard(`v-${s.k}`, `${s.k} · ${s.per}`, s.n)).join('');
      const cycleYears = Array.from({ length: 21 }, (_, i) => 2000 + i);
      return `<section class="card"><div class="row"><div>${lab('Skala waktu')}${seg('scale', SCL, st.scale)}</div><div>${lab('Statistik agregasi')}${seg('stat', STATS, st.stat, dis)}</div></div>${dep ? `<div style="margin-top:12px">${lab(st.scale === 'Musiman' ? 'Musim' : st.scale === 'Bulanan' ? 'Bulan' : st.scale === 'Tahunan' ? 'Tahun' : 'Dekade')}${dep}</div>` : ''}
        <div style="margin-top:12px;font-size:13px">Ditampilkan: ${pill(st.stat + ' · ' + st.scale)} ${pill(sl.lbl)} ${!S.pack ? '<span class="note">Mode terbatas: hanya rata-rata yang tersedia (statistik lain butuh data pack harian).</span>' : ''}</div></section>
      <div class="grid2">${mapCard('v-main', `Peta ${nm} · ${st.stat.toLowerCase()} ${st.scale.toLowerCase()}`, '<span id="v-main-sub"></span>')}${card(`Statistik ${nm}`, sl.lbl, `<div class="lab">Statistik spasial (nilai sel pada peta)</div><div id="v-skv"></div><div class="lab" style="margin-top:12px">Deret harian rata-rata regional · ${sv ? sv.n : 0} hari</div>${sv ? kv([['Rata-rata', `${fmt(sv.mean, dec)} ${unit}`], ['Median', `${fmt(sv.median, dec)} ${unit}`], ['Minimum', `${fmt(sv.min, dec)} ${unit}`], ['Maksimum', `${fmt(sv.max, dec)} ${unit}`], ['Simpangan baku', `${fmt(sv.std, dec)} ${unit}`], ['Persentil 10 / 90', `${fmt(sv.p10, dec)} / ${fmt(sv.p90, dec)}`]]) : '<div class="note">Tidak ada data.</div>'}`)}</div>
      ${card('Perbandingan antar musim', `statistik deret harian rata-rata regional (${unit})`, seasonTable(st.scale === 'Musiman' ? st.season : ''))}
      <div class="note"><b>Peta per musim</b> (skala warna sama untuk keempat musim)</div><div class="grid2">${mini}</div>
      <div class="grid2">${card(`${nm} rata-rata bulanan`, `klimatologi 2000–2020 · ${unit}`, chartBox('v-month'))}${card(isS ? 'Siklus musiman SST dan ambang MHW' : 'Chlorophyll a bulanan vs tahun terpilih', `<select data-in="cy" aria-label="Tahun">${cycleYears.map(y => `<option ${y === Number(st.cy) ? 'selected' : ''}>${y}</option>`).join('')}</select>`, chartBox('v-cycle'))}</div>
      ${isS ? `<div class="kpis">${kpi('SST rata-rata regional', fmt(vstats(S.ds.map(x => x.sst)).mean) + ' ± ' + fmt(vstats(S.ds.map(x => x.sst)).std) + ' °C', '2000–2020, deret harian')}${kpi('Rentang harian', fmt(vstats(S.ds.map(x => x.sst)).min) + '–' + fmt(vstats(S.ds.map(x => x.sst)).max) + ' °C', 'minimum–maksimum regional')}${kpi('Baseline klimatologi', '21 tahun', '2000–2020 (bukan standar 30 tahun WMO)')}${kpi('Ambang MHW', 'P90 musiman', 'Hobday et al. (2016) · min. 5 hari · gap 2 hari')}</div>`
        : `<div class="kpis">${kpi('Rata-rata piksel', fmt(sg('mean_mg_m3'), 3) + ' mg/m³', 'seluruh piksel valid')}${kpi('Median', fmt(sg('median_p50_mg_m3'), 3) + ' mg/m³', 'distribusi log-normal')}${kpi('Piksel valid', fmt(sg('persentase_valid'), 1) + '%', 'sisanya tertutup awan / tanpa data')}${kpi('Persentil 90 / 95', fmt(sg('p90_mg_m3'), 2) + ' / ' + fmt(sg('p95_mg_m3'), 2), 'mg/m³')}</div>
        ${card('Statistik deskriptif Chlorophyll a', 'seluruh piksel valid 2000–2020 · mg/m³', kv([['Total piksel diobservasi', fmt(sg('total_piksel_diobservasi'), 0)], ['Total piksel valid', fmt(sg('total_piksel_valid'), 0)], ['Minimum', fmt(sg('min_mg_m3'), 3)], ['Persentil 5', fmt(sg('p05_mg_m3'), 3)], ['Persentil 25', fmt(sg('p25_mg_m3'), 3)], ['Median', fmt(sg('median_p50_mg_m3'), 3)], ['Rata-rata', fmt(sg('mean_mg_m3'), 3)], ['Persentil 75', fmt(sg('p75_mg_m3'), 3)], ['Persentil 90', fmt(sg('p90_mg_m3'), 3)], ['Maksimum', fmt(sg('max_mg_m3'), 2)], ['Simpangan baku', fmt(sg('std_mg_m3'), 3)], ['IQR', fmt(sg('iqr_mg_m3'), 3)]]))}`}`;
    },
    async mount() {
      const st = dflt(stOf(key)), sl = selOf(st);
      let g = sl.g;
      if (S.pack) g = await statGrid(isS ? 'sst' : 'chla', sl.a, sl.b, st.stat, sl.f);
      showMap('v-main', g, def(g), { msg: 'Tidak ada data.' }); $('#v-main-sub').textContent = sl.lbl;
      const v = vstats(gridVals(g)); $('#v-skv').innerHTML = statKV(v, unit, dec);
      const grids = [];
      for (const s of SEAS) grids.push(S.pack ? await statGrid(isS ? 'sst' : 'chla', START, END, 'Rata-rata', d => s.m.includes(+d.slice(5, 7))) : S.D.grids[gk + '_seasonal'][s.k]);
      const shared = def(grids.flat()); SEAS.forEach((s, i) => showMap(`v-${s.k}`, grids[i], shared));
      const mc = S.D.monthly, ds = [];
      if (isS) ds.push({ type: 'bar', label: 'Rata-rata', data: mc.map(x => x.sst_mean), backgroundColor: COL.orange }, { type: 'line', label: 'Minimum', data: mc.map(x => x.sst_min), borderColor: '#3B6FB6', pointRadius: 2, borderWidth: 1.5 }, { type: 'line', label: 'Maksimum', data: mc.map(x => x.sst_max), borderColor: COL.red, pointRadius: 2, borderWidth: 1.5 });
      else ds.push({ type: 'bar', label: 'Rata-rata', data: mc.map(x => x.chla_mean), backgroundColor: COL.green });
      chart('v-month', { data: { labels: MON, datasets: ds }, options: { scales: { y: { beginAtZero: !isS, title: { display: true, text: unit } } }, plugins: { legend: { position: 'bottom' } } } });
      const yr = Number(st.cy), w = S.ds.filter(x => x.date.startsWith(String(yr)));
      if (isS) {
        const doyL = S.D.doy; chart('v-cycle', { type: 'line', data: { labels: doyL.map(d => d.doy), datasets: [
          { label: 'Klimatologi', data: doyL.map(d => d.climatology), borderColor: COL.teal, pointRadius: 0, borderWidth: 2 },
          { label: 'Ambang P90', data: doyL.map(d => d.threshold), borderColor: '#E04A24', borderDash: [5, 3], pointRadius: 0, borderWidth: 1.5 },
          { label: 'SST ' + yr, data: w.map(x => x.sst), borderColor: '#7A1414', pointRadius: 0, borderWidth: 1.3 }] }, options: { scales: { x: { title: { display: true, text: 'hari ke-' }, ticks: { maxTicksLimit: 12 } }, y: { title: { display: true, text: '°C' } } }, plugins: { legend: { position: 'bottom' } } } });
      } else {
        const m = MON.map((_, i) => mean(w.filter(x => +x.date.slice(5, 7) === i + 1).map(x => x.chla)));
        chart('v-cycle', { type: 'line', data: { labels: MON, datasets: [{ label: 'Klimatologi', data: mc.map(x => x.chla_mean), borderColor: COL.teal, borderWidth: 2, pointRadius: 2 }, { label: String(yr), data: m, borderColor: COL.green, borderWidth: 2, pointRadius: 2 }] }, options: { scales: { y: { title: { display: true, text: unit } } }, plugins: { legend: { position: 'bottom' } } } });
      }
    }
  };
}
P.sst = varPage('sst'); P.chla = varPage('chla');

/* ---------- Produksi Ikan ---------- */
P.ikan = {
  title: 'Produksi Tangkapan Ikan', sub: 'Konteks perikanan tangkap laut umum NTT terhadap kondisi SST, MHW, dan Chlorophyll a (deskriptif)',
  html() {
    const F = S.D.fish, A = F.annual_data;
    const sp = F.species_thermal.map(s => `<section class="card"><div class="card-h"><h2>${s.species}</h2><span><i>${s.latin}</i></span></div>${kv([['Suhu optimum', s.optimum_temp], ['Suhu kritis', s.critical_temp], ['Habitat', s.habitat], ['Alat tangkap', s.gear]])}<p class="note" style="margin-top:8px"><b>Saat MHW:</b> ${s.behavior_at_mhw}</p></section>`).join('');
    const rows = A.map(a => `<tr><td>${a.year}</td><td>${fmt(a.sst_mean)}</td><td>${(a.sst_anomaly >= 0 ? '+' : '') + fmt(a.sst_anomaly)}</td><td>${a.mhw_events}</td><td>${a.mhw_days}</td><td>${fmt(a.chla_mean, 3)}</td><td>${fmt(a.catch_tons, 0)}</td></tr>`).join('');
    const cf = F.confounding_factors.map(c => `<tr><td><b>${c['Faktor Perancu']}</b></td><td>${c['Mekanisme Pengaruh']}</td><td>${c['Arah Distorsi Terhadap Data']}</td></tr>`).join('');
    return `<div class="banner">Halaman ini bersifat <b>deskriptif kualitatif</b>: dinamika oseanografi dibandingkan dengan preferensi termal ikan dari literatur dan data tangkapan tahunan resmi (BPS/KKP), <b>bukan</b> klaim sebab-akibat MHW terhadap hasil tangkapan.</div>
    <div class="grid2">${card('Produksi tangkapan vs hari MHW', 'tahunan · ton dan hari', chartBox('f-catch'))}${card('Chlorophyll a dan anomali SST tahunan', 'rata-rata tahunan', chartBox('f-env'))}</div>
    <div class="grid2">${card('Kisaran suhu optimum spesies', 'dibanding ambang kritis · °C', chartBox('f-sp'))}<div class="grid2" style="grid-template-columns:1fr">${sp}</div></div>
    ${card('Sintesis tahunan', 'SST, MHW, Chlorophyll a, dan tangkapan (annual_summary.json)', `<div class="tw"><table><thead><tr><th>Tahun</th><th>SST rata-rata °C</th><th>Anomali °C</th><th>Kejadian MHW</th><th>Hari MHW</th><th>Chl (mg/m³)</th><th>Tangkapan (ton)</th></tr></thead><tbody>${rows}</tbody></table></div>`)}
    ${card('Faktor pengganggu perikanan', 'confounding factors', `<div class="tw"><table><thead><tr><th>Faktor</th><th>Mekanisme</th><th>Arah distorsi</th></tr></thead><tbody>${cf}</tbody></table></div>`)}
    ${card('Keterbatasan', '', `<ul class="plain">${F.limitations.map(l => `<li>${l}</li>`).join('')}</ul>`)}`;
  },
  mount() {
    const A = S.D.fish.annual_data, F = S.D.fish, yrs = A.map(a => a.year);
    chart('f-catch', { data: { labels: yrs, datasets: [{ type: 'bar', label: 'Tangkapan (ton)', data: A.map(a => a.catch_tons), backgroundColor: '#9CCFD6', yAxisID: 'y' }, { type: 'line', label: 'Hari MHW', data: A.map(a => a.mhw_days), borderColor: COL.red, pointRadius: 3, yAxisID: 'y2' }] }, options: { scales: { y: { title: { display: true, text: 'ton' } }, y2: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'hari MHW' } } }, plugins: { legend: { position: 'bottom' } } } });
    chart('f-env', { type: 'line', data: { labels: yrs, datasets: [{ label: 'Chl (mg/m³)', data: A.map(a => a.chla_mean), borderColor: COL.green, yAxisID: 'y', pointRadius: 3 }, { label: 'Anomali SST (°C)', data: A.map(a => a.sst_anomaly), borderColor: COL.red, yAxisID: 'y2', pointRadius: 3 }] }, options: { scales: { y: { title: { display: true, text: 'mg/m³' } }, y2: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '°C' } } }, plugins: { legend: { position: 'bottom' } } } });
    const num = s => (String(s).match(/-?\d+(\.\d+)?/g) || []).map(Number), sp = F.species_thermal.map(s => ({ n: s.species, o: num(s.optimum_temp), c: num(s.critical_temp)[0] }));
    chart('f-sp', { type: 'bar', data: { labels: sp.map(s => s.n), datasets: [{ label: 'Suhu optimum', data: sp.map(s => s.o.length > 1 ? [s.o[0], s.o[1]] : [s.o[0], s.o[0]]), backgroundColor: COL.teal }, { type: 'scatter', label: 'Suhu kritis', data: sp.map((s, i) => ({ x: i, y: s.c })), backgroundColor: COL.red, pointStyle: 'rectRot', radius: 7 }] }, options: { scales: { y: { min: 20, max: 33, title: { display: true, text: '°C' } } }, plugins: { legend: { position: 'bottom' } } } });
  }
};

/* ---------- Sintesis Hasil ---------- */
const FIGS = {
  'fig1_sintesis_karakteristik_sst.png': 'Figur 1 · Karakteristik SST', 'fig2_sintesis_timeline_mhw.png': 'Figur 2 · Kronologi MHW', 'fig3_sintesis_spasial_multiparameter.png': 'Figur 3 · Spasial multiparameter', 'fig4_sintesis_respon_chla_mhw.png': 'Figur 4 · Respon Chlorophyll a terhadap MHW',
  'nb1_sst_coverage_map.png': 'NB1 · Cakupan SST', 'nb1_chla_coverage_map.png': 'NB1 · Cakupan Chlorophyll a', 'nb1_sst_timeseries.png': 'NB1 · Deret waktu SST',
  'nb2_sst_climatology_threshold.png': 'NB2 · Klimatologi dan ambang SST', 'nb2_sst_seasonal_cycle.png': 'NB2 · Siklus musiman SST', 'nb2_sst_spatial_patterns.png': 'NB2 · Pola spasial SST', 'nb2_mhw_timeline.png': 'NB2 · Timeline MHW', 'nb2_mhw_spatial_maps.png': 'NB2 · Peta spasial MHW', 'nb2_mhw_annual_metrics.png': 'NB2 · Metrik tahunan MHW',
  'nb3_chla_spatial_patterns.png': 'NB3 · Pola spasial Chlorophyll a', 'nb3_chla_temporal_patterns.png': 'NB3 · Pola temporal Chlorophyll a', 'nb3_chla_distribution.png': 'NB3 · Distribusi Chlorophyll a', 'nb3_chla_data_availability.png': 'NB3 · Ketersediaan data Chlorophyll a',
  'nb4_chla_mhw_vs_nonmhw_boxplots.png': 'NB4 · Chlorophyll a MHW vs non-MHW', 'nb4_mhw_case_study_spatial.png': 'NB4 · Studi kasus spasial MHW',
  'nb6_thermal_tolerance_species.png': 'NB6 · Toleransi termal spesies', 'nb6_descriptive_oceanography_and_catch.png': 'NB6 · Oseanografi dan tangkapan'
};
function csvDownload(name, rows) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'), a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; a.click();
}
P.sintesis = {
  title: 'Sintesis Hasil', sub: 'Ringkasan temuan utama dan galeri figur ilmiah hasil notebook',
  html() {
    const sf = S.D.syn.summary_findings.map(r => `<tr><td>${r.Komponen}</td><td>${r.Metrik}</td><td><b>${r.Nilai}</b></td><td>${r.Keterangan}</td></tr>`).join('');
    const gal = Object.entries(FIGS).map(([f, t]) => `<figure><img src="figures/${f}" alt="${esc(t)}" loading="lazy" data-zoom="${esc(t)}"><figcaption>${t}</figcaption></figure>`).join('');
    return `${card('Ringkasan temuan', 'synthesis_methodology.json', `<div class="tw"><table><thead><tr><th>Komponen</th><th>Metrik</th><th>Nilai</th><th>Keterangan</th></tr></thead><tbody>${sf}</tbody></table></div><div style="margin-top:10px"><button class="btn" data-act="csv-events">Ekspor ${S.events.length} kejadian MHW (CSV)</button></div>`)}
    ${card('Galeri figur', 'klik gambar untuk memperbesar', `<div class="gal">${gal}</div>`)}`;
  },
  mount() { }
};

/* ---------- Metodologi ---------- */
P.metodologi = {
  title: 'Metodologi', sub: 'Alur pipeline, parameter, sumber data, kualitas data, dan batasan analisis',
  html() {
    const M = meta(), Y = S.D.syn, steps = [['NB 1', 'Persiapan & penggabungan data', 'Inventaris, QC, subset NTT'], ['NB 2', 'SST & deteksi MHW', 'Klimatologi, P90, Hobday 2016'], ['NB 3', 'Chlorophyll a', 'Statistik, musiman, celah awan'], ['NB 4', 'Gabungan MHW + Chlorophyll a', 'Penyelarasan grid, Mann-Whitney'], ['NB 5', 'Visualisasi & sintesis', 'Figur 300 DPI, tabel'], ['NB 6', 'Interpretasi kualitatif', 'Konteks tangkapan ikan']];
    const dq = Y.data_quality.map(d => `<tr><td>${d.dataset}</td><td>${d.sumber}</td><td>${d.resolusi_spasial}</td><td>${d.resolusi_temporal}</td><td>${d.periode_awal} – ${d.periode_akhir}</td><td>${d.jumlah_hari}</td><td>${fmt(d.missing_pct, 2)}%</td></tr>`).join('');
    const tot = (Y.data_inventory || []).reduce((s, x) => s + (x.ukuran_MB || 0), 0);
    return `<div class="flow">${steps.map(s => `<div><b>${s[0]}</b><h3>${s[1]}</h3><p>${s[2]}</p></div>`).join('')}</div>
    <div class="kpis">${kpi('Ambang MHW', 'Persentil ke-90', 'musiman, jendela 31 hari')}${kpi('Durasi minimum', '5 hari', 'gap maksimum 2 hari · Hobday et al. (2016)')}${kpi('Baseline', '2000–2020', '21 tahun')}${kpi('Domain', `${M.region.lon_min}–${M.region.lon_max}°BT`, `${-M.region.lat_max}–${-M.region.lat_min}°LS · grid 0.25°`)}</div>
    <div class="grid2">${card('Periode data', '', kv(Object.entries(M.periods).map(([k, v]) => [k.toUpperCase(), v])))}${card('Sitasi', '', `<ul class="plain">${Y.citations.map(c => `<li><b>${c.name}</b>: ${c.citation}</li>`).join('')}</ul>`)}</div>
    ${card('Kualitas data', `${Y.data_inventory ? Y.data_inventory.length : 0} file terinventarisasi · ${fmt(tot, 0)} MB`, `<div class="tw"><table><thead><tr><th>Dataset</th><th>Sumber</th><th>Resolusi spasial</th><th>Temporal</th><th>Periode</th><th>Hari</th><th>Missing</th></tr></thead><tbody>${dq}</tbody></table></div>`)}
    ${card('Kepatuhan batasan PRD', '', `<ul class="plain" style="list-style:none;padding:0">${Y.prd_compliance.map(r => `<li><span class="ok">✓</span> <b>${r.rule}</b> — ${r.detail}</li>`).join('')}</ul>`)}
    ${card('Keterbatasan', '', `<ul class="plain">${S.D.fish.limitations.map(l => `<li>${l}</li>`).join('')}<li>Baseline 21 tahun lebih pendek daripada standar klimatologi 30 tahun. Chlorophyll a banyak hilang akibat tutupan awan (piksel valid ≈ ${fmt((S.D.chl.stats.find(r => r['Unnamed: 0'] === 'persentase_valid') || {}).Nilai, 1)}%).</li></ul>`)}`;
  },
  mount() { }
};

/* ---------- Router & init ---------- */
const NAV = [['Utama', [['beranda', 'Beranda'], ['sebaran', 'Sebaran Data']]], ['Analisis', [['mhw', 'Peta Kejadian MHW'], ['dampak', 'Chlorophyll a vs MHW'], ['banding', 'MHW vs Non-MHW'], ['sst', 'SST'], ['chla', 'Chlorophyll a']]], ['Lainnya', [['ikan', 'Produksi Ikan'], ['sintesis', 'Sintesis Hasil'], ['metodologi', 'Metodologi']]]];
const ICON = { beranda: 'M3 10l7-6 7 6v7H3z', sebaran: 'M3 3h5v5H3zM12 3h5v5h-5zM3 12h5v5H3zM12 12h5v5h-5z', mhw: 'M2 13c3-6 5 4 8-1s5 4 8-1', dampak: 'M4 16V8M10 16V4M16 16v-6', banding: 'M4 4v12M16 4v12M4 10h12M7 7l-3 3 3 3M13 7l3 3-3 3', sst: 'M10 3v9M7 12a3 3 0 106 0 3 3 0 00-6 0', chla: 'M4 16c0-8 5-12 12-12 0 8-4 12-12 12zM4 16l7-7', ikan: 'M2 10c3-4 8-4 11 0-3 4-8 4-11 0zM13 10l5-3v6z', sintesis: 'M4 4h12v12H4zM7 8h6M7 12h4', metodologi: 'M10 3a7 7 0 100 14 7 7 0 000-14zM10 9v5M10 6.5v.5' };
function buildSidebar() {
  $('#sidebar').innerHTML = `<div class="brand"><b>NTT Marine Insight</b><span>SST · MHW · Chlorophyll a · 2000–2020</span></div>` + NAV.map(([g, it]) => `<div class="nav-group">${g}</div>` + it.map(([k, t]) => `<a class="nav-link" href="#${k}" data-page="${k}"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="${ICON[k]}"/></svg>${t}</a>`).join('')).join('');
}
const GRIDPAGES = ['beranda', 'sebaran', 'mhw', 'dampak', 'banding', 'sst', 'chla'];
function setBanner(page) {
  const b = $('#banner'), badge = $('#data-badge');
  badge.innerHTML = S.pack ? '<span class="pill">Data pack harian aktif</span>' : '<span class="pill" style="background:#FFF1C9;color:#5A4300">Mode data terbatas</span>';
  if (!GRIDPAGES.includes(page)) { b.innerHTML = ''; return; }
  b.innerHTML = S.pack ? '' : `<div class="banner"><b>Mode data terbatas.</b> Grid harian per tanggal dan per kejadian MHW belum dibuat, sehingga peta harian/mingguan dan peta tiap kejadian hanya tampil untuk 4 hari contoh. Peta tahunan, bulanan, musiman, dekadal, grafik regional, tabel, dan statistik tetap memakai data asli. Untuk mengaktifkan semuanya, jalankan <code>python dashboard/tools/build_daily_grids.py</code> di komputer yang menyimpan file NetCDF (<code>data/processed/*.nc</code>), lalu muat ulang halaman.</div>`;
}
async function show(page) {
  if (!P[page]) page = 'beranda';
  const same = S.page === page, sl = same && $('.strip') ? $('.strip').scrollLeft : 0;
  S.page = page; S.charts.forEach(c => c.destroy()); S.charts = [];
  $$('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.page === page));
  $('#page-title').textContent = P[page].title; $('#page-sub').textContent = P[page].sub; document.title = `${P[page].title} · NTT Marine Insight`;
  setBanner(page);
  try {
    $('#view').innerHTML = P[page].html();
    const s2 = $('.strip'); if (s2 && sl) s2.scrollLeft = sl;
    await P[page].mount();
  } catch (e) { console.error(e); $('#view').insertAdjacentHTML('afterbegin', `<div class="banner">Terjadi kesalahan saat menampilkan halaman: ${esc(e.message)}</div>`); }
}
async function rerender() { const y = window.scrollY; await show(S.page); window.scrollTo(0, y); }
function wire() {
  document.addEventListener('click', e => {
    const z = e.target.closest('[data-zoom]');
    if (z) { $('#modal-img').src = z.src; $('#modal-cap').textContent = z.dataset.zoom; $('#modal').classList.remove('hidden'); return; }
    if (e.target.closest('#modal-close') || e.target.id === 'modal') { $('#modal').classList.add('hidden'); return; }
    const act = e.target.closest('[data-act]');
    if (act && act.dataset.act === 'csv-events') { csvDownload('kejadian_mhw_ntt.csv', [['event_id', 'start_date', 'end_date', 'peak_date', 'duration', 'i_max', 'i_mean', 'i_cum', 'category'], ...S.events.map(x => [x.event_id, x.start_date, x.end_date, x.peak_date, x.duration, x.i_max, x.i_mean, x.i_cum, x.category])]); return; }
    const b = e.target.closest('[data-set]'); if (!b || b.disabled) return;
    const st = stOf(S.page); st[b.dataset.set] = b.dataset.val; if (b.dataset.forceScale) st.scale = b.dataset.forceScale;
    if (b.dataset.set === 'ev') st.ev = Number(b.dataset.val);
    if (b.dataset.set === 'year') st.year = Number(b.dataset.val);
    rerender();
    if ($('#sidebar').classList.contains('open')) $('#sidebar').classList.remove('open');
  });
  document.addEventListener('change', e => { const i = e.target.closest('[data-in]'); if (!i || !i.value) return; stOf(S.page)[i.dataset.in] = i.type === 'date' ? clampDate(i.value) : i.value; rerender(); });
  document.addEventListener('input', e => { const s = e.target.closest('[data-search]'); if (!s) return; stOf(S.page).q = s.value; const strip = $('.strip'); if (strip) strip.innerHTML = stripInner(S.page); });
  $('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#modal').classList.add('hidden'); });
}
async function init() {
  buildSidebar(); wire();
  try { await loadDatasets(); if (!S.D.grids || !S.ds.length) throw new Error('data tidak termuat'); }
  catch (e) { $('#view').innerHTML = `<div class="banner">Data gagal dimuat (${esc(e.message)}). Jalankan dashboard lewat <code>python run_dashboard.py</code> (server lokal), bukan dengan membuka index.html langsung.</div>`; return; }
  if (typeof Chart !== 'undefined') { Chart.defaults.font.family = 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif'; Chart.defaults.font.size = 12; }
  await show(location.hash.slice(1) || 'beranda');
}
document.addEventListener('DOMContentLoaded', init);
