# SKU 产品标准字段矩阵（UPG-03 本地实现待独立验收）

核对基线：`0757622a5866794476a00474d41dfd7f6323c3c6`。实施与事务约束见[版本化契约](../01-architecture/sku-versioned-profile-contract.md)。本设计只管理用户声明和历史来源，不增加模型输入、自动裁决、计费或图片保留时长；不等同真实商品真值验证。

## 身份与版本

- productId：workspace 内产品记录的稳定 UUID，归档/恢复、改名和编辑资料不换 ID。
- skuLabel：用户可选外部 SKU 标签，不作全局身份；继续使用 workspace 内非空 skuKey 唯一约束，归档仍占用 SKU。
- profileVersionId / profileVersionNumber：不可变文字资料版本；首次明确保存为 v1，不把现有产品自动说成已有历史标准。
- referenceVersionId / versionNumber：现有批准参考图版本，按 product 全局递增，按 role 选 current，独立于文字版本。
- revision / expectedVersion：产品所有写操作共享的 CAS 计数；不是 profileVersionNumber，也不是参考图版本号。
- packagingVersion：用户声明的包装版本字符串，可以为空；不是任何服务端计数，也不自动关联参考图。界面提示用户检查参考图是否与包装声明一致，03B 不自动推断或否决视觉一致性。

## 规范化与长度（新增 profileSchemaVersion=1）

HTTP body 上限 32 KiB，规范化后单份 profile JSON UTF-8 上限 16 KiB。文字一律先 NFKC、trim、将连续空白折叠为单空格；禁止 NUL 和其他非空白控制字符。不接受对象/数字冒充文字，不静默截断。长度按 JavaScript UTF-16 code units 计，与现有 name/sku 验证一致；前端 maxLength 只是辅助，服务端权威。可选文字空串归一成 null；所有 profile 字段在完整替换请求中均必填，清空用 null/[]，漏字段报错。未知键拒绝。禁止 HTML 富文本、客户资料、任意 URL、文件地址或密钥字段。

| JSON 字段 | 类型、上限、空值 | 规范化与含义 | 当前实现/03B 编辑 |
| --- | --- | --- | --- |
| profileSchemaVersion | 数字 1，必填 | 规范化格式版本，不接受字符串 | 新增固定值 |
| name | string，1–120，非空 | 产品显示名称；完整保存时同事务更新 products.name 兼容列 | 当前已有；进入文字版本 |
| skuLabel | string/null，≤80 | 显示大小写保留；skuKey 仍按 en-US 小写唯一；null 不占唯一键 | 当前已有；进入文字版本及兼容列 |
| brand | string/null，≤80 | 用户声明品牌；不从名称或图片推断 | 新增单行输入 |
| variant | string/null，≤120 | 口味/颜色/型号等变体标签；不同真实 SKU 应另建产品，不能自动拆分 | 新增单行输入 |
| capacity | object/null | 非 null 必须且仅有 value、unit；两者不可单独为空 | 新增数值文字框及单位选择 |
| capacity.value | decimal string，≤13 | 输入 `^[0-9]{1,9}(\.[0-9]{1,3})?$`，值必须 >0；去多余前导/末尾小数零，不使用浮点计算；如 0500.000 → 500 | 不接受科学计数、负值、千分符 |
| capacity.unit | enum | ml / l / g / kg / count；不自动换算、不把 1 l 与 1000 ml 视作同一声明 | 固定选择，count 只允许整数 value |
| packagingVersion | string/null，≤80 | 如“2026 autumn carton”；可见标签或内部版本名均可，不能凭其判断图片对错 | 新增单行输入 |
| criticalAttributes | array，0–12项 | 每项严格为 key、value、visibility；客户认为必须保持的声明 | 最多12行，不增加自定义字段系统 |
| allowedChanges | array，0–8项 | 每项严格为 key、note；只允许下表的视觉情境变化 | 固定选项＋说明，不是自动豁免规则 |

criticalAttributes.key：规范化后 1–40，显示值保留，去大小写的 key 在数组内唯一；不能与 name、skuLabel、brand、variant、capacity、packagingVersion（不区分大小写）重名。value：1–160非空文字。visibility：`visible_required`（请求视觉检查但仍必须实际可见）、`view_dependent`（仅某视角可能可见）、`not_visually_verifiable`（内部规格或无法凭图确认）。visibility 不证明图上可见，也不授予模型编造不可见内容的权限。所有关键属性都是 asserted_by_user，不存在 verified=true 字段。

