# Pairvu 项目整体进展（更新于2026-10-13）

## 当前结论

核心工程链路已上线：基础检测/批次、SKU标准版本、结构化区域证据、独立人工审核与审计、发布工作台/规则版本、价值指标。匿名批次CSV错误已修复并完成独立生产复验；JRN-02 Stripe测试模式的付款→权限→CSV→跨账号隔离→取消降级已固定SHA独立PASS并local_only CLOSED。但完整付费/生命周期/跨workspace写入旅程尚未覆盖；真实检测质量与商业价值仍没有充分数据证明，不能称为全部产品验收完成。

当前生产发布 `bbbe62c110e526604a76b316c0ec0b5e90b13fca`，Cloudflare Worker `c88179e1-d880-4a19-8988-e041b25a2924`。本次无待执行数据库迁移，没有新增开关；既有SKU、发布工作台和价值指标保持启用。GitHub推送→fresh远端核验→同SHA构建部署→独立生产复验已完成。发布后的进度/证据提交不等于新的生产部署。

## JRN-02 测试模式验收已关闭

固定候选 `d3fcb9c228c858b81a104baafa902f7aac096217`，开发及独立QA完成，正式CLI `candidate → start-qa → qa PASS → close`。仅交付本地隔离测试工具与证据，没有新生产部署或功能开关。

- 复用既有A/B邮箱身份，建立全新本地D1工作区；通过实际Better Auth魔法链接/会话，邮件仅本地捕获。未复制生产会话或数据，未调用模型。
- 用户完成唯一Stripe Sandbox测试付款，实际provider状态complete/paid且livemode=false；真实CLI签名事件进入原应用webhook及本地D1。A变Starter 150额度、CSV可用，B保持Free 10。
- 独立实际接口复核：A自有batch和workbench CSV均200；A访问确实存在的B批次404，workbench无B行；B Free导出403，匿名401；下载头、引号/换行/公式转义通过。
- 错误签名拒绝，真实事件乱序/重复处理不重复授额；独立乱序重放使用真实provider事件和本地签名，未冒称原CLI签名的独立密码学回放。
- 本轮测试订阅已取消，真实删除回调完成；A/B恢复Free 10，A两个CSV接口均403，无监听服务残留于3107。生产计费六表在测试前、付款后、清理后的记录数/摘要完全相同，独立health确认原生产SHA/Worker不变。
- 已处理测试工具的运行标记、CLI环境白名单、输入schema一致性、乱序恢复与恢复启动断言问题；最终无阻断FAIL。正式生产checkout故意拒绝test key，测试使用限定适配入口，因此**不覆盖生产checkout入口、生产paid导出或本地Google OAuth**。没有真实扣款，也不将测试通过写成真实质量或商业价值结论。

[独立最终报告](../../operations/evidence/JRN-02/qa-final.json)、[原始证据及摘要索引](../../operations/evidence/JRN-02/archive-index.json)、[正式关闭状态](../../operations/evidence/JRN-02/control-closure.json)。开发候选内验收文档记录“等待清理”属于冻结候选时点，最终清理状态以上述独立报告为准。

## 本轮CSV修复与核心旅程补验

- 修复前匿名批次导出返回500 `csv_export_failed`；现在无Cookie/Authorization独立请求返回401 `authentication_required`，JSON无CSV或目标数据泄漏。health精确匹配发布SHA及Worker，两项独立HTTP检查PASS。
- 原修复候选 `50341a7` 通过11项专项及7项独立真实handler反例；最终发布提交只追加管理文档与原始证据，固定SHA增量独立QA通过，实际Cloudflare构建通过。
- 五组真实A会话只读复验PASS：Free额度仍6可用/4已用/0预留；指定合成产品active/text v7/reference v1；旧批次仍text v5/reference v1；机器REVIEW/11条限制与人审None/revoke revision6保留，6条审计保留；发布规则与机器来源显示哈希一致，资格仍BLOCKED、Free导出禁用。
- 前轮真实A/B/A只读隔离已通过：B额度10/0/0、空历史，不能看到A指定产品/批次/分析和审核控件，再切回A复读不变。本次不重复整套隔离；UI404不充当跨workspace写API或paid导出隔离证明。
- JRN-01清单报告交付CLOSED；独立运行时单元JRN-01-EXPORT-FIX经正式CLI `record-deployment → verify-production → close` CLOSED。原生产FAIL和原验收文件完整保留，由新生产证据解决该问题；**整体核心旅程仍INCOMPLETE**。

