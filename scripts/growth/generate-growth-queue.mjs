import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SERVICES } from '../seo/services.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '../..')
const seedPath = join(rootDir, 'content/growth/opportunities.seed.json')
const seoBacklogPath = join(rootDir, 'content/growth/seo-page-backlog.json')
const outcomesPath = join(rootDir, 'content/growth/outcomes.json')
const outputDir = join(rootDir, 'content/growth/queue')
const baseUrl = process.env.GROWTH_BASE_URL || 'https://billvampire.com'

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, value = 'true'] = arg.replace(/^--/, '').split('=')
      return [key, value]
    }),
)

const runDate = args.get('date') || new Date().toISOString().slice(0, 10)
const opportunities = JSON.parse(readFileSync(seedPath, 'utf8'))
const seoBacklog = JSON.parse(readFileSync(seoBacklogPath, 'utf8'))
const outcomes = JSON.parse(readFileSync(outcomesPath, 'utf8'))
const outcomesById = new Map((outcomes.items || []).map((item) => [item.id, item]))

const SURVIVAL_THEME_PATHS = {
  survival_ai_layoffs: '/survival/ai-layoffs/',
  survival_consumer_downgrade: '/survival/consumer-downgrade/',
  survival_subscription_hell: '/survival/subscription-hell/',
  survival_doom_spending: '/survival/doom-spending/',
  survival_financial_anxiety: '/survival/financial-anxiety/',
}

const serviceLookup = new Map(
  SERVICES.flatMap((service) => [
    [normalize(service.name), service],
    [normalize(service.id), service],
    [normalize(service.slug), service],
  ]),
)

