# Bill Vampire — Weekly Digest Worker

Standalone Cloudflare Worker that sends the Sunday Vampire Report to every
subscriber in the shared `EMAIL_LIST` KV namespace. Lives outside the Pages
project because Cloudflare Pages does not support cron triggers.

## One-time setup

```bash
cd workers/weekly-digest
npm install

# 1. Paste the real EMAIL_LIST namespace id into wrangler.toml
#    (the same id bound to the Pages project).

# 2. Put secrets
wrangler secret put RESEND_API_KEY
wrangler secret put DIGEST_ADMIN_KEY   # any long random string, for /run

# 3. Deploy
wrangler deploy
```

Cron `0 9 * * 0` (Sunday 09:00 UTC) is declared in `wrangler.toml` and
registers automatically on `wrangler deploy`.

## Manual test

```bash
curl -H "Authorization: Bearer <DIGEST_ADMIN_KEY>" \
  https://bill-vampire-weekly-digest.<account>.workers.dev/run
```

Returns `{ "sent": n, "failed": n }`.
