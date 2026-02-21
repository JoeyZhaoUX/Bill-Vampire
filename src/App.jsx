import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Ghost, Zap, PieChart as PieIcon,
  CheckCircle2, Download, MessageSquareQuote,
  Loader2, Sparkles, Receipt, Search, Coffee
} from 'lucide-react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const apiKey = '';

const CURRENCIES = {
  CNY: { code: 'CNY', flag: '🇨🇳', symbol: '¥', name: '人民币', rate: 1 },
  USD: { code: 'USD', flag: '🇺🇸', symbol: '$', name: '美元', rate: 7.2 },
  JPY: { code: 'JPY', flag: '🇯🇵', symbol: '¥', name: '日元', rate: 0.048 },
  EUR: { code: 'EUR', flag: '🇪🇺', symbol: '€', name: '欧元', rate: 7.8 },
  GBP: { code: 'GBP', flag: '🇬🇧', symbol: '£', name: '英镑', rate: 9.1 },
  HKD: { code: 'HKD', flag: '🇭🇰', symbol: 'HK$', name: '港币', rate: 0.92 },
};

const CATEGORIES = ['娱乐', '生产力', '生活', '其他'];

const CATEGORY_ICONS = { '娱乐': '🎮', '生产力': '⚡', '生活': '🌿', '其他': '📦' };

