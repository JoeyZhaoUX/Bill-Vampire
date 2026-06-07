# Bill Vampire Growth Playbook

Goal: create steady, high-intent traffic without paid ads, spam, or full-auto posting. The system should help the founder find opportunities, draft useful replies, attach UTM links, and review a small queue each day.

## Guardrails

- Do not auto-post to Reddit, Quora, Hacker News, Indie Hackers, Product Hunt, or directories.
- Do not buy accounts, use throwaway accounts, or pretend to be a customer.
- Do not paste the same link across multiple communities.
- Do not increase the free AI parsing allowance to support growth. Use deterministic drafts and manual review first.
- Do not publish generic AI SEO pages that only swap keywords. Service pages need refund/cancel context, evidence checklist, and next action. Survival pages need a money-pressure checklist, examples, case-preview CTA, and internal links to refund/cancel actions.

Reference rules to re-check before campaigns:

- Reddit spam policy: https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam
- Google Search spam policies: https://developers.google.com/search/docs/essentials/spam-policies
- Product Hunt launch guide: https://www.producthunt.com/launch

## Weekly Loop

1. Monday: run `npm run growth:queue` and add any real URLs found from WebAccess or Chrome to `content/growth/opportunities.seed.json`.
2. Tuesday: review 5 opportunities and publish 2 helpful no-link comments where appropriate.
3. Wednesday: choose 5 high-intent SEO pages from real community pain points. Prioritize purchase urgency, refund/cancel proximity, pain specificity, ability to route to the `$4.99` kit, and content defensibility.
4. Thursday: ship the approved SEO pages and make sure each one has a case-preview form.
5. Friday: publish 1 transparent founder post or builder log with real metrics.
6. Weekend: review visits, preview starts, downloads, account saves, checkout clicks, and paid conversions.

## Platform Rules

### Reddit

- Maximum 1 main post per week.
- Prefer comments without links.
- If a link is useful, disclose that you built the tool.
- Best initial communities: `r/SideProject`, `r/Frugal`, `r/personalfinance`, `r/ADHD`, `r/AppHookup`.
- Stop posting in a subreddit for 30 days if a post is removed twice or a moderator warns you.

### Quora

- Answer like a complete mini-article.
- Put at most one disclosed tool link at the end.
- Use service-specific wording, not "AI finance app" positioning.

### Hacker News

- Use only for a real technical story or one-time Show HN.
- Lead with privacy tradeoffs, no-bank-login architecture, local-first preview, and what is not automated.

### Indie Hackers

- Publish builder logs, conversion numbers, and failed experiments.
- Ask for positioning feedback instead of selling.

### Product Hunt

- Launch once the product flow is stable.
- Prepare tagline, maker comment, screenshots, FAQ, and first comment before launch day.

### Directories

- Submit manually.
- Rewrite the description for each directory.
- Avoid low-quality directory farms.

## UTM Standard

- `utm_source=reddit|quora|hn|indiehackers|producthunt|directory`
- `utm_medium=comment|post|answer|directory`
- `utm_campaign=organic_growth_YYYYwWW`
- `utm_content=service_issue_slug`

## Queue Workflow

Run:

```bash
npm run growth:queue
```

Useful filtered views:

```bash
npm run growth:open
npm run growth:reddit
```

Outputs:

- `content/growth/queue/latest.json`
- `content/growth/queue/YYYY-MM-DD-growth-queue.md`

Review process:

1. Open the Markdown queue.
2. Choose one opportunity with a clear pain point and acceptable platform rules.
3. Start from the no-link draft.
4. Rewrite it in the founder's voice.
5. Only use the transparent link draft if the platform allows it or the person asks for a tool.
6. After posting, record the final URL, status, and outcome in `content/growth/outcomes.json`.

## Adding Real Threads

When WebAccess or Chrome finds a real thread, copy `content/growth/opportunity-intake.template.json`, fill it in, then append the object to `content/growth/opportunities.seed.json`.

Recommended status values in `content/growth/outcomes.json`:

- `needs_review`: not reviewed yet.
- `ready_to_post`: approved, waiting for manual posting.
- `posted`: published.
- `needs_followup`: someone replied or asked for the link.
- `discarded`: bad fit, risky community, or low intent.

Example outcome entry:

```json
{
  "id": "reddit-frugal-adobe-cancellation-fee",
  "status": "posted",
  "postedUrl": "https://www.reddit.com/r/example/comments/example/",
  "postedAt": "2026-05-26",
  "visits": 12,
  "previewStarts": 3,
  "downloads": 1,
  "accountSaves": 0,
  "checkoutClicks": 1,
  "paid": 0,
  "notes": "No-link comment first; one user asked for the tool."
}
```

## SEO Page Rules

Bill Vampire is now positioned as a financial survival tool for the subscription economy. Broad money-pressure keywords should land on `/survival/` pages first; service-specific refund/cancel keywords should still land on refund and cancel pages.

Survival themes:

- AI Layoffs: use only with monetizable modifiers like cut bills, subscriptions, emergency budget, or cancel subscriptions after job loss.
- Consumer Downgrade: downgrade, pause, cancel, or refund decisions when money is tight.
- Subscription Hell: hard-to-cancel services, dark patterns, forgotten renewals, and “why is everything a subscription” searches.
- Doom Spending: impulse subscriptions, panic buying apps, and late-night purchase regret.
- Financial Anxiety: money anxiety, subscription reminders, ADHD renewals, and one-hour audit language.

Each new page must include:

- Service name when the page is service-specific; a concrete financial-pressure scenario when it is a survival page.
- Concrete scenario, such as trial refund, annual renewal refund, hard cancellation, refund denied, job-loss budget audit, downgrade order, doom-spending subscription cleanup, or money anxiety checklist.
- Refund/cancel context and likely window when applicable.
- Cancellation path or internal links to the relevant cancel/refund cluster.
- Evidence checklist.
- Free case-preview form.
- Secondary `$4.99 Emergency Kit` CTA.

Good page ideas:

- `Canva Pro trial refund after $119 charge`
- `Adobe cancellation fee refund email template`
- `Grammarly annual renewal refund request`
- `ChatGPT Plus refund request after renewal`
- `NordVPN refund script`
- `cancel subscriptions after job loss`
- `subscription audit after layoff`
- `doom spending subscriptions`
- `what to cancel when money is tight`
- `financial anxiety spending checklist`

## Metrics

Track weekly:

- Visits by platform.
- Case preview starts.
- Preview downloads.
- Account saves.
- Checkout clicks.
- Paid conversions.
- Comments or replies asking for the link.

30-day targets:

- 1,000+ organic visits.
- 200+ case previews.
- 20+ preview downloads or saves.
- 10+ checkout clicks.
- 1-3 paid users or 5+ clear paid-intent conversations.

## Stop Rules

- Pause a platform if it produces no preview starts for 2 weeks.
- Rewrite titles and CTAs if a page gets 100 visits with less than 5% preview-start rate.
- Pause a community for 30 days after 2 removals or warnings.
