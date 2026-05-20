// Lightweight funnel tracker. Emits to gtag (always available — GA is loaded in index.html)
// and to PostHog if its snippet has been injected. Fails silently if neither is loaded
// (ad-blockers, offline, SSR). Add a `window.__debugAnalytics = true` in devtools to log.

export function track(event, props = {}) {
  const payload = sanitize(props);
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', event, payload);
    }
  } catch { /* ignore */ }
  try {
    if (typeof window !== 'undefined' && window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture(event, payload);
    }
  } catch { /* ignore */ }
  if (typeof window !== 'undefined' && window.__debugAnalytics) {
    console.log('[track]', event, payload);
  }
}

function sanitize(props) {
  const out = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'number' && !Number.isFinite(v)) continue;
    out[k] = v;
  }
  return out;
}
