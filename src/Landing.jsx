import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight, faCrown, faChevronDown, faShieldHalved, faArrowRight,
  faBolt, faWandMagicSparkles, faSkull, faLock, faCheck, faEnvelope, faBell,
  faFireFlameCurved, faFolderOpen, faFileInvoiceDollar,
} from '@fortawesome/free-solid-svg-icons';
import { faXTwitter, faChrome } from '@fortawesome/free-brands-svg-icons';
import {
  openEmergencyKitCheckout, EMERGENCY_KIT_PRICE,
  isPro,
} from './pro';
import { track } from './analytics';
import ZhBanner from './ZhBanner';

// ===== Data =====

const EMERGENCY_SCENARIOS = [
  { amount: '$119.99', service: 'Canva Pro', quip: 'Free trial renewed overnight. Needs refund email and cancel proof.', tag: 'Trial refund' },
  { amount: '$54.99', service: 'Adobe', quip: 'Cancel flow hides behind plan changes and retention screens.', tag: 'Hard cancel' },
  { amount: '$29.99', service: 'Grammarly', quip: 'Annual renewal notice got buried in email. Reminder needed now.', tag: 'Renewal risk' },
  { amount: '$15.49', service: 'Netflix', quip: 'Still billing before a long trip. Quick cancel path is enough.', tag: 'Cancel before renewal' },
  { amount: '$99.00', service: 'Duolingo', quip: 'Family member approved a trial and forgot the date.', tag: 'Trial ending' },
  { amount: '$39.00', service: 'Unknown app', quip: 'Descriptor is confusing. Needs evidence checklist before support.', tag: 'Dispute prep' },
];

const FIELD_NOTES = [
  {
    quote: 'I forgot a free trial and got charged $120. I do not need a finance dashboard. I need the refund message.',
    name: 'Reddit-style complaint',
    role: 'r/Frugal pattern',
  },
  {
    quote: 'The cancel page keeps sending me in circles. I need the exact path and a script if support refuses.',
    name: 'Support loop',
    role: 'r/personalfinance pattern',
  },
  {
    quote: 'I have ADHD and renewal dates vanish from my brain. Put it into one action plan and reminder.',
    name: 'Renewal anxiety',
    role: 'r/ADHD pattern',
  },
];

const TICKER_LOGOS = [
  'Netflix', 'Spotify', 'Adobe', 'ChatGPT', 'Notion', 'Disney+', 'YouTube Premium',
  'Hulu', 'iCloud+', 'Dropbox', 'Figma', 'Slack', 'Zoom', 'LinkedIn Premium',
  'Medium', 'Canva Pro', 'Grammarly', 'NordVPN', 'Duolingo', '1Password',
  'Midjourney', 'Claude Pro', 'GitHub Copilot', 'Headspace', 'Calm', 'HBO Max',
];

const EMERGENCY_CHOICES = [
  {
    id: 'surprise_charge',
    title: 'Fix a surprise charge',
    desc: 'I got hit with a renewal or trial charge and need a refund script now.',
  },
  {
    id: 'trial_ending',
    title: 'Cancel before renewal',
    desc: 'A free trial or annual plan is about to bill me. Help me stop it.',
  },
  {
    id: 'hard_cancel',
    title: 'Hard to cancel',
    desc: 'The service hides the cancel button, asks me to email, or keeps billing.',
  },
];

const REFUND_GUIDE_LINKS = [
  {
    title: 'Adobe cancellation fee',
    href: '/refund/adobe-cancellation-fee-refund-email-template.html',
    amount: '$54.99+',
    issue: 'Hard cancel',
  },
  {
    title: 'Microsoft 365 annual renewal',
    href: '/refund/microsoft-365-refund-after-annual-renewal.html',
    amount: '$99.99',
    issue: 'Annual renewal',
  },
  {
    title: 'Canva Pro trial charge',
    href: '/refund/canva-pro-trial-refund-after-119-charge.html',
    amount: '$119',
    issue: 'Trial refund',
  },
  {
    title: 'Tinder Gold accidental purchase',
    href: '/refund/tinder-gold-refund-after-accidental-purchase.html',
    amount: '$149.99',
    issue: 'App purchase',
  },
];

// ===== Utilities =====

function formatUsd(n) {
  if (!Number.isFinite(n)) return '$0';
  return '$' + Math.floor(n).toLocaleString('en-US');
}

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); obs.unobserve(el); } },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ===== Sub-components =====

