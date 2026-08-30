import { absoluteUrl } from '../url-policy.mjs';

export function renderCancelPage(service, content, allServices) {
  const related = service.related
    .map(id => allServices.find(s => s.id === id))
    .filter(Boolean);

  const diffBadge = `<span class="badge badge-${service.difficulty}">${service.difficulty}</span>`;
  const priceHtml = service.price !== 'varies'
    ? `<span>${esc(service.price)}</span>`
    : '<!-- Price varies by plan or region -->';
  const scanUrl = `/?service=${encodeURIComponent(service.name)}&issue=hard_cancel&source=seo_cancel_page#scan`;
  const socialImage = content.heroImage?.src
    ? absoluteUrl(content.heroImage.src)
    : 'https://billvampire.com/og-image.svg';

  const stepsHtml = content.steps.map((step, i) => {
    const tipHtml = step.tip ? `\n      <div class="tip">${esc(step.tip)}</div>` : '';
    const imageHtml = step.image ? `\n      ${renderEditorialImage(step.image, 'step-image')}` : '';
    const html = `<div class="step" id="step-${i + 1}">
      <h3>${esc(step.title)}</h3>
      <p>${esc(step.text)}</p>${tipHtml}${imageHtml}
    </div>`;
    if (i === 2) {
      return html + `
    <div class="cta-inline">
      <p>Already charged? Keep the receipt and the cancellation confirmation. They are the useful part of a refund request.</p>
      <a href="${scanUrl}" onclick="trackCancelGuide('cancel_inline_preview_clicked')">Check my ${esc(service.name)} refund options &rarr;</a>
    </div>`;
    }
    return html;
  }).join('\n    ');

  const warningsHtml = content.warnings && content.warnings.length > 0
    ? `<div class="warnings">
      <h3>&#9888;&#65039; Watch out</h3>
      <ul>${content.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul>
    </div>`
    : '';

  const refundHtml = content.refund
    ? `<div class="refund-box">
      <h3>${content.refund.eligible ? '&#10003; Refund may be possible' : '&#10007; Refund policy'}</h3>
      <p>${esc(content.refund.details)}</p>
    </div>`
    : '';

  const policyImagesHtml = content.policyImages && content.policyImages.length > 0
    ? `<section class="policy-evidence">
      <h2>Official screens behind the policy notes</h2>
      <p>These current support screens are included so you can compare the wording on your own account before acting.</p>
      ${content.policyImages.map(image => renderEditorialImage(image, 'policy-image')).join('\n      ')}
    </section>`
    : '<!-- No additional policy screenshots for this guide -->';

  const faqHtml = content.faqs && content.faqs.length > 0
    ? `<div class="faq">
      <h2>Frequently Asked Questions</h2>
      ${content.faqs.map(f => `<details>
        <summary>${esc(f.q)}</summary>
        <div class="answer">${esc(f.a)}</div>
      </details>`).join('\n      ')}
    </div>`
    : '';

  const relatedHtml = related.length > 0
    ? `<div class="related">
      <h2>Related Cancel Guides</h2>
      <div class="related-grid">
        ${related.map(r => `<a class="related-link" href="/cancel/${r.slug}">${r.name} <span class="arrow">&rarr;</span></a>`).join('\n        ')}
      </div>
    </div>`
    : '';
  const heroHtml = content.heroImage
    ? renderEditorialImage(content.heroImage, 'editorial-image', true)
    : '<!-- No editorial image for this guide -->';
  const sourcesHtml = content.sources && content.sources.length > 0
    ? `<section class="source-notes">
      <h2>Sources checked for this guide</h2>
      <p>${esc(content.sourceNote || 'We checked the current account path and policy before updating this page.')}</p>
      <ul>${content.sources.map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></li>`).join('')}</ul>
    </section>`
    : '<!-- No source list for this guide -->';
  const serviceJson = JSON.stringify(service.name);

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        "name": content.title,
        "description": content.metaDescription,
        "image": socialImage,
        "dateModified": content.lastVerified,
        "totalTime": `PT${parseInt(content.timeEstimate) || 5}M`,
        "step": content.steps.map((s, i) => ({
          "@type": "HowToStep",
          "position": i + 1,
          "name": s.title,
          "text": s.text,
          "url": `${absoluteUrl(`/cancel/${service.slug}`)}#step-${i + 1}`
        }))
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Bill Vampire", "item": "https://billvampire.com/" },
          { "@type": "ListItem", "position": 2, "name": "Cancel Guides", "item": "https://billvampire.com/cancel/" },
          { "@type": "ListItem", "position": 3, "name": `Cancel ${service.name}` }
        ]
      },
      ...(content.faqs && content.faqs.length > 0 ? [{
        "@type": "FAQPage",
        "mainEntity": content.faqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
      }] : [])
    ]
  }, null, 2);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(content.title)} | Bill Vampire</title>
  <meta name="description" content="${esc(content.metaDescription)}" />
  <link rel="canonical" href="${absoluteUrl(`/cancel/${service.slug}`)}" />
  <meta property="og:title" content="${esc(content.title)}" />
  <meta property="og:description" content="${esc(content.metaDescription)}" />
  <meta property="og:url" content="${absoluteUrl(`/cancel/${service.slug}`)}" />
  <meta property="og:type" content="article" />
  <meta property="og:image" content="${socialImage}" />
  <meta property="og:site_name" content="Bill Vampire" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(content.title)}" />
  <meta name="twitter:description" content="${esc(content.metaDescription)}" />
  <meta name="twitter:image" content="${socialImage}" />
  <link rel="icon" href="/icons/icon.png" type="image/png" />
  <link rel="stylesheet" href="/cancel/cancel-guides.css" />
  <script type="application/ld+json">
