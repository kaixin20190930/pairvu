# UPG-03A SKU 版本化产品标准设计契约

唯一目标：针对现有products/product_reference_versions/batches/analyses实现，交付可直接指导下一实现单元的版本化标准设计，不能写成已上线。

允许文件：docs/01-architecture/sku-versioned-profile-contract.md、docs/02-product/sku-profile-field-matrix.md。只读参考lib/products、lib/batches、lib/analysis、migrations、app/api/products与现有组件。禁止修改应用代码、执行迁移、写数据库、调用模型、扩大成多品类/DAM。

验收：列出现有字段/读写入口与实际缺口；品牌/名称/变体/容量/包装版本/关键及允许变化属性的数据类型、长度/空值/规范化/可见性语义；产品identity与profileVersion/referenceVersion区分。明确历史snapshot与旧数据compatibility，不把推断回填视作历史真值。

设计增量D1表/字段/索引、workspace所有权、原子批处理与CAS expectedVersion、防重复重试与并发丢失更新。对产品profile更新和reference promote的竞态、归档/恢复、过期/删除说明约束；禁止为快照无限保留图片。批次和单图分析分别确定何时绑定快照，无产品的旧流程继续可用。

给出API request/response/error与版本冲突语义、默认关闭feature flag、UI最小编辑范围、部署先schema后enable、迁移回填/验证/回滚方案。UPG-03B第一实现单元要有明确允许路径和可复现验收矩阵，不更改当前模型判定/计费；多参考联合判断和自动视角选择仍延后。

验证预算：源代码/SQL设计/链接与例子一致性独立检查，无无意义全量测试或build。设计不确定处必须明确选择或列真实阻塞，不要把关键事务语义留给实现猜测。回传完整本地提交SHA、两份文档、核实的代码事实、验收矩阵、风险。仅提交自己文件，不push/deploy，停止等QA。
