// ================== ANALYTICS ==================

const DASH_KEY = 'axis_dashboard_v1';
const ADMIN_KEY = 'axis_admin_data_v1';
const USER_KEY = 'axis_user_name';

let userName = 'Carlos E. Mendoza';
let currentRange = '7d';

// ---------- STATE ----------
let state = {};
try {
  state = JSON.parse(localStorage.getItem(DASH_KEY)) || {};
} catch (e) {}

let adminData = {};
try {
  adminData = JSON.parse(localStorage.getItem(ADMIN_KEY)) || {};
} catch (e) {}

// Суммы меняются при каждой загрузке страницы
const BAL = Math.round((120000 + Math.random() * 780000) * 100) / 100;

// ---------- FORMAT ----------
function money(v) {
  return '$' + Number(v || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function moneyDzd(v) {
  return Number(v || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' COP';
}
function moneyShort(v) {
  const n = Math.abs(v);
  if (n >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return v.toFixed(2);
}

// ---------- GENERATE FAKE DATA ----------
const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, 'all': 180 };
const RANGE_POINTS = { '7d': 48, '30d': 64, '90d': 80, 'all': 100 };
const RANGE_LABEL = { '7d': '7 days', '30d': '30 days', '90d': '90 days', 'all': '6 months' };

function generateSeries(days) {
  const arr = [];
  let balance = 0;
  const step = BAL / days;  // конечная точка = текущий баланс

  for (let i = 0; i < days; i++) {
    const noise = (Math.random() - 0.4) * step * 2;
    balance += step + noise;
    balance = Math.max(0, balance);
    arr.push({
      day: i,
      value: balance,
      profit: balance - (arr[i - 1]?.value || 0)
    });
  }
  // Дотягиваем последний к реальному балансу
  const last = arr[arr.length - 1];
  const realBalance = BAL;
  const diff = realBalance - last.value;
  arr.forEach(p => p.value += diff);
  // Пересчитываем profit
  for (let i = 1; i < arr.length; i++) {
    arr[i].profit = arr[i].value - arr[i - 1].value;
  }
  return arr;
}

function generateTrades(count = 20) {
  const trades = [];
  const coins = ['ETH', 'BTC', 'USDC', 'USDT', 'SOL'];
  const colors = ['#627eea', '#f7931a', '#2775ca', '#26a17b', '#9945ff'];

  for (let i = 0; i < count; i++) {
    const isWin = Math.random() < 0.72;
    const coinIdx = Math.floor(Math.random() * coins.length);
    const amount = Math.random() * 25000 + 500;
    const pct = (Math.random() * 12 + 0.5) * (isWin ? 1 : -1);

    trades.push({
      coin: coins[coinIdx],
      color: colors[coinIdx],
      pnl: isWin ? amount : -amount,
      pct: pct,
      time: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 72).toISOString()
    });
  }
  return trades;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / (1000 * 60 * 60));
  if (h < 1) return 'just now';
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

// ---------- RENDER KPIs ----------
function renderKpis() {
  const days = RANGE_DAYS[currentRange];
  const series = generateSeries(RANGE_POINTS[currentRange]);
  const totalPnl = series[series.length - 1].value - series[0].value;

  const winrate = 68 + Math.random() * 20;
  const wins = Math.floor(days * winrate / 100 * 1.2);
  const losses = Math.floor(wins * (100 - winrate) / winrate);
  const volume = series.reduce((s, p) => s + Math.abs(p.profit), 0);
  const trades = wins + losses;
  const avgTrade = trades > 0 ? volume / trades : 0;

  document.getElementById('kpiPnl').textContent = (totalPnl >= 0 ? '+' : '') + moneyDzd(totalPnl);
  document.getElementById('kpiPnl').className = 'an-kpi-value ' + (totalPnl >= 0 ? 'green' : '');
  document.getElementById('kpiPnlPct').textContent = (totalPnl >= 0 ? '+' : '') + ((totalPnl / BAL) * 100).toFixed(2) + '%';
  document.getElementById('kpiPnlPct').className = totalPnl >= 0 ? 'green' : 'red';

  document.getElementById('kpiVolume').textContent = moneyDzd(volume);
  document.getElementById('kpiVolumeTrades').textContent = trades + ' trades';

  document.getElementById('kpiWinrate').textContent = winrate.toFixed(1) + '%';
  document.getElementById('kpiWins').textContent = wins;
  document.getElementById('kpiLosses').textContent = losses;

  document.getElementById('kpiAvg').textContent = money(avgTrade);
  document.getElementById('kpiAvgTrades').textContent = (trades / days).toFixed(1) + ' per day';

  return series;
}

// ---------- MAIN CHART ----------
function drawMainChart(series) {
  const svg = document.getElementById('mainChart');
  const gridEl = document.getElementById('anChartGrid');
  const lineEl = document.getElementById('anChartLine');
  const areaEl = document.getElementById('anChartArea');
  const dotEl = document.getElementById('anChartDot');

  const wrap = svg.parentElement;
  const W = Math.max(300, Math.round(wrap.clientWidth)), H = Math.max(200, Math.round(wrap.clientHeight)), padTop = 24, padBot = 30, padX = 16, padR = 80;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  const values = series.map(p => p.value);
  const maxV = Math.max(...values);
  const minV = Math.min(...values);
  const range = maxV - minV || 1;

  const toX = i => padX + (i / (series.length - 1)) * (W - padX - padR);
  const toY = v => H - padBot - ((v - minV) / range) * (H - padTop - padBot);

  // Grid
  let gridHtml = '';
  for (let i = 0; i <= 4; i++) {
    const y = padTop + (i / 4) * (H - padTop - padBot);
    gridHtml += `<line class="an-chart-grid-line" x1="0" y1="${y}" x2="${W}" y2="${y}"/><text class="an-axis" x="6" y="${y - 5}">${moneyShort(maxV - (i / 4) * range)}</text>`;
  }
  gridEl.innerHTML = gridHtml;

  // Smooth path
  const pts = series.map((p, i) => [toX(i), toY(p.value)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }

  lineEl.setAttribute('d', d);
  areaEl.setAttribute('d', `${d} L${toX(series.length - 1)},${H - padBot} L${toX(0)},${H - padBot} Z`);

   // Last dot с пульсацией
  const lastIdx = series.length - 1, lastVal = series[lastIdx].value;
  const lx = toX(lastIdx), ly = toY(lastVal);
  dotEl.setAttribute('cx', lx); dotEl.setAttribute('cy', ly); dotEl.setAttribute('opacity', 1);
  const ring = document.getElementById('anChartRing'); ring.setAttribute('cx', lx); ring.setAttribute('cy', ly);
  const ll = document.getElementById('anChartLast');
  ll.setAttribute('x1', 0); ll.setAttribute('x2', W); ll.setAttribute('y1', ly); ll.setAttribute('y2', ly);
  const tag = document.getElementById('anChartTag');
  tag.setAttribute('transform', `translate(${W - 74},${Math.min(H - 24, Math.max(2, ly - 11))})`);
  tag.querySelector('text').textContent = moneyShort(lastVal);

  // Stats
  const profits = series.slice(1).map(p => p.profit);
  const bestIdx = profits.indexOf(Math.max(...profits));
  const worstIdx = profits.indexOf(Math.min(...profits));
  const avg = profits.reduce((s, v) => s + v, 0) / profits.length;

  const variance = profits.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / profits.length;
  const volatility = Math.sqrt(variance);

  document.getElementById('anBestDay').textContent = '+' + moneyDzd(profits[bestIdx]);
  document.getElementById('anWorstDay').textContent = moneyDzd(profits[worstIdx]);
  document.getElementById('anAvgDaily').textContent = (avg >= 0 ? '+' : '') + moneyDzd(avg);
  document.getElementById('anVolatility').textContent = moneyDzd(volatility);

  document.getElementById('anChartSub').textContent = 'Live · last ' + RANGE_LABEL[currentRange];
}

// ---------- BAR CHART: Monthly ----------
function drawBarChart() {
  const svg = document.getElementById('barChart');
  const gridEl = document.getElementById('barGrid');
  const barsEl = document.getElementById('barBars');
  const labelsEl = document.getElementById('barLabels');

  const W = Math.max(280, Math.round(svg.parentElement.clientWidth)), H = Math.max(150, Math.round(svg.parentElement.clientHeight));
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const padTop = 20, padBot = 40, padX = 10;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = (window._bd = window._bd || months.slice(0, 9).map(m => ({
    month: m,
    value: (Math.random() * 80000 - 15000)
  })));

  const maxV = Math.max(...data.map(d => Math.abs(d.value)));
  const barWidth = (W - padX * 2) / data.length - 8;

  const toY = v => {
    if (v >= 0) {
      return H / 2 - (v / maxV) * (H / 2 - padTop);
    } else {
      return H / 2 + (Math.abs(v) / maxV) * (H / 2 - padBot);
    }
  };

  // Grid
  let gridHtml = '';
  for (let i = 0; i <= 4; i++) {
    const y = padTop + (i / 4) * (H - padTop - padBot);
    gridHtml += `<line class="bar-grid-line" x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  }
  // Middle line (0)
  gridHtml += `<line class="bar-grid-line" x1="0" y1="${H/2}" x2="${W}" y2="${H/2}" stroke="rgba(255,255,255,0.15)" stroke-dasharray="none"/>`;
  gridEl.innerHTML = gridHtml;

  // Bars
  let barsHtml = '';
  let labelsHtml = '';
  data.forEach((d, i) => {
    const x = padX + i * (barWidth + 8) + 4;
    const isGreen = d.value >= 0;
    const y0 = H / 2;
    const y1 = toY(d.value);
    const yTop = Math.min(y0, y1);
    const height = Math.abs(y1 - y0);

    barsHtml += `<rect x="${x}" y="${yTop}" width="${barWidth}" height="${height}"
                     fill="url(#${isGreen ? 'barGreen' : 'barRed'})" rx="3"
                     class="bar-rect" data-idx="${i}"/>`;

    labelsHtml += `<text x="${x + barWidth/2}" y="${H - padBot + 18}" class="bar-label">${d.month}</text>`;
  });
  barsEl.innerHTML = barsHtml;
  labelsEl.innerHTML = labelsHtml;
}

// ---------- DONUT ----------
function drawDonut() {
  if (!window._dn) {
    const w = [0, 0, 0, 0].map(() => Math.random() + 0.35), t = w.reduce((x, y) => x + y, 0);
    const v = w.map(x => Math.round(x / t * 100)); v[0] += 100 - v.reduce((x, y) => x + y, 0);
    window._dn = v.sort((x, y) => y - x);
  }
  const segments = ['ETH', 'BTC', 'USDC', 'USDT'].map((n, i) => ({ name: n, value: window._dn[i], color: ['#627eea', '#f7931a', '#2775ca', '#26a17b'][i] }));

  const g = document.getElementById('donutSegments');
  g.innerHTML = '';

  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = 80, r = 52;
  let angle = -Math.PI / 2;

  segments.forEach(seg => {
    const slice = (seg.value / total) * Math.PI * 2;
    const startAngle = angle;
    const endAngle = angle + slice;

    const x1 = R * Math.cos(startAngle);
    const y1 = R * Math.sin(startAngle);
    const x2 = R * Math.cos(endAngle);
    const y2 = R * Math.sin(endAngle);
    const x3 = r * Math.cos(endAngle);
    const y3 = r * Math.sin(endAngle);
    const x4 = r * Math.cos(startAngle);
    const y4 = r * Math.sin(startAngle);

    const largeArc = slice > Math.PI ? 1 : 0;

    const path = `M${x1},${y1} A${R},${R} 0 ${largeArc} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${largeArc} 0 ${x4},${y4} Z`;

    g.innerHTML += `<path d="${path}" fill="${seg.color}" class="donut-seg" data-name="${seg.name}"/>`;

    angle = endAngle;
  });

  // Legend
  const legend = document.getElementById('donutLegend');
  legend.innerHTML = segments.map(s => `
    <div class="donut-leg-item">
      <span class="donut-leg-color" style="background:${s.color}"></span>
      <span class="donut-leg-name">${s.name}</span>
      <span class="donut-leg-pct" style="color:${s.color}">${s.value}%</span>
    </div>
  `).join('');

  document.getElementById('donutTotal').textContent = '$' + moneyShort(BAL).replace('$','');
}

// ---------- TOP / WORST TRADES ----------
function renderTradeCards(containerId, trades, isWorst = false) {
  const el = document.getElementById(containerId);
  const list = [...trades]
    .sort((a, b) => isWorst ? a.pnl - b.pnl : b.pnl - a.pnl)
    .slice(0, 5);

  el.innerHTML = list.map(t => `
    <div class="trade-card">
      <div class="trade-ico ${t.pnl >= 0 ? 'green' : 'red'}">
        ${t.coin[0]}
      </div>
      <div class="trade-info">
        <div class="trade-name">${t.coin} / COP</div>
        <div class="trade-time">${timeAgo(t.time)}</div>
      </div>
      <div class="trade-pnl ${t.pnl >= 0 ? 'green' : 'red'}">
        ${t.pnl >= 0 ? '+' : ''}${moneyDzd(t.pnl)}
      </div>
      <div class="trade-pct ${t.pct >= 0 ? 'green' : 'red'}">
        ${t.pct >= 0 ? '+' : ''}${t.pct.toFixed(2)}%
      </div>
    </div>
  `).join('');
}

// ---------- USER ----------
function renderUser() {
  document.getElementById('userName').textContent = userName;
  /* аватар и галочка заданы в HTML */
}

// ---------- RENDER ALL ----------
function renderAll() {
  const series = renderKpis();
  drawMainChart(series);
  drawBarChart();
  drawDonut();

  const trades = generateTrades(20);
  renderTradeCards('topTrades', trades, false);
  renderTradeCards('worstTrades', trades, true);
}

// ---------- EVENTS ----------
document.querySelectorAll('.an-range').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.an-range').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRange = btn.dataset.range;
    renderAll();
  });
});

// ================= LIVE (спокойные обновления) =================
let liveSeries = null;
const _origRenderKpis = renderKpis;
renderKpis = function () { const s = _origRenderKpis(); liveSeries = s; return s; };

function flash(el, up) {
  el.classList.remove('f-up', 'f-down'); void el.offsetWidth;
  el.classList.add(up ? 'f-up' : 'f-down');
}
function tickChart() {
  if (!liveSeries || liveSeries.length < 3) return;
  const s = liveSeries, last = s[s.length - 1];
  const next = Math.max(0, last.value + (Math.random() - 0.46) * BAL * 0.0035);
  s.shift();
  s.push({ day: last.day + 1, value: next, profit: next - last.value });
  s[0].profit = 0;
  drawMainChart(s);
  const pnl = next - s[0].value, el = document.getElementById('kpiPnl');
  el.textContent = (pnl >= 0 ? '+' : '') + moneyDzd(pnl);
  el.className = 'an-kpi-value ' + (pnl >= 0 ? 'green' : 'red');
  const pc = document.getElementById('kpiPnlPct');
  pc.textContent = (pnl >= 0 ? '+' : '') + (pnl / BAL * 100).toFixed(2) + '%';
  pc.className = pnl >= 0 ? 'green' : 'red';
  flash(el, next >= last.value);
  if (window._bd) { window._bd[window._bd.length - 1].value += (next - last.value) * 0.5; drawBarChart(); }
}

// ================= SIGNALS =================
const SIGNALS = [
  { pair: 'BTC/USDT', coin: 'BTC', color: '#f7931a', side: 'buy',  tf: '4H', entry: 98420, sl: 96850, tp1: 100200, tp2: 102900, conf: 84, ago: '18m' },
  { pair: 'ETH/USDT', coin: 'ETH', color: '#627eea', side: 'sell', tf: '1H', entry: 3642,  sl: 3718,  tp1: 3560,   tp2: 3445,   conf: 76, ago: '47m' },
  { pair: 'SOL/USDT', coin: 'SOL', color: '#9945ff', side: 'buy',  tf: '1D', entry: 214.6, sl: 205.2, tp1: 224,    tp2: 238,    conf: 71, ago: '2h' },
  { pair: 'XRP/USDT', coin: 'XRP', color: '#2ea8ff', side: 'sell', tf: '4H', entry: 2.485, sl: 2.56,  tp1: 2.4,    tp2: 2.29,   conf: 68, ago: '3h' }
];
SIGNALS.forEach(s => {
  const f = 1 + (Math.random() - 0.5) * 0.14;
  ['entry', 'sl', 'tp1', 'tp2'].forEach(k => s[k] *= f);
  s.conf = 62 + Math.floor(Math.random() * 30);
  s.ago = ['6m', '12m', '18m', '31m', '47m', '1h', '2h', '3h'][Math.floor(Math.random() * 8)];
});
SIGNALS.forEach(s => { s.price = s.entry * (1 + (s.side === 'buy' ? 1 : -1) * (0.002 + Math.random() * 0.004)); });
let sigFilter = 'all';

const fmtP = p => p >= 1000 ? p.toLocaleString('en-US', { maximumFractionDigits: 0 }) : p >= 10 ? p.toFixed(2) : p.toFixed(4);
const sigPos = (s, v) => {
  const x = s.side === 'buy' ? (v - s.sl) / (s.tp2 - s.sl) : (s.sl - v) / (s.sl - s.tp2);
  return Math.max(0, Math.min(1, x)) * 100;
};
const sigPnl = s => (s.side === 'buy' ? 1 : -1) * (s.price - s.entry) / s.entry * 100;
const ARROW = { buy: '<path d="M7 17L17 7M9 7h8v8"/>', sell: '<path d="M7 7l10 10M17 9v8H9"/>' };

function renderSignals() {
  const list = SIGNALS.map((s, i) => ({ s, i })).filter(o => sigFilter === 'all' || o.s.side === sigFilter);
  document.getElementById('sigGrid').innerHTML = list.map(({ s, i }) => {
    const rr = Math.abs(s.tp2 - s.entry) / Math.abs(s.entry - s.sl);
    return `<article class="sig ${s.side}" data-i="${i}">
      <div class="sig-top">
        <span class="sig-coin" style="background:${s.color}">${s.coin[0]}</span>
        <div><div class="sig-pair">${s.pair}</div><div class="sig-meta">${s.tf} · ${s.ago} ago · <span class="sig-state"></span></div></div>
        <span class="sig-now">${fmtP(s.price)}</span>
        <span class="sig-side"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ARROW[s.side]}</svg>${s.side === 'buy' ? 'BUY' : 'SELL'}</span>
      </div>
      <div class="sig-levels">
        <div class="sig-lv"><span>Entry</span><b>${fmtP(s.entry)}</b></div>
        <div class="sig-lv sl"><span>Stop</span><b>${fmtP(s.sl)}</b></div>
        <div class="sig-lv tp"><span>TP1</span><b>${fmtP(s.tp1)}</b></div>
        <div class="sig-lv tp"><span>TP2</span><b>${fmtP(s.tp2)}</b></div>
      </div>
      <div class="sig-bar"><i style="left:${sigPos(s, s.entry)}%"></i><i style="left:${sigPos(s, s.tp1)}%"></i><em style="left:${sigPos(s, s.price)}%"></em></div>
      <div class="sig-foot">
        <span class="chip">R:R 1:${rr.toFixed(1)}</span><span class="chip">${s.conf}% confidence</span>
        <button class="sig-copy" data-i="${i}" title="Copy signal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg></button>
        <span class="sig-pnl"></span>
      </div></article>`;
  }).join('');
  paintSignals();
}

function paintSignals() {
  document.querySelectorAll('.sig').forEach(el => {
    const s = SIGNALS[el.dataset.i], p = sigPnl(s);
    el.querySelector('em').style.left = sigPos(s, s.price) + '%';
    const out = el.querySelector('.sig-pnl');
    out.textContent = (p >= 0 ? '+' : '') + p.toFixed(2) + '%';
    out.className = 'sig-pnl ' + (p >= 0 ? 'green' : 'red');
    const now = el.querySelector('.sig-now'); now.textContent = fmtP(s.price);
    if (s.prev !== undefined && s.prev !== s.price) flash(now, s.price > s.prev);
    s.prev = s.price;
    const hit = s.side === 'buy' ? s.price >= s.tp1 : s.price <= s.tp1;
    const near = sigPos(s, s.price) < 12;
    const st = el.querySelector('.sig-state');
    st.textContent = hit ? 'TP1 hit' : near ? 'Near stop' : 'Active';
    st.className = 'sig-state ' + (hit ? 'green' : near ? 'red' : '');
  });
}

function tickSignals() {
  SIGNALS.forEach(s => {
    s.price *= 1 + (Math.random() - 0.5) * 0.0022;
    s.price = Math.min(Math.max(s.price, Math.min(s.sl, s.tp2) * 0.998), Math.max(s.sl, s.tp2) * 1.002);
  });
  paintSignals();
}

document.getElementById('sigFilter').addEventListener('click', e => {
  const b = e.target.closest('.seg-btn'); if (!b) return;
  document.querySelectorAll('.seg-btn').forEach(x => x.classList.toggle('active', x === b));
  sigFilter = b.dataset.f; renderSignals();
});
document.getElementById('sigGrid').addEventListener('click', e => {
  const b = e.target.closest('.sig-copy'); if (!b) return;
  const s = SIGNALS[b.dataset.i];
  const txt = `${s.pair} ${s.side.toUpperCase()} (${s.tf})\nEntry ${fmtP(s.entry)}\nStop ${fmtP(s.sl)}\nTP1 ${fmtP(s.tp1)}\nTP2 ${fmtP(s.tp2)}`;
  navigator.clipboard?.writeText(txt).then(() => { b.classList.add('done'); setTimeout(() => b.classList.remove('done'), 1200); });
});

// ================= TICKER + CLOCK =================
const TICK = [
  ['BTC', 98420], ['ETH', 3642], ['SOL', 214.6], ['XRP', 2.485], ['BNB', 612.4],
  ['DOGE', 0.184], ['ADA', 0.742], ['AVAX', 38.2], ['LINK', 17.9], ['TON', 6.12]
].map(([sym, p]) => { const sg = SIGNALS.find(s => s.coin === sym); const b = sg ? sg.entry : p * (1 + (Math.random() - 0.5) * 0.2); return { sym, base: b, p: b, chg: (Math.random() - 0.4) * 5 }; });
function tickerHtml() {
  return TICK.map(t => `<span class="tk"><b>${t.sym}</b><span data-p="${t.sym}">${fmtP(t.p)}</span><em data-c="${t.sym}" class="${t.chg >= 0 ? 'green' : 'red'}">${t.chg >= 0 ? '▲' : '▼'} ${Math.abs(t.chg).toFixed(2)}%</em></span>`).join('');
}
document.getElementById('tickerTrack').innerHTML = tickerHtml() + tickerHtml();
function tickTicker() {
  TICK.forEach(t => {
    t.p *= 1 + (Math.random() - 0.5) * 0.0025;
    t.chg += (t.p / t.base - 1) * 0 + (Math.random() - 0.5) * 0.12;
    document.querySelectorAll(`[data-p="${t.sym}"]`).forEach(e => { e.textContent = fmtP(t.p); });
    document.querySelectorAll(`[data-c="${t.sym}"]`).forEach(e => {
      e.textContent = (t.chg >= 0 ? '▲ ' : '▼ ') + Math.abs(t.chg).toFixed(2) + '%';
      e.className = t.chg >= 0 ? 'green' : 'red';
    });
  });
}
function tickClock() {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  document.getElementById('anClock').textContent = `UTC ${z(d.getUTCHours())}:${z(d.getUTCMinutes())}:${z(d.getUTCSeconds())}`;
}

// ---------- INIT ----------
renderUser();
renderAll();
renderSignals();
setInterval(tickChart, 700);
setInterval(tickSignals, 900);
setInterval(tickTicker, 1100);
setInterval(tickClock, 1000);
tickClock();
window.addEventListener('resize', () => { if (liveSeries) drawMainChart(liveSeries); drawBarChart(); });