# Pairvu SEO 内容与获客建设方案

日期：2026-10-14，执行更新：2026-10-15。状态：研究、六页改版及一个开放许可真实图片实测已完成本地独立验收并发布生产；尚未对外分发。

本轮将增长重点转向真实问题检索、原创商品图片实测和相关渠道分发。保留已有 URL 与六项检查能力边界，优先改好存量页面。真实商品照片可以用于具体案例；未经标注的少量实测不能代替 UPG-07 的质量评估，也不能证明产品整体准确率。

2026-10-15 执行结果：六个存量页候选 `e2accd2236beb67f5884b7aaeae19dd1ace4783e` 独立 PASS；真实商品案例最终候选 `170fd1dcd216b3b146d243883896ed862c3dbfd1` 在首轮事实文案 FAIL 并修正后独立 PASS。案例只生成一个背景编辑输出并只运行一次本地 Pairvu，最终为 REVIEW：六项中五项充分可观察并报告 match，包装形状因覆盖不足 not_observable。未把该案例写成整体准确率。最终发布提交 `e08ea130028655682d3e197136ec0e7c6f1704c4` 已推送 GitHub 并部署为 Cloudflare Worker `45863c89-a175-46c0-b783-1b88b06db0d3`；独立生产 HTTP 验收确认六页、案例、两张图片、许可边界、67 URL sitemap 与 health 来源均通过。尚未进行站外分发、索引或排名验证。

默认面向英语市场的电商创意人员、品牌运营和代理商。国家优先级尚无当前 GSC/Keyword Planner 数据支持；本方案不虚构搜索量、关键词难度、品牌流量或排名目标。

## 1 当前站点实际情况

依据：本地 content-registry、页面/组件源码、2026-10-14 线上 sitemap 和 10 个代表性页面。线上抽查记录见 [HTTP 与正文链接样本](seo-live-sample-2026-10-14.json)。这是结构审计，不是全站索引或性能验收。

| 项目 | 已核实状态 | 判断及动作 |
| --- | --- | --- |
| 页面规模 | registry 68 条，66 条 published；线上 sitemap 66 URL，无 account/api 路径 | 保留结构，不追求数量翻倍；8 月审计的 55 页是历史值 |
| 内容分布 | 33 案例、7 检查项、6 品类、5 场景、5 指南（含 How it works）、5 hub、2 产品页、1 市场页、1 benchmark、1 privacy | 案例数量已经不少，新增价值应来自真实过程和需求，不是替换商品名称 |
| 技术基础 | 10 页均 HTTP 200、单 H1、canonical、index/follow；源码有统一 metadata、面包屑、Article/Collection 等 | 基础存在，不把正常结构重建为新 SEO 系统；不推断全部已被 Google 收录 |
| 关键词归属 | registry 已有 primary/secondary、intent、parent、relatedRoutes；现有 overlap 工具只是词项相似度提示 | 延续单一搜索意图归属，不能用静态检查代替 GSC 查询到页面的数据 |
| 正文内链 | Logo 和标签检查页有相关检查/案例链接；一致性指南仅指向首页、工具、指南 hub、一个包装案例 | 优先补齐薄弱指南与场景页；registry 的 relatedRoutes 不等于实际页面已渲染链接 |
| 案例表达 | CaseComparison 固定文案为受控变化；Logo 案例显示 Expected decision；其他案例需按各自原证据区分 | 新实测必须另标 observed result，不能把预期答案包装成实际运行结果 |
| 分享及图片 | 公共 metadata 使用同一张 OG 图；Article schema 没有案例专属 image | 首批案例配专属对比分享图，补图片描述/出处；不以堆 schema 换内容 |
| 产品说明 | How it works 主要还是单对图工作流 | 补已上线 SKU 版本、人工审核、发布资格、批量/CSV 的真实流程，明确 eligibility 不执行电商发布 |
| 内容日期 | 66 条 published 的 updatedAt 分布在 7 月 17 条、8 月 39 条、9 月 10 条 | 日期旧不自动判低质；实质更新时同步可见日期/schema/sitemap，不批量刷新日期 |
| 归因 | 已有 /api/events、UTM/referrer、checker_started 等；抽样指南/案例是普通 Link，没有统一内容落地/CTA 事件 | 存在文章入口归因丢失风险：从文章进入首页才捕获来源。先补最小内容归因，不新建分析平台 |
| 外链 | 已有分发策略及 8 月 LinkedIn 轮播草稿；现有文件仍写等待人工发布 | 没有发布 URL/结果记录就不计为已执行，也不能推断站外完全没有链接 |

