import { getSessionUser, json, uuid } from '../../_shared/auth.js';

const STATUS_VALUES = ['draft', 'sent', 'awaiting', 'escalated', 'won', 'lost', 'abandoned'];

// Whitelist of columns that PATCH may update. Never build the SET clause from
// user-supplied keys — only these fixed column names are ever interpolated,
// and every value is still bound with `?`.
const PATCHABLE_FIELDS = ['status', 'current_step', 'next_action_at', 'amount_recovered'];

function pickUpdates(body) {
  const updates = {};
  if (body?.status !== undefined) updates.status = body.status;
  if (body?.current_step !== undefined || body?.currentStep !== undefined) {
    updates.current_step = body.current_step ?? body.currentStep;
  }
  if (body?.next_action_at !== undefined || body?.nextActionAt !== undefined) {
    updates.next_action_at = body.next_action_at ?? body.nextActionAt;
  }
  if (body?.amount_recovered !== undefined || body?.amountRecovered !== undefined) {
    updates.amount_recovered = body.amount_recovered ?? body.amountRecovered;
  }
  return updates;
}

function inferEventType(updates) {
  if (updates.status === 'escalated') return 'escalated';
  if (updates.status === 'won' || updates.status === 'lost' || updates.status === 'abandoned') return 'outcome_reported';
  if (updates.current_step !== undefined) return 'step_generated';
  return 'user_sent';
}

export async function onRequestPatch(context) {
  const { user, db, error } = await getSessionUser(context);
  if (!user) return json({ error }, error === 'auth_unconfigured' ? 503 : 401);

  const id = context.params?.id;
  if (!id) return json({ error: 'missing_id' }, 400);

  let body;
  try { body = await context.request.json(); } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const existing = await db.prepare('SELECT user_id FROM emergency_cases WHERE id = ?').bind(id).first();
  if (!existing) return json({ error: 'not_found' }, 404);
  if (existing.user_id !== user.id) return json({ error: 'forbidden' }, 403);

  if (body?.status !== undefined && !STATUS_VALUES.includes(body.status)) {
    return json({ error: 'invalid_status' }, 400);
  }

  const updates = pickUpdates(body);
  const fields = Object.keys(updates).filter(key => PATCHABLE_FIELDS.includes(key));
  if (!fields.length) return json({ error: 'no_fields' }, 400);

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => updates[field]);
  await db.prepare(`UPDATE emergency_cases SET ${setClause} WHERE id = ?`)
    .bind(...values, id)
    .run();

  const eventType = inferEventType(updates);
  await db.prepare(
    'INSERT INTO case_events (id, case_id, user_id, event_type, step_index, payload_json) VALUES (?, ?, ?, ?, ?, ?)',
  ).bind(
    uuid(),
    id,
    user.id,
    eventType,
    updates.current_step !== undefined ? Number(updates.current_step) : null,
    JSON.stringify(body || {}),
  ).run();

  return json({ ok: true });
}

export async function onRequestGet(context) {
  const { user, db, error } = await getSessionUser(context);
  if (!user) return json({ error }, error === 'auth_unconfigured' ? 503 : 401);

  const id = context.params?.id;
  if (!id) return json({ error: 'missing_id' }, 400);

  const caseRow = await db.prepare(
    'SELECT id, user_id AS userId, issue_type AS issueType, service, amount, raw_input_excerpt AS rawInputExcerpt, kit_json AS kitJson, status, current_step AS currentStep, amount_recovered AS amountRecovered, next_action_at AS nextActionAt, charge_type AS chargeType, jurisdiction, created_at AS createdAt FROM emergency_cases WHERE id = ?',
  ).bind(id).first();
  if (!caseRow) return json({ error: 'not_found' }, 404);
  if (caseRow.userId !== user.id) return json({ error: 'forbidden' }, 403);

  const events = await db.prepare(
    'SELECT id, event_type AS eventType, step_index AS stepIndex, payload_json AS payloadJson, created_at AS createdAt FROM case_events WHERE case_id = ? ORDER BY created_at ASC',
  ).bind(id).all();

  let kit = null;
  try { kit = caseRow.kitJson ? JSON.parse(caseRow.kitJson) : null; } catch { kit = null; }

  return json({
    ok: true,
    case: { ...caseRow, kit, kitJson: undefined, userId: undefined },
    events: (events.results || []).map(ev => {
      let payload = null;
      try { payload = ev.payloadJson ? JSON.parse(ev.payloadJson) : null; } catch { payload = null; }
      return { ...ev, payload, payloadJson: undefined };
    }),
  });
}
