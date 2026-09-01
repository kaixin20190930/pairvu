# M0 Public Beta Launch Plan

Document type: Execution baseline

Status: Approved for execution

Baseline date: 2026-07-27

Target limited public beta: 2026-08-10 to 2026-08-14, conditional

Target broader public beta: 2026-08-17 to 2026-08-23, conditional

Owners:

- Founder: product decisions, ground truth, release approval, positioning
- Engineering: implementation, testing, telemetry, operations
- Growth: SEO content, social distribution, acquisition reporting

Live status:

- [M0 Public Beta Live Tracker](m0-public-beta-tracker.md)

## 1. Executive Decision

M0 has validated the core technical hypothesis:

> A trusted Reference image can be compared with a Candidate image, meaningful
> product-identity changes can be expressed as structured observations, and
> those observations can be converted into a risk-based PASS, REVIEW, or FAIL
> verdict.

This is not yet proof that the public product is reliable, usable, secure,
measurable, or commercially valuable.

The next objective is to ship a measurable public beta that:

1. lets an unfamiliar user complete a real two-image check without assistance;
2. records the complete anonymous journey from acquisition to result;
3. records model behavior, failures, latency, usage, and cost;
4. captures verdict-level and issue-level user feedback;
5. protects uploaded assets with enforced 24-hour anonymous retention;
6. supports controlled SEO and social acquisition without expanding M0 scope.

## 2. Scope

### Included

- two-image Reference/Candidate checker;
- six approved M0 check families;
- real OpenAI VisionProvider only in production;
- PASS, REVIEW, and FAIL;
- anonymous session and acquisition attribution;
- first-party product analytics;
- verdict-level and issue-level feedback;
- optional use-case and contact opt-in after the result;
- automatic original and derivative deletion;
- abuse controls and spend protection;
- focused SEO landing pages and case studies;
- production monitoring and launch stop rules.

### Excluded

- batch;
- public API;
- Product Profiles;
- multiple reference images;
- teams;
- billing;
- automatic image fixing;
- marketplace compliance guarantees;
- marketplace rule packs;
- fashion, electronics, and video;
- Enterprise features;
- large programmatic SEO rollout.

## 3. Status Standard

All execution items use one of these states:

| Status | Meaning |
| --- | --- |
| `NOT_STARTED` | Work has not begun |
| `IN_PROGRESS` | Active implementation or investigation |
| `BLOCKED` | Cannot progress without a decision or dependency |
| `READY_FOR_REVIEW` | Implementation is complete and awaiting verification |
| `DONE` | Acceptance criteria have been verified |
| `DEFERRED` | Explicitly moved outside the current release |

Priority:

| Priority | Meaning |
| --- | --- |
| `P0` | Public launch blocker |
| `P1` | Required for useful beta operation |
| `P2` | Valuable after first real usage |

No task may be marked `DONE` without evidence linked in the live tracker.

## 4. Workstreams

### PB-Q: QA Semantics And Result Integrity

Goal: ensure the public result is correct, non-contradictory, and understandable.

| ID | Priority | Deliverable | Acceptance criteria |
| --- | --- | --- | --- |
| PB-Q01 | P0 | Define all six check families in the OpenAI prompt | Prompt matches approved M0 semantics; prompt version is bumped |
| PB-Q02 | P0 | Correct quantity boundary | Capacity/weight belongs to `visible_text`; `quantity` means visible product or pack count |
| PB-Q03 | P0 | Correct category handling | No hard-coded `packaged_food` for unrelated CPG products |
| PB-Q04 | P0 | Correct observability display | Missing evidence never renders as `false`; Verified uses sufficient observability |
| PB-Q05 | P0 | Consolidate user-facing overlapping findings | One underlying change is shown as one user-facing problem with supporting checks |
| PB-Q06 | P1 | Replace absolute model language | User-facing copy avoids unproven `identical` and `exactly` claims |
| PB-Q07 | P1 | Human-readable result UI | No raw enum/camelCase field is required to understand the result |

Constraints:

- do not redesign the taxonomy before the controlled matrix is complete;
- do not change RiskPolicy unless a real case exposes a concrete decision error;
- preserve raw observations for evaluation even when findings are consolidated in
  the user view.

### PB-A: Analytics And Journey Recording

Goal: reconstruct every anonymous product journey without storing uploaded image
content in marketing analytics.

