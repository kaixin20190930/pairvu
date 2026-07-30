# Domain Semantics

This document freezes M0 language before implementation. The same term must not represent different layers of the system.

## Semantic Chain

```text
Asset -> Reference / Candidate -> Check -> Observation -> Issue or Limitation -> Risk Decision -> Analysis Verdict
```

## Core Terms

### Asset

A stored visual file and its metadata. M0 asset type is `image`. Future asset types may include `video`, but video is not implemented in M0.

### Reference

A user-trusted real or approved product image used as ground truth for visible product identity.

M0 uses exactly one reference image. The reference is not a persistent Product Profile.

Limitation: M0 can only validate attributes that are sufficiently observable in both the reference and candidate. A candidate showing a different view must not cause invisible reference attributes to be classified as missing.

### Candidate

The generated, edited, supplier-provided, or otherwise untrusted product image being checked against the reference.

### Product Identity

The visible characteristics that make the product recognizable and publishable as the intended SKU or variant. In M0 this is limited to logo, identity-bearing text, quantity, semantic product color, major components, and major shape / packaging identity.

### Analysis

One user/domain validation request. In M0 this means one trusted reference image and one candidate image checked against the approved six fidelity families.

An analysis has one final user-facing verdict when completed.

### Execution Attempt

One attempt to complete an analysis.

M0 does not require an independent execution-attempt persistence model during Sprint 1. The domain design must still preserve the concept so retries, failures, and future asynchronous execution do not collapse into the analysis itself.

### Model Call

One provider invocation made during an execution attempt. One analysis may eventually involve zero, one, or many model calls.

Provider, model, prompt version, usage, latency, cost, and provider error metadata belong to model-call records, not to the analysis concept itself.

### Check

A configured comparison family such as logo consistency or visible text consistency. A check defines what kind of observation should be made.

### Observation

A provider-neutral statement about what is visible and how reference and candidate compare. Observations include reference facts, candidate facts, comparison result, observability, confidence, and evidence.

Observations do not own final product policy. Example:

```text
Reference text = "500 ml"
Candidate text = "550 ml"
Comparison = mismatch
Confidence = high
```

The RiskPolicy decides whether this creates `FAIL`, `REVIEW`, or `PASS`.

### Issue

A product or technical problem derived from one or more observations.

Product issues include:

- logo mismatch;
- text mismatch;
- quantity mismatch;
- color mismatch;
- component mismatch;
- shape / packaging mismatch.

Technical issues include:

- resolution too low;
- blur;
- decode failure;
- unsupported file type;
- crop risk;
- background noncompliance when a rule requires it.

### Analysis Limitation

A reason the analysis cannot safely make a product-fidelity decision. Limitations are not product defects.

Examples:

- reference insufficient;
- candidate insufficient;
- attribute not observable;
- reference conflict;
- model/provider failure;
- analysis timeout.

RiskPolicy may convert important limitations into `REVIEW`.

### Observability

Whether the relevant attribute is visible enough to compare.

Values:

- `observable`
- `partially_observable`
- `not_observable`

Low observability must not produce `PASS` merely because no mismatch was detected.

### Confidence

How reliable the observation appears, based on image quality, visibility, model certainty, and evidence quality.

Values:

- `high`
- `medium`
- `low`

Do not present fake precision such as `96.73% accurate`.

### Severity

Product or business impact if an issue is real.

Values:

- `critical`
- `high`
- `medium`
- `low`

Severity belongs to policy normalization. The model may suggest impact, but the RiskPolicy owns final severity.

### Risk Decision

A deterministic, versioned policy decision that converts observations, issues, limitations, confidence, severity, and coverage into a verdict.

### Analysis Verdict

The final user-facing result:

- `PASS`
- `REVIEW`
- `FAIL`

`PASS` means: no meaningful mismatch was detected within sufficiently observable selected checks.

`PASS` never means: the product is guaranteed correct.
