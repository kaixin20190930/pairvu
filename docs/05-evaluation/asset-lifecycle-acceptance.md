# JRN-04 合成素材生命周期本地补验

## 独立 QA 返工：删除窗口的发布资格

候选 `94a818b835b62170ea484be177f7b1ee7a97b72a` 的独立验收为 **FAIL**，原件保留在 [qa-attempt-1-originals/qa.json](../../fixtures/journey-asset-lifecycle/qa-attempt-1-originals/qa.json)。此前 14 项开发 PASS 是该候选的历史自测，不覆盖独立发现的 P1：已有 SKU 保护参考图的完整批准来源，仅候选 R2 删除成功、D1 标记失败时，图片 GET503，但发布查询仍返回 ELIGIBLE。独立 [finding.json](../../fixtures/journey-asset-lifecycle/qa-attempt-1-originals/finding.json) 和原始窗口证据均逐字保留，QA 脚本没有修改或重新执行，未覆盖它的报告。

返工只修改 `lib/releases/repository.ts` 的素材可用性表达式：任何已记录的永久删除意图都排除该素材的发布资格。应用已在 R2 删除前写入 `asset_deletion_attempts`；查询使用其现有 asset 索引，无迁移、无需修改 `lib/assets/deletion.ts`，永久删除、失败审计和重试语义保持既有流程。`available` 表示可用于发布，因此 R2 失败后仍能 GET200 的图片也会因删除意图退出资格；正常未来素材没有删除意图时继续 ELIGIBLE。机器/人审/source hash 和冻结产品快照不由该可用性保护修改。

新增 `scripts/jrn04-partial-window.ts` 使用真实 SKU/profile、真实批准和仅候选图可删除的目标，分别观察实际审计 started（暂停真实 R2 删除前）、R2 删除 failed，以及 R2 成功后 D1 标记 failed。旧代码上的自有复现 [rework-pre-fix/partial-final-report.json](../../fixtures/journey-asset-lifecycle/rework-pre-fix/partial-final-report.json) 为 3 PASS / 3 FAIL；修复后 [rework-partial-pass/partial-final-report.json](../../fixtures/journey-asset-lifecycle/rework-partial-pass/partial-final-report.json) 为 **6 PASS**，三个窗口均先 BLOCKED，重试完成后仍 BLOCKED，受保护参考、正常 A/B 来源、所有非目标对象与业务/额度不变。补验的是已有删除意图的失败窗口，不宣称发布查询逐个读取 R2。

相关完整旅程 [rework-journey-pass/final-report.json](../../fixtures/journey-asset-lifecycle/rework-journey-pass/final-report.json) **14 PASS**；两个新环境 runId 分别是 `10ea80f4-a21e-4ecb-a55c-84648b4b00dd` 和 `e3893329-7349-4c6e-911e-6bcf4d7501b8`，所有 manifest 对象清理、服务停止。Typecheck 与返工源码 lint 通过；提交后仍须对精确候选做隔离构建和独立复验。[rework-archive-index.json](../../fixtures/journey-asset-lifecycle/rework-archive-index.json) 记录 53 份旧 QA 原件、自有复现与新 PASS 原件的原始路径、归档路径、字节数和 SHA-256；此前所有失败档案继续保留。以下为首轮实施说明及历史开发结果。

本单元使用全新 Miniflare/workerd D1/R2、所有实际迁移、真实 Better Auth 魔法链接签发/本地邮件捕获/验证，以及两个 `example.test` Free 账号。应用认证、所有权、删除、审核、发布查询均使用实际代码；仅 Cloudflare 绑定替换为本次本地存储。小型 PNG、机器观察和满足来源 schema 的模型元数据行全部是合成输入，机器结果经实际风险策略与 `persistCompletedAnalysis` 保存。`productionLifecycleCovered=false`、`qualityEvidence=false`、`modelCallsExecuted=0`。

启动命令从仓库根目录执行：