[本次发布manifest](../../operations/evidence/production-jrn01-export-fix-2026-10-13/manifest.json)、[独立HTTP原报告](../../operations/evidence/production-jrn01-export-fix-2026-10-13/production-qa/http-report.json)、[独立真实登录原报告](../../operations/evidence/production-jrn01-export-fix-2026-10-13/production-qa/functional-report.json)、[正式关闭记录](../../operations/evidence/production-jrn01-export-fix-2026-10-13/control-closure.json)。

## 模块状态

| 模块 | 实现、上线与验收状态 | 实证边界 |
|---|---|---|
| 基础检测、批次、账户额度、付费入口和内容 | 已上线 | 完整真实付款及商业验证未完成 |
| AUTO-01/02 总控与独立验收系统 | CLOSED | 主动wait/read完成JRN-02开发→固定SHA独立QA→受控清理→独立增量QA→CLOSED；pairvu-2保持暂停 |
| JRN-02 测试付款、CSV与账号隔离 | 独立PASS/local_only CLOSED | 真实Stripe测试事件、实际认证/路由及取消降级；未覆盖生产paid路径 |
| UPG-01 发布版本追踪 | 生产通过/CLOSED | SHA、Worker来源可核对 |
| UPG-02 评测契约与离线校验 | 本地独立通过/CLOSED | 真实授权双标留出集仍缺 |
| UPG-03 SKU版本及生命周期 | 已发布、启用，生产登录通过/CLOSED | 版本历史、旧批次冻结和归档恢复通过 |
| UPG-04 结构化区域证据 | 生产通过/CLOSED | 证据留存与安全退化通过；可靠定位和完整检测质量未证实 |
| UPG-05 人工审核与审计 | 已发布、启用，生产登录通过/CLOSED | 批准/拒绝/撤销、审计链和原机器证据保留 |
| UPG-06 发布工作台与规则版本 | 已发布、启用，限定生产验收PASS/CLOSED | 机器/人工/资格分离、筛选、分页和Free UI门禁；不是外部电商发布 |
| UPG-07A 离线参考视角评测工具 | 独立PASS/local_only CLOSED | 协议及工具完成；真实质量仍BLOCKED |
| UPG-10 价值指标 | 已发布、启用，限定生产独立PASS/CLOSED | test/unknown排除；缺真实业务正向数据，没有真实价值结论 |
| UPG-07运行时、UPG-08 API、UPG-09 Webhook | BACKLOG，未实施 | 分别等待真实评测输入、明确调用方契约、前置API |

## UPG-10本轮结果

候选`3f6447c1c5e3af159ae86be3f7a413a31db1a169`。提供workspace内只读指标页/API、追加式来源分类和离线分类材料校验/导入准备。统计去重用量、冻结SKU使用与复用、机器分布、人审覆盖与首次决定等待、检测估算成本。批次多张图片不重复算复用；客户端埋点不能扩大分母；test和unknown从所有业务分子、分母、分组、成本、等待时间中排除。零分母为null，缺失成本不是零，审核等待不等于实际人工工时，图片生成模型未知不以检测模型冒充。

开发26项D1/434请求、13项组件及typecheck/lint/最小回归通过。独立24项D1/573请求、7项组件、5次分类CLI调用、固定候选源码build及类型/lint/相关回归通过；另重跑26项开发专项。独立验证含两租户、伪造参数/埋点、分类更正、原子回滚、批次去重、审核等待、空态/错误恢复、375px/1280px、5000/5001 cohort、100/101分类和审核事件、UTF8上限及读取间撤销归属。

