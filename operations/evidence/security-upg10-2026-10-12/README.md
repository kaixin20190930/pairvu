# UPG10-QA-CREDENTIAL-01 受控响应记录

用户已授权核实范围、撤销替换及服务验证。账户令牌 PairVu（ID f1f51cba573b537ce29db8f3086490ee）由用户在 Cloudflare 轮换并仅本地保存新值，总控执行不含密钥的验证。原事件原件保持不变，最新状态见 incident-current.json；response-status.json保留为终审输入原件。最终独立12项PASS。

## 真实证据

- inspection：个人令牌接口401，但正确账户接口200/active；不能把前者当撤销。
- policy-before/after：整个账户，10项权限保持不变；包含 Workers、Pages、D1、R2 Write。
- scope：7个已知项目根目录、14个环境配置，仅Pairvu .dev.vars匹配；Git跟踪工作树无旧值。可列18个Workers、3个Pages项目、11个D1数据库，属于权限可见性，不是这些项目都使用该令牌。
- replacement-verification：旧值只保留在验证进程内；用户保存新值后，同一正确账户端点旧值401、新值200/active且token ID相同，API部署记录/D1元数据/R2列表200。脚本随证据保存为.txt，无秘密字面值；进程已退出，没有写旧值副本。
- local-storage-verification：新值在Git跟踪文件及响应材料无匹配；配置被Git忽略，权限0600。
- service-after：公开health/首页200，匿名指标401；仍是a0b27ac / Worker 3e8dc987-8ec4-4f59-9950-5beebcfb4494。

## 限制及剩余任务

远端CI/其他设备/备份未穷尽清点；本仓库无受跟踪.github工作流。审计窗口返回2条user update记录，没有可归属于该token的记录；不能据此证明无滥用或完整日志覆盖。未删除私有工具记录，失效的是旧秘密值。未更改应用代码或重新部署，也未做业务写入/付款/模型调用。新令牌沿用既有账户级权限，仍需后续最小权限收敛，不能把本次轮换解释为所有安全风险清零。

下一步：独立终审已PASS，本次已知范围处置已记录完成；外部依赖/审计覆盖和最小权限优化另留明确后续项。生产应用维持原已验收提交，不重复发布。

Cloudflare轮换语义：[官方说明](https://developers.cloudflare.com/fundamentals/api/how-to/roll-token/)。
