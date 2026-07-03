// Public read of the Refund Intelligence Graph for a (service, charge_type) pair.
// Used by the free verdict preview and SEO refund-stats pages — no auth required.
// Never fabricate data here: if there is no row, or the row is a seed estimate,
// callers are expected to fall back to generic copy (see emergencyKit.applyRefundIntelligence).

import { json, requireDb } from '../_shared/auth.js';

export async function onRequestGet(context) {
  const db = requireDb(context.env);
  if (!db) return json({ error: 'db_unconfigured' }, 503);

  const url = new URL(context.request.url);
  const service = url.searchParams.get('service');
  const chargeType = url.searchParams.get('charge_type');
  if (!service || !chargeType) {
    return json({ error: 'missing_params' }, 400);
  }

  const row = await db.prepare(
    'SELECT best_path, success_rate, sample_count, avg_days_to_refund, refund_window_days, is_seed_estimate FROM refund_intelligence WHERE service = ? AND charge_type = ?',
  ).bind(service, chargeType).first();

  if (!row) {
    return json({ found: false }, 200, { 'Cache-Control': 'public, max-age=300' });
  }

  return json({ found: true, intelligence: row }, 200, { 'Cache-Control': 'public, max-age=300' });
}
