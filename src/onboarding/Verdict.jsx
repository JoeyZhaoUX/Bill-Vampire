import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faShareNodes, faArrowRight, faSkull, faSpinner, faCrown, faShieldHalved, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import {
  totalMonthlyUsd, tenYearTotalUsd, rankByLifetimeWaste,
  generateVerdict, reportVerdictToStats,
} from './verdict';
import {
  isPro, canAiRoast, incrementAiUsage,
  isPatrol, isEmergencyKitUnlocked, openEmergencyKitCheckout, EMERGENCY_KIT_PRICE,
} from '../pro';
import { generateEmergencyKit } from './emergencyKit';
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
  const [copied, setCopied] = useState('');

  const monthlyAnim = useDigitRoll(monthly, 1400, true);
  const tenYearAnim = useDigitRoll(tenYear, 2200, phase !== 'monthly');
  const issueType = useMemo(() => (
    typeof localStorage !== 'undefined' ? localStorage.getItem('vampire_issue_type') || 'surprise_charge' : 'surprise_charge'
  ), []);
  const rawText = useMemo(() => (
    typeof localStorage !== 'undefined' ? localStorage.getItem('vampire_last_raw_input') || '' : ''
  ), []);
  const emergencyKit = useMemo(() => generateEmergencyKit({ subscriptions, issueType, rawText }), [subscriptions, issueType, rawText]);

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
      if (!isPro()) return;
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
  const kitUnlocked = isEmergencyKitUnlocked();

  useEffect(() => {
    if (!pro) {
      track('kit_preview_seen', {
        ten_year_usd: Math.round(tenYear),
        issue_type: issueType,
        service: emergencyKit.service,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyText = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      track('kit_text_copied', { label, issue_type: issueType });
      setTimeout(() => setCopied(''), 1800);
    } catch {
      setCopied('');
    }
  };

  const downloadKit = () => {
    const lines = [
      `Bill Vampire Emergency Kit: ${emergencyKit.service}`,
      '',
      emergencyKit.riskLine,
      '',
      'Cancel script:',
      emergencyKit.cancelScript,
      '',
      'Refund script:',
      emergencyKit.refundScript,
      '',
      'Support chat script:',
      emergencyKit.chatScript,
      '',
      'Chargeback checklist:',
      ...emergencyKit.chargebackChecklist.map(i => `- ${i}`),
      '',
      'Evidence checklist:',
      ...emergencyKit.evidenceChecklist.map(i => `- ${i}`),
      '',
      emergencyKit.disclaimer,
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-vampire-${emergencyKit.service.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-emergency-kit.txt`;
    a.click();
    URL.revokeObjectURL(url);
    track('kit_downloaded', { issue_type: issueType });
  };

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
        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em]">Step 2 of 3 — Emergency Kit</span>
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
            {pro ? (
              <>
                <div className="font-gothic text-6xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-rose-400 via-rose-500 to-rose-700 tabular-nums leading-none mb-4">
                  {formatUsd(tenYearAnim, 0)}
                </div>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  That's a car. A year of rent. A down-payment on a house. You're paying it in $12 monthly slices.
                </p>
              </>
            ) : (
              <div className="relative">
                <div className="font-gothic text-6xl sm:text-7xl lg:text-8xl font-black text-rose-500/20 tabular-nums leading-none mb-4 blur-lg select-none pointer-events-none" aria-hidden>
                  {formatUsd(tenYear, 0)}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
                  <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 items-center justify-center mb-4 shadow-lg shadow-rose-900/30">
                    <FontAwesomeIcon icon={faLock} className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-base font-semibold text-slate-100 mb-2">The real fix is action, not another chart.</p>
                  <p className="text-xs text-slate-400 mb-5 max-w-sm mx-auto leading-relaxed">
                    Your decade number is the warning. The Emergency Kit gives you the refund script, cancel path, chargeback checklist, and reminder copy.
                    <strong className="text-amber-300"> {EMERGENCY_KIT_PRICE.label} one-time.</strong>
                  </p>
                  <button onClick={() => openEmergencyKitCheckout('ten_year_paywall')}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-sm font-bold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-rose-900/30 cursor-pointer">
                    <FontAwesomeIcon icon={faCrown} className="w-4 h-4" />
                    Unlock the kit — {EMERGENCY_KIT_PRICE.label}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className={`transition-opacity duration-700 ${phase === 'roasts' ? 'opacity-100' : 'opacity-0'}`}>

          <EmergencyKitSection
            kit={emergencyKit}
            unlocked={kitUnlocked}
            copied={copied}
            onCopy={copyText}
            onDownload={downloadKit}
            onUnlock={() => openEmergencyKitCheckout('kit_paywall')}
          />

          {pro && (
            <>
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
                    The vampire is writing the optional roast…
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
                      {(verdict.roasts || []).map((r, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                          <span className="text-rose-500 font-bold shrink-0">{i + 1}.</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ol>

                    {!isPatrol() && (
                      <div className="mt-6 bg-gradient-to-br from-violet-950/40 to-rose-950/20 rounded-2xl border border-violet-700/30 p-5 flex items-start gap-3">
                        <div className="inline-flex w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-700/40 items-center justify-center shrink-0">
                          <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-violet-300" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-100 mb-0.5">Patrol is coming soon</p>
                          <p className="text-xs text-slate-400 leading-relaxed">A Chrome extension that scans Gmail daily and catches new vampires before the first charge clears. We'll notify you when it launches.</p>
                        </div>
                      </div>
                    )}

                    <EmailDigestCapture monthly={monthly} tenYear={tenYear} />
                  </>
                )}
              </section>
            </>
          )}

          {!pro && (
            <section className="py-10 border-t border-slate-800/40">
              <EmailDigestCapture monthly={monthly} tenYear={tenYear} />
            </section>
          )}

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

function EmergencyKitSection({ kit, unlocked, copied, onCopy, onDownload, onUnlock }) {
  return (
    <section className="py-10 border-t border-slate-800/40">
      <div className="bg-gradient-to-br from-amber-950/30 via-rose-950/20 to-violet-950/20 rounded-3xl border border-amber-800/30 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] font-bold text-amber-300 uppercase tracking-[0.2em] mb-2">Vampire Emergency Kit</p>
            <h2 className="text-2xl font-bold text-slate-100 leading-tight">{kit.service}</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xl">{kit.riskLine}</p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">Detected amount</p>
            <p className="text-2xl font-black text-rose-400 tabular-nums">{kit.amount}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          {kit.previewSteps.map((step, i) => (
            <div key={step} className="bg-[#0B0B11]/50 rounded-2xl border border-slate-800/50 p-4">
              <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-2">Move {i + 1}</p>
              <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        {kit.cancelUrl && (
          <a href={kit.cancelUrl} target="_blank" rel="noopener noreferrer"
            onClick={() => track('kit_cancel_link_clicked', { service: kit.service })}
            className="mb-5 flex items-center justify-between gap-3 bg-[#0B0B11]/60 border border-emerald-800/30 rounded-2xl px-4 py-3 no-underline hover:border-emerald-600/50 transition-colors">
            <div>
              <p className="text-sm font-semibold text-emerald-300">Open known cancel page</p>
              <p className="text-[11px] text-slate-500 truncate">{kit.cancelUrl}</p>
            </div>
            <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          </a>
        )}

        {!unlocked ? (
          <div className="rounded-2xl border border-amber-700/30 bg-[#0B0B11]/70 p-5 text-center">
            <FontAwesomeIcon icon={faLock} className="w-5 h-5 text-amber-300 mb-3" />
            <p className="text-sm font-semibold text-slate-100 mb-2">Unlock the full cancel/refund kit for {EMERGENCY_KIT_PRICE.label}</p>
            <p className="text-xs text-slate-400 max-w-lg mx-auto mb-4 leading-relaxed">
              Includes refund email, support chat script, chargeback checklist, evidence checklist, and downloadable action plan. If it helps avoid one $19.99 renewal, it pays for itself 4x.
            </p>
            <button onClick={onUnlock}
              className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-sm font-bold rounded-2xl hover:brightness-110 transition-all cursor-pointer">
              <FontAwesomeIcon icon={faCrown} className="w-4 h-4" />
              Unlock Emergency Kit — {EMERGENCY_KIT_PRICE.label}
            </button>
            <p className="text-[10px] text-slate-600 mt-3">{kit.disclaimer}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              ['Refund email', kit.refundScript],
              ['Cancel email', kit.cancelScript],
              ['Support chat script', kit.chatScript],
            ].map(([label, text]) => (
              <div key={label} className="bg-[#0B0B11]/60 rounded-2xl border border-slate-800/50 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-sm font-semibold text-slate-100">{label}</p>
                  <button onClick={() => onCopy(label, text)}
                    className="px-3 py-1.5 rounded-lg bg-[#1C1C2A] text-[11px] font-semibold text-slate-300 hover:bg-[#252536] transition-colors cursor-pointer">
                    {copied === label ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{text}</p>
              </div>
            ))}

            <div className="grid sm:grid-cols-2 gap-4">
              <Checklist title="Chargeback checklist" items={kit.chargebackChecklist} />
              <Checklist title="Evidence checklist" items={kit.evidenceChecklist} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => onCopy('Reminder', kit.reminderText)}
                className="flex-1 py-3 bg-[#141420] hover:bg-[#1C1C2A] rounded-2xl text-sm font-semibold text-slate-200 border border-slate-800/50 transition-colors cursor-pointer">
                {copied === 'Reminder' ? 'Reminder copied' : 'Copy reminder text'}
              </button>
              <button onClick={onDownload}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 rounded-2xl text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition-colors cursor-pointer">
                Download kit
              </button>
            </div>
            <p className="text-[10px] text-slate-600 text-center">{kit.disclaimer}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Checklist({ title, items }) {
  return (
    <div className="bg-[#0B0B11]/60 rounded-2xl border border-slate-800/50 p-4">
      <p className="text-sm font-semibold text-slate-100 mb-3">{title}</p>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
            <span className="text-emerald-400 mt-0.5">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
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
      setError('That doesn’t look like an email.');
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
      setError('Couldn’t subscribe right now. Try again in a bit.');
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
          {status === 'loading' ? 'Sending…' : 'Send me Sundays'}
        </button>
      </form>
      {error && <p className="text-[11px] text-rose-400 mt-2">{error}</p>}
    </div>
  );
}
