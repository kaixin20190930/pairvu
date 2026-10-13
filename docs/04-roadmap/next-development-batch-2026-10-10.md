# 剩余开发与验收任务（更新于2026-10-13）

CSV修复已GitHub-first发布bbbe62c / Worker c88179e1-d880-4a19-8988-e041b25a2924，独立2项HTTP和5组真实A会话只读PASS，正式JRN-01-EXPORT-FIX CLOSED。原匿名500已解决；JRN-02测试模式付款/paid CSV/跨账号/取消降级已独立PASS并local_only CLOSED，候选d3fcb9c；生产计费/版本未变。整体生产旅程仍INCOMPLETE。A/B/A只读隔离已完成，不再列为缺少第二账号。

| 优先级 | 最小任务 | 缺少的条件 | 推进方式 |
|---|---|---|---|
| P2（有条件再补） | 生产真实付费CSV与跨workspace拒绝 | 可控制的现有paid生产会话与验收范围 | JRN-02测试模式已通过；保留生产缺口，不为本轮验证要求新付款、不伪造套餐 |
| P1 | 核心旅程剩余负向与生命周期：写入隔离、ELIGIBLE正向、到期/删除 | 明确合成验收资产、可观察路径；永久删除须精确授权 | 分单元定契约，优先可逆项目；当前A/B只读隔离已通过 |
| P1 | UPG-07真实质量评测 | 真实授权样本、双人标注/仲裁、冻结留出集 | 工具已完成；材料就绪再独立核查，合成结果不替代质量结论 |
| P1 | UPG-10真实价值数据 | 真实业务来源和分类授权 | 保持test/unknown排除；有材料才受控分类 |
| P1 | HUMAN-05安全收尾 | 外部CI/设备依赖清单与权限需求 | 轮换已完成；先制定最小权限方案，不重复轮换或擅改权限 |
| P2 | UPG-08 API，然后UPG-09 Webhook | 具体调用方、最小契约；Webhook依赖API | 尚未实施，不自动扩大到外部集成 |

真实登录Free HTTP403仍缺可观察路径；当前Free UI禁用不冒充HTTP实测。所有已通过项目均限于原报告范围，UPG-04证据留存/退化PASS不等于完整六项质量PASS，自定义规则编辑器、外部电商发布和自动修图未纳入。

**下一步：** 优先制定“可逆跨workspace写API负向＋完整ELIGIBLE正向”的最小契约，明确合成资产、恢复标准与生产操作边界，确认启动后由总控跟进开发和独立验收。当前JRN-02已自动完成关闭和证据归档，无需再次付款；新单元未自动启动，生产paid覆盖待真实会话和范围。API/Webhook不在本轮授权内，pairvu-2保持PAUSED。

[整体进度](project-progress-2026-10-10.md)、[本次发布证据](../../operations/evidence/production-jrn01-export-fix-2026-10-13/manifest.json)、[任务台账](../../operations/task-registry.json)。
