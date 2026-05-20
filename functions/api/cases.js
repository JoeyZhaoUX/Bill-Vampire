import { getSessionUser, json, uuid } from '../_shared/auth.js';

export async function onRequestPost(context) {
  const { user, db, error } = await getSessionUser(context);
  if (!user) return json({ error }, error === 'auth_unconfigured' ? 503 : 401);

  let body;
  try { body = await context.request.json(); } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const kit = body?.kit || {};
  const id = body?.id || uuid();
  await db.prepare(
    'INSERT INTO emergency_cases (id, user_id, issue_type, service, amount, raw_input_excerpt, kit_json) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).bind(
    id,
    user.id,
    body?.issueType || body?.issue_type || 'surprise_charge',
    kit.service || body?.service || null,
    kit.amount || body?.amount || null,
    String(body?.rawInputExcerpt || body?.raw_input_excerpt || '').slice(0, 1000),
    JSON.stringify(kit),
  ).run();

  return json({ ok: true, id });
}
