import { clearSessionCookie, json } from '../_shared/auth.js';

export async function onRequestPost(context) {
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(context.request) });
}
