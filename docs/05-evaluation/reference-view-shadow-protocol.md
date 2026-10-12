# UPG-07A 参考视角离线 shadow 协议 v1

本阶段是只读工程工具：校验显式三文件输入，回放外部 baseline/candidate 声明，并生成诊断。`VALID` 只代表工程结构有效。**所有输出 `qualityEvidence=false`，真实质量始终 `BLOCKED`**；`synthetic=false`、授权声明、双标声明或更高的诊断比例都不能认证真实 benchmark。工具不读图片、D1/R2、环境秘密，不联网、不运行模型、不修改应用或生产结果。

基线：`9c7a430ff06d839bf7f07fa53ab14e9eef899abb`。UPG-07 runtime 未在此阶段实现。样本依赖见 [readiness](reference-view-sample-readiness.md)。UPG-02 原协议及其 `validateDataset` 保持原样并复用：[原协议](upgrade-benchmark-protocol.md)、[校验器](../../scripts/verify-upgrade-dataset.mjs)。

## 运行与文件绑定

```sh
pnpm evaluate:reference-view-shadow --dataset /absolute/dataset.json --views /absolute/views.json --predictions /absolute/predictions.json
pnpm test:reference-view-shadow
pnpm test:upgrade-dataset
pnpm exec tsc --noEmit
```

三个 JSON 文件分别为 UPG-02 dataset、view extension、prediction replay。必须按照上面的参数顺序提供全部路径；路径可相对当前工作目录，文件及父目录 symlink 入口均可执行。无参数输出 BLOCKED，**没有默认 fixture**。文件打开失败（含目录）也 BLOCKED；部分参数、重复/额外参数为 INVALID_USAGE。`--help` 输出用法文本，其余结果为 stdout JSON。

| 退出码 | status | 含义 |
|---|---|---|
| 0 | VALID | 工程有效、诊断已计算；真实质量仍 BLOCKED |
| 1 | INVALID_INPUT | JSON/schema/绑定/来源/标签/预测不合法 |
| 2 | BLOCKED | 三文件未提供或不可读，不执行评测 |
| 64 | INVALID_USAGE | 参数形式不合法 |

除 dataset 完整继承 UPG-02 限制，本文各对象也必须**恰好**含列出的字段；不允许未知字段（包括 `qualityEvidence` 开关），不允许缺字段。extension 和各 run 的样本数组最多 100000 条，是工具输入上限，不是质量目标。JSON 重复键、转义后相同键均拒绝。所有摘要为小写 64 位 SHA256，code SHA 为小写完整 40 位 Git SHA。匿名 ID 延续 UPG-02：16 位小写 hex 后缀，reference 为 `ref_…`，run 为 `run_…`。不接受 URL、真实姓名或任意视角自由文本。错误只返回固定代码，不输出文件路径、输入值、JSON 解析上下文或底层异常。

绑定使用**文件原始字节** SHA256（包括缩进、换行、末尾空白），不是解析后重排的摘要。先冻结 dataset 字节，再在 extension 和 predictions 中填同一 datasetSha256；冻结 extension 后填 predictions.extensionSha256。改换行也必须重新冻结绑定。工具不会自动修复绑定。报告包含三份实际文件摘要。

## 文件 1：dataset

完整 UPG-02 v1 对象，字段 `schemaVersion,datasetId,synthetic,authorizationRecords,samples`；每个样本保留独立商品真值双标和必要仲裁、原 referenceImageSha256、observedImageSha256、split、workspaceId、skuId、packagingVersionId、authorizationId。只有通过原 `validateDataset` 才继续。它的错误在新 CLI 统一为 `UPG02_DATASET_INVALID`，不替换旧协议或修改旧 CLI。

这套商品真值负责关键缺陷分母，**不由 view truth 或 prediction 重写**。原参考必须出现在该样本扩展集合中。两种真值可以不同：例如同视角找到有效标准参考，但商品仍有可观察 critical 包装缺陷。

## 文件 2：view extension

| 对象 | 必须字段及约束 |
|---|---|
| 根 | `schemaVersion:1,datasetId,datasetSha256,synthetic,policyVersion,policySha256,samples` |
| samples 元素 | `sampleId,references,annotations,adjudication`；ID 与 dataset 恰好一对一，禁止缺失、额外、重复、未知 |
| references 元素 | `id,imageSha256,view,observability,status,source`；每样本 1–16 条，ID 与图像 hash 均不重复 |
| source | `workspaceId,skuId,packagingVersionId,authorizationId`；逐字段等于该 dataset 样本 |
| annotations 元素 | `annotatorId,independent:true,blind:true,label`；恰好两条，不同 ann ID |
| label | `observedView,observability,conclusion,acceptableReferenceIds` |
| adjudication | 一致时必须 `null`；分歧时必须 `{adjudicatorId,reason,label}`，第三个不同 ann ID |

