import { isValidEmail, json, requireDb, uuid } from '../../_shared/auth.js';

const DEFAULT_PRODUCTS = {
  emergency_kit: 'prod_5nLkYvnA8LPlZp49NvjXKZ',
  pro: 'prod_1pw0aIvQW2CzNzfMLrgGAY',
  patrol: 'prod_3l1JRnKrbMvuYiWez8JDGw',
  patrol_annual: '',
  founder_review: '',
};

function productMap(env) {
  return {
    [env.CREEM_EMERGENCY_KIT_PRODUCT_ID || DEFAULT_PRODUCTS.emergency_kit]: 'emergency_kit',
    [env.CREEM_PRO_PRODUCT_ID || DEFAULT_PRODUCTS.pro]: 'pro',
    [env.CREEM_PATROL_MONTHLY_PRODUCT_ID || DEFAULT_PRODUCTS.patrol]: 'patrol',
    ...(env.CREEM_FOUNDER_REVIEW_PRODUCT_ID || DEFAULT_PRODUCTS.founder_review
      ? { [env.CREEM_FOUNDER_REVIEW_PRODUCT_ID || DEFAULT_PRODUCTS.founder_review]: 'founder_review' }
      : {}),
    ...(env.CREEM_PATROL_ANNUAL_PRODUCT_ID || DEFAULT_PRODUCTS.patrol_annual
      ? { [env.CREEM_PATROL_ANNUAL_PRODUCT_ID || DEFAULT_PRODUCTS.patrol_annual]: 'patrol_annual' }
      : {}),
  };
}

function bytesToHex(bytes) {
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToHex(new Uint8Array(sig));
}

function timingSafeEqual(a, b) {
  const left = String(a || '').trim().toLowerCase();
  const right = String(b || '').trim().toLowerCase();
  if (!left || !right || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

function eventType(event) {
  return event?.eventType || event?.type || '';
}

function eventObject(event) {
  return event?.object || event?.data || {};
}

function productId(event) {
  const obj = eventObject(event);
  return obj?.product?.id
    || obj?.product_id
    || obj?.product
    || obj?.order?.product
    || obj?.subscription?.product
    || '';
}

function customerEmail(event) {
  const obj = eventObject(event);
  return String(
    obj?.customer?.email
    || obj?.customer_email
    || obj?.order?.customer?.email
    || obj?.checkout?.customer?.email
    || event?.customer?.email
    || event?.email
    || '',
  ).trim().toLowerCase();
}

function creemReference(event) {
  const obj = eventObject(event);
  return event?.id || obj?.request_id || obj?.order?.id || obj?.id || null;
}

function metadata(event) {
  const obj = eventObject(event);
  return obj?.metadata
    || obj?.checkout?.metadata
    || obj?.subscription?.metadata
    || event?.metadata
    || {};
}

function metadataUserId(event) {
  const meta = metadata(event);
  return String(meta?.userId || meta?.user_id || meta?.referenceId || '').trim();
}

async function getOrCreateUser(db, email) {
  let user = await db.prepare('SELECT id, email FROM users WHERE email = ?').bind(email).first();
  if (user) return user;
  const id = uuid();
  await db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(id, email).run();
  return { id, email };
}

async function resolveUser(db, event, email) {
  const userId = metadataUserId(event);
  if (userId) {
    const user = await db.prepare('SELECT id, email FROM users WHERE id = ?').bind(userId).first();
    if (user) return user;
  }
  if (!isValidEmail(email)) return null;
  return getOrCreateUser(db, email);
}

async function grantEntitlement(db, userId, type, reference) {
  await db.prepare(
    `INSERT INTO entitlements (id, user_id, type, source, creem_reference)
     VALUES (?, ?, ?, 'creem_webhook', ?)
     ON CONFLICT(user_id, type) DO UPDATE SET
       source = 'creem_webhook',
       creem_reference = excluded.creem_reference,
       created_at = CURRENT_TIMESTAMP`,
  ).bind(uuid(), userId, type, reference).run();
}

async function revokeEntitlement(db, userId, type) {
  await db.prepare('DELETE FROM entitlements WHERE user_id = ? AND type = ?')
    .bind(userId, type)
    .run();
}

export async function onRequestPost(context) {
  const db = requireDb(context.env);
  const secret = context.env.CREEM_WEBHOOK_SECRET;
  if (!db || !secret) return json({ error: 'webhook_unconfigured' }, 503);

  const payload = await context.request.text();
  const signature = context.request.headers.get('creem-signature') || '';
  const expected = await hmacHex(secret, payload);
  if (!timingSafeEqual(signature, expected)) {
    return json({ error: 'invalid_signature' }, 401);
  }

  let event;
  try { event = JSON.parse(payload); } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const type = eventType(event);
  const email = customerEmail(event);
  const entitlement = productMap(context.env)[productId(event)];

  if (!entitlement) return json({ ok: true, ignored: 'unknown_product', eventType: type });
  const user = await resolveUser(db, event, email);
  if (!user) return json({ ok: true, ignored: 'missing_customer', eventType: type });

  const grantEvents = new Set(['checkout.completed', 'subscription.active', 'subscription.paid', 'subscription.trialing']);
  const revokeEvents = new Set(['refund.created', 'dispute.created', 'subscription.canceled', 'subscription.expired']);

  if (grantEvents.has(type)) {
    await grantEntitlement(db, user.id, entitlement, creemReference(event));
    return json({ ok: true, action: 'granted', entitlement, eventType: type });
  }

  if (revokeEvents.has(type)) {
    await revokeEntitlement(db, user.id, entitlement);
    return json({ ok: true, action: 'revoked', entitlement, eventType: type });
  }

  return json({ ok: true, ignored: 'unsupported_event', entitlement, eventType: type });
}
