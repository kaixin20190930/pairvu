# UPG-06 发布工作台与规则版本

## 目标与依赖
UPG-05真实生产验收并CLOSED后实施：为已登录workspace提供按SKU/批次和人工状态检索的发布工作台，明确分离机器verdict、人工decision、规则eligibility，并导出带规则版本及原始快照的决定。只实现可审查的内置保守规则版本，不增加可执行表达式或电商外部发布。

## 允许范围
lib/releases/**；app/account/releases/**；app/api/releases/**；components/AccountWorkspaceNav.tsx；必要局部样式；既有批次导出路由的共享导出安全修复/字段补充；lib/cloudflare/bindings.ts及默认关闭的功能开关配置；仅必要的lib/analysis/lib/batches/lib/reviews只读辅助；必要增量migrations/0022_*（先证明需要）；scripts/verify-release-workbench.*、fixtures/release-workbench/**、package.json专项入口；docs/01-architecture/release-workbench-contract.md。不改原机器结果、审计事件、计费权限和既有QA规则语义。

## 判定协议
- 服务端真实session/workspace ownership；匿名401/登录跳转、跨workspace不可见、不可用client workspace/actor授权。只读GET，不写人工决定；查看详情跳回已有单分析审核界面。功能开关默认关闭，关闭时路由安全拒绝且导航不展示。
- 工作台展示分析来源、冻结SKU/产品标准/参考版本、批次、机器结果、当前人工决定/revision、发布资格及可读理由。支持SKU或product ID、batch ID、pending_review/blocked/decided筛选，参数严格边界及确定性有界分页。不得先截断再筛选却宣称完整；明确游标/排序和空态，避免跨租户枚举。
- 规则独立于原riskPolicyVersion：不可变内置release-policy版本+稳定hash+说明；响应、UI、导出均携带。最小规则：非completed、缺失/无效机器证据或未知版本不能eligible；人工reject为blocked；已确认high/critical机器问题不因approve变为eligible；没有现行approve（包括revoke）为needs_review；只有证据完整且无high/critical阻断并有当前approve才eligible。机器REVIEW的limitations仍明示，需要人审且不能隐去缺失/错误证据。检测版本/结构不满足契约时fail-closed。开发先在架构契约写清证据完整性和状态优先级，用可读reason codes覆盖每条，禁止仅凭machine PASS自动eligible。
- 人工批准≠已对外发布。eligibility是本次规则评估结果，标明evaluatedAt、规则hash、analysis machine来源hash及review revision；不得改写历史。规则版本不接受任意客户端覆盖。历史未知/legacy必须明确needs_review或blocked及原因，不能猜测版本。不增加规则编辑器、批量批准、外部渠道发布、Webhook。
- SKU使用冻结产品快照身份/版本；改名/归档不篡改历史。批次/单分析均按既有所有权和保留语义；删除图片后结果仍明示不可用素材，不自动eligible。
- 导出沿用现有paid csvExportEnabled gate，不购买/修改套餐、不通过新端点绕过；有界结果/明确上限，不静默截断。每行含原machine verdict/版本、人工action/reason/revision、规则version/hash、eligibility/reasons/evaluatedAt及冻结产品/reference版本。同一行机器/人工来源必须一致；避免多查询竞态混合revision，设计快照读取或可检测安全退化。CSV防公式注入和换行/引号，不泄露其他租户或私有用户数据，不输出密钥。

## 验收与测试预算
固定SHA独立QA，实际本地D1/真实组件浏览器：匿名/跨workspace/伪造过滤参数、过滤分页边界、SKU历史改名/归档、未知/缺失版本、未完成/失败/图片删除、机器PASS无approve、approve+高危仍阻断、reject/revoke、规则hash确定性与导出对应、审核并发期间读取一致性、付费gate、CSV公式/转义；桌面与窄屏、关闭开关/导航、空态和错误态。复用已实证基础测试，新增独立反例；typecheck及相关回归，一次必要build；不全量机械重跑，不触生产/外部模型/付款。测试代码归档不能以.ts进入生产编译。

## 角色与停止
原开发gpt-6.1-sol/high：跨租户过滤、规则安全退化、并发读取和CSV权限有跨模块风险。原独立QAgpt-6.1-sol/high：需独立构造规则误放行、隔离与竞态反例，非只读即降档。此选择按本单元风险重新评估；只有重复可定位推理不足才考虑更高模型，环境问题不升级。开发唯一应用写入者；QA不改共享代码。禁止push/deploy/生产DB/模型计费调用，需额外范围或语义冲突停交总控。两次同类失败先诊断缩域。

## 回传与完成
开发完整candidate SHA、允许diff、真实命令/证据/局限；QA unitId/candidateSha/reviewerThreadId/result/checks含fixed candidate SHA与independent QA report及独立反例。FAIL回原开发。通过正式RELEASE_READY，用户未授权UPG06生产。此时总控按用户选择暂停pairvu-2并核验结果，报告下一步：待新发布授权后GitHub-first迁移/部署/启用及真实生产验收。
