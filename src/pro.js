import { track } from './analytics';

const AI_WEEKLY_LIMIT_FREE = 1;
const FREE_SCAN_LIFETIME_LIMIT = 1;
const FREE_PRINT_LIFETIME_LIMIT = 1;

const STORAGE_KEY_PRO = 'vampire_pro';
const STORAGE_KEY_PATROL = 'vampire_patrol';
const STORAGE_KEY_AI_USAGE = 'vampire_ai_usage';
const STORAGE_KEY_FREE_SCANS = 'vampire_free_scans_used';
const STORAGE_KEY_FREE_PRINTS = 'vampire_free_prints_used';
const STORAGE_KEY_FIRST_SEEN = 'vampire_first_seen';
const STORAGE_KEY_VERDICT_USED = 'vampire_free_verdict_used';
const STORAGE_KEY_PAYMENT_SUCCESS = 'vampire_payment_success_type';
const STORAGE_KEY_PURCHASE_RECOVERY = 'vampire_purchase_recovery_needed';

const CREEM_PRO_URL = 'https://www.creem.io/payment/prod_1pw0aIvQW2CzNzfMLrgGAY';
const CREEM_EMERGENCY_KIT_URL = import.meta.env.VITE_CREEM_EMERGENCY_KIT_URL || 'https://www.creem.io/payment/prod_5nLkYvnA8LPlZp49NvjXKZ';
const CREEM_DISPUTE_KIT_URL = import.meta.env.VITE_CREEM_DISPUTE_KIT_URL || '';
const CREEM_PATROL_MONTHLY_URL = 'https://www.creem.io/payment/prod_3l1JRnKrbMvuYiWez8JDGw';
// Temporary fallback until a dedicated annual checkout product is configured in Creem.
const CREEM_PATROL_ANNUAL_URL = 'https://www.creem.io/payment/prod_3l1JRnKrbMvuYiWez8JDGw';
const CREEM_TIP_URL = 'https://www.creem.io/payment/prod_4jHrSY5B9kBakNLmI1GuLw';

export const PATROL_PRICE_MONTHLY = { amount: 4.99, label: '$4.99/mo', cycle: 'monthly' };
export const PATROL_PRICE_ANNUAL = { amount: 39, label: '$39/yr', cycle: 'annual', monthlyEquivalent: 3.25 };
export const EMERGENCY_KIT_PRICE = { amount: 4.99, label: '$4.99', tier: 'emergency_kit' };
export const FOUNDER_REVIEW_PRICE = { amount: 29, label: '$29', tier: 'dispute_kit' };

export function isPro() {
  return localStorage.getItem(STORAGE_KEY_PRO) === 'true'
    || localStorage.getItem('vampire_emergency_kit') === 'true';
}

export function isEmergencyKitUnlocked() {
  return isPro() || localStorage.getItem('vampire_emergency_kit') === 'true';
}

export function activatePro() {
  localStorage.setItem(STORAGE_KEY_PRO, 'true');
}

export function activateEmergencyKit() {
  localStorage.setItem('vampire_emergency_kit', 'true');
}

function markPaymentSuccess(type) {
  localStorage.setItem(STORAGE_KEY_PAYMENT_SUCCESS, type);
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
  return `${CREEM_PRO_URL}?success_url=${getSuccessUrl()}&ref=${encodeURIComponent(source)}`;
}

export function openCheckout(source = 'unknown') {
  const price = getCurrentPrice();
  track('checkout_clicked', { source, price: price.amount, tier: price.tier });
  window.open(getCheckoutUrl(source), '_blank');
}

function getEmergencyKitSuccessUrl() {
  const base = window.location.origin + window.location.pathname;
  return encodeURIComponent(base + '#emergency-kit-success');
}

export function getEmergencyKitCheckoutUrl(source = 'unknown') {
  return `${CREEM_EMERGENCY_KIT_URL}?success_url=${getEmergencyKitSuccessUrl()}&ref=${encodeURIComponent(source)}`;
}

