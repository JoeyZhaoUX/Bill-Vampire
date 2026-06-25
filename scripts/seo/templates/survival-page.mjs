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

function sourceFor(theme) {
  return `survival_${theme.slug.replace(/-/g, '_')}`
}

function promptFor(theme, article) {
  if (!article) return theme.defaultPrompt
  return `${theme.defaultPrompt}\n\nSpecific problem: ${article.title}. Keyword focus: ${article.keyword}.`
}

function ctaUrlFor(theme, article) {
  const prompt = promptFor(theme, article)
  return `/?issue=surprise_charge&source=${encodeURIComponent(sourceFor(theme))}&prefill=${encodeURIComponent(prompt)}#scan`
}

function relatedArticles(theme, activeSlug = '') {
  return theme.articles
    .filter((article) => article.slug !== activeSlug)
    .slice(0, 4)
}

function tierLabel(article) {
  const value = String(article.tier || '').replace(/^tier\s*/i, '').trim()
  return value ? `Tier ${value}` : 'Survival guide'
}

function renderNav() {
  return `<nav class="nav">
    <a href="/"><img src="/icons/icon.png" alt="Bill Vampire" /></a>
    <a href="/survival/">Survival guides</a>
    <a href="/refund/">Refund guides</a>
    <a href="/cancel/">Cancel guides</a>
  </nav>`
}

function renderChecklist(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
}

