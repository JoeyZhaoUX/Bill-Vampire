import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeartPulse, faSkull, faTriangleExclamation, faShieldHalved,
  faClock, faFire, faArrowTrendDown,
} from '@fortawesome/free-solid-svg-icons';

// Subscription Health Score — gives users a persistent reason to come back.
// ChatGPT Finance shows data; Bill Vampire gives a SCORE you want to improve.

function computeHealthScore(subscriptions, cancelledSubs) {
  if (!subscriptions.length) return { score: 100, grade: 'A+', risks: [], wins: [] };

  const now = Date.now();
  const risks = [];
  const wins = [];

  // Factor 1: Monthly cost as % of typical US discretionary income (~$2000/mo)
  const monthlyTotal = subscriptions.reduce((acc, s) => {
    const price = parseFloat(s.price) || 0;
    const monthly = s.cycle === 'yearly' ? price / 12 : price;
    return acc + monthly;
  }, 0);

  const costRatio = monthlyTotal / 2000; // % of typical discretionary income
  let costPenalty = 0;
  if (costRatio > 0.15) {
    costPenalty = 30;
    risks.push({ type: 'high_spend', severity: 'critical', message: `$${Math.round(monthlyTotal)}/mo is over 15% of typical discretionary budget` });
  } else if (costRatio > 0.08) {
    costPenalty = 15;
    risks.push({ type: 'moderate_spend', severity: 'warning', message: `$${Math.round(monthlyTotal)}/mo — getting hefty` });
  }

  // Factor 2: Subscription count (diminishing utility after 5)
  const countPenalty = Math.min(20, Math.max(0, (subscriptions.length - 5) * 4));
  if (subscriptions.length > 8) {
    risks.push({ type: 'too_many', severity: 'warning', message: `${subscriptions.length} active subscriptions — likely overlap` });
  }

  // Factor 3: Category concentration (all in one category = risky)
  const categories = {};
  subscriptions.forEach(s => { categories[s.category] = (categories[s.category] || 0) + 1; });
  const maxInCategory = Math.max(...Object.values(categories));
  const concentrationPenalty = maxInCategory > 3 ? 10 : 0;
  if (maxInCategory > 3) {
    const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0][0];
    risks.push({ type: 'concentrated', severity: 'info', message: `${maxInCategory} subscriptions in "${topCat}" — consolidate?` });
  }

  // Factor 4: Upcoming charges in next 7 days (awareness penalty)
  const upcomingSoon = subscriptions.filter(s => {
    if (!s.nextChargeAt) return false;
    const daysUntil = (s.nextChargeAt - now) / (1000 * 60 * 60 * 24);
    return daysUntil > 0 && daysUntil <= 7;
  });
  if (upcomingSoon.length > 0) {
    risks.push({
      type: 'upcoming',
      severity: 'info',
      message: `${upcomingSoon.length} charge${upcomingSoon.length > 1 ? 's' : ''} in the next 7 days ($${upcomingSoon.reduce((s, sub) => s + (parseFloat(sub.price) || 0), 0).toFixed(0)})`,
    });
  }

  // Wins
  if (cancelledSubs.length > 0) {
    const totalSaved = cancelledSubs.reduce((s, c) => s + (c.monthlyUSD || 0), 0);
    wins.push({ message: `Killed ${cancelledSubs.length} vampire${cancelledSubs.length > 1 ? 's' : ''} — saving $${Math.round(totalSaved)}/mo` });
  }
  if (subscriptions.length <= 5 && monthlyTotal < 100) {
    wins.push({ message: "Lean stack — you're in control" });
  }

  const rawScore = Math.max(0, 100 - costPenalty - countPenalty - concentrationPenalty);
  const score = Math.round(rawScore);

  let grade;
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return { score, grade, risks, wins, monthlyTotal, subCount: subscriptions.length };
}

function getScoreColor(score) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

function getScoreRingColor(score) {
  if (score >= 80) return 'stroke-emerald-500';
  if (score >= 60) return 'stroke-amber-500';
  return 'stroke-rose-500';
}

function getSeverityIcon(severity) {
  if (severity === 'critical') return faSkull;
  if (severity === 'warning') return faTriangleExclamation;
  return faClock;
}

function getSeverityColor(severity) {
  if (severity === 'critical') return 'text-rose-400 bg-rose-950/40 border-rose-800/30';
  if (severity === 'warning') return 'text-amber-400 bg-amber-950/40 border-amber-800/30';
  return 'text-blue-400 bg-blue-950/40 border-blue-800/30';
}

export default function SubscriptionHealth({ subscriptions, cancelledSubs, lang }) {
  const health = useMemo(() => computeHealthScore(subscriptions, cancelledSubs), [subscriptions, cancelledSubs]);

  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (health.score / 100) * circumference;

  return (
    <div className="bg-[#141420]/60 rounded-3xl border border-slate-800/30 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2 mb-5">
        <FontAwesomeIcon icon={faHeartPulse} className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          {lang === 'zh' ? '订阅健康度' : 'Subscription Health'}
        </h3>
      </div>

      <div className="flex items-center gap-6 mb-6">
        {/* Score ring */}
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor"
              className="text-slate-800/40" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="none"
              className={`${getScoreRingColor(health.score)} score-ring-animate`}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ '--target-offset': dashOffset }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-black ${getScoreColor(health.score)}`}>{health.score}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">{lang === 'zh' ? '分数' : 'score'}</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black ${getScoreColor(health.score)}`}>{health.grade}</span>
            <span className="text-xs text-slate-500">
              {health.score >= 80 && (lang === 'zh' ? '健康' : 'Healthy')}
              {health.score >= 60 && health.score < 80 && (lang === 'zh' ? '需注意' : 'Needs attention')}
              {health.score < 60 && (lang === 'zh' ? '危险' : 'Critical')}
            </span>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">{lang === 'zh' ? '月支出' : 'Monthly'}</p>
              <p className="text-sm font-bold text-slate-300">${Math.round(health.monthlyTotal || 0)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">{lang === 'zh' ? '数量' : 'Active'}</p>
              <p className="text-sm font-bold text-slate-300">{health.subCount || 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">{lang === 'zh' ? '已杀' : 'Killed'}</p>
              <p className="text-sm font-bold text-emerald-400">{cancelledSubs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Risks */}
      {health.risks.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faFire} className="w-2.5 h-2.5" />
            {lang === 'zh' ? '风险项' : 'Risk factors'}
          </p>
          {health.risks.map((risk, i) => (
            <div key={i} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${getSeverityColor(risk.severity)}`}>
              <FontAwesomeIcon icon={getSeverityIcon(risk.severity)} className="w-3 h-3 shrink-0" />
              <span className="text-xs">{risk.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Wins */}
      {health.wins.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faShieldHalved} className="w-2.5 h-2.5" />
            {lang === 'zh' ? '成就' : 'Wins'}
          </p>
          {health.wins.map((win, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-emerald-400 bg-emerald-950/30 border-emerald-800/20">
              <FontAwesomeIcon icon={faArrowTrendDown} className="w-3 h-3 shrink-0" />
              <span className="text-xs">{win.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
