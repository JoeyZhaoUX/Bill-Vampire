import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTrash, faGhost, faBolt, faChartPie,
  faCircleCheck, faDownload, faQuoteLeft,
  faSpinner, faWandMagicSparkles, faMagnifyingGlass, faMugHot,
  faShareNodes, faCrown, faHeart, faGlobe, faLock, faArrowUpRightFromSquare, faChevronRight, faSkull,
} from '@fortawesome/free-solid-svg-icons';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { t, getDefaultLang, SUPPORTED_LANGS } from './i18n';
import { isPro, canUseAi, incrementAiUsage, aiUsesRemaining, openCheckout, openTip } from './pro';
import { injectAffiliateLinks } from './affiliates';
import ShareCard from './ShareCard';
import PrintReport from './PrintReport';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

const CURRENCIES = {
  USD: { code: 'USD', flag: '\u{1F1FA}\u{1F1F8}', symbol: '$', rate: 1 },
  CNY: { code: 'CNY', flag: '\u{1F1E8}\u{1F1F3}', symbol: '\u00A5', rate: 0.14 },
  EUR: { code: 'EUR', flag: '\u{1F1EA}\u{1F1FA}', symbol: '\u20AC', rate: 1.08 },
  GBP: { code: 'GBP', flag: '\u{1F1EC}\u{1F1E7}', symbol: '\u00A3', rate: 1.26 },
  JPY: { code: 'JPY', flag: '\u{1F1EF}\u{1F1F5}', symbol: '\u00A5', rate: 0.0067 },
  HKD: { code: 'HKD', flag: '\u{1F1ED}\u{1F1F0}', symbol: 'HK$', rate: 0.128 },
};

