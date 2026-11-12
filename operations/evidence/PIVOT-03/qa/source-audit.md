# PIVOT-03 independent source audit

Checked 2026-11-12 against owner or primary sources.

- Alibaba Cloud's Qwen4-Max-Preview documentation supports the 1M context, Token Plan-only access, no pay-as-you-go access, preview period from 2026-11-11 10:00 through 2026-11-25 24:00 UTC+8, and retirement after preview. The paired model and comparison pages show the material availability limits.
- Federal Reserve H.10 data identifies Chinese Yuan value 6.6760 for 2026-11-06. `/llm-pricing` identifies the date and source, uses 1 USD = 6.676 CNY only as a display conversion, and preserves the CNY originals.
- The official Qwen3.5-397B-A17B model card supports Apache-2.0, 397B total / 17B active, and 262,144 native context.
- DeepSeek-V3.2, Kimi K2.5 and MiniMax M2.1 retain their exact owner sources. Their pages explicitly say that the cited exact-version source does not publish a current model-specific hosted price; no successor price is substituted and self-hosting is not described as free.
- No new direct quality score is displayed. The Claude/GPT, Qwen pair, Qwen4/GPT, DeepSeek/GPT and fixed three-model pages state that no common exact-version harness supports a direct comparison. Existing benchmark tables remain separately scoped to their named source, version and configuration.

Primary URLs independently checked:

- https://help.aliyun.com/en/model-studio/qwen4-max-preview
- https://www.federalreserve.gov/datadownload/Preview.aspx?pi=400&preview=H10%2FH10%2FRXI_N.B.CH&rel=H10
- https://huggingface.co/Qwen/Qwen3.5-397B-A17B

GSC indexing, rankings and search-volume claims were not tested and are not treated as passing evidence.
