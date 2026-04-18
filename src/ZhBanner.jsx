import React, { useEffect, useState } from 'react';

const DISMISS_KEY = 'vampire_zh_banner_dismissed';

function isZhBrowser() {
  if (typeof navigator === 'undefined') return false;
  const langs = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
  return langs.some((l) => String(l).toLowerCase().startsWith('zh'));
}

// Top banner shown only to zh-* browsers on the English-only marketing +
// onboarding screens. Main app (src/App.jsx) already auto-switches to 中文
// via i18n.js — the banner tells zh visitors the landing is English-only and
// points them at the app, which IS translated.
export default function ZhBanner({ onEnterApp }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;
    if (!isZhBrowser()) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setVisible(false);
  };

  return (
    <div className="relative z-50 bg-gradient-to-r from-rose-950/80 via-[#141420] to-violet-950/70 border-b border-rose-800/30 text-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 text-[12px] leading-snug">
        <span className="shrink-0 text-[10px] font-bold text-rose-300 uppercase tracking-widest">中文用户</span>
        <span className="flex-1 text-slate-300">
          着陆页和支付流程目前只有英文。主应用内有中文版 —— 进入应用后会自动切换。
        </span>
        {onEnterApp && (
          <button
            type="button"
            onClick={onEnterApp}
            className="shrink-0 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold cursor-pointer transition-colors"
          >
            进入应用
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="关闭提示"
          className="shrink-0 text-slate-500 hover:text-slate-300 text-sm px-1 cursor-pointer"
        >
          ×
        </button>
      </div>
    </div>
  );
}
