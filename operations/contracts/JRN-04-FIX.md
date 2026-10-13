# JRN-04-FIX 素材可用性与匿名删除错误映射修复
来源：JRN-04实际隔离复现；用户授权失败继续修复，生产未授权。
范围仅lib/releases/repository.ts的到期可用性与app/api/batches/[batchId]/route.ts DELETE的RequestAccessError映射及针对性回归；详细矩阵与隔离边界继承JRN-04.md追加范围。原开发和独立QA分别gpt-6.1-sol/high：安全资格和鉴权语义，需反例与跨层一致性；反复推理缺口先缩域再升级，环境问题不升级。
固定SHA独立PASS、typecheck/lint/相关专项和固定源码构建成功后正式RELEASE_READY；不得push/deploy或宣称生产修复。保留原FAIL，requiredEvidence: fixed candidate SHA, independent QA report。

## 独立QA返工补充：删除失败窗口（2026-10-13）
94a818b独立FAIL原件operations/evidence/JRN-04/attempt-1/qa.json。已有SKU保护的reference+approved完整candidate在R2成功/D1标记失败时，release仍ELIGIBLE。允许继续在lib/releases/repository.ts做最小失败关闭：有已记录删除意图/未完成或失败的删除尝试时，不可宣称图片可用于发布；优先复用已有asset_deletion_attempts，避免迁移和改变永久删除语义。必要时lib/assets/deletion.ts的最小配套调整需说明。原机器、审批和冻结来源保留，正常无删除意图的future资产仍ELIGIBLE；至少检查started/failed窗口、R2失败与R2成功D1失败、重试收敛、A/B不变性。加入开发回归，不直接修改QA原件。固定新SHA独立复验和增量构建；仍无生产授权。

## 最终验收
候选c20cf48c06269fe463043a4dbf5d4a11841c1da6独立增量10PASS，原25PASS按差分复用、原FAIL保留。JRN-04正式CLOSED；JRN-04-FIX正式RELEASE_READY，未生产部署。证据../evidence/JRN-04/recheck/qa.json和fix-qa.json。
