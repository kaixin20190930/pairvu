# UPG-10 价值指标契约 v1

基线 `eb7c279ca1015d4f25a9009c5ef1c72d15e9e424`。本轮仅本地开发与独立验收，默认 `VALUE_METRICS_ENABLED=false`；无生产迁移、发布、启用或真实来源补标授权。口径版本 `value-metrics-001`。这是只读用量诊断，质量、商业价值、ROI、节省时间均未验证。

## 身份、窗口与一致性

`GET /api/value-metrics` 和 `/account/value-metrics` 仅服务端 session 的 active workspace owner。无客户端 workspace/classification 授权参数。匿名 401、无有效归属 404；关闭时页面 404、API 404、导航隐藏；状态入口只给 enabled。所有响应 private/no-store、Vary Cookie。无分类写 API、CSV 或发送功能。

参数只允许各一次 `start,end`，严格 UTC `YYYY-MM-DDTHH:mm:ss.sssZ`，Date roundtrip 必须相同。起含止不含，start<end，最大 90×24 小时，end 不晚于服务端生成时间；默认 end 为生成时间、start 为此前 30×24 小时。参数缺一个、重复、未知、非法日期均 400。cohort 为 canonical analyses.created_at（SQLite UTC julianday）落在窗口的 distinct analysis；无效创建时间不能定位窗口，另给 workspace 级 unwindowable 数量，不混入 cohort。时间窗不是完成日期筛选。

数据是一条 SQL SELECT 的一致快照（归属在同条 SQL 再核查），返回 sourceAsOf=SQLite 当前 UTC；completion/review/classification 均为这一读取时点的状态，**不支持历史状态重建**。请求 generatedAt 与 sourceAsOf 分开显示。只统计完成时间有效、≥created_at、≤sourceAsOf 的 completed 结果；状态 completed 但时间不合法列 completedTimeInvalid，不参与 completed 指标。failed 单列，queued/running 为 pending。结束窗控制 cohort，结束窗后至 sourceAsOf 的完成/审计可被纳入，页面明确说明。

最大 cohort 5000（读取第 5001 条仅检测超限），每 business analysis 最多 100 个 review events、每冻结 snapshot≤32768 UTF8 字节、每 review snapshot≤262144 字节；全部 business snapshot/review snapshot 总预算 16 MiB。超任何预算 API 422 `metrics_budget_exceeded`、complete=false，不返回部分总体或完整比率。数据库失败 503，绝不退化为业务零。非业务行不加载原始 snapshot/audit、不影响业务数据预算。窗口内 classification 与 batch linkage 计数仍须有界（每 analysis≤100）；超限同样拒绝，防止相关子查询无限聚合。

## 逐 analysis 来源分类与受控操作

新增 append-only `analysis_value_classifications`，无历史回填。缺记录默认 unknown；每条记录明确 analysis_id+workspace_id、revision、classification=business/test/unknown、evidence_ref、verified_by、verified_at、material_sha256、created_at。数据库触发器拒绝跨归属、非连续 revision、修改/删除已有记录。更正用新的完整来源核查记录追加 revision，不改历史。每 analysis 最新 revision 是当前分类；元数据损坏或未来时间则 unknown，不回退旧 business。当前分类不是历史值；新分类可能改变同一创建时间窗的诊断，API 显示分类快照时间。

business 仅代表受控保管方已核查来源的标记，不能因生产环境、已登录、名字不含 QA、没有 test 标签、客户端事件而推定。test 含合成/内部 QA。unknown 含未验证历史和缺分类。test/unknown 从**所有**业务量、分组、分母、成本、等待时间中排除。分类覆盖=(有效 business+test+显式 unknown 记录)/全部 cohort；显示未分类/无效记录及 business/test/unknown 排除数量。business=0 时只能说“没有经受控分类纳入的业务记录”，不能说全部业务为零。

