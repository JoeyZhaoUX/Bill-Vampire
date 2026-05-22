import React from 'react';

const CONTACT_EMAIL = 'hello@billvampire.com';
const LAST_UPDATED = 'March 20, 2026';

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-slate-200 mb-3">{title}</h2>
      <div className="text-sm text-slate-400 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

function TermsOfService() {
  return (
    <>
      <Section title="1. Acceptance of Terms">
        <p>By accessing or using Bill Vampire ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
      </Section>
      <Section title="2. Description of Service">
        <p>Bill Vampire is a no-bank-login subscription emergency assistant. The free flow lets you paste, upload, or speak one subscription problem and receive a service-specific case preview with the detected amount, risk, refund window, cancel path, support angle, next moves, download, and optional account save. The paid Emergency Kit is a 4.99 USD one-time digital purchase that unlocks refund email, cancellation email, support chat script, chargeback checklist, evidence checklist, and the full action kit.</p>
        <p>Bill Vampire may also offer optional Pro or Patrol features. These are separate products and are not required to use the Emergency Kit.</p>
      </Section>
      <Section title="3. User Data, Accounts & Local Storage">
        <p>You can see results without creating an account. If you choose to create an email account, Bill Vampire stores your subscriptions, cancelled items, reminders, Emergency Kit case files, and purchase entitlements so you can recover them after cache clears or on another device.</p>
        <p>Guest-mode data remains in your browser local storage and may be lost if you clear site data. No bank login is required.</p>
      </Section>
      <Section title="4. AI Features">
        <p>The Service includes AI-powered analysis features provided through third-party APIs (Google Gemini). AI-generated advice, roasts, and alternative suggestions are for informational and entertainment purposes only and should not be considered professional financial advice. Bill Vampire is an independent product and is not affiliated with or endorsed by Google.</p>
      </Section>
      <Section title="5. Paid Products & Payment Processing">
        <p><strong>Emergency Kit:</strong> a one-time purchase of 4.99 USD processed through <a href="https://www.creem.io" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:text-rose-300 underline">Creem</a>. By purchasing the Emergency Kit, you receive access to the generated consumer communication templates and action checklist for your case.</p>
        <p><strong>Optional Pro or Patrol features:</strong> if offered, these are separate products with their own pricing shown at checkout. Purchasing one product does not automatically entitle you to another unless explicitly stated.</p>
        <p>Creem acts as our merchant of record and handles all payment processing, sales tax, and billing.</p>
      </Section>
      <Section title="6. Acceptable Use">
        <p>You agree not to misuse the Service, attempt to reverse-engineer it, or use it for any unlawful purpose. We reserve the right to terminate access for users who violate these terms.</p>
      </Section>
      <Section title="7. Disclaimer of Warranties">
        <p>The Service is provided "as is" without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or that AI-generated content will be accurate.</p>
      </Section>
      <Section title="8. Limitation of Liability">
        <p>To the maximum extent permitted by law, Bill Vampire and its creators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>
      </Section>
      <Section title="9. Changes to Terms">
        <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
      </Section>
      <Section title="10. Contact">
        <p>For questions about these Terms, contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-rose-400 hover:text-rose-300 underline">{CONTACT_EMAIL}</a>.</p>
      </Section>
    </>
  );
}

