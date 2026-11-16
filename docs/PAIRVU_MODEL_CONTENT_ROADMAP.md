# Pairvu model-content roadmap and evidence rules

This is the single current route into Pairvu model-content planning. Work advances one independently accepted and production-verified stage at a time; completing code for a later stage early is not allowed.

## Product boundary

Pairvu is a single-language English evidence-linked model comparison publication. It is not an API aggregator, paywall, model tool, CMS, crawler, live-FX service, arbitrary N-model comparator, or universal scoring system. Every material fact identifies the exact model version, owner source, access date, region, currency, and billing mode when relevant.

No published price means unknown, not free. Open weights do not imply a common open-source license. A direct quality score appears only when one source, one benchmark version, and one harness cover both exact versions. Display names may use natural search language, but each page has one canonical URL and no reverse duplicate.

## Current delivery — PIVOT-05 (completed 2026-11-16)

The previous A–D delivery is complete. The user has authorized exactly two further stages under [PIVOT-05](../operations/contracts/PIVOT-05.md), with independent fixed-commit acceptance and GitHub-first production verification after each stage. Stage 2 starts only after Stage 1 production acceptance.

1. **Stage 1, existing content only (43 URLs / 16 profiles / 15 pair comparisons):** verify four missing exact-model price/access states, Qwen3.5 context/region price tiers, and the Qwen3-8B LoRA deployment condition; repair Gemini 3.1 Pro Preview's exact source; apply the approved benchmarks hub metadata and explain the two existing benchmarks; repair quality evidence/limitations for Claude/GPT/Gemini exact-version pairs and align ChatGPT vs Gemini's title/H1 while preserving Preview and the existing URL. Correct affected hard-coded model counts and real substantial-update dates. No third benchmark merely to reach a count.
2. **Stage 2, exactly two new URLs (45 URLs / 17 profiles / 16 pair comparisons):** publish Claude Haiku 5.5 and its Opus 5.5 comparison together. Use verified release/context/model ID, conditional token pricing, same-configuration CursorBench evidence and source dates. Link the new pair bidirectionally and reuse relevant existing Anthropic profiles, including Sonnet. No invented speed figures or additional family comparison pages.

Approved hub Title: `LLM Benchmarks Explained: What Each Test Measures | Pairvu`; H1 `LLM benchmarks`; description: `Every LLM benchmark on Pairvu explained — what it measures, which exact model versions were tested, and when each result was published.` Unknown publication dates remain explicitly unknown and distinct from collection dates.

Approved ChatGPT/Gemini Title: `ChatGPT vs Gemini: GPT-5.2 vs Gemini 3.1 Pro Preview | Pairvu`; H1 `ChatGPT vs Gemini`. This compares specified model versions, not the consumer subscription products.

Approved Haiku model Title: `Claude Haiku 5.5: Pricing, Context and Release Facts | Pairvu`; H1 `Claude Haiku 5.5`; description: `Claude Haiku 5.5 price per million tokens, context window, release date and official sources — plus how it compares with Opus 5.5.` Comparison Title: `Claude Haiku 5.5 vs Opus 5.5: Pricing, Context and Benchmarks | Pairvu`; H1 `Claude Haiku 5.5 vs Opus 5.5`; description: `Compare Claude Haiku 5.5 and Opus 5.5 pricing, context windows and published benchmark results, with official sources and configuration notes.`

Missing current pricing does not establish a weights-only offering. Historical prices cannot masquerade as currently purchasable rates; later model prices cannot fill older version records. All new access dates reflect actual checks. Keep USD display with original currency and the existing dated static FX snapshot. Do not transplant Opus 5.5 or other Gemini results into Opus 4.5/GPT-5.2/Gemini 3.1 Pro Preview comparisons. Each new number needs a supporting source and exact configuration. No new benchmark, crawler, live-FX service, test framework, account/API/Stripe/customer change, or scaled page generation is authorized.

Existing observation tasks retain their schedules and read-only boundary. Add price conditions, exact-source drift, lifecycle status, and the two new URLs' own GSC release batch. Stage 1 edits do not reset first publication. The November 16 read-only GSC inspection subsequently checked all 45 URLs: 43 indexed, with the two Haiku URLs unknown to Google. See the dated GSC baseline below; indexing does not prove that today's edited content has been recrawled. With 17 profiles after Stage 2, scaling remains prohibited.

