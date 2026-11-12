# PIVOT-03 证据化内容网络与产品边界

## 目标与授权

2026-11-12 用户授权严格按已确认方案实施优化、新增页面、产品文档和定期观察任务，并明确不要过度开发和测试。本单元把现有模型目录修成可核验、可互链的内容网络；只发布有官方或基准所有者证据的事实，不用不可比数据填表。

用户已授权按仓库 Production Deployment Rule 发布生产。本单元仍必须先固定候选、独立验收、提交并推送、远端精确 SHA 核验，再从同一 SHA 部署和生产抽测。GSC 后台写入不在代码发布范围；自动任务只提醒并生成检查报告，不伪造无连接的 GSC 数据。

## 冻结范围

- `/best/open-source-models` 的 Title、H1、首段与候选可达性；Qwen3.5 仅在官方资料完整时建档，否则榜单按真实数量表述。
- `/llm-pricing` 以单一、注明来源和日期的汇率快照把 CNY 托管价换算为主要 USD 展示，同时保留 CNY 原价；DeepSeek-V3.2、Kimi K2.5、MiniMax M2.1 只写精确型号官方价或明确的“未发布当前型号专属托管价”。
- `/compare/fable-5-2-vs-opus` 来源去重、搜索词序、comparison/benchmark 链接分区；`/compare/claude-vs-gpt` 只增加同一 harness 可比证据，找不到则明确不可比，禁止伪造质量结论。
- 新增 `/compare/qwen3-8-27b-vs-glm-5`、`/compare/qwen3-8-27b-vs-qwen3-8b`。无同一来源共同分数时明确没有直接可比成绩。
- 在 2026-11-25 官方预览结束前成对新增 `/models/qwen-4-max-preview` 与 `/compare/qwen-4-max-preview-vs-gpt-5-2`；显著写明限时预览、Token Plan、无按量价和退役日期。不能成对完成则两页都不发布。
- 新增 `/benchmarks` 总页并让 Header、Footer、首页入口指向总页；保留具体 benchmark 页。
- 新增 `/compare/chatgpt-vs-claude-vs-gemini` 三方页，仅实现固定三列页面，不扩为任意 N 模型系统。
- 新增 `/compare/deepseek-vs-chatgpt`，正文明确实际比较的模型版本。
- 审计所有已发布模型的实际 comparison 入链；本单元只补上述明确页面，不为达成数量批量生成组合。未覆盖项记录为后续缺口。
- 更新 sitemap、必要 metadata、内部链接、产品路线与数据治理文档；记录模型不少于 20、每个模型至少一个合理 comparison 入链、分批 GSC 收录率不少于 80% 且无集中 canonical/soft-404 问题才允许放量。

## 明确禁止

- 不建 CMS、数据库、爬虫、实时汇率、实时排名、通用评分、任意多模型比较器或新的测试框架。
- 不批量生成 100–300 个对比页，不为了“每页有分数”混用 benchmark 版本、厂商自测和不同 harness。
- 不用后继型号价格代替 DeepSeek-V3.2、Kimi K2.5、MiniMax M2.1；“没有公开型号价”不等于免费。
- 不创建反向重复 URL；canonical 保持一条。
- 不改旧站 124×410、6×301、privacy/legacy、账户、Stripe、API 或客户数据。
- 不把 GSC 提交、收录、排名或搜索量写成已验证结果。

## 验收清单

- 必验页面：所有修改页及明确新增页为 200，唯一 Title/H1/self-canonical；Qwen4 两页要么同时存在，要么同时不存在。
- 必验数据：USD 换算显示汇率来源/日期和 CNY 原价；三项历史型号的价格状态由精确官方来源支持；Qwen4 显示 2026-11-25 预览边界和无按量价格。
- 必验证据：直接比较分数必须同一来源、版本和 harness 同时覆盖双方；否则页面明确“无直接可比成绩”。来源列表按 URL 去重。
- 必验互链：新增 comparison 链回参与模型；对应模型页出现反链；More comparisons 只含 comparison，Related benchmarks 单列；`/benchmarks` 可达两个具体 benchmark。
- 必验产品边界：路线文档包含产品定位、数据证据规则、规模化门槛、Qwen4 生命周期和观察节奏。
- 回归：旧状态矩阵不变；未知路径 404；健康接口 200；sitemap 无旧目录并包含实际新增页。
- 复用：PIVOT-02 页面模板、source 结构、现有 inventory/typecheck/build/HTTP 检查。只跑定向检查与一次构建，不跑旧业务全量矩阵。
- 不验：GSC 实际后台数据、排名结果、外链、登录态、付款、客户数据。未连接 GSC 时报告 BLOCKED/待人工输入，不写 PASS。
- 资产与清理：只读公开官方来源和本地/生产 HTTP；无测试账户、付款或客户资产。
- 预算：开发 90 分钟检查点，独立 QA 35 分钟检查点；来源冲突或无法支持精确事实时删减事实，不扩建采集系统。
- 完成条件：固定候选 SHA、差分相关检查 PASS、独立 QA 同 SHA PASS、GitHub-first 同 SHA 发布、定向生产验收 PASS、自动提醒任务创建并可见。

## 模型选择

- 开发：GPT-6.1 Sol / high。常规 Next.js 内容开发，但跨模型官方来源、货币换算和多类页面互链存在事实一致性风险。若精确型号资料不可得，降级表述或停止该项，不升级架构。
- 独立 QA：GPT-6.1 Sol / high。需独立核对固定 SHA 的来源、不可比反例、互链和发布边界；发现事实不受来源支持直接 FAIL，不修共享代码。

## 自动观察计划

- 每周一 09:30（Asia/Shanghai）：内容与来源健康检查。检查官方价格/型号可用性、Qwen4 生命周期、断链、孤立模型、sitemap/状态码，输出变化摘要和待办。
- 每周三 10:00：GSC 周报提醒。读取可用 GSC 数据；按首发批次与新增批次分别报告提交/收录/抓取/canonical/soft-404/曝光。无连接时明确提醒人工导出，不猜数据。
- 每月 1 日 10:30：产品与放量门槛复盘。报告模型数、每模型 comparison 覆盖、内容陈旧度、页面批次收录率与是否满足放量门槛；未全部满足时结论固定为“不放量”。
- 2026-11-25 09:00：Qwen4 Preview 到期专项检查，更新 availability 为 retired preview，并检查是否应从当前榜单降级；不删除历史页。

## 正式状态说明

历史 `JRN-04-FIX` 保持 RELEASE_READY/PARTIAL，正式 CLI 当前不能安全认领新单元。本单元不得为释放槽位篡改或伪造旧单元状态；在 `task-registry.json` 记录合同、角色、固定 SHA、独立证据和生产结果。
