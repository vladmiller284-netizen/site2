// ================== LEADERBOARD ==================

const USER_KEY = 'axis_user_name';
const ADMIN_KEY = 'axis_admin_data_v1';

const ME_NAME = 'Carlos E. Mendoza';
let userName = ME_NAME;
let currentRange = 'week';
let currentSort = 'pnl';
let searchQuery = '';

// ---------- ADMIN DATA ----------
function loadAdmin() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { name: userName, tariff: null };
}
let adminData = loadAdmin();

// ---------- CURRENCY ----------
function getCur() {
  if (window.AXIS_CURRENCY && typeof window.AXIS_CURRENCY.get === 'function') {
    return window.AXIS_CURRENCY.get();
  }
  return { currency: 'COP', rate: 3190, flag: 'co', country: 'Colombia' };
}
// Базовые суммы ниже заданы в масштабе COP (1 USD = 134), пересчитываем под текущую валюту
function currencyScale() {
  return getCur().rate / 3183;
}

// ---------- ICONS (SVG-спрайт в leaderboard.html) ----------
function icon(name, cls) {
  return `<svg class="ic ${cls || ''}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

// ---------- FORMAT ----------
function money(v) {
  return Number(v || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function moneyShort(v) {
  const n = Math.abs(v);
  if (n >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toFixed(0);
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ---------- ALGERIAN NAMES ----------
const FIRST_NAMES = [
  'Mohamed', 'Amine', 'Yacine', 'Karim', 'Sofiane', 'Bilal', 'Adel',
  'Nabil', 'Hicham', 'Walid', 'Rachid', 'Samir', 'Omar', 'Ali', 'Mehdi',
  'Anis', 'Ayoub', 'Ilyes', 'Zakaria', 'Reda', 'Fares', 'Nassim', 'Aymen',
  'Amina', 'Yasmine', 'Lina', 'Nour', 'Sara', 'Meriem', 'Imane', 'Khadija',
  'Nadia', 'Leila', 'Aya', 'Rania', 'Sonia', 'Wissam', 'Hiba', 'Dounia'
];
const LAST_NAMES = [
  'Benali', 'Boudiaf', 'Bouzid', 'Cherif', 'Hamidi', 'Khelifi', 'Mansouri',
  'Meziane', 'Belkacem', 'Zeroual', 'Larbi', 'Benaissa', 'Hadjadj', 'Amrani',
  'Taleb', 'Saidi', 'Ouali', 'Brahimi', 'Ferhat', 'Hammoudi', 'Kaci',
  'Rahmani', 'Slimani', 'Tounsi', 'Zidane', 'Belaid', 'Chaoui'
];

const AVATAR_COLORS = [
  'linear-gradient(135deg, #7c5cff, #ff6a9c)',
  'linear-gradient(135deg, #29c26b, #14b8a6)',
  'linear-gradient(135deg, #f59e0b, #ef4c5a)',
  'linear-gradient(135deg, #2ea8ff, #a44bff)',
  'linear-gradient(135deg, #ff3d8a, #ff8a2b)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
  'linear-gradient(135deg, #10b981, #84cc16)'
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ---------- GENERATE TRADERS ----------
function generateTraders(count = 100) {
  const traders = [];

  // Current user first
  const meName = ME_NAME;
  traders.push({
    id: 'me',
    name: meName,
    isMe: true,
    avatarColor: 'linear-gradient(135deg, #7c5cff, #ff6a9c)',
    pnl: 0,
    pnlPct: 0,
    volume: 0,
    trades: 0,
    winrate: 0,
    move: 0
  });

  // Random Algerian traders
  for (let i = 0; i < count; i++) {
    const name = rand(FIRST_NAMES) + ' ' + rand(LAST_NAMES);
    const k = currencyScale();
    const pnl = (Math.random() * 850000 + 50000) * k * (Math.random() > 0.15 ? 1 : -1);
    const pnlPct = (Math.random() * 240 + 10) * (pnl > 0 ? 1 : -1);
    const volume = (Math.random() * 8000000 + 500000) * k;
    const trades = Math.floor(Math.random() * 900 + 50);
    const winrate = Math.floor(Math.random() * 40 + 55);
    const move = Math.floor(Math.random() * 7 - 3);

    traders.push({
      id: 't' + i,
      name,
      isMe: false,
      avatarColor: rand(AVATAR_COLORS),
      pnl,
      pnlPct,
      volume,
      trades,
      winrate,
      move
    });
  }

  return traders;
}

let traders = [];

// ---------- МОЯ ПОЗИЦИЯ: всегда в топ-5 по любому показателю ----------
const METRICS = ['pnl', 'volume', 'trades'];
const meOf = () => traders.find(t => t.isMe);

// Ставит мои значения так, чтобы выше меня было ровно (rank-1) трейдеров
function placeMe(metric, rank) {
  const me = meOf();
  const others = traders.filter(t => !t.isMe).sort((a, b) => b[metric] - a[metric]);
  const hi = others[rank - 2][metric], lo = others[rank - 1][metric];
  const mid = (hi + lo) / 2;
  const old = me[metric];
  me[metric] = metric === 'trades' ? Math.max(lo + 1, Math.floor(mid)) : mid;
  if (metric === 'pnl' && old > 0) me.pnlPct *= me.pnl / old;
}
function rankIn(metric) {
  const me = meOf();
  return traders.filter(t => !t.isMe && t[metric] > me[metric]).length + 1;
}
function setMyStats() {
  const me = meOf();
  METRICS.forEach(m => placeMe(m, 2 + Math.floor(Math.random() * 4)));   // места 2–5
  me.pnlPct = 70 + Math.random() * 90;
  me.winrate = 78 + Math.floor(Math.random() * 15);
  me.move = 1 + Math.floor(Math.random() * 4);
}
function keepMeTop() {
  METRICS.forEach(m => { if (rankIn(m) > 5) placeMe(m, 3 + Math.floor(Math.random() * 2)); });
}

// ---------- SORT / FILTER ----------
function sortTraders() {
  const sorted = [...traders].sort((a, b) => b[currentSort] - a[currentSort]);
  sorted.forEach((t, i) => t.rank = i + 1);
  return sorted;
}
function getFiltered() {
  let list = sortTraders();
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(t => t.name.toLowerCase().includes(q));
  }
  return list;
}

// ---------- HELPERS ----------
// ---------- АВАТАРКИ: уникальный рисованный портрет для каждого трейдера ----------
const FEMALE = new Set(['Amina', 'Yasmine', 'Lina', 'Nour', 'Sara', 'Meriem', 'Imane', 'Khadija', 'Nadia', 'Leila', 'Aya', 'Rania', 'Sonia', 'Wissam', 'Hiba', 'Dounia']);
const SKIN = ['#f6d7bc', '#efc7a0', '#e0ac85', '#c98f66', '#a8714b', '#8d5a3b'];
const BGS = [['#7c5cff', '#ff6a9c'], ['#29c26b', '#14b8a6'], ['#f59e0b', '#ef4c5a'], ['#2ea8ff', '#a44bff'], ['#ff3d8a', '#ff8a2b'], ['#06b6d4', '#3b82f6'], ['#8b5cf6', '#ec4899'], ['#10b981', '#84cc16']];
const HAIRS = ['#17120f', '#2a1a10', '#3b2415', '#5a3a22', '#1d1d24', '#6b4a2f'];
const HIJABS = ['#f4f1ea', '#1f2433', '#7c5cff', '#e8a5c0', '#2f8f83', '#c9a27a', '#3b5b9a', '#a8324a'];
const SHIRTS = ['#2b3248', '#4a3f7a', '#1f6f6a', '#7a3f4a', '#3d4f7a', '#5a5f6e', '#e9edf5', '#2e5f8a'];
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function avatarSvg(t) {
  if (t.av) return t.av;
  const seed = hashStr(t.id + t.name), r = mulberry(seed), pick = a => a[Math.floor(r() * a.length)];
  const female = FEMALE.has(t.name.split(' ')[0]);
  const skin = pick(SKIN), [b1, b2] = pick(BGS), hair = pick(HAIRS), shirt = pick(SHIRTS), uid = 'av' + seed.toString(36);
  let layers;
  const eyes = `<circle cx="27.5" cy="30" r="1.3" fill="#1d1d24"/><circle cx="36.5" cy="30" r="1.3" fill="#1d1d24"/>`;
  const smile = `<path d="M28.5 36q3.5 3 7 0" stroke="#7a3b2e" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  const face = `<ellipse cx="32" cy="30" rx="10.5" ry="12.5" fill="${skin}"/>`;
  if (female && r() < 0.6) {                       // хиджаб
    const hj = pick(HIJABS);
    layers = `<path d="M32 8c-11 0-18 8-18 20 0 7 2 11 2 15-4 3-9 7-10 21h52c-1-14-6-18-10-21 0-4 2-8 2-15 0-12-7-20-18-20z" fill="${hj}"/>${face}
      <path d="M20.5 30c0-9 5-15 11.5-15s11.5 6 11.5 15c-3-5-7-7-11.5-7s-8.500 2-11.500 7z" fill="${hj}"/>${eyes}${smile}`;
  } else if (female) {                             // длинные волосы
    layers = `<path d="M6 64c0-12 10-17 26-17s26 5 26 17z" fill="${shirt}"/>
      <path d="M32 9c-10 0-17 7-17 18v16c0 4 3 6 6 6h22c3 0 6-2 6-6V27c0-11-7-18-17-18z" fill="${hair}"/>
      <rect x="27" y="40" width="10" height="10" fill="${skin}"/>${face}
      <path d="M20 29c1-9 6-14 12-14s11 5 12 14c-4-3-8-6-12-6s-8 3-12 6z" fill="${hair}"/>${eyes}${smile}`;
  } else {                                         // мужчины: причёска, борода, очки
    const beard = r() < 0.45, glasses = r() < 0.25, buzz = r() < 0.3;
    layers = `<path d="M6 64c0-12 10-17 26-17s26 5 26 17z" fill="${shirt}"/>
      <rect x="27" y="40" width="10" height="10" fill="${skin}"/>
      <circle cx="21.5" cy="31" r="2.3" fill="${skin}"/><circle cx="42.5" cy="31" r="2.3" fill="${skin}"/>${face}
      <path d="${buzz ? 'M21.500 25c0-7 4-10 10.500-10s10.500 3 10.500 10c-3-3-6-4-10.500-4s-7.500 1-10.500 4z' : 'M21 27c0-9 4-13 11-13s11 4 11 13c-2-3-4-5-7-5H28c-3 0-5 2-7 5z'}" fill="${hair}"/>
      ${beard ? `<path d="M21.500 31c0 8 4 12.500 10.500 12.500s10.500-4.500 10.500-12.500c-2 3-4 4-6 4h-9c-2 0-4-1-6-4z" fill="${hair}"/>` : ''}
      ${eyes}${beard ? `<path d="M29 37.500q3 2 6 0" stroke="#e9b8a8" stroke-width="1.300" fill="none" stroke-linecap="round"/>` : smile}
      ${glasses ? `<g fill="none" stroke="#1d2535" stroke-width="1.2"><circle cx="27.5" cy="30" r="3.6"/><circle cx="36.5" cy="30" r="3.6"/><path d="M31.100 30h1.800"/></g>` : ''}`;
  }
  return t.av = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></linearGradient></defs><rect width="64" height="64" fill="url(#${uid})"/>${layers}</svg>`;
}

// Реальные фото людей (randomuser.me), у каждого трейдера своё, при каждой загрузке — новый набор
function shuffled(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; }
  return a;
}
function assignPhotos() {
  const pool = { men: shuffled(100), women: shuffled(100) };
  traders.forEach(t => {
    if (t.isMe) return;
    const g = FEMALE.has(t.name.split(' ')[0]) ? 'women' : 'men';
    t.photo = `https://randomuser.me/api/portraits/${g}/${pool[g].pop()}.jpg`;
    t.photoFailed = false;
  });
}
// если фото не загрузилось (нет интернета) — показываем нарисованный аватар
function avFallback(img, id) {
  const t = traders.find(x => x.id === id);
  if (t) t.photoFailed = true;
  img.parentElement.innerHTML = t ? avatarSvg(t) : '';
}

