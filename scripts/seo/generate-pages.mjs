import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SERVICES } from './services.mjs';
import { renderCancelPage } from './templates/cancel-page.mjs';
import { renderCancelHub } from './templates/cancel-hub.mjs';
import { generateRefundPages } from './generate-refund-pages.mjs';
import { generateRefundStatsPages } from './generate-refund-stats-pages.mjs';
import { generateSurvivalPages } from './generate-survival-pages.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const CONTENT_DIR = join(ROOT, 'content/cancel');
const OUTPUT_DIR = join(ROOT, 'public/cancel');

let generated = 0;
let skipped = 0;

for (const service of SERVICES) {
  const contentPath = join(CONTENT_DIR, `${service.id}.json`);
  if (!existsSync(contentPath)) {
    console.log(`  skip: ${service.id} (no content JSON)`);
    skipped++;
    continue;
  }

  const content = JSON.parse(readFileSync(contentPath, 'utf-8'));
  const html = renderCancelPage(service, content, SERVICES);
  const outPath = join(OUTPUT_DIR, `${service.slug}.html`);
  writeFileSync(outPath, html);
  generated++;
}

// Generate hub page
const hubHtml = renderCancelHub(SERVICES);
writeFileSync(join(OUTPUT_DIR, 'index.html'), hubHtml);

console.log(`\n✓ Generated ${generated} cancel guide pages (${skipped} skipped — no content)`);
console.log(`✓ Generated hub page at /cancel/index.html`);
generateRefundPages();
generateRefundStatsPages();
generateSurvivalPages();

// Regenerate sitemap
const { generateSitemap } = await import('./generate-sitemap.mjs');
generateSitemap();
