# UPG-07 真实参考视角样本就绪缺口

截至 2026-10-12，用户明确：**暂时没有真实授权样本及双人标注记录**。本阶段只完成 UPG-07A 离线工具与缺口说明。真实数据就绪状态 `NOT_PROVIDED`，真实质量评测 `BLOCKED`，`qualityEvidence=false`。未观察到不等于现实中不存在；本表仅说明本轮未提供或未核实的证据，不推断客户情况。

仓库 [UPG-02 fixture](../../fixtures/upgrade-dataset/synthetic-valid.json)、[UPG-07A fixture](../../fixtures/reference-view-shadow/synthetic/) 均为人工构造的匿名元数据/占位 hash，**没有真实图片或人工标注来源**。现有单张生产合成图只支持当时的流程验收，既不满足真实授权样本要求，也不提供独立双标/留出覆盖；不能自动补位或认证质量。

规划目标沿用整体方案：development 300–500 对，至少 100 对独立 holdout。这是采集规划，**数量达到不代表足够**：还需要独立来源、分布覆盖、可观察关键错误和干净留出。实际样本数、SKU/类别覆盖和 critical 分母当前未提供，不能写为真实零缺陷或“没有错误”。

| 要求 | 当前状态 | 补齐所需证据 |
|---|---|---|
| 真实图像及用途授权 | NOT_PROVIDED | 逐来源授权原记录：权利人、offline evaluation 用途及范围、有效期、撤销机制；匿名表与受控原记录对应，撤销后停止使用并重新冻结 |
| 授权真实性与有效性核实 | NOT_VERIFIED | 独立保管方核查记录来源与授权适用的图片、参考集合、目的；granted 布尔/字符串不能替代核实 |
| 实际字节 SHA 与近重复审计 | NOT_PROVIDED | 对真实图片字节计算 SHA；裁切、压缩、翻拍、近重复审计报告，交叉角色和跨轮也检查；CLI 不读取图片 |
| 规范 SKU/包装及跨 split 隔离 | NOT_PROVIDED | 规范匿名映射、包装版本来源、别名合并、不同工作区同 SKU 归一化；全量原参考+新增参考+观测图隔离检查 |
| 来源与冻结参考集合 | NOT_PROVIDED | 参考图与 workspace/SKU/包装/授权绑定；view、可見性、available/invalidated 状态及失效处理，不把待检图当自身参考 |
| 独立商品真值双标 | NOT_PROVIDED | 两个不同人工来源、相互不可见标签，按 UPG-02 标注缺陷/严重度/可观察性；原标签保留，第三人解决分歧 |
| 独立 view 真值双标与仲裁 | NOT_PROVIDED | 候选 view/可观察性/acceptableReferenceIds 或 no_match/insufficient，两份盲标及必要第三人仲裁原记录；不能从模型输出抄真值 |
| 标注人身份与独立性来源核实 | NOT_VERIFIED | 保管方核验匿名 ann 映射、盲标权限、时间顺序与第三人来源；independent=true、blind=true 不认证真人身份 |
| 视角/错误参考/遮挡覆盖 | NOT_PROVIDED | front/back/side/top/bottom/detail/unknown 分布及可观察程度；错误 SKU/包装、失效参考、低可见、无匹配、多解等反例 |
| 无缺陷和关键差异覆盖 | NOT_PROVIDED | 无缺陷正常对与 text/color/identity/packaging 等差异；可观察 critical 独立分母、REVIEW 覆盖，不能只采容易成功样本 |
| Development 覆盖与实际分母 | NOT_PROVIDED | 300–500 对规划对应的实际样本数、SKU/类别/视角及关键错误数；预先确定抽样与诊断口径，不因结果删样本 |
| 独立 holdout 保管与实际分母 | NOT_PROVIDED | ≥100 对规划对应的实际独立留出；独立评测方持有图像/映射/标签，开发不可据结果调标签、重分割或训练 |
| 冻结 dataset/extension/predictions | NOT_PROVIDED | 三文件原始字节 SHA、协议/策略版本、独立 run IDs 和完整 code/model/prompt/policy 元数据；所有预测完整绑定同一集合 |
| 外部 baseline/candidate run 来源 | NOT_VERIFIED | 提供实际生成记录与可核实代码/模型/prompt/策略版本；本工具只回放声明，不执行或认证模型 |
| 独立 benchmark 方案与验收 | NOT_PROVIDED | 抽样/分母/holdout 污染处置、独立来源核实及质量验收方案；本阶段不设统计显著性、质量阈值或排名 |

商品 critical 分母与可判定匹配分母必须分开。部分可见的 critical 仍进入关键错误分母；insufficient 匹配样本不能被删除来提高覆盖；REVIEW 不能算匹配正确。空分母只能报告 null 与缺口，不能宣称漏放为零或质量通过。完整 schema 和诊断口径见 [协议](reference-view-shadow-protocol.md)。

后续填写模板仅使用这些字段：`requirement / status / evidenceReference / verifiedBy / verifiedAt / scopeAndLimitations`；未提供时后三项为 null，并明确状态。**当前不创建任何虚构真实记录、签名、授权 ID、真人身份或实际采集数字。** 真实图片及识别映射应由授权保管方受控保存，不上传本轮代码仓库作为 fixture。

UPG-07A参考视角协议与离线shadow工具已完成，候选`7f4fa55c82e0a81250ff8bf5bc8a35b596caeb32`独立PASS并正式local_only CLOSED。首次QA发现100000样本上限失效，已返原开发修复；独立复验真实evaluator/CLI的100000接受、100001及baseline/candidate分别超限拒绝通过，原FAIL保留。 [独立最终报告](../../operations/evidence/UPG-07A.json)。

下一步：按样本缺口清单由用户/数据保管方准备授权记录、真实图像及参考集合、SKU分割、双人盲标/仲裁、独立留出集和baseline/candidate实际运行来源。总控本轮工程收尾已自动完成；因用户确认暂无样本，不自动开展真实质量评测或线上UPG-07接入，也不启动其他单元。样本就绪后先独立核实来源、冻结输入，再制定实际评测/线上接入最小契约；任何新增模型调用和生产发布另需相应授权。