本地浏览器使用实际组件/CSS与合成API/导航夹具；API/SSR/DB另行本地验证。归档源码构建因无Git元数据嵌入SHA unknown，仅为本地固定源码构建成功，不是可部署的GitHub-first发布产物。该本地验收阶段未做生产登录、模型调用、付款或真实业务分类；后续本轮已补真实登录验收，仍未进行模型调用、付款或业务分类。

[独立原报告](../../operations/evidence/UPG-10.json)、[56份原始材料与摘要映射](../../operations/evidence/UPG-10/archive-index.json)、[指标与分类口径](../01-architecture/value-metrics-contract.md)、[开发自测与失败记录](../../fixtures/value-metrics/validation/README.md)。UPG-10正式CLI已完成生产证据导入→PROD_VERIFIED→CLOSED；当前CSV修复已生产独立通过并正式关闭；原FAIL保留为历史证据，整个核心旅程仍有下列覆盖缺口。

## 已解决的失败与未验证项目

- 已修复并复验：SKU归档恢复状态、区域证据安全退化、发布工作台Unicode字节预算、离线样本100000上限、价值指标CLI/类型/组件问题，以及本次匿名CSV500。各次原始失败记录保留；本次目标范围无待返工产品FAIL。
- 生产覆盖仍缺：真实paid正向CSV和paid跨workspace拒绝、实际登录Free HTTP403、跨workspace写API负向、完整ELIGIBLE正向案例、受控到期/精确删除素材及真实付款/加量包/portal写入。当前两个真实账号均Free，不能伪造付费身份。
- 真实质量仍未验证：准确率、critical误放行、可靠区域定位与参考视角提升。UPG-07A工具完成，用户确认暂无真实授权样本和双标；合成夹具不替代质量结论。UPG-04当前案例缺失证据进入REVIEW，人工批准不等于符合发布资格或外部电商发布。
- 真实价值仍未验证：UPG-10测试/unknown排除已通过，前轮90天52条历史均unknown，不补造业务来源、收益或人工节省数据。
- 安全令牌已轮换，旧值失效、新值及已知服务恢复经独立核验；HUMAN-05剩余外部CI/设备依赖、审计覆盖与最小权限方案，不能宣称已穷尽误用可能，也不重复轮换。

## 下一步做什么

1. **优先补不依赖真实付款的核心旅程。** JRN-02测试付款和paid导出隔离已完成，下一单元先明确可逆跨workspace写API负向与完整ELIGIBLE正向案例的最小契约、合成资产和状态恢复标准；确认启动范围后由总控持续开发/独立验收。
2. **保留生产覆盖缺口并按条件补验。** 测试模式不等于生产paid正向，后者可等可用的真实付费会话和最小验收范围，不必为了本轮测试再付费。到期/删除素材另定受控契约；永久删除及真实付款需对应授权。
3. **准备真实样本和真实业务来源。** UPG-07需授权样本、双标/仲裁、冻结留出集（[15项缺口](../05-evaluation/reference-view-sample-readiness.md)）；UPG-10需来源证明与分类授权。无材料保持BLOCKED/unknown。
4. **安全收尾及后续集成。** 负责人补外部依赖清单后制定最小权限方案；UPG-08 API需具体调用方最小契约，UPG-09 Webhook依赖API，均未启动。

本轮已自动完成JRN-02开发、固定SHA独立验收、测试订阅清理、正式关闭与进度同步。下一步建议启动上述可逆核心旅程单元，需用户确认最小范围；不自动扩大生产操作、启动API/Webhook或真实扣款。pairvu-2按既有决定保持PAUSED。

[完整升级方案](product-upgrade-plan-2026-10-10.md)、[按优先级剩余任务](next-development-batch-2026-10-10.md)、[任务台账](../../operations/task-registry.json)。历史UPG-10交付依据：[manifest](../../operations/evidence/production-upg10-2026-10-12/manifest.json)、[登录验收](../../operations/evidence/production-upg10-2026-10-12/production-functional.json)。
