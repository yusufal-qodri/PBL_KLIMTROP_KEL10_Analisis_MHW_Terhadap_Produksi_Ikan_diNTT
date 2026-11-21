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
const ST_ALIAS = { 'mhw-anomali': 'mhw', 'mhw-durasi': 'mhw' };
const stOf = page => { const k = ST_ALIAS[page] || page; return (S.st[k] = S.st[k] || {}); };

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
  return `<div class="legend"><div class="bar" style="background:${cssGrad(def.cmap)}"></div><div class="t"><span>${def.labelLo || f(def.min)}</span><span>${def.labelHi || (f(def.max) + ' ' + (def.unit || '') + (def.log ? ', skala log' : ''))}</span></div></div>`;
}

/* ---------- data ---------- */
async function loadDatasets() {
  const files = [['meta','metadata'],['annual','annual_summary'],['events','mhw_events'],['evs','mhw_events_spatial'],['doy','climatology_doy'],['monthly','monthly_climatology'],['grids','spatial_grids'],['series','daily_regional_series'],['chl','chla_analysis'],['fish','fisheries_data'],['syn','synthesis_methodology'],['coast','ntt_coastline']];
  await Promise.all(files.map(async ([k, f]) => {
    try { const r = await fetch(`data/${f}.${f === 'ntt_coastline' ? 'geojson' : 'json'}`); S.D[k] = JSON.parse((await r.text()).replace(/\bNaN\b/g, 'null')); }
    catch (e) { console.error('Gagal memuat', f, e); }
  }));
  /* teks bawaan data (JSON) ikut mengikuti penulisan baru */
  const fixTxt = x => {
    if (typeof x === 'string') return x.replace(/\bMHW\b/g, 'Marine Heatwaves').replace(/\s*·\s*/g, ', ');
    if (Array.isArray(x)) { for (let i = 0; i < x.length; i++) x[i] = fixTxt(x[i]); return x; }
    if (x && typeof x === 'object') { for (const k in x) x[k] = fixTxt(x[k]); return x; }
    return x;
  };
  for (const k of ['meta', 'annual', 'events', 'evs', 'monthly', 'chl', 'fish', 'syn']) if (S.D[k]) fixTxt(S.D[k]);
  S.ds = S.D.series || [];
  /* katalog utama = kejadian regional berbasis spasial (per grid, >=15% luas laut); katalog rata-rata regional hanya pembanding */
  S.events = (S.D.evs || []).slice().sort((a, b) => a.event_id - b.event_id);
  S.events1d = (S.D.events || []).slice().sort((a, b) => a.event_id - b.event_id);
  S.mhwSet = new Set(S.ds.filter(x => x.is_mhw_spatial).map(x => x.date));
  S.an = {};
  for (const [k, f] of [['extent', 'daily_extent'], ['check', 'catalog_check'], ['grid', 'grid_stats'], ['pooled', 'pooled'], ['evg', 'event_grid_stats']]) {
    try { const r = await fetch(`data/analysis/${f}.json`); if (r.ok) S.an[k] = JSON.parse((await r.text()).replace(/\bNaN\b/g, 'null')); } catch (e) { /* opsional */ }
  }
  const g = S.D.grids;
  if (g && g.sst_mean_all) {
    NR = g.sst_mean_all.length;
    NC = g.sst_mean_all[0].length;
    CELLS = NR * NC;
    S.landCell = g.sst_mean_all.map(r => r.map(v => v == null));
  }
  if (S.D.meta && S.D.meta.region) {
    const reg = S.D.meta.region;
    if (reg.lat_coords && reg.lat_coords.length) {
      NR = reg.lat_coords.length;
      LAT0 = reg.lat_coords[0];
      if (reg.lat_coords.length > 1) STEP = Math.round(Math.abs(reg.lat_coords[1] - reg.lat_coords[0]) * 1000) / 1000;
    }
    if (reg.lon_coords && reg.lon_coords.length) {
      NC = reg.lon_coords.length;
      LON0 = reg.lon_coords[0];
    }
    CELLS = NR * NC;
  }
  try {
    const r = await fetch('data/grids/manifest.json');
    if (r.ok) {
      S.pack = await r.json();
      S.pack.files = {};
      if (S.pack.shape) {
        NR = S.pack.shape[0];
        NC = S.pack.shape[1];
        CELLS = NR * NC;
      }
      if (S.pack.lat && S.pack.lat.length) {
        LAT0 = S.pack.lat[0];
        if (S.pack.lat.length > 1) STEP = Math.round(Math.abs(S.pack.lat[1] - S.pack.lat[0]) * 1000) / 1000;
      }
      if (S.pack.lon && S.pack.lon.length) {
        LON0 = S.pack.lon[0];
      }
      await probePack();
    }
  } catch (e) { S.pack = null; /* mode terbatas */ }
}
async function probePack() {
  const bad = why => { S.packIssue = why; S.pack = null; };
  const hint = ' Unduh script terbaru dan jalankan ulang: python dashboard/tools/build_daily_grids.py';
  try {
    const st = S.pack.stats;
    if (st && st.sst_valid_pct < 5) return bad('Data pack ditemukan tetapi SST-nya kosong (' + st.sst_valid_pct + '% valid).' + hint);
    const a = await packYear('sst', 2016); let v = 0, n = 0;
    for (let i = 0; i < a.length; i += 97) { n++; if (a[i] !== NOD) v++; }
    if (!n || v / n < 0.05) return bad('Data pack ditemukan tetapi isinya kosong (kemungkinan stempel waktu NetCDF jam 12:00 tidak cocok pada versi lama script).' + hint);
  } catch (e) { bad('Data pack tidak lengkap (' + e.message + ').' + hint); }
}
const meta = () => S.D.meta;
const extPct = d => S.an && S.an.extent ? S.an.extent.member_pct[diffDays(START, d)] : null;
const isRegDay = d => { const v = extPct(d); return v == null ? null : v >= S.an.extent.threshold_pct; };
const chkOf = id => S.an && S.an.check && S.an.check.events ? S.an.check.events.find(e => e.event_id === Number(id)) : null;
let LAT0 = -11.975, LON0 = 118.025, STEP = 0.05, NR = 90, NC = 160, CELLS = NR * NC;
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
const NOD = -32768;
const sc = kind => (S.pack.scale || { sst: 100, chla: 1000 })[kind];
async function winAgg(start, end, pad = 0, filter = null) {
  /* satu lintasan per grid. Definisi (selaras scripts/detect_mhw.py):
     hari Marine Heatwaves sel = SST > P90 pada hari anggota kejadian (mask); hari jeda (anggota tetapi SST <= P90) TIDAK dihitung Marine Heatwaves;
     hari non-Marine Heatwaves sel = bukan anggota kejadian.
     Anomali kejadian (per grid) = rata-rata SST pada hari-hari periode kejadian dikurangi rata-rata SST pada tanggal kalender
     yang sama selama 2000-2020 (klimatologi harian sederhana, sst_daymean_doy.bin). filter(tanggal) opsional: hanya hari terpilih. */
  start = clampDate(start); end = clampDate(end);
  const F = () => new Float64Array(CELLS), U = () => new Uint16Array(CELLS);
  const o = { sstSum: F(), sstN: U(), anSum: F(), anN: U(), chSum: F(), chN: U(), caSum: F(), caN: U(),
    strictMax: new Float32Array(CELLS).fill(-1), strictDays: U(), memDays: U(),
    anMSum: F(), anMN: U(), chMSum: F(), chMN: U(), caMSum: F(), caMN: U(),
    anNSum: F(), anNN: U(), chNSum: F(), chNN: U(), caNSum: F(), caNN: U(),
    adSum: F(), adN: U(), adMax: new Float32Array(CELLS).fill(-99), adMSum: F(), adMN: U(), memRun: U(), memMaxRun: U(),
    days: [], dayAnom: [], dayAnomM: [], dayCells: [], noDaymean: false, sstValid: 0, nDays: 0 };
  const clim = await packFile('clim_doy.bin', Int16Array), base = await packFile('chla_base_doy.bin', Int16Array), thr = await packFile('thresh_doy.bin', Int16Array);
  let dm = null; try { dm = await packFile('sst_daymean_doy.bin', Int16Array); } catch (e) { dm = null; } o.noDaymean = !dm;
  const a0 = clampDate(addDays(start, -pad)), b0 = clampDate(addDays(end, pad)), y0 = +a0.slice(0, 4), y1 = +b0.slice(0, 4), ssc = sc('sst'), csc = sc('chla');
  for (let y = y0; y <= y1; y++) {
    const [sst, chl, msk] = await Promise.all([packYear('sst', y), packYear('chla', y), packYear('mask', y)]);
    const a = y === y0 ? a0 : `${y}-01-01`, b = y === y1 ? b0 : `${y}-12-31`;
    for (let d = a; d <= b; d = addDays(d, 1)) {
      const off = (doy(d) - 1) * CELLS, W = d >= start && d <= end && (!filter || filter(d));
      let ds = 0, dn = 0, dsm = 0, dnm = 0, dcells = 0; if (W) o.nDays++;
      for (let c = 0; c < CELLS; c++) {
        const s = sst[off + c], cl = clim[off + c], tv = thr[off + c], mem = msk[off + c] === 1;
        let strict = false, an = null, ad = null;
        if (s !== NOD) {
          if (cl !== NOD) an = (s - cl) / ssc;
          if (dm && dm[off + c] !== NOD) ad = (s - dm[off + c]) / ssc;
          strict = mem && tv !== NOD && s > tv;
          if (ad != null) { ds += ad; dn++; if (strict) { dsm += ad; dnm++; } }
          if (strict) dcells++;
        }
        if (!W) continue;
        if (mem) { o.memDays[c]++; if (++o.memRun[c] > o.memMaxRun[c]) o.memMaxRun[c] = o.memRun[c]; } else o.memRun[c] = 0;
        if (s !== NOD) {
          o.sstSum[c] += s / ssc; o.sstN[c]++; o.sstValid++;
          if (an != null) { o.anSum[c] += an; o.anN[c]++; }
          if (ad != null) { o.adSum[c] += ad; o.adN[c]++; if (ad > o.adMax[c]) o.adMax[c] = ad; if (strict) { o.adMSum[c] += ad; o.adMN[c]++; } }
          if (strict) { o.strictDays[c]++; if (an != null) { if (an > o.strictMax[c]) o.strictMax[c] = an; o.anMSum[c] += an; o.anMN[c]++; } }
          else if (!mem && an != null) { o.anNSum[c] += an; o.anNN[c]++; }
        }
        const h = chl[off + c];
        if (h !== NOD) {
          const hv = h / csc, bb = base[off + c], ca = bb !== NOD ? (h - bb) / csc : null;
          o.chSum[c] += hv; o.chN[c]++; if (ca != null) { o.caSum[c] += ca; o.caN[c]++; }
          if (strict) { o.chMSum[c] += hv; o.chMN[c]++; if (ca != null) { o.caMSum[c] += ca; o.caMN[c]++; } }
          else if (!mem && s !== NOD) { o.chNSum[c] += hv; o.chNN[c]++; if (ca != null) { o.caNSum[c] += ca; o.caNN[c]++; } }
        }
      }
      o.days.push(d); o.dayAnom.push(dn ? ds / dn : null); o.dayAnomM.push(dnm ? dsm / dnm : null); o.dayCells.push(dcells);
    }
  }
  return o;
}
const toGrid = (arr, fn) => Array.from({ length: NR }, (_, r) => Array.from({ length: NC }, (_, c) => fn(r * NC + c)));
const isLand = i => S.landCell && S.landCell[Math.floor(i / NC)] ? S.landCell[Math.floor(i / NC)][i % NC] : false;
function aggGrid(o, what) {
  const avg = (s, n) => i => n[i] ? s[i] / n[i] : null;
  switch (what) {
    case 'sstMean': return toGrid(0, avg(o.sstSum, o.sstN));
    case 'sstAnom': return toGrid(0, avg(o.anSum, o.anN));
    case 'chlMean': return toGrid(0, avg(o.chSum, o.chN));
    case 'chlAnom': return toGrid(0, avg(o.caSum, o.caN));
    case 'mhwMax': return toGrid(0, i => isLand(i) ? null : (o.strictDays[i] ? o.strictMax[i] : 0));
    case 'mhwDays': return toGrid(0, i => isLand(i) ? null : o.strictDays[i]);
    case 'noMhw': return toGrid(0, i => !isLand(i) && o.strictDays[i] === 0);          // sel tanpa hari Marine Heatwaves pada periode
    case 'sstAnomM': return toGrid(0, avg(o.anMSum, o.anMN));
    case 'chlMeanM': return toGrid(0, avg(o.chMSum, o.chMN));
    case 'chlAnomM': return toGrid(0, avg(o.caMSum, o.caMN));
    case 'sstAnomN': return toGrid(0, i => o.memDays[i] ? null : (o.anNN[i] ? o.anNSum[i] / o.anNN[i] : null));
    case 'chlMeanN': return toGrid(0, i => o.memDays[i] ? null : (o.chNN[i] ? o.chNSum[i] / o.chNN[i] : null));
    case 'chlAnomN': return toGrid(0, i => o.memDays[i] ? null : (o.caNN[i] ? o.caNSum[i] / o.caNN[i] : null));
    case 'anoMean': return toGrid(0, i => o.adN[i] ? o.adSum[i] / o.adN[i] : null);                 // seluruh hari periode, semua grid
    case 'anoMax': return toGrid(0, i => o.adN[i] ? o.adMax[i] : null);
    case 'durRun': return toGrid(0, i => isLand(i) ? null : o.memMaxRun[i]);                          // durasi beruntun terpanjang (anggota kejadian, termasuk jeda)
    case 'hasMem': return toGrid(0, i => !isLand(i) && o.memDays[i] > 0);              // sel anggota kejadian (termasuk jeda)
  }
}
function pooled(o, grp) {
  /* gabungan seluruh sel-hari: grp 'M' = hari Marine Heatwaves (di atas P90), 'N' = hari non-Marine Heatwaves pada sel yang tidak punya hari anggota kejadian */
  let n = 0, s = 0, na = 0, sa = 0, cells = 0, nt = 0, st = 0;
  for (let i = 0; i < CELLS; i++) {
    if (grp === 'N' && o.memDays[i]) continue;
    const cn = grp === 'M' ? o.chMN[i] : o.chNN[i], cs = grp === 'M' ? o.chMSum[i] : o.chNSum[i], an = grp === 'M' ? o.caMN[i] : o.caNN[i], as = grp === 'M' ? o.caMSum[i] : o.caNSum[i];
    const tn = grp === 'M' ? o.anMN[i] : o.anNN[i], ts = grp === 'M' ? o.anMSum[i] : o.anNSum[i];
    if (cn) { n += cn; s += cs; cells++; } if (an) { na += an; sa += as; } if (tn) { nt += tn; st += ts; }
  }
  return { cells, n, chl: n ? s / n : null, anom: na ? sa / na : null, sstAnom: nt ? st / nt : null, sstN: nt };
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
const MAPG = { ML: 46, MT: 8, MR: 10, MB: 28, W: 800, H: 450, SC: 2 };
const LON_MIN = 118.0, LON_MAX = 126.0, LAT_MIN = -12.0, LAT_MAX = -7.5;
const LON_SPAN = LON_MAX - LON_MIN, LAT_SPAN = LAT_MAX - LAT_MIN;
const LABELS = [['Sumba', 120.0, -9.75], ['Flores', 121.6, -8.55], ['Timor', 125.0, -9.7], ['Laut Sawu', 122.0, -9.95], ['Laut Flores', 120.4, -7.65]];

function gridAt(grid, lat, lon) {
  if (!grid) return { r: 0, c: 0, v: null };
  const c = Math.round((lon - LON0) / STEP), r = Math.round((lat - LAT0) / STEP);
  if (r < 0 || c < 0 || r >= NR || c >= NC || !grid[r]) return { r, c, v: null };
  return { r, c, v: grid[r][c] };
}

function drawMap(canvas, grid, def, opts = {}) {
  const { ML, MT, MR, MB, W, H, SC } = MAPG, TW = ML + W + MR, TH = MT + H + MB;
  canvas.width = TW * SC; canvas.height = TH * SC;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.setTransform(SC, 0, 0, SC, 0, 0);
  ctx.fillStyle = '#EAF1F5'; ctx.fillRect(0, 0, TW, TH);

  // Coordinate mappers — fixed to exact data bounds
  const X = lon => ML + (lon - LON_MIN) / LON_SPAN * W;
  const Y = lat => MT + (LAT_MAX - lat) / LAT_SPAN * H;

  // --- (1) Raster layer ---
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const octx = off.getContext('2d');
  if (octx && octx.createImageData && grid) {
    const cmap = (def && def.cmap) || 'rdylbu';
    const img = octx.createImageData(W, H), px = img.data, L = lut(cmap), lg = !!(def && def.log);
    const minVal = (def && def.min != null) ? def.min : 0;
    const maxVal = (def && def.max != null) ? def.max : 1;
    const lo = lg ? Math.log(Math.max(1e-6, minVal)) : minVal, hi = lg ? Math.log(Math.max(1e-6, maxVal)) : maxVal, span = hi - lo || 1;
    for (let y = 0; y < H; y++) {
      const lat = LAT_MAX - (y + .5) / H * LAT_SPAN, gy = (lat - LAT0) / STEP, j0 = Math.floor(gy), fy = gy - j0;
      for (let x = 0; x < W; x++) {
        const lon = LON_MIN + (x + .5) / W * LON_SPAN, gx = (lon - LON0) / STEP, i0 = Math.floor(gx), fx = gx - i0, p = (y * W + x) * 4;
        if (gy < -0.5 || gy > NR - 0.5 || gx < -0.5 || gx > NC - 0.5) { px[p + 3] = 0; continue; }
        const nr0 = Math.min(NR - 1, Math.max(0, Math.round(gy))), nc0 = Math.min(NC - 1, Math.max(0, Math.round(gx)));
        if (def && def.neutral && def.neutral[nr0] && def.neutral[nr0][nc0]) { px[p] = 241; px[p + 1] = 238; px[p + 2] = 226; px[p + 3] = 255; continue; }
        if (def && def.nearest) {
          const v0 = grid[nr0] ? grid[nr0][nc0] : null;
          if (v0 == null || Number.isNaN(v0)) { px[p + 3] = 0; continue; }
          const t0 = Math.min(1, Math.max(0, (v0 - lo) / span)), k0 = Math.round(t0 * 255) * 3; px[p] = L[k0]; px[p + 1] = L[k0 + 1]; px[p + 2] = L[k0 + 2]; px[p + 3] = 255; continue;
        }
        let sw = 0, sv = 0;
        for (let dj = 0; dj < 2; dj++) for (let di = 0; di < 2; di++) {
          const r = Math.min(NR - 1, Math.max(0, j0 + dj)), c = Math.min(NC - 1, Math.max(0, i0 + di)), v = grid[r] ? grid[r][c] : null;
          if (v == null || Number.isNaN(v)) continue;
          const w = (di ? fx : 1 - fx) * (dj ? fy : 1 - fy); sw += w; sv += w * v;
        }
        if (sw < 1e-6) { px[p + 3] = 0; continue; }
        let v = sv / sw; if (lg) v = Math.log(Math.max(v, def.min));
        const t = Math.min(1, Math.max(0, (v - lo) / span)), k = Math.round(t * 255) * 3;
        px[p] = L[k]; px[p + 1] = L[k + 1]; px[p + 2] = L[k + 2]; px[p + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(off, ML, MT, W, H);
  }

  // --- (2) Cloud/ocean no-data hatch for ocean pixels with no data ---
  if (grid && S.landCell) {
    const nodata = document.createElement('canvas'); nodata.width = W; nodata.height = H;
    const nctx = nodata.getContext('2d');
    if (nctx && nctx.createImageData) {
      const nim = nctx.createImageData(W, H), np = nim.data;
      for (let y = 0; y < H; y++) {
        const lat = LAT_MAX - (y + .5) / H * LAT_SPAN, gy = (lat - LAT0) / STEP;
        for (let x = 0; x < W; x++) {
          const lon = LON_MIN + (x + .5) / W * LON_SPAN, gx = (lon - LON0) / STEP, p = (y * W + x) * 4;
          if (gy < -0.5 || gy > NR - 0.5 || gx < -0.5 || gx > NC - 0.5) continue;
          const nr0 = Math.min(NR - 1, Math.max(0, Math.round(gy))), nc0 = Math.min(NC - 1, Math.max(0, Math.round(gx)));
          if (S.landCell[nr0] && S.landCell[nr0][nc0]) continue; // land — GeoJSON covers it
          const row = grid[nr0]; const val = row ? row[nc0] : null;
          if (val == null || Number.isNaN(val)) {
            const hv = ((x + y) % 12) < 3;
            np[p] = hv ? 174 : 210; np[p + 1] = hv ? 183 : 215; np[p + 2] = hv ? 190 : 220; np[p + 3] = 220;
          }
        }
      }
      nctx.putImageData(nim, 0, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(ML, MT, W, H); ctx.clip();
      ctx.drawImage(nodata, ML, MT, W, H);
      ctx.restore();
    }
  }

  ctx.save(); ctx.beginPath(); ctx.rect(ML, MT, W, H); ctx.clip();

  // --- (3) Grid lines ---
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = .6;
  for (const lo of [118, 120, 122, 124, 126]) { ctx.beginPath(); ctx.moveTo(X(lo), MT); ctx.lineTo(X(lo), MT + H); ctx.stroke(); }
  for (const la of [-8, -9, -10, -11, -12]) { ctx.beginPath(); ctx.moveTo(ML, Y(la)); ctx.lineTo(ML + W, Y(la)); ctx.stroke(); }

  // --- (4) Land polygons from GeoJSON (smooth, drawn OVER raster) ---
  const feats = (S.D.coast && S.D.coast.features) || [];
  ctx.fillStyle = '#E6E6E6'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // Pass 1: fill all land polygons to cleanly mask raster artifacts at coast
  for (const f of feats) {
    const g = f.geometry, polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    ctx.beginPath();
    for (const poly of polys) {
      for (const ring of poly) {
        ring.forEach(([lo, la], i) => i ? ctx.lineTo(X(lo), Y(la)) : ctx.moveTo(X(lo), Y(la)));
        ctx.closePath();
      }
    }
    ctx.fill('evenodd');
  }
  // Pass 2: stroke coastline on top for smooth, clean edges
  ctx.strokeStyle = '#555'; ctx.lineWidth = .85;
  for (const f of feats) {
    const g = f.geometry, polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    ctx.beginPath();
    for (const poly of polys) {
      for (const ring of poly) {
        ring.forEach(([lo, la], i) => i ? ctx.lineTo(X(lo), Y(la)) : ctx.moveTo(X(lo), Y(la)));
        ctx.closePath();
      }
    }
    ctx.stroke();
  }

  // --- (5) Geographic labels ---
  ctx.fillStyle = '#2B2B2B'; ctx.font = '600 11px system-ui,sans-serif'; ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  for (const [t, lo, la] of LABELS) {
    const sea = t.startsWith('Laut'); ctx.font = (sea ? 'italic 11px' : '600 11px') + ' system-ui,sans-serif';
    if (sea) { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(11,37,54,.75)'; ctx.strokeText(t, X(lo), Y(la)); ctx.fillStyle = '#fff'; }
    else { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.strokeText(t, X(lo), Y(la)); ctx.fillStyle = '#222'; }
    ctx.fillText(t, X(lo), Y(la));
  }
  ctx.restore();

  // --- (6) Border, axis ticks ---
  ctx.strokeStyle = '#8FA1AE'; ctx.lineWidth = 1; ctx.strokeRect(ML, MT, W, H);
  ctx.fillStyle = '#4A5D6B'; ctx.font = '11px system-ui,sans-serif';
  ctx.textAlign = 'center'; for (const lo of [118, 120, 122, 124, 126]) ctx.fillText(lo + '°BT', X(lo), MT + H + 17);
  ctx.textAlign = 'right'; for (const la of [-8, -9, -10, -11, -12]) ctx.fillText(-la + '°LS', ML - 5, Y(la) + 4);

  canvas._grid = grid; canvas._def = def; canvas._fmt = opts.fmt;
  if (!canvas._wired) {
    canvas._wired = true;
    canvas.addEventListener('click', e => {
      const b = canvas.getBoundingClientRect(), sx = TW / b.width, mx = (e.clientX - b.left) * sx, my = (e.clientY - b.top) * sx;
      const lon = LON_MIN + (mx - ML) / W * LON_SPAN, lat = LAT_MAX - (my - MT) / H * LAT_SPAN, out = canvas.parentElement.parentElement.querySelector('.inspect');
      if (!out || lon < LON_MIN || lon > LON_MAX || lat < LAT_MIN || lat > LAT_MAX) return;
      const { r, c, v } = gridAt(canvas._grid, lat, lon), u = (canvas._def && canvas._def.unit) || '';
      const sub = typeof detectSubRegion === 'function' ? detectSubRegion(lat, lon) : '';
      out.textContent = `Sel ${fmt(Math.abs(LAT0 + r * STEP), 3)}°LS, ${fmt(LON0 + c * STEP, 3)}°BT${sub ? ', ' + sub : ''}: ` + (v == null ? (S.landCell && S.landCell[r] && S.landCell[r][c] ? 'daratan / tanpa data laut' : 'tanpa data (tertutup awan, tidak diisi nol)') : `${fmt(v, canvas._def ? canvas._def.dec ?? 3 : 3)} ${u}`);
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
function hasGaps(grid, def) { return grid.some((row, r) => row.some((v, c) => (v == null || Number.isNaN(v)) && !S.landCell[r][c] && !(def && def.neutral && def.neutral[r][c]))); }
function showMap(id, grid, def, opts) {
  const cv = $('#' + id); if (!cv) return;
  const parent = cv.parentElement;
  addTools(parent, 'map', id);
  let nodataEl = parent.querySelector('.nodata-msg');
  if (!grid || !gridVals(grid).length || (def && def.zeroNote && !gridVals(grid).some(v => v > 0))) {
    cv.style.display = 'none';
    const msg = (opts && opts.msg) || 'Data tidak tersedia untuk periode ini.';
    if (!nodataEl) {
      nodataEl = document.createElement('div');
      nodataEl.className = 'nodata nodata-msg';
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
  const lg = $('#' + id + '-lg');
  if (lg) lg.innerHTML = legendHTML(def) + (hasGaps(grid, def) ? '<div class="note" style="margin-top:4px">Arsir abu-abu = sel yang mengalami Marine Heatwaves lokal pada periode pembanding (dikecualikan).</div>' : '') + (def.neutralNote ? `<div class="note" style="margin-top:4px">${def.neutralNote}</div>` : '') + (def.zeroNote ? `<div class="note" style="margin-top:4px">${def.zeroNote}</div>` : '');
}
const DEF = {
  sst: (g, fixed) => { const [a, b] = fixed || rangeOf(g); return { cmap: 'rdylbu', min: a, max: b, unit: '°C', dec: 2 }; },
  chl: g => { const [a, b] = rangeOf(g, true); return { cmap: 'viridis', min: a, max: b, log: true, unit: 'mg/m³', dec: 3 }; },
  sstAnom: g => { const [a, b] = rangeOf(g, false, true); return { cmap: 'rdylbu', min: a, max: b, unit: '°C', dec: 2 }; },
  chlAnom: g => { const [a, b] = rangeOf(g, false, true); return { cmap: 'brbg', min: a, max: b, unit: 'mg/m³', dec: 3 }; },
  mhw: g => { const a = gridVals(g); return { cmap: 'ylorrd', min: 0, max: Math.max(...a, 0.5), unit: '°C', dec: 2, zeroNote: 'Warna paling pucat (0) = sel tidak mengalami Marine Heatwaves pada periode ini.' }; },
  days: g => { const a = gridVals(g); return { cmap: 'ylorrd', min: 0, max: Math.max(...a, 1), unit: 'hari', dec: 0 }; }
};
/* ---------- UI helper ---------- */
const seg = (key, opts, act, dis = []) => `<div class="seg" role="group">${opts.map(o => `<button data-set="${key}" data-val="${esc(o)}" class="${String(o) === String(act) ? 'on' : ''}" ${dis.includes(o) ? 'disabled title="Butuh data pack harian (lihat catatan di atas)"' : ''}>${o}</button>`).join('')}</div>`;
const kpi = (l, v, s) => `<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${s || ''}</div></div>`;
const card = (t, sub, inner, id = '') => `<section class="card" ${id ? `id="${id}"` : ''}><div class="card-h"><h2>${t}</h2><span>${sub || ''}</span></div>${inner}</section>`;
const kv = rows => `<div class="kv">${rows.map(([a, b]) => `<div>${a}</div><div>${b}</div>`).join('')}</div>`;
const pill = t => `<span class="pill">${t}</span>`;
const lab = t => `<div class="lab">${t}</div>`;
const CFG = {};
function cloneCfg(x) {
  if (Array.isArray(x)) return x.map(cloneCfg);
  if (x && typeof x === 'object') { const o = {}; for (const k in x) o[k] = cloneCfg(x[k]); return o; }
  return x;
}
function addTools(box, kind, id) {
  if (!box || box.querySelector(':scope > .tools')) return;
  const t = document.createElement('div'); t.className = 'tools';
  t.innerHTML = `<button type="button" data-tool="zoom" data-kind="${kind}" data-for="${id}" title="Perbesar / zoom">⤢ Perbesar</button><button type="button" data-tool="tab" data-kind="${kind}" data-for="${id}" title="Buka di tab baru">↗ Tab baru</button>`;
  box.appendChild(t);
}
function setBoxNodata(id, msg) {
  const el = $('#' + id); if (!el) return;
  const parent = el.parentElement;
  let nd = parent.querySelector('.nodata-msg');
  if (msg) {
    el.style.display = 'none';
    if (!nd) { nd = document.createElement('div'); nd.className = 'nodata nodata-msg'; parent.appendChild(nd); }
    nd.textContent = msg; nd.style.display = '';
  } else {
    if (nd) nd.style.display = 'none';
    el.style.display = '';
  }
}
function noGrid(cfg) {
  cfg.options = cfg.options || {};
  const sc = cfg.options.scales = cfg.options.scales || {};
  if (!sc.x) sc.x = {}; if (!sc.y) sc.y = {};
  for (const k in sc) sc[k].grid = Object.assign({}, sc[k].grid, { display: false, drawOnChartArea: false });
  return cfg;
}
function chart(id, cfg) {
  const el = $('#' + id); if (!el || typeof Chart === 'undefined') return null;
  setBoxNodata(id, null);
  noGrid(cfg);
  CFG[id] = cloneCfg(cfg);
  cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: false }, cfg.options || {});
  const c = new Chart(el, cfg); S.charts.push(c); addTools(el.parentElement, 'chart', id); return c;
}
const WHITE_BG = { id: 'whitebg', beforeDraw(c) { const x = c.canvas.getContext('2d'); x.save(); x.globalCompositeOperation = 'destination-over'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.canvas.width, c.canvas.height); x.restore(); } };
function bigCfg(cfg, w, h) {
  const c = cloneCfg(cfg); c.options = Object.assign({}, c.options, { responsive: false, animation: false, devicePixelRatio: 1, maintainAspectRatio: false });
  c.plugins = [WHITE_BG]; return c;
}
const chartTitle = id => { const el = $('#' + id), card = el && el.closest('.card'); const h = card && card.querySelector('h2'); return h ? h.textContent : 'Grafik'; };
function openInTab(makeBlob) {
  const win = window.open('', '_blank');
  makeBlob(blob => {
    const url = URL.createObjectURL(blob);
    if (win) win.location.href = url; else { const a = document.createElement('a'); a.href = url; a.download = 'gambar.png'; a.click(); }
  });
}
let modalChart = null;
function closeModal() { if (modalChart) { modalChart.destroy(); modalChart = null; } $('#modal').classList.add('hidden'); $('#modal-body').innerHTML = ''; }
function openModal(title) { $('#modal-title').textContent = title; $('#modal-tools').innerHTML = ''; $('#modal-body').innerHTML = ''; $('#modal').classList.remove('hidden'); }
function openImageModal(src, title) { openModal(title); $('#modal-body').innerHTML = `<img src="${src}" alt="${esc(title)}">`; }
function openChartModal(id) {
  const cfg = CFG[id]; if (!cfg || typeof Chart === 'undefined') return;
  openModal(chartTitle(id));
  $('#modal-body').innerHTML = '<div class="bigchart"><canvas id="modal-canvas"></canvas></div>';
  const c = cloneCfg(cfg); c.options = Object.assign({}, c.options, { responsive: true, maintainAspectRatio: false, animation: false });
  modalChart = new Chart($('#modal-canvas'), c);
  const n = (c.data.labels || []).length, xs = modalChart.options.scales && modalChart.options.scales.x;
  if (n > 20 && xs && !(xs.type && xs.type !== 'category')) {
    let lo = 0, hi = n - 1; const ch = modalChart;
    const apply = () => { ch.options.scales.x.min = lo; ch.options.scales.x.max = hi; ch.update('none'); };
    const zoom = (f, ctr = .5) => { const sp = hi - lo; const ns = Math.min(n - 1, Math.max(4, Math.round(sp * f))); lo = Math.round(lo + sp * ctr - ns * ctr); hi = lo + ns; if (lo < 0) { hi -= lo; lo = 0; } if (hi > n - 1) { lo = Math.max(0, lo - (hi - (n - 1))); hi = n - 1; } apply(); };
    const pan = f => { const sp = hi - lo, d = Math.round(sp * f); if (lo + d < 0 || hi + d > n - 1) return; lo += d; hi += d; apply(); };
    $('#modal-tools').innerHTML = '<button class="mbtn" data-z="in">＋ Zoom in</button><button class="mbtn" data-z="out">－ Zoom out</button><button class="mbtn" data-z="l">◀</button><button class="mbtn" data-z="r">▶</button><button class="mbtn" data-z="reset">Reset</button><span class="mhint">atau gulirkan roda mouse pada grafik</span>';
    $('#modal-tools').onclick = e => { const z = e.target.dataset.z; if (!z) return; if (z === 'in') zoom(.6); else if (z === 'out') zoom(1.6); else if (z === 'l') pan(-.3); else if (z === 'r') pan(.3); else { lo = 0; hi = n - 1; apply(); } };
    $('#modal-canvas').onwheel = e => { e.preventDefault(); const r = $('#modal-canvas').getBoundingClientRect(); zoom(e.deltaY < 0 ? .8 : 1.25, Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))); };
  }
}
function toolAction(btn) {
  const id = btn.dataset.for, kind = btn.dataset.kind, zoom = btn.dataset.tool === 'zoom';
  if (kind === 'map') {
    const cv = $('#' + id); if (!cv) return;
    const title = (cv.closest('.card') && cv.closest('.card').querySelector('h2') || {}).textContent || 'Peta';
    if (zoom) openImageModal(cv.toDataURL('image/png'), title); else openInTab(cb => cv.toBlob(cb, 'image/png'));
    return;
  }
  if (zoom) { openChartModal(id); return; }
  const cfg = CFG[id]; if (!cfg) return;
  openInTab(cb => {
    const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 900; const ch = new Chart(cv, bigCfg(cfg));
    cv.toBlob(b => { ch.destroy(); cb(b); }, 'image/png');
  });
}
const chartBox = (id, cls = '') => `<div class="chart ${cls}"><canvas id="${id}"></canvas></div>`;
const COL = { teal: '#0A7C8C', red: '#B52A1B', orange: '#E8A27C', green: '#35978F', navy: '#13607A', grey: '#8FA1AE' };

/* ---------- kejadian Marine Heatwaves ---------- */
const evById = id => S.events.find(e => e.event_id === Number(id));
function sortEv(mode) {
  const a = S.events.slice();
  if (mode === 'Terlama') a.sort((x, y) => y.duration - x.duration || y.i_cum - x.i_cum);
  else if (mode === 'Terkuat') a.sort((x, y) => y.i_max - x.i_max);
  else a.sort((x, y) => y.start_date.localeCompare(x.start_date));
  return a;
}
const evChip = (e, on) => `<button class="ev ${on ? 'on' : ''}" data-set="ev" data-val="${e.event_id}"><div class="a">Event #${e.event_id}</div><div class="a">cakupan ${fmt(e.peak_extent_pct, 0)}%</div><div class="b">${e.duration} hari</div><div class="c">${frange(e.start_date, e.end_date)}</div></button>`;
function stripInner(page) {
  const st = stOf(page), q = (st.q || '').toLowerCase().trim();
  return sortEv(st.sort || 'Terlama').filter(e => !q || `#${e.event_id} ${e.event_id} ${e.year} ${e.start_date} ${e.end_date}`.toLowerCase().includes(q)).map(e => evChip(e, e.event_id === Number(st.ev))).join('') || '<div class="note">Tidak ada kejadian yang cocok.</div>';
}
function evStrip(page) {
  const st = stOf(page);
  return `<section class="card"><div class="card-h"><h2>Pilih kejadian Marine Heatwaves</h2><span>semua ${S.events.length} kejadian (2000–2020), geser ke samping</span></div>
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
    const w = seriesRange(ws, we); if (w.length < win.length - 1 || w.some(x => S.mhwSet.has(x.date))) continue;
    if (w.filter(x => x.chla != null).length < w.length * .5) continue;
    cands.push({ year: y, start: ws, end: we, chl: mean(w.map(x => x.chla)), sst: mean(w.map(x => x.sst)), anom: mean(w.map(x => x.sst - x.clim)) });
  }
  m.cands = cands; m.base = mean(cands.map(c => c.chl)); m.baseSst = mean(cands.map(c => c.sst)); m.baseAnom = mean(cands.map(c => c.anom));
  m.delta = (m.chl != null && m.base != null) ? m.chl - m.base : null; m.pct = m.delta != null && m.base ? m.delta / m.base * 100 : null;
  return (evCache[ev.event_id] = m);
}
async function eventMaps(ev) {
  if (S.pack) {
    const o = await winAgg(ev.start_date, ev.end_date), ca = aggGrid(o, 'chlAnomM'), no = aggGrid(o, 'noMhw');
    return { mode: 'pack', mhw: aggGrid(o, 'mhwMax'), chl: gridVals(ca).length ? ca : null, chlMean: aggGrid(o, 'chlMeanM'), neutral: no, sstValid: o.sstValid, o };
  }
  const g = S.D.grids;
  if (!g || !g.sample_days) return { mode: 'none' };
  for (const sd of Object.values(g.sample_days)) if (sd.date >= ev.start_date && sd.date <= ev.end_date) {
    const mo = +sd.date.slice(5, 7), cm = g.sst_monthly ? g.sst_monthly[mo] : null, hm = g.chla_monthly ? g.chla_monthly[mo] : null;
    return { mode: 'sample', date: sd.date, mhw: sd.sst.map((r, i) => r.map((v, j) => v == null || !cm || cm[i][j] == null ? null : v - cm[i][j])), chl: sd.chla.map((r, i) => r.map((v, j) => v == null || !hm || hm[i][j] == null ? null : v - hm[i][j])) };
  }
  return { mode: 'none' };
}
const mhwMsg = r => r.sstValid ? 'Tidak ada sel yang di atas ambang Marine Heatwaves (P90) pada periode ini.' : 'Grid SST pada periode ini kosong. Jalankan ulang tools/build_daily_grids.py (versi terbaru).';
const NOPACK_MSG = 'Grid harian untuk periode ini belum dibuat. Jalankan tools/build_daily_grids.py (lihat catatan di atas) untuk mengaktifkan peta tiap kejadian.';
const NEUTRAL_NOTE = 'Krem = sel yang tidak punya hari  Marine Heatwaves (di atas P90) pada periode ini, bukan data yang hilang.';
async function paintEventMaps(ev, idA, idB, subA, subB) {
  const r = await eventMaps(ev), per = frange(ev.start_date, ev.end_date);
  if (r.mode === 'pack') {
    showMap(idA, r.mhw, DEF.mhw(r.mhw), { msg: mhwMsg(r) });
    if (r.chl) { showMap(idB, r.chl, { ...DEF.chlAnom(r.chl), neutral: r.neutral, neutralNote: NEUTRAL_NOTE }); $(subB).textContent = `anomali pada sel-hari Marine Heatwaves\n${per}`; }
    else { showMap(idB, r.chlMean, DEF.chl(r.chlMean), { msg: 'Chlorophyll a tidak tersedia pada sel-hari Marine Heatwaves periode ini (awan/tanpa data satelit).' }); $(subB).textContent = per; }
    $(subA).textContent = `Intensitas maks. per sel (di atas P90)\n${per}`;
  } else if (r.mode === 'sample') {
    showMap(idA, r.mhw, DEF.sstAnom(r.mhw)); showMap(idB, r.chl, DEF.chlAnom(r.chl));
    $(subA).textContent = `hari contoh ${fdate(r.date)}\nanomali vs klimatologi bulanan`; $(subB).textContent = `hari contoh ${fdate(r.date)}\nanomali vs klimatologi bulanan`;
  } else {
    showMap(idA, null, null, { msg: NOPACK_MSG }); showMap(idB, null, null, { msg: NOPACK_MSG });
    $(subA).textContent = per; $(subB).textContent = per;
  }
  return r;
}
const inEventDate = d => S.events.find(e => d >= e.start_date && d <= e.end_date);
function extentChart(id, ev, pad = 30) {
  const E = S.an && S.an.extent, cv = $('#' + id);
  if (!E) { setBoxNodata(id, 'Cakupan harian per grid belum dihitung. Jalankan tools/build_daily_grids.py (atau tools/grid_analysis.py) untuk menampilkan grafik ini.'); return; }
  const dates = []; for (let d = clampDate(addDays(ev.start_date, -pad)); d <= clampDate(addDays(ev.end_date, pad)); d = addDays(d, 1)) dates.push(d);
  const at = (arr, d) => arr[diffDays(START, d)], thr = E.threshold_pct;
  const top = Math.min(100, Math.max(30, Math.ceil(Math.max(...dates.map(d => at(E.member_pct, d))) * 1.15 / 10) * 10));
  chart(id, { data: { labels: dates, datasets: [
    { type: 'bar', label: 'Periode kejadian katalog', data: dates.map(d => inEventDate(d) ? top : null), backgroundColor: dates.map(d => at(E.member_pct, d) >= thr ? 'rgba(10,124,140,.16)' : 'rgba(255,176,0,.32)'), barPercentage: 1, categoryPercentage: 1, order: 9 },
    { type: 'line', label: 'Sel anggota kejadian (aturan Hobday, termasuk sel jeda)', data: dates.map(d => at(E.member_pct, d)), borderColor: COL.red, pointRadius: 0, borderWidth: 2 },
    { type: 'line', label: 'Sel yang benar-benar di atas P90', data: dates.map(d => at(E.strict_pct, d)), borderColor: '#F57C32', pointRadius: 0, borderWidth: 1.6 },
    { type: 'line', label: `Ambang kejadian regional (${thr}%)`, data: dates.map(() => thr), borderColor: '#222', borderDash: [5, 3], pointRadius: 0, borderWidth: 1.2 }] },
    options: { scales: { y: { min: 0, max: top, title: { display: true, text: '% sel laut' } }, x: { ticks: { maxTicksLimit: 8, callback(v) { return fdate(this.getLabelForValue(v)); } } } }, plugins: { legend: { position: 'bottom', labels: { boxWidth: 14, font: { size: 11 } } } } } });
}
const EXTENT_NOTE = '<p class="note" style="margin:6px 0 0">Pita biru = hari Marine Heatwaves regional (≥15% luas laut berstatus Marine Heatwaves).<br>Pita kuning = hari jeda: kejadian masih berlanjut karena aturan jeda ≤2 hari, tetapi cakupan &lt;15% sehingga <b>tidak dihitung sebagai hari Marine Heatwaves</b>.</p>';
function regionalEventChart(id, ev, pad = 30) {
  const a = addDays(ev.start_date, -pad), b = addDays(ev.end_date, pad), w = seriesRange(a, b);
  const lo = Math.floor(Math.min(...w.map(x => x.sst)) - .3), hi = Math.ceil(Math.max(...w.map(x => x.thresh)) + .3);
  chart(id, { data: { labels: w.map(x => x.date), datasets: [
    { type: 'bar', label: 'Awal / akhir kejadian katalog', data: w.map(x => (x.date === ev.start_date || x.date === ev.end_date) ? hi : null), backgroundColor: COL.navy, barPercentage: .35, categoryPercentage: 1, order: 9 },
    { type: 'line', label: 'SST rata-rata regional', data: w.map(x => x.sst), borderColor: COL.red, pointRadius: 0, borderWidth: 2 },
    { type: 'line', label: 'Klimatologi', data: w.map(x => x.clim), borderColor: COL.teal, pointRadius: 0, borderWidth: 1.5 },
    { type: 'line', label: 'Ambang P90 (rata-rata regional)', data: w.map(x => x.thresh), borderColor: '#E04A24', borderDash: [5, 3], pointRadius: 0, borderWidth: 1.5 }] },
    options: { scales: { y: { min: lo, max: hi, title: { display: true, text: '°C' } }, x: { ticks: { maxTicksLimit: 8, callback(v) { return fdate(this.getLabelForValue(v)); } } } }, plugins: { legend: { position: 'bottom', labels: { boxWidth: 14, font: { size: 11 } } } } } });
}
const REG_NOTE = '<p class="note" style="margin:6px 0 0">Ini rata-rata SST seluruh NTT sebagai konteks. Marine Heatwaves ditentukan per sel: rata-rata regional bisa di bawah ambang walau sebagian sel sedang Marine Heatwaves, jadi garis ini <b>bukan</b> penanda hari Marine Heatwaves.</p>';
const evGrid = id => S.an && S.an.evg ? S.an.evg.find(e => e.event_id === Number(id)) : null;

/* ---------- Beranda ---------- */
const P = {};
P.beranda = {
  title: 'Beranda', sub: 'Kejadian Marine Heatwaves terlama dan respon Chlorophyll a pada waktu yang sama (analisis per grid, Perairan NTT)',
  html() {
    const st = stOf('beranda'), top = sortEv('Terlama').slice(0, 5); if (!st.ev) st.ev = top[0].event_id;
    const ev = evById(st.ev), m = evMetrics(ev), ck = chkOf(ev.event_id), eg = evGrid(ev.event_id);
    const cards = top.map((e, i) => `<button class="ev ${e.event_id === ev.event_id ? 'on' : ''}" data-set="ev" data-val="${e.event_id}"><div class="a">Peringkat ${i + 1}, Event #${e.event_id}</div><div class="b">${e.duration} hari</div><div class="c">${frange(e.start_date, e.end_date)}</div><div class="a">Cakupan puncak ${fmt(e.peak_extent_pct, 0)}% luas laut, Imax +${fmt(e.i_max)} °C</div></button>`).join('');
    const k4 = eg && eg.anom_mean != null ? kpi('Anomali Chlorophyll a (sel-hari Marine Heatwaves)', (eg.anom_mean >= 0 ? '+' : '') + fmt(eg.anom_mean, 3) + ' mg/m³', `${fmt(eg.pct_cells_decrease, 0)}% sel mengalami penurunan (dari ${eg.cells_with_chl} sel)`) : kpi('Chlorophyll a saat event (rata-rata regional)', m.chl != null ? fmt(m.chl, 3) + ' mg/m³' : '—', m.base != null ? `tahun tanpa Marine Heatwaves (tanggal sama): ${fmt(m.base, 3)} (${m.pct >= 0 ? '+' : ''}${fmt(m.pct, 1)}%)` : 'tidak ada tahun pembanding');
    return `${card('5 kejadian Marine Heatwaves terlama', 'pilih salah satu, peta ikut berubah', `<div class="top5">${cards}</div>`)}
    <div class="note">${pill('Event #' + ev.event_id + ' (' + frange(ev.start_date, ev.end_date) + '), puncak ' + fdate(ev.peak_date))} Kedua peta memakai periode yang sama dengan kejadian terpilih dan dihitung per sel.</div>
    <div class="grid2">${mapCard('b-mhw', 'Peta Marine Heatwaves', '<span id="b-mhw-sub"></span>')}${mapCard('b-chl', 'Peta Chlorophyll a', '<span id="b-chl-sub"></span>')}</div>
    <div class="kpis">${kpi('Durasi kejadian', ev.duration + ' hari', ck ? `${ck.regional_days} hari Marine Heatwaves regional + ${ck.gap_days} hari jeda` : frange(ev.start_date, ev.end_date))}${kpi('Cakupan puncak', fmt(ev.peak_extent_pct, 1) + '%', 'rata-rata ' + fmt(ev.mean_extent_pct, 1) + '% luas perairan laut NTT')}${kpi('Intensitas maksimum (sel)', '+' + fmt(ev.i_max) + ' °C', 'rata-rata +' + fmt(ev.i_mean) + ' °C per sel-hari')}${k4}</div>
    <div class="grid2">${card('Cakupan Marine Heatwaves harian', 'per grid (% sel laut)', chartBox('b-ext') + EXTENT_NOTE)}${card('SST rata-rata regional', 'konteks, tidak menandai hari Marine Heatwaves', chartBox('b-chart') + REG_NOTE)}</div>
    <div class="note">Katalog utama: ${S.events.length} kejadian Marine Heatwaves regional berbasis spasial (per grid, ≥15% luas perairan laut NTT aktif Marine Heatwaves minimal 5 hari) selama 2000–2020. Filter waktu (harian–dekadal) ada di menu Sebaran Data. Klik sel peta untuk membaca nilainya.</div>`;
  },
  async mount() {
    const ev = evById(stOf('beranda').ev);
    $('#b-mhw').closest('.card').querySelector('h2').textContent = 'Peta Marine Heatwaves terkuat';
    $('#b-chl').closest('.card').querySelector('h2').textContent = 'Peta Chlorophyll a (anomali pada sel-hari Marine Heatwaves)';
    extentChart('b-ext', ev); regionalEventChart('b-chart', ev);
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
  const g = S.D.grids;
  if (!g) return null;
  const y = d.slice(0, 4), mo = +d.slice(5, 7);
  if (scale === 'Tahunan') return { sst: g.sst_annual ? g.sst_annual[y] : null, chl: g.chla_annual ? g.chla_annual[y] : null, note: `rata-rata tahunan ${y}` };
  if (scale === 'Bulanan') return { sst: g.sst_monthly ? g.sst_monthly[mo] : null, chl: g.chla_monthly ? g.chla_monthly[mo] : null, note: `klimatologi bulan ${MONF[mo - 1]} (rata-rata semua tahun 2000–2020), bukan bulan kalender tertentu` };
  if (scale === 'Dekadal') { const y1 = +y, k = y1 < 2010 ? '2000_2009' : y1 < 2020 ? '2010_2019' : '2020'; return { sst: g.sst_decadal ? g.sst_decadal[k] : null, chl: g.chla_decadal ? g.chla_decadal[k] : null, note: `rata-rata ${k.replace('_', '–')}` }; }
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
    const st = stOf('sebaran'); st.scale = st.scale || 'Harian'; st.stat = st.stat || 'Rata-rata'; st.date = st.date || '2016-06-25';
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
      <div class="kpis">${kpi('Periode dipilih', frange(a, b), st.scale.toLowerCase() + ', ' + n + ' hari')}${kpi('Ketersediaan data', '2000–2020', `SST ${S.ds.length} hari, Chlorophyll a ${S.ds.filter(x => x.chla != null).length} hari (rata-rata regional)`)}<div id="s-kpi1"></div><div id="s-kpi2"></div></div>`;
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

/* ---------- Peta Kejadian Marine Heatwaves ---------- */
function yearDays(y) {
  /* hari Marine Heatwaves regional = hari dengan cakupan >= ambang (analisis per grid); hari jeda dihitung terpisah */
  const per = new Array(12).fill(0), list = []; let tot = 0, cat = 0, gap = 0;
  for (const e of S.events) {
    const a = e.start_date < `${y}-01-01` ? `${y}-01-01` : e.start_date, b = e.end_date > `${y}-12-31` ? `${y}-12-31` : e.end_date;
    if (a > b) continue;
    list.push(e);
    for (let d = a; d <= b; d = addDays(d, 1)) { cat++; const rd = isRegDay(d); if (rd === false) gap++; else { per[+d.slice(5, 7) - 1]++; tot++; } }
  }
  return { per, list, tot, cat, gap, hasExt: !!(S.an && S.an.extent) };
}
const cellVals = (g, pred = v => v != null) => gridVals(g).filter(pred);
const MCFG = {
  int: { title: 'Peta Kejadian Marine Heatwaves : Intensitas Maksimum', sub: 'Intensitas Marine Heatwaves maksimum per grid pada tiap kejadian dan tiap tahun', color: '#E04A24', hist: 'Sebaran intensitas maks. per sel (°C)', unit: '°C' },
  ano: { title: 'Peta Kejadian Marine Heatwaves : Anomali SST', sub: 'Anomali SST per grid selama kejadian Marine Heatwaves terhadap rata-rata SST 21 tahun pada tanggal yang sama', color: '#E8A27C', hist: 'Sebaran anomali per sel (°C)', unit: '°C' },
  dur: { title: 'Peta Kejadian Marine Heatwaves : Durasi', sub: 'Durasi Marine Heatwaves per grid pada tiap kejadian dan tiap tahun', color: '#35978F', hist: 'Sebaran durasi per sel (hari)', unit: 'hari' }
};
const ANO_STATS = ['Rata-rata selama kejadian', 'Maksimum harian'], DUR_STATS = ['Durasi beruntun terpanjang', 'Jumlah hari Marine Heatwaves (di atas P90)'];
const ANO_NOTE = 'Rumus anomali SST per grid: SST′ᵢ = SST̄ᵢ,aktual − SST̄ᵢ,klimatologi. SST̄ᵢ,aktual merupakan rata-rata SST pada rentang tanggal kejadian, sedangkan SST̄ᵢ,klimatologi merupakan rata-rata SST pada tanggal kalender yang sama selama 2000–2020. Perhitungan dilakukan secara terpisah pada setiap grid.';
const DUR_NOTE = 'Durasi beruntun terpanjang = jumlah hari berturut-turut sel itu menjadi anggota kejadian Marine Heatwaves selama periode (termasuk jeda ≤2 hari).<br>Jumlah hari Marine Heatwaves = hari saat SST sel di atas P90 (tanpa hari jeda).';
const INT_NOTE = 'Intensitas maksimum per grid = anomali SST tertinggi (terhadap klimatologi P90 sel) pada hari-hari Marine Heatwaves sel itu selama periode.';
const NOTES = { int: INT_NOTE, ano: ANO_NOTE, dur: DUR_NOTE };
function mhwSpec(kind, st) {
  if (kind === 'ano') return { stat: st.anoStat || ANO_STATS[0], opts: ANO_STATS, key: 'anoStat' };
  if (kind === 'dur') return { stat: st.durStat || DUR_STATS[0], opts: DUR_STATS, key: 'durStat' };
  return null;
}
function mhwGrid(kind, o, st, scope) {
  /* kembalikan {grid, def, sub, msg} untuk hasil winAgg o; scope = teks periode */
  const sp = mhwSpec(kind, st), none = aggGrid(o, 'noMhw');
  if (kind === 'int') { const g = aggGrid(o, scope.year ? 'mhwDays' : 'mhwMax'); return { grid: g, def: scope.year ? DEF.days(g) : DEF.mhw(g), sub: scope.year ? 'jumlah hari di atas P90 per sel (tanpa hari jeda)' : `Intensitas maks. per sel (di atas P90)\n${scope.per}`, msg: mhwMsg({ sstValid: o.sstValid }) }; }
  if (kind === 'ano') {
    if (o.noDaymean) return { grid: null, msg: 'Klimatologi harian per grid belum dibuat. Jalankan python dashboard/tools/grid_analysis.py lalu muat ulang.' };
    const g = aggGrid(o, sp.stat.startsWith('Maks') ? 'anoMax' : 'anoMean');
    return { grid: g, def: DEF.sstAnom(g), sub: `${sp.stat.toLowerCase()}\n${scope.per}`, msg: 'Tidak ada data SST pada periode ini.' };
  }
  const g = aggGrid(o, sp.stat.startsWith('Durasi') ? 'durRun' : 'mhwDays'), gg = g.map(r => r.map(v => (v == null || v === 0) ? null : v)), mx = Math.max(2, ...gridVals(gg));
  return { grid: gg, def: { cmap: 'viridis', min: 1, max: mx, unit: 'hari', dec: 0, neutral: none, neutralNote: NEUTRAL_NOTE }, sub: `${sp.stat.toLowerCase()}\n${scope.per}`, msg: 'Tidak ada sel yang mengalami Marine Heatwaves pada periode ini.' };
}
function gridStatsHTML(kind, g, o) {
  const cfg = MCFG[kind];
  if (kind === 'ano') {
    const v = cellVals(g), s = vstats(v); if (!s) return '<div class="note">Tidak ada sel.</div>';
    const mc = o ? cellVals(g.map((r, ri) => r.map((x, ci) => o.strictDays[ri * NC + ci] > 0 ? x : null))) : [], sm = vstats(mc);
    return kv([['Sel dihitung', s.n], ['Anomali rata-rata semua sel', (s.mean >= 0 ? '+' : '') + fmt(s.mean, 2) + ' °C'], ['Median / maksimum', `${fmt(s.median, 2)} / ${fmt(s.max, 2)} °C`], ['Sel dengan anomali > 0', fmt(v.filter(x => x > 0).length / v.length * 100, 0) + '%'], ['Sel dengan anomali ≥ 1 °C', fmt(v.filter(x => x >= 1).length / v.length * 100, 0) + '%'], ['Sel yang Marine Heatwaves: anomali rata-rata', sm ? (sm.mean >= 0 ? '+' : '') + fmt(sm.mean, 2) + ` °C (${sm.n} sel)` : '—']]);
  }
  const v = cellVals(g, x => x != null && x > 0), s = vstats(v);
  if (!s) return '<div class="note">Tidak ada sel yang mengalami Marine Heatwaves pada periode ini.</div>';
  if (kind === 'dur') return kv([['Sel mengalami Marine Heatwaves', s.n], ['Durasi median', fmt(s.median, 0) + ' hari'], ['Durasi maksimum', fmt(s.max, 0) + ' hari'], ['Sel dengan ≥ 5 hari', fmt(v.filter(x => x >= 5).length / v.length * 100, 0) + '%'], ['Sel dengan ≥ 10 hari', fmt(v.filter(x => x >= 10).length / v.length * 100, 0) + '%'], ['Sel dengan ≥ 30 hari', fmt(v.filter(x => x >= 30).length / v.length * 100, 0) + '%']]);
  return kv([['Sel mengalami Marine Heatwaves', s.n], ['Intensitas maks. rata-rata', '+' + fmt(s.mean, 2) + ' °C'], ['Median', '+' + fmt(s.median, 2) + ' °C'], ['Persentil 90', '+' + fmt(s.p90, 2) + ' °C'], ['Maksimum', '+' + fmt(s.max, 2) + ' °C']]);
}
function mhwPage(kind) {
  const cfg = MCFG[kind];
  return {
    title: cfg.title, sub: cfg.sub,
    html() {
      const st = stOf('mhw'); if (!st.ev) st.ev = sortEv('Terlama')[0].event_id; if (!st.year) st.year = 2000;
      const ev = evById(st.ev), yd = yearDays(st.year), leap = (st.year % 4 === 0), tot = leap ? 366 : 365, ck = chkOf(ev.event_id), sp = mhwSpec(kind, st);
      const yrs = Array.from({ length: 21 }, (_, i) => 2000 + i).map(y => `<button data-set="year" data-val="${y}" class="${y === Number(st.year) ? 'on' : ''}">${y}</button>`).join('');
      const rows = yd.list.map(e => { const c = chkOf(e.event_id); return `<tr class="click ${e.event_id === ev.event_id ? 'on' : ''}" data-set="ev" data-val="${e.event_id}"><td>#${e.event_id}</td><td>${frange(e.start_date, e.end_date)}</td><td>${e.duration}</td><td>${c ? c.regional_days : '—'}</td><td>${c ? c.gap_days : '—'}</td><td>${fmt(e.peak_extent_pct, 0)}%</td></tr>`; }).join('');
      const kvs = [['Mulai', fdate(ev.start_date)], ['Puncak (cakupan terluas)', fdate(ev.peak_date)], ['Selesai', fdate(ev.end_date)], ['Durasi kejadian', ev.duration + ' hari']];
      if (ck) kvs.push(['Hari Marine Heatwaves regional (≥15% luas laut)', ck.regional_days + ' hari'], ['Hari jeda (cakupan <15%)', ck.gap_days + ' hari']);
      kvs.push(['Cakupan puncak', fmt(ev.peak_extent_pct, 1) + '% luas laut'], ['Cakupan rata-rata', fmt(ev.mean_extent_pct, 1) + '% luas laut'], ['Intensitas maksimum (sel)', '+' + fmt(ev.i_max) + ' °C']);
      const expl = !yd.list.length ? `<p style="font-size:15px;margin:0">Tidak ada kejadian Marine Heatwaves pada tahun ${st.year} (0 hari).</p>` :
        `<p style="font-size:15px;line-height:1.6;margin:0 0 10px">Pada tahun <b>${st.year}</b> terjadi <b>${yd.list.length} kejadian Marine Heatwaves regional</b> ` + (yd.hasExt ? `dengan <b>${yd.tot} hari Marine Heatwaves regional</b> (cakupan ≥15% luas laut; ${fmt(yd.tot / tot * 100, 1)}% dari ${tot} hari)${yd.gap ? `, ditambah ${yd.gap} hari jeda yang tidak dihitung sebagai Marine Heatwaves` : ''}.` : `dengan durasi kejadian total <b>${yd.cat} hari</b> (${fmt(yd.cat / tot * 100, 1)}% dari ${tot} hari; sudah termasuk hari jeda ≤2 hari). Jalankan tools/grid_analysis.py untuk memisahkan hari Marine Heatwaves regional dari hari jeda.`) + `</p><div id="y-stats"></div><div class="tw" style="max-height:190px;margin-top:8px"><table><thead><tr><th>Event</th><th>Periode</th><th>Durasi</th><th>Hari Marine Heatwaves</th><th>Jeda</th><th>Cakupan</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      const yearTitle = { int: 'Semua kejadian Marine Heatwaves tahun ', ano: 'Anomali SST pada kejadian Marine Heatwaves tahun ', dur: 'Durasi Marine Heatwaves per sel tahun ' }[kind] + st.year;
      return `${evStrip('mhw')}
      ${sp ? `<section class="card"><div class="row"><div>${lab(kind === 'ano' ? 'Ukuran anomali' : 'Ukuran durasi')}${seg(sp.key, sp.opts, sp.stat)}</div></div><p class="note" style="margin:8px 0 0">${NOTES[kind]}</p></section>` : `<div class="note">${NOTES[kind]}</div>`}
      <div class="grid2">${mapCard('m-ev', cfg.title.split(' : ')[1] + ' — kejadian #' + ev.event_id, '<span id="m-ev-sub"></span>')}${card('Detail kejadian', 'Event #' + ev.event_id, kv(kvs) + '<div class="lab" style="margin-top:12px">Statistik per grid</div><div id="m-stats"></div>')}</div>
      <div class="grid2">${card(cfg.hist, '', chartBox('m-hist'))}${card('Cakupan Marine Heatwaves harian per grid', '', chartBox('m-chart') + EXTENT_NOTE)}${kind === 'ano' ? `<div style="grid-column:1/-1">${card('Anomali SST harian (rata-rata sel)', '', chartBox('m-day'))}</div>` : ''}</div>
      <section class="card"><div class="card-h"><h2>Pilih tahun</h2><span>menampilkan semua kejadian Marine Heatwaves di tahun itu</span></div><div class="yrs">${yrs}</div></section>
      <div class="grid2">${mapCard('m-yr', yearTitle, '<span id="m-yr-sub"></span>')}${card('Penjelasan tahun ' + st.year, yd.list.length ? 'dihitung per grid' : '', expl)}</div>
      ${yd.list.length ? `<section class="card"><div class="card-h"><h2 id="m-bars-lab"></h2></div>${chartBox('m-bars')}</section>` : ''}`;
    },
    async mount() {
      const st = stOf('mhw'), ev = evById(st.ev), yd = yearDays(st.year), per = frange(ev.start_date, ev.end_date), sp = mhwSpec(kind, st);
      extentChart('m-chart', ev, 20);
      let r = null, o = null;
      if (S.pack) { o = await winAgg(ev.start_date, ev.end_date, kind === 'ano' ? 15 : 0); r = mhwGrid(kind, o, st, { per, year: false }); }
      if (r && r.grid) {
        showMap('m-ev', r.grid, r.def, { msg: r.msg }); $('#m-ev-sub').textContent = r.sub;
        $('#m-stats').innerHTML = gridStatsHTML(kind, r.grid, o);
        const vals = kind === 'ano' ? cellVals(r.grid) : cellVals(r.grid, x => x != null && x > 0);
        if (vals.length) chart('m-hist', histConfig(vals, MCFG[kind].color, MCFG[kind].unit)); else setBoxNodata('m-hist', 'Tidak ada sel yang mengalami Marine Heatwaves.');
        if (kind === 'ano' && o) {
          const top = Math.ceil(Math.max(...o.dayAnom.filter(v => v != null), ...o.dayAnomM.filter(v => v != null), 1));
          chart('m-day', { data: { labels: o.days, datasets: [
            { type: 'bar', label: 'Periode kejadian katalog', data: o.days.map(d => d >= ev.start_date && d <= ev.end_date ? top : null), backgroundColor: 'rgba(10,124,140,.12)', barPercentage: 1, categoryPercentage: 1, order: 9 },
            { type: 'line', label: 'Rata-rata semua sel', data: o.dayAnom, borderColor: COL.teal, pointRadius: 0, borderWidth: 2 },
            { type: 'line', label: 'Rata-rata sel yang sedang Marine Heatwaves', data: o.dayAnomM, borderColor: COL.red, pointRadius: 0, borderWidth: 2 }] },
            options: { scales: { y: { title: { display: true, text: '°C (SST − rata-rata 21 tahun)' } }, x: { ticks: { maxTicksLimit: 8, callback(v) { return fdate(this.getLabelForValue(v)); } } } }, plugins: { legend: { position: 'bottom', labels: { boxWidth: 14, font: { size: 11 } } } } } });
        }
      } else {
        const msg = r && r.msg ? r.msg : null;
        if (!S.pack && kind !== 'dur') { const q = await eventMaps(ev); if (q.mode === 'sample') { showMap('m-ev', q.mhw, DEF.sstAnom(q.mhw)); $('#m-ev-sub').textContent = `hari contoh ${fdate(q.date)}\nanomali vs klimatologi bulanan`; } else { showMap('m-ev', null, null, { msg: NOPACK_MSG }); $('#m-ev-sub').textContent = per; } }
        else { showMap('m-ev', null, null, { msg: msg || NOPACK_MSG }); $('#m-ev-sub').textContent = per; }
        for (const id of ['m-hist', 'm-day']) setBoxNodata(id, 'Butuh data pack harian.');
        $('#m-stats').innerHTML = '<div class="note">Butuh data pack harian dan analisis per grid.</div>';
      }
      // ---- peta tahun
      if (!yd.list.length) { showMap('m-yr', null, null, { msg: `Tidak ada kejadian Marine Heatwaves pada tahun ${st.year} (0 hari).` }); $('#m-yr-sub').textContent = ''; setBoxNodata('m-bars', 'Tidak ada kejadian Marine Heatwaves pada tahun ini.'); return; }
      const evDay = d => yd.list.some(e => d >= e.start_date && d <= e.end_date);
      if (S.pack) {
        const oy = await winAgg(`${st.year}-01-01`, `${st.year}-12-31`, 0, kind === 'ano' ? evDay : null), ry = mhwGrid(kind, oy, st, { per: `tahun ${st.year}`, year: true });
        if (kind === 'ano' && ry.grid) ry.sub = `${(sp.stat || '').toLowerCase()} pada hari-hari kejadian regional tahun ${st.year}`;
        if (kind === 'dur' && ry.grid) ry.sub = `${sp.stat.toLowerCase()}\ntahun ${st.year} (dipotong di batas tahun)`;
        showMap('m-yr', ry.grid, ry.def, { msg: ry.msg }); $('#m-yr-sub').textContent = ry.sub || '';
        if (ry.grid) $('#y-stats').innerHTML = gridStatsHTML(kind, ry.grid, oy);
        if (kind === 'ano') {
          const per2 = MON.map((_, mi) => mean(oy.days.map((d, i) => evDay(d) && +d.slice(5, 7) === mi + 1 ? oy.dayAnom[i] : null)));
          $('#m-bars-lab').textContent = 'Anomali SST rata-rata per bulan pada hari kejadian (°C)';
          chart('m-bars', { type: 'bar', data: { labels: MON, datasets: [{ data: per2, backgroundColor: MCFG.ano.color }] }, options: { plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: '°C' } } } } });
        } else if (kind === 'dur') {
          const per2 = MON.map((_, mi) => mean(oy.days.map((d, i) => +d.slice(5, 7) === mi + 1 ? oy.dayCells[i] : null)));
          $('#m-bars-lab').textContent = 'Rata-rata jumlah sel yang sedang Marine Heatwaves per hari, per bulan';
          chart('m-bars', { type: 'bar', data: { labels: MON, datasets: [{ data: per2, backgroundColor: MCFG.dur.color }] }, options: { plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: 'sel' } } } } });
        } else {
          $('#m-bars-lab').textContent = 'Hari Marine Heatwaves regional per bulan';
          chart('m-bars', { type: 'bar', data: { labels: MON, datasets: [{ data: yd.per, backgroundColor: '#E04A24' }] }, options: { plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: 'hari' }, ticks: { precision: 0 } } } } });
        }
      } else {
        if (kind === 'int') { const g = S.D.grids.total_mhw_days; showMap('m-yr', g, DEF.days(g)); $('#m-yr-sub').textContent = 'total 2000–2020 (grid per tahun butuh data pack)'; }
        else { showMap('m-yr', null, null, { msg: NOPACK_MSG }); $('#m-yr-sub').textContent = ''; }
        $('#m-bars-lab').textContent = 'Hari Marine Heatwaves regional per bulan';
        chart('m-bars', { type: 'bar', data: { labels: MON, datasets: [{ data: yd.per, backgroundColor: '#E04A24' }] }, options: { plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: 'hari' }, ticks: { precision: 0 } } } } });
      }
    }
  };
}
P.mhw = mhwPage('int'); P['mhw-anomali'] = mhwPage('ano'); P['mhw-durasi'] = mhwPage('dur');

/* ---------- Chlorophyll a vs Marine Heatwaves (dampak per kejadian) ---------- */
function offsetSeries(startDate, from, to, pick) {
  const i0 = diffDays(START, startDate), out = [];
  for (let o = from; o <= to; o++) { const x = S.ds[i0 + o]; out.push(x ? pick(x) : null); }
  return out;
}
const pFmt = p => p == null ? '—' : (p < 0.001 ? '< 0.001' : fmt(p, 3));
const GSN = { ALL: 'Seluruh periode', DJF: 'DJF (Monsun Barat)', MAM: 'MAM (Peralihan I)', JJA: 'JJA (Monsun Timur)', SON: 'SON (Peralihan II)' };
const PCT_NOTE = 'Pembanding dihitung per sel: sel-hari Marine Heatwaves (di atas P90) vs sel-hari non-Marine Heatwaves pada sel yang sama; hari jeda dikeluarkan dari kedua kelompok. Anomali memakai baseline harian non-Marine Heatwaves sehingga siklus musiman sudah dihilangkan.';
P.dampak = {
  title: 'Chlorophyll a vs Marine Heatwaves', sub: 'Dampak Marine Heatwaves terhadap Chlorophyll-a per grid pada periode tiap kejadian dengan memilih salah satu dari seluruh kejadian.',
  html() {
    const st = stOf('dampak'); if (!st.ev) st.ev = sortEv('Terlama')[0].event_id; st.gs = st.gs || 'ALL';
    const ev = evById(st.ev), m = evMetrics(ev), ca = S.D.chl, eg = evGrid(ev.event_id), A = S.an, hasG = !!(A && A.grid), pl = hasG && A.pooled ? A.pooled[st.gs] : null;
    const rows = S.events.map(e => {
      const g = evGrid(e.event_id), x = evMetrics(e), on = e.event_id === ev.event_id ? 'on' : '';
      return g ? `<tr class="click ${on}" data-set="ev" data-val="${e.event_id}"><td>#${e.event_id}</td><td>${frange(e.start_date, e.end_date)}</td><td>${e.duration}</td><td>${fmt(e.peak_extent_pct, 0)}%</td><td>${g.cells_mhw}</td><td>${g.chl_mean == null ? '—' : fmt(g.chl_mean, 3)}</td><td>${g.anom_mean == null ? '—' : (g.anom_mean >= 0 ? '+' : '') + fmt(g.anom_mean, 3)}</td><td>${g.pct_cells_decrease == null ? '—' : fmt(g.pct_cells_decrease, 0) + '%'}</td></tr>`
        : `<tr class="click ${on}" data-set="ev" data-val="${e.event_id}"><td>#${e.event_id}</td><td>${frange(e.start_date, e.end_date)}</td><td>${e.duration}</td><td>${fmt(e.peak_extent_pct, 0)}%</td><td>—</td><td>${fmt(x.chl, 3)}</td><td>${x.delta == null ? '—' : (x.delta >= 0 ? '+' : '') + fmt(x.delta, 3)}</td><td>—</td></tr>`;
    }).join('');
    const thead = evGrid(S.events[0].event_id) ? '<th>Event</th><th>Periode</th><th>Hari</th><th>Cakupan</th><th>Sel Marine Heatwaves</th><th>Chl sel-hari Marine Heatwaves</th><th>Anomali Chl</th><th>% sel turun</th>' : '<th>Event</th><th>Periode</th><th>Hari</th><th>Cakupan</th><th></th><th>Chl rata-rata regional</th><th>Selisih vs tahun non-Marine Heatwaves</th><th></th>';
    const kp = eg && eg.anom_mean != null
      ? `${kpi('Chlorophyll a pada sel-hari Marine Heatwaves', fmt(eg.chl_mean, 3) + ' mg/m³', eg.celldays + ' sel-hari, ' + eg.cells_with_chl + ' sel')}${kpi('Anomali vs baseline non-Marine Heatwaves', (eg.anom_mean >= 0 ? '+' : '') + fmt(eg.anom_mean, 3) + ' mg/m³', 'rata-rata seluruh sel-hari Marine Heatwaves')}${kpi('Sel dengan penurunan', fmt(eg.pct_cells_decrease, 0) + '%', 'dari sel yang mengalami Marine Heatwaves')}${kpi('Sel mengalami Marine Heatwaves', eg.cells_mhw, fmt(eg.cells_mhw / (S.an && S.an.extent ? S.an.extent.n_ocean_cells : (S.landCell ? S.landCell.flat().filter(x => !x).length : CELLS)) * 100, 0) + '% sel laut')}`
      : `${kpi('Chlorophyll a selama event', m.chl != null ? fmt(m.chl, 3) + ' mg/m³' : '—', 'rata-rata regional, ' + m.chlN + ' hari data')}${kpi('Baseline tanggal sama (tanpa Marine Heatwaves)', m.base != null ? fmt(m.base, 3) + ' mg/m³' : '—', m.cands.length + ' tahun pembanding')}${kpi('Selisih', m.pct != null ? (m.pct >= 0 ? '+' : '') + fmt(m.pct, 1) + '%' : '—', m.delta != null ? fmt(m.delta, 3) + ' mg/m³' : '')}${kpi('SST anomali event', '+' + fmt(m.anom) + ' °C', 'rata-rata regional')}`;
    const gridSec = !hasG ? card('Analisis per grid (seluruh kejadian)', '', '<div class="nodata">Analisis per grid belum dibuat. Jalankan <code>python dashboard/tools/grid_analysis.py</code> (otomatis dijalankan oleh build_daily_grids.py).</div>')
      : `<section class="card"><div class="card-h"><h2>Analisis per grid: Chlorophyll a saat Marine Heatwaves vs non-Marine Heatwaves</h2><span>seluruh kejadian 2000–2020</span></div><div class="row">${seg('gs', Object.keys(GSN), st.gs)}</div><p class="note" style="margin:8px 0 0">${GSN[st.gs]}: ${PCT_NOTE}</p></section>
      <div class="grid2">${mapCard('d-pct', 'Perubahan Chlorophyll a saat Marine Heatwaves (% terhadap baseline)', 'per sel')}${mapCard('d-dir', 'Arah perubahan yang signifikan', 'uji Mann-Whitney U per sel, koreksi FDR q < 0.05')}</div>
      ${pl ? `<div class="kpis">${kpi('Sel diuji', pl.cells_tested, 'minimal 10 hari Marine Heatwaves dan 10 hari non-Marine Heatwaves')}${kpi('Sel dengan penurunan', fmt(pl.pct_cells_decrease, 1) + '%', 'anomali rata-rata < 0')}${kpi('Penurunan signifikan', fmt(pl.pct_cells_sig_decrease, 1) + '%', 'q < 0.05, naik signifikan ' + fmt(pl.pct_cells_sig_increase, 1) + '%')}${kpi('Median perubahan sel', fmt(pl.median_cell_pct, 1) + '%', 'terhadap baseline sel itu')}</div>` : ''}`;
    let sum = '';
    if (hasG && A.pooled) {
      const srows = Object.keys(GSN).map(k => { const p = A.pooled[k]; return `<tr class="${k === st.gs ? 'on' : ''}"><td><b>${GSN[k]}</b></td><td>${p.n_mhw_celldays.toLocaleString('id-ID')}</td><td>${p.n_non_celldays.toLocaleString('id-ID')}</td><td>${fmt(p.chl_mhw_median, 3)}</td><td>${fmt(p.chl_non_median, 3)}</td><td>${(p.anom_mhw_mean >= 0 ? '+' : '') + fmt(p.anom_mhw_mean, 3)}</td><td>${fmt(p.pct_cells_decrease, 0)}%</td><td>${fmt(p.pct_cells_sig_decrease, 0)}%</td></tr>`; }).join('');
      const p0 = A.pooled.ALL;
      sum = `<div class="grid2">${card('Chlorophyll a rata-rata (seluruh sel-hari)', 'mg/m³', chartBox('d-sum', 's'))}${card('Ringkasan per grid', 'seluruh periode', kv([['Sel-hari Marine Heatwaves (di atas P90)', p0.n_mhw_celldays.toLocaleString('id-ID')], ['Sel-hari non-Marine Heatwaves', p0.n_non_celldays.toLocaleString('id-ID')], ['Rata-rata saat Marine Heatwaves', fmt(p0.chl_mhw_mean, 4) + ' mg/m³'], ['Rata-rata non-Marine Heatwaves', fmt(p0.chl_non_mean, 4) + ' mg/m³'], ['Anomali rata-rata saat Marine Heatwaves', (p0.anom_mhw_mean >= 0 ? '+' : '') + fmt(p0.anom_mhw_mean, 4) + ' mg/m³']]) + '<p class="note">Deskriptif; tidak diklaim sebagai hubungan sebab-akibat.</p>')}</div>
      ${card('Perbandingan per musim (per grid)', 'median Chlorophyll a (mg/m³)', `<div class="tw"><table><thead><tr><th>Musim</th><th>Sel-hari Marine Heatwaves</th><th>Sel-hari non-Marine Heatwaves</th><th>Median Marine Heatwaves</th><th>Median non-Marine Heatwaves</th><th>Anomali rata-rata Marine Heatwaves</th><th>% sel turun</th><th>% sel turun signifikan</th></tr></thead><tbody>${srows}</tbody></table></div>`)}`;
    } else {
      const sup = ca.suppression_summary;
      sum = card('Pendekatan rata-rata regional (cadangan)', 'hari katalog vs bukan', kv([['Hari Marine Heatwaves regional (data valid)', sup.mhw_n_days], ['Hari non-Marine Heatwaves', sup.non_mhw_n_days], ['Rata-rata Marine Heatwaves', fmt(sup.mhw_mean, 4) + ' mg/m³'], ['Rata-rata non-Marine Heatwaves', fmt(sup.non_mhw_mean, 4) + ' mg/m³'], ['Selisih', fmt(sup.diff_percent, 1) + '%']]) + '<p class="note">Dihitung dari rata-rata regional per hari dan masih mencakup hari jeda; gunakan analisis per grid bila sudah tersedia.</p>');
    }
    return `${evStrip('dampak')}
    <div class="note">${pill('Event #' + ev.event_id + ' (' + frange(ev.start_date, ev.end_date) + '), ' + ev.duration + ' hari')} Kedua peta menggunakan periode yang sama dengan kejadian terpilih, dengan perhitungan hanya dilakukan pada sel-hari Marine Heatwaves yang memiliki SST di atas P90. </div>
    <div class="grid2">${mapCard('d-mhw', 'Peta Marine Heatwaves', '<span id="d-mhw-sub"></span>')}${mapCard('d-chl', 'Peta Anomali Chlorophyll a ', '<span id="d-chl-sub"></span>')}</div>
    <div class="kpis">${kp}</div>
    ${card('Cakupan Marine Heatwaves harian dan respon Chlorophyll a', 'konteks regional', `<div class="grid2" style="gap:12px"><div>${chartBox('d-ext')}${EXTENT_NOTE}</div><div>${chartBox('d-chart')}<p class="note" style="margin:6px 0 0">Rata-rata regional Chlorophyll a, sejajar hari sejak onset; pita menandai hari Marine Heatwaves regional (≥15% luas laut) bila analisis per grid tersedia.</p></div></div>`)}
    ${gridSec}
    ${card('Dampak per kejadian', 'klik baris untuk memilih, per sel-hari Marine Heatwaves', `<div class="tw"><table><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table></div>`)}
    ${sum}`;
  },
  async mount() {
    const st = stOf('dampak'), ev = evById(st.ev), m = evMetrics(ev), A = S.an;
    await paintEventMaps(ev, 'd-mhw', 'd-chl', '#d-mhw-sub', '#d-chl-sub');
    extentChart('d-ext', ev, 30);
    const from = -15, to = ev.duration + 14, labels = []; for (let o = from; o <= to; o++) labels.push(o);
    const evS = offsetSeries(ev.start_date, from, to, x => x.chla), ds = [
      { type: 'bar', label: A && A.extent ? 'Hari Marine Heatwaves regional (≥15%)' : 'Periode kejadian katalog', data: labels.map(o => { const d = addDays(ev.start_date, o); if (o < 0 || o >= ev.duration) return null; const rd = isRegDay(d); return rd === false ? null : 1; }), backgroundColor: 'rgba(10,124,140,.16)', barPercentage: 1, categoryPercentage: 1, yAxisID: 'y2', order: 9 },
      { type: 'line', label: 'Event #' + ev.event_id, data: evS, borderColor: COL.red, pointRadius: 0, borderWidth: 2, spanGaps: false, yAxisID: 'y' }];
    if (m.cands.length) { const arr = m.cands.map(c => offsetSeries(c.start, from, to, x => x.chla)); ds.push({ type: 'line', label: 'Rata-rata tahun tanpa Marine Heatwaves (' + m.cands.length + ' th)', data: labels.map((_, i) => mean(arr.map(a => a[i]))), borderColor: COL.green, pointRadius: 0, borderWidth: 2, yAxisID: 'y' }); }
    chart('d-chart', { data: { labels, datasets: ds }, options: { scales: { y: { title: { display: true, text: 'mg/m³' } }, y2: { display: false, min: 0, max: 1 }, x: { title: { display: true, text: 'hari sejak onset' }, ticks: { maxTicksLimit: 10 } } }, plugins: { legend: { position: 'bottom', labels: { boxWidth: 14, font: { size: 11 } } } } } });
    if (A && A.grid) {
      const g = A.grid[st.gs], [lo, hi] = rangeOf(g.pct, false, true);
      showMap('d-pct', g.pct, { cmap: 'brbg', min: lo, max: hi, unit: '%', dec: 1 }, { msg: 'Tidak ada sel yang memenuhi syarat uji.' });
      showMap('d-dir', g.dir, { cmap: 'brbg', min: -1, max: 1, nearest: true, labelLo: 'Menurun signifikan', labelHi: 'Naik signifikan (putih = tidak signifikan)', dec: 0 }, { msg: 'Tidak ada sel yang memenuhi syarat uji.' });
      const c = $('#d-dir'); if (c) c._fmtDir = true;
    }
    if (A && A.pooled) {
      const p = A.pooled.ALL;
      chart('d-sum', { type: 'bar', data: { labels: [`Sel-hari Marine Heatwaves (${p.n_mhw_celldays.toLocaleString('id-ID')})`, `Sel-hari non-Marine Heatwaves (${p.n_non_celldays.toLocaleString('id-ID')})`], datasets: [{ data: [p.chl_mhw_mean, p.chl_non_mean], backgroundColor: [COL.red, COL.green] }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
    }
  }
};

/* ---------- Marine Heatwaves vs Non-Marine Heatwaves ---------- */
P.banding = {
  title: 'Perbandingan Marine Heatwaves vs Non-Marine Heatwaves', sub: 'Periode kejadian Marine Heatwaves dibandingkan dengan tanggal yang sama pada tahun tanpa Marine Heatwaves',
  html() {
    const st = stOf('banding'); if (!st.ev) st.ev = sortEv('Terlama')[0].event_id;
    const ev = evById(st.ev), m = evMetrics(ev), sy = +ev.start_date.slice(0, 4);
    if (!m.cands.length) return `${evStrip('banding')}${card('Tahun pembanding', '', '<p>Tidak ada tahun tanpa Marine Heatwaves pada rentang tanggal yang sama untuk kejadian ini.</p>')}`;
    if (!st.cmp || (st.cmp !== 'avg' && !m.cands.find(c => c.year === Number(st.cmp)))) st.cmp = String(m.cands.slice().sort((a, b) => Math.abs(a.year - sy) - Math.abs(b.year - sy))[0].year);
    const opts = ['avg', ...m.cands.map(c => String(c.year))];
    const cur = st.cmp === 'avg' ? null : m.cands.find(c => c.year === Number(st.cmp));
    const cmpLab = cur ? `${frange(cur.start, cur.end)}` : `rata-rata ${m.cands.length} tahun tanpa Marine Heatwaves`;
    const rows = m.cands.map(c => `<tr class="click ${cur && c.year === cur.year ? 'on' : ''}" data-set="cmp" data-val="${c.year}"><td>${c.year}</td><td>${frange(c.start, c.end)}</td><td>${fmt(c.chl, 3)}</td><td>${(c.anom >= 0 ? '+' : '') + fmt(c.anom)}</td></tr>`).join('');
    return `${evStrip('banding')}
    <section class="card"><div>${pill('Event #' + ev.event_id + ', ' + frange(ev.start_date, ev.end_date) + ' (' + ev.duration + ' hari)')} <span style="font-size:13px">dibandingkan dengan tanggal yang sama: <b>${cmpLab}</b> (tanpa Marine Heatwaves)</span></div>
    <div style="margin-top:10px">${lab('Tahun pembanding (otomatis hanya tahun tanpa kejadian Marine Heatwaves regional pada rentang tanggal yang sama)')}<div class="yrs">${opts.map(o => `<button data-set="cmp" data-val="${o}" class="${o === st.cmp ? 'on' : ''}" style="min-width:${o === 'avg' ? 240 : 56}px">${o === 'avg' ? 'Rata-rata semua tahun non-Marine Heatwaves' : o}</button>`).join('')}</div></div></section>
    <div class="grid2">${mapCard('c-a', 'A) SST anomali, sel-hari Marine Heatwaves', '<span id="c-a-sub"></span>')}${mapCard('c-b', 'B) Anomali Chlorophyll a, sel-hari Marine Heatwaves', '<span id="c-b-sub"></span>')}${mapCard('c-c', 'C) Anomali SST, tanpa Marine Heatwaves', '<span id="c-c-sub"></span>')}${mapCard('c-d', 'D) Anomali Chlorophyll a, tanpa Marine Heatwaves', '<span id="c-d-sub"></span>')}</div>
    <div class="kpis" id="c-kpis"></div>
    <div class="grid2">${card('SST rata-rata regional', 'konteks, sejajar hari sejak onset', chartBox('c-sst'))}${card('Chlorophyll a rata-rata regional', 'konteks, dalam mg/m³', chartBox('c-chl'))}</div>
    <div class="grid2">${card('Tahun pembanding yang tersedia', 'klik untuk memilih, rata-rata regional', `<div class="tw"><table><thead><tr><th>Tahun</th><th>Periode</th><th>Chl (mg/m³)</th><th>SST anomali °C</th></tr></thead><tbody>${rows}</tbody></table></div>`)}${card('Cara membaca', '', '<p class="note" style="font-size:13px">Peta A dan B hanya menampilkan sel-hari Marine Heatwaves (di atas P90) pada periode kejadian; sel yang tidak Marine Heatwaves diberi warna krem. Peta C dan D memakai tanggal kalender yang sama pada tahun yang tidak mengalami kejadian Marine Heatwaves regional, dan hanya sel yang sama sekali tidak anggota kejadian Marine Heatwaves pada periode itu; sel yang tetap mengalami Marine Heatwaves lokal di tahun pembanding dikecualikan (krem). Skala warna A–C dan B–D identik. Grafik regional hanya konteks. Pembandingan bersifat deskriptif, bukan pembuktian sebab-akibat.</p>')}</div>`;
  },
  async mount() {
    const st = stOf('banding'), ev = evById(st.ev), m = evMetrics(ev); if (!m.cands.length) return;
    const cur = st.cmp === 'avg' ? null : m.cands.find(c => c.year === Number(st.cmp)), per = frange(ev.start_date, ev.end_date);
    const wins = cur ? [cur] : m.cands, labC = cur ? frange(cur.start, cur.end) : `rata-rata ${wins.length} tahun`, kp = $('#c-kpis');
    const pc = (a, b) => (a != null && b ? (a - b) / b * 100 : null), sgn = v => (v >= 0 ? '+' : '') + fmt(v, 3);
    if (S.pack) {
      const oe = await winAgg(ev.start_date, ev.end_date), neu = aggGrid(oe, 'noMhw');
      const A = aggGrid(oe, 'sstAnomM'), B = aggGrid(oe, 'chlAnomM'), os = []; for (const c of wins) os.push(await winAgg(c.start, c.end));
      const mix = (what) => os.length === 1 ? aggGrid(os[0], what) : toGrid(0, i => mean(os.map(o => aggGrid(o, what)[Math.floor(i / NC)][i % NC])));
      const C = mix('sstAnomN'), D = mix('chlAnomN'), neuC = toGrid(0, i => !isLand(i) && C[Math.floor(i / NC)][i % NC] == null);
      const dS = DEF.sstAnom(A.concat(C)), dC = DEF.chlAnom(B.concat(D)), nn = { neutral: neu, neutralNote: NEUTRAL_NOTE }, nc = { neutral: neuC, neutralNote: '' };
      showMap('c-a', A, { ...dS, ...nn }); showMap('c-b', B, { ...dC, ...nn }, { msg: 'Chlorophyll a tidak tersedia pada sel-hari Marine Heatwaves (awan/tanpa data).' });
      showMap('c-c', C, { ...dS, ...nc }); showMap('c-d', D, { ...dC, ...nc }, { msg: 'Chlorophyll a tidak tersedia (awan/tanpa data).' });
      $('#c-a-sub').textContent = $('#c-b-sub').textContent = per; $('#c-c-sub').textContent = $('#c-d-sub').textContent = labC;
      const pm = pooled(oe, 'M'), pns = os.map(o => pooled(o, 'N')), n = pns.reduce((s, p) => s + p.n, 0), pn = { chl: n ? pns.reduce((s, p) => s + (p.chl || 0) * p.n, 0) / n : null, sstAnom: mean(pns.map(p => p.sstAnom)), anom: mean(pns.map(p => p.anom)), n };
      const d = pc(pm.chl, pn.chl);
      kp.innerHTML = kpi('Chlorophyll a, sel-hari Marine Heatwaves', pm.chl != null ? fmt(pm.chl, 3) + ' mg/m³' : '—', `${pm.n.toLocaleString('id-ID')} sel-hari, ${per}`) + kpi('Chlorophyll a, sel tanpa Marine Heatwaves', pn.chl != null ? fmt(pn.chl, 3) + ' mg/m³' : '—', `${pn.n.toLocaleString('id-ID')} sel-hari, ${labC}`) + kpi('Selisih', d == null ? '—' : (d >= 0 ? '+' : '') + fmt(d, 1) + '%', 'sel-hari Marine Heatwaves dibanding non-Marine Heatwaves') + kpi('SST anomali', `${pm.sstAnom != null ? '+' + fmt(pm.sstAnom) : '—'} vs ${pn.sstAnom != null ? sgn(pn.sstAnom).replace(/(\d+\.\d{2})\d/, '$1') : '—'} °C`, 'sel-hari Marine Heatwaves vs sel non-Marine Heatwaves');
    } else {
      const r = await eventMaps(ev);
      if (r.mode === 'sample') { showMap('c-a', r.mhw, DEF.sstAnom(r.mhw)); showMap('c-b', r.chl, DEF.chlAnom(r.chl)); $('#c-a-sub').textContent = $('#c-b-sub').textContent = 'hari contoh ' + fdate(r.date); }
      else { for (const id of ['c-a', 'c-b']) showMap(id, null, null, { msg: NOPACK_MSG }); $('#c-a-sub').textContent = $('#c-b-sub').textContent = per; }
      for (const id of ['c-c', 'c-d']) showMap(id, null, null, { msg: 'Peta per grid tahun pembanding membutuhkan data pack harian. Lihat grafik regional di bawah.' });
      $('#c-c-sub').textContent = $('#c-d-sub').textContent = labC;
      const cChl = cur ? cur.chl : m.base, cAn = cur ? cur.anom : m.baseAnom, d = pc(m.chl, cChl);
      kp.innerHTML = kpi('Chlorophyll a, rata-rata regional saat event', fmt(m.chl, 3) + ' mg/m³', per) + kpi('Chlorophyll a tanpa Marine Heatwaves (regional)', fmt(cChl, 3) + ' mg/m³', labC) + kpi('Selisih', d == null ? '—' : (d >= 0 ? '+' : '') + fmt(d, 1) + '%', 'pendekatan regional (mode terbatas)') + kpi('SST anomali (regional)', `+${fmt(m.anom)} vs ${cAn >= 0 ? '+' : ''}${fmt(cAn)} °C`, 'saat event vs tanpa Marine Heatwaves');
    }
    const to = ev.duration - 1, labels = []; for (let o = 0; o <= to; o++) labels.push(o);
    const mk = (pick) => { const e = offsetSeries(ev.start_date, 0, to, pick), arr = wins.map(c => offsetSeries(c.start, 0, to, pick)); return [
      { label: 'Saat Marine Heatwaves (' + ev.start_date.slice(0, 4) + ')', data: e, borderColor: COL.red, pointRadius: 0, borderWidth: 2 },
      { label: 'Tanpa Marine Heatwaves (' + (cur ? cur.year : 'rata-rata') + ')', data: labels.map((_, i) => mean(arr.map(a => a[i]))), borderColor: COL.green, pointRadius: 0, borderWidth: 2 }]; };
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
    const G = S.D.grids || {}, mo = MON.indexOf(st.month) + 1, sea = SEAS.find(s => s.k === st.season);
    switch (st.scale) {
      case 'Bulanan': return { a: START, b: END, f: d => +d.slice(5, 7) === mo, lbl: `bulan ${MONF[mo - 1]} (rata-rata semua tahun 2000–2020)`, g: G[gk + '_monthly'] ? G[gk + '_monthly'][mo] : null };
      case 'Tahunan': return { a: `${st.year}-01-01`, b: `${st.year}-12-31`, f: null, lbl: `tahun ${st.year}`, g: G[gk + '_annual'] ? G[gk + '_annual'][st.year] : null };
      case 'Musiman': return { a: START, b: END, f: d => sea.m.includes(+d.slice(5, 7)), lbl: `${sea.k} (${sea.per}), ${sea.n} (2000–2020)`, g: G[gk + '_seasonal'] ? G[gk + '_seasonal'][sea.k] : null };
      case 'Dekadal': { const [x, y] = st.dec.split('–'); return { a: `${x}-01-01`, b: `${y || x}-12-31`, f: null, lbl: `dekade ${st.dec}`, g: G[gk + '_decadal'] ? G[gk + '_decadal'][st.dec.replace('–', '_')] : null }; }
      default: return { a: START, b: END, f: null, lbl: 'seluruh periode 2000–2020', g: G[gk + '_mean_all'] || null };
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
      const mini = SEAS.map(s => mapCard(`v-${s.k}`, `${s.k} (${s.per})`, s.n)).join('');
      const cycleYears = Array.from({ length: 21 }, (_, i) => 2000 + i);
      return `<section class="card"><div class="row"><div>${lab('Skala waktu')}${seg('scale', SCL, st.scale)}</div><div>${lab('Statistik agregasi')}${seg('stat', STATS, st.stat, dis)}</div></div>${dep ? `<div style="margin-top:12px">${lab(st.scale === 'Musiman' ? 'Musim' : st.scale === 'Bulanan' ? 'Bulan' : st.scale === 'Tahunan' ? 'Tahun' : 'Dekade')}${dep}</div>` : ''}
        <div style="margin-top:12px;font-size:13px">Ditampilkan: ${pill(st.stat + ', ' + st.scale.toLowerCase())} ${pill(sl.lbl)} ${!S.pack ? '<span class="note">Mode terbatas: hanya rata-rata yang tersedia (statistik lain butuh data pack harian).</span>' : ''}</div></section>
      <div class="grid2">${mapCard('v-main', `Peta ${nm} — ${st.stat.toLowerCase()} ${st.scale.toLowerCase()}`, '<span id="v-main-sub"></span>')}${card(`Statistik ${nm}`, sl.lbl, `<div class="lab">Statistik spasial (nilai sel pada peta)</div><div id="v-skv"></div><div class="lab" style="margin-top:12px">Deret harian rata-rata regional, ${sv ? sv.n : 0} hari</div>${sv ? kv([['Rata-rata', `${fmt(sv.mean, dec)} ${unit}`], ['Median', `${fmt(sv.median, dec)} ${unit}`], ['Minimum', `${fmt(sv.min, dec)} ${unit}`], ['Maksimum', `${fmt(sv.max, dec)} ${unit}`], ['Simpangan baku', `${fmt(sv.std, dec)} ${unit}`], ['Persentil 10 / 90', `${fmt(sv.p10, dec)} / ${fmt(sv.p90, dec)}`]]) : '<div class="note">Tidak ada data.</div>'}`)}</div>
      ${card('Perbandingan antar musim', `statistik deret harian rata-rata regional (${unit})`, seasonTable(st.scale === 'Musiman' ? st.season : ''))}
      <div class="note"><b>Peta per musim</b> (skala warna sama untuk keempat musim)</div><div class="grid2">${mini}</div>
      <div class="grid2">${card(`${nm} rata-rata bulanan`, `klimatologi 2000–2020, dalam ${unit}`, chartBox('v-month'))}${card(isS ? 'Siklus musiman SST dan ambang Marine Heatwaves' : 'Chlorophyll a bulanan vs tahun terpilih', `<select data-in="cy" aria-label="Tahun">${cycleYears.map(y => `<option ${y === Number(st.cy) ? 'selected' : ''}>${y}</option>`).join('')}</select>`, chartBox('v-cycle'))}</div>
      ${isS ? `<div class="kpis">${kpi('SST rata-rata regional', fmt(vstats(S.ds.map(x => x.sst)).mean) + ' ± ' + fmt(vstats(S.ds.map(x => x.sst)).std) + ' °C', '2000–2020, deret harian')}${kpi('Rentang harian', fmt(vstats(S.ds.map(x => x.sst)).min) + '–' + fmt(vstats(S.ds.map(x => x.sst)).max) + ' °C', 'minimum–maksimum regional')}${kpi('Baseline klimatologi', '21 tahun', '2000–2020 (bukan standar 30 tahun WMO)')}${kpi('Ambang Marine Heatwaves', 'P90 musiman', 'Hobday et al. (2016), min. 5 hari, gap 2 hari')}</div>`
        : `<div class="kpis">${kpi('Rata-rata piksel', fmt(sg('mean_mg_m3'), 3) + ' mg/m³', 'seluruh piksel valid')}${kpi('Median', fmt(sg('median_p50_mg_m3'), 3) + ' mg/m³', 'distribusi log-normal')}${kpi('Piksel valid', fmt(sg('persentase_valid'), 1) + '%', 'sisanya tertutup awan / tanpa data')}${kpi('Persentil 90 / 95', fmt(sg('p90_mg_m3'), 2) + ' / ' + fmt(sg('p95_mg_m3'), 2), 'mg/m³')}</div>
        ${card('Statistik deskriptif Chlorophyll a', 'seluruh piksel valid 2000–2020, dalam mg/m³', kv([['Total piksel diobservasi', fmt(sg('total_piksel_diobservasi'), 0)], ['Total piksel valid', fmt(sg('total_piksel_valid'), 0)], ['Minimum', fmt(sg('min_mg_m3'), 3)], ['Persentil 5', fmt(sg('p05_mg_m3'), 3)], ['Persentil 25', fmt(sg('p25_mg_m3'), 3)], ['Median', fmt(sg('median_p50_mg_m3'), 3)], ['Rata-rata', fmt(sg('mean_mg_m3'), 3)], ['Persentil 75', fmt(sg('p75_mg_m3'), 3)], ['Persentil 90', fmt(sg('p90_mg_m3'), 3)], ['Maksimum', fmt(sg('max_mg_m3'), 2)], ['Simpangan baku', fmt(sg('std_mg_m3'), 3)], ['IQR', fmt(sg('iqr_mg_m3'), 3)]]))}`}`;
    },
    async mount() {
      const st = dflt(stOf(key)), sl = selOf(st);
      let g = sl.g;
      if (S.pack && (st.stat !== 'Rata-rata' || !g)) g = await statGrid(isS ? 'sst' : 'chla', sl.a, sl.b, st.stat, sl.f);
      showMap('v-main', g, def(g), { msg: 'Tidak ada data.' }); $('#v-main-sub').textContent = sl.lbl;
      const v = vstats(gridVals(g)); $('#v-skv').innerHTML = statKV(v, unit, dec);
      const grids = SEAS.map(s => (S.D.grids && S.D.grids[gk + '_seasonal'] ? S.D.grids[gk + '_seasonal'][s.k] : null) || []);
      const shared = def(grids.flat()); SEAS.forEach((s, i) => showMap(`v-${s.k}`, grids[i], shared));
      const mc = S.D.monthly, ds = [];
      if (isS) ds.push({ type: 'line', label: 'Rata-rata', data: mc.map(x => x.sst_mean), borderColor: COL.orange, pointRadius: 2, borderWidth: 2 }, { type: 'line', label: 'Minimum', data: mc.map(x => x.sst_min), borderColor: '#3B6FB6', pointRadius: 2, borderWidth: 1.5 }, { type: 'line', label: 'Maksimum', data: mc.map(x => x.sst_max), borderColor: COL.red, pointRadius: 2, borderWidth: 1.5 });
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
  title: 'Produksi Tangkapan Ikan', sub: 'Konteks perikanan tangkap laut umum NTT terhadap kondisi SST, Marine Heatwaves, dan Chlorophyll a (deskriptif)',
  html() {
    const F = S.D.fish, A = F.annual_data;
    const sp = F.species_thermal.map(s => `<section class="card"><div class="card-h"><h2>${s.species}</h2><span><i>${s.latin}</i></span></div>${kv([['Suhu optimum', s.optimum_temp], ['Suhu kritis', s.critical_temp], ['Habitat', s.habitat], ['Alat tangkap', s.gear]])}<p class="note" style="margin-top:8px"><b>Saat Marine Heatwaves:</b> ${s.behavior_at_mhw}</p></section>`).join('');
    const rows = A.map(a => `<tr><td>${a.year}</td><td>${fmt(a.sst_mean)}</td><td>${(a.sst_anomaly >= 0 ? '+' : '') + fmt(a.sst_anomaly)}</td><td>${yearDays(a.year).list.length}</td><td>${yearDays(a.year).tot}</td><td>${fmt(a.chla_mean, 3)}</td><td>${fmt(a.catch_tons, 0)}</td></tr>`).join('');
    const cf = F.confounding_factors.map(c => `<tr><td><b>${c['Faktor Perancu']}</b></td><td>${c['Mekanisme Pengaruh']}</td><td>${c['Arah Distorsi Terhadap Data']}</td></tr>`).join('');
    return `<div class="banner">Halaman ini bersifat <b>deskriptif kualitatif</b>: dinamika oseanografi dibandingkan dengan preferensi termal ikan dari literatur dan data tangkapan tahunan resmi (BPS/KKP), <b>bukan</b> klaim sebab-akibat Marine Heatwaves terhadap hasil tangkapan.</div>
    <div class="grid2">${card('Produksi tangkapan vs hari Marine Heatwaves', 'tahunan, dalam ton dan hari', chartBox('f-catch'))}${card('Chlorophyll a dan anomali SST tahunan', 'rata-rata tahunan', chartBox('f-env'))}</div>
    <div class="grid2">${card('Kisaran suhu optimum spesies', 'dibanding ambang kritis, dalam °C', chartBox('f-sp'))}<div class="grid2" style="grid-template-columns:1fr">${sp}</div></div>
    ${card('Sintesis tahunan', 'SST, Marine Heatwaves, Chlorophyll a, dan tangkapan (annual_summary.json)', `<div class="tw"><table><thead><tr><th>Tahun</th><th>SST rata-rata °C</th><th>Anomali °C</th><th>Kejadian Marine Heatwaves regional</th><th>Hari Marine Heatwaves regional${S.an && S.an.extent ? ' (≥15%)' : ' (durasi katalog)'}</th><th>Chl (mg/m³)</th><th>Tangkapan (ton)</th></tr></thead><tbody>${rows}</tbody></table></div>`)}
    ${card('Faktor pengganggu perikanan', 'confounding factors', `<div class="tw"><table><thead><tr><th>Faktor</th><th>Mekanisme</th><th>Arah distorsi</th></tr></thead><tbody>${cf}</tbody></table></div>`)}
    ${card('Keterbatasan', '', `<ul class="plain">${F.limitations.map(l => `<li>${l}</li>`).join('')}</ul>`)}`;
  },
  mount() {
    const A = S.D.fish.annual_data, F = S.D.fish, yrs = A.map(a => a.year);
    chart('f-catch', { data: { labels: yrs, datasets: [{ type: 'bar', label: 'Tangkapan (ton)', data: A.map(a => a.catch_tons), backgroundColor: '#9CCFD6', yAxisID: 'y' }, { type: 'line', label: 'Hari Marine Heatwaves regional', data: A.map(a => yearDays(a.year).tot), borderColor: COL.red, pointRadius: 3, yAxisID: 'y2' }] }, options: { scales: { y: { title: { display: true, text: 'ton' } }, y2: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'hari Marine Heatwaves' } } }, plugins: { legend: { position: 'bottom' } } } });
    chart('f-env', { type: 'line', data: { labels: yrs, datasets: [{ label: 'Chl (mg/m³)', data: A.map(a => a.chla_mean), borderColor: COL.green, yAxisID: 'y', pointRadius: 3 }, { label: 'Anomali SST (°C)', data: A.map(a => a.sst_anomaly), borderColor: COL.red, yAxisID: 'y2', pointRadius: 3 }] }, options: { scales: { y: { title: { display: true, text: 'mg/m³' } }, y2: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '°C' } } }, plugins: { legend: { position: 'bottom' } } } });
    const num = s => (String(s).match(/-?\d+(\.\d+)?/g) || []).map(Number), sp = F.species_thermal.map(s => ({ n: s.species, o: num(s.optimum_temp), c: num(s.critical_temp)[0] }));
    chart('f-sp', { type: 'bar', data: { labels: sp.map(s => s.n), datasets: [{ label: 'Suhu optimum', data: sp.map(s => s.o.length > 1 ? [s.o[0], s.o[1]] : [s.o[0], s.o[0]]), backgroundColor: COL.teal }, { type: 'scatter', label: 'Suhu kritis', data: sp.map((s, i) => ({ x: i, y: s.c })), backgroundColor: COL.red, pointStyle: 'rectRot', radius: 7 }] }, options: { scales: { y: { min: 20, max: 33, title: { display: true, text: '°C' } } }, plugins: { legend: { position: 'bottom' } } } });
  }
};

/* ---------- Sintesis Hasil ---------- */
const FIGS = {
  'fig1_sintesis_karakteristik_sst.png': 'Figur 1: Karakteristik SST', 'fig2_sintesis_timeline_mhw.png': 'Figur 2: Kronologi Marine Heatwaves', 'fig3_sintesis_spasial_multiparameter.png': 'Figur 3: Spasial multiparameter', 'fig4_sintesis_respon_chla_mhw.png': 'Figur 4: Respon Chlorophyll a terhadap Marine Heatwaves',
  'nb1_sst_coverage_map.png': 'NB1: Cakupan SST', 'nb1_chla_coverage_map.png': 'NB1: Cakupan Chlorophyll a', 'nb1_sst_timeseries.png': 'NB1: Deret waktu SST',
  'nb2_sst_climatology_threshold.png': 'NB2: Klimatologi dan ambang SST', 'nb2_sst_seasonal_cycle.png': 'NB2: Siklus musiman SST', 'nb2_sst_spatial_patterns.png': 'NB2: Pola spasial SST', 'nb2_mhw_timeline.png': 'NB2: Timeline Marine Heatwaves', 'nb2_mhw_spatial_maps.png': 'NB2: Peta spasial Marine Heatwaves', 'nb2_mhw_annual_metrics.png': 'NB2: Metrik tahunan Marine Heatwaves',
  'nb3_chla_spatial_patterns.png': 'NB3: Pola spasial Chlorophyll a', 'nb3_chla_temporal_patterns.png': 'NB3: Pola temporal Chlorophyll a', 'nb3_chla_distribution.png': 'NB3: Distribusi Chlorophyll a', 'nb3_chla_data_availability.png': 'NB3: Ketersediaan data Chlorophyll a',
  'nb4_chla_mhw_vs_nonmhw_boxplots.png': 'NB4: Chlorophyll a Marine Heatwaves vs non-Marine Heatwaves', 'nb4_mhw_case_study_spatial.png': 'NB4: Studi kasus spasial Marine Heatwaves',
  'nb6_thermal_tolerance_species.png': 'NB6: Toleransi termal spesies', 'nb6_descriptive_oceanography_and_catch.png': 'NB6: Oseanografi dan tangkapan'
};
function csvDownload(name, rows) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'), a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; a.click();
}
const REPORT_PDF = 'laporan/laporan.pdf';
P.sintesis = {
  title: 'Sintesis Hasil', sub: 'Laporan akhir kelompok (PDF)',
  html() {
    return `<section class="card" style="padding:10px 12px"><div class="row" style="align-items:center;justify-content:space-between;margin-bottom:8px"><h2 style="margin:0;font-size:15px">Laporan akhir</h2><div class="row" style="gap:8px"><a class="btn" style="display:inline-flex;align-items:center;text-decoration:none;color:var(--ink)" href="${REPORT_PDF}" target="_blank" rel="noopener">Buka di tab baru</a><a class="btn" style="display:inline-flex;align-items:center;text-decoration:none;color:var(--ink)" href="${REPORT_PDF}" download>Unduh PDF</a></div></div><div id="rep" class="pdfwrap"><div class="nodata">Memuat laporan...</div></div></section>`;
  },
  async mount() {
    const box = $('#rep'); if (!box) return;
    let ok = true;
    try { const r = await fetch(REPORT_PDF, { method: 'HEAD' }); ok = r.ok; } catch (e) { ok = true; /* mis. dibuka lewat file:// */ }
    box.innerHTML = ok
      ? `<iframe class="pdfframe" src="${REPORT_PDF}#view=FitH" title="Laporan akhir (PDF)"></iframe>`
      : `<div class="nodata">File laporan belum ditemukan. Letakkan PDF laporan di <code>${REPORT_PDF}</code>, lalu muat ulang halaman.</div>`;
  }
};

/* ---------- Metodologi ---------- */
function checkCard() {
  const C = S.an && S.an.check;
  if (!C || !C.summary) return card('Pemeriksaan katalog terhadap data per grid', '', '<div class="nodata">Belum tersedia. Jalankan <code>python dashboard/tools/grid_analysis.py</code> (otomatis dijalankan oleh build_daily_grids.py).</div>');
  const s = C.summary, ok = s.matched_exact === s.catalog_events && s.redetected_events === s.catalog_events;
  const rows = C.events.map(e => { const ev = evById(e.event_id); return `<tr class="${e.gap_days ? '' : ''}"><td>#${e.event_id}</td><td>${ev ? frange(ev.start_date, ev.end_date) : ''}</td><td>${e.days}</td><td>${e.regional_days}</td><td>${e.gap_days}</td><td>${fmt(e.max_member_pct, 1)}%</td><td>${fmt(e.max_strict_pct, 1)}%</td></tr>`; }).join('');
  return card('Pemeriksaan katalog terhadap data per grid', 'dihitung ulang dari data pack', `<div class="kpis" style="margin-bottom:12px">${kpi('Deteksi ulang', s.redetected_events + ' kejadian', ok ? `cocok persis dengan katalog (${s.matched_exact}/${s.catalog_events})` : `cocok persis ${s.matched_exact} dari ${s.catalog_events}`)}${kpi('Hari Marine Heatwaves regional', s.regional_days, 'cakupan ≥15% luas laut')}${kpi('Hari jeda', s.gap_days, 'bagian kejadian dengan cakupan <15% (bukan hari Marine Heatwaves)')}${kpi('Durasi katalog', s.catalog_days + ' hari', 'hari Marine Heatwaves regional + hari jeda')}</div>${ok ? '' : `<div class="banner">Hasil deteksi ulang dari data pack tidak sepenuhnya sama dengan katalog (mis. berbeda versi data). Hanya di katalog: ${esc(JSON.stringify(s.only_in_catalog.slice(0, 5)))}; hanya di deteksi ulang: ${esc(JSON.stringify(s.only_in_redetection.slice(0, 5)))}.</div>`}<div class="tw"><table><thead><tr><th>Event</th><th>Periode</th><th>Durasi</th><th>Hari Marine Heatwaves regional</th><th>Hari jeda</th><th>Cakupan maks. (Hobday)</th><th>Cakupan maks. (di atas P90)</th></tr></thead><tbody>${rows}</tbody></table></div>`);
}
const DEFS = `<ul class="plain"><li><b>Hari Marine Heatwaves sel</b>: SST sel &gt; P90 sel itu, pada hari yang menjadi anggota kejadian (≥5 hari berturut-turut, jeda ≤2 hari digabung bila SST jeda &gt; klimatologi).</li><li><b>Hari jeda sel</b>: anggota kejadian tetapi SST ≤ P90. Ikut menentukan durasi kejadian (aturan Hobday) namun <b>tidak dihitung sebagai hari Marine Heatwaves</b> dan dikeluarkan dari kelompok Marine Heatwaves maupun non-Marine Heatwaves.</li><li><b>Hari Marine Heatwaves regional</b>: ≥15% sel laut berstatus anggota kejadian pada hari itu. Kejadian regional = ≥5 hari berturut-turut (jeda ≤2 hari digabung).</li><li><b>Hari jeda regional</b>: hari di dalam kejadian regional dengan cakupan &lt;15%. Bagian kejadian, bukan hari Marine Heatwaves.</li><li><b>Hari non-Marine Heatwaves sel</b>: bukan anggota kejadian pada sel itu.</li></ul>`;
P.metodologi = {
  title: 'Metodologi', sub: 'Alur pipeline, parameter, sumber data, kualitas data, dan batasan analisis',
  html() {
    const M = meta(), Y = S.D.syn, steps = [['NB 1', 'Persiapan & penggabungan data', 'Inventaris, QC, subset NTT'], ['NB 2', 'SST & deteksi Marine Heatwaves', 'Klimatologi, P90, Hobday 2016'], ['NB 3', 'Chlorophyll a', 'Statistik, musiman, celah awan'], ['NB 4', 'Gabungan Marine Heatwaves + Chlorophyll a', 'Penyelarasan grid, Mann-Whitney'], ['NB 5', 'Visualisasi & sintesis', 'Figur 300 DPI, tabel'], ['NB 6', 'Interpretasi kualitatif', 'Konteks tangkapan ikan']];
    const dq = Y.data_quality.map(d => `<tr><td>${d.dataset}</td><td>${d.sumber}</td><td>${d.resolusi_spasial}</td><td>${d.resolusi_temporal}</td><td>${d.periode_awal} – ${d.periode_akhir}</td><td>${d.jumlah_hari}</td><td>${fmt(d.missing_pct, 2)}%</td></tr>`).join('');
    const tot = (Y.data_inventory || []).reduce((s, x) => s + (x.ukuran_MB || 0), 0);
    return `<div class="flow">${steps.map(s => `<div><b>${s[0]}</b><h3>${s[1]}</h3><p>${s[2]}</p></div>`).join('')}</div>
    <div class="kpis">${kpi('Ambang Marine Heatwaves (per sel)', 'Persentil ke-90', 'musiman, jendela 31 hari')}${kpi('Durasi minimum', '5 hari', 'gap maksimum 2 hari, Hobday et al. (2016)')}${kpi('Kejadian regional', '≥ 15% luas laut', `sel Marine Heatwaves serentak ≥ 5 hari → katalog ${S.events.length} kejadian`)}${kpi('Baseline', '2000–2020', '21 tahun')}${kpi('Domain', `${M.region.lon_min}–${M.region.lon_max}°BT`, `${-M.region.lat_max}–${-M.region.lat_min}°LS, grid ${STEP}°`)}</div>
    <div class="grid2">${card('Periode data', '', kv(Object.entries(M.periods).map(([k, v]) => [k.toUpperCase(), v])))}${card('Sitasi', '', `<ul class="plain">${Y.citations.map(c => `<li><b>${c.name}</b>: ${c.citation}</li>`).join('')}</ul>`)}</div>
    ${card('Definisi hari Marine Heatwaves (per grid)', 'agar tidak ada hari non-Marine Heatwaves yang terhitung Marine Heatwaves', DEFS)}
    ${checkCard()}
    ${card('Katalog pembanding: rata-rata SST regional', 'bukan katalog utama', `<p class="note" style="font-size:13px;margin:0 0 8px">Deteksi Marine Heatwaves pada deret rata-rata SST seluruh perairan NTT (1D, metode konvensional) menghasilkan ${S.events1d.length} kejadian dan ${S.events1d.reduce((s, e) => s + e.duration, 0)} hari. Metode ini meratakan suhu seluruh NTT sehingga dapat mengaburkan Marine Heatwaves lokal, jadi hanya disimpan sebagai pembanding. Katalog utama dashboard adalah ${S.events.length} kejadian berbasis spasial (per grid).</p>${kv([['Chlorophyll a saat Marine Heatwaves (pembanding)', fmt(S.D.chl.reference_regional_mean.suppression_summary.mhw_mean, 4) + ' mg/m³'], ['Chlorophyll a non-Marine Heatwaves (pembanding)', fmt(S.D.chl.reference_regional_mean.suppression_summary.non_mhw_mean, 4) + ' mg/m³'], ['Selisih (pembanding)', fmt(S.D.chl.reference_regional_mean.suppression_summary.diff_percent, 1) + '%']])}`)}
    ${card('Kualitas data', `${Y.data_inventory ? Y.data_inventory.length : 0} file terinventarisasi, ${fmt(tot, 0)} MB`, `<div class="tw"><table><thead><tr><th>Dataset</th><th>Sumber</th><th>Resolusi spasial</th><th>Temporal</th><th>Periode</th><th>Hari</th><th>Missing</th></tr></thead><tbody>${dq}</tbody></table></div>`)}
    ${card('Kepatuhan batasan PRD', '', `<ul class="plain" style="list-style:none;padding:0">${Y.prd_compliance.map(r => `<li><span class="ok">✓</span> <b>${r.rule}</b> — ${r.detail}</li>`).join('')}</ul>`)}
    ${card('Keterbatasan', '', `<ul class="plain">${S.D.fish.limitations.map(l => `<li>${l}</li>`).join('')}<li>Baseline 21 tahun lebih pendek daripada standar klimatologi 30 tahun. Chlorophyll a banyak hilang akibat tutupan awan (piksel valid ≈ ${fmt((S.D.chl.stats.find(r => r['Unnamed: 0'] === 'persentase_valid') || {}).Nilai, 1)}%).</li></ul>`)}`;
  },
  mount() { }
};

/* ---------- Router & init ---------- */
const NAV = [
  ['Utama', [['beranda', 'Beranda']]],
  ['Analisis', [{ group: 'Peta Kejadian Marine Heatwaves', icon: 'mhw', items: [['mhw', 'Intensitas maks.'], ['mhw-anomali', 'Anomali SST'], ['mhw-durasi', 'Durasi kejadian']] }, ['dampak', 'Chlorophyll a vs Marine Heatwaves'], ['banding', 'Marine Heatwaves vs Non-Marine Heatwaves'], ['sst', 'SST'], ['chla', 'Chlorophyll a']]],
  ['Lainnya', [['sebaran', 'Sebaran Data'], ['ikan', 'Produksi Ikan'], ['sintesis', 'Sintesis Hasil'], ['metodologi', 'Metodologi']]]];
const ICON = { beranda: 'M3 10l7-6 7 6v7H3z', sebaran: 'M3 3h5v5H3zM12 3h5v5h-5zM3 12h5v5H3zM12 12h5v5h-5z', mhw: 'M2 13c3-6 5 4 8-1s5 4 8-1', dampak: 'M4 16V8M10 16V4M16 16v-6', banding: 'M4 4v12M16 4v12M4 10h12M7 7l-3 3 3 3M13 7l3 3-3 3', sst: 'M10 3v9M7 12a3 3 0 106 0 3 3 0 00-6 0', chla: 'M4 16c0-8 5-12 12-12 0 8-4 12-12 12zM4 16l7-7', ikan: 'M2 10c3-4 8-4 11 0-3 4-8 4-11 0zM13 10l5-3v6z', sintesis: 'M4 4h12v12H4zM7 8h6M7 12h4', metodologi: 'M10 3a7 7 0 100 14 7 7 0 000-14zM10 9v5M10 6.5v.5' };
function buildSidebar() {
  const ico = k => `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="${ICON[k]}"/></svg>`;
  const link = (k, t) => `<a class="nav-link" href="#${k}" data-page="${k}">${ico(k)}${t}</a>`;
  $('#sidebar').innerHTML = `<div class="brand"><b>NTT Marine Insight</b><span>Kelompok 10</span></div>` + NAV.map(([g, it]) => `<div class="nav-group">${g}</div>` + it.map(x => Array.isArray(x) ? link(x[0], x[1]) : `<div class="nav-parent">${ico(x.icon)}${x.group}</div>` + x.items.map(([k, t]) => `<a class="nav-link nav-sub" href="#${k}" data-page="${k}">${t}</a>`).join('')).join('')).join('');
}
const GRIDPAGES = ['beranda', 'sebaran', 'mhw', 'mhw-anomali', 'mhw-durasi', 'dampak', 'banding', 'sst', 'chla'];
function setBanner(page) {
  const b = $('#banner'), badge = $('#data-badge');
  badge.innerHTML = S.pack ? '<span class="pill">Data pack harian aktif</span>' : '<span class="pill" style="background:#FFF1C9;color:#5A4300">Mode data terbatas</span>';
  if (!GRIDPAGES.includes(page)) { b.innerHTML = ''; return; }
  const issue = S.packIssue ? `<div class="banner"><b>Data pack bermasalah.</b> ${esc(S.packIssue)}</div>` : '';
  b.innerHTML = S.pack ? '' : issue + `<div class="banner"><b>Mode data terbatas.</b> Grid harian per tanggal dan per kejadian Marine Heatwaves belum dibuat, sehingga peta harian/mingguan dan peta tiap kejadian hanya tampil untuk 4 hari contoh. Peta tahunan, bulanan, musiman, dekadal, grafik regional, tabel, dan statistik tetap memakai data asli. Untuk mengaktifkan semuanya, jalankan <code>python dashboard/tools/build_daily_grids.py</code> di komputer yang menyimpan file NetCDF (<code>data/processed/*.nc</code>), lalu muat ulang halaman.</div>`;
}
function fixSubs() {
  $$('.card-h span').forEach(el => {
    if (el.children.length || !el.textContent.includes('\n')) return;
    el.innerHTML = el.textContent.split('\n').map(esc).join('<br>'); el.style.textAlign = 'left';
  });
}
async function show(page) {
  if (!P[page]) page = 'beranda';
  const same = S.page === page, sl = same && $('.strip') ? $('.strip').scrollLeft : 0;
  S.page = page; S.charts.forEach(c => c.destroy()); S.charts = [];
  $$('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.page === page));
  $('#page-title').textContent = P[page].title; $('#page-sub').textContent = P[page].sub; document.title = `${P[page].title} — NTT Marine Insight`;
  setBanner(page);
  try {
    $('#view').innerHTML = P[page].html();
    const s2 = $('.strip'); if (s2 && sl) s2.scrollLeft = sl;
    await P[page].mount();
    fixSubs();
  } catch (e) { console.error(e); $('#view').insertAdjacentHTML('afterbegin', `<div class="banner">Terjadi kesalahan saat menampilkan halaman: ${esc(e.message)}</div>`); }
}
async function rerender() { const y = window.scrollY; await show(S.page); window.scrollTo(0, y); }
function setNav(open) { $('#sidebar').classList.toggle('open', open); document.body.classList.toggle('nav-open', open); syncMenu(); }
function syncMenu() {
  const mobile = window.innerWidth <= 860, openNow = mobile ? $('#sidebar').classList.contains('open') : !document.body.classList.contains('collapsed');
  const b = $('#menu-btn'); b.textContent = mobile && openNow ? '✕' : '☰'; b.setAttribute('aria-expanded', String(openNow)); b.setAttribute('aria-label', openNow ? 'Tutup menu' : 'Buka menu');
}
function wire() {
  document.addEventListener('click', e => {
    const tb = e.target.closest('[data-tool]'); if (tb) { toolAction(tb); return; }
    const z = e.target.closest('[data-zoom]');
    if (z) { openImageModal(z.src, z.dataset.zoom); return; }
    if (e.target.closest('#modal-close') || e.target.id === 'modal') { closeModal(); return; }
    if (e.target.closest('.nav-link') && window.innerWidth <= 860) setNav(false);
    const act = e.target.closest('[data-act]');
    if (act && act.dataset.act === 'csv-events') { csvDownload('kejadian_mhw_spasial_ntt.csv', [['event_id', 'start_date', 'end_date', 'peak_date', 'duration_days', 'regional_mhw_days', 'gap_days', 'peak_extent_pct', 'mean_extent_pct', 'i_max', 'i_mean', 'i_cum'], ...S.events.map(x => { const c = chkOf(x.event_id); return [x.event_id, x.start_date, x.end_date, x.peak_date, x.duration, c ? c.regional_days : '', c ? c.gap_days : '', x.peak_extent_pct, x.mean_extent_pct, x.i_max, x.i_mean, x.i_cum]; })]); return; }
    if (act && act.dataset.act === 'csv-events1d') { csvDownload('kejadian_mhw_pembanding_rata_rata_regional.csv', [['event_id', 'start_date', 'end_date', 'peak_date', 'duration', 'i_max', 'i_mean', 'i_cum', 'category'], ...S.events1d.map(x => [x.event_id, x.start_date, x.end_date, x.peak_date, x.duration, x.i_max, x.i_mean, x.i_cum, x.category])]); return; }
    const b = e.target.closest('[data-set]'); if (!b || b.disabled) return;
    const st = stOf(S.page); st[b.dataset.set] = b.dataset.val; if (b.dataset.forceScale) st.scale = b.dataset.forceScale;
    if (b.dataset.set === 'ev') st.ev = Number(b.dataset.val);
    if (b.dataset.set === 'year') st.year = Number(b.dataset.val);
    rerender();
  });
  document.addEventListener('change', e => { const i = e.target.closest('[data-in]'); if (!i || !i.value) return; stOf(S.page)[i.dataset.in] = i.type === 'date' ? clampDate(i.value) : i.value; rerender(); });
  document.addEventListener('input', e => { const s = e.target.closest('[data-search]'); if (!s) return; stOf(S.page).q = s.value; const strip = $('.strip'); if (strip) strip.innerHTML = stripInner(S.page); });
  $('#menu-btn').addEventListener('click', () => { if (window.innerWidth <= 860) setNav(!$('#sidebar').classList.contains('open')); else { document.body.classList.toggle('collapsed'); syncMenu(); } });
  $('#scrim').addEventListener('click', () => setNav(false));
  window.addEventListener('resize', () => { if (window.innerWidth > 860) setNav(false); syncMenu(); });
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); setNav(false); } });
}
async function init() {
  buildSidebar(); wire(); syncMenu();
  try { await loadDatasets(); if (!S.D.grids || !S.ds.length) throw new Error('data tidak termuat'); }
  catch (e) { $('#view').innerHTML = `<div class="banner">Data gagal dimuat (${esc(e.message)}). Jalankan dashboard lewat <code>python run_dashboard.py</code> (server lokal), bukan dengan membuka index.html langsung.</div>`; return; }
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
    Chart.defaults.font.size = 12;
    if (Chart.defaults.scale && Chart.defaults.scale.grid) Chart.defaults.scale.grid.display = false;   /* tanpa gridlines di semua grafik */
    /* legenda: garis tipis (bukan kotak berongga) */
    const LB = Chart.defaults.plugins.legend.labels, genOrig = LB.generateLabels;
    const solid = c => { if (Array.isArray(c)) c = c[0]; if (typeof c !== 'string') return '#555'; const m = c.match(/^rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)$/); return m ? `rgba(${m[1]},${m[2]},${m[3]},.9)` : c; };
    LB.usePointStyle = true; LB.pointStyle = 'line'; LB.pointStyleWidth = 28;
    LB.generateLabels = function (chart) {
      const items = genOrig(chart);
      items.forEach(it => {
        const ds = chart.data.datasets[it.datasetIndex]; if (!ds) return;
        const isBar = (ds.type || chart.config.type) === 'bar', c = solid(isBar || !ds.borderColor ? ds.backgroundColor : ds.borderColor);
        it.pointStyle = 'line'; it.strokeStyle = c; it.fillStyle = c; it.lineWidth = 1.5; it.lineDash = ds.borderDash || []; it.borderRadius = 0;
      });
      return items;
    };
  }
  await show(location.hash.slice(1) || 'beranda');
}
document.addEventListener('DOMContentLoaded', init);
