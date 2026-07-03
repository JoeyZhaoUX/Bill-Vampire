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
  return {
    subscriptions: readJson('vampire_subs', []),
    cancelled: readJson('vampire_cancelled', []),
    cases: readJson(CASES_KEY, []),
    // Never migrate browser-only unlock flags into cloud entitlements.
    // Durable paid access should come from the Creem webhook, keyed by checkout email.
    entitlements: [],
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
      status: c.status || 'draft',
      currentStep: c.currentStep ?? c.current_step ?? 0,
      amountRecovered: c.amountRecovered ?? c.amount_recovered ?? 0,
      nextActionAt: c.nextActionAt || c.next_action_at || null,
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

export function getGoogleAuthUrl(reason = 'login') {
  return `/api/auth/google/start?reason=${encodeURIComponent(reason)}`;
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

export async function patchCase(id, updates) {
  return api(`/api/cases/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// Outcome capture: the write side of the Refund Intelligence Graph data moat.
// Open to any authenticated user (no paid-tier check) per plan §3 — the graph
// never accumulates enough samples if reporting sits behind a paywall.
// Returns the parsed JSON body even on non-2xx so callers can branch on
// res.error === 'already_reported' (409) without a try/catch.
export async function reportOutcome(payload) {
  try {
    return await api('/api/case-outcomes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err?.data) return err.data;
    return { error: err?.message || 'request_failed' };
  }
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
