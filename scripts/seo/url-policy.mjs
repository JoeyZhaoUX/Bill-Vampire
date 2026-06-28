export const SITE_ORIGIN = 'https://billvampire.com'

export function cleanPath(value = '/') {
  const input = String(value)
  const match = input.match(/^([^?#]*)([?#].*)?$/)
  let pathname = match?.[1] || '/'
  const suffix = match?.[2] || ''

  if (!pathname.startsWith('/')) pathname = `/${pathname}`
  if (pathname === '/index.html') pathname = '/'
  else if (pathname.endsWith('/index.html')) pathname = pathname.slice(0, -'index.html'.length)
  else if (pathname.endsWith('.html')) pathname = pathname.slice(0, -'.html'.length)

  return `${pathname}${suffix}`
}

export function cleanInternalUrl(value) {
  const input = String(value)
  if (input.startsWith('/')) return cleanPath(input)
  if (!input.startsWith(SITE_ORIGIN)) return input

  const url = new URL(input)
  return `${SITE_ORIGIN}${cleanPath(`${url.pathname}${url.search}${url.hash}`)}`
}

export function absoluteUrl(path = '/') {
  const clean = cleanInternalUrl(path)
  if (clean.startsWith(SITE_ORIGIN)) return clean
  return `${SITE_ORIGIN}${cleanPath(clean)}`
}
