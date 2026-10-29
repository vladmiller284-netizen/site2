 // ================== BROKERS — PAYMENTS OVERVIEW ==================
// Совместим с index.html (Brokers). Не конфликтует с Analytics.

const STORAGE_KEY = 'axis_payments_v4';
const USER_KEY    = 'axis_user_name';
const ADMIN_KEY   = 'axis_admin_data_v1';

// ---------- STATE ----------
let payments     = [];
let userName     = 'Carlos Mendoza';   // имя профиля зафиксировано
let currentTab   = 'all';
let currentStatus = 'all';
let searchQuery  = '';

// ---------- ВАЛЮТА ----------
function getCurrency() {
  if (window.AXIS_CURRENCY && typeof window.AXIS_CURRENCY.get === 'function') {
    return window.AXIS_CURRENCY.get();
  }
  return { currency: 'USD', rate: 1, flag: '🇺🇸', country: 'USA' };
}

// ---------- ИКОНКИ (SVG-спрайт в index.html) ----------
function icon(name, cls) {
  return `<svg class="ic ${cls || ''}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

// ---------- ЭМБЛЕМА БАНКА ----------
function getBankIcon(bankName) {   
  const bank = String(bankName || '').toLowerCase();
  if (bank.includes('barid') || bank.includes('poste')) return icon('mail');
  if (bank.includes('security')) return icon('shield');
  if (bank.includes('sber') || bank.includes('tinkoff') || bank.includes('revolut') ||
      bank.includes('mono') || bank.includes('privat')) return icon('card');
  return icon('bank');
}

// ---------- ALGERIAN DATA ----------
const ALGERIAN_FIRST_NAMES = [
  'Mohamed', 'Amine', 'Yacine', 'Riad', 'Karim', 'Sofiane', 'Bilal', 'Adel',
  'Nabil', 'Hicham', 'Walid', 'Rachid', 'Samir', 'Omar', 'Ali', 'Mehdi',
  'Anis', 'Ayoub', 'Ilyes', 'Zakaria', 'Reda', 'Fares', 'Nassim', 'Aymen',
  'Abdellah', 'Khaled', 'Tarek', 'Lotfi', 'Farid', 'Djamel', 'Rafik',
  'Sid Ahmed', 'Bouziane', 'Hocine', 'Mouloud', 'Bachir', 'Salah', 'Mourad',
  'Amina', 'Yasmine', 'Lina', 'Nour', 'Sara', 'Meriem', 'Imane', 'Khadija',
  'Nadia', 'Leila', 'Aya', 'Rania', 'Sonia', 'Wissam', 'Hiba', 'Dounia',
  'Kahina', 'Fella', 'Assia', 'Sabrina', 'Lydia', 'Nesrine', 'Chahrazad',
  'Warda', 'Hayet', 'Souad', 'Malika', 'Zohra', 'Fatiha', 'Nawel'
];

const ALGERIAN_LAST_NAMES = [
  'Benali', 'Boudiaf', 'Bouzid', 'Cherif', 'Hamidi', 'Khelifi', 'Mansouri',
  'Meziane', 'Belkacem', 'Zeroual', 'Larbi', 'Benaissa', 'Bouteldja',
  'Hadjadj', 'Amrani', 'Taleb', 'Saidi', 'Ouali', 'Brahimi', 'Ferhat',
  'Guerroudj', 'Hammoudi', 'Kaci', 'Lounis', 'Mahmoudi', 'Naceri',
  'Rahmani', 'Slimani', 'Tounsi', 'Yahiaoui', 'Zidane', 'Belaid',
  'Chaoui', 'Djebbar', 'El Amrani', 'Fekir', 'Ghezali', 'Hachemi',
  'Bouzidi', 'Merabet', 'Bekhti', 'Ould Ali', 'Hadj', 'Rahmouni',
  'Benkhelifa', 'Bendjebbar', 'Zitouni', 'Oukaci', 'Berkane'
];

const ALGERIAN_BANKS = ['Banco Popular', 'Banco de Bogotá','Banco Davivienda','BBVA Colombia','Bancolombia'];
const PAYMENT_METHODS = ['Bank transfer'];

// ---------- HELPERS ----------
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randAccount() {
  let s = '00';
  for (let i = 0; i < 18; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function randAmount() {
  if (Math.random() < 0.88) {
    return +(240 + Math.random() * 260).toFixed(2);
  }
  return +(500 + Math.random() * 2000).toFixed(2);
}

function randStatus() {
  const r = Math.random();
  if (r < 0.72) return 'Success';
  if (r < 0.90) return 'In process';
  return 'Error';
}

function formatDate(d = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function randomWorkTime() {
  const now = Date.now();
  const msIn24h = 24 * 60 * 60 * 1000;
  const ts = now - Math.floor(Math.random() * msIn24h);
  return formatDate(new Date(ts));
}

function shortId() {
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  const seg = n => Array.from({ length: n }, hex).join('');
  return [
    seg(8),
    seg(4),
    '4' + seg(3),
    ((8 + Math.floor(Math.random() * 4)).toString(16)) + seg(3),
    seg(12)
  ].join('-');
}

function formatMoney(v) {
  return '$' + Number(v || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function maskAccount(acc) {
  const digits = String(acc).replace(/\D/g, '');
  return '•••• ' + digits.slice(-4);
}

function methodIcon(m) {
  if (/^\d+$/.test(m)) return icon('card');
  if (m === 'Bank transfer') return icon('bank');
  return icon('wallet');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// ---------- GENERATOR ----------
function generatePayment() {
  const firstName = rand(ALGERIAN_FIRST_NAMES);
  const lastName  = rand(ALGERIAN_LAST_NAMES);
  return {
    _key: 'gen_' + Math.random().toString(36).slice(2, 11),
    id: shortId(),
    fullName: `${firstName} ${lastName}`,
    bankName: rand(ALGERIAN_BANKS),
    bankAccount: randAccount(),
    amount: randAmount(),
    status: randStatus(),
    method: rand(PAYMENT_METHODS),
    date: randomWorkTime(),
    manual: false,
  };
}

// ---------- STORAGE ----------
function loadPayments() {
  let manual = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      manual = parsed.filter(p => p.manual === true);
    }
  } catch (e) { console.warn(e); }

  const usedIds = new Set(manual.map(p => p.id));
  const generated = [];

  const targetCount = 30 + Math.floor(Math.random() * 51);

  while (generated.length < targetCount) {
    const p = generatePayment();
    if (usedIds.has(p.id)) continue;
    usedIds.add(p.id);
    generated.push(p);
  }

  const all = [...manual, ...generated].sort((a, b) => {
    const toTs = s => {
      const [date, time] = s.split(', ');
      const [d, m, y] = date.split('.').map(Number);
      const [hh, mm] = time.split(':').map(Number);
      return new Date(y, m - 1, d, hh, mm).getTime();
    };
    return toTs(b.date) - toTs(a.date);
  });
  return all;
}

function savePayments() {
  const manual = payments.filter(p => p.manual === true);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(manual));
}

function saveUserName() {
  localStorage.setItem(USER_KEY, userName);
}

// ---------- FILTER ----------
function getFiltered() {
  return payments.filter(p => {
    if (currentTab === 'successful' && p.status !== 'Success') return false;
    if (currentTab === 'refunded' && p.status !== 'Error') return false;
    if (currentStatus !== 'all' && p.status !== currentStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hay = `${p.fullName} ${p.bankName} ${p.amount} ${p.method} ${p.status}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// ---------- CHART (24 hours) ----------
function updateChart() {
  const svgW = 400, svgH = 90, padding = 6;
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const hoursBack = 24;

  const bins = Array.from({ length: hoursBack }, () => ({
    success: 0,
    process: 0
  }));

  payments.forEach(p => {
    const parts = p.date.split(', ');
    if (parts.length !== 2) return;

    const [d, m, y] = parts[0].split('.').map(Number);
    const [hh, mm] = parts[1].split(':').map(Number);
    const ts = new Date(y, m - 1, d, hh, mm).getTime();

    const hoursAgo = Math.floor((now - ts) / hourMs);
    if (hoursAgo < 0 || hoursAgo >= hoursBack) return;

    const idx = hoursBack - 1 - hoursAgo;

    if (p.status === 'Success')    bins[idx].success += Number(p.amount);
    if (p.status === 'In process') bins[idx].process += Number(p.amount);
  });

  const successArr = bins.map(b => b.success);
  const processArr = bins.map(b => b.process);

  const maxVal = Math.max(...successArr, ...processArr, 1);
  const toY = v => svgH - padding - (v / maxVal) * (svgH - padding * 2);
  const toX = i => (i / (hoursBack - 1)) * svgW;

  function buildPath(values) {
    const pts = values.map((v, i) => [toX(i), toY(v)]);
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
    return d;
  }

  const successPath = buildPath(successArr);
  const processPath = buildPath(processArr);

  const lineSuccess  = document.getElementById('chartPaid');
  const lineProcess  = document.getElementById('chartPending');
  const areaSuccess  = document.getElementById('chartPaidArea');

  if (lineSuccess) lineSuccess.setAttribute('d', successPath);
  if (lineProcess) lineProcess.setAttribute('d', processPath);
  if (areaSuccess) {
    const lastX = toX(hoursBack - 1);
    areaSuccess.setAttribute('d', `${successPath} L${lastX},${svgH} L0,${svgH} Z`);
  }
}

// ---------- RENDER ----------
function render() {
  const tbody = document.getElementById('tbody');
  if (!tbody) return;

  const rows = getFiltered();

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty">Платежей не найдено</div></td></tr>`;
  } else {
    tbody.innerHTML = rows.map(p => `
      <tr data-key="${p._key}">
        <td><span class="pid">${escapeHtml(p.id.slice(0, 18))}…</span></td>
        <td class="client">${escapeHtml(p.fullName)}</td>
        <td class="bank">${escapeHtml(p.bankName || '—')} <span class="muted">${maskAccount(p.bankAccount)}</span></td>
        <td><span class="badge ${p.status.replace(/\s/g, '')}">${p.status}</span></td>
        <td class="amount">${formatMoney(p.amount)}<small>USD</small></td>
        <td>
          <span class="method">
            <span class="method-dot">${methodIcon(p.method)}</span>
            ${escapeHtml(p.method)}
          </span>
        </td>
        <td class="muted">${escapeHtml(p.date)}</td>
        <td>
          <div class="row-actions">
            <button class="act edit" title="Показать в USD" data-action="eye" aria-label="View">${icon('eye')}</button>
            <button class="act del" title="Удалить" data-action="delete" aria-label="Delete">${icon('trash')}</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  const resultsCount = document.getElementById('resultsCount');
  if (resultsCount) resultsCount.textContent = `${rows.length} results`;

  // --- Summary stats ---
  const total = rows.reduce((s, p) => s + Number(p.amount), 0);
  const success = rows.filter(p => p.status === 'Success').reduce((s, p) => s + Number(p.amount), 0);
  const processCount = rows.filter(p => p.status === 'In process').length;
  const errorCount   = rows.filter(p => p.status === 'Error').length;

  const totalAll = payments.reduce((s, p) => s + Number(p.amount), 0);
  const pct = totalAll > 0 ? (success / totalAll * 100) : 0;

  setText('statTotalCount', payments.length);
  setText('statPending', processCount);
  setText('statSent', formatMoney(totalAll));
  setHtml('summaryTotalPct', '+' + pct.toFixed(2) + '% ' + icon('arrow-ur', 'arr'));
  setHtml('summaryPaidPct', '+' + (pct * 0.23).toFixed(2) + '% ' + icon('arrow-ur', 'arr'));
  setText('summaryFailed', errorCount.toFixed(2));
  setText('summaryVolume', formatMoney(total));

  updateChart();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// ---------- MODAL: PAYMENT ----------
const modal = document.getElementById('modalBackdrop');
const form  = document.getElementById('paymentForm');

function openAdd() {
  if (!modal) return;
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) titleEl.textContent = 'Add payment';
  form.reset();
  const editId = document.getElementById('editId');
  if (editId) editId.value = '';
  modal.classList.add('show');
  setTimeout(() => document.getElementById('fullName')?.focus(), 50);
}

function openEdit(key) {
  const p = payments.find(x => x._key === key);
  if (!p) return;
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) titleEl.textContent = 'Edit payment';
  const editId = document.getElementById('editId');
  if (editId) editId.value = key;
  document.getElementById('fullName').value    = p.fullName;
  document.getElementById('bankName').value    = p.bankName || '';
  document.getElementById('bankAccount').value = maskToDisplay(p.bankAccount);
  document.getElementById('amount').value      = p.amount;
  document.getElementById('status').value      = p.status;
  document.getElementById('method').value      = p.method;
  modal.classList.add('show');
}

function maskToDisplay(acc) {
  const d = String(acc).replace(/\D/g, '');
  return d.replace(/(.{4})/g, '$1 ').trim();
}

function closeModal() { modal?.classList.remove('show'); }

function deletePayment(key) {
  if (!confirm('Удалить платёж?')) return;
  payments = payments.filter(p => p._key !== key);
  savePayments();
  render();
}

// ---------- MODAL: USER ----------
const userModal = document.getElementById('userModal');

function openUserModal() {
  if (!userModal) return;
  document.getElementById('userNameInput').value = userName;
  userModal.classList.add('show');
  setTimeout(() => document.getElementById('userNameInput')?.focus(), 50);
}
function closeUserModal() { userModal?.classList.remove('show'); }

function renderUserName() {
  const nameEl = document.getElementById('userName');
  const avEl = document.getElementById('userAvatar');
  if (nameEl) nameEl.textContent = userName;
  // аватар — фото rana.jpg с значком подтверждённого аккаунта (разметка в index.html)
}

// ============================================================
// PAYMENT DETAILS MODAL
// ============================================================

let currentPayment = null;

function openPaymentDetails(key, forceUsd = false) {
  const p = payments.find(x => x._key === key);
  if (!p) return;

  currentPayment = p;

  const idEl = document.getElementById('pdId');
  if (idEl) idEl.textContent = '#' + p.id.slice(0, 8).toUpperCase();

  const statusEl = document.getElementById('pdStatus');
  if (statusEl) {
    statusEl.classList.remove('success', 'process', 'error');
    let cls = 'success';
    let statusIcon = 'check';
    if (p.status === 'In process') { cls = 'process'; statusIcon = 'clock-c'; }
    if (p.status === 'Error')      { cls = 'error';   statusIcon = 'x'; }
    statusEl.classList.add(cls);
    const textEl = statusEl.querySelector('.pd-status-text');
    const iconEl = statusEl.querySelector('.pd-status-icon');
    if (textEl) textEl.textContent = p.status;
    if (iconEl) iconEl.innerHTML = icon(statusIcon);
  }

  const dateEl = document.getElementById('pdDate');
  if (dateEl) dateEl.textContent = p.date;

  // ---------- СУММА ----------
  const displayAmount = Number(p.amount) || 0;
  const displaySymbol = '$';

  const intPart = Math.floor(displayAmount).toLocaleString('en-US');
  const decPart = (displayAmount % 1).toFixed(2).substring(1);

  const intEl = document.getElementById('pdAmountInt');
  const decEl = document.getElementById('pdAmountDec');
  const curEl = document.querySelector('.pd-amount-currency');

  if (intEl) intEl.textContent = intPart;
  if (decEl) decEl.textContent = decPart;
  if (curEl) curEl.textContent = displaySymbol;

  const nameEl = document.getElementById('pdName');
  if (nameEl) nameEl.textContent = p.fullName;

  const bankEl = document.getElementById('pdBank');
  if (bankEl) bankEl.textContent = p.bankName || '—';

  // ---------- ЭМБЛЕМА БАНКА ----------
  const flagEl = document.getElementById('pdBankFlag');
  if (flagEl) {
    flagEl.innerHTML = getBankIcon(p.bankName);
  }

  const ibanEl = document.getElementById('pdIban');
  if (ibanEl) {
    const digits = String(p.bankAccount || '').replace(/\D/g, '');
    ibanEl.textContent = '••••' + digits.slice(-4);
    ibanEl.dataset.full = p.bankAccount || '';
  }

  const eyeBtn = document.getElementById('pdEyeBtn');
  if (eyeBtn) eyeBtn.classList.remove('active');

  const methodEl = document.getElementById('pdMethod');
  if (methodEl) methodEl.textContent = p.method;

  const backdrop = document.getElementById('pdBackdrop');
  if (backdrop) backdrop.classList.add('show');
}

function closePaymentDetails() {
  const backdrop = document.getElementById('pdBackdrop');
  if (backdrop) backdrop.classList.remove('show');
  currentPayment = null;
}

// ---------- Events для модалки деталей ----------
function setupPaymentDetailsEvents() {
  // Закрытие — крестик
  const closeBtn = document.getElementById('pdClose');
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closePaymentDetails();
    };
  }

  // Закрытие — кнопка Close
  const closeBtn2 = document.getElementById('pdCloseBtn');
  if (closeBtn2) {
    closeBtn2.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closePaymentDetails();
    };
  }

  // Клик по фону
  const backdrop = document.getElementById('pdBackdrop');
  if (backdrop) {
    backdrop.onclick = (e) => {
      if (e.target.id === 'pdBackdrop') closePaymentDetails();
    };
  }

  // ESC — закрыть всё
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePaymentDetails();
      closeModal();
      closeUserModal();
    }
  });

  // Глазик внутри модалки — показать/скрыть IBAN
  const innerEye = document.getElementById('pdEyeBtn');
  const ibanEl = document.getElementById('pdIban');
  if (innerEye && ibanEl) {
    let visible = false;
    innerEye.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentPayment) return;
      visible = !visible;
      innerEye.classList.toggle('active', visible);
      const digits = String(currentPayment.bankAccount || '').replace(/\D/g, '');
      if (visible) {
        ibanEl.textContent = digits.replace(/(.{4})/g, '$1 ').trim() || '—';
      } else {
        ibanEl.textContent = '••••' + digits.slice(-4);
      }
    };
  }

  // Клик по таблице — вешаем ОДИН раз
  const tbody = document.getElementById('tbody');
  if (tbody && !tbody.dataset.pdEventsAttached) {
    tbody.dataset.pdEventsAttached = '1';
    tbody.addEventListener('click', (e) => {
      // Глазик 👁 → модалка с USD
      const eyeBtn = e.target.closest('[data-action="eye"]');
      if (eyeBtn) {
        e.stopPropagation();
        const tr = eyeBtn.closest('tr');
        if (tr?.dataset.key) openPaymentDetails(tr.dataset.key, true);
        return;
      }

      // Корзинка 🗑 → удалить
      const delBtn = e.target.closest('[data-action="delete"]');
      if (delBtn) {
        e.stopPropagation();
        const tr = delBtn.closest('tr');
        if (tr?.dataset.key) deletePayment(tr.dataset.key);
        return;
      }

      // Клик по строке → модалка
      const tr = e.target.closest('tr');
      if (tr?.dataset.key) openPaymentDetails(tr.dataset.key, false);
    });
  }
}

// ---------- EVENTS (общие) ----------
function setupGeneralEvents() {
  document.getElementById('openAdd')?.addEventListener('click', openAdd);
  document.getElementById('closeModal')?.addEventListener('click', closeModal);
  document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  document.getElementById('openUserEdit')?.addEventListener('click', openUserModal);
  document.getElementById('closeUserModal')?.addEventListener('click', closeUserModal);
  document.getElementById('cancelUserBtn')?.addEventListener('click', closeUserModal);
  userModal?.addEventListener('click', e => { if (e.target === userModal) closeUserModal(); });

  document.getElementById('bankAccount')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 19);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const editKey = document.getElementById('editId').value;
    const data = {
      fullName:    document.getElementById('fullName').value.trim(),
      bankName:    document.getElementById('bankName').value.trim(),
      bankAccount: document.getElementById('bankAccount').value.replace(/\s/g, ''),
      amount:      parseFloat(document.getElementById('amount').value),
      status:      document.getElementById('status').value,
      method:      document.getElementById('method').value,
    };

    if (!data.fullName || !data.bankName || !data.bankAccount || isNaN(data.amount)) {
      alert('Заполните все поля корректно');
      return;
    }

    if (editKey) {
      const idx = payments.findIndex(p => p._key === editKey);
      if (idx !== -1) {
        payments[idx] = { ...payments[idx], ...data, manual: true };
      }
    } else {
      payments.unshift({
        _key: (crypto.randomUUID ? crypto.randomUUID() : 'k' + Date.now()),
        id: shortId(),
        date: formatDate(),
        manual: true,
        ...data,
      });
    }

    savePayments();
    render();
    closeModal();
  });

  document.getElementById('userForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('userNameInput').value.trim();
    if (!val) return;
    userName = val;
    saveUserName();
    renderUserName();
    closeUserModal();
  });

  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      currentTab = t.dataset.tab;
      render();
    });
  });

  const statusFilter = document.getElementById('statusFilter');
  const STATUS_CYCLE = ['all', 'Success', 'In process', 'Error'];

  statusFilter?.addEventListener('click', () => {
    const i = STATUS_CYCLE.indexOf(currentStatus);
    currentStatus = STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];

    statusFilter.innerHTML = icon('status', 'g') + (currentStatus === 'all' ? 'Status' : escapeHtml(currentStatus)) + icon('chev-down', 'chev');
    statusFilter.classList.toggle('active', currentStatus !== 'all');
    render();
  });

  document.getElementById('search')?.addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    render();
  });
}

// ---------- INIT ----------
function initApp() {
  payments = loadPayments();
  renderUserName();
  render();
  setupGeneralEvents();
  setupPaymentDetailsEvents();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}