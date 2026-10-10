# SKU 版本化产品标准契约（UPG-03A，待实现）

基线 `0757622a5866794476a00474d41dfd7f6323c3c6`，2026-10-10。本文是 03B 的设计输入，不是已上线声明，不授权迁移或发布。字段唯一规范见[字段矩阵](../02-product/sku-profile-field-matrix.md)。03B 只增加资料记录、并发保护与来源快照，不改变当前模型判定、提示词、计费、队列优先级或保留政策。

## 1. 核实的现状与缺口

| 现状与代码入口 | 当前事实 | 设计增量 |
| --- | --- | --- |
| [0017 migration](../../migrations/0017_saved_products.sql) / [0019 migration](../../migrations/0019_saved_product_reference_views.sql) | products 有 workspace、name、sku_label/sku_key；0019 增 active/archived、archived_at；非空 sku_key 在 workspace 唯一 | 新增全产品 revision、文字版本指针；不改变 SKU 唯一语义 |
| [产品 repository](../../lib/products/repository.ts) / [types](../../lib/products/types.ts) | name NFKC+trim+空白折叠，≤120；sku≤80、en-US lowercase key；更新原地覆盖，无 expectedVersion | 独立 immutable profile 历史、事务 CAS 与幂等账本 |
| [产品集合 API](../../app/api/products/route.ts) / [详情 API](../../app/api/products/[productId]/route.ts) | 登录 workspace 必需；POST productId 作创建重试标识；PATCH 要求 name，可改 SKU/status | 保留入口，版本化产品不得走无 CAS 的旧写入 |
| [参考图 API](../../app/api/products/[productId]/references/route.ts) | POST assetId、role；reference 预查后独立 db.batch；MAX(version)+1 在事务外计算 | product revision 统一保护资料、参考图和生命周期写入 |
| [0017](../../migrations/0017_saved_products.sql) / [0019](../../migrations/0019_saved_product_reference_views.sql) | reference unique(product_id,version_number)、unique(product_id,asset_id)；每 role 一个 current；role 为 front/back/left_side/right_side/detail/other | 保留约束；不同 role 也共用产品 revision，不从 profile 版本推导参考版本 |
| [批次 repository](../../lib/batches/repository.ts) / [validation](../../lib/batches/validation.ts) | product 仅用于 one_reference_many_candidates；fingerprint 含 productId 和图片映射；先校验 current reference，再写 batch/items；名称/SKU 由实时 products join 获取 | 创建事务内再校验并写快照；历史显示不再假设实时 join 是历史值 |
| [批次 API](../../app/api/batches/route.ts) / [worker](../../lib/batches/worker.ts) | batch 创建后 reserve credits 再 enqueue；worker 从 item 固定 asset IDs 分析，使用 batch-item 幂等键，可重试失败分析 | 只传递冻结来源，不在消费时读最新产品；不改既有额度策略 |
| [分析 API](../../app/api/analyses/route.ts) / [service](../../lib/analysis/service.ts) / [repository](../../lib/analysis/repository.ts) | 单图无 productId/profile 输入；登录或匿名资产所有权；createAnalysisRecord 分别写 analyses 与 analysis_references，重试比较图片 ID | 可选产品绑定限 workspace；绑定与首次记录同一事务；无产品路径保持可用 |
| [资产删除](../../lib/assets/deletion.ts) / [资产 repository](../../lib/assets/repository.ts) | 按 expiry 扫描，删除 R2 对象后标记 deleted；产品引用不阻止保留到期删除 | 快照只存元数据，不延长 expiry；R2 与 D1 不能伪装单事务 |
| [设置 UI](../../app/account/products/[productId]/SavedProductSettingsClient.tsx) / [参考图 UI](../../app/account/products/[productId]/PromoteReferenceClient.tsx) / [批次创建 UI](../../app/account/batches/new/BatchCreationClient.tsx) | 管理 name/SKU/归档、参考图角色；批次选择一个参考视角 | 最小资料编辑、版本冲突恢复、明确版本绑定 |