| ID | Priority | Deliverable | Acceptance criteria |
| --- | --- | --- | --- |
| PB-A01 | P0 | `product_events` D1 migration | Event records support session, analysis, acquisition, page, and properties |
| PB-A02 | P0 | First-party event endpoint | Validates event names, uses idempotency keys, rate limits writes |
| PB-A03 | P0 | Server-authoritative analysis events | Start, complete, and fail are emitted by the server |
| PB-A04 | P0 | Client funnel events | Landing, checker, upload, result, feedback, retry, and second check are recorded |
| PB-A05 | P0 | First-touch and session UTM capture | Source, medium, campaign, content, term, and referrer are persisted |
| PB-A06 | P1 | GA4 acquisition integration | Page and acquisition events are visible without product evidence or image data |
| PB-A07 | P1 | Search Console integration | Ownership, sitemap, index status, query impressions, and clicks are visible |
| PB-A08 | P1 | Quality and cost reporting query | Funnel, execution, feedback, latency, and cost can be reported by source |

Canonical event names:

```text
landing_view
checker_started
reference_upload_started
reference_upload_completed
reference_upload_failed
candidate_upload_started
candidate_upload_completed
candidate_upload_failed
analysis_submit_attempted
analysis_submit_blocked
analysis_started
analysis_completed
analysis_failed
result_viewed
issue_expanded
feedback_submitted
retry_clicked
second_check_started
contact_opt_in
```

Required event fields:

```text
id
idempotency_key
event_name
anonymous_session_id
analysis_id
occurred_at
page_path
referrer_domain
utm_source
utm_medium
utm_campaign
utm_content
utm_term
locale
device_class
properties_json
created_at
```

Data rules:

- never send uploaded images, filenames, OCR text, or evidence to GA4;
- generate analysis lifecycle events on the server;
- do not use client-provided model, cost, verdict, or provider telemetry as the
  source of truth;
- do not store raw IP addresses in product analytics;
- preserve first-touch attribution and the current session attribution
  separately.

### PB-F: Feedback And User Learning

Goal: distinguish model correctness, issue correctness, use case, and willingness
to continue.

| ID | Priority | Deliverable | Acceptance criteria |
| --- | --- | --- | --- |
| PB-F01 | P0 | Verdict feedback | Correct, False alarm, and Missed something persist reliably |
| PB-F02 | P0 | False-alarm detail | User can select the incorrect issue and a reason |
| PB-F03 | P0 | Missed-issue detail | User can select the missed M0 family and add an optional comment |
| PB-F04 | P1 | Use-case question | Captures Amazon listing, AI product photo, ad creative, packaging, ecommerce, or other |
| PB-F05 | P1 | Optional contact opt-in | Email and interview consent are separate, explicit, and post-result |
| PB-F06 | P1 | Feedback review view/query | Feedback can be grouped by model, prompt, issue, verdict, and acquisition source |

False-alarm reason codes:

```text
no_real_change
background_only
lighting_or_reflection
viewpoint_or_position
text_read_incorrectly
attribute_not_visible
other
```

Missed-family codes:

```text
logo
visible_text
quantity
dominant_color
major_components
major_shape_packaging
other
```

Feedback interaction:

1. show one-click verdict feedback;
2. reveal the optional detail form only after a selection;
3. never block Check another image;
4. ask use case and contact permission only after delivering the result.

### PB-P: Privacy, Security, Abuse, And Cost Controls

Goal: make anonymous public upload operation safe and bounded.

| ID | Priority | Deliverable | Acceptance criteria |
| --- | --- | --- | --- |
| PB-P01 | P0 | Automatic 24-hour deletion | Original and derivative R2 objects are deleted and metadata is tombstoned |
| PB-P02 | P0 | Deletion verification | Automated test proves expired assets and derivatives are unavailable |
| PB-P03 | P0 | Provider and retention disclosure | Upload UI and privacy page explain retention and third-party processing |
| PB-P04 | P0 | Analysis access control | Anonymous result read/feedback requires session ownership or signed token |
| PB-P05 | P0 | Upload hardening | MIME, size, empty, corrupt, and decode failures are handled |
| PB-P06 | P0 | Turnstile and rate limits | Anonymous abuse is bounded without blocking normal first use |
| PB-P07 | P0 | Spend and concurrency limits | Per-session, daily, and global caps have a visible retryable state |
| PB-P08 | P1 | Operational deletion audit | Deletion attempts, success, failure, and retry are queryable |

Public upload must pause if automatic deletion is failing.

### PB-T: Controlled And End-To-End Testing

Goal: prove real behavior, not only policy plumbing.

Controlled single-variable matrix:

| Case | Expected safety behavior | Primary family |
| --- | --- | --- |
| Visible capacity/value change | `FAIL` | visible_text |
| Logo/brand change | `FAIL` | logo |
| Major package type/shape change | `FAIL` | major_shape_packaging |
| Major semantic color change | Must not `PASS` | dominant_color |
| Remove pump/cap | Must not `PASS` | major_components |
| Add major component | Must not `PASS` | major_components |
| One product becomes two / pack count changes | Must not `PASS` | quantity |
| Exact or re-exported image | `PASS` | all |
| Background-only change | `PASS` | all |
| Lighting-only change | `PASS` | dominant_color hard negative |
| Shadow/reflection change | `PASS` | dominant_color hard negative |
| Reposition/scale/minor perspective | `PASS` | shape hard negative |
| Large viewpoint difference | `REVIEW` | observability |
| Partially hidden logo | `REVIEW` | logo observability |
| Tiny or unreadable text | `REVIEW` | text observability |
| Partially visible product | `REVIEW` | coverage |

