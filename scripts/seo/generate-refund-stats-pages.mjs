import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { renderRefundStatsHub, renderRefundStatsPage } from './templates/refund-stats-page.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const CONTENT_PATH = join(ROOT, 'content/refund/intelligence.seed.json')
const OUTPUT_DIR = join(ROOT, 'public/refund-stats')

function slugFor(entry) {
  const slugify = (value) =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  return `${slugify(entry.service)}-${slugify(entry.charge_type)}-success-rate`
}

export function generateRefundStatsPages() {
  if (!existsSync(CONTENT_PATH)) {
    console.log('  skip: no refund intelligence seed JSON')
    return []
  }

  mkdirSync(OUTPUT_DIR, { recursive: true })
  const entries = JSON.parse(readFileSync(CONTENT_PATH, 'utf-8'))

  for (const entry of entries) {
    const html = renderRefundStatsPage(entry, entries)
    writeFileSync(join(OUTPUT_DIR, `${slugFor(entry)}.html`), html)
  }

  writeFileSync(join(OUTPUT_DIR, 'index.html'), renderRefundStatsHub(entries))
  console.log(`✓ Generated ${entries.length} refund success-rate pages`)
  console.log('✓ Generated refund-stats hub page at /refund-stats/index.html')
  return entries
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateRefundStatsPages()
}
