import assert from 'node:assert/strict'
import test from 'node:test'

import { auditLiveSite } from '../../scripts/seo/audit-live.mjs'

function response(body = '', init = {}) {
  return new Response(body, init)
}

test('live audit accepts clean pages and one-hop legacy redirects', async () => {
  const origin = 'https://example.test'
  const routes = new Map([
    [`${origin}/sitemap.xml`, response(`<?xml version="1.0"?><urlset><url><loc>${origin}/guide</loc></url></urlset>`, { status: 200 })],
    [`${origin}/guide`, response(`<link rel="canonical" href="${origin}/guide"><meta property="og:url" content="${origin}/guide">`, { status: 200 })],
    [`${origin}/guide.html`, response('', { status: 308, headers: { location: '/guide' } })],
  ])
  const fetchImpl = async (url) => routes.get(String(url)) ?? response('', { status: 404 })

  const result = await auditLiveSite(origin, fetchImpl)

  assert.equal(result.urlsChecked, 1)
  assert.deepEqual(result.errors, [])
})

test('live audit reports redirecting sitemap URLs and canonical mismatches', async () => {
  const origin = 'https://example.test'
  const routes = new Map([
    [`${origin}/sitemap.xml`, response(`<?xml version="1.0"?><urlset><url><loc>${origin}/bad.html</loc></url></urlset>`, { status: 200 })],
    [`${origin}/bad.html`, response('', { status: 308, headers: { location: '/bad' } })],
  ])
  const fetchImpl = async (url) => routes.get(String(url)) ?? response('', { status: 404 })

  const result = await auditLiveSite(origin, fetchImpl)

  assert.ok(result.errors.some((error) => error.includes('redirecting .html URL')))
  assert.ok(result.errors.some((error) => error.includes('must return 200')))
})