function renderArticleBody(article) {
  const body = article.body
  if (!body) return ''
  const cutItems = (body.cutFirst || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')
  const faqHtml = (body.faqs || [])
    .map(
      (item) => `<details class="faq-item">
          <summary>${escapeHtml(item.q)}</summary>
          <p>${escapeHtml(item.a)}</p>
        </details>`,
    )
    .join('')
  return `<section class="article-body">
      <h2>What's happening</h2>
      <p>${escapeHtml(body.whatsHappening)}</p>
      <h2>Your first move in the next 10 minutes</h2>
      <p>${escapeHtml(body.firstMove)}</p>
      <h2>What to cut or check first</h2>
      <ul class="cut-list">${cutItems}</ul>
      <h2>The exact words to use</h2>
      <p class="exact-words">${escapeHtml(body.exactWords)}</p>
      <p class="exact-note">Adapt the bracketed parts. <a href="/refund/">Refund templates</a> and <a href="/cancel/">cancel guides</a> cover specific services.</p>
      <h2>What to keep an eye on</h2>
      <p>${escapeHtml(body.keepWatch)}</p>
      ${faqHtml ? `<h2>FAQ</h2><div class="faq">${faqHtml}</div>` : ''}
    </section>`
}

function faqSchemaFor(article) {
  const faqs = article.body?.faqs
  if (!faqs || !faqs.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

function renderExamples(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
}

function renderThemeCards(themes) {
  return themes
    .map(
      (theme) => `<a class="card" href="/survival/${theme.slug}/">
        <span>${escapeHtml(theme.label)}</span>
        <strong>${escapeHtml(theme.tagline)}</strong>
        <p>${escapeHtml(theme.description)}</p>
      </a>`,
    )
    .join('')
}

function renderArticleCards(theme, articles = theme.articles) {
  return articles
    .map(
      (article) => `<a class="article-card" href="/survival/${theme.slug}/${article.slug}.html">
        <span>${escapeHtml(tierLabel(article))} · ${escapeHtml(article.keyword)}</span>
        <strong>${escapeHtml(article.title)}</strong>
        <p>${escapeHtml(article.metaDescription)}</p>
      </a>`,
    )
    .join('')
}

function renderShell({ title, description, canonical, structuredData, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | Bill Vampire</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <link rel="icon" href="/icons/icon.png" type="image/png" />
  <link rel="stylesheet" href="/tools/gothic-tools.css" />
  ${structuredData.map((item) => `<script type="application/ld+json">${escapeJsonForHtml(item)}</script>`).join('\n  ')}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { min-height: 100vh; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .wrap { max-width: 1080px; margin: 0 auto; padding: 34px 20px 76px; }
    .nav { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 36px; }
    .nav img { width: 34px; height: 34px; border-radius: 9px; }
    .nav a { text-decoration: none; font-size: 13px; }
    .eyebrow { color: #c9a46a; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 14px; }
    h1 { font-size: clamp(34px, 6vw, 64px); line-height: 1.04; max-width: 900px; margin-bottom: 16px; }
    .lead { font-size: 18px; line-height: 1.65; max-width: 760px; margin-bottom: 26px; color: #cdbfb6; }
    .hero { display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(280px, .88fr); gap: 22px; align-items: start; }
    .panel, .case-box, .mini-form, .related, .card, .article-card { border: 1px solid rgba(247,239,230,.12); background: linear-gradient(180deg, rgba(247,239,230,.055), rgba(247,239,230,.018)), rgba(23,18,23,.84); border-radius: 18px; padding: 20px; box-shadow: 0 22px 70px rgba(0,0,0,.34); }
    .case-box { position: sticky; top: 20px; }
    .case-box strong { display: block; color: #f7efe6; font-size: 26px; margin-bottom: 5px; }
    .case-box p, .panel p, .mini-form p, .article-card p, .card p { color: #a99a91; line-height: 1.64; }
    .cta { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 15px 18px; border-radius: 14px; text-decoration: none; font-weight: 900; background: linear-gradient(135deg, #a82d3d, #8e1d2c 54%, #5f1420); color: #f7efe6; margin-top: 14px; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 28px; }
    .panel h2, .mini-form h2, .related h2 { color: #f7efe6; font-size: 22px; margin-bottom: 10px; }
    .panel ul { padding-left: 20px; display: grid; gap: 8px; color: #a99a91; line-height: 1.6; }
    .mini-form, .related { margin-top: 24px; }
    .cards, .article-grid { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 22px; }
    .card, .article-card { display: grid; gap: 8px; text-decoration: none; }
    .card span, .article-card span { color: #c9a46a; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
    .card strong, .article-card strong { color: #f7efe6; font-size: 18px; line-height: 1.25; }
    textarea { width: 100%; min-height: 150px; margin-top: 12px; resize: vertical; border-radius: 14px; padding: 14px; font: inherit; line-height: 1.5; background: rgba(13,11,14,.9); color: #f7efe6; border: 1px solid rgba(247,239,230,.14); }
    button { width: 100%; border: 0; border-radius: 14px; padding: 15px 18px; margin-top: 12px; font-weight: 900; cursor: pointer; background: #f7efe6; color: #171217; }
    .disclaimer { margin-top: 18px; font-size: 12px; line-height: 1.55; color: #7f716a; }
    .article-body { margin-top: 30px; max-width: 820px; }
    .article-body h2 { color: #f7efe6; font-size: clamp(21px, 3.2vw, 27px); line-height: 1.2; margin: 32px 0 12px; }
    .article-body p { color: #cdbfb6; font-size: 16px; line-height: 1.72; margin-bottom: 14px; }
    .article-body .cut-list { padding-left: 20px; display: grid; gap: 9px; color: #cdbfb6; font-size: 16px; line-height: 1.6; margin-bottom: 14px; }
    .article-body .exact-words { border-left: 3px solid #c9a46a; background: rgba(201,164,106,.08); border-radius: 0 12px 12px 0; padding: 14px 18px; color: #f7efe6; font-size: 15px; line-height: 1.7; white-space: pre-line; }
    .article-body .exact-note { font-size: 13px; color: #a99a91; }
    .article-body .exact-note a { color: #c9a46a; }
    .article-body .faq { margin-top: 6px; }
    .faq-item { border-top: 1px solid rgba(247,239,230,.12); padding: 14px 0; }
    .faq-item:first-of-type { border-top: 0; }
    .faq-item summary { color: #f7efe6; cursor: pointer; font-weight: 800; font-size: 16px; }
    .faq-item p { color: #a99a91; line-height: 1.64; margin-top: 10px; margin-bottom: 0; }
    @media (max-width: 760px) {
      .hero, .grid, .cards, .article-grid { grid-template-columns: 1fr; }
      .case-box { position: static; }
    }
  </style>
</head>
<body>
  <main class="wrap">
    ${body}
  </main>
</body>
</html>`
}

export function renderSurvivalHub(themes) {
  const title = 'Financial Survival Guides for the Subscription Economy'
  const description = 'Cut subscription drag during layoffs, downgrade pressure, subscription hell, doom spending, and money anxiety.'
  const canonical = 'https://billvampire.com/survival/'
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url: canonical,
    },
  ]

  return renderShell({
    title,
    description,
    canonical,
    structuredData,
    body: `${renderNav()}
      <p class="eyebrow">Subscription survival hub</p>
      <h1>Financial survival guides for the subscription economy.</h1>
      <p class="lead">When invisible monthly charges pile up, the fastest money move is not another dashboard. It is a focused audit, cancellation order, refund script, and reminder plan.</p>
      <section class="cards">${renderThemeCards(themes)}</section>`,
  })
}

export function renderSurvivalTheme(theme) {
  const title = `${theme.label} Subscription Survival Guide`
  const description = theme.description
  const canonical = `https://billvampire.com/survival/${theme.slug}/`
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url: canonical,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Bill Vampire', item: 'https://billvampire.com/' },
        { '@type': 'ListItem', position: 2, name: 'Survival Guides', item: 'https://billvampire.com/survival/' },
        { '@type': 'ListItem', position: 3, name: theme.label, item: canonical },
      ],
    },
  ]
  const scanUrl = ctaUrlFor(theme)

  return renderShell({
    title,
    description,
    canonical,
    structuredData,
    body: `${renderNav()}
      <section class="hero">
        <div>
          <p class="eyebrow">${escapeHtml(theme.source)}</p>
          <h1>${escapeHtml(theme.tagline)}</h1>
          <p class="lead">${escapeHtml(theme.description)}</p>
          <div class="grid">
            <article class="panel">
              <h2>What to inspect first</h2>
              <ul>${renderChecklist(theme.inspectFirst)}</ul>
            </article>
            <article class="panel">
              <h2>Common vampire examples</h2>
              <ul>${renderExamples(theme.examples)}</ul>
            </article>
          </div>
        </div>
        <aside class="case-box">
          <strong>Build a survival preview</strong>
          <p>Paste the messy version: job-loss panic, downgrade targets, renewal dates, or the subscriptions that feel hardest to cancel.</p>
          <a class="cta" href="${scanUrl}">Build my survival preview</a>
          <p class="disclaimer">Bill Vampire provides consumer communication templates and organization help. It is not legal, financial, or banking advice.</p>
        </aside>
      </section>
      <section class="mini-form">
        <h2>Start with your current pressure</h2>
        <p>The preview turns this into a cancel/refund order, evidence list, and first message you can send.</p>
        <textarea id="survivalInput">${escapeHtml(theme.defaultPrompt)}</textarea>
        <button onclick="startSurvivalCase()">Build my survival preview</button>
      </section>
      <section class="related">
        <h2>${escapeHtml(theme.label)} pages</h2>
        <div class="article-grid">${renderArticleCards(theme)}</div>
      </section>
      ${renderSurvivalScript(theme)}`,
  })
}

export function renderSurvivalArticle(theme, article) {
  const title = article.title
  const description = article.metaDescription
  const canonical = `https://billvampire.com/survival/${theme.slug}/${article.slug}.html`
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      mainEntityOfPage: canonical,
      author: { '@type': 'Organization', name: 'Bill Vampire' },
      publisher: { '@type': 'Organization', name: 'Bill Vampire' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Bill Vampire', item: 'https://billvampire.com/' },
        { '@type': 'ListItem', position: 2, name: 'Survival Guides', item: 'https://billvampire.com/survival/' },
        { '@type': 'ListItem', position: 3, name: theme.label, item: `https://billvampire.com/survival/${theme.slug}/` },
        { '@type': 'ListItem', position: 4, name: title, item: canonical },
      ],
    },
  ]
  const faqSchema = faqSchemaFor(article)
  if (faqSchema) structuredData.push(faqSchema)
  const related = relatedArticles(theme, article.slug)
  const scanUrl = ctaUrlFor(theme, article)
  const articlePrompt = promptFor(theme, article)

  return renderShell({
    title,
    description,
    canonical,
    structuredData,
    body: `${renderNav()}
      <section class="hero">
        <div>
          <p class="eyebrow">${escapeHtml(theme.label)} · ${escapeHtml(tierLabel(article))}</p>
          <h1>${escapeHtml(article.title)}</h1>
          <p class="lead">${escapeHtml(article.metaDescription)} Bill Vampire turns the pressure into a focused subscription survival preview without a bank login.</p>
          <div class="grid">
            <article class="panel">
              <h2>What to inspect first</h2>
              <ul>${renderChecklist(theme.inspectFirst)}</ul>
            </article>
            <article class="panel">
              <h2>Checklist</h2>
              <ul>${renderChecklist(theme.checklist)}</ul>
            </article>
            <article class="panel">
              <h2>Common vampire examples</h2>
              <ul>${renderExamples(theme.examples)}</ul>
            </article>
            <article class="panel">
              <h2>Related money moves</h2>
              <ul>
                <li><a href="/refund/">Open refund templates for surprise charges</a></li>
                <li><a href="/cancel/">Find a service-specific cancellation path</a></li>
                <li><a href="/tools/free-trial-refund-helper.html">Use the free trial refund helper</a></li>
              </ul>
            </article>
          </div>
        </div>
        <aside class="case-box">
          <strong>${escapeHtml(article.keyword)}</strong>
          <p>Use this page as a starting point, then generate a preview based on your exact charge, service, date, and urgency.</p>
          <a class="cta" href="${scanUrl}">Build my survival preview</a>
          <p class="disclaimer">Bill Vampire provides consumer communication templates and organization help. It is not legal, financial, or banking advice.</p>
        </aside>
      </section>
      ${renderArticleBody(article)}
      <section class="mini-form">
        <h2>Case-preview starter</h2>
        <p>Edit this with the service names, dates, and amounts you can remember.</p>
        <textarea id="survivalInput">${escapeHtml(articlePrompt)}</textarea>
        <button onclick="startSurvivalCase()">Build my survival preview</button>
      </section>
      <section class="related">
        <h2>More ${escapeHtml(theme.label)} guides</h2>
        <div class="article-grid">${renderArticleCards(theme, related)}</div>
      </section>
      ${renderSurvivalScript(theme, article)}`,
  })
}

function renderSurvivalScript(theme, article = null) {
  const fallbackPrompt = promptFor(theme, article)
  const initialUrl = ctaUrlFor(theme, article)
  return `<script>
    function bvTrack(event, props) {
      var payload = Object.assign({
        theme: '${escapeJsString(theme.slug)}',
        keyword: '${escapeJsString(article?.keyword || theme.label)}',
        page: location.pathname,
        source: '${escapeJsString(sourceFor(theme))}'
      }, props || {});
      try { if (window.gtag) window.gtag('event', event, payload); } catch (e) {}
      try { if (window.posthog && window.posthog.capture) window.posthog.capture(event, payload); } catch (e) {}
    }
    bvTrack('survival_page_viewed');
    function startSurvivalCase() {
      var field = document.getElementById('survivalInput');
      var value = (field && field.value) || '${escapeJsString(fallbackPrompt)}';
      bvTrack('survival_cta_clicked', { placement: 'case_preview' });
      localStorage.setItem('vampire_issue_type', 'surprise_charge');
      localStorage.setItem('vampire_tool_prefill', value);
      localStorage.setItem('vampire_source_page', JSON.stringify({
        path: location.pathname,
        source: '${escapeJsString(sourceFor(theme))}',
        theme: '${escapeJsString(theme.slug)}',
        keyword: '${escapeJsString(article?.keyword || theme.label)}',
        capturedAt: new Date().toISOString()
      }));
      location.href = '/?issue=surprise_charge&source=${escapeJsString(sourceFor(theme))}&prefill=' + encodeURIComponent(value) + '#scan';
    }
  </script>
  <noscript><p><a class="cta" href="${initialUrl}">Build my survival preview</a></p></noscript>`
}
