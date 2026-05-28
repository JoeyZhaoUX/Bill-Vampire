export function renderCancelPage(service, content, allServices) {
  const related = service.related
    .map(id => allServices.find(s => s.id === id))
    .filter(Boolean);

  const diffBadge = `<span class="badge badge-${service.difficulty}">${service.difficulty}</span>`;

  const stepsHtml = content.steps.map((step, i) => {
    const tipHtml = step.tip ? `<div class="tip">${esc(step.tip)}</div>` : '';
    const html = `<div class="step">
      <h3>${esc(step.title)}</h3>
      <p>${esc(step.text)}</p>
      ${tipHtml}
    </div>`;
    if (i === 2) {
      return html + `
    <div class="cta-inline">
      <p>Need the exact words to say if they try to keep you?</p>
      <a href="/tools/cancel-subscription-script-generator.html?service=${encodeURIComponent(service.name)}">Generate your cancel script free &rarr;</a>
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
        ${related.map(r => `<a class="related-link" href="/cancel/${r.slug}.html">${r.name} <span class="arrow">&rarr;</span></a>`).join('\n        ')}
      </div>
    </div>`
    : '';
  const serviceJson = JSON.stringify(service.name);

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        "name": content.title,
        "description": content.metaDescription,
        "totalTime": `PT${parseInt(content.timeEstimate) || 5}M`,
        "step": content.steps.map((s, i) => ({
          "@type": "HowToStep",
          "position": i + 1,
          "name": s.title,
          "text": s.text,
          "url": `https://billvampire.com/cancel/${service.slug}.html#step-${i + 1}`
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
  <link rel="canonical" href="https://billvampire.com/cancel/${service.slug}.html" />
  <meta property="og:title" content="${esc(content.title)}" />
  <meta property="og:description" content="${esc(content.metaDescription)}" />
  <meta property="og:url" content="https://billvampire.com/cancel/${service.slug}.html" />
  <meta property="og:type" content="article" />
  <meta property="og:image" content="https://billvampire.com/og-image.svg" />
  <meta property="og:site_name" content="Bill Vampire" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(content.title)}" />
  <meta name="twitter:description" content="${esc(content.metaDescription)}" />
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
      <p>Tired of canceling one by one? Upload your bill and let Bill Vampire find ALL hidden charges.</p>
      <a href="/?source=seo_cancel_top#scan" onclick="trackCancelGuide('cancel_top_scan_clicked')">Scan my bill free &rarr;</a>
    </div>

    <h1>${esc(content.title)}</h1>
    <div class="meta">
      <span>&#9200; ${esc(content.timeEstimate)}</span>
      ${diffBadge}
      <span>Verified ${esc(content.lastVerified)}</span>
      ${service.price !== 'varies' ? `<span>${esc(service.price)}</span>` : ''}
    </div>

    ${content.intro ? `<p style="margin-bottom:24px">${esc(content.intro)}</p>` : ''}

    <div class="steps">
    ${stepsHtml}
    </div>

    ${warningsHtml}
    ${refundHtml}
    ${faqHtml}
    ${relatedHtml}

    <div class="cta-bottom">
      <h3>Still stuck? Build your ${esc(service.name)} case preview</h3>
      <p>Free: refund window, cancel path, support angle, next moves, download, and optional account save. Upgrade only if you want the exact scripts and dispute checklist.</p>
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
        <button class="btn" type="submit">Build my ${esc(service.name)} preview &rarr;</button>
      </form>
      <p class="fine">Or <a href="/">scan your entire bill free</a> to find every subscription draining your account.</p>
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

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
