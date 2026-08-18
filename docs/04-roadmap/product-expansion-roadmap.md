# Pairvu Product Expansion Roadmap

Status: `FOUNDER_APPROVED_DIRECTION`

Last updated: 2026-08-14

## 1. Roadmap Decision

Pairvu will expand from a simple image checker through adjacent, independently
valuable product stages. It will not jump from the current product into a broad
"AI content infrastructure" platform.

The durable product invariant is:

```text
Approved product truth
  -> candidate or live product asset
  -> evidence-backed quality decision
  -> human publishing action
```

The current `Reference Image -> Candidate Image` workflow remains the entry
point. Each later phase must reuse this approved-product truth, reduce review
work, or make a publishing decision safer.

## 2. Long-Term Product Boundary

Pairvu focuses on product content used for commercial publishing, especially
AI-generated and AI-edited product assets.

In scope over time:

- product fidelity validation;
- batch exception review;
- saved approved products and reference versions;
- brand and channel rules;
- selection among faithful candidates;
- low-risk, selectively automated corrections;
- monitoring approved assets against live assets.

Out of scope unless a future founder decision explicitly changes the boundary:

- AI code, generic documents, or general-purpose content evaluation;
- AI detection or authorship detection;
- generic LLM evaluation and agent observability;
- a general DAM, PIM, publishing suite, or image generator;
- universal marketplace certification;
- autonomous correction of logos, package text, product structure, or identity.

Marketing may continue to lead with AI product images. The domain model must
also accept edited, rendered, resized, final, and live product assets so that
the product is not technically restricted to proving how an image was created.

## 3. Approved Sequence

```text
M0  Single Image QA
 -> M1  Batch Exception Review
 -> M2  Saved Products and Approved References
 -> M3  Custom Rules and Channel Profiles
 -> M4  Compare and Select
 -> M5  Selective Auto-fix
 -> M6  Continuous Monitoring
```

This sequence supersedes the older calendar-based ordering in which marketplace
rules, image sets, and batch were separate later milestones. Batch is already
the active M1 commercial layer.

Progression is evidence-gated, not calendar-gated. Engineering may preserve
clean extension points, but must not build later-phase features speculatively.

## 4. M0: Single Image QA

Status: `LIVE_FOUNDATION`

Product job:

> Determine whether a candidate image visibly changed the approved product.

Core contract:

- one approved reference and one candidate;
- six top-level fidelity families: logo, visible text, product count, main
  color, major components, and shape/packaging;
- `PASS`, `REVIEW`, or `FAIL` with evidence and observability limitations;
- provider and system failures never become product verdicts.

The six families are stable navigation and reporting concepts. New depth should
normally be represented as attributes, subchecks, evidence, and versioned rules
under them rather than an ever-growing list of top-level check families.

## 5. M1: Batch Exception Review

Status: `FINAL_VERIFICATION`

Product job:

> Find the few candidate images that need attention before a set is published.

M1 includes accounts, workspaces, checks/credits, billing foundation, two
explicit mapping modes, durable Queue execution, truthful progress, exception
filters, result history, feedback, CSV export, cancellation, retry, and plan
retention.

The main value is not multi-file upload. It is reducing manual review by making
`FAIL`, `REVIEW`, and execution errors the default exception workflow.

Current next gate:

- complete the remaining M1 verification and deletion walkthroughs;
- run a founder-approved limited paid beta;
- measure repeat batches, checks per reference, exception review, export,
  recheck, provider reliability, cost, and explicit pricing objections.

M1 does not include product profiles, multiple approved references, custom
rules, ranking, automatic fixes, integrations, or monitoring.

## 6. M2: Saved Products And Approved Reference Versions

Status: `EVIDENCE_GATED`

Product job:

> Reuse an approved product truth without rebuilding context for every batch.

Proposed domain:

```text
Product
  -> approved reference version(s)
  -> current approved reference
  -> batches and analyses
  -> later: rule profile and monitored assets
```

Initial scope:

- named product with optional internal product ID/SKU label;
- one current approved reference;
- reference-version history and explicit promotion of a new approved version;
- product-level analysis and batch history;
- reuse from batch creation without repeated upload.

Multiple-reference consensus is a separate increment. M2 should first prove
that persistent product context improves return use.

Entry evidence:

- repeated use of the same retained reference;
- multiple batches for the same product;
- users request saved references, product naming, or version history;
- repeated setup is visible friction in beta sessions.

Success evidence:

- repeat users choose saved products instead of raw reference upload;
- time to create a repeat batch falls materially;
- product history is revisited and used in a publishing decision.

## 7. M3: Custom Rules And Channel Profiles

Status: `EVIDENCE_GATED`

Product job:

> Validate both product fidelity and the selected publishing standard.

Rules are divided into three layers:

1. Product fidelity rules, such as logo, product color, package text, and
   component invariants.
2. Presentation rules, such as visibility, crop, image dimensions, background,
   and readable text.
3. Versioned channel profiles, such as a selected retailer or campaign image
   standard.

Each rule requires scope, version, source or owner, evidence, and a decision.
Channel profiles are readiness signals, not acceptance guarantees.

Rules precede formal ranking because "best" depends on the intended channel,
creative purpose, and brand constraints.

Entry evidence:

- users repeatedly apply the same manual approval standard;
- different users make different decisions for the same visible change;
- users request brand, retailer, campaign, or image-format requirements;
- feedback identifies recurring false alarms caused by allowed variation.

Success evidence:

- saved rules reduce repeated manual decisions;
- rule evidence is understandable and auditable;
- users distinguish product fidelity from channel readiness.

