// ================== TRADING (LIVE) ==================

const DASH_KEY = 'axis_dashboard_v1';
const ADMIN_KEY = 'axis_admin_data_v1';
const COP_RATE = 3190;

// ---------- STATE ----------
let state = (() => {
  try {
    const raw = localStorage.getItem(DASH_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { balance: 0, winTarget: 0, history: [] };
})();

let adminData = (() => {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
})();

let userName = localStorage.getItem('axis_user_name') || 'Carlos E. Mendoza';

function saveState() {
  localStorage.setItem(DASH_KEY, JSON.stringify(state));
}

// ---------- FORMAT ----------
function money(v) {
  return Number(v || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' COP';
}
function num(v, dec = 2) {
  return Number(v || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  });
}

// ---------- PRICE ----------
let currentPrice = 321600;
let startPrice   = 321600;
let high24       = 321600;
let low24        = 321600;
let volume24     = 1245891;

function updatePriceDisplay() {
  const pctChange = ((currentPrice - startPrice) / startPrice) * 100;

  document.getElementById('pairPrice').textContent  = num(currentPrice);
  document.getElementById('obMidPrice').textContent = num(currentPrice);

  const changeEl = document.getElementById('pairChange');
  const arrow = pctChange >= 0 ? '+' : '';
  changeEl.textContent = `${arrow}${pctChange.toFixed(2)}%`;

  const color = pctChange >= 0 ? '#29c26b' : '#ef4c5a';
  changeEl.style.color = color;
  document.getElementById('pairPrice').style.color = color;

  document.getElementById('statHigh').textContent = num(high24);
  document.getElementById('statLow').textContent  = num(low24);
  document.getElementById('statVolume').textContent = num(volume24, 0) + ' ETH';

  document.getElementById('currentPriceLabel').textContent = num(currentPrice);
}

// ---------- P&L TICKER (в топбар) ----------
let totalTrades = 0;
let pnlValue = 0;

function addPnlTicker() {
  const topbar = document.querySelector('.topbar-right');
  if (!topbar || document.getElementById('pnlTicker')) return;

  const div = document.createElement('div');
  div.id = 'pnlTicker';
  div.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(41,194,107,0.1);
    border: 1px solid rgba(41,194,107,0.3);
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    color: #29c26b;
    font-family: 'SF Mono', 'Consolas', monospace;
    margin-right: 10px;
  `;
  div.innerHTML = `
    <span style="font-size: 11px; color: #8b93a7; font-weight: 500;">P&L:</span>
    <span id="pnlValue">+0.00 COP</span>
    <span id="pnlPct" style="font-size: 11px; opacity: 0.85;">+0.00%</span>
  `;
  topbar.insertBefore(div, topbar.firstChild);
}

function updatePnlTicker() {
  const el = document.getElementById('pnlValue');
  const pctEl = document.getElementById('pnlPct');
  if (!el) return;

  const sign = pnlValue >= 0 ? '+' : '';
  el.textContent = sign + money(pnlValue);
  pctEl.textContent = sign + ((pnlValue / 1000) * 0.42).toFixed(2) + '%';

  const color = pnlValue >= 0 ? '#29c26b' : '#ef4c5a';
  const bg = pnlValue >= 0 ? 'rgba(41,194,107,0.1)' : 'rgba(239,76,90,0.1)';
  const border = pnlValue >= 0 ? 'rgba(41,194,107,0.3)' : 'rgba(239,76,90,0.3)';

  el.style.color = color;
  pctEl.parentElement.style.color = color;
  pctEl.parentElement.style.background = bg;
  pctEl.parentElement.style.borderColor = border;
}

// ---------- ORDER BOOK ----------
function renderOrderBook() {
  const asksEl = document.getElementById('obAsks');
  const bidsEl = document.getElementById('obBids');

  const base = currentPrice;
  const spread = base * 0.0006;

  let asksHtml = '';
  for (let i = 12; i >= 1; i--) {
    const price = base + spread * i;
    const amount = (Math.random() * 4 + 0.2).toFixed(4);
    const total = (price * amount).toFixed(2);
    const width = (i / 12) * 100;
    asksHtml += `
      <div class="ob-row">
        <span class="ob-bg" style="width:${width}%"></span>
        <span class="ob-price">${num(price)}</span>
        <span class="ob-amount">${amount}</span>
        <span class="ob-total">${num(total)}</span>
      </div>
    `;
  }
  asksEl.innerHTML = asksHtml;

  let bidsHtml = '';
  for (let i = 1; i <= 12; i++) {
    const price = base - spread * i;
    const amount = (Math.random() * 4 + 0.2).toFixed(4);
    const total = (price * amount).toFixed(2);
    const width = (i / 12) * 100;
    bidsHtml += `
      <div class="ob-row">
        <span class="ob-bg" style="width:${width}%"></span>
        <span class="ob-price">${num(price)}</span>
        <span class="ob-amount">${amount}</span>
        <span class="ob-total">${num(total)}</span>
      </div>
    `;
  }
  bidsEl.innerHTML = bidsHtml;
}

// ---------- CANDLES ----------
let candles = [];
const CANDLE_COUNT = 60;

function generateCandles() {
  candles = [];
  let price = currentPrice * 0.94;
  const now = Date.now();
  const stepMs = 5 * 60 * 1000;

  for (let i = 0; i < CANDLE_COUNT; i++) {
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.008;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * price * 0.003;
    const low  = Math.min(open, close) - Math.random() * price * 0.003;
    const volume = Math.random() * 100 + 20;

    candles.push({ time: now - (CANDLE_COUNT - 1 - i) * stepMs, open, high, low, close, volume });
    price = close;
  }
  // Дотягиваем до текущей цены
  const diff = currentPrice - candles[CANDLE_COUNT - 1].close;
  candles.forEach(c => {
    c.open += diff; c.close += diff; c.high += diff; c.low += diff;
  });
}

function drawCandles() {
  const gridEl = document.getElementById('candleGrid');
  const bodyEl = document.getElementById('candleBody');
  const wickEl = document.getElementById('candleWicks');
  const volEl  = document.getElementById('candleVolume');

  const W = 900, H = 420;
  const padTop = 20, padBot = 20;

  const maxHigh = Math.max(...candles.map(c => c.high));
  const minLow  = Math.min(...candles.map(c => c.low));
  const maxVol  = Math.max(...candles.map(c => c.volume));
  const priceRange = maxHigh - minLow || 1;

  const toY = v => H - padBot - ((v - minLow) / priceRange) * (H - padTop - padBot);
  const candleW = W / candles.length;
  const bodyW = candleW * 0.65;

  // Сетка
  let gridHtml = '';
  for (let i = 0; i <= 5; i++) {
    const y = padTop + (i / 5) * (H - padTop - padBot);
    gridHtml += `<line class="candle-grid-line" x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  }
  gridEl.innerHTML = gridHtml;

  let bodyHtml = '', wickHtml = '', volHtml = '';
  const volHeight = 60;

  candles.forEach((c, i) => {
    const x = i * candleW + candleW / 2;
    const isGreen = c.close >= c.open;
    const color = isGreen ? '#29c26b' : '#ef4c5a';

    const yOpen  = toY(c.open);
    const yClose = toY(c.close);
    const yHigh  = toY(c.high);
    const yLow   = toY(c.low);

    const yTop = Math.min(yOpen, yClose);
    const yBot = Math.max(yOpen, yClose);
    const height = Math.max(1, yBot - yTop);

    wickHtml += `<line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${color}" stroke-width="1"/>`;
    bodyHtml += `<rect x="${x - bodyW/2}" y="${yTop}" width="${bodyW}" height="${height}" fill="${color}" rx="1"/>`;
    const volH = (c.volume / maxVol) * volHeight;
    volHtml += `<rect x="${x - bodyW/2}" y="${H - padBot - volH}" width="${bodyW}" height="${volH}" fill="${color}" opacity="0.25"/>`;
  });

  wickEl.innerHTML = wickHtml;
  bodyEl.innerHTML = bodyHtml;
  volEl.innerHTML  = volHtml;

  // Линия текущей цены
  const lastClose = candles[candles.length - 1].close;
  const yPrice = toY(lastClose);
  const lineEl = document.getElementById('currentPriceLine');
  const labelEl = document.getElementById('currentPriceLabel');
  lineEl.setAttribute('y1', yPrice);
  lineEl.setAttribute('y2', yPrice);
  labelEl.setAttribute('y', yPrice - 5);
  labelEl.textContent = num(lastClose);
}

// ---------- RECENT TRADES ----------
function addTrade(amountHint = null) {
  const list = document.getElementById('tradesList');
  const isBuy = Math.random() > 0.5;
  const price = currentPrice + (Math.random() - 0.5) * currentPrice * 0.001;
  const amount = amountHint || (Math.random() * 2 + 0.01).toFixed(4);

  // ⏰ Время: Алжир + 1 час (= UTC)
  const time = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Amsterdam'
  });

  const row = document.createElement('div');
  row.className = 'trade-row';
  row.style.opacity = '0';
  row.style.transform = 'translateX(-8px)';
  row.innerHTML = `
    <span class="tr-price ${isBuy ? 'buy' : 'sell'}">${num(price)}</span>
    <span class="tr-amount">${amount}</span>
    <span class="tr-time">${time}</span>
  `;
  list.prepend(row);

  requestAnimationFrame(() => {
    row.style.transition = '0.25s';
    row.style.opacity = '1';
    row.style.transform = 'translateX(0)';
  });

  while (list.children.length > 30) list.lastChild.remove();
  return { isBuy, amount: parseFloat(amount), price };
}

