import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SERVICES } from './services.mjs';
import { absoluteUrl } from './url-policy.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const CONTENT_DIR = join(ROOT, 'content/cancel');
const REFUND_CONTENT_PATH = join(ROOT, 'content/refund/guides.json');
const SURVIVAL_CONTENT_PATH = join(ROOT, 'content/survival/guides.json');
const SITEMAP_PATH = join(ROOT, 'public/sitemap.xml');

const SEO_STRUCTURE_UPDATE = '2026-06-28';
const STATIC_URLS = [
  '/', '/about/', '/tools/', '/tools/subscription-cost-calculator',
  '/tools/cancel-subscription-guide', '/tools/free-trial-refund-helper',
  '/tools/cancel-subscription-script-generator', '/tools/rocket-money-alternative-no-bank-login',
  '/refund/', '/terms', '/privacy', '/refund', '/cases/',
  '/cases/how-i-got-119-back-from-forgotten-canva-pro-trial',
  '/cases/how-to-negotiate-adobe-early-termination-fee-refund',
  '/cases/getting-refunded-for-99-dollar-microsoft-365-accidental-renewal',
];

function sitemapEntry(path, lastmod = SEO_STRUCTURE_UPDATE) {
  return `  <url>
    <loc>${absoluteUrl(path)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
}

function latestDate(...dates) {
  return dates.filter(Boolean).sort().at(-1) || SEO_STRUCTURE_UPDATE;
}

export function generateSitemap() {
  let urls = STATIC_URLS.map((path) => sitemapEntry(path));

  // Add cancel hub
  urls.push(sitemapEntry('/cancel/'));

  // Add individual cancel guide pages
  for (const service of SERVICES) {
    const contentPath = join(CONTENT_DIR, `${service.id}.json`);
    if (!existsSync(contentPath)) continue;

    let lastmod = SEO_STRUCTURE_UPDATE;
    try {
      const content = JSON.parse(readFileSync(contentPath, 'utf-8'));
      lastmod = latestDate(content.lastVerified, SEO_STRUCTURE_UPDATE);
    } catch {}

    urls.push(sitemapEntry(`/cancel/${service.slug}`, lastmod));
  }

  if (existsSync(REFUND_CONTENT_PATH)) {
    const refundGuides = JSON.parse(readFileSync(REFUND_CONTENT_PATH, 'utf-8'));
    for (const guide of refundGuides) {
      urls.push(sitemapEntry(`/refund/${guide.slug}`, guide.lastVerified || SEO_STRUCTURE_UPDATE));
    }
  }

  if (existsSync(SURVIVAL_CONTENT_PATH)) {
    const survivalThemes = JSON.parse(readFileSync(SURVIVAL_CONTENT_PATH, 'utf-8')).themes || [];
    urls.push(sitemapEntry('/survival/'));

    for (const theme of survivalThemes) {
      urls.push(sitemapEntry(`/survival/${theme.slug}/`));

      for (const item of theme.articles || []) {
        const article = Array.isArray(item) ? { slug: item[0] } : item
        urls.push(sitemapEntry(`/survival/${theme.slug}/${article.slug}`));
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
