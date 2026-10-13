# JRN-03 跨账号写入隔离与完整 ELIGIBLE 正向补验

## 唯一目标与授权
2026-10-13 用户授权启动本单元，明确最小契约、合成资产和操作范围，总控持续开发/独立验收，失败返原开发修复；禁止真实扣款或修改真实客户数据。交付为可重放的隔离本地验收工具、固定SHA独立证据和覆盖说明，mode local_only。不是生产验收、真实模型质量评测或外部商品发布。

## 环境与合成资产
全新临时Miniflare/workerd D1/R2，应用实际迁移和固定源码，无生产绑定；loopback仅本机、随机端口或专用空闲端口。拒绝任何非loopback网络调用，邮件只本地捕获；不得读取.dev.vars/.env或既有Stripe输入，不运行Stripe、Cloudflare远程CLI、模型、外部邮件/客户消息或生产浏览器写入。CLI子进程环境只必要白名单。
生成A/B两套明确JRN-03合成身份（example.test），通过实际Better Auth魔法链接签发、捕获、验证和cookie建立两个独立workspace；不能stub resolveRequestAccess、auth或workspace repository。
资产清单记录runId、A/B所属workspace、产品/SKU、profile/reference版本、参考与候选图片、analysis/batch/item/review等；图片/分析结果均标记synthetic，fresh本地R2可读取的图片，禁止复制生产DB、session或客户资产。付费权限不需要，两个账户均Free。
六项机器观察、匹配原始asset IDs的区域/identity guard、支持的版本/model-call字段为明确合成输入，经真实风险计算和persistCompletedAnalysis保存；syntheticMachineEvidence=true、qualityEvidence=false、modelCallsExecuted=0。不得将合成model-call记录冒充真实模型调用。

## 最小可判定矩阵
1. 安全前置/真实登录：两账号不同workspace，真实session有效，匿名被拒绝；出站阻断、仅临时本地存储，测试结束进程停止。建立资产及操作清单。
2. 产品写入：实际products create/profile PUT/lifecycle PATCH/reference POST路由。本人成功后，对另一账号确实存在且可正常修改的产品发起同样合法请求，双向A→B/B→A验证拒绝。包含自有产品引用外部referenceAsset反例、伪造workspaceId/actor字段不能扩大权限；如果正式schema拒绝未知字段，单独覆盖合法body的外部ID请求避免仅测schema。跨账号拒绝前后核对产品revision、profile/reference版本、mutation journal和引用绑定均不变。
3. 审核写入：真实reviews POST执行approve/reject/revoke。本人正向可写；双向跨账号对确实存在completed分析请求应拒绝，不追加审核事件、不改变head/source snapshot，匿名也拒绝。不要把无效body或不存在目标当所有权证据。replay/expectedRevision冲突不得重复写或覆盖别人状态。
4. 批次写入：实际PATCH cancel/retry，对另一账号确实存在queued/failed的batch/item双向拒绝（保留正式契约404/409语义，不要求统一状态码），DB批次/项/额度ledger/reservation前后不变，queue enqueue次数0。本人cancel或本地retry证明目标有效，队列仅本地捕获不执行模型；不调用DELETE或清理生产资产。
5. 完整正向：A自有真实版本化SKU+reference绑定、冻结analysis/batch快照、六项完整可观察match、受支持来源和区域schema、可用图片、无limitations、高危issue为0；实际release GET初始needs_review，真实review POST approve后实际release GET/filter eligible返回同一analysis eligible且理由complete_source_approved、policy/hash/冻结SKU版本及machine/source/hash一致。至少一条完整源绑定路径，不能直接写eligibility或review head伪造成功。
6. 反例/恢复：批准不能绕过缺失机器证据/图片不可用/高危差异/源变更；撤销后needs_review（无其他阻断时），重新批准可恢复eligible；更新当前SKU不改已冻结analysis快照或旧来源。不篡改同一正向原件，破坏性反例仅隔离副本fixture，准确标记注入层。机器结果、原始hash和审核审计各自保留。B工作台不能看到A eligible行，伪造筛选参数不能扩大范围。
7. 可见结果：本地实际发布工作台组件显示机器/人工/资格分离和ELIGIBLE正向，至少一次独立组件/UI核对；若使用组件fixture transport，明确其层级，不冒充生产浏览器E2E。浏览器只用CUA，禁止自建Playwright/CDP。后端身份/状态结论必须由真实路由+D1支持。

## 允许文件与禁止事项
开发唯一写入scripts/jrn03-*.ts|mjs、fixtures/journey-write-eligibility/**、docs/05-evaluation/write-isolation-eligibility-acceptance.md，以及package.json仅必要测试入口；可读取复用既有测试helper，禁止修改JRN02冻结文件。总控写operations/进度文档；QA仅/tmp，不修应用或提交。先不改app/lib/migrations/wrangler/auth配置；如实际运行时缺陷出现，回报最小复现和所需准确文件，总控在既有修复授权内另定最小修复及发布边界，不能偷偷放宽规则或削弱断言。没有生产发布授权，不部署/启用新增运行时修复。

## 模型、测试预算与停止条件
开发 gpt-6-sol/high：实际会话、跨workspace写入事务、审核来源及完整SKU/区域/规则链路需较深推理，已有可用Sol能承担，不为此默认最高档。独立QA gpt-6-sol/high：重新设计有效目标负向和不变性快照、确认合成层/真实处理层，独立性不降级。具体重复推理缺口先缩域，再评估更强模型；权限/环境问题不升级。
优先局部实际handler专项、typecheck、改动lint、一次针对实际组件的UI核对；无生产runtime差分无需全站build，不重复既有所有绿灯。失败继续定位修复，只验改动及相关反例；连续两次同因或一小时无进展先缩域报告。缺能力或环境如实BLOCKED，不伪造PASS。禁止真实付款、模型收费、真实客户数据和外部发布。

## 回传与完成
开发回完整candidateSha、文件范围、原始报告/失败记录、启动/停止方式、真实handler/认证/存储与fixture替代层、每项结果及限制。固定SHA候选后冻结文件，独立QA回unitId/candidateSha/reviewerThreadId/result/checks，requiredEvidence原名：fixed candidate SHA、independent QA report、isolated authenticated environment、cross-account write isolation、complete eligible journey、cleanup and coverage boundaries。先read_thread回收再正式CLI；FAIL返原开发，不重复创建角色。本地PASS正式close并更新总体进度；始终保留productionWriteIsolationCovered=false、productionEligibleCovered=false、qualityEvidence=false，除非另有真实证据。下一步列明生产覆盖、生命周期/真实样本等剩余条件；不自动启动其他功能或恢复pairvu-2。
