# AUTO-01 自动化控制与验收工具

唯一目标：把 README 中的单交付单元、唯一开发/验收槽、候选绑定和门禁做成可运行的本地 CLI，带能复现失败边界的测试。不实现产品业务功能。

允许修改：scripts/pairvu-control.mjs、scripts/verify-pairvu-control.mjs、lib/automation/**（使用 Node 原生 ESM，可选）、package.json scripts 项、.gitignore 增加 .pairvu-control/。不得修改依赖版本/锁文件。总控独占 operations/** 和 docs/**。

输入计划 operations/backlog.json 格式：schemaVersion=1, units 数组；每项 id,title,priority,dependsOn[],mode（local_only/runtime/human）,autoEligible boolean,requiredEvidence[]。状态初始化不得把计划依赖直接当已完成。

最低 CLI：init、status、next、claim <unitId>、bind-role <dev|qa> <threadId>（支持 --client-id 或等价显式 pending 字段）、candidate <40位SHA>、qa <PASS|FAIL> <40位SHA> <evidencePath>、close <unitId>。可增加必要 start-qa/rework/release-ready 子命令但写出 usage。controller 角色 ID 和状态路径参数应可指定以在临时目录测试。

门禁：只允许一个活跃单元；依赖必须 CLOSED；human/autoEligible=false 不自动 claim；dev/qa 不同且 pending 不重复绑定；候选必须存在且完整 SHA，记录基线并检查祖先关系；QA 必须有独立已绑定任务、同一候选、有效非空证据文件；候选变化清除旧验收；QA FAIL 不能 close；local_only 才能 QA_PASS 后 close；runtime 只能 RELEASE_READY，不具备部署权限。重复调用不得双重推进。原子排他锁和原子写入，损坏状态 fail closed，事件追踪不能丢；不自动抢过期锁。

不能把任意非空文本当 PASS：证据需 JSON，至少 unitId,candidateSha,reviewerThreadId,result,checks（非空数组，每项 name,status），PASS 不允许失败/未运行 checks。验证一致性。证据文件应有不可变摘要记录；关闭前重新核对摘要和 candidate。初始化应幂等且不覆盖既有状态。CLI 应防止从任意状态无依据跳过必要转换。

禁止：生产网络/数据库/部署、自动调用 Codex 创建任务、伪造 QA、写总控计划、修改应用逻辑、创建新子任务、推送 main。工具只记录 native Codex 任务身份，由总控调用原生工具进行调度。

测试预算：实现一个离线临时 Git repo + 临时 state/plan 的验证脚本，覆盖并发 claim、重复 init/绑定、pending 占位、同人开发验收拒绝、依赖/human hold、损坏状态、不存在/非后代候选、过期 QA、证据不匹配/失败 checks/证据修改、FAIL 返工、local close 和 runtime 不自动上线。运行 node 脚本与 pnpm typecheck。无需完整 Next build（不改应用/构建）。

回传：完成文件、候选 SHA（若不能提交则提供 tree/diff 摘要并报告）、命令与结果、反例覆盖、残余风险、明确未做。不要自行 git add -A；只暂存本契约文件。可提交本地功能代码，不推送、不切换共享分支。代码完成且验证通过即停止，等待总控派给独立 QA。
