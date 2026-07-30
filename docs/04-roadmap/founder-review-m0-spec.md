# Founder Review: M0 Specification And Architecture

## Recommendation

READY for Sprint 1 scaffold after founder signs off on the unresolved decisions below.

Reasoning: P0 semantic and validation risks have been resolved at the documentation/architecture-contract level. Implementation should still stop at project foundation and must not expand M0 scope.

## 1. P0 Changes Completed

### Freeze Domain Semantics

Completed in [Domain Semantics](../00-foundation/domain-semantics.md).

Final chain:

```text
Asset -> Reference / Candidate -> Check -> Observation -> Issue or Limitation -> Risk Decision -> Analysis Verdict
```

Definitions now explicitly cover:

- Asset
- Reference
- Candidate
- Observability
- Analysis Limitation
- Confidence
- Severity
- Product Identity
- Issue
- Risk Decision
- Analysis Verdict

### Separate Model Observation From Product Policy

Completed in [QA Engine Contracts](../01-architecture/engine-contracts.md).

The model/provider reports:

- visible facts;
- comparison status;
- observability;
- confidence;
- evidence;
- limitations.

The versioned RiskPolicy decides:

- issue derivation;
- severity normalization;
- review/failed reasons;
- final verdict.

### Fix `not_observable` Semantics

Completed in:

- [Domain Semantics](../00-foundation/domain-semantics.md)
- [Error Taxonomy](../00-foundation/error-taxonomy.md)
- [M0 Validation Protocol](../02-product/m0-requirements.md)
- [QA Engine Contracts](../01-architecture/engine-contracts.md)

`not_observable` is now an observability value, not a product issue.

### Separate Product Issues, Technical Issues, And Limitations

Completed in:

- [Error Taxonomy](../00-foundation/error-taxonomy.md)
- [D1 Schema Design](../01-architecture/data-model.md)
- [QA Engine Contracts](../01-architecture/engine-contracts.md)

D1 now separates:

- `analysis_observations`
- `analysis_issues`
- `analysis_limitations`
- `analysis_model_calls`

### Strengthen Evaluation Strategy

Completed in:

- [Evaluation Strategy](../00-foundation/evaluation-strategy.md)
- [M0 Validation Protocol](../02-product/m0-requirements.md)

Evaluation now covers:

- controlled seeded failures;
- hard negatives;
- unobservable cases;
- input-quality failures;
- repeatability;
- model/prompt regression.

## 2. P1 Changes Completed Or Deferred

### Model Metadata Ownership

Completed.

Analysis-level fields:

- `qa_engine_version`
- `risk_policy_version`
- `model_policy_version`
- `rule_set_version`

Model-call fields:

- provider;
- model;
- prompt version;
- latency;
- cost;
- usage;
- errors.

This avoids assuming one analysis always equals one model call.

### Evaluation Data Boundaries

Completed.

Documents now separate:

```text
Customer Production Data != Evaluation Fixtures != Training Data
```

Production feedback can only become eval/training data through reviewed, permitted promotion.

### QAEngine Domain Focus

Completed.

QAEngine owns domain orchestration. Infrastructure owns R2, D1, queues, persistence, provider transport, operational telemetry persistence, auth, billing, and APIs.

### Analysis Resource Semantics

Completed.

External contract should evolve as:

```text
POST /analyses -> analysis_id
GET /analyses/{analysis_id} -> queued / running / completed / failed
```

M0 does not require Queues/Workflows unless implementation constraints force them.

### North Star Guardrail

Completed.

Human Reviews Avoided is constrained by False Pass Rate, Critical Issue Recall, and repeatability.

### PASS Semantics

Completed.

`PASS` means no meaningful mismatch was detected within sufficiently observable selected checks. It does not mean guaranteed correctness.

## 3. Final M0 Scope

Reference Image + Candidate Image only.

Exactly six fidelity check families:

1. Logo consistency
2. Visible text consistency
3. Product quantity
4. Dominant product color
5. Major product components
6. Major shape / packaging identity

No batch, marketplace support, API, persistent Product Profiles, multiple categories, automatic fixes, teams, or billing complexity.

## 4. Supported Category

M0 focuses on consumer packaged products with stable visible identity:

- cosmetics;
- beverages;
- personal care;
- packaged food;
- household packaged goods.

Physical electronics are deferred unless a strong customer reason emerges.

## 5. Final M0 Risk Policy Summary

Version: `m0-risk-policy-001`

FAIL:

- confirmed high-confidence critical product identity mismatch;
- wrong brand/logo;
- critical visible identity text mismatch;
- major packaging identity mismatch.

REVIEW:

- uncertain mismatch;
- low observability;
- important attribute not observable;
- moderate mismatch;
- reference insufficient;
- candidate insufficient;
- intentional quantity variation cannot be established;
- insufficient coverage to safely pass.

PASS:

- no meaningful mismatch detected;
- sufficient identity attributes observable;
- no material input or analysis limitation.

Never return `PASS` merely because the model found no issue.

## 6. Final Evaluation Gates

Provisional founder-review thresholds, not SLAs:

- Critical seeded-error recall >= 85%
- Critical false-pass rate <= 10%
- Hard-negative false-alarm rate <= 20%
- Not-observable handling accuracy >= 90%
- Verdict repeatability >= 90%

Also track:

- issue-type agreement;
- limitation agreement;
- median/P95 latency;
- estimated cost per check;
- review rate by check type.

## 7. Known M0 Capability Boundaries

- M0 uses one reference image only.
- M0 validates only sufficiently observable attributes.
- Different view angle may produce `REVIEW`, not a missing-component issue.
- Raw OCR differences are not automatically product mismatches.
- Quantity mismatch defaults to `REVIEW` unless configuration is clearly comparable.
- Semantic color comparison should tolerate lighting, shadow, reflection, and white balance.
- Marketplace acceptance is not guaranteed or claimed.
- M0 does not produce persistent Product Profiles.
- Evaluation cases must exist before public claims.

## 8. Unresolved Decisions

Founder should decide before or during Sprint 1:

- anonymous upload retention duration;
- minimum number of controlled eval cases before M0 internal demo;
- whether provisional quantitative gates are accepted or adjusted;
- who reviews and labels early ground-truth/eval cases;
- first 3-5 early users or agencies who can provide realistic product images;
- whether any physical electronics use case is important enough to override deferral.

## 9. Architecture Decisions Changed

- Added explicit domain semantic chain.
- Split observations, product/technical issues, and analysis limitations.
- Removed `not_observable` as product issue semantics.
- Moved provider/model/prompt ownership to model-call records.
- Added `model_policy_version` at analysis level.
- Added external analysis resource semantics for future async evolution.
- Clarified QAEngine as domain layer rather than infrastructure owner.
- Added dedicated evaluation data boundary.

## 10. Sprint 1 Recommendation

READY, with guardrails.

Sprint 1 may scaffold:

- Next.js / Cloudflare project foundation;
- CI and preview deployment;
- environment handling;
- D1/R2 bindings;
- migrations framework;
- base design system;
- structured logging;
- error handling.

Sprint 1 must not implement expanded product scope. It should preserve the M0 contracts above and avoid wiring UI directly to raw model output.
