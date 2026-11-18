# PIVOT-08 delivery record — 2026-11-18

## Implemented and independently accepted

Published exactly the six URLs in the [contract](../../contracts/PIVOT-08.md), plus its bounded existing pricing, GPT-5.2 and Claude/GPT corrections. Actual inventory: **51 unique sitemap URLs, 20 model profiles, 19 comparisons**. New profiles and comparisons link reciprocally. No new best/products/benchmark page, service, dependency, account, Stripe, database, migration or outreach work. No fabricated quality score or universal ranking.

Official source snapshots and hashes are in [source-index.json](source-index.json). Important corrections to the proposed copy: the >272K threshold changes the full request's input/cache rate to 2x and output to 1.5x; 400K uncached input +10K billed output costs $7.00/$1.75/$8.75 for Astra6.2/Sol6.2/Astra6 at Standard speed before other charges. Shared token caps are not evidence of equal quality. Work/Codex allowances are not generic ChatGPT web-message limits or API credits. Unknown release dates remain unknown, distinct from knowledge cutoffs and checked dates.

Before retargeting `/compare/claude-vs-gpt`, the controller inspected GSC Web search, October19–November15, query contains `claude`: no reported rows, zero displayed clicks/impressions. This does not establish zero demand or bypass reporting privacy/delay. The current pair is Opus5.5/GPT6.2Astra; the prior pair and its scores remain clearly historical.

Developer completed 12 bounded SSR/inventory checks, without a server or build. Independent QA preserved the initial candidate failure: `7cdd9247c6b6875768cdf27770e1c1588bf69cd5` had an extra title suffix. Original developer corrected only that title. [Exact candidate recheck](qa/recheck.json) accepted `7667cb34a5477d877e77daa6a5a366d9b697ba39`, reusing unaffected evidence. Original and corrected review reports are preserved, not replaced.

## Production release and enablement

- Release SHA: `7667cb34a5477d877e77daa6a5a366d9b697ba39`, pushed to `origin/main` and freshly fetched/exactly verified before deployment; production-related tree clean.
- One necessary production build/typecheck passed from that pushed commit. No migration or feature flag was required. No extra framework, full regression, live token spend or second build.
- Artifact SHA256: `8c8aec7b90b57f27d2aa5d89dfc2f164c9b010c2c1179d424d3ab70f6e28ac18`.
- Cloudflare version: `91e98e0f-a025-44ec-92ec-e7d5a5032f4f`; deployment command exited0.
- Independent [production acceptance](qa/production-final.json): **PASS, 50 checks, 13/13 authorized HTTP requests, all200**. Confirmed online at 2026-11-18T09:26:58.062Z–09:27:02.078Z (17:26:58–17:27:02 Asia/Shanghai), not a fabricated exact traffic-switch time.
- Original production diagnostics are preserved. Hydration comments/Flight duplicate text required offline assertion interpretation, not another HTTP run or a runtime fix. The 13-request budget is closed.
- No temporary local server, customer account or test asset was created. [Raw artifact index](raw-index.json) records retained response/deployment-log paths and hashes.

Implementation, production enablement and independent acceptance are complete. Historical formal JRN-04-FIX RELEASE_READY lock/control state is unchanged; this delivery record is not a formal CLI CLOSED transition.

## GSC and follow-up

Authenticated browser, property `sc-domain:pairvu.com`, November18 after production acceptance. Submitted the existing `https://pairvu.com/sitemap.xml` once; GSC displayed “已成功提交站点地图”. Its subsequently loaded detail displayed “无法读取此站点地图 / 常见 HTTP 错误1处”, last read November16 and43 discovered pages. No specific HTTP response code/root cause was exposed. The earlier production response was200 with51 unique URLs, but ordinary HTTP success does not establish Googlebot access or completed sitemap processing. **Submission delivered; sitemap ingestion remains unresolved.** No blind repeat submission, validate-fix action, extra HTTP test or security/runtime change was made.

All six URL inspections initially displayed “Google无法识别此网址”, not indexed, no last-crawl/referrer/canonical data. Each individual indexing request subsequently displayed **“已请求编入索引” and added to the priority crawl queue**:

| URL path | Request outcome | Indexed outcome at inspection |
|---|---|---|
| `/models/gpt-6-2-astra` | Confirmed | Not indexed / unknown to Google |
| `/models/gpt-6-2-sol` | Confirmed | Not indexed / unknown to Google |
| `/models/gpt-6-astra` | Confirmed | Not indexed / unknown to Google |
| `/compare/gpt-6-2-astra-vs-gpt-6-2-sol` | Confirmed | Not indexed / unknown to Google |
| `/compare/gpt-6-2-astra-vs-gpt-5-2` | Confirmed | Not indexed / unknown to Google |
| `/compare/gpt-6-2-astra-vs-gpt-6-astra` | Confirmed | Not indexed / unknown to Google |

No CAPTCHA bypass, login change, full51URL resurvey or claim that requests already caused indexing. Retained UI proof: `/private/tmp/pairvu-pivot08/gsc-sitemap-submitted.jpg`, `gsc-sitemap-http-error.jpg`, `gsc-sol-requested.jpg`, `gsc-astra6-requested.jpg`, `gsc-astra-sol-requested.jpg`. The last two confirmations were observed directly in the final browser snapshot. These are local evidence, not public repository screenshots containing account UI.

Existing app automation **`pairvu-gsc` / Pairvu GSC分批收录周报** updated through the automation action and read back from its existing config: same id, thread, ACTIVE status and weekly Wednesday10:00 Asia/Shanghai schedule; next run **2026-11-25**. No new task. Adds this November18 six-page batch, current51/20/19 inventory, production-confirmation threshold and affected existing-page recrawl observation. Preserves second-stage four-page priority, Haiku already-indexed ongoing observation and historical45-page baselines. Records the actual sitemap error for read-only follow-up; no automatic writes/fixes/security changes or expansion.

## Remaining items and explicit next action

1. **Automatic:** existing November25 GSC report checks sitemap read/error/discovery status, six new pages' discovery/crawl/index/canonical records, and changed pages' post-release crawl dates, while retaining earlier priorities. Depends on an authenticated browser/connection or a current user export; no session means PARTIAL and a concrete export request.
2. **Unresolved dependency:** Google has not yet demonstrated ingestion/indexing. Request acknowledgements do not establish it. If the sitemap HTTP error persists, report it and propose a separate bounded Google-fetch diagnosis; no speculative firewall/security/code change is authorized by this record.
3. **Not automatically proceeding:** further URLs, product comparisons, best pages, benchmark fabrication, scaled comparison publishing or backlink outreach.20models alone is not the expansion gate; current-batch indexing and impressions remain unverified. Unknown model release dates and unverified common-harness quality scores stay explicitly unknown.
4. Archive this completion, reviewer evidence and roadmap/registry changes in one docs-only commit and push; **no second production deployment**. Production remains the accepted runtime SHA above. No outstanding feature flag or migration enablement.
