# 🧛‍♂️ Bill Vampire (billvampire.com)

> **Stop your next surprise subscription charge. Paste a bill, upload a screenshot, or speak a trial reminder to build a cancel/refund Emergency Kit in 60 seconds.**

[![Bill Vampire Logo](public/icons/icon.png)](https://billvampire.com/)

---

## 🩸 The Problem: "Subscription Vampires" Are Draining Your Wallet

We've all been there: you sign up for a "free trial" or an annual plan, forget to set a calendar reminder, and wake up to an unexpected **$119.88** or **$54.99** charge on your card. 

When you try to cancel, companies hide the cancellation button, send you in circles through support chatbots, or hit you with absurd "early termination fees" (looking at you, Adobe). 

---

## 🛡️ The Solution: A Privacy-First, Zero-Friction Consumer Advocacy Agent

**Bill Vampire** is a consumer-defense tool designed to help you fight back, claim your refund, and stop unwanted renewals without any of the typical privacy compromises.

### 🚫 Why Bill Vampire is Different:
1. **No Bank Logins Required:** Other financial apps force you to connect your bank account via Plaid, sharing all of your passwords and transactions. With Bill Vampire, your bank and card details stay 100% private. 
2. **One Urgent Problem, One Instant Fix:** We don't force you into a complex budget dashboard. We focus entirely on the one urgent subscription charge you need to kill or refund today.
3. **Legally-Weighted evidence & scripts:** Our AI scans your bill and produces a bulletproof evidence log and custom-written scripts based on consumer protection laws to help you win support chat negotiations.

---

## 🎁 What You Get: Free vs. Emergency Kit

We believe you should see results before spending a single penny. 

### 🟢 Free Tier ($0)
* **AI Bill Scanning & Parsing:** Upload an image/PDF or paste any billing text.
* **Instant Risk Assessment:** Identify the exact service, bill amount, renewal date, and risk.
* **First Best Move:** Know exactly what cancellation path or refund window applies to this specific service.
* **Download Free Case Preview:** Save the initial report to your device or local browser cache.

### 👑 The Emergency Kit ($4.99 One-Time)
Unlock your complete consumer-defense arsenal for the cost of a single coffee. If the kit helps you avoid or refund even one $15 subscription, it has paid for itself three times over.

* **Exact Refund Email Template:** Custom-written, polite but firm, prefilled with your billing dates and amounts.
* **Cancel Request Email:** The exact wording to bypass automatic customer retention bots.
* **Support Chat Script:** A step-by-step negotiation script if live agents refuse to refund you.
* **Evidence Checklist:** A structured log of the exact screenshots and receipts to gather.
* **Chargeback Checklist:** Your nuclear option—a step-by-step checklist to win a card chargeback dispute if the merchant is hostile.
* **Calendar Reminder & ICS File:** A direct downloadable calendar block to alert you 24 hours before your next renewal.

---

## 🔒 100% Risk Reversal Guarantee

We stand behind our tools. **If our Emergency Kit does not help you claim your refund or waive your cancellation fee, email us with a screenshot of the merchant's rejection and we will refund your $4.99 instantly.**

---

## 📣 Viral Share & Get 1 Free Emergency Kit!

Want to get an Emergency Kit on us? 
Share your Bill Vampire damage report or successful refund screenshot on X (Twitter), Reddit, TikTok, or Instagram and tag **@BillVampire**. We'll DM you a lifetime promo code for **1 Free Emergency Kit**! 

*Note: We do not offer full refunds for cash-back on shared posts, just the free code so you can save another subscription in the future.*

---

## 💻 Developer & Self-Hosting Guide

If you are a developer and want to run Bill Vampire locally or deploy it to your own Cloudflare account, follow the setup instructions below.

### Local Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

### Cloudflare Setup

The app uses Cloudflare Pages Functions, D1, and KV. Guest mode works without D1, but accounts and cloud sync require the database binding.

1. **Create and bind D1:**
   ```bash
   wrangler d1 create bill-vampire-prod
   wrangler d1 migrations apply bill-vampire-prod --remote
   ```
   Then uncomment `[[d1_databases]]` in `wrangler.toml` and paste the returned `database_id`.

2. **Configure required Pages secrets:**
   ```bash
   wrangler pages secret put AUTH_SESSION_SECRET
   wrangler pages secret put GEMINI_API_KEY
   wrangler pages secret put CREEM_WEBHOOK_SECRET
   ```

3. **Configure email magic links:**
   ```bash
   wrangler pages secret put RESEND_API_KEY
   ```
   Set `AUTH_EMAIL_FROM` in Cloudflare Pages variables if the default `Bill Vampire <hello@billvampire.com>` is not verified in Resend.

4. **Configure Google sign-in:**
   Create an OAuth Web Client in Google Cloud Console and add this authorized redirect URI:
   `https://billvampire.com/api/auth/google/callback`
   Then add the credentials as Pages secrets:
   ```bash
   wrangler pages secret put GOOGLE_CLIENT_ID --project-name bill-vampire
   wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name bill-vampire
   ```

5. **Configure Creem webhook:**
   Register this production endpoint in Creem:
   `https://billvampire.com/api/creem/webhook`
   The webhook handler verifies the `creem-signature` header with `CREEM_WEBHOOK_SECRET` and manages account entitlements.

---

### 📬 Contact & Support
Have questions or want to submit your success story? Email us at [hello@billvampire.com](mailto:hello@billvampire.com) or find us on X [@billvampire](https://x.com/search?q=billvampire).
