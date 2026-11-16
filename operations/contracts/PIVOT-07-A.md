# PIVOT-07-A：第一阶段，现有榜单成绩与未知价格行溯源

2026-11-16 用户授权仅执行第一阶段：不新增页面，记录计划与产品边界，独立验收后提交、推送并发布生产。基线 `8e741238bdcb60a221ef521aaa163010c5162d5e`，完整工作树干净。历史 JRN-04-FIX RELEASE_READY 保留，不手改正式控制状态；本单元用既有 backlog/registry 记录实际交付与证据，不虚称正式 CLOSED。

## 冻结运行时范围

仅 `app/leaderboard/page.tsx` 与 `components/ModelTable.tsx`。

1. 榜单以现有 catalog 数据展示 CursorBench 4.0 四行与 BrowseComp 六行；总共十条配置成绩，不声称十个独立模型。两个基准各一个表，BrowseComp 表内明确分开四条 2025 owner baseline 与两条 2026 Z.ai vendor report，不混排、不合成总分。每行含精确模型/配置、原分数、来源链接及实际核查日期；已有发布日期可展示，无单条发布日期就明确未知，不用 snapshot/accessed 冒充 publication。保留原模型规格矩阵、已有入口及方法限制，成绩放在规格前面。
2. Title 基础值 `LLM Benchmark Leaderboards: Scores and Model Specs`（沿用全站 Pairvu 后缀），H1 `LLM benchmark leaderboards`，Description 准确反映按测试/配置分组的来源成绩。canonical 保持 `/leaderboard`。
3. 共享 ModelTable 只为 DeepSeek-V3.2、Kimi K2.5、MiniMax M2.1 的未知精确报价增加行内官方价格链接与 checked/accessed 日期，取自当前 quote。原 unknown/not free、可用性和生命周期说明、USD/FX、数字价行与其它自托管行不改。不得把未知价格改成免费、无官方 API 或权重独占。共享渲染自然影响已有价格/模型目录/首页/best 表格，不单独改这些页。

总控更新既有产品路线文档、backlog/registry 及本契约和最小证据。catalog、所有路由清单/日期/分数、比较页、基准详情/总页、GSC、自动任务均不变。

## 验收、复用、排除、收尾

必验：固定候选 SHA 实际差分仅两处运行时文件；独立 SSR 榜单显示十条真实成绩及两类基准/BrowseComp 两组、来源/日期/配置准确、无总体名次和总分、TDK/自指 canonical 正确、保留17行模型规格；SSR 价格页验证三条 unknown/not free 及各官方链接/原日期，普通数字价格与汇率没有被改；未新增内部不存在的模型链接。必要的临时 SSR 探针只存 `/private/tmp/pairvu-pivot07-a/`，不是新增仓库测试或框架。QA独立检查候选与关键反例，不照抄开发 PASS。

复用 PIVOT-05 stage-2 production QA（`operations/evidence/PIVOT-05/production-2026-11-16/stage-2-production-qa.json`，release c389517）及 PIVOT-06-COPY production-original（release c225006）对未变 catalog/路由/配置/依赖的证据；目录不变故不重跑全站/旧路由矩阵/全库专项测试/额外本地构建或独立全库 typecheck。唯一发布构建仍验证精确已推送 SHA，包含编译与类型门禁。生产仅 health、leaderboard、llm-pricing、sitemap 四个 HTTP：精确 release SHA/平台版本、实际分组分数和三条行内来源、45条URL且无新增。QA原件先保存在 tmp，避免污染部署树；发布后原样归档。

不验/不做：第二阶段新增基准数据与比较页改写、模型/新页面/批量生成、发布日期schema修复、样式/排序/筛选、账号/API/Stripe/客户数据/DB迁移、GSC和自动化写操作、外链发送、新测试设施。保留所有旧 FAIL/诊断原件。

准备15分钟、QA30分钟是诊断检查点，构建/网络/审批另计。到点无新证据或遇权限等待即时交总控，不反复同法重试、绕权限或扩测试。无本地服务/账号/生产测试资产，结束确认无遗留。必验通过且清理完成即停。

## 角色与连续交付

总控沿用当前配置，维护文档、候选/推送/远端核验/发布和证据归档。开发 GPT-6.1 Sol / medium：需理解 JSX 与共享渲染条件、区分证据组和日期，常规局部开发；超两文件或需新数据时停止交总控，不自动扩大。独立 QA GPT-6.1 Sol / medium：固定 SHA 差分、独立 SSR 与四条生产核验，常规有界审查；真实事实/分组/状态丢失则 FAIL 返原开发，环境问题不升级模型。

开发不执行 Git 写、push/deploy 或权限请求，只交两文件变更和 tmp 开发报告、SSR命令/原件、清理状态。总控形成固定候选；QA一次连续完成候选验收，将原件存 tmp，不改应用。PASS后总控 push、fresh fetch 精确核对远端与干净树，部署同 SHA（无迁移）。同一 QA 收到实际版本后完成上述四条生产验收。总控最后一次归档原件、文档/台账并提交推送；仅证据文档不重复部署。

完成条件分别记录实现、独立候选验收、实际部署、公开启用及独立生产验收。下一步既有只读观察自动运行；第二阶段需独立授权和新增官方同口径证据，不随本单元自动开始。