function LiveCounter() {
  const [total, setTotal] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/stats', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (!cancelled && Number.isFinite(d?.total)) setTotal(d.total); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  if (total === null) return null;
  return (
    <div className="inline-flex items-center gap-2 bg-rose-950/40 border border-rose-800/30 px-4 py-2 rounded-full">
      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" aria-hidden />
      <span className="text-[11px] text-rose-200">
        <strong className="font-bold text-rose-100 tabular-nums">{formatUsd(total)}</strong> in subscription risk spotted before action
      </span>
    </div>
  );
}

function LogoTicker() {
  return (
    <div className="relative overflow-hidden py-10 border-y border-white/[0.04]">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0B0B11] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0B0B11] to-transparent z-10" />
      <div className="ticker-track flex items-center gap-14 whitespace-nowrap w-max">
        {[...TICKER_LOGOS, ...TICKER_LOGOS].map((name, i) => (
          <span key={i} className="text-[13px] font-medium text-slate-700/60 select-none tracking-wide">
            {name}
          </span>
        ))}
      </div>
      <p className="text-center text-[10px] text-slate-800 mt-4 tracking-wide uppercase">We detect 150+ subscription services automatically</p>
    </div>
  );
}

function brandAsset(name) {
  return `${import.meta.env.BASE_URL}brand/${name}`;
}

function HeroArtPanel() {
  return (
    <figure className="bv-hero-art landing-fade-in landing-delay-3">
      <img
        src={brandAsset('hero-vampire-advocate.webp')}
        alt="A refined gothic vampire advocate holding a glowing billing statement and evidence folder"
      />
    </figure>
  );
}

