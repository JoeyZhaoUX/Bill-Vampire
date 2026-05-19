import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faChartLine, faArrowTrendUp, faArrowTrendDown } from '@fortawesome/free-solid-svg-icons';
import { isPro, openCheckout } from '../pro';
import { track } from '../analytics';

const CATEGORY_ICONS = { 'Entertainment': '🎮', 'Productivity': '⚡', 'Lifestyle': '🌿', 'Other': '📦' };

export default function AnnualAudit({ subscriptions, cancelledSubs, lang }) {
  const _ = (key) => {
    const strings = {
      title: lang === 'zh' ? '年度订阅审计' : 'Annual Subscription Audit',
      locked: lang === 'zh' ? '升级 Pro 解锁年度审计' : 'Upgrade to Pro for Annual Audit',
      activeSubs: lang === 'zh' ? '活跃订阅' : 'Active Subscriptions',
      killedSubs: lang === 'zh' ? '已终结' : 'Killed This Year',
      yearlySpend: lang === 'zh' ? '年度总支出' : 'Projected Yearly Spend',
      perDay: lang === 'zh' ? '每日成本' : 'Daily Cost',
      topVampire: lang === 'zh' ? '头号吸血鬼' : 'Top Vampire',
      breakdown: lang === 'zh' ? '分类明细' : 'Category Breakdown',
      verdict: lang === 'zh' ? '审计结论' : 'Audit Verdict',
    };
    return strings[key] || key;
  };

  const audit = useMemo(() => {
    const monthlyTotal = subscriptions.reduce((sum, s) => {
      const price = parseFloat(s.price) || 0;
      return sum + (s.cycle === 'yearly' ? price / 12 : price);
    }, 0);
    const yearlyTotal = monthlyTotal * 12;
    const daily = monthlyTotal / 30;

    // Category breakdown
    const cats = {};
    subscriptions.forEach(s => {
      const cat = s.category || 'Other';
      const price = parseFloat(s.price) || 0;
      const monthly = s.cycle === 'yearly' ? price / 12 : price;
      cats[cat] = (cats[cat] || 0) + monthly;
    });

    // Top vampire
    const sorted = [...subscriptions].sort((a, b) => {
      const pa = parseFloat(a.price) || 0;
      const pb = parseFloat(b.price) || 0;
      const ma = a.cycle === 'yearly' ? pa / 12 : pa;
      const mb = b.cycle === 'yearly' ? pb / 12 : pb;
      return mb - ma;
    });
    const topVampire = sorted[0] || null;

    // Verdict
    let verdict = '';
    if (yearlyTotal > 5000) verdict = lang === 'zh' ? '🚨 你的订阅开销已经相当于一个小型租金了。必须砍。' : '🚨 Your subscriptions cost more than a car payment. Time to kill.';
    else if (yearlyTotal > 2000) verdict = lang === 'zh' ? '⚠️ 年度超过$2000 — 至少砍掉2个你不常用的。' : '⚠️ Over $2K/year — cut at least 2 services you barely use.';
    else if (yearlyTotal > 500) verdict = lang === 'zh' ? '📋 合理范围，但仍有优化空间。' : '📋 Reasonable, but there\'s still fat to trim.';
    else verdict = lang === 'zh' ? '✅ 精简高效。继续保持。' : '✅ Lean and mean. Keep it up.';

    return { monthlyTotal, yearlyTotal, daily, cats, topVampire, verdict, sorted };
  }, [subscriptions, lang]);

  if (!isPro()) {
    return (
      <div className="bg-[#141420]/60 p-6 rounded-2xl border border-slate-800/30 relative overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-sm bg-[#0B0B11]/60 z-10 flex flex-col items-center justify-center gap-3">
          <FontAwesomeIcon icon={faCrown} className="w-6 h-6 text-amber-400" />
          <p className="text-sm text-slate-300 font-medium">{_('locked')}</p>
          <button onClick={() => { track('annual_audit_paywall'); openCheckout('annual_audit'); }}
            className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-xl cursor-pointer hover:brightness-110 transition-all">
            Unlock Pro
          </button>
        </div>
        <div className="opacity-20 pointer-events-none">
          <p className="text-sm font-bold text-slate-200 mb-3">{_('title')}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0B0B11]/40 rounded-xl p-3"><div className="h-4 w-16 bg-slate-800 rounded" /><div className="h-6 w-20 bg-slate-800 rounded mt-2" /></div>
            <div className="bg-[#0B0B11]/40 rounded-xl p-3"><div className="h-4 w-16 bg-slate-800 rounded" /><div className="h-6 w-20 bg-slate-800 rounded mt-2" /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-950/20 to-rose-950/20 p-6 rounded-2xl border border-amber-800/20">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <FontAwesomeIcon icon={faChartLine} className="w-4 h-4 text-amber-400" />
          {_('title')}
        </p>
        <span className="text-[9px] bg-amber-950/40 border border-amber-800/30 px-2 py-0.5 rounded-full text-amber-400 font-medium">PRO</span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-[#0B0B11]/40 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">{_('activeSubs')}</p>
          <p className="text-xl font-bold text-slate-200 mt-1">{subscriptions.length}</p>
        </div>
        <div className="bg-[#0B0B11]/40 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">{_('killedSubs')}</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{cancelledSubs?.length || 0}</p>
        </div>
        <div className="bg-[#0B0B11]/40 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">{_('yearlySpend')}</p>
          <p className="text-xl font-bold text-rose-400 mt-1 tabular-nums">${audit.yearlyTotal.toFixed(0)}</p>
        </div>
        <div className="bg-[#0B0B11]/40 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">{_('perDay')}</p>
          <p className="text-xl font-bold text-slate-200 mt-1 tabular-nums">${audit.daily.toFixed(2)}</p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">{_('breakdown')}</p>
        <div className="space-y-2">
          {Object.entries(audit.cats).sort((a, b) => b[1] - a[1]).map(([cat, total]) => {
            const pct = audit.monthlyTotal > 0 ? (total / audit.monthlyTotal * 100) : 0;
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-sm w-5">{CATEGORY_ICONS[cat] || '📦'}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">{cat}</span>
                    <span className="text-slate-300 font-medium tabular-nums">${total.toFixed(0)}/mo · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-[#0B0B11] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-600 to-rose-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top vampire */}
      {audit.topVampire && (
        <div className="bg-[#0B0B11]/40 rounded-xl p-4 mb-4 flex items-center gap-3">
          <span className="text-2xl">{CATEGORY_ICONS[audit.topVampire.category] || '📦'}</span>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-rose-500/60">{_('topVampire')}</p>
            <p className="text-sm font-bold text-slate-200">{audit.topVampire.name}</p>
          </div>
          <p className="text-lg font-bold text-rose-400 tabular-nums">
            ${((parseFloat(audit.topVampire.price) || 0) * (audit.topVampire.cycle === 'yearly' ? 1 : 12)).toFixed(0)}<span className="text-xs text-slate-600">/yr</span>
          </p>
        </div>
      )}

      {/* Verdict */}
      <div className="bg-[#0B0B11]/40 rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">{_('verdict')}</p>
        <p className="text-sm text-slate-300 leading-relaxed">{audit.verdict}</p>
      </div>
    </div>
  );
}
