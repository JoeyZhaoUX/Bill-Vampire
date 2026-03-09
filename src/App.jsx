import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Ghost, Zap, PieChart as PieIcon,
  CheckCircle2, Download, MessageSquareQuote,
  Loader2, Sparkles, Receipt, Search, Coffee,
  Share2, Crown, Heart, Globe, Lock, ExternalLink, ChevronRight,
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

  const _ = (key) => t(lang, key);

  useEffect(() => {
    const savedSubs = localStorage.getItem('vampire_subs');
    const savedDays = localStorage.getItem('vampire_no_spend');
    if (savedSubs) setSubscriptions(JSON.parse(savedSubs));
    if (savedDays) setNoSpendDays(JSON.parse(savedDays));
  }, []);
  useEffect(() => { localStorage.setItem('vampire_subs', JSON.stringify(subscriptions)); }, [subscriptions]);
  useEffect(() => { localStorage.setItem('vampire_no_spend', JSON.stringify(noSpendDays)); }, [noSpendDays]);
  useEffect(() => { localStorage.setItem('vampire_lang', lang); }, [lang]);

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
  const deleteSub = (id) => { setSubscriptions(subscriptions.filter(s => s.id !== id)); setAiAdvice(''); setAiAlternatives(''); setAlternativeLinks([]); };

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
      backgroundColor: ['#fda4af', '#c4b5fd', '#6ee7b7', '#fcd34d'],
      borderWidth: 2, borderColor: '#ffffff', hoverOffset: 6,
    }],
  };
  const pieOptions = { plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 10 } } }, maintainAspectRatio: false };

  const tabs = [
    { id: 'subs', label: _('tabBills'), icon: Ghost },
    { id: 'no-spend', label: _('tabCheckin'), icon: CheckCircle2 },
    { id: 'stats', label: _('tabStats'), icon: PieIcon },
  ];

  const weekDays = [_('sun'), _('mon'), _('tue'), _('wed'), _('thu'), _('fri'), _('sat')];

  const remaining = aiUsesRemaining();

  return (
    <>
    <div className="app-screen min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-start py-12 px-4">
      <div className="max-w-md w-full relative">
        <div className="absolute top-0 left-10 w-48 h-48 bg-rose-200/40 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-0 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl -z-10" />

        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] p-8">

          {/* Language switcher */}
          <div className="flex justify-end mb-2 gap-1">
            {SUPPORTED_LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${lang === l.code ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                {l.label}
              </button>
            ))}
          </div>

          <header className="flex flex-col items-center mb-8 border-b border-slate-100 pb-8">
            <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="Bill Vampire" className="w-16 h-16 rounded-2xl shadow-sm mb-4" />
            <h1 className="text-xl font-medium tracking-widest text-slate-800">{_('appName')}</h1>
            <p className="text-xs text-slate-400 mt-2 font-light tracking-wider">{_('tagline')}</p>
            <div className="mt-5 bg-gradient-to-r from-rose-50 to-indigo-50 px-6 py-3 rounded-2xl w-full text-center">
              <span className="text-sm font-medium text-slate-600">{_('monthlyLoss')}<span className="text-rose-500 font-bold text-lg ml-1">{displayCurrency}{monthlyTotal.toFixed(2)}</span></span>
            </div>
            {/* AI uses remaining badge */}
            {!isPro() && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
                <Sparkles size={10} />
                <span>{remaining} {_('aiUsesLeft')}</span>
              </div>
            )}
            {isPro() && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-500 font-medium">
                <Crown size={10} />
                <span>{_('proBadge')}</span>
              </div>
            )}
          </header>

          <nav className="flex p-1.5 bg-slate-50/80 rounded-2xl mb-8 border border-slate-100 gap-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${activeTab === tab.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
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
                  <span className="text-xs font-medium text-slate-400 tracking-widest uppercase">{_('subList')}</span>
                  <button onClick={() => setShowAddModal(true)} className="p-2 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-100 transition-colors"><Plus size={16} strokeWidth={2} /></button>
                </div>
                {subscriptions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                    <Ghost size={48} strokeWidth={1} className="mb-4" />
                    <p className="text-sm font-light">{_('noSubs')}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {subscriptions.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg">{CATEGORY_ICONS[sub.category] || '📦'}</div>
                        <div>
                          <h4 className="font-medium text-sm text-slate-700">{sub.name}</h4>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">{_(CATEGORY_KEYS[CATEGORY_VALUES.indexOf(sub.category)] || 'catOther')}</span>
                            <span>·</span>
                            <span>{sub.cycle === 'monthly' ? _('monthly') : _('yearly')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700">{CURRENCIES[sub.currency || 'USD']?.symbol}{sub.price}</span>
                        <button onClick={() => deleteSub(sub.id)} className="text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {subscriptions.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-4 print:hidden space-y-3">
                    {!aiAlternatives ? (
                      <button onClick={getAiAlternatives} disabled={isAlternativesLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl transition-colors border border-indigo-100/50">
                        {isAlternativesLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        {isAlternativesLoading ? _('findingAlternatives') : _('findAlternatives')}
                      </button>
                    ) : (
                      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                        <h4 className="text-xs font-bold text-indigo-600 mb-2 flex items-center gap-1.5"><Sparkles size={12} /> {_('aiAlternatives')}</h4>
                        <p className="text-xs leading-relaxed text-indigo-900/80 whitespace-pre-wrap">{aiAlternatives}</p>
                        {/* Affiliate links */}
                        {alternativeLinks.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {alternativeLinks.map(link => (
                              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] bg-white/80 text-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors">
                                <ExternalLink size={9} /> {link.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Share button */}
                    <button onClick={() => setShowShareCard(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-rose-500 bg-rose-50/50 hover:bg-rose-50 rounded-2xl transition-colors border border-rose-100/50">
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
                  <h3 className="text-sm font-medium text-slate-700 mb-2">{_('noSpendTitle')}</h3>
                  <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span className="text-xs text-green-700 font-medium">{currentStreak} {_('noSpendStreak')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5 mb-8">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-[9px] font-medium text-slate-300 py-1">{day}</div>
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
                          isChecked ? 'bg-green-400 text-white shadow-sm' : '',
                          isToday && !isChecked ? 'bg-slate-100 text-slate-700 ring-2 ring-slate-300 ring-offset-1' : '',
                          !isToday && !isChecked && !isFuture ? 'bg-slate-50 text-slate-500 hover:bg-slate-100' : '',
                          isFuture ? 'text-slate-200 cursor-not-allowed' : 'cursor-pointer',
                        ].join(' ')}>
                        {isChecked ? '✓' : dayNum}
                      </button>
                    );
                  })}
                </div>
                <div className="print:hidden">
                  {!aiDailyQuote ? (
                    <button onClick={getAiDailyQuote} disabled={isQuoteLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl transition-colors border border-emerald-100/50">
                      {isQuoteLoading ? <Loader2 size={14} className="animate-spin" /> : <Coffee size={14} />}
                      {isQuoteLoading ? _('aiThinking') : _('getMotivation')}
                    </button>
                  ) : (
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                      <p className="text-xs leading-relaxed text-emerald-800 italic">"{aiDailyQuote}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* === STATS TAB === */}
            {activeTab === 'stats' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-gradient-to-br from-indigo-50/50 to-rose-50/50 p-5 rounded-2xl border border-slate-100/50 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-rose-100/50"><MessageSquareQuote size={80} strokeWidth={1} /></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Sparkles size={12} className="text-rose-400" /> {_('aiAdvisor')}</span>
                    <button onClick={getAiAdvice} disabled={isAiLoading || !subscriptions.length}
                      className="text-[10px] bg-white/70 text-slate-600 px-3 py-1.5 rounded-xl hover:bg-white transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50">
                      {isAiLoading ? <Loader2 size={12} className="animate-spin text-rose-400" /> : <Zap size={12} className="text-rose-400" />}
                      {isAiLoading ? _('analyzing') : _('startAnalysis')}
                    </button>
                  </div>
                  <div className="relative z-10 bg-white/60 backdrop-blur-sm rounded-xl p-3 min-h-[60px] flex items-center">
                    {aiAdvice
                      ? <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">{aiAdvice}</p>
                      : <p className="text-xs text-slate-300 font-light italic w-full text-center">{_('aiPlaceholder')}</p>}
                  </div>
                </div>
                {subscriptions.length > 0
                  ? <div className="h-44 flex justify-center"><Pie data={pieData} options={pieOptions} /></div>
                  : <div className="h-44 flex items-center justify-center text-slate-200"><Ghost size={48} strokeWidth={1} /></div>}
                <div className="bg-slate-50 p-4 rounded-2xl space-y-3 print:bg-transparent">
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-400">{_('monthlySpend')}</span><span className="font-bold text-slate-700">{displayCurrency}{monthlyTotal.toFixed(2)}</span></div>
                  <div className="w-full h-px bg-slate-200/60 print:bg-slate-300" />
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-400">{_('yearlyForecast')}</span><span className="font-bold text-rose-500">{displayCurrency}{(monthlyTotal * 12).toFixed(2)}</span></div>
                  <div className="w-full h-px bg-slate-200/60" />
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-400">{_('dailyCost')}</span><span className="font-bold text-slate-700">{displayCurrency}{(monthlyTotal / 30).toFixed(2)}</span></div>
                </div>

                {/* Tip jar */}
                <div className="bg-gradient-to-r from-amber-50/50 to-rose-50/50 p-4 rounded-2xl border border-amber-100/30 print:hidden">
                  <p className="text-xs font-medium text-slate-600 mb-3 flex items-center gap-1.5"><Heart size={12} className="text-rose-400" /> {_('tipTitle')}</p>
                  <div className="flex gap-2">
                    {[1, 3, 5].map(amt => (
                      <button key={amt} onClick={() => openTip(amt)}
                        className="flex-1 py-2 text-xs font-medium text-amber-700 bg-white/70 rounded-xl hover:bg-white transition-colors border border-amber-100/50">
                        {lang === 'zh' ? _(`tip${amt}`) : `$${amt}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* In-card footer actions */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 print:hidden">
            {/* Export button - secondary, contextual */}
            <button onClick={exportPDF}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer min-h-[44px]">
              <Download size={14} /> {_('exportPdf')}
            </button>

            {/* Pro upgrade banner - soft inline upsell */}
            {!isPro() && (
              <button onClick={() => setShowProModal(true)}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-rose-50 rounded-xl border border-amber-100/60 hover:from-amber-100/80 hover:to-rose-100/80 transition-all cursor-pointer min-h-[44px] group">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-rose-400 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                  <Crown size={14} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-xs font-semibold text-slate-700 block leading-tight">{_('upgradeTitle')}</span>
                  <span className="text-[10px] text-slate-400">{_('upgradePrice')}</span>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center text-[10px] text-slate-400 font-light tracking-wider print:hidden">
          {_('footer')}
        </footer>
      </div>

      {/* === ADD MODAL === */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="bg-white/90 backdrop-blur-xl w-full max-w-xs p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <h3 className="text-sm font-bold mb-6 tracking-widest text-slate-800 uppercase">{_('addSub')}</h3>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-1 border border-slate-100">
                <input className="w-full bg-transparent px-3 py-2 text-sm text-slate-700 placeholder-slate-300 outline-none"
                  placeholder={_('subName')} value={newSub.name}
                  onChange={e => setNewSub({ ...newSub, name: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <select className="w-[110px] bg-slate-50 rounded-xl border border-slate-100 px-2 py-2.5 text-sm text-slate-600 outline-none"
                  value={newSub.currency} onChange={e => setNewSub({ ...newSub, currency: e.target.value })}>
                  {Object.values(CURRENCIES).map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <div className="flex-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
                  <input className="w-full bg-transparent px-3 py-2 text-sm text-slate-700 placeholder-slate-300 outline-none"
                    placeholder={_('amount')} type="number" value={newSub.price}
                    onChange={e => setNewSub({ ...newSub, price: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <select className="flex-1 bg-slate-50 rounded-xl border border-slate-100 px-3 py-2.5 text-sm text-slate-600 outline-none"
                  value={newSub.category} onChange={e => setNewSub({ ...newSub, category: e.target.value })}>
                  {CATEGORY_VALUES.map((c, i) => <option key={c} value={c}>{CATEGORY_ICONS[c]} {_(CATEGORY_KEYS[i])}</option>)}
                </select>
                <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 flex overflow-hidden">
                  {['monthly', 'yearly'].map(c => (
                    <button key={c} onClick={() => setNewSub({ ...newSub, cycle: c })}
                      className={`flex-1 text-xs py-2.5 font-medium transition-all ${newSub.cycle === c ? 'bg-slate-800 text-white rounded-xl' : 'text-slate-400'}`}>
                      {c === 'monthly' ? _('monthly') : _('yearly')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-xs font-medium text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">{_('cancel')}</button>
              <button onClick={addSubscription} className="flex-1 py-3 text-xs font-medium text-white bg-rose-400 rounded-2xl hover:bg-rose-500 transition-colors shadow-md shadow-rose-100">{_('add')}</button>
            </div>
          </div>
        </div>
      )}

      {/* === PRO MODAL === */}
      {showProModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowProModal(false)}>
          <div className="bg-white/95 backdrop-blur-xl w-full max-w-xs p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 fade-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown size={28} className="text-amber-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{_('upgradeTitle')}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{_('upgradeDesc')}</p>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { icon: Sparkles, text: lang === 'zh' ? 'AI 无限使用' : 'Unlimited AI analysis' },
                { icon: Globe, text: lang === 'zh' ? '云端同步（即将推出）' : 'Cloud sync (coming soon)' },
                { icon: Lock, text: lang === 'zh' ? '永不收订阅费' : 'No subscription. Ever.' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-xs text-slate-600">
                  <Icon size={14} className="text-amber-500 shrink-0" /> {text}
                </div>
              ))}
            </div>
            <button onClick={() => { openCheckout(); setShowProModal(false); }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-rose-400 text-white text-xs font-bold rounded-2xl hover:from-amber-500 hover:to-rose-500 transition-colors shadow-lg shadow-rose-100 mb-2 cursor-pointer min-h-[44px]">
              {_('upgradeCta')} — {_('upgradePrice')}
            </button>
            <button onClick={() => setShowProModal(false)}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer min-h-[44px]">
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