function normalize(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function slugify(value = '') {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isoWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`)
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}w${String(week).padStart(2, '0')}`
}

function serviceFor(opportunity) {
  return serviceLookup.get(normalize(opportunity.service))
}

function survivalPathFor(opportunity) {
  if (SURVIVAL_THEME_PATHS[opportunity.issueType]) return SURVIVAL_THEME_PATHS[opportunity.issueType]

  const text = normalize([
    opportunity.topic,
    opportunity.service,
    opportunity.issueType,
    opportunity.pain,
    opportunity.replyAngle,
  ].filter(Boolean).join(' '))

  if (text.includes('layoff') || text.includes('job loss')) return '/survival/ai-layoffs/'
  if (text.includes('downgrade') || text.includes('recession')) return '/survival/consumer-downgrade/'
  if (text.includes('subscription hell') || text.includes('everything a subscription') || text.includes('dark pattern')) return '/survival/subscription-hell/'
  if (text.includes('doom spending') || text.includes('impulse')) return '/survival/doom-spending/'
  if (text.includes('financial anxiety') || text.includes('money anxiety')) return '/survival/financial-anxiety/'

  return ''
}

function landingPath(opportunity) {
  const survivalPath = survivalPathFor(opportunity)
  if (survivalPath) return survivalPath

  const service = serviceFor(opportunity)

  if (service?.slug && !['Bill Vampire'].includes(opportunity.service)) {
    return `/cancel/${service.slug}.html`
  }

  if (['trial_refund', 'surprise_charge', 'refund_denied'].includes(opportunity.issueType)) {
    return '/tools/free-trial-refund-helper.html'
  }

  if (opportunity.issueType === 'hard_cancel') {
    return '/tools/cancel-subscription-script-generator.html'
  }

  if (opportunity.issueType === 'directory_submission') {
    return '/'
  }

  return '/tools/rocket-money-alternative-no-bank-login.html'
}

function sourceFor(platform) {
  const normalized = platform.toLowerCase()
  if (normalized === 'indiehackers') return 'indiehackers'
  if (normalized === 'directory') return 'directory'
  return normalized
}

function mediumFor(opportunity) {
  if (opportunity.recommendedMedium) return opportunity.recommendedMedium
  if (opportunity.platform === 'quora') return 'answer'
  if (opportunity.platform === 'directory') return 'directory'
  return 'comment'
}

function utmUrl(opportunity) {
  const landing = new URL(landingPath(opportunity), baseUrl)
  const content = slugify(`${opportunity.service}-${opportunity.issueType}`)
  landing.searchParams.set('utm_source', sourceFor(opportunity.platform))
  landing.searchParams.set('utm_medium', mediumFor(opportunity))
  landing.searchParams.set('utm_campaign', `organic_growth_${isoWeek(runDate)}`)
  landing.searchParams.set('utm_content', content)
  if (!survivalPathFor(opportunity)) landing.searchParams.set('service', opportunity.service)
  landing.searchParams.set('issue', opportunity.issueType)
  if (opportunity.amount) landing.searchParams.set('amount', opportunity.amount)
  return landing.toString()
}

function noLinkDraft(opportunity) {
  const service = opportunity.service
  const amount = opportunity.amount ? ` around ${opportunity.amount}` : ''

  if (opportunity.platform === 'reddit' && opportunity.community === 'r/ADHD') {
    return [
      `That kind of forgotten renewal is painfully common, especially with annual plans${amount}.`,
      `I would keep the next move very small: cancel first, screenshot the cancellation confirmation, then send support a short refund note with the charge date, amount, account email, and a clear sentence saying you did not intend to continue after the trial/renewal.`,
      `If support refuses, keep the reply thread, receipt, cancellation proof, and terms screenshot together before you consider escalating through the card issuer. Not legal or financial advice, just the cleanest evidence trail.`,
    ].join('\n\n')
  }

  if (opportunity.issueType === 'hard_cancel') {
    return [
      `For ${service}, I would avoid arguing in the first message and make it very specific: state the plan, charge amount${amount}, cancellation attempt date, and the outcome you want.`,
      `A useful line is: "I am requesting cancellation without additional renewal charges, and if a fee applies, please point me to the exact term I agreed to and the date it was shown."`,
      `Save screenshots of the account page, the cancellation flow, chat transcript, and every email. If you later dispute the charge, that evidence matters more than a long complaint.`,
    ].join('\n\n')
  }

  if (['trial_refund', 'surprise_charge', 'refund_denied'].includes(opportunity.issueType)) {
    return [
      `For a ${service} charge${amount}, I would move in this order: cancel the renewal, capture proof of cancellation, then ask support for a goodwill refund with the charge date and account email.`,
      `Keep the message short: "I intended to cancel before renewal, have now cancelled, and I am requesting a refund for the most recent charge because I will not use the service going forward."`,
      `If they say no, ask for the refund policy section they are relying on, then decide whether the evidence is strong enough to escalate with your card issuer. This is consumer communication help, not legal or financial advice.`,
    ].join('\n\n')
  }

  if (opportunity.platform === 'hn') {
    return [
      `The interesting product angle is privacy: users often want help with subscription messes without handing over bank credentials.`,
      `A good Show HN story should show the local-first preview, explain what data is stored, and be honest about what is automated versus template-based.`,
      `I would lead with the technical tradeoff and the conversion experiment instead of marketing copy.`,
    ].join('\n\n')
  }

  return [
    `The strongest angle here is not "AI finance"; it is solving one annoying subscription problem in under a few minutes.`,
    `Give people a concrete case file: amount, service, cancellation path, refund wording, proof checklist, and reminder.`,
    `Then measure whether they actually click checkout or only say it sounds useful.`,
  ].join('\n\n')
}

function transparentDraft(opportunity) {
  const url = utmUrl(opportunity)
  const disclosure =
    opportunity.platform === 'indiehackers' || opportunity.platform === 'hn'
      ? 'I am building this and would genuinely value blunt feedback.'
      : 'Disclosure: I am building a small tool around this problem, so ignore this if links are not welcome.'

  return [
    noLinkDraft(opportunity),
    `${disclosure} I made a no-bank-login case preview for this kind of ${opportunity.service} issue here: ${url}`,
  ].join('\n\n')
}

function recommendedAction(opportunity) {
  if (opportunity.platform === 'reddit' && opportunity.recommendedMedium === 'comment') {
    return 'Use the no-link draft first. Share the link only after someone asks for it.'
  }
  if (opportunity.platform === 'quora') {
    return 'Publish as a complete answer. Keep one disclosed link at the end.'
  }
  if (opportunity.platform === 'directory') {
    return 'Submit manually with a unique description and this UTM link.'
  }
  if (opportunity.platform === 'hn') {
    return 'Hold until the product flow is stable enough for a one-time Show HN.'
  }
  return 'Post only after checking community rules and editing the draft in your own voice.'
}

const queue = opportunities
  .map((opportunity, index) => {
    const outcome = outcomesById.get(opportunity.id) || {}

    return {
      ...opportunity,
      status: outcome.status || 'needs_review',
      priority: index + 1,
      landingPath: landingPath(opportunity),
      utmUrl: utmUrl(opportunity),
      recommendedAction: recommendedAction(opportunity),
      postedUrl: outcome.postedUrl || '',
      postedAt: outcome.postedAt || '',
      resultNotes: outcome.notes || '',
      metrics: {
        visits: Number(outcome.visits || 0),
        previewStarts: Number(outcome.previewStarts || 0),
        downloads: Number(outcome.downloads || 0),
        accountSaves: Number(outcome.accountSaves || 0),
        checkoutClicks: Number(outcome.checkoutClicks || 0),
        paid: Number(outcome.paid || 0),
      },
      drafts: {
        noLink: noLinkDraft(opportunity),
        transparentWithLink: transparentDraft(opportunity),
      },
    }
  })
  .filter((item) => !args.get('platform') || item.platform === args.get('platform'))
  .filter((item) => !args.get('status') || item.status === args.get('status'))

function renderMarkdown(items) {
  const rows = items
    .map(
      (item) =>
        `| ${item.priority} | ${item.platform} | ${item.community} | ${item.service} | ${item.issueType} | ${item.recommendedMedium} | ${item.status} |`,
    )
    .join('\n')

  const metrics = summarizeMetrics(items)
  const sections = items
    .map(
      (item) => `## ${item.priority}. ${item.topic}

- Platform: ${item.platform} / ${item.community}
- Source type: ${item.sourceType}${item.sourceUrl ? ` / ${item.sourceUrl}` : ''}
- Service: ${item.service}
- Issue: ${item.issueType}
- Pain: ${item.pain}
- Reply angle: ${item.replyAngle}
- Link rule: ${item.linkPolicy}
- Recommended action: ${item.recommendedAction}
- Landing page: ${item.landingPath}
- UTM URL: ${item.utmUrl}
- Status: ${item.status}
- Posted URL: ${item.postedUrl || 'not posted'}
- Posted at: ${item.postedAt || 'not posted'}
- Metrics: ${item.metrics.visits} visits, ${item.metrics.previewStarts} previews, ${item.metrics.downloads} downloads, ${item.metrics.accountSaves} saves, ${item.metrics.checkoutClicks} checkout clicks, ${item.metrics.paid} paid
- Result notes: ${item.resultNotes || 'none yet'}

### No-link helpful draft

${item.drafts.noLink}

### Transparent draft with link

${item.drafts.transparentWithLink}

### Human review checklist

- Read the community/platform rules.
- Edit the draft so it sounds like your own experience.
- Prefer the no-link draft unless the thread invites links.
- Record the final URL and outcome after posting.
`,
    )
    .join('\n')

  const seoRows = seoBacklog
    .map(
      (page, index) =>
        `| ${index + 1} | ${page.title} | ${page.service} | ${page.issueType} | ${page.primaryKeyword} | ${page.status || 'backlog'} | ${page.url || 'not shipped'} | ${page.requiredSections.join(', ')} |`,
    )
    .join('\n')

  return `# Bill Vampire Growth Queue - ${runDate}

This queue is for human-reviewed acquisition only. It does not post automatically, does not use small accounts, and does not call an AI API. Use it to choose a few high-intent replies, then publish manually after checking platform rules.

Active filters: platform=${args.get('platform') || 'all'}, status=${args.get('status') || 'all'}.

## Outcome Summary

- Opportunities in this view: ${items.length}
- Total visits recorded: ${metrics.visits}
- Case preview starts: ${metrics.previewStarts}
- Preview downloads: ${metrics.downloads}
- Account saves: ${metrics.accountSaves}
- Checkout clicks: ${metrics.checkoutClicks}
- Paid conversions: ${metrics.paid}

| Priority | Platform | Community | Service | Issue | Medium | Status |
| --- | --- | --- | --- | --- | --- | --- |
${rows}

${sections}

# SEO Page Backlog

Use these only when you can add service-specific facts and a case-preview form. Do not publish pages that are just generic template swaps.

| Priority | Page | Service | Issue | Primary keyword | Status | URL | Required sections |
| --- | --- | --- | --- | --- | --- | --- | --- |
${seoRows}
`
}

function summarizeMetrics(items) {
  return items.reduce(
    (totals, item) => ({
      visits: totals.visits + item.metrics.visits,
      previewStarts: totals.previewStarts + item.metrics.previewStarts,
      downloads: totals.downloads + item.metrics.downloads,
      accountSaves: totals.accountSaves + item.metrics.accountSaves,
      checkoutClicks: totals.checkoutClicks + item.metrics.checkoutClicks,
      paid: totals.paid + item.metrics.paid,
    }),
    { visits: 0, previewStarts: 0, downloads: 0, accountSaves: 0, checkoutClicks: 0, paid: 0 },
  )
}

mkdirSync(outputDir, { recursive: true })
writeFileSync(join(outputDir, `${runDate}-growth-queue.md`), renderMarkdown(queue))
writeFileSync(
  join(outputDir, 'latest.json'),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      runDate,
      baseUrl,
      count: queue.length,
      queue,
      seoBacklog,
    },
    null,
    2,
  )}\n`,
)

console.log(`Generated ${queue.length} growth opportunities in content/growth/queue/`)
