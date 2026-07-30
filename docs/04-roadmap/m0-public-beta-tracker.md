# M0 Public Beta Live Tracker

Last updated: 2026-07-30 (first public evidence and commerce workflow cluster implemented)

Overall release status: `NOT_READY_FOR_PUBLIC_BETA`

Current phase: `WEEK_2_HARDENING`

Next checkpoint: production release GO/NO-GO

Target limited public beta: 2026-08-10 to 2026-08-14, conditional

Target broader public beta: 2026-08-17 to 2026-08-23, conditional

Execution plan:

- [M0 Public Beta Launch Plan](m0-public-beta-launch-plan.md)
- [Founder MVP Checkpoint](founder-mvp-checkpoint-2026-07-28.md)

## 1. Current Product Decision

| Decision | Status | Evidence |
| --- | --- | --- |
| Core M0 technical hypothesis | `PASS` | Real 550 ml to 500 ml pair completed through OpenAI, QAEngine, RiskPolicy, persistence, and UI |
| M0 controlled policy infrastructure | `PASS` | 90 controlled cases; approved gates passed |
| Real-image behavior matrix | `DONE` | T01-T16 founder-reviewed and valid/correct after scoped prompt fixes through `m0-real-mvp-007` |
| Limited public beta | `NO_GO` | Feedback detail, key rotation, final guardrail evidence, and final production smoke remain |
| Broader public beta | `NO_GO` | Limited-beta evidence not yet available |

Formal M0 statement:

> M0 PASS - Core visual QA loop validated. Product launch readiness remains
> conditional on real behavior, public usability, telemetry, privacy, and
> operational gates.

## 2. Release Gate Status

| Gate | Status | Blocking items |
| --- | --- | --- |
| G0 Internal real analysis | `DONE` | None for the first controlled pair |
| G1 Limited public beta | `BLOCKED` | Feedback detail, production guardrail validation, key rotation, final release review |
| G2 Broader public beta | `BLOCKED` | G1 plus public usage evidence, SEO verification, operating stability |

## 3. Workstream Summary

| Workstream | Status | Done | Active | Blocked | Not started |
| --- | --- | ---: | ---: | ---: | ---: |
| PB-Q QA semantics/result integrity | `IN_PROGRESS` | 5 | 0 | 0 | 2 |
| PB-A Analytics/journey recording | `IN_PROGRESS` | 5 | 0 | 0 | 3 |
| PB-F Feedback/user learning | `IN_PROGRESS` | 1 | 0 | 0 | 5 |
| PB-P Privacy/security/cost controls | `IN_PROGRESS` | 8 | 0 | 0 | 0 |
| PB-T Testing | `IN_PROGRESS` | 5 | 1 | 0 | 3 |
| PB-S SEO/social acquisition | `IN_PROGRESS` | 4 | 0 | 0 | 2 |
| PB-O Production operations | `IN_PROGRESS` | 1 | 0 | 0 | 5 |
| Documentation/control | `DONE` | 5 | 0 | 0 | 0 |

Counts are task counts, not release-completion percentages.

## 4. Detailed Task Tracker

### QA Semantics And Result Integrity

| ID | Priority | Status | Owner | Dependency | Acceptance evidence |
| --- | --- | --- | --- | --- | --- |
| PB-Q01 | P0 | `DONE` | Engineering | None | `m0-real-mvp-007`; per-family boundaries, correspondence/occlusion gating, and independent crop coverage |
| PB-Q02 | P0 | `DONE` | Engineering | PB-Q01 | Real pair: visible_text mismatch; quantity match |
| PB-Q03 | P0 | `DONE` | Engineering | None | Real pair report category is null/generic CPG |
| PB-Q04 | P0 | `DONE` | Engineering | None | Real pair evidence visible=true; Verified requires sufficient observability |
| PB-Q05 | P0 | `NOT_STARTED` | Engineering | PB-T matrix findings | One underlying change renders as one user problem |
| PB-Q06 | P1 | `DONE` | Engineering | PB-Q01 | Real output uses `No meaningful visible difference detected` |
| PB-Q07 | P1 | `NOT_STARTED` | Engineering/Product | PB-Q04, PB-Q05 | Founder can understand result without enum field names |