const CATEGORY_KEYS = ['catEntertainment', 'catProductivity', 'catLifestyle', 'catOther'];
const CATEGORY_VALUES = ['Entertainment', 'Productivity', 'Lifestyle', 'Other'];
const CATEGORY_ICONS = { 'Entertainment': '\u{1F3AE}', 'Productivity': '\u26A1', 'Lifestyle': '\u{1F33F}', 'Other': '\u{1F4E6}' };

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
    if (!apiKey) return lang === 'zh' ? '\uFF08API Key \u672A\u914D\u7F6E\uFF09' : '(API Key not configured)';
    if (!canUseAi()) {
      setShowProModal(true);
      return _('aiLimitReached');
    }
    incrementAiUsage();
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: userPrompt }] }], systemInstruction: { parts: [{ text: systemPrompt }] } }),
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || (lang === 'zh' ? 'AI \u4F3C\u4E4E\u5728\u6253\u76F9\u3002' : 'AI seems to be napping.');
    } catch (err) { console.error(err); return lang === 'zh' ? 'AI \u6682\u65F6\u65AD\u7F51\u4E86\u3002' : 'AI is offline. Probably saving electricity for you.'; }
  };

  const getAiAdvice = async () => {
    if (!subscriptions.length) return;
    setIsAiLoading(true);
    const list = subscriptions.map(s => `${s.name}($${(parseFloat(s.price) * (CURRENCIES[s.currency]?.rate || 1)).toFixed(2)}/${s.cycle === 'monthly' ? 'mo' : 'yr'})`).join(', ');
    const systemPrompt = lang === 'zh'
      ? '\u4F60\u662F\u4E00\u4E2A\u5634\u6B20\u3001\u6BD2\u820C\u4F46\u5FC3\u5584\u7684\u8D22\u52A1\u987E\u95EE\u3002\u7528\u5E7D\u9ED8\u8BBD\u523A\u4F46\u6700\u7EC8\u5E26\u7740\u6696\u610F\u7684\u8BED\u6C14\uFF0C\u7ED9\u51FA3\u70B9\u72AC\u5229\u70B9\u8BC4\u548C1\u4E2A\u5B9E\u7528\u8282\u7701\u5EFA\u8BAE\u3002\u4E0D\u8D85\u8FC7150\u5B57\u3002'
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
    const systemPrompt = lang === 'zh'
      ? '\u4F60\u662F\u4E00\u4E2A\u7CBE\u901A\u4E92\u8054\u7F51\u5DE5\u5177\u7684\u7701\u94B1\u6781\u5BA2\u3002\u9488\u5BF9\u7528\u6237\u8BA2\u9605\u5217\u8868\uFF0C\u7ED9\u51FA2-3\u4E2A\u514D\u8D39\u6216\u66F4\u4FBF\u5B9C\u7684\u66FF\u4EE3\u65B9\u6848\uFF0C\u683C\u5F0F\u7B80\u6D01\u7528bullet point\uFF0C\u6BCF\u6761\u4E0D\u8D85\u8FC730\u5B57\u3002'
      : 'You are a savvy deal-finder who knows every free/cheap alternative to popular services. Give 2-3 free or cheaper alternatives for each subscription. Use bullet points, keep each under 30 words.';
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
      ? '\u4F60\u662F\u4E00\u4E2A\u50B2\u5A07\u3001\u6BD2\u820C\u7684AI\u60C5\u7EEA\u4F34\u4FA3\u3002\u5982\u679C\u4E0D\u6D88\u8D39\u5929\u6570\u5C11\u4E8E5\u5929\u8981\u5632\u8BBD\u4F46\u5E26\u9F13\u52B1\uFF1B5\u5929\u4EE5\u4E0A\u8981\u5938\u5956\u4F46\u8BED\u6C14\u50B2\u5A07\u3002\u56DE\u590D\u9650\u5236\u572860\u5B57\u4EE5\u5185\uFF0C\u53EF\u4EE5\u7528emoji\u3002'
      : 'You are a snarky, tsundere AI companion. If no-spend days < 5, tease but encourage. If >= 5, praise but act like you don\'t care. Max 60 words. Use emojis.';
    const result = await callGeminiAPI(
      `This month has ${daysInMonth} days. I've had ${currentStreak} no-spend days. Today is day ${currentDay}. Give me motivation (or roast me).`,
      systemPrompt,
    );
    setAiDailyQuote(result); setIsQuoteLoading(false);
  };

  const exportPDF = () => window.print();

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
  const pieOptions = { plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 10, color: '#94A3B8' } } }, maintainAspectRatio: false };

  const tabs = [
    { id: 'subs', label: _('tabBills'), icon: faGhost },
    { id: 'no-spend', label: _('tabCheckin'), icon: faCircleCheck },
    { id: 'stats', label: _('tabStats'), icon: faChartPie },
  ];

  const weekDays = [_('sun'), _('mon'), _('tue'), _('wed'), _('thu'), _('fri'), _('sat')];

  const remaining = aiUsesRemaining();

  return (
    <>
    <div className="app-screen min-h-screen bg-[#0B0B11] flex flex-col items-center justify-start py-12 px-4">
      <div className="max-w-md w-full relative">
        <div className="absolute top-0 left-10 w-48 h-48 bg-rose-900/20 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-0 w-64 h-64 bg-violet-900/15 rounded-full blur-3xl -z-10" />

        <div className="bg-[#141420]/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] p-8 border border-slate-800/40">

          {/* Language switcher */}
          <div className="flex justify-end mb-2 gap-1">
            {SUPPORTED_LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`text-[10px] px-2 py-1 rounded-lg transition-colors cursor-pointer ${lang === l.code ? 'bg-slate-700 text-slate-200' : 'text-slate-600 hover:text-slate-400'}`}>
                {l.label}
              </button>
            ))}
          </div>

          <header className="flex flex-col items-center mb-8 border-b border-slate-800/50 pb-8">
            <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="Bill Vampire" className="w-16 h-16 rounded-2xl shadow-sm mb-4" />
            <h1 className="text-xl font-medium tracking-widest text-slate-100 font-serif">{_('appName')}</h1>
            <p className="text-xs text-slate-500 mt-2 font-light tracking-wider">{_('tagline')}</p>
            <div className="mt-5 bg-gradient-to-r from-rose-950/40 to-violet-950/40 px-6 py-3 rounded-2xl w-full text-center border border-rose-800/20">
              <span className="text-sm font-medium text-slate-400">{_('monthlyLoss')}<span className="text-rose-400 font-bold text-lg ml-1">{displayCurrency}{monthlyTotal.toFixed(2)}</span></span>
            </div>
            {monthlySaved > 0 && (
              <div className="mt-2 bg-gradient-to-r from-emerald-950/40 to-teal-950/40 px-6 py-3 rounded-2xl w-full text-center border border-emerald-800/20">
                <span className="text-sm font-medium text-slate-400">{_('monthlySaved')}<span className="text-emerald-400 font-bold text-lg ml-1">{displayCurrency}{monthlySaved.toFixed(2)}</span></span>
              </div>
            )}
            {/* AI uses remaining badge */}
            {!isPro() && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="w-2.5 h-2.5" />
                <span>{remaining} {_('aiUsesLeft')}</span>
              </div>
            )}
            {isPro() && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-400 font-medium">
                <FontAwesomeIcon icon={faCrown} className="w-2.5 h-2.5" />
                <span>{_('proBadge')}</span>
              </div>
            )}
          </header>

          <nav className="flex p-1.5 bg-[#0B0B11]/80 rounded-2xl mb-8 border border-slate-800/50 gap-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${activeTab === tab.id ? 'bg-[#1C1C2A] shadow-sm text-slate-200' : 'text-slate-600 hover:text-slate-400'}`}>
                <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </nav>

          <main className="min-h-[360px] relative">
            {/* === SUBS TAB === */}
            {activeTab === 'subs' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-xs font-medium text-slate-500 tracking-widest uppercase">{_('subList')}</span>
                  <button onClick={() => setShowAddModal(true)} className="p-2 bg-rose-950/40 text-rose-400 rounded-xl hover:bg-rose-950/60 transition-colors cursor-pointer"><FontAwesomeIcon icon={faPlus} className="w-4 h-4" /></button>
                </div>
                {subscriptions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                    <FontAwesomeIcon icon={faGhost} className="w-12 h-12 mb-4" />
                    <p className="text-sm font-light">{_('noSubs')}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {subscriptions.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center p-3 rounded-2xl hover:bg-[#1C1C2A]/60 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#1C1C2A] flex items-center justify-center text-lg">{CATEGORY_ICONS[sub.category] || '\u{1F4E6}'}</div>
                        <div>
                          <h4 className="font-medium text-sm text-slate-200">{sub.name}</h4>
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                            <span className="bg-[#252536] px-1.5 py-0.5 rounded-md">{_(CATEGORY_KEYS[CATEGORY_VALUES.indexOf(sub.category)] || 'catOther')}</span>
                            <span>·</span>
                            <span>{sub.cycle === 'monthly' ? _('monthly') : _('yearly')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-200">{CURRENCIES[sub.currency || 'USD']?.symbol}{sub.price}</span>
                        <button onClick={() => deleteSub(sub.id)} className="text-rose-700 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer"><FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {subscriptions.length > 0 && (
                  <div className="mt-6 border-t border-slate-800/50 pt-4 print:hidden space-y-3">
                    {!aiAlternatives ? (
                      <button onClick={getAiAlternatives} disabled={isAlternativesLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-violet-400 bg-violet-950/30 hover:bg-violet-950/50 rounded-2xl transition-colors border border-violet-800/30 cursor-pointer min-h-[44px]">
                        {isAlternativesLoading ? <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" /> : <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5" />}
                        {isAlternativesLoading ? _('findingAlternatives') : _('findAlternatives')}
                      </button>
                    ) : (
                      <div className="bg-violet-950/30 p-4 rounded-2xl border border-violet-800/30">
                        <h4 className="text-xs font-bold text-violet-300 mb-2 flex items-center gap-1.5"><FontAwesomeIcon icon={faWandMagicSparkles} className="w-3 h-3" /> {_('aiAlternatives')}</h4>
                        <p className="text-xs leading-relaxed text-violet-200/80 whitespace-pre-wrap">{aiAlternatives}</p>
                        {/* Affiliate links */}
                        {alternativeLinks.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {alternativeLinks.map(link => (
                              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] bg-[#1C1C2A]/80 text-violet-300 px-2.5 py-1 rounded-lg border border-violet-800/30 hover:bg-violet-950/50 transition-colors">
                                <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{width: 9, height: 9}} /> {link.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Share button */}
                    <button onClick={() => setShowShareCard(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-rose-400 bg-rose-950/30 hover:bg-rose-950/50 rounded-2xl transition-colors border border-rose-800/30 cursor-pointer min-h-[44px]">
                      <FontAwesomeIcon icon={faShareNodes} className="w-3.5 h-3.5" /> {_('shareCard')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* === NO-SPEND TAB === */}
            {activeTab === 'no-spend' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-center mb-8">
                  <h3 className="text-sm font-medium text-slate-200 mb-2">{_('noSpendTitle')}</h3>
                  <div className="inline-flex items-center gap-2 bg-emerald-950/40 px-4 py-2 rounded-full border border-emerald-800/30">
                    <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-300 font-medium">{currentStreak} {_('noSpendStreak')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5 mb-8">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-[9px] font-medium text-slate-600 py-1">{day}</div>
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
                        className={[
                          'aspect-square rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center',
                          isChecked ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30' : '',
                          isToday && !isChecked ? 'bg-[#1C1C2A] text-slate-200 ring-2 ring-rose-500/50 ring-offset-1 ring-offset-[#141420]' : '',
                          !isToday && !isChecked && !isFuture ? 'bg-[#1C1C2A] text-slate-400 hover:bg-[#252536]' : '',
                          isFuture ? 'text-slate-700 cursor-not-allowed' : 'cursor-pointer',
                        ].join(' ')}>
                        {isChecked ? '\u2713' : dayNum}
                      </button>
                    );
                  })}
                </div>
                <div className="print:hidden">
                  {!aiDailyQuote ? (
                    <button onClick={getAiDailyQuote} disabled={isQuoteLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/50 rounded-2xl transition-colors border border-emerald-800/30 cursor-pointer min-h-[44px]">
                      {isQuoteLoading ? <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" /> : <FontAwesomeIcon icon={faMugHot} className="w-3.5 h-3.5" />}
                      {isQuoteLoading ? _('aiThinking') : _('getMotivation')}
                    </button>
                  ) : (
                    <div className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-800/30">
                      <p className="text-xs leading-relaxed text-emerald-200 italic">"{aiDailyQuote}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* === STATS TAB === */}
            {activeTab === 'stats' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-gradient-to-br from-violet-950/40 to-rose-950/40 p-5 rounded-2xl border border-slate-800/50 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-rose-900/30"><FontAwesomeIcon icon={faQuoteLeft} className="w-20 h-20" /></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5"><FontAwesomeIcon icon={faWandMagicSparkles} className="w-3 h-3 text-rose-400" /> {_('aiAdvisor')}</span>
                    <button onClick={getAiAdvice} disabled={isAiLoading || !subscriptions.length}
                      className="text-[10px] bg-[#1C1C2A]/70 text-slate-300 px-3 py-1.5 rounded-xl hover:bg-[#252536] transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50 cursor-pointer">
                      {isAiLoading ? <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin text-rose-400" /> : <FontAwesomeIcon icon={faBolt} className="w-3 h-3 text-rose-400" />}
                      {isAiLoading ? _('analyzing') : _('startAnalysis')}
                    </button>
                  </div>
                  <div className="relative z-10 bg-[#0B0B11]/40 backdrop-blur-sm rounded-xl p-3 min-h-[60px] flex items-center border border-slate-800/30">
                    {aiAdvice
                      ? <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">{aiAdvice}</p>
                      : <p className="text-xs text-slate-600 font-light italic w-full text-center">{_('aiPlaceholder')}</p>}
                  </div>
                </div>
                {subscriptions.length > 0
                  ? <div className="h-44 flex justify-center"><Pie data={pieData} options={pieOptions} /></div>
                  : <div className="h-44 flex items-center justify-center text-slate-700"><FontAwesomeIcon icon={faGhost} className="w-12 h-12" /></div>}
                <div className="bg-[#1C1C2A] p-4 rounded-2xl space-y-3 print:bg-transparent border border-slate-800/40">
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-500">{_('monthlySpend')}</span><span className="font-bold text-slate-200">{displayCurrency}{monthlyTotal.toFixed(2)}</span></div>
                  <div className="w-full h-px bg-slate-800/60 print:bg-slate-300" />
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-500">{_('yearlyForecast')}</span><span className="font-bold text-rose-400">{displayCurrency}{(monthlyTotal * 12).toFixed(2)}</span></div>
                  <div className="w-full h-px bg-slate-800/60" />
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-500">{_('dailyCost')}</span><span className="font-bold text-slate-200">{displayCurrency}{(monthlyTotal / 30).toFixed(2)}</span></div>
                </div>

                {/* Savings card */}
                <div className="bg-gradient-to-r from-emerald-950/30 to-teal-950/30 p-4 rounded-2xl border border-emerald-800/20">
                  <p className="text-xs font-bold text-emerald-300 mb-3 flex items-center gap-1.5"><FontAwesomeIcon icon={faSkull} className="w-3 h-3" /> {_('savingsTitle')}</p>
                  {monthlySaved > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs"><span className="text-slate-500">{_('savedMonthly')}</span><span className="font-bold text-emerald-400">-{displayCurrency}{monthlySaved.toFixed(2)}</span></div>
                      <div className="w-full h-px bg-emerald-800/30" />
                      <div className="flex justify-between items-center text-xs"><span className="text-slate-500">{_('savedYearly')}</span><span className="font-bold text-emerald-400">-{displayCurrency}{(monthlySaved * 12).toFixed(2)}</span></div>
                      <div className="mt-2 text-[10px] text-emerald-400/60">{cancelledSubs.length} {_('subsKilled')}</div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">{_('noSavingsYet')}</p>
                  )}
                </div>

                {/* Tip jar */}
                <div className="bg-gradient-to-r from-amber-950/30 to-rose-950/30 p-4 rounded-2xl border border-amber-800/20 print:hidden">
                  <p className="text-xs font-medium text-slate-300 mb-3 flex items-center gap-1.5"><FontAwesomeIcon icon={faHeart} className="w-3 h-3 text-rose-400" /> {_('tipTitle')}</p>
                  <div className="flex gap-2">
                    {[1, 3, 5].map(amt => (
                      <button key={amt} onClick={() => openTip(amt)}
                        className="flex-1 py-2 text-xs font-medium text-amber-300 bg-[#1C1C2A]/70 rounded-xl hover:bg-[#252536] transition-colors border border-amber-800/20 cursor-pointer">
                        {lang === 'zh' ? _(`tip${amt}`) : `$${amt}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* In-card footer actions */}
          <div className="mt-6 pt-5 border-t border-slate-800/50 space-y-3 print:hidden">
            {/* Export button */}
            <button onClick={exportPDF}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-slate-400 bg-[#1C1C2A] hover:bg-[#252536] rounded-xl transition-colors cursor-pointer min-h-[44px] border border-slate-800/40">
              <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" /> {_('exportPdf')}
            </button>

            {/* Pro upgrade banner */}
            {!isPro() && (
              <button onClick={() => setShowProModal(true)}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-amber-950/40 to-rose-950/40 rounded-xl border border-amber-700/30 hover:from-amber-950/60 hover:to-rose-950/60 transition-all cursor-pointer min-h-[44px] group">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-rose-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-amber-900/30">
                  <FontAwesomeIcon icon={faCrown} className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-xs font-semibold text-slate-200 block leading-tight">{_('upgradeTitle')}</span>
                  <span className="text-[10px] text-slate-500">{_('upgradePrice')}</span>
                </div>
                <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center print:hidden">
          <p className="text-[10px] text-slate-600 font-light tracking-wider mb-2">{_('footer')}</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => onLegal('terms')} className="text-[10px] text-slate-700 hover:text-slate-400 transition-colors cursor-pointer">Terms</button>
            <button onClick={() => onLegal('privacy')} className="text-[10px] text-slate-700 hover:text-slate-400 transition-colors cursor-pointer">Privacy</button>
            <button onClick={() => onLegal('refund')} className="text-[10px] text-slate-700 hover:text-slate-400 transition-colors cursor-pointer">Refund</button>
          </div>
        </footer>
      </div>

      {/* === ADD MODAL === */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="bg-[#141420]/95 backdrop-blur-xl w-full max-w-xs p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 fade-in duration-200 border border-slate-800/50">
            <h3 className="text-sm font-bold mb-6 tracking-widest text-slate-100 uppercase">{_('addSub')}</h3>
            <div className="space-y-4">
              <div className="bg-[#1C1C2A] rounded-xl p-1 border border-slate-700/50">
                <input className="w-full bg-transparent px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none"
                  placeholder={_('subName')} value={newSub.name}
                  onChange={e => setNewSub({ ...newSub, name: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <select className="w-[110px] bg-[#1C1C2A] rounded-xl border border-slate-700/50 px-2 py-2.5 text-sm text-slate-300 outline-none"
                  value={newSub.currency} onChange={e => setNewSub({ ...newSub, currency: e.target.value })}>
                  {Object.values(CURRENCIES).map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <div className="flex-1 bg-[#1C1C2A] rounded-xl p-1 border border-slate-700/50">
                  <input className="w-full bg-transparent px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none"
                    placeholder={_('amount')} type="number" value={newSub.price}
                    onChange={e => setNewSub({ ...newSub, price: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <select className="flex-1 bg-[#1C1C2A] rounded-xl border border-slate-700/50 px-3 py-2.5 text-sm text-slate-300 outline-none"
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
          <div className="bg-[#141420]/95 backdrop-blur-xl w-full max-w-xs p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 fade-in duration-200 border border-slate-800/50" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-900/60 to-rose-900/60 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-700/30">
                <FontAwesomeIcon icon={faCrown} className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">{_('upgradeTitle')}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{_('upgradeDesc')}</p>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { icon: faWandMagicSparkles, text: lang === 'zh' ? 'AI \u65E0\u9650\u4F7F\u7528' : 'Unlimited AI analysis' },
                { icon: faGlobe, text: lang === 'zh' ? '\u4E91\u7AEF\u540C\u6B65\uFF08\u5373\u5C06\u63A8\u51FA\uFF09' : 'Cloud sync (coming soon)' },
                { icon: faLock, text: lang === 'zh' ? '\u6C38\u4E0D\u6536\u8BA2\u9605\u8D39' : 'No subscription. Ever.' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-xs text-slate-300">
                  <FontAwesomeIcon icon={icon} className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {text}
                </div>
              ))}
            </div>
            <button onClick={() => { openCheckout(); setShowProModal(false); }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold rounded-2xl hover:from-amber-400 hover:to-rose-400 transition-colors shadow-lg shadow-rose-900/30 mb-2 cursor-pointer min-h-[44px]">
              {_('upgradeCta')} — {_('upgradePrice')}
            </button>
            <button onClick={() => setShowProModal(false)}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer min-h-[44px]">
              {_('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* === SHARE CARD === */}
      {showShareCard && (
        <ShareCard
          monthlyTotal={monthlyTotal}
          subscriptions={subscriptions}
          currency={displayCurrency}
          t={_}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>

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
    </>
  );
}