当前未读取最新 GSC、Bing、真实自然流量、外链索引、Core Web Vitals 数据。因此“收录差、流量低、外链少、核心指标不达标”均不是本轮已证实结论。

## 2 需求证据与选题优先级

公开讨论是用户自述，作者身份及商业关系未独立验证。交叉转帖只算一个信号，工具厂商推广帖不计独立需求数量。不把帖子互动数折算为搜索量。

| 来源 | 可支持的需求 | 用途与限制 |
| --- | --- | --- |
| [DigitalMarketing 的创意代理商问题](https://www.reddit.com/r/DigitalMarketing/comments/1ndcy09/) | 换场景时 Logo 字体、包装色、产品名变了；多版本交付不放心 | P0 代理商/Logo/标签主题；需求线索，不是已认证客户 |
| [dalle 的文字与 Logo 保留问题](https://www.reddit.com/r/dalle/comments/zynia0/) | 如何在换背景时保留真实产品文字、包装和标志 | 历史重复痛点；同文 StableDiffusion 转帖不能重复计算 |
| [Shopify 店主的商品图片求助](https://community.shopify.com/t/feedback-on-my-updated-store-and-advice-on-product-images/615279) | 让现有图片更专业、独特，减少复制粘贴感 | 邻近需求；并非直接证明愿意为 QA 付费 |
| [Shopify 可核对原图的讨论](https://community.shopify.com/t/shopify-merchants-would-you-use-ai-product-photos-if-the-original-product-stayed-verifiable/684978/3) | 核对文字、颜色、形状、比例；反光/玻璃需要更谨慎 | 此页是产品研究者回复，可能存在关联，单列为研究讨论，不当作独立买家证据 |
| [Photoroom 编辑功能](https://www.photoroom.com/tools/edit-with-ai) | 厂商把保留产品一致性与背景编辑放进产品表达 | 竞争供给/术语参考；不能算用户反馈或 Pairvu 功能证据 |

优先级依据是问题与产品的匹配度、已有资产和可交付性。P0 为文字、Logo、换背景保持一致；P1 为颜色/光照、遮挡与视角；多商品数量、配件与细分品类根据查询和试用反馈推进。

## 3 关键词归属与页面任务

下表是工作关键词与自然语言变体，不是已核实有搜索量的词库。问题依据来自上节；其余为产品相关的待验证假设。沿用英语页面，不建立按关键词同义词复制的 URL。

| 优先级 | 主词或问题词 | 唯一承接页面 | 内容任务 |
| --- | --- | --- | --- |
| P0 | AI product image checker / compare product images for differences | `/` | 首屏明确原图对候选图；展示具体检查价值与可用操作 |
| P0 | AI changes product logo / preserve product logo in AI images | `/checks/product-logo` | 检测差异、保留标志的工作方法、真实案例；不能承诺自动修 Logo |
| P0 | AI product label text errors / wrong text in AI product photos | `/checks/product-label-text` | 名称、容量、规格逐项核对；小字不可读与真实改字分开 |
| P0 | keep products consistent in AI images | `/guides/keep-products-consistent-in-ai-images` | 从原图、编辑到检查及人工复核的完整方法 |
| P0 | change product photo background without changing product | 上述一致性指南的独立章节 | 先复用页面；后续若 GSC/SERP 表明是独立意图且有独特实测，才考虑拆分 |
| P0 | compare original and AI product images | `/guides/compare-original-and-ai-product-images` | 对齐视角、逐项核对及局部证据；与首页的工具执行意图区分 |
| P0 | AI product photography checklist | `/guides/ai-product-photography-checklist` | 可直接使用的发布前检查表及各步骤链接 |
| P0 | AI product image QA for agencies | `/use-cases/creative-agencies` | 多版本交付、客户确认、人工审核、记录与 CSV 工作流 |
| P1 | product color changed by AI / lighting vs color change | `/checks/product-color` | 变体颜色与白平衡、反光对比 |
| P1 | AI product packaging shape changes | `/checks/product-packaging` | 轮廓/盖子/主体形态对比及明确失败案例 |
| P1 | missing product parts in AI image | `/checks/product-components` | 配件缺失、额外配件、裁切不可见 |
| P1 | AI product image wrong quantity | `/checks/product-quantity` | 真实数量与印刷数量区分 |
| P1 | unreadable label / different product viewing angle | `/checks/product-image-observability` | 说明为什么不能直接 PASS；不宣称已解决参考视角匹配 |
| P1 | Shopify AI product image quality | `/use-cases/shopify-product-image-qa` | 店铺素材发布前检查；无 Shopify 插件/自动发布承诺 |
| P1 | Amazon product image review checklist | `/use-cases/amazon-product-image-qa` | 可见商品一致性与平台要求的边界；发布前刷新官方要求来源 |
| P1 | ecommerce product image requirements | `/guides/ecommerce-product-image-requirements` | 官方规则入口、图片技术要求与 Pairvu 的能力分工 |
| P1 | skincare product image consistency | `/categories/skincare-product-image-qa` | 包装规格、小字、泵头、同款视角；先有可用真实素材 |
| P1 | beverage product image QA | `/categories/beverage-product-image-qa` | 容量、口味、罐身文字、反光；首个真实图片案例可挂这里 |
| P2 | AI product photography / AI product photos | `/ai-product-photography` | 作为市场支柱页，不与生成器竞争“生成图片”操作意图 |
| 条件 | 商品名 + AI background edit + label/logo comparison | `/examples/<具体案例>` | 只有对应实测、素材依据和独特结论齐备才新建；商品名是案例对象 |
| 条件 | 工具名 + product consistency test | `/examples/<具体工具与任务案例>` | 亲自使用相应版本后再写；不批量生产未实测的 best/review 页面 |

不主动争取：AI image detector、reverse logo search、无场景的 color detector、纯品牌购买词、全平台合规 checker。这些意图容易带来无效访问或超出产品能力。

取得数据后的排序：按最近 28 天与前 28 天、必要时 90 天查看非品牌查询/页面/国家/设备；有相关曝光且内容缺口明显的旧页优先。Keyword Planner 数据保留市场和日期，不把广告竞争度当自然排名难度。GSC 尚无数据的主题先做小规模内容，不设置虚构流量保证。

## 4 内链建设

保留 `/checks`、`/examples`、`/guides`、`/categories`、`/use-cases`。不另开平行 `/blog`、`/reviews`、`/case-studies` 来分散同一主题。导航可将 Examples 展示为 Examples & Tests，URL 不变；有真实实测后再启用类型筛选，暂不为筛选生成可索引 URL。

建议用户路径：问题指南 → 对应检查项 → 实测证据 → 上传原图和候选图。品类/使用场景作为上下文入口；每一步都能直接去工具，不强迫读完漏斗。

| 页面 | 正文需要的链接 | 第一批具体动作 |
| --- | --- | --- |
| 一致性指南 | Logo、标签、颜色检查；背景保持不变的案例；检查清单；工具 | 从目前仅一个包装案例扩展为有上下文的相关证据 |
| 原图对比指南 | Logo/标签/可观察性检查、两个可比较案例、工具 | 解释视角/不可读时链接到 REVIEW 方法 |
| Logo/标签检查页 | 对应方法章节、受控例子、真实实测、工具 | 保留已有有用链接；不再重复堆所有检查页 |
| 具体实测 | 一个主检查项、一个品类或场景、方法页、工具；必要的相邻例子 | 读者能理解问题、过程、结果及下一步 |
| 品类/代理商页 | 按风险排序的检查项、两个最相关案例、工作流程、价格或批量入口 | 更新已上线能力，登录动作保留清晰提示 |
| 首页/案例 hub | 首批优质实测、问题入口、已有示例 | 区分受控例子与真实图片实测，不以知名品牌列表灌满首页 |

正文通常 3–6 个真正有用的上下文链接即可，不把数量设为硬门槛。锚文本解释目的，例如“核对容量与产品名”。新案例上线同时补父页及一个相关检查/指南的入链，设计目标为从首页或主 hub 三次点击内可达。站内链接不加 UTM。

不批量改 URL、301、canonical 或 noindex。现有页面是否合并/下线，需要真实查询重叠及内容证据，不能只依据篇幅或静态相似度。

## 5 真实商品图片与实测内容

### 可行素材来源

1. 自己拍摄现有实物，保留原图与商品/版本信息；不需要真实客户数据。
2. 品牌/摄影者明确许可的图片，记录允许公开展示、裁切标注、AI 编辑及第三方处理的范围。
3. 明确开放许可的图片，逐张核对作者、许可、修改标记及适用条件。

已找到一个具体候选：[Coca-Cola 330ml can，Ossewa 摄影](https://commons.wikimedia.org/wiki/File:Coca-Cola_330ml_can.jpg)，原页面注明南非 2018 年照片，2740×2095，CC BY-SA 4.0。可作为文字/容量/罐形主题的素材候选；不能冒充当前包装、品牌认可或已测案例。需适当署名、许可链接、修改说明及衍生作品的相同/兼容许可，并确认编辑工具条款与用途兼容。

[Open Food Facts 官方说明](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/)为食品/饮料图片提供 CC BY-SA 来源，同时提醒包装图形可能涉及其他权利。数据库 ODbL 与图片许可不同，实际使用前分别核对。网页公开、搜得到或写明来源，都不自动等于获得任意转载许可。

知名商品只作为帮助理解的例子。未核实关键词数据前不称“高流量产品”；以问题相关度、清晰可比的图片和明确来源优先，品牌知名度其次。第一批不扩展到服装试穿/人物/珠宝等目前证据薄弱的边界。

### 三种内容必须区分

| 内容类型 | 可以怎样表述 | 不能怎样表述 |
| --- | --- | --- |
| 受控示例 | 人为只改容量/Logo，展示这个错误应怎样检查 | AI 自发错误率、真实用户问题发生率 |
| 真实商品图片实测 | 真实来源照片经指定工具/版本编辑，记录本次实际输出与 Pairvu 结果 | 对整个工具的准确率排名、品牌背书、真实客户案例 |
| 正式质量评估 | 冻结样本、授权、独立标注、预设指标后统计 | 用本轮精选 SEO 案例代替留出集 |

最小案例单位是一项真实问题、一张来源明确的原图、一项预先记录的编辑任务和实际输出。建议先预定 3 次输出以展示变化，并披露全部结果；这是编辑预算，不是统计充分样本量。若只执行一次就写一次，不补造 PASS/FAIL/REVIEW 的“完整故事”。人为制造错误需醒目标明受控编辑。

保存：来源 URL/作者/许可、原图和输出哈希、商品/包装年份、编辑工具及可见版本/日期、提示与设置、输出次数和选择规则、Pairvu 运行版本/原结果、人工观察、失败与不确定项。机器判断与编辑者观察分列，不能由 Pairvu 自己的分数证明 Pairvu 正确。

### 内页模板

建议标题：`Can an AI background edit preserve the label on a 330 mL can?`。以问题起题，品牌作案例背景。固定内容：

1. 首屏直接回答本次发现，并标注实测或受控示例。
2. 原图和编辑图、可读局部裁切、来源/许可/修改说明。
3. 为什么需要这项检查：具体用户问题，不拼贴论坛原文。
4. 复现步骤：工具/时间/任务/提示/输出次数。
5. 结果表：属性、人工观察、Pairvu 原始结论、两者是否一致/仍不确定。
6. 失败、误报或漏报照实写；建议如何修正并再次核对。
7. 适用范围、未覆盖内容、作者/复核者真实身份与利益关系说明。
8. 相关检查/指南/品类的正文链接，以及“检查自己的两张图”。

没有图片使用依据或实际运行记录时，只保留选题草稿，不上线占位案例。原图保留，公开版本移除不必要的 EXIF 位置信息。使用独立研究资产，排除价值指标；不读取真实客户图片。专属 OG、合理尺寸、描述性 alt/caption、Article/image 与可见内容一致；不伪造 Review 星级或 AggregateRating。

## 6 外链和分发

外链建立在可引用的内容上。优先资产为“一张对比图加一个具体发现”“可用的发布前清单”“完整可复现的实测”。Google 强调评测应展示亲身证据和原创研究；不能仅重写商家介绍。[评测建议](https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews)

| 优先级 | 渠道 | 提供什么及落地页 | 执行边界 |
| --- | --- | --- | --- |
| P0 | 自有创始人 LinkedIn / 已有相关受众 | 一次实测发现 → 对应案例 | 可复用 8 月草稿资产，但发布前确认观点与链接当前有效 |
| P1 | 商品摄影/电商创意代理商、编辑工具教程作者 | 可引用对比图、审核清单、联合实测 → 指南或案例 | 建立少量真正相关对象，不批量邮件 |
| P1 | 电商/设计 newsletter 和实践博客 | 一篇具有具体发现的稿件 → 原始实测 | 披露关系；付费 placement 合理标记 sponsored/nofollow |
| 条件 | Reddit / Shopify 社区 | 回答现有问题，必要时给进一步证据 | 发布前核对当前规则；若不许推广就不带品牌/链接，不把回帖包装成独立用户 |
| P2 | AI Best Tool 等自有项目及精选目录 | 真实相关的产品介绍/上下文引用 | 不做全站关键词互链；已有 Other products 页脚不计作赢得的编辑外链 |

不买排名链接、不做 PBN/批量目录/精确关键词锚文本互换。Google 的 link spam 与 scaled content abuse 政策适用于这种操纵性建设。[Google 垃圾内容政策](https://developers.google.com/search/docs/essentials/spam-policies)

建议首个分发批次仅 1 个原创案例、2 份适配渠道的草稿、5 个相关合作对象候选。记录公开 URL、来源/关系、目标页、UTM、点击和有效使用；nofollow 提及仍可带来实际用户，不以 dofollow 数量作唯一 KPI。这里是计划，尚未发送任何消息或发布帖子；实际外发需明确指令。

## 7 衡量和首批执行

主要指标：相关非品牌查询带来的内容落地、进入 checker、完成两图上传、完成一次分析、后续复用。辅助指标：有效收录、主题曝光、相关引用和来源质量。真实业务数据与内部/合成研究流量分开；没有观测数据时填未知，不填零。

先复用现有事件系统：在首批内容入口保存 landing_path 与来源，CTA 记录 source_page/content_id，跨页保留合法 session 归因。检查现有 localStorage 的会话持久化含义，避免把旧来源永久归给新访问。GSC 用于查询/页面趋势，第一方事件用于行为漏斗，不宣称可以逐个拼接匿名搜索查询与用户。必要事件变更作为一个小范围开发单元；本次未改运行代码。

| 顺序 | 交付 | 依赖 | 完成标准 |
| --- | --- | --- | --- |
| 1 SEO 首批存量改版 | 一致性指南、原图对比指南、Logo/标签检查页、代理商页、How it works；必要的 hub 入链与内容归因 | 现有证据足够；GSC 当前导出有助排序但不阻塞这些明确缺口 | 页面讲清真实流程；正文链接有效；不虚构案例；最小归因路径可核对 |
| 2 一个真实图片实测 | 优先饮料罐文字/容量及背景编辑；一个原图、一个任务、披露实际输出 | 逐图许可适用、可用编辑工具与明确调用预算 | 原始结果、人工观察、来源与限制齐全；内容页可复现，不宣称总体准确率 |
| 3 小批分发 | 2 份渠道稿、5 个相关对象候选、落地页与追踪参数 | 案例可公开，外发得到明确指令 | 以发布 URL 和实际结果记完成；草稿不算发布 |
| 4 反馈后扩展 | 决定下一篇颜色/光照或视角不可见主题 | 查询、读者反馈、实际 checker 使用 | 有独特需求再扩一组；无信号先调整入口与内容，不机械加页 |

前两批可按约两周安排，素材/工具依赖明确列出；搜索表现按 28 天窗口观察，不承诺两周排名提升。每批集中一次开发和一次独立增量验收：内容/来源/链接/metadata、实际归因变化及必要构建；不触发计费、删除矩阵或全套产品回归。部署继续 GitHub-first，未获本批生产授权则止于可发布状态。

前两项已完成并上线。下一步是先观察抓取、内容入口与 checker 转化，再准备两份渠道稿和五个高相关合作对象候选；任何实际外发仍需用户明确授权。真实授权样本缺失继续阻塞质量结论，但不阻塞本案例作为过程透明的单次实测。

## 8 后续编辑依据

- [现有关键词归属规则](keyword-ownership-and-cannibalization-audit-2026-08-17.md)：继续有效；其中计数及阶段描述按本次审计更新理解。
- [原外链计划](external-distribution-plan-2026-08-17.md)：历史计划保留；当前节奏以本方案的小批交付为准。
- [Google 图片 SEO 指南](https://developers.google.com/search/docs/appearance/google-images)：图片上下文、alt、可访问图片与发现方式。
- [Google people-first 内容指南](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)：以目标受众需求和可验证经验组织内容。
