# UPG-03 版本化 SKU 产品标准实现

## 目标
将UPG-03A已接受设计和UPG-03B0已独立通过的本地D1事务实证接入现有产品、参考图与任务流程。交付文字标准版本、产品写CAS和不可变任务来源快照，服务端开关默认关闭。属于runtime单元，独立PASS后止于RELEASE_READY，不部署/启用。

## 允许文件
严格采用 docs/01-architecture/sku-versioned-profile-contract.md 第7节的路径清单：新migration 0020_product_profiles.sql（若占用先报告）；lib/products/{types,repository,profile-validation}.ts；lib/cloudflare/bindings.ts仅flag类型；产品collection/detail/reference API及新增profile/profiles API；lib/batches/{types,repository,validation,worker}.ts与batch创建/export API；lib/analysis/{types,repository,service}.ts与analyses API；现有产品详情的page/Settings/Promote及新增ProductProfileClient；批次new页面与client、批次列表；scripts/verify-m2-saved-products.ts、新scripts/verify-product-profiles.ts、package.json仅script；两份设计/字段文档仅更新已实现状态与必要经确认勘误。测试辅助文件可新增 fixtures/product-profiles/**（纯合成，不修改已封存B0证据）。如实际实现需其他路径，先报告具体依赖由总控决定，不能顺手扩大。

## 禁止事项
不改旧migration、依赖锁文件、生产vars/资源、模型引擎/provider/prompt、计费价格/数量/顺序、图片保留或删除政策。无真实模型/支付、无客户资料和凭据读取、无远端DB/R2写入、推送或部署。无产品与匿名旧分析仍可用。UI文案不能泄漏内部工程细节。

## 验收
完整落实架构契约F1、D1、C1-C4、O1、B1-B2、A1-A2、R1、L1、G1、U1、X1：字段规范化/hash、真实完整schema的增量迁移旧数据不变、SQL每位置失败原子回滚、竞争CAS与稳定幂等、workspace负例、任务创建与版本晋升交错、历史/重试固定快照、不同binding幂等冲突、预留释放、过期不换图、不回填虚构历史、flag关闭明确拒绝新写且保护initialized旧写、409保留草稿、合法清除兼容。采用真实本地D1验证关键事务，不能以mock代替原子性；引擎/计费集成用受控stub，明确未证明的远端行为。

## 测试预算与顺序
先数据模型/validator/repository，再API/快照/worker，最后UI；这些为同一候选的实施阶段，不分别声称可发布。运行针对性真实本地D1+API/UI专项、已有saved-products回归、typecheck；页面/路由变化一次build。失败修复后针对失败重验，不反复全量重跑。必要浏览器交互验收只用本地合成环境；缺证据必须报告。

## 停止条件与回传
设计语义不成立、范围外关键依赖或连续实质阻塞先给最小复现；不得弱化事务/跳过鉴权/伪造PASS。仅本地提交允许文件。最终回完整SHA、diff范围、实际命令与checks/原始报告路径、F1-X1覆盖矩阵、未解决风险和发布前条件。独立QA冻结候选；FAIL返原开发，不另建替代任务。

## 模型选择
开发gpt-6.1-sol/high：设计已明确，但跨产品、批次、分析的D1原子性与兼容集成需要较深推理，先用平衡型号。验收gpt-6.1-sol/high：独立审查隔离、回滚、幂等、计费和UI边界，风险同样较高。若持续出现可定位的推理不足，先缩小复现/补上下文再评估升级；环境、审批、网络问题不升级。均不默认最贵或最便宜。
