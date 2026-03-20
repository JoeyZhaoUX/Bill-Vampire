import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight, faCrown, faChevronDown,
  faShieldHalved, faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { openCheckout } from './pro';

const ICONS8 = 'https://img.icons8.com/3d-fluency/94';

export default function Landing({ onEnterApp, onLegal, lang }) {
  const isZh = lang === 'zh';
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    {
      icon: `${ICONS8}/ghost.png`,
      title: isZh ? '追踪隐形订阅' : 'Track Hidden Subscriptions',
      desc: isZh ? '多币种支持（USD/CNY/EUR/GBP/JPY/HKD），一眼看清每月被吸了多少血。可视化图表展示消费分布。' : 'Multi-currency support (USD/CNY/EUR/GBP/JPY/HKD). See exactly how much is being drained monthly with visual charts.',
    },
    {
      icon: `${ICONS8}/robot-2.png`,
      title: isZh ? 'AI 毒舌顾问' : 'AI Roast Advisor',
      desc: isZh ? 'AI 分析你的消费习惯，一针见血地指出问题，帮你找到更便宜的平替方案。' : 'AI analyzes your spending habits, gives brutally honest advice, and finds cheaper alternatives.',
    },
    {
      icon: `${ICONS8}/document-scanner.png`,
      title: isZh ? '智能导入账单' : 'Smart Import',
      desc: isZh ? '粘贴扣款通知文本，或上传截图/PDF，AI 自动识别并提取订阅信息，一键添加。' : 'Paste billing text or upload screenshots/PDFs. AI extracts subscription info and adds them automatically.',
      isNew: true,
    },
    {
      icon: `${ICONS8}/calendar--v2.png`,
      title: isZh ? '不消费打卡' : 'No-Spend Streak',
      desc: isZh ? '每日打卡养成省钱习惯，AI 傲娇地给你情绪支持，让你不知不觉存更多钱。' : 'Daily check-ins build saving habits. Your AI companion cheers or mocks your progress.',
    },
    {
      icon: `${ICONS8}/share--v2.png`,
      title: isZh ? '分享吸血鬼报告' : 'Share Vampire Report',
      desc: isZh ? '生成精美的消费分析卡片，分享到社交媒体，让朋友也来查查自己的吸血鬼。' : 'Generate a beautiful spending card. Share it on social media and let friends find their vampires.',
    },
    {
      icon: `${ICONS8}/shield-done.png`,
      title: isZh ? '隐私优先' : 'Privacy First',
      desc: isZh ? '数据存在你的设备上，不上传任何服务器。没有账号、没有追踪、没有广告。' : 'Your data stays on your device. No accounts, no tracking, no ads. Your finances, your business.',
    },
  ];

  const steps = [
    {
      num: '01',
      icon: `${ICONS8}/add.png`,
      title: isZh ? '添加你的订阅' : 'Add Your Subscriptions',
      desc: isZh ? '手动添加或使用智能导入，拍照/截图即可自动识别' : 'Add manually or use Smart Import — snap a photo or paste text and AI does the rest',
    },
    {
      num: '02',
      icon: `${ICONS8}/bot.png`,
      title: isZh ? 'AI 分析你的消费' : 'AI Analyzes Your Spending',
      desc: isZh ? 'AI 毒舌你的消费习惯，找到更便宜的替代方案' : 'AI roasts your habits and finds cheaper alternatives you didn\'t know existed',
    },
    {
      num: '03',
      icon: `${ICONS8}/money-bag.png`,
      title: isZh ? '省钱，就这么简单' : 'Save Money. That Simple.',
      desc: isZh ? '追踪你的节省成果，养成每日省钱打卡的习惯' : 'Track your savings, build daily no-spend streaks, and watch your money grow',
    },
  ];

  const faqs = [
    {
      q: isZh ? 'Bill Vampire 真的免费吗？' : 'Is Bill Vampire really free?',
      a: isZh ? '是的！核心功能完全免费，包括无限订阅追踪、不消费打卡、统计图表。免费版每天可用 3 次 AI 分析。Pro 版解锁无限 AI，只需一次性支付 $6.99，永远不收订阅费。' : 'Yes! Core features are completely free — unlimited subscription tracking, no-spend calendar, stats & charts. Free tier includes 3 AI analyses per day. Pro unlocks unlimited AI for a one-time $6.99 payment. No subscription, ever.',
    },
    {
      q: isZh ? '我的数据安全吗？' : 'Is my data safe?',
      a: isZh ? '绝对安全。你的所有数据存储在浏览器本地（localStorage），不会上传到任何服务器。我们不收集任何个人信息，没有账号系统，没有追踪。' : 'Absolutely. All your data is stored locally in your browser (localStorage). Nothing is uploaded to any server. We don\'t collect personal information, have no account system, and no tracking.',
    },
    {
      q: isZh ? '智能导入支持什么格式？' : 'What formats does Smart Import support?',
      a: isZh ? '支持粘贴文本（邮件、短信、扣款通知）、上传图片（JPG/PNG 截图）和 PDF 文件。AI 会自动提取订阅名称、金额、货币和付费周期。' : 'You can paste text (emails, SMS, billing notifications), upload images (JPG/PNG screenshots), or PDF files. AI automatically extracts subscription name, amount, currency, and billing cycle.',
    },
    {
      q: isZh ? 'AI 分析用的什么技术？' : 'What AI powers the analysis?',
      a: isZh ? '我们使用 Google Gemini 2.5 Flash 模型。所有 API 调用通过我们的安全后端代理，你的 AI 对话数据不会被存储。' : 'We use Google Gemini 2.5 Flash. All API calls go through our secure backend proxy. Your AI conversation data is never stored.',
    },
    {
      q: isZh ? '支持哪些货币？' : 'What currencies are supported?',
      a: isZh ? '目前支持 USD、CNY、EUR、GBP、JPY、HKD 六种货币，自动换算为美元显示总额。' : 'Currently supports USD, CNY, EUR, GBP, JPY, and HKD. Totals are automatically converted to USD for easy comparison.',
    },
  ];

  const stats = [
    { value: '6', label: isZh ? '支持货币' : 'Currencies' },
    { value: '$0', label: isZh ? '永久免费' : 'Forever Free' },
    { value: '100%', label: isZh ? '本地存储' : 'Local Storage' },
    { value: '0', label: isZh ? '订阅费' : 'Subscription Fee' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B11] overflow-x-hidden">

      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 bg-[#0B0B11]/80 backdrop-blur-xl border-b border-slate-800/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="Bill Vampire" className="w-8 h-8 rounded-lg" />
            <span className="font-gothic text-lg font-bold text-slate-100 hidden sm:block">Bill Vampire</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => openCheckout()}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors cursor-pointer">
              <FontAwesomeIcon icon={faCrown} className="w-3 h-3" /> {isZh ? '升级 Pro' : 'Get Pro'}
            </button>
            <button onClick={onEnterApp}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 text-white text-xs font-medium rounded-xl hover:bg-rose-500 transition-colors cursor-pointer">
              {isZh ? '打开应用' : 'Open App'} <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative pt-20 pb-24 lg:pt-28 lg:pb-32">
        {/* Decorative blurs */}
        <div className="absolute top-12 left-[10%] w-72 h-72 bg-rose-900/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute top-40 right-[5%] w-96 h-96 bg-violet-900/15 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-rose-800/30 to-transparent" />

        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-rose-950/40 border border-rose-800/30 px-4 py-1.5 rounded-full mb-8 landing-fade-in">
              <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3 text-rose-400" />
              <span className="text-[11px] font-medium text-rose-300">
                {isZh ? '唯一不收订阅费的订阅管理工具' : 'The only subscription tracker that won\'t charge you a subscription'}
              </span>
            </div>

            <h1 className="font-gothic text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-100 tracking-tight leading-[1.15] mb-6 landing-fade-in landing-delay-1">
              {isZh ? (
                <>你的订阅，<br className="sm:hidden" />正在<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600">吸你的血</span></>
              ) : (
                <>Your subscriptions<br className="sm:hidden" /> are <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600">sucking you dry</span></>
              )}
            </h1>

            <p className="text-lg lg:text-xl text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed landing-fade-in landing-delay-2">
              {isZh
                ? 'Bill Vampire 帮你追踪每一笔隐形订阅，AI 帮你找平替、毒舌你的消费习惯。最重要的是——我们永远不收订阅费。'
                : 'Bill Vampire tracks every subscription draining your wallet. AI finds cheaper alternatives and roasts your spending. And yes — we\'ll never charge you a subscription.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 landing-fade-in landing-delay-3">
              <button onClick={onEnterApp}
                className="inline-flex items-center gap-2 px-10 py-4 bg-rose-600 text-white text-sm font-semibold rounded-2xl hover:bg-rose-500 transition-all shadow-xl shadow-rose-900/30 group cursor-pointer">
                {isZh ? '免费开始使用' : 'Start Slaying — It\'s Free'}
                <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <span className="text-[11px] text-slate-600 sm:ml-2">
                {isZh ? '无需注册 · 数据存在你本地' : 'No signup required · Data stays on your device'}
              </span>
            </div>
          </div>

          {/* App Preview */}
          <div className="mt-16 max-w-4xl mx-auto landing-fade-in landing-delay-4">
            <div className="relative bg-gradient-to-b from-[#141420] to-[#0D0D15] rounded-2xl border border-slate-800/40 p-1 shadow-2xl shadow-black/50">
              <div className="bg-[#0D0D15] rounded-xl overflow-hidden">
                {/* Mock toolbar */}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-[#141420] border-b border-slate-800/30">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  <span className="ml-3 text-[10px] text-slate-600 font-mono">billvampire.com</span>
                </div>
                {/* Mock content */}
                <div className="p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
                  {/* Mock sidebar */}
                  <div className="lg:w-48 shrink-0 space-y-4">
                    <div className="flex items-center gap-2">
                      <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" className="w-8 h-8 rounded-lg" />
                      <span className="font-gothic text-sm text-slate-200">Bill Vampire</span>
                    </div>
                    <div className="bg-rose-950/40 rounded-xl p-3 border border-rose-800/20">
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{isZh ? '每月流失' : 'Monthly Drain'}</p>
                      <p className="text-rose-400 font-bold text-xl">$47.96</p>
                    </div>
                    <div className="bg-emerald-950/30 rounded-xl p-3 border border-emerald-800/20">
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{isZh ? '已省下' : 'You Saved'}</p>
                      <p className="text-emerald-400 font-bold text-xl">$12.99</p>
                    </div>
                  </div>
                  {/* Mock list */}
                  <div className="flex-1 space-y-2">
                    {[
                      { name: 'Netflix', price: '$15.49', cat: 'Entertainment', icon: '🎬' },
                      { name: 'Spotify', price: '$10.99', cat: 'Entertainment', icon: '🎵' },
                      { name: 'ChatGPT Plus', price: '$20.00', cat: 'Productivity', icon: '🤖' },
                      { name: 'iCloud+', price: '$0.99', cat: 'Lifestyle', icon: '☁️' },
                    ].map(s => (
                      <div key={s.name} className="flex justify-between items-center p-3 rounded-xl bg-[#141420]/60 border border-slate-800/20">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#1C1C2A] rounded-lg flex items-center justify-center text-sm">{s.icon}</div>
                          <div>
                            <p className="text-xs font-medium text-slate-200">{s.name}</p>
                            <p className="text-[9px] text-slate-600">{s.cat}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-300">{s.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="py-12 border-y border-slate-800/30 bg-[#0D0D15]/50">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl lg:text-3xl font-bold text-slate-100 mb-1">{s.value}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-rose-400 uppercase tracking-widest mb-3">{isZh ? '功能特性' : 'Features'}</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-4">
              {isZh ? '你需要的一切，都在这里' : 'Everything you need to fight back'}
            </h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              {isZh ? '从追踪订阅到AI分析，从智能导入到省钱打卡，Bill Vampire 让你的每一分钱都被看见。' : 'From tracking subscriptions to AI analysis, smart import to savings streaks. Bill Vampire makes every dollar visible.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="group relative bg-[#141420]/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/40 hover:border-rose-800/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-950/10">
                {f.isNew && (
                  <span className="absolute top-4 right-4 text-[9px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/30 px-2 py-0.5 rounded-full">NEW</span>
                )}
                <img src={f.icon} alt="" className="w-12 h-12 mb-4" loading="lazy" />
                <h3 className="text-sm font-semibold text-slate-200 mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-[#0B0B11] via-[#0F0F18] to-[#0B0B11]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-3">{isZh ? '如何使用' : 'How it works'}</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-4">
              {isZh ? '三步开始省钱' : 'Start saving in 3 steps'}
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative text-center lg:text-left">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(100%_-_16px)] w-[calc(100%_-_56px)] h-px bg-gradient-to-r from-slate-800 to-transparent z-0" />
                )}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-[#141420] rounded-2xl border border-slate-800/40 mb-5 mx-auto lg:mx-0 relative z-10">
                  <img src={step.icon} alt="" className="w-10 h-10" loading="lazy" />
                </div>
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2">{isZh ? `步骤 ${step.num}` : `Step ${step.num}`}</p>
                <h3 className="text-base font-semibold text-slate-200 mb-2">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto lg:mx-0">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SMART IMPORT HIGHLIGHT ===== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/30 px-3 py-1 rounded-full mb-5">
                {isZh ? '新功能' : 'NEW FEATURE'}
              </span>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-4 leading-tight">
                {isZh ? (
                  <>拍个照，<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-rose-400">AI 帮你录入</span></>
                ) : (
                  <>Snap a photo,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-rose-400">AI does the rest</span></>
                )}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                {isZh
                  ? '不再需要手动输入每一笔订阅。收到扣款邮件？截图扣款通知？直接粘贴或上传，AI 自动提取订阅名称、金额、周期，一键添加。支持图片、PDF 和文本。'
                  : 'Stop typing in every subscription manually. Got a billing email? A charge notification screenshot? Just paste or upload it — AI extracts the name, amount, and cycle automatically. Supports images, PDFs, and text.'}
              </p>
              <div className="space-y-3">
                {[
                  isZh ? '支持 JPG, PNG, PDF 和纯文本' : 'Supports JPG, PNG, PDF, and plain text',
                  isZh ? '自动识别金额、货币和付费周期' : 'Auto-detects amount, currency, and billing cycle',
                  isZh ? '一次导入多个订阅' : 'Import multiple subscriptions at once',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <div className="w-5 h-5 bg-emerald-950/50 rounded-md flex items-center justify-center shrink-0 border border-emerald-800/30">
                      <span className="text-emerald-400 text-[10px]">&#10003;</span>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Mock Smart Import UI */}
            <div className="bg-[#141420]/80 rounded-2xl border border-slate-800/40 p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <img src={`${ICONS8}/document-scanner.png`} alt="" className="w-6 h-6" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{isZh ? '智能导入' : 'Smart Import'}</span>
              </div>
              <div className="bg-[#1C1C2A] rounded-xl p-4 mb-4 border border-slate-700/30">
                <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                  {isZh
                    ? 'Apple 已向您收取以下费用：\niCloud+ 50GB - ¥6.00/月\nApple Music - ¥11.00/月\nApple TV+ - ¥6.00/月'
                    : 'Your payment summary:\nNetflix Standard - $15.49/mo\nSpotify Premium - $10.99/mo\nNotion Plus - $10.00/mo'}
                </p>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-px bg-slate-800/50" />
                <span className="text-[9px] text-slate-600 uppercase tracking-wider">{isZh ? 'AI 提取结果' : 'AI Extracted'}</span>
                <div className="flex-1 h-px bg-slate-800/50" />
              </div>
              <div className="space-y-2">
                {(isZh ? [
                  { name: 'iCloud+ 50GB', price: '¥6.00', cycle: '月付' },
                  { name: 'Apple Music', price: '¥11.00', cycle: '月付' },
                  { name: 'Apple TV+', price: '¥6.00', cycle: '月付' },
                ] : [
                  { name: 'Netflix Standard', price: '$15.49', cycle: 'Monthly' },
                  { name: 'Spotify Premium', price: '$10.99', cycle: 'Monthly' },
                  { name: 'Notion Plus', price: '$10.00', cycle: 'Monthly' },
                ]).map(b => (
                  <div key={b.name} className="flex justify-between items-center p-2.5 bg-emerald-950/20 rounded-lg border border-emerald-800/20">
                    <div>
                      <p className="text-xs font-medium text-slate-200">{b.name}</p>
                      <p className="text-[9px] text-slate-500">{b.cycle}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">{b.price}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2.5 bg-emerald-600/20 text-emerald-400 text-xs font-medium rounded-xl border border-emerald-800/30 cursor-default">
                {isZh ? '+ 全部添加 (3)' : '+ Add All (3)'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-[#0B0B11] via-[#0F0F18] to-[#0B0B11]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-amber-400 uppercase tracking-widest mb-3">{isZh ? '定价' : 'Pricing'}</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-4">
              {isZh ? '简单透明，没有套路' : 'Simple, transparent pricing'}
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {isZh ? '一个追踪订阅的工具，本身绝不收订阅费。' : 'A subscription tracker that will never charge you a subscription.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-[#141420]/80 backdrop-blur-sm rounded-2xl p-7 border border-slate-800/50 flex flex-col">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{isZh ? '免费版' : 'Free'}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-slate-100">$0</span>
              </div>
              <p className="text-[11px] text-slate-600 mb-6">{isZh ? '永远免费，无需信用卡' : 'Free forever, no credit card'}</p>
              <ul className="text-xs text-slate-400 space-y-3 mb-8 flex-1">
                {(isZh ? [
                  '无限订阅追踪',
                  '多币种支持（6种）',
                  '不消费打卡日历',
                  '消费统计图表',
                  'AI 分析每天 3 次',
                  '分享吸血鬼报告',
                ] : [
                  'Unlimited subscription tracking',
                  'Multi-currency support (6)',
                  'No-spend calendar',
                  'Statistics & charts',
                  '3 AI analyses per day',
                  'Share vampire reports',
                ]).map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-emerald-400 mt-0.5 shrink-0">&#10003;</span> {item}
                  </li>
                ))}
              </ul>
              <button onClick={onEnterApp}
                className="w-full py-3 text-xs font-medium text-slate-300 bg-[#1C1C2A] rounded-xl hover:bg-[#252536] transition-colors cursor-pointer border border-slate-700/30">
                {isZh ? '免费开始' : 'Get Started Free'}
              </button>
            </div>

            {/* Pro */}
            <div className="relative bg-gradient-to-br from-amber-950/30 to-rose-950/30 rounded-2xl p-7 border border-amber-700/30 flex flex-col shadow-lg shadow-amber-950/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-bold px-4 py-1 rounded-full shadow-lg">
                {isZh ? '一次性买断' : 'ONE-TIME PAYMENT'}
              </div>
              <p className="text-xs text-amber-400 uppercase tracking-widest mb-1 mt-2">Pro</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-slate-100">$6.99</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-6">{isZh ? '一次购买，永久使用' : 'Pay once, use forever'}</p>
              <ul className="text-xs text-slate-300 space-y-3 mb-8 flex-1">
                {(isZh ? [
                  '免费版全部功能',
                  'AI 无限使用',
                  '智能导入（图片/PDF）',
                  '云端同步（即将推出）',
                  '续费提醒（即将推出）',
                  '优先支持',
                ] : [
                  'Everything in Free',
                  'Unlimited AI analyses',
                  'Smart Import (images/PDF)',
                  'Cloud sync (coming soon)',
                  'Renewal reminders (soon)',
                  'Priority support',
                ]).map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-amber-400 mt-0.5 shrink-0">&#10003;</span> {item}
                  </li>
                ))}
              </ul>
              <button onClick={openCheckout}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-rose-900/30 cursor-pointer flex items-center justify-center gap-1.5">
                <FontAwesomeIcon icon={faCrown} className="w-3 h-3" />
                {isZh ? '立即购买' : 'Get Pro'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">{isZh ? '常见问题' : 'FAQ'}</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100">
              {isZh ? '你可能想问的' : 'Questions? Answers.'}
            </h2>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#141420]/60 rounded-xl border border-slate-800/40 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer group">
                  <span className="text-sm font-medium text-slate-200 pr-4">{faq.q}</span>
                  <FontAwesomeIcon icon={faChevronDown}
                    className={`w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-all duration-200 shrink-0 ${openFaq === i ? 'rotate-180 text-rose-400' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 -mt-1">
                    <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 lg:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-rose-950/10 to-transparent -z-10" />
        <div className="max-w-2xl mx-auto px-6 text-center">
          <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" className="w-16 h-16 mx-auto mb-6 rounded-2xl shadow-lg shadow-rose-900/20" />
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-4">
            {isZh ? '准备好消灭你的吸血鬼了吗？' : 'Ready to slay your vampires?'}
          </h2>
          <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto">
            {isZh ? '免费使用，无需注册，你的数据永远属于你。' : 'Free to use, no signup needed. Your data is always yours.'}
          </p>
          <button onClick={onEnterApp}
            className="inline-flex items-center gap-2 px-10 py-4 bg-rose-600 text-white text-sm font-semibold rounded-2xl hover:bg-rose-500 transition-all shadow-xl shadow-rose-900/30 group cursor-pointer">
            {isZh ? '开始使用 Bill Vampire' : 'Start Using Bill Vampire'}
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-800/40 py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" className="w-7 h-7 rounded-lg" />
              <span className="font-gothic text-sm font-bold text-slate-400">Bill Vampire</span>
              <span className="text-[10px] text-slate-700 ml-1">{isZh ? '让每一分钱都被看见' : 'Make every dollar visible'}</span>
            </div>
            <div className="flex items-center gap-5">
              <button onClick={() => onLegal('terms')} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer">
                {isZh ? '服务条款' : 'Terms'}
              </button>
              <button onClick={() => onLegal('privacy')} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer">
                {isZh ? '隐私政策' : 'Privacy'}
              </button>
              <button onClick={() => onLegal('refund')} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer">
                {isZh ? '退款政策' : 'Refund'}
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-800 mt-6">&copy; {new Date().getFullYear()} Bill Vampire. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
