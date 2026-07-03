import { getSessionUser, json, uuid } from '../../_shared/auth.js';

const DEFAULT_PRODUCTS = {
  emergency_kit: 'prod_5nLkYvnA8LPlZp49NvjXKZ',
  pro: 'prod_1pw0aIvQW2CzNzfMLrgGAY',
  patrol: 'prod_3l1JRnKrbMvuYiWez8JDGw',
  founder_review: '',
  recovery_case: 'prod_4GBYdpWeFg9ekbVmdbcqMP',
  guardian: 'prod_6n3m6MXnrd97XCPWYKdfWz',
  guardian_annual: 'prod_5G5D809hitmYcHa9t2HK2I',
};

function productIdFor(env, type) {
  if (type === 'pro') return env.CREEM_PRO_PRODUCT_ID || DEFAULT_PRODUCTS.pro;
  if (type === 'patrol') return env.CREEM_PATROL_MONTHLY_PRODUCT_ID || DEFAULT_PRODUCTS.patrol;
  if (type === 'founder_review') return env.CREEM_FOUNDER_REVIEW_PRODUCT_ID || DEFAULT_PRODUCTS.founder_review;
  if (type === 'recovery_case') return env.CREEM_RECOVERY_CASE_PRODUCT_ID || DEFAULT_PRODUCTS.recovery_case;
  if (type === 'guardian') return env.CREEM_GUARDIAN_MONTHLY_PRODUCT_ID || DEFAULT_PRODUCTS.guardian;
  if (type === 'guardian_annual') return env.CREEM_GUARDIAN_ANNUAL_PRODUCT_ID || DEFAULT_PRODUCTS.guardian_annual;
  return env.CREEM_EMERGENCY_KIT_PRODUCT_ID || DEFAULT_PRODUCTS.emergency_kit;
}

function successHash(type) {
  if (type === 'pro') return 'payment-success';
  if (type === 'patrol') return 'patrol-success-patrol';
  if (type === 'founder_review') return 'founder-review-success';
  if (type === 'recovery_case') return 'recovery-case-success';
  if (type === 'guardian') return 'guardian-success-monthly';
  if (type === 'guardian_annual') return 'guardian-success-annual';
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

  const type = ['emergency_kit', 'pro', 'patrol', 'founder_review', 'recovery_case', 'guardian', 'guardian_annual'].includes(body?.type) ? body.type : 'emergency_kit';
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