function getFounderReviewSuccessUrl() {
  const base = window.location.origin + window.location.pathname;
  return encodeURIComponent(base + '#dispute-kit-success');
}

function getFounderReviewFallbackUrl(source, context = {}) {
  if (CREEM_DISPUTE_KIT_URL) {
    return `${CREEM_DISPUTE_KIT_URL}?success_url=${getFounderReviewSuccessUrl()}&ref=${encodeURIComponent(source)}`;
  }
  const subject = encodeURIComponent(`Credit Card Dispute Kit for ${context.service || 'my subscription case'}`);
  const body = encodeURIComponent([
    'Hi Bill Vampire,',
    '',
    'I want the $29 Premium Credit Card Dispute Kit for this subscription case.',
    '',
    `Service: ${context.service || ''}`,
    `Amount: ${context.detected_amount || ''}`,
    `Issue type: ${context.issue_type || ''}`,
    `Source: ${context.source_page || context.traffic_source || ''}`,
    '',
    'Please tell me the next step.',
  ].join('\n'));
  return `mailto:hello@billvampire.com?subject=${subject}&body=${body}`;
}

export async function openFounderReviewCheckout(source = 'unknown', context = {}) {
  try {
    localStorage.setItem('vampire_pending_checkout', JSON.stringify({
      type: 'dispute_kit',
      source,
      startedAt: Date.now(),
      context,
    }));
  } catch { /* storage is best-effort */ }
  track('founder_review_checkout_clicked', {
    source,
    price: FOUNDER_REVIEW_PRICE.amount,
    tier: FOUNDER_REVIEW_PRICE.tier,
    configured: !!CREEM_DISPUTE_KIT_URL,
    ...context,
  });
  const fallbackUrl = getFounderReviewFallbackUrl(source, context);
  const checkoutWindow = window.open('about:blank', '_blank');
  try {
    const res = await fetch('/api/creem/checkout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'founder_review',
        source,
        metadata: context,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.checkoutUrl) throw new Error(data?.error || 'checkout_failed');
    track('founder_review_checkout_session_created', {
      source,
      request_id: data.requestId,
      ...context,
    });
    if (checkoutWindow) checkoutWindow.location.href = data.checkoutUrl;
    else window.location.href = data.checkoutUrl;
  } catch (err) {
    track('founder_review_checkout_session_fallback', {
      source,
      reason: String(err?.message || err).slice(0, 80),
      ...context,
    });
    if (checkoutWindow) checkoutWindow.location.href = fallbackUrl;
    else window.location.href = fallbackUrl;
  }
}

