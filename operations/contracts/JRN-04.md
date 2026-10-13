# JRN-04 合成素材到期、删除与权限回收补验

## 授权、唯一目标
2026-10-13用户授权本地隔离合成资产补验、开发修复及独立验收；不修改真实客户数据。交付可重放工具与证据，local_only，不是生产验收。只复用原开发和独立QA，固定SHA，FAIL返原开发。

## 最小契约与资产范围
全新临时Miniflare D1/R2、实际迁移、实际Better Auth A/B独立会话和应用路由。身份example.test；小型合成PNG；manifest记录runId/所属workspace/assetId/object keys/摘要/引用关系/预期删除范围。只允许删除本次临时存储内manifest资产；禁止复制生产数据或会话，禁止读.dev.vars/.env/Stripe文件，阻断外发网络、邮件本地捕获，不调用模型/付款/Cloudflare远程CLI。认证和所有权不得stub。可复用读取JRN03脚本，但不得改冻结原件。

1. 到期前真实asset GET本人200、内容摘要和private no-store；B/匿名不能获得A图片。过期后即使R2仍有对象也拒绝读取；覆盖到期边界、null/非法到期值的安全拒绝。受控时钟或fixture日期明确标注。
2. 实际deleteExpiredAssets连接真实本地D1/R2，只清理到期非deleted对象，original/normalized/thumbnail去重删除，状态/删除时间/审计记录可追溯；未到期A/B与无到期素材不被清理。小batch分页反复至无剩余，重复执行不重复删除成功对象。
3. 实际账户DELETE及现有analysis/batch DELETE路由：匿名拒绝；A/B双向有效外部对象删除拒绝，无业务数据/R2/额度改变。账户DELETE仅当前workspace，不信任伪造workspace字段；先用实际有效本人删除证明目标存在。queued/running检查按现有业务契约阻止删除，验证409及全存储不变。阅读实际路由，明确批次/分析删除保护SKU参考的现有契约。
4. 精确删除后本人410/既有路由语义、外部账号不泄漏状态；重复删除幂等。实际列表/详情或release API明确图片不可用，不保留可绕过读权限的访问路径；若完整合成ELIGIBLE引用被删图片，应退为BLOCKED，审计及冻结来源不伪造。原机器和审核历史/额度不因图片删除意外改变。
5. 失败恢复：围绕真实R2/D1做最窄明确故障注入，至少R2删除失败、R2成功后D1标记失败，记录失败原件，确认不报告完整成功；重试实际流程收敛，无他人资产受损。不得仅FakeD1/FakeR2通过当真实存储证明。

## 恢复与清理标准
永久删除没有产品恢复承诺，不能通过改回status或复制回同ID冒充恢复。这里恢复指部分失败可重试完成，以及测试环境可用新runId重新生成。删除前保存不含凭据的资产manifest/内容摘要，删除后核对确切对象消失、未目标对象未变、审计保留。临时服务停止，私有D1不入库；只归档不含会话/魔法链接的报告。UI若检查只用CUA，fixture transport明确，不冒充真实浏览器E2E。productionLifecycleCovered=false、qualityEvidence=false、modelCallsExecuted=0。

## 文件、修复与完成边界
开发唯一写scripts/jrn04-*、fixtures/journey-asset-lifecycle/**、docs/05-evaluation/asset-lifecycle-acceptance.md，必要package脚本；总控写operations/进度。QA只/tmp，不提交修复。发现runtime缺陷先回最小复现、严重度及准确文件，继续修复由总控具体授权范围；不得削弱断言或偷偷改变业务契约。runtime修复需单独固定SHA验收，未经本次明确生产授权不得部署，仅RELEASE_READY。工具本地PASS正式关闭，不能将未修复真实缺陷隐去。
开发与QA分别选gpt-6.1-sol/high：开发涉及真实认证、跨账号永久删除及D1/R2非原子恢复；QA需独立反例、时序/失败窗口与不可逆边界核对。Sol足够，不默认Astra；仅反复实质推理缺口先缩域再考虑升级，权限/环境不升级。
测试预算：专项真实路由/存储+typecheck/改动lint；无runtime变更不全站build。同因两次失败或一小时无进展缩域。开发回candidateSha/文件/原始失败和最终报告/边界；独立QA回unitId,candidateSha,reviewerThreadId,result,checks:[{name,status,detail}]。
requiredEvidence：fixed candidate SHA；independent QA report；isolated asset manifest；expiry and read revocation；owned deletion and isolation；failure recovery and cleanup。
完成后总控正式CLI收尾、更新整体进度，明确下一步和依赖；不启动其他新功能或恢复pairvu-2。
