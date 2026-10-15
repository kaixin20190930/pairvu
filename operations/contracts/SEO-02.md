# SEO-02 开放许可真实商品图片背景编辑实测

状态：SEO-01 固定候选独立 PASS；SEO-02 素材与操作范围已冻结，开始执行。

用户已授权在六页改版后做一个真实商品图片实测。采用 Wikimedia Commons 的 [`Coca-Cola 330ml can.jpg`](https://commons.wikimedia.org/wiki/File:Coca-Cola_330ml_can.jpg)：作者 Ossewa，拍摄日期 2018-05-01，原页面声明 own work 与 CC BY-SA 4.0，原文件 2740×2095。下载 URL 为 `https://upload.wikimedia.org/wikipedia/commons/7/77/Coca-Cola_330ml_can.jpg`，本地原件 `public/examples/coca-cola-can-background-edit/original.jpg`，SHA256 `88e32149a0c6d97d519edd24f5179f0bbf5d1fe14308358c9d7617db8b563924`。页面必须显示作者、源页、许可链接、修改说明、历史包装/非品牌认可说明及 CC BY-SA 继承；商标和包装图形属于相关权利人，开放照片许可不等于品牌背书。

唯一编辑任务：使用内置 imagegen 对上述本地原图执行一次背景编辑，把桌面、玻璃、纸张和远处物体替换为干净的浅灰摄影棚台面与背景；保持红色 330 mL 罐、罐体轮廓、开口、罐顶小足球裁判人偶、构图、可见文字、Logo 和颜色不变。不增加文字、水印、商品或道具。仅生成一个候选，不挑选多个结果。最终 prompt、工具、日期和输出路径必须记录；候选保存到 `public/examples/coca-cola-can-background-edit/candidate.png`，保留 imagegen 原始输出及哈希。

Pairvu 实测使用本地隔离路径，不上传生产、不读取客户数据、不影响生产额度。开发先检查现有 `eval:m0:pair`/真实 pair 脚本是否能对两条显式文件路径运行；若现有工具不能满足，允许最小一次性只读脚本或显式命令，但不得新建通用评测框架。只执行一次实际 Pairvu 模型比较；不得为得到理想结论重跑。保存原始机器 JSON、执行时间、实际模型/规则来源（能确认多少写多少）、人工逐项观察和二者差异。密钥只从既有本地环境精确加载，不输出。

允许新增一个 `/examples/coca-cola-can-background-edit` 案例页、对应 `lib/seo/content-registry.ts` 条目、两张项目图片、归因/许可说明、必要的 `/examples` hub 与最相关指南/检查页正文入链，以及最小专项验证。不得重写 SEO-01 已通过内容；只允许为新案例补上下文入链。页面标题围绕“AI background edit preserve product label”问题，品牌只是案例对象。metadata/Article/image 可见内容一致，不用 Product/Review 星级 schema。

必须保留原图与全部实际输出，不为凑齐 PASS/FAIL/REVIEW 选择性隐瞒；机器结果和人工观察分列。单一案例只支持本次过程与结果，不支持总体准确率、品牌背书、当前包装声明或真实客户结论。不使用客户图片，不修改生产计费或客户数据；未获得生产发布授权时止于 RELEASE_READY。

## 验收与角色

- 必验：许可与哈希、一次编辑过程、一次 Pairvu 原始结果、人工观察、页面披露和入链、图片 alt/caption、唯一关键词归属、`test:seo`、overlap、typecheck、固定候选 build、独立 QA。
- 反例：不能称当前包装、官方合作、真实客户、高流量商品、统计准确率或工具排名；如果 imagegen 改了标签/Logo，必须原样披露为实际发现，不能修图或重跑隐藏。
- 不验：生产上传/登录/计费、GSC 排名、广泛模型基准、UPG-07 质量结论、其他商品与工具。
- 清理：本地临时 clone/中间文件可删；原图、唯一候选、许可记录、实际机器原件及 QA 证据保留。不得删除审计需要的唯一输出。
- 开发选择 GPT-6.1 Sol / medium：常规页面与一次受控本地实测，需要跨图片、机器结果和内容事实一致性；不需要最高档。出现模型结果与原始 JSON/页面解释冲突时先缩小事实再评估 high。
- 独立 QA 选择 GPT-6.1 Sol / medium：核对固定 SHA、公开许可、一次输出、原始结果与页面一致性；若许可适用或结果解释出现实质争议再评估 high。
- 开发不 push/deploy，不创建子任务；QA 不改共享应用代码。必验通过即停止，不扩成多工具、多商品或多轮生成。

下一步：SEO-02 独立 PASS 后停止在 RELEASE_READY 等待生产发布授权；不会自动对外分发或建立外链。

## 2026-10-15 完成记录

唯一 imagegen 输出和唯一 Pairvu 本地运行已完成；原件及边界见 `operations/evidence/SEO-02/test-manifest.json` 和 `pairvu-result.json`。Pairvu 结论为 REVIEW，5/6充分可观察；Logo、文字、数量、颜色和组件为match，包装形状not_observable。首个候选 `fef44f9e06891ad535a293d626c3e887dff9304b` 因人工文案无证据声称罐体放大并移向中心被独立QA判FAIL；图片和模型未重跑。修正候选 `170fd1dcd216b3b146d243883896ed862c3dbfd1` 独立增量PASS，原FAIL与复验分别保存在 `qa.json`、`qa-recheck.json`。

最终候选67个sitemap路由、overlap、typecheck、diffcheck、固定SHA干净构建与构建HTML/schema/三条入链检查通过。未推送、部署、启用生产或对外分发。正式控制CLI仍受旧 JRN-04-FIX 活动状态阻塞，实际状态记录为独立PASS、待发布授权；不得手改为正式RELEASE_READY。
