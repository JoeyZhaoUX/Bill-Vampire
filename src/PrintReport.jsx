import React from 'react';

const CATEGORY_ICONS = { Entertainment: '🎮', Productivity: '⚡', Lifestyle: '🌿', Other: '📦' };
const CATEGORY_COLORS = { Entertainment: '#fda4af', Productivity: '#c4b5fd', Lifestyle: '#6ee7b7', Other: '#fcd34d' };

export default function PrintReport({ subscriptions, noSpendDays, monthlyTotal, currency, lang, currentYear, currentMonth, currentDay, daysInMonth, firstDayOfWeek }) {
  const isZh = lang === 'zh';
  const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const streak = noSpendDays.filter(d => d.startsWith(currentMonthPrefix)).length;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthNamesZh = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const monthLabel = isZh ? monthNamesZh[currentMonth - 1] : monthNames[currentMonth - 1];
  const weekDays = isZh ? ['日', '一', '二', '三', '四', '五', '六'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const categoryTotals = {};
  subscriptions.forEach(sub => {
    const cat = sub.category || 'Other';
    const price = parseFloat(sub.price) || 0;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (sub.cycle === 'yearly' ? price / 12 : price);
  });

  const biggest = subscriptions.reduce((max, sub) => {
    const p = parseFloat(sub.price) || 0;
    const mp = parseFloat(max?.price) || 0;
    return p > mp ? sub : max;
  }, subscriptions[0]);

  return (
    <div className="print-report">
      {/* Header with branding */}
      <div className="pr-header">
        <div className="pr-header-left">
          <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="Bill Vampire" className="pr-logo" />
          <div>
            <h1 className="pr-title">Bill Vampire</h1>
            <p className="pr-subtitle">{isZh ? '订阅追踪报告' : 'Subscription Report'}</p>
          </div>
        </div>
        <div className="pr-header-right">
          <span className="pr-date">{monthLabel} {currentYear}</span>
          <span className="pr-date-sub">
            {isZh ? `生成于 ${currentYear}/${currentMonth}/${currentDay}` : `Generated ${currentMonth}/${currentDay}/${currentYear}`}
          </span>
        </div>
      </div>

      <div className="pr-divider" />

      {/* Key metrics row */}
      <div className="pr-metrics">
        <div className="pr-metric-card pr-metric-primary">
          <span className="pr-metric-label">{isZh ? '月度支出' : 'Monthly Spend'}</span>
          <span className="pr-metric-value">{currency}{monthlyTotal.toFixed(2)}</span>
        </div>
        <div className="pr-metric-card">
          <span className="pr-metric-label">{isZh ? '年度预测' : 'Yearly Forecast'}</span>
          <span className="pr-metric-value pr-metric-danger">{currency}{(monthlyTotal * 12).toFixed(2)}</span>
        </div>
        <div className="pr-metric-card">
          <span className="pr-metric-label">{isZh ? '每日成本' : 'Daily Cost'}</span>
          <span className="pr-metric-value">{currency}{(monthlyTotal / 30).toFixed(2)}</span>
        </div>
        <div className="pr-metric-card">
          <span className="pr-metric-label">{isZh ? '订阅数量' : 'Active Subs'}</span>
          <span className="pr-metric-value">{subscriptions.length}</span>
        </div>
      </div>

      {/* Two-column body */}
      <div className="pr-body">
        {/* Left column: Subscriptions table */}
        <div className="pr-col-left">
          <h2 className="pr-section-title">{isZh ? '订阅明细' : 'Subscription Details'}</h2>
          <table className="pr-table">
            <thead>
              <tr>
                <th>{isZh ? '名称' : 'Name'}</th>
                <th>{isZh ? '分类' : 'Category'}</th>
                <th>{isZh ? '周期' : 'Cycle'}</th>
                <th style={{ textAlign: 'right' }}>{isZh ? '金额' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(sub => (
                <tr key={sub.id}>
                  <td className="pr-sub-name">{sub.name}</td>
                  <td>
                    <span className="pr-category-badge" style={{ backgroundColor: CATEGORY_COLORS[sub.category] + '30', color: '#334155' }}>
                      {CATEGORY_ICONS[sub.category]} {isZh ? { Entertainment: '娱乐', Productivity: '生产力', Lifestyle: '生活', Other: '其他' }[sub.category] : sub.category}
                    </span>
                  </td>
                  <td className="pr-cycle">{sub.cycle === 'monthly' ? (isZh ? '月付' : 'Monthly') : (isZh ? '年付' : 'Yearly')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{currency}{sub.price}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" style={{ fontWeight: 700 }}>{isZh ? '月度总计 (USD)' : 'Monthly Total (USD)'}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#e11d48' }}>{currency}{monthlyTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Category breakdown */}
          {Object.keys(categoryTotals).length > 0 && (
            <div className="pr-categories">
              <h3 className="pr-subsection-title">{isZh ? '分类占比' : 'By Category'}</h3>
              <div className="pr-cat-bars">
                {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => {
                  const pct = monthlyTotal > 0 ? (total / monthlyTotal * 100).toFixed(0) : 0;
                  return (
                    <div key={cat} className="pr-cat-row">
                      <span className="pr-cat-label">{CATEGORY_ICONS[cat]} {cat}</span>
                      <div className="pr-cat-bar-bg">
                        <div className="pr-cat-bar" style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat] }} />
                      </div>
                      <span className="pr-cat-pct">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Calendar + insights */}
        <div className="pr-col-right">
          {/* No-spend calendar */}
          <h2 className="pr-section-title">{isZh ? '不消费打卡' : 'No-Spend Calendar'}</h2>
          <div className="pr-calendar">
            <div className="pr-cal-header">
              {weekDays.map(d => <span key={d} className="pr-cal-weekday">{d}</span>)}
            </div>
            <div className="pr-cal-grid">
              {[...Array(firstDayOfWeek)].map((_, i) => <span key={`e${i}`} className="pr-cal-empty" />)}
              {[...Array(daysInMonth)].map((_, i) => {
                const dayNum = i + 1;
                const date = `${currentMonthPrefix}-${String(dayNum).padStart(2, '0')}`;
                const isChecked = noSpendDays.includes(date);
                const isPast = dayNum <= currentDay;
                return (
                  <span key={i} className={`pr-cal-day ${isChecked ? 'pr-cal-checked' : ''} ${!isPast ? 'pr-cal-future' : ''}`}>
                    {isChecked ? '✓' : dayNum}
                  </span>
                );
              })}
            </div>
            <div className="pr-cal-summary">
              <span className="pr-cal-streak">{streak}/{currentDay}</span>
              <span className="pr-cal-streak-label">{isZh ? '天完成不消费' : 'no-spend days'}</span>
            </div>
          </div>

          {/* Insights card */}
          <div className="pr-insights">
            <h3 className="pr-subsection-title">{isZh ? '洞察' : 'Insights'}</h3>
            <div className="pr-insight-item">
              <span className="pr-insight-icon">🧛</span>
              <span>{isZh ? '最大吸血鬼' : 'Biggest vampire'}: <strong>{biggest?.name || '-'}</strong> ({currency}{biggest?.price || 0}/{biggest?.cycle === 'monthly' ? (isZh ? '月' : 'mo') : (isZh ? '年' : 'yr')})</span>
            </div>
            <div className="pr-insight-item">
              <span className="pr-insight-icon">📊</span>
              <span>{isZh ? '日均消耗' : 'Daily burn rate'}: <strong>{currency}{(monthlyTotal / 30).toFixed(2)}</strong></span>
            </div>
            <div className="pr-insight-item">
              <span className="pr-insight-icon">☕</span>
              <span>{isZh ? '相当于每天' : 'Equivalent to'} <strong>{(monthlyTotal / 30 / 5).toFixed(1)}</strong> {isZh ? '杯咖啡' : 'coffees/day'}</span>
            </div>
            <div className="pr-insight-item">
              <span className="pr-insight-icon">💰</span>
              <span>{isZh ? '省钱达成率' : 'Savings rate'}: <strong>{currentDay > 0 ? ((streak / currentDay) * 100).toFixed(0) : 0}%</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pr-footer">
        <span>Bill Vampire — {isZh ? '让每一分钱都被看见' : 'Make every dollar visible'}</span>
        <span>billvampire.com</span>
      </div>
    </div>
  );
}
