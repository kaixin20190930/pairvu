# AUTO-02 生产状态闭环与计划同步

## 目标与启动方式

用户已要求继续下一批任务。补齐本地控制工具生产完成和计划同步；不执行任何生产动作。旧状态停在已真实发布的 UPG-01 RELEASE_READY，不能手改状态。此工具自举开发在 task-registry.bootstrap 中单独登记，仍复用唯一开发/QA角色；升级通过独立验收后，先以新CLI导入真实UPG-01发布证据并关闭，再同步计划并登记/关闭AUTO-02。没有证据不能顺手关闭UPG-01。

## 允许范围

lib/automation/control.mjs、lib/automation/production.mjs（可选）、scripts/verify-pairvu-control.mjs、scripts/verify-pairvu-production.mjs（可选）、package.json scripts、operations/production-evidence-schema.md。总控独占其他operations文件、台账、计划、真实证据和docs。不能改业务、依赖、生产发布脚本或锁文件。

## 功能和可判定验收

1. 保留v1状态/事件的读取兼容；所有变更仍用排他锁和原子状态写入。扩展 record-deployment/verify-production（或同义命令）与runtime close，只允许 RELEASE_READY→DEPLOYED→PROD_VERIFIED→CLOSED。重复相同输入幂等，冲突/缺字段/unknown/FAIL/BLOCKED拒绝。
2. 定义严格可读的production manifest schema。需绑定unit、原QA候选、实际release SHA、明确授权范围与记录引用、fresh远端SHA、平台UUID、时间、迁移结论、build/deploy记录、真实smoke和独立production QA。manifest引用本地JSON证据路径及SHA256，导入与完成前重新检查所有摘要；不能仅信任任意非空文本或checks名称。
3. 实际release与原QA候选不同允许，但必须是Git后代，存在独立release QA结构证据（精确releaseSha、已绑定QA角色、PASS且非空全PASS checks），并关联原QA。Git验证只读；不fetch或调用云。验证build事件的candidateSha/remoteSha/action=deploy；不能以upload记录假装生产。验证目标health check结果、完整buildSha和platformVersion与部署一致；production QA精确release+version且与dev/controller不同；至少允许当前已记录的HTTP验收范围，不假称登录/支付通过。
4. 证据真实性仍由总控与原生任务/真实发布保障，CLI负责结构、身份、SHA、摘要和转换，不把结构验证称为独立平台认证。不要将现有schema1自由文本receipt直接无校验接受；可由总控根据已保存真实日志组装schema2 manifest。
5. plan-sync读取明确plan文件。只能追加新BACKLOG单元、调整尚未开始的BACKLOG字段；不得删除任何单元、改写已开始/已关闭单元的历史计划、状态/角色/证据。新依赖引用完整且无环；不同plan原子失败，不吞错；有运行中的开发/QA单元时拒绝同步。同步记录plan摘要、前后差分和事件；init仍不覆盖旧状态。
6. next只在无活跃单元时选依赖CLOSED且autoEligible的单元，生产真实完成close后释放槽。DEPLOYED不可提前释放；human不自动执行。

## 验证预算与停止条件

用临时Git/state/plan/JSON fixtures覆盖旧状态升级、合法生产闭环、未授权/错误unit/candidate/remote/平台/角色、release非后代、QA缺失或失败、upload、smoke不匹配、源证据/manifest篡改、重复与冲突、不能跳级、runtime提前close、计划增补/循环/删除/篡改历史/active拒绝、原子失败事件不变。现有test:control与新增专项、typecheck；不需要Next build，不改真实控制状态、不访问云。

## 回传与约束

仅本地提交允许文件，不git add -A，不push/deploy；完整候选SHA、文件范围、命令结果、负例与残余限制。代码完成停止等独立QA。两次同类失败先报告缩小范围，不修改契约放宽门禁。
