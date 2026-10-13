# JRN-02 Stripe测试模式隔离付款、CSV与跨账号验收

## 授权、唯一目标与完成语义
2026-10-13用户明确授权：先明确隔离环境和最小验收契约，复用已有测试账号，验证模拟付款、权限生效、CSV导出及跨账号隔离；不得真实扣款或修改生产计费，总控跟进开发/独立QA，失败返工。交付是隔离测试环境、可重复验证工具与真实Stripe Test Mode证据；local_only表示不向生产发布，绝不把本地测试PASS写成生产付费实测PASS。缺真实Stripe交互或真实认证链路不能用mock冒充整体通过。

## 隔离环境和身份
首选本机loopback独立端口（例如127.0.0.1:3107）、全新临时目录、本地workerd/D1及本地R2，应用固定源码，不使用生产DB/R2/Queue绑定，不写现有.dev.vars或wrangler.jsonc。不启生产cron/queue、不调用模型、不发送真实邮件/客户消息。所有新Stripe对象须livemode=false并带JRN-02唯一runId，只操作本轮创建对象；不得复用/修改历史Live客户订阅或现有Webhook端点。旧测试价格可只读复用。默认不建立公开隧道/远端部署。
测试输入由总控通过进程/0600私有文件提供；开发和QA仅允许按明确键读/private/tmp/pairvu-stripe-sandbox-input.json，禁止输出内容/密钥/认证链接/cookie/token/完整环境，不读源.dev.vars/其他凭据。脚本遇live key、live price/event、生产host/remote DB或目标范围不明必须在副作用前拒绝。
复用用户已确认A/B邮箱为测试身份，建立全新隔离workspace；不是复制生产账号记录或会话。当前本地未配置Google OAuth，优先完整Better Auth魔法链接流程，邮件传输只接本地捕获器、禁真实外发；若不能覆盖真实认证，只能明确分层证据/缺口，不构造生产身份或声称Google登录通过。必要用户交互由总控在真实UI交接。

## 最小验收矩阵
1. 安全门禁：test key+active test price、loopback来源/全新本地持久化、无生产绑定、输出脱敏；反例live配置/非loopback拒绝，别让测试程序带production配置启动。
2. A/B真实隔离认证与Free基线；仅合成的独立批次和分析，不搬生产数据/邮箱入Git，原账号label A/B。
3. A通过实际Pairvu checkout路由产生cs_test并由Stripe测试付款成功；真实livemode=false的invoice/checkout/subscription事件经签名检查进入实际webhook处理和本地D1，不手写paid套餐绕过链路。优先Stripe CLI listen转本机并隔离CLI配置；无真实provider事件仅局部工具PASS，不算付款链路PASS。
4. A变Starter且csvExportEnabled=true，额度按已有契约正确授予；B仍Free且隔离，重复同一真实测试事件不重复授额。无/错误签名拒绝，不污染本地记录。
5. A实际导出自己的batch CSV和workbench CSV成功：200、文件类型与下载头、内容/冻结来源/审核字段符合契约、引号换行公式保护与隐私字段；不只测试序列化纯函数。
6. 已具导出权限A请求B批次应404无CSV；A工作台不能列/导出B数据。B Free请求自身CSV403、匿名401。明确Free403本身不证明所有权隔离；已知B合成批次必须确实存在。
7. 两身份的实际鉴权与workspace查询不得用stub替代端到端结论；必要本地fixture范围准确标注。最终生产未变；记录本地余额/Stripe测试对象、结束并清理本轮测试订阅/监听器，不删除历史测试对象。保留原事件去敏摘要和证据hash，报告实际执行层级。

