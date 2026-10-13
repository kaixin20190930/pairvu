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
