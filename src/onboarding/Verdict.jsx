import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faShareNodes, faArrowRight, faSkull, faSpinner, faCrown, faShieldHalved, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faChrome } from '@fortawesome/free-brands-svg-icons';
import {
  totalMonthlyUsd, tenYearTotalUsd, rankByLifetimeWaste,
  generateVerdict, reportVerdictToStats,
} from './verdict';
import {
  isPro, canAiRoast, incrementAiUsage, openCheckout, getCurrentPrice,
  hasConsumedFreeVerdict, markFreeVerdictConsumed,
  openPatrolCheckout, isPatrol,
} from '../pro';
import { track } from '../analytics';
import ZhBanner from '../ZhBanner';

function formatUsd(n, decimals = 0) {
  if (!Number.isFinite(n)) return '$0';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function useDigitRoll(target, durationMs = 1800, startWhen = true) {
  const [value, setValue] = useState(0);
  const raf = useRef();
  useEffect(() => {
    if (!startWhen) return;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, durationMs, startWhen]);
  return value;
}

export default function Verdict({ subscriptions, onContinue, onShare }) {
  const monthly = useMemo(() => totalMonthlyUsd(subscriptions), [subscriptions]);
  const tenYear = useMemo(() => tenYearTotalUsd(subscriptions), [subscriptions]);
  const ranked = useMemo(() => rankByLifetimeWaste(subscriptions), [subscriptions]);
  const maxTenYear = ranked[0]?._tenYearUsd || 1;

  const [phase, setPhase] = useState('monthly');
  const [verdict, setVerdict] = useState(null);
  const [verdictError, setVerdictError] = useState('');

  const monthlyAnim = useDigitRoll(monthly, 1400, true);
  const tenYearAnim = useDigitRoll(tenYear, 2200, phase !== 'monthly');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tenyear'), 1600);
    const t2 = setTimeout(() => setPhase('roasts'), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    track('verdict_rendered', {
      subs: subscriptions.length,
      monthly_usd: Math.round(monthly),
      ten_year_usd: Math.round(tenYear),
      is_pro: isPro(),
    });
    reportVerdictToStats(tenYear);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!subscriptions.length) return;
      const pro = isPro();
      if (!pro) {
        if (hasConsumedFreeVerdict() && !canAiRoast()) {
          setVerdict({ headline: 'Unlock Pro to read the uncensored verdict.', roasts: [] });
          return;
        }
        markFreeVerdictConsumed();
      }
      if (!canAiRoast()) {
        setVerdict({ headline: 'Unlock Pro to read the uncensored verdict.', roasts: [] });
        return;
      }
      incrementAiUsage();
      try {
        const v = await generateVerdict(subscriptions);
        if (!cancelled) setVerdict(v);
      } catch (err) {
        if (!cancelled) setVerdictError(String(err?.message || err));
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pro = isPro();
  const visibleRoasts = pro ? verdict?.roasts || [] : (verdict?.roasts || []).slice(0, 2);
  const hiddenCount = pro ? 0 : Math.max(0, (verdict?.roasts?.length || 0) - visibleRoasts.length);
  const price = getCurrentPrice();

  useEffect(() => {
    if (!pro && visibleRoasts.length > 0) {
      track('paywall_seen', { ten_year_usd: Math.round(tenYear) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleRoasts.length]);

  return (
    <div className="min-h-screen bg-[#0B0B11] text-slate-100 relative overflow-hidden">
      <ZhBanner />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[60%] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(136, 19, 55, 0.3) 0%, transparent 60%)' }}
      />

      <header className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}icons/icon.png`} alt="Bill Vampire" className="w-8 h-8 rounded-lg" />
          <span className="font-gothic text-sm font-bold tracking-wider">Bill Vampire</span>
        </div>
        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em]">Step 2 of 3 — The Verdict</span>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 pb-16">

        <section className="py-12 text-center">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.25em] mb-4">You are bleeding</p>
          <div className="font-gothic text-5xl sm:text-6xl font-black text-rose-500 tabular-nums mb-2">
            {formatUsd(monthlyAnim, 2)}
          </div>
          <p className="text-sm text-slate-500">per month — every month — on subscriptions</p>
        </section>

        <div className={`transition-opacity duration-700 ${phase !== 'monthly' ? 'opacity-100' : 'opacity-0'}`}>
          <section className="py-10 border-t border-slate-800/40 text-center">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.25em] mb-4">Over 10 years, that's</p>
            <div className="font-gothic text-6xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-rose-400 via-rose-500 to-rose-700 tabular-nums leading-none mb-4">
              {formatUsd(tenYearAnim, 0)}
            </div>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              That's a car. A year of rent. A down-payment on a house. You're paying it in $12 monthly slices.
            </p>
          </section>
        </div>

        <div className={`transition-opacity duration-700 ${phase === 'roasts' ? 'opacity-100' : 'opacity-0'}`}>

          <section className="py-10 border-t border-slate-800/40">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
              <FontAwesomeIcon icon={faSkull} className="w-3.5 h-3.5 text-rose-400" />
              Leaderboard of Shame
            </h2>
            <div className="space-y-2.5">
              {ranked.map((s, i) => {
                const pct = Math.max(6, (s._tenYearUsd / maxTenYear) * 100);
                return (
                  <div key={s.id || i} className="bg-[#141420]/70 rounded-xl border border-slate-800/40 p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-100">{i + 1}. {s.name}</span>
                      <span className="text-xs font-bold text-rose-400 tabular-nums">{formatUsd(s._tenYearUsd, 0)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#0B0B11] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-rose-700 to-rose-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1.5">${s._monthlyUsd.toFixed(2)}/mo × 120 months</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="py-10 border-t border-slate-800/40">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-5">The Verdict</h2>
            {!verdict && !verdictError && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin text-rose-400" />
                The vampire is composing your roast…
              </div>
            )}
            {verdictError && (
              <p className="text-sm text-rose-400">{verdictError}</p>
            )}
            {verdict && (
              <>
                <p className="font-gothic text-xl sm:text-2xl text-slate-100 leading-snug mb-6">
                  "{verdict.headline}"
                </p>
                <ol className="space-y-3 mb-6">
                  {visibleRoasts.map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                      <span className="text-rose-500 font-bold shrink-0">{i + 1}.</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ol>

                {!pro && hiddenCount > 0 && (
                  <div className="relative bg-[#141420]/70 rounded-2xl border border-amber-700/30 overflow-hidden">
                    <div aria-hidden className="absolute inset-0 p-5 blur-md select-none pointer-events-none">
                      <ol className="space-y-3">
                        {Array.from({ length: hiddenCount }).map((_, i) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-400">
                            <span className="text-rose-500 font-bold shrink-0">{visibleRoasts.length + i + 1}.</span>
                            <span>████████ ███ ████████████ ████ ██████ ███ ██████████ ████████ ██████ ██████████ ██████████ ████████ ████.</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="relative z-10 p-6 text-center">
                      <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 items-center justify-center mb-3 shadow-lg shadow-rose-900/30">
                        <FontAwesomeIcon icon={faLock} className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-slate-100 mb-1">The remaining {hiddenCount} roasts are brutal.</p>
                      <p className="text-xs text-slate-400 mb-5 max-w-sm mx-auto">
                        Unlock the full verdict — plus unlimited scans, re-runs, and a watermark-free share card.
                        <strong className="text-amber-300"> {price.label} one-time</strong>. Pay once, keep forever.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                        <button onClick={() => openCheckout('verdict_paywall')}
                          className="inline-flex flex-col items-center gap-1 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-rose-900/30 cursor-pointer">
                          <span className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faCrown} className="w-3.5 h-3.5" />
                            Unlock Pro — {price.label}
                          </span>
                          <span className="text-[9px] font-medium text-white/80 uppercase tracking-widest">one-time</span>
                        </button>
                        <button onClick={() => openPatrolCheckout('monthly', 'verdict_paywall')}
                          className="inline-flex flex-col items-center gap-1 px-5 py-3.5 bg-[#141420] border border-violet-700/50 text-slate-100 text-xs font-bold rounded-2xl hover:bg-[#1C1C2A] transition-all cursor-pointer">
                          <span className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-violet-300" />
                            Add Patrol — $4.99/mo
                          </span>
                          <span className="text-[9px] font-medium text-violet-300/80 uppercase tracking-widest">scans Gmail daily</span>
                        </button>
                      </div>

                      {price.tier === 'founding' && (
                        <p className="text-[10px] text-amber-300/80 mt-3 uppercase tracking-widest">
                          Founding Vampire pricing — 72-hour window
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {pro && !isPatrol() && (
                  <div className="mt-6 bg-gradient-to-br from-violet-950/40 to-rose-950/20 rounded-2xl border border-violet-700/30 p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
                    <div className="flex items-start gap-3 text-left">
                      <div className="inline-flex w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-700/40 items-center justify-center shrink-0">
                        <FontAwesomeIcon icon={faChrome} className="w-4 h-4 text-violet-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-100 mb-0.5">Still seeing new vampires sneak in?</p>
                        <p className="text-xs text-slate-400 leading-relaxed">Install the Patrol — it scans Gmail daily and catches them before the first charge clears.</p>
                      </div>
                    </div>
                    <button onClick={() => openPatrolCheckout('monthly', 'verdict_pro_upsell')}
                      className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-rose-500 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-violet-900/30 cursor-pointer">
                      <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3" />
                      Add Patrol — $4.99/mo
                    </button>
                  </div>
                )}

                <EmailDigestCapture monthly={monthly} tenYear={tenYear} />
              </>
            )}
          </section>

          <section className="py-10 border-t border-slate-800/40 flex flex-col sm:flex-row gap-3">
            <button onClick={onShare}
              className="flex-1 py-3.5 bg-[#141420] hover:bg-[#1C1C2A] rounded-2xl text-sm font-semibold text-slate-200 border border-slate-800/50 transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <FontAwesomeIcon icon={faShareNodes} className="w-4 h-4 text-rose-400" />
              Share the damage
            </button>
            <button onClick={onContinue}
              className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 rounded-2xl text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
              Pick a vampire to kill
              <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

function EmailDigestCapture({ monthly, tenYear }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(() => (
    typeof localStorage !== 'undefined' && localStorage.getItem('vampire_digest_subscribed') === 'true' ? 'done' : 'idle'
  ));
  const [error, setError] = useState('');

  if (status === 'done') return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('That doesn\u2019t look like an email.');
      return;
    }
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/email-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, monthly_usd: Math.round(monthly || 0), ten_year_usd: Math.round(tenYear || 0) }),
      });
      if (!res.ok) throw new Error('subscribe failed');
      localStorage.setItem('vampire_digest_subscribed', 'true');
      track('digest_subscribed', { ten_year_usd: Math.round(tenYear || 0) });
      setStatus('done');
    } catch {
      setError('Couldn\u2019t subscribe right now. Try again in a bit.');
      setStatus('idle');
    }
  };

  return (
    <div className="mt-6 bg-[#141420]/70 rounded-2xl border border-slate-800/50 p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="inline-flex w-10 h-10 rounded-xl bg-rose-950/40 border border-rose-800/30 items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-rose-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100 mb-0.5">Sunday vampire report</p>
          <p className="text-xs text-slate-400 leading-relaxed">A short weekly email: what you paid, what got cancelled, one brutal line. Unsubscribe any time.</p>
        </div>
      </div>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          placeholder="you@domain.com"
          className="flex-1 px-4 py-2.5 bg-[#0B0B11] border border-slate-800/60 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-600/60" />
        <button type="submit" disabled={status === 'loading'}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap">
          {status === 'loading' ? 'Sending\u2026' : 'Send me Sundays'}
        </button>
      </form>
      {error && <p className="text-[11px] text-rose-400 mt-2">{error}</p>}
    </div>
  );
}
