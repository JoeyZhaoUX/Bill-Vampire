import { getSessionUser, json, normalizeSubscriptionKey, uuid } from '../../_shared/auth.js';

function parseJson(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

async function readSnapshot(db, userId) {
  const subscriptions = await db.prepare(
    'SELECT id, name, price, cycle, category, renewal_date AS renewalDate, source, created_at AS createdAt, updated_at AS updatedAt FROM subscriptions WHERE user_id = ? ORDER BY updated_at DESC',
  ).bind(userId).all();
  const cancelled = await db.prepare(
    'SELECT id, name, monthly_usd AS monthlyUSD, cancelled_at AS cancelledAt, created_at AS createdAt FROM cancelled_subscriptions WHERE user_id = ? ORDER BY created_at DESC',
  ).bind(userId).all();
  const cases = await db.prepare(
    'SELECT id, issue_type AS issueType, service, amount, raw_input_excerpt AS rawInputExcerpt, kit_json AS kitJson, created_at AS createdAt FROM emergency_cases WHERE user_id = ? ORDER BY created_at DESC',
  ).bind(userId).all();
  const entitlements = await db.prepare(
    'SELECT id, type, source, creem_reference AS creemReference, created_at AS createdAt FROM entitlements WHERE user_id = ? ORDER BY created_at DESC',
  ).bind(userId).all();

  return {
    subscriptions: subscriptions.results || [],
    cancelled: cancelled.results || [],
    cases: (cases.results || []).map(row => ({ ...row, kit: parseJson(row.kitJson, null), kitJson: undefined })),
    entitlements: entitlements.results || [],
  };
}

export async function onRequestGet(context) {
  const { user, db, error } = await getSessionUser(context);
  if (!user) return json({ error }, error === 'auth_unconfigured' ? 503 : 401);
  return json({ ok: true, user, ...(await readSnapshot(db, user.id)) });
}

export async function onRequestPost(context) {
  const { user, db, error } = await getSessionUser(context);
  if (!user) return json({ error }, error === 'auth_unconfigured' ? 503 : 401);

  let body;
  try { body = await context.request.json(); } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const existing = await db.prepare(
    'SELECT id, name, price, cycle FROM subscriptions WHERE user_id = ?',
  ).bind(user.id).all();
  const existingKeys = new Set((existing.results || []).map(normalizeSubscriptionKey));

  for (const sub of Array.isArray(body?.subscriptions) ? body.subscriptions : []) {
    if (!sub?.name) continue;
    const cycle = sub.cycle === 'yearly' ? 'yearly' : 'monthly';
    const price = Number.parseFloat(sub.price || 0) || 0;
    const key = normalizeSubscriptionKey({ ...sub, cycle, price });
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);
    await db.prepare(
      'INSERT INTO subscriptions (id, user_id, name, price, cycle, category, renewal_date, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).bind(
      sub.id || uuid(),
      user.id,
      String(sub.name).slice(0, 160),
      price,
      cycle,
      sub.category || null,
      sub.renewalDate || sub.renewal_date || null,
      sub.source || 'local_migration',
    ).run();
  }

  for (const item of Array.isArray(body?.cancelled) ? body.cancelled : []) {
    if (!item?.name) continue;
    await db.prepare(
      'INSERT OR IGNORE INTO cancelled_subscriptions (id, user_id, name, monthly_usd, cancelled_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(
      item.id || uuid(),
      user.id,
      String(item.name).slice(0, 160),
      Number.parseFloat(item.monthlyUSD || item.monthly_usd || 0) || 0,
      item.cancelledAt ? new Date(item.cancelledAt).toISOString() : new Date().toISOString(),
    ).run();
  }

  for (const ent of Array.isArray(body?.entitlements) ? body.entitlements : []) {
    if (!ent?.type) continue;
    await db.prepare(
      'INSERT OR IGNORE INTO entitlements (id, user_id, type, source, creem_reference) VALUES (?, ?, ?, ?, ?)',
    ).bind(ent.id || uuid(), user.id, ent.type, ent.source || 'local_migration', ent.creemReference || null).run();
  }

  return json({ ok: true, user, ...(await readSnapshot(db, user.id)) });
}
