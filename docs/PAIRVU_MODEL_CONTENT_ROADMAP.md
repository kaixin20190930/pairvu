# Pairvu model-content roadmap and evidence rules

This is the single current route into Pairvu model-content planning. Work advances one independently accepted and production-verified stage at a time; completing code for a later stage early is not allowed.

## Product boundary

Pairvu is a single-language English evidence-linked model comparison publication. It is not an API aggregator, paywall, model tool, CMS, crawler, live-FX service, arbitrary N-model comparator, or universal scoring system. Every material fact identifies the exact model version, owner source, access date, region, currency, and billing mode when relevant.

No published price means unknown, not free. Open weights do not imply a common open-source license. A direct quality score appears only when one source, one benchmark version, and one harness cover both exact versions. Display names may use natural search language, but each page has one canonical URL and no reverse duplicate.

## Four-stage delivery plan

### Stage A — foundation (current PIVOT-04 scope)

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

Stage A passed independent production acceptance on release `3e207dfc18aea85f14bf79ff2127bab6b01774f9` (Cloudflare `7027e158-cb0e-415e-a17b-6d567bef5fed`), so Stage B development is now authorized. The Stage B implementation contains exactly the four named comparisons, 39 sitemap URLs, 14 models, and 13 comparison pages; every model now has at least one comparison inbound link. This is a development result only until fixed-SHA QA and production verification pass. Stage C remains blocked.

### Stage C — benchmark depth, no new URL

Deepen `/benchmarks`, CursorBench, and BrowseComp with method, version, update date, coverage matrix, configuration, cost, and limitations. Keep BrowseComp’s benchmark-owner baseline separate from vendor reports. Improve high-value decision copy only where sources support it. Do not create a composite score or expand the URL inventory.

Stage C depends on Stage B production verification and independently verifies visible method/version/configuration, source traceability, and absence of composite or cross-harness ranking.

Stage B passed independent production acceptance on release `baea0b1b2e0cc656605bdfa783a7644d6399481e` (Cloudflare `b61e69ae-9e1e-483c-9601-dca6e61372a9`), so Stage C development is authorized. Stage C keeps the inventory at 39 sitemap URLs, 14 model profiles, 13 comparison pages, and two benchmark detail pages. It adds the owner-stated method, version/date, a catalog coverage matrix, exact configurations, owner-reported cost or an explicit “not reported” state, model/profile links, and limitations. BrowseComp’s 2025 owner baseline remains separate from Z.ai’s 2026 vendor report. This remains a development result until fixed-SHA QA and production verification pass; Stage D remains blocked.

### Stage D — two evidence-backed model pairs

After official source verification, add a Sonnet 5.5 profile plus Opus 5.5 comparison, and a Muse Wonder profile plus GPT-5.2 comparison. Exact model ID, price, context, date, and preview boundary are required. If exact-model evidence cannot support both pages in a pair, publish neither. Expected inventory: 43 URLs, 16 models, 15 comparisons.

Stage D depends on Stage C production verification. The remaining four model candidates require a later sourcing decision and are not authorized by PIVOT-04. Coding best pages, new benchmarks, and 100–300 bulk comparisons also remain later decisions.

Stage C passed independent production acceptance on release `7daa548307ac3c21b33dbf6cfa03424ee1fb6258` (Cloudflare `1679090a-dc7d-466f-9736-8c3202a82431`), so Stage D development is authorized. The Stage D implementation adds only the two contracted pairs: Claude Sonnet 5.5 with Opus 5.5, and Muse Wonder with GPT-5.2. Inventory is 43 sitemap URLs, 16 model profiles, and 15 comparison pages, with no orphan model. Anthropic supplies Sonnet 5.5's exact launch date, ID, 1M context and USD pricing. Meta supplies Muse Wonder's 2026-10-12 launch, exact ID, 1,048,576-token context, preview status, Model API availability, and Standard-mode USD pricing. Muse Wonder is not conflated with Muse Wonder Full, and max reasoning effort is not presented as the Full variant. This remains a development result until fixed-SHA QA and production verification pass.

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

## Current dependency record

Stage A runs under PIVOT-04. Historical `JRN-04-FIX` remains `RELEASE_READY`, so the formal control CLI cannot safely claim this runtime unit; record candidates and evidence in the registry without altering or deleting the historical lock/state. The developer role actually inherits GPT-6.1 Sol/high; if source evidence is insufficient, reduce the claim or stop that item rather than expanding collection architecture.
