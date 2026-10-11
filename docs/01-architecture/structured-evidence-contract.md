# UPG-04 双图结构化区域证据

## 2026-10-11 第二轮：类型化身份与直接一致性（当前行为）

本节补充并取代下方第一轮中“任意非空身份描述可支持匹配”的边界。独立 QA `8870f8c1bf3d963ef1203d2f68999510f0f794a5` 的四个原反例先按原字节保存并复现 FAIL，再修复；原整体 QA FAIL 保持有效，没有用通过的浏览器检查抵销。

新严格 provider schema 要求 `referenceIdentityKind`、`candidateIdentityKind`，映射到各侧 identityEvidence kind：`readable_text`（直接文字转录）、`brand_name`（直接可读品牌名/字标）、`symbol`（非文字标识）、`geometry`（物体/颜色/几何描述）、`absent`、`unreadable`、`unknown`、`not_applicable`。visible_text 仅接受双方 readable_text；logo 仅接受双方 brand_name。缺类型、图形符号或普通物体描述不建立充分品牌身份，不再扩充物体英文排除词表。当前不支持仅靠任意非文字图形描述通过 logo 检查；这是一项明确的保守能力限制。

`visibleIdentity` 仅建立检查视图：NFKC、空白折叠、去除 Default_Ignorable_Code_Point、Cc/Cf 和商标装饰；必须剩余可读字母或数字。纯零宽、控制、格式、组合附加符或标点不能充当文字证据。原始 reference/candidate identity 字符串、模型 raw、provider status/observability 不被改写。

仅对**类型化的直接身份内容**比较，不要求双方自然语言观察描述整句相同。品牌名处理大小写、兼容字形和有限标点/空白写法；文字中的明确公制体积、质量、长度和计数单位处理有限别名与精确十进制换算。数量以 BigInt 有理数比较，避免浮点舍入；序列使用带类型分段，防止模型文字与内部标记碰撞，保留数量出现顺序、未知数字格式、负号和裸数字前导零。不猜测地区小数/千分符、盎司约定、任意自然语言同义词或品牌别名。例：`ALPHA 100 ml` 与 `alpha 0.1 litre` 可支持匹配；100ml/200ml、质量/体积冲突或 ALPHA/BETA 不能支持 reported match。

直接内容与 match 矛盾时变为 uncertain，产生 REVIEW 和明确冲突原因，同时保留原可观测性、可见标记及转录，不把可读差异假称不可见。无可读/类型不足的身份仍 not_observable；充分的明确 mismatch 仍由原策略 critical FAIL，不自动把矛盾 match 变成确定 FAIL。其他检查和历史读取行为不变。

新响应/指令版本后缀为 `+regions-003`，应用绑定 `identityEvidence.validationVersion=identity-evidence-002`，失败 normalization raw 同样记录该守卫版本。编排版本保持 engine008、risk003、modelpolicy002；身份守卫以独立版本区分，避免本轮禁止改动的 UI 固定历史版本判断把新结果误标为历史。未改模型、价格、调用次数、服务或客户端展示。

证据见 `fixtures/structured-evidence/identity-consistency-repair/`：四个原始 QA 输入输出及索引、修复前四项 FAIL、55 项原反例/类型/Unicode/数量单位/正例检查、49 项结构化与持久化回归。旧“位置不影响匹配”正例误用了 ALPHA/BETA 的相矛盾身份；本轮将其正例输入改为实际相同身份，保留判定期望，并以独立反例检查相矛盾身份必须 REVIEW。原历史 fixture/report 不覆盖。

本轮 UI、CSS、定位规范化、浏览器脚本和对应持久 fixture 摘要与独立 24 项浏览器证据一致，仅复用其 UI 部分；保存的原完整 QA 仍为 FAIL。执行 typecheck、原 policy 回归和定向 lint；不重复浏览器或本地 build，最终 Cloudflare 构建和生产复验仍留给授权发布阶段。

限制：身份类型和转录仍由模型报告，不能证明图中实际文字或品牌，也不能保证模型不会错误分类或编造字段；不支持图形标识的独立识别、任意跨语言等义判断或真实 OCR/定位准确率。新 schema 所需类型不会补写到历史记录；新 provider 不接受缺类型输出，旧接口/测试输入保持兼容，明确提供但缺类型的 identityEvidence 保守降级。所有坐标仍按已验收策略隐藏，原始机器历史和独立失败证据不修改。

## 2026-10-11 生产反例后的保守修复（当前行为）

下文最初开发行为与验证记录保留为历史；本节取代其中“合法模型区域即可画框”和“Verified”的现行语义。原候选 `ec5a73d2492eb010dc60571ea90a6d2a0a7af815` 的验收记录不改写。生产 `324a5283b63a73c8b5c5cd1222f49f757f7a2c3b` 的真实单项合成分析证明：坐标数值合法、模型 high confidence、图片映射正确，仍可能把 logo 框画在空白背景；同一结果明确描述无可读文字，却声称充分可观测并 PASS。

