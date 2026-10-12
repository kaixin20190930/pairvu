# JRN-01 核心生产旅程补验清单

本文件交付验收步骤、当轮本地证据和待补覆盖，不宣称整个产品已通过生产旅程。开发角色不操作生产；下一步由独立 QA 在真实登录/UI 中执行可用范围。只要有生产 FAIL、BLOCKED 或 NOT_RUN，`overallProductionJourney=INCOMPLETE`。文档交付的独立 PASS/CLOSED 不改变这条结论。

## 基线、状态及操作边界

源码核对/本地测试基线：`c5bb59d9db5f243fdd9ffb9b30c6d98a92307c97`，2026-10-12。文档候选 SHA 取本文件所在交付提交，不把候选文档提交当作部署 SHA。

生产预期基线 P0：`https://pairvu.com`，发布 SHA `a0b27ac7b5432e9482ffbe50e5ea0f43be18680c`，Worker `3e8dc987-8ec4-4f59-9950-5beebcfb4494`。这是 [JRN-01 契约](../../operations/contracts/JRN-01.md) 与既有发布记录声明的基线，开发本轮没有访问生产核实。每条下表的环境“生产 P0”均包含这两个预期标识；QA 必须先运行 P01，再在原件逐条记实际 SHA/version、观察时间和证据路径。若实际版本不同，停止沿用旧基线，先报告总控。

总控于 2026-10-12T14:14:37Z 补证（脱敏原件 `operations/evidence/JRN-01/account-availability-sanitized.json` 由总控另行归档）：A/B 两个账号当前均 Free、workspace active；A 有 52 条历史分析，B 有 0 条。用户已确认 B 可控制并授权生产隔离验收，第二 UI 会话仍待切换登录。历史 Starter 期和 internal_e2e_1 已耗尽测试包不能代替当前 paid 身份或标准付款验收；历史支付事件的 workspace 归属不全，不能据此全归给 A。开发只读该脱敏摘要，未读取私人身份原件或执行生产查询。

状态只有 PASS、FAIL、BLOCKED、NOT_RUN。NOT_RUN 表示有步骤但本轮开发不执行生产；BLOCKED 表示缺必要输入/授权，不能以本地合成结果补成 PASS。当前生产条目的“实际”是开发交接时的覆盖状态，独立 QA 应在自己的 `/tmp` 原件填入观察值，不覆盖或回填旧记录。

允许的既有合成 QA 标识仅为：product `8e023cd4-16b4-4e77-a957-238e7253947f`、analysis `batch-analysis-d79c71c7-417e-4ce9-8601-3353185d2001`、batch `9e24fe37-4e56-4fad-8edd-b4589bbcb698`。执行前核实当前账户归属及合成标识；这些 ID 本身不是归属证明。其他资产须另有明确 QA 标识/授权，不能把客户资产当测试草稿。

开发只读仓库代码和既有普通文档，在隔离本地环境运行已有验证。不读 `.env`、`.dev.vars`、凭据、cookie/token 或原泄露日志，不执行生产 API、CUA、数据库、模型、付款、部署。独立生产 QA 按契约使用真实 CUA 登录/UI；无凭据公开 HTTP 可用 curl，不从浏览器脚本 fetch、提取会话或直接远端 D1。需要数据库补证交由总控明确查询范围。

## 本轮开发实际验证

只运行以下三个已有验证入口；未新建验证器、改运行时代码、开关或业务数据，未额外全量重跑历史套件。相同源码基线的原始输出在 `/private/tmp/pairvu-jrn01-local/`，目录不是生产环境。

