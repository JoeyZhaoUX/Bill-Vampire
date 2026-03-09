import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Ghost, Zap, PieChart as PieIcon,
  CheckCircle2, Download, MessageSquareQuote,
  Loader2, Sparkles, Receipt, Search, Coffee,
  Share2, Crown, Heart, Globe, Lock, ExternalLink, ChevronRight, Skull,
} from 'lucide-react';
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
  USD: { code: 'USD', flag: '🇺🇸', symbol: '$', rate: 1 },
  CNY: { code: 'CNY', flag: '🇨🇳', symbol: '¥', rate: 0.14 },
  EUR: { code: 'EUR', flag: '🇪🇺', symbol: '€', rate: 1.08 },
  GBP: { code: 'GBP', flag: '🇬🇧', symbol: '£', rate: 1.26 },
  JPY: { code: 'JPY', flag: '🇯🇵', symbol: '¥', rate: 0.0067 },
  HKD: { code: 'HKD', flag: '🇭🇰', symbol: 'HK$', rate: 0.128 },
};

const CATEGORY_KEYS = ['catEntertainment', 'catProductivity', 'catLifestyle', 'catOther'];
const CATEGORY_VALUES = ['Entertainment', 'Productivity', 'Lifestyle', 'Other'];
const CATEGORY_ICONS = { 'Entertainment': '🎮', 'Productivity': '⚡', 'Lifestyle': '🌿', 'Other': '📦' };

