import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTrash, faGhost, faBolt, faChartPie,
  faCircleCheck, faDownload, faQuoteLeft,
  faSpinner, faWandMagicSparkles, faReceipt, faMagnifyingGlass, faMugHot,
  faShareNodes, faCrown, faHeart, faGlobe, faLock, faArrowUpRightFromSquare, faChevronRight, faSkull, faFileImport, faXmark, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { t, getDefaultLang, SUPPORTED_LANGS } from './i18n';
import {
  isPro, canAiRoast, incrementAiUsage, aiUsesRemaining,
  canSmartImport, markSmartImportUsed,
  canPrintReport, markPrintReportUsed,
  openCheckout, getCheckoutUrl, openTip,
  getCurrentPrice, openPatrolCheckout, isPatrol,
  PATROL_PRICE_MONTHLY,
} from './pro';
import { injectAffiliateLinks, PREFERRED_ALTERNATIVES } from './affiliates';
import { track } from './analytics';
import {
  fireChargeDateNotifications, pendingToasts, markToastDelivered,
  notificationPermission, requestNotificationPermission, hasNotificationApi,
} from './sw-notifications';

// Lazy load heavy components
const LazyChart = lazy(() => import('./components/LazyChart'));
const ShareCard = lazy(() => import('./ShareCard'));
const PrintReport = lazy(() => import('./PrintReport'));

const API_ENDPOINT = '/api/gemini';

const CURRENCIES = {
  USD: { code: 'USD', flag: '\u{1F1FA}\u{1F1F8}', symbol: '$', rate: 1 },
  CNY: { code: 'CNY', flag: '\u{1F1E8}\u{1F1F3}', symbol: '¥', rate: 0.14 },
  EUR: { code: 'EUR', flag: '\u{1F1EA}\u{1F1FA}', symbol: '€', rate: 1.08 },
  GBP: { code: 'GBP', flag: '\u{1F1EC}\u{1F1E7}', symbol: '£', rate: 1.26 },
  JPY: { code: 'JPY', flag: '\u{1F1EF}\u{1F1F5}', symbol: '¥', rate: 0.0067 },
  HKD: { code: 'HKD', flag: '\u{1F1ED}\u{1F1F0}', symbol: 'HK$', rate: 0.128 },
};

const CATEGORY_KEYS = ['catEntertainment', 'catProductivity', 'catLifestyle', 'catOther'];
const CATEGORY_VALUES = ['Entertainment', 'Productivity', 'Lifestyle', 'Other'];
const CATEGORY_ICONS = { 'Entertainment': '\u{1F3AE}', 'Productivity': '⚡', 'Lifestyle': '\u{1F33F}', 'Other': '\u{1F4E6}' };

