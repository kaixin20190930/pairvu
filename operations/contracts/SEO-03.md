# SEO-03 内容归因与首页可信表达小修

## 目标与授权

2026-10-16 用户要求忽略当前很差的 GSC 数据，继续下一步修复和优化，并明确禁止过度设计、过度开发、过度验证。

本单元只有两个目标：

1. 让公开内容页产生可与同一匿名会话后续 checker 事件关联的 `landing_view`，并将会话来源限制在真实浏览器会话内，避免历史来源长期污染新访问；
2. 在不重构首页的情况下，把首页 H1 明确为产品类别加原品牌问题，并给现有真实商品案例一个正文入口。

本单元不新增事件类型、数据库迁移、SEO URL、报表平台、付费功能、PDF、团队功能或外部发布。没有生产发布授权；独立 PASS 后停止于可发布状态。

## 允许范围

- `app/layout.tsx`
- `components/ContentLandingAnalytics.tsx`（如需要）
- `components/ProductChecker.tsx`
- `components/HomeExampleStrip.tsx`
- `lib/analytics/client.ts`
- 既有 `scripts/verify-product-analytics.ts`、`scripts/verify-activation-experience.ts` 的最小断言更新
- 本契约及总控台账；开发不得改写用户已批准的 SEO 方案文档

实现优先复用 `landing_view`、现有 anonymous session、`ActivationView` 和现有事件 API。内容页以 route 作为 `content_id`，按既有 URL 前缀产生 page family；首页已有 ProductChecker landing 事件，不得重复记录。`/account`、`/sign-in` 和未知/非内容路径不得被当作公开内容落地。session attribution 应使用 `sessionStorage`；first touch 与匿名 session 既有语义保持。

首页只做两处内容差分：H1 改为 `AI Product Image Checker: Did AI Change Your Product?`；在现有案例区加入 `/examples/coca-cola-can-background-edit` 的真实案例入口，并明确单次结果为 REVIEW，不替换现有 PASS/REVIEW/FAIL 受控案例。

## 最小验收清单

- 必验正常路径：一个 `/guides/*` 内容页记录一次 `landing_view`，properties 包含 `surface=content`、route/content_id、page_family；进入首页后同一匿名 session 的 checker 事件仍可关联；H1 与真实案例链接渲染。
- 必验反例：`/` 不被新组件重复记录；`/account`、`/sign-in` 与未知路径不记录内容 landing；新标签页/新浏览器会话不继承旧 session attribution。
- 复用：既有事件 API、anonymous session、首页 checker、SEO registry、已上线 SEO-02 案例及生产验收；不重复模型、图片、登录、计费或全站业务矩阵。
- 不验：GSC 排名、外链、客户数据、付费、真实模型质量、生产环境。未获发布授权前不做 push/deploy/生产 smoke。
- 操作范围：本地仓库和合成浏览器存储/事件；不使用客户图片或生产写入。
- 预算：开发 25 分钟检查点，独立 QA 20 分钟检查点；只运行相关 analytics/activation、typecheck、SEO inventory 与一次候选 build，不新建通用测试框架。
- 完成条件：单一固定候选提交，相关检查通过，独立 QA 对同一 SHA PASS；真实 formal CLI 受旧 JRN-04-FIX PARTIAL 占槽时保留阻塞，不手改状态。

## 模型选择

- 开发：GPT-6.1 Sol / medium。局部 React/浏览器存储/事件语义改动，范围明确；若发现事件 schema 或数据库必须迁移，停止并报告，不自动升级或扩建。
- 独立 QA：GPT-6.1 Sol / medium。核对固定 SHA、会话隔离反例、重复 landing 与首页内容即可；若出现跨会话归因或事件幂等语义冲突，再评估 high。

开发回传：完整候选 SHA、差分、实际命令、正常/反例结果和限制。QA 不改共享运行时代码；FAIL 返回原开发，只复验受影响差分。

## 完成记录

- 候选提交：`1471419b2e04c4f8b91902d97bc34803f601ebf8`
- 独立验收：PASS，证据见 `operations/evidence/SEO-03.json`
- 验收边界：本地合成存储/事件与同 SHA 构建产物；未做生产验收
- 正式状态：受既有 `JRN-04-FIX` RELEASE_READY 占槽影响，保留真实 backlog 状态，不手工改写 control
- 生产发布：release `9b8d67cf76523a1a86f7bdcd9e45364d2d2e1e9a`，Cloudflare `cb83041c-829b-48f8-a4bc-a31450660d52`，独立只读生产复验 PASS
- 生产限制：未向事件 API 写测试数据，因此不声称已验证真实生产事件入库；归因语义沿用未变化运行代码的本地独立 PASS
- 下一步：准备首轮站外分发与下一例开放许可真实商品案例；实际对外发送或发布需要用户明确授权
