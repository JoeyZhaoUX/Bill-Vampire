# Bill Vampire 产品设计、商业计划与商业模式说明

最后更新：2026-06-19

这份文档是给后续 Claude agent / coding agent 读取的项目上下文。目标是让 agent 在修改 Bill Vampire 时理解产品定位、用户场景、商业模式、增长策略和不能轻易破坏的关键约束。

## 1. 一句话定位

Bill Vampire 是一个 no-bank-login 的订阅账单急救工具。用户粘贴账单、上传截图/PDF，或说出一个即将续费/已经扣费的问题，产品在约 60 秒内生成一个针对单个订阅问题的取消、退款、证据保存和争议处理行动包。

核心不是做完整理财仪表盘，而是解决一个高痛感、即时可行动的问题：

> “我刚被某个订阅扣钱了，或马上要被扣钱，我现在该怎么取消、退款、留证据？”

## 2. 产品设计原则

1. 不要求银行登录。
   Bill Vampire 不走 Plaid，不要求用户连接银行账户，不读取完整交易历史。用户主动提供账单文本、截图、PDF、服务名或续费信息即可开始。

2. 先给结果，再要求付费或登录。
   免费流程必须让用户看到具体 case preview，包括服务、金额、风险、退款窗口、取消路径、下一步动作。账号和付费用于保存、恢复和解锁完整行动包，而不是阻挡首次价值感知。

3. 聚焦“一个紧急订阅问题”。
   不要把产品改成宽泛预算 app、记账 app、图表 dashboard 或 ChatGPT 聊天框。仪表盘可以存在，但核心卖点是把一个 charge/trial/cancel problem 变成可复制的脚本和 checklist。

4. 输出要可执行。
   好输出应该包含 cancel path、refund email、cancel email、support chat script、chargeback checklist、evidence checklist、reminder text。不要只总结账单。

5. 专业但不冒充法律/金融服务。
   语言可以提到 consumer communication assistance、evidence、support scripts，但必须避免承诺法律结果。保留免责声明：not legal, financial, or banking advice。

## 3. 目标用户

主要用户是遇到订阅经济痛点的普通消费者，而不是财务专家。

高意图用户场景：

- 忘记免费试用，被 Canva Pro、Duolingo、LinkedIn Premium 等扣了年费。
- Adobe、Grammarly、Microsoft 365、NordVPN 等年度续费后想退款。
- 服务取消路径很深，用户被客服、retention flow 或隐藏按钮绕住。
- 用户有 ADHD、money anxiety、doom spending 或失业/降薪后的账单压力。
- 用户不信任需要银行登录的 app，但愿意粘贴一条账单或上传截图。

用户心理：

- 不是想“优化财务生活”，而是想立刻止血。
- 感到焦虑、懊悔、被订阅公司套路。
- 愿意为一个能帮他避免或追回一次 $19.99、$54.99、$119.99 扣费的工具支付小额费用。

## 4. 核心产品流程

### Landing page

Landing page 的主张：

- Invisible subscriptions drain your money.
- No bank login.
- No signup before results.
- Cancel and refund scripts.
- $4.99 one-time Emergency Kit.

顶部 CTA 和页面区块应持续把用户导向三类场景：

- Surprise charge：已经被扣费，需要退款脚本。
- Trial ending soon：试用快结束，需要取消提醒。
- Hard to cancel：取消路径很难，需要取消路径和客服话术。

已登录用户回到 Landing 时，页面应该识别 auth 状态，显示 Open app / 用户邮箱，而不是让用户误以为掉线。

### Scan / 输入阶段

用户可以：

- 粘贴账单、收据、银行 line item、邮件内容。
- 上传图片/PDF。
- 用语音描述情况。
- 从 SEO 页面带入 prefill，例如 service、amount、issue、source。

免费用户有有限 AI 扫描额度。若超限但 URL/prefill 里已有 service 或 amount，系统可以构造 manual preview，避免完全卡死。

### Verdict / Case preview

免费预览要给用户足够价值：

- 识别服务名、金额、周期、续费时间。
- 判断主要风险。
- 给出 refund window / cancellation context。
- 给出最优下一步。
- 支持下载/保存。

付费前展示价值，但把完整脚本和 checklist 放在 Emergency Kit 之后。

### Emergency Kit

Emergency Kit 是主变现产品，当前价格为 $4.99 one-time。

解锁内容：

- Exact refund email template。
- Cancel request email。
- Support chat script。
- Chargeback checklist。
- Evidence checklist。
- Reminder text / action plan。
- 可保存到账号，避免清缓存或换设备后丢失。

### Account / Cloud sync

账号不是首次使用门槛，而是恢复和同步层。

登录方式：

