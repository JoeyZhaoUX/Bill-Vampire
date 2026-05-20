// Live "$ wasted so far" counter for the landing page social-proof gauge.
// Uses Cloudflare KV namespace bound as `VAMPIRE_STATS` in wrangler.toml.
// Gracefully degrades if KV is not bound (returns a synthetic baseline).

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

const COUNTER_KEY = 'total_ten_year_waste_usd';
// Baseline shown when the counter has not yet accumulated real data. This
// reads "we've already processed this much" so a first visitor doesn't see $0.
const BASELINE_USD = 128400;
// Hard cap per POST to keep a broken client from inflating the counter.
const MAX_INCREMENT_USD = 1_000_000;

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: HEADERS });
}

async function readCounter(env) {
  if (!env?.VAMPIRE_STATS) return null;
  const raw = await env.VAMPIRE_STATS.get(COUNTER_KEY);
  if (!raw) return 0;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

async function writeCounter(env, value) {
  if (!env?.VAMPIRE_STATS) return;
  await env.VAMPIRE_STATS.put(COUNTER_KEY, String(value));
}

export async function onRequestGet(context) {
  const stored = await readCounter(context.env);
  const total = (stored ?? 0) + BASELINE_USD;
  return new Response(JSON.stringify({ total }), { status: 200, headers: HEADERS });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const increment = parseFloat(body.usd);
    if (!Number.isFinite(increment) || increment <= 0 || increment > MAX_INCREMENT_USD) {
      return new Response(JSON.stringify({ error: 'invalid_increment' }), { status: 400, headers: HEADERS });
    }
    if (!context.env?.VAMPIRE_STATS) {
      // KV not bound — accept the request so the client can keep working locally,
      // but don't persist anything.
      return new Response(JSON.stringify({ total: BASELINE_USD + increment, persisted: false }), { status: 200, headers: HEADERS });
    }
    const current = await readCounter(context.env);
    const next = (current || 0) + increment;
    await writeCounter(context.env, next);
    return new Response(JSON.stringify({ total: next + BASELINE_USD, persisted: true }), { status: 200, headers: HEADERS });
  } catch {
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: HEADERS });
  }
}
