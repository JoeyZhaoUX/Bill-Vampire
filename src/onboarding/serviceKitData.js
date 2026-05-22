export const SERVICE_KIT_DATA = [
  {
    match: ['adobe', 'creative cloud'],
    name: 'Adobe Creative Cloud',
    refundWindow: '14-day refund window after purchase or annual renewal; early termination fees may apply after that.',
    cancelPath: 'Go to account.adobe.com/plans, choose Manage plan, then Cancel your plan.',
    supportHint: 'Ask support to confirm whether the 14-day renewal window or fee-waiver discretion applies.',
    refundAsk: 'Please review this as a recent renewal/cancellation request and confirm whether the 14-day refund window or a fee waiver applies.',
    evidence: ['Plan page showing annual/monthly commitment', 'Renewal or charge receipt', 'Screenshot of any early termination fee screen'],
  },
  {
    match: ['canva'],
    name: 'Canva Pro',
    refundWindow: 'Annual plan renewals may be refundable within 14 days; monthly refunds are less likely.',
    cancelPath: 'Open Canva settings, go to Billing & plans, then cancel or manage the Pro plan.',
    supportHint: 'Mention the renewal date, amount, and whether this was a forgotten trial or annual renewal.',
    refundAsk: 'Please consider this a courtesy refund request for a recent renewal I did not intend to keep.',
    evidence: ['Canva billing page', 'Renewal email or receipt', 'Screenshot showing the plan is now cancelled'],
  },
  {
    match: ['grammarly'],
    name: 'Grammarly',
    refundWindow: 'Grammarly commonly points users to a short money-back window for new purchases; renewals are handled case by case.',
    cancelPath: 'Open account.grammarly.com/subscription and choose Cancel Subscription or Cancel renewal.',
    supportHint: 'Ask for a one-time courtesy refund if the annual renewal was recent.',
    refundAsk: 'This was a recent renewal I did not intend to continue. Please review it for a one-time courtesy refund.',
    evidence: ['Subscription page', 'Annual renewal receipt', 'Support ticket or chat transcript'],
  },
  {
    match: ['nordvpn', 'nord vpn'],
    name: 'NordVPN',
    refundWindow: '30-day money-back guarantee for eligible purchases.',
    cancelPath: 'Open my.nordaccount.com, manage NordVPN services, and turn off auto-renewal or contact live chat for refund.',
    supportHint: 'If inside 30 days, be direct: ask to cancel and request a refund under the money-back guarantee.',
    refundAsk: 'I would like to cancel my subscription and request a refund under the 30-day money-back guarantee.',
    evidence: ['Purchase date showing you are within 30 days', 'Auto-renewal status', 'Live chat transcript'],
  },
  {
    match: ['chatgpt', 'openai'],
    name: 'ChatGPT Plus',
    refundWindow: 'Refunds are not automatic; recent accidental renewals are typically handled by support case by case.',
    cancelPath: 'Open ChatGPT settings, go to Subscription or Billing, then manage/cancel the plan.',
    supportHint: 'Keep the request short and include charge date, amount, and account email.',
    refundAsk: 'I did not intend to continue this subscription and am requesting a one-time courtesy refund for the recent charge.',
    evidence: ['OpenAI receipt', 'Subscription management page', 'Support conversation reference'],
  },
  {
    match: ['amazon prime', 'prime video'],
    name: 'Amazon Prime',
    refundWindow: 'Amazon may show a full or partial refund option if Prime benefits were unused since renewal.',
    cancelPath: 'Open amazon.com/mc/pipelines/cancelPrime and follow the End Membership flow.',
    supportHint: 'If eligible, choose End Now to preview the refund before confirming.',
    refundAsk: 'Please confirm whether my recent Prime charge is eligible for a full or partial refund based on usage.',
    evidence: ['Prime membership page', 'Recent charge receipt', 'Refund amount screen if shown'],
  },
  {
    match: ['netflix'],
    name: 'Netflix',
    refundWindow: 'Netflix usually does not prorate refunds; the main win is stopping the next renewal and saving confirmation.',
    cancelPath: 'Open netflix.com/cancelplan and finish cancellation.',
    supportHint: 'Focus on cancellation confirmation and documenting the final access date.',
    refundAsk: 'If this charge was accidental or incorrect, please review whether a courtesy credit or refund is available.',
    evidence: ['Cancel membership confirmation', 'Current billing period', 'Any support response about refund eligibility'],
  },
  {
    match: ['spotify'],
    name: 'Spotify Premium',
    refundWindow: 'Refund eligibility is limited and depends on billing platform; stopping renewal is usually the primary action.',
    cancelPath: 'Open spotify.com/account/subscription and cancel Premium.',
    supportHint: 'If billed through Apple/Google, request refund through that platform.',
    refundAsk: 'Please confirm cancellation and whether this recent charge can be reviewed for refund eligibility.',
    evidence: ['Spotify account plan page', 'Receipt and billing platform', 'Cancellation confirmation'],
  },
];

export function findServiceKitData(serviceName = '') {
  const normalized = String(serviceName).toLowerCase();
  return SERVICE_KIT_DATA.find(item => item.match.some(alias => normalized.includes(alias))) || null;
}
