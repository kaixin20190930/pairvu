# PIVOT-04 Stage D source inventory

Collected 2026-11-15. Only model-owner or harness-owner sources support the new facts.

| Item | First-party source | Supported fact mapping | Explicit boundary |
|---|---|---|---|
| Claude Sonnet 5.5 | Anthropic [model overview](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) | Model ID `claude-sonnet-5-5`; 1M context; 128K max output; USD 2/M input and USD 10/M output; standard Claude API; text/image input and text output | This is Sonnet 5.5, not Sonnet 5. Cursor routing or plan pricing is not substituted for the Claude API price. |
| Claude Sonnet 5.5 launch | Anthropic [announcement](https://www.anthropic.com/claude-sonnet-5-5) | Release date 2026-09-28; everyday coding/agent positioning; faster and lower-cost complement to Opus 5.5 | The page does not convert Anthropic positioning into a universal quality rank. |
| Muse Wonder model | Meta [model documentation](https://dev.meta.ai/docs/muse-wonder) and [model catalog](https://dev.meta.ai/docs/models) | Model ID `muse-wonder-1.0`; 1,048,576-token context; text/image/video/audio/PDF input; text output; preview status; Model API Standard-mode and Muse Code availability | `max` reasoning effort on `muse-wonder-1.0` does not select Muse Wonder Full. Full is a separate Muse Code-only variant. Both variants are unavailable in South Korea. |
| Muse Wonder launch | Meta Research [announcement](https://research.meta.ai/blog/muse-wonder) | Release date 2026-10-12; Muse Wonder and Muse Wonder Full introduced as separate variants | The announcement is not used to merge evaluation results for Wonder and Full. |
| Muse Wonder price | Meta Model API [pricing and rate limits](https://dev.meta.ai/docs/pricing-rate-limits) | Standard-mode pay-as-you-go: USD 4/M input, USD 0.20/M cached input, USD 20/M output; no long-context premium; Contributor mode unavailable for Muse Wonder on Model API | This is Meta's direct Model API quote, not Cursor's 300K routing window or a Muse Code subscription allowance. |
| Shared coding harness | Cursor [CursorBench 4.0](https://cursor.com/cursorbench) | Exact Sonnet 5.5 and Opus 5.5 configurations appear in one harness; Muse Wonder configurations also appear | Harness-specific rows are not a universal model ranking. The cited leaderboard does not include exact GPT-5.2, so Muse Wonder vs GPT-5.2 has no direct quality score. |
| Claude Opus 5.5 | Existing Anthropic [model overview](https://platform.claude.com/docs/en/models/opus-5-5/overview) | 1M context, USD 4/M input and USD 20/M output, long-running agentic work positioning | Existing model record is reused; no new Opus page is created. |
| GPT-5.2 | Existing OpenAI [model documentation](https://developers.openai.com/api/docs/models/gpt-5.2) | Existing 400K context and API price record | Existing model record is reused; no new GPT page is created. |

Published additions are exactly four pages: `/models/claude-sonnet-5-5`, `/compare/claude-sonnet-5-5-vs-claude-opus-5-5`, `/models/muse-wonder`, and `/compare/muse-wonder-vs-gpt-5-2`. No remaining candidate model is published.
