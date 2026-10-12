# Pairvu 生产上线与验收状态及剩余任务

> 当前状态入口已更新为[项目整体进展（2026-10-12）](project-progress-2026-10-10.md)：UPG-01至UPG-06已关闭，UPG-06已发布启用且限定真实登录验收通过。本文以下保留2026-10-10初始审计，版本、迁移及待办是历史事实，不再作为当前生产状态。


核实日期：2026-10-10，Asia/Shanghai。

Pairvu 的单图检测、批量审核、订阅基础、次数包实现、产品档案及多视角参考图已具备代码和不同程度的生产证据。当前重点是补齐生产验收与版本追溯、完成付费和复用验证。M3 自定义规则、M4 优选、M5 自动修复、M6 监控尚未实施，仍受用户证据门槛约束。

本报告作为2026-10-10初始核实的历史入口。历史验收通过、当前只读检查通过、完整交互验收通过、市场验证通过是不同结论；数据库中存在记录不代表陌生客户采用，也不替代浏览器验收。

## 生产版本与数据库

| 项目 | 本次确认结果 |
| --- | --- |
| 本地代码基线 | `87b21ac223852a3fdbea3e2eca567ccb0e2eefec`，2026-09-06；核实开始时工作区干净 |
| GitHub main | `git ls-remote origin refs/heads/main` 返回同一个提交；此次未部署，不将此只读查询当作未来发布所需的 fetch 验证 |
| 生产 Worker | `pairvu`，版本 98：`3117176b-e5d1-410b-88e6-b071fb8d1208`，最新部署分配 100% 流量 |
| 部署时间 | 2026-09-06 23:44:58，Asia/Shanghai；平台原始时间 `2026-09-06T15:44:58.083Z` |
| 提交与部署关联 | **未证实精确关联**。版本 annotations 没有 Git SHA/tag/message；`/api/health` 仅返回 `public-beta`。时间、路由和迁移匹配不能代替构建来源证明 |
| 生产 D1 | `pairvu-production`，`0001` 至 `0019` 共 19 个迁移全部登记完成；没有本地迁移文件尚未登记的情况 |
| 近期迁移 | `0015`：09-01 15:32:00；`0016`：09-01 19:32:03；`0017`、`0018`：09-01 20:35:37；`0019`：09-06 23:32:18；以上均为 Asia/Shanghai |

本次只读取生产数据、部署元数据及公开页面，更新仓库文档；没有部署、应用迁移、购买、变更订阅、创建生产测试数据或删除生产图片。已有部署不能因本次文档更新而补认定为满足所有历史发布步骤。

## 功能上线与验收矩阵

| 功能 | 生产证据 | 验收结论与剩余事项 |
| --- | --- | --- |
| M0 单图 QA | 历史真实图及 2026-08-14 founder 验收；D1 有 63 个 completed、6 个 failed 分析，最近一条 completed 记录创建于 09-28 00:38，Asia/Shanghai | 基础功能已上线且有历史验收。本次未重新调用付费模型，不把累计记录当准确率或今日完整 E2E |
| 登录、额度与工作空间 | 历史 Google 登录和额度验收；账户页面跳登录；未登录产品/批次 API 返回 401 | 已上线；本次浏览器没有现成登录会话，登录后的完整流程未重验 |
| M1 批量审核 | 9 个历史批次：7 completed、1 canceled、1 failed；08-14 已完成重试、扣费、删除及移动端/键盘验收 | 已上线，核心历史验收完成；现有失败/取消状态不等于当前队列故障 |
| Live 订阅 | D1 留存 livemode=1 的 checkout、subscription created/updated/deleted、invoice.paid，均 completed；08-18 付款相关记录、09-18 subscription deleted | 已发生真实 Live 订阅生命周期。当前为 2 个 Free 工作空间、0 个活跃付费订阅；不能据此认定达到 10 个付费工作空间 |
| 次数包及套餐切换 | `0013`、`0014` 已应用；历史 Live 价格和门户切换配置记录；生产价格页可访问，未登录 pack-status 返回 401 | 实现和基础发布已完成；标准 pack_50/200/500 lot 数为 0。唯一 lot 是已耗尽的 `internal_e2e_1`（1 grant/1 consumed），不能算真实购买验收 |
| 账务审计 | 本次生产月额度账本、次数包账本、超期 reservation、订阅周期及失败/超时 webhook 五组异常查询均为空 | 当前只读审计通过；不证明 Stripe 后台品牌、门户交互或未来付款必然成功 |
| 激活与零额度恢复 | `0015`、`0016` 已应用；首页示例与价格页在线；D1 有 8 次 zero_allowance_viewed | 生产有功能与事件证据；零额度至真实购买转化仍未闭环 |
| M2 Saved Products | `0017`、`0018` 已应用；2 个 active 产品、1 个产品关联批次；2 次创建、1 次复用、5 次历史查看事件 | 已上线且部分流程实际执行；还没有足够重复使用及节省时间证据 |
| M2.1 参考视角与版本 | `0019` 已应用；当前 front 2 个、back 1 个，另有 2 个 superseded front；09-07 凌晨有 back 创建和版本更新记录（Asia/Shanghai） | 多视角持久化已在生产使用。归档/恢复、各视角选图绑定、过期后行为的完整生产交互验收待补；本地对应验证通过 |
| 留存与删除 | 121 条 deletion attempt 均 completed；最新为 10-07 00:15；数据库中已过期但未标记 deleted 的资产为 0 | 数据库侧维护证据正常；08-14 有真实删除验收。本次未逐个读取 R2 对象，不能将 DB 状态视为新的全量对象删除证明 |
| SEO/GEO | 66 个生产 sitemap URL；新电商要求指南、Amazon、benchmark、护肤页均 200 且有对应 canonical | 已发布，内容与 sitemap 本地检查通过；无障碍/性能完整验收、搜索后台复盘仍待闭环 |

