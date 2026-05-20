import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHourglass, faPlus, faTrash, faBell, faCheck, faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { track } from '../analytics';

const STORAGE_KEY = 'vampire_trials';

function loadTrials() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveTrials(trials) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trials));
}

function daysUntil(timestamp, now) {
  return Math.ceil((timestamp - now) / (1000 * 60 * 60 * 24));
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TrialTracker({ lang }) {
  const [trials, setTrials] = useState(loadTrials);
  const [showAdd, setShowAdd] = useState(false);
  const [newTrial, setNewTrial] = useState({ name: '', expiresIn: 7, price: '' });
  const [now] = useState(() => Date.now());

  useEffect(() => { saveTrials(trials); }, [trials]);

  const { active, expired } = useMemo(() => {
    const active = trials.filter(t => t.expiresAt > now && !t.cancelled);
    const expired = trials.filter(t => t.expiresAt <= now || t.cancelled);
    return { active: active.sort((a, b) => a.expiresAt - b.expiresAt), expired };
  }, [trials, now]);

  const addTrial = () => {
    if (!newTrial.name.trim()) return;
    const expiresAt = Date.now() + (parseInt(newTrial.expiresIn) || 7) * 24 * 60 * 60 * 1000;
    const trial = {
      id: Date.now() + Math.random(),
      name: newTrial.name.trim(),
      expiresAt,
      priceAfter: newTrial.price || null,
      cancelled: false,
      createdAt: Date.now(),
    };
    setTrials(prev => [...prev, trial]);
    setNewTrial({ name: '', expiresIn: 7, price: '' });
    setShowAdd(false);
    track('trial_added', { name: trial.name, days: newTrial.expiresIn });
  };

  const markCancelled = (id) => {
    setTrials(prev => prev.map(t => t.id === id ? { ...t, cancelled: true } : t));
    track('trial_cancelled');
    // Brief haptic-like feedback for native feel
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const removeTrial = (id) => {
    setTrials(prev => prev.filter(t => t.id !== id));
  };

  const urgentCount = active.filter(t => daysUntil(t.expiresAt, now) <= 3).length;

  return (
    <div className="bg-[#141420]/60 rounded-3xl border border-slate-800/30 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faHourglass} className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            {lang === 'zh' ? '免费试用追踪' : 'Trial Tracker'}
          </h3>
          {urgentCount > 0 && (
            <span className="px-2 py-0.5 bg-rose-950/60 border border-rose-800/40 rounded-full text-[10px] font-bold text-rose-400">
              {urgentCount} expiring soon
            </span>
          )}
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="p-2 bg-amber-950/40 text-amber-400 rounded-xl hover:bg-amber-950/60 transition-colors cursor-pointer">
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-[#0D0D15] rounded-2xl border border-slate-800/40 p-4 mb-4 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <input type="text" placeholder={lang === 'zh' ? '服务名称 (如 Adobe, Notion)' : 'Service name (e.g. Adobe, Notion)'} value={newTrial.name}
            onChange={e => setNewTrial(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') addTrial(); }}
            className="w-full bg-[#1C1C2A] rounded-xl border border-slate-700/50 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-amber-700/50 transition-colors" />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 block mb-1">{lang === 'zh' ? '几天后开始收费' : 'Days until billing starts'}</label>
              <input type="number" value={newTrial.expiresIn} min="1" max="365"
                onChange={e => setNewTrial(p => ({ ...p, expiresIn: e.target.value }))}
                className="w-full bg-[#1C1C2A] rounded-xl border border-slate-700/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-700/50 transition-colors" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 block mb-1">{lang === 'zh' ? '试用后价格 (选填)' : 'Price after trial (optional)'}</label>
              <input type="text" placeholder="$9.99/mo" value={newTrial.price}
                onChange={e => setNewTrial(p => ({ ...p, price: e.target.value }))}
                className="w-full bg-[#1C1C2A] rounded-xl border border-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-amber-700/50 transition-colors" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 text-sm font-medium text-slate-500 bg-[#1C1C2A] hover:bg-[#252536] rounded-xl cursor-pointer transition-colors">
              {lang === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button onClick={addTrial}
              disabled={!newTrial.name.trim()}
              className="flex-1 py-2.5 text-sm font-semibold text-amber-200 bg-amber-900/30 hover:bg-amber-900/50 rounded-xl border border-amber-800/30 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {lang === 'zh' ? '开始追踪' : 'Track this trial'}
            </button>
          </div>
        </div>
      )}

      {/* Active trials */}
      {active.length === 0 && !showAdd && (
        <div className="text-center py-6">
          <div className="text-3xl mb-3 opacity-60">⏳</div>
          <p className="text-sm text-slate-500 mb-1.5">
            {lang === 'zh' ? '没有在追踪的试用' : 'No trials being tracked'}
          </p>
          <p className="text-xs text-slate-700 max-w-[220px] mx-auto">
            {lang === 'zh' ? '添加免费试用，到期前提醒你取消' : "Add free trials here — we'll remind you before they charge"}
          </p>
          <button onClick={() => setShowAdd(true)}
            className="mt-4 text-xs text-amber-400/70 hover:text-amber-300 cursor-pointer transition-colors">
            + {lang === 'zh' ? '添加试用' : 'Add a trial'}
          </button>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-2 mb-4">
          {active.map(trial => {
            const days = daysUntil(trial.expiresAt, now);
            const isUrgent = days <= 3;
            const isWarning = days <= 7 && days > 3;

            return (
              <div key={trial.id}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                  isUrgent ? 'bg-rose-950/30 border-rose-800/40 urgent-pulse' :
                  isWarning ? 'bg-amber-950/20 border-amber-800/30' :
                  'bg-[#0D0D15]/60 border-slate-800/30'
                }`}>
                {isUrgent && (
                  <div className="w-8 h-8 rounded-lg bg-rose-900/40 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  </div>
                )}
                {isWarning && (
                  <div className="w-8 h-8 rounded-lg bg-amber-900/30 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faBell} className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}
                {!isUrgent && !isWarning && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800/40 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faHourglass} className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{trial.name}</p>
                  <p className={`text-[11px] ${isUrgent ? 'text-rose-400 font-semibold' : isWarning ? 'text-amber-400' : 'text-slate-500'}`}>
                    {days <= 0 ? 'Charges today!' : `${days} day${days > 1 ? 's' : ''} left`}
                    {trial.priceAfter && ` · then ${trial.priceAfter}`}
                  </p>
                </div>
                <button onClick={() => markCancelled(trial.id)}
                  title="Mark as cancelled"
                  className="p-2 text-emerald-600 hover:text-emerald-400 cursor-pointer transition-colors">
                  <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => removeTrial(trial.id)}
                  title="Remove"
                  className="p-2 text-rose-800 hover:text-rose-400 cursor-pointer transition-colors">
                  <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Expired / cancelled */}
      {expired.length > 0 && (
        <details className="group">
          <summary className="text-[10px] uppercase tracking-widest text-slate-600 cursor-pointer hover:text-slate-400 transition-colors">
            {expired.length} expired/cancelled
          </summary>
          <div className="mt-2 space-y-1.5">
            {expired.slice(0, 5).map(trial => (
              <div key={trial.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0D0D15]/30 opacity-60">
                <span className="text-xs text-slate-500 flex-1">{trial.name}</span>
                <span className="text-[10px] text-slate-600">
                  {trial.cancelled ? '✓ Cancelled' : `Expired ${formatDate(trial.expiresAt)}`}
                </span>
                <button onClick={() => removeTrial(trial.id)}
                  className="text-slate-700 hover:text-slate-400 cursor-pointer p-1">
                  <FontAwesomeIcon icon={faTrash} className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Value prop */}
      <div className="mt-4 pt-4 border-t border-slate-800/20">
        <p className="text-[10px] text-slate-600 leading-relaxed">
          💡 {lang === 'zh'
            ? '美国人平均每年因忘记取消试用浪费$252。追踪你的试用，到期前提醒你。'
            : 'Americans waste $252/year on forgotten free trials. Track them here, kill them before they bite.'}
        </p>
      </div>
    </div>
  );
}