### Analytics And Journey Recording

| ID | Priority | Status | Owner | Dependency | Acceptance evidence |
| --- | --- | --- | --- | --- | --- |
| PB-A01 | P0 | `DONE` | Engineering | None | Migration `0003` applied locally and in preview |
| PB-A02 | P0 | `DONE` | Engineering | PB-A01 | Valid/idempotent/rate-limited writes tested; invalid/server-only events rejected |
| PB-A03 | P0 | `DONE` | Engineering | PB-A01 | D1 shows start/complete and start/fail; failed record has no verdict |
| PB-A04 | P0 | `DONE` | Engineering | PB-A02 | One real session persisted the 11-event client/server journey in order |
| PB-A05 | P0 | `DONE` | Engineering | PB-A01 | First-touch and session UTM persisted through result and second-check events |
| PB-A06 | P1 | `NOT_STARTED` | Growth/Engineering | Consent/config decision | GA4 receives acquisition events without evidence data |
| PB-A07 | P1 | `NOT_STARTED` | Growth | Production domain | Search Console ownership and sitemap verified |
| PB-A08 | P1 | `NOT_STARTED` | Engineering/Product | PB-A03 to PB-A05 | Daily funnel/quality/cost report can be generated |

### Feedback And User Learning

| ID | Priority | Status | Owner | Dependency | Acceptance evidence |
| --- | --- | --- | --- | --- | --- |
| PB-F01 | P0 | `DONE` | Engineering | None | Correct, False alarm, Missed something persist in D1 |
| PB-F02 | P0 | `NOT_STARTED` | Engineering/Product | PB-Q05 | False alarm can target issue and reason |
| PB-F03 | P0 | `NOT_STARTED` | Engineering/Product | None | Missed family and optional comment persist |
| PB-F04 | P1 | `NOT_STARTED` | Product | PB-A01 | Post-result use case persists |
| PB-F05 | P1 | `NOT_STARTED` | Product/Engineering | Privacy copy | Explicit optional contact consent persists separately |
| PB-F06 | P1 | `NOT_STARTED` | Engineering/Product | PB-F02 to PB-F05 | Feedback report joins source, verdict, finding, model, and prompt |

### Privacy, Security, Abuse, And Cost

| ID | Priority | Status | Owner | Dependency | Acceptance evidence |
| --- | --- | --- | --- | --- | --- |
| PB-P01 | P0 | `DONE` | Engineering | None | 15-minute cron deleted original/normalized/thumbnail and tombstoned local D1 asset |
| PB-P02 | P0 | `DONE` | Engineering | PB-P01 | Real local R2 test plus `pnpm test:m0:retention` passed |
| PB-P03 | P0 | `DONE` | Product/Engineering | Final privacy copy | 24-hour/OpenAI disclosure shown before action; `/privacy` built |
| PB-P04 | P0 | `DONE` | Engineering | Session/access design | Wrong-session read/feedback/asset reuse rejected; owner read succeeds |
| PB-P05 | P0 | `DONE` | Engineering | None | Signature, decode, pixel, MIME, size and empty-file validation passed |
| PB-P06 | P0 | `DONE` | Engineering | Production Cloudflare config | Turnstile verification path, upload rate limits, and retryable 429/503 guardrails implemented and validated locally |
| PB-P07 | P0 | `DONE` | Engineering/Founder | Spend limits decision | Session/day/global caps and stop state are enforced with retry-after responses |
| PB-P08 | P1 | `DONE` | Engineering | PB-P01 | D1 deletion attempts record keys, start, success/failure, error and completion |

### Controlled And End-To-End Testing

