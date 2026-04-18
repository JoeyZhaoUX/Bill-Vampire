// Cloudflare Pages scheduled handler — fires via cron trigger in wrangler.toml.
// Sends the Sunday Vampire Report to every subscriber in EMAIL_LIST KV via Resend.

const FROM = 'Bill Vampire <sundays@billvampire.com>';
const APP_URL = 'https://billvampire.com';

async function* listEmails(kv) {
  let cursor;
  do {
    const page = await kv.list({ prefix: 'sub:', cursor });
    for (const key of page.keys) {
      const raw = await kv.get(key.name);
      if (!raw) continue;
      try {
        yield JSON.parse(raw);
      } catch {
        /* skip malformed */
      }
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
}

function buildDigest({ weeklyKills = 0, weeklySavingsUsd = 0, topKill = null, tenYearTotal = null }) {
  const topLine = topKill
    ? `Top kill this week: <strong>${topKill.name}</strong> at $${topKill.amount}/mo.`
    : 'No kills confirmed yet. Pick one this Sunday.';

  const subjectLine = weeklyKills > 0
    ? `${weeklyKills} vampire${weeklyKills === 1 ? '' : 's'} down this week — here\u2019s what you saved`
    : 'Your weekly vampire check-in';

  const html = `<!doctype html>
<html><body style="margin:0;background:#0B0B11;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#e2e8f0;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#fca5a5;margin:0 0 8px;">Sunday Vampire Report</p>
    <h1 style="font-size:26px;font-weight:800;color:#fff;margin:0 0 16px;line-height:1.2;">${subjectLine}</h1>
    <p style="font-size:14px;color:#cbd5e1;line-height:1.6;margin:0 0 20px;">
      This week, Bill Vampire users cancelled <strong style="color:#fb7185;">$${Math.round(weeklySavingsUsd).toLocaleString()}</strong> in recurring charges across <strong>${weeklyKills}</strong> kill${weeklyKills === 1 ? '' : 's'}. ${topLine}
    </p>
    ${tenYearTotal ? `<p style="font-size:13px;color:#94a3b8;margin:0 0 20px;">10-year waste tracked so far: <strong style="color:#fca5a5;">$${Math.round(tenYearTotal).toLocaleString()}</strong>.</p>` : ''}
    <div style="background:#141420;border:1px solid rgba(251,113,133,.25);border-radius:16px;padding:18px;margin:20px 0;">
      <p style="font-size:13px;color:#e2e8f0;margin:0 0 12px;">Missed one? Drop another bill and get a fresh verdict.</p>
      <a href="${APP_URL}/app" style="display:inline-block;padding:10px 18px;background:linear-gradient(90deg,#f43f5e,#f59e0b);color:#fff;font-size:12px;font-weight:700;border-radius:10px;text-decoration:none;">Re-run my verdict \u2192</a>
    </div>
    <p style="font-size:11px;color:#64748b;margin:24px 0 0;line-height:1.5;">
      You\u2019re subscribed to the weekly digest. <a href="${APP_URL}/api/email-subscribe?email=__EMAIL__" style="color:#94a3b8;">Unsubscribe</a>.
    </p>
  </div>
</body></html>`;

  return { subject: subjectLine, html };
}

async function fetchStats(env) {
  try {
    const url = env.STATS_URL || `${APP_URL}/api/stats`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return {};
    const d = await r.json();
    return {
      tenYearTotal: Number.isFinite(d?.total) ? d.total : null,
      weeklyKills: Number.isFinite(d?.weeklyKills) ? d.weeklyKills : 0,
      weeklySavingsUsd: Number.isFinite(d?.weeklySavingsUsd) ? d.weeklySavingsUsd : 0,
      topKill: d?.topKill || null,
    };
  } catch {
    return {};
  }
}

async function sendEmail(env, to, subject, html) {
  const payload = { from: FROM, to, subject, html };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export async function scheduled(event, env) {
  if (!env.EMAIL_LIST || !env.RESEND_API_KEY) {
    console.error('weekly-digest: missing EMAIL_LIST or RESEND_API_KEY');
    return;
  }

  const stats = await fetchStats(env);
  const { subject, html: baseHtml } = buildDigest(stats);

  let sent = 0;
  let failed = 0;
  for await (const record of listEmails(env.EMAIL_LIST)) {
    const html = baseHtml.replace('__EMAIL__', encodeURIComponent(record.email));
    const ok = await sendEmail(env, record.email, subject, html);
    if (ok) sent++; else failed++;
  }
  console.log(`weekly-digest: sent=${sent} failed=${failed}`);
}

export default { scheduled };
