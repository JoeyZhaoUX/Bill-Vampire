// Outcome capture: the write side of the Refund Intelligence Graph data moat.
// Open to authenticated users regardless of paid status — the plan is explicit
// that outcome reporting must not sit behind a paywall, or the graph never
// accumulates enough samples to leave "seed estimate" status.
//
// One vote per (user, service, charge_type) — enforced by the unique index in
// migrations/0002_refund_engine.sql — so a single user can't pad the graph by
// resubmitting. On each accepted report we recompute the Beta-smoothed
// aggregate for that pair synchronously; there is no separate cron job because
// D1 read-then-write here is cheap and keeps the data always current.

import { getSessionUser, json, uuid } from '../_shared/auth.js';

const CHARGE_TYPES = ['surprise_charge', 'hard_cancel', 'trial_refund', 'refund_denied'];

// Beta(2,2) prior: success_rate = (wins + 2) / (total + 4). Pulls small-sample
// rates toward 50% instead of letting e.g. 1/1 report to a false 100%.
function betaSmoothedRate(wins, total) {
  return (wins + 2) / (total + 4);
}

async function recomputeIntelligence(db, service, chargeType) {
  const agg = await db.prepare(
    `SELECT
       COUNT(*) AS total,
       SUM(won) AS wins,
       AVG(days_to_resolve) AS avg_days,
       path_used
     FROM case_outcomes
     WHERE service = ? AND charge_type = ?
     GROUP BY path_used
     ORDER BY COUNT(*) DESC`,
  ).bind(service, chargeType).all();

  const rows = agg.results || [];
  if (!rows.length) return;

  const total = rows.reduce((sum, r) => sum + (r.total || 0), 0);
  const wins = rows.reduce((sum, r) => sum + (r.wins || 0), 0);
  const avgDays = total > 0
    ? rows.reduce((sum, r) => sum + (r.avg_days || 0) * (r.total || 0), 0) / total
    : null;
  // best_path = the path with the most reports (ties broken by insertion order from ORDER BY above).
  const bestPath = rows[0]?.path_used || null;
  const successRate = betaSmoothedRate(wins, total);

  await db.prepare(
    `INSERT INTO refund_intelligence (id, service, charge_type, best_path, success_rate, sample_count, avg_days_to_refund, is_seed_estimate, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
     ON CONFLICT(service, charge_type) DO UPDATE SET
       best_path = excluded.best_path,
       success_rate = excluded.success_rate,
       sample_count = excluded.sample_count,
       avg_days_to_refund = excluded.avg_days_to_refund,
       is_seed_estimate = 0,
       updated_at = CURRENT_TIMESTAMP`,
  ).bind(uuid(), service, chargeType, bestPath, successRate, total, avgDays).run();
}

export async function onRequestPost(context) {
  const { user, db, error } = await getSessionUser(context);
  if (!user) return json({ error }, error === 'auth_unconfigured' ? 503 : 401);

  let body;
  try { body = await context.request.json(); } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const service = String(body?.service || '').trim();
  const chargeType = body?.charge_type || body?.chargeType;
  const won = body?.won === true || body?.won === 1 ? 1 : 0;
  const amount = Number.isFinite(parseFloat(body?.amount)) ? parseFloat(body.amount) : null;
  const daysToResolve = Number.isFinite(parseInt(body?.days_to_resolve ?? body?.daysToResolve, 10))
    ? parseInt(body.days_to_resolve ?? body.daysToResolve, 10)
    : null;
  const pathUsed = body?.path_used || body?.pathUsed || 'unknown';
  const caseId = body?.case_id || body?.caseId || null;

  if (!service) return json({ error: 'missing_service' }, 400);
  if (!CHARGE_TYPES.includes(chargeType)) return json({ error: 'invalid_charge_type' }, 400);

  try {
    await db.prepare(
      'INSERT INTO case_outcomes (id, case_id, user_id, service, charge_type, path_used, won, amount, days_to_resolve) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).bind(uuid(), caseId, user.id, service, chargeType, pathUsed, won, amount, daysToResolve).run();
  } catch (err) {
    // Unique constraint on (user_id, service, charge_type) — this user already voted for this pair.
    if (String(err?.message || '').includes('UNIQUE')) {
      return json({ error: 'already_reported' }, 409);
    }
    throw err;
  }

  await recomputeIntelligence(db, service, chargeType);

  if (caseId) {
    await db.prepare(
      "UPDATE emergency_cases SET status = ?, amount_recovered = ? WHERE id = ? AND user_id = ?",
    ).bind(won ? 'won' : 'lost', won ? (amount || 0) : 0, caseId, user.id).run();
  }

  return json({ ok: true });
}