| ID | Priority | Status | Owner | Dependency | Acceptance evidence |
| --- | --- | --- | --- | --- | --- |
| PB-T01 | P0 | `DONE` | Founder/Engineering | None | First real quantity/value pair reviewed |
| PB-T02 | P0 | `DONE` | Founder/Product | None | 16 local single-variable pairs and ground truth exist |
| PB-T03 | P0 | `DONE` | Engineering | PB-T02, PB-Q01 to PB-Q04 | T01-T16 founder-reviewed; final accepted runs match expected behavior |
| PB-T04 | P0 | `NOT_STARTED` | Engineering | PB-T03 | Four anchor cases, three runs each |
| PB-T05 | P0 | `IN_PROGRESS` | Engineering | Public-flow implementation | Idempotent create, refresh polling, and secure double-preview restoration verified; founder browser/mobile recheck pending |
| PB-T06 | P0 | `NOT_STARTED` | Engineering | PB-P01, PB-P04 to PB-P07 | Privacy/security/abuse test report |
| PB-T07 | P0 | `DONE` | Engineering | PB-A01 to PB-A05 | Local real-image journey and direct D1 event/attribution audit passed |
| PB-T08 | P1 | `DONE` | Founder | PB-T03, PB-T04 | Founder checkpoint documented; production recommendation is `NOT_READY_FOR_EARLY_USERS` |
| PB-T09 | P1 | `NOT_STARTED` | Engineering | All P0 fixes | Final regression report |

### SEO And Social Acquisition

| ID | Priority | Status | Owner | Dependency | Acceptance evidence |
| --- | --- | --- | --- | --- | --- |
| PB-S01 | P1 | `DONE` | Product/Growth | Public UX | Brand, market, product keyword, positioning, IA, and ownership accepted |
| PB-S02 | P1 | `DONE` | Product/Growth | SG technical foundation | Market pillar plus examples/guides/use-case hubs are implemented and pass local route inventory |
| PB-S03 | P1 | `DONE` | Product/Growth | PB-T fixtures | Logo, printed-value, and packaging-shape controlled case pages use founder-approved static assets without internal telemetry |
| PB-S04 | P0 | `DONE` | Engineering | Routes finalized | Cloudflare version `8e15c2bc-3a45-4322-b581-1c5e3aaccf41`; 13-route production sitemap, self-canonicals, static images, Googlebot, and OAI Search verified on `pairvu.com` |
| PB-S05 | P1 | `NOT_STARTED` | Growth | PB-A05 | UTM naming registry and launch links |
| PB-S06 | P1 | `NOT_STARTED` | Growth/Product | PB-S03 | Four evidence-based social creatives |

Detailed SEO/GEO tasks and statuses live in
[SEO And GEO Implementation Plan](seo-geo-implementation-plan.md). PB-S remains
the public-beta release summary and must not duplicate the detailed tracker.

### Production Operations

| ID | Priority | Status | Owner | Dependency | Acceptance evidence |
| --- | --- | --- | --- | --- | --- |
| PB-O01 | P0 | `DONE` | Engineering | Production environment | Production Worker, custom domain, D1, R2, OpenAI secret, migrations, cron, health, upload, analysis, and feedback path verified |
| PB-O02 | P0 | `NOT_STARTED` | Engineering | PB-A03, PB-P01, PB-P07 | Error, cost, and deletion alerts |
| PB-O03 | P0 | `NOT_STARTED` | Engineering/Product | PB-A08 | Daily launch report |
| PB-O04 | P0 | `NOT_STARTED` | Engineering | PB-P07 | New-analysis stop control |
| PB-O05 | P1 | `NOT_STARTED` | Founder/Engineering | PB-O03 | First-seven-days review checklist |
| PB-O06 | P1 | `NOT_STARTED` | Founder | Public data | Weekly keep/fix/defer decision log |

## 5. Current Evidence

### Controlled Infrastructure

- 90 controlled cases evaluated.
- Critical seeded-error recall: 100%.
- Critical false-pass rate: 0%.
- Hard-negative false-alarm rate: 0%.
- Not-observable handling accuracy: 100%.
- Verdict repeatability: 100%.
- Limitation: these were policy/infrastructure fixtures, not real OpenAI image
  accuracy measurements.

