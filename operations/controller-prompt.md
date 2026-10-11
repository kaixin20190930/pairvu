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

## 最新生产关闭

2026-10-10本轮用户明确授权UPG-03推GitHub及Cloudflare部署，releaseSha57bc84850513b2ba4338fd0933e2d3651158be57、Worker f62b7502-d05e-413c-86a0-aa435827b7e6已独立生产HTTP通过并正式CLOSED。不要再次部署此版本；上文UPG-03待授权/待发布状态已结束。新功能开关保持默认关闭，启用与完整登录验收仍待相应明确范围。下一UPG-04仍需明确契约后开放；不把旧授权扩展为后续版本发布。

## SKU启用与后续授权

用户已授权启用SKU新功能、完成生产登录流程验收并修复问题；通过后自动推进UPG-04结构化区域证据。通过前不得以匿名HTTP替代登录验收或提前放行UPG-04。测试只用明确标记的合成产品/图片及最小必要额度，不购买、不改真实客户资产、不伪造会话。所有启用/修复发布仍遵守GitHub先行规则。

每次总控完成汇报必须包含“下一步做什么”：具体动作、依赖/阻塞、自动继续或需要用户提供什么。无变化的heartbeat仍保持静默。

## 22:13 最新关闭与下一步

SKU启用及生命周期修复已生产关闭：ce1f2fee7f43735ff6b6f13f3867840943d19471 / Worker 9263e27f-2448-4a48-9ecd-a176d1cd9ff2。独立HTTP及真实登录增量均PASS（v5/历史保留/两轮无刷新归档恢复/旧批次v3快照），失败记录保留。此前等待修复及登录门禁未通过均已结束。现在自动推进UPG-04，按其明确契约和Sol/high角色选择本地开发/独立QA；新功能最多RELEASE_READY，不能继承SKU授权发布。完成报告继续明确下一步做什么。

## UPG-04验收完成与下一步（23:03）

候选ec5a73d2492eb010dc60571ea90a6d2a0a7af815，独立52项后端和30项浏览器检查PASS，原始报告及失败测试记录保存在operations/evidence/UPG-04.json及UPG-04目录。正式CLI已qa PASS→release-ready；当前没有运行中的开发/QA。生产仍为ce1f2fee7f43735ff6b6f13f3867840943d19471，SKU已启用且真实登录PASS。

下一步：等待UPG-04明确发布授权，再按AGENTS顺序推送、远端核验、部署及生产验收；关闭后制定UPG-05最小契约并重新选择角色模型。单槽不得跳过RELEASE_READY或沿用SKU发布授权。无新授权的重复巡检不重复通知。

## 本轮发布授权

用户于2026-10-10明确授权UPG-04推送GitHub、部署Cloudflare、生产验收及必要修复；通过后自动推进UPG-05人工审核与审计开发和独立验收。授权来源：总控thread 01a0bcd5-909b-7b72-b64b-399e8028c919，turn 01a12659-8f1b-7da1-af36-884b74ddb366，user message 01a12659-8f58-79e1-9fec-5e2f99ba7e53。新的授权覆盖本单元发布，不扩展为UPG-05生产授权。

发布QA复用原角色，gpt-6.1-sol/high：真实登录与provider结构、持久结果及历史兼容需要跨层核对；仅反复出现具体推理不足才升级，环境问题不升级。先核对最终发布SHA相对已验收候选的文档/证据差分，再独立验证生产HTTP及受控合成图片流程，最多一个必要分析、不购买，不触碰客户资产；会话失效则如实阻塞。

## UPG-04生产反例修复进行中

用户已授权本次UPG-04发布及必要修复。324a528已实际部署，HTTP PASS但真实功能FAIL（logo空白框/无文字PASS）；生产证据在operations/evidence/production-upg04-2026-10-10。正式CLI仍RELEASE_READY，未导入manifest/未关闭，这是等待同一单元后代修复及新releaseQa完整增量验收，不是等待用户授权。先回收registry.releaseRepair对应原开发/QA，持续wait_threads。修复发布需同样GitHub-first，生产功能PASS后才能正式导入最终manifest关闭。保留所有失败发布证据。当前无额外模型调用预算；总控可按必要生产复验给独立QA明确最小一次合成分析范围，不购买。UPG05必须等UPG04真实功能PASS后启动。

## 2026-10-11 UPG04生产正式关闭

62787fdbc93ec3dad93640a46603d5fd745c4b21 / Worker 0da98625-4ba2-4bd9-9609-bba4ad8a6e29，manifest位于operations/evidence/production-upg04-repair4-2026-10-11/manifest.json；独立登录补证PASS，原FAIL/BLOCKED保留。正式record-deployment→verify-production→close已完成，不重复部署。仅结构证据留存/安全退化验收，五项未返回、定位可靠性/质量仍限制。自动继续UPG05契约单分析人审审计，原角色各Sol/high（鉴权+D1并发+UI），固定SHA独立QA后仅RELEASE_READY，UPG05生产没有授权。持续wait/read，失败返原开发。

## 2026-10-11 UPG05本地独立验收完成

候选736e61f7b7c1ffe4e886ef4b5821d79049265621，原独立QA43项D1/798请求、38项真实组件浏览器、49项结构回归及workspace回归/typecheck PASS，报告operations/evidence/UPG-05.json，原件UPG-05目录。正式qa PASS→release-ready已完成，两角色空闲。UPG05未推送、未生产0021迁移/部署/启用，生产仍62787fd。下一步等待UPG05明确发布授权，再GitHub-first+迁移+Cloudflare+生产登录审计验收；不能继承UPG04授权。无新授权保持RELEASE_READY，不重复派单/部署或跳过依赖启动UPG06，无变化不重复通知。完成报告说明下一步。

## 2026-10-11 UPG05发布与UPG06研发授权

用户明确授权UPG05人工审核与审计先推GitHub、迁移、Cloudflare部署、生产验收和必要修复；通过后自动推进UPG06发布工作台与规则版本开发及独立验收。来源总控thread 01a0bcd5-909b-7b72-b64b-399e8028c919，turn 01a12b70-1748-7ae0-83a1-626074effcc9，user message 01a12b70-17ab-7863-a0aa-ad0eb2f5df94。此授权不覆盖UPG06生产发布。

UPG05发布增量QA复用原验收，Sol/medium：736e61f后只含原证据及总控文档，需要固定最终SHA差分、哈希和typecheck核验，若发现运行时差分则high重新评估。生产验收Sol/high：真实登录actor、远端0021迁移、append-only决定及UI/历史需要跨层验证。开发仅遇真实失败复用并按具体风险重选，不无故派单。生产测试只用已授权合成分析batch-analysis-d79c71c7-417e-4ce9-8601-3353185d2001，最小批准/拒绝/撤销记录，理由明确QA；无新增模型或额度消耗、付款、客户资产。原机器证据不改，验证刷新与审计链、必要安全负向，不在生产故意破坏数据库或注入故障。真实会话缺失则报告，禁止伪造。

## UPG05生产正式关闭与UPG06研发

UPG-05已完成GitHub-first发布、0021迁移和Cloudflare部署（2013e22 / Worker 8e0e8aee-2fce-41c6-9435-e157b61af4d7），独立HTTP和15项真实登录业务检查PASS，正式CLOSED。人工审核已启用，机器证据不变，合成分析审计revision1–3及余额6已核验。自动继续UPG-06发布工作台与规则版本研发独立验收，契约operations/contracts/UPG-06.md，开发和QA分别按跨租户/规则/并发风险选择Sol/high。UPG06未授权生产，最多RELEASE_READY；届时按用户选择暂停pairvu-2。
