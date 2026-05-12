import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight, faCrown, faChevronDown, faShieldHalved, faArrowRight,
  faBolt, faWandMagicSparkles, faSkull, faLock, faCheck, faEnvelope, faBell,
} from '@fortawesome/free-solid-svg-icons';
import { faXTwitter, faChrome } from '@fortawesome/free-brands-svg-icons';
import {
  getCheckoutUrl, getCurrentPrice, isFoundingWindow, foundingWindowRemainingMs,
  openCheckout, openPatrolCheckout, isPro,
} from './pro';
import { track } from './analytics';
import ZhBanner from './ZhBanner';

const WALL_OF_VERDICTS = [
  { amount: 14320, quip: '“Adobe + Notion + Spotify. I thought I was being cheap.”', tag: 'Designer, NYC' },
  { amount: 8640, quip: '“I forgot I had three video services.”', tag: 'Parent of 2, Austin' },
  { amount: 23100, quip: '“The ChatGPT Plus alone is a used Civic.”', tag: 'Solo founder, SF' },
  { amount: 6780, quip: '“It’s just $9.99, I said. For every app.”', tag: 'Grad student' },
  { amount: 31420, quip: '“Indie maker stack. Ouch.”', tag: 'Maker, Berlin' },
  { amount: 11200, quip: '“Cancelled four. Kept Netflix. I’m not a monster.”', tag: 'PM, Toronto' },
];

const TESTIMONIALS = [
  {
    quote: 'The 10-year number broke me. I cancelled three subscriptions before I finished reading the roast.',
    name: 'Early user',
    role: 'Product Hunt comment',
  },
  {
    quote: 'Paid nine bucks once and saved hundreds. Best ROI of any app I’ve bought this year.',
    name: 'Early user',
    role: 'Twitter / X',
  },
  {
    quote: 'The AI roast made my partner laugh out loud. Then we actually cancelled stuff.',
    name: 'Early user',
    role: 'Email',
  },
];

function formatUsd(n) {
  if (!Number.isFinite(n)) return '$0';
  return '$' + Math.floor(n).toLocaleString('en-US');
}