枚举：

- `view`、`observedView`：`front/back/side/top/bottom/detail/unknown`。
- `observability`：`observable/partial/unobservable`，对参考和候选图各自声明。
- 参考 `status`：`available/invalidated`。失效、低可见、unknown 参考不能作为可确认选择。
- view `conclusion`：`compatible/no_match/insufficient`。
- 仲裁 `reason`：`view_resolution/reference_resolution/observability_resolution/multiple_disagreements`。

`compatible` 要求候选图已知视角、完全可观察，acceptableReferenceIds 为非空、无重复、属于本样本集合的 ID 数组，每项必须同视角、available、observable。允许多个可接受答案。`no_match` 要求已知视角、observable，数组为空；表示独立声明没有可接受参考，即使有同视角元数据参考也不确认。`insufficient` 数组为空，允许 unknown、低可见或缺参考。unknown/partial/unobservable 不能断言 compatible 或明确 no_match。

一致性比较将 acceptableReferenceIds 当集合，顺序不同不算分歧；其他 label 字段必须一致。分歧保留两份原标签，再保存第三人决定，不允许丢弃或用预测替换原标签。此处的 blind/independent 只是输入声明：工具不认证真人身份、是否真正盲标或仲裁过程。

校验先纳入完整 dataset 所有原参考和候选图，再遍历所有新增参考：任一图像 hash 跨 development/holdout（包括不同角色）均拒绝；同 hash 的完整 source 四元组必须一致，不能换 SKU、包装、工作区或授权绕过来源；同 ref ID 的 hash/视角/可见性/状态/source 必须一致。原 UPG-02 的 SKU 跨 split 隔离继续生效。待检图不能自身作为参考。相同 source 的参考可以在同 split 的多个不同观测样本重复使用。新增参考不能借拆分文件或不同 ID 绕过全局检查。

这是**精确 hash 与声明 ID 校验**，不读图片，无法检查 hash 是否真实、规范 SKU 是否使用别名、近重复图片、真实包装身份、授权有效期或实际 split 隔离。必须由独立数据保管方额外审计。

## 文件 3：predictions

| 对象 | 必须字段及约束 |
|---|---|
| 根 | `schemaVersion:1,datasetId,datasetSha256,extensionSha256,synthetic,policyVersion,policySha256,baseline,candidate` |
| baseline、candidate | 各自 `{metadata,samples}`；必须完整回放同一 dataset，不能删除缺预测样本 |
| metadata | `runId,codeSha,model,promptVersion,policyVersion,policySha256`；两 run ID 不同 |
| model | `{provider,modelId}`，显式提供，不猜模型来源 |
| samples 元素 | `sampleId,selection,matchDecision,qualityDecision`；样本精确一对一 |

provider/modelId/promptVersion 和 run policyVersion 为 1–120 位标识 token：首字符字母或数字，其余字母、数字、`.`、`_`、`:`、`/`、`-`；`unknown/unspecified/null/none` 不接受（忽略大小写）。不支持填任意备注。run policySha256 必须明确提供完整 hash，但属于外部已生成 run 的未核实声明，可与本工具策略不同；两 run 的模型/prompt/code/policy 也可不同。根 policyVersion/hash 绑定本工具诊断策略。工具从不据 code SHA 推测模型/版本，也不宣称运行过这些模型、证明这些代码存在或外部策略实现正确。

`selection` 为本样本可用、observable、已知视角的 ref ID 或 `null`；未知、跨样本、失效、低可见参考拒绝。可回放已知参考的**错视角选择**，诊断会记错误；在 unknown/低可见候选图上声明 MATCH 也仅记不可判定和 unsafeMatch，不输出确认推荐。

| matchDecision | selection | 允许的 qualityDecision |
|---|---|---|
| MATCH | 非 null | ALLOW / REVIEW / BLOCK |
| REVIEW | null 或有效 ID | REVIEW / BLOCK |
| NO_MATCH | null | BLOCK |

因此 REVIEW/ALLOW、NO_MATCH/ALLOW 等组合拒绝；MATCH/ALLOW 遇 critical 商品真值则计入漏放，而不是因正确找参考就免除质量风险。prediction 不得提供或覆盖真值。

## 冻结策略与报告口径

诊断策略 version：`reference-view-conservative-001`；SHA256：`e493d305da3385d234f8eca4d0f7f8433ece5f5355c0165289ff3a5324893f19`。摘要取 [工具 POLICY](../../scripts/evaluate-reference-view-shadow.mjs) 对象递归按 key 排序后的 UTF8 JSON。报告携带版本、hash 和完整 manifest。变化须新版本与重新冻结输入；不能沿用旧质量结论。