旧流程中的预读不是锁；读取后 profile/reference/status/retention 均可能改变。SQL 唯一约束只能部分发现冲突，不能保证错误事务前面已做的修改不被提交。不能把 D1 当作带 RLS 的 Postgres。

## 2. 数据模型决定

以下均为 03B 新增设计，不修改旧 migration。建议新文件 `migrations/0020_product_profiles.sql`，开工时若编号已占用则顺延并记录，不覆盖历史文件。

| 表/字段 | 类型、约束、索引与生命周期 |
| --- | --- |
| products.revision | INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0)，每次成功修改 profile、参考图、status 恰好 +1；API 只接受安全整数 expectedVersion |
| products.current_profile_version_id | TEXT NULL；NULL 表示 legacy_unversioned；指针由事务维护，SQL trigger 校验指向同 workspace/product 的版本，避免 ALTER 引入循环 FK |
| products 唯一索引 | 新 UNIQUE(workspace_id,id)，供复合 FK；保留现有 workspace SKU 唯一索引 |
| product_profile_versions | id TEXT UUID PK；workspace_id/product_id TEXT NOT NULL，复合 FK→products(workspace_id,id) ON DELETE CASCADE；version_number INTEGER>0；schema_version INTEGER CHECK=1；profile_json TEXT NOT NULL CHECK(json_valid(profile_json))；profile_sha256 TEXT NOT NULL（64位）；source TEXT CHECK='user_confirmed'；created_at TEXT UTC；created_by_user_id TEXT审计标识，不向不相关 workspace 输出 |
| profile 索引/不可变性 | UNIQUE(product_id,version_number)，UNIQUE(workspace_id,product_id,id)；索引(workspace_id,product_id,version_number DESC)。UPDATE profile 内容一律 trigger ABORT；禁止业务删除接口，合法 workspace 清除可通过 FK cascade 删除，不用禁止全部 DELETE 的 trigger 阻断清除 |
| product_mutation_requests | workspace_id/product_id/request_id 复合主键；action(profile/reference/lifecycle)、fingerprint SHA256、result_revision、result_profile_version_id nullable、result_reference_version_id nullable、result_status、created_at；FK workspace/product，ON DELETE CASCADE。记录仅含此次操作稳定结果，不保存短时图片 URL；不按固定 TTL 删除，从而不会把旧重试当新写入 |
| product_write_guards | token TEXT UUID PK、workspace_id/product_id TEXT、ok INTEGER NOT NULL CHECK(ok=1)；只在同一 batch 内插入/删除，不允许成功事务留下行；用于把 CAS miss 转成 SQL 异常。此表不存凭据，不是分布式锁 |
| batch_product_snapshots | batch_id PK/FK→batches(id) ON DELETE CASCADE；workspace_id FK→workspaces(id) ON DELETE CASCADE；product_id、product_revision、profile_version_id、reference_version_id、snapshot_json、snapshot_sha256、bound_at。创建前在 SQL guard 中验证 batch/workspace；不把 product/profile/reference IDs 作强 FK，以便合法产品/资产清理后仍能解释历史元数据 |
| analysis_product_snapshots | analysis_id PK/FK→analyses(id) ON DELETE CASCADE，其余同 batch 快照；批次来源额外 source_batch_id nullable，必须同 workspace。不允许服务端从客户端接收任意 snapshot JSON |
| 快照内容 | schemaVersion=1、productId、revision、profileVersionId/Number、完整规范化 profile、referenceVersionId/Number/Role、referenceAssetId、boundAt。profile_json 来自数据库版本，不来自客户端；不存图像、R2 key、预览 URL 或身份映射。表行 UPDATE 被禁止；删除随所属报告/合法 workspace 清除 |

引用元数据不可变指 id/asset/version/role/createdAt，不包括现有 current→superseded 的状态标记；03B 加 trigger 拒绝这些核心列的 UPDATE，current 状态变化仅通过 guard 事务。currentReference 兼容输出继续 front 优先；新绑定必须给出一个具体 referenceVersionId，不以默认优先级选择。已经 superseded 的同一 asset 不重新提升：保留 unique(product_id,asset_id)，返回409 reference_already_versioned；同一 current asset/role 重试只返回已存在结果。新上传产生新的 asset ID。03B 不实现“复用旧版本为新版本”。