| ID / 真实环境与 SHA | 实际命令 / 前置和步骤 | 可判定预期 | 当轮实际、状态及证据 |
| --- | --- | --- | --- |
| L01 / 本地内存 R2、纯函数与源文件断言；源码基线 | 仓库根目录 `pnpm test:m1:workspace-analysis`；已有依赖，合成 8×8 图像；运行原脚本 | workspace/匿名对象前缀及保留期、所有权比较正确；幂等索引和额度 reserve/settle/release wiring 存在 | PASS，exit 0；[输出](/private/tmp/pairvu-jrn01-local/workspace-analysis.txt)。这是内存对象和静态 wiring 检查，不是真实 D1 事务、真实登录或生产额度结算 |
| L02 / 本地 FakeD1、FakeR2；源码基线 | cwd=`/private/tmp/pairvu-jrn01-local`；用仓库 `node_modules/.bin/tsx` 执行仓库 `scripts/verify-retention.ts`；保留脚本不改，输出仅落临时 cwd | 到期清理失败可重试，原图及衍生键最终移除，立即删除成功，deleted 不再出现在素材列表，删除尝试记录保留 | PASS，exit 0；首轮 3 扫描/2 删除/1 故障，第二轮删除剩余 1，第三轮 0；立即删除 1；4 completed/1 failed 删除尝试。[输出](/private/tmp/pairvu-jrn01-local/retention.txt)、[JSON](/private/tmp/pairvu-jrn01-local/eval/real-m0/reports/retention-verification-latest.json)。不等于真实 R2 删除或 HTTP 410 验证 |
| L03 / 实际隔离 workerd D1、完整迁移及实际仓库/路由；源码基线 | 根目录 `pnpm exec tsx scripts/verify-release-workbench.ts /private/tmp/pairvu-jrn01-local/release-workbench.json`；合成 session/account 边界，真实本地 D1 | 无批准 needs_review；完整受支持证据批准可 eligible；高危/缺失/过期/删除/旧来源批准仍 blocked；租户、筛选、游标、Free/inactive paid 门禁、CSV 及原子读取符合规则 | PASS，exit 0；76 项、1851 次本地 D1 请求；[JSON](/private/tmp/pairvu-jrn01-local/release-workbench.json)、[输出](/private/tmp/pairvu-jrn01-local/release-workbench.txt)。付费 entitlement 使用合成桩，不是真实付费身份；API/session 部分不是生产会话 |

L03 包含当前产品改名/归档不改冻结分组、foreign workspace/owner 拒绝、foreign batch 不可见、approve/reject/revoke 保持机器 PASS，以及 deleted/expired/非法到期/failed 图像阻断 release。L02 的删除审计指 `asset_deletion_attempts`，不是人审链。三个入口未直接执行资产 GET 删除后 410 或生产双账号读写；也未在物理删除后逐字段对照人审链。这些边界保留到 P13/P14/P15，不能用脚本的成功描述扩大覆盖。

开发本轮没有发现上述有限回归中的产品实质 FAIL；这不证明其余路径无缺陷。若 QA 发现 FAIL，记录精确路由、步骤、前后值、代码来源及最小修复建议，返总控明确 runtime 修复单；不要在本清单单元擅自修改实现或掩盖失败。

## 历史证据独立列示

| 来源 | 记录中的历史覆盖 | 本轮的使用限制 |
| --- | --- | --- |
| [UPG-10 发布 manifest](../../operations/evidence/production-upg10-2026-10-12/manifest.json) / [生产功能报告](../../operations/evidence/production-upg10-2026-10-12/production-functional.json) | operations/README 记录 P0 已部署启用；7 项 HTTP、18 项真实登录 PASS，90 天 52 条历史分析当时全部 unknown，余额/原结果/审计不变 | 仅索引既有最终报告，开发未重验生产或读取原泄露日志；52 是当时 cohort，不是本轮硬编码预期。不能替代当前账号、导出、生命周期和第二账号观察 |
| [UPG-06 最终发布 manifest](../../operations/evidence/production-upg06-2026-10-12/manifest.json) | operations/README 记录当时 8 项 HTTP、16 项真实登录 PASS；付费 CSV 正向、登录导出 HTTP 403 和完整 ELIGIBLE 正向未生产覆盖 | 更早 SHA/Worker 的历史证据，不是 P0 新验收；恰是本清单应保留的待补边界 |

## 当前生产清单：可用范围