export async function openEmergencyKitCheckout(source = 'unknown', context = {}) {
  try {
    localStorage.setItem('vampire_pending_checkout', JSON.stringify({
      type: 'emergency_kit',
      source,
      startedAt: Date.now(),
      context,
    }));
  } catch { /* storage is best-effort */ }
  track('emergency_kit_checkout_clicked', {
    source,
    price: EMERGENCY_KIT_PRICE.amount,
    tier: EMERGENCY_KIT_PRICE.tier,
    needs_product_url: CREEM_EMERGENCY_KIT_URL.includes('REPLACE_WITH'),
    ...context,
  });
  track('checkout_started', {
    product: 'emergency_kit',
    source,
    price: EMERGENCY_KIT_PRICE.amount,
    tier: EMERGENCY_KIT_PRICE.tier,
    ...context,
  });
  const fallbackUrl = getEmergencyKitCheckoutUrl(source);
  const checkoutWindow = window.open('about:blank', '_blank');
  try {
    const res = await fetch('/api/creem/checkout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'emergency_kit',
        source,
        metadata: context,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.checkoutUrl) throw new Error(data?.error || 'checkout_failed');
    track('emergency_kit_checkout_session_created', {
      source,
      request_id: data.requestId,
      ...context,
    });
    if (checkoutWindow) checkoutWindow.location.href = data.checkoutUrl;
    else window.location.href = data.checkoutUrl;
  } catch (err) {
    track('emergency_kit_checkout_session_fallback', {
      source,
      reason: String(err?.message || err).slice(0, 80),
      ...context,
    });
    if (checkoutWindow) checkoutWindow.location.href = fallbackUrl;
    else window.location.href = fallbackUrl;
  }
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

function readPendingCheckout(type) {
  try {
    const pending = JSON.parse(localStorage.getItem('vampire_pending_checkout') || 'null');
    if (!pending || pending.type !== type) return null;
    return pending;
  } catch {
    return null;
  }
}

export function checkPaymentSuccess() {
  const hash = window.location.hash;
  if (hash === '#payment-success') {
    activatePro();
    markPaymentSuccess('pro');
    window.location.hash = '';
    track('checkout_succeeded');
    return 'pro';
  }
  if (hash === '#emergency-kit-success') {
    const pending = readPendingCheckout('emergency_kit');
    activateEmergencyKit();
    markPaymentSuccess('emergency_kit');
    localStorage.setItem(STORAGE_KEY_PURCHASE_RECOVERY, 'true');
    localStorage.removeItem('vampire_pending_checkout');
    window.location.hash = '';
    track('emergency_kit_checkout_succeeded', {
      source: pending?.source || 'unknown',
      ...(pending?.context || {}),
    });
    track('checkout_returned_success', {
      product: 'emergency_kit',
      source: pending?.source || 'unknown',
      ...(pending?.context || {}),
    });
    track('kit_unlocked', {
      product: 'emergency_kit',
      source: pending?.source || 'unknown',
      ...(pending?.context || {}),
    });
    return 'emergency_kit';
  }
  if (hash === '#dispute-kit-success' || hash === '#founder-review-success') {
    const pending = readPendingCheckout('dispute_kit') || readPendingCheckout('founder_review');
    localStorage.setItem('vampire_founder_review', 'true'); // Keep the same storage key for backwards compatibility
    markPaymentSuccess('dispute_kit');
    localStorage.setItem(STORAGE_KEY_PURCHASE_RECOVERY, 'true');
    localStorage.removeItem('vampire_pending_checkout');
    window.location.hash = '';
    track('dispute_kit_checkout_succeeded', {
      source: pending?.source || 'unknown',
      ...(pending?.context || {}),
    });
    return 'dispute_kit';
  }
  if (hash === '#patrol-success-patrol') {
    activatePatrol('patrol');
    markPaymentSuccess('patrol');
    window.location.hash = '';
    track('patrol_checkout_succeeded', { cycle: 'monthly' });
    return 'patrol';
  }
  if (hash === '#patrol-success-patrol_annual') {
    activatePatrol('patrol_annual');
    markPaymentSuccess('patrol_annual');
    window.location.hash = '';
    track('patrol_checkout_succeeded', { cycle: 'annual' });
    return 'patrol_annual';
  }
  return null;
}

export function checkPendingCheckoutAbandon() {
  let pending = null;
  try {
    pending = JSON.parse(localStorage.getItem('vampire_pending_checkout') || 'null');
  } catch {
    pending = null;
  }
  if (!pending?.type || pending.abandonedAt || !pending.startedAt) return;
  const ageMs = Date.now() - pending.startedAt;
  if (ageMs < 8000) return;
  const next = { ...pending, abandonedAt: Date.now() };
  try { localStorage.setItem('vampire_pending_checkout', JSON.stringify(next)); } catch { /* ignore */ }
  track(`${pending.type}_checkout_abandoned`, {
    source: pending.source || 'unknown',
    age_seconds: Math.round(ageMs / 1000),
    ...(pending.context || {}),
  });
}

export function openTip() {
  track('tip_clicked');
  window.open(CREEM_TIP_URL, '_blank');
}
