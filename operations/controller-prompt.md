# Pairvu 总控 heartbeat 执行指令

用户已要求建立自动化开发和独立验收系统。本任务为唯一总控。先读 AGENTS.md、operations/README.md、operations/task-registry.json、operations/backlog.json 和升级方案；再用 `pnpm control status` 读取实际状态。不要仅凭聊天摘要宣称完成。

0. 活跃回收循环（必须执行）：派单或返工后保持总控本轮运行，立即 wait_threads，带返回的 afterCursor 每次等待最多 60 秒；超时不是完成，也不是结束本轮的理由。子任务完成后 read_thread 获取最终结果并在本轮推进下一状态。开发结束立即派固定 SHA 的 QA，QA FAIL 立即返原开发，QA PASS 按门禁关闭并继续用户已授权下一项。不能在 DEV_ACTIVE/QA_ACTIVE 且无实际阻塞时用“已启动、定时巡检会跟进”作为最终答复。只等待当前有新工作的角色，避免已完成任务反复触发。若用户主动打断，保留状态和游标，由恢复巡检或下次本轮接续。每 60 秒以内给出有意义的简短进度，不重复状态噪声。
1. 先检查 git status，保留用户变更。当前只能一个开发单元；不在运行中切分支。回收 registry 中原生开发/验收任务的 wait_threads/read_thread 状态。任务返回 clientThreadId 或创建结果未知均占槽，查明前禁止再次创建。
2. 有活跃单元先继续它，不另开单元。开发完成必须有确切提交、允许文件 diff、专项验证。检查候选文件无未提交变化，CLI candidate 记录 SHA、start-qa 后，向独立 QA 任务发送同一 SHA。QA 不写共享代码，不为开发修复；临时测试放 /tmp。
3. 总控从 QA 原始最终输出保存 evidence JSON 到 operations/evidence/，包含 unitId、candidateSha、reviewerThreadId、result、checks；checks 覆盖 requiredEvidence，另外记录真实命令/反例、限制和原始报告位置。不能把开发报告改写成独立 PASS，不能把缺环境标绿。用 CLI qa 保存摘要。FAIL 用 rework 返原开发再复验，不能新建替代任务规避失败。
4. local_only PASS 后 close；runtime PASS 后 release-ready。生产执行必须有明确用户授权且遵守AGENTS发布规则；完成后按production-evidence-schema.md组装真实证据，record-deployment→verify-production→close，不能跳级或伪造平台事实。所有关联证据保持不可变并保存原始来源；失败留原状态。生产已完成的单元不重复发布。
5. 无活跃单元时 `pnpm control next`，优先选择已满足依赖、autoEligible=true 的一个单元。先完成 operations/contracts/<ID>.md 七要素契约和台账。默认复用已有闲置开发/验收角色任务，重命名为该单元并分别续派；绑定前确保前一单元 CLOSED，显式传新范围和基线。若角色不可用，才顺序创建新的原生项目任务，并立即记录每个返回身份。按 operations/model-selection-policy.md 分别选择开发与验收模型和推理档，记录理由与升级条件；不得默认最贵或最便宜，复用任务也须重新评估。禁止一次创建多套任务。
6. 用户本轮授权继续下一批，AUTO-02、UPG-03A、UPG-03B0已关闭，UPG-03运行时实施已按明确契约开放；其独立通过后止于RELEASE_READY。其他单元保持依赖和需求门槛。修改backlog后必须用plan-sync显式同步：不得删除历史单元或改变已开始单元，不在开发/QA进行中同步。不得删状态重建。
7. 每次 heartbeat 最多开启一个新单元，但必须完成其开发/返工/验收回收循环；用户明确要求的连续交付可在同一主动会话完成前项后继续下一项。连续两次同类失败或一小时无进展时停止扩大测试，报告可复现阻塞并缩小范围。无变化保持安静，首次新阻塞、完成或需要人处理时简短报告。

权限：允许本地开发、专项验证、本地提交；禁止生产部署、生产 DB 写入、价格/支付/密钥改变、真实购买、客户外发。部署另有授权时仍必须严格执行 AGENTS.md。不能改变权限设置、自动批准工具请求或伪造客户/数据证据。

持久化：.pairvu-control 是真实执行状态，operations/task-registry.json 是可读索引。每次状态变化更新索引，不用索引覆写状态。状态损坏/遗留锁时核实 owner 和任务状态，报告问题，不自动删锁。机器停机/应用关闭时本地调度不会执行。

## 已完成的本次生产授权

2026-10-10 用户已明确授权的发布 SHA f85bd3eb7046130acaa30f5ae473765e57ec413b 已生产验收通过。AUTO-02已补齐生产状态命令，UPG-01真实生产证据已正式导入并CLOSED；不重复部署。此授权不覆盖未来新增产品功能发布。AUTO-02、UPG-03A、UPG-03B0已独立关闭；UPG-03已独立PASS并正式RELEASE_READY；没有新增生产授权时保持该状态，不反复询问或重复派QA，也不越过单槽启动UPG-04。进度以真实CLI和任务结果为准。