下表每项证据栏指应保存的新原件及代码来源；目前没有 JRN-01 新生产证据。生产 HTTP 结果必须记录响应状态/非敏感摘要，截图不得展示凭据。会话缺失时先做 P01/P02，P03 以后真实登录项 BLOCKED 并继续不依赖会话的项。

| ID / 环境 | 前置与具体步骤 | 可判定预期 | 本轮实际 / 状态 | 新证据及代码来源 |
| --- | --- | --- | --- | --- |
| P01 / 生产 P0 | 无凭据打开 `/api/health`，保存 UTC 时间、`buildSha`、`platformVersion`；与 P0 对照 | HTTP 200、ok=true，两个实际标识与 P0 相同；unknown 或不一致不可当已绑定版本 | 开发未访问；NOT_RUN | QA `health.json`；[health 路由](../../app/api/health/route.ts)、[版本输出](../../lib/release-version.ts) |
| P02 / 生产 P0，独立匿名会话/公开 HTTP | 不破坏已登录会话；无凭据访问 `/account`、`/account/products`、`/account/batches`、`/account/batches/new`、`/account/releases`、`/account/value-metrics`；读 `/api/account/session`、`/api/billing/context`、`/api/products`、`/api/batches`、`/api/releases`、`/api/value-metrics`、既有 QA analysis 的 reviews、两类 export。analysis GET 用既有 QA ID、不传匿名标识；asset ID 只能来自获准 QA 资产 | 账户页跳登录；products/batches/releases/metrics/reviews/export 受保护拒绝；session/billing context 可 200 但仅 authenticated=false。analysis/asset 在完全无身份时按现有代码是 **400 access_identity_required**，不是统一 401；合法匿名标识也不得读 workspace 私有资源，应 404。严禁返回用户图片/审核/CSV 数据。匿名标识隔离需合法独立测试输入，不凭空伪造所有者标识 | 开发未访问；NOT_RUN；合法匿名资产比较若无获准输入则该子项 BLOCKED | QA `anonymous-checks.json`，每条独立状态；[访问解析](../../lib/auth/request-access.ts)、[analysis GET](../../app/api/analyses/[analysisId]/route.ts)、[asset GET](../../app/api/assets/[assetId]/route.ts)、[reviews](../../lib/reviews/http.ts)、[release 门禁](../../lib/releases/http.ts)、[metrics 门禁](../../lib/value-metrics/http.ts) |
| P03 / 生产 P0，当前真实账号 | CUA 正常登录并核实三组 QA ID 的归属及合成标识；打开 `/account`，记录 plan、available、保留天数、相关历史 verdict/完成时间/图片可用性、当前审核 revision/action。结束时再读同一窗口和记录 | 只读操作不改变计划/余额、机器结果；必要人审写入只能造成已记录的新增 revision。未经核实资产不能进入可逆/审计测试 | 会话/当前值待 QA 核实；NOT_RUN，不把历史“余额 6”当当前值 | QA `account-before.json`、`account-after.json`、`machine-before-after.json`；[账户页](../../app/account/page.tsx)、[账务 context](../../app/api/billing/context/route.ts) |
| P04 / 生产 P0，真实账号 | 导航 Overview→Products→Batches→既有批次→分析→Releases→Value metrics；工作台分别选择 All records/Needs review/Blocked by rule/Current approve or reject，以 batch ID 与已有冻结 SKU 搜索。用确知不匹配 SKU 看空态；有 Continue search 时继续/Back to first page；清空表单输入、选择 All records 后 Search 恢复，返回既有 QA 记录 | active link 与路由一致；筛选空态不等于全库为空；cursor 随新 Search 重置，分页不重复；blocked 可同时属于 decided，不要求四种筛选互斥。没有独立“清空”按钮，不编造 Reset 操作。metrics 采用 UTC 起含止不含、最大 90 天；无效窗显示错误/无完整卡片，改有效窗 Apply window 恢复 | 开发未做生产导航；NOT_RUN。真实 DB/网络故障态不可注入生产；若无自然错误，其故障恢复子项 BLOCKED/仅本地历史，不当生产 PASS | QA `navigation-filter-recovery.json`、空态/恢复截图；[工作台 UI](../../app/account/releases/ReleaseWorkbenchClient.tsx)、[筛选](../../lib/releases/repository.ts)、[指标 UI](../../app/account/value-metrics/ValueMetricsClient.tsx) |
| P05 / 生产 P0，获准多 SKU 与旧批次组合 | 先通过产品/批次 UI 确定是否有至少两个明确获准 QA SKU；记录各自文本/参考 version IDs、number、冻结名称/SKU、batch/analysis 关联与 boundAt；对照分析和工作台。**批次读取为 `/api/batches?batchId=…`，不是 GET `/api/batches/:id`**；后者仅有 PATCH/DELETE/export 子路由 | 两 SKU 不串关联，当前版本与旧冻结版本明确区分；原分析/旧批次保持原冻结文本和参考。无冻结绑定的历史不能标“已有冻结” | 契约仅明确给出一个 product；第二个获准 SKU/可比旧快照未提供，完整多 SKU 子项 BLOCKED。已给组合的只读核对 NOT_RUN，可先执行 | QA `frozen-before-after.json`；[batch GET](../../app/api/batches/route.ts)、[批次 UI](../../app/account/batches/new/BatchCreationClient.tsx)、[发布规则快照](../../lib/releases/policy.ts) |
| P06 / 生产 P0，已核实可逆 QA 草稿和旧快照 | 记录 P05 全部前值；仅获准 QA 产品在标准编辑器更改名称/SKU并“Save product standard”，检查生成新文本版本，再按前值保存恢复语义；“Archive product”→核实新批次选择器不含该产品→“Restore product”→核实重新可选及编辑器可用。每次记录 revision、UI 当前值与旧批次/分析；不上传、不提交/重试分析或新批次 | 版本化产品名称/SKU在标准编辑器改，settings 输入禁用；保存必须保持完整 profile，旧版本不删除。归档/恢复保留 references/history，旧冻结 JSON/IDs/labels 不变；恢复语义会新增版本/审计，不能声称 revision 回到原值。409 时保留草稿，Load latest 后人工确认，不强制覆写 | 可逆草稿及可核对旧快照待核实；NOT_RUN。缺组合或无法安全恢复时 BLOCKED，不碰其他客户产品 | QA `product-mutations.json`、每次及恢复截图；[标准编辑器](../../app/account/products/[productId]/ProductProfileClient.tsx)、[生命周期 UI](../../app/account/products/[productId]/SavedProductSettingsClient.tsx)、[产品 PATCH](../../app/api/products/[productId]/route.ts) |
| P07 / 生产 P0，既有合成 analysis 当前审核已记录 | 打开 `/?analysis=batch-analysis-d79c71c7-417e-4ce9-8601-3353185d2001`；通过 Human decision、Review category=other、Review reason=`JRN-01 QA …`、Record human decision，按必要最少步骤观察 approve/reject/revoke，每步 Refresh review history并重新读工作台；不重跑机器。记录 machine verdict、observations/issues/limitations/版本/完成时间原值与末值、每条审核 revision/时间和动作 | 人审独立、revision 连续追加，机器证据不改；reject 在完整来源时 blocked，revoke 在完整来源时 needs_review；存在缺失/高危来源时所有动作均 blocked。不要因行已 blocked 就忽略其新增人审动作 | 未做生产写入；NOT_RUN；登录、归属或当前机器来源无法观察则相应对照 BLOCKED | QA `review-journey.json`、每动作 UI/审计/工作台；[审核 UI](../../components/ReviewDecision.tsx)、[审核仓库](../../lib/reviews/repository.ts)、[优先级](../../lib/releases/policy.ts) |
| P08 / 生产 P0，与 P07 同一合成 analysis | 在 P07 前记 baseline 当前决定语义；结束后如 baseline approve/reject，用新的明确 JRN-01 QA 恢复动作达到同一语义；baseline None/已 revoke 则 revoke 清空当前决定。完整保存新增链，不删审核事件；核对末值与恢复语义及余额 | 不要求恢复原 revision/requestId；无当前决定时不能直接初始 revoke，应在存在当前决定时撤销。未知提交结果先 Retry same decision request，不重复新请求；409 Load latest decision and keep draft 后确认。最终语义恢复、机器/额度不变、所有 QA 新事件仍可见 | NOT_RUN；恢复无法完成或出现冲突必须报告 FAIL/阻塞，不能宣称旅程结束 | QA `review-restoration.json`，baseline及最终action/revision；[审核 UI](../../components/ReviewDecision.tsx)、[验证](../../lib/reviews/validation.ts) |
| P09 / 生产 P0，缺失/高危反例与完整正向 | 对已获准现有分析记录 release reasons；若确有缺失/高危，观察批准后仍 blocked，保留具体原因码。正向只用已存在、满足受支持机器/所选 checks 全部可观察、无 limitation、高危差异、图片可用、绑定完整且审核来源一致的分析 | 人审不绕过高危/来源完整性；完整受支持机器 PASS 无当前批准为 needs_review；完整受支持来源 + 当前 approve 才 eligible。完整指 **所有已选择 checks**，不是硬性“必须六项”。产品冻结绑定存在时应验证其完整性；eligibility 不会外部发布 | 反例生产输入待核实，NOT_RUN；完整正向合格素材未提供，ELIGIBLE 正向 BLOCKED。不能修改机器行/版本/hash或新调用模型来制造正向 | QA `eligibility-reasons.json`；[规则及版本 manifest](../../lib/releases/policy.ts)、L03（只作本地支撑） |
| P10 / 生产 P0，真实 Free 账号与匿名 | Free 打开 Releases：观察“Export this search page (CSV)”禁用及 paid 文案；既有批次显示“Upgrade for CSV export”而非可用下载；独立匿名打开两种 export 的公开无凭据路径 | Free UI 不产生 CSV；匿名拒绝不返回数据；不要把 Free 禁用按钮等同于登录 HTTP 403 证据 | 总控脱敏补证确认两账号当前Free，UI门禁待本轮QA观察；NOT_RUN | QA `export-ui-gates.json`、匿名响应；[workbench CSV](../../app/api/releases/export/route.ts)、[batch CSV](../../app/api/batches/[batchId]/export/route.ts)、[batch UI](../../app/account/batches/new/BatchCreationClient.tsx) |
| P11 / 生产 P0，真实登录 Free HTTP 拒绝 | 仅有真实 UI 已暴露的导出链接/请求可观察时，通过其正常 UI 操作记录登录请求拒绝；不抽会话，不用脚本 fetch，不伪造套餐，不为补证手造绕过 UI 的导出请求 | 实际登录响应 403、csv_export_upgrade_required、无 CSV；workbench 下载请求应承认 scope=page。匿名 401和 Free UI disabled 不能替代此检查 | 未提供可观察登录 UI 导出路径；BLOCKED，QA若找到合规路径可执行并保留原阻塞 | QA `free-export-http.json`（真实请求状态/非敏感摘要）；同 P10 服务器端源码 |
| P12 / 生产 P0，真实 active paid 会话 | 使用真实已付费且获准测试账户，在 Releases 点击 Export this search page (CSV)，批次点击 Export CSV；仅本地保存下载，不外发。核对原机器/frozen versions/rule hash/human revision、筛选及导出分页范围，CSV 引号/换行和公式保护 | 200 text/csv；导出仅指定有界窗口，不冒称全库；CSV无私密 actor/note，必要 continuation headers/提示正确。当前审核/规则一致，不凭合成桩认证付费身份 | 未提供真实 paid 会话；BLOCKED。不得购买、改套餐或伪造 entitlement 为本项凑 PASS | QA `paid-export.json`及获准 CSV 摘要/哈希；[CSV格式](../../lib/releases/csv.ts)、P10 路由 |
| P13 / 生产 P0，合成资产可用及现有到期记录 | `/account` 记录保留天数、历史 Images available / Images deleted or expired；从获准既有分析 UI 打开图片/到期图片路径，观察原图可用/缺失提示；版本化参考 UI 查看 available until；不为了到期改系统时间或数据库 | 未到期 owned asset 可 200；deleted/expired 已获准 owned asset GET 410；异常到期亦拒绝，failed 409，R2 二进制缺失 503；跨归属先404而不泄漏生命周期。结果/人审元数据可保留，release 图片不可用为 blocked | NOT_RUN；如没有获准到期/已删除素材或 UI无法观察相应路径，该子项 BLOCKED。L02/L03未直接执行生产/本地资产GET410 | QA `asset-lifecycle-read.json`、UI及可观察响应；[asset GET](../../app/api/assets/[assetId]/route.ts)、[账户历史](../../app/account/page.tsx) |
| P14 / 生产 P0，永久删除与审计保留 | 只有明确精确获准可删资产、确认共享参考影响、满足工具最终确认/用户交接时才删除；不默认使用 Delete all workspace images。analysis、batch和workspace各删除入口范围不同；先记录机器/审核链，再操作获准最小入口，核对资产访问拒绝及机器/审计不变 | 活跃analysis queued/running或batch queued/processing拒绝409；成功删除原图/衍生/thumbnail并记录删除尝试，failed项可重试；分析/批次单项删除应保留 Saved Product references，workspace 全量不能如此假设；审核历史保留，不声称删除不存在 | 本轮无精确可删资产及最终交接；BLOCKED，优先完成P13。L02仅本地Fake存储删除尝试，L03仅修改合成资产状态后验证资格，均非生产永久删除证明 | QA `deletion-and-audit.json`；[analysis DELETE](../../app/api/analyses/[analysisId]/route.ts)、[batch DELETE](../../app/api/batches/[batchId]/route.ts)、[workspace DELETE](../../app/api/account/assets/route.ts)、[删除实现](../../lib/assets/deletion.ts) |
| P15 / 生产 P0，两个真实不同 workspace 账号 | 各自正常登录，以获准合成资源为对照；B 通过正常可观察UI导航尝试A产品/analysis/batch及允许的导出路径，A再重读原值。仅明确授权的写操作才验证跨归属拒绝；如无合规UI可观察写请求路径，写隔离子项BLOCKED，页面404不能替代写API拒绝。不分享cookie，不构造会话/付费身份 | 对A私有资源404/不可见，无读取/人审或产品写入成功，A原资源不变；列表只能各自workspace。Free账户403 export只能证明套餐门禁，不证明paid导出的跨workspace404 | 用户已确认B可控制且授权隔离验收；第二UI会话待切换登录、不同workspace待QA确认，NOT_RUN。若登录受阻记录具体BLOCKED，不再称没有第二账号。L01所有权纯函数与L03实际D1读取/导出门禁不等于生产双账号，也不穷尽所有跨账号写端点 | QA `two-account-isolation.json`；[访问判断](../../lib/auth/request-access.ts)、[product读写](../../app/api/products/[productId]/route.ts)、[reviews仓库](../../lib/reviews/repository.ts)、[release owner查询](../../lib/releases/repository.ts) |
| P16 / 生产 P0，计费和指标只读 | P03前后对照 plan/available；打开 Value metrics，同一固定有效UTC窗口记录纳入/排除、比率分母、成本覆盖、人审等待说明，再切默认/有效90天窗；明确QA来源历史未验证，不能补造 business；pricing只观察，不触checkout/pack/portal按钮 | 只读与必要人审/可逆产品操作不扣分析额度；test/unknown排除全部业务指标，unknown不当0实际业务，空分母/无已知成本null。机器模型不冒充图片生成模型；等待时间不等于人工耗时、无ROI/质量结论。任何 business 来源须有真实受控证明，本轮不导入 | 指标生产只读 NOT_RUN；真实付款、加量包、portal写操作无授权，分别BLOCKED/未执行 | QA `metrics-and-credit.json`；[指标契约](../01-architecture/value-metrics-contract.md)、[指标API](../../app/api/value-metrics/route.ts)、[账户计费UI](../../app/account/BillingActions.tsx) |

