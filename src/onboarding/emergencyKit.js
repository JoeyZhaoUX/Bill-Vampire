import { getCancelLink } from '../cancelLinks';

export const ISSUE_TYPES = [
  {
    id: 'surprise_charge',
    title: 'Surprise charge',
    short: 'I got charged',
    prompt: 'Paste the charge, receipt, bank line, or tell us what happened.',
    headline: 'Fight the charge while the details are fresh.',
  },
  {
    id: 'trial_ending',
    title: 'Trial ending soon',
    short: 'Trial ending',
    prompt: 'Paste the trial email, screenshot, or say when it renews.',
    headline: 'Cancel before the trial turns into a bill.',
  },
  {
    id: 'hard_cancel',
    title: 'Hard to cancel',
    short: 'Hard to cancel',
    prompt: 'Paste the service name, plan, or the cancellation roadblock.',
    headline: 'Get the exact cancel path and backup script.',
  },
];

export function getIssueType(id) {
  return ISSUE_TYPES.find(t => t.id === id) || ISSUE_TYPES[0];
}

export function inferIssueType(source = '') {
  if (source.includes('trial')) return 'trial_ending';
  if (source.includes('cancel')) return 'hard_cancel';
  if (source.includes('surprise') || source.includes('refund')) return 'surprise_charge';
  return 'surprise_charge';
}

function normalizeCurrency(currency) {
  return currency && /^[A-Z]{3}$/.test(currency) ? currency : 'USD';
}

function formatMoney(sub) {
  const amount = parseFloat(sub?.price);
  if (!Number.isFinite(amount) || amount <= 0) return 'the charge';
  const currency = normalizeCurrency(sub.currency);
  const prefix = currency === 'USD' ? '$' : `${currency} `;
  return `${prefix}${amount.toFixed(amount >= 100 ? 0 : 2)}`;
}

function formatRenewal(sub) {
  if (!sub?.nextChargeAt) return 'the next renewal date';
  try {
    return new Date(sub.nextChargeAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'the next renewal date';
  }
}

function pickPrimary(subscriptions) {
  if (!subscriptions?.length) {
    return {
      name: 'this subscription',
      price: '',
      currency: 'USD',
      cycle: 'monthly',
      category: 'Other',
    };
  }
  return [...subscriptions].sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0))[0];
}

export function generateEmergencyKit({ subscriptions = [], issueType = 'surprise_charge', rawText = '' } = {}) {
  const issue = getIssueType(issueType);
  const primary = pickPrimary(subscriptions);
  const service = primary.name || 'this subscription';
  const amount = formatMoney(primary);
  const renewalDate = formatRenewal(primary);
  const cancelUrl = getCancelLink(service);
  const alreadyCharged = issue.id === 'surprise_charge';
  const renewalCopy = renewalDate === 'the next renewal date' ? 'before the next renewal' : `before ${renewalDate}`;
  const context = rawText.trim().slice(0, 180);

  const previewSteps = [
    cancelUrl ? `Open the known cancellation page for ${service}.` : `Find the billing or subscription page for ${service}.`,
    alreadyCharged ? 'Ask for a refund quickly while the charge is recent.' : `Set a reminder and cancel ${renewalCopy}.`,
    'Save screenshots of the cancellation, emails, and any support replies.',
  ];

  const cancelScript = `Hi ${service} support,\n\nI want to cancel my ${service} subscription effective immediately and stop any future renewal charges. Please confirm in writing that my subscription has been cancelled, the final billing date, and that no further charges will be made.\n\nIf there are any steps I must complete, please send the direct cancellation link and instructions in this thread.\n\nThank you.`;

  const refundScript = `Hi ${service} support,\n\nI was charged ${amount} for ${service}${alreadyCharged ? ' and I am requesting a refund' : ' and want to prevent this upcoming renewal'}. I did not intend to continue this subscription and am asking you to cancel the plan and refund the recent charge if eligible.\n\nPlease confirm the cancellation, refund decision, refund amount, and timeline in writing. If you cannot refund it, please explain the exact policy section you are relying on.\n\nThank you.`;

  const chatScript = `I need help cancelling ${service} and ${alreadyCharged ? `requesting a refund for ${amount}` : `preventing the next ${amount} renewal`}. Please cancel the plan now, send written confirmation, and tell me whether I will receive a refund or credit.`;

  const chargebackChecklist = [
    `Screenshot showing the ${service} charge or upcoming renewal`,
    'Screenshot of cancellation attempt or missing cancellation path',
    'Copy of refund request or support chat transcript',
    'Cancellation confirmation, if the company provides one',
    'Timeline: signup date, charge date, cancellation/refund request date',
  ];

  const evidenceChecklist = [
    'Receipt or bank/credit-card line item',
    'Terms or renewal email showing billing timing',
    'Screenshots of account status and plan page',
    'Support ticket number or chat transcript',
  ];

  return {
    issue,
    primary,
    service,
    amount,
    renewalDate,
    cancelUrl,
    context,
    alreadyCharged,
    headline: issue.headline,
    riskLine: alreadyCharged
      ? `${service} already charged ${amount}. Move fast: cancel, request a refund, and preserve evidence.`
      : `${service} may renew for ${amount} ${renewalCopy}. Cancel or downgrade before it bites.`,
    previewSteps,
    cancelScript,
    refundScript,
    chatScript,
    chargebackChecklist,
    evidenceChecklist,
    reminderText: `Cancel ${service} ${renewalCopy}`,
    disclaimer: 'Consumer-assistance templates only. This is not legal, financial, or banking advice.',
  };
}