### First Real OpenAI Pair

Reference:

- product: Puremist Botanicals Nourishing Shampoo;
- visible capacity: 550 ml / 18.6 fl oz.

Candidate:

- same semantic brand/product;
- visible capacity: 500 ml / 16.9 fl oz.

Measured:

- verdict: FAIL;
- provider: OpenAI;
- model: `gpt-4.1-mini`;
- prompt: `m0-real-mvp-001`;
- OpenAI latency: 22,851 ms;
- recorded input tokens: 5,709;
- recorded output tokens: 1,464;
- estimated cost was not persisted.

Human review:

- core verdict: correct;
- visible-text finding: correct;
- logo, color, components, and major shape preservation: correct at M0 semantic level;
- duplicate quantity finding: incorrect check-family interpretation;
- UI visibility booleans: contradictory display bug;
- category: incorrectly hard-coded as packaged food;
- absolute exact/identical language: too strong.

### Prompt Boundary Regression

Report:

- `eval/real-m0/reports/real-pair-latest.json`

Command:

```bash
pnpm eval:m0:pair -- \
  --reference <reference-image> \
  --candidate <candidate-image> \
  --expected FAIL \
  --label capacity-value-change
```

Measured:

- verdict: FAIL;
- expected verdict matched: yes;
- prompt: `m0-real-mvp-002`;
- category: generic CPG (`null`);
- product issues: one `text_mismatch`;
- visible text: mismatch / value_changed / high;
- quantity: match / none / high;
- all four unchanged M0 families: match / high;
- all six checks: observable / sufficient;
- reference/candidate evidence visibility: true;
- limitations: none;
- OpenAI latency: 25,408 ms;
- total pair-runner latency: 25,409 ms;
- input tokens: 5,974;
- output tokens: 1,269;
- estimated cost: not yet calculated.

Verification:

- `pnpm typecheck`: passed;
- `pnpm lint`: passed;
- `pnpm run build`: passed;
- local browser upload/result flow: passed;
- local server restarted after `.dev.vars` prompt-version update.

### Local Public-Beta Journey

Report:

- `eval/real-m0/reports/local-journey-latest.json`

Measured:

- session: `959b0835-674f-48fd-9057-b9652f5777dd`;
- analysis: `ecfea16f-f121-4544-8cce-df8823f80b7b`;
- real OpenAI verdict: FAIL;
- prompt: `m0-real-mvp-002`;
- client/server product events: 11, in expected journey order;
- first-touch and session attribution: `local_verification / test / m0_public_beta`;
- feedback: `correct`, joined to the analysis;
- OpenAI latency: 20,611 ms;
- total analysis latency: 20,612 ms;
- estimated cost: null because reliable calculation is not configured.

Failure-path verification:

- missing reference asset returned HTTP 500;
- event sequence was `analysis_started -> analysis_failed`;
- persisted analysis status was `failed`;
- persisted verdict was null;
- error code was `reference_asset_missing`.

Analytics controls verified:

- client event names and payload sizes are schema validated;
- server-authoritative event names are rejected by the client endpoint;
- duplicate idempotency keys produce one event and one coherent attribution winner;
- client event writes are rate limited;
- analysis-linked client events require session ownership.

### T03/T04 Semantic Hardening

Observed real-case failures:

- T03 correctly failed on bottle shape, but `major_components` was incorrectly
  converted to `missing_component` even though both pumps were present.
- T03 also emitted a contradictory color issue while describing both bottles as
  amber brown.
- T04 changed orange logo/text accents to green, causing the same color change
  to leak into logo and visible-text findings.

Implemented:

- prompt version `m0-real-mvp-003`;
- RiskPolicy version `m0-risk-policy-003`;
- mismatch difference kinds are allow-listed by check family;
- invalid cross-family mismatch output becomes `provider_output_invalid`;
- `major_components` no longer falls back to `missing_component`;
- explicit prompt invariants separate part presence, shape, semantic package
  color, logo identity, and visible wording/value;
- internal provider/model/prompt telemetry is hidden from the public result UI.

