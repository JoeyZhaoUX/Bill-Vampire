import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative, sep } from 'node:path'
import test from 'node:test'

const ROOT = new URL('../..', import.meta.url)
const PUBLIC_DIR = new URL('../../public/', import.meta.url)
const SRC_DIR = new URL('../../src/', import.meta.url)
const SITE_ORIGIN = 'https://billvampire.com'
const EXCLUDED_HTML = new Set(['404.html', 'bridge.html'])

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

function publicRouteForFile(file) {
  const path = relative(PUBLIC_DIR.pathname, file).split(sep).join('/')
  if (path === 'index.html') return '/'
  if (path.endsWith('/index.html')) return `/${path.slice(0, -'index.html'.length)}`
  return `/${path.slice(0, -extname(path).length)}`
}

function tagAttribute(html, tagPattern, attribute) {
  const tag = html.match(tagPattern)?.[0]
  return tag?.match(new RegExp(`${attribute}=["']([^"']+)["']`, 'i'))?.[1] ?? null
}

function indexableHtmlFiles() {
  return walk(PUBLIC_DIR.pathname).filter(
    (file) => extname(file) === '.html' && !EXCLUDED_HTML.has(relative(PUBLIC_DIR.pathname, file)),
  )
}

test('sitemap contains only unique clean canonical URLs', () => {
  const sitemap = readFileSync(new URL('../../public/sitemap.xml', import.meta.url), 'utf8')
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

  assert.equal(new Set(urls).size, urls.length, 'sitemap contains duplicate URLs')
  assert.equal(
    urls.filter((url) => url.startsWith(SITE_ORIGIN) && url.endsWith('.html')).length,
    0,
    'sitemap must not contain Cloudflare redirecting .html URLs',
  )
})

test('every indexable HTML file has one clean self-canonical and matching og:url', () => {
  const failures = []

  for (const file of indexableHtmlFiles()) {
    const html = readFileSync(file, 'utf8')
    const expected = `${SITE_ORIGIN}${publicRouteForFile(file)}`
    const canonical = tagAttribute(html, /<link\b[^>]*rel=["']canonical["'][^>]*>/i, 'href')
      ?? tagAttribute(html, /<link\b[^>]*href=["'][^"']+["'][^>]*rel=["']canonical["'][^>]*>/i, 'href')
    const ogUrl = tagAttribute(html, /<meta\b[^>]*property=["']og:url["'][^>]*>/i, 'content')

    if (canonical !== expected) failures.push(`${relative(ROOT.pathname, file)} canonical=${canonical} expected=${expected}`)
    if (ogUrl && ogUrl !== expected) failures.push(`${relative(ROOT.pathname, file)} og:url=${ogUrl} expected=${expected}`)
  }

  assert.deepEqual(failures, [])
})

test('public HTML does not link internally to redirecting .html routes', () => {
  const failures = []

  for (const file of indexableHtmlFiles()) {
    const html = readFileSync(file, 'utf8')
    for (const match of html.matchAll(/href=["'](\/[^"'?#]+\.html)(?:[?#][^"']*)?["']/gi)) {
      failures.push(`${relative(ROOT.pathname, file)} -> ${match[1]}`)
    }
  }

  assert.deepEqual(failures, [])
})

test('runtime source does not emit internal .html routes', () => {
  const failures = []
  const sourceFiles = walk(SRC_DIR.pathname).filter((file) => ['.js', '.jsx'].includes(extname(file)))

  for (const file of sourceFiles) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/["'`](\/[^"'`?#]+\.html)(?:[?#][^"'`]*)?["'`]/gi)) {
      failures.push(`${relative(ROOT.pathname, file)} -> ${match[1]}`)
    }
  }

  assert.deepEqual(failures, [])
})

test('structured data uses clean URLs and no unsupported aggregate rating', () => {
  const failures = []

  for (const file of [new URL('../../index.html', import.meta.url).pathname, ...indexableHtmlFiles()]) {
    const html = readFileSync(file, 'utf8')
    const jsonLd = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
      .map((match) => match[1])
      .join('\n')

    if (/https:\/\/billvampire\.com\/[^"'\s<]+\.html(?:[#?][^"'\s<]*)?/i.test(jsonLd)) {
      failures.push(`${relative(ROOT.pathname, file)} contains a .html URL in JSON-LD`)
    }
    if (/"aggregateRating"\s*:/i.test(jsonLd)) {
      failures.push(`${relative(ROOT.pathname, file)} contains unsupported aggregateRating`)
    }
  }

  assert.deepEqual(failures, [])
})

test('refund policy and refund guide hub remain distinct canonical routes', () => {
  const policy = readFileSync(new URL('../../public/refund-policy.html', import.meta.url), 'utf8')
  const hub = readFileSync(new URL('../../public/refund/index.html', import.meta.url), 'utf8')

  assert.match(policy, /rel=["']canonical["'][^>]*href=["']https:\/\/billvampire\.com\/refund-policy["']/)
  assert.match(hub, /rel=["']canonical["'][^>]*href=["']https:\/\/billvampire\.com\/refund\/["']/)
})

test('legacy /refund URL is not present in sitemap and only reachable via redirect', () => {
  const sitemap = readFileSync(new URL('../../public/sitemap.xml', import.meta.url), 'utf8')
  assert.doesNotMatch(sitemap, /<loc>https:\/\/billvampire\.com\/refund<\/loc>/)

  const redirects = readFileSync(new URL('../../public/_redirects', import.meta.url), 'utf8')
  assert.match(redirects, /^\/refund\s+\/refund-policy\s+301/m)
})
