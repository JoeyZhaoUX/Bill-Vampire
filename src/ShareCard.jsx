import React, { useRef, useCallback } from 'react';
import { Share2, Download } from 'lucide-react';

export default function ShareCard({ monthlyTotal, subscriptions, currency, t, onClose }) {
  const cardRef = useRef(null);

  const biggest = subscriptions.reduce((max, sub) => {
    const price = parseFloat(sub.price) || 0;
    const maxPrice = parseFloat(max.price) || 0;
    return price > maxPrice ? sub : max;
  }, subscriptions[0] || { name: '-', price: 0 });

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;

    // Try native share API first (mobile), fallback to clipboard
    const shareText = `${t('shareTitle')}\n${currency}${monthlyTotal.toFixed(2)} ${t('shareMonthly')}\n${t('shareBiggest')} ${biggest.name}\n\n${t('shareTagline')}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: t('shareTitle'), text: shareText });
      } catch (e) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('Copied to clipboard!');
    }
  }, [monthlyTotal, subscriptions, currency, t, biggest]);

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xs" onClick={e => e.stopPropagation()}>
        <div ref={cardRef}
          className="bg-gradient-to-br from-rose-50 via-white to-indigo-50 p-8 rounded-3xl shadow-2xl border border-white/60">
          <div className="text-center mb-6">
            <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="Bill Vampire" className="w-16 h-16 mx-auto mb-3 rounded-xl" />
            <h2 className="text-lg font-bold text-slate-800 tracking-wide">{t('shareTitle')}</h2>
          </div>

          <div className="bg-white/70 backdrop-blur rounded-2xl p-5 mb-4 text-center">
            <div className="text-3xl font-black text-rose-500 mb-1">
              {currency}{monthlyTotal.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">{t('shareMonthly')}</p>
          </div>

          <div className="bg-white/70 backdrop-blur rounded-2xl p-4 mb-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">{t('shareBiggest')}</p>
            <p className="text-sm font-bold text-slate-700">{biggest.name} — {biggest.price}/{biggest.cycle === 'monthly' ? 'mo' : 'yr'}</p>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-slate-400 tracking-wider">{t('shareTagline')}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose}
            className="flex-1 py-3 text-xs font-medium text-slate-500 bg-white/80 backdrop-blur rounded-2xl hover:bg-white transition-colors">
            {t('cancel')}
          </button>
          <button onClick={handleShare}
            className="flex-1 py-3 text-xs font-medium text-white bg-rose-500 rounded-2xl hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-200">
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
