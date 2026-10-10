# UPG-03-LIFECYCLE-FIX

唯一目标：修复已启用SKU页面归档/恢复后ProductProfileClient仍使用旧latest.status/revision，导致归档仍可编辑、恢复仍只读的问题。生产实测产品8e023cd4-16b4-4e77-a957-238e7253947f（合成QA），归档→重新加载→恢复，标题/参考编辑器恢复正常但文字标准仍disabled；刷新才正常。

允许：app/account/products/[productId]/ProductProfileClient.tsx，必要时同目录page.tsx/SavedProductSettingsClient.tsx，以及fixtures/product-profiles和专项测试脚本。不得改API、迁移、计费、依赖或其他业务。总控维护operations和进度文档。

验收：同页面归档后文字标准立即只读，恢复后可编辑并可保存；router刷新或新props不丢未保存草稿，不自动绕过409人工查看/确认，不破坏503相同请求重试；更新生命周期与revision必须避免倒退和静默覆盖。使用实际React组件的定向浏览器/交互回归及typecheck；无需全量D1重复。部署构建由总控执行。

开发仅提交允许文件并返回SHA/范围/命令/证据/风险；独立QA固定SHA，不修代码。失败返原开发；两次同类失败先诊断。原生产SKU启用授权包含本必要修复，仍严格先GitHub再Cloudflare。生产复验只操作合成QA产品，不改客户数据。UPG-04在登录验收PASS之前保持关闭。

模型：开发gpt-6.1-sol/high，虽是局部UI但须处理新props、异步保存、保留草稿及CAS冲突交互；QA gpt-6.1-sol/high独立设计逆序/冲突反例。不因生产或开发标签选择最贵；若仅环境问题不升级，若实质并发推理缺陷重复出现再评估模型并记录理由。