function avatar(t, cls) {
  if (t.isMe) return `<div class="${cls}"><img src="rana.jpg" alt=""></div>`;
  if (t.photo && !t.photoFailed)
    return `<div class="${cls}"><img src="${t.photo}" alt="" decoding="async" onerror="avFallback(this,'${t.id}')"></div>`;
  return `<div class="${cls}">${avatarSvg(t)}</div>`;
}
const youChip = t => t.isMe ? '<span class="you-chip">YOU</span>' : '';

// ---------- PODIUM ----------
let podiumSig = '';
function renderPodium() {
  const s = sortTraders(), podium = document.getElementById('podium');
  const sig = s.slice(0, 3).map(t => t.id).join();
  if (sig === podiumSig) {            // порядок не изменился: обновляем только цифры, без перерисовки
    s.slice(0, 3).forEach(t => {
      const c = podium.querySelector(`[data-id="${t.id}"]`);
      if (c) c.querySelector('.podium-pnl').textContent = '+' + money(t.pnl);
    });
    return;
  }
  podiumSig = sig;
  const card = (t, n) => `
    <div class="podium-card rank-${n} ${t.isMe ? 'is-me' : ''}" data-id="${t.id}">
      <div class="podium-medal">${icon('medal-' + n)}</div>
      ${avatar(t, 'podium-avatar')}
      <div class="podium-name">${escapeHtml(t.name)}${youChip(t)}</div>
      <div class="podium-pnl">+${money(t.pnl)}</div>
      <div class="podium-sub">${t.trades} trades · ${t.winrate}% winrate</div>
    </div>`;
  podium.innerHTML = card(s[1], 2) + card(s[0], 1) + card(s[2], 3);
}

