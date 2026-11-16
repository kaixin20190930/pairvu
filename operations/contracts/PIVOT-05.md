# PIVOT-05 两阶段精确事实与 Haiku 增量

2026-11-16 用户明确授权执行最终方案、分两阶段独立验收、提交推送发布生产、更新现有产品文档和定时任务。基线 e6e95fa。先完成阶段1的生产验收，再启动阶段2。历史 JRN-04-FIX RELEASE_READY 槽位保持原状；只在 registry 添加本单元事实，不手改正式 control 状态。

## 冻结范围

阶段1（43 URL / 16 模型 / 15 两两比较）：仅修四型号 DeepSeek-V3.2、Kimi K2.5、MiniMax M2.1、Qwen3.5-397B-A17B 的精确价格/可用性/来源；价格未知不推断仅权重，历史报价不当当前价，当前其他型号不套价。Qwen3.5 保留地区/上下文阶梯，沿用静态美元换算及原汇率日期；Qwen3-8B 已发现的 LoRA 定制部署价格条件一并补清，不新增报价服务。修 Gemini 3.1 Pro Preview 精确来源。/benchmarks 应用批准 TDK，完整说明现有两个基准，不凑第三个。claude-vs-gpt、gpt-vs-gemini、claude-vs-gemini 补精确版本质量证据/限制与支持的结论，无共同配置不放并列分数，不把其他版本分数套入。gpt-vs-gemini Title 使用 ChatGPT vs Gemini 并保留 Preview，H1 ChatGPT vs Gemini，正文限定指定模型而非订阅产品。修同范围过期型号数量文案和实际 lastmod。

阶段2（45 URL / 17 模型 / 16 两两比较）：只加 /models/claude-haiku-5-5 和 /compare/claude-haiku-5-5-vs-claude-opus-5-5。模型页 TDK 按批准方案；比较 Title 为 Claude Haiku 5.5 vs Opus 5.5: Pricing, Context and Benchmarks，H1 Claude Haiku 5.5 vs Opus 5.5。官方 model ID/发布日期/1M 上下文/价格分档/可用性需来源。CursorBench 4.0 可增加 Haiku Max 一行，与既有 Opus Max 同配置展示；保留运行成本、日期和 harness 限制，不造速度数据。新两页、Opus 和现有目录互链，Anthropic 家族仅合理复用既有页，不加其他比较或基准。

允许文件：lib/models/catalog.ts、app/models/[slug]/page.tsx、app/compare/[slug]/page.tsx、app/benchmarks/page.tsx、app/benchmarks/[bench]/page.tsx、app/sitemap.ts、app/page.tsx（仅此次数据更新日期）、必要现有专项脚本、docs/PAIRVU_MODEL_CONTENT_ROADMAP.md；确有渲染需要时可改现有 llm-pricing/leaderboard 页面。总控独占契约、registry/backlog、监控更新和发布归档；开发不覆盖这些文件。

## 产品边界

单英文、有来源的模型比较出版站；不做 API 聚合、付费墙、CMS、采集系统、实时汇率、模型实测、通用总分、批量页面、任意N模型比较。无来源不造数字，不将缺价解释为免费/仅权重；访问日期是真实核查日期，区别结果发表日/采集日。价格表单位统一 USD/M，保留原币和换算日期/地域/模式/阶梯。不改旧 URL/canonical；不改账户、Stripe、API、DB、客户数据；不执行 GSC 写操作或新建重复监控。本轮新增上限2 URL；17模型且无新鲜批次GSC证据时不得放量。

## 冻结验收、复用与完成条件

每阶段：固定候选SHA完整diff；官方来源支持新事实；实际页面200、唯一Title/H1、自指canonical；实际sitemap数量正确、无旧目录、无孤立模型；阶段1精确查 TDK/三个比较限制与旧型号错配反例；阶段2精确查 Haiku 条件价格、同Max配置与双方/目录反链。复用 PIVOT-04 未变的旧路由完整矩阵、账户/业务证据，不重测；仅定向检查 /guides 双形态410、/examples 单跳301到/、/checks 单跳301到/leaderboard、未知404、health200。不得将未执行检查写 PASS。

复用现有 test:model-pivot、typecheck；每阶段开发必要一次本地构建/HTTP，QA复用未变构建并独立检查差分/关键反例，不新增测试框架；生产发布脚本按推送SHA再构建。若专项检查因批准数量/文案改变需要最小调整，修改原脚本不另建框架。准备15分钟、开发60分钟、QA30分钟诊断检查点；构建/网络等待单列；同法一次合法重试后停止盲重试。服务停止，不造测试账户/生产资产，无迁移。

开发 GPT-6.1 Sol/high：跨官网价格与型号、harness和共享渲染需精确事实推理；缺来源则降级表述，不建采集器，不因环境问题升级。独立QA GPT-6.1 Sol/high：固定SHA独立核对事实/条件价格/错配反例及生产版本；事实不足直接FAIL，不改应用；升级仅在重复实质推理缺口后重评。总控沿用当前模型。角色配置和证据记录于 registry。

开发一次交付 commit SHA、差分、来源核查记录、实际命令结果、最小复验/清理步骤。独立QA保留原始报告；FAIL返原开发，PASS后总控提交证据、push、fetch核验精确SHA且树干净、deploy同一提交、原QA定向生产验收。只读独立验收不得修改共享应用。阶段生产证据完成即关本阶段，不扩样本。

## 既有观察任务

只更新 pairvu-2（周一09:30）、pairvu-gsc（周三10:00）、pairvu-3（月1日10:30），保留 qwen4-preview（11月26日09:00）既有提醒及到期一次性边界，时区 Asia/Shanghai。周检补价格分档/旧API可用性/来源跳转后精确型号、两基准覆盖；GSC仅新增阶段2这两个URL为独立上线批次，阶段1旧页不重置首次上线时间。11月16日已有GSC域资源所有者权限与sitemap提交对话框成功证据，但11月9日旧索引报表不能算新43/45页收录率，逐URL查询仍PARTIAL；无新数据如实BLOCKED，不重放已提交操作。观察只读报告/待办，不自动开发或发布。所有门槛未同时满足时不放量。