```sh
env -i PATH="$PATH" HOME="$HOME" TMPDIR="$TMPDIR" LANG="${LANG:-C.UTF-8}" pnpm exec tsx scripts/jrn04-lifecycle.ts
```

脚本打印唯一 runId 和原始 `final-report.json` 路径。每次创建新的临时 D1/R2；不读取 `.env`、`.dev.vars` 或 Stripe 输入。邮件和 cookie 只留在进程内；其他进程内 fetch 拒绝，worker 出站绑定返回 403，队列仅本地捕获。每个场景及预期注入失败立即写入独立、不可覆盖的 JSON 原件。删除之前的 manifest 记录 workspace、asset ID、对象 key、内容摘要、产品/分析/批次引用、版本和预期范围。私有 D1/R2 与路由 bundle 留在临时目录，不入库；归档仅包含无凭据的 JSON。

本地矩阵涵盖以下可判定行为：

| 范围 | 核验内容 |
| --- | --- |
| 读取撤权 | 本人 200、PNG 摘要、private no-store；外部账号 404；缺身份匿名 400、有效匿名 UUID 404；到期前 1ms 可读、到期及后 1ms 为 410；此时 R2 对象仍存在；null/非法到期值拒绝 |
| 定时清理 | 实际 `deleteExpiredAssets` 用明确的 `options.now`、batchSize=2 分页；只删到期非 deleted 素材；原图/规范图/缩略图去重；删除时间及审计一致；未来/null/非法值与已 deleted 控制对象保留；重复清理扫描/删除为 0 |
| 删除隔离 | A/B 双向针对实际 completed 分析和批次，外部删除为 404，匿名删除为 401；本人同类有效目标成功；账户图片 DELETE 忽略伪造 workspace/actor 字段，只影响当前身份 workspace |
| 活跃保护 | queued/running 分析、queued/processing 批次各自返回 409；账户删除分别在只有每一种活跃任务时返回 409；拒绝前后业务、素材、审计、对象摘要、额度与队列不变 |
| SKU 参考 | 分析/批次删除保留被任一 SKU 参考版本引用的图片；实际晋升新参考后，历史参考仍受保护，非保护候选图被删除；账户与到期清理有不同范围，不继承此排除条件 |
| 资格与审计 | 完整合成来源实际批准为 ELIGIBLE；实际删除候选后 release 为 BLOCKED / assets_unavailable；机器/source hash、人审 revision/原快照、冻结产品来源和额度不变；本人图片 GET 410，外部账号仍 404；重复删除 requested=0 |
| 故障收敛 | R2 删除失败和 R2 成功后 D1 标记失败各做一次窄注入；实际路由返回 500/部分失败，原件保存；通过实际重试完成删除与审计，其他目标外素材逐行/逐对象哈希不变 |

到期边界只在指定图片 GET 中临时替换 `Date.now`，随后恢复；清理时钟是显式参数。业务快照包含真实表摘要、每个 asset 行摘要与 manifest 全量 R2 对象内容摘要；认证表与每次身份解析触碰的 `workspaces.updated_at` 单独排除，workspace 归属、状态和其他字段仍参与断言。删除成功只允许目标 asset 行和删除审计变化，其余业务/机器/审核/冻结来源/额度表全部不变。全量非目标 asset 行与 R2 对象逐项比较。

故障注入是包裹真实本地 D1/R2 的一次性代理，成功操作全部委派实际存储。R2 失败发生于指定 key 的真实 delete 之前：该素材对象保留、状态未标记 deleted，另一素材可以成功删除，响应明确部分失败。D1 故障只阻止指定 `markAssetDeleted` 语句：R2 对象已消失，元数据尚未标记，GET 为 503 / asset_binary_missing，重试容忍不存在对象后完成标记并返回 410。恢复指重试收敛；永久删除的图片不会通过改回 status、复用同 ID 或复制对象冒充恢复。多次新 runId 证明测试环境可重新生成。

