# UPG-01 发布版本可追踪性

目标：为未来发布提供提交 SHA 与平台版本的可信关联。现有生产 Worker 没有 SHA 注记；不得回填猜测的历史 SHA。

允许范围：先定位 health/version 路由、构建/部署脚本和对应专项测试，只修改这些文件及版本追踪说明；派开发前在台账列出实际路径。禁止修改计费、分析判定、DB schema、线上配置或部署。

验收：构建可注入完整 SHA；缺 SHA 明确 unknown，不输出伪造值；公开响应不泄露环境变量；发布脚本检查候选已提交、远端同 SHA 与工作树条件；本地 fixture 覆盖拒绝路径。不得执行实际 push/deploy/migrate 验证脚本。

预算：专项负向测试、typecheck；构建配置改变则一次 build。失败停止，不通过删检查解除阻塞。

停止：独立 QA PASS 后 RELEASE_READY，等待生产发布授权。回传完整候选 SHA、差分、命令、反例、风险及未执行生产事实。

## 已定位的实施范围与明确边界

实际允许路径：app/api/health/route.ts、next.config.ts、package.json（scripts）、scripts/release-preflight.mjs、scripts/test-release-preflight.mjs、scripts/build-release.mjs、scripts/deploy-release.mjs、lib/release-version.ts、docs/01-architecture/release-provenance.md。wrangler.jsonc/cloudflare-env.d.ts 仅允许为平台版本 metadata binding 添加必要配置/类型，不能改现有 vars、路由、队列和资源。需要其他路径先向总控报告。

目标最小链：health 返回可信 build SHA（缺失 unknown）与可用的平台 version（缺失 unknown），保留 ok/service/release；公开字段白名单，禁止输出任意环境。构建 SHA 从实际 Git 候选取得，不接受伪造覆盖；生产入口必须先检查本地 commit、工作树、指定远端/分支、fresh fetch 后完整候选存在且与实际构建相符。验证失败时不运行 build/deploy。保留本地开发 build/preview 用途，生产 deploy/upload 不应成为绕过入口。

证据：离线临时 Git + 本地 bare remote 模拟未提交、未推送、fetch失败/陈旧引用、非候选、干净远端候选；测试可注入受限 runner/本地fixture，但生产路径不能通过环境开关 skip 检查。构建与部署之间重新检查工作树和 HEAD，避免中途源码漂移；记录 candidate 与平台部署ID的办法，不声称历史部署已获证明。脚本不自动 push、不自动迁移，迁移要求在说明中明确先于授权部署。

本单元只实现和离线测试发布门禁，不调用真实远端发布命令。一次本地 build 验证注入与路由兼容；若需要网络依赖或环境，应按权限规则处理并报告，不得把失败记成 PASS。最终 local commit 与独立 QA 通过后仍 RELEASE_READY。