function KitEvidencePanel() {
  const nodes = [
    { icon: faShieldHalved, label: 'Cancel path', body: 'Open the right billing route before retention screens slow you down.' },
    { icon: faEnvelope, label: 'Refund script', body: 'Copy a polite, specific request with amount, date, and intent already filled.' },
    { icon: faFolderOpen, label: 'Evidence file', body: 'Keep confirmation numbers, screenshots, and support replies in one checklist.' },
  ];
  return (
    <div className="bv-evidence-suite">
      <div className="bv-evidence-image">
        <img
          src={brandAsset('bill-evidence-still.webp')}
          alt="Luxury gothic still life of subscription receipts, refund notes, cancellation proof, and reminders"
        />
      </div>
      <div className="bv-evidence-nodes">
        {nodes.map(node => (
          <div key={node.label} className="bv-evidence-node">
            <div className="bv-evidence-node-icon">
              <FontAwesomeIcon icon={node.icon} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">{node.label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{node.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerdictMockup() {
  return (
    <div className="relative bg-gradient-to-b from-[#141420] to-[#0D0D15] rounded-2xl border border-slate-800/40 p-1 shadow-2xl shadow-black/50">
      <div className="bg-[#0D0D15] rounded-xl overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-3 bg-[#141420] border-b border-slate-800/30">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          <span className="ml-3 text-[10px] text-slate-600 font-mono">billvampire.com/emergency-kit</span>
        </div>
        <div className="p-8 sm:p-10">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3 text-center">Next charge risk</p>
          <p className="font-gothic text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-rose-400 via-rose-500 to-rose-700 text-center tabular-nums mb-3 leading-none">
            $119.99
          </p>
          <p className="text-sm text-slate-400 text-center mb-8">Canva Pro trial renews Tuesday. Cancel now, request refund if already charged.</p>
          <div className="space-y-2.5">
            {[
              { name: '1. Open cancel page', detail: 'Account settings → Billing', pct: 100 },
              { name: '2. Copy refund email', detail: 'Polite, specific, evidence-ready', pct: 74 },
              { name: '3. Save proof', detail: 'Screenshot + confirmation number', pct: 55 },
              { name: '4. Set reminder', detail: '24 hours before renewal', pct: 38 },
            ].map(r => (
              <div key={r.name} className="bg-[#141420]/80 rounded-xl border border-slate-800/40 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-200">{r.name}</span>
                  <span className="text-xs font-bold text-rose-400">{r.detail}</span>
                </div>
                <div className="h-1 rounded-full bg-[#0B0B11] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-700 to-rose-500" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Main Component =====

export default function Landing({ onEnterApp, onLegal, onAuthRequest }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const viewedRef = useRef(false);
  const heroRef = useRef(null);
  const pricingRef = useRef(null);

  // Scroll-reveal refs
  const revealHow = useScrollReveal();
  const revealPatrol = useScrollReveal();
  const revealVerdicts = useScrollReveal();
  const revealComparison = useScrollReveal();
  const revealTestimonials = useScrollReveal();
  const revealPricingRef = useScrollReveal();
  const revealFaq = useScrollReveal();

  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    track('landing_viewed', { is_pro: isPro(), price_tier: EMERGENCY_KIT_PRICE.tier });
  }, []);

  // Sticky CTA visibility
  useEffect(() => {
    const handleScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect()?.bottom ?? 0;
      const pricingTop = pricingRef.current?.getBoundingClientRect()?.top ?? Infinity;
      setShowStickyCta(heroBottom < -100 && pricingTop > window.innerHeight);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnter = (source) => {
    track('landing_cta_clicked', { source });
    onEnterApp(source);
  };

  const handleEmergencyCheckout = (event, source) => {
    event.preventDefault();
    openEmergencyKitCheckout(source, { entry: 'landing' });
  };

  const faqs = [
    {
      q: 'What do I get for free vs the Emergency Kit?',
      a: `Free: pick the problem, paste or upload the bill, and get a service-specific case preview with amount, risk, refund window, cancel path, support angle, next moves, download, and optional account save. Emergency Kit (${EMERGENCY_KIT_PRICE.label} one-time): exact refund email, cancel email, support chat script, chargeback checklist, evidence checklist, and full action kit.`,
    },
    {
      q: 'What data leaves my device?',
      a: "No bank login is required. You can see results in guest mode first. If you create an email account after results, we sync the subscriptions, case files, reminders, and purchase entitlements you choose to save.",
    },
    {
      q: 'Why pay $4.99 for this?',
      a: "The paid product is not another chart. It gives you the words and checklist to act today. If the kit helps you avoid one $19.99 renewal, it has paid for itself about four times.",
    },
    {
      q: 'Which AI powers the scan?',
      a: 'Google Gemini via our secured backend proxy for extraction. The Emergency Kit uses stable templates first, then personalizes them with the service, amount, date, and issue type. The scripts are consumer communication assistance, not legal or financial advice.',
    },
    {
      q: 'Can\'t ChatGPT or Rocket Money do this?',
      a: 'ChatGPT and finance apps can help summarize spending. Rocket Money is strong if you want account connections and concierge-style subscription management. Bill Vampire is narrower: no bank login, one urgent subscription problem, and a kit you can copy into email, support chat, or your calendar right now.',
    },
  ];

  return (
    <div className="bv-brutal min-h-screen bg-[#0B0B11] text-slate-100 overflow-x-hidden">

      <ZhBanner onEnterApp={() => handleEnter('zh_banner')} />

      {/* ===== GRADIENT ACCENT LINE ===== */}
      <div className="gradient-accent-line" />

      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 bg-[#0B0B11]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}icons/icon.png`} alt="Bill Vampire" className="w-8 h-8 rounded-lg" />
            <span className="font-gothic text-lg font-bold text-slate-100 hidden sm:block">Bill Vampire</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#emergency-kit" onClick={(e) => handleEmergencyCheckout(e, 'nav')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors cursor-pointer no-underline">
              <FontAwesomeIcon icon={faCrown} className="w-3 h-3" /> Emergency Kit — {EMERGENCY_KIT_PRICE.label}
            </a>
            <button onClick={() => onAuthRequest?.('landing_nav')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-slate-100 transition-colors cursor-pointer">
              Sign in
            </button>
            <button onClick={() => handleEnter('surprise_charge')}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-500 transition-all hover:scale-[1.02] cursor-pointer">
              Fix a charge <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative pt-10 pb-12 lg:pt-32 lg:pb-36 overflow-hidden">
        {/* Background video */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <video
            src="/bg.mp4" autoPlay muted loop playsInline preload="metadata"
            className="absolute inset-0 w-full h-full object-cover opacity-25"
            style={{ transform: 'scale(1.12) translate(-2%, -3%)', clipPath: 'inset(0 5% 12% 0)' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0B0B11dd 0%, #0B0B1140 40%, #0B0B11ee 100%)' }} />
        </div>

        {/* Ambient glow */}
        <div className="absolute top-12 left-[10%] w-96 h-96 bg-rose-900/15 rounded-full blur-[140px]" />
        <div className="absolute top-40 right-[5%] w-[500px] h-[500px] bg-violet-900/10 rounded-full blur-[160px]" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-[1.08fr_0.92fr] gap-6 lg:gap-14 items-center mb-8 lg:mb-12">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-rose-950/40 border border-rose-800/30 px-4 py-1.5 rounded-full mb-8 landing-fade-in">
                <FontAwesomeIcon icon={faFireFlameCurved} className="w-3 h-3 text-rose-400" />
                <span className="text-[11px] font-medium text-rose-300">
                  {EMERGENCY_KIT_PRICE.label} one-time · No bank login · Cancel and refund scripts
                </span>
              </div>

              <h1 className="tracking-display text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-100 leading-[1.05] mb-7 landing-fade-in landing-delay-1">
                Stop your next<br />{' '}
                <span className="text-shimmer">surprise<br className="sm:hidden" /> subscription<br className="sm:hidden" /> charge.</span>
              </h1>

              <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed landing-fade-in landing-delay-2">
                Paste a billing email, upload a screenshot, or say the trial out loud. Bill Vampire builds a cancel/refund plan before the next renewal bites.
              </p>

              <div className="landing-fade-in landing-delay-3 flex flex-col items-center lg:items-start gap-3">
                <LiveCounter />
                <p className="text-[10px] text-slate-700 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faLock} className="w-2.5 h-2.5" />
                  No bank login · No signup before results · Save case files with an account
                </p>
              </div>
            </div>

            <HeroArtPanel />
          </div>

          <div className="max-w-4xl mx-auto text-center mb-6 lg:mb-12">
            <div className="grid sm:grid-cols-3 gap-3 landing-fade-in landing-delay-3 mx-auto">
              {EMERGENCY_CHOICES.map(choice => (
                <button key={choice.id} onClick={() => handleEnter(choice.id)}
                  className="text-left glass-card glass-card-hover rounded-2xl p-5 transition-all hover:scale-[1.02] cursor-pointer">
                  <p className="text-sm font-bold text-slate-100 mb-2">{choice.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{choice.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                    Start free <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Branded visual system — hidden on mobile to reduce scroll depth */}
          <div className="hidden md:block max-w-4xl mx-auto landing-fade-in landing-delay-4">
            <div className="relative">
              <div className="absolute -inset-10 bg-rose-500/[0.04] rounded-3xl blur-3xl" aria-hidden />
              <VerdictMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ===== LOGO TICKER ===== */}
      <LogoTicker />

      {/* ===== PROOF STATS ===== */}
      <section className="py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '0', label: 'Bank logins required' },
              { value: '60+', label: 'Known cancel paths' },
              { value: '$4.99', label: 'One-time rescue kit' },
              { value: '3', label: 'Emergency scenarios' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums mb-1">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== REFUND GUIDE CLUSTER ===== */}
      <section className="py-16 lg:py-20 bg-gradient-to-b from-[#0B0B11] via-[#0F0F18] to-[#0B0B11] border-y border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
            <div>
              <p className="text-xs font-medium text-amber-400 uppercase tracking-widest mb-3">Refund case library</p>
              <h2 className="tracking-heading text-3xl lg:text-4xl font-bold text-slate-100 mb-4">
                Start from the exact charge people are searching for.
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                These pages are built around high-intent refund and cancellation situations, then route users into the same free case preview instead of leaving them with generic advice.
              </p>
              <a
                href="/refund/"
                onClick={() => track('refund_cluster_clicked', { source: 'landing_refund_cluster' })}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1C1C2A] border border-amber-700/30 text-amber-300 text-sm font-bold hover:bg-[#252536] transition-colors no-underline"
              >
                Browse all refund guides <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
              </a>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {REFUND_GUIDE_LINKS.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => track('refund_guide_clicked', { source: 'landing_refund_cluster', guide: item.href })}
                  className="glass-card glass-card-hover rounded-2xl p-5 no-underline transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <span className="inline-flex w-10 h-10 rounded-xl bg-amber-950/30 border border-amber-800/30 items-center justify-center text-amber-300">
                      <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-4 h-4" />
                    </span>
                    <span className="text-lg font-black text-rose-400 tabular-nums">{item.amount}</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-bold mb-2">{item.issue}</p>
                  <h3 className="text-sm font-bold text-slate-100 mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Open the case file, then generate a free preview with the service and issue already set.</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS (3 acts) ===== */}
      <section ref={revealHow} className="scroll-reveal py-20 lg:py-28 bg-gradient-to-b from-[#0B0B11] via-[#0F0F18] to-[#0B0B11]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="tracking-heading text-3xl lg:text-4xl font-bold text-slate-100 mb-4">Three acts. One concrete next move.</h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              Pick the emergency, give us the bill, then copy the script. Create an account only when you want to save it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 scroll-reveal-stagger">
            {[
              {
                icon: faWandMagicSparkles, title: 'Pick the emergency',
                desc: 'Choose surprise charge, trial ending soon, or hard-to-cancel subscription so the kit matches the job.',
                step: '01', color: 'violet',
              },
              {
                icon: faSkull, title: 'Paste, upload, or speak',
                desc: 'Use a billing email, screenshot, PDF, manual note, or voice input. We extract service, amount, date, and status.',
                step: '02', color: 'rose',
              },
              {
                icon: faBolt, title: 'Copy the rescue kit',
                desc: 'Get a cancel path, refund email, support script, chargeback checklist, evidence list, and reminder text.',
                step: '03', color: 'emerald',
              },
            ].map(s => (
              <div key={s.title} className="scroll-reveal glass-card glass-card-hover rounded-2xl p-7 transition-all hover:scale-[1.02]">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em] mb-5">Step {s.step}</p>
                <div className={`inline-flex w-12 h-12 rounded-xl ${s.color === 'rose' ? 'bg-rose-950/40 border-rose-800/30' : s.color === 'emerald' ? 'bg-emerald-950/40 border-emerald-800/30' : 'bg-violet-950/40 border-violet-800/30'} border items-center justify-center mb-5`}>
                  <FontAwesomeIcon icon={s.icon} className={`w-5 h-5 ${s.color === 'rose' ? 'text-rose-400' : s.color === 'emerald' ? 'text-emerald-400' : 'text-violet-400'}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <KitEvidencePanel />
          </div>

          {/* Mini interactive demo */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-slate-800/40">
              {/* Before */}
              <div className="bg-[#141420]/60 p-6 border-b md:border-b-0 md:border-r border-slate-800/40">
                <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-4">What you paste or say</p>
                <div className="space-y-2.5 font-mono text-xs">
                  {[
                    { text: 'CANVA PRO TRIAL', amt: '-$119.99' },
                    { text: 'RENEWAL DATE', amt: 'TUE' },
                    { text: 'STATUS', amt: 'CHARGED' },
                    { text: 'GOAL', amt: 'REFUND' },
                    { text: 'PROOF', amt: 'EMAIL' },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between text-slate-500 py-1.5 border-b border-dashed border-slate-800/30">
                      <span>{r.text}</span>
                      <span className="text-rose-500/70">{r.amt}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* After */}
              <div className="bg-gradient-to-br from-rose-950/20 to-violet-950/10 p-6">
                <p className="text-[10px] uppercase tracking-widest text-rose-400/70 mb-4">What Bill Vampire builds</p>
                <div className="space-y-3">
                  <div className="text-center mb-4">
                    <p className="text-2xl font-bold text-rose-400 tabular-nums">$119.99<span className="text-sm text-slate-500 font-normal"> at risk</span></p>
                    <p className="text-[10px] text-slate-600 mt-1">Refund email + cancel proof + reminder</p>
                  </div>
                  {['Open Canva billing page first', 'Ask for a courtesy refund with date and amount', 'Save cancellation confirmation before chargeback'].map((t, i) => (
                    <p key={i} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">→</span> {t}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY NOT CHATGPT ===== */}
      <section ref={revealComparison} className="scroll-reveal py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-rose-400 uppercase tracking-widest mb-3">Dashboard vs action</p>
            <h2 className="tracking-heading text-3xl lg:text-4xl font-bold text-slate-100 mb-4">
              ChatGPT and finance apps explain spending.{' '}
              <span className="text-rose-400">This helps you act.</span>
            </h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              The wedge is simple: no bank connection, no full-budget dashboard, just one subscription problem and a kit you can use today.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-0 max-w-4xl mx-auto rounded-2xl border border-slate-800/40 overflow-hidden">
            {/* Dashboard column */}
            <div className="bg-[#141420]/40 p-7 border-b md:border-b-0 md:border-r border-slate-800/40">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-lg bg-[#0D0D15] border border-slate-700/50 flex items-center justify-center text-sm">AI</div>
                <div>
                  <span className="text-sm font-semibold text-slate-400 block">Finance dashboard</span>
                  <span className="text-[10px] text-slate-600">Broad money overview</span>
                </div>
              </div>
              <ul className="space-y-3 text-xs text-slate-500">
                {[
                  { text: 'Optimized for category summaries', bad: false },
                  { text: 'Often asks for account connections', bad: true },
                  { text: 'Shows many spending categories at once', bad: false },
                  { text: 'Leaves cancellation/refund work to you', bad: true },
                  { text: 'Not built around one urgent renewal', bad: true },
                  { text: 'May not produce evidence checklists', bad: true },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`shrink-0 mt-0.5 ${item.bad ? 'text-rose-600' : 'text-slate-600'}`}>
                      {item.bad ? '✗' : '~'}
                    </span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bill Vampire column */}
            <div className="bg-gradient-to-br from-rose-950/20 to-violet-950/10 p-7">
              <div className="flex items-center gap-2 mb-6">
                <img src={`${import.meta.env.BASE_URL}icons/icon.png`} alt="" className="w-9 h-9 rounded-lg" />
                <div>
                  <span className="text-sm font-semibold text-slate-200 block">Bill Vampire</span>
                  <span className="text-[10px] text-emerald-400">{EMERGENCY_KIT_PRICE.label} one-time</span>
                </div>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                {[
                  { text: `${EMERGENCY_KIT_PRICE.label} one-time emergency kit` },
                  { text: 'No bank connection needed' },
                  { text: 'Focused on one subscription problem' },
                  { text: 'Paste, upload, type, or speak the bill' },
                  { text: 'Known cancel links when available' },
                  { text: 'Refund, cancel, and support scripts' },
                  { text: 'Chargeback and evidence checklists' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="shrink-0 mt-0.5 text-emerald-400">✓</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-center mt-8 text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            Dashboards explain the leak. Bill Vampire gives you the first message, the cancel path, and the proof checklist.
          </p>
        </div>
      </section>

      {/* ===== PATROL (Chrome Extension) ===== */}
      <section ref={revealPatrol} className="scroll-reveal py-20 lg:py-28 bg-gradient-to-b from-[#0B0B11] via-[#0F0F18] to-[#0B0B11]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-violet-950/40 border border-violet-800/30 px-4 py-1.5 rounded-full mb-5">
              <FontAwesomeIcon icon={faChrome} className="w-3 h-3 text-violet-400" />
              <span className="text-[11px] font-medium text-violet-300">Later · Bill Vampire Patrol</span>
            </div>
            <h2 className="tracking-heading font-gothic text-3xl lg:text-4xl font-bold text-slate-100 mb-4">
              The bigger vision is consumer advocacy.
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Patrol can come later. The first proof is simpler: can one small AI agent help a user cancel, refund, or dispute a subscription today?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10 scroll-reveal-stagger">
            {[
              {
                icon: faChrome, title: 'Scans Gmail daily',
                desc: 'Future mode: renewal emails and receipts become early-warning signals, not another dashboard to maintain.',
              },
              {
                icon: faBell, title: 'Charge-date alerts',
                desc: 'Future mode: reminders fire before the renewal, with the cancel path and script already prepared.',
              },
              {
                icon: faEnvelope, title: 'Sunday digest',
                desc: 'Future mode: a short consumer-defense digest focused on what to stop, refund, or negotiate next.',
              },
            ].map(s => (
              <div key={s.title} className="scroll-reveal glass-card rounded-2xl p-6 border-violet-900/20">
                <div className="inline-flex w-11 h-11 rounded-xl bg-violet-950/40 border border-violet-800/30 items-center justify-center mb-4">
                  <FontAwesomeIcon icon={s.icon} className="w-5 h-5 text-violet-300" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-violet-950/30 to-rose-950/20 rounded-2xl p-6 sm:p-8 border border-violet-800/30 flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-violet-300 uppercase tracking-[0.2em] mb-1">Focus now · Emergency Kit first</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Do not ask users to buy a full finance product before one urgent use case earns trust.
              </p>
            </div>
            <button onClick={() => { track('patrol_waitlist_clicked'); handleEnter('patrol_waitlist'); }}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-rose-500 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-violet-900/30 cursor-pointer">
              <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5" />
              Build the first kit
            </button>
          </div>
        </div>
      </section>

      {/* ===== EMERGENCY SCENARIOS ===== */}
      <section ref={revealVerdicts} className="scroll-reveal py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-rose-400 uppercase tracking-widest mb-3">Emergency scenarios</p>
            <h2 className="tracking-heading text-3xl lg:text-4xl font-bold text-slate-100 mb-4">The pain is specific. The output should be specific.</h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              These are the kinds of subscription moments where a user may pay because the next step is immediate.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 scroll-reveal-stagger">
            {EMERGENCY_SCENARIOS.map((v, i) => (
              <div key={i} className="scroll-reveal glass-card glass-card-hover rounded-2xl p-6 transition-all hover:scale-[1.02]">
                <div className="bv-symbol-tile mb-5">
                  <FontAwesomeIcon
                    icon={i % 3 === 0 ? faEnvelope : i % 3 === 1 ? faShieldHalved : faFileInvoiceDollar}
                    className="w-6 h-6"
                  />
                </div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.25em] mb-2">{v.tag}</p>
                <p className="text-sm font-bold text-slate-100 mb-1">{v.service}</p>
                <p className="font-gothic text-3xl font-black text-rose-500 tabular-nums mb-3">{v.amount}</p>
                <p className="text-sm text-slate-300 leading-relaxed">{v.quip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FIELD NOTES ===== */}
      <section ref={revealTestimonials} className="scroll-reveal py-20 lg:py-28 bg-gradient-to-b from-[#0B0B11] via-[#0F0F18] to-[#0B0B11]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-amber-400 uppercase tracking-widest mb-3">What people complain about</p>
            <h2 className="tracking-heading text-3xl lg:text-4xl font-bold text-slate-100 mb-3">Not “manage my money.” More like “help me deal with this charge.”</h2>
            <p className="text-xs text-slate-600">Positioning inspired by common forum complaint patterns, not fake reviews.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 scroll-reveal-stagger">
            {FIELD_NOTES.map((t, i) => (
              <figure key={i} className="scroll-reveal glass-card glass-card-hover rounded-2xl p-6 transition-all hover:scale-[1.02]">
                <blockquote className="text-sm text-slate-300 leading-relaxed mb-5">"{t.quote}"</blockquote>
                <figcaption className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-900/60 to-violet-900/60 border border-rose-800/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-rose-300">{t.name[0]}</span>
                  </div>
                  <div className="text-[11px]">
                    <strong className="text-slate-300 block">{t.name}</strong>
                    <span className="text-slate-600">{t.role}</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section ref={(el) => { revealPricingRef.current = el; pricingRef.current = el; }} className="scroll-reveal py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-amber-400 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="tracking-heading text-3xl lg:text-4xl font-bold text-slate-100 mb-3">
              One price. <span className="text-amber-400">One emergency kit.</span>
            </h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              Let users see the risk for free. Charge for the complete cancel/refund action pack.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* FREE */}
            <div className="glass-card rounded-2xl p-7 flex flex-col">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Free</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-slate-100">$0</span>
              </div>
              <p className="text-[11px] text-slate-600 mb-6">See results first. Save and track with an account.</p>
              <ul className="text-xs text-slate-400 space-y-3 mb-8 flex-1">
                {[
                  'Pick surprise charge, trial ending, or hard cancel',
                  'One free AI bill parse',
                  'Detected service, amount, and date',
                  'Risk summary and next best move',
                  'Basic cancel link when available',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <FontAwesomeIcon icon={faCheck} className="text-emerald-400 mt-0.5 shrink-0 w-3 h-3" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleEnter('pricing_free')}
                className="w-full py-3.5 text-sm font-medium text-slate-300 bg-[#1C1C2A] rounded-xl hover:bg-[#252536] transition-colors cursor-pointer border border-slate-700/30">
                Start free
              </button>
            </div>

            {/* PRO */}
            <div className="relative bg-gradient-to-br from-amber-950/30 to-rose-950/30 rounded-2xl p-7 border border-amber-700/30 flex flex-col shadow-xl shadow-amber-950/10 hover:scale-[1.01] transition-transform">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-bold px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                MOST POPULAR · ONE-TIME
              </div>
              <p className="text-xs text-amber-400 uppercase tracking-widest mb-1 mt-2">Emergency Kit</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold text-slate-100">{EMERGENCY_KIT_PRICE.label}</span>
                <span className="text-xs text-slate-600">one-time</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-6">If it helps avoid one $19.99 renewal, it paid for itself 4x.</p>
              <ul className="text-xs text-slate-300 space-y-3 mb-8 flex-1">
                {[
                  'Everything in Free',
                  'Refund email template',
                  'Cancellation email template',
                  'Support chat script',
                  'Chargeback checklist',
                  'Evidence checklist',
                  'Reminder text',
                  'Downloadable action plan',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <FontAwesomeIcon icon={faCheck} className="text-amber-400 mt-0.5 shrink-0 w-3 h-3" /> {item}
                  </li>
                ))}
              </ul>
              <a href="#emergency-kit" onClick={(e) => handleEmergencyCheckout(e, 'pricing')}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-rose-900/30 cursor-pointer flex items-center justify-center gap-1.5 no-underline">
                <FontAwesomeIcon icon={faCrown} className="w-3.5 h-3.5" />
                Unlock Emergency Kit — {EMERGENCY_KIT_PRICE.label}
              </a>
              <p className="text-[10px] text-slate-600 text-center mt-3 flex items-center justify-center gap-1.5">
                <FontAwesomeIcon icon={faLock} className="w-2.5 h-2.5" />
                Secured by Creem · Consumer communication assistance
              </p>
              <div className="mt-4 pt-4 border-t border-amber-800/20 text-center">
                <p className="text-[10px] text-amber-400/70">
                  Not legal or financial advice. Use the scripts as a starting point for support conversations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section ref={revealFaq} className="scroll-reveal py-20 lg:py-28 bg-gradient-to-b from-[#0B0B11] via-[#0F0F18] to-[#0B0B11]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="tracking-heading text-2xl lg:text-3xl font-bold text-slate-100">The real questions</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer group">
                  <span className="text-sm font-medium text-slate-200 pr-4">{faq.q}</span>
                  <FontAwesomeIcon icon={faChevronDown}
                    className={`w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-all shrink-0 ${openFaq === i ? 'rotate-180 text-rose-400' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 -mt-1">
                    <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-rose-950/10 to-transparent -z-10" />
        <div className="max-w-2xl mx-auto px-6 text-center">
          <img src={`${import.meta.env.BASE_URL}icons/icon.png`} alt="Bill Vampire" className="w-16 h-16 mx-auto mb-8 rounded-2xl shadow-lg shadow-rose-900/20" />
          <h2 className="tracking-heading text-3xl lg:text-4xl font-bold text-slate-100 mb-5">
            Stop one charge before it becomes another regret.
          </h2>
          <p className="text-base text-slate-400 mb-10 max-w-md mx-auto">
            Pick the situation, paste the receipt, and get the first cancel/refund move in about 90 seconds.
          </p>
          <button onClick={() => handleEnter('surprise_charge')}
            className="inline-flex items-center gap-2.5 px-12 py-5 bg-rose-600 text-white text-base font-semibold rounded-2xl hover:bg-rose-500 hover:scale-[1.02] transition-all shadow-2xl shadow-rose-900/40 group cursor-pointer">
            Build my free preview
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-[10px] text-slate-700 mt-4">No bank login · No signup before results · Account sync when you want it</p>
        </div>
      </section>

      {/* ===== FOUNDER STRIP ===== */}
      <section className="py-10 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-900/60 to-violet-900/60 border border-rose-800/40 flex items-center justify-center shrink-0">
            <span className="font-gothic text-lg font-bold text-rose-300">J</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-300 leading-relaxed mb-2">
              Built by one indie maker who got tired of $9.99 line items and dark-pattern cancellation flows. The product is intentionally small today: one urgent subscription problem, one action kit, one chance to prove users will pay.
            </p>
            <div className="flex items-center gap-3 justify-center sm:justify-start text-[11px]">
              <a href="mailto:hello@billvampire.com" className="text-slate-500 hover:text-slate-300 no-underline">hello@billvampire.com</a>
              <span className="text-slate-700">·</span>
              <a href="https://x.com/search?q=billvampire" target="_blank" rel="noopener noreferrer"
                className="text-slate-500 hover:text-slate-300 no-underline inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faXTwitter} className="w-2.5 h-2.5" /> @billvampire
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.04] py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src={`${import.meta.env.BASE_URL}icons/icon.png`} alt="Bill Vampire" className="w-7 h-7 rounded-lg" />
              <span className="font-gothic text-sm font-bold text-slate-400">Bill Vampire</span>
              <span className="text-[10px] text-slate-700 ml-1">Make every dollar visible</span>
            </div>
            <div className="flex items-center gap-5">
              <a href="/tools/" className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors no-underline">Free Tools</a>
              <a href={`${import.meta.env.BASE_URL}terms.html`} onClick={(e) => { e.preventDefault(); onLegal('terms'); }} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer no-underline">Terms</a>
              <a href={`${import.meta.env.BASE_URL}privacy.html`} onClick={(e) => { e.preventDefault(); onLegal('privacy'); }} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer no-underline">Privacy</a>
              <a href={`${import.meta.env.BASE_URL}refund.html`} onClick={(e) => { e.preventDefault(); onLegal('refund'); }} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer no-underline">Refund</a>
            </div>
          </div>
          <p className="text-[10px] text-slate-800 mt-6 text-center">&copy; {new Date().getFullYear()} Bill Vampire. All rights reserved.</p>
        </div>
      </footer>

      {/* ===== STICKY CTA BAR ===== */}
      {showStickyCta && (
        <div className="fixed bottom-0 inset-x-0 z-50 sticky-cta-enter print:hidden">
          <div className="bg-[#0B0B11]/95 backdrop-blur-xl border-t border-white/[0.06] px-4 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <p className="text-xs text-slate-400 hidden sm:block">
                <span className="text-rose-400 font-medium">Have a charge or trial ending soon?</span>{' '}
                Build the cancel/refund preview now.
              </p>
              <button onClick={() => handleEnter('sticky_cta')}
                className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-500 transition-all cursor-pointer whitespace-nowrap">
                Build free preview
                <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