function useCountdown(ms) {
  const [remaining, setRemaining] = useState(ms);
  useEffect(() => {
    if (!Number.isFinite(ms) || ms <= 0) return;
    const i = setInterval(() => setRemaining((r) => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(i);
  }, [ms]);
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  return { h, m, s, total: remaining };
}

function LiveCounter() {
  const [total, setTotal] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/stats', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (!cancelled && Number.isFinite(d?.total)) setTotal(d.total); })
      .catch(() => { /* non-fatal */ });
    return () => { cancelled = true; };
  }, []);
  if (total === null) return null;
  return (
    <div className="inline-flex items-center gap-2 bg-rose-950/40 border border-rose-800/30 px-4 py-2 rounded-full">
      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" aria-hidden />
      <span className="text-[11px] text-rose-200">
        <strong className="font-bold text-rose-100 tabular-nums">{formatUsd(total)}</strong> in 10-year subscription waste calculated so far
      </span>
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
          <span className="ml-3 text-[10px] text-slate-600 font-mono">billvampire.com/verdict</span>
        </div>
        <div className="p-8 sm:p-10">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3 text-center">You are bleeding</p>
          <p className="font-gothic text-3xl sm:text-4xl font-black text-rose-500 text-center tabular-nums mb-6">$127.94 / month</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3 text-center">Over 10 years</p>
          <p className="font-gothic text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-rose-400 via-rose-500 to-rose-700 text-center tabular-nums mb-8 leading-none">
            $15,352
          </p>
          <div className="space-y-2.5">
            {[
              { name: '1. ChatGPT Plus', amount: 2400, pct: 100 },
              { name: '2. Netflix Premium', amount: 1858, pct: 77 },
              { name: '3. Adobe Creative Cloud', amount: 6557, pct: 90 },
              { name: '4. Spotify Family', amount: 1920, pct: 52 },
            ].map(r => (
              <div key={r.name} className="bg-[#141420]/80 rounded-xl border border-slate-800/40 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-200">{r.name}</span>
                  <span className="text-xs font-bold text-rose-400 tabular-nums">${r.amount.toLocaleString()}</span>
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

const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/bill-vampire-patrol/PLACEHOLDER_EXT_ID';

function isChromeDesktop() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isChrome = /Chrome\//.test(ua) && !/Edg\/|OPR\//.test(ua);
  const isMobile = /Android|iPhone|iPad/.test(ua);
  return isChrome && !isMobile;
}

export default function Landing({ onEnterApp, onLegal }) {
  const [openFaq, setOpenFaq] = useState(null);
  const viewedRef = useRef(false);
  const price = getCurrentPrice();
  const showCountdown = isFoundingWindow();
  const remaining = showCountdown ? foundingWindowRemainingMs() : 0;
  const { h, m, s } = useCountdown(remaining);

  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    track('landing_viewed', { is_pro: isPro(), price_tier: price.tier });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnter = (source) => {
    track('landing_cta_clicked', { source });
    onEnterApp();
  };

  const faqs = [
    {
      q: 'What do I get for free vs Pro?',
      a: `Free: scan one bill, see your monthly subscription bleed, track subscriptions manually. Pro (${price.label} one-time): the full 10-year waste number, the leaderboard of shame ranking every sub by damage, 5 uncensored AI roasts, unlimited bill parsing, unwatermarked share cards, and unlimited PDF exports. Pay once, keep forever.`,
    },
    {
      q: 'What data leaves my device?',
      a: "Your subscription list lives in your browser's localStorage — nothing is uploaded to any server. When you scan a bill, the text/image is sent to our AI proxy once for extraction and is never stored. We have no account system, no cookies, and no tracking beyond anonymous analytics.",
    },
    {
      q: 'Why $19 for a verdict?',
      a: 'Because the verdict pays for itself in one cancelled subscription. The average user discovers $200+/month in waste they forgot about. Cancel even one — say a $15/mo service you forgot — and Pro has paid for itself in 38 days. Plus you keep the roasts forever.',
    },
    {
      q: 'Which AI powers the verdict?',
      a: 'Google Gemini 2.5 Flash via our secured backend proxy. Bill Vampire is independent and not affiliated with Google. The roast is entertainment — do not take it as professional financial advice.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B11] text-slate-100 overflow-x-hidden">

      <ZhBanner onEnterApp={() => handleEnter('zh_banner')} />

      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 bg-[#0B0B11]/80 backdrop-blur-xl border-b border-slate-800/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}icons/icon.png`} alt="Bill Vampire" className="w-8 h-8 rounded-lg" />
            <span className="font-gothic text-lg font-bold text-slate-100 hidden sm:block">Bill Vampire</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={getCheckoutUrl('nav')} target="_blank" rel="noopener noreferrer"
              onClick={() => track('checkout_clicked', { source: 'nav' })}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors cursor-pointer no-underline">
              <FontAwesomeIcon icon={faCrown} className="w-3 h-3" /> Get the Verdict
            </a>
            <button onClick={() => handleEnter('nav')}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-500 transition-colors cursor-pointer">
              Get my verdict <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        {/* Background video — watermark cropped via clip-path */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, zIndex: 0,
            overflow: 'hidden',
          }}
        >
          <video
            src="/bg.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              /* Scale + shift to crop the Kling watermark in the bottom-right */
              transform: 'scale(1.12) translate(-2%, -3%)',
              clipPath: 'inset(0 5% 12% 0)',
              opacity: 0.35,
              willChange: 'transform',
            }}
          />
          {/* Dark gradient overlay — keeps text legible */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, #0B0B11cc 0%, #0B0B1180 40%, #0B0B11cc 100%)',
          }} />
        </div>

        <div className="absolute top-12 left-[10%] w-72 h-72 bg-rose-900/20 rounded-full blur-[100px]" style={{ zIndex: 1 }} />
        <div className="absolute top-40 right-[5%] w-96 h-96 bg-violet-900/15 rounded-full blur-[120px]" style={{ zIndex: 1 }} />

        <div className="max-w-5xl mx-auto px-6 relative" style={{ zIndex: 2 }}>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-rose-950/40 border border-rose-800/30 px-4 py-1.5 rounded-full mb-7 landing-fade-in">
              <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3 text-rose-400" />
              <span className="text-[11px] font-medium text-rose-300">
                Drop a bill. See your monthly bleed for free. Unlock the 10-year verdict for {price.label}.
              </span>
            </div>

            <h1 className="font-gothic text-4xl sm:text-5xl lg:text-[3.6rem] font-bold text-slate-100 tracking-tight leading-[1.1] mb-6 landing-fade-in landing-delay-1">
              How much have you wasted on<br className="hidden sm:block" />{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600">
                subscriptions in the last 10 years?
              </span>
            </h1>

            <p className="text-base lg:text-lg text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed landing-fade-in landing-delay-2">
              Drop a bill. We’ll show you — with numbers, a receipt-by-receipt leaderboard, and an AI verdict you’ll want to screenshot.
            </p>

            <div className="flex flex-col items-center gap-4 landing-fade-in landing-delay-3">
              <button onClick={() => handleEnter('hero')}
                className="inline-flex items-center gap-2 px-10 py-4 bg-rose-600 text-white text-sm font-semibold rounded-2xl hover:bg-rose-500 transition-all shadow-xl shadow-rose-900/30 group cursor-pointer">
                Get my verdict — free
                <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <span className="text-[11px] text-slate-600">No signup · Data stays on your device</span>
              <LiveCounter />
            </div>
          </div>

          <div className="max-w-2xl mx-auto landing-fade-in landing-delay-4">
            <VerdictMockup />
          </div>
        </div>
      </section>

      {/* ===== FOUNDING WINDOW BANNER ===== */}
      {showCountdown && (
        <section className="py-8 border-y border-amber-800/30 bg-gradient-to-r from-amber-950/20 via-rose-950/20 to-amber-950/20">
          <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-[0.2em] mb-1">Founding Vampire · limited window</p>
              <p className="text-sm text-slate-200">Pro is <strong className="text-amber-300">$12 one-time</strong> for new visitors. Goes back to $19 after the window closes.</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
              <div className="text-center min-w-[42px]">
                <p key={`h-${h}`} className="font-gothic text-2xl font-bold text-amber-300 tabular-nums animate-tickPulse">{String(h).padStart(2, '0')}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">hours</p>
              </div>
              <span className="text-amber-500 animate-pulse text-xl">:</span>
              <div className="text-center min-w-[42px]">
                <p key={`m-${m}`} className="font-gothic text-2xl font-bold text-amber-300 tabular-nums animate-tickPulse">{String(m).padStart(2, '0')}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">min</p>
              </div>
              <span className="text-rose-500 animate-pulse text-xl">:</span>
              <div className="text-center min-w-[42px]">
                <p key={`s-${s}`} className="font-gothic text-2xl font-bold text-rose-400 tabular-nums animate-tickPulse drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">{String(s).padStart(2, '0')}</p>
                <p className="text-[9px] text-rose-500/70 uppercase tracking-widest">sec</p>
              </div>
              <button onClick={() => openCheckout('founding_banner')}
                className="ml-2 sm:ml-4 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all cursor-pointer animate-subtleBeat">
                Lock in $12
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ===== HOW IT WORKS (3 acts) ===== */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-[#0B0B11] via-[#0F0F18] to-[#0B0B11]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-4">Three acts. Ninety seconds.</h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              No signup, no credit card, no empty dashboard waiting for you to type in 27 services.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: faWandMagicSparkles, title: 'Scan',
                desc: 'Drop any bill, statement PDF, or billing email. The AI finds every recurring charge in seconds.',
                step: '01',
              },
              {
                icon: faSkull, title: 'Verdict',
                desc: 'See your monthly bleed, your 10-year total, and a leaderboard of shame with a line-by-line AI roast.',
                step: '02',
              },
              {
                icon: faBolt, title: 'Kill',
                desc: 'Pick the vampires you’re cancelling. We track the savings and gamify your no-spend streak.',
                step: '03',
              },
            ].map(s => (
              <div key={s.title} className="bg-[#141420]/70 rounded-2xl p-6 border border-slate-800/40">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em] mb-4">Step {s.step}</p>
                <div className="inline-flex w-11 h-11 rounded-xl bg-rose-950/40 border border-rose-800/30 items-center justify-center mb-4">
                  <FontAwesomeIcon icon={s.icon} className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PATROL (Chrome Extension) ===== */}
      <section className="py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-violet-950/40 border border-violet-800/30 px-4 py-1.5 rounded-full mb-5">
              <FontAwesomeIcon icon={faChrome} className="w-3 h-3 text-violet-400" />
              <span className="text-[11px] font-medium text-violet-300">New · Bill Vampire Patrol</span>
            </div>
            <h2 className="font-gothic text-2xl lg:text-4xl font-bold text-slate-100 mb-4">
              Your bodyguard, living in Gmail.
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              The tracker catches what you remember. The Patrol catches what you forgot — the renewal you didn’t read, the trial that turned into a subscription, the 6th streaming service you didn’t authorise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: faChrome, title: 'Scans Gmail daily',
                desc: 'Read-only OAuth. Local regex matches ~150 billers on device. Only matched charges sync — never your inbox.',
              },
              {
                icon: faBell, title: 'Charge-date alerts',
                desc: 'Ping 24 hours before Netflix bills. One tap opens the cancel page. Kill it before it kills your balance.',
              },
              {
                icon: faEnvelope, title: 'Sunday digest',
                desc: 'Every week: what you paid, what got cancelled, one brutal AI line about the leftover vampires.',
              },
            ].map(s => (
              <div key={s.title} className="bg-[#141420]/70 rounded-2xl p-6 border border-violet-900/30">
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
              <p className="text-xs font-bold text-violet-300 uppercase tracking-[0.2em] mb-1">$4.99 / month · cancel any time</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                The Verdict is a one-shot weapon. The Patrol is the night shift — working while you sleep, stopped the second you tell it to.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer"
                onClick={() => track('extension_install_clicked', { source: 'patrol_section' })}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#141420] border border-slate-700/50 text-slate-200 text-xs font-semibold rounded-xl hover:bg-[#1C1C2A] transition-all cursor-pointer no-underline">
                <FontAwesomeIcon icon={faChrome} className="w-3.5 h-3.5 text-violet-400" />
                Install free — detect up to 5
              </a>
              <button onClick={() => openPatrolCheckout('monthly', 'patrol_section')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-rose-500 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-violet-900/30 cursor-pointer">
                <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5" />
                Upgrade to Patrol — $4.99/mo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WALL OF VERDICTS ===== */}
      <section className="py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-rose-400 uppercase tracking-widest mb-3">Wall of Verdicts</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-4">Real numbers. Real receipts.</h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              A sample of what Bill Vampire users found hiding in their statements. Your number is on the other side of the scan.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WALL_OF_VERDICTS.map((v, i) => (
              <div key={i} className="bg-gradient-to-br from-[#141420] to-[#0D0D15] rounded-2xl p-6 border border-slate-800/40">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.25em] mb-2">10-year waste</p>
                <p className="font-gothic text-3xl font-black text-rose-500 tabular-nums mb-3">{formatUsd(v.amount)}</p>
                <p className="text-sm text-slate-300 leading-relaxed mb-3">{v.quip}</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider">{v.tag}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-[#0B0B11] via-[#0F0F18] to-[#0B0B11]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-amber-400 uppercase tracking-widest mb-3">Early voices</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-3">From people who already got the verdict</h2>
            <p className="text-xs text-slate-600">More reviews coming — send yours to <a href="mailto:hello@billvampire.com" className="text-rose-400 no-underline">hello@billvampire.com</a></p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="bg-[#141420]/70 rounded-2xl p-6 border border-slate-800/40">
                <blockquote className="text-sm text-slate-300 leading-relaxed mb-4 italic">“{t.quote}”</blockquote>
                <figcaption className="text-[11px] text-slate-500">
                  <strong className="text-slate-400 not-italic">{t.name}</strong> · {t.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-amber-400 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-3">
              One price. <span className="text-amber-400">The full picture.</span>
            </h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              See your monthly bleed for free. Pay once to unlock the full 10-year damage report, leaderboard, and the roasts you'll screenshot.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {/* FREE */}
            <div className="bg-[#141420]/80 rounded-2xl p-7 border border-slate-800/50 flex flex-col">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Free</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-slate-100">$0</span>
              </div>
              <p className="text-[11px] text-slate-600 mb-6">No signup. No credit card.</p>
              <ul className="text-xs text-slate-400 space-y-3 mb-8 flex-1">
                {[
                  'Unlimited manual subscription tracking',
                  'One free AI bill scan',
                  'Monthly total revealed (10-year locked)',
                  'Watermarked share card',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <FontAwesomeIcon icon={faCheck} className="text-emerald-400 mt-0.5 shrink-0 w-3 h-3" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleEnter('pricing_free')}
                className="w-full py-3 text-xs font-medium text-slate-300 bg-[#1C1C2A] rounded-xl hover:bg-[#252536] transition-colors cursor-pointer border border-slate-700/30">
                Start free
              </button>
            </div>

            {/* PRO one-time — THE VERDICT */}
            <div className="relative bg-gradient-to-br from-amber-950/30 to-rose-950/30 rounded-2xl p-7 border border-amber-700/30 flex flex-col shadow-lg shadow-amber-950/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-bold px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                MOST POPULAR · ONE-TIME
              </div>
              <p className="text-xs text-amber-400 uppercase tracking-widest mb-1 mt-2">Pro · The Full Verdict</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold text-slate-100">{price.label}</span>
                {showCountdown && <span className="text-sm text-slate-500 line-through">$19</span>}
              </div>
              <p className="text-[11px] text-slate-500 mb-6">{showCountdown ? 'Founding Vampire window — expires soon' : 'Pay once. Keep the verdict forever.'}</p>
              <ul className="text-xs text-slate-300 space-y-3 mb-8 flex-1">
                {[
                  'The full 10-year waste number',
                  'Leaderboard of shame (ranked by damage)',
                  'Unlimited AI bill parsing (paste / upload)',
                  '5 uncensored AI roasts per verdict',
                  'Unwatermarked share card',
                  'Unlimited PDF export',
                  'Priority support',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <FontAwesomeIcon icon={faCheck} className="text-amber-400 mt-0.5 shrink-0 w-3 h-3" /> {item}
                  </li>
                ))}
              </ul>
              <a href={getCheckoutUrl('pricing')} target="_blank" rel="noopener noreferrer"
                onClick={() => track('checkout_clicked', { source: 'pricing' })}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-rose-900/30 cursor-pointer flex items-center justify-center gap-1.5 no-underline">
                <FontAwesomeIcon icon={faCrown} className="w-3 h-3" />
                Get the Verdict — {price.label}
              </a>
              <p className="text-[10px] text-slate-600 text-center mt-3">
                <FontAwesomeIcon icon={faLock} className="w-2.5 h-2.5 mr-1" />
                Secured by Creem · 3-day refund
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-[#0B0B11] via-[#0F0F18] to-[#0B0B11]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100">The real questions</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#141420]/60 rounded-xl border border-slate-800/40 overflow-hidden">
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
      <section className="py-20 lg:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-rose-950/10 to-transparent -z-10" />
        <div className="max-w-2xl mx-auto px-6 text-center">
          <img src={`${import.meta.env.BASE_URL}icons/icon.png`} alt="Bill Vampire" className="w-16 h-16 mx-auto mb-6 rounded-2xl shadow-lg shadow-rose-900/20" />
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-4">
            Ready to see the damage?
          </h2>
          <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto">
            90 seconds. One bill. The number will not be small.
          </p>
          <button onClick={() => handleEnter('final_cta')}
            className="inline-flex items-center gap-2 px-10 py-4 bg-rose-600 text-white text-sm font-semibold rounded-2xl hover:bg-rose-500 transition-all shadow-xl shadow-rose-900/30 group cursor-pointer">
            Get my verdict
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ===== FOUNDER STRIP ===== */}
      <section className="py-10 border-t border-slate-800/40">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-900/60 to-violet-900/60 border border-rose-800/40 flex items-center justify-center shrink-0">
            <span className="font-gothic text-lg font-bold text-rose-300">J</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-300 leading-relaxed mb-2">
              Built in the open by one indie maker who got tired of $9.99 line items. Pro is a one-time judgement of your past — buy it, keep it, print the PDF. Patrol is monthly because it’s actually doing new work every day — stop paying the second it stops catching stuff. Two products, two jobs, two honest price tags.
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
      <footer className="border-t border-slate-800/40 py-10">
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
    </div>
  );
}