Verification:

- targeted policy-boundary regression passed;
- 90/90 controlled cases passed all promotion gates;
- typecheck, lint, and production build passed.

Founder retest:

1. T03 rerun passed with one packaging mismatch, no missing component, no color
   issue, no limitation, and all five unchanged families verified.
2. T04 rerun passed with `REVIEW`, one high-confidence color issue, no
   limitations, and all five unchanged families verified.

### T05 Missing-Component False PASS

Observed:

- reference had a white trigger sprayer;
- candidate had a clearly exposed threaded/open bottle neck and no sprayer;
- provider returned `major_components = match/high`;
- provider evidence falsely claimed a candidate spray nozzle was visible;
- final verdict was `PASS`.

Classification:

- critical false PASS;
- Vision observation and evidence-grounding failure;
- not caused by RiskPolicy or issue mapping.

Implemented in `m0-real-mvp-004`:

- explicit REFERENCE/CANDIDATE labels around image inputs;
- `detail: high` for both OpenAI images;
- independent per-image component inventory;
- prohibition on component inference or copying;
- explicit exposed-threaded-neck/opening rule for missing attachment components.

Status:

- typecheck, lint, policy-boundary regression, build, and 90-case controlled
  evaluation passed;
- same-pair real OpenAI rerun returned `REVIEW` with one grounded
  `missing_component`;
- original critical false PASS is resolved;
- visible-text match carried an inconsistent `text_changed` difference kind;
  monitor recurrence during the remaining matrix.

### Anonymous Retention And Session Isolation

Automated report:

- `eval/real-m0/reports/retention-verification-latest.json`

Retention implementation:

- OpenNext custom worker exposes a Cloudflare `scheduled()` handler;
- cron schedule: every 15 minutes;
- expiry query is restricted to anonymous, non-deleted assets;
- original, normalized, and thumbnail R2 keys are deleted together;
- metadata is tombstoned only after R2 deletion succeeds;
- failed deletion remains eligible for retry;
- each attempt is queryable in `asset_deletion_attempts`.

Real local Cloudflare verification:

- cron summary: scanned 1, deleted 1, failed 0;
- original R2 key: unavailable;
- normalized R2 key: unavailable;
- thumbnail R2 key: unavailable;
- D1 asset status: deleted;
- deletion audit status: completed;
- OpenNext adapter build and Wrangler custom-worker dry run: passed.

Session-isolation verification:

- result read without session: HTTP 400;
- result read from wrong session: HTTP 404;
- result read from owning session: HTTP 200;
- feedback from wrong session: HTTP 404 and no D1 write;
- analysis attempt using another session's asset IDs: HTTP 404 before OpenAI;
- failed ownership attempts persist no product verdict.

Upload-hardening verification:

- command: `pnpm test:m0:upload-validation`;
- valid PNG and JPEG decode: passed;
- declared MIME/content mismatch: rejected;
- matching-signature but corrupt/truncated image: rejected;
- empty file: rejected;
- unsupported image type: rejected;
- decoded image pixel limit: enforced before R2 persistence;
- OpenNext production adapter build: passed;
- Wrangler custom-worker dry run: passed at 1,401.07 KiB gzip.

## 6. Active Blockers

| ID | Severity | Blocker | Required resolution |
| --- | --- | --- | --- |
| B-002 | P0 | Analytics migration is not applied in production | Apply PB-A01 through production deployment |
| B-003 | P0 | Public guardrails require final production release evidence | Complete PB-O04 and record production cap/Turnstile behavior |
| B-007 | P0 | OpenAI key was present in an example env file | Example sanitized; rotate the affected key before public beta |

## 7. Risks

