import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport, faSpinner, faCheck, faXmark, faWandMagicSparkles, faArrowRight, faPen } from '@fortawesome/free-solid-svg-icons';
import { extractBills } from './verdict';
import { canSmartImport, markSmartImportUsed, isPro, getCurrentPrice, openCheckout } from '../pro';
import { track } from '../analytics';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';

export default function Scan({ onComplete, onSkipToManual }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setFileName(f.name);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const run = async () => {
    if (!canSmartImport()) {
      track('scan_blocked_paywall');
      openCheckout('scan_limit');
      return;
    }
    if (!text.trim() && !file) {
      textareaRef.current?.focus();
      return;
    }
    setIsExtracting(true);
    setError('');
    track('scan_started', { has_text: !!text.trim(), has_file: !!file });
    const startedAt = Date.now();
    try {
      const bills = await extractBills({ text, file });
      markSmartImportUsed();
      const elapsed = Date.now() - startedAt;
      // Let the user feel the AI work for at least 1.8s — snap-fast reads as fake.
      if (elapsed < 1800) await new Promise(r => setTimeout(r, 1800 - elapsed));
      track('scan_succeeded', { count: bills.length });
      onComplete(bills);
    } catch (err) {
      track('scan_failed', { message: String(err?.message || err).slice(0, 120) });
      setError('The AI got confused. Try clearer text or a sharper screenshot.');
      setIsExtracting(false);
    }
  };

  const price = getCurrentPrice();
  const scanBlocked = !isPro() && !canSmartImport();

  return (
    <div className="min-h-screen bg-[#0B0B11] text-slate-100 flex flex-col">
      <div className="absolute top-0 left-[10%] w-80 h-80 bg-rose-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-40 right-[5%] w-96 h-96 bg-violet-900/15 rounded-full blur-[140px] pointer-events-none" />

      <header className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}icons/icon.png`} alt="Bill Vampire" className="w-8 h-8 rounded-lg" />
          <span className="font-gothic text-sm font-bold tracking-wider">Bill Vampire</span>
        </div>
        <button onClick={onSkipToManual}
          className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer">
          <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
          I'll type them in instead
        </button>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <span className="inline-block text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em] mb-4">Step 1 of 3 — Scan</span>
            <h1 className="font-gothic text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">
              Drop any bill.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600">
                We'll find every vampire hiding in it.
              </span>
            </h1>
            <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Credit-card statement PDF, Apple subscription email, bank export, screenshot of your iPhone's Subscriptions screen — anything.
              The AI reads it, pulls out every recurring charge, and hands you a verdict.
            </p>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="relative bg-[#141420]/80 backdrop-blur rounded-3xl border-2 border-dashed border-slate-700/60 hover:border-rose-700/50 transition-colors p-8 sm:p-10">

            <label className="block cursor-pointer text-center mb-6">
              <input ref={inputRef} type="file" accept={ACCEPT} className="hidden"
                onChange={e => handleFile(e.target.files?.[0])} />
              {!file ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-950/40 border border-rose-800/30 flex items-center justify-center">
                    <FontAwesomeIcon icon={faFileImport} className="w-6 h-6 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-100 mb-1">Drop a file or click to browse</p>
                    <p className="text-[11px] text-slate-500">JPG · PNG · PDF — up to ~10 MB</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-[#1C1C2A] rounded-xl border border-emerald-700/30 px-4 py-3 text-left">
                  <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs text-slate-300 truncate flex-1">{fileName}</span>
                  <button onClick={(e) => { e.preventDefault(); setFile(null); setFileName(''); }}
                    className="text-rose-400 hover:text-rose-300 cursor-pointer shrink-0">
                    <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </label>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-slate-800/50" />
              <span className="text-[9px] text-slate-600 uppercase tracking-[0.2em]">or paste text</span>
              <div className="flex-1 h-px bg-slate-800/50" />
            </div>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your billing email, SMS notification, or credit-card statement here…"
              className="w-full bg-[#1C1C2A] rounded-xl border border-slate-700/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none resize-none h-28 focus:border-rose-700/50 transition-colors"
            />

            {error && (
              <p className="text-xs text-rose-400 mt-3 text-center">{error}</p>
            )}

            {scanBlocked && (
              <div className="mt-5 bg-amber-950/30 border border-amber-700/30 rounded-2xl p-4 text-center">
                <p className="text-xs text-amber-200 mb-3">
                  You've used your free scan. Unlock unlimited scans with Pro — <strong>{price.label} one-time</strong>. Pay once, keep forever.
                </p>
                <button onClick={() => openCheckout('scan_limit')}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all cursor-pointer">
                  Unlock Pro
                </button>
              </div>
            )}

            <button
              onClick={run}
              disabled={isExtracting || (!text.trim() && !file)}
              className="w-full mt-6 py-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl text-sm font-bold text-white shadow-xl shadow-rose-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
              {isExtracting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                  The vampire is reading…
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4" />
                  Deliver my verdict
                  <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-600 text-center mt-6">
            Files are sent to our AI once and never stored. Your subscription list lives in your browser — we don't have an account system.
          </p>
        </div>
      </main>
    </div>
  );
}
