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

// LemonSqueezy checkout URL - replace with your actual product URL
const LEMONSQUEEZY_URL = 'https://your-store.lemonsqueezy.com/checkout/buy/your-product-id';

export function openCheckout() {
  window.open(LEMONSQUEEZY_URL, '_blank');
}

// Tip jar URLs
const TIP_URLS = {
  1: 'https://your-store.lemonsqueezy.com/checkout/buy/tip-1',
  3: 'https://your-store.lemonsqueezy.com/checkout/buy/tip-3',
  5: 'https://your-store.lemonsqueezy.com/checkout/buy/tip-5',
};

export function openTip(amount) {
  window.open(TIP_URLS[amount] || TIP_URLS[3], '_blank');
}
