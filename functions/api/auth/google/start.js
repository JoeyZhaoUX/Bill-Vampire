import { createToken } from '../../../_shared/auth.js';

function redirectError(url, error) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${url.origin}/#auth-error=${encodeURIComponent(error)}`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const clientId = context.env.GOOGLE_CLIENT_ID;
  if (!clientId) return redirectError(url, 'google_unconfigured');

  const state = createToken(24);
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  const cookie = `bv_google_state=${encodeURIComponent(state)}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax${url.protocol === 'https:' ? '; Secure' : ''}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      'Set-Cookie': cookie,
      'Cache-Control': 'no-store',
    },
  });
}
