# UPG-03 独立验收：PASS

候选：`46d1e38dc8ec5f8398960e4b3a05040376764e6c`
基线：`98f83200b63c93c3b87c4981a95a48b0a886f7aa`
结论：可交总控进入 RELEASE_READY；本验收不授权生产迁移、部署或开关启用。

73 个独立唯一用例通过：固定候选完整 61 个用例，加 12 个 QA 自编补充用例。最终选定的两次执行合计 3,315 次真实本地 D1 HTTP 请求（补充套件含 13 个重复回归，未重复计入唯一用例）。36/36 初始源文件哈希匹配。

F1/D1/C1–C4/O1/B1–B2/A1–A2/R1/L1/G1/U1/X1 全部 PASS。完整 0001–0020 迁移保留旧行、未虚构历史版本、外键检查为空；双 Worker CAS、全部写入位置故障回滚、稳定幂等与 no-op、工作区隔离、冻结快照、worker 重试、过期/R2 缺失、旧指纹兼容、开关关闭兼容、删除级联均通过。

QA 自编用例额外覆盖：提交成功但响应丢失，之后创建新版本仍能重放原结果；同 UUID 跨写操作冲突且无变化；实际 analysis API 七个写入故障位置均返回 503、完整数据库不变、无 provider 调用、reserve/release 各一次且 reservation ID 一致；关闭开关后的完成分析历史重放无新增额度/provider；snapshot 准备后候选资产迁到外工作区导致 404、无 revision 泄露、无 analysis/snapshot 残留；实际 CSV route 在改名、归档、关开关之后导出旧快照，旧 batch 请求继续重放，外工作区 404。

独立 UI：实际组件+本地合成服务，409 保留草稿并禁用提交；手动 GET 显示新版本且保留草稿；确认提交生成新 key/version；503 重试请求体逐字一致；成功显示文字版本 3，与参考版本 4 分开；清空名称不卸载页面且禁用提交。截图见 qa-ui-final.png。

验证：tsc --noEmit、saved-products 回归、固定 SHA diff --check 均 exit 0。独立干净临时 checkout 的默认 Next/Turbopack build exit 0；required-server-files 清单中的 PAIRVU_BUILD_SHA 精确等于候选。初次隔离构建遇到外部 node_modules symlink 限制，复制本地依赖后解决；不是候选代码失败。

发现：无 P0/P1/P2 阻断项。没有改动共享仓库、总控五个未提交文档/台账、真实 control state/locks；没有提交、推送、生产迁移、部署或开关变更。

限制：真实本地 D1 不证明远程副本/负载；auth、credits、queue、R2、provider 边界受控 stub，未验证真实额度账本/支付或生产资源；UI 不是完整登录 Next journey。生产仍须另行授权并遵守 commit→push→fetch 精确 SHA→clean tree→迁移→同 SHA 部署→smoke 的仓库发布顺序。

详尽机器报告及原始证据路径、SHA256：qa-acceptance.json。
