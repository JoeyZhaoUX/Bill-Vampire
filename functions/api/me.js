import { getSessionUser, json } from '../_shared/auth.js';

export async function onRequestGet(context) {
  const { user, error } = await getSessionUser(context);
  if (!user) {
    return json({ authenticated: false, error: error === 'auth_unconfigured' ? 'auth_unconfigured' : null }, error === 'auth_unconfigured' ? 503 : 200);
  }
  return json({ authenticated: true, user });
}
