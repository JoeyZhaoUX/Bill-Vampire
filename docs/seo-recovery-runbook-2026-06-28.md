# Google Search recovery runbook

Baseline date: 2026-06-28

## Baseline

- 2026-06-20 through 2026-06-25: 458 impressions, 76.3 impressions/day, weighted average position 28.4.
- Do not use the one-day 309-impression exploration peak on 2026-06-11 as the recovery target.
- The public canonical format is the extensionless URL. Source files may retain `.html`; public links, sitemap entries, canonical tags, Open Graph URLs, and JSON-LD must not.

## Day 7

- In Search Console, compare page rows after grouping `.html` and extensionless versions by logical page.
- Confirm impressions and clicks are consolidating on the extensionless URL.
- Spot-check legacy `.html` URLs: each must make one permanent redirect to the matching extensionless URL and preserve query parameters.
- Confirm the sitemap is processed without fetch errors.

## Day 14

- Review Cursor, Perplexity, LinkedIn Premium refund, The Athletic, Duolingo, Tinder, and Microsoft 365 refund pages.
- If a page remains in the top 10 with more than 100 cumulative impressions and no clicks, revise its title and meta description against the actual query wording.
- Do not rewrite solely because impressions on the legacy `.html` version fall; that is expected during consolidation.

## Day 28

- Compare daily impressions with the 76.3 baseline and segment results by query, page, country, and device.
- Review click-through rate only alongside average position and query intent.
- Do not bulk-delete or noindex pages in this first cycle.
- Consider merging or noindexing only after two consecutive 28-day periods with no impressions, no conversions, and substantial content overlap.

## Release checks

```sh
npm run build
npm run seo:audit:live
```

The local build blocks release when public HTML contains internal `.html` links, sitemap duplicates, canonical/Open Graph mismatches, non-self canonicals, or unsupported review-rating structured data.