所有新 JSON 写入同时进行矩阵校验；SQL json_valid 不代替业务校验。索引和查询均带 workspace。profile metadata 与 snapshot 不是公开资源；产品/profile/ref/batch/analysis 任一 ID 来自另一 workspace 一律404，不返回它的版本号或错误详情。匿名不能绑定产品，返回401；不能用“有合法UUID”代替所有权检查。

## 3. 确定的 D1 原子写法与幂等

使用一次 `db.batch(preparedStatements)`，不在 Worker 中发 BEGIN/COMMIT，也不在事务中等待 JS 回调或 R2。D1 官方规定 batch 按序执行，任一语句失败回滚整组；[D1 batch 文档](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)。外键约束默认启用，不用关闭 FK 的方式完成迁移；[D1 外键文档](https://developers.cloudflare.com/d1/sql-api/foreign-keys/)。以下是基于该语义的项目设计，03B 必须用本地实际 D1 引擎验证，普通内存 mock 不能证明回滚。

每次写入服务端生成不可预测的 guard token 和新版本 UUID。先做鉴权及输入规范化，再按 workspace/product/requestId 查幂等账本：相同 fingerprint 直接返回稳定 mutationResult、resumed=true；不同则409 idempotency_conflict。fingerprint 包含 action、productId、expectedVersion、规范化完整 payload；不含服务端时间、随机新版本 ID。并发重试的这个预查不是正确性依据，唯一键才是。

一次 profile 修改 batch 的固定顺序：

1. INSERT guard，使用下面形式确保查询不匹配也插入 ok=0 并触发 CHECK 失败。predicate 包含产品存在、workspace、revision=expectedVersion、status=active；首次 profile 可 current=null，后续指针必须有效。
2. INSERT mutation_requests 的唯一键与 fingerprint（先写本次预定结果 revision=expected+1 及新 profile ID）；冲突回滚整个 batch。
3. INSERT profile vN：在事务内从该 product 的现有版本求 MAX+1；payload/hash 为服务端规范化输入。不能把事务外 MAX 当唯一依据。
4. UPDATE products 的兼容 name/sku_key/sku_label、current_profile_version_id、revision=revision+1、updated_at，WHERE 同 workspace/id/revision。SKU 唯一冲突必须回滚 profile 与账本。
5. 再写一条 guard 检查 revision=expected+1 且 pointer=本次新 ID（使用第二 token），保证实现错误导致的零行 UPDATE 不被误判成功；最后删除本次两个 guard。所有阶段属于同一个 batch。

```sql
-- 设计模板：:ws/:pid/:expected/:token 为 prepared bind 参数，不拼接 SQL。
INSERT INTO product_write_guards(token, workspace_id, product_id, ok)
SELECT :token, :ws, :pid,
  CASE WHEN EXISTS (
    SELECT 1 FROM products
    WHERE workspace_id=:ws AND id=:pid AND revision=:expected AND status='active'
  ) THEN 1 ELSE 0 END;
```

不能改成 `INSERT ... SELECT ... WHERE revision=?` 后忽略零行；不能先提交一次 UPDATE 再根据 meta.changes 决定第二次 batch。CHECK/UNIQUE/trigger 错误在 D1 回滚整个序列。捕获 batch 异常后先重查幂等账本，若已成功且 fingerprint 相同返回重放结果；再检查本 workspace 产品存在、status/revision 与资产状态，映射404/409；无法解释的数据库失败返回503，不猜测成功、不把其他错误都叫版本冲突。

对已初始化 profile 的 products UPDATE、reference INSERT/状态 UPDATE，增加 guard 存在性 trigger：需要当前事务中的同 workspace/product guard(ok=1)，否则 ABORT legacy_write_blocked。新实现所有路径都走上述 batch；guard 不跨提交持久存在，因此旧 Worker 无法借用别的请求 guard。指针更新 trigger 另验证同产品 profile；profile 内容更新 trigger 始终拒绝。guard 不是权限边界替代品，数据库写入仍只能经服务端身份校验。legacy 产品未初始化时旧读写保持原功能，首次初始化与旧写入若竞态，以数据库序列顺序为准，之后旧无 guard 写入将失败，不能覆盖版本化标准。

profile 内容相同但新 requestId：先验证 expectedVersion；若确为无变化，使用单独的 no-op batch：guard 同时核对 expectedVersion、当前指针及 profile_sha256，再插入指向现有版本/revision 的幂等结果，最后删 guard；不执行常规流程的新版本 INSERT 或 revision UPDATE。相同 requestId 在后来版本已前进后仍返回原 mutationResult，而不是误报“当前指针仍是旧版本”；需要当前数据时另 GET。

## 4. 参考图、生命周期及绑定竞态

reference promote 使用同一 revision 和账本顺序，guard 中额外检查资产 workspace、kind=reference、asset_type=image、status 不为 deleted/failed、expiry 非空且 >事务开始的 UTC now。只 supersede 指定 role 的 current，在事务内分配全产品 reference MAX+1、插入新版本、revision+1；profile 指针不变。归档/恢复也走同样 CAS，status 变化才增 revision，不创建新的 profile/ref。归档状态禁止编辑标准/晋升/创建新产品绑定；恢复不恢复过期图片。

| 同 revision 并发 | 允许结果 |
| --- | --- |
| profile vs profile | 一个成功，另一个409；没有丢失字段或两个新版本 |
| profile vs reference promote（或两种 role promote） | 一个成功，另一个409，重新 GET 后由用户重提；不独立锁两个表 |
| archive vs promote/profile | 一个成功；若 archive 先提交另一方 product_archived/版本冲突；无归档后偷偷写入 |
| profile/reference 修改 vs 新任务绑定 | 绑定事务先提交则保留旧组合；修改先提交则旧 expectedVersion 的绑定409，不能自动混合新 profile 与旧 reference |
| archive vs 已创建 batch/analysis | 已绑定任务继续按原元数据执行，不重新要求产品 active；未绑定新任务拒绝 |

新增任务的 productBinding 请求固定为 `{productId, expectedVersion, profileVersionId, referenceVersionId}`，四项全有或全无。UUID 必须属于当前 workspace/product；profile 必须等于 current 指针，reference 必须是当前 role 的 current 且 asset 与显式 referenceAssetId 一致。无 profile 的 legacy 产品若要使用新绑定，先明确保存 v1；旧 productId-only 批次保持 legacy_unbound，不伪造快照。已初始化产品的新 batch 不再接受 productId-only：返回428 product_binding_required。显式 pairs 模式不允许产品绑定。

批次：在 createBatch 的首次 `batches + batch_items` 同一个 batch 中加入 guard 和 batch_product_snapshots INSERT SELECT，服务端预读不可变版本行，用固定序列化在 JS 中构造 snapshot_json/hash（不假设 SQLite 有 SHA256 函数）；事务 guard 再核对 revision、profile ID/hash、reference ID/asset/role/current 和可用性，INSERT SELECT 仅在同一匹配条件下写入预计算快照，末尾 guard 确认 snapshot 行存在，否则整体回滚。预读可以过期，guard 不可省略；同一次 batch 内不需要 JS 回调。整份批次绑定一个 profile 和一个 reference。不能在 enqueue 或 worker 才绑定。fingerprint 新版本包含 binding 四项及原 mapping；已有无绑定请求按原 fingerprint 算法重放，不能让算法升级破坏历史重试。批次重试使用保存快照，即使产品后来变化、归档或图片过期，不重新绑定。worker 创建 analysis 时从同 workspace batch snapshot 原样复制（boundAt 保留批次时间），source_batch_id 记录来源；不在 queue payload 接收 profile 明文。

单图：03B 支持 API 可选 productBinding，匿名无产品与登录无产品流程仍可用，不在 ProductChecker 增加产品选择器。API 在额度预留前预检绑定；createAnalysisRecord 内再以 guard 将 analyses、analysis_references、analysis_product_snapshots 合为一个 batch，绑定时点为首次持久创建，先于模型执行。竞态导致创建失败由现有 catch 释放 reservation；不改价格、额度数量或计费顺序。service 仅携带 provenance 字段至持久层，不把 profile 传给 M0QAEngine/provider。API 与 service 的幂等比较都加入 binding（包含无绑定/null），失败重试保留旧快照；不得以相同图片但不同 profile 重用原幂等键。

现有 batch/analysis 的“删除图片”会跳过 product_reference_versions 引用资产，workspace 全部图片删除则不跳过，并预检无活跃任务；expiry 清理也不跳过产品参考图。这三种行为保持原样，不能把单报告删除的保护误写为永久保留。当前这些接口删除图片而非报告元数据；表中 report/workspace cascade 描述的是未来合法清除或本地维护测试，不是新增删除 API。

R2 删除不受 D1 batch 锁保护。guard 只能证明数据库中该刻资产可用；模型读取前再次检查状态/expiry并处理 R2 missing。若绑定后删除/到期，任务走现有失败与额度释放路径，不切换到新参考图、不重建对象、不延长 retention。不新增“因引用而永久保留”标志。恢复产品仅恢复选择资格，仍需 retained current reference 才可创建任务。

## 5. API、feature flag 与 UI

新增 `PUT /api/products/:id/profile`：body 恰为 requestId(UUID)、expectedVersion(非负安全整数)、profile（矩阵完整对象）。有效请求示例（合成）：

```json
{
  "requestId": "11111111-1111-4111-8111-111111111111",
  "expectedVersion": 0,
  "profile": {
    "profileSchemaVersion": 1,
    "name": "Example product",
    "skuLabel": null,
    "brand": null,
    "variant": null,
    "capacity": null,
    "packagingVersion": null,
    "criticalAttributes": [],
    "allowedChanges": []
  }
}
```

成功201（新版本）或200（无变化/重放），返回 `{mutationResult:{requestId,productId,revision,profileVersionId,profileVersionNumber,status},resumed}`；不把结果称为当前详情。

GET 产品新增 revision、profileState、currentProfile（versionId/Number、schemaVersion、source、createdAt、profile），历史列表按版本降序分页默认20/上限50，cursor 为服务端验证的版本号。新增 `GET /api/products/:id/profiles?beforeVersion=N&limit=20`；不得暴露 created_by_user_id 给公共页面。PATCH 产品保留 lifecycle/name/SKU 兼容请求，但 initialized 产品：改 name/SKU 必须通过完整 profile PUT；生命周期 PATCH 只收 requestId、expectedVersion、status，避免旧表单重发 stale name。reference POST 新增 requestId、expectedVersion，初始化产品必填。创建产品 POST 可维持旧 name/SKU/reference 方式产 legacy；首轮不扩大创建表单为 profile 编辑，创建后从详情初始化标准。

| 状态码/code | 行为 |
| --- | --- |
| 400 invalid_profile / invalid_binding | 字段错误、长度、非法类型/枚举、部分 binding、非法映射；不写版本、不预留额度 |
| 401 authentication_required | 未登录绑定产品/访问产品资料 |
| 404 product_not_found / reference_not_found | 不存在或跨 workspace，统一不泄露 |
| 409 product_version_conflict | expectedVersion 已旧；仅本 workspace 返回 currentRevision，UI 保留草稿人工合并 |
| 409 idempotency_conflict / duplicate_product_sku | 请求键异内容或 SKU 唯一冲突，整组回滚 |
| 409 product_archived / product_reference_unavailable / reference_already_versioned | 不自动换版本或参考图 |
| 428 product_version_required / product_binding_required | initialized 产品的旧客户端缺 CAS/binding，需刷新 |
| 403 product_profiles_disabled | flag 关闭时显式新 profile/binding 写入，不静默忽略新字段 |
| 503 profile_storage_unavailable | schema 未就绪或无法确认数据库成功；用原请求键重试，不能降级为非版本化写入 |

flag 为服务端 `PRODUCT_PROFILES_ENABLED`，仅字符串 "true" 开启，缺失/其他值默认关闭，不允许浏览器参数覆盖。GET/历史 snapshot 读取与 worker 对已绑定任务的传递始终支持；flag 只关新资料编辑/新绑定入口。详情和批次页面从服务器获得能力标志。关闭后，已初始化产品仍强制 CAS，不重新开放旧 name/SKU 无保护写入；生命周期和 reference 的 CAS 兼容路径继续可用。旧产品的无 profile 业务及无产品分析继续可用。

## 6. 部署、旧数据及回滚

03B 迁移为增量 schema，不自动给任何产品造 v1，不回填历史批次/分析 snapshot。所有原产品 revision=0、currentProfile=null；读结果明确 legacy_unversioned/legacy_unbound。旧 productId-only batch 从实时 join 得到的名称只标为“当前产品信息”，不能装成运行时标准。已绑定新报告只读快照，不依赖当前 products.name；新 JSON 加 schemaVersion，今后升级版本不能原地重写旧 JSON。

顺序：验证迁移于本地 D1 克隆 → 提交/推送并 fresh 核验 → 获授权后 schema 迁移 → 部署具备新读写兼容层的代码（flag=false）→ 确认旧 worker 不再接收流量/在途旧请求已结束 → 目标 workspace 合成 smoke → 单独授权开启 flag。guard triggers 是防止遗漏旧写入的最后防线，不替代发布冻结。生产迁移/启用不由本设计任务执行。

迁移核验：旧 products/ref/batch/analysis 行数及关键字段摘要不变；profile/snapshot 表初始0行；全部 revision=0；SKU/current-role 唯一索引保留；foreign_key_check 无错误；guard 表0行；无任何历史 profileVersion 推断。双版本并存测试旧 reader 忽略新增列、新 reader 接受 null。没有数据回填脚本的必要，不能扫描图片建立“历史真值”。

回滚采用关闭 flag + 回到已支持新 schema/CAS/snapshot 的兼容代码版本，保留新增表和已写历史，不执行 DROP 或删除 profile。不得回滚到会原地覆盖 initialized 产品的旧代码；若必须紧急回旧，先冻结产品写接口与新产品绑定入口，并保留 trigger 拒绝，worker 必须仍能处理冻结快照，否则暂停队列而非静默丢来源。真实 schema 执行失败停止 enable；已写新数据不能靠数据库整体回档抹掉任务/计费历史。后续 forward fix 另走发布规则。

文字标准、快照、幂等结果随产品/报告业务留存，不能含个人信息；合法 workspace 删除级联清除相关新表，report 删除清除其 snapshot；profile 不主动清理已被历史记录引用的版本。03B 不新增硬删除产品接口。图片仍按原 expiry 删除，历史 UI 不保留失效 preview URL；保留的 metadata 不构成无限保留图片。

## 7. 03B 第一实施单元范围与可复现验收

建议一次交付“文字版本 + 产品写 CAS + 任务来源绑定”，flag 默认关闭，无模型策略。以下是下一契约拟允许路径，不是本轮改代码权限：

- `migrations/0020_product_profiles.sql`（确认编号）；`lib/products/{types,repository,profile-validation}.ts`；`lib/cloudflare/bindings.ts`（仅 flag 类型）。
- `app/api/products/route.ts`、`app/api/products/[productId]/route.ts`、`app/api/products/[productId]/references/route.ts`、新增 `app/api/products/[productId]/profile/route.ts`、`app/api/products/[productId]/profiles/route.ts`。
- `lib/batches/{types,repository,validation,worker}.ts`、`app/api/batches/route.ts`、`app/api/batches/[batchId]/export/route.ts`（只增来源字段）。
- `lib/analysis/{types,repository,service}.ts`、`app/api/analyses/route.ts`（只增来源绑定与必要首次写原子化，不改引擎）。
- `app/account/products/[productId]/{page,SavedProductSettingsClient,PromoteReferenceClient}.tsx`、新增该目录 `ProductProfileClient.tsx`；`app/account/batches/new/{page,BatchCreationClient}.tsx`；`app/account/batches/page.tsx`（历史列表展示冻结来源；详情实际复用 new?batchId 页面，不新增不存在的详情路由）。
- `scripts/verify-m2-saved-products.ts`、新增 `scripts/verify-product-profiles.ts`，package.json 仅专项 scripts；本两份文档可随已验收实现更新状态。不改 wrangler 生产 vars/资源、QA engine/provider、credits/billing、资产删除策略；启用 flag 留给授权发布操作。

测试基线用两个 workspace、一个 legacy 产品、两个 retained reference、一个已过期 reference、一份运行前 legacy batch、一份无产品匿名分析。所有为临时本地合成 fixture，无客户图、无模型调用、无真实支付。下表必须在实现前变成专项测试断言：

| ID | 操作/交错 | 判定结果 |
| --- | --- | --- |
| F1 | 矩阵每字段边界、null/省略/未知键、NFKC、count小数、重复key | 接受/拒绝与矩阵逐项一致；同语义规范化 hash 一致 |
| D1 | 应用增量 migration 到含旧数据的本地 D1 | 旧摘要不变，新表为空，无推断回填、FK错误 |
| C1 | 两个独立连接同 expectedVersion 同时不同 profile 写 | 恰1成功、1冲突；仅1新版本、revision+1、guard0行 |
| C2 | profile vs promote；两 role promote；archive vs profile | 每组恰1胜；失败方无 status/profile/ref/账本部分写入 |
| C3 | 同 requestId 同 payload 并发/超时重发；异 payload | 只写一次；相同稳定 mutationResult；异内容409 |
| C4 | 在每个 batch 语句位置注入 SQL 失败；CAS miss | 所有表回滚到原摘要；不能仅靠 mock success=true |
| O1 | W2 的产品/profile/ref/asset ID 注入 W1请求或snapshot读取 | 全部404，W2内容与当前 revision 不泄漏 |
| B1 | batch 创建与 profile/promote 交错 | 要么绑定旧完整组合，要么409；绝无新旧混合，无额外扣费 |
| B2 | 创建后再改名/归档/晋升，worker重复/重试 | batch与analysis快照相同，历史内容不漂移；不读取最新标准 |
| A1 | 单图 productBinding、无绑定、匿名携带binding | 登录正确绑定；旧无绑定可用；匿名绑定401 |
| A2 | 首次 analysis 写途中失败/相同图片不同binding重试 | analyses/reference/snapshot原子；不重复计费；异binding409 |
| R1 | 绑定前到期，绑定后R2消失，恢复归档且图已过期 | 拒绝或原失败路径；不换图、不延长expiry、不复活对象 |
| L1 | legacy 名称变化及 legacy batch 重放 | 不造历史版本；旧 fingerprint 仍可重放，当前名称标识非历史 |
| G1 | flag缺失/false，显式新字段，旧worker直接UPDATE initialized行 | 新写403、无静默忽略；历史可读；旧写trigger拒绝 |
| U1 | UI 409 保留草稿，新GET后二次人工提交 | 不自动覆盖；profile和reference版本分别展示 |
| X1 | 降级到兼容版本、workspace合法清除、report删除 | 快照不误读；cascade清除相应metadata；无图片续期 |

03B 验证预算：针对矩阵的本地 D1 集成与必要 API/UI专项、现有 saved-products 回归、typecheck；涉及页面/路由变更一次 build。原模型输出/计费行为用受控 stub 验证未改变，不跑付费模型或全量无关用例。本03A仅做代码事实、链接、示例和SQL语义审查，没有运行迁移或声称矩阵已执行。

已作选择，不留事务方案给实现猜测；真实阻塞仅为03B尚需正式范围授权及本地 D1 guard/trigger/并发集成证据。若 D1 实测不支持该回滚模式，停止交付并带最小复现回设计审查，不能改成两次非原子写入。多参考联合判断、自动视角选择、资料驱动模型规则、硬删除/DAM及多品类模板均不在03B。
