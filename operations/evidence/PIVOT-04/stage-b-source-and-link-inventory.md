# PIVOT-04 Stage B source and link inventory

Stage B adds exactly four comparisons and no model records:

- Kimi K2.5 vs DeepSeek-V3.2 — Moonshot official Kimi model card and DeepSeek model-owner V3.2 release.
- MiniMax M2.1 vs GLM-5 — MiniMax official M2.1 release/engineering note and Z.ai GLM-5 release/model card.
- Qwen3.8-2.4T-A95B vs Qwen3.8-27B — the two official Qwen model cards plus Alibaba Model Studio pricing.
- Qwen3.5-397B-A17B vs Qwen3.8-27B — the two official Qwen model cards plus Alibaba Model Studio pricing for the hosted 27B model.

Exact URLs and access dates remain attached to each model record in `lib/models/catalog.ts`. The finite Stage B facts cover parameters, modality, license/weights, and access/deployment. No common exact-version harness was found for any of the four pairs, so no direct quality score is shown; each page says so and provides a pair-specific operational choice.

The shared comparison template now lists only other published comparisons that contain either participating exact model. Each new comparison links both model profiles, and model profiles derive their backlinks from the same comparison inventory. The final inventory is 14 models, 39 sitemap URLs, and 13 comparison pages including the fixed three-model page; all 14 models have at least one comparison inbound link.
