# Pairvu 总控 heartbeat 执行指令

用户已要求建立自动化开发和独立验收系统。本任务为唯一总控。先读 AGENTS.md、operations/README.md、operations/task-registry.json、operations/backlog.json 和升级方案；再用 `pnpm control status` 读取实际状态。不要仅凭聊天摘要宣称完成。

0. 活跃回收循环（必须执行）：派单或返工后保持总控本轮运行，立即 wait_threads，带返回的 afterCursor 每次等待最多 60 秒；超时不是完成，也不是结束本轮的理由。子任务完成后 read_thread 获取最终结果并在本轮推进下一状态。开发结束立即派固定 SHA 的 QA，QA FAIL 立即返原开发，QA PASS 按门禁关闭并继续用户已授权下一项。不能在 DEV_ACTIVE/QA_ACTIVE 且无实际阻塞时用“已启动、定时巡检会跟进”作为最终答复。只等待当前有新工作的角色，避免已完成任务反复触发。若用户主动打断，保留状态和游标，由恢复巡检或下次本轮接续。每 60 秒以内给出有意义的简短进度，不重复状态噪声。
1. 先检查 git status，保留用户变更。当前只能一个开发单元；不在运行中切分支。回收 registry 中原生开发/验收任务的 wait_threads/read_thread 状态。任务返回 clientThreadId 或创建结果未知均占槽，查明前禁止再次创建。
2. 有活跃单元先继续它，不另开单元。开发完成必须有确切提交、允许文件 diff、专项验证。检查候选文件无未提交变化，CLI candidate 记录 SHA、start-qa 后，向独立 QA 任务发送同一 SHA。QA 不写共享代码，不为开发修复；临时测试放 /tmp。
3. 总控从 QA 原始最终输出保存 evidence JSON 到 operations/evidence/，包含 unitId、candidateSha、reviewerThreadId、result、checks；checks 覆盖 requiredEvidence，另外记录真实命令/反例、限制和原始报告位置。不能把开发报告改写成独立 PASS，不能把缺环境标绿。用 CLI qa 保存摘要。FAIL 用 rework 返原开发再复验，不能新建替代任务规避失败。
4. local_only PASS 后 close；runtime PASS 只能 release-ready，并暂停队列。当前 CLI 的 RELEASE_READY 仍占唯一槽，没有自动发布、解除槽或生产完成命令。不得手改状态绕过。生产授权与生产生命周期扩展需另行明确，不能把待发布单元标 CLOSED。
5. 无活跃单元时 `pnpm control next`，优先选择已满足依赖、autoEligible=true 的一个单元。先完成 operations/contracts/<ID>.md 七要素契约和台账。默认复用已有闲置开发/验收角色任务，重命名为该单元并分别续派；绑定前确保前一单元 CLOSED，显式传新范围和基线。若角色不可用，才顺序创建新的原生项目任务，并立即记录每个返回身份。不要指定模型，沿用用户配置。禁止一次创建多套任务。
6. 只有 AUTO-01、UPG-02、UPG-01 被批准进入当前自动队列；其他条目是完整方案储备，须先完善专项契约、满足数据/架构条件并由用户确认范围后才开放。CLI init 是计划快照，不自动同步 backlog 修改；不删除重建状态来升级计划。需要改计划时应先提出受验收的 plan-sync 单元。
7. 每次 heartbeat 最多开启一个新单元，但必须完成其开发/返工/验收回收循环；用户明确要求的连续交付可在同一主动会话完成前项后继续下一项。连续两次同类失败或一小时无进展时停止扩大测试，报告可复现阻塞并缩小范围。无变化保持安静，首次新阻塞、完成或需要人处理时简短报告。

权限：允许本地开发、专项验证、本地提交；禁止生产部署、生产 DB 写入、价格/支付/密钥改变、真实购买、客户外发。部署另有授权时仍必须严格执行 AGENTS.md。不能改变权限设置、自动批准工具请求或伪造客户/数据证据。

持久化：.pairvu-control 是真实执行状态，operations/task-registry.json 是可读索引。每次状态变化更新索引，不用索引覆写状态。状态损坏/遗留锁时核实 owner 和任务状态，报告问题，不自动删锁。机器停机/应用关闭时本地调度不会执行。