// ---------- TRADE FORM ----------
let side = 'buy';

function getAvailableEth() {
  return (state.balance || 0) / currentPrice;
}
function getAvailableCOP() {
  return state.balance || 0;
}

function updateAvailable() {
  const availEl = document.getElementById('tfAvailable');
  if (side === 'buy') {
    availEl.textContent = num(getAvailableCOP(), 2) + ' COP';
  } else {
    availEl.textContent = num(getAvailableEth(), 5) + ' ETH';
  }
}

function updateTotal() {
  const price = parseFloat(document.getElementById('tfPrice').value) || 0;
  const amount = parseFloat(document.getElementById('tfAmount').value) || 0;
  const total = price * amount;

  document.getElementById('tfTotal').value = total ? total.toFixed(2) : '';

  const fee = total * 0.001;
  document.getElementById('tfFee').textContent = money(fee);

  if (side === 'buy') {
    const received = amount - amount * 0.001;
    document.getElementById('tfReceive').textContent = num(received, 5) + ' ETH';
  } else {
    const received = total - fee;
    document.getElementById('tfReceive').textContent = money(received);
  }
}

function updateSubmitButton() {
  const btn = document.getElementById('tfSubmit');
  const text = document.getElementById('tfSubmitText');
  btn.classList.remove('buy', 'sell');
  btn.classList.add(side);
  text.textContent = side === 'buy' ? 'Buy ETH' : 'Sell ETH';
}