总控确认当前最小策略：**没有独立定位验证能力时，所有模型坐标提案均不画框**。不是纠正该图片坐标，也不根据特定像素、文件 ID 或固定框做特殊处理。`normalizeImageRegion` 仍验证几何；`suppressUnverifiedRegions` 在实际 provider、engine、读回与 UI 路径将合法未验证提案变为 `region=null, reason=uncertain_location, confidence=null`。原始坐标和模型置信度留在 `regionRaw`；非法提案仍标 invalid_region，不可见优先标 not_visible。当前没有“已验证来源”或校准机制，也没有打开框的绕过开关。本修复暂时移除实际模型框的展示能力，不能据此声称定位能力验收通过。

新 OpenAI 响应严格要求 `evidence.referenceIdentity`、`candidateIdentity` 两个 string/null 字段：visible_text 为各自图片直接可读的身份文字或数值转录；logo 为可辨认的品牌或独特标识描述；其他检查为 null。它们映射到可选的 `ObservationEvidence.identityEvidence`，以兼容旧结果。空、占位、不可读或通用几何形状证据不能支撑身份 match/mismatch。已有描述明确无可读文字、无标识或只有通用 logo bar 的矛盾亦保守降级；这些文本规则是辅助一致性防线，不是 OCR、图像验证或覆盖所有语言的语义系统。实际新 provider 的结构化字段必须通过 schema，不能用字段缺失逃过校验；旧 provider/test 输入与历史结果保持字段兼容。

上述检查不充分时，engine 将该观察变为 not_observable、coverage=insufficient 并由原风险策略产生 REVIEW 限制；原始 provider status、observability、evidence 和 raw 字符串保存在 normalization raw 中。不把所有检查笼统 REVIEW：有明确双方身份内容的匹配仍可 PASS，充分的品牌/可读数值差异仍可 critical FAIL，其他检查仍沿用原判定规则。版本为 `m0-qa-engine-008`、原 prompt 值后缀 `+regions-002`；risk policy 仍为 003，model policy 仍为 002，未改变默认模型或增加第二次调用。

界面用 Model-supported checks / Model reports a match 代替 Verified，显示双方 model-reported identity evidence。Analysis provenance 明确这是已保存的机器结果、身份内容为模型报告、区域未经独立验证；旧 engine 结果额外说明当前身份防线没有应用于该历史分析。读取仅安全降级展示位置并保留原始提案，**不重跑、不改写数据库、不静默修改历史 verdict/status**。旧生产 PASS 不因本次打开页面而被改成 REVIEW；新 engine 的新分析使用新守卫。

开发修复证据集中在 `fixtures/structured-evidence/production-repair/`：不可变的原 DOM、图片与像素位置证据及 SHA256 索引；明确标注为从 DOM 重建、非 SDK wire response 的反例；修复前 3 项失败和修复后 3 项通过；49 项专项及真实 SQLite 持久化读回的修复反例。原始开发及独立 QA 目录不覆盖。开发浏览器调用因连接延迟超出首次测试服务存活时间未执行；新真实组件桌面/窄屏脚本已准备且编译通过，浏览器验收留给固定 SHA 独立 QA，不记 PASS。typecheck、原风险策略回归、定向 lint 和一次本地 build 的记录见同目录 checks.json。

限制：结构化身份内容仍由模型提供，不能排除模型编造、错误转录或误识别；本修复不证明 OCR、身份或定位准确率，也不提供独立图像定位。只验证受控反例与保守判定路径；没有新的真实模型调用、生产数据修改、push 或 deploy。新后代 releaseSha 需要独立增量 QA 和 GitHub 先行的修复发布，再由授权角色做真实生产复验。

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

## 第三轮身份修复：协议内容不能充当实体身份

生产反例把身份类型 `brand_name` 同时填进双方身份内容，导致 logo 分项错误地通过。`identity-evidence-003` 在既有类型、可见性和一致性校验中增加协议内容检查：协议枚举、字段名、schema 元数据、版本标记和模板占位内容不能建立可读实体身份，必须 REVIEW，并保留原身份内容、raw 和不足原因。旧历史记录不重写。

`lib/qa/identity-protocol.ts` 与 provider 共享身份类型枚举；`identity-protocol-catalog.json` 从实际 OpenAI `zodTextFormat` schema、受控 mapper/engine 输出字段及应用协议版本生成，不是扩充英文实体排除词表。专项脚本会核对生成结果，防止 schema 与目录漂移；协议变化时使用 `pnpm exec tsx fixtures/structured-evidence/protocol-identity-repair/verify-protocol-identity.ts --generate` 更新目录，再运行专项验证。

协议拼写比较先执行 NFKC、大小写归一化及不可见控制字符清理，再统一分隔符；还拒绝仅由协议 token 组成的组合、协议字段赋值、JSON 协议包装和 `<…>`、`{{…}}`、`${…}` 模板语法。只出现协议词片段的正常品牌名称仍可通过，例如 `ALPHA Reference`。恰好占用完整协议拼写或模板语法的真实实体文字会保守进入人工 REVIEW；此限制不代表已经验证图片内容，也不能阻止所有虚构转录。

本轮未修改提示词内容或响应字段，因此 prompt 后缀仍为 `regions-003`；guard 版本单独记录为 `identity-evidence-003`，引擎仍为 `m0-qa-engine-008`。UI、定位降级、风险策略、模型配置和费用不变。新反例来自原生产 DOM 的受控重建，并非原始 SDK 响应；原文件摘要和修复前 FAIL 均保留在 `fixtures/structured-evidence/protocol-identity-repair`。开发验证通过不替代固定提交的独立验收或生产复验。
