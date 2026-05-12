import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowRight, faSkull } from '@fortawesome/free-solid-svg-icons';
import { track } from '../analytics';

export default function EmailGate({ subscriptionCount, onContinue, onSkip }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email to continue.');
      return;
    }
    setStatus('loading');
    setError('');
    try {
      await fetch('/api/email-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'email_gate', subs_count: subscriptionCount }),
      });
    } catch {}
    localStorage.setItem('vampire_email', email);
    localStorage.setItem('vampire_digest_subscribed', 'true');
    track('email_gate_submitted', { subs_count: subscriptionCount });
    onContinue();
  };

  const skip = () => {
    track('email_gate_skipped');
    onSkip();
  };

  return (
    <div className="min-h-screen bg-[#0B0B11] text-slate-100 flex flex-col items-center justify-center px-6">
      <div className="absolute top-0 left-[10%] w-80 h-80 bg-rose-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-40 right-[5%] w-96 h-96 bg-violet-900/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-900/60 to-violet-900/60 items-center justify-center mb-6 border border-rose-700/30">
          <FontAwesomeIcon icon={faSkull} className="w-7 h-7 text-rose-400" />
        </div>

        <h1 className="font-gothic text-2xl sm:text-3xl font-bold leading-tight mb-3">
          We found <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600">{subscriptionCount} vampires</span> in your bill.
        </h1>

        <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
          Your verdict is ready. Drop your email and we'll also send you a weekly check-in — which subs you cancelled, which are still bleeding you, and one brutal AI line.
        </p>

        <form onSubmit={submit} className="space-y-3 mb-4">
          <div className="relative">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="you@email.com"
              className="w-full pl-11 pr-4 py-3.5 bg-[#141420] border border-slate-700/50 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-600/60 transition-colors"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 rounded-xl text-sm font-bold text-white shadow-xl shadow-rose-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {status === 'loading' ? 'Sending…' : 'Show me the verdict'}
            {status !== 'loading' && <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />}
          </button>
        </form>

        <button onClick={skip}
          className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer">
          Skip — I'll just see the numbers
        </button>
      </div>
    </div>
  );
}
