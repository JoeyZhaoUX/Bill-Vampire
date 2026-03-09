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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xs" onClick={e => e.stopPropagation()}>
        <div ref={cardRef}
          className="bg-gradient-to-br from-[#1C1C2A] via-[#141420] to-[#1A1028] p-8 rounded-3xl shadow-2xl border border-slate-700/40">
          <div className="text-center mb-6">
            <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="Bill Vampire" className="w-16 h-16 mx-auto mb-3 rounded-xl" />
            <h2 className="text-lg font-bold text-slate-100 tracking-wide font-serif">{t('shareTitle')}</h2>
          </div>

          <div className="bg-[#0B0B11]/60 backdrop-blur rounded-2xl p-5 mb-4 text-center border border-rose-800/20">
            <div className="text-3xl font-black text-rose-500 mb-1">
              {currency}{monthlyTotal.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500">{t('shareMonthly')}</p>
          </div>

          <div className="bg-[#0B0B11]/60 backdrop-blur rounded-2xl p-4 mb-4 border border-slate-700/30">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">{t('shareBiggest')}</p>
            <p className="text-sm font-bold text-slate-200">{biggest.name} — {biggest.price}/{biggest.cycle === 'monthly' ? 'mo' : 'yr'}</p>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-slate-600 tracking-wider">{t('shareTagline')}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose}
            className="flex-1 py-3 text-xs font-medium text-slate-400 bg-[#141420]/80 backdrop-blur rounded-2xl hover:bg-[#1C1C2A] transition-colors cursor-pointer min-h-[44px]">
            {t('cancel')}
          </button>
          <button onClick={handleShare}
            className="flex-1 py-3 text-xs font-medium text-white bg-rose-600 rounded-2xl hover:bg-rose-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 cursor-pointer min-h-[44px]">
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