// ---------- AUTO-TRADING (имитация активности) ----------
function simulateUserTrade() {
  // 78% — прибыль для пользователя, 22% — убыток
  const isProfitable = Math.random() < 0.78;
  const amount = parseFloat((Math.random() * 0.8 + 0.05).toFixed(4));

  // Добавляем сделку в список
  const trade = addTrade(amount.toString());

  // P&L
  const delta = isProfitable
    ? Math.random() * 3200 + 400
    : -(Math.random() * 1400 + 200);

  pnlValue += delta;
  totalTrades++;

  updatePnlTicker();

  // Реальное изменение цены
  const priceMove = (delta / 10000) * currentPrice * 0.0004;
  currentPrice += priceMove;

  // Обновляем high/low/volume
  high24 = Math.max(high24, currentPrice);
  low24  = Math.min(low24,  currentPrice);
  volume24 += amount * currentPrice * 0.08;

  // Обновляем последнюю свечу
  const last = candles[candles.length - 1];
  last.close = currentPrice;
  last.high  = Math.max(last.high, currentPrice);
  last.low   = Math.min(last.low,  currentPrice);
  last.volume += amount * 5;

  // Плавно двигаем цену
  updatePriceDisplay();
  drawCandles();

  // 🔥 УВЕДОМЛЕНИЯ — теперь намного чаще (55%) и с разнообразием
  const roll = Math.random();

  if (isProfitable) {
    // Прибыль: показываем тост с вероятностью 55%
    if (roll < 0.55) {
      const variants = [
        {
          title: `+${money(delta)} profit`,
          text: `${trade.isBuy ? '🟢 Buy' : '🔴 Sell'} ${amount} ETH @ ${num(currentPrice)} COP`
        },
        {
          title: `✅ Trade closed +${num((delta / 1000) * 0.42, 2)}%`,
          text: `${trade.isBuy ? 'Long' : 'Short'} position · ${amount} ETH`
        },
        {
          title: `💰 Profit secured`,
          text: `+${money(delta)} · ${trade.isBuy ? 'Buy' : 'Sell'} order filled`
        }
      ];
      const pick = variants[Math.floor(Math.random() * variants.length)];
      showToastSuccess(pick.title, pick.text);
    }
  } else {
    // Убыток: показываем тост с вероятностью 35%
    if (roll < 0.35) {
      const variants = [
        {
          title: `⚠️ ${money(delta)} loss`,
          text: `Stop-loss triggered · ${amount} ETH @ ${num(currentPrice)} COP`
        },
        {
          title: `📉 Position closed -${num(Math.abs(delta) / 1000 * 0.42, 2)}%`,
          text: `${trade.isBuy ? 'Long' : 'Short'} · ${amount} ETH`
        }
      ];
      const pick = variants[Math.floor(Math.random() * variants.length)];
      showToast(pick.title, pick.text);
    }
  }

  // 🔔 Бонус — случайные "информационные" уведомления
  if (Math.random() < 0.08) {
    const info = [
      {
        title: '📊 Volume spike detected',
        text: `24h volume: ${num(volume24, 0)} ETH`
      },
      {
        title: '🔥 Price movement',
        text: `ETH/COP now ${num(currentPrice)} COP`
      },
      {
        title: '⚡ Order filled instantly',
        text: `Latency 12ms · ${amount} ETH`
      },
      {
        title: '🎯 Take-profit hit',
        text: `Target reached at ${num(currentPrice)} COP`
      }
    ];
    const pick = info[Math.floor(Math.random() * info.length)];
    showToastSuccess(pick.title, pick.text);
  }
}