export default function App({ onLegal }) {
  const [lang, setLang] = useState(getDefaultLang);
  const [activeTab, setActiveTab] = useState('subs');
  const [subscriptions, setSubscriptions] = useState([]);
  const [noSpendDays, setNoSpendDays] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', price: '', currency: 'USD', cycle: 'monthly', category: 'Other' });
  const [aiAdvice, setAiAdvice] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAlternatives, setAiAlternatives] = useState('');
  const [alternativeLinks, setAlternativeLinks] = useState([]);
  const [isAlternativesLoading, setIsAlternativesLoading] = useState(false);
  const [aiDailyQuote, setAiDailyQuote] = useState('');
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [cancelledSubs, setCancelledSubs] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importFileName, setImportFileName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedBills, setExtractedBills] = useState(null);
  const [chargeToasts, setChargeToasts] = useState([]);
  const [notifPromptShown, setNotifPromptShown] = useState(false);

  const _ = (key) => t(lang, key);

  useEffect(() => {
    const savedSubs = localStorage.getItem('vampire_subs');
    const savedDays = localStorage.getItem('vampire_no_spend');
    const savedCancelled = localStorage.getItem('vampire_cancelled');
    if (savedSubs) setSubscriptions(JSON.parse(savedSubs));
    if (savedDays) setNoSpendDays(JSON.parse(savedDays));
    if (savedCancelled) setCancelledSubs(JSON.parse(savedCancelled));
  }, []);
  useEffect(() => { localStorage.setItem('vampire_subs', JSON.stringify(subscriptions)); }, [subscriptions]);

  // Charge-date push notifications (gated: only ask on 2nd+ visit).
  useEffect(() => {
    if (!hasNotificationApi()) return;
    const perm = notificationPermission();
    if (perm === 'granted') {
      fireChargeDateNotifications().then(({ toasts }) => { if (toasts.length) setChargeToasts(toasts); });
    } else if (perm === 'default') {
      const visits = parseInt(localStorage.getItem('vampire_visits') || '0', 10) + 1;
      localStorage.setItem('vampire_visits', String(visits));
      if (visits >= 2 && !notifPromptShown) {
        const upcoming = pendingToasts();
        if (upcoming.length > 0) setNotifPromptShown(true);
      }
    } else {
      const upcoming = pendingToasts();
      if (upcoming.length) setChargeToasts(upcoming);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions]);
  useEffect(() => { localStorage.setItem('vampire_no_spend', JSON.stringify(noSpendDays)); }, [noSpendDays]);
  useEffect(() => { localStorage.setItem('vampire_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('vampire_cancelled', JSON.stringify(cancelledSubs)); }, [cancelledSubs]);

  const monthlyTotal = useMemo(() => subscriptions.reduce((acc, sub) => {
    const price = parseFloat(sub.price) || 0;
    const rate = CURRENCIES[sub.currency || 'USD']?.rate || 1;
    const usd = price * rate;
    return acc + (sub.cycle === 'yearly' ? usd / 12 : usd);
  }, 0), [subscriptions]);

  const displayCurrency = '$';

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
  const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const todayString = `${currentMonthPrefix}-${String(currentDay).padStart(2, '0')}`;
  const currentStreak = noSpendDays.filter(d => d.startsWith(currentMonthPrefix)).length;

  const monthlySaved = useMemo(() => cancelledSubs.reduce((sum, s) => sum + (s.monthlyUSD || 0), 0), [cancelledSubs]);

  const toggleNoSpend = (date) => {
    if (date !== todayString) return;
    setNoSpendDays(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]);
  };

  const addSubscription = () => {
    if (!newSub.name || !newSub.price) return;
    setSubscriptions([...subscriptions, { ...newSub, id: Date.now() }]);
    setNewSub({ name: '', price: '', currency: 'USD', cycle: 'monthly', category: 'Other' });
    setShowAddModal(false);
    setAiAdvice(''); setAiAlternatives(''); setAlternativeLinks([]);
  };
  const deleteSub = (id) => {
    const sub = subscriptions.find(s => s.id === id);
    if (sub) {
      const price = parseFloat(sub.price) || 0;
      const rate = CURRENCIES[sub.currency || 'USD']?.rate || 1;
      const monthlyUSD = sub.cycle === 'yearly' ? (price * rate) / 12 : price * rate;
      setCancelledSubs(prev => [...prev, { name: sub.name, monthlyUSD, cancelledAt: Date.now() }]);
    }
    setSubscriptions(subscriptions.filter(s => s.id !== id));
    setAiAdvice(''); setAiAlternatives(''); setAlternativeLinks([]);
  };

  const callGeminiAPI = async (userPrompt, systemPrompt) => {
    if (!canAiRoast()) {
      setShowProModal(true);
      return _('aiLimitReached');
    }
    incrementAiUsage();
    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: userPrompt }] }], systemInstruction: { parts: [{ text: systemPrompt }] } }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const msg = typeof data.error === 'string' ? data.error : data.error?.message || 'Unknown error';
        console.error('Gemini API error:', msg);
        if (msg.includes('quota') || msg.includes('rate') || res.status === 429) {
          return lang === 'zh' ? 'AI 暂时繁忙，请稍后再试。' : 'AI is busy right now. Please try again in a minute.';
        }
        return lang === 'zh' ? 'AI 服务暂时不可用。' : 'AI service temporarily unavailable.';
      }
      return data.candidates?.[0]?.content?.parts?.[0]?.text || (lang === 'zh' ? 'AI 似乎在打盹。' : 'AI seems to be napping.');
    } catch (err) { console.error(err); return lang === 'zh' ? 'AI 暂时断网了。' : 'AI is offline. Probably saving electricity for you.'; }
  };

  const getAiAdvice = async () => {
    if (!subscriptions.length) return;
    setIsAiLoading(true);
    const list = subscriptions.map(s => `${s.name}($${(parseFloat(s.price) * (CURRENCIES[s.currency]?.rate || 1)).toFixed(2)}/${s.cycle === 'monthly' ? 'mo' : 'yr'})`).join(', ');
    const systemPrompt = lang === 'zh'
      ? '你是一个嘴欠、毒舌但心善的财务顾问。用幽默讽刺但最终带着暖意的语气，给出3点犬利点评和1个实用节省建议。不超过150字。'
      : 'You are a snarky, brutally honest but well-meaning financial advisor. Give 3 sharp roasts about the user\'s subscriptions and 1 practical saving tip. Keep it under 150 words. Be funny.';
    const result = await callGeminiAPI(
      `My subscriptions: ${list}. Monthly total: $${monthlyTotal.toFixed(2)}. Roast me.`,
      systemPrompt,
    );
    setAiAdvice(result); setIsAiLoading(false);
  };

  const getAiAlternatives = async () => {
    if (!subscriptions.length) return;
    setIsAlternativesLoading(true);
    const list = subscriptions.map(s => s.name).join(', ');
    const preferredList = PREFERRED_ALTERNATIVES.join(', ');
    const systemPrompt = lang === 'zh'
      ? `你是一个精通互联网工具的省钱极客。针对用户订阅列表，给出2-3个免费或更便宜的替代方案，格式简洁用bullet point，每条不超过30字。优先推荐以下产品（如果相关）：${preferredList}。务必写出产品的完整名称。`
      : `You are a savvy deal-finder who knows every free/cheap alternative to popular services. Give 2-3 free or cheaper alternatives for each subscription. Use bullet points, keep each under 30 words. When relevant, prefer recommending these products: ${preferredList}. Always use the full product name.`;
    const rawResult = await callGeminiAPI(
      `I'm paying for: ${list}. Find me free or cheaper alternatives!`,
      systemPrompt,
    );
    const { text, affiliateLinks } = injectAffiliateLinks(rawResult);
    setAiAlternatives(text);
    setAlternativeLinks(affiliateLinks);
    setIsAlternativesLoading(false);
  };

  const getAiDailyQuote = async () => {
    setIsQuoteLoading(true);
    const systemPrompt = lang === 'zh'
      ? '你是一个傲娇、毒舌的AI情绪伴侣。如果不消费天数少于5天要嘲讽但带鼓励；5天以上要夸奖但语气傲娇。回复限制在60字以内，可以用emoji。'
      : 'You are a snarky, tsundere AI companion. If no-spend days < 5, tease but encourage. If >= 5, praise but act like you don\'t care. Max 60 words. Use emojis.';
    const result = await callGeminiAPI(
      `This month has ${daysInMonth} days. I've had ${currentStreak} no-spend days. Today is day ${currentDay}. Give me motivation (or roast me).`,
      systemPrompt,
    );
    setAiDailyQuote(result); setIsQuoteLoading(false);
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleImportFile = (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) return;
    setImportFile(file);
    setImportFileName(file.name);
  };

  const extractBills = async () => {
    if (!importText.trim() && !importFile) return;
    if (!canSmartImport()) {
      track('import_blocked_paywall');
      setShowProModal(true);
      return;
    }
    markSmartImportUsed();
    setIsExtracting(true);
    setExtractedBills(null);

    const systemPrompt = lang === 'zh'
      ? '你是一个账单提取专家。从用户提供的文本或图片中提取所有订阅/扣款信息。返回JSON数组，每个元素包含：name（服务名称）、price（数字金额）、currency（USD/CNY/EUR/GBP/JPY/HKD之一）、cycle（monthly或yearly）、category（Entertainment/Productivity/Lifestyle/Other之一）。如果无法确定某个字段，使用合理的默认值。只返回JSON数组，不要其他文本。'
      : 'You are a bill extraction expert. Extract all subscription/billing info from the user\'s text or image. Return a JSON array where each element has: name (service name), price (numeric amount), currency (one of USD/CNY/EUR/GBP/JPY/HKD), cycle (monthly or yearly), category (one of Entertainment/Productivity/Lifestyle/Other). Use reasonable defaults for uncertain fields. Return ONLY the JSON array, no other text.';

    try {
      const parts = [];
      if (importText.trim()) {
        parts.push({ text: importText.trim() });
      }
      if (importFile) {
        const base64 = await fileToBase64(importFile);
        parts.push({ inline_data: { mime_type: importFile.type, data: base64 } });
      }
      if (parts.every(p => !p.text)) {
        parts.unshift({ text: 'Extract subscription/billing information from this image or document.' });
      }

      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const msg = typeof data.error === 'string' ? data.error : data.error?.message || 'Unknown error';
        console.error('Extract error:', msg);
        setExtractedBills([]);
        setIsExtracting(false);
        return;
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const parsed = JSON.parse(text);
      const bills = (Array.isArray(parsed) ? parsed : [parsed]).map(b => ({
        name: b.name || 'Unknown',
        price: String(parseFloat(b.price) || 0),
        currency: CURRENCIES[b.currency] ? b.currency : 'USD',
        cycle: b.cycle === 'yearly' ? 'yearly' : 'monthly',
        category: CATEGORY_VALUES.includes(b.category) ? b.category : 'Other',
      })).filter(b => b.name !== 'Unknown' || parseFloat(b.price) > 0);
      setExtractedBills(bills.length > 0 ? bills : []);
    } catch (err) {
      console.error('Extract error:', err);
      setExtractedBills([]);
    }
    setIsExtracting(false);
  };

  const addExtractedBills = () => {
    if (!extractedBills?.length) return;
    const newSubs = extractedBills.map(b => ({ ...b, id: Date.now() + Math.random() }));
    setSubscriptions(prev => [...prev, ...newSubs]);
    setShowImportModal(false);
    setImportText('');
    setImportFile(null);
    setImportFileName('');
    setExtractedBills(null);
  };

  const resetImportModal = () => {
    setShowImportModal(false);
    setImportText('');
    setImportFile(null);
    setImportFileName('');
    setExtractedBills(null);
    setIsExtracting(false);
  };

  const exportPDF = () => {
    if (!canPrintReport()) {
      track('print_blocked_paywall');
      setShowProModal(true);
      return;
    }
    markPrintReportUsed();
    track('print_started');
    window.print();
  };

  const rerunVerdict = () => {
    track('rerun_verdict_clicked');
    window.location.hash = 'verdict';
    window.location.reload();
  };

  const pieLabels = CATEGORY_KEYS.map(k => _(k));
  const pieData = {
    labels: pieLabels,
    datasets: [{
      data: CATEGORY_VALUES.map(cat =>
        subscriptions.filter(s => s.category === cat).reduce((sum, s) => {
          const price = parseFloat(s.price) || 0;
          const rate = CURRENCIES[s.currency || 'USD']?.rate || 1;
          const usd = price * rate;
          return sum + (s.cycle === 'yearly' ? usd / 12 : usd);
        }, 0)
      ),
      backgroundColor: ['#FB7185', '#A78BFA', '#34D399', '#FBBF24'],
      borderWidth: 2, borderColor: '#141420', hoverOffset: 6,
    }],
  };
  const pieOptions = { plugins: { legend: { position: 'bottom', labels: { font: { size: 13 }, padding: 14, color: '#94A3B8' } } }, maintainAspectRatio: false };

  const tabs = [
    { id: 'subs', label: _('tabBills'), icon: faGhost },
    { id: 'no-spend', label: _('tabCheckin'), icon: faCircleCheck },
    { id: 'stats', label: _('tabStats'), icon: faChartPie },
  ];

  const weekDays = [_('sun'), _('mon'), _('tue'), _('wed'), _('thu'), _('fri'), _('sat')];

  const remaining = aiUsesRemaining();

  const enableChargeNotifs = async () => {
    track('notif_permission_requested');
    const result = await requestNotificationPermission();
    track('notif_permission_result', { result });
    setNotifPromptShown(false);
    if (result === 'granted') {
      const { toasts } = await fireChargeDateNotifications();
      if (toasts.length) setChargeToasts(toasts);
    } else {
      setChargeToasts(pendingToasts());
    }
  };

  const dismissToast = (id) => {
    markToastDelivered(id);
    setChargeToasts((prev) => prev.filter(t => t.id !== id));
  };

  return (
    <>
    <div className="app-screen min-h-screen bg-gothic-pattern">
      {notifPromptShown && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] max-w-md w-[calc(100%-2rem)] bg-[#141420] border border-rose-700/40 rounded-2xl p-4 shadow-2xl shadow-rose-900/30">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/40 flex items-center justify-center">
              <FontAwesomeIcon icon={faSkull} className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-100 mb-1">Want to know before a vampire bites?</p>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">We’ll ping you 24 hours before any subscription renews. No account, no spam.</p>
              <div className="flex gap-2">
                <button onClick={enableChargeNotifs}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                  Turn on alerts
                </button>
                <button onClick={() => { setNotifPromptShown(false); track('notif_permission_dismissed'); }}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {chargeToasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[80] flex flex-col gap-2 max-w-sm">
          {chargeToasts.map(t => (
            <div key={t.id} className="bg-[#141420] border border-rose-700/40 rounded-xl p-3 shadow-xl shadow-rose-900/20 flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-800/40 flex items-center justify-center">
                <FontAwesomeIcon icon={faGhost} className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-100">{t.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{t.body}</p>
              </div>
              <button onClick={() => dismissToast(t.id)} aria-label="Dismiss"
                className="shrink-0 text-slate-600 hover:text-slate-300 cursor-pointer">
                <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Skip navigation for keyboard users */}
      <a href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-slate-100 focus:text-slate-900 focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg">
        Skip to main content
      </a>

      {/* ========== MOBILE TOP HEADER ========== */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#0D0D15]/95 backdrop-blur-xl border-b border-slate-800/40">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}icons/icon.png`} alt="Bill Vampire logo" className="w-7 h-7 rounded-lg shadow-sm" />
            <div className="font-gothic text-sm font-bold text-slate-100 tracking-wider">{_('appName')}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider leading-none mb-0.5" aria-hidden="true">drain</p>
              <p className="text-rose-400 font-bold text-base leading-none" aria-label={`${_('monthlyLoss')} ${displayCurrency}${monthlyTotal.toFixed(2)}`}>{displayCurrency}{monthlyTotal.toFixed(2)}</p>
            </div>
            <div className="flex gap-0.5" role="group" aria-label="Language selector">
              {SUPPORTED_LANGS.map(l => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  aria-pressed={lang === l.code}
                  className={`text-[9px] px-1.5 py-1 rounded-md transition-colors cursor-pointer ${lang === l.code ? 'bg-slate-700/70 text-slate-200' : 'text-slate-600 hover:text-slate-400'}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-screen flex flex-col lg:flex-row">

        {/* ========== SIDEBAR ========== */}
        <aside className="hidden lg:block lg:w-72 xl:w-80 lg:min-h-screen lg:sticky lg:top-0 shrink-0 bg-[#0D0D15]/60 backdrop-blur-xl border-r border-slate-800/30 sidebar-glow" aria-label="Sidebar">
          <div className="p-6 lg:p-8 lg:flex lg:flex-col lg:h-screen">

            {/* Language switcher */}
            <div className="flex justify-end lg:justify-start mb-4 gap-1">
              {SUPPORTED_LANGS.map(l => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${lang === l.code ? 'bg-slate-700/60 text-slate-200' : 'text-slate-600 hover:text-slate-400'}`}>
                  {l.label}
                </button>
              ))}
            </div>

            {/* Branding */}
            <div className="flex flex-col items-center lg:items-start mb-6">
              <img src={`${import.meta.env.BASE_URL}icons/icon.png`} alt="Bill Vampire - Vampire mascot holding bill receipt" className="w-14 h-14 lg:w-12 lg:h-12 rounded-2xl shadow-sm mb-3" />
              <h1 className="font-gothic text-2xl lg:text-xl font-bold tracking-wider text-slate-100 mb-1">{_('appName')}</h1>
              <p className="text-[11px] text-slate-500 font-light tracking-wider">{_('tagline')}</p>
            </div>

            <div className="blood-accent mb-6" />

            {/* Monthly drain */}
            <div className="bg-gradient-to-r from-rose-950/50 to-violet-950/40 px-5 py-4 rounded-2xl border border-rose-800/20 mb-3">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 block mb-1">{_('monthlyLoss')}</span>
              <span className="text-rose-400 font-bold text-2xl">{displayCurrency}{monthlyTotal.toFixed(2)}</span>
            </div>

            {/* Saved */}
            {monthlySaved > 0 && (
              <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/40 px-5 py-4 rounded-2xl border border-emerald-800/20 mb-3">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 block mb-1">{_('monthlySaved')}</span>
                <span className="text-emerald-400 font-bold text-2xl">{displayCurrency}{monthlySaved.toFixed(2)}</span>
              </div>
            )}

            {/* AI / Pro badge */}
            {!isPro() ? (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-6 lg:mb-4">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="w-2.5 h-2.5" />
                <span>{remaining} {_('aiUsesLeft')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium mb-6 lg:mb-4">
                <FontAwesomeIcon icon={faCrown} className="w-2.5 h-2.5" />
                <span>{_('proBadge')}</span>
              </div>
            )}

            {/* Desktop-only sidebar actions */}
            <div className="hidden lg:block space-y-3 mt-auto">
              <div className="blood-accent mb-4" />

              {/* Export */}
              <button onClick={exportPDF}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-400 bg-[#141420]/60 hover:bg-[#1C1C2A] rounded-xl transition-colors cursor-pointer border border-slate-800/30">
                <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" /> {_('exportPdf')}
              </button>

              {/* Pro upgrade */}
              {!isPro() && (
                <button onClick={() => setShowProModal(true)}
                  className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-amber-950/40 to-rose-950/40 rounded-xl border border-amber-700/30 hover:from-amber-950/60 hover:to-rose-950/60 transition-all cursor-pointer group">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-rose-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-amber-900/30">
                    <FontAwesomeIcon icon={faCrown} className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-xs font-semibold text-slate-200 block leading-tight">{_('upgradeTitle')}</span>
                    <span className="text-[10px] text-slate-500">{getCurrentPrice().label} {_('upgradePrice')}</span>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )}

              {/* Tip */}
              <div className="bg-[#141420]/40 p-3 rounded-xl border border-slate-800/20">
                <p className="text-[10px] text-slate-500 mb-2 flex items-center gap-1.5"><FontAwesomeIcon icon={faHeart} className="w-2.5 h-2.5 text-rose-400/60" /> {_('tipTitle')}</p>
                <button onClick={openTip}
                  className="w-full py-2 text-[10px] font-medium text-amber-300/80 bg-[#1C1C2A]/50 rounded-lg hover:bg-[#252536] transition-colors border border-amber-800/10 cursor-pointer">
                  {lang === 'zh' ? '打赏 $2' : 'Tip $2'}
                </button>
              </div>

              {/* Legal links */}
              <div className="flex gap-3 pt-2">
                <a href={`${import.meta.env.BASE_URL}terms.html`} onClick={(e) => { e.preventDefault(); onLegal('terms'); }} className="text-[10px] text-slate-700 hover:text-slate-400 transition-colors cursor-pointer no-underline">Terms</a>
                <a href={`${import.meta.env.BASE_URL}privacy.html`} onClick={(e) => { e.preventDefault(); onLegal('privacy'); }} className="text-[10px] text-slate-700 hover:text-slate-400 transition-colors cursor-pointer no-underline">Privacy</a>
                <a href={`${import.meta.env.BASE_URL}refund.html`} onClick={(e) => { e.preventDefault(); onLegal('refund'); }} className="text-[10px] text-slate-700 hover:text-slate-400 transition-colors cursor-pointer no-underline">Refund</a>
              </div>
              <p className="text-[9px] text-slate-700 font-light tracking-wider">{_('footer')}</p>
            </div>
          </div>
        </aside>

        {/* ========== MAIN CONTENT ========== */}
        <main id="main-content" className="flex-1 min-h-screen">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 pb-24 sm:pb-6 lg:pb-10">

            {/* Tabs */}
            <nav aria-label="Main tabs" role="tablist" className="hidden lg:flex p-1.5 bg-[#141420]/70 backdrop-blur rounded-2xl mb-8 border border-slate-800/40 gap-1 max-w-md">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${activeTab === tab.id ? 'bg-[#1C1C2A] shadow-sm text-slate-200' : 'text-slate-600 hover:text-slate-400'}`}>
                  <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* === SUBS TAB === */}
            {activeTab === 'subs' && (
              <div id="tabpanel-subs" role="tabpanel" aria-labelledby="tab-subs" tabIndex={0} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-5 px-1">
                  <span className="text-sm font-medium text-slate-500 tracking-widest uppercase">{_('subList')}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setShowImportModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-violet-950/40 text-violet-400 rounded-xl hover:bg-violet-950/60 transition-colors cursor-pointer text-xs font-medium">
                      <FontAwesomeIcon icon={faFileImport} className="w-3.5 h-3.5" /> {_('smartImport')}
                    </button>
                    <button onClick={() => setShowAddModal(true)} aria-label={_('addSub')} className="p-2.5 bg-rose-950/40 text-rose-400 rounded-xl hover:bg-rose-950/60 transition-colors cursor-pointer"><FontAwesomeIcon icon={faPlus} className="w-4 h-4" aria-hidden="true" /></button>
                  </div>
                </div>
                {subscriptions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                    <FontAwesomeIcon icon={faGhost} className="w-20 h-20 mb-5 opacity-20" />
                    <p className="text-base font-light">{_('noSubs')}</p>
                  </div>
                )}
                <div className="space-y-1">
                  {subscriptions.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center p-4 rounded-2xl hover:bg-[#141420]/60 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#141420] border border-slate-800/30 flex items-center justify-center text-xl">{CATEGORY_ICONS[sub.category] || '\u{1F4E6}'}</div>
                        <div>
                          <h4 className="font-medium text-base text-slate-200">{sub.name}</h4>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <span className="bg-[#1C1C2A] px-2 py-0.5 rounded-md border border-slate-800/20">{_(CATEGORY_KEYS[CATEGORY_VALUES.indexOf(sub.category)] || 'catOther')}</span>
                            <span className="text-slate-700">/</span>
                            <span>{sub.cycle === 'monthly' ? _('monthly') : _('yearly')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-slate-200 text-lg">{CURRENCIES[sub.currency || 'USD']?.symbol}{sub.price}</span>
                        <button onClick={() => deleteSub(sub.id)} aria-label={`Remove ${sub.name}`} className="text-rose-700 hover:text-rose-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all p-1.5 cursor-pointer"><FontAwesomeIcon icon={faTrash} className="w-4 h-4" aria-hidden="true" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {subscriptions.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-800/30 print:hidden space-y-3">
                    {!aiAlternatives ? (
                      <button onClick={getAiAlternatives} disabled={isAlternativesLoading}
                        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-violet-400 bg-violet-950/30 hover:bg-violet-950/50 rounded-2xl transition-colors border border-violet-800/30 cursor-pointer min-h-[48px]">
                        {isAlternativesLoading ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" /> : <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4" />}
                        {isAlternativesLoading ? _('findingAlternatives') : _('findAlternatives')}
                      </button>
                    ) : (
                      <div className="bg-violet-950/30 p-5 rounded-2xl border border-violet-800/30">
                        <h4 className="text-sm font-bold text-violet-300 mb-2 flex items-center gap-2"><FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4" /> {_('aiAlternatives')}</h4>
                        <p className="text-sm leading-relaxed text-violet-200/80 whitespace-pre-wrap">{aiAlternatives}</p>
                        {alternativeLinks.length > 0 && (
                          <div className="mt-4">
                            <p className="text-[9px] text-violet-400/40 mb-2 uppercase tracking-widest">{lang === 'zh' ? '快速跳转' : 'Try these'}</p>
                            <div className="flex flex-wrap gap-2">
                              {alternativeLinks.map(link => (
                                <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-violet-900/30 text-violet-200 px-3 py-1.5 rounded-lg border border-violet-700/30 hover:bg-violet-800/40 hover:border-violet-600/40 transition-all">
                                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{width: 10, height: 10}} /> {link.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button onClick={rerunVerdict}
                        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-amber-300 bg-amber-950/30 hover:bg-amber-950/50 rounded-2xl transition-colors border border-amber-800/30 cursor-pointer min-h-[48px]">
                        <FontAwesomeIcon icon={faSkull} className="w-4 h-4" /> {lang === 'zh' ? '重新审判' : 'Re-run the verdict'}
                      </button>
                      <button onClick={() => setShowShareCard(true)}
                        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-rose-400 bg-rose-950/30 hover:bg-rose-950/50 rounded-2xl transition-colors border border-rose-800/30 cursor-pointer min-h-[48px]">
                        <FontAwesomeIcon icon={faShareNodes} className="w-4 h-4" /> {_('shareCard')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* === NO-SPEND TAB === */}
            {activeTab === 'no-spend' && (
              <div id="tabpanel-no-spend" role="tabpanel" aria-labelledby="tab-no-spend" tabIndex={0} className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl">
                <div className="text-center mb-8">
                  <h3 className="text-base lg:text-lg font-medium text-slate-200 mb-3">{_('noSpendTitle')}</h3>
                  <div className="inline-flex items-center gap-2.5 bg-emerald-950/40 px-5 py-2.5 rounded-full border border-emerald-800/30">
                    <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-300 font-medium">{currentStreak} {_('noSpendStreak')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 lg:gap-3 mb-8">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-xs lg:text-sm font-medium text-slate-600 py-1">{day}</div>
                  ))}
                  {[...Array(firstDayOfWeek)].map((_, i) => <div key={`e-${i}`} />)}
                  {[...Array(daysInMonth)].map((_, i) => {
                    const dayNum = i + 1;
                    const date = `${currentMonthPrefix}-${String(dayNum).padStart(2, '0')}`;
                    const isChecked = noSpendDays.includes(date);
                    const isToday = date === todayString;
                    const isFuture = dayNum > currentDay;
                    return (
                      <button key={i} onClick={() => toggleNoSpend(date)} disabled={isFuture}
                        aria-label={`${new Date(currentYear, currentMonth - 1, dayNum).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric' })}${isChecked ? ' — no-spend' : isToday ? ' — today' : ''}`}
                        aria-pressed={isChecked}
                        className={[
                          'aspect-square rounded-xl text-sm lg:text-base font-medium transition-all duration-200 flex items-center justify-center',
                          isChecked ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30' : '',
                          isToday && !isChecked ? 'bg-[#1C1C2A] text-slate-200 ring-2 ring-rose-500/50 ring-offset-1 ring-offset-[#0B0B11]' : '',
                          !isToday && !isChecked && !isFuture ? 'bg-[#1C1C2A] text-slate-400 hover:bg-[#252536]' : '',
                          isFuture ? 'text-slate-700 cursor-not-allowed' : 'cursor-pointer',
                        ].join(' ')}>
                        {isChecked ? '✓' : dayNum}
                      </button>
                    );
                  })}
                </div>
                <div className="print:hidden">
                  {!aiDailyQuote ? (
                    <button onClick={getAiDailyQuote} disabled={isQuoteLoading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/50 rounded-2xl transition-colors border border-emerald-800/30 cursor-pointer min-h-[48px]">
                      {isQuoteLoading ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" /> : <FontAwesomeIcon icon={faMugHot} className="w-4 h-4" />}
                      {isQuoteLoading ? _('aiThinking') : _('getMotivation')}
                    </button>
                  ) : (
                    <div className="bg-emerald-950/30 p-5 rounded-2xl border border-emerald-800/30">
                      <p className="text-sm leading-relaxed text-emerald-200 italic">"{aiDailyQuote}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* === STATS TAB === */}
            {activeTab === 'stats' && (
              <div id="tabpanel-stats" role="tabpanel" aria-labelledby="tab-stats" tabIndex={0} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* AI Advisor - full width */}
                <div className="bg-gradient-to-br from-violet-950/40 to-rose-950/40 p-6 lg:p-8 rounded-2xl border border-slate-800/50 relative overflow-hidden mb-6">
                  <div className="absolute -right-4 -top-4 text-rose-900/30"><FontAwesomeIcon icon={faQuoteLeft} className="w-24 h-24" /></div>
                  <div className="flex items-center justify-between mb-5 relative z-10">
                    <span className="text-sm lg:text-base font-bold text-slate-200 flex items-center gap-2"><FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4 text-rose-400" /> {_('aiAdvisor')}</span>
                    <button onClick={getAiAdvice} disabled={isAiLoading || !subscriptions.length}
                      aria-busy={isAiLoading}
                      className="text-xs bg-[#1C1C2A]/70 text-slate-300 px-4 py-2 rounded-xl hover:bg-[#252536] transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer">
                      {isAiLoading ? <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin text-rose-400" /> : <FontAwesomeIcon icon={faBolt} className="w-3.5 h-3.5 text-rose-400" />}
                      {isAiLoading ? _('analyzing') : _('startAnalysis')}
                    </button>
                  </div>
                  <div aria-live="polite" aria-atomic="true" className="relative z-10 bg-[#0B0B11]/40 backdrop-blur-sm rounded-xl p-4 min-h-[70px] flex items-center border border-slate-800/30">
                    {aiAdvice
                      ? <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{aiAdvice}</p>
                      : <p className="text-sm text-slate-600 font-light italic w-full text-center">{_('aiPlaceholder')}</p>}
                  </div>
                </div>

                {/* 2-column grid on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Chart */}
                  <div className="bg-[#141420]/60 p-6 rounded-2xl border border-slate-800/30">
                    {subscriptions.length > 0
                      ? <LazyChart data={pieData} options={pieOptions} />
                      : <div className="h-64 flex items-center justify-center text-slate-700"><FontAwesomeIcon icon={faGhost} className="w-16 h-16" /></div>}
                  </div>

                  {/* Breakdown */}
                  <div className="bg-[#141420]/60 p-6 rounded-2xl space-y-5 border border-slate-800/30 flex flex-col justify-center">
                    <div className="flex justify-between items-center"><span className="text-sm text-slate-500">{_('monthlySpend')}</span><span className="font-bold text-lg text-slate-200">{displayCurrency}{monthlyTotal.toFixed(2)}</span></div>
                    <div className="w-full h-px bg-slate-800/60" />
                    <div className="flex justify-between items-center"><span className="text-sm text-slate-500">{_('yearlyForecast')}</span><span className="font-bold text-lg text-rose-400">{displayCurrency}{(monthlyTotal * 12).toFixed(2)}</span></div>
                    <div className="w-full h-px bg-slate-800/60" />
                    <div className="flex justify-between items-center"><span className="text-sm text-slate-500">{_('dailyCost')}</span><span className="font-bold text-lg text-slate-200">{displayCurrency}{(monthlyTotal / 30).toFixed(2)}</span></div>
                  </div>

                  {/* Savings */}
                  <div className="bg-gradient-to-r from-emerald-950/30 to-teal-950/30 p-6 rounded-2xl border border-emerald-800/20">
                    <p className="text-sm font-bold text-emerald-300 mb-4 flex items-center gap-2"><FontAwesomeIcon icon={faSkull} className="w-4 h-4" /> {_('savingsTitle')}</p>
                    {monthlySaved > 0 ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm"><span className="text-slate-500">{_('savedMonthly')}</span><span className="font-bold text-emerald-400">-{displayCurrency}{monthlySaved.toFixed(2)}</span></div>
                        <div className="w-full h-px bg-emerald-800/30" />
                        <div className="flex justify-between items-center text-sm"><span className="text-slate-500">{_('savedYearly')}</span><span className="font-bold text-emerald-400">-{displayCurrency}{(monthlySaved * 12).toFixed(2)}</span></div>
                        <div className="mt-2 text-xs text-emerald-400/60">{cancelledSubs.length} {_('subsKilled')}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">{_('noSavingsYet')}</p>
                    )}
                  </div>

                  {/* Tip jar */}
                  <div className="bg-gradient-to-r from-amber-950/30 to-rose-950/30 p-6 rounded-2xl border border-amber-800/20 print:hidden">
                    <p className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2"><FontAwesomeIcon icon={faHeart} className="w-4 h-4 text-rose-400" /> {_('tipTitle')}</p>
                    <button onClick={openTip}
                      className="w-full py-3 text-sm font-medium text-amber-300 bg-[#1C1C2A]/70 rounded-xl hover:bg-[#252536] transition-colors border border-amber-800/20 cursor-pointer">
                      {lang === 'zh' ? '打赏 $2' : 'Tip $2'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile-only footer actions */}
            <div className="lg:hidden mt-8 pt-5 border-t border-slate-800/30 space-y-3 print:hidden">
              <button onClick={exportPDF}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-slate-400 bg-[#141420]/60 hover:bg-[#1C1C2A] rounded-xl transition-colors cursor-pointer min-h-[44px] border border-slate-800/30">
                <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" /> {_('exportPdf')}
              </button>

              {!isPro() && (
                <button onClick={() => setShowProModal(true)}
                  className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-amber-950/40 to-rose-950/40 rounded-xl border border-amber-700/30 hover:from-amber-950/60 hover:to-rose-950/60 transition-all cursor-pointer min-h-[44px] group">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-rose-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-amber-900/30">
                    <FontAwesomeIcon icon={faCrown} className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-xs font-semibold text-slate-200 block leading-tight">{_('upgradeTitle')}</span>
                    <span className="text-[10px] text-slate-500">{getCurrentPrice().label} {_('upgradePrice')}</span>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )}

              <footer className="mt-6 text-center">
                <p className="text-[10px] text-slate-600 font-light tracking-wider mb-2">{_('footer')}</p>
                <div className="flex justify-center gap-3">
                  <a href={`${import.meta.env.BASE_URL}terms.html`} onClick={(e) => { e.preventDefault(); onLegal('terms'); }} className="text-[10px] text-slate-700 hover:text-slate-400 transition-colors cursor-pointer no-underline">Terms</a>
                  <a href={`${import.meta.env.BASE_URL}privacy.html`} onClick={(e) => { e.preventDefault(); onLegal('privacy'); }} className="text-[10px] text-slate-700 hover:text-slate-400 transition-colors cursor-pointer no-underline">Privacy</a>
                  <a href={`${import.meta.env.BASE_URL}refund.html`} onClick={(e) => { e.preventDefault(); onLegal('refund'); }} className="text-[10px] text-slate-700 hover:text-slate-400 transition-colors cursor-pointer no-underline">Refund</a>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>

      {/* ========== MOBILE BOTTOM NAV ========== */}
      <nav aria-label="Main navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D0D15]/95 backdrop-blur-xl border-t border-slate-800/40 mobile-nav-safe">
        <div className="flex items-stretch">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 transition-all duration-200 cursor-pointer relative',
                activeTab === tab.id
                  ? 'text-rose-400'
                  : 'text-slate-600 hover:text-slate-400',
              ].join(' ')}
            >
              {activeTab === tab.id && (
                <span className="absolute top-0 inset-x-3 h-0.5 bg-rose-500 rounded-b-full" aria-hidden="true" />
              )}
              <FontAwesomeIcon icon={tab.icon} className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* === ADD MODAL === */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4 sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="add-modal-title" className="bg-[#141420]/95 backdrop-blur-xl w-full max-w-sm p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 fade-in duration-200 border border-slate-800/50">
            <h3 id="add-modal-title" className="text-sm font-bold mb-6 tracking-widest text-slate-100 uppercase">{_('addSub')}</h3>
            <div className="space-y-4">
              <div className="bg-[#1C1C2A] rounded-xl p-1 border border-slate-700/50">
                <input aria-label={_('subName')} className="w-full bg-transparent px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none"
                  placeholder={_('subName')} value={newSub.name}
                  onChange={e => setNewSub({ ...newSub, name: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <select aria-label="Currency" className="w-[110px] bg-[#1C1C2A] rounded-xl border border-slate-700/50 px-2 py-2.5 text-sm text-slate-300 outline-none"
                  value={newSub.currency} onChange={e => setNewSub({ ...newSub, currency: e.target.value })}>
                  {Object.values(CURRENCIES).map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <div className="flex-1 bg-[#1C1C2A] rounded-xl p-1 border border-slate-700/50">
                  <input aria-label={_('amount')} className="w-full bg-transparent px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none"
                    placeholder={_('amount')} type="number" value={newSub.price}
                    onChange={e => setNewSub({ ...newSub, price: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <select aria-label="Category" className="flex-1 bg-[#1C1C2A] rounded-xl border border-slate-700/50 px-3 py-2.5 text-sm text-slate-300 outline-none"
                  value={newSub.category} onChange={e => setNewSub({ ...newSub, category: e.target.value })}>
                  {CATEGORY_VALUES.map((c, i) => <option key={c} value={c}>{CATEGORY_ICONS[c]} {_(CATEGORY_KEYS[i])}</option>)}
                </select>
                <div className="flex-1 bg-[#1C1C2A] rounded-xl border border-slate-700/50 flex overflow-hidden">
                  {['monthly', 'yearly'].map(c => (
                    <button key={c} onClick={() => setNewSub({ ...newSub, cycle: c })}
                      className={`flex-1 text-xs py-2.5 font-medium transition-all cursor-pointer ${newSub.cycle === c ? 'bg-rose-600 text-white rounded-xl' : 'text-slate-500'}`}>
                      {c === 'monthly' ? _('monthly') : _('yearly')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-xs font-medium text-slate-400 bg-[#1C1C2A] rounded-2xl hover:bg-[#252536] transition-colors cursor-pointer min-h-[44px]">{_('cancel')}</button>
              <button onClick={addSubscription} className="flex-1 py-3 text-xs font-medium text-white bg-rose-600 rounded-2xl hover:bg-rose-500 transition-colors shadow-md shadow-rose-900/30 cursor-pointer min-h-[44px]">{_('add')}</button>
            </div>
          </div>
        </div>
      )}

      {/* === PRO MODAL === */}
      {showProModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowProModal(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="pro-modal-title" className="bg-[#141420]/95 backdrop-blur-xl w-full max-w-sm p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 fade-in duration-200 border border-slate-800/50" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-900/60 to-rose-900/60 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-700/30">
                <FontAwesomeIcon icon={faCrown} className="w-7 h-7 text-amber-400" aria-hidden="true" />
              </div>
              <h3 id="pro-modal-title" className="text-sm font-bold text-slate-100 mb-1">{_('upgradeTitle')} — {getCurrentPrice().label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{_('upgradeDesc')}</p>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { icon: faWandMagicSparkles, text: lang === 'zh' ? '无限 AI 毒舌与账单扫描' : 'Unlimited AI roasts & scans' },
                { icon: faShareNodes, text: lang === 'zh' ? '无水印分享卡 · 无限 PDF 报告' : 'Watermark-free share card & PDF reports' },
                { icon: faCrown, text: lang === 'zh' ? '一次买断 · 永久使用' : 'Pay once. Keep forever.' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-xs text-slate-300">
                  <FontAwesomeIcon icon={icon} className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {text}
                </div>
              ))}
            </div>
            <a href={getCheckoutUrl('pro_modal')} target="_blank" rel="noopener noreferrer" onClick={() => { openCheckout('pro_modal'); setShowProModal(false); }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold rounded-2xl hover:from-amber-400 hover:to-rose-400 transition-colors shadow-lg shadow-rose-900/30 mb-2 cursor-pointer min-h-[44px] flex items-center justify-center no-underline">
              {_('upgradeCta')} — {getCurrentPrice().label} {_('upgradePrice')}
            </a>
            {!isPatrol() && (
              <button onClick={() => { openPatrolCheckout('monthly', 'pro_modal'); setShowProModal(false); }}
                className="w-full py-3 bg-[#1C1C2A] border border-violet-700/40 text-slate-200 text-xs font-semibold rounded-2xl hover:bg-[#252536] transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-2 mb-2">
                <FontAwesomeIcon icon={faLock} className="w-3 h-3 text-violet-300" />
                {lang === 'zh' ? `或加装 Patrol — ${PATROL_PRICE_MONTHLY.label}` : `Or add Patrol — ${PATROL_PRICE_MONTHLY.label}`}
              </button>
            )}
            <button onClick={() => setShowProModal(false)}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer min-h-[44px]">
              {_('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* === SMART IMPORT MODAL === */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4 sm:items-center" onClick={resetImportModal}>
          <div role="dialog" aria-modal="true" aria-labelledby="import-modal-title" className="bg-[#141420]/95 backdrop-blur-xl w-full max-w-lg p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 fade-in duration-200 border border-slate-800/50 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 id="import-modal-title" className="text-sm font-bold tracking-widest text-slate-100 uppercase flex items-center gap-2">
                <FontAwesomeIcon icon={faFileImport} className="w-4 h-4 text-violet-400" aria-hidden="true" /> {_('smartImport')}
              </h3>
              <button onClick={resetImportModal} aria-label={_('cancel')} className="text-slate-600 hover:text-slate-300 transition-colors cursor-pointer p-1">
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">{_('smartImportDesc')}</p>

            {!extractedBills ? (
              <>
                {/* Text input */}
                <textarea
                  aria-label={_('pasteText')}
                  className="w-full bg-[#1C1C2A] rounded-xl border border-slate-700/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none resize-none h-32 mb-4 focus:border-violet-700/50 transition-colors"
                  placeholder={_('pasteText')}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                />

                {/* File upload */}
                <p className="text-xs text-slate-500 mb-2">{_('orUploadFile')}</p>
                {!importFile ? (
                  <label className="block w-full border-2 border-dashed border-slate-700/50 rounded-xl p-6 text-center cursor-pointer hover:border-violet-700/50 hover:bg-violet-950/10 transition-all">
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" className="hidden"
                      onChange={e => handleImportFile(e.target.files?.[0])} />
                    <FontAwesomeIcon icon={faFileImport} className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="text-xs text-slate-400 font-medium">{_('dropOrClick')}</p>
                    <p className="text-[10px] text-slate-600 mt-1">{_('supportedFormats')}</p>
                  </label>
                ) : (
                  <div className="flex items-center gap-3 bg-[#1C1C2A] rounded-xl border border-violet-700/30 px-4 py-3">
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="text-xs text-slate-300 truncate flex-1">{importFileName}</span>
                    <button onClick={() => { setImportFile(null); setImportFileName(''); }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer shrink-0">{_('removeFile')}</button>
                  </div>
                )}

                {/* Extract button */}
                <div className="flex gap-3 mt-6">
                  <button onClick={resetImportModal} className="flex-1 py-3 text-xs font-medium text-slate-400 bg-[#1C1C2A] rounded-2xl hover:bg-[#252536] transition-colors cursor-pointer min-h-[44px]">{_('cancel')}</button>
                  <button onClick={extractBills} disabled={isExtracting || (!importText.trim() && !importFile)}
                    className="flex-1 py-3 text-xs font-medium text-white bg-violet-600 rounded-2xl hover:bg-violet-500 transition-colors shadow-md shadow-violet-900/30 cursor-pointer min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isExtracting ? <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" /> : <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3.5 h-3.5" />}
                    {isExtracting ? _('extracting') : _('extractBills')}
                  </button>
                </div>
              </>
            ) : extractedBills.length === 0 ? (
              /* No results */
              <div className="text-center py-8">
                <FontAwesomeIcon icon={faGhost} className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-sm text-slate-500">{_('noExtracted')}</p>
                <button onClick={() => setExtractedBills(null)}
                  className="mt-4 px-6 py-2.5 text-xs font-medium text-violet-400 bg-violet-950/30 rounded-xl hover:bg-violet-950/50 transition-colors cursor-pointer">
                  {_('cancel')}
                </button>
              </div>
            ) : (
              /* Results preview */
              <div>
                <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">{_('extractedBills')}</p>
                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                  {extractedBills.map((bill, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-[#1C1C2A] rounded-xl border border-slate-700/30">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{CATEGORY_ICONS[bill.category] || '\u{1F4E6}'}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{bill.name}</p>
                          <p className="text-[10px] text-slate-500">{_(CATEGORY_KEYS[CATEGORY_VALUES.indexOf(bill.category)] || 'catOther')} / {bill.cycle === 'monthly' ? _('monthly') : _('yearly')}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-200">{CURRENCIES[bill.currency]?.symbol}{bill.price}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setExtractedBills(null)}
                    className="flex-1 py-3 text-xs font-medium text-slate-400 bg-[#1C1C2A] rounded-2xl hover:bg-[#252536] transition-colors cursor-pointer min-h-[44px]">{_('cancel')}</button>
                  <button onClick={addExtractedBills}
                    className="flex-1 py-3 text-xs font-medium text-white bg-emerald-600 rounded-2xl hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-900/30 cursor-pointer min-h-[44px] flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" /> {_('addSelected')} ({extractedBills.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === SHARE CARD === */}
      {showShareCard && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"><FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-rose-400 animate-spin" /></div>}>
          <ShareCard
            monthlyTotal={monthlyTotal}
            subscriptions={subscriptions}
            currency={displayCurrency}
            t={_}
            onClose={() => setShowShareCard(false)}
          />
        </Suspense>
      )}
    </div>

    <Suspense fallback={null}>
      <PrintReport
        subscriptions={subscriptions}
        noSpendDays={noSpendDays}
        monthlyTotal={monthlyTotal}
        currency={displayCurrency}
        lang={lang}
        currentYear={currentYear}
        currentMonth={currentMonth}
        currentDay={currentDay}
        daysInMonth={daysInMonth}
        firstDayOfWeek={firstDayOfWeek}
      />
    </Suspense>
    </>
  );
}