已保留运行时修复前原件：[pre-fix/final-report.json](../../fixtures/journey-asset-lifecycle/pre-fix/final-report.json)、[null-expiry-release-original.json](../../fixtures/journey-asset-lifecycle/pre-fix/null-expiry-release-original.json)、[anonymous-delete-responses.json](../../fixtures/journey-asset-lifecycle/pre-fix/anonymous-delete-responses.json)。该完整运行 13 场景中 11 PASS、2 FAIL：

- **P1：空到期值导致不可读图片仍满足发布资格。** 实际 asset GET 为 410，六项完整来源实际批准后 release 仍为 ELIGIBLE。`lib/releases/repository.ts` 的可用性表达式现要求非空且可解析为未来的时间；null、非法和已过期输入均不可用，有效未来输入保持原行为。
- **P2：匿名批次删除被映射为服务器错误。** 实际 account/analysis DELETE 为 401，batch DELETE 为 500，所有业务/R2/额度未变。`app/api/batches/[batchId]/route.ts` 仅 DELETE 捕获 `RequestAccessError` 并返回 401，其他批次行为保持既有契约。

修复范围由总控明确追加到 JRN-04，并另以 JRN-04-FIX 跟踪运行时门禁。最初工具开发中的 D1 原生接口代理缺 `exec`、工作空间认证触碰时间误入摘要、batch 路径复数错误已修正；[harness-attempt-1](../../fixtures/journey-asset-lifecycle/harness-attempt-1) 保留首次完整失败原件，修复前独立矩阵仍如实保留两个产品 FAIL。首个 bootstrap 工具输出为 `Failed to initialize database adapter`，该次尚未生成报告；后续 bootstrap 失败也会在唯一临时目录保存原件。

首轮开发专项报告及每项原件见 [final](../../fixtures/journey-asset-lifecycle/final)。两个预期故障的错误响应、对象状态和失败审计原件分别为 `expected-r2-failure-original.json`、`expected-d1-mark-failure-original.json`。核对全部 manifest 对象已消失、审核/机器历史保留、额度与队列未动；故意预置的 deleted 状态孤立对象只在明确标注的本地夹具收尾中删除。Miniflare 结束前生成最终存储摘要，之后 dispose；无常驻 HTTP 服务。

首轮开发 runId `49d7ec15-76c0-4c57-b26f-cd9427224bf5`：14 场景全部 PASS，27 个合成素材，外发网络调用与队列写入均为 0。typecheck 与五个改动源码文件 lint 通过。[archive-index.json](../../fixtures/journey-asset-lifecycle/archive-index.json) 为 78 份旅程原件及另附的构建失败原件记录原始路径、归档路径、字节数与 SHA-256，复制后逐字节复核一致；包含工具早期失败、修复前产品失败、首次修复通过与增强断言通过，未归档私有数据库。

验证包括实际路由/真实存储矩阵、typecheck、改动文件 lint，并在提交后用 `node scripts/jrn04-build.mjs FULL_CANDIDATE_SHA` 做一次精确 Git archive 源码构建。构建工具使用环境白名单，按文件名排除 `.env*`/`.dev.vars*`（包括模板）而不读取内容，以 macOS APFS 克隆本地依赖并阻断非 loopback Node 网络。首次构建因 Turbopack 拒绝越过源码 root 的依赖符号链接而失败，[build-attempt-1](../../fixtures/journey-asset-lifecycle/build-attempt-1) 保留原始 log/report；构建工具改为目录内依赖克隆，应用源码不因此改变。构建原始 log/report 留在新的临时目录；归档无 Git 元数据，嵌入 SHA 可为 unknown，不能用作生产发布 artifact。

当前结论只覆盖本地合成旅程与顺序删除保护；未证明共享候选被其他活跃任务使用时的保护或 worker 并发竞态，不提供真实图片质量、生产生命周期或外部发布结论。下一步由总控自动将同一候选 SHA 分别交给独立 QA 验收工具与运行时修复；工具 PASS 后可 local_only 关闭，运行时修复 PASS 后止于 RELEASE_READY，生产发布另需明确授权并遵守 GitHub-first 顺序。