allowedChanges.key：background / lighting / shadow / placement / camera_angle 五选一，同一 key 不重复；note：null 或 ≤160文字。不得加入 logo、文字、容量、产品身份、组件删除等“允许错误”开关。03B 只存储/显示，即使 lighting 被允许，当前颜色判定规则也不变；后续使用必须另立模型/风险策略契约。

数组规范化后按 key 的固定 Unicode 顺序排序，用于稳定 JSON 与请求 SHA256；criticalAttributes 重复检测用 en-US 小写 key。对象序列化固定按本表字段顺序，capacity 和数组对象也用固定键顺序。哈希对象包含 profileSchemaVersion=1，不能用普通对象插入顺序代替规范化序列化。

## 现有数据与可见性

| 情况 | 展示/读语义 | 不允许做的事 |
| --- | --- | --- |
| 尚未建立 profile 的产品 | name/skuLabel 作为当前管理信息，profile=null，profileState=legacy_unversioned | 将其叫作历史 v1 或“已核验真值” |
| 编辑 legacy 产品首次保存 | 表单预填现有 name/sku，其余 null/[]，用户确认后创建 v1，source=user_confirmed | 从图片、文件名、旧 batch 名称推断品牌/容量 |
| 有历史绑定的新批次/分析 | 展示冻结的文字、profile/ref IDs、绑定时间；名称“运行时保存的用户标准” | 用最新 profile 覆盖旧报告 |
| 老批次只有 productId | 标明 legacy_unbound；可另显示“当前产品名称（非运行时快照）” | 根据当前版本或 createdAt 猜旧版本 |
| 图片过期/删除 | 保留历史元数据，imageAvailable=false，预览禁用；区分“标准文字存在”与“图片可读取” | 为有 profile 的图片续期或恢复 R2 对象 |
| 属性不可见/资料与图不一致 | 展示声明与可见性标签；现有引擎继续按图片证据判断 | 把文字声明直接当模型观测结果 |

## 最小界面与请求例子

产品详情增加“产品标准（仅供记录）”编辑区：名称、SKU、品牌、变体、容量、包装版本、有限关键属性与允许变化。显示文字版本和资料更新时间；保留参考图各角色及独立版本号。首次保存提示“从本次保存起版本化，过去任务不会回填”。归档只读，可恢复；不新增硬删除、DAM、批量导入或新行业模板。

保存按钮带当前 revision、每次编辑意图生成一次 requestId。网络超时重发原 requestId 和完全相同内容；收到409保留草稿、重新载入服务器版本并由用户确认后用新 requestId 提交，禁止静默最后写入获胜。UI 不要求用户理解 CAS 技术名，展示“资料或参考图已更新，请确认最新内容”。

以下只展示 profile 请求体片段；外层身份与错误规范见架构文档：

```json
{
  "profileSchemaVersion": 1,
  "name": "Example oat drink",
  "skuLabel": "OAT-500",
  "brand": "Example",
  "variant": "Original",
  "capacity": { "value": "500", "unit": "ml" },
  "packagingVersion": "2026 carton",
  "criticalAttributes": [
    { "key": "cap color", "value": "white", "visibility": "visible_required" }
  ],
  "allowedChanges": [
    { "key": "background", "note": "Plain studio background" }
  ]
}
```

这里产品和标签均为合成示例，不是真实客户或质量证据。有产品的新任务必须明确选当前 profile 和一个可用 current reference；多个参考图联合判断、自动选角度、从文字生成模型约束仍延后。


## 本地实施状态（2026-10-10，待独立QA）

矩阵已接入 `lib/products/profile-validation.ts` 与完整替换profile API；编辑器支持上述有限字段、capacity单位、属性可见性、scene notes和文字版本历史。字段仍只是用户声明，不进入模型输入，不自动核验，也不构成错误豁免。现有产品在明确首次保存前维持NULL profile，过去任务不回填。

[开发覆盖索引](../../fixtures/product-profiles/coverage.json) 关联规范化/边界、真实本地D1、API/worker与浏览器保留草稿证据。开关默认关闭；上线、真实schema迁移与启用尚未执行。当前完整实现只作为固定提交候选交独立验收。
