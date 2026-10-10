# UPG-02 商品真值评测输入协议 v1

本协议定义离线输入与可复现的结构校验，不生成 benchmark 成绩。仓库 fixture 全部为 synthetic；其中的身份、授权引用、标注和图像摘要都是虚构值，只证明校验器行为。真实数据收集、授权核实、独立人工标注及真实质量评测属于 HUMAN-03，目前没有由本单元提供的真实质量证据。

## 命令与结果

```sh
pnpm verify:upgrade-dataset --input /absolute/path/to/authorized-dataset.json
pnpm verify:upgrade-dataset --input fixtures/upgrade-dataset/synthetic-valid.json
pnpm test:upgrade-dataset
pnpm typecheck
```

校验器只读取显式指定的本地 JSON，不写报告或修改输入，不读取图像，不解析授权记录内容，不下载、不联网、不调用模型、不训练。未指定输入不会自动使用 synthetic fixture。

| 结果 | 退出码 | 含义 |
| --- | --- | --- |
| VALID_SYNTHETIC | 0 | 合成输入结构合法，仅用于工具测试；真实评测仍 BLOCKED |
| VALID_REAL_INPUT | 0 | 声明为真实的输入通过结构校验，不代表授权、人工独立性、图像真实性或质量已核实 |
| INVALID_INPUT | 1 | 文件可读，但 JSON、字段、真值约束或隔离规则非法；应修复输入 |
| BLOCKED | 2 | 未提供文件、路径不存在、不可读或指向目录；没有执行有效输入校验 |
| INVALID_USAGE | 64 | CLI 参数不合法 |

所有校验结果的 `qualityEvidence` 都是 `false`。退出码 0 不能转换为真实 benchmark PASS 或生产验证。测试会用内存生成的虚构元数据覆盖真实 schema 分支，该分支测试也不是实际真实数据。工具不计算准确率、召回率、分歧率或模型得分。

## JSON schema

UTF-8 JSON 顶层为对象，`schemaVersion` 固定为数字 `1`。下表中所有字段均为必填，不接受额外字段；除 `adjudication` 的明确约定外不接受 null。数组不能用对象代替，布尔值不能用字符串代替。匿名 ID 区分大小写并严格使用小写十六进制。

| 顶层字段 | 类型与约束 |
| --- | --- |
| schemaVersion | 数字 1 |
| datasetId | `dataset_` 加 16 位小写十六进制 |
| synthetic | boolean；整个文件只能为 synthetic 或真实声明之一，不能混合 |
| authorizationRecords | 非空授权对象数组，见下文；ID 唯一，所有记录必须被样本引用 |
| samples | 非空样本数组，见下文 |

授权对象只含以下五个字段：

| 字段 | 类型与约束 |
| --- | --- |
| id | `auth_` 加 16 位小写十六进制 |
| workspaceId | `ws_` 加 16 位小写十六进制 |
| recordRef | synthetic 为 `synthetic:` 加 32 位小写十六进制；真实声明为 `record:` 加 32 位小写十六进制 |
| permittedUse | 固定字符串 `offline_evaluation` |
| status | 固定字符串 `granted`；撤销或未获准不能进入评测输入 |

`recordRef` 是受控授权台账的匿名索引，不是 URL、文件路径、签名链接或授权证明本身。真人管理员必须在仓库外核实授权范围、有效期、撤销状态和实际图像权利，导出当前有效快照。校验器只验证声明及引用关系，不能代替这一步。

样本对象只含以下字段：

| 字段 | 类型与约束 |
| --- | --- |
| id | `sample_` 加 16 位小写十六进制，全数据集唯一 |
| synthetic | 必须与顶层布尔值完全一致 |
| workspaceId | `ws_` 加 16 位小写十六进制，必须与所引用授权的 workspaceId 相同 |
| skuId | `sku_` 加 16 位小写十六进制，数据集内规范商品标识 |
| packagingVersionId | `pkg_` 加 16 位小写十六进制，明确包装版本，不能空缺 |
| authorizationId | 指向 authorizationRecords 中存在的 id |
| split | `development` 或 `holdout` |
| referenceImageSha256 | 64 位小写十六进制，参考图原始字节 SHA-256 |
| observedImageSha256 | 64 位小写十六进制，待检图原始字节 SHA-256；不得与参考图相同 |
| annotations | 恰好两份独立原始标注，见下文 |
| adjudication | 两份标签完全一致时为 null；有任何字段分歧时必须提供仲裁对象 |

真实图像与身份映射不入此仓库。管理员使用随机不透明 ID，或受保护密钥计算的不可逆映射，保持跨批次稳定；不能将邮箱、公司名、订单号、真实 SKU 或图片地址放入字段。`skuId` 在数据集内规范化，同一商品不能因 workspace 或包装版本不同而重新编号以规避隔离。包装版本 ID 的解释依附商品，数据集管理员维护版本映射。仅靠正则不能证明匿名化或规范映射正确，需要源数据审计。

