const SESSION_COOKIE = 'bv_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90;

export const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function requireDb(env) {
  return env.BV_DB || env.DB || null;
}

export function uuid() {
  return crypto.randomUUID();
}

function bytesToBase64Url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function toBytes(value) {
  return new TextEncoder().encode(value);
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', toBytes(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

export function createToken(bytes = 32) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return bytesToBase64Url(buf);
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    toBytes(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, toBytes(data));
  return bytesToBase64Url(new Uint8Array(sig));
}

export async function signSession(payload, secret) {
  const body = bytesToBase64Url(toBytes(JSON.stringify(payload)));
  const sig = await hmac(secret, body);
  return `${body}.${sig}`;
}

export async function verifySession(token, secret) {
  if (!token || !secret || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = await hmac(secret, body);
  if (sig !== expected) return null;
  try {
    const json = atob(body.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);
    if (!payload?.user_id || !payload?.email) return null;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  const parts = raw.split(';').map(p => p.trim());
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx) === name) return decodeURIComponent(part.slice(idx + 1));
  }
  return '';
}

export function sessionSecret(env) {
  return env.AUTH_SESSION_SECRET || env.JWT_SIGNING_KEY || '';
}

export async function getSessionUser(context) {
  const db = requireDb(context.env);
  const secret = sessionSecret(context.env);
  if (!db || !secret) return { user: null, db, error: 'auth_unconfigured' };
  const token = getCookie(context.request, SESSION_COOKIE);
  const payload = await verifySession(token, secret);
  if (!payload) return { user: null, db, error: 'not_authenticated' };
  const row = await db.prepare('SELECT id, email, created_at, last_seen_at FROM users WHERE id = ?')
    .bind(payload.user_id)
    .first();
  if (!row) return { user: null, db, error: 'not_authenticated' };
  await db.prepare('UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?').bind(row.id).run();
  return { user: row, db, error: null };
}

export function setSessionCookie(request, token) {
  const url = new URL(request.url);
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; SameSite=Lax${secure}`;
}

export function clearSessionCookie(request) {
  const url = new URL(request.url);
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}

export function normalizeSubscriptionKey(sub) {
  const name = String(sub?.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const price = Number.parseFloat(sub?.price || 0).toFixed(2);
  const cycle = sub?.cycle === 'yearly' ? 'yearly' : 'monthly';
  return `${name}|${price}|${cycle}`;
}
