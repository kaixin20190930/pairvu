# UPG-10 开发验证记录

状态：DEV_READY_PENDING_INDEPENDENT_QA。这是开发自测，不是独立验收、发布或真实价值验证。基线为 `eb7c279ca1015d4f25a9009c5ef1c72d15e9e424`；候选绑定此目录所在 Git 提交及开发回传的完整 SHA。

实现包含默认关闭的 workspace owner 只读指标页/API、追加式 analysis 来源分类迁移、只读离线分类材料校验/原子导入方案准备。所有测试及 unknown 从业务数量、比率分母、分组、复用、成本和等待时间排除；没有制造真实 business 标签。精确口径见 [架构契约](../../../docs/01-architecture/value-metrics-contract.md)。

| 验证 | 结果与原始证据 |
| --- | --- |
| 实际隔离 D1 | 26 项 PASS，434 次本地请求；[结果](../d1-results.json)、[输出](d1-final-raw.txt) |
| 实际 React 组件 | 13 项 PASS；[结果及原始失败测量](../ui/results.json)、[1280px](../ui/desktop-1280.jpg)、[375px](../ui/narrow.jpg)、[空态](../ui/empty.jpg)、[错误](../ui/error.jpg) |
| TypeScript | exit 0；[输出](typecheck-final-raw.txt)（成功无输出） |
| workspace-analysis 最小回归 | exit 0；[输出](workspace-regression-raw.txt) |
| 最终 lint | exit 0；[输出](lint-final-raw.txt)（成功无输出） |
| 一次本地 Next build | exit 0；[输出](build-raw.txt) |

构建先于最后的 source batch snapshot 完全一致检查补强（查询/计算）；最终变更通过实际 D1、typecheck 和 lint，未再次构建。因此这次 build 仅证明本地路由/页面构建成功，不是固定候选发布构建。浏览器采用实际组件和 CSS，但通用页面外壳、框架导航和 API 响应为本地夹具；实际 SSR/session/API 另在隔离 D1 中测试。全部数据为合成，未运行生产登录、生产迁移、外部模型、付款或真实客户资产操作。

首次 D1 fixture schema 失败、CLI 模块格式失败、类型检查失败、lint 失败和 375px 溢出已修复；原始材料均保留。[结构化清单](developer-validation.json) 列出命令、原件索引、当前源文件 SHA-256、证据 SHA-256 和局限。截图内容原为 JPEG，整理时修正扩展名；一张误标桌面的 375px 截图保留为 populated-final-375.jpg，随后另做 1280px 测量并保存截图。

下一步：总控自动交给现有独立 QA，验收固定 candidate SHA；依赖开发提交完成。独立 PASS 最多到 RELEASE_READY。生产迁移、部署、功能启用与真实登录需要新的用户授权并遵守 GitHub-first；真实价值仍依赖受控真实业务来源分类与实际使用证据。