Stage 1 is implemented, independently accepted, deployed and production-verified on `a987739149a5794dc64bf839dc4744c4f311ca54` (Cloudflare `e21a5c25-9d16-4c99-9726-01504f3f9daf`). Inventory remains 43/16/15 with two benchmarks. Qwen3.5 has sourced Beijing conditional rates; DeepSeek-V3.2, Kimi K2.5 and MiniMax M2.1 current exact-model prices remain explicitly unconfirmed. The original local PARTIAL caused only by cleanup permission is retained alongside independent cleanup PASS. Stage 2 subsequently passed independent fixed-candidate and production acceptance on `c389517a570d1e4ed0fc4ace4b689b294bf0dd93` (Cloudflare `81c33d8e-2699-49d7-8926-93735b5f69a6`). The actual inventory is 45 sitemap URLs / 17 profiles / 16 comparisons / two benchmark detail pages, with zero orphan models. Its only new URLs are `/models/claude-haiku-5-5` and `/compare/claude-haiku-5-5-vs-claude-opus-5-5`, first published in production on 2026-11-16. No GSC indexing claim was made at production acceptance; the later read-only observation is recorded separately below. See [PIVOT-05 completion and evidence](../operations/evidence/PIVOT-05/completion.md).

## Completed four-stage delivery history

### Stage A — foundation

- Repair `/best/open-source-models` title, description, H1, and opening paragraph for the approved target “open source LLMs,” while retaining license caveats and non-ranking language.
- Add `/models`; route Header, homepage, Footer, and every model profile back to the directory.
- Give six priority comparisons unique search-oriented metadata, H1, and an exact-version subtitle without “Which Wins” framing: Claude vs GPT, DeepSeek vs ChatGPT, ChatGPT vs Claude vs Gemini, GPT vs Gemini, Claude vs Gemini, and Fable vs Opus.
- Verify DeepSeek-V3.2, Kimi K2.5, MiniMax M2.1, and Qwen3.5-397B-A17B price status from their model-owner sources. If an exact-model hosted price is not established, say precisely that it is unknown and link the official weights/source; never substitute a successor price.
- Present “Qwen 4 Max Preview” naturally while preserving model ID `qwen4-max-preview`, canonical `/models/qwen-4-max-preview`, Token Plan-only access, no pay-as-you-go price, and the 2026-11-25 24:00 UTC+8 preview boundary.
- Expected inventory: 35 sitemap URLs, 14 model profiles, 9 comparison pages including the fixed three-model page.

Stage A acceptance requires the existing model-pivot check, typecheck, necessary build, targeted HTTP 200/metadata/canonical checks, unchanged legacy status behavior, fixed candidate SHA, independent QA on that SHA, and production verification. **Stage B cannot start before all of those gates pass.**

### Stage B — complete the internal-link network

Only add these comparisons: Kimi K2.5 vs DeepSeek-V3.2; MiniMax M2.1 vs GLM-5; Qwen3.8-2.4T-A95B vs Qwen3.8-27B; Qwen3.5-397B-A17B vs Qwen3.8-27B. Each page must cover parameters, modality, license/weights, access/deployment state, source-compatible quality evidence, and a pair-specific human recommendation. Expected inventory: 39 URLs, 14 models, 13 comparisons, with every model receiving at least one reasonable comparison inbound link.

Stage B depends on Stage A production verification and must independently prove no orphan model, bidirectional links, unique metadata/canonical, and no cross-harness score synthesis.

Stage A passed independent production acceptance on release `3e207dfc18aea85f14bf79ff2127bab6b01774f9` (Cloudflare `7027e158-cb0e-415e-a17b-6d567bef5fed`). Stage B subsequently passed fixed-SHA independent QA and production verification on release `baea0b1b2e0cc656605bdfa783a7644d6399481e` (Cloudflare `b61e69ae-9e1e-483c-9601-dca6e61372a9`). Its accepted inventory was exactly 39 URLs, 14 models, and 13 comparisons, with no orphan model.

### Stage C — benchmark depth, no new URL

