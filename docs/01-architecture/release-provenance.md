# 发布提交与平台版本追踪

UPG-01 为未来发布建立版本证据。既有生产 Worker 没有可靠的构建 SHA 注记，不得根据时间、分支或最后一次提交回填历史 SHA。本单元只进行本地实现与验证；独立 QA 通过后止于 RELEASE_READY，不包含生产授权。

## 公开 health 白名单

`GET /api/health` 保留 `ok: true`、`service: pairvu`、`release: public-beta`，增加：

- `buildSha`：构建时从实际 Git HEAD 取得的完整 40 位小写 SHA。只有 Git 工作树和索引完全干净（包括未跟踪文件）才注入。缺 Git、脏工作树或开发服务器均为 `unknown`。`PAIRVU_BUILD_SHA` 环境变量不能覆盖 Git 结果；它只是 Next 配置向编译产物写入常量的内部键。
- `platformVersion`：Cloudflare `PAIRVU_VERSION_METADATA.id` 的 UUID，缺 binding、非 Cloudflare 本地环境或值不合法时为 `unknown`。不公开 metadata tag、完整 binding、任意环境变量或密钥。

构建常量使用 [Next.js env 配置](https://nextjs.org/docs/pages/api-reference/config/next-config-js/env)，仅注入 SHA。平台 ID 来源于 [Cloudflare Version Metadata binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/)。该 Worker 版本 ID 与 deployment ID 是不同概念；一次部署可能包含版本流量分配，不能混称。

SHA 证明源码提交来源，不是对依赖、构建机器、未跟踪环境文件或部署凭据的签名认证。本地 dirty build 合法但不会冒充某一已提交版本。schema/运行时兼容性检查与真实发布验证也不是同一项证据。

## 发布顺序与命令

必须遵循 AGENTS.md：检查并保留工作区变更 → 完成适用验证 → 提交全部发布文件 → 获授权后推送指定 GitHub 分支 → fresh fetch 验证相同提交 → 从该提交执行必要生产迁移 → 授权部署同一提交 → 定向 smoke 并记录平台标识。脚本不自动推送、不自动迁移，不将离线 QA 当作发布许可。

在仓库根目录显式传完整候选、已配置远端名和分支：

```sh
pnpm release:preflight --candidate FULL_40_CHAR_SHA --remote origin --branch main
# 仅在另获生产授权并完成必要迁移后执行下面的生产命令：
pnpm run deploy --candidate FULL_40_CHAR_SHA --remote origin --branch main
pnpm run upload --candidate FULL_40_CHAR_SHA --remote origin --branch main
```

必须使用 `pnpm run deploy`，因为 `pnpm deploy` 是 pnpm 内置命令，不会调用本项目脚本。`deploy` 和 `upload` 都调用相同发布门禁，不接受透传 flags、skip 检查参数或环境跳过开关。upload 也是生产平台写操作，不能用作无需授权的测试。脚本保留原生产命令语义：deploy 使用 Wrangler；upload 使用 OpenNext upload（包含其远端 cache 工作），并以候选 SHA 标记新版本。upload 完成只代表上传，不代表该版本已接收生产流量。

支持的生产入口仅为这两个受门禁的 package scripts。拥有本机 shell 和云凭据的人仍可以直接调用 `wrangler` 或 `opennextjs-cloudflare`；本地工具不是权限沙箱，直接发布绕过流程不受支持，也违反仓库规则。没有通过改 Wrangler vars、资源或权限来扩大授权。

门禁执行：

1. 使用共享 Git common-dir 下的排他锁，防止不同 worktree 中的包装器同时发布。不自动清除遗留锁。核实进程已退出、无远端命令仍在运行后，才由操作者人工恢复；未知结果先查平台，不自动重试。
2. 候选必须是存在的完整 commit SHA 且等于 HEAD；索引、已跟踪文件、未跟踪文件与 submodule 状态必须完全干净。文档／operations 也不例外，开发期间总控的未提交变更会阻止发布。
3. 每次 fetch 到独立临时 ref，不接受已有 remote-tracking ref 或 FETCH_HEAD。指定远端分支的最新 tip 必须**等于**候选（比仅检查祖先关系更严格）。fetch 失败、分支不存在或结果不一致均停止；临时 ref 随后清理。
4. 检查通过后清除 `.next`、`.open-next` 生成目录，运行 OpenNext build。不能拿旧构建冒充新候选。Next 配置自行读取 Git，检查 `.next/required-server-files.json` 中的构建 SHA 与候选相同。
5. 对完整 `.open-next` 目录计算内容摘要，拒绝符号链接或非普通文件；再次 fresh fetch 并核对 HEAD、工作树和构建 SHA，重算摘要拒绝构建产物漂移。失败时不调用发布命令。
6. 输出 `release-prepared`，含候选 SHA、两次校验时间、远端/分支、remoteSha、artifactSha256 和 action；运行唯一固定发布命令。成功退出后输出 `release-command-completed`，此时 platformVersion 仍为 unknown、smoke 为 required，不能自动升级为生产验证通过。

构建期间请冻结源码与产物。前后检查能发现持续的并发修改，无法防御有权限的进程在检查之间修改又恢复文件，或在最终检查之后改写文件／远端；排他锁仅协调使用本包装器的进程，不是跨进程文件系统安全边界。这也是发布时冻结 checkout、禁止并行构建及保存完整命令日志的要求。Git 忽略的环境文件和安装依赖仍属于受信任构建环境，不能由此 SHA 推断其内容已受版本控制。

## 本地构建与验证

`pnpm build` 调用本地 Next build，不做远端检查或生产写入；`pnpm preview` 保留 OpenNext 的本地预览流程。两者都不是生产入口，之后不能将旧产物直接交给受支持发布脚本；deploy/upload 总会重新校验并重新构建。

```sh
pnpm test:release-preflight
pnpm typecheck
pnpm build
```

专项测试在临时 Git 仓库和本地 bare remote 内模拟 push/fetch；从不向项目 GitHub 推送。云构建及发布 runner 只在程序化测试中替换，不由生产 CLI 或环境变量选择。覆盖脏索引／工作树／未跟踪／删除、未推送、非候选、fresh fetch 失败／远端漂移、陈旧产物、构建 SHA 不同、构建失败、构建期间源码与 HEAD 竞态、排他锁与并发发布，以及 SHA 注入和公开字段白名单。合成 runner 通过不代表真实 Cloudflare 构建或部署已验证。

## 未来发布证据

授权发布时将 `release-prepared`、Wrangler/OpenNext 原始输出及 `release-command-completed` 作为同一发布记录保留。另记录生产迁移命令及结果（或有依据的无需迁移结论），从平台输出或查询结果取得 deployment ID 与 version ID，不得猜测或从 SHA 推导。

部署后对目标环境执行 health smoke，核对完整 buildSha 等于候选、platformVersion 等于该次目标 Worker version ID，同时验证本次变更的关键行为。记录 URL、UTC 时间、完整响应、候选 SHA、远端 SHA、平台 deployment/version ID 及验证结果。任一 unknown、mismatch、缺迁移证据或 smoke 失败均不能标 PROD_VERIFIED。upload 尚未激活的版本须使用平台支持的指定版本预览验证，不能用旧生产 health 响应冒充新版本；生产激活仍需另行授权与验证。
