import { CATEGORIES } from '../services.mjs';
import { absoluteUrl } from '../url-policy.mjs';

export function renderCancelHub(services) {
  const grouped = {};
  for (const s of services) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }

  const categorySections = Object.entries(CATEGORIES)
    .filter(([key]) => grouped[key] && grouped[key].length > 0)
    .map(([key, cat]) => {
      const cards = grouped[key].map(s =>
        `<a class="service-card" href="/cancel/${s.slug}" data-name="${esc(s.name.toLowerCase())}">
          <div>
            <span class="name">${esc(s.name)}</span>
            ${s.price !== 'varies' ? `<span class="price">${esc(s.price)}</span>` : ''}
          </div>
          <span class="arrow">&rarr;</span>
        </a>`
      ).join('\n        ');
      return `<section class="category-section">
      <h2>${cat.icon} ${esc(cat.label)}</h2>
      <div class="service-grid">
        ${cards}
      </div>
    </section>`;
    }).join('\n    ');

  const totalServices = services.length;

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "name": "How to Cancel Any Subscription — Complete Guide Directory",
        "description": `Step-by-step cancellation guides for ${totalServices}+ popular subscription services.`,
        "numberOfItems": totalServices,
        "itemListElement": services.map((s, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": `How to Cancel ${s.name}`,
          "url": absoluteUrl(`/cancel/${s.slug}`)
        }))
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Bill Vampire", "item": "https://billvampire.com/" },
          { "@type": "ListItem", "position": 2, "name": "Cancel Guides" }
        ]
      }
    ]
  }, null, 2);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>How to Cancel Any Subscription — ${totalServices}+ Step-by-Step Guides | Bill Vampire</title>
  <meta name="description" content="Step-by-step cancellation guides for ${totalServices}+ popular subscriptions. Netflix, Spotify, Adobe, ChatGPT, and more. No-BS instructions that actually work." />
  <link rel="canonical" href="https://billvampire.com/cancel/" />
  <meta property="og:title" content="How to Cancel Any Subscription — ${totalServices}+ Guides" />
  <meta property="og:description" content="Step-by-step cancellation guides for popular subscriptions. No-BS instructions that actually work." />
  <meta property="og:url" content="https://billvampire.com/cancel/" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://billvampire.com/og-image.svg" />
  <meta property="og:site_name" content="Bill Vampire" />
  <meta name="twitter:card" content="summary_large_image" />
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
        <span>Cancel Guides</span>
      </div>
    </nav>

    <div class="cta-top">
      <p>Tired of canceling one by one? Upload your bill and let Bill Vampire find ALL hidden charges.</p>
      <a href="/">Scan my bill free &rarr;</a>
    </div>

    <h1>How to Cancel Any Subscription</h1>
    <p class="hub-intro">No-BS, step-by-step cancellation guides for ${totalServices}+ popular services. Each guide includes the direct cancel link, exact steps, refund info, and what to watch out for.</p>

    <input type="text" class="search-box" placeholder="Search services (e.g. Netflix, Adobe, ChatGPT)..." id="search" autocomplete="off" />
    <div class="no-results" id="no-results">No matching services found.</div>

    ${categorySections}

    <div class="cta-bottom">
      <h3>Found all the subscriptions draining your wallet?</h3>
      <p>Upload a billing email or screenshot. Bill Vampire scans it and builds your cancel + refund plan in 60 seconds.</p>
      <a class="btn" href="/">Scan my bill free &rarr;</a>
      <p class="fine">Or try our <a href="/tools/cancel-subscription-script-generator">cancel script generator</a> for the exact words to say.</p>
    </div>

    <footer class="footer">
      <a href="/">Bill Vampire App</a>
      <a href="/tools/">Free Tools</a>
      <a href="/tools/cancel-subscription-guide">Quick Cancel Links</a>
    </footer>
  </div>

  <script>
    const search = document.getElementById('search');
    const cards = document.querySelectorAll('.service-card');
    const noResults = document.getElementById('no-results');
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase().trim();
      let visible = 0;
      cards.forEach(card => {
        const match = !q || card.dataset.name.includes(q);
        card.classList.toggle('hidden', !match);
        if (match) visible++;
      });
      noResults.classList.toggle('show', visible === 0);
    });
  </script>
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
