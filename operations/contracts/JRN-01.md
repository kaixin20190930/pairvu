# JRN-01 核心生产旅程补验：清单与可执行范围

## 目标与完成语义
用户于2026-10-12授权最小契约、核心旅程补验、开发修复与独立复验；缺账号/付费授权明确列出并先推进不受阻塞项。单元交付为可追溯的验收清单、当轮可执行验证与缺口报告，mode=local_only指没有应用发布，不代表只观察本地。CLOSED仅代表本清单/报告交付已独立核验，不代表所有生产旅程PASS。真实生产基线a0b27ac7b5432e9482ffbe50e5ea0f43be18680c / Worker 3e8dc987-8ec4-4f59-9950-5beebcfb4494。

## 最小清单
每条记录ID、真实环境、前置、步骤、预期、实际、状态PASS/FAIL/BLOCKED/NOT_RUN、证据与SHA/平台版本；本地/历史/本轮生产结果分开。
1. 来源与匿名门禁：当前SHA/version；账户、SKU、分析、人审、工作台、指标与导出受保护；匿名响应不泄漏用户数据。
2. 当前真实账号：计划/余额/历史合成分析前后对照；导航、空态/错误与筛选恢复。
3. 多SKU与冻结：现有明确QA SKU/版本/批次关联及改名归档不改旧快照；可用独立QA草稿做可逆操作，不调用模型或消耗额度。没有可核对旧快照的组合则该部分BLOCKED，不拿本地代替。
4. 人审→发布资格：对既有明确合成分析，必要最小approve/reject/revoke追加审计（理由明确JRN-01 QA），证明机器证据不变、缺失/高危不因approve误eligible；结束恢复先前决定语义，新增审计不伪称不存在。正向完整ELIGIBLE缺合格分析则BLOCKED，不伪造机器证据。
5. 导出：匿名拒绝、Free UI门禁；可用真实UI导出链接观察登录HTTP拒绝，不能使用浏览器脚本发网络请求/抽取cookie/session。缺可观察HTTP路径则BLOCKED；paid正向需真实付费账号，不伪造套餐。
6. 素材生命周期：现有合成素材可用/到期显示及保留规则；本地验证删除/过期后访问拒绝、审计保留，生产永久删除需明确资产与工具规定的最终交接/确认，否则列BLOCKED。
7. 双账号隔离：本地真实D1双workspace读写/导出边界；生产必须两个真实不同workspace账号，缺第二账号明确BLOCKED。
8. 计费及指标：测试/unknown排除、额度不因只读操作改变；真实付款/加量包/portal写操作没有授权，不执行。

## 开发范围与预算
原开发只写docs/05-evaluation/core-production-journey-acceptance.md与必要fixtures/core-production-journey/**，真实自测放/tmp。先核对既有代码/路由和测试，给出可操作清单与最小本地回归（优先workspace-analysis、retention、release-workbench；其他仅新缺口驱动）。不为凑数重复整套历史测试，不无故新增校验器。不改应用实现、版本开关、凭据、生产DB，不push/deploy。发现实质产品缺陷先回报精确复现；总控将开明确runtime修复单元，复用原开发并固定新SHA独立复验，最多RELEASE_READY，生产发布须明确授权。文档错误在本单元修正。开发提交上述允许文件，回完整SHA/命令/证据。

## 生产与独立QA范围
原QA只写/tmp；通过CUA真实登录/UI，公开无凭据HTTP请求可用curl。不得读任何.env/.dev.vars/令牌、原泄露日志，不取cookie、token，不直接远端D1；需要DB补证由总控另定最小查询。只使用现有已明确QA资产：product 8e023cd4-16b4-4e77-a957-238e7253947f、analysis batch-analysis-d79c71c7-417e-4ce9-8601-3353185d2001、batch 9e24fe37-4e56-4fad-8edd-b4589bbcb698；先验证当前归属和合成标识。不触真实客户资产。无新模型调用、付款、外发、权限伪造、秘密读取或部署。用户未提供会话时先做匿名/本地项目，保留阻塞。

## 模型与角色
开发gpt-6.1-sol/medium：以已有实现为依据整理精确场景和有限回归，范围清楚；出现跨模块鉴权/计费/并发缺陷后转修复单重新评估high。独立QA gpt-6.1-sol/high：生产身份、不可变快照、人审资格与权限边界跨层核对，需独立证据；环境或账号缺失不升级，只有同类实质推理缺口重复且缩域后仍不足才评估更高模型。两角色复用原身份不创建副本。

## 固定回传与总控
QA结构含unitId,candidateSha,reviewerThreadId,result,checks（fixed candidate SHA、independent QA report、available scope completed、blocked coverage explicitly documented）；报告总结果只针对已定义清单交付。独立coverage逐条保留FAIL/BLOCKED，overallProductionJourney=INCOMPLETE只要有生产缺口；不把证据报告PASS写成整体生产PASS。遇可修产品FAIL先返开发修复；报告不得掩盖未解决FAIL后关闭。总控wait_threads/afterCursor持续回收，完成立即read_thread，原FAIL保留。正式CLI推进，禁止手改control；pairvu-2继续PAUSED。最终更新整体进度、缺口及下一步自动或需用户输入。

## 独立FAIL后的明确修复范围
2026-10-12 A阶段独立FAIL已正式导入并rework，原报告operations/evidence/JRN-01/stage-a/stage-a-review.json。运行时最小修复严格按JRN-01-EXPORT-FIX.md，复用原角色；这是本轮发现失败的明确修复契约，不扩大功能。JRN-01仍为旅程交付跟踪，不因本地修复PASS就close；生产原FAIL持续开放，直至另获发布授权并实际复验。B真实登录仍需用户完成。
