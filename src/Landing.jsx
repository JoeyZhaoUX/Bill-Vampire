import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGhost, faWandMagicSparkles, faShieldHalved, faBolt, faChevronRight, faStar, faCrown } from '@fortawesome/free-solid-svg-icons';
import { openCheckout } from './pro';

export default function Landing({ onEnterApp, onLegal, lang }) {
  const isZh = lang === 'zh';

  return (
    <div className="min-h-screen bg-[#0B0B11] flex flex-col items-center justify-start">
      {/* Hero */}
      <div className="w-full max-w-2xl px-6 pt-16 pb-12 text-center relative">
        <div className="absolute top-8 left-10 w-56 h-56 bg-rose-900/20 rounded-full blur-3xl -z-10" />
        <div className="absolute top-32 right-0 w-72 h-72 bg-violet-900/15 rounded-full blur-3xl -z-10" />

        <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="Bill Vampire" className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg shadow-rose-900/20" />
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight leading-tight mb-4">
          {isZh ? (
            <>你的订阅，正在<span className="text-rose-500">吸你的血</span></>
          ) : (
            <>Your subscriptions are <span className="text-rose-500">sucking you dry</span></>
          )}
        </h1>
        <p className="text-base text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          {isZh
            ? 'Bill Vampire 帮你追踪每一笔隐形订阅。AI 帮你找平替、毒舌你的消费习惯。最重要的是——我们不收订阅费。'
            : 'Bill Vampire tracks every subscription draining your wallet. AI finds cheaper alternatives and roasts your spending. And yes — we\'ll never charge you a subscription.'}
        </p>

        <button onClick={onEnterApp}
          className="inline-flex items-center gap-2 px-8 py-4 bg-rose-600 text-white text-sm font-medium rounded-2xl hover:bg-rose-500 transition-all shadow-xl shadow-rose-900/30 group cursor-pointer">
          {isZh ? '开始使用' : 'Start Slaying'} <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <p className="text-[11px] text-slate-500 mt-3">
          {isZh ? '免费使用 · 无需注册 · 数据存在你本地' : 'Free · No signup · Your data stays on your device'}
        </p>
      </div>

      {/* Anti-subscription badge */}
      <div className="mb-12 px-6">
        <div className="inline-flex items-center gap-2 bg-rose-950/40 border border-rose-800/30 px-5 py-2.5 rounded-full">
          <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-xs font-medium text-rose-300">
            {isZh
              ? '唯一一个不收订阅费的订阅管理工具'
              : 'The only subscription tracker that doesn\'t charge a subscription'}
          </span>
        </div>
      </div>

      {/* Features */}
      <div className="w-full max-w-lg px-6 mb-16">
        <div className="grid gap-4">
          {[
            {
              icon: faGhost,
              title: isZh ? '追踪隐形订阅' : 'Track Hidden Subscriptions',
              desc: isZh ? '多币种支持，一眼看清每月被吸了多少血' : 'Multi-currency support. See exactly how much is being drained monthly.',
            },
            {
              icon: faWandMagicSparkles,
              title: isZh ? 'AI 毒舌顾问' : 'AI Roast Advisor',
              desc: isZh ? 'AI 分析你的消费，帮你找平替，还会嘲讽你' : 'AI analyzes your spending, finds alternatives, and roasts you for fun.',
            },
            {
              icon: faStar,
              title: isZh ? '不消费打卡' : 'No-Spend Streak',
              desc: isZh ? '每日打卡养成省钱习惯，AI 给你情绪支持' : 'Daily check-ins build saving habits. AI cheers (or mocks) your progress.',
            },
            {
              icon: faBolt,
              title: isZh ? '分享你的吸血鬼报告' : 'Share Your Vampire Report',
              desc: isZh ? '生成好看的消费报告分享到社交媒体，让朋友也来查查' : 'Generate a shareable spending card. Let your friends find their vampires too.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-[#141420]/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-800/60 flex items-start gap-4 hover:border-rose-800/30 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-[#1C1C2A] rounded-xl flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={icon} className="w-[18px] h-[18px] text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-200 mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="w-full max-w-lg px-6 mb-16">
        <h2 className="text-center text-lg font-bold text-slate-100 mb-6 font-serif">
          {isZh ? '定价' : 'Pricing'}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[#141420]/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/60 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">{isZh ? '免费版' : 'Free'}</p>
            <p className="text-2xl font-bold text-slate-100 mb-4">$0</p>
            <ul className="text-xs text-slate-400 space-y-2 text-left">
              <li>{isZh ? '\u2713 无限订阅追踪' : '\u2713 Unlimited subscription tracking'}</li>
              <li>{isZh ? '\u2713 不消费打卡日历' : '\u2713 No-spend calendar'}</li>
              <li>{isZh ? '\u2713 统计图表' : '\u2713 Statistics & charts'}</li>
              <li>{isZh ? '\u2713 AI 每天 3 次' : '\u2713 3 AI analyses per day'}</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-amber-950/40 to-rose-950/40 rounded-2xl p-6 border border-amber-700/30 text-center relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              {isZh ? '一次性' : 'ONE TIME'}
            </div>
            <p className="text-xs text-amber-400 uppercase tracking-widest mb-2">Pro</p>
            <p className="text-2xl font-bold text-slate-100 mb-1">$6.99</p>
            <p className="text-[10px] text-slate-500 mb-4">{isZh ? '买断，永不订阅' : 'Once. Forever. No subscription.'}</p>
            <ul className="text-xs text-slate-300 space-y-2 text-left mb-4">
              <li>{isZh ? '\u2713 一切免费版功能' : '\u2713 Everything in Free'}</li>
              <li>{isZh ? '\u2713 AI 无限使用' : '\u2713 Unlimited AI analyses'}</li>
              <li>{isZh ? '\u2713 云端同步（即将推出）' : '\u2713 Cloud sync (coming soon)'}</li>
              <li>{isZh ? '\u2713 续费提醒（即将推出）' : '\u2713 Renewal reminders (soon)'}</li>
            </ul>
            <button onClick={openCheckout}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold rounded-xl hover:from-amber-400 hover:to-rose-400 transition-colors shadow-lg shadow-rose-900/30 cursor-pointer flex items-center justify-center gap-1.5">
              <FontAwesomeIcon icon={faCrown} className="w-3 h-3" />
              {isZh ? '立即购买' : 'Get Pro'}
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="w-full max-w-lg px-6 mb-16 text-center">
        <button onClick={onEnterApp}
          className="inline-flex items-center gap-2 px-8 py-4 bg-rose-600 text-white text-sm font-medium rounded-2xl hover:bg-rose-500 transition-all shadow-xl shadow-rose-900/30 group cursor-pointer">
          {isZh ? '立即开始，免费' : 'Get Started — It\'s Free'}
          <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-600 text-center mb-3">
          Bill Vampire — {isZh ? '让每一分钱都被看见' : 'Make every dollar visible'}
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={() => onLegal('terms')} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer">
            {isZh ? '服务条款' : 'Terms of Service'}
          </button>
          <button onClick={() => onLegal('privacy')} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer">
            {isZh ? '隐私政策' : 'Privacy Policy'}
          </button>
          <button onClick={() => onLegal('refund')} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer">
            {isZh ? '退款政策' : 'Refund Policy'}
          </button>
        </div>
      </footer>
    </div>
  );
}
