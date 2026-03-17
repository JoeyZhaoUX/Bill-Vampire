import React from 'react';

const CONTACT_EMAIL = 'super666joey@gmail.com';
const SITE_URL = 'https://joeymilano.github.io/Bill-Vampire/';
const LAST_UPDATED = 'March 17, 2026';

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
        <p>Bill Vampire is a subscription tracking web application that helps users monitor their recurring payments. The Service offers a free tier and a one-time paid upgrade ("Pro") for additional features including unlimited AI analysis.</p>
      </Section>
      <Section title="3. User Data & Local Storage">
        <p>Bill Vampire stores your subscription data locally on your device using browser local storage. We do not collect, transmit, or store your subscription information on our servers. You are responsible for backing up your own data.</p>
      </Section>
      <Section title="4. AI Features">
        <p>The Service includes AI-powered analysis features provided through third-party APIs (Google Gemini). AI-generated advice, roasts, and alternative suggestions are for informational and entertainment purposes only and should not be considered professional financial advice.</p>
      </Section>
      <Section title="5. Pro Upgrade">
        <p>The Pro upgrade is a one-time purchase processed through Lemon Squeezy. By purchasing Pro, you receive a permanent license to use Pro features. Pro status is stored locally on your device.</p>
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
        <p>Bill Vampire is designed with privacy at its core. We believe your financial data should stay on your device, and we built the app accordingly.</p>
      </Section>
      <Section title="2. Data We Do NOT Collect">
        <p>We do not collect, store, or transmit your subscription data, spending information, or personal financial details. All subscription data you enter is stored exclusively in your browser's local storage on your device.</p>
      </Section>
      <Section title="3. Data We May Collect">
        <p>When you use AI features, your subscription names and amounts are sent to Google's Gemini API to generate analysis and suggestions. Google's own privacy policy governs how they handle this data. We do not store or log these API requests on our side.</p>
        <p>When you purchase Pro or leave a tip, payment processing is handled entirely by Lemon Squeezy. We receive confirmation of your purchase but do not store credit card numbers or billing details. Please refer to <a href="https://www.lemonsqueezy.com/privacy" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:text-rose-300 underline">Lemon Squeezy's Privacy Policy</a> for details on their data practices.</p>
      </Section>
      <Section title="4. Cookies & Local Storage">
        <p>We use browser local storage to save your preferences (language, Pro status, subscription list, no-spend calendar). We do not use tracking cookies, analytics services, or advertising pixels.</p>
      </Section>
      <Section title="5. Third-Party Services">
        <p>The Service integrates with:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Google Gemini API — for AI-powered analysis features</li>
          <li>Lemon Squeezy — for payment processing</li>
          <li>Google Fonts — for typography</li>
        </ul>
        <p>Each third-party service has its own privacy policy governing their use of data.</p>
      </Section>
      <Section title="6. Children's Privacy">
        <p>The Service is not directed at children under 13. We do not knowingly collect data from children.</p>
      </Section>
      <Section title="7. Data Deletion">
        <p>Since all data is stored locally on your device, you can delete it at any time by clearing your browser's local storage or site data for this website.</p>
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
      <Section title="2. Pro Upgrade ($6.99 One-Time)">
        <p>The Pro upgrade is a one-time digital purchase. Because of the immediate nature of digital goods delivery, we generally do not offer refunds after purchase.</p>
        <p>However, we want you to be satisfied. If you experience any of the following, we will issue a full refund:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>You were charged but Pro features did not activate</li>
          <li>You were charged multiple times for the same purchase</li>
          <li>You request a refund within 3 days of purchase and have not extensively used Pro features</li>
        </ul>
      </Section>
      <Section title="3. Tips">
        <p>Tips are voluntary contributions to support the development of Bill Vampire. Tips are non-refundable, as they are not tied to any product or service delivery.</p>
      </Section>
      <Section title="4. How to Request a Refund">
        <p>To request a refund, email us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-rose-400 hover:text-rose-300 underline">{CONTACT_EMAIL}</a> with your purchase receipt or Lemon Squeezy order number. We aim to respond within 2 business days.</p>
      </Section>
      <Section title="5. Refund Processing">
        <p>Approved refunds are processed through Lemon Squeezy and will be returned to your original payment method. Processing time depends on your payment provider, typically 5-10 business days.</p>
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
    <div className="min-h-screen bg-[#0B0B11] flex flex-col items-center justify-start">
      <div className="w-full max-w-2xl px-6 py-12">
        <button onClick={onBack}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-8 cursor-pointer">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-slate-100 font-serif mb-2">{title}</h1>
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