## 明确的输入缺口与交接顺序

缺口不是产品故障，须与 FAIL 分开。独立 QA 先核实是否有现存合规输入，不要求用户重复提供已可用输入；发现缺少时保留 BLOCKED 并先完成无依赖项；B账号已经确认，不能再记为账号缺失。

| 依赖 | 影响 | 所需真实输入或授权 |
| --- | --- | --- |
| 当前真实登录 | P03起的大多数观察 | 正常账号会话；失效由用户正常登录，不从文件读凭据 |
| 第二真实会话与不同workspace核实 | P15生产读写隔离 | B账号已确认可控制并获授权；正常UI切换登录，核实不同workspace及合成测试范围。B当前0分析不能当有正向分析资产 |
| active paid 会话 | P12、P15 paid跨workspace导出 | 已有真实付费测试账户；本轮不付费或伪造付费状态 |
| 可观察 Free 登录导出路径 | P11 | 合规真实UI暴露的请求及可读拒绝状态；没有则保持BLOCKED |
| 第二QA SKU、可比旧冻结快照及安全草稿 | P05/P06 | 当前归属、合成标识、完整标准前值、既有历史关联；无组合不制造新分析/消耗模型 |
| 完整 ELIGIBLE 正向与实际负向来源 | P09 | 已有受支持、完整所选checks、图片可用、无高危/limitations的分析；不篡改机器证据 |
| 到期/删除素材、精确可删范围与最终确认 | P13/P14 | 已有合成生命周期例；删除单独满足确认/交接，特别检查共享 Saved Product reference |
| 真实付款/pack/portal 写授权 | P16付款子项 | 本契约无授权；保持未执行，不阻碍指标只读 |