| ID | Severity | Risk | Trigger | Mitigation |
| --- | --- | --- | --- | --- |
| R-001 | Critical | False PASS damages trust | Confirmed identity change returns PASS | Stop traffic; add fixture; fix and regress |
| R-002 | Critical | Anonymous assets survive retention | Expired R2 object remains accessible | Stop uploads; retry deletion; audit scope |
| R-003 | High | SEO traffic arrives before product is measurable | Indexing produces traffic before events/feedback are reliable | Allow slow indexing work; hold active distribution until attribution, feedback, and caps are release-ready |
| R-004 | High | OpenAI spend abuse | Rapid anonymous analysis growth | Turnstile, limits, caps, stop control |
| R-005 | High | Duplicate findings reduce trust | One change appears as multiple problems | Prompt boundary plus view consolidation |
| R-006 | High | Feedback data cannot explain quality | Feedback lacks issue/source/version join | Complete PB-F02/PB-F03/PB-F06 |
| R-007 | Medium | Existing Wikimedia fixtures confound changes | Different products trigger many families | Use local single-variable fixtures for G1 |
| R-008 | Medium | SEO pages become thin duplicates | Pages differ only by keyword | Require unique case and user intent |
| R-009 | High | Development credential may have been exposed | Real key appeared in `.dev.vars.example` | File sanitized; rotate key; keep real value only in ignored `.dev.vars` |
| R-010 | High | Refresh during analysis starts a second paid request | User reloads before synchronous POST returns | Stable Analysis ID, idempotency key, persisted recovery state, and ownership-protected polling |

## 8. Decision Log

| Date | Decision | Owner | Consequence |
| --- | --- | --- | --- |
| 2026-07-27 | M0 core technical hypothesis accepted | Founder | Stop debating basic feasibility; continue real behavior validation |
| 2026-07-27 | Do not redesign taxonomy/RiskPolicy from one case | Founder | Gather the controlled matrix before structural changes |
| 2026-07-27 | Quantity means visible unit/pack count, not capacity text | Founder/Architecture baseline | Fix prompt implementation without taxonomy redesign |
| 2026-07-27 | Acquisition must support SEO, social, and external links | Founder | Treat launch as measurable unfamiliar-user public beta |
| 2026-07-27 | Stable plan and live tracker are separate documents | Founder/Engineering | This tracker is the status source of truth |
| 2026-07-28 | Refresh must recover the same Analysis | Founder/Engineering | Duplicate requests bypass limits only to return the owned existing Analysis |
| 2026-07-29 | Homepage owns `AI product image checker` | Founder/Product | Do not create same-intent checker synonym pages |
| 2026-07-29 | `AI product photography` is the market pillar | Founder/Product | Build market authority without presenting Pairvu as a generator |
| 2026-07-29 | SEO and GEO share one evidence system | Founder/Product | Real cases, sources, limitations, and crawlable pages serve both discovery modes |

## 9. Daily Update Log