Repeatability subset:

- capacity/value change: 3 runs;
- logo change: 3 runs;
- background-only change: 3 runs;
- obscured/unverifiable case: 3 runs.

End-to-end test areas:

| Area | Required coverage |
| --- | --- |
| Upload | valid JPEG/PNG/WebP, empty, corrupt, wrong MIME, oversized, cancel, replace |
| Analysis | double submit, OpenAI timeout, provider limit, network failure, retry |
| Results | PASS, REVIEW, FAIL, limitations, no findings, consolidated findings |
| Feedback | all feedback kinds, issue selection, optional comment, repeat submission |
| Session | refresh, second check, expired session, unauthorized analysis access |
| Privacy | expiration, original deletion, derivative deletion, tombstone, retry |
| Browser | current Chrome, Safari, Firefox; desktop and mobile widths |
| Accessibility | keyboard operation, focus, labels, contrast, status announcements |
| Analytics | exact event order, idempotency, UTM persistence, server/client agreement |
| Operations | health, error logs, cost cap, rate limit, deletion alert |

### PB-S: SEO, Landing Pages, And Social Acquisition

Goal: acquire qualified unfamiliar users without implying unsupported compliance
or marketplace guarantees.

The accepted architecture and keyword ownership are defined in:

- [Pairvu SEO And GEO Strategy](../03-growth/seo-geo-strategy.md);
- [SEO And GEO Implementation Plan](seo-geo-implementation-plan.md).

Launch-level summary:

- `/` is the only owner of `AI product image checker` and keeps the live checker
  as the first experience;
- `/ai-product-photography` is the market pillar;
- `/examples/`, `/guides/`, and `/use-cases/` are the expandable content
  families;
- the first evidence cluster uses real logo, label-text, packaging, checklist,
  Ecommerce, Amazon, and Shopify content;
- no same-intent checker synonym pages or mass-generated platform/category
  pages;
- GEO uses the same factual, crawlable, source-backed content;
- analysis/result/session/API surfaces are not indexable;
- Search Console, Bing, production sitemap, canonical, crawler, schema, and
  attribution checks are release evidence.

Social requirements:

- every external link uses lowercase, consistent UTM values;
- each creative has a distinct `utm_content`;
- first creatives use the volume-change, background-only, logo-change, and
  missing-component examples;
- social posts make the current product boundary and beta status clear.

UTM example:

```text
?utm_source=linkedin
&utm_medium=organic_social
&utm_campaign=m0_public_beta
&utm_content=volume_change_demo
```

### PB-O: Production Operations And Launch

Goal: operate the beta without silent quality, privacy, or cost failure.

| ID | Priority | Deliverable | Acceptance criteria |
| --- | --- | --- | --- |
| PB-O01 | P0 | Production environment validation | D1, R2, OpenAI, secrets, migrations, and health endpoint pass |
| PB-O02 | P0 | Error and cost monitoring | Provider failures, system failures, spend, and deletion failures alert |
| PB-O03 | P0 | Launch dashboard/report | Funnel, quality, feedback, latency, and cost are queryable daily |
| PB-O04 | P0 | Stop controls | New analysis can be disabled without losing result/error access |
| PB-O05 | P1 | Daily review procedure | First seven launch days have a named review checklist |
| PB-O06 | P1 | Weekly learning review | Findings produce keep/fix/defer decisions with evidence |

## 5. Timeline

### Week 1: 2026-07-27 to 2026-08-02

Objective: remove known result-integrity defects and build the data/privacy
foundation.

- PB-Q01 through PB-Q06;
- PB-A01 through PB-A05;
- PB-F01 through PB-F03;
- PB-P01 through PB-P05;
- freeze controlled fixture definitions and ground truth.

Exit:

- current 550 ml to 500 ml case produces one user-facing visible-text finding;
- a complete session-to-result event trail is stored;
- deletion is implemented and testable.

### Week 2: 2026-08-03 to 2026-08-09

Objective: complete controlled validation and production readiness.

- run the 16-case single-variable matrix;
- run the repeatability subset;
- complete browser, mobile, error, privacy, and analytics E2E tests;
- implement Turnstile, rate limits, spend limits, monitoring, and stop control;
- finish GA4, Search Console, canonical, robots, sitemap, and noindex behavior;
- complete focused landing and case pages.