自动继续的下一步：总控将此固定文档 SHA 交现有独立 QA；QA先核实P01/P02，再核实当前会话，执行不依赖缺口的 P03/P04/P05只读/P10/P13/P16及安全允许范围。可逆产品和追加审核须先记录P03/P05/P07基线，按P06/P08恢复语义与审计交接。B账号已确认后优先通过真实UI切换登录补P15；若确实登录受阻列具体BLOCKED。缺paid/素材/删除确认时列BLOCKED，需要用户或资产保管方提供相应输入；不得因此用合成标绿，也不要阻止可用范围继续。发生产品FAIL由总控决定明确runtime修复单和重新选模型，应用发布仍须另遵守GitHub-first。

## 独立原件记录格式

QA只写 `/tmp`，每项至少保留下列字段。`checks` 为上表 ID 列表，子项可用 P02.analysis、P09.positive 等独立状态；不能一个总PASS覆盖BLOCKED子项。

```json
{
  "unitId": "JRN-01",
  "candidateSha": "<本清单固定40位提交SHA>",
  "reviewerThreadId": "<实际独立QA身份>",
  "result": "<仅指清单/可用范围交付的PASS或FAIL>",
  "overallProductionJourney": "INCOMPLETE",
  "checks": [
    {
      "id": "Pxx.subcase",
      "environment": "production|local|historical",
      "observedAt": "<实际UTC>",
      "deploymentSha": "<实际值，非文档候选>",
      "platformVersion": "<实际值或缺失>",
      "preconditions": "<已核实身份/资产/授权，不存凭据>",
      "steps": "<实际执行步骤>",
      "expected": "<可判定预期>",
      "actual": "<真实前后值或未执行原因>",
      "status": "PASS|FAIL|BLOCKED|NOT_RUN",
      "evidence": ["<本轮新原件路径/hash>"],
      "dependency": "<缺口、下一步及是否需要用户输入>"
    }
  ]
}
```

生产、启用及完整验收为不同事实：P0 已部署启用是历史基线声明；本单元未发布应用；当轮生产验收取QA独立原件。原件索引只列本轮新材料，不递归包含仓库、秘密文件或原泄露日志。总控保存原始FAIL/BLOCKED及最终报告，再更新整体进度；pairvu-2继续PAUSED。
