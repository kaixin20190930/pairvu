# Pairvu model-content roadmap and evidence rules

This is the single current route into Pairvu model-content planning. Work advances one independently accepted and production-verified stage at a time; completing code for a later stage early is not allowed.

## Product boundary

Pairvu is a single-language English evidence-linked model comparison publication. It is not an API aggregator, paywall, model tool, CMS, crawler, live-FX service, arbitrary N-model comparator, or universal scoring system. Every material fact identifies the exact model version, owner source, access date, region, currency, and billing mode when relevant.

No published price means unknown, not free. Open weights do not imply a common open-source license. A direct quality score appears only when one source, one benchmark version, and one harness cover both exact versions. Display names may use natural search language, but each page has one canonical URL and no reverse duplicate.

## Current authorized delivery — PIVOT-05 (2026-11-16)

The previous A–D delivery is complete. The user has authorized exactly two further stages under [PIVOT-05](../operations/contracts/PIVOT-05.md), with independent fixed-commit acceptance and GitHub-first production verification after each stage. Stage 2 starts only after Stage 1 production acceptance.

1. **Stage 1, existing content only (43 URLs / 16 profiles / 15 pair comparisons):** verify four missing exact-model price/access states, Qwen3.5 context/region price tiers, and the Qwen3-8B LoRA deployment condition; repair Gemini 3.1 Pro Preview's exact source; apply the approved benchmarks hub metadata and explain the two existing benchmarks; repair quality evidence/limitations for Claude/GPT/Gemini exact-version pairs and align ChatGPT vs Gemini's title/H1 while preserving Preview and the existing URL. Correct affected hard-coded model counts and real substantial-update dates. No third benchmark merely to reach a count.
2. **Stage 2, exactly two new URLs (45 URLs / 17 profiles / 16 pair comparisons):** publish Claude Haiku 5.5 and its Opus 5.5 comparison together. Use verified release/context/model ID, conditional token pricing, same-configuration CursorBench evidence and source dates. Link the new pair bidirectionally and reuse relevant existing Anthropic profiles, including Sonnet. No invented speed figures or additional family comparison pages.

Approved hub Title: `LLM Benchmarks Explained: What Each Test Measures | Pairvu`; H1 `LLM benchmarks`; description: `Every LLM benchmark on Pairvu explained — what it measures, which exact model versions were tested, and when each result was published.` Unknown publication dates remain explicitly unknown and distinct from collection dates.

Approved ChatGPT/Gemini Title: `ChatGPT vs Gemini: GPT-5.2 vs Gemini 3.1 Pro Preview | Pairvu`; H1 `ChatGPT vs Gemini`. This compares specified model versions, not the consumer subscription products.

Approved Haiku model Title: `Claude Haiku 5.5: Pricing, Context and Release Facts | Pairvu`; H1 `Claude Haiku 5.5`; description: `Claude Haiku 5.5 price per million tokens, context window, release date and official sources — plus how it compares with Opus 5.5.` Comparison Title: `Claude Haiku 5.5 vs Opus 5.5: Pricing, Context and Benchmarks | Pairvu`; H1 `Claude Haiku 5.5 vs Opus 5.5`; description: `Compare Claude Haiku 5.5 and Opus 5.5 pricing, context windows and published benchmark results, with official sources and configuration notes.`

Missing current pricing does not establish a weights-only offering. Historical prices cannot masquerade as currently purchasable rates; later model prices cannot fill older version records. All new access dates reflect actual checks. Keep USD display with original currency and the existing dated static FX snapshot. Do not transplant Opus 5.5 or other Gemini results into Opus 4.5/GPT-5.2/Gemini 3.1 Pro Preview comparisons. Each new number needs a supporting source and exact configuration. No new benchmark, crawler, live-FX service, test framework, account/API/Stripe/customer change, or scaled page generation is authorized.

Existing observation tasks retain their schedules and read-only boundary. Add price conditions, exact-source drift, lifecycle status, and the two new URLs' own GSC release batch. Stage 1 edits do not reset first publication. November 16 GSC property-owner access and sitemap submission were observed; stale November 9 legacy indexing reports do not establish indexing for the current release. Per-URL batch inspection remains PARTIAL until fresh evidence is available. With 17 profiles after Stage 2, scaling remains prohibited.

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

Track first launch, PIVOT-02, PIVOT-03, Stage A, Stage B, and Stage D as separate batches. Stage A edits existing URLs and must not reset their original first-published date.

- `pairvu-2`, Mondays 09:30 Asia/Shanghai: read-only official source, model availability, broken-link, orphan, sitemap, and status-code health report.
- `pairvu-gsc`, Wednesdays 10:00: batch-level submitted/indexed/crawled/canonical/soft-404/impression report. Without a GSC connection, request a manual export and do not infer results.
- `pairvu-3`, monthly on day 1 at 10:30: model count, per-model comparison coverage, staleness, batch indexing, and expansion-gate decision. Any unmet condition means **do not scale**.
- `qwen4-preview`, 2026-11-26 09:00: verify post-preview availability. Until the documented 2026-11-25 24:00 UTC+8 boundary, do not call it retired. After verification, preserve its URL and links, mark the historical preview accurately, and remove it from current recommendations where applicable.

These are existing read-only observation tasks. Do not create duplicates, add pages, or publish automatically from an observation run.

All four existing tasks were updated through the Automations action and confirmed ACTIVE on 2026-11-15. The next scheduled checks are content on November 16, GSC on November 18, preview availability on November 26, and monthly review on December 1, in Asia/Shanghai. Reports identify evidence, changes, blockers, and the smallest follow-up; scheduled observation does not authorize code changes or deployment.

## Current dependency record

PIVOT-04 stages A–D are implemented, deployed, publicly enabled, and independently production-accepted. See [completion and release evidence](../operations/evidence/PIVOT-04/completion.md). Historical `JRN-04-FIX` remains `RELEASE_READY`, so the formal control CLI cannot safely claim this runtime unit; the registry records actual candidates and evidence without altering or deleting the historical lock/state. This is an administrative state limitation, not a claim that the formal unit is CLOSED.

Next actions: the existing read-only checks run automatically on their schedules. GSC submission and indexing conclusions require a connected property or current user export; they remain BLOCKED without it. The remaining four models require a later evidence-and-demand selection, not automatic development to meet a count. With 16 models and no verified GSC indexing data, the decision remains **do not scale**. No additional development or deployment proceeds automatically from this completed delivery.