参考候选集合仅在 resolved view truth 为 compatible、候选已知视角且 observable 时，从相同来源、同视角、available、observable 的参考中按 ID 排序取得。它是元数据保守候选集，可能大于人工 acceptableReferenceIds；不判断具体缺陷，不推断最佳视觉相似度。多个候选时 uniqueReferenceId=null；单个只给诊断 ID，`confirmedMatch` **始终 false**。不得把此报告当人审或发布 eligibility。

| 推荐 reason | 含义 |
|---|---|
| UNKNOWN_OBSERVED_VIEW | 候选视角未知，不推荐 |
| LOW_OBSERVABILITY | 候选不完全可观察，不推荐 |
| DECLARED_NO_MATCH | 独立标签声明无匹配，不推荐 |
| INSUFFICIENT_EVIDENCE | 证据不足，不推荐 |
| NO_COMPATIBLE_REFERENCE | 无保守候选（有效 compatible 标签至少已有可接受项，通常不会触发） |
| SINGLE_COMPATIBLE_REFERENCE | 单一元数据候选，未确认匹配 |
| MULTIPLE_COMPATIBLE_REFERENCES | 多解，只输出集合 |

每个 split 单独输出，**没有合并 headline**：

- sampleCount/sampleDenominator：全部被冻结样本，包括 REVIEW 与 insufficient；缺 prediction 直接拒绝，不偷偷缩分母。
- decidableDenominator：resolved view conclusion 为 compatible 或 no_match；insufficient 不参与正确比例。matchDecision=REVIEW 无论真值怎样都为 abstain，绝不算正确。
- 六项 outcome 计数完整分割样本：correctMatch（MATCH 且在 acceptable 集合）、wrongMatch（可判定但选择错误）、correctNoMatch、wrongNoMatch、abstain、unevaluable（insufficient 且非 REVIEW）。unsafeMatchOnInsufficient 另列。
- declaredCorrectRate=(correctMatch+correctNoMatch)/decidableDenominator；其中可判定 REVIEW 留在分母。只是声明输入诊断，不能写成准确率达标。
- coverage=(MATCH+NO_MATCH)/sampleCount；reviewRate=matchDecision REVIEW/sampleCount。coverage 也包括错误和不可判定输出，不代表质量。qualityAllow/Review/Block 独立计数，不能与匹配 REVIEW 混为一谈。
- criticalDenominator：UPG-02 resolved 商品真值 severity=critical 且 observability≠unobservable。UPG-02 允许可见部分的 mismatch，**partial 的 critical 也保留**，不依赖视角真值。criticalAllowed 为其中 qualityDecision ALLOW，criticalMissedAllowRate=criticalAllowed/criticalDenominator。quality REVIEW 不算漏放，criticalQualityReview/criticalMatchReview 分开计数；另有 criticalBlocked。
- differences 在同一 split、同一冻结样本逐项比较 selection/matchDecision/qualityDecision 变化；becameCorrect/ceasedCorrect 仅针对可判定样本。不能把 candidate 自己当人工真值。

所有比例包含 numerator/denominator/value/reason。空分母 value=null、reason=EMPTY_DENOMINATOR，不输出 NaN 或“0%成功”。只含 development 时 holdout 明确零样本及 null 比例。按 SKU 和原商品 defectType 列样本数供缺口检查；样本和关键错误分母不足，**不做 SKU/类别排名**。不实现质量阈值、统计显著性或整体质量 PASS。

输出 evidenceKind 为 synthetic_test 或 unverified_declared_input，所有来源状态 UNVERIFIED。原始标签保留在输入文件；报告给 resolved truth 与绑定 hash 便于追溯。输入顺序变化不改变语义诊断/排序输出，但原始 hash 随字节变化；这不是同一冻结输入。

## 验证与阶段完成条件

显式合成测试三文件见 [synthetic fixture](../../fixtures/reference-view-shadow/synthetic/)，只证明工具行为，不对应图片、真人、授权或模型。测试覆盖错 hash、字段/枚举、预测一对一、来源/SKU/包装、跨 split 新参考泄漏、双标和第三人仲裁、unknown/低可见、多解、缺分母、伪装 real、只读和 symlink 入口。专项原始结果另存 fixtures/reference-view-shadow，不覆盖 UPG-02 或已有 QA 证据。

开发本地提交后由独立 QA 固定完整候选 SHA 验收。仅 local_only UPG-07A 可以在独立 PASS 后关闭；本地专项 PASS 不是独立 QA PASS，不解除真实样本、人工来源或 runtime 门槛，不授权生产发布。

本轮 [开发验证与源码摘要](../../fixtures/reference-view-shadow/validation-2026-10-12/developer-validation.json)、[专项原始 stdout](../../fixtures/reference-view-shadow/validation-2026-10-12/specialized-raw.txt)、[合成回放原始 JSON](../../fixtures/reference-view-shadow/validation-2026-10-12/synthetic-replay.json) 是开发证据，独立 QA 尚待总控安排。
