# PIVOT-04 Stage C source and coverage inventory

Checked 2026-11-15. Only benchmark-owner and model-owner sources are used.

| Page | Source | Supported fields | Coverage boundary |
|---|---|---|---|
| `/benchmarks` and `/benchmarks/cursorbench` | Cursor, [CursorBench 4.0](https://cursor.com/cursorbench) | Version 4.0; ambiguous multi-file tasks from real Cursor sessions; named effort configurations; score and run cost | Pairvu displays three owner-leaderboard rows from the 2026-11-12 snapshot, not the full leaderboard. Harness, effort, budget, and variance remain part of the result. |
| `/benchmarks` and `/benchmarks/browsecomp` | OpenAI, [BrowseComp release and paper](https://openai.com/index/browsecomp/) | 2025-04-10 release; 1,266 short-answer browsing tasks; four owner baseline rows; method and limitations | The owner release does not report run cost for the displayed rows. The 51.5% Deep Research result is not labelled as a 64-trial aggregate. |
| `/benchmarks/browsecomp` | Z.ai, [GLM-5 release](https://z.ai/blog/glm-5) | 2026-02-12 report; GLM-5 62.0; GLM-5 with context management 75.9; no-CM last-five-turn and CM discard-all configurations | Vendor-reported results remain in a separate table and are not merged with the 2025 owner baseline. The vendor post does not report run cost for these rows. |

No composite score, cross-harness ranking, new model, new comparison, new benchmark, or new URL is introduced. Inventory remains 39 sitemap URLs, 14 models, 13 comparison pages, and two benchmark detail pages.