参考：[M1 实施计划](m1-batch-commercial-plan.md)、[付费 Beta 验收清单](m1-paid-beta-release-checklist.md)、[产品扩展路线](product-expansion-roadmap.md)、[SEO/GEO 实施计划](seo-geo-implementation-plan.md)。

## 本次验证范围与证据

### 生产只读检查

- `/api/health` 为 200；公开配置显示接收新分析、Turnstile 开启，session/day/global 限额仍有值。没有切换停止开关或制造限流流量。
- `/`、`/pricing`、电商要求指南、Amazon 用例、controlled benchmark、Skincare 为 200；账号三个入口转向各自的登录返回地址。
- `/api/products`、`/api/batches`、`/api/billing/packs/status` 为 401；`/api/billing/context` 返回 `authenticated: false` 和 `no-store`。
- `/sitemap.xml` 有 66 项；Skincare 和电商要求指南包含其中；Beverage Can、Cleaning Product 两个未发布分类 URL 返回 404，符合 registry 的 planned 状态。
- robots 允许 OAI-SearchBot，拒绝 GPTBot。搜索控制台所有权及 sitemap 提交沿用已有记录，本次未进入 GSC/Bing，HTTP 可访问不等于被索引。
- Wrangler deployments list、versions view 和 D1 SELECT 均为只读。D1 聚合核实未导出图片、客户邮件、会话凭据或原始支付载荷。
- 本地可用 Stripe 密钥是 Test 模式，因此没有用它推断当前 Live 账户品牌、门户设置或客户归属。
- 历史 Live checkout 早于新增 workspace_id 等审计字段，字段为 null；不能用 `count(distinct workspace_id)` 得到真实历史付费客户数。

复查命令（从已有受保护配置加载凭据，不把密钥写进命令或文档）：

```bash
git ls-remote origin refs/heads/main
wrangler deployments list --name pairvu
wrangler versions view 3117176b-e5d1-410b-88e6-b071fb8d1208 --name pairvu --json
wrangler d1 execute pairvu-production --remote --command 'SELECT id, name, applied_at FROM d1_migrations ORDER BY id' --json
pnpm audit:m1:billing
```

### 本地验证

2026-10-10 以下命令均退出 0：

```bash
pnpm test:m2:saved-products
pnpm test:activation-experience
pnpm test:product-analytics
pnpm test:m1:release-gates
pnpm test:seo
pnpm typecheck
```

覆盖 M2 所有权、幂等、SKU、按视角版本、归档恢复、过期、批次复用，以及 M0 六类语义、留存、账务对账、批次重试/队列。SEO 检查确认 66 个发布路由、6 个分类页、7 个检查页、19 个受控 benchmark 案例。它们是本地验证，不是新一次生产 UI/模型验收；本次文档变更不需要重新构建或部署应用。

## 按优先级排序的剩余任务

P0 表示优先消除安全或发布追溯不确定性，不表示已确认生产故障。P1 完成已交付产品的验收和验证。P2 为有证据才推进的增强与增长。P3 为后续路线。