${schema}
  </script>
</head>
<body>
  <div class="container">
    <nav class="nav">
      <a href="/"><img src="/icons/icon.png" alt="Bill Vampire" /></a>
      <div class="breadcrumb">
        <a href="/">Bill Vampire</a><span>/</span>
        <a href="/cancel/">Cancel Guides</a><span>/</span>
        <span>${esc(service.name)}</span>
      </div>
    </nav>

    <div class="cta-top">
      <p>Already charged? Stop the renewal first, then use the receipt to check the refund window and support path.</p>
      <a href="${scanUrl}" onclick="trackCancelGuide('cancel_top_scan_clicked')">Check this ${esc(service.name)} charge &rarr;</a>
    </div>

    <h1>${esc(content.title)}</h1>
    <div class="meta">
      <span>&#9200; ${esc(content.timeEstimate)}</span>
      ${diffBadge}
      <span>Last Updated: ${esc(content.lastVerified)}</span>
      ${priceHtml}
      <a class="author-badge" href="/about/" style="background:rgba(16,185,129,0.1); color:#10b981; padding:3px 10px; border-radius:12px; font-weight:600; font-size:10px; border:1px solid rgba(16,185,129,0.2); text-decoration:none;">Reviewed by Bill Vampire Editorial Team</a>
    </div>

    ${content.intro ? `<p style="margin-bottom:24px">${esc(content.intro)}</p>` : ''}
    <p style="margin:-12px 0 24px; font-size:12px; color:#64748B;">Official account or cancellation path <a href="${esc(service.cancelUrl)}" target="_blank" rel="noopener noreferrer" style="color:#10b981;">${esc(service.name)}</a></p>

    ${heroHtml}

    <div class="steps">
    ${stepsHtml}
    </div>

    ${warningsHtml}
    ${refundHtml}
    ${policyImagesHtml}
    ${faqHtml}
    ${sourcesHtml}
    ${relatedHtml}

    <div class="cta-bottom">
      <h3>Already charged for ${esc(service.name)}?</h3>
      <p>Enter the amount and what happened. The free preview organizes the known cancel path, likely refund window, and the evidence to keep before you contact support.</p>
      <form class="kit-form" onsubmit="return startBillVampireKit(event)">
        <label>
          <span>How much are they charging?</span>
          <input name="amount" inputmode="decimal" placeholder="$${service.price === 'varies' ? '119.99' : esc(service.price.replace('$', ''))}" />
        </label>
        <label>
          <span>What is the issue?</span>
          <select name="issue">
            <option value="hard_cancel">Hard to cancel</option>
            <option value="surprise_charge">Already charged / refund</option>
            <option value="trial_ending">Trial ending soon</option>
          </select>
        </label>
        <button class="btn" type="submit">Check my ${esc(service.name)} charge &rarr;</button>
      </form>
      <p class="fine">The preview is free. The optional personalized Emergency Kit is a one-time $4.99 purchase. Or <a href="/">review a bill</a> if you are unsure which charge to handle first.</p>
    </div>

    <script>
      function startBillVampireKit(event) {
        event.preventDefault();
        var form = event.currentTarget;
        trackCancelGuide('cancel_kit_form_submitted', {
          issue_type: form.issue.value || 'hard_cancel',
          amount_entered: !!form.amount.value.trim()
        });
        var params = new URLSearchParams({
          issue: form.issue.value || 'hard_cancel',
          service: ${serviceJson},
          source: 'seo_cancel_page'
        });
        if (form.amount.value.trim()) params.set('amount', form.amount.value.trim());
        window.location.href = '/?' + params.toString() + '#scan';
        return false;
      }
      function trackCancelGuide(event, props) {
        var payload = Object.assign({
          service: ${serviceJson},
          source: 'seo_cancel_page',
          path: location.pathname
        }, props || {});
        try { if (window.gtag) window.gtag('event', event, payload); } catch (e) {}
        try { if (window.posthog && window.posthog.capture) window.posthog.capture(event, payload); } catch (e) {}
      }
      trackCancelGuide('cancel_guide_viewed');
    </script>

    <div class="legal-disclaimer" style="margin: 40px 0 20px; padding: 20px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; font-size: 11px; color: #64748B; line-height: 1.6;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color:#94A3B8;">Independent guidance</p>
      <p style="margin: 0;">Bill Vampire is not a bank or law firm. Cancel paths and merchant policies can change. Contact the merchant first for an ordinary billing problem. Contact your card issuer promptly if you do not recognize a charge or believe it is fraudulent.</p>
    </div>

    <footer class="footer">
      <a href="/cancel/">All Cancel Guides</a>
      <a href="/tools/">Free Tools</a>
      <a href="/">Bill Vampire App</a>
      <a href="${esc(service.cancelUrl)}" target="_blank" rel="noopener">Direct cancel link &rarr;</a>
    </footer>
  </div>
</body>
</html>`;
}

function renderEditorialImage(image, className, eager = false) {
  const loading = eager
    ? 'loading="eager" fetchpriority="high"'
    : 'loading="lazy"';
  const creditHtml = image.credit && image.license
    ? ` Photo by <a href="${esc(image.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(image.credit)}</a>, <a href="${esc(image.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(image.license)}</a>.`
    : '';
  const attributionHtml = image.attribution
    ? ` ${esc(image.attribution)}`
    : '';
  const sourceHtml = image.sourceUrl && !image.credit
    ? ` Source: <a href="${esc(image.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(image.sourceLabel || 'official support page')}</a>.`
    : '';

  return `<figure class="${esc(className)}">
      <img src="${esc(image.src)}" alt="${esc(image.alt)}" width="${esc(image.width || 1280)}" height="${esc(image.height || 853)}" ${loading} decoding="async" />
      <figcaption>${esc(image.caption)}${creditHtml}${attributionHtml}${sourceHtml}</figcaption>
    </figure>`;
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
