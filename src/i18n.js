const translations = {
  en: {
    // Header
    appName: 'Bill Vampire',
    tagline: 'Kill the subscriptions draining your wallet',
    monthlyLoss: 'Monthly drain:',

    // Tabs
    tabBills: 'Bills',
    tabCheckin: 'Check-in',
    tabStats: 'Stats',

    // Subscriptions
    subList: 'Subscriptions',
    noSubs: 'No vampires found yet~',
    addSub: 'Add Subscription',
    subName: 'Name (e.g. Netflix)',
    amount: 'Amount',
    monthly: 'Monthly',
    yearly: 'Yearly',
    cancel: 'Cancel',
    add: '+ Add',
    findAlternatives: 'Find cheaper alternatives',
    findingAlternatives: 'Searching...',
    aiAlternatives: 'AI Alternatives',

    // Categories
    catEntertainment: 'Entertainment',
    catProductivity: 'Productivity',
    catLifestyle: 'Lifestyle',
    catOther: 'Other',

    // No-spend
    noSpendTitle: 'No-Spend Calendar',
    noSpendStreak: 'days this month',
    getMotivation: 'Get daily motivation',
    aiThinking: 'AI thinking...',

    // Stats
    aiAdvisor: 'AI Roast Advisor',
    startAnalysis: 'Roast me',
    analyzing: 'Analyzing...',
    aiPlaceholder: 'Click "Roast me" to let AI judge your spending',
    monthlySpend: 'Monthly spend',
    yearlyForecast: 'Yearly forecast',
    dailyCost: 'Daily cost',

    // Export & share
    exportPdf: 'Export check-in card (PDF)',
    shareCard: 'Share my vampire report',
    generating: 'Generating...',

    // Pro
    proBadge: 'PRO',
    upgradeTitle: 'Go Pro - One Time',
    upgradeDesc: 'Unlimited AI analysis, cloud sync, reminders. No subscription, ever.',
    upgradePrice: '$6.99 once, forever',
    upgradeCta: 'Unlock Pro',
    aiLimitReached: 'Free AI limit reached (3/day). Upgrade to Pro for unlimited.',
    aiUsesLeft: 'free AI uses left today',

    // Tip jar
    tipTitle: 'Buy the vampire a coffee',
    tip1: '$1',
    tip3: '$3',
    tip5: '$5',

    // Share
    shareTitle: 'My Vampire Report',
    shareMonthly: '/month being drained',
    shareBiggest: 'Biggest vampire:',
    shareTagline: 'Track yours at billvampire.com',

    // Footer
    footer: 'Bill Vampire - Make every dollar visible',

    // Savings
    monthlySaved: 'You saved:',
    savingsTitle: 'Vampires Slain',
    savedMonthly: 'Monthly savings',
    savedYearly: 'Yearly savings',
    subsKilled: 'subscriptions killed',
    noSavingsYet: 'Delete a subscription to start saving',

    // Days of week
    sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
  },

  zh: {
    appName: 'Bill Vampire',
    tagline: '让每一分吸血都无处遁形',
    monthlyLoss: '每月流失：',

    tabBills: '账单',
    tabCheckin: '打卡',
    tabStats: '统计',

    subList: '订阅列表',
    noSubs: '太棒啦，目前没有发现吸血鬼~',
    addSub: '添加订阅',
    subName: '订阅名称 (如：Netflix)',
    amount: '金额',
    monthly: '月付',
    yearly: '年付',
    cancel: '取消',
    add: '+ 添加',
    findAlternatives: '帮我找平替 / 免费版',
    findingAlternatives: '寻找平替中...',
    aiAlternatives: 'AI 平替方案',

    catEntertainment: '娱乐',
    catProductivity: '生产力',
    catLifestyle: '生活',
    catOther: '其他',

    noSpendTitle: '不消费打卡日历',
    noSpendStreak: '天（本月）',
    getMotivation: '获取今日情绪支持',
    aiThinking: 'AI 思考中...',

    aiAdvisor: 'AI 毒舌顾问',
    startAnalysis: '开始分析',
    analyzing: '分析中...',
    aiPlaceholder: '点击"开始分析"，让 AI 来毒舌你的账单',
    monthlySpend: '月均支出',
    yearlyForecast: '年度预测',
    dailyCost: '每日成本',

    exportPdf: '生成专属手帐打卡图 (PDF)',
    shareCard: '分享我的吸血鬼报告',
    generating: '生成中...',

    proBadge: 'PRO',
    upgradeTitle: '升级 Pro - 一次性买断',
    upgradeDesc: '无限 AI 分析、云同步、续费提醒。永不收订阅费。',
    upgradePrice: '$6.99 一次买断',
    upgradeCta: '解锁 Pro',
    aiLimitReached: '今日免费 AI 次数已用完 (3/日)。升级 Pro 无限使用。',
    aiUsesLeft: '次免费 AI（今日剩余）',

    tipTitle: '请吸血鬼喝咖啡',
    tip1: '¥7',
    tip3: '¥21',
    tip5: '¥35',

    shareTitle: '我的吸血鬼报告',
    shareMonthly: '/月 正在被吸血',
    shareBiggest: '最贵的吸血鬼：',
    shareTagline: '来 billvampire.com 查查你的',

    footer: 'Bill Vampire · 让每一分钱都被看见',

    monthlySaved: '已省下：',
    savingsTitle: '已消灭的吸血鬼',
    savedMonthly: '每月节省',
    savedYearly: '年度节省',
    subsKilled: '个订阅已被消灭',
    noSavingsYet: '删除订阅，开始省钱',

    sun: '日', mon: '一', tue: '二', wed: '三', thu: '四', fri: '五', sat: '六',
  },
};

export function getDefaultLang() {
  const saved = localStorage.getItem('vampire_lang');
  if (saved && translations[saved]) return saved;
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
}

export function t(lang, key) {
  return translations[lang]?.[key] || translations.en[key] || key;
}

export const SUPPORTED_LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
];
