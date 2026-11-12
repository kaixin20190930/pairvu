# PIVOT-03 primary-source inventory

Checked 2026-11-12. Runtime model facts continue to use only model owners, API providers, and benchmark owners.

- Qwen4-Max-Preview: Alibaba Cloud Model Studio, `https://help.aliyun.com/en/model-studio/qwen4-max-preview` — 1M context, Token Plan only, no pay-as-you-go access, preview 2026-11-11 10:00 through 2026-11-25 24:00 UTC+8, then retired.
- Qwen3.5-397B-A17B: official Qwen model card, `https://huggingface.co/Qwen/Qwen3.5-397B-A17B` — 397B total / 17B active, 262,144 native context, Apache-2.0.
- CNY display conversion: Federal Reserve H.10, `https://www.federalreserve.gov/releases/h10/current/` — 1 USD = 6.676 CNY on 2026-11-06. The UI preserves CNY originals and identifies this as a dated display conversion.
- DeepSeek-V3.2, Kimi K2.5, and MiniMax M2.1 retain their exact owner sources. Those sources do not establish a current exact-model hosted token price, so the UI says so and does not substitute successor pricing.
- Existing Qwen3.8/Qwen3, GLM-5, GPT-5.2, Anthropic, Gemini, CursorBench, and BrowseComp owner sources remain unchanged in `lib/models/catalog.ts`.

No cross-harness quality score was added. The new Qwen, Qwen4/GPT, DeepSeek/GPT, Claude/GPT, and fixed three-model pages explicitly state when no common exact-version harness is cited.
