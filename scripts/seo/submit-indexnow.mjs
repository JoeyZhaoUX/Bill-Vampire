import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SITE_HOST = 'billvampire.com';
const INDEXNOW_KEY = 'd4e479da8255e328e9c528d50fb5a975';
const KEY_PATH = join(ROOT, `public/${INDEXNOW_KEY}.txt`);
const SITEMAP_PATH = join(ROOT, 'public/sitemap.xml');
const KEY_LOCATION = `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`;
const API_URL = 'https://api.indexnow.org/indexnow';

function argumentValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

export function sitemapEntries(xml) {
  return [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g)]
    .map((match) => ({ url: match[1], lastmod: match[2] }));
}

function explicitUrls() {
  const value = process.env.INDEXNOW_URLS || argumentValue('urls');
  if (!value) return [];
  return value.split(/[\n,]/).map((url) => url.trim()).filter(Boolean);
}

function validateUrls(urls) {
  const unique = [...new Set(urls)];
  if (unique.length === 0) throw new Error('No changed URLs found for IndexNow submission.');
  if (unique.length > 10_000) throw new Error('IndexNow accepts at most 10,000 URLs per request.');

  for (const value of unique) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== SITE_HOST) {
      throw new Error(`IndexNow URL must use https://${SITE_HOST}: ${value}`);
    }
  }
  return unique;
}

async function waitForPublishedKey() {
  const attempts = Number(process.env.INDEXNOW_KEY_CHECK_ATTEMPTS || 30);
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(KEY_LOCATION, { cache: 'no-store' });
      if (response.ok && (await response.text()).trim() === INDEXNOW_KEY) return;
    } catch {}

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
  throw new Error(`IndexNow key was not available at ${KEY_LOCATION}.`);
}

export async function submitIndexNow() {
  const localKey = readFileSync(KEY_PATH, 'utf8').trim();
  if (localKey !== INDEXNOW_KEY) throw new Error('The hosted IndexNow key file does not match the configured key.');

  const since = process.env.INDEXNOW_SINCE || argumentValue('since') || new Date().toISOString().slice(0, 10);
  const fromEnvironment = explicitUrls();
  const entries = sitemapEntries(readFileSync(SITEMAP_PATH, 'utf8'));
  const urls = validateUrls(fromEnvironment.length > 0
    ? fromEnvironment
    : entries.filter((entry) => entry.lastmod >= since).map((entry) => entry.url));

  if (process.env.INDEXNOW_DRY_RUN === '1' || process.argv.includes('--dry-run')) {
    console.log(`IndexNow dry run: ${urls.length} URLs changed on or after ${since}.`);
    for (const url of urls) console.log(url);
    return;
  }

  await waitForPublishedKey();
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: urls,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`IndexNow rejected the request (${response.status}): ${details || response.statusText}`);
  }
  console.log(`IndexNow accepted ${urls.length} changed URLs (${response.status}).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  submitIndexNow().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