export default function App() {
  const [activeTab, setActiveTab] = useState('subs');
  const [subscriptions, setSubscriptions] = useState([]);
  const [noSpendDays, setNoSpendDays] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', price: '', currency: 'CNY', cycle: 'monthly', category: '其他' });
  const [aiAdvice, setAiAdvice] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAlternatives, setAiAlternatives] = useState('');
  const [isAlternativesLoading, setIsAlternativesLoading] = useState(false);
  const [aiDailyQuote, setAiDailyQuote] = useState('');
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  useEffect(() => {
    const savedSubs = localStorage.getItem('vampire_subs');
    const savedDays = localStorage.getItem('vampire_no_spend');
    if (savedSubs) setSubscriptions(JSON.parse(savedSubs));
    if (savedDays) setNoSpendDays(JSON.parse(savedDays));
  }, []);
  useEffect(() => { localStorage.setItem('vampire_subs', JSON.stringify(subscriptions)); }, [subscriptions]);
  useEffect(() => { localStorage.setItem('vampire_no_spend', JSON.stringify(noSpendDays)); }, [noSpendDays]);

  const monthlyTotal = useMemo(() => subscriptions.reduce((acc, sub) => {
    const price = parseFloat(sub.price) || 0;
    const rate = CURRENCIES[sub.currency || 'CNY']?.rate || 1;
    const cp = price * rate;
    return acc + (sub.cycle === 'yearly' ? cp / 12 : cp);
  }, 0), [subscriptions]);

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
    setNewSub({ name: '', price: '', currency: 'CNY', cycle: 'monthly', category: '其他' });
    setShowAddModal(false);
    setAiAdvice(''); setAiAlternatives('');
  };
  const deleteSub = (id) => { setSubscriptions(subscriptions.filter(s => s.id !== id)); setAiAdvice(''); setAiAlternatives(''); };

  const callGeminiAPI = async (userPrompt, systemPrompt) => {
    if (!apiKey) { alert('请先在代码中填入 Gemini API Key！'); return '（API Key 未配置）'; }
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: userPrompt }] }], systemInstruction: { parts: [{ text: systemPrompt }] } }),
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'AI 似乎在打盹。';
    } catch (err) { console.error(err); return 'AI 暂时断网了，大概是心疼你的电费去了。'; }
  };

  const getAiAdvice = async () => {
    if (!subscriptions.length) return;
    setIsAiLoading(true);
    const list = subscriptions.map(s => `${s.name}(${s.price}${s.currency}/${s.cycle === 'monthly' ? '月' : '年'})`).join('、');
    const result = await callGeminiAPI(
      `我的订阅清单是：${list}。我每月总支出折合人民币是 ¥${monthlyTotal.toFixed(2)}。请开始你的表演。`,
      '你是一个嘴欠、毒舌但心善的财务顾问。用幽默讽刺但最终带着暖意的语气，给出3点犀利点评和1个实用节省建议。不超过150字。'
    );
    setAiAdvice(result); setIsAiLoading(false);
  };

  const getAiAlternatives = async () => {
    if (!subscriptions.length) return;
    setIsAlternativesLoading(true);
    const list = subscriptions.map(s => s.name).join('、');
    const result = await callGeminiAPI(
      `我在为这些东西花钱：${list}。快告诉我有没有能白嫖或者便宜的替代品？`,
      '你是一个精通互联网工具的省钱极客。针对用户订阅列表，给出2-3个免费或更便宜的替代方案，格式简洁用bullet point，每条不超过30字。'
    );
    setAiAlternatives(result); setIsAlternativesLoading(false);
  };

  const getAiDailyQuote = async () => {
    setIsQuoteLoading(true);
    const result = await callGeminiAPI(
      `在总共${daysInMonth}天的这个月里，我已经成功坚持了${currentStreak}天不消费。今天是第${currentDay}天。请给我一句话鼓励（或嘲讽）。`,
      '你是一个傲娇、毒舌的AI情绪伴侣。如果不消费天数少于5天要嘲讽但带鼓励；5天以上要夸奖但语气傲娇。回复限制在60字以内，可以用emoji。'
    );
    setAiDailyQuote(result); setIsQuoteLoading(false);
  };

  const exportPDF = () => window.print();

  const pieData = {
    labels: ['娱乐', '生产力', '生活', '其他'],
    datasets: [{
      data: ['娱乐', '生产力', '生活', '其他'].map(cat =>
        subscriptions.filter(s => s.category === cat).reduce((sum, s) => {
          const price = parseFloat(s.price) || 0;
          const rate = CURRENCIES[s.currency || 'CNY']?.rate || 1;
          const cp = price * rate;
          return sum + (s.cycle === 'yearly' ? cp / 12 : cp);
        }, 0)
      ),
      backgroundColor: ['#fda4af', '#c4b5fd', '#6ee7b7', '#fcd34d'],
      borderWidth: 2, borderColor: '#ffffff', hoverOffset: 6,
    }],
  };
  const pieOptions = { plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 10 } } }, maintainAspectRatio: false };
  const tabs = [{ id: 'subs', label: '账单', icon: Ghost }, { id: 'no-spend', label: '打卡', icon: CheckCircle2 }, { id: 'stats', label: '统计', icon: PieIcon }];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-start py-12 px-4">
      <div className="max-w-md w-full relative">
        <div className="absolute top-0 left-10 w-48 h-48 bg-rose-200/40 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-0 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl -z-10" />

        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] p-8">
          <header className="flex flex-col items-center mb-8 border-b border-slate-100 pb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm text-rose-400">
              <Receipt size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-medium tracking-widest text-slate-800">隐形账单追踪</h1>
            <p className="text-xs text-slate-400 mt-2 font-light tracking-wider">让每一分吸血都无处遁形 🦇</p>
            <div className="mt-5 bg-gradient-to-r from-rose-50 to-indigo-50 px-6 py-3 rounded-2xl w-full text-center">
              <span className="text-sm font-medium text-slate-600">每月流失：<span className="text-rose-500 font-bold text-lg ml-1">¥{monthlyTotal.toFixed(2)}</span></span>
            </div>
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
            {activeTab === 'subs' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-xs font-medium text-slate-400 tracking-widest uppercase">订阅列表</span>
                  <button onClick={() => setShowAddModal(true)} className="p-2 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-100 transition-colors"><Plus size={16} strokeWidth={2} /></button>
                </div>
                {subscriptions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                    <Ghost size={48} strokeWidth={1} className="mb-4" />
                    <p className="text-sm font-light">太棒啦，目前没有发现吸血鬼 🦇~</p>
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
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">{sub.category}</span>
                            <span>·</span>
                            <span>{sub.cycle === 'monthly' ? '月付' : '年付'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700">{CURRENCIES[sub.currency || 'CNY']?.symbol}{sub.price}</span>
                        <button onClick={() => deleteSub(sub.id)} className="text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {subscriptions.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-4 print:hidden">
                    {!aiAlternatives ? (
                      <button onClick={getAiAlternatives} disabled={isAlternativesLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl transition-colors border border-indigo-100/50">
                        {isAlternativesLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        {isAlternativesLoading ? '寻找平替中...' : '🔍 帮我找平替 / 免费版'}
                      </button>
                    ) : (
                      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                        <h4 className="text-xs font-bold text-indigo-600 mb-2 flex items-center gap-1.5"><Sparkles size={12} /> AI 平替方案</h4>
                        <p className="text-xs leading-relaxed text-indigo-900/80 whitespace-pre-wrap">{aiAlternatives}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'no-spend' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-center mb-8">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">不消费打卡日历 ✨</h3>
                  <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span className="text-xs text-green-700 font-medium">本月已坚持 {currentStreak} 天</span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5 mb-8">
                  {['日', '一', '二', '三', '四', '五', '六'].map(day => (
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
                      {isQuoteLoading ? 'AI 思考中...' : '☀️ 获取今日情绪支持'}
                    </button>
                  ) : (
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                      <p className="text-xs leading-relaxed text-emerald-800 italic">"{aiDailyQuote}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-gradient-to-br from-indigo-50/50 to-rose-50/50 p-5 rounded-2xl border border-slate-100/50 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-rose-100/50"><MessageSquareQuote size={80} strokeWidth={1} /></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Sparkles size={12} className="text-rose-400" /> AI 毒舌顾问</span>
                    <button onClick={getAiAdvice} disabled={isAiLoading || !subscriptions.length}
                      className="text-[10px] bg-white/70 text-slate-600 px-3 py-1.5 rounded-xl hover:bg-white transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50">
                      {isAiLoading ? <Loader2 size={12} className="animate-spin text-rose-400" /> : <Zap size={12} className="text-rose-400" />}
                      {isAiLoading ? '分析中...' : '开始分析'}
                    </button>
                  </div>
                  <div className="relative z-10 bg-white/60 backdrop-blur-sm rounded-xl p-3 min-h-[60px] flex items-center">
                    {aiAdvice
                      ? <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">{aiAdvice}</p>
                      : <p className="text-xs text-slate-300 font-light italic w-full text-center">点击"开始分析"，让 AI 来毒舌你的账单 💸</p>}
                  </div>
                </div>
                {subscriptions.length > 0
                  ? <div className="h-44 flex justify-center"><Pie data={pieData} options={pieOptions} /></div>
                  : <div className="h-44 flex items-center justify-center text-slate-200"><Ghost size={48} strokeWidth={1} /></div>}
                <div className="bg-slate-50 p-4 rounded-2xl space-y-3 print:bg-transparent">
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-400">月均支出</span><span className="font-bold text-slate-700">¥{monthlyTotal.toFixed(2)}</span></div>
                  <div className="w-full h-px bg-slate-200/60 print:bg-slate-300" />
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-400">年度预测</span><span className="font-bold text-rose-500">¥{(monthlyTotal * 12).toFixed(2)}</span></div>
                  <div className="w-full h-px bg-slate-200/60" />
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-400">每日成本</span><span className="font-bold text-slate-700">¥{(monthlyTotal / 30).toFixed(2)}</span></div>
                </div>
              </div>
            )}
          </main>
        </div>

        <div className="mt-8 flex justify-center print:hidden">
          <button onClick={exportPDF} className="w-full max-w-[280px] py-4 bg-slate-800 text-white text-xs font-medium rounded-2xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
            <Download size={18} /> 生成专属手帐打卡图 (PDF)
          </button>
        </div>
        <footer className="mt-8 text-center text-[10px] text-slate-400 font-light tracking-wider">
          隐形账单追踪器 · 让每一分钱都被看见 🦇
        </footer>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="bg-white/90 backdrop-blur-xl w-full max-w-xs p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <h3 className="text-sm font-bold mb-6 tracking-widest text-slate-800 uppercase">添加订阅</h3>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-1 border border-slate-100">
                <input className="w-full bg-transparent px-3 py-2 text-sm text-slate-700 placeholder-slate-300 outline-none"
                  placeholder="订阅名称 (如：Netflix)" value={newSub.name}
                  onChange={e => setNewSub({ ...newSub, name: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <select className="w-[110px] bg-slate-50 rounded-xl border border-slate-100 px-2 py-2.5 text-sm text-slate-600 outline-none"
                  value={newSub.currency} onChange={e => setNewSub({ ...newSub, currency: e.target.value })}>
                  {Object.values(CURRENCIES).map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <div className="flex-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
                  <input className="w-full bg-transparent px-3 py-2 text-sm text-slate-700 placeholder-slate-300 outline-none"
                    placeholder="金额" type="number" value={newSub.price}
                    onChange={e => setNewSub({ ...newSub, price: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <select className="flex-1 bg-slate-50 rounded-xl border border-slate-100 px-3 py-2.5 text-sm text-slate-600 outline-none"
                  value={newSub.category} onChange={e => setNewSub({ ...newSub, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
                </select>
                <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 flex overflow-hidden">
                  {['monthly', 'yearly'].map(c => (
                    <button key={c} onClick={() => setNewSub({ ...newSub, cycle: c })}
                      className={`flex-1 text-xs py-2.5 font-medium transition-all ${newSub.cycle === c ? 'bg-slate-800 text-white rounded-xl' : 'text-slate-400'}`}>
                      {c === 'monthly' ? '月付' : '年付'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-xs font-medium text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">取消</button>
              <button onClick={addSubscription} className="flex-1 py-3 text-xs font-medium text-white bg-rose-400 rounded-2xl hover:bg-rose-500 transition-colors shadow-md shadow-rose-100">+ 添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
