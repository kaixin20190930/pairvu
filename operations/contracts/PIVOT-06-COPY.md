# PIVOT-06-COPY：Chinese models 单处过期文案

2026-11-16 用户授权只修 /best/chinese-models 那处过期文案、独立验收、提交推送生产发布并同步现有文档。基线 ce1cbf026a229a4f310007fed23444a1e13fce1c。旧 JRN-04-FIX RELEASE_READY 保留，不手改正式状态。

## 唯一运行时范围

仅 app/best/chinese-models/page.tsx 内 Qwen3.5-397B-A17B 那个 li：将“no Pairvu profile is published yet”替换为指向既有 /models/qwen3-5-397b-a17b 的自然文案及 Link。继续使用 qwen35Candidate.slug，保留原官方来源。其他内容、顺序、数量、TDK、checked日期、数据、样式、URL/canonical、sitemap、定时任务和产品边界均不改。总控另更新既有路线文档/台账及最小验收、发布证据；旧原件不改写。

## 冻结验收与复用

必验：固定SHA完整差分只有上述单处运行时修改；目标条目显示档案链接且不再声称无档案；该slug确实在现有catalog；八项候选与原官方来源保留；Title/H1/canonical不变。用一次定向SSR渲染核对实际条目/链接/文本即可，不新建通用测试或本地服务。QA独立检查固定提交与目标SSR，复用未变catalog、组件、配置、依赖和PIVOT-05两阶段PASS，不跑全站专项/独立全库typecheck/额外本地构建/旧路由矩阵/GSC/官网重查。发布脚本仍按精确已推送SHA做唯一必要生产构建及其类型检查。生产只验health精确SHA/平台版本、目标页200/文本/链接/保留TDK及该档案200，不扩页检查。

资产：无账号、上传、DB或本地服务；临时SSR/HTTP原件放/private/tmp并按需归档。准备15/验收30分钟为诊断检查点，无新证据立即报告；权限等待即时回传，不长等、不绕过。开发不执行Git写、push/deploy或权限请求；总控统一精确提交，防止跨角色Git写审批等待。完成必验及清理即停，不修新发现的非阻断问题。

## 角色选择与交付

开发 GPT-6 Luna/medium：确定的一处文字及既有Link替换，事实和目的地已在仓库，低风险易核验；如无法保持单处修改则停止交总控，不扩框架。QA GPT-6.1 Sol/medium：固定SHA差分、实际SSR和生产版本/单页核对，常规独立审查足够；发现事实/目标链接错误直接FAIL，环境问题不升级模型。新单元选择新配置，旧角色已完成；总控当前模型沿用。

开发只交应用文件差分和定向SSR结果/可执行步骤，不提交，报告暂存/private/tmp。总控提交候选后一次完整派独立QA；QA保留原件，不改应用。QA原件先放/private/tmp，不污染发布树。PASS后总控push该固定候选、fresh精确远端核验且树干净、同SHA deploy；QA继续定向生产验收，发布后总控一次性归档文档/原件。不得因此改候选运行时文件。无迁移。实现、发布、启用、验收分别如实记录；无发布后自动新开发。
