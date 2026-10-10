# 真实发布证据的结构化转录

没有新部署或补造事件。原始材料保留在上级 production-release-2026-10-10*.json。

- 授权时间取总控原生任务中用户发布授权所在 turn 的 startedAt=1791618025，作为收到授权的记录时间；recordRef 指向该原生 turn。
- 构建前 fresh 检查和构建后检查时间取真实 release-prepared 的 initialCheckedAt/checkedAt。
- deployment.completedAt 使用 Cloudflare deployment 列表的 Created 时间 2026-10-10T08:09:59.382Z，表示该100%部署生效记录，不冒充终端退出时间。
- 迁移查询原始结果是 No migrations to apply；精确查询时间未保存，因此 checkedAt=null，不编造时间。该次发布无migration差分。
- releaseQa 时间取独立任务 01a124d8-3733-7161-99ff-2bbba6b0961e completedAt；productionQa 时间取 01a124de-1d27-73d1-ad7a-062cda996a51 completedAt，原始报告已保留。
- schema 2 的 smoke 只支持同origin成功HTTP，转录health、首页、checks和pricing四项；原始7项记录中的401和www308仍保留且已独立验收，未伪装为2xx。schema并非完整测试结果替代品。
- 原QA候选至最终release另有pnpm命令文档修正及符号链接摘要修复，releaseQa精确绑定实际发布SHA；不只靠祖先关系证明代码通过。
