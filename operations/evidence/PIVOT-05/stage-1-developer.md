# PIVOT-05 stage 1 developer handoff

2026-11-16. Developer scope only; independent acceptance and production verification are pending. No stage 2 implementation, push, deployment, migration, account, customer, GSC, or automation writes were performed by this role.

## Candidate and build binding

The candidate is the Git commit containing this report; the exact SHA is returned in the controller handoff. Build-time HEAD was `80cf4833eb52876f4784a7bb529984abf7e25c47`, with the stage 1 application changes in the working tree. The successful local build contains those changes; no application files changed between build and candidate commit. Local `.next/required-server-files.json` and `/api/health` explicitly report `buildSha: unknown` and platform version `unknown`, not the candidate SHA. This is local functional evidence only. QA can compare the candidate's application blobs with the current tree before reusing the service. Production must rebuild the exact pushed release SHA through the release script.

## Implementation

- Four old-model pricing/access records separate hosted access from self-hosted weights. DeepSeek-V3.2 and MiniMax M2.1 have historically documented APIs, but their currently purchasable exact-model API status and rate remain unconfirmed. No successor price or weights-only inference is published.
- Kimi K2.5 follows the K2 notice: newly registered users lose access from 2026-10-31, existing users are unaffected, retirement is planned by end of December 2026. The exact current token price remains unconfirmed, not free, and the model is not labeled already retired.
- Qwen3.5-397B-A17B publishes only the verified China (Beijing) standard API tiers: input <=128K CNY 1.2/7.2 per million input/output tokens; input >128K through 256K CNY 3/18. Both thinking and non-thinking output rates match. At the unchanged 2026-11-06 static rate of 6.676 CNY/USD, display values are USD 0.18/1.08 and 0.45/2.70. Tier boundaries use decimal K; the native weights context is distinct. Token-based Qwen3-8B deployment requires a LoRA-fine-tuned custom model; its first quote remains Beijing non-thinking, with thinking mode and platform restrictions explained.
- Gemini 3.1 Pro Preview now links exact-model documentation, its specific pricing section, and its dated launch. Model ID, 1,048,576 input context, preview status, and both Standard API prompt-length tiers are explicit. ChatGPT vs Gemini uses the approved title/H1 and limits its scope to the named API models.
- The three Claude/GPT/Gemini pairs describe exact-version owner evaluations and their dates/configurations, with no numeric quality score juxtaposition. SWE-Bench Pro, SWE-bench Verified, BrowseComp-Plus, and ARC-AGI-2 are named as reported evidence, not new Pairvu benchmark pages. Opus 5.5 and Gemini 4 scores are explicitly excluded from those old-version conclusions.
- The benchmarks hub uses the approved TDK and explains the two existing tests, coverage, configuration, cost, dates, and limits. CursorBench version release is distinct from snapshot collection and unknown individual result publication dates. Existing baseline/vendor BrowseComp tables stay separate. Detail catalog counts use the real model count.
- Pricing text now retains region/mode in every table. Models show numeric-quote notes and comparisons show every existing quote so second tiers remain visible. Source access dates are attached to the actual newly verified sources; reused sources retain their earlier dates. The first-quote matrix convention is explained on the pricing page.
- Actual substantive-update dates cover shared rendering changes: 40 sitemap entries use 2026-11-16, unchanged comparison index retains stage D's 2026-11-15, and privacy/legacy retain 2026-11-12. First-publication history is untouched. Inventory remains 43 URLs / 16 models / 15 comparisons.

## Official source checks

All sources below were opened through the browser on 2026-11-16; the linked content supports the listed facts. Unknown current prices are an explicit evidence gap, not an inferred number.

