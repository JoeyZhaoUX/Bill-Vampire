const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: HEADERS });
}

export async function onRequestPost(context) {
  const GEMINI_API_KEY = context.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
      status: 500,
      headers: HEADERS,
    });
  }

  try {
    const body = await context.request.json();
    const { contents, systemInstruction } = body;

    if (!contents) {
      return new Response(JSON.stringify({ error: 'Missing contents' }), {
        status: 400,
        headers: HEADERS,
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction }),
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
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: HEADERS,
    });
  }
}
