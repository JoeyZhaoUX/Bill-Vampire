import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { absoluteUrl } from '../url-policy.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../../..')
const REFUND_INTELLIGENCE_PATH = join(ROOT, 'content/refund/intelligence.seed.json')

// Suffix words like "Pro"/"Plus"/"Super" get stripped so "Canva Pro" (this
// guide's service) can loosely match "Canva Pro" (refund-stats seed entry)
// or "Duolingo Super" against "Duolingo Plus" — same brand, no exact string.
const SERVICE_SUFFIX_STOPWORDS = new Set(['pro', 'plus', 'premium', 'super', 'max'])

function coreServiceKey(name = '') {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word && !SERVICE_SUFFIX_STOPWORDS.has(word))
    .join(' ')
    .trim()
}

function refundStatsSlugFor(entry) {
  const slugify = (value) =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  return `${slugify(entry.service)}-${slugify(entry.charge_type)}-success-rate`
}

let cachedRefundIntelligence = null
function findMatchingRefundStatsEntry(guide) {
  if (cachedRefundIntelligence === null) {
    try {
      cachedRefundIntelligence = JSON.parse(readFileSync(REFUND_INTELLIGENCE_PATH, 'utf-8'))
    } catch {
      cachedRefundIntelligence = []
    }
  }
  const key = coreServiceKey(guide.service)
  if (!key) return null
  return cachedRefundIntelligence.find((entry) => coreServiceKey(entry.service) === key) || null
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeJsString(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function getRelatedGuides(guide, guides) {
  const sameIssue = guides.filter((item) => item.slug !== guide.slug && item.issueType === guide.issueType)
  const differentIssue = guides.filter((item) => item.slug !== guide.slug && item.issueType !== guide.issueType)
  return [...sameIssue, ...differentIssue].slice(0, 4)
}

function ctaLabelFor(guide) {
  if (guide.issueType === 'hard_cancel') return `Build my ${guide.service} cancel script`
  if (guide.issueType === 'refund_denied') return `Build my ${guide.service} escalation plan`
  if (guide.issueType === 'trial_refund') return `Build my ${guide.service} refund request`
  return `Build my ${guide.service} refund request`
}

function appIssueTypeFor(guide) {
  if (guide.issueType === 'hard_cancel') return 'hard_cancel'
  if (guide.issueType === 'trial_ending') return 'trial_ending'
  return 'surprise_charge'
}

function faqFor(guide) {
  return [
    {
      q: `Can I get a refund from ${guide.service}?`,
      a: guide.refundWindow,
    },
    {
      q: `How do I cancel ${guide.service}?`,
      a: guide.cancelPath,
    },
    {
      q: `What proof should I keep for ${guide.service}?`,
      a: `Keep ${guide.evidence.slice(0, 4).join(', ').toLowerCase()}, and any support replies before escalating.`,
    },
  ]
}

// Per-service scripts keyed by serviceId. Each is a "consumer communication
// template", not legal advice. Falls back to a master template by issueType.
const SERVICE_SCRIPTS = {
  'adobe-creative-cloud': [
    'Hi Adobe,',
    '',
    'I want to cancel my Creative Cloud plan on the account under [email], and I’m seeing an early-termination fee. I’d like to request that the fee be waived — I was not clearly aware this annual commitment carried a cancellation fee at the point of [signup/plan change].',
    '',
    'Please confirm the cancellation and review the fee. I’m happy to discuss switching plans if that resolves it.',
    '',
    'Thank you.',
  ],
  grammarly: [
    'Hi Grammarly,',
    '',
    'My Premium subscription under [email] renewed on [date] for [amount]. I did not intend to renew and have not used Premium since the charge.',
    '',
    'Please cancel future renewals and refund this charge. I can provide the receipt.',
    '',
    'Thank you.',
  ],
  nordvpn: [
    'Hi NordVPN Support,',
    '',
    'I’m requesting a refund for the [amount] charge on [date] on the account under [email], under your 30-day money-back guarantee.',
    '',
    'Please cancel auto-renewal and process the refund to my original payment method.',
    '',
    'Thank you.',
  ],
  expressvpn: [
    'Hi ExpressVPN Support,',
    '',
    'I’m requesting a refund for the [amount] charge on [date] on the account under [email], under your 30-day money-back guarantee.',
    '',
    'Please cancel auto-renewal and process the refund to my original payment method.',
    '',
    'Thank you.',
  ],
  canva: [
    'Hi Canva,',
    '',
    'My Pro trial converted to a paid subscription on [date] ([amount]) under [email]. I forgot to cancel before it converted and have not used Pro features since.',
    '',
    'Could you cancel Pro and refund this charge? I appreciate your help.',
    '',
    'Thank you.',
  ],
  'amazon-prime': [
    'Hi Amazon,',
    '',
    'My Prime membership under [email] renewed on [date] for [amount] and I did not intend to continue. I have not used Prime benefits since the renewal — no Prime shipping, Prime Video, or other benefits.',
    '',
    'Please cancel the membership and refund this renewal as unused.',
    '',
    'Thank you.',
  ],
  'microsoft-365': [
    'Hi Microsoft Support,',
    '',
    'My Microsoft 365 subscription under [email] renewed on [date] for [amount]. This was unintended and I have not used the renewed term.',
    '',
    'Please turn off recurring billing and refund this charge under your renewal-refund policy.',
    '',
    'Thank you.',
  ],
  'chatgpt-plus': [
    'Important: if you subscribed through the Apple App Store, the refund comes from Apple, not OpenAI.',
    '',
    'Apple route: go to reportaproblem.apple.com → sign in → find the ChatGPT charge → "Request a refund" → choose a reason (e.g. "subscription renewed unexpectedly"). Apple, not the app, issues the refund.',
    '',
    'Direct (openai.com) route — email support:',
    'Hi OpenAI Support, my ChatGPT Plus subscription under [email] renewed on [date] for [amount]. I did not intend to continue and have not used it since. Please cancel future renewals and review this charge for a refund. Thank you.',
  ],
}

function masterTemplateFor(guide) {
  const situationByIssue = {
    hard_cancel:
      'I’ve been trying to cancel and want this confirmed in writing so it will not renew again.',
    trial_refund:
      'A trial converted to a paid plan and I was charged for something I have not used since.',
    refund_denied:
      'I was charged after I believed I had already cancelled, and I’d like this reviewed again.',
    surprise_charge:
      'This renewed automatically and I did not intend to continue; I haven’t used the service since.',
  }
  const situation = situationByIssue[guide.issueType] || situationByIssue.surprise_charge
  return [
    `Subject: Refund request — ${guide.service} charge on [date] ([amount])`,
    '',
    `Hi ${guide.service} Support,`,
    '',
    `I’m writing about a ${guide.service} charge of [amount] on [date], on the account under [email].`,
    '',
    situation,
    '',
    'Could you please (1) confirm the subscription is cancelled and will not renew, and (2) review this charge for a refund based on the timing and my account activity? I have the receipt, account screenshots, and any confirmation emails available.',
    '',
    'Thank you for your help,',
    '[Name]',
  ]
}

function basicTemplateFor(guide) {
  const lines = SERVICE_SCRIPTS[guide.serviceId] || masterTemplateFor(guide)
  return lines.join('\n')
}

export function renderRefundPage(guide, services, guides = []) {
  const service = services.find((item) => item.id === guide.serviceId)
  const cancelUrl = service ? `/cancel/${service.slug}` : '/tools/cancel-subscription-guide'
  const matchingRefundStatsEntry = findMatchingRefundStatsEntry(guide)
  const refundStatsUrl = matchingRefundStatsEntry ? `/refund-stats/${refundStatsSlugFor(matchingRefundStatsEntry)}` : null
  const appIssueType = appIssueTypeFor(guide)
  const scanUrl = `/?service=${encodeURIComponent(guide.service)}&issue=${encodeURIComponent(appIssueType)}&source=seo_refund_page#scan`
  const canonical = absoluteUrl(`/refund/${guide.slug}`)
  const evidenceItems = guide.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
  const ctaLabel = ctaLabelFor(guide)
  const faqs = faqFor(guide)
  const basicTemplate = basicTemplateFor(guide)
  const researchSourceLabel = guide.sourceUrl.includes('reddit.com') ? 'Community discussion' : 'Official reference'
  const faqItems = faqs
    .map(
      (item) => `<details class="faq-item">
        <summary>${escapeHtml(item.q)}</summary>
        <p>${escapeHtml(item.a)}</p>
      </details>`,
    )
    .join('')
  const relatedCards = getRelatedGuides(guide, guides)
    .map(
      (item) => `<a class="related-card" href="/refund/${item.slug}">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.service)} · ${escapeHtml(item.amountExample)}</span>
      </a>`,
    )
    .join('')
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Bill Vampire', item: 'https://billvampire.com/' },
        { '@type': 'ListItem', position: 2, name: 'Refund Guides', item: 'https://billvampire.com/refund/' },
        { '@type': 'ListItem', position: 3, name: guide.title, item: canonical },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: guide.title,
      description: guide.metaDescription,
      totalTime: 'PT10M',
      step: [
        { '@type': 'HowToStep', name: 'Cancel or stop renewal', text: guide.cancelPath },
        { '@type': 'HowToStep', name: 'Collect evidence', text: `Save ${guide.evidence.join(', ')}.` },
        { '@type': 'HowToStep', name: 'Request refund or escalation', text: guide.refundWindow },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ]

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(guide.title)} | Bill Vampire</title>
  <meta name="description" content="${escapeHtml(guide.metaDescription)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${escapeHtml(guide.title)}" />
  <meta property="og:description" content="${escapeHtml(guide.metaDescription)}" />
  <meta property="og:url" content="${canonical}" />
  <link rel="icon" href="/icons/icon.png" type="image/png" />
  <link rel="stylesheet" href="/tools/gothic-tools.css" />
  ${structuredData.map((item) => `<script type="application/ld+json">${escapeJsonForHtml(item)}</script>`).join('\n  ')}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { min-height: 100vh; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 34px 20px 72px; }
    .nav { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; }
    .nav img { width: 34px; height: 34px; border-radius: 9px; }
    .nav a { text-decoration: none; font-size: 13px; }
    .eyebrow { color: #c9a46a; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 14px; }
    h1 { font-size: clamp(34px, 6vw, 62px); line-height: 1.02; max-width: 850px; margin-bottom: 18px; }
    .lead { font-size: 18px; line-height: 1.68; max-width: 760px; margin-bottom: 26px; }
    .hero { display: grid; gap: 20px; grid-template-columns: minmax(0, 1.15fr) minmax(280px, .85fr); align-items: start; }
    .case-box, .panel, .mini-form, .related, .faq { border: 1px solid rgba(247,239,230,.12); background: linear-gradient(180deg, rgba(247,239,230,.055), rgba(247,239,230,.018)), rgba(23,18,23,.84); border-radius: 18px; padding: 20px; box-shadow: 0 22px 70px rgba(0,0,0,.38); }
    .case-box { position: sticky; top: 20px; }
    .case-box strong { display: block; color: #f7efe6; font-size: 26px; margin-bottom: 4px; }
    .case-box span { display: block; color: #c9a46a; font-weight: 800; margin-bottom: 14px; }
    .cta { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 15px 18px; border-radius: 14px; text-decoration: none; font-weight: 900; background: linear-gradient(135deg, #a82d3d, #8e1d2c 54%, #5f1420); color: #f7efe6; margin-top: 14px; }
    .secondary { display: inline-flex; color: #c9a46a; margin-top: 12px; text-decoration: none; font-weight: 700; }
    .source-link { display: inline-flex; color: #c9a46a; margin-top: 12px; font-size: 13px; text-decoration: none; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 28px; }
    .panel h2, .mini-form h2 { color: #f7efe6; font-size: 22px; margin-bottom: 10px; }
    .panel p, .panel li, .mini-form p { color: #a99a91; line-height: 1.64; }
    .panel ul { padding-left: 20px; display: grid; gap: 8px; }
    .mini-form { margin-top: 24px; }
    .related { margin-top: 24px; }
    .related h2 { color: #f7efe6; font-size: 22px; margin-bottom: 12px; }
    .related-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .related-card { display: grid; gap: 5px; padding: 14px; border: 1px solid rgba(247,239,230,.1); border-radius: 14px; text-decoration: none; background: rgba(13,11,14,.52); }
    .related-card strong { color: #f7efe6; line-height: 1.25; }
    .related-card span { color: #c9a46a; font-size: 12px; font-weight: 800; }
    .faq { margin-top: 24px; }
    .faq h2 { color: #f7efe6; font-size: 22px; margin-bottom: 12px; }
    .faq-item { border-top: 1px solid rgba(247,239,230,.1); padding: 14px 0; }
    .faq-item:first-of-type { border-top: 0; }
    .faq-item summary { color: #f7efe6; cursor: pointer; font-weight: 800; }
    .faq-item p { color: #a99a91; line-height: 1.64; margin-top: 10px; }
    .template-panel { margin-top: 24px; border: 1px solid rgba(201,164,106,.22); background: linear-gradient(180deg, rgba(201,164,106,.08), rgba(247,239,230,.018)), rgba(13,11,14,.82); border-radius: 18px; padding: 20px; box-shadow: 0 22px 70px rgba(0,0,0,.34); }
    .template-panel h2 { color: #f7efe6; font-size: 22px; margin-bottom: 10px; }
    .template-panel p { color: #a99a91; line-height: 1.64; }
    .template-copy { background: rgba(13,11,14,.9); color: #f7efe6; border: 1px solid rgba(247,239,230,.14); }
    .template-action { background: #f7efe6; color: #171217; }
    textarea { width: 100%; min-height: 140px; margin-top: 12px; resize: vertical; border-radius: 14px; padding: 14px; font: inherit; line-height: 1.5; }
    button { width: 100%; border: 0; border-radius: 14px; padding: 15px 18px; margin-top: 12px; font-weight: 900; cursor: pointer; }
    .disclaimer { margin-top: 18px; font-size: 12px; line-height: 1.55; color: #7f716a; }
    @media (max-width: 760px) {
      .hero, .grid, .related-grid { grid-template-columns: 1fr; }
      .case-box { position: static; }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <nav class="nav">
      <a href="/"><img src="/icons/icon.png" alt="Bill Vampire" /></a>
      <a href="/tools/">Free tools</a>
      <a href="/refund/">Refund guides</a>
    </nav>

    <section class="hero">
      <div>
        <p class="eyebrow">${escapeHtml(guide.service)} case file</p>
        <h1>${escapeHtml(guide.title)}</h1>
        <p class="lead">${escapeHtml(guide.directAnswer || guide.searchIntent)} Bill Vampire turns that one charge into a focused cancel/refund case preview without a bank login.</p>
        <p class="disclaimer">Reviewed ${escapeHtml(guide.lastVerified)} by the <a href="/about/">Bill Vampire Editorial Team</a>. Policies vary by region and billing channel.</p>
        <div class="grid">
          <article class="panel">
            <h2>What people are running into</h2>
            <p>${escapeHtml(guide.communitySignal)}</p>
            <a class="source-link" href="${escapeHtml(guide.sourceUrl)}" rel="nofollow noopener noreferrer" target="_blank">${researchSourceLabel}</a>
          </article>
          <article class="panel">
            <h2>Refund window</h2>
            <p>${escapeHtml(guide.refundWindow)}</p>
          </article>
          <article class="panel">
            <h2>Cancel path</h2>
            <p>${escapeHtml(guide.cancelPath)}</p>
          </article>
          <article class="panel">
            <h2>Evidence checklist</h2>
            <ul>${evidenceItems}</ul>
          </article>
        </div>
      </div>
      <aside class="case-box">
        <strong>${escapeHtml(guide.amountExample)}</strong>
        <span>Typical amount at risk</span>
        <p>${escapeHtml(guide.officialContext)}</p>
        <a class="source-link" href="${escapeHtml(guide.officialSourceUrl)}" rel="noopener noreferrer" target="_blank">Official account or policy source</a>
        <a class="cta" href="${scanUrl}" onclick="bvTrack('refund_cta_clicked', { placement: 'side_card' })">${escapeHtml(ctaLabel)}</a>
        <a class="secondary" href="${cancelUrl}">Open ${escapeHtml(guide.service)} cancel guide</a>
        ${refundStatsUrl ? `<a class="secondary" href="${refundStatsUrl}">See ${escapeHtml(guide.service)} refund success-rate data</a>` : ''}
        <p class="disclaimer">Bill Vampire provides consumer communication templates and organization help. It is not legal, financial, or banking advice.</p>
      </aside>
    </section>

    <section class="mini-form">
      <h2>Start with your exact charge</h2>
      <p>Paste the charge, receipt, or one sentence. The free preview can be saved or downloaded; the paid Emergency Kit adds full scripts and checklist details.</p>
      <textarea id="refundInput">${escapeHtml(guide.freePreviewPrompt)}</textarea>
      <button onclick="startRefundCase()">${escapeHtml(ctaLabel)}</button>
    </section>

    <section class="template-panel">
      <h2>Copy a basic ${escapeHtml(guide.service)} request now</h2>
      <p>This generic script is free and does not use AI. The paid kit turns your exact charge, timing, and evidence into a more specific refund/cancel case file.</p>
      <textarea id="basicTemplate" class="template-copy" readonly>${escapeHtml(basicTemplate)}</textarea>
      <button class="template-action" onclick="copyBasicTemplate()">Copy basic script</button>
    </section>

    <section class="faq">
      <h2>${escapeHtml(guide.service)} refund FAQ</h2>
      ${faqItems}
    </section>

    <section class="related">
      <h2>Related refund case files</h2>
      <div class="related-grid">${relatedCards}</div>
    </section>
  </main>
  <script>
    function bvTrack(event, props) {
      var payload = Object.assign({
        service: '${escapeJsString(guide.service)}',
        issue_type: '${escapeJsString(guide.issueType)}',
        page: location.pathname,
        source: 'seo_refund_page'
      }, props || {});
      try { if (window.gtag) window.gtag('event', event, payload); } catch (e) {}
      try { if (window.posthog && window.posthog.capture) window.posthog.capture(event, payload); } catch (e) {}
      try { if (window.__debugAnalytics) console.log('[track]', event, payload); } catch (e) {}
    }
    bvTrack('refund_page_viewed');
    function startRefundCase() {
      const value = document.getElementById('refundInput').value || '${escapeJsString(guide.freePreviewPrompt)}';
      bvTrack('refund_cta_clicked', { placement: 'mini_form' });
      localStorage.setItem('vampire_issue_type', '${escapeHtml(appIssueType)}');
      localStorage.setItem('vampire_tool_prefill', value);
      localStorage.setItem('vampire_source_page', JSON.stringify({
        path: location.pathname,
        source: 'seo_refund_page',
        service: '${escapeHtml(guide.service)}',
        issue: '${escapeHtml(guide.issueType)}',
        capturedAt: new Date().toISOString()
      }));
      location.href = '${scanUrl}';
    }
    async function copyBasicTemplate() {
      const value = document.getElementById('basicTemplate').value;
      bvTrack('refund_basic_template_copied', { placement: 'free_template' });
      try {
        await navigator.clipboard.writeText(value);
      } catch (e) {
        const field = document.getElementById('basicTemplate');
        field.focus();
        field.select();
      }
    }
  </script>
</body>
</html>`
}

export function renderRefundHub(guides) {
  const cards = guides
    .map(
      (guide) => `<a class="tool-card" href="/refund/${guide.slug}">
      <h2>${escapeHtml(guide.title)}</h2>
      <p>${escapeHtml(guide.metaDescription)}</p>
      <span class="tag">${escapeHtml(guide.service)}</span>
    </a>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Subscription Refund Guides | Bill Vampire</title>
  <meta name="description" content="High-intent refund and cancellation guides for surprise subscription charges, free trials, and hard-to-cancel services." />
  <link rel="canonical" href="https://billvampire.com/refund/" />
  <meta property="og:url" content="https://billvampire.com/refund/" />
  <link rel="icon" href="/icons/icon.png" type="image/png" />
  <link rel="stylesheet" href="/tools/gothic-tools.css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { min-height: 100vh; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .container { max-width: 760px; margin: 0 auto; padding: 40px 20px 72px; }
    .nav { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
    .nav img { width: 32px; height: 32px; border-radius: 8px; }
    .nav a { text-decoration: none; font-size: 13px; }
    h1 { font-size: clamp(34px, 6vw, 56px); line-height: 1.05; margin-bottom: 12px; }
    .subtitle { line-height: 1.65; margin-bottom: 28px; }
    .tool-card { display: block; text-decoration: none; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <nav class="nav">
      <a href="/"><img src="/icons/icon.png" alt="Bill Vampire" /></a>
      <a href="/">Back to Bill Vampire</a>
      <a href="/tools/">Free tools</a>
    </nav>
    <h1>Subscription refund guides</h1>
    <p class="subtitle">Pages built around specific refund and cancellation pain: annual renewals, trial charges, hard cancellation fees, and support scripts.</p>
    ${cards}
  </div>
</body>
</html>`
}
