const CLOUD_SNAPSHOT_KEY = 'vampire_last_cloud_sync';
const CASES_KEY = 'vampire_case_files';

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    cache: 'no-store',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

export function getLocalSnapshot() {
  const entitlements = [];
  if (localStorage.getItem('vampire_emergency_kit') === 'true') {
    entitlements.push({ type: 'emergency_kit', source: 'local_payment_success' });
  }
  if (localStorage.getItem('vampire_pro') === 'true') {
    entitlements.push({ type: 'pro', source: 'local_payment_success' });
  }
  const patrol = readJson('vampire_patrol', null);
  if (patrol?.tier) entitlements.push({ type: patrol.tier, source: 'local_payment_success' });

  return {
    subscriptions: readJson('vampire_subs', []),
    cancelled: readJson('vampire_cancelled', []),
    cases: readJson(CASES_KEY, []),
    entitlements,
  };
}

export function applyCloudSnapshot(snapshot) {
  if (Array.isArray(snapshot?.subscriptions)) {
    writeJson('vampire_subs', snapshot.subscriptions.map(s => ({
      id: s.id,
      name: s.name,
      price: s.price,
      cycle: s.cycle,
      category: s.category || 'Other',
      renewalDate: s.renewalDate || s.renewal_date || '',
    })));
  }
  if (Array.isArray(snapshot?.cancelled)) {
    writeJson('vampire_cancelled', snapshot.cancelled.map(c => ({
      id: c.id,
      name: c.name,
      monthlyUSD: c.monthlyUSD || c.monthly_usd || 0,
      cancelledAt: c.cancelledAt || c.cancelled_at || Date.now(),
    })));
  }
  if (Array.isArray(snapshot?.entitlements)) {
    for (const ent of snapshot.entitlements) {
      if (ent.type === 'emergency_kit') localStorage.setItem('vampire_emergency_kit', 'true');
      if (ent.type === 'pro') localStorage.setItem('vampire_pro', 'true');
      if (ent.type === 'patrol' || ent.type === 'patrol_annual') {
        const exp = ent.type === 'patrol_annual'
          ? Date.now() + 366 * 24 * 60 * 60 * 1000
          : Date.now() + 35 * 24 * 60 * 60 * 1000;
        writeJson('vampire_patrol', { tier: ent.type, exp, activatedAt: Date.now() });
      }
    }
  }
  if (Array.isArray(snapshot?.cases)) {
    writeJson(CASES_KEY, snapshot.cases.map(c => ({
      id: c.id,
      issueType: c.issueType || c.issue_type || 'surprise_charge',
      service: c.service || c.kit?.service || 'Subscription case',
      amount: c.amount || c.kit?.amount || '',
      rawInputExcerpt: c.rawInputExcerpt || c.raw_input_excerpt || '',
      kit: c.kit || null,
      createdAt: c.createdAt || c.created_at || new Date().toISOString(),
    })).filter(c => c.kit));
  }
  localStorage.setItem(CLOUD_SNAPSHOT_KEY, new Date().toISOString());
  window.dispatchEvent(new CustomEvent('vampire-cloud-sync-applied', { detail: snapshot }));
}

export async function getMe() {
  return api('/api/me');
}

export async function startMagicLink(email, source = 'save_case_file') {
  return api('/api/auth/start', {
    method: 'POST',
    body: JSON.stringify({ email, source, digestOptIn: true }),
  });
}

export async function logout() {
  return api('/api/logout', { method: 'POST' });
}

export async function syncLocalToCloud() {
  const snapshot = getLocalSnapshot();
  const cloud = await api('/api/subscriptions/sync', {
    method: 'POST',
    body: JSON.stringify(snapshot),
  });
  applyCloudSnapshot(cloud);
  return cloud;
}

export async function fetchCloudSnapshot() {
  const cloud = await api('/api/subscriptions/sync');
  applyCloudSnapshot(cloud);
  return cloud;
}

export async function saveEmergencyCase({ kit, issueType, rawInputExcerpt }) {
  const saved = await api('/api/cases', {
    method: 'POST',
    body: JSON.stringify({ kit, issueType, rawInputExcerpt }),
  });
  const cases = readJson(CASES_KEY, []);
  writeJson(CASES_KEY, [{
    id: saved.id,
    issueType,
    service: kit?.service || 'Subscription case',
    amount: kit?.amount || '',
    rawInputExcerpt: rawInputExcerpt || '',
    kit,
    createdAt: new Date().toISOString(),
  }, ...cases.filter(c => c.id !== saved.id)].slice(0, 20));
  return saved;
}
