const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function htmlResponse(title, message, status = 200) {
  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | Bill Vampire</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0B0B11; color: #e2e8f0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 560px; padding: 40px 24px; text-align: center; }
    h1 { color: #f8fafc; font-size: clamp(32px, 8vw, 52px); line-height: 1.05; margin: 0 0 16px; }
    p { color: #94a3b8; line-height: 1.65; margin: 0 0 24px; }
    a { color: #fda4af; font-weight: 800; text-decoration: none; }
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">Back to Bill Vampire</a>
  </main>
</body>
</html>`, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: HEADERS });
}

function isValidEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
}

export async function onRequestPost(context) {
  const kv = context.env.EMAIL_LIST;
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), { status: 500, headers: HEADERS });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: HEADERS });
  }

  const email = (body?.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers: HEADERS });
  }

  const monthlyUsd = Number.isFinite(body?.monthly_usd) ? Math.round(body.monthly_usd) : null;
  const tenYearUsd = Number.isFinite(body?.ten_year_usd) ? Math.round(body.ten_year_usd) : null;

  const key = `sub:${email}`;
  const existing = await kv.get(key);
  if (existing) {
    return new Response(JSON.stringify({ ok: true, alreadySubscribed: true }), { status: 200, headers: HEADERS });
  }

  const record = {
    email,
    subscribed_at: new Date().toISOString(),
    monthly_usd: monthlyUsd,
    ten_year_usd: tenYearUsd,
    source: body?.source || 'verdict',
  };

  await kv.put(key, JSON.stringify(record));

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: HEADERS });
}

export async function onRequestGet(context) {
  const kv = context.env.EMAIL_LIST;
  if (!kv) {
    return htmlResponse('Unsubscribe unavailable', 'Email preferences are not configured on this deployment yet.', 500);
  }
  const url = new URL(context.request.url);
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return htmlResponse('Invalid unsubscribe link', 'This unsubscribe link is missing a valid email address.', 400);
  }
  await kv.delete(`sub:${email}`);
  return htmlResponse('You are unsubscribed', 'Weekly vampire check-in emails have been turned off for this address.');
}

export async function onRequestDelete(context) {
  const kv = context.env.EMAIL_LIST;
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), { status: 500, headers: HEADERS });
  }
  const url = new URL(context.request.url);
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers: HEADERS });
  }
  await kv.delete(`sub:${email}`);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: HEADERS });
}