离线入口 `pnpm value-metrics:prepare-classification -- --input FILE --inventory FILE`：只读两个显式 JSON，输出可审查 SQL 方案，不连接数据库、不执行导入。材料根恰好 `{schemaVersion:1,workspaceId,inventorySha256,records}`；inventory 原始字节 hash 必须相等。inventory 根 `{schemaVersion:1,workspaceId,asOf,analyses}`；元素 `{analysisId,workspaceId,classificationRevision}`，完整 ID、归属、非负安全 revision。材料 records 元素恰好 `{analysisId,classification,evidenceRef,verifiedBy,verifiedAt,expectedRevision}`，最多 500，精确 analysis ID 必须在 inventory 中，workspace 相同、revision 一致。两文件各层禁止未知/缺字段、重复 ID、冲突；无输入 BLOCKED，未知选项 INVALID_USAGE，非法材料 INVALID_INPUT，不回显输入值。

ID/核实者为 1–128 位字母数字下划线连字符 token；evidenceRef 为 `evidence:`+64 位小写 hash，指向受控真实来源核查材料（用途、合成/业务判别与核查过程）。verifiedAt 和 inventory.asOf 是上述严格 UTC，核实时间≤inventory.asOf，inventory.asOf 不晚于本地校验时间。所有分类都需材料与核实者，尤其拒绝无依据 business。CLI 不认证这些人的身份或材料真实性，输出 preparationOnly=true、valueEvidence=false；模板中的占位字段不能用于真实导入。

上线后的受控操作步骤：获本单元发布授权后按 AGENTS GitHub-first 迁移与部署；获具体数据分类操作授权后，由数据库保管方用只读 inventory SQL 导出精确 workspace 的 analysis IDs 与当前分类 revision，冻结 JSON 字节；两位受控人员核查业务/测试来源和 evidenceRef 对应材料，准备文件；离线校验生成 SQL，逐条审查；才由获授权的数据库操作员在明确 workspace 执行原子导入。触发器在执行时再次检查归属和 revision，过期方案冲突失败，不能静默漏导。导入后的原始材料、SQL/hash、操作者与实际执行证据另受控保管；本轮只准备，不执行生产操作，不制造真实 business 标签。分类权限依赖受控 D1 写权限，客户端不能获此权限。小型合成例仅用于测试。

inventory 只读查询模板（`:workspace` 为获准的精确 workspace，不能用客户端参数授权；记录同次数据库读取的 UTC asOf）：

```sql
SELECT a.id AS analysisId,a.workspace_id AS workspaceId,
 COALESCE((SELECT MAX(c.revision) FROM analysis_value_classifications c
  WHERE c.analysis_id=a.id AND c.workspace_id=a.workspace_id),0) AS classificationRevision
FROM analyses a WHERE a.workspace_id=:workspace ORDER BY a.id;
```

按 schema 封装此结果并冻结原始 JSON 字节，最多 10000 个 inventory 条目。CLI 每份文件最多 8 MiB；输出含 SQL 与参数的 statements 方案，必须作为单个 `D1Database.batch` 原子执行（本地已验证失败回滚），不可拆成逐条写入或当作可自动执行的公开 API。空的 [分类模板](../../fixtures/value-metrics/classification-template.json) 和 [inventory 模板](../../fixtures/value-metrics/inventory-template.json) 仅含 null/空集合，占位材料不满足校验，不存在虚构真实记录。

## 业务公式与缺失

令 B 为有效 business 分类 cohort，C 为其中 status=completed 且完成时间有效的 analysis。所有 count 每 analysis 一次，不 join 放大。