Deepen `/benchmarks`, CursorBench, and BrowseComp with method, version, update date, coverage matrix, configuration, cost, and limitations. Keep BrowseComp’s benchmark-owner baseline separate from vendor reports. Improve high-value decision copy only where sources support it. Do not create a composite score or expand the URL inventory.

Stage C depends on Stage B production verification and independently verifies visible method/version/configuration, source traceability, and absence of composite or cross-harness ranking.

Stage C passed fixed-SHA independent QA and production verification on release `7daa548307ac3c21b33dbf6cfa03424ee1fb6258` (Cloudflare `1679090a-dc7d-466f-9736-8c3202a82431`). It kept 39 sitemap URLs, 14 model profiles, 13 comparison pages, and two benchmark detail pages. It added the owner-stated method, version/date, a catalog coverage matrix, exact configurations, owner-reported cost or an explicit “not reported” state, model/profile links, and limitations. BrowseComp’s 2025 owner baseline remains separate from Z.ai’s 2026 vendor report.

### Stage D — two evidence-backed model pairs

After official source verification, add a Sonnet 5.5 profile plus Opus 5.5 comparison, and a Muse Wonder profile plus GPT-5.2 comparison. Exact model ID, price, context, date, and preview boundary are required. If exact-model evidence cannot support both pages in a pair, publish neither. Expected inventory: 43 URLs, 16 models, 15 comparisons.

Stage D depends on Stage C production verification. The remaining four model candidates require a later sourcing decision and are not authorized by PIVOT-04. Coding best pages, new benchmarks, and 100–300 bulk comparisons also remain later decisions.

Stage D passed fixed-SHA independent QA and production verification on release `4aa3211de6adeda413d31d165b45cf4485085338` (Cloudflare `5d60ac49-d2d4-4cfe-a870-98df3440e2b5`). It added only the two contracted pairs: Claude Sonnet 5.5 with Opus 5.5, and Muse Wonder with GPT-5.2. The final production inventory is 43 sitemap URLs, 16 model profiles, and 15 comparison pages, with no orphan model; all 43 URLs returned 200. Anthropic supplies Sonnet 5.5's exact launch date, ID, 1M context and USD pricing. Meta supplies Muse Wonder's 2026-10-12 launch, exact ID, 1,048,576-token context, preview status, Model API availability, and Standard-mode USD pricing. Muse Wonder is not conflated with Muse Wonder Full, and max reasoning effort is not presented as the Full variant.

## Evidence, acceptance, and release rules

For every stage: freeze the page list and owner sources; run only the existing focused inventory/type checks plus one necessary build and targeted HTTP; stop temporary services; create a fixed candidate commit; obtain independent QA on that exact SHA; then follow GitHub-first push, fetch/exact-SHA verification, same-SHA deployment, and targeted production verification. A local PASS is never a production PASS. Accounts, Stripe, APIs, customer data, GSC writes, migrations, bulk generation, and new test frameworks are outside this roadmap.

Legacy routing remains invariant: `/guides` with or without slash returns 410; `/examples` redirects once to `/`; `/checks` redirects once to `/leaderboard`; unknown paths return 404; health returns 200.

## Controlled expansion gate

Do not evaluate scaled comparison publishing until all conditions hold simultaneously: at least 20 sourced model profiles; every model has a reasonable comparison inbound link; each stable GSC release batch has at least 80% indexing; there is no concentrated canonical, soft-404, or crawled-not-indexed problem; and pages show real impressions. Without connected GSC data or a current manual export, the indexing gate is BLOCKED and the decision is **do not scale**.

## GSC batches and observation cadence

Track first launch, PIVOT-02, PIVOT-03, Stage A, Stage B, Stage D, and PIVOT-05's Haiku pair as separate batches. Edits to existing URLs must not reset their original first-published date.

