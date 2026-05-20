import { createToken, isValidEmail, json, requireDb, sha256, uuid } from '../../_shared/auth.js';

async function sendMagicLink(env, email, magicLink) {
  if (!env.RESEND_API_KEY) return { sent: false, reason: 'resend_not_configured' };
  const from = env.AUTH_EMAIL_FROM || 'Bill Vampire <hello@billvampire.com>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: 'Your Bill Vampire sign-in link',
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#0d0b0e;color:#f7efe6;padding:28px">
          <h1 style="margin:0 0 12px">Save your Bill Vampire case file</h1>
          <p style="color:#cdbfb6;line-height:1.6">Open this secure link to sign in and sync your subscriptions, reminders, and Emergency Kit across devices.</p>
          <p><a href="${magicLink}" style="display:inline-block;background:#8e1d2c;color:#f7efe6;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Sign in to Bill Vampire</a></p>
          <p style="color:#8f817a;font-size:12px">This link expires in 15 minutes. No bank login is required.</p>
        </div>
      `,
    }),
  });
  if (!res.ok) return { sent: false, reason: 'resend_error' };
  return { sent: true };
}

export async function onRequestPost(context) {
  const db = requireDb(context.env);
  if (!db) return json({ error: 'auth_unconfigured' }, 503);

  let body;
  try { body = await context.request.json(); } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const email = String(body?.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) return json({ error: 'invalid_email' }, 400);

  let user = await db.prepare('SELECT id, email FROM users WHERE email = ?').bind(email).first();
  if (!user) {
    const id = uuid();
    await db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(id, email).run();
    user = { id, email };
  }

  const token = createToken();
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await db.prepare(
    'INSERT INTO magic_links (token_hash, user_id, email, expires_at) VALUES (?, ?, ?, ?)',
  ).bind(tokenHash, user.id, email, expiresAt).run();

  if (context.env.EMAIL_LIST && body?.digestOptIn !== false) {
    await context.env.EMAIL_LIST.put(`sub:${email}`, JSON.stringify({
      email,
      source: body?.source || 'auth',
      subscribed_at: new Date().toISOString(),
    }));
  }

  const url = new URL(context.request.url);
  const magicLink = `${url.origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const delivery = await sendMagicLink(context.env, email, magicLink);

  return json({
    ok: true,
    email,
    emailSent: delivery.sent,
    reason: delivery.reason || null,
    magicLink: delivery.sent ? undefined : magicLink,
  });
}