| 指标 | 精确公式 / 缺失 |
|---|---|
| 用量 | total=\|B\|；completed=\|C\|，failed、queued/running pending 单列；completedTimeInvalid 单列，不假装完成 |
| 机器分布 | C 中 canonical verdict pass/review/fail 各一次；unknown 独列；REVIEW 比例=review/(pass+review+fail)，空分母 null |
| 冻结 SKU 覆盖 | C 中有效 owned frozen snapshot 的数量/\|C\|；要求 SHA、schema、canonical profile、product/profile/reference/asset 绑定正确；当前名字、归档、current pointer 不改历史 |
| SKU 使用/复用 | 以 workspace+冻结 productId+referenceVersionId 分组；同一 distinct batch invocation 的多 item 只算一次，单次 workflow 用 canonical analysis ID；source batch 的原始 snapshot JSON/hash、product/revision/profile/reference/bound_at 必须与 analysis 冻结记录完全一致，不仅比 hash 声明；批次冻结来源不一致的 snapshot 不计 SKU 关联。batch membership 不唯一则 workflow unknown，不计复用；窗口内 group uses=独立 invocation 数、reuses=max(uses−1,0)，首次使用不算复用，不声称跨窗口首次。分组按 ID 排序，不排名，披露缺失 workflow 数 |
| 人审覆盖 | C 中存在完整有效审计链（连续 revision、前驱、动作、拥有者 scope、snapshot hash/analysis identity/verdict/versions，最新 head 一致）的 distinct analysis 数/\|C\|；approve/reject/revoke 为最新有效动作；无审计、无效审计单列。动作不是真值标签 |
| 首次决定等待时间 | 完整有效链中首个 approve/reject.created_at−analysis.completed_at，单位毫秒；首决定无效日期或负时差时该 analysis 缺失，不能改选后续决定。后续 revoke 不抹除首次时间；给有效样本数、均值、缺失原因，不等于实际人工工作耗时，无基线节省时间=未评估 |
| 检测估算成本 | B 中 canonical analyses.estimated_cost_usd 的非负有限值求和（包括失败/待完成时已存估算），零值有效，null/负/非法值为缺失；给已知数量/\|B\|、已知总额 USD 与缺失数量。不能 null 当 0；无已知值金额=null；求和溢出拒绝结果，不发 Infinity。不是实际账单、收益或利润，不重复加 model call 成本 |
| 来源工作流/生成模型 | B 内可靠 batch/single/unknown 工作流分布；图片生成模型全部 unknown（现有检测模型不能冒充生成模型）；不做来源模型排行 |

比例均输出 numerator/denominator/value，分母 0 的 value=null。API 仅汇总，不返回原始图片、用户、审核文本、分类依据、人工身份或 machine snapshot。每项给缺失/排除计数与口径；只按有效 business 形成分组。不设置商业目标达标判断，不以合成 QA fixture 或业务分类声明证明真实质量/商业价值。

## 验证与验收门槛

隔离本地 D1 使用完整迁移、实际查询/路由与受控 session 夹具；反例涵盖两 workspace、混合来源、重复事件/多 batch item、冻结改名归档、时窗边界、空/零/负/未知、审计异常、来源材料/归属/冲突、预算和 DB 失败。真实组件验证正常/空/错误/关闭导航和窄屏。typecheck 与一次必要本地 build。开发证据不能代替独立固定 SHA 验收；PASS 最多 RELEASE_READY，无 production verification。

本轮开发验证索引见 [开发报告](../../fixtures/value-metrics/validation/README.md) 和 [结构化清单](../../fixtures/value-metrics/validation/developer-validation.json)。最终隔离 D1 26 项检查、434 次请求；真实 React 组件 13 项检查，包括 375px 与 1280px、空态、错误、重试与导航关闭。保留首次失败与修复记录。组件浏览器夹具采用实际组件/CSS，但框架导航和 API 数据为本地合成夹具；SSR/session 路由另在实际 D1 测试中校验。这不是完整生产登录或真实客户价值验收。

本地 Next build 成功后，补强了 source batch snapshot 与 analysis snapshot 的完全一致检查；该最终查询/计算变更已通过实际 D1、typecheck 和 lint，未把先前 build 冒称为固定候选发布构建。下一步由独立 QA 绑定提交 SHA 验收；生产迁移、部署、功能启用、真实登录以及真实业务来源分类均未执行，须分别遵守授权与 GitHub-first 发布门禁。
