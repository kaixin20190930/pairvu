# JRN-01-EXPORT-FIX 批次导出匿名错误映射修复

## 范围与授权
用户已授权核心旅程发现问题后继续修复及独立验收。本契约是 JRN-01 发现真实生产 FAIL 的明确运行时修复范围，不将原 local_only 清单的 CLOSED 当作修复上线。本轮只允许本地实现和固定 SHA 独立验收；没有新生产发布授权，不推送/迁移/部署。原生产 FAIL 与 JRN-01 未完成状态保留，需实际生产复验才能关闭旅程问题。

## 唯一目标和证据
生产 a0b27ac7b5432e9482ffbe50e5ea0f43be18680c 的匿名 GET /api/batches/9e24fe37-4e56-4fad-8edd-b4589bbcb698/export 返回500 csv_export_failed，预期401 authentication_required。独立原件 /tmp/pairvu-jrn01-qa/failure-anonymous-batch-export.json。resolveRequestAccess 抛 RequestAccessError 被通用 catch 当作服务异常；修正该明确错误分类，不能扩大匿名身份或降低 entitlement/workspace 检查。

## 文件与禁止事项
原开发仅可改 app/api/batches/[batchId]/export/route.ts 和最小专项回归 scripts/verify-batch-export-auth.ts（确需package入口时只加对应script）。禁止改共享认证语义、计费套餐、数据库、其他路由、凭据或生产。保留总控文档/证据和原候选清单。QA只写/tmp，不改实现。

## 可判定验收与预算
通过真实路由处理器验证：无会话401且无CSV；当前Free403且无CSV；active paid 外workspace批次404，owned批次200及既有CSV格式；未知基础设施异常保持500，不能全映射401。用隔离依赖/fixture不冒充生产付费身份，断言门禁顺序且不向无权限分支读取批次。专项/typecheck为必需，按路由改变执行一次build；已有合成脚本可复用，但不得只复制源码逻辑自证。固定提交独立QA重验关键反例；没有真实paid生产会话时仍BLOCKED。

## 模型与回传
开发 gpt-6.1-sol/medium：单路由明确错误分类、有限反例，复杂度有限；发现共享鉴权或并发实质问题才缩域并重评high。QA gpt-6.1-sol/high：验证鉴权异常分类及门禁顺序、不同权限分支，防止安全语义回归；仅重复具体推理缺口才升级，环境审批不升级。复用原角色，不新建。
开发回完整SHA、差分、命令/原件、限制。独立QA回candidateSha、原角色ID、PASS/FAIL和逐条证据；PASS只表示本地修复可发布，不能写生产已修复。总控持续wait/read，失败返原开发。直到新授权并完成GitHub-first同SHA生产验收，原旅程保持未完成。

## 2026-10-13 容量故障恢复
原开发gpt-6.1-sol出现明确capacity错误而中断，未完成候选；原QA B补验亦中断。复用原角色，开发改为工具列出的gpt-6-sol/medium、QA gpt-6-sol/high。这是可用性备选，不将环境故障当作推理不足升级，也不改变测试门槛。保留原未提交修复及专项草稿，禁止重复创建角色。

## 2026-10-13 本次生产授权与正式发布单元
用户明确授权本修复先推送GitHub、fresh核验远端、再部署Cloudflare及独立生产复验，有问题继续修复。以上“无新生产授权”为历史；本节覆盖当前发布范围。生产数据库只读查询确认无待迁移（发布证据保存真实查询时间与日志），不改变计费、其他功能开关或身份。JRN-01清单交付独立关闭后，本runtime单元使用原开发/QA，经正式plan-sync/claim/candidate/qa/release-ready和真实manifest转换；原生产FAIL在复验通过前保持OPEN。
发布增量QA选择gpt-6-sol/medium：原高推理固定路由已通过，新增仅文档/证据和状态范围分离；运行时出现差异或安全语义疑点就FAIL并重评high。生产QA选择gpt-6-sol/high：实际发布来源、真实登录和冻结/人审/额度的跨层复核需要较高推理。开发暂不续派；如实质FAIL返回原开发，以明确单路由问题Sol/medium，跨鉴权边界重评high。环境故障不升级。
生产验收：无Cookie/Authorization公开请求指定批次export返回401 authentication_required且没有CSV；health精确对应发布SHA/Worker；已有真实A会话检查Free UI门禁、指定合成资产和6/4/0额度不变。无真实paid会话的正向CSV/外workspace paid导出仍BLOCKED，不构造身份。无模型调用、付款、删除或额外写入。

## 本次发布完成
固定发布bbbe62c110e526604a76b316c0ec0b5e90b13fca / Worker c88179e1-d880-4a19-8988-e041b25a2924；GitHub-first门禁、实际无待迁移核查、同SHA构建部署已完成。独立生产2项HTTP和5组真实A会话只读PASS；schema-2 manifest经正式record-deployment/verify-production/close，runtime CLOSED。原生产FAIL保持原件，新生产结果证明401拒绝恢复；真实paid正向/跨workspace导出和Free HTTP403等限制未消失。详见../evidence/production-jrn01-export-fix-2026-10-13/manifest.json及production-qa原件。