function PrivacyPolicy() {
  return (
    <>
      <Section title="1. Overview">
        <p>Bill Vampire is designed to avoid bank connections. You can use the first result in guest mode, and you can create an email account only when you want saved case files, reminders, cross-device sync, or weekly digests.</p>
      </Section>
      <Section title="2. Data We Do NOT Collect">
        <p>We do not ask for bank login credentials, Plaid access, or full financial account history.</p>
      </Section>
      <Section title="3. Data We May Collect">
        <p>In guest mode, subscription data is stored locally in your browser. If you create an account, we store the email address, subscriptions you choose to save, cancelled items, reminder/case-file metadata, weekly digest preference, and purchase entitlements.</p>
        <p>When you use AI features, billing text/images may be sent to Google's Gemini API to extract fields or generate scripts. When you purchase, payment processing is handled by Creem. We do not store credit card numbers.</p>
      </Section>
      <Section title="4. Cookies & Local Storage">
        <p>We use browser local storage for guest-mode data and a secure session cookie for signed-in accounts. Clearing site data can delete guest-mode data, but signed-in users can recover synced data by logging in again.</p>
      </Section>
      <Section title="5. Third-Party Services">
        <p>The Service integrates with:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Google Gemini API — for AI-powered analysis features</li>
          <li>Creem — for payment processing</li>
          <li>Google Fonts — for typography</li>
        </ul>
        <p>Each third-party service has its own privacy policy governing their use of data.</p>
      </Section>
      <Section title="6. Children's Privacy">
        <p>The Service is not directed at children under 13. We do not knowingly collect data from children.</p>
      </Section>
      <Section title="7. Data Deletion">
        <p>Guest-mode data can be deleted by clearing local site data. Account data can be deleted by contacting us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-rose-400 hover:text-rose-300 underline">{CONTACT_EMAIL}</a>.</p>
      </Section>
      <Section title="8. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. Changes will be reflected on this page with an updated date.</p>
      </Section>
      <Section title="9. Contact">
        <p>For privacy-related questions, contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-rose-400 hover:text-rose-300 underline">{CONTACT_EMAIL}</a>.</p>
      </Section>
    </>
  );
}

function RefundPolicy() {
  return (
    <>
      <Section title="1. Free Tier">
        <p>Bill Vampire's core features are free to use and require no payment. No refund applies to the free tier.</p>
      </Section>
      <Section title="2. Emergency Kit (4.99 USD One-Time)">
        <p>The Emergency Kit is a one-time digital purchase. Because the generated scripts and checklist are delivered immediately, we generally do not offer refunds after purchase.</p>
        <p>However, we want you to be satisfied. If you experience any of the following, we will issue a full refund:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>You were charged but Emergency Kit access did not activate</li>
          <li>You were charged multiple times for the same purchase</li>
          <li>The generated kit is unavailable due to a technical failure on our side</li>
        </ul>
      </Section>
      <Section title="3. Optional Patrol Subscription">
        <p>If Patrol is offered, it is billed recurring through Creem. You can cancel at any time from your Creem receipt or by emailing us; once cancelled we stop future charges at the end of the current billing period. We do not pro-rate refunds for partial periods already elapsed, with two exceptions:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>You were charged for a renewal but Patrol had already been uninstalled before the renewal date — we refund that renewal in full.</li>
          <li>You were charged more than once in the same billing period due to a processing error.</li>
        </ul>
      </Section>
      <Section title="4. Tips">
        <p>Tips are voluntary contributions to support the development of Bill Vampire. Tips are non-refundable, as they are not tied to any product or service delivery.</p>
      </Section>
      <Section title="5. How to Request a Refund">
        <p>To request a refund, email us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-rose-400 hover:text-rose-300 underline">{CONTACT_EMAIL}</a> with your purchase receipt or Creem order number. We aim to respond within 2 business days.</p>
      </Section>
      <Section title="6. Refund Processing">
        <p>Approved refunds are processed through Creem and will be returned to your original payment method. Processing time depends on your payment provider, typically 5-10 business days.</p>
      </Section>
    </>
  );
}

const PAGES = {
  terms: { title: 'Terms of Service', component: TermsOfService },
  privacy: { title: 'Privacy Policy', component: PrivacyPolicy },
  refund: { title: 'Refund Policy', component: RefundPolicy },
};

export default function Legal({ page, onBack }) {
  const { title, component: Content } = PAGES[page] || PAGES.terms;

  return (
    <div className="bv-brutal min-h-screen bg-[#0B0B11] flex flex-col items-center justify-start">
      <div className="w-full max-w-2xl px-6 py-12">
        <button onClick={onBack}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-8 cursor-pointer">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">{title}</h1>
        <p className="text-xs text-slate-600 mb-10">Last updated: {LAST_UPDATED}</p>
        <Content />
        <div className="mt-12 pt-6 border-t border-slate-800/50 flex gap-6">
          {Object.entries(PAGES).map(([key, { title }]) => (
            <button key={key} onClick={() => onBack(key)}
              className={`text-xs transition-colors cursor-pointer ${page === key ? 'text-slate-300' : 'text-slate-600 hover:text-slate-400'}`}>
              {title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
