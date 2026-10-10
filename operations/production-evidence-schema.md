# AUTO-02：production manifest schema 2 与计划同步

本工具导入已经发生的发布事实，不执行发布、fetch、迁移或云查询，不替用户批准。真实性由总控核实用户授权、原生任务及实际日志；结构验证不是独立平台认证。现有 schema 1 自由文本 receipt 不能直接导入。总控应依据保留的真实原始材料组装以下 schema 2 JSON，不可用开发报告生成独立 QA PASS。

状态文件继续使用原 schemaVersion=1 envelope/checksum，兼容旧单位与事件，新增生产字段为 schema 2；不会初始化覆盖既有状态，也不改写旧事件。

## 命令及转换

```sh
pnpm control record-deployment UPG-01 /absolute/path/manifest.json
pnpm control verify-production UPG-01 /absolute/path/manifest.json
pnpm control close UPG-01
pnpm control plan-sync /absolute/path/updated-backlog.json
```

runtime 只能 RELEASE_READY → DEPLOYED → PROD_VERIFIED → CLOSED。每步使用原子锁、原子状态写入，保留完整事件。DEPLOYED、PROD_VERIFIED 仍占唯一槽，只有 close 释放；local_only 保留 QA_PASS → CLOSED。没有生产执行能力；这些命令是事后导入完整证明的分阶段确认，不意味着调用命令时才实际部署。record-deployment 要求下述整份证明已经齐全，包括 smoke 与 production QA；不接收部分 receipt，也不借新 manifest 替换已有部署。

重复同一 manifest/path 和摘要不会再次推进或增加事件；已 CLOSED 的重复操作仍重新核对证据。不允许使用不同路径、修改文件空白、替换任何源文件或改变字段“补记”相同发布。要保留不可变原始证据，先完整核实再导入。发生冲突报告阻塞，不删除真实状态重建。

record-deployment、verify-production 和 runtime close 都重新核对原 QA 证据摘要、Git commit 存在及祖先关系、manifest 和全部引用文件的 SHA256、字段绑定与时间顺序。导入的路径解析成绝对路径保存在状态中；移动整套文件会导致后续核验失败。源码/manifest 被同步改写摘要也无法覆盖已经记录的摘要。读取/验证失败不保存任何状态或事件。

## 通用格式

下面列出的对象字段全部必填，不允许额外字段，只有 releaseQa 及 not_required 的 migration.checkedAt 在下述指定情形可以为 null。UTF-8 JSON；SHA 为 40 位小写十六进制，SHA256 为 64 位小写十六进制，platformVersion 为标准带连字符 UUID。`unknown`、FAIL、BLOCKED 不能充当必需标识或成功结论。

时间使用有效 UTC ISO 字符串 `YYYY-MM-DDTHH:mm:ssZ` 或三位毫秒 `YYYY-MM-DDTHH:mm:ss.sssZ`。路径是本地文件路径，不是 URL；相对路径从 manifest 所在目录解析。引用对象固定为 `{"path":"build.json","sha256":"文件原始字节的64位SHA256"}`，每个引用指向一个下述类型的 JSON 对象。不能用任意非空文本代替。

所有证据应存放在受控、可持久访问的目录，不含密钥、客户图片或个人信息。recordRef 是实际用户授权或迁移日志的可追溯引用，由总控核实并保留原始来源；CLI 不解析聊天或联系用户确认。

## Manifest 字段

| 字段 | 约束 |
| --- | --- |
| schemaVersion | 数字 2 |
| unitId | 当前 runtime 单元 ID |
| qaCandidateSha | 已绑定原独立 QA 的候选 SHA；必须等于状态中的 candidate |
| releaseSha | 实际发布完整 SHA；Git commit 必须存在且是 qaCandidateSha 的后代或本身 |
| platformVersion | 实际 Worker version UUID，不能填 deployment ID 冒充版本 |
| environment | 固定 production |
| origin | 目标 HTTPS origin，例如 `https://pairvu.com`；无路径、结尾斜杠、查询或凭据 |
| recordedAt | 完整证明整理时间 |
| authorization / migration / build / deployment / smoke / productionQa | 六个必需的本地 JSON 引用对象 |
| releaseQa | releaseSha 不同于 qaCandidateSha 时必须为引用；相同时可以为 null，也可提供完整 release QA |

## 六类源证据与 release QA

各表列出的对象均自带 schemaVersion=2。`unitId` 统一等于 manifest.unitId；所有 releaseSha（build 中名为 candidateSha）统一等于 manifest.releaseSha。

**authorization** 字段：schemaVersion、unitId、releaseSha、environment、origin、action、authorized、recordRef、authorizedAt。environment=production，origin 与 manifest 相同，action=deploy，authorized=true，recordRef 非空。授权必须覆盖这个单元、发布提交、目标站点和生产部署动作；旧发布授权不能自动覆盖新功能。

**build** 字段：schemaVersion、unitId、candidateSha、remoteSha、remote、branch、freshFetch、action、result、checkedAt、completedAt、artifactSha256。candidateSha 和 remoteSha 必须均等于 releaseSha；remote/branch 是非空明确标识；freshFetch=true、action=deploy、result=PASS。checkedAt 取构建前远端核验的 initialCheckedAt；completedAt 取构建后 release-prepared 事件的 checkedAt（包含构建后复核，作为已完成构建的观测时间上界），artifactSha256 是实际构建产物摘要。由真实门禁事件及构建日志组装；CLI 只读 Git 验证，不重新 fetch，不把旧 tracking ref 当作新的证据。