- `pairvu-2`, Mondays 09:30 Asia/Shanghai: read-only official source, model availability, broken-link, orphan, sitemap, and status-code health report.
- `pairvu-gsc`, Wednesdays 10:00 Asia/Shanghai, next November 18: batch-level submitted/indexed/crawled/canonical/soft-404/impression report. Prioritize the Haiku pair's discovery, crawl and indexing, then compare today's edited pages' crawl dates against the November 16 baseline below. Without a GSC connection, request a manual export and do not infer results.
- `pairvu-3`, monthly on day 1 at 10:30: model count, per-model comparison coverage, staleness, batch indexing, and expansion-gate decision. Any unmet condition means **do not scale**.
- `qwen4-preview`, 2026-11-26 09:00: verify post-preview availability. Until the documented 2026-11-25 24:00 UTC+8 boundary, do not call it retired. After verification, preserve its URL and links, mark the historical preview accurately, and remove it from current recommendations where applicable.

These are existing read-only observation tasks. Do not create duplicates, add pages, or publish automatically from an observation run.

All four existing tasks were updated through the Automations action and confirmed ACTIVE on 2026-11-15. The next scheduled checks are content on November 16, GSC on November 18, preview availability on November 26, and monthly review on December 1, in Asia/Shanghai. Reports identify evidence, changes, blockers, and the smallest follow-up; scheduled observation does not authorize code changes or deployment.

## PIVOT-04 dependency record (historical)

PIVOT-04 stages A–D are implemented, deployed, publicly enabled, and independently production-accepted. See [completion and release evidence](../operations/evidence/PIVOT-04/completion.md). Historical `JRN-04-FIX` remains `RELEASE_READY`, so the formal control CLI cannot safely claim this runtime unit; the registry records actual candidates and evidence without altering or deleting the historical lock/state. This is an administrative state limitation, not a claim that the formal unit is CLOSED.

Next actions: the existing read-only checks run automatically on their schedules. GSC submission and indexing conclusions require a connected property or current user export; they remain BLOCKED without it. The remaining four models require a later evidence-and-demand selection, not automatic development to meet a count. With 16 models and no verified GSC indexing data, the decision remains **do not scale**. No additional development or deployment proceeds automatically from this completed delivery.

## Current dependencies and next action after PIVOT-05

Implementation, both independent candidate acceptances, GitHub-first deployment, public enablement, and both independent production acceptances are complete. No temporary server or test account/production asset remains. Existing monitoring was updated through Automations and read back ACTIVE; the preview reminder was preserved. Next checks in Asia/Shanghai: GSC November 18 10:00, content November 23 09:30, Qwen4 November 26 09:00, monthly review December 1 10:30. These read-only reports proceed automatically; none authorizes further code or deployment.

The three older exact-model current API quotes remain unconfirmed; source/access/lifecycle distinctions are published rather than invented rates. The November 16 per-URL GSC inspection now establishes 43 indexed URLs out of 45; all six pre-Haiku batches are fully indexed. Haiku discovery/indexing, recrawl of edited content, and current impressions remain observation items. Recover a property session or request the specified exports if unavailable. Scaling remains prohibited with 17 models; passing the historical-batch indexing threshold alone does not meet all expansion gates. The pre-existing Chinese-models best-page sentence was recorded as a separate copy follow-up and was subsequently resolved by PIVOT-06-COPY; it was not folded into PIVOT-05. Historical JRN-04-FIX formal control state remains unchanged.

## GSC observation baseline — 2026-11-16

Read-only Chrome GSC inspection, 14:18–14:25 Asia/Shanghai, resource `sc-domain:pairvu.com`, verified-owner access with no login required. All 45 unique URLs were checked individually using Google's indexed-version records, not live URL tests or HTTP status as a proxy. **43/45 indexed (95.6%); all 43 pre-Haiku URLs indexed (100%).** The [45-row baseline CSV](../operations/evidence/PIVOT-05/gsc-2026-11-16.csv) records batch, first publication, status, crawl date, crawl/index permission, sitemap and canonical evidence. Original browser records remain under `/private/tmp/pairvu-gsc-45-2026-11-16/`; the CSV is the repository baseline for subsequent comparisons.

| First production date | Batch | Indexed / URLs |
|---|---|---:|
| 2026-11-11 | First launch | 16/16 |
| 2026-11-12 | PIVOT-02 | 10/10 |
| 2026-11-12 | PIVOT-03 | 8/8 |
| 2026-11-15 | PIVOT-04 A | 1/1 |
| 2026-11-15 | PIVOT-04 B | 4/4 |
| 2026-11-15 | PIVOT-04 D | 4/4 |
| 2026-11-16 | PIVOT-05 Haiku | 0/2 |

