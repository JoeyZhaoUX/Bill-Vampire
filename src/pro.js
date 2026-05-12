import { track } from './analytics';

const AI_WEEKLY_LIMIT_FREE = 1;
const FREE_SCAN_LIFETIME_LIMIT = 1;
const FREE_PRINT_LIFETIME_LIMIT = 1;
const FOUNDING_PRICE_WINDOW_MS = 72 * 60 * 60 * 1000;

const STORAGE_KEY_PRO = 'vampire_pro';
const STORAGE_KEY_PATROL = 'vampire_patrol';
const STORAGE_KEY_AI_USAGE = 'vampire_ai_usage';
const STORAGE_KEY_FREE_SCANS = 'vampire_free_scans_used';
const STORAGE_KEY_FREE_PRINTS = 'vampire_free_prints_used';
const STORAGE_KEY_FIRST_SEEN = 'vampire_first_seen';
const STORAGE_KEY_VERDICT_USED = 'vampire_free_verdict_used';

const CREEM_PRO_URL_STANDARD = 'https://www.creem.io/payment/prod_1pw0aIvQW2CzNzfMLrgGAY';
const CREEM_PRO_URL_FOUNDING = 'https://www.creem.io/payment/prod_1pw0aIvQW2CzNzfMLrgGAY';
const CREEM_PATROL_MONTHLY_URL = 'https://www.creem.io/payment/prod_3l1JRnKrbMvuYiWez8JDGw';
// Temporary fallback until a dedicated annual checkout product is configured in Creem.
const CREEM_PATROL_ANNUAL_URL = 'https://www.creem.io/payment/prod_3l1JRnKrbMvuYiWez8JDGw';
const CREEM_TIP_URL = 'https://www.creem.io/payment/prod_4jHrSY5B9kBakNLmI1GuLw';

export const PATROL_PRICE_MONTHLY = { amount: 4.99, label: '$4.99/mo', cycle: 'monthly' };
export const PATROL_PRICE_ANNUAL = { amount: 39, label: '$39/yr', cycle: 'annual', monthlyEquivalent: 3.25 };

export function isPro() {
  return localStorage.getItem(STORAGE_KEY_PRO) === 'true';
}

export function activatePro() {
  localStorage.setItem(STORAGE_KEY_PRO, 'true');
}

function readPatrolRecord() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PATROL);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.tier) return null;
    if (parsed.exp && parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isPatrol() {
  const rec = readPatrolRecord();
  return !!rec && (rec.tier === 'patrol' || rec.tier === 'patrol_annual');
}

export function getPatrolTier() {
  const rec = readPatrolRecord();
  return rec?.tier || null;
}

export function activatePatrol(tier = 'patrol', expMs = null) {
  const exp = expMs ?? (tier === 'patrol_annual'
    ? Date.now() + 366 * 24 * 60 * 60 * 1000
    : Date.now() + 35 * 24 * 60 * 60 * 1000);
  localStorage.setItem(STORAGE_KEY_PATROL, JSON.stringify({ tier, exp, activatedAt: Date.now() }));
}

function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function getAiUsageThisWeek() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY_AI_USAGE) || '{}');
  const wk = weekKey();
  if (data.week !== wk) return 0;
  return data.count || 0;
}

export function incrementAiUsage() {
  const wk = weekKey();
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY_AI_USAGE) || '{}');
  const next = data.week === wk ? (data.count || 0) + 1 : 1;
  localStorage.setItem(STORAGE_KEY_AI_USAGE, JSON.stringify({ week: wk, count: next }));
  return next;
}

export function canAiRoast() {
  if (isPro()) return true;
  return getAiUsageThisWeek() < AI_WEEKLY_LIMIT_FREE;
}

export function aiUsesRemaining() {
  if (isPro()) return Infinity;
  return Math.max(0, AI_WEEKLY_LIMIT_FREE - getAiUsageThisWeek());
}

export function canUseAi() {
  return canAiRoast();
}

export function canSmartImport() {
  if (isPro()) return true;
  const used = parseInt(localStorage.getItem(STORAGE_KEY_FREE_SCANS) || '0', 10);
  return used < FREE_SCAN_LIFETIME_LIMIT;
}

export function markSmartImportUsed() {
  if (isPro()) return;
  const used = parseInt(localStorage.getItem(STORAGE_KEY_FREE_SCANS) || '0', 10);
  localStorage.setItem(STORAGE_KEY_FREE_SCANS, String(used + 1));
}