**migration** 字段：schemaVersion、unitId、releaseSha、conclusion、result、migrationIds、recordRef、checkedAt。result=PASS，recordRef 指向实际迁移查询/执行记录。conclusion=not_required 时 migrationIds 必须为空数组，表示已确认该发布无待迁移；conclusion=applied 时 migrationIds 为已成功执行的非空、无重复字符串数组。不能仅因本次没运行迁移就写 not_required。not_required 可在发布前核实，不要求晚于 fresh 远端确认；已有真实“无待迁移”记录但没有精确时间时 checkedAt 可以为 null，明确表示旧证据时间未记录，不能补造时间。此例仍须非空 recordRef 和空 migrationIds，并额外通过只读 Git diff 验证该单元 baseline 到 releaseSha 的 migrations/ 无差分；有迁移差分时拒绝这种无时间证明。applied 不允许 null，仍要求有效时间在 fresh 远端确认之后且不晚于部署完成。

**deployment** 字段：schemaVersion、unitId、releaseSha、platformVersion、environment、origin、action、result、artifactSha256、completedAt。platformVersion 与 manifest 相同；environment=production，origin 与 manifest 相同，action=deploy，result=PASS；artifactSha256 必须与 build 的摘要一致。upload 不是 deploy，任何 upload 记录都会被拒绝。平台版本、SHA 和目标环境必须来自同一次真实部署。

**smoke** 字段：schemaVersion、unitId、releaseSha、platformVersion、scope、result、checkedAt、checks。platformVersion 与 manifest 一致，scope=http，result=PASS，checks 非空且 URL 不重复。所有目标必须属于 manifest.origin，不允许 URL 凭据或 fragment。仅支持下面两种结构：

- health：`kind`=health、`url` 指向目标 `/api/health`（无查询）、`status`=200、`body` 恰好含 ok=true、service=pairvu、release=public-beta、buildSha=releaseSha、platformVersion=manifest.platformVersion。必须且只能有一个 health 检查。
- 其他 HTTP：`kind`=http、`url` 为明确目标 URL、`status` 为 200–299 整数，不接受 FAIL/BLOCKED 或用一个 checks 名称代替实际状态码与 health 响应。

**releaseQa** 字段：schemaVersion、unitId、qaCandidateSha、releaseSha、reviewerThreadId、result、reviewedAt、checks。qaCandidateSha 关联原 QA，releaseSha 精确指向实际发布；reviewerThreadId 必须为该单元已绑定且非 pending 的 QA 角色，不能是开发者或总控；result=PASS。checks 非空，每项恰好为 name（非空唯一名称）、status=PASS。releaseSha 改变时，旧原候选 PASS 不能替代本证据。

**productionQa** 与 releaseQa 字段相同，额外必须包含 platformVersion 和 scope。platformVersion 与 manifest 相同，scope=http；精确绑定发布 SHA、版本、原 QA 和已绑定独立 QA 身份。与 dev/controller 不同且声明 PASS 并不自动证明人员真实性，仍须总控核对原生任务结果。本版本只承认 HTTP/来源验收，不声称登录、真实付款、图片或业务流程已验收。

时间顺序：授权与 release QA 不晚于 fresh 远端确认；远端确认不晚于构建完成及 applied 迁移执行；构建与有记录时间的迁移核验/执行不晚于部署完成；not_required 可早于远端确认，checkedAt=null 仅按上文旧证据规则导入，不推断未记录的时间；部署完成 ≤ smoke ≤ production QA ≤ manifest.recordedAt。未发生过或顺序不符的事件不能为导入方便补造。

## plan-sync

明确读取命令参数里的 schemaVersion=1 plan 文件，不隐式读取 --plan 或默认 backlog。顶层只允许 schemaVersion、units；每个单元只允许 id、title、priority、dependsOn、mode、autoEligible、requiredEvidence，字段类型沿用原计划协议。不得夹带 status、roles、candidate、production 或其他状态字段。

只能追加初始化为 BACKLOG 的新单元，或修改仍为 BACKLOG 的上述计划字段。不得删除任何单元；任何已经开始（包括 RELEASE_READY、DEPLOYED、PROD_VERIFIED、CLOSED）的历史计划字段必须保持完全一致，数组顺序也不能改写。单元重排不改变已有状态顺序。依赖必须存在、不能自依赖或成环。所有验证完成后才一次写入；失败事件和状态不变。

存在 DEV_ACTIVE、DEV_READY、QA_ACTIVE、QA_FAIL 或 QA_PASS 时拒绝同步；只有待发布/已部署/已生产验收单元仍占槽时可以更新其他 BACKLOG，不能借同步释放它。事件记录 plan 文件路径、SHA256 和每个改变单元的 before/after；无实际变化是幂等 no-op。next 仍要求无活跃单元、依赖全 CLOSED、autoEligible=true 且 mode 非 human。

## 离线验证

`pnpm test:control-production` 使用旧提交中的 v1 实现生成临时历史状态，然后验证升级与生产闭环，需要 Git 中保留 AUTO-02 基线历史。所有 manifest、身份、授权和来源响应均为合成测试材料，不能作为真实生产证明。`pnpm test:control` 验证原工作流回归；另运行 `pnpm typecheck`。测试不访问云、不读写真实状态/receipt，不需要 Next build。