- Email magic link。
- Google sign-in。

账号用于：

- 同步 subscriptions。
- 同步 saved case files。
- 恢复 Creem checkout 后的 entitlement。
- 保存 paid Emergency Kit、Pro、Patrol 等权益。

### Dashboard / App

App 内可以管理订阅列表、月度 drain、取消记录、case vault、提醒、分享卡、annual audit、trial tracker 等。

但注意：这些是 supporting experience，不是核心定位。不要把主线改成纯订阅追踪 dashboard。

## 5. 产品与价格

### Free

价格：$0

作用：

- 建立信任。
- 让用户看到 case preview。
- 捕获 SEO 流量后的首次价值。
- 推动下载、保存、账号创建、checkout click。

免费权益示例：

- 一次免费 AI bill parse / smart import。
- 基础 case preview。
- 风险摘要。
- 基础取消路径。
- 有限制的报告/AI 使用。

### Emergency Kit

价格：$4.99 one-time

这是当前最重要的核心商业模式。

为什么用户愿意付：

- 价格低于绝大多数订阅月费。
- 一个成功取消或退款即可回本。
- 购买的是“今天可以复制去客服/邮件/银行的行动包”，不是抽象建议。

### Dispute Kit

价格：$29 one-time

定位：

- 更高阶的信用卡争议/chargeback 材料包。
- 面向退款被拒、商家恶意续费、负选择计费争议等情况。
- 当前产品中以 Premium Card Dispute Kit / Dispute Kit 出现。

注意：文案要谨慎，不能承诺“保证赢”。可强调 structured dispute templates、timeline、card network-style evidence organization。

### Patrol

当前设计：Chrome extension / Gmail 订阅巡逻产品。

价格：

- Free：detect up to 5 subscriptions lifetime。
- Patrol：$4.99/mo。
- Annual：$39/yr，设计上约 $3.25/mo。

产品主张：

- Read-only Gmail access。
- 每日扫描订阅相关邮件。
- 发现新订阅或续费提醒。
- 到期前 push alert。
- 每周 digest。

当前注意事项：

- Chrome Store URL 仍是 placeholder。
- 年付 checkout 当前代码里暂时 fallback 到 monthly Creem product，不能误以为完全上线。
- Patrol 是未来/扩展方向，不要让它压过 Emergency Kit 的主线验证。

### Legacy Pro / Tips

代码里仍有 Pro、Tip、legacy checkout 相关逻辑。Agent 不应随意删除，因为可能涉及旧用户、扩展 cookie 或向后兼容。

但产品叙事上当前重点是：

1. Free preview。
2. $4.99 Emergency Kit。
3. $29 Dispute Kit。
4. Patrol recurring。

## 6. 商业模式

当前商业模式是 low-friction consumer SaaS / digital toolkit hybrid。

收入来源：

1. 一次性微交易：Emergency Kit $4.99。
2. 高客单一次性包：Dispute Kit $29。
3. 订阅：Patrol $4.99/mo 或 $39/yr。
4. 可选 tip。
5. 潜在 affiliate：更便宜替代工具推荐中有 affiliate 占位，但不要把产品改成 affiliate farm。

支付：

- Creem 是 merchant of record。
- Checkout session 通过 `/api/creem/checkout` 创建。
- Webhook 通过 `/api/creem/webhook` 验证并写入 entitlements。
- 前端也有 fallback 到 Creem hosted payment URL 的逻辑。

商业假设：

- 用户不会为“另一个预算 app”付费。
- 用户会为一个即时、具体、能减少损失的 action kit 付费。
- SEO 页面应捕获高意图搜索，例如 “Canva Pro trial refund after $119 charge”，而不是泛泛的 “AI finance app”。
- 如果一个页面带来访问但 preview start 低，要改 CTA 和 prefill，而不是单纯堆更多页面。

## 7. 增长策略

### SEO

SEO 是当前主要增长方向。

页面集群：

- `/cancel/`：服务级取消指南。
- `/refund/`：服务级退款指南。
- `/survival/`：围绕 money pressure 的订阅生存指南。
- `/tools/`：免费工具入口。
- `/cases/`：成功案例和 proof。

高价值 SEO 页面必须包含：

- 具体服务或具体财务压力场景。
- 取消/退款上下文。
- 证据 checklist。
- case preview CTA。
- internal links 到 refund/cancel/tool pages。
- secondary Emergency Kit CTA。

不要生成只替换关键词的低质量 AI SEO 页面。

### 社区增长

遵守 growth playbook：

- 不自动发帖。
- 不伪装用户。
- 不刷 Reddit/Quora/HN。
- 先提供有用答案，必要时透明披露 founder/tool。
- 记录 outcome、visits、preview starts、downloads、checkout clicks、paid conversions。

