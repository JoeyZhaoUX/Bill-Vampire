import { getCookie, isValidEmail, requireDb, sessionSecret, setSessionCookie, signSession, uuid } from '../../../_shared/auth.js';

function redirect(url, hash, cookies = []) {
  const headers = new Headers({
    Location: `${url.origin}/#${hash}`,
    'Cache-Control': 'no-store',
  });
  cookies.filter(Boolean).forEach((cookie) => headers.append('Set-Cookie', cookie));
  return new Response(null, { status: 302, headers });
}

function redirectError(url, error) {
  return redirect(url, `auth-error=${encodeURIComponent(error)}`, ['bv_google_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax']);
}

function googleRedirectUri(env, url) {
  return env.GOOGLE_REDIRECT_URI || `${url.protocol}//billvampire.com/api/auth/google/callback`;
}

async function getOrCreateUser(db, email) {
  let user = await db.prepare('SELECT id, email FROM users WHERE email = ?').bind(email).first();
  if (user) return user;
  const id = uuid();
  await db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(id, email).run();
  return { id, email };
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const db = requireDb(context.env);
  const secret = sessionSecret(context.env);
  const clientId = context.env.GOOGLE_CLIENT_ID;
  const clientSecret = context.env.GOOGLE_CLIENT_SECRET;
  if (!db || !secret || !clientId || !clientSecret) return redirectError(url, 'google_unconfigured');

  if (url.searchParams.get('error')) return redirectError(url, 'google_denied');

  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  const expectedState = getCookie(context.request, 'bv_google_state');
  if (!code || !state || !expectedState || state !== expectedState) return redirectError(url, 'google_failed');

  try {
    const redirectUri = googleRedirectUri(context.env, url);
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return redirectError(url, 'google_failed');
    const token = await tokenRes.json();
    const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!userRes.ok) return redirectError(url, 'google_failed');
    const profile = await userRes.json();
    const email = String(profile.email || '').trim().toLowerCase();
    if (!isValidEmail(email) || profile.email_verified === false) return redirectError(url, 'google_failed');

    const user = await getOrCreateUser(db, email);
    await db.prepare('UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(user.id)
      .run();

    const now = Math.floor(Date.now() / 1000);
    const session = await signSession({
      user_id: user.id,
      email: user.email,
      iat: now,
      exp: now + 60 * 60 * 24 * 90,
    }, secret);
    const clearState = `bv_google_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${url.protocol === 'https:' ? '; Secure' : ''}`;
    return redirect(url, 'auth-success', [setSessionCookie(context.request, session), clearState]);
  } catch {
    return redirectError(url, 'google_failed');
  }
}
