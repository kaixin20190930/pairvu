# Trackable Implementation Plan And Timeline

> Historical note: this document began before the public single-image product
> and commercial Batch implementation existed. M0 and the older M2-M9 sequence
> below preserve the original planning record. Current execution is governed by
> [M1 Batch Commercial Plan](m1-batch-commercial-plan.md), and post-M1 product
> direction is governed by [Pairvu Product Expansion Roadmap](product-expansion-roadmap.md).

## Timeline Assumptions

- Small focused team: 1-2 engineers, founder/product owner, design support as needed.
- Dates are relative to project start.
- Gates can delay later phases.
- Time estimates include product, engineering, QA, and review, not only coding.

## Status Legend

- `Not Started`
- `In Progress`
- `Blocked`
- `Ready For Review`
- `Done`
- `Deferred`

## Phase F0: Foundation Documents

Target: Week 0-1

Priority: P0

Status: In Progress

Deliverables:

- product thesis;
- product boundaries;
- QA taxonomy;
- error taxonomy;
- model strategy;
- evaluation strategy;
- privacy principles;
- business analysis.

Exit gate:

- founder agrees that positioning, boundaries, and M0 scope are internally consistent.

## Phase F1: Architecture

Target: Week 1

Priority: P0

Status: In Progress

Deliverables:

- system design;
- D1 schema design;
- engine TypeScript contracts;
- storage lifecycle;
- security baseline;
- versioning plan.

Exit gate:

- no core UI or model implementation depends on raw provider output.
- D1/R2 responsibilities are clearly separated.
- every analysis can be audited by version.

## Phase M0: Validation Prototype

Target: Weeks 2-5

Priority: P0

Status: Not Started

Scope:

- scaffold Next.js on Cloudflare;
- D1/R2 setup;
- image upload and metadata;
- reference + candidate analysis flow;
- deterministic technical checks;
- VisionProvider contract and OpenAI provider;
- structured output schema validation;
- six fidelity checks;
- Risk Engine;
- result page;
- feedback capture;
- initial eval cases.

Non-scope:

- batch;
- API;
- marketplace rule packs;
- billing;
- product profiles;
- integrations.

Success gate:

- detects meaningful seeded packaged-product errors.
- avoids obvious false passes in internal eval.
- at least 30-50 curated eval cases exist.

## Historical Phase M1: Public Single-Image MVP

Target: Weeks 6-9

Priority: P0

Status: Superseded by implemented M0 public-product foundation

Scope:

- anonymous first check;
- auth;
- usage limits;
- Turnstile;
- history;
- shareable result;
- feedback;
- homepage with live checker;
- basic SEO pages.

Success gate:

- users complete first check without onboarding.
- measurable second-check rate.
- early users report that findings matter.

The active M1 definition is now [Accounts, Credits, And Batch QA](../02-product/m1-batch-commercial-definition.md), with the executable plan in [M1 Batch Commercial Plan](m1-batch-commercial-plan.md). The historical label remains here to preserve the original planning record.

## Historical Phase M2-M9 Sequence

Status: `Superseded`

The sections below preserve the original expansion hypotheses. They are no
longer the approved build order: Batch QA moved forward and became M1, while
saved products, rules, selection, selective fixes, and monitoring now require
behavioral entry gates. Do not use the old week numbers to authorize scope.

See [Pairvu Product Expansion Roadmap](product-expansion-roadmap.md) for the
approved sequence.

## Historical Phase M2: Product Profiles

Target: Weeks 10-13

Priority: P1

Status: Not Started

Scope:

- create product;
- upload 2-6 references;
- product page;
- analyses history;
- user-confirmed attributes;
- allowed/forbidden variation;
- multi-reference reasoning.

Success gate:

- repeat users prefer saved products over repeated reference upload.
- profile-based checks reduce repeated setup time.

## Historical Phase M3: Marketplace Compliance

Target: Weeks 14-17

Priority: P1

Status: Not Started

Scope:

- one marketplace only, likely Amazon based on demand;
- versioned `MarketplaceRuleSet`;
- deterministic and hybrid rules;
- rule evidence/source tracking;
- marketplace-specific result UX.

Success gate:

- users understand outputs as readiness signals, not acceptance guarantees.
- rule updates are versioned and auditable.

## Historical Phase M4: Listing / Image Set QA

