# JRN-04-FIX 素材可用性与匿名删除错误映射修复
来源：JRN-04实际隔离复现；用户授权失败继续修复，生产未授权。
范围仅lib/releases/repository.ts的到期可用性与app/api/batches/[batchId]/route.ts DELETE的RequestAccessError映射及针对性回归；详细矩阵与隔离边界继承JRN-04.md追加范围。原开发和独立QA分别gpt-6.1-sol/high：安全资格和鉴权语义，需反例与跨层一致性；反复推理缺口先缩域再升级，环境问题不升级。
固定SHA独立PASS、typecheck/lint/相关专项和固定源码构建成功后正式RELEASE_READY；不得push/deploy或宣称生产修复。保留原FAIL，requiredEvidence: fixed candidate SHA, independent QA report。

## 独立QA返工补充：删除失败窗口（2026-10-13）
94a818b独立FAIL原件operations/evidence/JRN-04/attempt-1/qa.json。已有SKU保护的reference+approved完整candidate在R2成功/D1标记失败时，release仍ELIGIBLE。允许继续在lib/releases/repository.ts做最小失败关闭：有已记录删除意图/未完成或失败的删除尝试时，不可宣称图片可用于发布；优先复用已有asset_deletion_attempts，避免迁移和改变永久删除语义。必要时lib/assets/deletion.ts的最小配套调整需说明。原机器、审批和冻结来源保留，正常无删除意图的future资产仍ELIGIBLE；至少检查started/failed窗口、R2失败与R2成功D1失败、重试收敛、A/B不变性。加入开发回归，不直接修改QA原件。固定新SHA独立复验和增量构建；仍无生产授权。

## 最终验收
候选c20cf48c06269fe463043a4dbf5d4a11841c1da6独立增量10PASS，原25PASS按差分复用、原FAIL保留。JRN-04正式CLOSED；JRN-04-FIX正式RELEASE_READY，未生产部署。证据../evidence/JRN-04/recheck/qa.json和fix-qa.json。

## 生产发布授权与复验范围（2026-10-13）
用户最新消息明确授权本单元先推GitHub、fresh远端核验、Cloudflare部署、独立生产复验及必要修复；仅明确合成测试资产，不修改真实客户数据。本授权取代上文待授权状态，不扩展其他功能。
发布增量QA：原QA gpt-6.1-sol/medium，候选之后仅文档证据，需核验固定发布SHA差分/摘要；发现runtime差分重评high。生产QA：原QA gpt-6.1-sol/high，真实登录、生产路由/存储/合成范围及恢复跨层核验。开发准备/必要修复：原开发gpt-6.1-sol/high，生产合成资产白名单、事务与清理风险；模型提升仅针对明确推理不足，环境不升级。
生产不做真实故障注入、不停服务、不改客户workspace资产/额度/套餐/机器历史；不调用模型或付款。公开health来源和匿名batch DELETE401独立实测；合成素材在受控测试账号真实会话下验证正常与不可用/删除意图资格。若需构造null expiry/started/failed状态，只允许本轮manifest精确标记的全新合成行，不冒充实际生产故障。真实D1/R2删除只限同manifest对象，禁止账户级全量DELETE。测试输出须区分真实路由、受控DB夹具、生产浏览器与本地故障注入证据；无真实会话则阻塞该层，不将匿名HTTP替代。
开发先准备合成数据计划/manifest/工具与本地演练，生产执行前由总控核对精确对象范围和清理；不需再向用户索取已给授权。凭据只允许部署/必要数据操作进程内按精确键加载，禁止输出值/头/完整环境/匹配行。生产测试资产标记test并排除价值指标，来源/模型元数据明确synthetic，qualityEvidence=false。
全部通过后真实manifest正式导入并close，更新整体进度、下一步及剩余生产覆盖；pairvu-2保持PAUSED，不自行启动新功能。

## 用户调整优先级：先修复流程（2026-10-13）

用户要求先修复碎片化和过度验收。发布已完成a359c2d / Worker65719c81-734a-4019-b724-47e470304eb3，独立HTTP已PASS；真实UI批准和正常ELIGIBLE已有证据，业务矩阵尚未完整完成。暂停继续扩大或重跑功能验收，仅由原QA安全清理本轮run95ddbce0的两张合成图片并一次核对非目标/额度，回传完成项、缺口和清理结果。不得将本次缩域追认为原生产契约全部PASS，不正式关闭runtime，不重复部署。

总控直接修改执行文档与当前台账，做链接、结构和差分检查；不为流程文档另造控制系统、跑应用构建或再派独立文档QA。后续是否补剩余生产业务检查由当前真实交接结果决定并明确说明，不自动启动新功能或新补验单元。

## 2026-10-14 当前收尾清单

唯一目标：落实流程规则并清理run95ddbce0的reference fe6a5d38-9544-43a8-a545-8e4145698c99和candidate cddb395f-f442-46de-b19f-ff3e0b6e4905。复用既有manifest、清理工具、已通过证据和非目标基线；原QA一次连续清理，Sol/medium（固定对象和审查过的步骤，无新设计；出现归属/状态矛盾才重评high）。准备与执行15分钟诊断检查点，不超时标绿。总控只改operations/docs/AGENTS并检查文档。

必需：两对象不存在、删除元数据/审计核对，一次最终非目标及额度核对，当前规则/台账一致。禁止：新增测试工具、样本、started/failed矩阵、构建、部署、付款、客户修改或额外角色。完成清理和文档即停；原生产业务验收仍PARTIAL，剩余覆盖如实记录。正式control状态不手改。

## 2026-10-14 收尾结果

流程与清理范围完成：原QA交接cleanup-handoff.json确认两对象404、reference删除标记与完成审计、25张非目标表摘要不变、额度6可用/4已用/0预留。机器、审核和test分类历史保留。独立收尾约8分钟，无新增测试或运行时修改。

原生产业务结论PARTIAL：恢复资格UI、started/failed生产矩阵、删除重放、生产价值指标UI排除检查未执行；不补造PASS或正式close。下一步保留缺口，需明确继续范围才另安排；本轮不自动续测。证据../evidence/production-jrn04-fix-2026-10-13/cleanup-handoff.json。
