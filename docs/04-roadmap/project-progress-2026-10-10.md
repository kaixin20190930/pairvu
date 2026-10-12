# Pairvu 项目整体进展（更新于2026-10-12）

UPG-10价值指标已完成开发与独立验收，正式 **RELEASE_READY，尚未发布或启用**。生产仍为UPG-06：`da0e3554b9168d528f6ac2e985e6e4b9ad498838` / Worker `c329c189-df72-4e94-9abc-f2a0c6e63616`。工程完成不等于真实质量或客户价值验证完成。

| 模块 | 实现、上线与验收状态 | 实证边界 |
|---|---|---|
| 基础检测、批次、账户额度、付费入口和内容 | 已上线 | 完整真实付款及商业验证未完成 |
| AUTO-01/02 总控与独立验收系统 | CLOSED | 本轮主动wait/read已完成开发→独立QA→RELEASE_READY；pairvu-2保持暂停 |
| UPG-01 发布版本追踪 | 生产通过/CLOSED | SHA、Worker来源可核对 |
| UPG-02 评测契约与离线校验 | 本地独立通过/CLOSED | 真实授权双标留出集仍缺 |
| UPG-03 SKU版本及生命周期 | 已发布、启用，生产登录通过/CLOSED | 版本历史、旧批次冻结和归档恢复通过 |
| UPG-04 结构化区域证据 | 生产通过/CLOSED | 证据留存与安全退化通过；可靠定位和完整检测质量未证实 |
| UPG-05 人工审核与审计 | 已发布、启用，生产登录通过/CLOSED | 批准/拒绝/撤销、审计链和原机器证据保留 |
| UPG-06 发布工作台与规则版本 | 已发布、启用，限定生产验收PASS/CLOSED | 机器/人工/资格分离、筛选、分页和Free UI门禁；不是外部电商发布 |
| UPG-07A 离线参考视角评测工具 | 独立PASS/local_only CLOSED | 协议及工具完成；真实质量仍BLOCKED |
| UPG-10 价值指标 | 独立PASS/RELEASE_READY | 未推送、未迁移0022、未部署、未启用；没有真实价值结论 |
| UPG-07运行时、UPG-08 API、UPG-09 Webhook | BACKLOG，未实施 | 分别等待真实评测输入、明确调用方契约、前置API |

## UPG-10本轮结果

候选`3f6447c1c5e3af159ae86be3f7a413a31db1a169`。提供workspace内只读指标页/API、追加式来源分类和离线分类材料校验/导入准备。统计去重用量、冻结SKU使用与复用、机器分布、人审覆盖与首次决定等待、检测估算成本。批次多张图片不重复算复用；客户端埋点不能扩大分母；test和unknown从所有业务分子、分母、分组、成本、等待时间中排除。零分母为null，缺失成本不是零，审核等待不等于实际人工工时，图片生成模型未知不以检测模型冒充。

开发26项D1/434请求、13项组件及typecheck/lint/最小回归通过。独立24项D1/573请求、7项组件、5次分类CLI调用、固定候选源码build及类型/lint/相关回归通过；另重跑26项开发专项。独立验证含两租户、伪造参数/埋点、分类更正、原子回滚、批次去重、审核等待、空态/错误恢复、375px/1280px、5000/5001 cohort、100/101分类和审核事件、UTF8上限及读取间撤销归属。

本地浏览器使用实际组件/CSS与合成API/导航夹具；API/SSR/DB另行本地验证。归档源码构建因无Git元数据嵌入SHA unknown，仅为本地固定源码构建成功，不是可部署的GitHub-first发布产物。没有生产登录验收、模型调用、付款或真实业务分类。

[独立原报告](../../operations/evidence/UPG-10.json)、[56份原始材料与摘要映射](../../operations/evidence/UPG-10/archive-index.json)、[指标与分类口径](../01-architecture/value-metrics-contract.md)、[开发自测与失败记录](../../fixtures/value-metrics/validation/README.md)。正式CLI已qa PASS→release-ready，当前没有运行中的开发/QA。

## 哪些失败已修，哪些仍未验证

- 已修复：UPG-03归档恢复状态；UPG-04错误位置及缺失证据误PASS；UPG-06 Unicode字节预算；UPG-07A 100000上限；UPG-10 CLI模块兼容、类型检查、测试夹具和窄屏溢出。原始失败保留，当前UPG-10没有待返工产品阻断。
- 未验证：真实准确率、critical误放行、可靠区域定位与参考视角提升。用户确认暂无真实授权样本/双标，不用合成数据替代结论。
- 生产覆盖仍缺：真实付费CSV正向、登录导出HTTP403实测、完整ELIGIBLE正向、第二账号跨租户，以及更广的素材保留/多SKU/付款旅程。UPG-06本轮8项HTTP及16项真实登录PASS只覆盖其报告范围。
- 商业与人工事项仍缺：受控真实业务来源和持续使用、设计伙伴/授权数据/双标留出集、标准加量包/Live portal、试点续用及定价复盘；历史密钥轮换闭环记录待负责人核实。

UPG-04生产合成案例仅有logo观察，另外五项缺失明确进入REVIEW；未验证框已隐藏，不能宣称完整六项检测或可靠定位已完成。人工批准也不等于对外发布。

## 下一步做什么

1. **首要工程动作：发布并启用UPG-10。需要新的明确授权，当前不自动执行。** 授权后提交配置并验证，推GitHub、fresh核对精确提交，执行0022迁移，同SHA部署Cloudflare，做真实登录独立验收；失败继续修复。没有待补的本地QA阻断。
2. **真实价值数据准备：需要业务负责人提供可核查来源和授权。** 历史默认unknown；受控逐条分类后才能形成业务指标。测试/合成数据不能标业务；没有材料时允许页面为空，不造数。
3. **UPG-07真实评测：等待授权样本、双人盲标/仲裁及冻结留出集。** 15项缺口见[清单](../05-evaluation/reference-view-sample-readiness.md)。材料就绪先独立核查，模型调用与线上接入另定范围。
4. UPG-08 API、UPG-09 Webhook在具体调用方需求和前置依赖明确后再排；本轮不自动启动。

本轮总控已自动完成工程验收与进度同步；下一步被发布授权/真实数据输入约束。定时恢复任务pairvu-2按既有决定继续PAUSED。

生产依据：[UPG-06 manifest](../../operations/evidence/production-upg06-2026-10-12/manifest.json)、[真实登录验收范围](../../operations/evidence/production-upg06-2026-10-12/production-functional.json)。另见[完整升级方案](product-upgrade-plan-2026-10-10.md)、[剩余清单](next-development-batch-2026-10-10.md)、[任务台账](../../operations/task-registry.json)。
