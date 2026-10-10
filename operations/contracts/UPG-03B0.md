# UPG-03B0 本地 D1 原子性与并发实证

目标：在已独立通过的UPG-03A设计上，先验证D1实际batch/CAS/guard/trigger行为，消除运行时实现前的关键技术假设。本单元为local_only，不修改应用或生产schema。

允许：scripts/verify-product-profile-d1.mjs、fixtures/product-profile-d1/**、docs/05-evaluation/product-profile-d1-evidence.md、package.json仅新增script。可用仓库已安装Wrangler/Miniflare创建完全隔离的本地D1 fixture；不加依赖、不改锁文件，若现有运行时无法安全使用则报告具体条件。所有fixture必须synthetic；不读真实D1/R2或.env凭据。

验收：先读sku-versioned-profile-contract.md和字段矩阵。用实际本地D1 binding的batch而非仅mock或普通SQLite推测，验证CAS胜负、每个写位置SQL失败整组回滚、幂等同键/异内容、profile与reference/archive竞争、两个独立请求同时相同revision、guard表清空、失败状态摘要不变、错误workspace拒绝、旧数据兼容。测试必须执行设计中选定的关键SQL与constraint，不另造更简单事务替代；明确哪些仍待API/UI/计费层集成验证。

测试预算：运行专项一次通过后不机械重跑；为失败修复后有针对性重验。无需Next build，不调用模型或网络生产。输出操作命令、本地D1运行时版本、case结果与实证局限，不能把本地D1通过称生产迁移通过。

如D1不支持设计语义，立即给最小复现并返回设计修订，不把事务改成两次非原子写。完成后仅本地提交允许文件，回完整SHA、checks、原始证据和下一UPG03实现条件，等待独立QA。总控回收并关闭后才开放完整运行时实施，生产迁移和启用仍另行授权。

## 模型选择

开发：gpt-6.1-sol / high。验收：gpt-6.1-sol / high。两者分别需要设计与质疑真实D1事务、并发和回滚反例，选择具备足够推理能力的平衡型号；范围已明确，无需默认最高档Astra。若出现可定位的复杂推理不足，先缩小复现并复核输入，再评估升档；环境或权限失败不升档。详见模型选择标准。
