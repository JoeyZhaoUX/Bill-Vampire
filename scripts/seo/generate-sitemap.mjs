import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SERVICES } from './services.mjs';
import { absoluteUrl } from './url-policy.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const CONTENT_DIR = join(ROOT, 'content/cancel');
const REFUND_CONTENT_PATH = join(ROOT, 'content/refund/guides.json');
const REFUND_STATS_CONTENT_PATH = join(ROOT, 'content/refund/intelligence.seed.json');
const SURVIVAL_CONTENT_PATH = join(ROOT, 'content/survival/guides.json');
const SITEMAP_PATH = join(ROOT, 'public/sitemap.xml');

const BASELINE_LASTMOD = '2026-06-28';
const SITE_CONTENT_UPDATE = '2026-08-30';
const CANCEL_TEMPLATE_UPDATE = SITE_CONTENT_UPDATE;
const SURVIVAL_TEMPLATE_UPDATE = SITE_CONTENT_UPDATE;
const TOOL_CONTENT_UPDATE = '2026-08-25';
const STATIC_URLS = [
  { path: '/', lastmod: SITE_CONTENT_UPDATE },
  { path: '/about/' },
  { path: '/tools/', lastmod: TOOL_CONTENT_UPDATE },
  { path: '/tools/subscription-cost-calculator', lastmod: TOOL_CONTENT_UPDATE },
  { path: '/tools/cancel-subscription-guide', lastmod: TOOL_CONTENT_UPDATE },
  { path: '/tools/free-trial-refund-helper', lastmod: TOOL_CONTENT_UPDATE },
  { path: '/tools/cancel-subscription-script-generator', lastmod: TOOL_CONTENT_UPDATE },
  { path: '/tools/rocket-money-alternative-no-bank-login', lastmod: TOOL_CONTENT_UPDATE },
  { path: '/refund/' },
  { path: '/terms' },
  { path: '/privacy' },
  { path: '/refund-policy' },
  { path: '/cases/' },
  { path: '/cases/how-i-got-119-back-from-forgotten-canva-pro-trial' },
  { path: '/cases/how-to-negotiate-adobe-early-termination-fee-refund' },
  { path: '/cases/getting-refunded-for-99-dollar-microsoft-365-accidental-renewal' },
];

function sitemapEntry(path, lastmod = BASELINE_LASTMOD) {
  return `  <url>
    <loc>${absoluteUrl(path)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
}

function latestDate(...dates) {
  return dates.filter(Boolean).sort().at(-1) || BASELINE_LASTMOD;
}

function refundStatsSlugFor(entry) {
  const slugify = (value) =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  return `${slugify(entry.service)}-${slugify(entry.charge_type)}-success-rate`;
}

export function generateSitemap() {
  let urls = STATIC_URLS.map((entry) => sitemapEntry(entry.path, entry.lastmod));

  // Add cancel hub
  urls.push(sitemapEntry('/cancel/', CANCEL_TEMPLATE_UPDATE));

  // Add individual cancel guide pages
  for (const service of SERVICES) {
    const contentPath = join(CONTENT_DIR, `${service.id}.json`);
    if (!existsSync(contentPath)) continue;

    let lastmod = CANCEL_TEMPLATE_UPDATE;
    try {
      const content = JSON.parse(readFileSync(contentPath, 'utf-8'));
      lastmod = latestDate(content.lastVerified, CANCEL_TEMPLATE_UPDATE);
    } catch {}

    urls.push(sitemapEntry(`/cancel/${service.slug}`, lastmod));
  }

  if (existsSync(REFUND_CONTENT_PATH)) {
    const refundGuides = JSON.parse(readFileSync(REFUND_CONTENT_PATH, 'utf-8'));
    for (const guide of refundGuides) {
      urls.push(sitemapEntry(`/refund/${guide.slug}`, guide.lastVerified || BASELINE_LASTMOD));
    }
  }

  if (existsSync(REFUND_STATS_CONTENT_PATH)) {
    const refundStatsEntries = JSON.parse(readFileSync(REFUND_STATS_CONTENT_PATH, 'utf-8'));
    urls.push(sitemapEntry('/refund-stats/'));
    for (const entry of refundStatsEntries) {
      urls.push(sitemapEntry(`/refund-stats/${refundStatsSlugFor(entry)}`));
    }
  }

  if (existsSync(SURVIVAL_CONTENT_PATH)) {
    const survivalThemes = JSON.parse(readFileSync(SURVIVAL_CONTENT_PATH, 'utf-8')).themes || [];
    urls.push(sitemapEntry('/survival/', SURVIVAL_TEMPLATE_UPDATE));

    for (const theme of survivalThemes) {
      urls.push(sitemapEntry(`/survival/${theme.slug}/`, SURVIVAL_TEMPLATE_UPDATE));

      for (const item of theme.articles || []) {
        const article = Array.isArray(item) ? { slug: item[0] } : item
        urls.push(sitemapEntry(`/survival/${theme.slug}/${article.slug}`, SURVIVAL_TEMPLATE_UPDATE));
      }
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  writeFileSync(SITEMAP_PATH, sitemap);
  console.log(`✓ Sitemap updated with ${urls.length} URLs`);
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap();
}