// ---------- TICK (лёгкое движение графика) ----------
function tick() {
  // Микро-колебания цены
  const drift = (Math.random() - 0.5) * currentPrice * 0.00035;
  currentPrice += drift;

  high24 = Math.max(high24, currentPrice);
  low24  = Math.min(low24,  currentPrice);
  volume24 += Math.random() * 15;

  // Обновляем последнюю свечу
  const last = candles[candles.length - 1];
  last.close = currentPrice;
  last.high  = Math.max(last.high, currentPrice);
  last.low   = Math.min(last.low,  currentPrice);
  last.volume += Math.random() * 2;

  updatePriceDisplay();
  drawCandles();

  // Order book обновляется чуть реже
  if (Math.random() < 0.35) renderOrderBook();
}

// ---------- EVENTS ----------
document.querySelectorAll('.trade-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.trade-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    side = tab.dataset.side;
    document.querySelector('.tf-label').textContent =
      side === 'buy' ? 'Available (COP)' : 'Available (ETH)';
    updateAvailable();
    updateTotal();
    updateSubmitButton();
  });
});

document.getElementById('tfPrice').addEventListener('input', updateTotal);
document.getElementById('tfAmount').addEventListener('input', updateTotal);

document.querySelectorAll('.tf-percents button').forEach(b => {
  b.addEventListener('click', () => {
    const pct = parseInt(b.dataset.percent) / 100;
    const price = parseFloat(document.getElementById('tfPrice').value) || currentPrice;
    if (side === 'buy') {
      const COP = getAvailableCOP();
      document.getElementById('tfAmount').value = ((COP * pct) / price).toFixed(5);
    } else {
      const eth = getAvailableEth();
      document.getElementById('tfAmount').value = (eth * pct).toFixed(5);
    }
    updateTotal();
  });
});

document.getElementById('tfMax').addEventListener('click', () => {
  const price = parseFloat(document.getElementById('tfPrice').value) || currentPrice;
  if (side === 'buy') {
    document.getElementById('tfAmount').value = (getAvailableCOP() / price).toFixed(5);
  } else {
    document.getElementById('tfAmount').value = getAvailableEth().toFixed(5);
  }
  updateTotal();
});