Target: Weeks 18-21

Priority: P1

Status: Not Started

Scope:

- ImageSet entity;
- cross-image consistency;
- duplicate detection;
- missing views;
- technical readiness;
- set-level summary.

Success gate:

- users need listing-level readiness, not only single-image verdicts.

## Historical Phase M5: Batch QA

Target: Weeks 22-27

Priority: P1

Status: Not Started

Scope:

- multi-file upload;
- ZIP ingestion;
- CSV mapping;
- async queue/workflow processing;
- batch status aggregation;
- exception review UI;
- filters and export;
- retry and dead-letter states.

Success gate:

- users have enough volume that exception review is materially better than manual review.
- cost per batch is predictable.

## Historical Phase M6: Category Packs

Target: Weeks 28-33

Priority: P2

Status: Not Started

Scope:

- packaged goods / beauty first;
- electronics next if demand supports it;
- category-specific attributes;
- benchmark subsets;
- confidence thresholds;
- specialized prompts/detectors.

Success gate:

- category performance beats generic prompt baseline in eval.

## Historical Phase M7: Public API

Target: Weeks 34-39

Priority: P2

Status: Not Started

Scope:

- `/v1/analyses`;
- `/v1/products`;
- `/v1/batches`;
- API keys;
- scopes;
- webhooks;
- rate limits;
- transactional usage accounting;
- developer docs.

Success gate:

- external systems ask to integrate validation before publish/regenerate flows.

## Historical Phase M8: Integrations

Target: Weeks 40-47

Priority: P2

Status: Not Started

Scope:

- prioritize from customer workflow evidence;
- generic S3/R2-compatible ingestion first;
- then Shopify, Google Drive, DAM, PIM, or marketplace workflows.

Success gate:

- integration removes repeated manual upload from active customers.

## Historical Phase M9: Continuous QA Monitor / Enterprise

Target: Weeks 48+

Priority: P3

Status: Not Started

Scope:

- scheduled scans;
- asset discovery;
- change detection;
- policy-change revalidation;
- exception SLA;
- audit history;
- SSO/SAML;
- RBAC;
- retention controls;
- custom rule packs;
- security documentation;
- DPA and SLA.

Success gate:

- enterprise requirements are blocking real contracts.

## Sprint-Level Build Order For M0-M1

| Sprint | Target | Priority | Status | Outcome |
| --- | --- | --- | --- | --- |
| 1 | Project foundation | P0 | Not Started | Next.js, Cloudflare, CI, env handling, D1/R2, logging |
| 2 | Asset system | P0 | Not Started | Two valid private product images upload reliably |
| 3 | QA engine skeleton | P0 | Not Started | Check, VisionProvider, RiskEngine, versioning, telemetry |
| 4 | Fidelity MVP | P0 | Not Started | Six checks produce structured results |
| 5 | Eval harness | P0 | Not Started | Golden cases and baseline metrics |
| 6 | Public UI | P0 | Not Started | Homepage, checker, result, auth, history, feedback |
| 7 | Analytics | P0 | Not Started | Funnel, conversion, usage, cost, quality signals |

## Analytics Events

- `landing_view`
- `checker_started`
- `reference_uploaded`
- `candidate_uploaded`
- `analysis_started`
- `analysis_completed`
- `result_viewed`
- `issue_expanded`
- `feedback_submitted`
- `second_check_started`
- `signup_started`
- `signup_completed`
- `pricing_viewed`
- `checkout_started`
- `subscription_started`

Primary funnel:

Landing -> Start checker -> Complete upload -> Analysis -> Result -> Second check -> Signup -> Paid

## Risk Register

| Risk | Severity | Mitigation |
| --- | --- | --- |
| False passes damage trust | Critical | Evaluation harness, conservative REVIEW, risk policy |
| Model hallucination | High | structured output, schema validation, not_observable |
| Unit economics fail | High | telemetry, caps, model routing after benchmark |
| Marketplace rule drift | High | versioned rules, source verification date |
| Abuse of anonymous checker | High | Turnstile, session caps, spend caps |
| Privacy concern blocks adoption | High | retention, deletion, provider disclosure |
| Scope expands too early | Medium | roadmap gates, non-scope docs |
| D1 scalability assumptions | Medium | repository interfaces, avoid blob storage |