## 允许文件与禁止
原开发可写scripts/jrn02-*.mjs或.ts、fixtures/stripe-csv-sandbox/**、docs/05-evaluation/stripe-csv-sandbox-acceptance.md，必要package.json仅新增明确测试入口。可创建/tmp隔离源码副本/配置；不改生产app/lib/auth/billing/路由或wrangler/迁移、凭据或线上环境。若实际应用缺陷需改runtime，先报精确原因，由总控明确收窄契约；禁止通过测试入口向生产添加免登录/付费旁路。总控仅写operations和进度文档，独立QA只写/tmp。不自动启动其他产品功能。

## 测试预算、停止与角色模型
开发gpt-6-sol/high：涉及D1、身份、Stripe事件/签名、权限到CSV多层隔离，需要较深推理；使用已可用Sol，不默认最贵。独立QA gpt-6-sol/high：独立验证生产隔离、真实provider证据和所有权反例；独立性不降级。权限/凭据/账号缺失不是模型升级理由；出现具体重复推理错误先缩域，必要再评估模型。
先实现安全隔离bootstrap和最小专项，typecheck/lint针对改动；已有绿灯不要重复全套。需浏览器时使用CUA，不能另造Playwright/CDP工具。真实测试付款可用Stripe文档规定测试支付方式；所有远端变更必须test mode且仅本轮对象。任何浏览器工具明确支付限制遵守其交接，不能借后端绕过拒绝。
若遇缺输入先回可复现阻塞与可继续项，总控继续不受阻塞工作；不要等待小时巡检。固定提交后只做相关独立复验，FAIL返原开发。归档无真实邮箱和任何密钥。

## 固定回传和总控持续回收
开发回完整candidateSha、允许文件差分、环境启动/停止方式、安全门禁实证、原始验证材料及真实Stripe/认证是否完成；QA回unitId JRN-02,candidateSha,reviewerThreadId,result,checks含fixed candidate SHA / independent QA report / isolated environment / Stripe test payment / paid CSV and workspace isolation / production unchanged。每项PASS/FAIL/BLOCKED如实，缺输入不能算完成。总控wait_threads带afterCursor持续等待，完成read_thread，正式CLI记录。通过后更新整体进度，生产paid仍未测需明确，不重新部署CSV修复，pairvu-2继续PAUSED。

## 已核实的Live-only入口与最小范围调整
实际生产checkout路由使用isLiveStripeBillingConfigured，test key正常503，这是现有产品门禁，不是本轮要更改的生产功能。用户要求测试模式且禁止修改生产计费，因此保留所有app/lib生产代码；fixtures内允许明确loopback/test-only结账适配入口，必须经过实际Better Auth会话与现有getWorkspaceAccountSnapshot/getWorkspaceBillingRecord以及createStripeCheckoutSession服务（不手写Stripe会话/套餐状态），其余真实Stripe付款、签名webhook、D1、CSV真实路由保持矩阵。此项替代矩阵3的“实际Pairvu checkout路由”要求；正式checkout的test key503作为预期门禁另测。报告显著声明testCheckoutAdapter=true、productionCheckoutRouteCovered=false，不能称生产原入口完整E2E；不以mock付款替代。
只读发现旧Stripe Test Mode账户有历史test webhook指向pairvu.com。不得修改该旧端点；实际应用对test事件在签名/模式检查处即拒绝，早于D1 journal写入。开始付款前证明当前生产拒绝边界并由总控做生产计费只读前后对照；若无法保证不改生产计费，则停真实provider变更、报告需要独立Stripe sandbox配置。CLI监听须只处理本轮runId对象，不能把账户其他测试事件应用到本地工作区。

## 最终收尾（2026-10-13）

固定候选d3fcb9c228c858b81a104baafa902f7aac096217独立PASS，正式local_only CLOSED。最终报告../evidence/JRN-02/qa-final.json；原active-phase报告和原件保留。用户提交唯一Sandbox付款后，真实签名回调/Starter权限/CSV/跨账号/取消降级全部在本地验证；本轮测试订阅已取消、3107无监听。生产6表三次只读摘要一致、生产SHA/Worker不变。
清理开发和清理增量QA分别重新选择gpt-6-sol/high：限定真实test对象归属、签名回调及权限回收跨层核验；环境故障不升级，真实推理不足先缩域。QA独立通过后不再重跑付款，不部署本单元，不恢复pairvu-2。下一步建议可逆写API隔离与ELIGIBLE正向最小契约，待用户确认启动范围。
