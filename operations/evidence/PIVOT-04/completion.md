# PIVOT-04 完成记录（2026-11-15）

范围按 [契约](../../contracts/PIVOT-04.md) 和 [产品路线](../../../docs/PAIRVU_MODEL_CONTENT_ROADMAP.md) 执行。A–D 均已实现、独立候选验收、GitHub-first 发布、公开启用并独立生产验收。生产最后版本是 `4aa3211de6adeda413d31d165b45cf4485085338`，Cloudflare `5d60ac49-d2d4-4cfe-a870-98df3440e2b5`。本记录随后的文档归档提交不改变生产版本，不重复部署。

## 阶段完成清单

| 阶段 | 交付 | 生产 release SHA | Cloudflare version | 独立生产结果 |
|---|---|---|---|---|
| A | open-source TDK/首段、models 目录与导航、6 个比较的元数据/精确版本、价格状态、Qwen4 显示名/生命周期 | `3e207dfc18aea85f14bf79ff2127bab6b01774f9` | `7027e158-cb0e-415e-a17b-6d567bef5fed` | [PASS](production-2026-11-15/stage-a-production-qa.json) |
| B | 仅新增 4 个批准比较、双方互链和针对性选型；14 个模型无孤立 | `baea0b1b2e0cc656605bdfa783a7644d6399481e` | `b61e69ae-9e1e-483c-9601-dca6e61372a9` | [PASS](production-2026-11-15/stage-b-production-qa.json) |
| C | 基准总页/两详情页方法、版本、配置、成本和限制；分离历史基线/厂商报告；不新增 URL | `7daa548307ac3c21b33dbf6cfa03424ee1fb6258` | `1679090a-dc7d-466f-9736-8c3202a82431` | [PASS](production-2026-11-15/stage-c-production-qa.json) |
| D | Sonnet 5.5、Muse Wonder 两模型和配套两比较；官方精确事实及不可比边界 | `4aa3211de6adeda413d31d165b45cf4485085338` | `5d60ac49-d2d4-4cfe-a870-98df3440e2b5` | [PASS](production-2026-11-15/stage-d-production-qa.json) |

候选、来源、命令与原始验收见本目录各 `stage-*-developer-report.md`、来源清单和 `qa/stage-*`。D 候选为 `30db6587d3c7db6b99ca8b9ec849c82f99a806d7`；发布提交只增加验收证据。每阶段先确认上一阶段生产 PASS 才启动下一阶段。

## 最终验收与范围

- 实际 sitemap 43 URL，16 模型、15 比较，43/43 返回 200；全部模型有合理比较入链，零孤立。四个 D 页面 Title/H1/description/self-canonical 与双方链接通过生产检查。
- health 精确绑定最终 SHA 和平台版本；`/guides` 双形态 410，`/examples` 单跳 301 到首页，`/checks` 单跳 301 到 leaderboard，未知 URL 404。复用未受影响的早期路由证据，没有把本地 QA 当生产验证。
- 复用现有专项验证、typecheck、必要构建和定向 HTTP。没有新增测试框架、CMS、爬虫、实时汇率、任意多模型工具、综合分、账户/Stripe/API/客户数据操作或数据库迁移。
- 阶段 A 的原始 QA FAIL 和后续尝试保留于 `qa/stage-a/`：旧 `.next/dev/types` 导致类型冲突；发布构建改动 tsconfig 后脏树门禁曾阻止上传。最终排除生成的 dev types 后，通过稳定构建与独立复验再发布，没有绕过门禁。
- 临时开发服务 PID 74371 已由总控按精确 PID 停止；QA 服务已停止。没有新测试账号、客户资产或待清理生产数据。
- 正式 control 槽仍受历史 `JRN-04-FIX RELEASE_READY` 阻挡；保留原状态/锁，registry 仅记录真实 `PROD_VERIFIED` 证据，未伪造正式 CLOSED。修复旧控制状态不在本轮范围。

## 现有定时任务

2026-11-15 通过 Automations action 更新，归档前读取现有配置确认均 ACTIVE；未创建重复任务。以下均为 Asia/Shanghai：

| ID | 时间 / 下次执行 | 检查及报告 |
|---|---|---|
| `pairvu-2` | 周一 09:30 / 11 月 16 日 | 实时 health/sitemap、模型/比较数量、目标词、模型入链、来源/价格/可用性、断链/canonical；中文变化与最小待办 |
| `pairvu-gsc` | 周三 10:00 / 11 月 18 日 | 按首发/PIVOT-02/03/A/B/D 批次查收录、抓取、canonical、soft404、曝光/点击/查询；旧 URL 不重置首发日，无数据明确 BLOCKED |
| `pairvu-3` | 每月 1 日 10:30 / 12 月 1 日 | 内容陈旧度、模型覆盖、GSC/真实引用域、放量门槛；其余 4 模型只评估候选，不为数量凑页 |
| `qwen4-preview` | 11 月 26 日 09:00，一次 | 在 11 月 25 日 24:00 UTC+8 后核实官方续期/结束，报告保留历史 URL/互链及当前推荐调整待办，不提前标退役 |

任务只读检查并产出报告，不自动修改代码或发布。具体提示词已写入现有任务，产品路线中同步检查范围。

## 剩余事项与下一步

1. **GSC：BLOCKED，需用户输入。** 需要可访问 property 或最新导出；用户提交更新 sitemap 后，周报核对各批次收录与真实曝光。当前未执行 GSC 提交、未验证收录率，也不承诺排名/流量结果。
2. **后续模型：待后续决策。** 当前 16 个模型，其余 4 个候选必须按官方资料完整性、需求和配套比较选择，不自动开发。
3. **放量：不允许。** 必须同时达到至少 20 个有来源模型、逐模型合理比较入链、稳定批次 GSC 收录至少 80%、无集中索引质量问题且有真实曝光；当前模型数和 GSC 证据未达门槛。
4. **自动继续的是定期观察。** 最近一次为 11 月 16 日 09:30 内容检查；GSC 结论依赖连接/导出，其余只读内容检查可独立执行。新开发、批量页面、旧控制状态修复均不自动启动。
