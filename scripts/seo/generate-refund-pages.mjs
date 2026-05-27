import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { SERVICES } from './services.mjs'
import { renderRefundHub, renderRefundPage } from './templates/refund-page.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const CONTENT_PATH = join(ROOT, 'content/refund/guides.json')
const OUTPUT_DIR = join(ROOT, 'public/refund')

export function generateRefundPages() {
  if (!existsSync(CONTENT_PATH)) {
    console.log('  skip: no refund guides JSON')
    return []
  }

  mkdirSync(OUTPUT_DIR, { recursive: true })
  const guides = JSON.parse(readFileSync(CONTENT_PATH, 'utf-8'))

  for (const guide of guides) {
    const html = renderRefundPage(guide, SERVICES)
    writeFileSync(join(OUTPUT_DIR, `${guide.slug}.html`), html)
  }

  writeFileSync(join(OUTPUT_DIR, 'index.html'), renderRefundHub(guides))
  console.log(`✓ Generated ${guides.length} refund guide pages`)
  console.log('✓ Generated refund hub page at /refund/index.html')
  return guides
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateRefundPages()
}
