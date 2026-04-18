// Local-only charge-date notifications. No backend. Reads `nextChargeAt` off each
// subscription in localStorage and either fires a browser Notification (if permission
// is granted) or returns an in-app toast payload for the caller to render.

const STORAGE_NOTIFY_LOG = 'vampire_notify_log';
const WINDOW_MS = 24 * 60 * 60 * 1000;

function readSubs() {
  try { return JSON.parse(localStorage.getItem('vampire_subs') || '[]'); }
  catch { return []; }
}

function readLog() {
  try { return JSON.parse(localStorage.getItem(STORAGE_NOTIFY_LOG) || '{}'); }
  catch { return {}; }
}

function writeLog(log) {
  try { localStorage.setItem(STORAGE_NOTIFY_LOG, JSON.stringify(log)); } catch { /* quota */ }
}

function formatAmount(sub) {
  const amt = parseFloat(sub.price) || 0;
  return `$${amt.toFixed(2)}`;
}

function upcomingSubs(now = Date.now()) {
  return readSubs().filter(s => {
    const t = Number(s.nextChargeAt);
    return Number.isFinite(t) && t > now && t - now <= WINDOW_MS;
  });
}

export function hasNotificationApi() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission() {
  if (!hasNotificationApi()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!hasNotificationApi()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

export function pendingToasts() {
  const log = readLog();
  const now = Date.now();
  const toasts = [];
  for (const sub of upcomingSubs(now)) {
    const key = `${sub.id}:${sub.nextChargeAt}`;
    if (log[key]) continue;
    toasts.push({
      id: key,
      title: `Tomorrow: ${sub.name} ${formatAmount(sub)}`,
      body: 'Still want it? Open Bill Vampire to kill it before it bites.',
      subId: sub.id,
      chargeAt: sub.nextChargeAt,
    });
  }
  return toasts;
}

export function markToastDelivered(id) {
  const log = readLog();
  log[id] = Date.now();
  const entries = Object.entries(log).sort((a, b) => b[1] - a[1]).slice(0, 200);
  writeLog(Object.fromEntries(entries));
}

export async function fireChargeDateNotifications() {
  if (!hasNotificationApi() || Notification.permission !== 'granted') {
    return { fired: 0, toasts: pendingToasts() };
  }
  const log = readLog();
  let fired = 0;
  for (const t of pendingToasts()) {
    try {
      new Notification(t.title, { body: t.body, tag: t.id, icon: '/icons/icon.png' });
      log[t.id] = Date.now();
      fired++;
    } catch { /* suppressed */ }
  }
  if (fired) writeLog(log);
  return { fired, toasts: [] };
}
