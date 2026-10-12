# Pairvu 项目整体进展（更新于2026-10-12）


基础检测、SKU标准、结构化证据、人工审核审计和发布工作台已形成生产流程。UPG-01至UPG-06均已正式关闭；UPG-02是离线工具，其余运行时升级有相应生产证据。工程完成仍不等于真实检测准确率和商业验证完成。

## 当前生产与本轮交付

2026-10-12：UPG-06发布工作台已发布、启用并通过本轮真实登录独立验收，正式CLOSED。生产SHA `da0e3554b9168d528f6ac2e985e6e4b9ad498838` / Worker `c329c189-df72-4e94-9abc-f2a0c6e63616`。GitHub-first fresh核验、无待迁移确认、精确SHA构建部署完成；8项独立HTTP、16项真实登录业务检查PASS。付费CSV正向及登录导出HTTP403未生产实测，完整ELIGIBLE正向仅本地验收，不泛化为全业务路径覆盖。pairvu-2继续暂停。

发布前独立增量77项D1/1853请求与typecheck通过；原实现91项D1/52项浏览器及相关回归证据保留。启用配置已随发布提交推送，代码缺省仍安全关闭。本次生产无待迁移，原0021已在UPG-05应用。构建、fresh远端核验、Cloudflare版本和健康接口均绑定同一SHA。

| 模块 | 当前状态 | 实证边界 |
|---|---|---|
| 基础检测、批次、账户额度、付费入口和内容体系 | 已上线 | 完整真实付款及商业验证未完成 |
| AUTO-01/02 总控、开发、独立QA与证据状态闭环 | CLOSED | 活跃wait/read交接；pairvu-2已暂停 |
| UPG-01 发布来源追踪 | 生产通过/CLOSED | SHA与Worker版本可核对 |
| UPG-02 评测契约与离线校验 | 本地独立通过/CLOSED | 真实授权双标留出集仍缺 |
| UPG-03 SKU版本化及启用/生命周期修复 | 生产真实登录通过/CLOSED | 历史保留、旧批次v3、当前标准v5 |
| UPG-04 结构化证据 | 生产通过/CLOSED | 留存与安全退化通过；可靠定位与完整检测仍待提升 |
| UPG-05 人工审核与审计 | 生产真实登录通过/CLOSED | 批准/拒绝/撤销、审计链和机器证据保留 |
| UPG-06 发布工作台与规则版本 | 已发布、启用、限定生产验收PASS/CLOSED | 规则来源、机器/人工/资格分离、SKU/批次筛选、分页及Free UI门禁通过 |
| UPG-07A 离线参考视角评测工具 | 独立PASS / local_only CLOSED | 协议、只读校验、对比诊断与15项样本缺口；不构成真实质量证据 |
| UPG-07/10/08/09 | BACKLOG，未开工 | 线上视角匹配/实际评测、价值指标、API、Webhook |

## 真实登录验收与限制

本轮复用真实Free会话和指定合成SKU。工作台显示机器REVIEW、人工REVOKE revision3、规则BLOCKED；缺失观察与限制明示，rule `release-policy-001` 及hash和源码一致。指定SKU冻结v3/v5与reference v1、批次、筛选空态、两页各20条无重复及返回首页、详情和审计均通过。六组精确远端D1 SELECT写入0行，原机器快照/原观察、审计revision1–3与上一轮完全一致，额度仍6。没有新模型调用、付款或审核变更。

Free导出按钮禁用已验证，匿名API401已独立验证。浏览器直接API导航受阻，因此真实登录导出HTTP403未观测；真实付费CSV正向、生产完整批准后的ELIGIBLE转移、第二账号跨租户生产探测未覆盖。这些不能以本地合成反例PASS替代；本轮PASS只适用于报告列出的16项业务检查。生产实际窄屏319px通过，桌面完整组件验收复用未变化源码的本地记录。

UPG-04真实模型仅返回logo观察，另五项缺失转REVIEW；原位置提案保留但未经独立验证的框隐藏，可靠区域定位尚未实现。单张合成测试不证明真实准确率、漏检率或SKU覆盖。自定义规则编辑器、外部电商发布、自动修图均不在当前UPG-06交付范围。

## UPG-07首阶段完成与下一步

UPG-07A参考视角协议与离线shadow工具已完成，候选`7f4fa55c82e0a81250ff8bf5bc8a35b596caeb32`独立PASS并正式local_only CLOSED。首次QA发现100000样本上限失效，已返原开发修复；独立复验真实evaluator/CLI的100000接受、100001及baseline/candidate分别超限拒绝通过，原FAIL保留。

工具以三份显式本地文件绑定数据集、视角真值和预测回放；复用UPG-02协议，对新增参考检查来源/跨集合泄漏，保留独立双标与仲裁，分别统计两个split、critical分母与REVIEW覆盖，空分母为null。声明为real也不会自动形成质量证据。

开发最终181专项/23CLI、105旧回归及typecheck通过；独立首轮31反例/10CLI和原专项通过，后因超限反例FAIL；修复后独立4个evaluator/4个CLI边界及typecheck通过，未变化原验收证据明确复用。

用户确认暂无真实授权样本及双标；真实数据NOT_PROVIDED，真实质量BLOCKED，全部输出qualityEvidence=false。UPG-07运行时仍BACKLOG，未发布/启用，没有模型调用。生产仍da0e355 / Worker c329c189-df72-4e94-9abc-f2a0c6e63616；pairvu-2继续PAUSED。

下一步：按样本缺口清单由用户/数据保管方准备授权记录、真实图像及参考集合、SKU分割、双人盲标/仲裁、独立留出集和baseline/candidate实际运行来源。总控本轮工程收尾已自动完成；因用户确认暂无样本，不自动开展真实质量评测或线上UPG-07接入，也不启动其他单元。样本就绪后先独立核实来源、冻结输入，再制定实际评测/线上接入最小契约；任何新增模型调用和生产发布另需相应授权。

并行人工事项：历史密钥轮换闭环记录；设计伙伴、授权数据和双标留出集；真实标准加量包/Live portal及付费CSV；试点续用与定价复盘。付款、客户外发及客户资产需要对应授权，不能虚构完成。当前control next返回空列表，后续runtime autoEligible保持false。

证据：[生产manifest](../../operations/evidence/production-upg06-2026-10-12/manifest.json)、[真实功能与限制](../../operations/evidence/production-upg06-2026-10-12/production-functional.json)、[独立HTTP](../../operations/evidence/production-upg06-2026-10-12/productionQa.json)、[本地独立原报告](../../operations/evidence/UPG-06.json)、[原始FAIL](../../operations/evidence/UPG-06-attempt-1/qa-original.json)、[下一批清单](next-development-batch-2026-10-10.md)、[完整方案](product-upgrade-plan-2026-10-10.md)、[任务台账](../../operations/task-registry.json)。原始失败、工具受限及重试记录均保留；CLI适配不改原报告结论。

UPG-07A：[协议](../05-evaluation/reference-view-shadow-protocol.md)、[15项真实样本缺口](../05-evaluation/reference-view-sample-readiness.md)、[独立验收](../../operations/evidence/UPG-07A.json)。
