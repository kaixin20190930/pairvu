# UPG-10 价值指标最小契约

2026-10-12 用户授权本地开发、独立验收和必要返工；无本单元生产发布/启用授权。UPG-06 CLOSED满足依赖；UPG07真实样本缺失不阻塞本工具，不能因此宣称真实质量或客户价值已验证。

## 唯一目标
提供workspace内只读价值指标页/API，能够解释每个数字的纳入范围、分母、缺失和测试排除。最小范围为用量、冻结SKU使用、机器判定分布、人工决定覆盖/等待时间和检测估算成本。来源工作流单独标记single/batch；图片生成模型无可信字段时unknown，不能拿检测模型顶替。暂不做来源模型排行、ROI、节省时间或质量提升结论。

## 允许文件
lib/value-metrics/**、app/account/value-metrics/**、app/api/value-metrics/**、components/AccountWorkspaceNav.tsx；lib/cloudflare/bindings.ts及wrangler/cloudflare-env中默认关闭的VALUE_METRICS_ENABLED；必要只读analysis/batches/reviews辅助；新增migrations/0022_value_metrics*.sql（只增量、不修改原分析/审计/计费）；scripts/verify-value-metrics.*、scripts/value-metrics*、fixtures/value-metrics/**、package.json专项入口；docs/01-architecture/value-metrics-contract.md。总控独占operations和roadmap；QA只写/tmp，不修代码。不改旧判定、套餐、支付、生产配置开启状态或原始事件。

## 纳入与排除（核心门禁）
- 服务端session获得workspace；匿名拒绝、跨workspace不可见，客户端workspace/classification参数不能授权或扩大范围。默认功能关闭，页面/API/导航一致；no-store，不泄露用户/原始图片/审核文本。
- 仅从canonical analyses/batches/frozen snapshots/review events获取指标。客户端埋点可重复或伪造，不作为完成量、复用或价值分母，不新增依赖埋点的商业结论。
- 最小分类为business/test/unknown，默认unknown，只有受控、可审查、明确analysis+workspace身份的业务来源记录才business。不能根据生产环境、登录、非QA名字或缺少test标签推定business。测试/合成/内部QA/未验证历史unknown均从所有业务分子分母、分组、成本、时延剔除；展示排除数量/原因及分类覆盖，业务0不是“全部业务为0”。
- 实现明确可操作的分类材料及离线校验/导入准备入口：精确ID、workspace、分类、依据reference、核实者/核实时间，拒绝重复冲突、未知字段/无依据business和跨归属。可生成可审查本地迁移/导入方案，但不执行任何生产写入；不开放公共classification写API。本轮不为任何真实记录补造business标签。分类以每条analysis为最小粒度，不能整workspace放行混合测试数据。历史合成资产缺分类仍unknown排除。明确列出上线后受控分类操作及限制。
- 查询时间窗严格UTC起含止不含，有默认窗口及最大范围，按analysis created_at形成可复现cohort（完成/审计另明示截至时间）。计数每analysis一次，join/review多次/retry/client-event重复不放大；数据库读取一致性明确。有界查询超过预算必须拒绝/标记不完整且不输出完整比率，不能LIMIT截断后假装总体。参数异常、非法日期/数值、空集合和DB失败明确。

## 指标口径
在架构契约先写清公式/时间字段/单位/缺失语义，再实现：
1. 合格business cohort分析总量、completed/failed/pending数量；完成量去重；机器PASS/REVIEW/FAIL仅有效completed，未知verdict独列。REVIEW比例给分子和有效分母，空分母null。
2. 冻结SKU关联覆盖（有可信snapshot的completed/全部business completed）；复用单独定义为同一workspace+product+reference在不同analysis重复使用，明确窗口口径和首次使用不算复用。不把batch的每个item当用户多次主动复用，不夸大SKU复用：按distinct batch/workflow invocation计使用，首次与后续口径明确；无可靠单次workflow身份则不支持该复用指标。历史/当前改名归档不能改冻结分组。
3. 人审覆盖按存在有效审计的completed distinct analysis，当前approve/reject/revoke独列；首个有效approve/reject距analysis completed时间只叫“首次决定等待时间”，不等于人工实际耗时。异常/负时差排除并计缺失；后续revoke不抹去首次等待，当前状态不能当真值标签。无基线时节省时间=未评估。
4. 非负有限estimated_cost_usd为检测估算成本，显示已知金额和覆盖/缺失，非实际账单、收益或利润；不能null当0。尚无数据及低样本明确，不排名、不设商业目标已达成。
5. 所有UI/API有口径版本、窗口、生成时间、纳入/排除/缺失、质量/商业结论未验证说明；页面友好空态/错误态/窄屏。最小只读汇总，不做CSV付费绕过、新导出或外部发送。

## 验收预算
开发专项真实本地D1（隔离/tmp）、纯计算反例和真实组件；独立QA固定SHA检查并自行构造两workspace、混合business/test/unknown、伪造client事件/请求分类、重复审计/多个batch item、null/零/负数/未知/边界时间、分类文件冲突及归属、超预算、关闭开关、匿名、当前SKU改名/归档、空态/错误态/窄屏。QA必须独立确认排除影响全部指标及分母，不只读开发测试。typecheck、相关最小回归和一次必要build。无生产DB/外部模型/付款；合成fixture仅验证代码，不是真实价值证据。

## 角色/模型/停止
复用原开发01a12489-e94e-7bd3-afb2-6a2c90e70970：gpt-6.1-sol/high，理由是跨表指标口径、分类来源和租户隔离需联合推理，非最高模型。原独立QA01a1248d-0f67-7333-8dca-5c4696459457：gpt-6.1-sol/high，理由是需独立验证遗漏排除/重复分母/迁移及跨租户反例。升级条件：同类实质推理缺陷重复且缩域/明确契约仍不足才重评更高模型；环境故障不升级。范围不清先报告总控；开发可在架构文档明确契约内工程细节，不得放宽数据门禁。两次同类FAIL先诊断缩域。

## 回传和完成
开发回完整candidate SHA、diff、真实测试证据/局限；仅提交允许文件，不push/deploy。QA原件unitId/candidateSha/reviewerThreadId/result/checks含fixed candidate SHA和independent QA report，列独立反例及原始材料索引，只索引本轮新材料，勿递归包含整个repo。FAIL原角色返工保留原件。PASS正式RELEASE_READY，不CLOSED/不发布。总控持续wait_threads带cursor，完成read_thread立即推进；最终更新整体进度，下一步为获新授权后GitHub-first迁移/部署/启用/真实登录验收，真实价值仍需受控业务分类与实际使用；pairvu-2保持暂停。

## 本轮固定候选独立验收
用户处理审批后开发已交付3f6447c1c5e3af159ae86be3f7a413a31db1a169，QA重新评估选Sol/high：完整来源分类、DB隔离、原子导入、口径与组件跨层验收，开发原构建早于最后查询补强，需补固定SHA构建。环境故障不升级，失败仍原开发。

## 完成结果
2026-10-12：UPG-10价值指标已完成开发和固定SHA独立验收PASS，候选`3f6447c1c5e3af159ae86be3f7a413a31db1a169`，正式RELEASE_READY。24项独立D1/573请求、7项组件、固定候选源码build、typecheck/lint和相关回归通过；原始材料已归档。功能默认关闭，未推送/迁移/部署/启用，真实质量与商业价值仍未验证。生产仍UPG-06 da0e355；pairvu-2保持PAUSED。
开发已修复CLI的CJS/top-level await兼容及375px溢出；独立报告operations/evidence/UPG-10.json。无待返工产品缺陷，固定源码归档build成功但嵌入SHA unknown，后续生产必须重新从已推送提交构建。下一步依赖明确发布/启用授权，不自动部署；业务标签待真实来源核实。
