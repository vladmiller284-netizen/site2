// ================== DASHBOARD ==================

const DASH_KEY  = 'axis_dashboard_v1';
const USER_KEY  = 'axis_user_name';
const ADMIN_KEY = 'axis_admin_data_v1';

// ---------- ETH PRICE ----------
let ETH_PRICE = parseFloat(localStorage.getItem('axis_eth_price')) || 2400;

async function fetchEthPrice() {
  if (location.protocol === 'file:') return;
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = await res.json();
    if (data.ethereum && data.ethereum.usd) {
      ETH_PRICE = data.ethereum.usd;
      localStorage.setItem('axis_eth_price', ETH_PRICE);
      if (typeof updateWithdrawTotal === 'function') updateWithdrawTotal();
      if (typeof render === 'function') render();
    }
  } catch (err) { console.warn('ETH price fetch failed:', err); }
}
fetchEthPrice();
setInterval(fetchEthPrice, 5 * 60 * 1000);

// ---------- ВАЛЮТА ----------
function getCurrency() {
  if (window.AXIS_CURRENCY && typeof window.AXIS_CURRENCY.get === 'function') {
    return window.AXIS_CURRENCY.get();
  }
  return { currency: 'COP', rate: 3197, flag: 'co', country: 'Colombia' };
}

// ---------- TARIFS ----------
const COMISSION_PCT = 6.5;

const TARIFF_AMOUNTS = {
  default: {
    withdrawComission: 191129.20, convertComission: 191240.28,
    verifyAmount: 19124, limitAmount: 12895.14,
    conclusion: 15500000.15,
    testPayAmount: 14122, brokerAmount: 31650, solanaAmount: 24335
  },
  '1': {
    withdrawComission: 292000, convertComission: 350000,
    verifyAmount: 376000, limitAmount: 684000,
    conclusion: 15547012.15,
    testPayAmount: 345000, brokerAmount: 754000, solanaAmount: 657000
  },
  '2': {
    withdrawComission: 312000, convertComission: 390000,
    verifyAmount: 428000, limitAmount: 684000,
    conclusion: 21450021.15,
    testPayAmount: 367000, brokerAmount: 787000, solanaAmount: 672000
  },
  '3': {
    withdrawComission: 422000, convertComission: 482000,
    verifyAmount: 575000, limitAmount: 684000,
    conclusion: 33650021.15,
    testPayAmount: 467000, brokerAmount: 787000, solanaAmount: 732000
  }
};

function getTariffAmounts() {
  const id = adminData.tariff;
  return TARIFF_AMOUNTS[id] || TARIFF_AMOUNTS.default;
}

// ---------- STATE ----------
let state        = loadState();
let userName     = localStorage.getItem(USER_KEY) || 'Carlos E. Mendoza';
let currentRange = '24H';

function loadState() {
  try {
    const raw = localStorage.getItem(DASH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.winTarget === undefined) parsed.winTarget = 0;
      return parsed;
    }
  } catch (e) { console.warn(e); }

  const initial = { balance: 0, pnl: 0, positions: 0, growth: 0, winTarget: 0, history: [] };
  localStorage.setItem(DASH_KEY, JSON.stringify(initial));
  return initial;
}

function saveState() {
  localStorage.setItem(DASH_KEY, JSON.stringify(state));
}

// ---------- FORMAT ----------
function money(v) {
  const cur = getCurrency();
  return Number(v || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }) + ' ' + cur.currency;
}

