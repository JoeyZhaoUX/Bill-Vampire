import { pathToFileURL } from 'node:url'

function extractAttribute(html, tagPattern, attribute) {
  const tag = html.match(tagPattern)?.[0]
  return tag?.match(new RegExp(`${attribute}=["']([^"']+)["']`, 'i'))?.[1] ?? null
}

function legacyUrlFor(url) {
  const legacy = new URL(url)
  if (legacy.pathname === '/') return null
  legacy.pathname = legacy.pathname.endsWith('/')
    ? `${legacy.pathname}index.html`
    : `${legacy.pathname}.html`
  return legacy
}

async function checkPage(url, fetchImpl) {
  const errors = []
  const response = await fetchImpl(url, { redirect: 'manual', headers: { 'user-agent': 'BillVampireSeoAudit/1.0' } })
  if (response.status !== 200) {
    errors.push(`${url} must return 200, received ${response.status}`)
    return errors
  }

  const html = await response.text()
  const canonical = extractAttribute(html, /<link\b[^>]*rel=["']canonical["'][^>]*>/i, 'href')
    ?? extractAttribute(html, /<link\b[^>]*href=["'][^"']+["'][^>]*rel=["']canonical["'][^>]*>/i, 'href')
  const ogUrl = extractAttribute(html, /<meta\b[^>]*property=["']og:url["'][^>]*>/i, 'content')

  if (canonical !== url) errors.push(`${url} canonical=${canonical} expected=${url}`)
  if (ogUrl && ogUrl !== url) errors.push(`${url} og:url=${ogUrl} expected=${url}`)
  return errors
}

async function checkLegacyRedirect(url, fetchImpl) {
  const legacy = legacyUrlFor(url)
  if (!legacy) return []

  legacy.searchParams.set('seo_audit', '1')
  const expected = new URL(url)
  expected.search = legacy.search
  const response = await fetchImpl(legacy, { redirect: 'manual', headers: { 'user-agent': 'BillVampireSeoAudit/1.0' } })
  const location = response.headers.get('location')
  const destination = location ? new URL(location, legacy) : null
  if (![301, 308].includes(response.status)) {
    return [`${legacy} must redirect once to ${expected}, received ${response.status}`]
  }
  if (destination?.href !== expected.href) {
    return [`${legacy} must preserve query parameters and redirect to ${expected}, received ${destination?.href ?? 'no location'}`]
  }
  return []
}

async function inBatches(items, size, task) {
  const results = []
  for (let index = 0; index < items.length; index += size) {
    results.push(...await Promise.all(items.slice(index, index + size).map(task)))
  }
  return results.flat()
}

const EXTRA_REDIRECTS = [
  ['/refund', '/refund-policy'],
  ['/refund.html', '/refund-policy'],
]

async function checkExtraRedirect(base, [from, to], fetchImpl) {
  const source = new URL(`${base}${from}`)
  const expected = new URL(`${base}${to}`)
  const response = await fetchImpl(source, { redirect: 'manual', headers: { 'user-agent': 'BillVampireSeoAudit/1.0' } })
  const location = response.headers.get('location')
  const destination = location ? new URL(location, source) : null
  if (![301, 308].includes(response.status)) {
    return [`${source} must redirect once to ${expected}, received ${response.status}`]
  }
  if (destination?.href !== expected.href) {
    return [`${source} must redirect to ${expected}, received ${destination?.href ?? 'no location'}`]
  }
  return []
}

export async function auditLiveSite(origin = 'https://billvampire.com', fetchImpl = fetch) {
  const base = origin.replace(/\/+$/, '')
  const errors = []
  const sitemapResponse = await fetchImpl(`${base}/sitemap.xml`, {
    redirect: 'manual',
    headers: { 'user-agent': 'BillVampireSeoAudit/1.0' },
  })

  if (sitemapResponse.status !== 200) {
    return { urlsChecked: 0, errors: [`${base}/sitemap.xml must return 200, received ${sitemapResponse.status}`] }
  }

  const sitemap = await sitemapResponse.text()
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  const unique = new Set(urls)
  if (unique.size !== urls.length) errors.push('sitemap contains duplicate URLs')

  for (const url of urls) {
    if (!url.startsWith(`${base}/`) && url !== `${base}/`) errors.push(`${url} is outside ${base}`)
    if (new URL(url).pathname.endsWith('.html')) errors.push(`${url} is a redirecting .html URL`)
  }

  errors.push(...await inBatches(urls, 12, (url) => checkPage(url, fetchImpl)))
  errors.push(...await inBatches(urls.filter((url) => !new URL(url).pathname.endsWith('.html')), 12, (url) => checkLegacyRedirect(url, fetchImpl)))
  errors.push(...await inBatches(EXTRA_REDIRECTS, 12, (pair) => checkExtraRedirect(base, pair, fetchImpl)))

  return { urlsChecked: urls.length, errors }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const origin = process.argv[2] || 'https://billvampire.com'
  const result = await auditLiveSite(origin)
  console.log(`Checked ${result.urlsChecked} sitemap URLs at ${origin}`)
  if (result.errors.length) {
    for (const error of result.errors) console.error(`- ${error}`)
    process.exitCode = 1
  } else {
    console.log('Live SEO audit passed')
  }
}