| Date | Update | Completed | Deviation | New risk/blocker | Next action |
| --- | --- | --- | --- | --- | --- |
| 2026-07-27 | Public beta execution baseline created | Plan, tracker, current status reconciliation | None | Existing P0 blockers recorded | Start PB-Q01 through PB-Q04 |
| 2026-07-27 | PB-Q implementation started | None; tasks moved to `IN_PROGRESS` | None | Real OpenAI regression requires prompt-versioned rerun | Implement and verify PB-Q01 through PB-Q04 |
| 2026-07-27 | PB-Q01 through PB-Q04 and PB-Q06 verified | Prompt `002`, quantity boundary, generic category, visibility, Verified filter, cautious language | No RiskPolicy or taxonomy change | API key rotation required before public beta | Start PB-A01 through PB-A05 |
| 2026-07-27 | PB-A01 through PB-A05 started | None; tasks moved to `IN_PROGRESS` | None | Public event writes require validation, idempotency, and ownership checks | Implement first-party journey event chain |
| 2026-07-27 | Local analytics vertical slice verified | PB-A02 to PB-A05 and PB-T07; real success journey plus failed-analysis path | PB-A01 still needed preview application | Production telemetry is still unavailable until preview deployment | Implement PB-P01/PB-P02, then deploy migration `0003` to preview |
| 2026-07-27 | Retention and anonymous access foundation verified | PB-P01/P02/P03/P04/P08; cron, R2 derivatives, tombstone, audit, disclosure, privacy page, session ownership | Production cron remains unverified until deployment | Invalid/corrupt image decode and key rotation remain | Complete PB-P05, PB-P06, PB-P07, and preview migrations |
| 2026-07-27 | Upload hardening verified | PB-P05; signature, decode, corrupt/truncated, MIME, empty, unsupported, pixel-limit coverage | Jimp increased Worker gzip bundle to 1.37 MiB, still below platform limits | Production deployment remains | Implement PB-O04 and validate production controls |
| 2026-07-29 | SEO/GEO governance locked | Brand/market/product ownership, IA, internal links, GEO, crawler policy, evidence rules, boundaries, and SG tracker | Old checker-synonym page plan retired | Search-volume evidence must remain dated and source-scoped | Start SG-K01 to SG-K04 and SG-T01 to SG-T07 |
| 2026-07-27 | Preview migration applied | `db:migrate:preview` against preview DB `2b8d8aad-20ba-4243-9431-21cf67d08ed6` | Preview now has migrations `0001` through `0004` | Production deployment still pending | Finish production migration path before public traffic |
| 2026-07-27 | Public beta guardrails implemented | PB-P06/PB-P07 added to analysis and upload entry points; runtime config exposed; Turnstile widget scaffolded | Local normal journey still passes without Turnstile config | Real Cloudflare Turnstile keys and production config still need to be set | Supply production secrets and validate stop / cap behavior in preview |
| 2026-07-28 | Analysis refresh recovery implemented | Migration `0005`; idempotent POST; running/completed recovery; failed attempts excluded from user quota; local test cap raised | Native browser file chooser blocked automated live-refresh upload | One founder manual refresh check remains; production migration still pending | Resume 16-case matrix after manual refresh confirmation |
| 2026-07-28 | T03 shape regression passed | One packaging mismatch; five unchanged families verified; no limitations; double-preview recovery and telemetry hiding confirmed | None | T04 fixture remains confounded | Regenerate and run clean T04 major-color case |
| 2026-07-28 | T04 major-color case passed | REVIEW; one color mismatch; five unchanged families verified; no limitations or duplicate findings | None | Remaining real matrix incomplete | Continue T05 and subsequent matrix cases |
| 2026-07-28 | T05 missing-component false PASS remediated | Prompt `004`; explicit image roles; high detail; independent component inventory; controlled regression passed | No taxonomy or RiskPolicy change | Same-pair real rerun pending | Stop matrix and rerun T05 |
| 2026-07-28 | T05 same-pair rerun passed | REVIEW; one grounded missing-component issue; five unchanged families verified | Latency optimization deferred by founder | Match/text_changed consistency anomaly recorded | Continue T06 |
| 2026-07-28 | T06 extra-component case passed | REVIEW; one grounded extra-component issue; quantity remained one primary product; no duplicate findings | None | Remaining real matrix incomplete | Continue T07 |
| 2026-07-28 | T07 quantity case passed | REVIEW; one count-changed quantity issue; component types and package shape remained verified | None | Remaining real matrix incomplete | Continue hard-negative cases |
| 2026-07-28 | T08 identical-image control passed | PASS; all six families match/high; no issue or limitation | QA engine `003` canonicalizes contradictory match difference kinds and preserves raw audit values | Remaining hard-negative and observability cases incomplete | Run an actual background-only hard negative |
| 2026-07-28 | T09 background-only hard negative passed | PASS; all six product families match/high; no issue or limitation despite a detailed bathroom scene | No product or policy change required | Remaining lighting, reflection, perspective, and observability cases incomplete | Continue T10 hard-negative case |
| 2026-07-28 | Founder matrix upload cap unblocked locally | Active session had exactly 20 uploads and hit the public default; ignored `.dev.vars` now uses 100/minute and 500/day; same-session upload 21 returned HTTP 201 | Public defaults remain 10/minute and 20/day | Production guardrails still require separate validation | Continue T10 without changing production limits |
| 2026-07-28 | T10 lighting hard negative passed | PASS; all six product families match/high; no issue or limitation under warmer lighting and exposure | No product or policy change required | Reflection, perspective, and observability cases remain | Run T11 shadow/reflection hard negative |
| 2026-07-28 | T11 moderate shadow/reflection hard negative passed | PASS; all six product families match/high; window shadows and highlights caused no issue or limitation | No product or policy change required | Severe glare remains an observability case | Run T12 product-repositioning hard negative |
| 2026-07-28 | T12 reframing hard negative passed | PASS; all six product families match/high despite leftward repositioning and substantial scale reduction | Generator introduced a documented scale confound; accepted because this is an M0 smoke test | Large-viewpoint and observability cases remain | Run T13 large-viewpoint case |
| 2026-07-28 | T13 large-viewpoint false FAIL remediated | Front-label text was incorrectly compared with back-label text; prompt `005` adds corresponding-face gating; policy and controlled gates unchanged | Initial run was FAIL instead of REVIEW | Same-pair real rerun required | Stop matrix and rerun T13 |
| 2026-07-28 | T13 large-viewpoint rerun passed | REVIEW; no product issue; Logo and visible text correctly not observable; four unchanged families verified | No additional product or policy change | Remaining observability cases incomplete | Continue T14 partially-hidden Logo |
| 2026-07-28 | T14 Logo/text occlusion false FAIL remediated | Covered identity content produced two incorrect critical mismatches; prompt `006` adds explicit occlusion gating; policy and controlled gates unchanged | Initial run was FAIL instead of REVIEW | Same-pair real rerun required | Stop matrix and rerun T14 |
| 2026-07-28 | T14 occlusion rerun passed | REVIEW; no product issue; covered brand text correctly not observable; still-visible star Logo and four other families verified | Actual mask primarily covered brand text, so severe Logo-occlusion coverage remains incomplete | Remaining observability cases incomplete | Continue T15 tiny/unreadable text |
| 2026-07-28 | T15 initial fixture rejected | PASS; direct inspection of the stored 1254px source showed key wording and 300 g remain readable under high-detail analysis | Fixture reduced composition scale but retained sharp text pixels; no product change justified | True unreadable-text behavior remains untested | Downsample deterministically and rerun T15 |
| 2026-07-28 | T15 deterministic degradation rerun passed | REVIEW; no product issue; Logo/brand and visible text correctly not observable; four structural families verified | No product or policy change required | Final T16 observability case remains | Continue T16 partially visible product |
| 2026-07-28 | T16 partial-product false PASS remediated | Provider claimed cropped candidate text and base were visible; prompt `007` adds independent candidate evidence and crop coverage rules | Initial run was PASS instead of REVIEW | Same-pair real rerun required | Rerun T16 before Founder checkpoint |
| 2026-07-28 | T16 partial-product rerun passed | REVIEW; no product issue; text and full-shape coverage limited; Logo, quantity, color, and visible components verified | No additional product or policy change | Founder checkpoint and production gates remain | Compile real telemetry and issue readiness recommendation |
| 2026-07-28 | Founder MVP Checkpoint completed | 16/16 final accepted runs matched expected behavior; latency and retrospective cost measured; reliable future cost persistence added | Real-model three-run anchor repeatability remains deferred | Production deployment, key rotation, guardrail validation, and feedback detail block external traffic | Complete P0 production release sequence, then hold GO/NO-GO review |

## 10. Founder Checkpoint Template

Date:

Gate:

Decision: `GO` / `HOLD` / `NO_GO`

Measured results:

- completed analyses:
- critical recall:
- critical false-pass rate:
- hard-negative false-alarm rate:
- not-observable accuracy:
- verdict repeatability:
- execution success:
- Correct / False alarm / Missed feedback:
- median / slowest latency:
- estimated cost per analysis:

Open P0 issues:

Observed false positives:

Observed false negatives:

Excessive REVIEW behavior:

OCR/observability weaknesses:

Privacy/deletion status:

Acquisition/feedback data status:

Approved exceptions:

Next review date:
