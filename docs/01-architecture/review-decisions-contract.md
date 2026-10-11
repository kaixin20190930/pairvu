# 单分析人工决定与追加式审计

UPG-05 为已登录用户本人活跃 workspace 内的 completed 分析提供 Approve、Reject、Revoke。人工决定是独立记录，不改变机器 verdict、observations、issues、limitations、模型调用或既有 feedback；人工批准不代表发布资格。旧分析没有人审事件时 revision 为 0、现行决定为空。仅结果页入口，不包含批量批准、工作台、API keys 或外发能力。

## 身份、接口与输入

`/api/analyses/[analysisId]/reviews` 的 GET/POST 使用现有 Better Auth session 和现有个人 workspace 解析。`resolveRequestAccess` 增加来自 session 的 user ID；客户端不能提供 actor/workspace。读取和每次写入再次核对实际 owner membership、active workspace、analysis 所有权和 completed 状态。匿名返回 401，跨 workspace、失效 membership 或不存在返回不泄漏历史的 404；未完成返回 409。同源 POST 必须带与实际请求 URL 完全一致的 Origin，并拒绝 cross-site/same-site Fetch Metadata，不增加 CORS。响应均 no-store；错误不记录身份、理由、备注或 SQL 参数。

严格 JSON 请求最多 16 KiB，只接受 requestId（UUID）、expectedRevision（安全非负整数）、action、category、reason、note。分类为 false_positive / false_negative / intentional_change / wrong_reference / insufficient_evidence / other。reason 经 trim 后 1–1000 个 JavaScript 字符且具有非不可见内容；note 可空，trim 后最多 2000 字符。原 HTML 作为普通字符串保存，由 React 文本节点转义；不使用 HTML 渲染。未知字段，包括 actorId、workspaceId、客户端时间，均拒绝。输入规范化后的同一 payload 才被视为相同重试。

## 数据库原子性与来源

0021 只新增 review_events、review_heads、review_write_guards 及约束/触发器，不改旧分析记录。事件保存 analysis/workspace/actor ID、request ID、payload 指纹、递增 revision、前一事件 ID、动作和理由、数据库服务端时间。机器来源独立保存当时读取的机器 verdict、引擎/策略版本、completedAt、观察、问题、限制和模型调用快照，以及 SHA-256 摘要。这里保存的是现有结果读取映射，区域仍按现有 UPG-04 规则安全退化，不声称恢复原始 SDK wire，也不更新机器数据。

首次 expectedRevision=0。六条实际应用 SQL 在同一 D1 batch 中依次执行：所有权/状态/CAS CHECK guard → 追加事件 → 首次建立 head → 条件更新 head → 最终 head/event 一致性 CHECK guard → 清除 guards。事件 INSERT 触发器再次校验来源版本、owner、链条和撤销条件；head 只能建立于第一事件或按下一 revision 指向对应事件。零行 UPDATE 不能被当作成功，最终 guard 使整个 batch 回滚。没有发出 BEGIN/COMMIT。

[Cloudflare D1 batch 文档](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)说明 batch 的失败会回滚整个序列；本候选还以真实本地 workerd D1 实测所有六条写入的七个边界故障、零行更新、两 Worker 并发及丢失响应重放。该证明不等于远端副本或生产负载验证。

同一 analysis 的 requestId 唯一。payload 指纹含服务端 actor/workspace 与规范化输入：相同内容返回原事件，晚于该事件的最新状态单独返回；不同内容复用 key 返回 409。并发相同 baseRevision 的不同请求只能一个提交。提交后丢失响应时，先查 requestId 恢复已提交结果；无法确定则返回 503，客户端保持原 key。Revoke 只能针对当前 approve/reject，追加撤销事件并清空现行决定；旧事件不删除，之后可以明确再决定。

数据库阻止 events 的 UPDATE/DELETE，以及带合法 guard 的 INSERT OR REPLACE 对旧事件的覆盖；head 不可删除、回退或绕过对应新事件更新。普通业务不能篡改审计。拥有任意 DDL 权限的数据库管理员仍能修改约束，此方案不是抵御数据库管理员的密码学不可篡改服务。

## 保留与清理

已核对的业务路径是 `app/api/analyses/[analysisId]/route.ts` DELETE、`app/api/account/assets/route.ts`、`lib/assets/deletion.ts` 的立即/定时图片清理：它们删除 R2 对象并把 assets 标为 deleted，保留分析元数据。现有产品 archive 不删除分析。当前没有找到分析、workspace 或 user 的业务硬删除路径。因此图片删除/过期后 completed 分析仍可读取/追加人工历史，UI 明确机器证据和人工发布边界；历史存在不说明图片还可复核。

新审计引用 analysis/workspace/user 使用 RESTRICT，不允许级联静默删除。当前保留策略随分析元数据保留审计，不增加普通业务 purge 入口；inactive workspace 不可读写审计。未来若增加账户硬删除或审计过期清理，必须另行制定并授权保留/删除方案，不能移除此约束来绕过现有契约。仅记录 actor ID，不复制姓名或邮箱；理由/备注可能由用户自行输入信息，现有作用域控制持续适用。

## UI 冲突与不确定结果

实际 ProductChecker completed 结果接入独立 ReviewDecision，显示机器结论、现行人工决定、revision 和最多最新 100 条事件（数据库完整保留全部事件）。旧反馈保持原意义。匿名只显示登录说明，不请求人审历史。

409 保留 action/category/reason/note，禁止直接再提交；用户必须加载最新，再点击“Confirm draft against latest revision”，生成针对新 revision 的新 requestId。503 或网络中断锁定草稿及新提交，唯一提交操作为使用原 payload/requestId 重试；禁止用新 key 覆盖未确定请求。成功后清空当前草稿并显示返回的最新人工状态。机器结果与证据原样保留，人工批准不会变更机器 FAIL 或发布资格。

## 本地证据与交付边界

`pnpm test:review-decisions --report <路径>` 执行实际 0001–0021 迁移、旧数据读回、D1 约束/回滚/并发和真实专用路由/身份解析。合成 session 与 account snapshot 替代外部身份边界，数据库 membership 仍是真实校验；不使用生产身份、模型、额度、R2 或付款。实际 React 浏览器检查使用 `node fixtures/review-decisions/ui-server.mjs`，桌面及 375px iframe 同时执行，API 为受控替代，不能把 UI fixture 当 D1 或生产证明。

原 D1 fixture 首次比较包含 duration/last_row_id 的响应 metadata，因运行时 metadata 变化失败；改为比较实际行内容，原失败保留。浏览器首次把合成机器 FAIL 错写成固定 REVIEW 断言，改为与实际原 verdict 比较；原失败也保留。定向 lint 的 ref 渲染问题改为用独立 state 显示请求 ID，不放宽规则。完整证据位于 `fixtures/review-decisions`。候选仍须独立固定 SHA 验收，通过后最多 RELEASE_READY，UPG-05 生产未授权。
