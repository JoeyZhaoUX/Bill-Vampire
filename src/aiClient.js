const API_ENDPOINT = '/api/gemini';

function getProToken() {
  try {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const [k, v] = c.trim().split('=');
      if (k === 'bv_pro') return v;
    }
  } catch { /* ignore */ }
  return null;
}

export class RateLimitError extends Error {
  constructor(limit) {
    super('Daily limit reached');
    this.name = 'RateLimitError';
    this.limit = limit;
  }
}

export async function callAi(payload) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getProToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (res.status === 429 && data.code === 'RATE_LIMITED') {
    throw new RateLimitError(data.limit);
  }

  if (!res.ok || data.error) {
    const msg = typeof data.error === 'string' ? data.error : data.error?.message || 'Unknown error';
    throw new Error(msg);
  }

  return data;
}
