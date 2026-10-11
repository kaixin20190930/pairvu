# UPG-05 独立人工决定与审计

## 目标与依赖
UPG-04生产验收并正式CLOSED后，给已登录workspace内已完成的分析增加人工Approve/Reject/Revoke决定及追加式审计。保留机器verdict/证据原值，人工批准不等于发布资格。先从单分析结果页完成最小闭环，不实现工作台、批量批准、API keys或Webhook。

## 允许范围
增量migrations/0021_*；lib/reviews/**；app/api/analyses/[analysisId]/reviews/route.ts；必要的lib/analysis类型/读取结果映射；lib/auth小范围真实用户身份获取（不得弱化现有鉴权）；components/ReviewDecision.tsx及ProductChecker.tsx接入和局部样式；scripts/verify-review-decisions.*、fixtures/review-decisions/**；package.json单一专项入口；docs/01-architecture/review-decisions-contract.md。先检查现有表/用户/session/D1机制，复用现有workspace所有权，不重建账户体系。允许新增专用读取接口以免扩大全部历史查询。

## 判定协议
- 仅真实登录用户对自己workspace、已completed分析操作；匿名/跨workspace不可读写，客户端actor/workspace字段不能决定权限。同源写入/CSRF边界须验证，不扩大CORS；服务端严格校验载荷、状态及revision。服务端取actor user ID，敏感信息不入日志。
- append-only人工事件：approve/reject/revoke、非空理由及分类（false_positive/false_negative/intentional_change/wrong_reference/insufficient_evidence/other）；reason长度边界清楚。可选受控备注，不允许HTML执行。
- 每个事件绑定analysis ID、workspace ID、actor ID、服务端时间、递增revision、前一决定ID及原机器结果/版本来源。首次expectedRevision=0；修改与撤销须匹配最新revision。无现行决定不能撤销。撤销只追加新事件，不抹除旧决定；可再明确提交新决定。
- 原verdict/observations/issues/limitations/model记录不覆盖；历史feedback不冒充人工批准。旧分析无人工记录可正常读。
- 同一request ID同一payload重试返回原事件；改payload复用key拒绝；相同baseRevision不同请求并发只能一个成功。原子追加与最新指针一致；异常不留下半写，重试不得重复计数。使用已实证的D1 batch/条件guard/约束，不假设BEGIN在远端可用。
- UI独立显示机器结论与人工决定/审计历史，显示“人工决定不代表发布资格”；409保留草稿并要求加载最新及明确再确认，503重试保持request ID。请求未确定时禁止新提交造成重复；旧结果/未登录安全退化。
- 已归档/删除或过期分析的可读写按现有保留机制明确定义，至少分析不存在/非completed拒绝；不能泄露其他workspace历史。迁移外键/删除策略须不破坏既有清理，保证审计记录不可被普通业务UPDATE/DELETE篡改的数据库约束，明确受控保留策略；若现有删除清理会冲突，先给总控说明真实路径和最小一致性方案，不放宽所有权。

## 验收与预算
固定SHA独立QA；真实本地D1执行新迁移+旧数据读回，覆盖所有权/匿名/未完成/不存在、actor伪造、并发CAS、相同key重放和异payload、失败回滚、撤销/再决定/不可变历史。实际组件浏览器覆盖批准/拒绝/撤销、409保留草稿、503稳定key、机器证据不变、窄屏和备注转义。typecheck、相关分析/结构证据回归、一次必要build；不跑不相关全量。保留失败原件，测试源码别当作归档.ts参与生产编译。

## 角色与停止
复用原开发/独立QA，分别gpt-6.1-sol/high：开发跨鉴权、D1原子性与UI并发；QA需独立构造隔离、并发、重放和审计反例。仅重复且定位到推理不足再评估Astra，不因环境故障升级。开发为唯一应用写入者，QA只读不修代码。禁止push/deploy、生产DB变更、付款或客户资产操作。需扩大工作台/API/计费范围则停交总控。两次同类失败先诊断缩小范围。

## 回传与完成
开发返回完整候选SHA、允许diff、命令/原始证据/局限；QA返回unitId/candidateSha/reviewerThreadId/result/checks（含fixed candidate SHA、independent QA report）。FAIL返原开发；PASS正式RELEASE_READY。用户当前只授权本单元研发与独立验收，新生产发布需明确授权。
