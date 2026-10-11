# UPG-04 结构化区域证据与可观测性

## 目标与前置门禁

在现有observations/ObservationEvidence和结果页面上增加可核对的双图区域证据，贯通provider→规范化→持久结果→界面；保持现有判定保守边界。UPG-03-LIFECYCLE-FIX生产关闭且真实登录旅程独立PASS之前不得claim。此契约准备不代表已开工。

## 范围

允许lib/domain/semantics.ts、lib/qa/*、lib/ai/providers/openai-vision-provider.ts、lib/ai/providers/mock-vision-provider.ts、lib/analysis/types.ts及实际结果映射/序列化文件、components/ProductChecker.tsx及独立证据组件、必要的app/globals.css局部样式；fixtures/structured-evidence/**、scripts/verify-structured-evidence.ts和package.json单一测试入口；对应架构/字段说明。先列实际映射路径再修改，不扩大到认证、价格、额度、队列、迁移或新外部服务。

## 产品契约

- referenceObservation是参考图中直接可见的预期，candidateObservation是候选图中直接可见的观测；不得把SKU文字声明当已视觉证实的真值。
- 双方区域分别声明坐标空间为对应分析图片的归一化x/y/width/height，范围[0,1]、有限值、宽高正、右/下边不越界。assetId只能由实际分析输入绑定，不信任模型提供任意ID。历史boundingRegions不得无依据解释为新坐标。
- 区域可以明确null及原因；不可见/不足/不存在/无法定位时绝不编造OCR、框或坐标。区域缺失不自动否定已有充分文字证据，但观察不足仍REVIEW，不允许缺位置被装饰成精确定位。定位不确定不能冒充确定。
- 保留严重度、confidence、双方可观测性、coverage及模型/prompt/engine/policy版本。旧结果正常读取，明确“未记录区域”而非补写历史；不改变人工决定语义。
- UI明确参考/候选图、预期/观测和不足原因；有合法位置才显示相应框，缩放/不同图比例下映射正确，不用全图默认框。坐标/结构坏数据安全退化到无区域及原因，不能崩溃或用修剪坐标冒充准确值。

## 验收与测试预算

固定SHA独立QA。专项覆盖合法双方区域、空值与不可见、越界/负值/零尺寸/非有限/额外字段、错误assetId、旧结果兼容、原始证据保留、双方不同尺寸显示、缺失定位不改变判定、不足观察不PASS、选定检查缺失及重复。实际结果序列化后读回无字段丢失；真实组件浏览器验证桌面与窄屏、无框状态。保留原风险策略回归、typecheck和一次必要构建；不因合成fixture宣称定位或模型准确率达标。无真实外部模型调用、付款或生产修改。

## 角色、停止条件与回传

开发gpt-6.1-sol/high：跨provider/schema/序列化/UI与保守判定边界；QA同配置high：独立畸形输入及历史兼容反例。不是默认最高模型；仅重复出现具体架构/推理能力不足时评估Astra，环境问题不升级。

只复用既有开发和QA。开发只提交允许文件，返回完整SHA、差分、验证命令/证据、风险。QA不修代码；FAIL返原开发，两次同类失败先诊断缩小范围。若需要迁移、改变API权限、提高模型成本或扩大业务范围，先交总控重新界定。独立PASS后仅RELEASE_READY；此新功能不继承SKU启用与必要修复的生产授权。

## 派发门禁已满足

2026-10-10 UPG-03-LIFECYCLE-FIX已正式CLOSED；独立生产登录PASS见operations/evidence/production-lifecycle-fix-2026-10-10/login-qa-raw.json。基线ce1f2fee7f43735ff6b6f13f3867840943d19471，后续总控提交仅证据/计划。UPG-04已允许自动本地研发，生产发布尚未授权。

## UPG-04验收完成与下一步（23:03）

候选ec5a73d2492eb010dc60571ea90a6d2a0a7af815，独立52项后端和30项浏览器检查PASS，原始报告及失败测试记录保存在operations/evidence/UPG-04.json及UPG-04目录。正式CLI已qa PASS→release-ready；当前没有运行中的开发/QA。生产仍为ce1f2fee7f43735ff6b6f13f3867840943d19471，SKU已启用且真实登录PASS。

下一步：等待UPG-04明确发布授权，再按AGENTS顺序推送、远端核验、部署及生产验收；关闭后制定UPG-05最小契约并重新选择角色模型。单槽不得跳过RELEASE_READY或沿用SKU发布授权。无新授权的重复巡检不重复通知。

## 本轮发布授权

用户于2026-10-10明确授权UPG-04推送GitHub、部署Cloudflare、生产验收及必要修复；通过后自动推进UPG-05人工审核与审计开发和独立验收。授权来源：总控thread 01a0bcd5-909b-7b72-b64b-399e8028c919，turn 01a12659-8f1b-7da1-af36-884b74ddb366，user message 01a12659-8f58-79e1-9fec-5e2f99ba7e53。新的授权覆盖本单元发布，不扩展为UPG-05生产授权。

发布QA复用原角色，gpt-6.1-sol/high：真实登录与provider结构、持久结果及历史兼容需要跨层核对；仅反复出现具体推理不足才升级，环境问题不升级。先核对最终发布SHA相对已验收候选的文档/证据差分，再独立验证生产HTTP及受控合成图片流程，最多一个必要分析、不购买，不触碰客户资产；会话失效则如实阻塞。

### 发布增量返工

5683183发布增量发现两份归档QA源码被tsconfig全目录收录导致15个typecheck错误。原开发仅允许将operations/evidence/UPG-04内两份.ts/.tsx归档改为非编译文本扩展名，并同步archive-index路径，保持原始字节及SHA256完全不变；不改原QA报告、不改应用代码或放宽tsconfig。专项typecheck及归档摘要检查即可，实际Cloudflare构建留发布阶段。开发Sol/medium（范围已定位），独立复验Sol/medium（明确差分及编译验证）；若出现额外运行时或构建问题再评估high，环境故障不升级。

### 生产功能反例返工（同一授权单元）

已部署324a528/Worker ba8e60c0-15b9-4594-877d-3fae8a4942ab，HTTP PASS，但真实登录单项合成分析出现两个阻断：logo框在空白背景；明确无可读文字仍充分可观测并贡献PASS。新分析batch-analysis-542cc540-b6cb-4830-b95b-b63ec85383e5；原始材料/tmp/pairvu-upg04-login-qa-1791645610632及即将归档FAIL报告。UPG-04不得关闭，UPG-05不得启动。

原开发Sol/high负责同一功能必要修复：允许原UPG-04范围及必要语义判定/显示，冻结旧失败历史，不改客户数据、不改价格或默认模型，不扩大第二次模型调用成本。优先建立可复现失败fixture，分析坐标生成与模型语义边界，防止不存在的logo/文字被判成已验证；无法可靠定位时null+原因，禁止用固定框或针对该图片硬编码坐标。提示词变更必须版本化；高location confidence仍非独立校准。若需新外部能力或成本机制先报告实质范围。不得用改测试期望掩盖真实反例。

独立QA Sol/high：新最终releaseSha完整差分与反例，原52/30相关回归、typecheck及一次必要构建，真实生产复验仍要通过。旧qaCandidate冻结ec5a73d保持历史；后代新发布必须新releaseQa证明而非旧PASS。原始生产部署/HTTP/功能FAIL均保留，最终PASS才正式manifest导入。理由是provider/判断/UI跨层风险；只因反复可定位推理不足再升级，环境不升级。

总控确认最小保守修复：未独立验证的模型定位不能默认画框，保留raw及明确未验证原因，不伪造定位来源。缺乏充分可读身份文字证据不能贡献PASS；不要用单个案例英文描述特判，应有可判定结构化依据。历史原判不被静默重写，读取时展示降级须明确区分。保留充分证据的match/mismatch，不把所有检查笼统改REVIEW。区域框受限是产品能力限制，必须如实记录，后续定位质量提升需独立样本与验证能力。

### 第二轮必要修复：缩小到身份规范化与一致性

8870f8c独立FAIL：ALPHA/BETA、100ml/200ml矛盾身份被标match，纯U+200B文字，黑色矩形帽盖冒充logo。原49/3及24浏览器通过但不抵销反例。失败见operations/evidence/upg04-repair-attempt-1/qa-original.json。已重复同类问题，先缩小范围并诊断，禁止通过扩大英文排除词表无限补丁来掩盖结构缺口。

允许lib/qa/identity-evidence.ts、必要provider身份字段/schema及types、engine版本/一致性接入、对应fixture/脚本和架构说明；不改UI或已通过的定位降级策略。规范化应处理Unicode不可见控制/格式字符和空值，保留原始输入；按身份类型处理直接可比文字和数量/单位冲突，不能机械要求所有自然语言描述完全相等。矛盾match至少REVIEW，充分明确mismatch仍FAIL。通用物体几何不得建立logo身份；如需明确身份类型字段，应保守定义并版本化，避免仅靠任意描述声称已识别。仍不宣称视觉验证或准确率。

开发与独立QA继续Sol/high，理由为已定位跨字段语义与Unicode边界，不是无依据升级最高模型；若再出现同类实质推理遗漏，再评估缩小为安全禁用该不可靠身份判定或更高能力模型。环境缺失不升级。专项重放四原反例＋必要正例/Unicode/数量单位变体、typecheck与policy回归；UI无变则复用已真实24浏览器证据并核对源码hash，避免重复build，最终Cloudflare仍实际构建。
