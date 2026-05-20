import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSkull, faArrowRight, faCircleCheck, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { monthlyUsd } from './verdict';
import { getCancelLink } from '../cancelLinks';
import { track } from '../analytics';
import ZhBanner from '../ZhBanner';

export default function Commit({ subscriptions, onDone, auth, onAuthRequest }) {
  const [selected, setSelected] = useState(new Set());

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalKillSavings = subscriptions
    .filter(s => selected.has(s.id))
    .reduce((acc, s) => acc + monthlyUsd(s) * 12, 0);

  const finish = () => {
    track('commit_completed', { killed: selected.size, yearly_savings: Math.round(totalKillSavings) });
    onDone({ killedIds: Array.from(selected) });
  };

  return (
    <div className="bv-brutal min-h-screen bg-[#0B0B11] text-slate-100 relative overflow-hidden">
      <ZhBanner />
      <header className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}icons/icon.png`} alt="Bill Vampire" className="w-8 h-8 rounded-lg" />
          <span className="font-gothic text-sm font-bold tracking-wider">Bill Vampire</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Step 3 of 3 — Kill</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 pb-16">
        <div className="text-center mb-10 pt-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-900/60 to-teal-900/60 items-center justify-center mb-4 border border-emerald-700/30">
            <FontAwesomeIcon icon={faSkull} className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="font-gothic text-3xl sm:text-4xl font-bold leading-tight mb-3">
            Which vampire dies <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">first</span>?
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Pick the subscriptions you're cancelling this week. We'll track the kill count — and rub it in when friends ask how you saved so much.
          </p>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-10">No subscriptions to commit to — head into the app to add some.</p>
        ) : (
          <div className="space-y-2 mb-8">
            {subscriptions.map(s => {
              const picked = selected.has(s.id);
              const yearlyUsd = monthlyUsd(s) * 12;
              const cancelUrl = getCancelLink(s.name);
              return (
                <div key={s.id} className={`rounded-2xl border transition-all ${picked
                  ? 'bg-emerald-950/30 border-emerald-700/50'
                  : 'bg-[#141420]/60 border-slate-800/40 hover:border-slate-700/60'}`}>
                  <button onClick={() => toggle(s.id)}
                    className="w-full flex items-center gap-4 p-4 cursor-pointer text-left">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${picked
                      ? 'bg-emerald-500 border-emerald-400'
                      : 'border-slate-600'}`}>
                      {picked && <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-100">{s.name}</p>
                      <p className="text-[11px] text-slate-500">Saves ~${yearlyUsd.toFixed(0)}/year</p>
                    </div>
                    <span className="text-sm font-bold text-slate-300 tabular-nums">${monthlyUsd(s).toFixed(2)}/mo</span>
                  </button>
                  {picked && cancelUrl && (
                    <div className="px-4 pb-3 pl-14">
                      <a href={cancelUrl} target="_blank" rel="noopener noreferrer"
                        onClick={() => track('cancel_link_clicked', { name: s.name })}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors no-underline">
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-2.5 h-2.5" />
                        Go to cancel page
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selected.size > 0 && (
          <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/40 rounded-2xl border border-emerald-700/30 p-5 mb-6 text-center">
            <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-[0.25em] mb-2">If you follow through</p>
            <p className="font-gothic text-3xl font-black text-emerald-400 mb-1 tabular-nums">
              +${totalKillSavings.toFixed(0)}
            </p>
            <p className="text-xs text-slate-400">Back in your pocket this year.</p>
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-[rgba(201,164,106,0.22)] bg-[#171217]/80 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">
              {auth?.status === 'authenticated' ? 'Cancellation plan can sync' : 'Save your cancellation plan'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {auth?.status === 'authenticated'
                ? `${auth.user?.email || 'Your account'} keeps this list available after cache clears.`
                : 'Create an account after results to keep cancelled subscriptions and reminders.'}
            </p>
          </div>
          {auth?.status !== 'authenticated' && (
            <button onClick={() => onAuthRequest?.('commit_save')} className="px-4 py-2 rounded-xl bg-[#8E1D2C] text-[#F7EFE6] text-xs font-bold cursor-pointer">
              Save with account
            </button>
          )}
        </div>

        <button onClick={finish}
          className="w-full py-4 bg-rose-600 hover:bg-rose-500 rounded-2xl text-sm font-bold text-white shadow-xl shadow-rose-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
          Enter the dashboard
          <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
        </button>
        {selected.size === 0 && (
          <p className="text-[11px] text-slate-600 text-center mt-3">Not ready to cancel any yet? Skip — you can do this later from the dashboard.</p>
        )}
      </main>
    </div>
  );
}