function moneyUsd(v) {
  return '$' + Number(v || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

function pct(v) {
  const sign = v >= 0 ? '+' : '';
  return sign + Number(v).toFixed(2) + '%';
}

// ---------- WALLET ----------
function getWalletNumber(fallback = '007999994170948796') {
  if (adminData.wallet && adminData.wallet.trim()) return adminData.wallet.trim();
  if (adminData.iban && adminData.iban.trim())     return adminData.iban.trim();
  return fallback;
}

// ---------- BANK EMOJI ----------
function getBankEmoji(bankName) {
  const bank = String(bankName || '').toLowerCase();
  if (bank.includes('barid'))    return '📮';
  if (bank.includes('poste'))    return '📮';
  if (bank.includes('bpi'))      return '🏛️';
  if (bank.includes('bna'))      return '🏦';
  if (bank.includes('bea'))      return '🏦';
  if (bank.includes('bdl'))      return '🏦';
  if (bank.includes('cpa'))      return '🏦';
  return '🏦';
}

// ---------- HISTORY ----------
// Новый seed при каждой загрузке страницы: форма графика меняется после обновления,
// но пока страница открыта (переключение вкладок, ререндер) остаётся стабильной.
const CHART_SEED = (Math.random() * 4294967296) >>> 0;

function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rangeRng(range) {
  let h = 0;
  for (const ch of String(range)) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return makeRng(CHART_SEED ^ h);
}

// Случайное блуждание, у которого начало и конец = 0. Значения нормированы в [-1, 1].
function chartBridge(n, rng) {
  const w = [0];
  let mom = 0;                                   // инерция: движения идут сериями
  for (let i = 1; i < n; i++) {
    let step = (rng() - 0.5) * 2;
    if (rng() < 0.22) step *= 3.2 + rng() * 3.8; // резкий рывок вверх или вниз
    mom = mom * 0.55 + step;
    w.push(w[i - 1] + mom);
  }
  const end = w[n - 1];
  let maxAbs = 0;
  const b = w.map((v, i) => {
    const x = v - end * (i / (n - 1));
    maxAbs = Math.max(maxAbs, Math.abs(x));
    return x;
  });
  return b.map(x => (maxAbs ? x / maxAbs : 0));
}

function getHistory(range) {
  const now = Date.now();
  const hourMs = 3600 * 1000;
  const config = {
    '1H':  { points: 90, stepMs: 40 * 1000 },
    '24H': { points: 48, stepMs: hourMs / 2 },
    '1W':  { points: 42, stepMs: 4 * hourMs },
    '1M':  { points: 60, stepMs: 12 * hourMs },
    '1Y':  { points: 36, stepMs: 10 * 24 * hourMs }
  };
  const cfg = config[range] || config['24H'];
  const result = [];
  const winTarget = state.winTarget || 0;
  const rng = rangeRng(range);

  // 1) Задана цель выигрыша: растём от 0 до winTarget, форма каждый раз новая
  if (winTarget > 0) {
    const power  = 1.1 + rng() * 1.1;      // кривизна роста
    const amp    = winTarget * (0.16 + rng() * 0.2);  // размах колебаний (агрессивный)
    const bridge = chartBridge(cfg.points, rng);
    for (let i = 0; i < cfg.points; i++) {
      const t = i / (cfg.points - 1);
      const value = Math.max(0, Math.pow(t, power) * winTarget + bridge[i] * amp);
      result.push({ ts: now - (cfg.points - 1 - i) * cfg.stepMs, value });
    }
    return result;
  }

  // 2) Есть реальная история: концы сохраняем, между ними добавляем вариацию
  const real = state.history || [];
  const targetBalance = state.balance;

  if (real.length >= 2) {
    const sorted = [...real].sort((a, b) => a.ts - b.ts);
    const first  = sorted[0];
    const last   = sorted[sorted.length - 1];
    const span   = last.ts - first.ts || 1;
    const amp    = Math.max(Math.abs(last.balance - first.balance), last.balance * 0.08, 1) * (0.3 + rng() * 0.3);
    const bridge = chartBridge(cfg.points, rng);

    for (let i = 0; i < cfg.points; i++) {
      const t = first.ts + (span * i) / (cfg.points - 1);
      let closest = sorted[0];
      let minDiff = Infinity;
      for (const p of sorted) {
        const diff = Math.abs(p.ts - t);
        if (diff < minDiff) { minDiff = diff; closest = p; }
      }
      result.push({ ts: t, value: Math.max(0, closest.balance + bridge[i] * amp) });
    }
    return result;
  }

  // 3) Данных нет: демо-график
  const volatility = targetBalance > 0 ? targetBalance * (0.2 + rng() * 0.25) : 50;
  const phase = rng() * Math.PI * 2;
  const waves = 1 + rng() * 2;
  const slope = 1 + rng() * 3;
  let v = targetBalance;

  for (let i = 0; i < cfg.points; i++) {
    if (targetBalance === 0) {
      const base = 100;
      const wave = Math.sin(i / cfg.points * Math.PI * 2 * waves + phase) * (12 + rng() * 16) + (rng() - 0.5) * 12;
      v = base + wave + i * slope;
    } else {
      v += (rng() - 0.5) * volatility * (rng() < 0.2 ? 3.5 : 1);
      v += (targetBalance - v) * 0.05;
    }
    result.push({ ts: now - (cfg.points - 1 - i) * cfg.stepMs, value: Math.max(0, v) });
  }
  return result;
}

// ---------- CHART ----------
function drawChart() {
  const line = document.getElementById('bigChartLine');
  const area = document.getElementById('bigChartArea');
  const grid = document.getElementById('chartGrid');
  if (!line || !area || !grid) return;

  const W = 800, H = 260, padTop = 10, padBottom = 10;
  const data   = getHistory(currentRange);
  const values = data.map(d => d.value);
  const maxV   = Math.max(...values, 1);
  const minV   = Math.min(...values, 0);
  const span   = maxV - minV || 1;

  const toX = i => (i / (data.length - 1)) * W;
  const toY = v => H - padBottom - ((v - minV) / span) * (H - padTop - padBottom);

  // Почти ломаная линия: минимальное сглаживание = резкие углы и скачки
  const TENSION = 0.05;
  function buildPath() {
    const pts = data.map((d, i) => [toX(i), toY(d.value)]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1[0] + (p2[0] - p0[0]) * TENSION;
      const cp1y = p1[1] + (p2[1] - p0[1]) * TENSION;
      const cp2x = p2[0] - (p3[0] - p1[0]) * TENSION;
      const cp2y = p2[1] - (p3[1] - p1[1]) * TENSION;
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    return d;
  }

  const path = buildPath();
  line.setAttribute('d', path);
  area.setAttribute('d', `${path} L${W},${H} L0,${H} Z`);

  // --- столбики-свечи под линией: зелёные на росте, красные на падении ---
  const bars  = document.getElementById('chartBars');
  const marks = document.getElementById('chartMarks');
  if (bars) {
    const bw = Math.max(2, (W / data.length) * 0.46);
    let b = '';
    for (let i = 0; i < data.length; i++) {
      const up  = i === 0 || data[i].value >= data[i - 1].value;
      const y   = toY(data[i].value);
      const prev = i === 0 ? y : toY(data[i - 1].value);
      const top = Math.min(y, prev);
      const hgt = Math.max(2, Math.abs(y - prev));
      b += `<rect x="${(toX(i) - bw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${hgt.toFixed(1)}" rx="1" fill="${up ? '#29c26b' : '#ef4c5a'}" opacity="${up ? 0.55 : 0.5}"/>`;
    }
    bars.innerHTML = b;
  }
  // --- маркеры максимума и минимума (круг не искажается при растяжении SVG) ---
  if (marks) {
    const iMax = values.indexOf(Math.max(...values));
    const iMin = values.indexOf(Math.min(...values));
    const mk = (i, color) => `<path class="bk-mark" d="M${toX(i)},${toY(values[i])} h0" stroke="${color}" style="filter:drop-shadow(0 0 9px ${color})"/>`;
    marks.innerHTML = mk(iMax, '#29c26b') + (iMin !== iMax ? mk(iMin, '#ef4c5a') : '');
  }

  // --- анимация «прорисовки» слева направо, только когда график реально изменился ---
  const reveal = document.getElementById('bkRevealRect');
  const key = currentRange + '|' + path;
  if (reveal && drawChart._key !== key) {
    drawChart._key = key;
    const t0 = performance.now(), dur = 1100;
    cancelAnimationFrame(drawChart._raf);
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      reveal.setAttribute('width', String(W * (1 - Math.pow(1 - k, 3))));
      if (k < 1) drawChart._raf = requestAnimationFrame(tick);
    };
    reveal.setAttribute('width', '0');
    drawChart._raf = requestAnimationFrame(tick);
  }

  let gridHtml = '';
  for (let i = 0; i <= 5; i++) {
    const y = padTop + (i / 5) * (H - padTop - padBottom);
    gridHtml += `<line class="grid-line dashed" x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  }
  grid.innerHTML = gridHtml;

  const total = state.winTarget > 0 ? state.winTarget : values[values.length - 1];
  const first = values[0];
  const diff  = total - first;
  const diffPct = first > 0 ? (diff / first) * 100 : 0;

  document.getElementById('portfolioTotal').textContent = money(total);
  const pctEl = document.getElementById('portfolioPct');
  pctEl.textContent = `${money(diff)} (${pct(diffPct)})`;
  pctEl.style.color = diff >= 0 ? 'var(--green)' : 'var(--red)';
}

// ---------- ICONS (SVG-спрайт в dashboard.html) ----------
function svgIcon(name) {
  return '<svg class="ic" aria-hidden="true"><use href="#dx-' + name + '"/></svg>';
}

// Значки монет (ETH, BTC, USDT, USDC, SOL) из того же спрайта
function coinIcon(sym) {
  const s = String(sym || 'ETH').toLowerCase();
  const known = ['eth', 'btc', 'usdt', 'usdc', 'sol'];
  const id = known.includes(s) ? s : 'usdt';
  return '<svg class="coin coin-' + id + '" aria-hidden="true"><use href="#dx-coin-' + id + '"/></svg>';
}

// ---------- ASSETS ----------
const ASSET_META = {
  ETH:  { name: 'Ethereum', ticker: 'ETH',  icon: 'Ξ', color: '#627eea', price: 2400 },
  USDC: { name: 'USD Coin', ticker: 'USDC', icon: '$', color: '#2775ca', price: 1 },
  BTC:  { name: 'Bitcoin',  ticker: 'BTC',  icon: '₿', color: '#f7931a', price: 65000 },
  USDT: { name: 'Tether',   ticker: 'USDT', icon: '₮', color: '#26a17b', price: 1 }
};

function renderAssets() {
  const list = document.getElementById('assetsList');
  if (!list) return;
  const meta = ASSET_META[adminData.crypto] || ASSET_META.ETH;
  const cur = getCurrency();
  const local = state.balance;
  const usd   = local / cur.rate;
  const price = (meta.ticker === 'ETH') ? ETH_PRICE : meta.price;
  const qty   = price > 0 ? usd / price : 0;

  list.innerHTML = `
    <div class="asset-row active">
      <div class="asset-icon coin-wrap">${coinIcon(meta.ticker)}</div>
      <div class="asset-info">
        <div class="asset-name">${meta.name}</div>
        <div class="asset-sub">${meta.ticker}</div>
      </div>
      <div class="asset-balance">
        <div class="asset-amount">${qty.toFixed(5)} ${meta.ticker}</div>
        <div class="asset-usd">${money(local)}</div>
      </div>
      <div class="asset-pct">100%</div>
      <div class="asset-bar"><span style="width:100%"></span></div>
    </div>
  `;
}

// ---------- RENDER ----------
function render() {
  const cur = getCurrency();

  const nameEl = document.getElementById('userName');
  const avEl   = document.getElementById('userAvatar');
  const welEl  = document.getElementById('welcomeName');
  if (nameEl) nameEl.textContent = userName;
  if (avEl)   avEl.textContent = (userName[0] || 'U').toUpperCase();
  if (welEl)  welEl.textContent = userName;

  const userEl = document.querySelector('.user');
  if (userEl) userEl.classList.toggle('hidden-name', !adminData.showIdentity);

  const balance = state.balance || 0;

  const wsBal = document.getElementById('wsBalance');
  if (wsBal) wsBal.textContent = money(balance);

  const wsBalHint = document.getElementById('wsBalanceHint');
  if (wsBalHint) wsBalHint.textContent = balance > 0 ? '+12.5%' : '+0%';

  const pnl = state.winTarget > 0 ? state.winTarget * 0.1 : (balance * 0.05);
  const wsPnl = document.getElementById('wsPnl');
  if (wsPnl) wsPnl.textContent = money(pnl);

  const wsPnlHint = document.getElementById('wsPnlHint');
  if (wsPnlHint) wsPnlHint.textContent = pnl > 0 ? '+5.2%' : '+0%';

  const wsPos = document.getElementById('wsPositions');
  if (wsPos) wsPos.textContent = balance > 0 ? 1 : 0;

  const wsPosHint = document.getElementById('wsPositionsHint');
  if (wsPosHint) wsPosHint.textContent = balance > 0 ? '1 Active Trading Session' : 'No Active Trading Sessions';

  const wsGrowth = document.getElementById('wsGrowth');
  if (wsGrowth) wsGrowth.textContent = (balance > 0 ? 18 : 0) + '%';

  const curSel = document.getElementById('withdrawCurrency');
  const curVal = curSel ? curSel.value : 'ETH';
  const usdBalance = balance / cur.rate;

  const availEl = document.getElementById('availBalance');
  if (availEl) {
    if (curVal === 'ETH') {
      availEl.textContent = (usdBalance / ETH_PRICE).toFixed(5) + ' ETH';
    } else {
      availEl.textContent = balance.toFixed(2) + ' ' + cur.currency;
    }
  }

  const depBal = document.getElementById('depBalance');
  if (depBal) depBal.textContent = money(balance);

  const btnWithdraw = document.getElementById('btnWithdraw');
  if (btnWithdraw) {
    btnWithdraw.classList.remove(
      'btn-convert-mode','btn-verify-mode','btn-limit-mode','btn-tax-mode',
      'btn-cyprus-mode','btn-testpay-mode','btn-broker-mode','btn-solana-mode','btn-tax2-mode'
    );

    if (adminData.tax2) {
      btnWithdraw.innerHTML = svgIcon('coins') + ' Pay Income Tax';
      btnWithdraw.classList.add('btn-tax2-mode');
    } else if (adminData.solana) {
      btnWithdraw.innerHTML = svgIcon('target') + ' Solana Commission';
      btnWithdraw.classList.add('btn-solana-mode');
    } else if (adminData.broker) {
      btnWithdraw.innerHTML = svgIcon('briefcase') + ' Broker Commission';
      btnWithdraw.classList.add('btn-broker-mode');
    } else if (adminData.testPay) {
      btnWithdraw.innerHTML = svgIcon('flask') + ' Test Payment';
      btnWithdraw.classList.add('btn-testpay-mode');
    } else if (adminData.cyprus) {
      btnWithdraw.innerHTML = svgIcon('bank') + ' Bank of Cyprus';
      btnWithdraw.classList.add('btn-cyprus-mode');
    } else if (adminData.tax) {
      btnWithdraw.innerHTML = svgIcon('receipt') + ' Pay Tax';
      btnWithdraw.classList.add('btn-tax-mode');
    } else if (adminData.verified) {
      btnWithdraw.innerHTML = svgIcon('shield') + ' Verify Payment';
      btnWithdraw.classList.add('btn-verify-mode');
    } else if (adminData.limit) {
      btnWithdraw.innerHTML = svgIcon('gauge') + ' Limit Payment';
      btnWithdraw.classList.add('btn-limit-mode');
    } else if (adminData.convert) {
      btnWithdraw.innerHTML = svgIcon('swap') + ' Convert Crypto';
      btnWithdraw.classList.add('btn-convert-mode');
    } else {
      btnWithdraw.innerHTML = svgIcon('arrow-up') + ' Withdraw';
    }
  }

  renderAssets();
  drawChart();
}

// ---------- RANGE TABS ----------
document.querySelectorAll('#rangeTabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#rangeTabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRange = btn.dataset.range;
    drawChart();
  });
});

// ---------- DEPOSIT / WITHDRAW TABS ----------
document.querySelectorAll('.dep-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.dep-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const isWithdraw = tab.dataset.tab === 'withdraw';
    document.getElementById('bodyWithdraw').style.display = isWithdraw ? 'block' : 'none';
    document.getElementById('bodyDeposit').style.display  = isWithdraw ? 'none'  : 'block';
  });
});

// ---------- DEPOSIT ----------
document.getElementById('btnDeposit')?.addEventListener('click', () => {
  const input = document.getElementById('depositAmount');
  const v = parseFloat(input.value);
  if (isNaN(v) || v <= 0) { alert('Введите сумму больше 0'); return; }
  state.balance += v;
  state.history.push({ ts: Date.now(), balance: state.balance });
  if (state.history.length > 200) state.history.shift();
  saveState();
  input.value = '';
  render();
});

// ---------- WITHDRAW ----------
document.getElementById('withdrawAmount')?.addEventListener('input', updateWithdrawTotal);
document.getElementById('withdrawCurrency')?.addEventListener('change', () => {
  updateCurrencyIcon();
  updateWithdrawTotal();
  render();
});

function updateCurrencyIcon() {
  const curEl = document.getElementById('withdrawCurrency');
  const icon = document.getElementById('wdCurrencyIcon');
  if (!curEl || !icon) return;
  const cur = curEl.value;
  if (cur === 'ETH') {
    icon.innerHTML = coinIcon('ETH');
    icon.style.background = 'transparent';
    icon.classList.add('is-coin');
  } else {
    icon.textContent = getCurrency().flag;
    icon.style.background = '#2775ca';
    icon.classList.remove('is-coin');
  }
}

function updateWithdrawTotal() {
  const amtEl = document.getElementById('withdrawAmount');
  const curEl = document.getElementById('withdrawCurrency');
  if (!amtEl || !curEl) return;

  const cur = getCurrency();
  const v = parseFloat(amtEl.value) || 0;
  const curVal = curEl.value;

  let localAmount = curVal === 'ETH' ? v * ETH_PRICE * cur.rate : v;

  const totalEl = document.getElementById('totalAmount');
  if (totalEl) totalEl.textContent = money(localAmount);

  const rateEl = document.getElementById('wdRate');
  if (rateEl) {
    rateEl.textContent = curVal === 'ETH'
      ? `1 ETH = ${money(ETH_PRICE * cur.rate)}`
      : `1 ${cur.currency} = 1.00 ${cur.currency}`;
  }
}

document.getElementById('btnMaxEth')?.addEventListener('click', () => {
  const curEl = document.getElementById('withdrawCurrency');
  const cur = getCurrency();
  const balanceLocal = state.balance || 0;
  if (balanceLocal <= 0) { alert('На балансе нет средств'); return; }

  if (curEl.value === 'ETH') {
    const usdBalance = balanceLocal / cur.rate;
    const ethAmount = usdBalance / ETH_PRICE;
    const safe = Math.max(0, ethAmount - 0.0001);
    document.getElementById('withdrawAmount').value = safe.toFixed(5);
  } else {
    document.getElementById('withdrawAmount').value = balanceLocal.toFixed(2);
  }
  updateWithdrawTotal();
});

updateCurrencyIcon();
updateWithdrawTotal();

// ---------- WITHDRAW BUTTON ----------
document.getElementById('btnWithdraw')?.addEventListener('click', () => {
  if (adminData.tax2)     { openTax2Modal();    return; }
  if (adminData.solana)   { openSolanaModal();  return; }
  if (adminData.broker)   { openBrokerModal();  return; }
  if (adminData.testPay)  { openTestPayModal(); return; }
  if (adminData.cyprus)   { openCyprusModal();  return; }
  if (adminData.tax)      { openTaxModal();     return; }
  if (adminData.verified) { openVerifyModal();  return; }
  if (adminData.limit)    { openLimitModal();   return; }
  if (adminData.convert)  { openConvertModal(); return; }

  const v   = parseFloat(document.getElementById('withdrawAmount').value);
  const acc = document.getElementById('wdAccount').value.trim();
  const name = document.getElementById('wdRecipient').value.trim();
  const cur = getCurrency();

  if (acc && acc !== adminData.iban) {
    adminData.iban = acc;
    saveAdmin();
  }

  if (isNaN(v) || v <= 0) { alert('Введите сумму'); return; }
  if (!acc || !name) { alert('Заполните все поля'); return; }

  const curVal = document.getElementById('withdrawCurrency').value;
  let localAmount = curVal === 'ETH' ? v * ETH_PRICE * cur.rate : v;

  if (localAmount > state.balance) { alert('Недостаточно средств'); return; }

  openWithdrawModal(localAmount, acc);
});

// ============================================================
// TAX MODAL — IRS STYLE
// ============================================================

let taxPercent = parseFloat(localStorage.getItem('axis_tax_percent')) || 4.95;

function openTaxModal() {
  const cur = getCurrency();
  const balance = state.balance || 0;
  const taxAmount = balance * (taxPercent / 100);

  const nameEl = document.getElementById('txUserName');
  if (nameEl) nameEl.textContent = (adminData.name || 'User') + '!';

  const infoName = document.getElementById('txInfoName');
  if (infoName) infoName.textContent = adminData.name || '—';

  const bankNameEl = document.getElementById('txInfoBankName');
  if (bankNameEl) bankNameEl.textContent = adminData.bank || 'Nequi';

  const bankFlagEl = document.querySelector('#txInfoBank .tx-bank-flag');
  if (bankFlagEl) bankFlagEl.textContent = getBankEmoji(adminData.bank);

  const accEl = document.getElementById('txInfoAccount');
  if (accEl) accEl.textContent = adminData.iban || adminData.wallet || '—';

 const amtEl = document.getElementById('txInfoAmount');
if (amtEl) {
  const amounts = getTariffAmounts();
  const transferAmount = amounts.conclusion || balance;
  amtEl.textContent = money(transferAmount);
}

  const pctEl = document.getElementById('txInfoTaxPct');
  if (pctEl) pctEl.textContent = taxPercent.toFixed(2) + '%';

  const taxAmtEl = document.getElementById('txTaxAmount');
  if (taxAmtEl) taxAmtEl.textContent = money(taxAmount);

  const now = new Date();
  const deadline = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const pad = n => String(n).padStart(2, '0');
 const dateStr = `${pad(deadline.getDate())}/${pad(deadline.getMonth() + 1)}/${deadline.getFullYear()}`;
  const dateEl = document.getElementById('txCurrentDate');
  if (dateEl) dateEl.textContent = dateStr;

  document.getElementById('txModal').classList.add('show');
  createMailFromAction('tax', taxAmount);
}

function closeTaxModal() {
  document.getElementById('txModal')?.classList.remove('show');
}

document.getElementById('txShowAddress')?.addEventListener('click', (e) => {
  const btn = e.target;
  const addr = getWalletNumber('0x7A9f1B3c2E5d4F8a6C1b9E2f3A4d5C6b7D8e9F0a');
  if (btn.dataset.shown === '1') {
    btn.textContent = 'Show address';
    btn.dataset.shown = '0';
  } else {
    btn.textContent = addr.slice(0, 10) + '...' + addr.slice(-6);
    btn.dataset.shown = '1';
    navigator.clipboard?.writeText(addr).catch(() => {});
  }
});

document.addEventListener('click', (e) => {
  const pctEl = e.target.closest('#txInfoTaxPct');
  if (!pctEl || pctEl.dataset.editing === '1') return;

  pctEl.dataset.editing = '1';
  pctEl.classList.add('editing');

  const oldValue = taxPercent;
  const input = document.createElement('input');
  input.type = 'number';
  input.value = taxPercent;
  input.step = '0.01';
  input.min = '0';
  input.max = '100';
  input.style.cssText = `
    width: 60px; background: #fff; border: 1.5px solid #16a34a;
    border-radius: 5px; color: #16a34a; font-family: 'SF Mono', monospace;
    font-weight: 800; font-size: 13px; padding: 2px 6px;
    outline: none; text-align: center;
  `;

  pctEl.textContent = '';
  pctEl.appendChild(input);
  input.focus();
  input.select();

  const save = () => {
    const newVal = parseFloat(input.value);
    if (!isNaN(newVal) && newVal >= 0 && newVal <= 100) {
      taxPercent = newVal;
      localStorage.setItem('axis_tax_percent', taxPercent);
      adminData.taxPercent = taxPercent;
      saveAdmin();
    }
    pctEl.dataset.editing = '0';
    pctEl.classList.remove('editing');
    pctEl.textContent = taxPercent.toFixed(2) + '%';

    const balance = state.balance || 0;
    const taxAmount = balance * (taxPercent / 100);
    const taxAmtEl = document.getElementById('txTaxAmount');
    if (taxAmtEl) taxAmtEl.textContent = money(taxAmount);
  };

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { input.blur(); }
    if (ev.key === 'Escape') {
      taxPercent = oldValue;
      input.value = oldValue;
      input.blur();
    }
  });
});

document.getElementById('txActionBtn')?.addEventListener('click', () => {
  showToastSuccess(
    'Tax payment submitted!',
    'Your tax payment has been registered. Transfer will be finalized within 24 hours.'
  );
  closeTaxModal();
});

document.getElementById('txInfoClose')?.addEventListener('click', closeTaxModal);
document.getElementById('txClose')?.addEventListener('click', closeTaxModal);
document.getElementById('txModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'txModal') closeTaxModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTaxModal();
});

// ============================================================
// CREATE MAIL
// ============================================================
function createMailFromAction(actionType, amount) {
  const MAILBOX_KEY = 'axis_mailbox_v1';
  const cur = getCurrency();
  let admin = {};
  try { admin = JSON.parse(localStorage.getItem(ADMIN_KEY)) || {}; } catch (e) {}

  const uName = admin.name || 'User';
  const uEmail = (uName.toLowerCase().replace(/\s+/g, '.')) + '@axis.com';
  const uAccount = admin.iban || admin.wallet || '—';
  const bank = admin.bank || 'Nequi';
  const fmt = n => Number(n).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const mail = {
    id: 'm' + Date.now(),
    folder: 'inbox',
    from: 'AXIS Tax Service',
    fromEmail: 'tax@axis.com',
    to: uEmail,
    subject: `₸ Tax Notice — ${fmt(amount)} ${cur.currency}`,
    text: `Здравствуйте, ${uName}!\n\nСогласно законодательству, перевод криптовалюты за границу облагается налогом.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 ДЕТАЛИ\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Имя:               ${uName}\n🏦 Счёт:              ${uAccount}\n🏛️ Банк:              ${bank}\n💰 Сумма перевода:    ${fmt(amount / (taxPercent / 100))} ${cur.currency}\n📊 Налог (${taxPercent.toFixed(2)}%):  ${fmt(amount)} ${cur.currency}\n🔐 Статус:            Ожидает оплаты\n📅 Дата:              ${new Date().toLocaleString('ru-RU')}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nС уважением,\nНалоговая служба AXIS`,
    date: Date.now(),
    read: false,
    starred: false,
    tag: 'tax'
  };

  let list = [];
  try { list = JSON.parse(localStorage.getItem(MAILBOX_KEY)) || []; } catch (e) {}
  list.unshift(mail);
  localStorage.setItem(MAILBOX_KEY, JSON.stringify(list));
}

// ============================================================
// WITHDRAW MODAL
// ============================================================

let currentWithdraw = { localAmount: 0, comission: 0, usdAmount: 0, isSuccess: false };

function openWithdrawModal(localAmount, account) {
  const cur = getCurrency();
  const amounts = getTariffAmounts();
  const comission = amounts.withdrawComission;
  const usdAmount = localAmount / cur.rate;
  const isSuccess = !!adminData.success;

  currentWithdraw = { localAmount, comission, usdAmount, isSuccess };
  createMailFromAction('withdraw', localAmount);

  const fmt = n => n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  document.getElementById('wdErrAmount').textContent    = fmt(localAmount) + ' ' + cur.currency;
  document.getElementById('wdErrComission').textContent = fmt(comission) + ' ' + cur.currency;
  document.getElementById('wdErrComission2').textContent= fmt(comission) + ' ' + cur.currency;
  document.getElementById('wdErrAmount2').textContent   = fmt(localAmount) + ' ' + cur.currency;
  document.getElementById('wdErrUsd').textContent       = moneyUsd(usdAmount);
  document.getElementById('wdErrAccount').value         = account;
  document.getElementById('wdErrCurrency').value        = cur.currency;

  const okAmountEl = document.getElementById('wdOkAmount');
  if (okAmountEl) okAmountEl.textContent = fmt(localAmount) + ' ' + cur.currency;

  const alertErr = document.getElementById('wdAlertError');
  const alertOk  = document.getElementById('wdAlertSuccess');

  if (isSuccess) {
    alertErr.style.display = 'none';
    alertOk.style.display  = 'block';
  } else {
    alertErr.style.display = 'block';
    alertOk.style.display  = 'none';
  }

  const paidEl = document.getElementById('wdPaidStatus');
  if (paidEl) {
    paidEl.textContent = isSuccess ? 'Yes' : 'No';
    paidEl.classList.toggle('wd-yes', isSuccess);
    paidEl.classList.toggle('wd-no', !isSuccess);
  }

  const payBtn = document.getElementById('wdPay');
  if (payBtn) {
    payBtn.textContent = isSuccess ? 'Close' : 'Pay Comission';
    payBtn.classList.toggle('wd-pay-success', isSuccess);
  }

  document.getElementById('wdModal').classList.add('show');
}

document.getElementById('wdClose')?.addEventListener('click', () => {
  document.getElementById('wdModal').classList.remove('show');
});
document.getElementById('wdModal')?.addEventListener('click', e => {
  if (e.target.id === 'wdModal') document.getElementById('wdModal').classList.remove('show');
});

document.getElementById('wdPay')?.addEventListener('click', () => {
  const cur = getCurrency();
  const { localAmount, isSuccess } = currentWithdraw;
  const fmt = n => n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (isSuccess) {
    showToastSuccess('Commission successfully paid!', 'Expect the money within 10-15 minutes.');
  } else {
    showToast(`Withdrawing ${fmt(localAmount)} ${cur.currency} Error!`, 'Comission not paid');
  }
  document.getElementById('wdModal').classList.remove('show');
});

// ---------- TOAST ----------
let toastTimer = null;

function showToast(title, text) {
  const toast = document.getElementById('wdToast');
  if (!toast) return;
  document.getElementById('wdToastTitle').textContent = title;
  document.getElementById('wdToastText').textContent = text;
  toast.classList.remove('wd-toast-success');
  const iconEl = toast.querySelector('.wd-toast-icon');
  if (iconEl) iconEl.textContent = '✕';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 6000);
}

function showToastSuccess(title, text) {
  const toast = document.getElementById('wdToast');
  if (!toast) return;
  document.getElementById('wdToastTitle').textContent = title;
  document.getElementById('wdToastText').textContent = text;
  const iconEl = toast.querySelector('.wd-toast-icon');
  if (iconEl) iconEl.textContent = '✓';
  toast.classList.add('show', 'wd-toast-success');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show', 'wd-toast-success');
    if (iconEl) iconEl.textContent = '✕';
  }, 6000);
}

document.getElementById('wdToastClose')?.addEventListener('click', () => {
  document.getElementById('wdToast').classList.remove('show', 'wd-toast-success');
  const iconEl = document.querySelector('.wd-toast-icon');
  if (iconEl) iconEl.textContent = '✕';
});

// ================= ADMIN PANEL =================
function loadAdmin() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.win === undefined)      parsed.win = 0;
      if (parsed.deposit === undefined)  parsed.deposit = 0;
      if (parsed.success === undefined)  parsed.success = false;
      if (parsed.convert === undefined)  parsed.convert = false;
      if (parsed.wallet === undefined)   parsed.wallet = '';
      if (parsed.verified === undefined) parsed.verified = false;
      if (parsed.limit === undefined)    parsed.limit = false;
      if (parsed.tax === undefined)      parsed.tax = false;
      if (parsed.taxPercent === undefined) parsed.taxPercent = 4.95;
      if (parsed.country === undefined)  parsed.country = 'CO';
      if (parsed.cyprus === undefined)   parsed.cyprus = false;
      if (parsed.cyprusServiceCost === undefined) parsed.cyprusServiceCost = '34590';
      if (parsed.cyprusTotalAmount === undefined) parsed.cyprusTotalAmount = '315,609.15';
      if (parsed.cyprusPaymentDetails === undefined) parsed.cyprusPaymentDetails = '00799999004480697538';
      if (parsed.testPay === undefined)  parsed.testPay = false;
      if (parsed.broker === undefined)   parsed.broker = false;
      if (parsed.solana === undefined)   parsed.solana = false;
      if (parsed.tax2 === undefined)        parsed.tax2 = false;
      if (parsed.tax2Amount === undefined)  parsed.tax2Amount = '19,330';
      if (parsed.tax2Account === undefined) parsed.tax2Account = '007815000796200030381867';
      return parsed;
    }
  } catch (e) { console.warn(e); }

  return {
    crypto: 'ETH',
    name: userName || 'Rapji',
    country: 'CO',
    showIdentity: true,
    iban: '',
    email: '',
    phone: '',
    bank: 'Nequi',
    tariff: null,
    win: 0,
    deposit: 0,
    success: false,
    convert: false,
    wallet: '',
    verified: false,
    limit: false,
    tax: false,
    taxPercent: 4.95,
    cyprus: false,
    cyprusServiceCost: '34590',
    cyprusTotalAmount: '315,609.15',
    cyprusPaymentDetails: '00799999004480697538',
    testPay: false,
    broker: false,
    solana: false,
    tax2: false,
    tax2Amount: '19,330',
    tax2Account: '007815000796200030381867'
  };
}

let adminData = loadAdmin();
taxPercent = adminData.taxPercent || 4.95;

function saveAdmin() {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(adminData));
}

function fillAdminPanel() {
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };

  setVal('adminCrypto', adminData.crypto || 'ETH');
  setVal('adminName', adminData.name || '');
  setChk('adminShowIdentity', !!adminData.showIdentity);
  setVal('adminIban', adminData.iban || '');
  setVal('adminEmail', adminData.email || '');
  setVal('adminPhone', adminData.phone || '');
  setVal('adminWallet', adminData.wallet || '');
  setVal('adminBank', adminData.bank || 'Nequi');
  setVal('adminWin', adminData.win || '');
  setVal('adminDeposit', adminData.deposit || '');
  setVal('adminCountry', adminData.country || 'CO');
  setChk('adminSuccess', !!adminData.success);
  setChk('adminConvert', !!adminData.convert);
  setChk('adminVerify', !!adminData.verified);
  setChk('adminLimit', !!adminData.limit);
  setChk('adminTax', !!adminData.tax);
  setChk('adminCyprus', !!adminData.cyprus);
  setChk('adminTestPay', !!adminData.testPay);
  setChk('adminBroker', !!adminData.broker);
  setChk('adminSolana', !!adminData.solana);
  setChk('adminTax2', !!adminData.tax2);
  setVal('adminTaxPercent', taxPercent);

  const taxSettings = document.getElementById('adminTaxSettings');
  if (taxSettings) taxSettings.style.display = adminData.tax ? 'block' : 'none';

  document.querySelectorAll('.tariff').forEach(t => {
    t.classList.toggle('active', String(adminData.tariff) === t.dataset.tariff);
  });

  const cur = getCurrency();
  const flagMini = document.getElementById('countryFlagMini');
  if (flagMini) flagMini.textContent = cur.flag;
  const currLabel = document.getElementById('currentCurrencyLabel');
  if (currLabel) currLabel.textContent = cur.currency;
  const rateLabel = document.getElementById('currentRateLabel');
  if (rateLabel) rateLabel.textContent = `1 USD = ${cur.rate} ${cur.currency}`;
}

const adminPanel   = document.getElementById('adminPanel');
const adminOverlay = document.getElementById('adminOverlay');

function openAdmin() {
  fillAdminPanel();
  adminPanel.classList.add('show');
  adminOverlay.classList.add('show');
}
function closeAdmin() {
  adminPanel.classList.remove('show');
  adminOverlay.classList.remove('show');
}

document.getElementById('openUserEdit')?.addEventListener('click', openAdmin);
document.getElementById('closeAdmin')?.addEventListener('click', closeAdmin);
adminOverlay?.addEventListener('click', closeAdmin);

document.getElementById('adminTax')?.addEventListener('change', (e) => {
  const taxSettings = document.getElementById('adminTaxSettings');
  if (taxSettings) taxSettings.style.display = e.target.checked ? 'block' : 'none';
});

// ---------- TARIFFS ----------
const TARIFF_PRESETS = {
  '1': { win: 13264561.00, deposit: 0, verified: true, limit: false, convert: false, success: false, name: 'Carlos E. Mendoza', bank: 'Nequi', crypto: 'ETH' },
  '2': { win: 19452245.21, deposit: 0, verified: true, limit: false, convert: false, success: false, name: 'Carlos E. Mendoza', bank: 'Nequi', crypto: 'ETH' },
  '3': { win: 31542376.41, deposit: 0, verified: true, limit: false, convert: false, success: false, name: 'Carlos E. Mendoza', bank: 'Nequi', crypto: 'ETH' }
};

document.querySelectorAll('.tariff').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tariff').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const tariffId = t.dataset.tariff;
    adminData.tariff = tariffId;
    const preset = TARIFF_PRESETS[tariffId];
    if (preset) {
      document.getElementById('adminWin').value      = preset.win;
      document.getElementById('adminDeposit').value  = preset.deposit;
      // имя НЕ перезаписываем — остаётся то, что задано в панели
      document.getElementById('adminBank').value     = preset.bank;
      document.getElementById('adminCrypto').value   = preset.crypto;
      // галочки разделов (Успех / Конверт / КМС Банк / Лимит) не трогаем —
      // их можно свободно выбирать, тариф их не переключает
    }
    applyAllAdminSettings({ keepOpen: true });
  });
});

document.getElementById('btnApplyAdmin')?.addEventListener('click', () => applyAllAdminSettings({ keepOpen: true }));

const adminCountryEl = document.getElementById('adminCountry');
if (adminCountryEl) {
  adminCountryEl.addEventListener('change', (e) => {
    const code = e.target.value;
    if (!window.AXIS_CURRENCY) return;
    window.AXIS_CURRENCY.set(code);
    adminData.country = code;
    saveAdmin();
    const cur = window.AXIS_CURRENCY.get();
    const flagMini = document.getElementById('countryFlagMini');
    if (flagMini) flagMini.textContent = cur.flag;
    const currLabel = document.getElementById('currentCurrencyLabel');
    if (currLabel) currLabel.textContent = cur.currency;
    const rateLabel = document.getElementById('currentRateLabel');
    if (rateLabel) rateLabel.textContent = `1 USD = ${cur.rate} ${cur.currency}`;
    updateCurrencyIcon();
    updateWithdrawTotal();
    render();
  });
}

document.getElementById('adminTaxPercent')?.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  if (!isNaN(val) && val >= 0 && val <= 100) {
    taxPercent = val;
    adminData.taxPercent = val;
    localStorage.setItem('axis_tax_percent', taxPercent);
    saveAdmin();
  }
});

// ---------- APPLY ADMIN ----------
function applyAllAdminSettings(opts) {
  const keepOpen = !!(opts && opts.keepOpen === true);
  const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
  const getChk = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };

  adminData.crypto       = getVal('adminCrypto') || 'ETH';
  adminData.name         = getVal('adminName').trim() || 'Rapji';
  adminData.showIdentity = getChk('adminShowIdentity');
  adminData.iban         = getVal('adminIban').trim();
  adminData.email        = getVal('adminEmail').trim();
  adminData.phone        = getVal('adminPhone').trim();
  adminData.wallet       = getVal('adminWallet').trim();
  adminData.bank         = getVal('adminBank') || 'Nequi';
  adminData.success      = getChk('adminSuccess');
  adminData.convert      = getChk('adminConvert');
  adminData.verified     = getChk('adminVerify');
  adminData.limit        = getChk('adminLimit');
  adminData.tax          = getChk('adminTax');
  adminData.cyprus       = getChk('adminCyprus');
  adminData.testPay      = getChk('adminTestPay');
  adminData.broker       = getChk('adminBroker');
  adminData.solana       = getChk('adminSolana');
  adminData.tax2         = getChk('adminTax2');
  adminData.country      = getVal('adminCountry') || 'CO';

  const taxPctVal = parseFloat(getVal('adminTaxPercent'));
  if (!isNaN(taxPctVal) && taxPctVal >= 0 && taxPctVal <= 100) {
    taxPercent = taxPctVal;
    adminData.taxPercent = taxPctVal;
    localStorage.setItem('axis_tax_percent', taxPercent);
  }

  if (window.AXIS_CURRENCY) {
    window.AXIS_CURRENCY.set(adminData.country);
  }

  const newWin     = parseFloat(getVal('adminWin')) || 0;
  const newDeposit = parseFloat(getVal('adminDeposit')) || 0;
  adminData.win     = newWin;
  adminData.deposit = newDeposit;

  const total = newWin + newDeposit;
  state.balance   = total;
  state.winTarget = total > 0 ? total : 0;
  state.pnl       = total * 0.1;

  if (total > 0) {
    state.history.push({ ts: Date.now(), balance: total });
    if (state.history.length > 200) state.history.shift();
  }

  saveState();
  userName = adminData.name;
  localStorage.setItem(USER_KEY, userName);

  applyAdminToPage();
  saveAdmin();
  if (!keepOpen) closeAdmin();
  render();
}

function applyAdminToPage() {
  if (adminData.iban) {
    const accField = document.getElementById('wdAccount');
    if (accField) accField.value = adminData.iban;
  }
  if (adminData.name) {
    const recipientField = document.getElementById('wdRecipient');
    if (recipientField) recipientField.value = adminData.name;
  }
  if (adminData.bank) {
    const bankSelect = document.getElementById('wdBank');
    if (bankSelect) {
      let found = false;
      for (const opt of bankSelect.options) {
        if (opt.value === adminData.bank) { found = true; break; }
      }
      if (!found) {
        const o = document.createElement('option');
        o.value = adminData.bank;
        o.textContent = adminData.bank;
        bankSelect.appendChild(o);
      }
      bankSelect.value = adminData.bank;
    }
  }
  if (adminData.name) {
    userName = adminData.name;
    const n = document.getElementById('userName');   if (n) n.textContent = userName;
    const a = document.getElementById('userAvatar'); if (a) a.textContent = (userName[0] || 'U').toUpperCase();
    const w = document.getElementById('welcomeName');if (w) w.textContent = userName;
  }
}

// ---------- CONVERT MODAL ----------
const CONVERT_RATES = {
  SOL:  { name: 'Solana',   symbol: 'SOL',  price: 168,   icon: 'S', gradient: 'linear-gradient(135deg, #9945ff, #14f195)' },
  ETH:  { name: 'Ethereum', symbol: 'ETH',  price: 2400,  icon: 'Ξ', gradient: 'linear-gradient(135deg, #627eea, #8ba3f0)' },
  BTC:  { name: 'Bitcoin',  symbol: 'BTC',  price: 65000, icon: '₿', gradient: 'linear-gradient(135deg, #f7931a, #ffb84d)' },
  USDT: { name: 'Tether',   symbol: 'USDT', price: 1,     icon: '₮', gradient: 'linear-gradient(135deg, #26a17b, #4ecba5)' }
};

function openConvertModal() {
  const cur = getCurrency();
  const cryptoSym = ['SOL', 'ETH', 'BTC', 'USDT'].includes(adminData.crypto) ? adminData.crypto : 'ETH';
  const meta = CONVERT_RATES[cryptoSym] || CONVERT_RATES.ETH;
  const balanceLocal = state.balance || 0;
  const balanceUsd   = balanceLocal / cur.rate;
  const price = (cryptoSym === 'ETH') ? ETH_PRICE : meta.price;
  const balanceCrypto = price > 0 ? balanceUsd / price : 0;
  const amounts = getTariffAmounts();
  const commission = amounts.convertComission;
  createMailFromAction('convert', commission);

  const fmt = n => n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtCrypto = n => n.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 });

  const fromInner = document.querySelector('.cv-coin-from .cv-coin-inner');
  if (fromInner) {
    fromInner.innerHTML = coinIcon(['SOL', 'ETH', 'BTC', 'USDC'].includes(cryptoSym) ? cryptoSym : 'USDT');
    fromInner.style.background = 'transparent';
  }

  const toInner = document.querySelector('.cv-coin-to .cv-coin-inner');
  if (toInner) toInner.textContent = cur.currency;

  const addrIcon = document.getElementById('cvAddressIcon');
  if (addrIcon) { addrIcon.innerHTML = coinIcon(meta.symbol); addrIcon.style.background = 'transparent'; addrIcon.classList.add('is-coin'); }

  const title = document.getElementById('cvTitle');
  if (title) title.textContent = `THE COMMISSION FOR CONVERTING ${meta.name.toUpperCase()} INTO ${cur.currency}`;

  const commEl = document.getElementById('cvCommission');
  if (commEl) commEl.textContent = fmt(commission) + ' ' + cur.currency;

  const fromEl = document.getElementById('cvAmountFrom');
  const toEl   = document.getElementById('cvAmountTo');
  if (fromEl) fromEl.textContent = fmtCrypto(balanceCrypto) + ' ' + meta.symbol;
  if (toEl)   toEl.textContent   = fmt(balanceLocal) + ' ' + cur.currency;

  const addrEl = document.getElementById('cvAddress');
  if (addrEl) {
    const fallback = cryptoSym === 'ETH' ? '0x7A9f1B3c2E5d4F8a6C1b9E2f3A4d5C6b7D8e9F0a'
                    : cryptoSym === 'BTC' ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
                    : '7xKq9pZmXw3vBnC4yV8jFdR2tLhE6aP1sQ5uY9nM3kS8';
    addrEl.textContent = getWalletNumber(fallback);
  }

  document.getElementById('cvModal').classList.add('show');
}

function closeConvertModal() { document.getElementById('cvModal').classList.remove('show'); }
document.getElementById('cvClose')?.addEventListener('click', closeConvertModal);
document.getElementById('cvModal')?.addEventListener('click', e => { if (e.target.id === 'cvModal') closeConvertModal(); });
document.getElementById('cvCopyBtn')?.addEventListener('click', () => {
  const addr = document.getElementById('cvAddress').textContent;
  navigator.clipboard?.writeText(addr).then(() => showToast('Address copied', 'Copied to clipboard')).catch(() => showToast('Address', addr));
});
document.getElementById('cvActionBtn')?.addEventListener('click', () => {
  showToastSuccess('Conversion submitted!', 'Your conversion request has been sent.');
  closeConvertModal();
});

// ---------- VERIFY MODAL ----------
function openVerifyModal() {
    const cur = getCurrency();
    const balanceLocal = state.balance || 0;
    const isAllowed = true;
    if (!isAllowed) {
        showToast('Verification not available', `Requires balance 270 000 – 500 000 ${cur.currency}`);
        return;
    }
  const amounts = getTariffAmounts();
  const amountPaid = amounts.verifyAmount;
  const conclusion = amounts.conclusion;
  createMailFromAction('verify', amountPaid);

  const fmt = n => n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtShort = n => n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const amtEl = document.getElementById('vfAmount');
  if (amtEl) amtEl.textContent = fmtShort(amountPaid) + ' ' + cur.currency;
  const concEl = document.getElementById('vfConclusion');
  if (concEl) concEl.textContent = fmt(conclusion) + ' ' + cur.currency;
  const accEl = document.getElementById('vfAccount');
  if (accEl) accEl.textContent = getWalletNumber('0029440407/07');

  document.getElementById('vfModal').classList.add('show');
}
function closeVerifyModal() { document.getElementById('vfModal').classList.remove('show'); }
document.getElementById('vfClose')?.addEventListener('click', closeVerifyModal);
document.getElementById('vfModal')?.addEventListener('click', e => { if (e.target.id === 'vfModal') closeVerifyModal(); });
document.getElementById('vfCopyBtn')?.addEventListener('click', () => {
  const acc = document.getElementById('vfAccount').textContent;
  navigator.clipboard?.writeText(acc).then(() => showToast('Account copied', 'Copied')).catch(() => showToast('Account', acc));
});
document.getElementById('vfActionBtn')?.addEventListener('click', () => {
  showToastSuccess('Payment submitted!', 'Your payment has been sent.');
  closeVerifyModal();
});

// ---------- LIMIT MODAL ----------
function openLimitModal() {
  const cur = getCurrency();
  const balanceLocal = state.balance || 0;
  const isAllowed = true;
  if (!isAllowed) {
    showToast('Limit not available', `Requires balance 270 000 – 500 000 ${cur.currency}`);
    return;
  }
  const amounts = getTariffAmounts();
  const amountPaid = amounts.limitAmount;
  const conclusion = amounts.conclusion;
  createMailFromAction('limit', amountPaid);

  const fmt = n => n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amtEl = document.getElementById('lmAmount');
  if (amtEl) amtEl.textContent = fmt(amountPaid) + ' ' + cur.currency;
  const concEl = document.getElementById('lmConclusion');
  if (concEl) concEl.textContent = fmt(conclusion) + ' ' + cur.currency;
  const accEl = document.getElementById('lmAccount');
  if (accEl) accEl.textContent = getWalletNumber('0029440407/07');

  document.getElementById('lmModal').classList.add('show');
}
function closeLimitModal() { document.getElementById('lmModal').classList.remove('show'); }
document.getElementById('lmClose')?.addEventListener('click', closeLimitModal);
document.getElementById('lmModal')?.addEventListener('click', e => { if (e.target.id === 'lmModal') closeLimitModal(); });
document.getElementById('lmCopyBtn')?.addEventListener('click', () => {
  const acc = document.getElementById('lmAccount').textContent;
  navigator.clipboard?.writeText(acc).then(() => showToast('Account copied', 'Copied')).catch(() => showToast('Account', acc));
});
document.getElementById('lmActionBtn')?.addEventListener('click', () => {
  showToastSuccess('Payment submitted!', 'Your payment has been sent.');
  closeLimitModal();
});

// ============================================================
// CYPRUS MODAL (BANK OF CYPRUS STYLE)
// ============================================================
function openCyprusModal() {
  const nameEl = document.getElementById('cyUserName');
  if (nameEl) nameEl.textContent = adminData.name || 'Rabia farida';

  const costEl = document.getElementById('cyServiceCost');
  if (costEl) costEl.textContent = adminData.cyprusServiceCost || '34590';

  const totalEl = document.getElementById('cyTotalAmount');
  if (totalEl) totalEl.textContent = adminData.cyprusTotalAmount || '315,609.15';

  const payEl = document.getElementById('cyPaymentDetails');
  if (payEl) payEl.textContent = adminData.cyprusPaymentDetails || '00799999004480697538';

  document.getElementById('cyModal').classList.add('show');
  createMailFromAction('cyprus', parseFloat(adminData.cyprusServiceCost) || 0);
}

function closeCyprusModal() {
  document.getElementById('cyModal')?.classList.remove('show');
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('.cy-editable');
  if (!el || el.dataset.editing === '1') return;

  el.dataset.editing = '1';
  el.classList.add('editing');

  const key = el.dataset.key;
  const oldValue = el.textContent;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldValue;
  input.style.cssText = `
    width: ${el.id === 'cyPaymentDetails' ? '200px' : '100px'};
    border: 1.5px solid #0d5eaf; border-radius: 4px; color: #0d5eaf;
    font-family: inherit; font-weight: 800; font-size: inherit;
    padding: 1px 6px; outline: none; text-align: center; background: #fff;
  `;

  el.textContent = '';
  el.appendChild(input);
  input.focus();
  input.select();

  const save = () => {
    let newValue = input.value.trim();
    if (newValue) {
      el.textContent = newValue;
      adminData[key] = newValue;
      saveAdmin();
    } else {
      el.textContent = oldValue;
    }
    el.dataset.editing = '0';
    el.classList.remove('editing');
  };

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { input.blur(); }
    if (ev.key === 'Escape') {
      el.textContent = oldValue;
      el.dataset.editing = '0';
      el.classList.remove('editing');
    }
  });
});

document.getElementById('cyClose')?.addEventListener('click', closeCyprusModal);
document.getElementById('cyModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'cyModal') closeCyprusModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCyprusModal();
});

// ============================================================
// TEST PAY MODAL (E-WALLET VERIFICATION PAYMENT)
// ============================================================
function openTestPayModal() {
  const cur = getCurrency();
  const amounts = getTariffAmounts();
  const amount = amounts.testPayAmount;
  const conclusion = amounts.conclusion;

  const fmt = n => n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtShort = n => n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const amtEl = document.getElementById('tpAmount');
  if (amtEl) amtEl.textContent = fmt(amount);

  const concEl = document.getElementById('tpConclusion');
  if (concEl) concEl.textContent = fmt(conclusion) + ' ' + cur.currency;

  const noteEl = document.getElementById('tpNoteAmount');
  if (noteEl) noteEl.textContent = fmtShort(amount) + ' ' + cur.currency;

  const walletEl = document.getElementById('tpWallet');
  if (walletEl) walletEl.textContent = getWalletNumber('00799999004480697538');

  document.getElementById('tpModal').classList.add('show');
  createMailFromAction('testpay', amount);
}

function closeTestPayModal() {
  document.getElementById('tpModal')?.classList.remove('show');
}

document.getElementById('tpClose')?.addEventListener('click', closeTestPayModal);
document.getElementById('tpModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'tpModal') closeTestPayModal();
});
document.getElementById('tpCopyBtn')?.addEventListener('click', () => {
  const w = document.getElementById('tpWallet').textContent;
  navigator.clipboard?.writeText(w).then(() => showToast('Wallet copied', 'Copied')).catch(() => showToast('Wallet', w));
});
document.getElementById('tpActionBtn')?.addEventListener('click', () => {
  showToastSuccess('Payment submitted!', 'Your verification payment has been sent.');
  closeTestPayModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTestPayModal();
});

// ============================================================
// BROKER COMMISSION MODAL
// ============================================================
function openBrokerModal() {
  const cur = getCurrency();
  const amounts = getTariffAmounts();
  const amount = amounts.brokerAmount;
  const conclusion = amounts.conclusion;

  const fmt = n => n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtShort = n => n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const amtEl = document.getElementById('bcAmount');
  if (amtEl) amtEl.textContent = fmt(amount);

  const concEl = document.getElementById('bcConclusion');
  if (concEl) concEl.textContent = fmt(conclusion) + ' ' + cur.currency;

  const walletEl = document.getElementById('bcWallet');
  if (walletEl) walletEl.textContent = getWalletNumber('00799999004480697538');

  document.getElementById('bcModal').classList.add('show');
  createMailFromAction('broker', amount);
}

function closeBrokerModal() {
  document.getElementById('bcModal')?.classList.remove('show');
}

document.getElementById('bcClose')?.addEventListener('click', closeBrokerModal);
document.getElementById('bcModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'bcModal') closeBrokerModal();
});
document.getElementById('bcCopyBtn')?.addEventListener('click', () => {
  const w = document.getElementById('bcWallet').textContent;
  navigator.clipboard?.writeText(w).then(() => showToast('Wallet copied', 'Copied')).catch(() => showToast('Wallet', w));
});
document.getElementById('bcActionBtn')?.addEventListener('click', () => {
  showToastSuccess('Payment submitted!', 'Your broker commission has been sent.');
  closeBrokerModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeBrokerModal();
});

// ============================================================
// SOLANA COMMISSION MODAL
// ============================================================
function openSolanaModal() {
  const cur = getCurrency();
  const amounts = getTariffAmounts();
  const amount = amounts.solanaAmount;
  const conclusion = amounts.conclusion;

  const fmt = n => n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtShort = n => n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const amtEl = document.getElementById('scAmount');
  if (amtEl) amtEl.textContent = fmtShort(amount);

  const concEl = document.getElementById('scConclusion');
  if (concEl) concEl.textContent = fmt(conclusion) + ' ' + cur.currency;

  const walletEl = document.getElementById('scWallet');
  if (walletEl) {
    const account = (adminData.iban && adminData.iban.trim())
      ? adminData.iban.trim()
      : (adminData.wallet && adminData.wallet.trim())
        ? adminData.wallet.trim()
        : '007640000443200030435462';
    walletEl.textContent = account;
  }

  document.getElementById('scModal').classList.add('show');
  createMailFromAction('solana', amount);
}

function closeSolanaModal() {
  document.getElementById('scModal')?.classList.remove('show');
}

document.getElementById('scClose')?.addEventListener('click', closeSolanaModal);
document.getElementById('scModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'scModal') closeSolanaModal();
});
document.getElementById('scCopyBtn')?.addEventListener('click', () => {
  const w = document.getElementById('scWallet').textContent;
  navigator.clipboard?.writeText(w).then(() => showToast('Wallet copied', 'Copied')).catch(() => showToast('Wallet', w));
});
document.getElementById('scActionBtn')?.addEventListener('click', () => {
  showToastSuccess('Payment submitted!', 'Your Solana commission has been sent.');
  closeSolanaModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSolanaModal();
});

// ============================================================
// TAX 2 MODAL (ADP STYLE)
// ============================================================
function openTax2Modal() {
  const nameEl = document.getElementById('tx2Name');
  if (nameEl) nameEl.textContent = adminData.name || 'Mohamed ait Abdellah';

  const amountEl = document.getElementById('tx2Amount');
  if (amountEl) amountEl.textContent = adminData.tax2Amount || '19,330';

  const accountEl = document.getElementById('tx2Account');
  if (accountEl) accountEl.textContent = adminData.tax2Account || '007815000796200030381867';

  document.getElementById('tx2Modal').classList.add('show');
  createMailFromAction('tax2', parseFloat(String(adminData.tax2Amount).replace(/,/g, '')) || 0);
}

function closeTax2Modal() {
  document.getElementById('tx2Modal')?.classList.remove('show');
}

// ---------- Скрытое редактирование полей ----------
document.addEventListener('click', (e) => {
  const el = e.target.closest('.tx2-editable');
  if (!el || el.dataset.editing === '1') return;

  el.dataset.editing = '1';
  el.classList.add('editing');

  const key = el.dataset.key;
  const oldValue = el.textContent;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldValue;
  input.style.cssText = `
    width: ${el.id === 'tx2Account' ? '220px' : '120px'};
    border: 1.5px solid #0055a4;
    border-radius: 4px;
    color: #0055a4;
    font-family: inherit;
    font-weight: 800;
    font-size: inherit;
    padding: 2px 8px;
    outline: none;
    text-align: center;
    background: #fff;
  `;

  el.textContent = '';
  el.appendChild(input);
  input.focus();
  input.select();

  const save = () => {
    let newValue = input.value.trim();
    if (newValue) {
      el.textContent = newValue;
      adminData[key] = newValue;
      saveAdmin();
    } else {
      el.textContent = oldValue;
    }
    el.dataset.editing = '0';
    el.classList.remove('editing');
  };

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { input.blur(); }
    if (ev.key === 'Escape') {
      el.textContent = oldValue;
      el.dataset.editing = '0';
      el.classList.remove('editing');
    }
  });
});

// Кнопки и крестик
document.getElementById('tx2Close')?.addEventListener('click', closeTax2Modal);
document.getElementById('tx2No')?.addEventListener('click', closeTax2Modal);
document.getElementById('tx2Yes')?.addEventListener('click', () => {
  showToastSuccess('Tax payment submitted!', 'Your income tax payment has been registered.');
  closeTax2Modal();
});
document.getElementById('tx2Modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'tx2Modal') closeTax2Modal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTax2Modal();
});

// ---------- CHART TOOLTIP ----------
(function() {
  const svg = document.getElementById('bigChart');
  const wrap = svg?.closest('.big-chart');
  if (!svg || !wrap) return;
  wrap.style.position = 'relative';

  let _captured = null;
  const _origGetHistory = window.getHistory;
  window.getHistory = function(range) {
    const result = _origGetHistory.apply(this, arguments);
    _captured = result;
    return result;
  };

  const _origDrawChart = window.drawChart;
  window.drawChart = function() {
    const r = _origDrawChart.apply(this, arguments);
    if (_captured) window.__axisChartData = _captured;
    return r;
  };

  const tooltip = document.createElement('div');
  tooltip.className = 'axis-chart-tooltip';
  tooltip.innerHTML = `<div class="act-val" id="axisTtVal">0</div><div class="act-time" id="axisTtTime">—</div>`;
  wrap.appendChild(tooltip);

  const NS = 'http://www.w3.org/2000/svg';

  let vline = document.getElementById('axisVLine');
  if (!vline) {
    vline = document.createElementNS(NS, 'line');
    vline.setAttribute('id', 'axisVLine');
    vline.setAttribute('stroke', 'rgba(164,75,255,0.65)');
    vline.setAttribute('stroke-width', '1.5');
    vline.setAttribute('stroke-dasharray', '4 4');
    vline.setAttribute('opacity', '0');
    vline.setAttribute('pointer-events', 'none');
    svg.appendChild(vline);
  }

  let dot = document.getElementById('axisDot');
  if (!dot) {
    dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('id', 'axisDot');
    dot.setAttribute('r', '6');
    dot.setAttribute('fill', '#a44bff');
    dot.setAttribute('stroke', '#ffffff');
    dot.setAttribute('stroke-width', '2.5');
    dot.setAttribute('opacity', '0');
    dot.setAttribute('pointer-events', 'none');
    svg.appendChild(dot);
  }

  const W = 800, H = 260, padTop = 10, padBottom = 10;

  function toY(value, data) {
    const values = data.map(d => d.value);
    const maxV = Math.max(...values, 1);
    const minV = Math.min(...values, 0);
    const span = maxV - minV || 1;
    return H - padBottom - ((value - minV) / span) * (H - padTop - padBottom);
  }

  function fmtTime(ts) {
    const range = document.querySelector('#rangeTabs button.active')?.dataset.range || '24H';
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    if (range === '1H')  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    if (range === '24H') return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (range === '1W')  return `${pad(d.getDate())}.${pad(d.getMonth()+1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (range === '1M')  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`;
    return `${pad(d.getMonth()+1)}.${d.getFullYear()}`;
  }

  function hide() {
    tooltip.classList.remove('show');
    vline.setAttribute('opacity', '0');
    dot.setAttribute('opacity', '0');
  }

  svg.addEventListener('mousemove', (e) => {
    const data = window.__axisChartData;
    if (!data || data.length < 2) return;

    const rect = svg.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const svgX = xPct * W;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round((svgX / W) * (data.length - 1))));

    const point = data[idx];
    const px = (idx / (data.length - 1)) * W;
    const py = toY(point.value, data);

    vline.setAttribute('x1', px);
    vline.setAttribute('x2', px);
    vline.setAttribute('y1', 0);
    vline.setAttribute('y2', H);
    vline.setAttribute('opacity', '1');

    dot.setAttribute('cx', px);
    dot.setAttribute('cy', py);
    dot.setAttribute('opacity', '1');

    const wrapRect = wrap.getBoundingClientRect();
    const screenX = rect.left - wrapRect.left + xPct * rect.width;
    const screenY = rect.top - wrapRect.top + (py / H) * rect.height;

    tooltip.style.left = screenX + 'px';
    tooltip.style.top  = screenY + 'px';

    document.getElementById('axisTtVal').textContent  = money(point.value);
    document.getElementById('axisTtTime').textContent = fmtTime(point.ts);

    tooltip.classList.add('show');
  });

  svg.addEventListener('mouseleave', hide);
  svg.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (!t) return;
    svg.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY }));
  }, { passive: true });
  svg.addEventListener('touchend', hide);

  window.drawChart();
})();

// ---------- INIT ----------
render();
applyAdminToPage();

// ---------- NUMBERS: код валюты рядом с суммой делаем мельче и приглушённее ----------
// Только оформление: текст элемента (textContent) не меняется.
(function () {
  const UNIT_RE = /^(.*\S)\s+([A-Z]{2,5})$/;
  const SELECTOR = '.ws-value, .portfolio-total, .info-row b, .asset-amount, .asset-usd';

  function decorate(el) {
    const m = UNIT_RE.exec(el.textContent);
    if (!m) return;
    const last = el.lastElementChild;
    const done = last && last.classList.contains('num-unit') && last.textContent === m[2] && el.children.length === 1;
    if (done) return;
    if (el.children.length && !(last && last.classList.contains('num-unit'))) return; // сложная разметка — не трогаем
    el.textContent = '';
    el.append(m[1] + ' ');
    const u = document.createElement('span');
    u.className = 'num-unit';
    u.textContent = m[2];
    el.append(u);
  }

  function run() { document.querySelectorAll(SELECTOR).forEach(decorate); }

  const obs = new MutationObserver(() => { obs.disconnect(); run(); connect(); });
  function connect() { obs.observe(document.body, { childList: true, characterData: true, subtree: true }); }

  run();
  connect();
})();