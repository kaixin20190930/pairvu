# UPG-04 结构化区域证据与可观测性（待登录门禁通过后派发）

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
