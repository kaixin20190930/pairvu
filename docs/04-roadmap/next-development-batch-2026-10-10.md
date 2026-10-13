# 剩余开发与验收任务（更新于2026-10-13）

CSV修复已GitHub-first发布bbbe62c / Worker c88179e1-d880-4a19-8988-e041b25a2924，独立2项HTTP和5组真实A会话只读PASS，正式JRN-01-EXPORT-FIX CLOSED。原匿名500已解决；JRN-02测试模式付款/paid CSV/跨账号/取消降级已独立PASS并local_only CLOSED，候选d3fcb9c；生产计费/版本未变。JRN-03跨账号写入隔离及完整合成ELIGIBLE已独立PASS/local_only CLOSED，17场景与独立SQLite/组件核对通过，无新增生产部署。整体生产旅程仍INCOMPLETE。A/B/A只读隔离已完成，不再列为缺少第二账号。

| 优先级 | 最小任务 | 缺少的条件 | 推进方式 |
|---|---|---|---|
| P2（有条件再补） | 生产真实付费CSV与跨workspace拒绝 | 可控制的现有paid生产会话与验收范围 | JRN-02测试模式已通过；保留生产缺口，不为本轮验证要求新付款、不伪造套餐 |
| P1 | 素材到期/删除与权限回收补验 | 明确合成验收资产、可观察路径；永久删除须精确授权 | 先全新本地合成资产；写入隔离/ELIGIBLE本地JRN-03已PASS，生产覆盖仍保留 |
| P1 | UPG-07真实质量评测 | 真实授权样本、双人标注/仲裁、冻结留出集 | 工具已完成；材料就绪再独立核查，合成结果不替代质量结论 |
| P1 | UPG-10真实价值数据 | 真实业务来源和分类授权 | 保持test/unknown排除；有材料才受控分类 |
| P1 | HUMAN-05安全收尾 | 外部CI/设备依赖清单与权限需求 | 轮换已完成；先制定最小权限方案，不重复轮换或擅改权限 |
| P2 | UPG-08 API，然后UPG-09 Webhook | 具体调用方、最小契约；Webhook依赖API | 尚未实施，不自动扩大到外部集成 |

真实登录Free HTTP403仍缺可观察路径；当前Free UI禁用不冒充HTTP实测。所有已通过项目均限于原报告范围，UPG-04证据留存/退化PASS不等于完整六项质量PASS，自定义规则编辑器、外部电商发布和自动修图未纳入。

**下一步：** 建议启动“合成素材生命周期补验”，明确到期/删除对象、权限回收、可观察路径和恢复标准，待用户确认范围。JRN-03已自动完成独立验收、正式关闭和归档，无待返工FAIL；生产写隔离/ELIGIBLE仍需另有真实证据，真实质量仍等授权双标样本。API/Webhook未启动，pairvu-2保持PAUSED。

[整体进度](project-progress-2026-10-10.md)、[本次发布证据](../../operations/evidence/production-jrn01-export-fix-2026-10-13/manifest.json)、[任务台账](../../operations/task-registry.json)。
