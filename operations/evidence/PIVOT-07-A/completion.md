# PIVOT-07-A 第一阶段完成记录

2026-11-16：实现、独立候选验收、GitHub-first 部署、公开启用和独立生产验收均完成。运行时固定提交 `4637c6de246d15377a0abc51ae1a621ed673de30`，Cloudflare `2be9146f-7cce-4d17-a533-cab7e856bf78`。基线 `8e741238bdcb60a221ef521aaa163010c5162d5e`。发布前 push 后 fresh fetch 核对 HEAD/origin/main/FETCH_HEAD 一致，完全干净工作树；发布脚本前后再次精确核验，构建与 TypeScript 成功，无迁移。

## 完成清单

- 仅修改两个运行时文件：榜单与共享 ModelTable。榜单成绩先于原17模型规格表，CursorBench 4.0 四条、BrowseComp 六条；保留来源、精确配置和核查日，区分结果发布日期。BrowseComp 四条历史 owner baseline 与两条后续 Z.ai 报告分组展示，不混排或合成总分。十条配置不等于十个不同模型。
- 榜单 Title/H1/Description 与 benchmark leaderboard 内容一致，canonical 保持原地址；既有规格和入口保留。
- 仅 DeepSeek-V3.2、Kimi K2.5、MiniMax M2.1 未知价行追加当前 quote 的官方链接和原核查日期（2026-11-16）；保留 unknown/not free、历史 API 与生命周期说明，不填推测报价。其它价格、USD/FX 与日期未改。
- 计划和产品边界写入既有产品路线；后续第二阶段单独决策，45个URL不扩张。17模型、16对比页（catalog15个两两页+固定三方页1个）、2个基准详情页保持不变。

## 独立验收及边界

开发一次目标 SSR；独立 QA 在固定 SHA 检查完整差分并独立 SSR，19项全部通过。QA 首次探针自身将 table 与外层 wrapper 比较的错误已纠正，诊断原件保留，没有应用返工或产品 FAIL。除三处授权追加字符串外，候选价格表与基线 SSR 逐字相同。

仅一次必要生产构建及所含类型检查；没有额外本地 build、全套测试、单独全库 typecheck、通用测试框架或本地服务。生产恰好四个 HTTP（health、leaderboard、llm-pricing、sitemap），均200，无重试；15项生产检查通过。实际健康接口匹配精确提交和版本，实际 TDK/canonical、三个表、价格内容与候选一致，sitemap45且无新增/缺失。保留原 QA 文档中 `inventory.comparisons=15`（catalog pairs）原值；合计固定三方页后的总数是16，不改写原件。

原件：[候选QA](qa-original.json)、[独立SSR](qa-ssr-evidence.json)、[探针诊断](qa-ssr-probe-diagnostic.json)、[生产QA](production-original.json)、[发布绑定与摘要](release-record.json)。原始HTTP响应与发布日志保留在 `/private/tmp/pairvu-pivot07-a/`，release-record记录哈希；旧单元证据未改。无账号、DB、客户数据、迁移或生产测试资产；没有服务和清理阻塞。历史 JRN-04-FIX RELEASE_READY 保留，本单元不是正式 CLI CLOSED。

## 剩余事项与下一步

1. 第二阶段尚未开始：官方同版本/同配置基准取证，以及既有三个核心对比页的质量表/文案调整。依赖单独授权与充分可比证据，不自动开发，不新建页面。
2. 三个旧型号精确当前 API 价格仍未知；本阶段已一次补齐透明来源日期。未经新官方证据不反复改写或用继任型号价格替代。
3. 11月18日10:00既有 GSC 只读任务自动复查 Haiku 两页发现/抓取/收录及既有修改页抓取日期；依赖可用 GSC 登录或当前导出。本次未重查GSC，43/45仅是11月16日此前基线。其余既有内容/月度/11月26日preview检查按原计划，只读、不自动改站。
4. 不放量：17模型尚未达20，且新增批次/曝光等完整门禁未满足。新外链发送、其它内容或第二阶段均不在本授权内。

下一动作：总控归档记录并提交推送文档，无须用户输入，不再部署；随后只有既有只读观察自动继续。第二阶段待用户授权及官方证据，不自动启动。