export default function App() {
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
    if (!apiKey) return lang === 'zh' ? '（API Key 未配置）' : '(API Key not configured)';
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
      return data.candidates?.[0]?.content?.parts?.[0]?.text || (lang === 'zh' ? 'AI 似乎在打盹。' : 'AI seems to be napping.');
    } catch (err) { console.error(err); return lang === 'zh' ? 'AI 暂时断网了。' : 'AI is offline. Probably saving electricity for you.'; }
  };

  const getAiAdvice = async () => {
    if (!subscriptions.length) return;
    setIsAiLoading(true);
    const list = subscriptions.map(s => `${s.name}($${(parseFloat(s.price) * (CURRENCIES[s.currency]?.rate || 1)).toFixed(2)}/${s.cycle === 'monthly' ? 'mo' : 'yr'})`).join(', ');
    const systemPrompt = lang === 'zh'
      ? '你是一个嘴欠、毒舌但心善的财务顾问。用幽默讽刺但最终带着暖意的语气，给出3点犀利点评和1个实用节省建议。不超过150字。'
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
      ? '你是一个精通互联网工具的省钱极客。针对用户订阅列表，给出2-3个免费或更便宜的替代方案，格式简洁用bullet point，每条不超过30字。'
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
      ? '你是一个傲娇、毒舌的AI情绪伴侣。如果不消费天数少于5天要嘲讽但带鼓励；5天以上要夸奖但语气傲娇。回复限制在60字以内，可以用emoji。'
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
    { id: 'subs', label: _('tabBills'), icon: Ghost },
    { id: 'no-spend', label: _('tabCheckin'), icon: CheckCircle2 },
    { id: 'stats', label: _('tabStats'), icon: PieIcon },
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
                <Sparkles size={10} />
                <span>{remaining} {_('aiUsesLeft')}</span>
              </div>
            )}
            {isPro() && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-400 font-medium">
                <Crown size={10} />
                <span>{_('proBadge')}</span>
              </div>
            )}
          </header>

          <nav className="flex p-1.5 bg-[#0B0B11]/80 rounded-2xl mb-8 border border-slate-800/50 gap-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${activeTab === tab.id ? 'bg-[#1C1C2A] shadow-sm text-slate-200' : 'text-slate-600 hover:text-slate-400'}`}>
                <tab.icon size={16} strokeWidth={activeTab === tab.id ? 2 : 1.5} />
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
                  <button onClick={() => setShowAddModal(true)} className="p-2 bg-rose-950/40 text-rose-400 rounded-xl hover:bg-rose-950/60 transition-colors cursor-pointer"><Plus size={16} strokeWidth={2} /></button>
                </div>
                {subscriptions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                    <Ghost size={48} strokeWidth={1} className="mb-4" />
                    <p className="text-sm font-light">{_('noSubs')}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {subscriptions.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center p-3 rounded-2xl hover:bg-[#1C1C2A]/60 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#1C1C2A] flex items-center justify-center text-lg">{CATEGORY_ICONS[sub.category] || '📦'}</div>
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
                        <button onClick={() => deleteSub(sub.id)} className="text-rose-700 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {subscriptions.length > 0 && (
                  <div className="mt-6 border-t border-slate-800/50 pt-4 print:hidden space-y-3">
                    {!aiAlternatives ? (
                      <button onClick={getAiAlternatives} disabled={isAlternativesLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-violet-400 bg-violet-950/30 hover:bg-violet-950/50 rounded-2xl transition-colors border border-violet-800/30 cursor-pointer min-h-[44px]">
                        {isAlternativesLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        {isAlternativesLoading ? _('findingAlternatives') : _('findAlternatives')}
                      </button>
                    ) : (
                      <div className="bg-violet-950/30 p-4 rounded-2xl border border-violet-800/30">
                        <h4 className="text-xs font-bold text-violet-300 mb-2 flex items-center gap-1.5"><Sparkles size={12} /> {_('aiAlternatives')}</h4>
                        <p className="text-xs leading-relaxed text-violet-200/80 whitespace-pre-wrap">{aiAlternatives}</p>
                        {/* Affiliate links */}
                        {alternativeLinks.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {alternativeLinks.map(link => (
                              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] bg-[#1C1C2A]/80 text-violet-300 px-2.5 py-1 rounded-lg border border-violet-800/30 hover:bg-violet-950/50 transition-colors">
                                <ExternalLink size={9} /> {link.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Share button */}
                    <button onClick={() => setShowShareCard(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-rose-400 bg-rose-950/30 hover:bg-rose-950/50 rounded-2xl transition-colors border border-rose-800/30 cursor-pointer min-h-[44px]">
                      <Share2 size={14} /> {_('shareCard')}
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
                    <CheckCircle2 size={14} className="text-emerald-400" />
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
                        {isChecked ? '✓' : dayNum}
                      </button>
                    );
                  })}
                </div>
                <div className="print:hidden">
                  {!aiDailyQuote ? (
                    <button onClick={getAiDailyQuote} disabled={isQuoteLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/50 rounded-2xl transition-colors border border-emerald-800/30 cursor-pointer min-h-[44px]">
                      {isQuoteLoading ? <Loader2 size={14} className="animate-spin" /> : <Coffee size={14} />}
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
                  <div className="absolute -right-4 -top-4 text-rose-900/30"><MessageSquareQuote size={80} strokeWidth={1} /></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5"><Sparkles size={12} className="text-rose-400" /> {_('aiAdvisor')}</span>
                    <button onClick={getAiAdvice} disabled={isAiLoading || !subscriptions.length}
                      className="text-[10px] bg-[#1C1C2A]/70 text-slate-300 px-3 py-1.5 rounded-xl hover:bg-[#252536] transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50 cursor-pointer">
                      {isAiLoading ? <Loader2 size={12} className="animate-spin text-rose-400" /> : <Zap size={12} className="text-rose-400" />}
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
                  : <div className="h-44 flex items-center justify-center text-slate-700"><Ghost size={48} strokeWidth={1} /></div>}
                <div className="bg-[#1C1C2A] p-4 rounded-2xl space-y-3 print:bg-transparent border border-slate-800/40">
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-500">{_('monthlySpend')}</span><span className="font-bold text-slate-200">{displayCurrency}{monthlyTotal.toFixed(2)}</span></div>
                  <div className="w-full h-px bg-slate-800/60 print:bg-slate-300" />
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-500">{_('yearlyForecast')}</span><span className="font-bold text-rose-400">{displayCurrency}{(monthlyTotal * 12).toFixed(2)}</span></div>
                  <div className="w-full h-px bg-slate-800/60" />
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-500">{_('dailyCost')}</span><span className="font-bold text-slate-200">{displayCurrency}{(monthlyTotal / 30).toFixed(2)}</span></div>
                </div>

                {/* Savings card */}
                <div className="bg-gradient-to-r from-emerald-950/30 to-teal-950/30 p-4 rounded-2xl border border-emerald-800/20">
                  <p className="text-xs font-bold text-emerald-300 mb-3 flex items-center gap-1.5"><Skull size={12} /> {_('savingsTitle')}</p>
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
                  <p className="text-xs font-medium text-slate-300 mb-3 flex items-center gap-1.5"><Heart size={12} className="text-rose-400" /> {_('tipTitle')}</p>
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
              <Download size={14} /> {_('exportPdf')}
            </button>

            {/* Pro upgrade banner */}
            {!isPro() && (
              <button onClick={() => setShowProModal(true)}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-amber-950/40 to-rose-950/40 rounded-xl border border-amber-700/30 hover:from-amber-950/60 hover:to-rose-950/60 transition-all cursor-pointer min-h-[44px] group">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-rose-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-amber-900/30">
                  <Crown size={14} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-xs font-semibold text-slate-200 block leading-tight">{_('upgradeTitle')}</span>
                  <span className="text-[10px] text-slate-500">{_('upgradePrice')}</span>
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center text-[10px] text-slate-600 font-light tracking-wider print:hidden">
          {_('footer')}
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
                <Crown size={28} className="text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">{_('upgradeTitle')}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{_('upgradeDesc')}</p>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { icon: Sparkles, text: lang === 'zh' ? 'AI 无限使用' : 'Unlimited AI analysis' },
                { icon: Globe, text: lang === 'zh' ? '云端同步（即将推出）' : 'Cloud sync (coming soon)' },
                { icon: Lock, text: lang === 'zh' ? '永不收订阅费' : 'No subscription. Ever.' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-xs text-slate-300">
                  <Icon size={14} className="text-amber-400 shrink-0" /> {text}
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
