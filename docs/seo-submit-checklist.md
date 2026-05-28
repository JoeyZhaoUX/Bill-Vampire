# Bill Vampire SEO Submit Checklist

Use this after each SEO batch deploy. The goal is to get the refund cluster discovered quickly and then watch which pages create case previews, not just visits.

## Submit

Submit this sitemap in both Google Search Console and Bing Webmaster Tools:

- `https://billvampire.com/sitemap.xml`

## Priority URLs

Request indexing for these first:

- `https://billvampire.com/refund/`
- `https://billvampire.com/refund/adobe-cancellation-fee-refund-email-template.html`
- `https://billvampire.com/refund/microsoft-365-refund-after-annual-renewal.html`
- `https://billvampire.com/refund/dropbox-annual-renewal-refund-request.html`
- `https://billvampire.com/refund/canva-pro-trial-refund-after-119-charge.html`
- `https://billvampire.com/refund/tinder-gold-refund-after-accidental-purchase.html`
- `https://billvampire.com/tools/`

## Validate

For 3-5 representative refund pages:

- Test live URL in Google Search Console.
- Confirm page is indexable.
- Confirm canonical points to itself.
- Confirm mobile usability has no blocking issue.
- Confirm structured data detects `BreadcrumbList`, `HowTo`, and `FAQPage`.

## Watch

Review these weekly:

- Search query impressions.
- Click-through rate by refund page.
- `refund_page_viewed`.
- `refund_cta_clicked`.
- `scan_started` with `source=seo_refund_page`.
- `scan_succeeded` with `source=seo_refund_page`.
- Checkout clicks from refund-source users.

## Fix Rules

- If a page gets impressions but CTR is below 1%, rewrite title/meta around the exact charge amount.
- If a page gets clicks but few `refund_cta_clicked` events, make the hero CTA more specific.
- If users start scans but do not reach verdict, improve the page prefill text and fallback extraction.
- If one service converts, add 3 adjacent services before adding unrelated pages.
