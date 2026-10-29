// ============================================================
// AXIS — GLOBAL CURRENCY CONFIG v2 (fixed)
// Единый источник валюты для всех страниц. Без конфликтов.
// ============================================================

(function() {
  const CONFIG_KEY = 'axis_currency_config';

  const COUNTRIES = {
    'CO': { country: 'Colombia',    currency: 'COP', flag: 'CO', rate: 3184 },
    'PH': { country: 'Philippines', currency: 'PHP', flag: '🇵🇭', rate: 58.20 },
    'RU': { country: 'Russia',      currency: 'RUB', flag: '🇷🇺', rate: 92.50 },
    'UA': { country: 'Ukraine',     currency: 'UAH', flag: '🇺🇦', rate: 41.30 },
    'MA': { country: 'Morocco',     currency: 'MAD', flag: '🇲🇦', rate: 9.95 },
    'TN': { country: 'Tunisia',     currency: 'TND', flag: '🇹🇳', rate: 3.12 },
    'EG': { country: 'Egypt',       currency: 'EGP', flag: '🇪🇬', rate: 48.60 },
    'SA': { country: 'Saudi Arabia',currency: 'SAR', flag: '🇸🇦', rate: 3.75 },
    'AE': { country: 'UAE',         currency: 'AED', flag: '🇦🇪', rate: 3.67 },
    'TR': { country: 'Turkey',      currency: 'TRY', flag: '🇹🇷', rate: 34.20 },
    'US': { country: 'USA',         currency: 'USD', flag: '🇺🇸', rate: 1 },
    'EU': { country: 'Europe',      currency: 'EUR', flag: '🇪🇺', rate: 0.92 }
  };

  function getCountryCode() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.countryCode && COUNTRIES[p.countryCode]) return p.countryCode;
      }
    } catch (e) {}
    return 'CO'; // Исправлено на заглавные, чтобы совпадало с ключом
  }

  function getConfig() {
    return COUNTRIES[getCountryCode()] || COUNTRIES['CO'];
  }

  function setCountry(code) {
    if (!COUNTRIES[code]) return;
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      countryCode: code,
      currency: COUNTRIES[code].currency,
      rate: COUNTRIES[code].rate,
      flag: COUNTRIES[code].flag,
      country: COUNTRIES[code].country
    }));
    applyToPage();
  }

  // Обновление UI админки и сайдбара
  function applyToPage() {
    const cfg = getConfig();

    const flagMini = document.getElementById('countryFlagMini');
    if (flagMini) flagMini.innerHTML = `<svg viewBox="0 0 30 20" width="22" height="15" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="co-flag"><rect x="0" y="0" width="30" height="20" rx="3"/></clipPath></defs><g clip-path="url(#co-flag)"><rect x="0" y="0" width="30" height="10" fill="#FCD116"/><rect x="0" y="10" width="30" height="5" fill="#003893"/><rect x="0" y="15" width="30" height="5" fill="#CE1126"/></g><rect x="0" y="0" width="30" height="20" rx="3" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"></rect></svg>`;

    const regionName = document.getElementById('regionName');
    if (regionName) regionName.textContent = cfg.country;

    const currLabel = document.getElementById('currentCurrencyLabel');
    if (currLabel) currLabel.textContent = cfg.currency;

    const rateLabel = document.getElementById('currentRateLabel');
    if (rateLabel) rateLabel.textContent = `1 USD = ${cfg.rate} ${cfg.currency}`;
  }

  // Экспорт
  window.AXIS_CURRENCY = {
    get: getConfig,
    getCode: getCountryCode,
    set: setCountry,
    COUNTRIES
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyToPage);
  } else {
    applyToPage();
  }
})();