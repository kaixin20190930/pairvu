# UPG-07A 参考视角协议与离线 shadow 评测最小工具

## 授权、目标与阶段边界
2026-10-12用户授权启动UPG-07，先明确参考视角与质量评测的最小契约、样本要求，由总控跟进开发和独立验收，真实授权样本缺口明确列出。UPG-07A是UPG-07的首个local_only子阶段；UPG-07原runtime条目保留BACKLOG，不将工具PASS写成整体质量或线上匹配完成。生产仍da0e355，无发布/模型调用授权，pairvu-2继续暂停。

唯一目标：交付纯离线、只读、可复现的参考视角shadow输入协议、校验与对比报告。输入来自显式本地文件，不读D1/R2、图片、环境秘密、不联网、不调用模型。只比较外部已生成的baseline/candidate声明输出，不实现新视觉模型，不修改现有机器结果/人审/eligibility。没有真实输入时输出BLOCKED，不默认用fixture补位。

## 允许文件与禁止
允许新增docs/05-evaluation/reference-view-shadow-protocol.md、docs/05-evaluation/reference-view-sample-readiness.md、scripts/evaluate-reference-view-shadow.mjs、scripts/test-reference-view-shadow.mjs、fixtures/reference-view-shadow/**，package.json仅新增专项入口。必要纯辅助仅scripts/reference-view-shadow/**。复用scripts/verify-upgrade-dataset.mjs导出的validateDataset；禁止破坏其schema或旧测试，不修改应用、依赖、迁移、部署配置、控制CLI或原始证据。开发不得写总控operations/及roadmap。

## 协议与可判定行为
1. 复用UPG-02完整数据集校验，以数据集原始字节SHA256绑定独立view-extension与prediction文件，样本ID精确一对一，拒绝缺失/额外/重复/未知字段、混合synthetic、错误dataset/版本/hash。CLI只读显式输入，JSON结果到stdout；CLI入口包含symlink路径回归。文档明确三文件schema、枚举、退出码，错误消息不回显任意敏感输入值。
2. reference extension每sample列出本SKU/包装版本的有界参考集合，包含reference匿名ID、图像SHA、view枚举、可见性/可用状态及来源绑定。原UPG02 reference hash必须属于集合；待检图不能自身作为参考。front/back/side/top/bottom/detail/unknown足够，不实现任意自由文本视角。参考增加后仍检查全数据集图像跨split泄漏、同ID冲突、跨SKU/包装引用；不能用新增参考绕过UPG02隔离。
3. 独立真值：候选图view/可观测性以及acceptableReferenceIds或明确no_match/insufficient证据结论必须有两份盲标和必要第三人仲裁，保留原始标签；不能由prediction自己提供真值。同样声明不证明真人身份/授权。未知视角、低可见性、不匹配、错误包装、失效参考等不能被工具推荐为确认匹配。定义可判定兼容策略及reason codes；策略version/hash固定、输出携带，建议只取同视角且可用/可观察的保守候选集合，多个可用时明确多解，不以顺序伪造唯一最佳。
4. baseline和candidate预测使用独立run元数据（完整code SHA、模型/prompt/策略版本，无法识别不能猜），按相同冻结样本集合绑定。每条给selection(referenceId或null)、MATCH/REVIEW/NO_MATCH及预测的质量decision ALLOW/REVIEW/BLOCK等明确枚举。无效引用/不支持组合拒绝；不能把缺失预测丢出分母、把REVIEW视为MATCH正确、把candidate预测当人工真值。baseline/candidate是输入回放，不宣称本工具运行过模型。
5. 报告区分工程VALID、input declarations与真实qualityEvidence。所有未获独立人工来源核实的输入（包括synthetic=false）qualityEvidence=false，不支持通过布尔开关自动升级为真实benchmark。可计算声明输入的诊断计数，标记synthetic_test或unverified_declared_input，禁止文案声称准确率达标或生产质量PASS。提供按split分别的样本数、实际分母、匹配正确/错误/abstain、覆盖/REVIEW比例及baseline-candidate同样本差异；关键错误漏放以UPG02人工真值中可观察critical+预测ALLOW计数，REVIEW不算漏放但单列覆盖。空分母为null且有说明，不输出NaN/0%成功。development与holdout不能混合成headline。明确分SKU/类别不足时不做排名；不增加统计显著性/质量阈值宣称。
6. 样本要求/缺口文件：复用整体方案300–500对development、至少100对独立holdout作为规划目标，不声称数量即足够；critical分母另列。列出真实授权（用途/有效期/撤销）、字节/近重复审计、规范SKU/包装跨split隔离、独立双标/仲裁、视角覆盖/错误参考/遮挡/无匹配/无缺陷/关键差异、冻结版本/run来源、独立holdout保管。当前仓库synthetic fixture及现有单张生产合成图不满足这些要求，逐项NOT_PROVIDED/NOT_VERIFIED；未观察到不等于不存在。模板不写虚构真实记录。

## 验收预算
Node离线专项正负向+UPG02回归+typecheck。无React/路由变更，不运行Next build或浏览器；无生产/外部调用。独立QA固定候选SHA检查契约和原始输出，至少包含错hash、未知/丢失/重复prediction、跨split新增参考泄漏、跨SKU/包装/未知引用、双标不独立/缺仲裁、低可见性/unknown、多解、synthetic伪装为real仍不能质量PASS、空分母、仅development、不完整run元数据、顺序稳定、输入只读、CLI symlink。不要写仅镜像实现的断言，明确反例和预期。

## 角色、模型、停止及回传
原开发gpt-6.1-sol/high：虽然离线，但需对齐旧协议、多参考新增泄漏面、双标仲裁及指标分母，跨文件数据一致性需要较深入推理；不是默认最高模型。独立QAgpt-6.1-sol/high：独立寻找来源伪装、跨split泄漏和虚假质量结论反例。只有重复且可定位推理不足才重新评估模型，先缩小契约补输入；缺真实数据不构成升级理由。
开发允许本地提交自己范围，禁止push/deploy/新子任务。额外运行时范围或协议冲突交总控，不扩大实现。两次同类FAIL先诊断。回传完整SHA、允许diff、真实命令结果/原始报告/限制；独立QA JSON须unitId=UPG-07A、candidateSha、reviewerThreadId、result、checks[{name,status}]包含fixed candidate SHA和independent QA report。FAIL返原开发，local_only PASS正式CLOSED；真实质量明确BLOCKED，UPG-07 runtime仍未开始。总控持续wait/read并报告下一步及样本依赖。

用户补充确认：暂时没有真实授权样本及双人标注记录，先完成工具并列出缺口。真实数据就绪状态为NOT_PROVIDED；不可据此产生真实质量结论。

## UPG07A-QA-01 样本上限返工
独立QA已复现100001个有效绑定样本仍VALID，违反100000协议上限，uniqueMap以expected.size替换硬上限。原开发本轮Sol/medium：根因明确、单一离线边界修复和精确上限/超限回归；出现其他指标/来源语义差异再评估high。独立复验Sol/medium：限定修复差分和原超界反例、精确上限通过、原已通过证据摘要复用；额外语义变化升级high。原始FAIL保持不可变，不因合成质量仍BLOCKED而忽略工程缺陷。

## 2026-10-12 UPG07A独立关闭

UPG-07A参考视角协议与离线shadow工具已完成，候选`7f4fa55c82e0a81250ff8bf5bc8a35b596caeb32`独立PASS并正式local_only CLOSED。首次QA发现100000样本上限失效，已返原开发修复；独立复验真实evaluator/CLI的100000接受、100001及baseline/candidate分别超限拒绝通过，原FAIL保留。

用户确认暂无真实授权样本及双标；真实数据NOT_PROVIDED，真实质量BLOCKED，全部输出qualityEvidence=false。UPG-07运行时仍BACKLOG，未发布/启用，没有模型调用。生产仍da0e355 / Worker c329c189-df72-4e94-9abc-f2a0c6e63616；pairvu-2继续PAUSED。

原始最终报告operations/evidence/UPG-07A.json；首轮FAIL与31项独立反例归档operations/evidence/UPG-07A-attempt-1；最终边界原始巨型材料经无损gzip及摘要保留，映射见UPG-07A/archive-index.json。CLI已qa PASS→close。

下一步：按样本缺口清单由用户/数据保管方准备授权记录、真实图像及参考集合、SKU分割、双人盲标/仲裁、独立留出集和baseline/candidate实际运行来源。总控本轮工程收尾已自动完成；因用户确认暂无样本，不自动开展真实质量评测或线上UPG-07接入，也不启动其他单元。样本就绪后先独立核实来源、冻结输入，再制定实际评测/线上接入最小契约；任何新增模型调用和生产发布另需相应授权。
