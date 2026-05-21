const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const FREE_DAILY_LIMIT = 3;
const RATE_LIMIT_TTL = 86400; // 24 hours in seconds

function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown';
}

function base64urlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

async function verifyJwt(token, secret) {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const cryptoKey = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify'],
    );
    const sigBytes = Uint8Array.from(base64urlDecode(s), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, new TextEncoder().encode(`${h}.${p}`));
    if (!valid) return null;
    const payload = JSON.parse(base64urlDecode(p));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function checkRateLimit(kv, ip) {
  const key = `rl:${todayKey()}:${ip}`;
  const raw = await kv.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  return { count, key };
}

async function incrementRateLimit(kv, key, currentCount) {
  await kv.put(key, String(currentCount + 1), { expirationTtl: RATE_LIMIT_TTL });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: HEADERS });
}

export async function onRequestPost(context) {
  const GEMINI_API_KEY = context.env.GEMINI_API_KEY;
  const JWT_SECRET = context.env.JWT_SIGNING_KEY;
  const KV = context.env.RATE_LIMIT;

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
      status: 500,
      headers: HEADERS,
    });
  }

  // Check if user is a paying customer via JWT
  let isPaid = false;
  const authHeader = context.request.headers.get('Authorization');
  if (authHeader && JWT_SECRET) {
    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyJwt(token, JWT_SECRET);
    if (payload && payload.tier) isPaid = true;
  }

  // IP-based rate limiting for free users
  if (!isPaid && KV) {
    const ip = getClientIp(context.request);
    const { count, key } = await checkRateLimit(KV, ip);

    if (count >= FREE_DAILY_LIMIT) {
      return new Response(JSON.stringify({
        error: 'Daily limit reached. Unlock the Emergency Kit for scripts and saved case files.',
        code: 'RATE_LIMITED',
        limit: FREE_DAILY_LIMIT,
      }), {
        status: 429,
        headers: { ...HEADERS, 'Retry-After': '86400' },
      });
    }

    await incrementRateLimit(KV, key, count);
  }

  try {
    const body = await context.request.json();
    const { contents, systemInstruction, generationConfig } = body;

    if (!contents) {
      return new Response(JSON.stringify({ error: 'Missing contents' }), {
        status: 400,
        headers: HEADERS,
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const payload = { contents, systemInstruction };
    if (generationConfig) payload.generationConfig = generationConfig;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message || `Google API returned ${res.status}`;
      return new Response(JSON.stringify({ error: errMsg }), {
        status: res.status,
        headers: HEADERS,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: HEADERS,
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: HEADERS,
    });
  }
}