## 8. M4: Compare And Select

Status: `EVIDENCE_GATED`

Product job:

> Among candidates that preserve the product, identify which assets are most
> suitable for the intended use.

Selection has two stages:

1. Eligibility: exclude `FAIL` and isolate `REVIEW`.
2. Preference: compare eligible candidates using product visibility, text
   readability, composition, visual quality, brand consistency, and the chosen
   channel profile.

The first version should use explainable groups:

- `Recommended`;
- `Strong alternatives`;
- `Needs review`;
- `Rejected`.

Do not lead with an arbitrary universal score such as `92/100`. If numeric
signals are later justified, show criterion-level measurements and evidence.
Visual quality must never compensate for an identity-changing fidelity failure.

Entry evidence:

- batches regularly contain several `PASS` candidates;
- users open and compare multiple passing results;
- users explicitly ask which passing image should be published;
- selection criteria can be stated for a real workflow.

Success evidence:

- users accept or override recommendations for documented reasons;
- selection saves measurable review time;
- recommendation quality is repeatable under the same criteria.

## 9. M5: Selective Auto-Fix

Status: `EVIDENCE_GATED`

Product job:

> Correct a narrow, low-risk presentation problem and prove the new asset is
> still faithful.

Initial eligible operations:

- resize and format conversion;
- re-crop or reframe;
- canvas extension;
- background replacement under an explicit rule.

Required lifecycle:

```text
Candidate
  -> fix attempt
  -> new asset version
  -> automatic independent re-check
  -> PASS / REVIEW / FAIL
  -> user approval
```

Fixes never overwrite the source asset and never auto-publish. Automatic repair
of logos, package wording, quantity values, colors that define a variant, or
product structure remains out of scope.

Entry evidence:

- a small number of presentation failures recur at useful volume;
- the correction can be deterministic or tightly constrained;
- re-check success and failure can be measured reliably;
- users ask to act on an issue rather than only diagnose it.

Success evidence:

- high re-check pass rate without new identity errors;
- users approve and download corrected versions;
- provenance and rollback remain complete.

## 10. M6: Continuous Monitoring

Status: `EVIDENCE_GATED_LONG_TERM`

Product job:

> Detect when a live product asset diverges from the current approved truth.

Recommended integration order:

1. explicit asset URLs or feeds;
2. Shopify product media if demanded by active customers;
3. CSV or merchant-feed ingestion;
4. PIM/DAM and broader marketplace connections.

Monitoring can detect incorrect replacement, stale packaging, unapproved AI
versions, or inconsistent market assets. Pricing may then add a recurring
`monitored products per month` dimension.

Entry evidence:

- users repeatedly check the same product after publishing;
- live replacement or stale-asset risk is tied to a real workflow;
- design partners will connect a store, feed, or asset source;
- M2 product truth and versioning are already trusted.

Success evidence:

- alerts identify actionable drift with an acceptable false-alarm rate;
- monitoring creates recurring review behavior;
- integration removes recurring manual uploads.

## 11. Commercial Evolution

Keep one primary billing model per stage and avoid exposing every internal cost
unit at once.

| Stage | Primary customer value | Likely commercial unit |
| --- | --- | --- |
| M0/M1 | Evidence-backed checks and batch review | product checks, plan batch limit |
| M2 | Persistent approved product truth | active products or plan entitlement |
| M3 | Reusable standards | rule/profile entitlement |
| M4 | Selection among candidates | candidates evaluated or plan entitlement |
| M5 | Corrected and revalidated assets | fix credits |
| M6 | Recurring drift detection | monitored products per month |

Do not change the current check-based pricing until paid M1 usage supplies
conversion, repeat-use, cost, and objection evidence.

## 12. Domain Concepts To Preserve

Later phases should extend the current semantics rather than collapsing them:

```text
Workspace
  -> Product
     -> Reference version
     -> Rule profile
  -> Batch
     -> Batch item
        -> Analysis
           -> Execution attempt
              -> Model call
  -> Selection run
  -> Fix attempt / generated asset version
  -> Monitor and observation
```

An analysis remains one domain validation request. An execution attempt remains
one attempt to complete it. A model call remains one provider invocation.
Selection, fixing, and monitoring are separate domain operations and must not be
hidden inside an analysis result.

## 13. Positioning Evolution

Use language earned by the shipped product:

- Current: **AI product image checker**.
- After M1/M2/M3 adoption: **Product visual QA for AI-generated and edited
  images**.
- After selection and broader product-asset workflows: **AI product content
  QA**.
- Only after rules, integrations, versioned truth, and monitoring are active:
  **Quality infrastructure for AI-generated product content**.

The current message `Did AI change your product?` remains the clearest entry
point throughout this evolution.

## 14. Roadmap Governance

At each phase checkpoint report:

- user evidence supporting entry;
- value delivered independently by the phase;
- changes to domain architecture;
- quality, privacy, cost, and operational risks;
- explicit non-scope;
- success metrics and rollback/hold conditions.

A phase is not approved because it is technically possible. It is approved only
when the prior product produces evidence of the next user problem.

## 15. Current Decision

Pairvu should now:

1. Finish M1 verification and production hardening.
2. Run the public paid beta without adding later-phase scope or invitation gates.
3. Instrument reference reuse, repeat batches, PASS-set inspection, export,
   recheck, feedback, cost, and provider reliability.
4. Treat M2 Saved Products and Approved Reference Versions as the default next
   candidate, subject to beta evidence.
5. Not begin formal ranking, custom rules, auto-fix, or integrations before the
   corresponding entry evidence is reviewed.
