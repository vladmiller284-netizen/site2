/* AXIS — карточка результата Rana Khaled (общая для leaderboard и analytics) */
(function () {
  if (window.__ranaCard) return; window.__ranaCard = true;

  const ENTRY = 6709;
  const rnd = (a, b) => a + Math.random() * (b - a);
  // Пул трендовых монет: при каждой загрузке страницы случайно выбираются 3 разные
  const G = (t, extra = '') => `<text x="12" y="17.5" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="${extra || 15}" fill="#fff">${t}</text>`;
  const POOL = [
    { sym: 'ETH',  name: 'Ethereum',  color: '#627eea', svg: '<path d="M12 2.5l6 9.6-6 3.6-6-3.6z" fill="#fff" fill-opacity=".95"/><path d="M12 17l6-3.7-6 8.5-6-8.5z" fill="#fff" fill-opacity=".75"/>' },
    { sym: 'BNB',  name: 'BNB Chain', color: '#f3ba2f', svg: '<g fill="#fff"><path d="M12 3.5l2.3 2.3L12 8.1 9.7 5.8z"/><path d="M6.2 9.3l2.3 2.3-2.3 2.3-2.3-2.3z"/><path d="M17.8 9.3l2.3 2.3-2.3 2.3-2.3-2.3z"/><path d="M12 15l2.3 2.3L12 19.6 9.7 17.3z"/><path d="M12 10.1l1.9 1.9-1.9 1.9-1.9-1.9z"/></g>' },
    { sym: 'DOGE', name: 'Dogecoin',  color: '#c2a633', svg: '<path d="M8.5 6.5h3.7a5.5 5.5 0 0 1 0 11H8.5zM6.5 12h7.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' },
    { sym: 'BTC',  name: 'Bitcoin',   color: '#f7931a', svg: G('₿', 16) },
    { sym: 'SOL',  name: 'Solana',    color: '#9945ff', svg: '<g fill="#fff"><path d="M7 6.5h11l-1.8 2.3H5.2z"/><path d="M7 10.9h11l-1.8 2.3H5.2z" transform="translate(0 0)"/><path d="M7 15.2h11l-1.800 2.300H5.200z"/></g>' },
    { sym: 'XRP',  name: 'XRP',       color: '#346aa9', svg: '<path d="M6 6.5l6 5.500 6-5.500M6 17.500l6-5.500 6 5.500" fill="none" stroke="#fff" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/>' },
    { sym: 'TON',  name: 'Toncoin',   color: '#0098ea', svg: '<path d="M5.500 7.500h13L12 18.500z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M12 7.500v11" stroke="#fff" stroke-width="2"/>' },
    { sym: 'LINK', name: 'Chainlink', color: '#2a5ada', svg: '<path d="M12 4l6.500 3.750v7.500L12 19l-6.500-3.750v-7.500z" fill="none" stroke="#fff" stroke-width="2.200" stroke-linejoin="round"/>' },
    { sym: 'AVAX', name: 'Avalanche', color: '#e84142', svg: '<path d="M12 5.500l7 12.500H5z" fill="#fff"/><path d="M12 11l2.500 4.500h-5z" fill="#e84142"/>' },
    { sym: 'ADA',  name: 'Cardano',   color: '#0a3fc0', svg: '<g fill="#fff"><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="5.800" r="1.200"/><circle cx="12" cy="18.200" r="1.200"/><circle cx="6.700" cy="9" r="1.200"/><circle cx="17.300" cy="9" r="1.200"/><circle cx="6.700" cy="15" r="1.200"/><circle cx="17.300" cy="15" r="1.200"/></g>' },
    { sym: 'LTC',  name: 'Litecoin',  color: '#345d9d', svg: G('Ł', 16) },
    { sym: 'SUI',  name: 'Sui',       color: '#4da2ff', svg: '<path d="M12 4.500c3 3.800 5.500 6 5.500 9a5.500 5.500 0 0 1-11 0c0-3 2.500-5.200 5.500-9z" fill="#fff"/>' },
    { sym: 'SHIB', name: 'Shiba Inu', color: '#f08a1c', svg: G('S', 16) },
    { sym: 'PEPE', name: 'Pepe',      color: '#3d8f3d', svg: '<circle cx="9" cy="10" r="2.200" fill="#fff"/><circle cx="15" cy="10" r="2.200" fill="#fff"/><path d="M7 15.500q5 3 10 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>' },
    { sym: 'TRX',  name: 'Tron',      color: '#eb0029', svg: '<path d="M5.500 6l13 2.500-6.500 11z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>' }
  ];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; };
  const BANDS = shuffle([[1500, 2700], [2800, 4200], [4300, 6200]]);      // у каждой из трёх монет свой диапазон процента
  const COINS = shuffle(POOL.slice()).slice(0, 3).map((c, i) => ({ ...c, pct: rnd(BANDS[i][0], BANDS[i][1]) }));
  COINS.forEach(c => { c.profit = ENTRY * c.pct / 100; });

  const fmt = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const coinIcon = (c, size) => `<span class="rc-coin" style="--cc:${c.color};width:${size}px;height:${size}px"><svg viewBox="0 0 24 24" width="${Math.round(size * .62)}" height="${Math.round(size * .62)}">${c.svg}</svg></span>`;
  const ic = d => `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

  const css = `
.rc-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:rgba(5,7,12,.72);backdrop-filter:blur(9px);opacity:0;pointer-events:none;transition:opacity .25s}
.rc-overlay.open{opacity:1;pointer-events:auto}
.rc-card{--cc:#627eea;position:relative;width:min(860px,100%);display:grid;grid-template-columns:1.12fr .88fr;border-radius:26px;overflow:hidden;font-family:var(--font,'Manrope',system-ui,sans-serif);color:var(--text,#e9edf5);border:1.5px solid transparent;
  background:radial-gradient(520px 260px at 100% 0,rgba(164,75,255,.24),transparent 70%) padding-box,radial-gradient(420px 240px at 0 100%,rgba(255,138,43,.11),transparent 70%) padding-box,linear-gradient(#0f131d,#0f131d) padding-box,linear-gradient(135deg,#ff8a2b,#ff3d8a 35%,#a44bff 68%,#2ea8ff) border-box;
  box-shadow:0 40px 90px -20px rgba(0,0,0,.8),0 0 70px -20px rgba(164,75,255,.5);transform:translateY(16px) scale(.97);transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.rc-overlay.open .rc-card{transform:none}
.rc-left{padding:26px 28px 24px;display:flex;flex-direction:column;gap:15px;min-width:0}
.rc-head{display:flex;align-items:center;gap:12px}
.rc-ava{width:46px;height:46px;border-radius:14px;padding:2px;background:linear-gradient(135deg,#ff8a2b,#ff3d8a 35%,#a44bff 68%,#2ea8ff);flex-shrink:0;position:relative}
.rc-ava img{display:block;width:100%;height:100%;object-fit:cover;border-radius:12px;border:2px solid #0f131d}
.rc-ava i{position:absolute;right:-5px;bottom:-5px;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:#2ea8ff;border:2px solid #0f131d;color:#fff;font-size:10px}
.rc-name{display:flex;align-items:center;gap:8px;font-size:17px;font-weight:800;letter-spacing:-.01em}
.rc-pro{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:7px;color:#fff;background:linear-gradient(135deg,#ff8a2b,#ff3d8a 35%,#a44bff 68%,#2ea8ff)}
.rc-sub{font-size:12px;color:var(--muted,#8892a8);margin-top:2px}
.rc-close{position:absolute;top:14px;right:14px;z-index:3;width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#8892a8;cursor:pointer;display:grid;place-items:center;font-size:16px;transition:color .15s,box-shadow .15s}
.rc-close:hover{color:#fff;box-shadow:0 0 18px -4px rgba(143,107,255,.7)}
.rc-tabs{display:flex;gap:4px;padding:4px;border-radius:14px;width:max-content;max-width:100%;background:#090c13;border:1px solid rgba(255,255,255,.07)}
.rc-tab{display:flex;align-items:center;gap:8px;padding:5px 13px 5px 5px;border-radius:10px;border:0;background:none;color:#8892a8;font:700 13px inherit;font-family:inherit;cursor:pointer;transition:background .15s,color .15s}
.rc-tab:hover{color:#fff}
.rc-tab.active{color:#fff;background:linear-gradient(135deg,rgba(255,138,43,.16),rgba(164,75,255,.2) 55%,rgba(46,168,255,.16));box-shadow:inset 0 0 0 1px rgba(164,75,255,.5)}
.rc-coin{display:grid;place-items:center;border-radius:50%;flex-shrink:0;background:radial-gradient(circle at 30% 25%,color-mix(in srgb,var(--cc) 70%,#fff),var(--cc));box-shadow:0 4px 14px -3px var(--cc)}
.rc-asset{display:flex;align-items:center;gap:12px}
.rc-ticker{font-size:34px;font-weight:800;letter-spacing:-.02em;line-height:1}
.rc-cname{font-size:12px;color:#8892a8;margin-top:3px}
.rc-lbl{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:#8892a8;margin-bottom:3px}
.rc-lbl .ar{color:#5d667b;font-weight:500;direction:rtl;font-size:12px}
.rc-lbl::before{content:'';width:14px;height:3px;border-radius:3px;background:linear-gradient(90deg,#ff8a2b,#a44bff,#2ea8ff)}
.rc-val{font-size:34px;font-weight:800;letter-spacing:-.025em;line-height:1.1;white-space:nowrap}
.rc-val small{font-size:.5em;font-weight:700;letter-spacing:0;color:#8892a8;margin-left:6px}
.rc-profit{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.rc-profit .rc-val{background:linear-gradient(90deg,#33d69f,#2ea8ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.rc-profit .rc-val small{-webkit-text-fill-color:#33d69f}
.rc-pct{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:9px;font-size:13px;font-weight:800;color:#33d69f;background:rgba(51,214,159,.13)}
.rc-total{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;border-radius:12px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);font-size:12.5px;color:#8892a8;font-weight:600}
.rc-total b{color:#e9edf5;font-size:14px;font-weight:800}
.rc-cta{margin-top:auto;direction:rtl;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 18px;border-radius:14px;font-weight:700;font-size:14px;background:linear-gradient(90deg,rgba(255,138,43,.12),rgba(164,75,255,.18),rgba(46,168,255,.12));border:1px solid rgba(164,75,255,.4)}
.rc-cta svg{font-size:16px;color:#c9b8ff}
.rc-right{position:relative;min-height:380px;display:grid;place-items:center;overflow:hidden;background:radial-gradient(300px 260px at 50% 42%,color-mix(in srgb,var(--cc) 26%,transparent),transparent 70%),linear-gradient(160deg,rgba(255,255,255,.035),transparent 55%);border-left:1px solid rgba(255,255,255,.06);transition:background .4s}
.rc-right svg.rc-art{width:100%;max-width:340px;height:auto;display:block}
.rc-badge{position:absolute;right:16%;top:46%;animation:rcBob 3.4s ease-in-out infinite}
@keyframes rcBob{50%{transform:translateY(-7px)}}
.rc-num.f{animation:rcF .6s}@keyframes rcF{0%{filter:brightness(1.7)}}
@media (max-width:760px){.rc-card{grid-template-columns:1fr}.rc-right{display:none}.rc-val,.rc-ticker{font-size:28px}.rc-left{padding:22px 18px}}
@media (prefers-reduced-motion:reduce){.rc-card,.rc-overlay,.rc-badge{animation:none;transition:none}}
.lb-row.is-me,.podium-card.is-me,.an-hero-left{cursor:pointer}`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const logo = `<svg viewBox="0 0 64 64" width="150" height="150"><defs><linearGradient id="rcg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a2b"/><stop offset=".35" stop-color="#ff3d8a"/><stop offset=".65" stop-color="#a44bff"/><stop offset="1" stop-color="#2ea8ff"/></linearGradient><linearGradient id="rcg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a2b" stop-opacity=".55"/><stop offset="1" stop-color="#2ea8ff" stop-opacity=".55"/></linearGradient></defs><path d="M18 10L46 10L58 22L58 48L30 48L18 36Z" fill="none" stroke="url(#rcg2)" stroke-width="3" stroke-linejoin="round"/><path d="M14 14L42 14L54 26L54 52L26 52L14 40Z" fill="none" stroke="url(#rcg2)" stroke-width="3" stroke-linejoin="round"/><path d="M10 18L38 18L50 30L50 56L22 56L10 44Z" fill="#fff" stroke="url(#rcg1)" stroke-width="3.5" stroke-linejoin="round"/><text x="30" y="42" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="13" fill="url(#rcg1)">Axis</text></svg>`;
  const art = `<svg class="rc-art" viewBox="0 0 320 380" aria-hidden="true">
    <defs><linearGradient id="rcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c2347"/><stop offset="1" stop-color="#0b0e1a"/></linearGradient><linearGradient id="rcr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff8a2b"/><stop offset=".5" stop-color="#a44bff"/><stop offset="1" stop-color="#2ea8ff"/></linearGradient><radialGradient id="rcm" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#dfe4fb"/></radialGradient></defs>
    <g opacity=".35" stroke="#8892a8"><path d="M268 240v60M268 258h0M286 214v90M304 188v70" stroke-width="1.5"/><rect x="262" y="250" width="12" height="34" rx="2" fill="#33d69f" stroke="none"/><rect x="280" y="232" width="12" height="40" rx="2" fill="#ff6177" stroke="none"/><rect x="298" y="206" width="12" height="36" rx="2" fill="#33d69f" stroke="none"/></g>
    <ellipse cx="160" cy="318" rx="122" ry="30" fill="url(#rcb)" stroke="url(#rcr)" stroke-width="1.5"/>
    <ellipse cx="160" cy="304" rx="106" ry="24" fill="#151a2e" stroke="rgba(255,255,255,.12)"/>
    <ellipse cx="160" cy="298" rx="92" ry="20" fill="#e9ecfb"/>
    <circle cx="160" cy="170" r="98" fill="url(#rcm)" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
    <circle cx="160" cy="170" r="98" fill="none" stroke="url(#rcr)" stroke-width="3" opacity=".55"/>
    <foreignObject x="85" y="95" width="150" height="150">${logo}</foreignObject></svg>`;

  const overlay = document.createElement('div');
  overlay.className = 'rc-overlay';
  overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', 'Carlos E. Mendoza trade result');
  overlay.innerHTML = `<div class="rc-card" id="rcCard">
    <button class="rc-close" aria-label="Close">${ic('<path d="M6 6l12 12M18 6L6 18"/>')}</button>
    <div class="rc-left">
      <div class="rc-head"><div class="rc-ava"><img src="rana.jpg" alt=""><i>${ic('<path d="M5.500 12.500l4 4 9-9"/>')}</i></div>
        <div><div class="rc-name">Carlos E. Mendoza <span class="rc-pro">Pro analyst</span></div><div class="rc-sub">Trade result · live</div></div></div>
      <div class="rc-tabs" id="rcTabs">${COINS.map((c, i) => `<button class="rc-tab${i ? '' : ' active'}" data-i="${i}">${coinIcon(c, 26)}${c.sym}</button>`).join('')}</div>
      <div><div class="rc-lbl">Asset <span class="ar">الأصل</span></div>
        <div class="rc-asset" id="rcAsset"></div></div>
      <div><div class="rc-lbl">Entry <span class="ar">الدخل</span></div><div class="rc-val">${fmt(ENTRY)}<small>COP</small></div></div>
      <div><div class="rc-lbl">Profit <span class="ar">الربح</span></div>
        <div class="rc-profit"><div class="rc-val rc-num" id="rcProfit">+0.00<small>COP</small></div><span class="rc-pct" id="rcPct"></span></div></div>
      <div class="rc-total"><span>Total balance <span style="color:#5d667b">· المبلغ الإجمالي</span></span><b id="rcTotal">0.00 COP</b></div>
      <div class="rc-cta"><span>حطانا معاك، نجاحك هدفنا!</span>${ic('<path d="M15 5l-7 7 7 7"/>')}</div>
    </div>
    <div class="rc-right">${art}<div class="rc-badge" id="rcBadge"></div></div></div>`;
  document.body.appendChild(overlay);

  const $ = id => document.getElementById(id);
  let cur = 0, shown = { profit: 0, pct: 0 }, raf = 0, liveTimer = 0;
  const up = ic('<path d="M7 17L17 7M9 7h8v8"/>');

  function paint(profit, pct) {
    $('rcProfit').innerHTML = `+${fmt(profit)}<small>COP</small>`;
    $('rcPct').innerHTML = `${up}+${pct.toFixed(2)}%`;
    $('rcTotal').textContent = fmt(ENTRY + profit) + ' COP';
  }
  function select(i, animate) {
    cur = i; const c = COINS[i];
    $('rcCard').style.setProperty('--cc', c.color);
    document.querySelectorAll('.rc-tab').forEach((t, k) => t.classList.toggle('active', k === i));
    $('rcAsset').innerHTML = `${coinIcon(c, 44)}<div><div class="rc-ticker">${c.sym}</div><div class="rc-cname">${c.name}</div></div>`;
    $('rcBadge').innerHTML = coinIcon(c, 54);
    cancelAnimationFrame(raf);
    if (!animate || matchMedia('(prefers-reduced-motion:reduce)').matches) { paint(c.profit, c.pct); return; }
    const t0 = performance.now(), D = 900;                      // плавный счёт от нуля до значения
    (function step(now) {
      const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      paint(c.profit * e, c.pct * e);
      if (k < 1) raf = requestAnimationFrame(step);
    })(t0);
  }
  function live() {                                              // лёгкое «живое» движение значений
    const c = COINS[cur], d = 1 + (Math.random() - 0.45) * 0.003;
    c.profit *= d; c.pct = c.profit / ENTRY * 100;
    paint(c.profit, c.pct);
    const el = $('rcProfit'); el.classList.remove('f'); void el.offsetWidth; el.classList.add('f');
  }
  function open() {
    overlay.classList.add('open'); select(cur, true);
    clearInterval(liveTimer); liveTimer = setInterval(live, 1800);
    overlay.querySelector('.rc-close').focus();
  }
  function close() { overlay.classList.remove('open'); clearInterval(liveTimer); cancelAnimationFrame(raf); }

  overlay.addEventListener('click', e => { if (e.target === overlay || e.target.closest('.rc-close')) close(); });
  $('rcTabs').addEventListener('click', e => { const b = e.target.closest('.rc-tab'); if (b) select(+b.dataset.i, true); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  // открываем по клику на Rana Khaled: строка/карточка «вы» в leaderboard и шапка профиля в analytics
  document.addEventListener('click', e => {
    if (e.target.closest('.rc-overlay')) return;
    if (e.target.closest('.lb-row.is-me, .podium-card.is-me, .an-hero-left')) open();
  });
})();