| Source | Observed support / boundary |
| --- | --- |
| [Alibaba model pricing](https://help.aliyun.com/en/model-studio/model-pricing) | Exact qwen3.5-397b-a17b Beijing rows and both input-length tiers; standard CNY/M units; thinking/non-thinking columns; tier applies to whole request. Other regions were observed but not published in this stage. |
| [Alibaba token-based deployment](https://help.aliyun.com/en/model-studio/model-deployment-token) | Only supported LoRA custom models after efficient SFT; Beijing Qwen3-8B input CNY 0.5/M and output CNY 2/M non-thinking or 5/M thinking; fixed platform throughput/concurrency/speed. |
| [Kimi pricing/lifecycle](https://platform.kimi.ai/docs/pricing/chat) | Old Moonshot URL redirects here. K2 eligibility dates and planned retirement are explicit. Readable source did not establish a verified current K2.5-specific numeric token rate. |
| [DeepSeek current API documentation](https://api-docs.deepseek.com/quick_start/pricing) | The pricing link currently renders API setup with newer exact model names and alias caveats; it does not establish V3.2's current API price or availability. |
| [DeepSeek-V3.2 historical launch](https://api-docs.deepseek.com/news/news251201/) and [release](https://www.deepseek.com/en/news/deepseek-v3-2/) | December 2025 API offering and open weights; historical launch access does not prove current exact-model API access. No historical number is promoted to a current quote. |
| [MiniMax current pricing](https://platform.minimax.io/docs/pricing/overview) and [M2.1 release](https://www.minimax.io/news/minimax-m21) | Current table lists newer models and no M2.1 exact quote; 2025-12-23 release links API access. The initially tried `/docs/pricing/pay-as-you-go` returned 404; the official legacy pricing guide redirected to the current overview used in the catalog. |
| [Google exact model](https://aistudio.google.com/docs/models/gemini-3.1-pro-preview) and [specific pricing](https://aistudio.google.com/docs/pricing#gemini-3.1-pro-preview) | Old ai.google.dev URLs redirect to AI Studio. Exact preview code, input context, modality, and Standard API USD 2/12 <=200K or 4/18 >200K, output including thinking tokens. No later Gemini replacement is cited. |
| [Google 3.1 launch](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-pro/) | 2026-02-19 preview launch; ARC-AGI-2 reasoning report and selected synthesis/code demos. No shared evaluation configuration with the other pair member is established. |
| [Anthropic Opus 4.5 launch](https://www.anthropic.com/news/claude-opus-4-5) | 2025-11-24 exact-version coding/search evidence and methodology: high effort, interleaved scratchpads, 200K context and five trials generally; per-benchmark thinking-budget exceptions. |
| [OpenAI GPT-5.2 launch](https://openai.com/index/introducing-gpt-5-2/) | 2025-12-11 exact gpt-5.2/Thinking mapping; software engineering and multi-step task evaluations; xhigh generally, heavy professional-evaluation exception, research environment caveat. |
| [CursorBench](https://cursor.com/cursorbench) | The three retained rows and costs match; changelog dates version 4.0 to 2026-09-10. Individual result publication dates are not assigned. The old exact versions in the three repaired pairs are not the displayed newer versions. |
| [BrowseComp original release](https://openai.com/index/browsecomp/) | 2025-04-10 benchmark-owner release and method; earlier baseline is distinct from GLM-5 vendor reporting. Unchanged GLM-5 evidence is reused from PIVOT-04, not claimed newly collected. |

## Actual validation

- `pnpm test:model-pivot`: PASS, exit 0, 16 models / 43 sitemap URLs / 15 comparisons / no orphan models. Existing script minimally updates verified-date/price expectations and asserts relevant boundaries.
- `pnpm typecheck`: PASS, exit 0.
- `pnpm build`: PASS, exit 0. Next.js 16.2.12; compile 5.0s, TypeScript 8.9s, static generation 696ms. One local build only. Existing middleware-deprecation and experimental-edge warnings remain non-blocking.
- `git diff --check`: PASS before handoff commit.
- `pnpm exec next start --hostname 127.0.0.1 --port 3215`: ready. Listener PID `29729`, tool session `49080`. Controller requested that this service be left running for independent QA reuse.
- HTTP checker: `/private/tmp/pivot05-stage1-http.py`; raw stdout: `/private/tmp/pivot05-stage1-http-result.json`. All 43 sitemap pages returned 200; all had one Title/H1/canonical with unique titles and self canonical. Root slash equivalence is normalized. No old directory URLs appeared. Target assertions passed for approved titles, unknown result dates, Qwen CNY/USD tiers and LoRA condition, Kimi lifecycle, and exact-version comparison evidence without percentages.
- Real routing: `/guides` and `/guides/` 410; `/examples` 301 directly to `/`; `/checks` 301 directly to `/leaderboard`; destinations 200; `/pivot05-unknown` 404; `/api/health` 200. No full business/account regression was run.
- Initial HTTP attempt stopped at `/` because the temporary probe required a trailing slash on its canonical. The existing root canonical omits it. Corrected that test assumption only; the subsequent check passed. The checker was run once more to retain raw stdout at the controller's request. No product fix or extra build resulted from this diagnostic.

No 15-minute environment/diagnostic stall occurred. Browser/network calls and the single build completed without a retry loop or external approval wait. Source-missing states were degraded to explicit unknown as contracted.

## Minimal QA reuse and cleanup

1. Bind the candidate SHA from the controller handoff. Inspect its diff against `80cf4833eb52876f4784a7bb529984abf7e25c47`; preserve controller-owned registry changes. Check `git diff -- <application paths>` is empty to confirm current application blobs match the candidate before reusing the local build.
2. Reuse `http://127.0.0.1:3215` and the raw HTTP result above; independently inspect the changed page content/source facts and key counterexamples. The optional existing temporary checker can be rerun with `python3 /private/tmp/pivot05-stage1-http.py`; no new test framework or server setup is required. Reuse existing PIVOT-04 account/unaffected route evidence as frozen in the contract.
3. After QA finishes, stop the temporary server with `kill 29729` (or interrupt session `49080`) and confirm port 3215 has no listener. No accounts, uploaded assets, database rows, or customer records were created; there is no data cleanup. Preserve this report and original raw result.

Non-blocking existing follow-up observed: `/best/chinese-models` still describes Qwen3.5 as lacking a profile even though the profile now exists. This pre-existing page text is outside this stage's allowed application edits and was reported to the controller; no extra scope was implemented.

Next action: controller dispatches the independent reviewer on the exact candidate commit. It can proceed automatically with the retained local service and source links. Deployment and public enablement are unchanged until controller release gates and independent production acceptance complete. Stage 2 waits for stage 1 production acceptance.
