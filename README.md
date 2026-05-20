# Bill Vampire

Bill Vampire is a no-bank-login subscription Emergency Kit. Users can paste, upload, or speak one subscription problem, preview the detected risk, and unlock a one-time cancel/refund kit.

## Local Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Cloudflare Setup

The app uses Cloudflare Pages Functions, D1, and KV. Guest mode works without D1, but accounts and cloud sync require the database binding.

1. Create and bind D1:

```bash
wrangler d1 create bill-vampire-prod
wrangler d1 migrations apply bill-vampire-prod --remote
```

Then uncomment `[[d1_databases]]` in `wrangler.toml` and paste the returned `database_id`.

2. Configure required Pages secrets:

```bash
wrangler pages secret put AUTH_SESSION_SECRET
wrangler pages secret put GEMINI_API_KEY
wrangler pages secret put CREEM_WEBHOOK_SECRET
```

3. Configure email magic links:

```bash
wrangler pages secret put RESEND_API_KEY
```

Set `AUTH_EMAIL_FROM` in Cloudflare Pages variables if the default `Bill Vampire <hello@billvampire.com>` is not verified in Resend.

4. Configure Creem webhook:

Register this production endpoint in Creem:

```text
https://billvampire.com/api/creem/webhook
```

The webhook handler verifies the `creem-signature` header with `CREEM_WEBHOOK_SECRET`, grants account entitlements for `checkout.completed`, `subscription.active`, `subscription.paid`, and `subscription.trialing`, and revokes entitlements for refunds, disputes, canceled subscriptions, and expired subscriptions.

Default product IDs are already wired for the current Emergency Kit, Pro, and monthly Patrol products. Override these in Cloudflare variables only if the Creem products change:

```text
CREEM_EMERGENCY_KIT_PRODUCT_ID
CREEM_PRO_PRODUCT_ID
CREEM_PATROL_MONTHLY_PRODUCT_ID
CREEM_PATROL_ANNUAL_PRODUCT_ID
```

5. Optional rate limit KV:

Create a KV namespace for AI rate limits and uncomment the `RATE_LIMIT` binding in `wrangler.toml`.

## Current Product Focus

Primary paid product: `$4.99 Emergency Kit`.

Keep the funnel focused on one urgent user problem: surprise charge, trial ending soon, or hard-to-cancel subscription. Do not add bank login, Plaid, Gmail OAuth, or a full personal finance dashboard in this sprint.
