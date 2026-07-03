import { getCancelLink } from '../cancelLinks';
import { findServiceKitData } from './serviceKitData';

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

function formatPathLabel(path) {
  if (!path) return 'the best available channel';
  return String(path).replace(/_/g, ' ');
}

function buildEscalationLetter({ serviceLabel, amount, alreadyCharged, refundWindow, renewalCopy }) {
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `Hi ${serviceLabel} team,\n\nI am escalating this because my initial request on ${today} did not resolve the issue. I was charged ${amount} for ${serviceLabel}${alreadyCharged ? ' and requested a refund' : ` ahead of the renewal ${renewalCopy}`}, and I have not received a resolution.\n\nPlease escalate this to a supervisor or account specialist who can make a final decision. ${refundWindow}\n\nI am asking for one of the following within 5 business days: a full refund, a documented policy exception, or a written explanation citing the exact policy clause that applies to my case. If this cannot be resolved at this level, please tell me how to reach the next tier of support.\n\nThank you for escalating this promptly.`;
}

export function applyRefundIntelligence(kit, intelligence) {
  if (!kit || !intelligence) return kit;
  const { sample_count: sampleCount, is_seed_estimate: isSeedEstimate, success_rate: successRate, best_path: bestPath, avg_days_to_refund: avgDays } = intelligence;
  if (isSeedEstimate || !Number.isFinite(sampleCount) || sampleCount < 10) return kit;
  if (!Number.isFinite(successRate)) return kit;
  const pct = Math.round(successRate * 100);
  const pathLabel = formatPathLabel(bestPath);
  const daysLine = Number.isFinite(avgDays) ? `, averaging ${avgDays} day${avgDays === 1 ? '' : 's'}` : '';
  return {
    ...kit,
    refundWindow: `Based on ${sampleCount} similar cases, refunds succeeded ${pct}% of the time via ${pathLabel}${daysLine}.`,
  };
}

export function generateEmergencyKit({ subscriptions = [], issueType = 'surprise_charge', rawText = '', intelligence } = {}) {
  const issue = getIssueType(issueType);
  const primary = pickPrimary(subscriptions);
  const service = primary.name || 'this subscription';
  const serviceData = findServiceKitData(service);
  const serviceLabel = serviceData?.name || service;
  const amount = formatMoney(primary);
  const renewalDate = formatRenewal(primary);
  const cancelUrl = getCancelLink(service);
  const alreadyCharged = issue.id === 'surprise_charge';
  const renewalCopy = renewalDate === 'the next renewal date' ? 'before the next renewal' : `before ${renewalDate}`;
  const context = rawText.trim().slice(0, 180);

  const previewSteps = [
    serviceData?.cancelPath || (cancelUrl ? `Open the known cancellation page for ${serviceLabel}.` : `Find the billing or subscription page for ${serviceLabel}.`),
    alreadyCharged ? (serviceData?.refundAsk || 'Ask for a refund quickly while the charge is recent.') : `Set a reminder and cancel ${renewalCopy}.`,
    'Save screenshots of the cancellation, emails, and any support replies.',
  ];

  const cancelScript = `Hi ${serviceLabel} support,\n\nI want to cancel my ${serviceLabel} subscription effective immediately and stop any future renewal charges. Please confirm in writing that my subscription has been cancelled, the final billing date, and that no further charges will be made.\n\n${serviceData?.supportHint ? `${serviceData.supportHint}\n\n` : ''}If there are any steps I must complete, please send the direct cancellation link and instructions in this thread.\n\nThank you.`;

  const refundScript = `Hi ${serviceLabel} support,\n\nI was charged ${amount} for ${serviceLabel}${alreadyCharged ? ' and I am requesting a refund' : ' and want to prevent this upcoming renewal'}. I did not intend to continue this subscription and am asking you to cancel the plan and refund the recent charge if eligible.\n\n${serviceData?.refundAsk ? `${serviceData.refundAsk}\n\n` : ''}Please confirm the cancellation, refund decision, refund amount, and timeline in writing. If you cannot refund it, please explain the exact policy section you are relying on.\n\nThank you.`;

  const chatScript = `I need help cancelling ${serviceLabel} and ${alreadyCharged ? `requesting a refund for ${amount}` : `preventing the next ${amount} renewal`}. Please cancel the plan now, send written confirmation, and tell me whether I will receive a refund or credit.${serviceData?.supportHint ? ` ${serviceData.supportHint}` : ''}`;

  const chargebackChecklist = [
    `Screenshot showing the ${serviceLabel} charge or upcoming renewal`,
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
    ...(serviceData?.evidence || []),
  ];

  const refundWindow = serviceData?.refundWindow || 'Refund eligibility depends on timing, billing platform, and the service policy.';

  const escalationLetter = buildEscalationLetter({ serviceLabel, amount, alreadyCharged, refundWindow, renewalCopy });

  const chargebackIntro = `If ${serviceLabel} still will not refund ${amount}, you can dispute the charge with your bank or card issuer. Gather the checklist below before you call — the timeline and evidence matter more than the story.`;

  const ladder = [
    {
      stepIndex: 0,
      title: 'Refund email',
      channel: 'email',
      body: refundScript,
      unlockLabel: 'Available now',
    },
    {
      stepIndex: 1,
      title: 'Support chat script',
      channel: 'chat',
      body: chatScript,
      unlockLabel: 'Use if email gets no reply in 2-3 days',
    },
    {
      stepIndex: 2,
      title: 'Escalation letter',
      channel: 'email_escalation',
      body: escalationLetter,
      unlockLabel: 'Unlocks after the first request stalls',
    },
    {
      stepIndex: 3,
      title: 'Chargeback packet',
      channel: 'chargeback',
      body: chargebackIntro,
      checklist: chargebackChecklist,
      evidence: evidenceChecklist,
      unlockLabel: 'Last resort if the merchant refuses to refund',
    },
  ];

  const kit = {
    issue,
    primary,
    service: serviceLabel,
    amount,
    renewalDate,
    cancelUrl,
    serviceData,
    refundWindow,
    cancelPath: serviceData?.cancelPath || (cancelUrl ? `Open the known ${serviceLabel} cancellation page.` : `Open ${serviceLabel} billing or account settings.`),
    supportHint: serviceData?.supportHint || 'Keep the request short, specific, and tied to the charge date and amount.',
    context,
    alreadyCharged,
    headline: issue.headline,
    riskLine: alreadyCharged
      ? `${serviceLabel} already charged ${amount}. Move fast: cancel, request a refund, and preserve evidence.`
      : `${serviceLabel} may renew for ${amount} ${renewalCopy}. Cancel or downgrade before it bites.`,
    previewSteps,
    cancelScript,
    refundScript,
    chatScript,
    chargebackChecklist,
    evidenceChecklist,
    reminderText: `Cancel ${serviceLabel} ${renewalCopy}`,
    disclaimer: 'Consumer-assistance templates only. This is not legal, financial, or banking advice.',
    ladder,
  };

  return intelligence ? applyRefundIntelligence(kit, intelligence) : kit;
}
