import { getSessionUser, json, uuid } from '../../_shared/auth.js';

const DEFAULT_PRODUCTS = {
  emergency_kit: 'prod_5nLkYvnA8LPlZp49NvjXKZ',
  pro: 'prod_1pw0aIvQW2CzNzfMLrgGAY',
  patrol: 'prod_3l1JRnKrbMvuYiWez8JDGw',
  founder_review: '',
};

function productIdFor(env, type) {
  if (type === 'pro') return env.CREEM_PRO_PRODUCT_ID || DEFAULT_PRODUCTS.pro;
  if (type === 'patrol') return env.CREEM_PATROL_MONTHLY_PRODUCT_ID || DEFAULT_PRODUCTS.patrol;
  if (type === 'founder_review') return env.CREEM_FOUNDER_REVIEW_PRODUCT_ID || DEFAULT_PRODUCTS.founder_review;
  return env.CREEM_EMERGENCY_KIT_PRODUCT_ID || DEFAULT_PRODUCTS.emergency_kit;
}

function successHash(type) {
  if (type === 'pro') return 'payment-success';
  if (type === 'patrol') return 'patrol-success-patrol';
  if (type === 'founder_review') return 'founder-review-success';
  return 'emergency-kit-success';
}

function cleanMetadata(value) {
  const out = {};
  for (const [key, raw] of Object.entries(value || {})) {
    if (raw === null || raw === undefined) continue;
    out[key] = String(raw).slice(0, 180);
  }
  return out;
}

export async function onRequestPost(context) {
  const apiKey = context.env.CREEM_API_KEY;
  if (!apiKey) return json({ error: 'creem_api_unconfigured' }, 503);

  let body;
  try { body = await context.request.json(); } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const type = ['emergency_kit', 'pro', 'patrol', 'founder_review'].includes(body?.type) ? body.type : 'emergency_kit';
  const url = new URL(context.request.url);
  const requestId = uuid();
  const { user } = await getSessionUser(context);
  const productId = productIdFor(context.env, type);
  if (!productId) return json({ error: `${type}_product_unconfigured` }, 503);
  const payload = {
    product_id: productId,
    success_url: `${url.origin}/#${successHash(type)}`,
    request_id: requestId,
    metadata: {
      requestId,
      type,
      source: String(body?.source || 'unknown').slice(0, 80),
      ...(user?.id ? { userId: user.id } : {}),
      ...cleanMetadata(body?.metadata),
    },
    ...(user?.email ? { customer: { email: user.email } } : {}),
  };

  const res = await fetch('https://api.creem.io/v1/checkouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.checkout_url) {
    return json({ error: data?.error || data?.message || 'creem_checkout_failed' }, res.status || 502);
  }

  return json({ ok: true, checkoutUrl: data.checkout_url, requestId });
}
