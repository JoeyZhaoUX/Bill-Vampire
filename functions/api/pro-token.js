import { getSessionUser } from '../_shared/auth.js';

// Issues a signed JWT cookie at .billvampire.com so companion surfaces can verify paid access.
// POST /api/pro-token body: { tier: 'pro' | 'emergency_kit' | 'patrol' | 'patrol_annual' }
// The endpoint only issues a token after checking the logged-in user's cloud entitlement.

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const TIER_TTL_MS = {
  pro: 50 * 365 * 24 * 60 * 60 * 1000,
  emergency_kit: 50 * 365 * 24 * 60 * 60 * 1000,
  patrol: 35 * 24 * 60 * 60 * 1000,
  patrol_annual: 366 * 24 * 60 * 60 * 1000,
};

function base64urlEncode(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function toBytes(str) {
  return new TextEncoder().encode(str);
}

async function hmacSign(key, data) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', toBytes(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, toBytes(data));
  return base64urlEncode(new Uint8Array(sig));
}

async function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const h = base64urlEncode(toBytes(JSON.stringify(header)));
  const p = base64urlEncode(toBytes(JSON.stringify(payload)));
  const s = await hmacSign(secret, `${h}.${p}`);
  return `${h}.${p}.${s}`;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: HEADERS });
}

export async function onRequestPost(context) {
  const secret = context.env.JWT_SIGNING_KEY;
  if (!secret) {
    return new Response(JSON.stringify({ error: 'signing key not configured' }), { status: 500, headers: HEADERS });
  }

  let body;
  try { body = await context.request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: HEADERS });
  }

  const tier = body?.tier;
  if (!TIER_TTL_MS[tier]) {
    return new Response(JSON.stringify({ error: 'Invalid tier' }), { status: 400, headers: HEADERS });
  }

  const { user, db, error } = await getSessionUser(context);
  if (!user) {
    const status = error === 'auth_unconfigured' ? 503 : 401;
    return new Response(JSON.stringify({ error: error || 'not_authenticated' }), { status, headers: HEADERS });
  }

  const entitlementTypes = tier === 'pro' ? ['pro', 'emergency_kit'] : [tier];
  const placeholders = entitlementTypes.map(() => '?').join(', ');
  const entitlement = await db.prepare(
    `SELECT type FROM entitlements WHERE user_id = ? AND type IN (${placeholders}) LIMIT 1`,
  ).bind(user.id, ...entitlementTypes).first();
  if (!entitlement) {
    return new Response(JSON.stringify({ error: 'paid_entitlement_required' }), { status: 403, headers: HEADERS });
  }

  const now = Date.now();
  const payload = {
    tier,
    user_id: user.id,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + TIER_TTL_MS[tier]) / 1000),
  };

  const token = await signJwt(payload, secret);
  const maxAge = Math.floor(TIER_TTL_MS[tier] / 1000);
  const cookie = `bv_pro=${token}; Domain=.billvampire.com; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;

  return new Response(JSON.stringify({ ok: true, token, exp: payload.exp }), {
    status: 200,
    headers: { ...HEADERS, 'Set-Cookie': cookie },
  });
}