The Haiku URLs are `/models/claude-haiku-5-5` and `/compare/claude-haiku-5-5-vs-claude-opus-5-5`. Both report “Google 无法识别此网址”, no referring sitemap or page, and no applicable crawl/canonical data. They are not reported as crawled-not-indexed; this observation alone does not establish a technical fault. The first batch includes reused homepage/privacy URLs. Content-only stages add no batch and do not reset publication dates.

The sitemap list reports success, submitted/read November 16, with 43 discovered pages. Discovery count is not indexed count, and its difference from 45 does not identify individual URLs by itself. The coverage report is dated November 13: all-known totals 86 indexed/36 excluded; sitemap-filtered totals 57/10 still include historical URLs and must not replace this 45-URL denominator. All 43 indexed URLs show successful crawl, allowed crawling/indexing, self-declared canonicals and Google's canonical as the inspected URL. The homepage's sitemap detail alone shows a temporary processing error, while its crawl succeeded November 16 and the sitemap list is successful; retain this as an observation, not a sitewide failure claim. Click/impression/query data was not inspected in this run and remains unverified.

November 18 priorities, retaining the existing Wednesday 10:00 schedule:

1. Inspect each Haiku URL separately for discovery/referring sitemap, last crawl, fetch and indexing permission, indexed status/reason, and both canonicals; compare against this baseline and report changes or continued absence of data.
2. Compare crawl dates for November 16's edited/shared-rendering pages against the CSV, prioritizing `/best/chinese-models`, `/llm-pricing`, `/benchmarks`, the two benchmark details, the three Claude/GPT/Gemini comparisons, and the affected Qwen3-8B, Qwen3.5, DeepSeek, Kimi, MiniMax and Gemini model profiles. Use existing GSC reports/exports for the remaining affected pages; identify any uninspected dates as PARTIAL rather than expanding into HTTP or content regression tests.
3. In particular, `/best/chinese-models` last crawled November 12 23:53:25; `/llm-pricing` November 13 10:25:24; `/benchmarks` November 13 17:10:17. Three priority pair comparisons also last crawled November 13. Report old/new crawl dates separately from indexed status. A later crawl is not proof that a particular revised sentence is in Google's indexed HTML; do not claim that without inspecting that evidence. Dates above retain the GSC display timezone.
4. Read sitemap status/read date/discovered count and coverage-report freshness; retain existing batch and performance reporting with explicit windows and denominators. Explain lag, unknowns, changes and the smallest follow-up. No automatic expansion decision from the 95.6% figure.

These observations authorize only documents and the existing task prompt to be updated. No new task, code, tests, production release, sitemap submission, indexing request or validation action is authorized. The next read-only report proceeds automatically November 18, dependent on an accessible GSC session or current export; login is handed to the user if required.

## Completed single-copy follow-up — PIVOT-06-COPY

The user authorized only the stale Qwen3.5 sentence in `/best/chinese-models` to be replaced with a link to the existing Pairvu model profile. No other runtime content, metadata, dates, data, URL inventory or product boundary is changed. Acceptance is limited to the fixed-commit single diff and target SSR, followed by exact-release health, the target page and the existing profile in production. No extra local build, full suite, local server, GSC or automation work is authorized. Implemented, independently accepted, pushed and production-verified on `c22500662b53823510e60f9debe25ac0ab9933b2` (Cloudflare `1c6ff4b8-8d96-4a89-a01d-90d425df76e6`). The target list item now links to `/models/qwen3-5-397b-a17b` and no longer says no profile is published. Candidate verification used only the exact diff and target SSR; production verification made three HTTP requests (health, the target page, and its existing profile), all 200. Eight candidates, original official sources and metadata/date are preserved. No service or test asset was created. See [the scoped contract](../operations/contracts/PIVOT-06-COPY.md), [independent production acceptance](../operations/evidence/PIVOT-06-COPY/production-original.json), and [release record](../operations/evidence/PIVOT-06-COPY/release-record.json). This follow-up is complete; existing read-only observation proceeds automatically, with no further development/deployment or user action required.