Exit:

- all limited-public-beta gates pass;
- founder reviews the measured report;
- no open P0 issue.

### Limited Public Beta: 2026-08-10 to 2026-08-14

Objective: send bounded social/external-link traffic and validate the public
journey.

- use a daily traffic and spend cap;
- publish two to four UTM-tagged social examples;
- review every failed analysis and all submitted feedback daily;
- do not expand SEO page count;
- fix only concrete P0/P1 failures.

Exit:

- at least 20 completed public analyses or five days of operation;
- no critical false PASS;
- no unresolved privacy/deletion failure;
- acquisition and feedback data are usable.

### Broader Public Beta: 2026-08-17 to 2026-08-23

Objective: allow normal SEO crawling and broader social distribution.

- expand traffic caps only after limited-beta review;
- submit and monitor the sitemap;
- publish remaining focused landing/case pages;
- continue daily quality and spend review.

This date is conditional. A failed release gate moves the date; it does not
lower the gate.

## 6. Release Gates

### Gate G0: Internal Real Analysis

- real OpenAI path completes;
- persisted observations, issues, limitations, telemetry, and feedback work;
- provider errors never become PASS, REVIEW, or FAIL.

Current status: passed for one controlled capacity-change pair.

### Gate G1: Limited Public Beta

All must be true:

- no open P0 issue;
- critical seeded-error recall meets the approved 85% gate;
- critical false-pass rate is at most 10%, with zero known obvious critical
  false PASS;
- hard-negative false-alarm rate is at most 20%;
- not-observable accuracy is at least 90%;
- verdict repeatability is at least 90%;
- all 16 controlled cases completed without structured-output/system failure;
- the public UI contains no contradictory evidence;
- one underlying change is one user-facing finding;
- full journey events and UTM attribution are verified;
- feedback persists and is queryable;
- automatic 24-hour deletion is verified;
- access controls, Turnstile, rate limits, spend limits, and stop controls pass;
- privacy/provider disclosure is visible before upload.

### Gate G2: Broader Public Beta

All G1 conditions remain true, plus:

- at least 20 completed public analyses or five operating days;
- analysis execution success is at least 95%, excluding user input validation;
- no unresolved deletion failure;
- no uncontrolled spend or concurrency incident;
- feedback can be joined to source, model/prompt version, verdict, and finding;
- sitemap, canonical, robots, noindex, GA4, and Search Console are verified;
- founder records `GO`, `HOLD`, or `NO_GO` in the live tracker.

## 7. Launch Metrics

### Acquisition

- sessions by source, medium, campaign, content, landing page;
- Search Console impressions, clicks, click-through rate, queries, and pages.

### Activation

- landing-to-checker-start rate;
- checker-start-to-both-uploads rate;
- both-uploads-to-analysis-start rate;
- analysis-start-to-completion rate;
- result-view rate.

### Quality

- PASS, REVIEW, FAIL distribution;
- execution failure rate by error code;
- Correct, False alarm, and Missed something rate;
- feedback by issue family and prompt/model version;
- review rate and observability limitations;
- critical false passes and hard-negative false alarms.

### Engagement And Demand

- second-check rate;
- anonymous return rate;
- use-case distribution;
- optional contact/interview opt-in rate;
- performance by acquisition source and landing page.

### Economics And Performance

- input/output usage;
- estimated cost per completed analysis;
- cost per result with Correct feedback;
- provider latency;
- true end-to-end latency;
- slowest analyses and timeout rate.

Feedback ratios are directional because response selection is biased. They must
be reviewed with individual evidence, not treated as a statistically complete
quality score.

## 8. Stop Rules

Pause new analysis traffic when any of these occurs:

- a confirmed critical false PASS;
- automatic deletion fails or expired objects remain accessible;
- OpenAI or total analysis cost exceeds the configured daily/global limit;
- analysis execution failures remain above 5% over the latest 20 attempts;
- unauthorized access to another anonymous analysis is possible;
- provider/schema failures are displayed as a product verdict;
- an unresolved P0 issue makes feedback or telemetry untrustworthy.

The founder may resume traffic only after:

1. the cause is documented;
2. the fix is regression-tested;
3. affected prompt/model/policy versions are recorded;
4. the live tracker contains the restart decision.

## 9. Update Protocol

The live tracker is the operational source of truth.

Update it:

- when a task starts;
- when a task enters review;
- when acceptance evidence is available;
- when a blocker or new risk is discovered;
- at the end of every implementation day during Weeks 1 and 2;
- daily during the first seven public-beta days;
- before every `GO`, `HOLD`, or `NO_GO` decision.

Every update must include:

- date;
- task or gate ID;
- prior and new status;
- evidence link or command;
- deviation from this plan;
- unresolved decision;
- new risk;
- next owner/action.
