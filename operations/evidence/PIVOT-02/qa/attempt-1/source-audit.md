# PIVOT-02 independent source audit — attempt 1

Candidate: `71a9ae6fa310abc1b66ea37f2fc0579099c9844e`

Checked 2026-11-12 against model-owner, API-provider, and benchmark-owner pages.

Passing source samples:

- Qwen's official model cards support Qwen3.8-27B as an Apache-2.0 27B vision-language model with 262,144 native context, distinct from Qwen3-8B.
- Alibaba Model Studio supports the China (Beijing) CNY 3/12 price for Qwen3.8-27B and CNY 12/36 for Qwen3.8-2.4T-A95B, for requests up to 1M tokens.
- Alibaba's token-deployment page supports the Qwen3-8B Beijing custom-deployment non-thinking CNY 0.5/2 price and the CNY 5 thinking-output caveat.
- Z.ai's pricing page supports GLM-5 at USD 1/M input and USD 3.2/M output.
- Qwen, DeepSeek, Moonshot, MiniMax, OpenAI, Anthropic, Google, Z.ai, and Cursor sources are first-party/model-owner sources for the published candidate set and benchmark rows.
- Z.ai's GLM-5 release supports BrowseComp 62.0 and 75.9 with context management. Its footnote specifies retaining the latest five turns without context management and a discard-all strategy with context management.

Blocking mismatch:

- The rendered BrowseComp page does not show the date of the latest GLM-5 vendor report. The `2026-11-12` date in source metadata is only an access/check date, not the report date.
- Its configuration cells say only `Vendor evaluation` and `Vendor evaluation with context management`; they omit the source's material configuration detail (latest-five-turn retention versus discard-all context management).

The PIVOT-02 contract explicitly requires the latest vendor section to display both date and configuration. Therefore the source-backed scores themselves are valid, but the candidate does not satisfy the presentation/traceability acceptance requirement.
