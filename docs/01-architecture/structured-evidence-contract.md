# UPG-04 双图结构化区域证据

本说明对应 UPG-04 本地开发候选；独立固定 SHA 验收尚未完成，不构成生产或模型定位准确率证明。生产发布须另行授权并遵守 AGENTS.md。

## 实际数据路径

1. `lib/ai/providers/openai-vision-provider.ts` 的严格响应 schema 接收双方位置；实际 `mapFidelityObservations` 把位置绑定到分析输入的 reference/candidate assetId。
2. `lib/qa/engine.ts` 在原一致性校验和风险策略之前规范化区域；不使用区域完整性改变已有文字证据的判定。
3. `lib/analysis/repository.ts` 仍完整写入现有 `evidence_json`。读回时根据分析记录的真实 assetId 和可观测性校验位置，不更新历史数据库记录。
4. 现有 analyses API 返回完整持久结果；`lib/analysis/types.ts` 不再把证据收窄成只有文字的字段集合。
5. `components/ProductChecker.tsx` 的 EvidenceBlock 显示双方文字、可观测性、coverage 与 `StructuredEvidence`；实际图片预览的 assetId 必须与该侧分析输入一致才显示图片和框。

没有新增迁移、外部服务、模型选择、重试、权限、价格或额度配置。风险策略保持 `m0-risk-policy-003`；引擎为 `m0-qa-engine-007`；真实 OpenAI 调用记录的 promptVersion 在配置值后追加 `+regions-001`，区分本次指令和 schema。新增响应字段会增加提示与输出内容，实际 token 成本仍按原 usage 计量；没有实测真实模型成本或定位效果。

## 保存字段

`ObservationEvidence.regions` 是可选的新结构，具有且仅具有以下三个字段：

| 字段 | 含义 |
| --- | --- |
| schemaVersion | 固定为 1 |
| reference | 参考分析图片的位置 |
| candidate | 候选分析图片的位置 |

每侧具有且仅具有以下五个字段：

| 字段 | 含义 |
| --- | --- |
| coordinateSpace | 固定为 `analysis_image_normalized` |
| assetId | 应用从对应分析输入绑定；持久结果必须匹配对应实际输入 |
| region | `{x, y, width, height}` 或显式 null |
| reason | 有框时 null；无框时为下表中的原因 |
| confidence | 定位的 high/medium/low；无框时 null；独立于观察 confidence |

模型响应字段为 `evidence.referenceRegion` 和 `evidence.candidateRegion`，每侧不包含 assetId。模型提供 ID 或额外字段会被严格 schema 拒绝；不会用它们选择图片或获取资源。几何错误的数值通过共享规范化器安全退化。SDK schema/传输错误保持原分析失败处理边界，不把无效响应当成已完成判定。

坐标相对于该侧**完整分析图片**，原点在左上角。四个值必须为有限数字，x/y 非负，width/height 正，x+width 和 y+height 不超过 1。没有像素、产品局部坐标或自动裁剪转换。拒绝越界而不修剪数值；合法且明确给出的全图框可以保留，但无位置绝不生成默认全图框。

| 无区域原因 | 含义 |
| --- | --- |
| not_recorded | 历史结果未记录该结构；仅用于显示，不补写历史 |
| not_visible | 相关证据不可见 |
| insufficient_evidence | 可见证据不足以定位 |
| not_present | 该特征不存在，不编造位置 |
| cannot_locate | 无法可靠定位 |
| uncertain_location | 定位太不确定；low 定位置信度也退化为此原因 |
| invalid_region | 结构、坐标、字段、版本或对应 assetId 无效 |

high 仍明确标为模型估计，不是校准概率。medium 用虚线框和 Approximate 标签；low 不画框。可观测性为 not_observable 或 evidence 的 visible=false 时，不保留对应框。定位有效性不证明 OCR、SKU 声明或文字观测为真。

`regionRaw` 独立保存原始区域载荷，规范化不覆盖已有值；非有限数字用 `{nonFiniteNumber: "NaN"}` 等标记保存，避免 JSON 无声丢失。已有 `raw`、`boundingRegions` 和文字证据仍保留。历史 boundingRegions 没有已声明的新坐标空间，不推断为本结构。

## UI 与保守判定

两侧明确显示 Reference · visible expected 与 Candidate · observed。参考文字仅表示参考图直接可见的预期，候选文字表示候选图直接可见的观测；SKU 文字声明不能填补视觉缺失。现有严重度、观察 confidence、可观测性和 coverage 保留，结果的 Analysis provenance 展示模型、prompt、provider、engine、decision policy、model policy；人工决定含义不变。

图片以自身宽高比显示，框与图片共用尺寸容器；100–200% 图片缩放同步缩放框，容器支持滚动。桌面并排，650px 以下单列。无法获取预览或 ID 不匹配时保留文字和区域元数据说明，不把框贴到其他图片。预览加载失败也隐藏图片与框。

缺少位置不自动否定已有充分文字证据；不足观察、选定检查缺失或重复仍由原策略输出 REVIEW。位置不是独立的 PASS 依据。共享规范化器同时用于 provider、engine、读回与 UI，避免绕过一层校验后误画框。

## 开发验证与重放

- `pnpm test:structured-evidence`：默认在临时目录生成唯一报告，不覆盖已保存证据。使用 `--report <路径>` 会把报告和实际持久读回的 `persisted-result.json` 保存到指定目录。
- `node fixtures/structured-evidence/ui-server.mjs`：使用已安装的 esbuild，绑定随机 localhost 端口。浏览器打开输出地址后，在真实 React 组件中运行桌面和 375px iframe 检查；两份报告写完后自动关闭服务。重放会覆盖该 fixtures 目录下浏览器报告，独立 QA 应在临时 checkout 或保存原报告后执行。

本候选开发记录见 `fixtures/structured-evidence/checks.json`：专项 42 项 PASS、桌面 10 项和窄屏 10 项 PASS、原风险策略回归、typecheck、定向 lint 和一次本地构建通过。浏览器报告包括图片原生/显示尺寸、框的实测归一化比例、150% 缩放、非法/历史/空位置状态，以及真实 ProductChecker 的持久结果恢复。窄屏使用真实 iframe viewport，报告实测宽度为 373px；没有声称独立顶层移动浏览器旅程。

首次专项执行在持久化比较处失败：测试把带 undefined 的内存对象直接与 JSON 读回对象比较。改为比较预期 JSON 序列化结果后通过，产品持久化逻辑未为此改动；原失败保存在 `attempt-1-results.json`。

所有图、字段和 SDK 输出均为合成资料。OpenAI SDK parse 边界、身份、额度及请求被受控替代；实际 mapper、引擎、政策、现有迁移下 SQLite 写读和真实 React 组件执行。没有真实模型、生产 D1/R2、付款、认证或生产 smoke 验证；合成框不能证明模型定位准确率。独立 QA 必须另外绑定最终候选 SHA；独立 PASS 后仍仅到 RELEASE_READY。
