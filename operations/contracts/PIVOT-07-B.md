# PIVOT-07-B：官方共同配置证据，既有对比内容第二阶段

2026-11-16 用户授权继续第二阶段：先核实官方基准，只补可比证据、不新增页面、不扩开发测试；文档、独立验收、提交推送与生产发布。基线 `20a105fc7ec64d758d3ef641658e21c7a07f1b7b`，工作树干净。历史 JRN-04-FIX RELEASE_READY 保留，真实交付索引记录在registry/backlog，不能手改正式状态或虚称CLI CLOSED。

## 核实结论及冻结输入

总控已读取 OpenAI GPT-5.2、Anthropic Opus4.5、Google Gemini3.1 官方发布报告及SWE-bench/Scale官方榜单。只收已确认共同配置的 SWE-bench Verified 记录：`https://www.swebench.com/` 内嵌 leaderboard-data 的 Verified 组，mini-SWE-agent 2.0.0，reasoning_effort high，Attempts 1，两个条目日期2026-02-17。Opus4.5 reported tag `claude-4-5-opus`，folder `20260217_mini-v2.0.0_claude-4-5-opus-high`，76.8%；GPT5.2 reported tag `gpt-5-2`，folder `20260217_mini-v2.0.0_gpt-5-2-high`，72.8%。保留原标签，不冒充精确日期API快照。官方页面说明 Verified500题、bash-only使用同mini环境。原记录 `checked:null`、`logs:null`，不能说本次逐轨迹复现或维护团队逐条检查。原始提取：`/private/tmp/pairvu-pivot07-b/official-swe-verified-extract.json`，完整官网HTML路径和sha256包含其中。

共同框架/版本、high名称和一次尝试支持该榜单设置下的并列，不证明两个厂商的high有相同token/算力。`https://www.swebench.com/post-250808-gpt5.html`（2025-08-08）的通用方法说明提及$3/250步；仅作为通用方法背景，不把旧文预算冒充2026两条记录已核验的逐条配置。`date`表述为leaderboard entry date，2026-11-16是采集日期，不当结果发表日。不能把OpenAI发布报告的SWE80.0或GPQA92.4等混进本框架。

Gemini3.1在本次 Verified 快照无匹配条目。SWE-bench Pro官方页对Gemini3.1标mini harness，Opus4.5/GPT5.2另有非mini配置/限制分组，不能拼同表；GPT5.2 Codex不是GPT5.2。GPQA厂商同名成绩没有足够共同设置证据，本阶段不收数。不得说Gemini未发布任何成绩，只说本次核查未建立共同配置的可比结果。上述排除是完成核实后的选择，不是自动补新数据的待办。

## 唯一运行时范围

仅 `lib/models/catalog.ts`（追加一个有界SWE Verified数据对象，不改现有模型/价格/比较列表/旧数据）、`app/benchmarks/page.tsx`、`app/compare/[slug]/page.tsx`。

- 基准总页现有URL增加锚点 `#swe-bench-verified`：测什么、500题、准确共同版本/effort/attempts、两条记录、原来源/模型标签/entry date/check date及配置边界；总数更新为3种基准，覆盖矩阵加一行，来源加入官方榜单/方法。无SWE新详情页，不强行凑5种基准。
- `/compare/claude-vs-gpt` 显示一张双模型单基准行并列表（76.8%与72.8%），链接基准总页锚点。每个成绩保留reported tag、folder/entry date可在邻接配置文字呈现，官方链接/采集日。结论限定该编码测试，不外推长文本、通用质量、速度或统计显著性，不追加第二条不匹配成绩。
- 来源内部checked/logs的null仅留证据和数据记录，用户文案用“Pairvu未复现/未逐轨迹核查”自然解释，不展示内部JSON字段。SWE块的一句测试限定结论之外，通用方法限制只保留页尾一处，不在表后再重复。
- 仅三核心slug（claude-vs-gpt/gpt-vs-gemini/claude-vs-gemini）合并重复通用免责声明为一处页尾方法说明；各厂商特定配置/局限、原事实表、价格、选型结论、TDK/canonical/模型与对比链接保留。Gemini两页不造双方数字；Related benchmarks 链接已有hub/新锚点并明确已覆盖哪一方及尚无匹配Gemini配置，取代已不正确的“neither exact version covered”。另13个对比页、含Haiku单独Cursor比较和三方页，输出保持不变。删去核心页重复旧exactPairQualityLimit引用时可保留catalog旧导出供历史，不能顺手重构。

文档由总控更新既有路线/registry/backlog、契约及最小原件索引；不触动阶段A榜单、ModelTable、prices/FX、模型页、路由清单、发布日期schema、GSC/定时任务/账户/API/DB/配置/依赖。不增加URL，仍45URL/17模型/16对比/2基准详情。

## 冻结验收与复用

必验：固定SHA完整差分仅三运行时文件；独立读原官方HTML中的两记录（只需已有原件，不重复官网抓取），核对实际行/模型名/76.8/72.8、v2.0.0/high/1/date/tag/folder、checked/logs null等边界；一次定向SSR覆盖hub与三核心对比，保留metadata/自指canonical/模型链接/价格，Gemini无匹配数且不说未发布；一处通用方法说明与有效hub锚点；样本对照未变Haiku页SSR（对基线），确保特定Cursor区块无回归。catalog其它导出/模型/比较/旧基准不变通过结构对比复用，不全站重跑。无新仓库测试/框架/服务，临时SSR探针与原件 `/private/tmp/pairvu-pivot07-b/`。

复用PIVOT-07-A `operations/evidence/PIVOT-07-A/production-original.json` release4637c6d对未变榜单/价格/45URL，以及PIVOT-05 stage2生产证据的未变路由/型号图。仅本次3运行时文件必要验证，唯一生产发布构建包含编译/类型门禁，不做额外本地build或独立全库typecheck/套件/全站HTTP矩阵。QA先验固定候选，发布后同QA只6HTTP：health、hub、三核心对比、sitemap；验证精确SHA/平台version、实际内容TDK/canonical、45唯一URL不变。无需逐个旧页或模型HTTP。

准备15/QA30分钟诊断阈值，构建/网络/审批单列；到点无新证据或环境等待即时报告，不无限重试/升级模型或加框架。无服务/账号/生产测试资产，必要原件保留、无清理阻塞即完成。新非阻断发现列后续，不扩本单元。

## 角色与交付

总控先完成官方取证/排除和冻结文档，负责Git/发布及归档。原阶段A开发与原独立QA配置同为GPT-6.1 Sol/medium，本轮重新评估：开发是结构明确的三文件局部数据/JSX渲染与slug隔离；QA需独立来源/固定SHA/有限SSR和6HTTP，常规有界审查足够。超过三文件/需要更多数据/推理实质不足时停止交总控缩域或记录升级理由；环境故障不自动升级。

优先续用 `/root/pivot07a_dev`、`/root/pivot07a_qa`，若现有工具不能重设续用模型，明确记录实际原medium配置，不能虚称修改成功。开发不Git写/push/deploy/权限请求，只交3文件diff、实际结果、可执行最小复验、原件路径和清理。QA只读应用、独立判断固定候选，原件先tmp，避免污染生产树；FAIL返原开发，原件保留。PASS后总控push/fresh精确远端核验、干净树、无迁移、同SHAdeploy；同QA接版本完成6HTTP。总控最后归档、更新文档并提交推送，文档归档不重复部署。下一步仅原既有只读观察自动继续；未核实/新页面/放量不自动开始。
