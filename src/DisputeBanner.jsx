import React, { useState } from 'react';
import { openFounderReviewCheckout, FOUNDER_REVIEW_PRICE } from './pro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';

const DISMISS_KEY = 'vampire_dispute_banner_dismissed';

export default function DisputeBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DISMISS_KEY) !== 'true';
  });

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setVisible(false);
  };

  const handleCheckout = () => {
    openFounderReviewCheckout('top_dispute_banner', { entry: 'global_banner' });
  };

  return (
    <div className="relative z-50 bg-gradient-to-r from-violet-950/90 via-[#141420] to-rose-950/90 border-b border-violet-800/30 text-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center gap-3 text-[12px] leading-snug justify-between">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[10px] font-bold text-violet-300 uppercase tracking-widest bg-violet-950/50 border border-violet-800/40 px-1.5 py-0.5 rounded">
            REFUND DENIED?
          </span>
          <span className="text-slate-300">
            Did Adobe, Canva, or another merchant refuse your refund? Bypass support and dispute it with your bank.
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <button
            type="button"
            onClick={handleCheckout}
            className="shrink-0 px-3 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-rose-600 hover:brightness-110 text-white text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-lg shadow-violet-900/20"
          >
            <FontAwesomeIcon icon={faCrown} className="w-2.5 h-2.5" />
            Get Dispute Kit — {FOUNDER_REVIEW_PRICE.label}
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="shrink-0 text-slate-500 hover:text-slate-300 text-sm px-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
