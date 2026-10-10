# UPG-02 评测协议与离线样本校验器

目标：定义商品真值评测输入与可复现离线校验，不能生成真实 benchmark 成績。

允许：新增 docs/05-evaluation/upgrade-benchmark-protocol.md、scripts/verify-upgrade-dataset.mjs、scripts/test-upgrade-dataset.mjs、fixtures/upgrade-dataset/** 和 package.json scripts；不得改依赖或应用判定。fixture 必须标 synthetic，不能含客户资料。

验收：定义 workspace 匿名标识、SKU/包装版本、数据授权记录引用、双人标注和仲裁、错误严重程度、可观测性、开发/留出分割；拒绝重复/同 SKU 跨 split、缺授权/缺标签/无效字段。校验器只读，不下载图片、不联网、不训练。真实输入缺失应 BLOCKED；合成通过仅证明校验器。

预算：Node 离线正负向测试和类型检查，无 Next build。回传候选 SHA、允许文件、命令输出、负例及残余限制。独立 QA 通过后 local_only CLOSED；真实样本评测仍由 HUMAN-03 承担。