export function canPrintReport() {
  if (isPro()) return true;
  const used = parseInt(localStorage.getItem(STORAGE_KEY_FREE_PRINTS) || '0', 10);
  return used < FREE_PRINT_LIFETIME_LIMIT;
}

export function markPrintReportUsed() {
  if (isPro()) return;
  const used = parseInt(localStorage.getItem(STORAGE_KEY_FREE_PRINTS) || '0', 10);
  localStorage.setItem(STORAGE_KEY_FREE_PRINTS, String(used + 1));
}

export function hasConsumedFreeVerdict() {
  return localStorage.getItem(STORAGE_KEY_VERDICT_USED) === 'true';
}

export function markFreeVerdictConsumed() {
  localStorage.setItem(STORAGE_KEY_VERDICT_USED, 'true');
}

export function getFirstSeen() {
  const existing = localStorage.getItem(STORAGE_KEY_FIRST_SEEN);
  if (existing) return parseInt(existing, 10);
  const now = Date.now();
  localStorage.setItem(STORAGE_KEY_FIRST_SEEN, String(now));
  return now;
}

export function isFoundingWindow() {
  if (isPro()) return false;
  const first = getFirstSeen();
  return Date.now() - first < FOUNDING_PRICE_WINDOW_MS;
}

export function foundingWindowRemainingMs() {
  const first = getFirstSeen();
  return Math.max(0, FOUNDING_PRICE_WINDOW_MS - (Date.now() - first));
}

export const PRO_PRICE = { amount: 9.99, label: '$9.99', tier: 'standard' };
export const PRO_PRICE_STANDARD = PRO_PRICE;
export const PRO_PRICE_FOUNDING = PRO_PRICE;

export function getCurrentPrice() {
  return PRO_PRICE;
}

function getSuccessUrl() {
  const base = window.location.origin + window.location.pathname;
  return encodeURIComponent(base + '#payment-success');
}

export function getCheckoutUrl(source = 'unknown') {
  const price = getCurrentPrice();
  const base = price.tier === 'founding' ? CREEM_PRO_URL_FOUNDING : CREEM_PRO_URL_STANDARD;
  return `${base}?success_url=${getSuccessUrl()}&ref=${encodeURIComponent(source)}`;
}

export function openCheckout(source = 'unknown') {
  const price = getCurrentPrice();
  track('checkout_clicked', { source, price: price.amount, tier: price.tier });
  window.open(getCheckoutUrl(source), '_blank');
}

function getPatrolSuccessUrl(tier) {
  const base = window.location.origin + window.location.pathname;
  return encodeURIComponent(`${base}#patrol-success-${tier}`);
}

export function getPatrolCheckoutUrl(cycle = 'monthly', source = 'unknown') {
  const base = cycle === 'annual' ? CREEM_PATROL_ANNUAL_URL : CREEM_PATROL_MONTHLY_URL;
  const tier = cycle === 'annual' ? 'patrol_annual' : 'patrol';
  return `${base}?success_url=${getPatrolSuccessUrl(tier)}&ref=${encodeURIComponent(source)}`;
}

export function openPatrolCheckout(cycle = 'monthly', source = 'unknown') {
  const price = cycle === 'annual' ? PATROL_PRICE_ANNUAL : PATROL_PRICE_MONTHLY;
  track('patrol_checkout_clicked', { source, price: price.amount, cycle });
  window.open(getPatrolCheckoutUrl(cycle, source), '_blank');
}

export function checkPaymentSuccess() {
  const hash = window.location.hash;
  if (hash === '#payment-success') {
    activatePro();
    window.location.hash = '';
    track('checkout_succeeded');
    return true;
  }
  if (hash === '#patrol-success-patrol') {
    activatePatrol('patrol');
    window.location.hash = '';
    track('patrol_checkout_succeeded', { cycle: 'monthly' });
    return true;
  }
  if (hash === '#patrol-success-patrol_annual') {
    activatePatrol('patrol_annual');
    window.location.hash = '';
    track('patrol_checkout_succeeded', { cycle: 'annual' });
    return true;
  }
  return false;
}

export function openTip() {
  track('tip_clicked');
  window.open(CREEM_TIP_URL, '_blank');
}
