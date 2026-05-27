import { readdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SERVICES } from './services.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const CONTENT_DIR = join(ROOT, 'content/cancel');
const REFUND_CONTENT_PATH = join(ROOT, 'content/refund/guides.json');
const SITEMAP_PATH = join(ROOT, 'public/sitemap.xml');

const STATIC_URLS = [
  { loc: 'https://billvampire.com/', priority: '1.0', freq: 'weekly' },
  { loc: 'https://billvampire.com/tools/', priority: '0.6', freq: 'monthly' },
  { loc: 'https://billvampire.com/tools/subscription-cost-calculator.html', priority: '0.7', freq: 'monthly' },
  { loc: 'https://billvampire.com/tools/cancel-subscription-guide.html', priority: '0.7', freq: 'monthly' },
  { loc: 'https://billvampire.com/tools/free-trial-refund-helper.html', priority: '0.8', freq: 'weekly' },
  { loc: 'https://billvampire.com/tools/cancel-subscription-script-generator.html', priority: '0.8', freq: 'weekly' },
  { loc: 'https://billvampire.com/tools/rocket-money-alternative-no-bank-login.html', priority: '0.8', freq: 'weekly' },
  { loc: 'https://billvampire.com/refund/', priority: '0.8', freq: 'weekly' },
  { loc: 'https://billvampire.com/terms.html', priority: '0.3', freq: 'monthly' },
  { loc: 'https://billvampire.com/privacy.html', priority: '0.3', freq: 'monthly' },
  { loc: 'https://billvampire.com/refund.html', priority: '0.3', freq: 'monthly' },
];

export function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  let urls = STATIC_URLS.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`);

  // Add cancel hub
  urls.push(`  <url>
    <loc>https://billvampire.com/cancel/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);

  // Add individual cancel guide pages
  for (const service of SERVICES) {
    const contentPath = join(CONTENT_DIR, `${service.id}.json`);
    if (!existsSync(contentPath)) continue;

    let lastmod = today;
    try {
      const content = JSON.parse(readFileSync(contentPath, 'utf-8'));
      if (content.lastVerified) lastmod = content.lastVerified;
    } catch {}

    urls.push(`  <url>
    <loc>https://billvampire.com/cancel/${service.slug}.html</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  if (existsSync(REFUND_CONTENT_PATH)) {
    const refundGuides = JSON.parse(readFileSync(REFUND_CONTENT_PATH, 'utf-8'));
    for (const guide of refundGuides) {
      urls.push(`  <url>
    <loc>https://billvampire.com/refund/${guide.slug}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
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
