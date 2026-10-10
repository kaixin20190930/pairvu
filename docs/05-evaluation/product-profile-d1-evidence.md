# UPG-03B0：本地 D1 事务实证

2026-10-10 开发结果：**37 个用例通过，434 次本地 HTTP 请求**。原始结果为 [recorded-results.json](../../fixtures/product-profile-d1/recorded-results.json)，包含逐项结果、D1 原始错误、竞争胜负、运行时版本和测试源文件 SHA-256。此结果等待独立 QA 按候选 Git 提交验收，不代表生产迁移或应用集成通过。

## 复现命令与运行时

在仓库根目录执行：

```sh
pnpm test:product-profile-d1 --report /tmp/pairvu-product-profile-d1-review.json
```

不传 `--report` 时结果自动保存到 `/tmp` 中唯一命名的 JSON 文件，不覆盖已提交的开发记录。每次运行创建全新的临时本地 D1 数据目录，结束后释放 Miniflare 并删除临时数据库；成功后没有机械重复运行专项。开发还执行了三个 `.mjs` 文件的 `node --check` 和 `git diff --check`。

| 项目 | 实际值 |
|---|---|
| Node | v22.22.3 |
| Wrangler | 4.114.0 |
| Miniflare | 4.20260722.0 |
| workerd 包 | 1.20260722.1 |
| Worker compatibilityDate | 2026-07-26 |
| D1 返回 served_by | miniflare.db |

使用仓库已有 Wrangler 的 Miniflare/workerd，不安装依赖、不改锁文件。未读取 `.env`、真实 D1/R2 或客户资料。Worker 的外部 fetch 被本地拒绝处理器阻断；测试只向 `127.0.0.1` 发送 HTTP，并通过本地 service binding 转发到第二个 Worker。

运行时探查发现 Node 侧 `getD1Database()` 代理在本环境没有完成，因此最终采用 Worker 内 `env.DB` 的真实 binding。每个请求均调用 `env.DB.prepare(...).bind(...)` 和一次 `env.DB.batch(...)`。`sqlite_version()` 被实际 D1 拒绝为未授权函数，所以不虚报 SQLite 内核版本。初次专项启动还暴露了 workerd 不允许 network deny 列表中的 `public`；修正为拒绝所有 outbound fetch 的处理器后完成上述一次成功专项。这些是测试环境适配，没有改变设计的 SQL 或拆分事务。

## 与接受设计的对应

依据 [版本化资料契约](../01-architecture/sku-versioned-profile-contract.md) 和 [字段矩阵](../02-product/sku-profile-field-matrix.md)。[base.sql](../../fixtures/product-profile-d1/base.sql) 是合成旧数据模型，省略无关列，保留 workspace SKU 唯一、reference version/asset 唯一及每个 role 的 current 唯一约束。[profile-schema.sql](../../fixtures/product-profile-d1/profile-schema.sql) 实现接受设计中的增量列、版本表、幂等账本、`CHECK(ok=1)` guard 和不可变/旧写入保护 trigger；它不是待部署 migration。

[transactions.mjs](../../fixtures/product-profile-d1/transactions.mjs) 按契约顺序组装 prepared SQL：无条件插入 CASE guard、幂等账本、事务内 MAX+1 的 profile/reference、产品 revision CAS、最终 guard、删除 guard。profile 为 6 条，reference 为 7 条，生命周期为 5 条；profile no-op 为 guard/账本/清理 3 条。不使用显式 BEGIN/COMMIT，也不拆成两个 batch。

并发通过两个独立 Worker 服务 `request-a`、`request-b` 的同一 D1 ID 验证。屏障只使两个请求都完成幂等预查后再发送 mutation；没有应用互斥锁，数据库自行排列并发 batch。两个 Worker 名称由响应验证，不能把单个客户端顺序调用算并发。

## 用例结果

| 覆盖 | 数量 | 实测断言 |
|---|---:|---|
| 旧数据增量兼容、双 Worker 共享 D1、首次 profile | 3 | 旧关键字段完全相同；revision=0、指针 NULL；无虚构 profile/snapshot；FK 检查无错误；真实绑定元信息 |
| 每个写入位置注入 SQL 失败 | 18 | profile 6、reference 7、lifecycle 5；包含清理 guard 后失败；整组回滚 |
| 零行 UPDATE、过时 revision、SKU 冲突 | 3 | 最终/初始 guard 与原有 UNIQUE 均使整组失败 |
| CAS 竞争 | 5 | profile/profile、profile/reference、跨 role reference、archive/profile、archive/reference；恰一成功；revision 只前进一次；失败请求没有账本 |
| 幂等与 no-op | 3 | 同键并发一次提交、结果相同；以后 revision 前进仍重放原结果；同键异内容不写入；no-op 不新增版本或 revision |
| workspace/资产、约束、旧写入、生命周期、cascade | 5 | 跨 workspace 产品/资产、过期资产、引用 UNIQUE、跨 workspace 指针拒绝；版本/core 不可变；旧无 guard 写入拒绝；legacy NULL 指针仍可写；归档/恢复保留 profile；合法 workspace 清除无 FK 错误 |

失败路径先后读取所有 12 张 fixture 表，以固定主键顺序对完整行 JSON 做 SHA-256，断言前后摘要完全一致。该摘要不包含 D1 耗时、文件页大小等非业务元信息。每个成功用例结束也断言 guard 表 0 行。18 项注入收到真实 `D1_ERROR: CHECK constraint failed: ok=1: SQLITE_CONSTRAINT (extended: SQLITE_CONSTRAINT_CHECK)`，不是 mock 的失败标志。

## 实证范围和下一实现条件

此单元证明指定本地运行时的 batch 回滚、guard、trigger、CAS 和受控两请求竞争。没有证明 Cloudflare 远端副本、生产负载下全部调度组合，不能替代正式生产 smoke。合成表裁剪了无关应用字段，也不构成现有完整 schema 克隆迁移验证。

幂等预查/重查使用 fixture 适配器；HTTP 409 是 harness 的 SQL 失败载体，没有实施应用的 401/404/409/428/503 映射、认证、规范化和字段矩阵 validator。参考图同 current asset/role 的 no-op、snapshot 绑定事务和 batch/analysis 竞争未在本单元执行；snapshot 表仅用于空表兼容和全库摘要。API、UI、flag、历史读取、计费 reservation 回滚、R2 删除/到期与模型流程保持后续集成验收范围。

UPG-03 完整实现须先由总控取得本候选的独立 PASS 并关闭 UPG-03B0，再落明确文件范围和测试预算契约。实施时移植已验证 SQL 到正式增量 migration/repository，补足真实 schema、snapshot、所有权与 HTTP 错误映射、计费和 UI 集成反例。生产迁移、部署和启用仍分别按仓库发布顺序及授权执行；本次仅本地提交。
