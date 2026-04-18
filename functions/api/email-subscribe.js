const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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
