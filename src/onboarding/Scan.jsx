import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileImport, faSpinner, faCheck, faXmark, faWandMagicSparkles,
  faArrowRight, faPen, faMicrophone, faStop, faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { extractBills } from './verdict';
import { ISSUE_TYPES, getIssueType } from './emergencyKit';
import {
  canSmartImport, markSmartImportUsed, isPro, EMERGENCY_KIT_PRICE,
  openEmergencyKitCheckout,
} from '../pro';
import { track } from '../analytics';
import ZhBanner from '../ZhBanner';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';

function readSourcePage() {
  try {
    return JSON.parse(localStorage.getItem('vampire_source_page') || 'null');
  } catch {
    return null;
  }
}

export default function Scan({ onComplete, onSkipToManual }) {
  const [text, setText] = useState(() => (
    typeof localStorage !== 'undefined' ? localStorage.getItem('vampire_tool_prefill') || '' : ''
  ));
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [issueType, setIssueType] = useState(() => (
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('vampire_issue_type') || 'surprise_charge'
      : 'surprise_charge'
  ));
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() => (
    typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  ));
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch { /* ignore stop errors */ }
    };
  }, []);

  const selectIssueType = (id) => {
    setIssueType(id);
    localStorage.setItem('vampire_issue_type', id);
    track('scan_issue_selected', { issue_type: id });
  };

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
      openEmergencyKitCheckout('scan_limit');
      return;
    }
    if (!text.trim() && !file) {
      textareaRef.current?.focus();
      return;
    }
    setIsExtracting(true);
    setError('');
    const sourcePage = readSourcePage();
    track('scan_started', {
      has_text: !!text.trim(),
      has_file: !!file,
      issue_type: issueType,
      source_page: sourcePage?.path,
      source: sourcePage?.source,
      service: sourcePage?.service,
    });
    const startedAt = Date.now();
    try {
      const bills = await extractBills({ text, file });
      markSmartImportUsed();
      const elapsed = Date.now() - startedAt;
      // Let the user feel the AI work for at least 1.8s — snap-fast reads as fake.
      if (elapsed < 1800) await new Promise(r => setTimeout(r, 1800 - elapsed));
      localStorage.removeItem('vampire_tool_prefill');
      track('scan_succeeded', {
        count: bills.length,
        issue_type: issueType,
        source_page: sourcePage?.path,
        source: sourcePage?.source,
        service: sourcePage?.service,
      });
      onComplete(bills, { issueType, rawText: text, sourcePage });
    } catch (err) {
      track('scan_failed', { message: String(err?.message || err).slice(0, 120) });
      setError('The AI got confused. Try clearer text or a sharper screenshot.');
      setIsExtracting(false);
    }
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser. You can still type or paste the bill.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onstart = () => {
        setIsListening(true);
        setError('');
        track('voice_input_started', { issue_type: issueType });
      };
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0]?.transcript || '')
          .join(' ')
          .trim();
        if (transcript) setText(transcript);
      };
      recognition.onerror = () => {
        setError('Voice input stopped. Try again, or type the bill details.');
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setError('Voice input could not start. You can still type or paste the bill.');
      setIsListening(false);
    }
  };

  const stopVoice = () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore stop errors */ }
    setIsListening(false);
  };

  const currentIssue = getIssueType(issueType);
  const price = EMERGENCY_KIT_PRICE;
  const scanBlocked = !isPro() && !canSmartImport();

  return (
    <div className="bv-brutal min-h-screen bg-[#0B0B11] text-slate-100 flex flex-col">
      <ZhBanner />
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
            <span className="inline-block text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em] mb-4">Step 1 of 3 — Pick the emergency</span>
            <h1 className="font-gothic text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">
              Stop the next charge.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600">
                Build a cancel and refund kit.
              </span>
            </h1>
            <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Choose the situation, paste a billing email or say it out loud. Bill Vampire extracts the service and gives you the first move before you pay.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {ISSUE_TYPES.map(issue => (
              <button key={issue.id} onClick={() => selectIssueType(issue.id)}
                className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${issueType === issue.id ? 'bg-rose-950/40 border-rose-600/50 shadow-lg shadow-rose-950/20' : 'bg-[#141420]/60 border-slate-800/50 hover:border-slate-700'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faBolt} className={`w-3.5 h-3.5 ${issueType === issue.id ? 'text-rose-300' : 'text-slate-600'}`} />
                  <p className="text-sm font-semibold text-slate-100">{issue.title}</p>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{issue.headline}</p>
              </button>
            ))}
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="relative bg-[#141420]/80 backdrop-blur rounded-3xl border-2 border-dashed border-slate-700/60 hover:border-rose-700/50 transition-colors p-8 sm:p-10">

            <div className="bv-scan-evidence-visual" aria-hidden="true">
              <img src={`${import.meta.env.BASE_URL}brand/bill-evidence-still.webp`} alt="" />
              <div>
                <span>Evidence desk</span>
                <strong>Receipt, refund draft, cancel proof, reminder</strong>
              </div>
            </div>

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
              <span className="text-[9px] text-slate-600 uppercase tracking-[0.2em]">or paste / speak</span>
              <div className="flex-1 h-px bg-slate-800/50" />
            </div>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={currentIssue.prompt}
              className="w-full bg-[#1C1C2A] rounded-xl border border-slate-700/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none resize-none h-28 focus:border-rose-700/50 transition-colors"
            />

            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] text-slate-600">
                Example: "I started a Canva trial and it renews next Tuesday for $119."
              </p>
              <button type="button"
                onClick={isListening ? stopVoice : startVoice}
                disabled={!speechSupported}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${speechSupported ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${isListening ? 'bg-rose-600 text-white' : 'bg-[#0D0D15] border border-slate-800/70 text-slate-300 hover:bg-[#1C1C2A]'}`}>
                <FontAwesomeIcon icon={isListening ? faStop : faMicrophone} className="w-3 h-3" />
                {isListening ? 'Stop listening' : 'Speak it'}
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-400 mt-3 text-center">{error}</p>
            )}

            {scanBlocked && (
              <div className="mt-5 bg-amber-950/30 border border-amber-700/30 rounded-2xl p-4 text-center">
                <p className="text-xs text-amber-200 mb-3">
                  You've used your free parse. Unlock the Vampire Emergency Kit for <strong>{price.label}</strong>: refund script, cancel path, chargeback checklist, and reminder copy.
                </p>
                <button onClick={() => openEmergencyKitCheckout('scan_limit')}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all cursor-pointer">
                  Unlock Emergency Kit — {price.label}
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
                  Build my free preview
                  <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-600 text-center mt-6">
            Files are sent to our AI once and never stored. See results in guest mode, then create an account to save case files, reminders, and purchases.
          </p>
        </div>
      </main>
    </div>
  );
}
