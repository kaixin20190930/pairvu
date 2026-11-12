# PIVOT-02 模型目录与证据互链补强

## 目标与授权

2026-11-12 用户要求严格按上线验收后的最终优化方案修复，明确不要过度开发和测试。本单元只完成当前公开站的 P0/P1 内容基础：补齐核心模型页、价格口径、三向互链、BrowseComp 新旧数据分层、两个 best 页候选质量，以及旧系统状态说明。

本轮授权为开发和独立验收，不自动包含生产发布。GSC、批量对比页、登录账户业务重构、旧数据删除、邮件通知和 Stripe 操作均不在本单元。

## 冻结范围

- 发布现有数据层中缺失的 GPT-5.2、Claude Opus 4.5、Gemini 3.1 Pro Preview、Claude Opus 5.5 模型页。
- 新增官方可验证的 Qwen3.8-27B，canonical 为 `/models/qwen3-8-27b`；`/models/qwen-3-8-27b` 单跳 301 到 canonical；保留独立的 Qwen3-8B。
- 模型目录总量控制在 10–12 条。只为使两个 best 页面各有 8 个有来源候选而补最少必要模型；每个新增模型必须有官方/模型所有者来源和实际页面用途，不为凑数建页。
- 所有对比页的两端模型必须有公开模型页并链接；模型页列实际相关 vs 与实际相关 benchmark；benchmark 只链接真实出现的模型。不得生成新的批量对比组合。
- 价格数据支持 provider、region、currency、mode、accessedAt。补 GLM-5 官方 USD API 价格、Qwen3-8B 和 Qwen3.8-27B 的官方人民币口径；无统一官方 API 价格时使用明确的 open-weights 说明，不显示空洞 `Not listed`。
- BrowseComp 保留 2025 原始基线并明确年份；另列最新可追溯的厂商报告结果、日期、配置和不可直接横比警告。没有一手来源的数据不发布。
- `/best/chinese-models` 与 `/best/open-source-models` 各 8 个候选，展示可判定入选理由和来源；无共同 harness 时不伪造绝对名次。
- 更新 privacy 的旧系统表述，并增加不进主导航的 `/legacy`，只说明新购买关闭、旧账户数据访问/删除方式、旧 API 支持边界。不得虚称旧系统已终止。
- 更新 sitemap、页面 metadata 与最小专项验证；保持 PIVOT-01 的 301/410/404、16 页和账户/API边界不回归。

## 验收清单

- 必验正常路径：新增模型页与 `/legacy` 为 200、唯一 Title/H1/self-canonical、来源和采集日期可见；现有 16 页仍 200。
- 必验数据：公开模型页总数 10–12；两个 best 页各恰有 8 个来源化候选；价格页不再出现 `Not listed`，币种/地区/模式不混写；Qwen3.8-27B 与 Qwen3-8B 是独立记录。
- 必验互链：4 个现有 vs 页两端均链接公开模型页；模型页至少链接其真实相关 vs 或明确无现有 vs，并链接实际相关 benchmark；benchmark 成绩中的已发布模型可回链。
- 必验 BrowseComp：原始 2025 基线与最新厂商报告分表，显示日期/配置及不可直接比较警告，来源为官方或模型所有者。
- 必验法律/迁移边界：privacy 不再暗示仍可购买；`/legacy` 不进入主导航、说明旧账户/API/删除边界；无结账 CTA。
- 回归：旧清单的 124×410、6×301、2×200 语义不变；Qwen 别名新增 301；未知 404；`/api/health` 可用；sitemap 只含新公开页。
- 复用：PIVOT-01 固定来源结构、页面模板、Edge middleware、专项脚本和生产验收。只扩展现有结构，不新建 CMS、数据库、抓取器、通用测试框架或定时任务。
- 不验：GSC 收录/排名、搜索量、外链、100–300 对比页、登录态旅程、Stripe、客户数据、生产环境。本地 PASS 不冒充生产 PASS。
- 资产与清理：只读公开来源和本地 HTTP；不创建账户、付款或客户数据；临时服务停止。
- 预算：开发 60 分钟检查点，独立 QA 30 分钟检查点。运行专用 inventory、typecheck、lint、Next build、OpenNext build和一轮定向 HTTP，不跑旧业务全量矩阵。
- 完成条件：固定候选提交、相关检查 PASS、独立 QA 对同 SHA PASS；无发布授权时停止在 RELEASE_READY。

## 模型选择

- 开发：GPT-6.1 Sol / high。原因：跨模型来源、价格地区口径、SEO互链和 Cloudflare 路由一致性，事实错误风险高；若官方来源冲突或需要数据库/账户变更，停止报告，不升级范围。
- 独立 QA：GPT-6.1 Sol / high。原因：必须独立核对固定 SHA 的官方来源、页面计数、互链反例与 OpenNext 路由回归；若来源不能支持页面事实，直接 FAIL，不修共享代码。

开发回传固定 SHA、差分、模型/价格/benchmark 来源、页面与互链清单、命令结果、限制和清理。QA 保留原始证据，不改运行时代码。

## 完成记录

- 首个候选 `71a9ae6fa310abc1b66ea37f2fc0579099c9844e` 因 BrowseComp 厂商结果缺报告日期和具体上下文策略被独立 QA 判 FAIL，原件完整保留。
- 修复候选 `008b64d97648436aa7fa45cac8514d3188e281a0` 只补 2026-02-12 报告日期、最近五轮与 discard-all 策略，独立复验 PASS。
- 用户于 2026-11-12 明确授权生产发布；release `d63cfe7bcb928c5ea6236913e936b0154e4dbf56` 已推送并部署。
- Cloudflare Version ID：`7fb2787c-52b1-4d73-89b7-603d81b4e9c8`。
- 独立生产验收 PASS：26 个 sitemap URL 全部 200；12 个模型页、4 个对比页、价格与 benchmark 互链、两个 best 页、privacy/legacy、Qwen alias 和完整旧路由矩阵均通过。
- 正式控制状态仍受历史 `JRN-04-FIX` `RELEASE_READY` 占槽，未手工改写。GSC、排名、外链、登录态、客户数据和 Stripe 未执行。
