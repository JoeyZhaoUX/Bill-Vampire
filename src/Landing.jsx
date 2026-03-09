import React from 'react';
import { Ghost, Sparkles, Shield, Zap, Heart, ChevronRight, Star } from 'lucide-react';

export default function Landing({ onEnterApp, lang }) {
  const isZh = lang === 'zh';

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-start">
      {/* Hero */}
      <div className="w-full max-w-2xl px-6 pt-16 pb-12 text-center relative">
        <div className="absolute top-8 left-10 w-56 h-56 bg-rose-200/30 rounded-full blur-3xl -z-10" />
        <div className="absolute top-32 right-0 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl -z-10" />

        <img src="/icons/icon.svg" alt="Bill Vampire" className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg" />
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight leading-tight mb-4">
          {isZh ? (
            <>你的订阅，正在<span className="text-rose-500">吸你的血</span></>
          ) : (
            <>Your subscriptions are <span className="text-rose-500">sucking you dry</span></>
          )}
        </h1>
        <p className="text-base text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          {isZh
            ? 'Bill Vampire 帮你追踪每一笔隐形订阅。AI 帮你找平替、毒舌你的消费习惯。最重要的是——我们不收订阅费。'
            : 'Bill Vampire tracks every subscription draining your wallet. AI finds cheaper alternatives and roasts your spending. And yes — we\'ll never charge you a subscription.'}
        </p>

        <button onClick={onEnterApp}
          className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800 text-white text-sm font-medium rounded-2xl hover:bg-slate-700 transition-all shadow-xl shadow-slate-200 group">
          {isZh ? '开始使用' : 'Start Slaying'} <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
        <p className="text-[11px] text-slate-400 mt-3">
          {isZh ? '免费使用 · 无需注册 · 数据存在你本地' : 'Free · No signup · Your data stays on your device'}
        </p>
      </div>

      {/* Anti-subscription badge */}
      <div className="mb-12 px-6">
        <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 px-5 py-2.5 rounded-full">
          <Shield size={14} className="text-rose-500" />
          <span className="text-xs font-medium text-rose-600">
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
              icon: Ghost,
              title: isZh ? '追踪隐形订阅' : 'Track Hidden Subscriptions',
              desc: isZh ? '多币种支持，一眼看清每月被吸了多少血' : 'Multi-currency support. See exactly how much is being drained monthly.',
            },
            {
              icon: Sparkles,
              title: isZh ? 'AI 毒舌顾问' : 'AI Roast Advisor',
              desc: isZh ? 'AI 分析你的消费，帮你找平替，还会嘲讽你' : 'AI analyzes your spending, finds alternatives, and roasts you for fun.',
            },
            {
              icon: Star,
              title: isZh ? '不消费打卡' : 'No-Spend Streak',
              desc: isZh ? '每日打卡养成省钱习惯，AI 给你情绪支持' : 'Daily check-ins build saving habits. AI cheers (or mocks) your progress.',
            },
            {
              icon: Zap,
              title: isZh ? '分享你的吸血鬼报告' : 'Share Your Vampire Report',
              desc: isZh ? '生成好看的消费报告分享到社交媒体，让朋友也来查查' : 'Generate a shareable spending card. Let your friends find their vampires too.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-100/60 flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon size={18} className="text-rose-400" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-1">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="w-full max-w-lg px-6 mb-16">
        <h2 className="text-center text-lg font-bold text-slate-800 mb-6">
          {isZh ? '定价' : 'Pricing'}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/60 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">{isZh ? '免费版' : 'Free'}</p>
            <p className="text-2xl font-bold text-slate-800 mb-4">$0</p>
            <ul className="text-xs text-slate-500 space-y-2 text-left">
              <li>{isZh ? '✓ 无限订阅追踪' : '✓ Unlimited subscription tracking'}</li>
              <li>{isZh ? '✓ 不消费打卡日历' : '✓ No-spend calendar'}</li>
              <li>{isZh ? '✓ 统计图表' : '✓ Statistics & charts'}</li>
              <li>{isZh ? '✓ AI 每天 3 次' : '✓ 3 AI analyses per day'}</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl p-6 border border-amber-100/60 text-center relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-amber-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              {isZh ? '一次性' : 'ONE TIME'}
            </div>
            <p className="text-xs text-amber-600 uppercase tracking-widest mb-2">Pro</p>
            <p className="text-2xl font-bold text-slate-800 mb-1">$4.99</p>
            <p className="text-[10px] text-slate-400 mb-4">{isZh ? '买断，永不订阅' : 'Once. Forever. No subscription.'}</p>
            <ul className="text-xs text-slate-600 space-y-2 text-left">
              <li>{isZh ? '✓ 一切免费版功能' : '✓ Everything in Free'}</li>
              <li>{isZh ? '✓ AI 无限使用' : '✓ Unlimited AI analyses'}</li>
              <li>{isZh ? '✓ 云端同步（即将推出）' : '✓ Cloud sync (coming soon)'}</li>
              <li>{isZh ? '✓ 续费提醒（即将推出）' : '✓ Renewal reminders (soon)'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="w-full max-w-lg px-6 mb-16 text-center">
        <button onClick={onEnterApp}
          className="inline-flex items-center gap-2 px-8 py-4 bg-rose-500 text-white text-sm font-medium rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-200 group">
          {isZh ? '立即开始，免费' : 'Get Started — It\'s Free'}
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-slate-100">
        <p className="text-[10px] text-slate-400">
          Bill Vampire — {isZh ? '让每一分钱都被看见' : 'Make every dollar visible'}
        </p>
      </footer>
    </div>
  );
}
