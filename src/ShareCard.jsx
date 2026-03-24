import React, { useRef, useCallback, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareNodes, faDownload, faCopy, faCheck, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { faXTwitter, faFacebook, faWhatsapp, faWeixin } from '@fortawesome/free-brands-svg-icons';
import { toPng } from 'html-to-image';

export default function ShareCard({ monthlyTotal, subscriptions, currency, t, onClose }) {
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [generating, setGenerating] = useState(true);

  const biggest = subscriptions.reduce((max, sub) => {
    const price = parseFloat(sub.price) || 0;
    const maxPrice = parseFloat(max.price) || 0;
    return price > maxPrice ? sub : max;
  }, subscriptions[0] || { name: '-', price: 0 });

  const amountStr = `${currency}${monthlyTotal.toFixed(2)}`;
  const viralText = t('shareViralText').replace('${amount}', amountStr);
  const shareText = `${viralText}\n\n${t('shareTagline')}`;
  const shareUrl = 'https://billvampire.com';

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return null;
    await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
    return dataUrl;
  }, []);

  const dataUrlToBlob = (dataUrl) => {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    return new Blob([array], { type: mime });
  };

  // Auto-generate image on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const dataUrl = await generateImage();
      if (!cancelled && dataUrl) {
        setImageUrl(dataUrl);
        setGenerating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [generateImage]);

  const handleNativeShare = useCallback(async () => {
    if (!imageUrl || !navigator.share) return;
    try {
      const blob = dataUrlToBlob(imageUrl);
      const file = new File([blob], 'vampire-report.png', { type: 'image/png' });
      const data = { title: t('shareTitle'), text: shareText, files: [file] };
      if (navigator.canShare && navigator.canShare(data)) {
        await navigator.share(data);
      } else {
        await navigator.share({ title: t('shareTitle'), text: shareText });
      }
    } catch {}
  }, [imageUrl, shareText, t]);

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.download = 'vampire-report.png';
    link.href = imageUrl;
    link.click();
  }, [imageUrl]);

  const handleCopy = useCallback(async () => {
    if (!imageUrl) return;
    try {
      const blob = dataUrlToBlob(imageUrl);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [imageUrl, shareText]);

  const openTwitter = () => {
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank', 'noopener');
  };

  const openFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank', 'noopener');
  };

  const openWhatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank', 'noopener');
  };

  const handleWechat = useCallback(() => {
    if (!imageUrl) return;
    // Download the image, then prompt user to share via WeChat from album
    const link = document.createElement('a');
    link.download = 'vampire-report.png';
    link.href = imageUrl;
    link.click();
    alert(t('shareWechatTip'));
  }, [imageUrl, t]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xs relative" onClick={e => e.stopPropagation()}>
        {/* Card for image generation — hidden offscreen once image is captured */}
        <div ref={cardRef}
          className={`bg-gradient-to-br from-[#1C1C2A] via-[#141420] to-[#1A1028] p-8 rounded-3xl shadow-2xl border border-slate-700/40${imageUrl ? ' absolute -left-[9999px]' : ''}`}>
          <div className="text-center mb-6">
            <img src={`${import.meta.env.BASE_URL}icons/icon-192x192.png`} alt="Bill Vampire" className="w-16 h-16 mx-auto mb-3 rounded-xl" crossOrigin="anonymous" />
            <h2 className="text-lg font-bold text-slate-100 tracking-wide font-gothic">{t('shareTitle')}</h2>
          </div>

          {/* Viral headline */}
          <div className="bg-[#0B0B11]/60 backdrop-blur rounded-2xl p-5 mb-4 text-center border border-rose-800/20">
            <div className="text-3xl font-black text-rose-500 mb-1">
              {amountStr}
            </div>
            <p className="text-xs text-slate-500">{t('shareMonthly')}</p>
          </div>

          <div className="bg-[#0B0B11]/60 backdrop-blur rounded-2xl p-4 mb-5 border border-slate-700/30">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">{t('shareBiggest')}</p>
            <p className="text-sm font-bold text-slate-200">{biggest.name} — {biggest.price}/{biggest.cycle === 'monthly' ? 'mo' : 'yr'}</p>
          </div>

          {/* Watermark */}
          <div className="text-center pt-2 border-t border-slate-700/20">
            <p className="text-[10px] text-slate-600 tracking-wider mb-1">{t('shareTagline')}</p>
            <p className="text-[9px] text-slate-700 tracking-widest uppercase">{t('shareMadeWith')}</p>
          </div>
        </div>

        {/* Share panel */}
        <div className="mt-4 space-y-3">
          {/* Image preview or loading */}
          {imageUrl ? (
            <div className="rounded-xl overflow-hidden border border-slate-700/30">
              <img src={imageUrl} alt="Preview" className="w-full" />
            </div>
          ) : (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-xs text-slate-400">{t('generating')}</span>
            </div>
          )}

          {/* Social share buttons */}
          <div className="grid grid-cols-5 gap-2">
            <button onClick={openTwitter} disabled={!imageUrl}
              className="py-3 bg-[#141420]/80 rounded-2xl hover:bg-[#1C1C2A] transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[44px] disabled:opacity-40">
              <FontAwesomeIcon icon={faXTwitter} className="w-4 h-4 text-white" />
              <span className="text-[10px] text-slate-400">X</span>
            </button>
            <button onClick={openFacebook} disabled={!imageUrl}
              className="py-3 bg-[#141420]/80 rounded-2xl hover:bg-[#1C1C2A] transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[44px] disabled:opacity-40">
              <FontAwesomeIcon icon={faFacebook} className="w-4 h-4 text-[#1877F2]" />
              <span className="text-[10px] text-slate-400">Facebook</span>
            </button>
            <button onClick={openWhatsapp} disabled={!imageUrl}
              className="py-3 bg-[#141420]/80 rounded-2xl hover:bg-[#1C1C2A] transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[44px] disabled:opacity-40">
              <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4 text-[#25D366]" />
              <span className="text-[10px] text-slate-400">WhatsApp</span>
            </button>
            <button onClick={handleWechat} disabled={!imageUrl}
              className="py-3 bg-[#141420]/80 rounded-2xl hover:bg-[#1C1C2A] transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[44px] disabled:opacity-40">
              <FontAwesomeIcon icon={faWeixin} className="w-4 h-4 text-[#07C160]" />
              <span className="text-[10px] text-slate-400">WeChat</span>
            </button>
            {navigator.share && (
              <button onClick={handleNativeShare} disabled={!imageUrl}
                className="py-3 bg-[#141420]/80 rounded-2xl hover:bg-[#1C1C2A] transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[44px] disabled:opacity-40">
                <FontAwesomeIcon icon={faEllipsis} className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] text-slate-400">More</span>
              </button>
            )}
          </div>

          {/* Download & Copy */}
          <div className="flex gap-2">
            <button onClick={handleDownload} disabled={!imageUrl}
              className="flex-1 py-3 bg-rose-600 rounded-2xl hover:bg-rose-500 transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-40">
              <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-medium text-white">Download</span>
            </button>
            <button onClick={handleCopy} disabled={!imageUrl}
              className="flex-1 py-3 bg-[#141420]/80 rounded-2xl hover:bg-[#1C1C2A] transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-40">
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={`w-3.5 h-3.5 ${copied ? 'text-green-400' : 'text-slate-400'}`} />
              <span className="text-xs font-medium text-slate-300">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <button onClick={onClose}
            className="w-full py-3 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors cursor-pointer min-h-[44px]">
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
