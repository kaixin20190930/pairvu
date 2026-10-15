# SEO-01 六个存量页面的内容与内链改版

## 授权、目标与边界

2026-10-15 用户授权先完成六个存量页面的内容与内链改版，再做一个真实商品图片实测。本单元只交付前一阶段；后续实测由 SEO-02 单独固定素材许可、实际编辑过程和结果。没有生产发布授权，本单元独立验收通过后止于 RELEASE_READY。

唯一目标：在不增加新 URL、不改变产品行为的前提下，改好以下六个英文页面，使用户能从真实问题进入方法、对应检查项、相关证据和工具，并准确反映已经上线的批量、SKU 参考版本、人工审核、发布资格与 CSV 边界：

- `app/guides/keep-products-consistent-in-ai-images/page.tsx`
- `app/guides/compare-original-and-ai-product-images/page.tsx`
- `app/checks/product-logo/page.tsx`
- `app/checks/product-label-text/page.tsx`
- `app/use-cases/creative-agencies/page.tsx`
- `app/how-pairvu-works/page.tsx`

允许同步 `lib/seo/content-registry.ts` 中这六页的 title、description、intent、relatedRoutes、supportingTopics 与实质更新日期。需要验证既有检查内容时可只读 `lib/seo/check-content.ts`。允许最小专项测试/清单更新，但优先复用现有 `test:seo` 与 `seo:overlap-report`，不得另建通用测试框架。

总控现有未提交的 `docs/03-growth/seo-demand-content-plan-2026-10-14.md`、`docs/03-growth/seo-live-sample-2026-10-14.json` 与 `docs/README.md` 属于本轮研究记录；开发不得改写、删除或自行提交这些文件。开发只提交明确允许的应用/registry文件；总控在独立验收后统一决定研究文档如何归档。

## 页面内容与内链契约

1. 一致性指南：回答怎样在 AI 编辑中保护 Logo、标签文字、颜色、数量、组件与包装；加入“换背景而不改变商品”的可执行章节；正文连接 Logo、标签文字、颜色、可观察性、检查清单、原图对比指南、对应 PASS/FAIL/REVIEW 受控例子和工具。不得称已经有真实客户案例或总体准确率。
2. 原图对比指南：说明先选正确 SKU/包装版本和可比较视角，再逐项核对、人工复核及释放决定；连接 Logo、标签文字、可观察性、检查清单、至少两个对应例子和工具。明确 Pairvu 不判断图片来源真伪，不因视角不同直接判产品变化。
3. Logo 检查页：保留现有经审核的规则和证据；增加从“AI 改 Logo/字体”的问题到一致性指南、原图对比指南及最相关例子的上下文链接。不得承诺识别未知品牌、修复 Logo 或认证商标。
4. 标签文字检查页：保留现有经审核的规则和证据；增加产品名、变体、容量/数量文字漂移的真实工作流与一致性/原图对比链接。不可读文字必须是 REVIEW，不能宣称 OCR/法规认证。
5. 代理商场景页：从简短说明扩展为 brief→生成/编辑→批量 QA→人工审核→CSV/交付记录的实际流程；连接批量入口、Logo/标签检查、相关案例、方法与价格。明确发布资格不替代客户批准，Pairvu 不自动发布到广告或电商平台。
6. How Pairvu works：从单对图说明升级为单次/批量、保存 SKU 与参考版本、机器结果、人工批准/驳回/撤销、发布资格和 CSV 的准确概览；明确自动检查、人工决定、release eligibility 三者分离，eligibility 不执行外部发布。连接相关产品页、检查、案例和指南。
7. 每页保持一个 H1、唯一 canonical/metadata、自然锚文本和一个主要 checker CTA。正文链接以解决问题为目的，不设置机械数量；不得向站内链接加入 UTM。只在内容实质改变的六页更新 `updatedAt`，同步可见更新时间时不得伪造发布日期。
8. 关键词所有权保持：`/` 继续拥有 AI product image checker；两份指南分别拥有 consistency 与 compare workflow；检查页拥有 Logo/label 属性意图；代理商页拥有 audience workflow；How it works 拥有产品方法。不得新建同义词页或把 AI image detector、reverse logo search、marketplace certification 写成 Pairvu 能力。

## 最小验收清单

- 必验项：六页均有实质内容差分；正文入链与出链存在且目标是 registry 中 published/indexable 页面或明确的账号/工具入口；产品能力和限制与当前仓库契约一致；页面 metadata/日期只对应实际更新；`pnpm test:seo`、`pnpm seo:overlap-report`、typecheck 和固定候选源码 build 通过；独立 QA 直接审查固定 SHA。
- 反例：不得出现真实客户、独立准确率、市场/平台认证、自动外部发布、已实测开放许可商品或搜索量等未经证实结论；不得把 `relatedRoutes` 当作已渲染链接；不得改写受控例子为真实工具自发错误。
- 复用项：现有 66 URL sitemap、canonical/schema 组件、检查页已验收的 decision/evidence 内容及 SEO registry 测试；本单元只核对受影响页面，不做计费、登录、删除、生产矩阵回归。
- 不验项：GSC 索引/排名、Core Web Vitals、外链、真实图片实测、模型准确率、生产环境页面。未发布前这些均不写 PASS。
- 操作范围：只读公共页面与本地仓库；不登录、不调用模型、不使用客户图片、不发送外部消息、不部署。
- 预算：开发准备/实现检查点 35 分钟，独立增量验收 30 分钟；构建等待另计。若现有页面结构与契约冲突，先缩小文案/链接实现，不扩建 CMS 或分析系统。
- 完成条件：允许文件形成单一固定候选提交，必验有证据，独立 QA PASS；runtime 正式状态推进到 RELEASE_READY 后停止。

## 角色与模型

- 开发：GPT-6.1 Sol / medium。六个页面和 registry 的常规跨文件内容实现，需要理解产品契约及避免关键词重叠；无需最高档。若发现页面能力描述与实际代码/契约存在跨模块冲突，先报告具体冲突，再评估 high。
- 独立 QA：GPT-6.1 Sol / medium。需要独立核对固定 SHA、内容事实、内链和 SEO 回归；范围明确且不涉及生产写入。若出现多页关键词归属或产品能力实质争议，再评估 high。

开发不得 push/deploy，不创建子任务；完成后回传完整 SHA、允许 diff、实际命令结果、限制和直接可执行复验步骤。QA 不修改共享应用代码；FAIL 返回原开发，仅复验受影响差分并保留原始证据。

下一步：SEO-01 通过后总控自动推进 SEO-02 的素材许可冻结与一次真实图片背景编辑实测；SEO-02 的发布仍需另行授权。

## 2026-10-15 完成记录

候选 `e2accd2236beb67f5884b7aaeae19dd1ace4783e` 已由独立 QA PASS：六页内容与真实正文内链、metadata/日期、能力边界、67/当时候选66路由专项、overlap、typecheck及固定候选构建通过，原件 `operations/evidence/SEO-01.json`。未推送、部署或生产验收。正式控制CLI因旧 JRN-04-FIX 仍为 RELEASE_READY/PARTIAL 而无法 claim/转换本单元；保留实际固定SHA和原件，不伪造正式状态。