// ---------- TABLE ----------
function rowHtml(t) {
  const top = t.rank <= 5 ? ' top-' + t.rank : '';
  const move = t.move > 0 ? `<span class="lb-move up">${icon('chev-up')}${t.move}</span>`
    : t.move < 0 ? `<span class="lb-move down">${icon('chev-down')}${Math.abs(t.move)}</span>`
    : '<span class="lb-move same">—</span>';
  const tag = (cls, ic, txt) => `<span class="lb-badge-tag ${cls}">${icon(ic)} ${txt}</span>`;
  const badge = t.rank === 1 ? tag('gold', 'medal', 'GOLD') : t.rank === 2 ? tag('silver', 'medal', 'SILVER')
    : t.rank === 3 ? tag('bronze', 'medal', 'BRONZE') : t.winrate >= 85 ? tag('pro', 'star', 'PRO')
    : t.move >= 3 ? tag('rising', 'trend-up', 'RISING') : '';
  const tk = t.dir > 0 ? 'tk-up' : t.dir < 0 ? 'tk-down' : '';
  return `
    <div class="lb-row ${t.isMe ? 'is-me' : ''} ${t.rank <= 3 ? 'r' + t.rank : ''}" data-id="${t.id}">
      <div class="lb-rank${top}">${t.rank}</div>
      <div class="lb-user">
        ${avatar(t, 'lb-user-avatar')}
        <div class="lb-user-info"><div class="lb-user-name">${escapeHtml(t.name)}${t.isMe ? '<span class="lb-user-badge">YOU</span>' : ''}${move}</div></div>
      </div>
      <div class="lb-pnl ${t.pnl >= 0 ? '' : 'negative'} ${tk}"><span class="ci ${t.pnl >= 0 ? 'up' : 'down'}">${icon(t.pnl >= 0 ? 'trend-up' : 'trend-down')}</span><b>${t.pnl >= 0 ? '+' : ''}${money(t.pnl)}</b></div>
      <div class="lb-pnl-pct ${t.pnlPct >= 0 ? '' : 'negative'}"><span class="ci ${t.pnlPct >= 0 ? 'up' : 'down'}">${icon('percent')}</span><b>${t.pnlPct >= 0 ? '+' : ''}${t.pnlPct.toFixed(2)}%</b></div>
      <div class="lb-volume"><span class="ci">${icon('volume', 'ic-g')}</span><b>${moneyShort(t.volume)}</b></div>
      <div class="lb-trades"><span class="ci">${icon('repeat', 'ic-g')}</span><b>${t.trades}</b></div>
      <div class="lb-winrate"><div class="lb-winrate-bar ${t.winrate < 65 ? 'low' : ''}"><span style="width:${t.winrate}%"></span></div><div class="lb-winrate-text">${t.winrate}%</div></div>
      <div class="lb-badge">${badge || '<span class="lb-badge-none">—</span>'}</div>
    </div>`;
}
function renderTable() {
  const body = document.getElementById('lbTableBody'), list = getFiltered(), me = meOf();
  body.innerHTML = list.length ? list.map(rowHtml).join('')
    : `<div class="lb-empty"><span class="lb-empty-icon">${icon('search')}</span>No results found</div>`;
  traders.forEach(t => t.dir = 0);
  document.getElementById('lbPin').innerHTML = rowHtml(me);   // моя строка закреплена внизу
  document.getElementById('yourRank').textContent = '#' + me.rank;
}