| 优先级 | ID | 任务与当前状态 | 负责角色 | 完成标准 |
| --- | --- | --- | --- | --- |
| P0 | R01 | 核实历史 OpenAI 密钥暴露事件的轮换闭环；旧 B-007 未找到关闭证据 | Founder/运维 | 提供受影响旧密钥已撤销及当前生产密钥已替换的记录；无需披露密钥。若未轮换，按受控流程处理；本次未更改凭据 |
| 已完成当前版本 | R02 | 当前 Worker 已关联发布SHA并独立生产验收；旧版本历史缺口保留 | 工程 | 找到可验证的构建/部署记录；若无法追溯则明确保留历史缺口，后续发布按 AGENTS.md 从已推送提交部署，记录 SHA、Worker version 和 smoke，并让构建/健康信息可追溯 |
| P1 | R03 | 完成 M2/M2.1 登录态生产验收；已有持久化证据，完整 walkthrough 待补 | Founder/工程 | 同一测试产品完成 front/back 选择、更新不串视角、批次绑定正确资产、历史、编辑、归档恢复、图片过期行为；记录对象 ID、日期和结果。需要有效登录会话，影响图片/额度的步骤单独控制 |
| P1 | R04 | 真正的标准次数包购买及 Live 门户验收；测试 lot 不算完成 | Founder/工程 | 经明确授权的真实购买完成 Stripe paid→webhook→标准 lot→Account 到账；核对月额度优先扣减、门户打开/切换及失败提示；补 Live 品牌、支持信息及账户归属记录。购买由 founder 操作或另行明确授权 |
| P1 | R05 | 完成 M1 商业验证与 M2 复用复盘；尚未达到验收证据要求 | Founder/产品 | 区分内部测试与外部用户；覆盖至少 30 天且至少 10 个付费工作空间；报告激活、重复批次、例外审核、导出、定价异议、取消原因、成本、模型失败；M2 另报复用、建批次耗时和历史用途 |
| P1 | R06 | 收尾告警、隐私及滥用运行验收；已有日志和限制，运营闭环待证实 | 工程/运维 | 证明错误/成本/删除异常能到达操作负责人；记录停止接收新分析、超限/Turnstile、删除重试的受控验收。不要仅以配置存在或日志生成判定完整通过 |
| P1 | R07 | 完成搜索/AI 来源到检测的归因、生产公共页面 QA 与定期复盘 | 工程/增长 | 用可追踪会话验证来源→开始→完成；公共页移动端/键盘/无障碍/性能/链接检查；补 GSC/Bing 查询与页面数据及到期复盘。30/60/90 天为相对数据窗口，不因日历经过自动完成 |
| P2 | R08 | 结果问题合并和用户反馈补充 | 产品/工程 | PB-Q05 同一底层变化不重复呈现；PB-Q07 已有人类可读标签，补陌生用户理解验收；按需求增加 PB-F04 使用场景、PB-F05 独立可选联系同意 |
| P2 | R09 | 真实模型锚点重复性与类目评测 | 工程/产品 | 补四锚点各三次真实运行及误报/漏报解释；模型或 prompt 变更前重新评估风险。不得把 19 个精选 benchmark 的一致性当总体准确率 |
| P2 | R10 | 执行外部分发与证据驱动的内容增量 | Founder/增长 | 外部分发计划有实际发布链接、UTM、完成检测/反馈结果；补 Keyword Planner 分地区语言证据；Beverage Can/Cleaning Product 仅在完整独立证据和批准后发布；Skincare 已上线，无需重做 |
| P2 | R11 | 延期能力池，未批准统一开工 | 产品/工程 | 逐项以活跃用户需求决策：ZIP/CSV 导入、超过 20 项、并发批次、团队审批、多参考图联合判断、自动视角匹配、整套图 QA、类目专项检测 |
| P3 | R12 | M3 自定义规则与渠道标准，未实施 | 产品/工程 | 先有重复人工规则/允许变化需求，再实现来源、版本、证据、可审核结论；不是平台认证 |
| P3 | R13 | M4 比较与优选，未实施 | 产品/工程 | 多个 PASS 候选及真实选择需求；推荐可解释，不能用美观抵消身份错误 |
| P3 | R14 | M5 有限自动修复，未实施 | 产品/工程 | 低风险展示问题达到有效数量；新版本、独立复检、用户确认、不覆盖原图、不自动发布 |
| P3 | R15 | M6 监控和按需求接入公共 API、Shopify/PIM/DAM，未实施 | 产品/工程 | 先确认线上资产漂移风险与愿意接入的用户；具备可信产品版本，再实施 URL/feed、告警和集成；企业权限/SSO/SLA 仅在真实合同需求下评估 |

GA4 仍为待隐私/同意决策的可选延期项；IndexNow 为可选项，不阻塞现有第一方报表或产品验收。上述清单没有批准自动发送推广、购买、修改凭据或生产部署。

## 本次文档纠偏

- 将旧 M0 的 NOT_READY/NO_GO 改为历史门槛已被 M1 公开付费 Beta 决策取代；保留历史证据，不把未证明的安全事项顺带关闭。
- 纠正 M1 仍在 Test Mode、top-up 未实现、邀请制以及待首次重试/删除验收等过时措辞。
- 将 `0016` 至 `0019` 和 M2/M2.1 从笼统待上线改为已有生产证据，同时保留交互/市场验收缺口。
- 纠正 SEO 汇总计数及 Skincare 全部被阻塞的描述；保留另外两个 planned 分类的证据门槛。
- 不再使用旧日历路线的 Not Started 汇总判断当前进度；以本报告、M1 验收清单和获批扩展路线共同解释状态。

## 同日发布验收更新

2026-10-10 16:12：已从推送至GitHub的 `f85bd3eb7046130acaa30f5ae473765e57ec413b` 部署，Worker version `7c0bdfaa-4f33-4e94-b8b1-182f63bf29d5` 承载100%。health精确匹配，7项目标HTTP检查及独立生产QA通过，无新增/待执行迁移。[生产证据](../../operations/evidence/production-release-2026-10-10.json)。本节替代前文“当前线上SHA未证实”，不回溯推断旧版本。R01密钥轮换证据、R03登录态验收、R04真实标准包支付和商业验证不因本次发布关闭。
