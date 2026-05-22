const BRAND = {
  black: '#0D0B0E',
  panel: '#171217',
  panelSoft: '#211820',
  ivory: '#F7EFE6',
  muted: '#B9AAA0',
  faint: '#7D7068',
  gold: '#C9A46A',
  wine: '#8E1D2C',
  wineBright: '#A82439',
  border: '#3A2D31',
  green: '#88C7A2',
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function reasonCopy(reason = 'save_case_file') {
  const cleanReason = String(reason || 'save_case_file');
  if (cleanReason === 'post_purchase_recovery') {
    return {
      eyebrow: 'Purchase recovery',
      headline: 'Keep your Emergency Kit safe.',
      intro: 'Sign in with the same email you used at checkout so your paid kit, scripts, reminders, and case file can be restored after cache clears or when you switch devices.',
      cta: 'Save my purchase',
      note: 'If you did not request this, you can ignore this email. No bank login is required.',
    };
  }
  if (cleanReason.includes('commit')) {
    return {
      eyebrow: 'Case file vault',
      headline: 'Save the subscriptions you are ready to cancel.',
      intro: 'Open this secure link to save your cancellation list, reminders, and case file across devices.',
      cta: 'Save my case file',
      note: 'If you did not request this, you can ignore this email. No bank login is required.',
    };
  }
  return {
    eyebrow: 'Secure sign-in',
    headline: 'Your Bill Vampire case file is waiting.',
    intro: 'Open this secure link to sign in and sync your subscriptions, reminders, Emergency Kits, and purchase access across devices.',
    cta: 'Sign in to Bill Vampire',
    note: 'If you did not request this, you can ignore this email. No bank login is required.',
  };
}

export function buildMagicLinkEmail({ magicLink, reason, email }) {
  const copy = reasonCopy(reason);
  const safeLink = escapeHtml(magicLink);
  const safeEmail = escapeHtml(email);
  const preview = 'Secure link expires in 15 minutes. No bank login required.';

  const subject = reason === 'post_purchase_recovery'
    ? 'Save your Bill Vampire purchase'
    : 'Your Bill Vampire sign-in link';

  const text = [
    copy.headline,
    '',
    copy.intro,
    '',
    `Open your secure link: ${magicLink}`,
    '',
    'This link expires in 15 minutes and can only be used once.',
    'Bill Vampire never asks for your bank login.',
    '',
    copy.note,
    '',
    `Sent to ${email}`,
    'Bill Vampire',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.black};color:${BRAND.ivory};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.black};min-width:100%;">
      <tr>
        <td align="center" style="padding:32px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;border-collapse:separate;">
            <tr>
              <td style="padding:0 0 18px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="https://billvampire.com/icons/icon.png" alt="Bill Vampire" width="42" height="42" style="display:inline-block;width:42px;height:42px;border-radius:14px;border:1px solid rgba(201,164,106,0.35);vertical-align:middle;">
                      <span style="display:inline-block;margin-left:12px;color:${BRAND.ivory};font-size:18px;font-weight:800;vertical-align:middle;letter-spacing:-0.02em;">Bill Vampire</span>
                    </td>
                    <td align="right" style="vertical-align:middle;color:${BRAND.gold};font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.16em;">
                      No bank login
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="border:1px solid ${BRAND.border};border-radius:28px;background:linear-gradient(150deg,${BRAND.panel} 0%,${BRAND.black} 58%,#150E12 100%);overflow:hidden;box-shadow:0 26px 80px rgba(0,0,0,0.36);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:34px 30px 26px;border-bottom:1px solid ${BRAND.border};">
                      <div style="display:inline-block;margin-bottom:18px;padding:8px 12px;border-radius:999px;background:rgba(201,164,106,0.10);border:1px solid rgba(201,164,106,0.30);color:${BRAND.gold};font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.16em;">
                        ${escapeHtml(copy.eyebrow)}
                      </div>
                      <h1 style="margin:0 0 14px;color:${BRAND.ivory};font-size:32px;line-height:1.08;font-weight:900;letter-spacing:-0.04em;">
                        ${escapeHtml(copy.headline)}
                      </h1>
                      <p style="margin:0;color:${BRAND.muted};font-size:15px;line-height:1.7;">
                        ${escapeHtml(copy.intro)}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:26px 30px 8px;">
                      <a href="${safeLink}" style="display:block;background:${BRAND.wine};background-image:linear-gradient(90deg,${BRAND.wine},${BRAND.wineBright});color:${BRAND.ivory};text-decoration:none;border-radius:16px;padding:16px 20px;text-align:center;font-size:15px;font-weight:900;box-shadow:0 12px 34px rgba(142,29,44,0.28);">
                        ${escapeHtml(copy.cta)}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 30px 4px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${BRAND.border};border-radius:18px;background:${BRAND.panelSoft};">
                        <tr>
                          <td style="padding:18px 18px;">
                            <p style="margin:0 0 8px;color:${BRAND.green};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;">What this unlocks</p>
                            <p style="margin:0;color:${BRAND.muted};font-size:13px;line-height:1.65;">Saved subscriptions, reminder state, Emergency Kit scripts, purchase recovery, and case files you choose to sync.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 30px 30px;">
                      <p style="margin:0 0 10px;color:${BRAND.faint};font-size:12px;line-height:1.6;">
                        This secure link expires in <strong style="color:${BRAND.ivory};">15 minutes</strong> and can only be used once.
                      </p>
                      <p style="margin:0;color:${BRAND.faint};font-size:12px;line-height:1.6;">
                        Button not working? Copy this link into your browser:<br>
                        <a href="${safeLink}" style="color:${BRAND.gold};word-break:break-all;text-decoration:underline;">${safeLink}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 8px 0;text-align:center;color:${BRAND.faint};font-size:11px;line-height:1.6;">
                <p style="margin:0 0 6px;">${escapeHtml(copy.note)}</p>
                <p style="margin:0;">Sent to ${safeEmail} by Bill Vampire.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
