# PIVOT-01 independent source audit

Candidate: `f3c3e8ce2af473059516140c7e6c4b751e5c867e`

Checked on 2026-11-11 against provider/model-owner or benchmark-owner pages:

- OpenAI GPT-5.2 documentation supports the 400K context window and $1.75/$14 text-token prices; the pinned snapshot supports the 2025-12-11 date used by the catalog.
- Anthropic Claude Opus 4.5 announcement supports 2025-11-24 and $5/$25; its model overview supports 200K context.
- Google Gemini 3 developer/pricing documentation supports Gemini 3.1 Pro Preview, 1M context, and $2/$12 below 200K tokens. The page caveat about the higher long-context tier is rendered in the comparison content.
- Qwen's release and official Hugging Face model card support Qwen3-8B, Apache 2.0, 8.2B parameters, and 32,768 native context (131,072 requires YaRN). No official `qwen-3-8-27b` model was found.
- Z.ai's release and official model card support GLM-5, 2026-02-12, MIT license, 744B total/40B active, and the 200K evaluation context used in the catalog.
- Anthropic's Fable 5.2 and Opus 5.5 model documentation supports their dates, 1M contexts, $8/$40 and $4/$20 pricing, always-on adaptive thinking, and Fable's 30-day retention caveat.
- CursorBench's owner page supports version 4.0 and the five copied score/cost rows exactly.
- OpenAI's BrowseComp release supports 1,266 questions and the displayed baseline framing; copied rows match the original release data.

The candidate presents provider-published specifications separately from benchmark claims and links the original sources on the relevant pages.