// ---------- STATS ----------
function renderStats() {
  document.getElementById('onlineCount').textContent = Math.floor(Math.random() * 300 + 1200).toLocaleString('en-US');
  document.getElementById('volume24').textContent = moneyShort(traders.reduce((s, t) => s + t.volume, 0) / 10) + ' ' + getCur().currency;
}

// ---------- USER ----------
function renderUser() {
  const el = document.getElementById('pnlCurrency');
  if (el) el.textContent = getCur().currency;
  document.getElementById('userName').textContent = userName;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function renderAll() { renderTable(); renderPodium(); }
function regenerate() {
  traders = generateTraders(100);
  assignPhotos();
  setMyStats();
  podiumSig = '';
  renderAll();
  renderStats();
}

// ---------- EVENTS ----------
document.querySelectorAll('.lb-range').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.lb-range').forEach(b => b.classList.toggle('active', b === btn));
  currentRange = btn.dataset.range;
  regenerate();
}));
document.querySelectorAll('.lb-sort').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.lb-sort').forEach(b => b.classList.toggle('active', b === btn));
  currentSort = btn.dataset.sort;
  renderAll();
}));
document.getElementById('searchInput').addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  renderTable();
});

// ---------- INIT + LIVE ----------
function init() {
  renderUser();
  regenerate();
  setInterval(renderStats, 3000);
  setInterval(() => {
    for (let i = 0; i < 6; i++) {
      const t = traders[Math.floor(Math.random() * traders.length)];
      if (t.isMe || !t.pnl) continue;
      const delta = (Math.random() - 0.45) * Math.abs(t.pnl) * 0.006;
      t.pnl += delta; t.pnlPct += (delta / Math.abs(t.pnl)) * 100; t.dir = delta >= 0 ? 1 : -1;
    }
    const me = meOf(), d = (Math.random() - 0.4) * me.pnl * 0.003;
    me.pnl += d; me.pnlPct += (d / me.pnl) * 100; me.dir = d >= 0 ? 1 : -1;
    keepMeTop();
    renderTable(); renderPodium();
  }, 2500);
}
init();