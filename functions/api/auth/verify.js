import { json, requireDb, sessionSecret, setSessionCookie, sha256, signSession } from '../../_shared/auth.js';

export async function onRequestGet(context) {
  const db = requireDb(context.env);
  const secret = sessionSecret(context.env);
  const url = new URL(context.request.url);
  if (!db || !secret) return json({ error: 'auth_unconfigured' }, 503);

  const token = url.searchParams.get('token') || '';
  if (!token) return json({ error: 'missing_token' }, 400);
  const tokenHash = await sha256(token);
  const link = await db.prepare(
    'SELECT token_hash, user_id, email, expires_at, used_at FROM magic_links WHERE token_hash = ?',
  ).bind(tokenHash).first();

  if (!link || link.used_at) return json({ error: 'invalid_or_used_token' }, 400);
  if (new Date(link.expires_at).getTime() < Date.now()) return json({ error: 'expired_token' }, 400);

  await db.prepare('UPDATE magic_links SET used_at = CURRENT_TIMESTAMP WHERE token_hash = ?')
    .bind(tokenHash)
    .run();
  await db.prepare('UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(link.user_id)
    .run();

  const now = Math.floor(Date.now() / 1000);
  const session = await signSession({
    user_id: link.user_id,
    email: link.email,
    iat: now,
    exp: now + 60 * 60 * 24 * 90,
  }, secret);

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${url.origin}/#auth-success`,
      'Set-Cookie': setSessionCookie(context.request, session),
      'Cache-Control': 'no-store',
    },
  });
}