适合社区：

- Reddit: r/Frugal, r/personalfinance, r/ADHD, r/SideProject, r/AppHookup。
- Quora: service-specific refund/cancel questions。
- Indie Hackers: builder log / metrics。
- Hacker News: privacy/no-bank-login/local-first technical angle。
- Product Hunt: 等主流程稳定后再 launch。

## 8. 关键指标

产品指标：

- Landing view。
- CTA click / onboarding started。
- scan_started。
- scan_succeeded。
- verdict reached。
- preview downloaded。
- account save。
- checkout_clicked / checkout_started。
- emergency_kit_checkout_succeeded。
- case saved。

SEO 指标：

- Search impressions。
- CTR by page。
- refund_cta_clicked。
- scan_started with source=seo_refund_page。
- page-specific preview conversion。
- paid conversion by service/issue cluster。

早期 30 天目标：

- 1,000+ organic visits。
- 200+ case previews。
- 20+ downloads or saves。
- 10+ checkout clicks。
- 1-3 paid users or 5+ paid-intent conversations。

## 9. 技术架构摘要

前端：

- Vite + React。
- Main entry: `src/main.jsx`。
- Landing: `src/Landing.jsx`。
- Main app/dashboard: `src/App.jsx`。
- Scan flow: `src/onboarding/Scan.jsx`。
- Verdict / paywall: `src/onboarding/Verdict.jsx`。
- Kit generation: `src/onboarding/emergencyKit.js`。
- Pricing / checkout helpers: `src/pro.js`。

后端：

- Cloudflare Pages Functions。
- D1 database for users, subscriptions, cases, entitlements。
- Auth helpers in `functions/_shared/auth.js`。
- Magic link and Google auth under `functions/api/auth/`。
- Sync: `functions/api/subscriptions/sync.js`。
- Cases: `functions/api/cases.js`。
- Creem checkout/webhook under `functions/api/creem/`。
- Gemini backend proxy under `functions/api/gemini.js`。

AI：

- Google Gemini via secured backend proxy。
- AI is used for extraction; Emergency Kit also relies on stable deterministic templates personalized with detected service/amount/date/issue.
- Do not silently replace real AI with fake/mock results in production paths.

Storage:

- Guest/local mode uses localStorage.
- Cloud sync applies snapshots from D1.
- Entitlements should come from Creem webhook or authenticated cloud state, not browser-only flags alone.

## 10. Agent 修改守则

当你作为 agent 修改 Bill Vampire 时：

1. 不要破坏 no-bank-login 定位。
2. 不要把登录放到首次结果之前。
3. 不要把 $4.99 Emergency Kit 淡化成普通 Pro。
4. 不要用假数据冒充真实 AI 或真实支付结果。
5. 不要删除 legacy entitlement / Pro / Patrol 兼容代码，除非有明确迁移计划。
6. 不要让 Landing 上已登录用户看到 Sign in 并误以为掉线。
7. SEO 页面要具体、可行动、可内部链接，不要泛泛生成。
8. 法务/退款/chargeback 文案要避免保证结果。
9. 修改上线前至少跑 `npm run build`。
10. `npm run lint` 当前可能会因仓库里已有的压缩 JS 或旧未使用变量失败；如果只改部分文件，应同时跑定向 lint。

## 11. 当前已知注意事项

- `public/sitemap.xml` 目前包含 135 个 URL。
- sitemap 已将工具页规范到 `.html` 路径，并与两个工具页 canonical/OG URL 对齐。
- `public/tools/subscription-cost-calculator.html` 和 `public/tools/cancel-subscription-script-generator.html` 的 canonical 应保持 `.html` 版本。
- `public/refund.html` 是 refund policy，不要和 `/refund/` refund guide hub 混淆。
- 工作区可能存在大量未跟踪 PPT、图片、deck assets，不要误提交。
- Chrome extension Patrol 的商店 URL 仍是 placeholder。
- Full release gate 是 `npm run build`，它会重新生成 SEO 页面和 sitemap。

## 12. 推荐给未来 agent 的优先级

如果继续优化产品，优先级建议：

1. 提高 SEO 页面到 scan 的转化率：更具体 CTA、更好 prefill、更清楚的 issue/source attribution。
2. 提高 Verdict 到 Emergency Kit 的转化率：展示免费价值后，明确完整脚本/checklist 的差异。
3. 强化账号恢复：付费后提醒用户用同一 Creem email 登录恢复权益。
4. 清理 canonical/sitemap/structured data 一致性。
5. 在不损害主线的前提下推进 Patrol。
6. 记录真实 paid conversion 和 service cluster，少做泛化功能，多复制已转化场景。

