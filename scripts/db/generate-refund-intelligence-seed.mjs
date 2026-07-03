// Generates a .sql file from content/refund/intelligence.seed.json for `wrangler d1 execute`.
// INSERT OR IGNORE so re-running never clobbers rows already updated by real case_outcomes
// (see scripts/db/aggregate-refund-outcomes.mjs, which owns updates once sample_count > 0).
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const SEED_PATH = join(ROOT, 'content/refund/intelligence.seed.json')
const OUTPUT_PATH = join(ROOT, 'migrations/seed_refund_intelligence.sql')

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL'
  return `'${String(value).replace(/'/g, "''")}'`
}

export function generateSeedSql() {
  const rows = JSON.parse(readFileSync(SEED_PATH, 'utf-8'))
  const statements = rows.map((row) => {
    const id = crypto.randomUUID()
    const contactsJson = JSON.stringify(row.working_contacts_json || {})
    return `INSERT OR IGNORE INTO refund_intelligence (id, service, charge_type, best_path, success_rate, sample_count, avg_days_to_refund, refund_window_days, working_contacts_json, is_seed_estimate) VALUES (${sqlString(id)}, ${sqlString(row.service)}, ${sqlString(row.charge_type)}, ${sqlString(row.best_path)}, ${row.success_rate ?? 'NULL'}, 0, ${row.avg_days_to_refund ?? 'NULL'}, ${row.refund_window_days ?? 'NULL'}, ${sqlString(contactsJson)}, 1);`
  })
  writeFileSync(OUTPUT_PATH, statements.join('\n') + '\n')
  console.log(`✓ Wrote ${statements.length} seed rows to ${OUTPUT_PATH}`)
  console.log('  Apply with: wrangler d1 execute bill-vampire-prod --remote --file=./migrations/seed_refund_intelligence.sql')
  return statements.length
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateSeedSql()
}
