const AI_DAILY_LIMIT = 3;
const STORAGE_KEY_PRO = 'vampire_pro';
const STORAGE_KEY_AI_USAGE = 'vampire_ai_usage';

export function isPro() {
  return localStorage.getItem(STORAGE_KEY_PRO) === 'true';
}

export function activatePro() {
  localStorage.setItem(STORAGE_KEY_PRO, 'true');
}

export function getAiUsageToday() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY_AI_USAGE) || '{}');
  const today = new Date().toISOString().slice(0, 10);
  if (data.date !== today) return 0;
  return data.count || 0;
}

export function incrementAiUsage() {
  const today = new Date().toISOString().slice(0, 10);
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY_AI_USAGE) || '{}');
  if (data.date !== today) {
    localStorage.setItem(STORAGE_KEY_AI_USAGE, JSON.stringify({ date: today, count: 1 }));
    return 1;
  }
  const newCount = (data.count || 0) + 1;
  localStorage.setItem(STORAGE_KEY_AI_USAGE, JSON.stringify({ date: today, count: newCount }));
  return newCount;
}

export function canUseAi() {
  if (isPro()) return true;
  return getAiUsageToday() < AI_DAILY_LIMIT;
}

export function aiUsesRemaining() {
  if (isPro()) return Infinity;
  return Math.max(0, AI_DAILY_LIMIT - getAiUsageToday());
}

// Creem.io checkout URL
const CREEM_CHECKOUT_URL = 'https://www.creem.io/payment/prod_1pw0aIvQW2CzNzfMLrgGAY';

function getSuccessUrl() {
  const base = window.location.origin + window.location.pathname;
  return encodeURIComponent(base + '#payment-success');
}

export function getCheckoutUrl() {
  return `${CREEM_CHECKOUT_URL}?success_url=${getSuccessUrl()}`;
}

export function openCheckout() {
  window.open(getCheckoutUrl(), '_blank');
}

// Check if the user just completed a payment (redirected back from Creem.io)
export function checkPaymentSuccess() {
  const hash = window.location.hash;
  if (hash === '#payment-success') {
    activatePro();
    // Clean up the hash
    window.location.hash = '';
    return true;
  }
  return false;
}

// Tip jar - $2 tip via Creem.io
export function openTip() {
  window.open('https://www.creem.io/payment/prod_4jHrSY5B9kBakNLmI1GuLw', '_blank');
}