document.getElementById('tfSubmit').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('tfAmount').value) || 0;
  const price  = parseFloat(document.getElementById('tfPrice').value) || 0;
  const total  = amount * price;

  if (amount <= 0) { showToast('Invalid amount', 'Enter amount greater than 0'); return; }

  if (side === 'buy') {
    if (total > getAvailableCOP()) { showToast('Insufficient balance', 'Not enough COP'); return; }
    state.balance -= total;
    saveState();
    showToastSuccess('Buy order placed', `Bought ${amount.toFixed(5)} ETH for ${money(total)}`);
    pnlValue += total * 0.001;
  } else {
    if (amount > getAvailableEth()) { showToast('Insufficient balance', 'Not enough ETH'); return; }
    state.balance += total;
    saveState();
    showToastSuccess('Sell order placed', `Sold ${amount.toFixed(5)} ETH for ${money(total)}`);
    pnlValue += total * 0.001;
  }

  updatePnlTicker();
  addTrade(amount.toFixed(4));
  document.getElementById('tfAmount').value = '';
  updateTotal();
  updateAvailable();
});

document.querySelectorAll('.ob-tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.ob-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const view = t.dataset.view;
    document.querySelector('.ob-asks').style.display = view === 'bids' ? 'none' : 'flex';
    document.querySelector('.ob-bids').style.display = view === 'asks' ? 'none' : 'flex';
  });
});

document.querySelectorAll('.chart-tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.chart-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    generateCandles();
    drawCandles();
  });
});

// ---------- TOAST ----------
let toastTimer = null;
function showToast(title, text) {
  const toast = document.getElementById('wdToast');
  document.getElementById('wdToastTitle').textContent = title;
  document.getElementById('wdToastText').textContent = text;
  toast.classList.remove('wd-toast-success');
  const iconEl = toast.querySelector('.wd-toast-icon');
  if (iconEl) iconEl.textContent = '✕';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}
function showToastSuccess(title, text) {
  const toast = document.getElementById('wdToast');
  document.getElementById('wdToastTitle').textContent = title;
  document.getElementById('wdToastText').textContent = text;
  const iconEl = toast.querySelector('.wd-toast-icon');
  if (iconEl) iconEl.textContent = '✓';
  toast.classList.add('show', 'wd-toast-success');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show', 'wd-toast-success');
    if (iconEl) iconEl.textContent = '✕';
  }, 4000);
}
document.getElementById('wdToastClose').addEventListener('click', () => {
  document.getElementById('wdToast').classList.remove('show', 'wd-toast-success');
});

// ---------- USER ----------
function renderUser() {
  document.getElementById('userName').textContent = userName;
  document.getElementById('userAvatar').textContent = (userName[0] || 'U').toUpperCase();
}

// ---------- INIT ----------
function init() {
  renderUser();
  addPnlTicker();
  updatePriceDisplay();
  renderOrderBook();
  generateCandles();
  drawCandles();
  updateAvailable();
  updateTotal();
  updateSubmitButton();

  // 🔥 Запускаем живой тик
  setInterval(tick, 250);              // микро-колебания цены 4 раза/сек
  setInterval(simulateUserTrade, 1400); // сделки каждые 1.4 сек
  setInterval(renderOrderBook, 900);   // ордера обновляются ~1 раз/сек
  setInterval(addTrade, 600);          // новые сделки каждые 600 мс

  // Обновляем "Available" если баланс изменился
  setInterval(updateAvailable, 3000);

  // Плавное начальное движение цены
  let initialDrift = setInterval(() => {
    if (Math.abs(currentPrice - startPrice) < startPrice * 0.01) {
      currentPrice += (Math.random() - 0.42) * currentPrice * 0.0008;
      high24 = Math.max(high24, currentPrice);
      low24 = Math.min(low24, currentPrice);
      volume24 += Math.random() * 30;
      const last = candles[candles.length - 1];
      last.close = currentPrice;
      last.high = Math.max(last.high, currentPrice);
      last.low = Math.min(last.low, currentPrice);
      updatePriceDisplay();
      drawCandles();
    } else {
      clearInterval(initialDrift);
    }
  }, 200);
}

init(); 