## 独立双标与分歧仲裁

每份 annotation 只含 `annotatorId`、`independent`、`label`。`annotatorId` 为 `ann_` 加 16 位小写十六进制，两人 ID 必须不同；`independent` 必须为布尔值 true。

操作上，两位标注者分别查看相同的参考图、待检图及允许的商品真值资料，提交前不得看到对方标签或模型输出。管理员保留原始标注，不能用仲裁标签覆盖它们。ID 不同与 independent=true 仅是声明；工具不能认证标注者身份或证明盲标过程。

label 必须且只能含以下四个字段：

| 字段 | 枚举 | 解释 |
| --- | --- | --- |
| verdict | match / mismatch / unobservable | 一致 / 已观察到不一致 / 证据不足无法判定 |
| defectType | none / identity / packaging / text / color / other / unknown | 商品身份、包装版本、文字、颜色或其他差异；多差异按最高严重度选主类，同级按 identity → packaging → text → color → other 顺序选类 |
| severity | none / minor / major / critical / unknown | 错误影响等级 |
| observability | observable / partial / unobservable | 判定所需视觉证据完整 / 部分可见 / 不可见 |

严重度标准：none 为已确认一致；minor 为不影响商品身份及关键声明的局部视觉差异；major 为明显包装、文字或颜色错误，足以造成商品呈现误导或需要返工；critical 为商品身份错误或关键安全／合规文字差异，可能造成严重误导；unknown 为证据不足，不能推断错误影响。这些是评测标注约定，不是应用中的自动裁决规则。

标签组合强约束：

- match：defectType=none、severity=none、observability=observable。不能用局部不可见冒充通过。
- mismatch：defectType 为 identity/packaging/text/color/other，severity 为 minor/major/critical，observability 为 observable 或 partial。局部可见但已足以证实某项错误可以标 mismatch。
- unobservable：defectType=unknown、severity=unknown，observability 为 partial 或 unobservable。遮挡、裁剪、分辨率不足、角度不支持比较等不能凭空补全真值。

两份 label 的任一字段不同，就必须由第三位人员仲裁。adjudication 只含 `adjudicatorId`、`reason`、`label`。仲裁者使用 ann_ 格式且与两位原标注者不同。reason 为 identity_resolution、packaging_resolution、text_resolution、color_resolution、severity_resolution、observability_resolution、multiple_disagreements 之一；label 服从同样约束，可以选择原标签之一或给出有证据支持的新标签。更详细的仲裁依据保留在受控外部台账，避免在输入中写客户资料。

## 开发与留出隔离

分割在模型调优前确定。任何同 skuId 的样本，包括不同 workspace、不同包装版本，必须放在同一 split。同一图像 SHA-256 不能跨 split，无论它充当参考图还是待检图。

样本 ID、待检图 SHA-256 和无方向的图像对不得重复。同一 split 可以针对同一 SKU 重用参考图以检查不同待检图，但不能重复待检图或反转同一图像对当作新样本。此规则拒绝字节级重复；重编码、裁剪、相似图像和错误重编的 skuId 无法由本工具识别，应由管理员额外做近重复及来源审计。

管理员应先合并本轮完整输入再校验，而非分别校验两个 split 或逐文件校验后宣称无泄漏。开发人员只接触 development 数据；holdout 的图像、标签和映射由独立评测人隔离保管，冻结后记录输入 SHA-256、协议版本和评测候选 SHA。不能因观察留出结果而重分割、修改标签或补充训练；如发生污染，应废弃该轮留出并另立新版本，保留旧记录。目录权限、跨轮数据泄漏和实际训练访问控制由人工流程负责，JSON 校验器不提供沙箱隔离。

schema 允许只含一个 split 的有效片段，但它不代表具备完整评测条件。真实 benchmark 需要足够的独立留出样本、预先确定的抽样和指标方案、真实授权以及可核实的双标证据，这些不属于 UPG-02 的结构验收。

## 复现与边界

仓库正例：[synthetic-valid.json](../../fixtures/upgrade-dataset/synthetic-valid.json) 包含一致、存在分歧并完成仲裁、不可观测三类样本。所有摘要均为人工生成的占位数值，没有对应真实图像或客户。正负测试在内存或临时目录改写该正例，结束后清理临时文件；正式输入和仓库 fixture 保持不变。

测试覆盖必填字段、非法枚举、匿名 ID、授权关系、双标与仲裁、严重度与可观测性组合、重复及 split 泄漏，以及 CLI 的缺输入 BLOCKED、非法输入 INVALID_INPUT 和只读行为。真实输入不存在时应报告 BLOCKED，不能拿该 fixture 补成实际质量结论。协议和工具通过独立 QA 只允许关闭 local_only 的 UPG-02，不解除 HUMAN-03 的数据与人工验证要求，也不授权生产部署。
