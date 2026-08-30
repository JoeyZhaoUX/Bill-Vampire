import assert from 'node:assert/strict'
import test from 'node:test'

import { deploymentUrlFor, normalizePublishedHtml } from '../../scripts/seo/submit-indexnow.mjs'

const cloudflareChallenge = `<script>(function(){function c(){var b=a.contentDocument;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'abc'};var a=document.createElement('script');a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){c()}})();</script>`

test('IndexNow publication verification ignores only Cloudflare challenge injection', () => {
  const local = '<!doctype html><html><body><main>Current guide copy</main>\n</body></html>'
  const published = `<!doctype html><html><body><main>Current guide copy</main>\n${cloudflareChallenge}</body></html>`

  assert.equal(normalizePublishedHtml(published), normalizePublishedHtml(local))
})

test('IndexNow publication verification still catches real content differences', () => {
  const local = '<!doctype html><html><body><main>Current guide copy</main>\n</body></html>'
  const stale = `<!doctype html><html><body><main>Old guide copy</main>\n${cloudflareChallenge}</body></html>`

  assert.notEqual(normalizePublishedHtml(stale), normalizePublishedHtml(local))
})

test('IndexNow verifies the matching Pages deployment path, not a challenged custom-domain response', () => {
  assert.equal(
    deploymentUrlFor('https://billvampire.com/cancel/how-to-cancel-grammarly?source=test'),
    'https://bill-vampire.pages.dev/cancel/how-to-cancel-grammarly?source=test',
  )
})
