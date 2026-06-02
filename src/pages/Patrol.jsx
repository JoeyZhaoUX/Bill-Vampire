import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved, faBell, faEnvelope, faEye, faArrowRight, faCheck, faLock,
} from '@fortawesome/free-solid-svg-icons';
import { faChrome } from '@fortawesome/free-brands-svg-icons';
import {
  openPatrolCheckout, PATROL_PRICE_MONTHLY, PATROL_PRICE_ANNUAL, isPatrol,
} from '../pro';
import { track } from '../analytics';
import DisputeBanner from '../DisputeBanner';

const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/bill-vampire-patrol/PLACEHOLDER_EXT_ID';

export default function Patrol({ onEnterApp, auth, onAuthRequest }) {
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    track('patrol_landing_viewed', { is_patrol: isPatrol() });
  }, []);

  return (
    <div className="bv-brutal min-h-screen bg-[#0B0B11] text-slate-100">
      <DisputeBanner />

      <nav className="sticky top-0 z-50 bg-[#0B0B11]/80 backdrop-blur-xl border-b border-slate-800/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={onEnterApp} className="flex items-center gap-3 cursor-pointer bg-transparent border-none">
            <img src={`${import.meta.env.BASE_URL}icons/icon.png`} alt="Bill Vampire" className="w-8 h-8 rounded-lg" />
            <span className="font-gothic text-lg font-bold text-slate-100 hidden sm:block">Bill Vampire</span>
          </button>
          <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer"
            onClick={() => track('extension_install_clicked', { source: 'patrol_nav' })}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-500 transition-colors cursor-pointer no-underline">
            <FontAwesomeIcon icon={faChrome} className="w-3 h-3" />
            Install for Chrome
          </a>
        </div>
      </nav>

      <section className="pt-16 pb-20 lg:pt-24 lg:pb-28 relative">
        <div className="absolute top-16 left-[10%] w-72 h-72 bg-violet-900/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute top-40 right-[5%] w-96 h-96 bg-rose-900/15 rounded-full blur-[120px] -z-10" />

        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-950/40 border border-violet-800/30 px-4 py-1.5 rounded-full mb-6">
            <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3 text-violet-400" />
            <span className="text-[11px] font-medium text-violet-300">Bill Vampire Patrol · Chrome extension</span>
          </div>

          <h1 className="font-gothic text-4xl sm:text-5xl lg:text-[3.6rem] font-bold leading-[1.1] mb-6">
            The vampire detector<br className="hidden sm:block" />{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-rose-500">
              that lives in your Gmail.
            </span>
          </h1>

          <p className="text-base lg:text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Patrol quietly reads your inbox every day. When a new subscription sneaks in, you see a rose toast — and one tap cancels or tracks it.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer"
              onClick={() => track('extension_install_clicked', { source: 'patrol_hero' })}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 to-rose-500 text-white text-sm font-bold rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-violet-900/30 cursor-pointer no-underline">
              <FontAwesomeIcon icon={faChrome} className="w-4 h-4" />
              Install free — detect up to 5
            </a>
            <button onClick={() => openPatrolCheckout('monthly', 'patrol_hero')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#141420] border border-slate-700/50 text-slate-200 text-sm font-semibold rounded-2xl hover:bg-[#1C1C2A] transition-all cursor-pointer">
              <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-violet-400" />
              Start Patrol — {PATROL_PRICE_MONTHLY.label}
            </button>
          </div>
          <p className="text-[11px] text-slate-600">Cancel any month · read-only Gmail access · your data never leaves Cloudflare</p>
          <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-[rgba(201,164,106,0.22)] bg-[#171217]/80 px-5 py-3">
            <span className="text-xs text-slate-400">
              {auth?.status === 'authenticated' ? `Signed in as ${auth.user?.email}` : 'Save detected subscriptions with an email account.'}
            </span>
            {auth?.status !== 'authenticated' && (
              <button onClick={() => onAuthRequest?.('patrol_save')} className="text-xs font-bold text-amber-300 cursor-pointer">
                Create account
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-[#0B0B11] via-[#0F0F18] to-[#0B0B11]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-3">What Patrol does</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100">Three jobs, forever running.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: faEye, title: 'Scans Gmail every day',
                desc: 'Google read-only OAuth. ~150 known billers matched locally by regex. Only matched charges sync to Bill Vampire — never your inbox.',
              },
              {
                icon: faBell, title: 'Charge-date alerts',
                desc: 'Push notification 24 hours before renewal. One tap opens the curated cancel URL. Kill it before it kills your balance.',
              },
              {
                icon: faEnvelope, title: 'Weekly digest',
                desc: 'Sunday email with what you paid, what you killed, and one brutal AI line about the vampires that survived.',
              },
            ].map(s => (
              <div key={s.title} className="bg-[#141420]/70 rounded-2xl p-6 border border-violet-900/30">
                <div className="inline-flex w-12 h-12 rounded-xl bg-violet-950/40 border border-violet-800/30 items-center justify-center mb-4">
                  <FontAwesomeIcon icon={s.icon} className="w-5 h-5 text-violet-300" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-3">Fair trade.</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">Patrol works every day. That’s what the monthly fee pays for.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-[#141420]/80 rounded-2xl p-7 border border-slate-800/50 flex flex-col">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Free</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-slate-100">$0</span>
              </div>
              <p className="text-[11px] text-slate-600 mb-6">Detect up to 5 subscriptions lifetime</p>
              <ul className="text-xs text-slate-400 space-y-3 mb-8 flex-1">
                {['5 detections lifetime', 'Gmail toast on new charges', 'Syncs with the web app', 'Weekly digest (shared)'].map(i => (
                  <li key={i} className="flex items-start gap-2.5">
                    <FontAwesomeIcon icon={faCheck} className="text-emerald-400 mt-0.5 shrink-0 w-3 h-3" /> {i}
                  </li>
                ))}
              </ul>
              <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer"
                onClick={() => track('extension_install_clicked', { source: 'patrol_pricing_free' })}
                className="w-full py-3 text-center text-xs font-medium text-slate-300 bg-[#1C1C2A] rounded-xl hover:bg-[#252536] transition-colors cursor-pointer border border-slate-700/30 no-underline">
                Install free
              </a>
            </div>

            <div className="relative bg-gradient-to-br from-violet-950/40 to-rose-950/20 rounded-2xl p-7 border border-violet-700/40 flex flex-col shadow-lg shadow-violet-950/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-rose-500 text-white text-[9px] font-bold px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                PATROL · MONTHLY
              </div>
              <p className="text-xs text-violet-300 uppercase tracking-widest mb-1 mt-2">Patrol</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold text-slate-100">{PATROL_PRICE_MONTHLY.label}</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-6">
                or <strong className="text-violet-200">{PATROL_PRICE_ANNUAL.label}</strong> annually · save 35%
              </p>
              <ul className="text-xs text-slate-300 space-y-3 mb-8 flex-1">
                {[
                  'Unlimited detections',
                  'Daily background Gmail poll',
                  'Charge-date push alerts',
                  'Curated cancel-URL library',
                  'Personalized weekly AI digest',
                  'Custom sender rules',
                  'Cancel in one click, any month',
                ].map(i => (
                  <li key={i} className="flex items-start gap-2.5">
                    <FontAwesomeIcon icon={faCheck} className="text-violet-300 mt-0.5 shrink-0 w-3 h-3" /> {i}
                  </li>
                ))}
              </ul>
              <button onClick={() => openPatrolCheckout('monthly', 'patrol_pricing')}
                className="w-full py-3 bg-gradient-to-r from-violet-500 to-rose-500 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-violet-900/30 cursor-pointer flex items-center justify-center gap-1.5">
                <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3" />
                Start Patrol — {PATROL_PRICE_MONTHLY.label}
              </button>
              <p className="text-[10px] text-slate-600 text-center mt-3">
                <FontAwesomeIcon icon={faLock} className="w-2.5 h-2.5 mr-1" />
                Secured by Creem · cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-slate-800/40">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-xl lg:text-2xl font-bold text-slate-100 mb-3">Haven’t scanned your bills yet?</h2>
          <p className="text-sm text-slate-400 mb-6">Start with the web verdict — see your 10-year number, then let Patrol catch what comes next.</p>
          <button onClick={onEnterApp}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-rose-600 text-white text-sm font-semibold rounded-2xl hover:bg-rose-500 transition-all shadow-xl shadow-rose-900/30 cursor-pointer">
            Get my verdict first
            <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
}
