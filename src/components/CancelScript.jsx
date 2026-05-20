import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faScissors, faSpinner, faCopy, faCheck, faArrowUpRightFromSquare,
  faLock, faCrown, faPhoneVolume, faComments,
} from '@fortawesome/free-solid-svg-icons';
import { isPro, openCheckout } from '../pro';
import { track } from '../analytics';
import { getCancelLink } from '../cancelLinks';
import { callAi } from '../aiClient';

const SCRIPT_TYPES = {
  en: [
    { id: 'cancel', label: 'Cancel script', icon: faScissors, desc: 'Step-by-step cancellation walkthrough' },
    { id: 'negotiate', label: 'Negotiate lower', icon: faPhoneVolume, desc: 'Script to negotiate a discount' },
    { id: 'downgrade', label: 'Downgrade plan', icon: faComments, desc: 'Find a cheaper plan that fits' },
  ],
  zh: [
    { id: 'cancel', label: '取消脚本', icon: faScissors, desc: '一步步教你取消订阅' },
    { id: 'negotiate', label: '砍价话术', icon: faPhoneVolume, desc: '生成降价谈判脚本' },
    { id: 'downgrade', label: '降级方案', icon: faComments, desc: '找到更便宜的方案' },
  ],
};

export default function CancelScript({ subscription, lang, onClose }) {
  const [scriptType, setScriptType] = useState(null);
  const [script, setScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const pro = isPro();
  const cancelUrl = getCancelLink(subscription?.name);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const generateScript = async (type) => {
    if (!pro) {
      track('cancel_script_paywall');
      openCheckout('cancel_script');
      return;
    }

    setScriptType(type);
    setIsLoading(true);
    setScript('');
    track('cancel_script_requested', { type, service: subscription.name });

    const priceStr = `$${subscription.price}/${subscription.cycle === 'yearly' ? 'yr' : 'mo'}`;

    const prompts = {
      cancel: {
        system: `You are an expert consumer advocate who has helped thousands of people cancel subscriptions. Generate a clear, step-by-step cancellation script for the service. Include:
1. The exact steps to cancel (online method preferred)
2. What to say if they offer a retention deal
3. A firm but polite phone/chat script if needed
4. Common tricks companies use to prevent cancellation and how to counter them
5. Whether to expect a confirmation email and what to do if you don't get one
Keep it actionable and under 300 words. Format with clear numbered steps.`,
        user: `I want to cancel my ${subscription.name} subscription (${priceStr}). Give me the exact script and steps.`,
      },
      negotiate: {
        system: `You are a negotiation expert specializing in subscription price reduction. Generate a persuasive script the user can use to negotiate a lower price. Include:
1. The best opening line (mention competitor pricing if relevant)
2. Key leverage points (loyalty duration, market alternatives, threatening to cancel)
3. Specific discount percentages to ask for (typically 20-50% off)
4. What to say if they say no the first time
5. The "walk away" line that usually triggers the retention offer
Keep it conversational and under 250 words. Include exact phrases they can use.`,
        user: `I'm paying ${priceStr} for ${subscription.name}. Write me a negotiation script to get a lower price. I want to keep the service but pay less.`,
      },
      downgrade: {
        system: `You are a subscription optimization expert. Help the user identify whether they can downgrade to a cheaper plan. Include:
1. Known plan tiers for this service and their prices
2. Features most people don't actually use in premium plans
3. The specific downgrade steps
4. Whether there's a "secret" retention plan not listed on the website
5. If a free tier exists that might be sufficient
Keep it factual and under 200 words.`,
        user: `I'm on ${subscription.name} at ${priceStr}. What are my downgrade options? What features am I probably paying for but not using?`,
      },
    };

    const p = prompts[type];

    try {
      const data = await callAi({
        contents: [{ parts: [{ text: p.user }] }],
        systemInstruction: { parts: [{ text: p.system }] },
      });
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No script generated.';
      setScript(text);
      track('cancel_script_generated', { type, service: subscription.name });
    } catch (err) {
      setScript(err.name === 'RateLimitError'
        ? 'Daily limit reached. Upgrade to Pro for unlimited access.'
        : 'AI is temporarily unavailable. Try again shortly.');
    }
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    track('cancel_script_copied', { type: scriptType });
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => setCopied(false), 2000);
  };

  const types = SCRIPT_TYPES[lang] || SCRIPT_TYPES.en;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm backdrop-enter"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full sm:max-w-lg bg-[#0D0D15] rounded-t-3xl sm:rounded-3xl border border-slate-800/50 shadow-2xl shadow-black/60 overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col modal-enter">
        {/* Header */}
        {/* Drag indicator for mobile sheet */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        <div className="px-6 pt-4 sm:pt-6 pb-4 border-b border-slate-800/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-100">
              {subscription.name}
            </h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/40 text-slate-500 hover:text-slate-200 hover:bg-slate-700/50 transition-colors cursor-pointer text-sm">✕</button>
          </div>
          <p className="text-xs text-slate-500">
            ${subscription.price}/{subscription.cycle === 'yearly' ? 'yr' : 'mo'} · {lang === 'zh' ? '选择操作' : 'Choose an action below'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Direct cancel link */}
          {cancelUrl && (
            <a href={cancelUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => track('direct_cancel_clicked', { service: subscription.name })}
              className="flex items-center gap-3 p-4 bg-rose-950/40 rounded-2xl border border-rose-800/30 hover:border-rose-700/50 hover:bg-rose-950/50 transition-all no-underline group">
              <div className="w-10 h-10 rounded-xl bg-rose-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-200 group-hover:text-rose-100">{lang === 'zh' ? '直接跳转取消页面' : 'Go to cancel page directly'}</p>
                <p className="text-[11px] text-rose-400/60 mt-0.5">{lang === 'zh' ? `打开 ${subscription.name} 的取消页面` : `Opens ${subscription.name}'s cancellation page`}</p>
              </div>
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3 text-rose-700 group-hover:text-rose-400 transition-colors shrink-0" />
            </a>
          )}

          {/* Action buttons */}
          {!script && !isLoading && (
            <div className="space-y-2.5">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">{lang === 'zh' ? 'AI 智能操作' : 'AI-powered actions'}</p>
              {types.map(type => (
                <button key={type.id} onClick={() => generateScript(type.id)}
                  className="w-full flex items-center gap-3 p-4 bg-[#141420]/80 rounded-2xl border border-slate-800/40 hover:border-violet-700/40 hover:bg-[#1C1C2A] transition-all cursor-pointer text-left group active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-xl bg-violet-950/40 border border-violet-800/30 flex items-center justify-center shrink-0 group-hover:bg-violet-900/40 group-hover:scale-105 transition-all">
                    <FontAwesomeIcon icon={type.icon} className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200">{type.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{type.desc}</p>
                  </div>
                  {!pro && <FontAwesomeIcon icon={faLock} className="w-3 h-3 text-slate-700" />}
                </button>
              ))}
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="relative">
                <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 text-violet-400 animate-spin" />
                <div className="absolute inset-0 animate-ping opacity-20">
                  <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 text-violet-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400">
                {scriptType === 'cancel' && (lang === 'zh' ? '正在编写取消攻略...' : 'Writing your cancellation playbook...')}
                {scriptType === 'negotiate' && (lang === 'zh' ? '正在生成谈判话术...' : 'Crafting your negotiation script...')}
                {scriptType === 'downgrade' && (lang === 'zh' ? '正在分析降级方案...' : 'Researching plan options...')}
              </p>
            </div>
          )}

          {/* Script result */}
          {script && !isLoading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-violet-400 font-medium">
                  {scriptType === 'cancel' && '🎯 Cancellation playbook'}
                  {scriptType === 'negotiate' && '💰 Negotiation script'}
                  {scriptType === 'downgrade' && '📉 Downgrade options'}
                </span>
                <button onClick={copyToClipboard}
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-800/40">
                  <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="w-3 h-3" />
                  {copied ? (lang === 'zh' ? '已复制' : 'Copied!') : (lang === 'zh' ? '复制' : 'Copy')}
                </button>
              </div>
              <div className="bg-[#141420] rounded-2xl border border-slate-800/40 p-5">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{script}</p>
              </div>
              <button onClick={() => { setScript(''); setScriptType(null); }}
                className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer transition-colors inline-flex items-center gap-1">
                ← {lang === 'zh' ? '尝试其他操作' : 'Try a different action'}
              </button>
            </div>
          )}

          {/* Pro upsell */}
          {!pro && (
            <div className="bg-amber-950/20 border border-amber-800/20 rounded-2xl p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faCrown} className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-amber-200">{lang === 'zh' ? 'Pro 解锁 AI 话术' : 'Pro unlocks AI scripts'}</span>
              </div>
              <p className="text-[11px] text-amber-300/60 leading-relaxed">
                {lang === 'zh'
                  ? '获取个性化的取消话术、谈判策略和降级建议。一次话术节省的钱就超过 Pro 的价格。'
                  : 'Get personalized cancellation scripts, negotiation tactics, and downgrade advice. One script saves more than the price of Pro.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
