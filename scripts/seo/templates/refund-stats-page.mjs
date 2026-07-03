import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { absoluteUrl } from '../url-policy.mjs'
import { SERVICES } from '../services.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../../..')
const REFUND_GUIDES_PATH = join(ROOT, 'content/refund/guides.json')

// Build-time snapshot date. Data comes from a D1-backed graph that updates
// continuously, but per the plan's §5.2 architecture note, a fresh number on
// every deploy is "live enough" — no SSR/edge rendering needed for MVP.
const DATA_SNAPSHOT_DATE = new Date().toISOString().slice(0, 10)

let cachedGuides = null
function loadRefundGuides() {
  if (cachedGuides) return cachedGuides
  try {
    cachedGuides = JSON.parse(readFileSync(REFUND_GUIDES_PATH, 'utf-8'))
  } catch {
    cachedGuides = []
  }
  return cachedGuides
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

// Suffix words like "Pro"/"Plus"/"Super" get stripped so "Canva Pro" (seed
// data) can loosely match "Canva Pro" (cancel guide) or "Duolingo Plus"
// (cancel guide) against "Duolingo Super" (seed data) — same brand, no exact
// string match required.
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

function findMatchingRefundGuide(entry, guides) {
  const key = coreServiceKey(entry.service)
  if (!key) return null
  return guides.find((guide) => coreServiceKey(guide.service) === key) || null
}

function findMatchingCancelService(entry, services) {
  const key = coreServiceKey(entry.service)
  if (!key) return null
  return services.find((service) => coreServiceKey(service.name) === key) || null
}

const CHARGE_TYPE_LABELS = {
  trial_refund: 'trial refund',
  hard_cancel: 'hard cancellation',
  surprise_charge: 'surprise renewal charge',
  refund_denied: 'refund escalation',
}

function chargeTypeLabel(entry) {
  return CHARGE_TYPE_LABELS[entry.charge_type] || 'refund'
}

const BEST_PATH_LABELS = {
  support_chat: 'live chat with support',
  support_email: 'a written email to support',
  live_chat: 'live chat',
  self_service: 'the self-service cancellation flow',
  app_store_platform: 'the App Store / Google Play refund request form',
}

function bestPathLabel(entry) {
  return BEST_PATH_LABELS[entry.best_path] || 'contacting support directly'
}

function refundWindowText(entry) {
  if (Number.isFinite(entry.refund_window_days)) {
    return `${entry.service} generally reviews refund requests within about ${entry.refund_window_days} days of the charge. Ask as soon as possible — most billing teams weigh how quickly you reported the issue.`
  }
  return `${entry.service} does not publish a fixed refund window for this charge type — ask support directly and reference your exact charge date.`
}

function bestPathText(entry) {
  return `Try ${bestPathLabel(entry)} first for a ${entry.service} ${chargeTypeLabel(entry)}. This is our current best-guess starting point, not a guaranteed outcome.`
}

function officialUrlFor(entry) {
  const contacts = entry.working_contacts_json || {}
  return contacts.cancel_url || null
}

function slugFor(entry) {
  const slugify = (value) =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  return `${slugify(entry.service)}-${slugify(entry.charge_type)}-success-rate`
}

function sampleCountFor(entry) {
  return Number.isFinite(entry.sample_count) ? entry.sample_count : 0
}

// Per the plan's cold-start anti-fraud rule (§3): seed-estimated success
// rates are for internal ranking only and must NEVER be shown publicly.
// Below sample_count = 10, this renders facts-only. Currently every seed row
// has sample_count = 0, so this branch always wins today; it stays
// conditional so the page upgrades itself once real outcomes accumulate.
function successRateBlock(entry) {
  const sampleCount = sampleCountFor(entry)
  if (sampleCount >= 10 && typeof entry.success_rate === 'number') {
    const pct = Math.round(entry.success_rate * 100)
    return {
      hasData: true,
      pctLabel: `${pct}%`,
      sentence: `${pct}% of ${sampleCount} self-reported cases got money back.`,
      avgDaysSentence: Number.isFinite(entry.avg_days_to_refund)
        ? `Users who got refunds reported waiting about ${entry.avg_days_to_refund} days on average.`
        : '',
    }
  }
  return {
    hasData: false,
    pctLabel: null,
    sentence: `We don't have enough self-reported outcomes for ${entry.service} yet to publish a success rate (we require at least 10 verified reports before showing a number — see why below).`,
    avgDaysSentence: '',
  }
}

function faqFor(entry) {
  const rate = successRateBlock(entry)
  return [
    {
      q: `What is the refund window for ${entry.service}?`,
      a: refundWindowText(entry),
    },
    {
      q: `Which channel works best for ${entry.service} refunds?`,
      a: bestPathText(entry),
    },
    {
      q: `What is the ${entry.service} refund success rate?`,
      a: rate.hasData
        ? `${rate.sentence} ${rate.avgDaysSentence}`.trim()
        : `We publish a success rate only once at least 10 real users self-report an outcome for ${entry.service}. ${rate.sentence}`,
    },
  ]
}

export function renderRefundStatsPage(entry, allEntries = []) {
  const guides = loadRefundGuides()
  const matchingGuide = findMatchingRefundGuide(entry, guides)
  const matchingCancelService = findMatchingCancelService(entry, SERVICES)
  const slug = slugFor(entry)
  const canonical = absoluteUrl(`/refund-stats/${slug}`)
  const title = `${entry.service} refund success rate & data (${chargeTypeLabel(entry)}) | Bill Vampire`
  const metaDescription = `Real, self-reported ${entry.service} refund data: refund window, the channel that works, and (once we have 10+ reports) a verified success rate. No guessing, no AI hallucination.`
  const rate = successRateBlock(entry)
  const officialUrl = officialUrlFor(entry)
  const scanUrl = `/?service=${encodeURIComponent(entry.service)}&issue=surprise_charge&source=seo_refund_stats_page#scan`

  const relatedCards = allEntries
    .filter((item) => slugFor(item) !== slug)
    .slice(0, 4)
    .map(
      (item) => `<a class="related-card" href="/refund-stats/${slugFor(item)}">
        <strong>${escapeHtml(item.service)}</strong>
        <span>${escapeHtml(chargeTypeLabel(item))}</span>
      </a>`,
    )
    .join('')

  const faqs = faqFor(entry)
  const faqItems = faqs
    .map(
      (item) => `<details class="faq-item">
        <summary>${escapeHtml(item.q)}</summary>
        <p>${escapeHtml(item.a)}</p>
      </details>`,
    )
    .join('')

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Bill Vampire', item: 'https://billvampire.com/' },
        { '@type': 'ListItem', position: 2, name: 'Refund Success-Rate Data', item: 'https://billvampire.com/refund-stats/' },
        { '@type': 'ListItem', position: 3, name: `${entry.service} refund data`, item: canonical },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: `${entry.service} refund outcomes dataset (${chargeTypeLabel(entry)})`,
      description: `Self-reported refund outcomes and support-channel effectiveness for ${entry.service} (${chargeTypeLabel(entry)}), aggregated by Bill Vampire's Refund Intelligence Graph.`,
      url: canonical,
      dateModified: DATA_SNAPSHOT_DATE,
      creator: { '@type': 'Organization', name: 'Bill Vampire', url: 'https://billvampire.com/' },
      variableMeasured: ['refund success rate', 'average days to refund', 'most effective refund channel', 'refund window in days'],
      measurementTechnique: 'Self-reported user outcomes, Beta-smoothed and gated by minimum sample size',
      temporalCoverage: DATA_SNAPSHOT_DATE,
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
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(metaDescription)}" />
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
    h1 { font-size: clamp(34px, 6vw, 58px); line-height: 1.05; max-width: 850px; margin-bottom: 18px; }
    .lead { font-size: 18px; line-height: 1.68; max-width: 760px; margin-bottom: 26px; }
    .hero { display: grid; gap: 20px; grid-template-columns: minmax(0, 1.15fr) minmax(280px, .85fr); align-items: start; }
    .case-box, .panel, .mini-form, .related, .faq { border: 1px solid rgba(247,239,230,.12); background: linear-gradient(180deg, rgba(247,239,230,.055), rgba(247,239,230,.018)), rgba(23,18,23,.84); border-radius: 18px; padding: 20px; box-shadow: 0 22px 70px rgba(0,0,0,.38); }
    .case-box { position: sticky; top: 20px; }
    .case-box strong { display: block; color: #f7efe6; font-size: 22px; margin-bottom: 4px; }
    .case-box span { display: block; color: #c9a46a; font-weight: 800; margin-bottom: 14px; }
    .cta { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 15px 18px; border-radius: 14px; text-decoration: none; font-weight: 900; background: linear-gradient(135deg, #a82d3d, #8e1d2c 54%, #5f1420); color: #f7efe6; margin-top: 14px; }
    .secondary { display: inline-flex; color: #c9a46a; margin-top: 12px; text-decoration: none; font-weight: 700; }
    .source-link { display: inline-flex; color: #c9a46a; margin-top: 12px; font-size: 13px; text-decoration: none; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 28px; }
    .panel h2, .mini-form h2 { color: #f7efe6; font-size: 22px; margin-bottom: 10px; }
    .panel p, .panel li, .mini-form p { color: #a99a91; line-height: 1.64; }
    .panel ul { padding-left: 20px; display: grid; gap: 8px; }
    .stat-note { margin-top: 24px; border: 1px solid rgba(201,164,106,.22); background: linear-gradient(180deg, rgba(201,164,106,.08), rgba(247,239,230,.018)), rgba(13,11,14,.82); border-radius: 18px; padding: 20px; box-shadow: 0 22px 70px rgba(0,0,0,.34); }
    .stat-note h2 { color: #f7efe6; font-size: 22px; margin-bottom: 10px; }
    .stat-note p { color: #a99a91; line-height: 1.64; }
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
      <a href="/refund-stats/">Refund data</a>
    </nav>

    <section class="hero">
      <div>
        <p class="eyebrow">${escapeHtml(entry.service)} refund data</p>
        <h1>${escapeHtml(entry.service)} ${escapeHtml(chargeTypeLabel(entry))}: what the data actually shows</h1>
        <p class="lead">${escapeHtml(rate.sentence)} This page updates as more real users report what happened to their case — not a large-language-model guess.</p>
        <p class="disclaimer">Data snapshot as of ${escapeHtml(DATA_SNAPSHOT_DATE)}, from Bill Vampire's Refund Intelligence Graph. Not legal, financial, or banking advice.</p>
        <div class="grid">
          <article class="panel">
            <h2>Refund window</h2>
            <p>${escapeHtml(refundWindowText(entry))}</p>
          </article>
          <article class="panel">
            <h2>Best channel to try first</h2>
            <p>${escapeHtml(bestPathText(entry))}</p>
          </article>
          <article class="panel">
            <h2>Official account / policy source</h2>
            <p>${officialUrl ? `<a class="source-link" href="${escapeHtml(officialUrl)}" rel="noopener noreferrer" target="_blank">${escapeHtml(officialUrl)}</a>` : `We don't have a verified official link for ${escapeHtml(entry.service)} yet — check your account billing settings directly.`}</p>
          </article>
          <article class="panel">
            <h2>Charge type</h2>
            <p>${escapeHtml(chargeTypeLabel(entry))}</p>
          </article>
        </div>
      </div>
      <aside class="case-box">
        <strong>${rate.pctLabel || 'Not enough data yet'}</strong>
        <span>${rate.hasData ? `Based on ${sampleCountFor(entry)} self-reported cases` : 'We require 10+ verified reports before publishing a number'}</span>
        <p>${escapeHtml(rate.hasData ? rate.avgDaysSentence : "We're collecting real outcome data from Bill Vampire users for this exact charge type — check back as this page updates with verified numbers.")}</p>
        <a class="cta" href="${scanUrl}" onclick="bvTrack('refund_stats_cta_clicked', { placement: 'side_card' })">See if you can get your ${escapeHtml(entry.service)} charge back &rarr;</a>
        ${matchingGuide ? `<a class="secondary" href="/refund/${escapeHtml(matchingGuide.slug)}">Read the full ${escapeHtml(entry.service)} refund guide</a>` : ''}
        ${matchingCancelService ? `<a class="secondary" href="/cancel/${escapeHtml(matchingCancelService.slug)}">Open the ${escapeHtml(entry.service)} cancel guide</a>` : ''}
      </aside>
    </section>

    <section class="stat-note">
      <h2>Why don't you show a success-rate percentage yet?</h2>
      <p>We only publish a success rate once at least 10 real users self-report what happened to their ${escapeHtml(entry.service)} case (won, lost, days to resolve). Below that threshold, small samples are misleading — one lucky refund isn't a "100% success rate." Every public number we do publish is labeled as "X% of N self-reported cases," never a bare percentage. This page currently has ${sampleCountFor(entry)} reported cases for ${escapeHtml(entry.service)} ${escapeHtml(chargeTypeLabel(entry))}.</p>
    </section>

    <section class="faq">
      <h2>${escapeHtml(entry.service)} refund data FAQ</h2>
      ${faqItems}
    </section>

    <section class="related">
      <h2>Other refund success-rate pages</h2>
      <div class="related-grid">${relatedCards}</div>
    </section>
  </main>
  <script>
    function bvTrack(event, props) {
      var payload = Object.assign({
        service: ${JSON.stringify(entry.service)},
        charge_type: ${JSON.stringify(entry.charge_type)},
        page: location.pathname,
        source: 'seo_refund_stats_page'
      }, props || {});
      try { if (window.gtag) window.gtag('event', event, payload); } catch (e) {}
      try { if (window.posthog && window.posthog.capture) window.posthog.capture(event, payload); } catch (e) {}
      try { if (window.__debugAnalytics) console.log('[track]', event, payload); } catch (e) {}
    }
    bvTrack('refund_stats_page_viewed');
  </script>
</body>
</html>`
}

export function renderRefundStatsHub(allEntries) {
  const cards = allEntries
    .map((entry) => {
      const slug = slugFor(entry)
      const rate = successRateBlock(entry)
      return `<a class="tool-card" href="/refund-stats/${slug}">
      <h2>${escapeHtml(entry.service)} — ${escapeHtml(chargeTypeLabel(entry))}</h2>
      <p>${escapeHtml(rate.sentence)}</p>
      <span class="tag">${escapeHtml(entry.service)}</span>
    </a>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Live Refund Success-Rate Data | Bill Vampire</title>
  <meta name="description" content="Real, self-reported refund success data by service and charge type: refund windows, the channel that works, and verified success rates once we have enough reports." />
  <link rel="canonical" href="https://billvampire.com/refund-stats/" />
  <meta property="og:url" content="https://billvampire.com/refund-stats/" />
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
      <a href="/refund/">Refund guides</a>
    </nav>
    <h1>Live refund success-rate data</h1>
    <p class="subtitle">Refund windows, effective channels, and self-reported success rates by service — sourced from Bill Vampire's Refund Intelligence Graph, not AI guesswork. Numbers only publish once we have at least 10 verified reports.</p>
    ${cards}
  </div>
</body>
</html>`
}
