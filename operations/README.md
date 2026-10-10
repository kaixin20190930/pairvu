# Pairvu 自动开发与独立验收

状态：2026-10-10 首轮 AUTO-01 已独立验收通过并关闭；总控 heartbeat 已启用，每小时一次（中断恢复兜底）。用户要求参照 ai-best-tool 建立总控、开发和验收任务；本目录是该流程的持久状态与执行契约。

## 角色与范围

- 本对话为总控：维护升级计划、依赖、派单、回收结果、验收和发布记录。
- 每个交付单元只有一个开发和一个独立验收任务。开发是唯一应用代码写入者；验收不修代码、不提交、不部署。
- 首个系统建设单元使用同一项目目录，开发仅修改契约列出的工具文件，总控仅写方案、协议和任务台账。最终验收期间冻结候选文件。
- 当前用户授权产品升级方案、自动化开发和验证；没有授权改变价格、真实付款、外发客户消息、变更生产密钥、写生产数据库或生产部署。到 RELEASE_READY 自动暂停队列；当前单槽 CLI 不支持挂起待发布单元后继续派单。
- 既有 AGENTS.md 的先提交、推送、fetch 验证、迁移、部署、生产 smoke 顺序保持最高仓库约束。QA PASS 绝不自动等于生产上线。

## 派单七要素

每次创建或续派必须包含唯一目标、允许文件、禁止事项、可判定验收、测试预算、停止条件、固定回传格式。范围扩大须新建明确契约，不能借返工加功能。

默认只运行一对任务；无论 clientThreadId 还是正式 threadId 返回均占槽。创建结果未知时查现有任务和回传记录，不重建。开发修复和 QA 复验复用原任务。总控主动 wait_threads/read_thread 获取结果，用户不搬运输出。

## 状态与证据

交付状态：BACKLOG → SCOPED → DEV_ACTIVE → DEV_READY → QA_ACTIVE → QA_FAIL 或 QA_PASS → RELEASE_READY → DEPLOYED → PROD_VERIFIED → CLOSED。

离线工具/文档可从 QA_PASS 以明确的 local_only 完成标准 CLOSED；runtime 单元最多到 RELEASE_READY。QA_FAIL 回原开发，修改候选后旧 PASS 失效。生产证明必须独立记录远端 SHA、部署 SHA、平台版本、迁移和 smoke。

计划与依赖在 backlog.json；运行中 task IDs、候选 SHA、锁和事件在 .pairvu-control/，禁止存凭据、用户图片、个人信息。机器门禁不执行部署、不替用户批准、不将环境缺失记为 PASS。

## 增量验收

R：文档/离线材料做链接、结构、事实检查。C：运行时代码做专项与 typecheck；渲染/路由/构建改变时一次 build。H：认证、计费、数据迁移、外部 API 增加所有权负向、幂等、并发/回放、回滚和必要 build。D1 不照搬 Supabase RLS；以 workspace ownership 和实际迁移工具语义验收。

同一差分不机械重跑所有绿灯；QA 独立检查契约和关键反例。缺证据为 FAIL/BLOCKED；不把建议或历史无关缺陷升为候选阻断。连续两次同类失败或超过一小时无进展由总控缩小范围。

## 自动运行

总控在活跃开发/验收期间持续调用 wait_threads 回收结果，不能派单后结束等待。heartbeat 每小时检查一次，仅用于中断恢复；先回收活跃任务，再从已满足依赖且允许自动实施的队列选择一个最小单元。无变化、无人可做或同一阻塞时静默；首次实质阻塞、完成、失败或需要用户动作时通知。机器开机、桌面应用运行且项目可访问是本地调度前提。

每次触发最多一个新交付单元；不因轮询重复创建任务，不越过授权/需求/数据门槛。研发可用本地合成 fixture，但不得伪造客户、人工标注、真实 benchmark、支付或生产证据。

## 使用入口

`pnpm control help` 查看命令；`pnpm control status` 查看状态；`pnpm test:control` 执行离线门禁测试。总控指令见 [controller-prompt.md](controller-prompt.md)。任务快照初始化后不会自动读取 backlog 的后续修改，禁止删状态重建。当前工具只实现开发至离线完成/待发布，生产后半程是协议边界，尚无机器执行器。

参考 ai-best-tool 的唯一总控、七要素派单、独立固定 SHA 验收和返工复用机制；本项目使用 D1 和现有本地项目环境，没有照搬其模型配置、部署权限或数据库策略。

## 首轮结果

候选 `977eda5dfdb17c67cd411485fd1a48d95fd082c9`，开发专项 87 条 CLI 断言及 typecheck 通过；独立 QA 50 次调用和专项重放通过。重放为 80 条，差异来自并发 claim 胜者分支额外 7 条检查。证据见 [AUTO-01.json](evidence/AUTO-01.json)，包含原始 FAIL、接受的暂停边界及最终 PASS，不删除验收历史。CLI 已实际完成初始化、身份绑定、候选登记、QA 和 close；后续 UPG-02 已关闭，UPG-01 已到 RELEASE_READY，详见下方续交付记录。自动化 ID：pairvu-2，既有 Pairvu 外链任务未改动。

## 2026-10-10 状态回收修正

原问题：总控派单后只做 timeoutMs=0 快照就结束本轮，开发完成未立即进入 QA；四小时定时任务被误用为正常交接。修正为派单后持续 wait_threads → read_thread → 状态推进；使用游标并只等待当前角色，完成后自动安排 QA/返工/下一授权单元。小时巡检只兜底会话中断，不能替代活跃回收。验收证据以 UPG-02 和 UPG-01 实际连续交接记录为准。

## 连续交付结果（2026-10-10）

- UPG-02：候选 `1ec61a1f4f8f614fb78b33eff98c66ed5af4858e`，105 项开发检查、typecheck；独立 QA 发现 symlink 入口漏执行后返工，13 项增量复验通过。CLI 状态 CLOSED。真实数据质量评测不包含在内。
- UPG-01：候选 `83b3f2dab9f3df975b570d7eafb83e523abfcaa6`，49 项开发检查、typecheck、一次本地 build 与 health smoke；独立 QA 20 项检查通过。CLI 状态 RELEASE_READY。未推送、未运行真实 Cloudflare 构建、迁移、部署或生产 smoke。
- 证据及原始反例保存在 evidence/UPG-02-attempt-1.json、UPG-02.json、UPG-01.json 及对应 -raw.json。
- 回收机制验证：本轮主动取得已完成开发 → 派 QA → 收到 FAIL → 返原开发 → 固定新 SHA 复验 → 关闭 UPG-02 → 自动派 UPG-01 → 独立验收 → RELEASE_READY，无需用户手动搬运结果。中间本地 Git 权限审批正常保留，未绕过。
- 当前单槽待发布状态暂停后续研发派单。每小时恢复巡检遇相同状态不重复通知；另获发布授权后仍须满足 AGENTS.md，不能直接手改为 CLOSED。
