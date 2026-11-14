# PIVOT-04 Stage A source and page inventory

Checked 2026-11-15. Stage A adds no new model or comparison fact source.

## Exact-model price boundaries

- DeepSeek-V3.2: DeepSeek model-owner release, `https://www.deepseek.com/en/news/deepseek-v3-2/`.
- Kimi K2.5: Moonshot AI official model card, `https://huggingface.co/moonshotai/Kimi-K2.5`.
- MiniMax M2.1: MiniMax official release, `https://www.minimax.io/news/minimax-m21`.
- Qwen3.5-397B-A17B: Qwen official model card, `https://huggingface.co/Qwen/Qwen3.5-397B-A17B`.

The cited owner sources establish the exact models and weights/status but do not establish a current exact-model hosted token price in the facts Pairvu records. Each page therefore says the hosted price is unconfirmed/unknown, not free, and links the owner source instead of substituting a successor model.

## Qwen4 lifecycle

Alibaba Model Studio `https://help.aliyun.com/en/model-studio/qwen4-max-preview` supports model ID `qwen4-max-preview`, Token Plan-only access, no pay-as-you-go price, and the preview boundary at 2026-11-25 24:00 UTC+8. The UI display name is “Qwen 4 Max Preview”; slug and canonical remain `/models/qwen-4-max-preview`.

## Stage A page inventory

- New: `/models` (directory, self-canonical, linked by Header/Home/Footer and all model profiles).
- Repaired: `/best/open-source-models` target metadata/H1/opening paragraph.
- Six priority comparison SEO records: Claude vs GPT, DeepSeek vs ChatGPT, ChatGPT vs Claude vs Gemini, GPT vs Gemini, Claude vs Gemini, and Fable vs Opus. Qwen exact-model comparisons remain unchanged in Stage A.
- Inventory after Stage A: 35 sitemap URLs, 14 model profiles, 9 comparison pages including the fixed three-model page.
