# M0 Validation Protocol

## Goal

Convert M0 from a feature list into a falsifiable validation protocol.

M0 proves whether product-fidelity detection is useful and measurable for a narrow product category. It does not prove every category, marketplace, or workflow.

## Boundary

M0 remains:

Reference Image + Candidate Image -> Validate -> PASS / REVIEW / FAIL

M0 includes exactly these six fidelity check families:

1. Logo consistency
2. Visible text consistency
3. Product quantity
4. Dominant product color
5. Major product components
6. Major shape / packaging identity

M0 does not add:

- batch;
- marketplace support;
- public API;
- persistent Product Profiles;
- multiple categories;
- automatic fixes;
- teams;
- billing complexity.

## Supported Category

M0 focuses on consumer packaged products with stable visible identity:

- cosmetics;
- beverages;
- personal care;
- packaged food;
- household packaged goods.

Physical electronics are deferred unless early customer evidence shows strong need. Electronics often require ports, hardware details, functional variants, and multi-angle reasoning; that increases false-pass risk and category complexity before the core protocol is proven.

## Reference Definition

A Reference is a user-trusted real or approved product image used as ground truth for visible product identity.

M0 uses one reference image only.

Limitation:

M0 can only validate attributes that are sufficiently observable in both the reference and candidate. A candidate showing a different view must not cause invisible attributes to be classified as missing.

## Result States

User-facing analysis verdicts:

- `PASS`
- `REVIEW`
- `FAIL`

Observation-level observability:

- `observable`
- `partially_observable`
- `not_observable`

Analysis/input limitations:

- `reference_insufficient`
- `candidate_insufficient`
- `reference_conflict`
- `coverage_insufficient`
- `uncertain_observation`
- `missing_requested_check`
- `provider_output_invalid`

The engine must prefer abstention or `REVIEW` over guessing.

## Operational Definitions

### 1. Logo Consistency

Purpose:

Check whether the candidate preserves the identity-bearing logo or brand mark visible in the reference.

What is compared:

- logo presence;
- logo text or mark;
- approximate placement when identity-relevant;
- obvious deformation or substitution.

Mismatch examples:

- wrong brand logo;
- altered brand text;
- logo replaced by a similar-looking mark;
- logo removed when clearly visible and expected.

Acceptable variation examples:

- perspective distortion;
- partial visibility;
- lighting or glare;
- small crop that does not change identity;
- scale or position shift that preserves identity.

`not_observable` conditions:

- logo is too small, occluded, blurred, cropped, or not visible in one image;
- candidate shows a view where the logo would not be expected to appear.

Default severity:

- `critical` for confirmed wrong brand/logo;
- `high` for likely alteration;
- `review` when partial or uncertain.

Known limitations:

- similar brand marks may require human review;
- reflections and curved packaging can distort logos.

### 2. Visible Text Consistency

Purpose:

Check identity-bearing visible text, not every OCR character.

Priority text:

- brand;
- model;
- variant;
- size;
- volume;
- weight;
- flavor;
- shade;
- material or package claim when SKU-defining.

What is compared:

- semantic text content and units;
- identity-bearing labels;
- SKU/variant markers.

Mismatch examples:

- `500 ml` changed to `550 ml`;
- flavor changed from vanilla to strawberry;
- shade name changed;
- model number changed;
- brand text altered.

Acceptable variation examples:

- OCR punctuation difference;
- casing difference;
- tiny legal copy differences;
- unreadable microtext;
- layout shift without semantic change.

`not_observable` conditions:

- text is too small, blurred, occluded, cropped, or hidden by angle;
- reference or candidate lacks readable text for the compared area.

Default severity:

- `critical` for confirmed SKU-defining text mismatch;
- `high` for likely identity-bearing mismatch;
- `medium` for non-critical visible copy difference.

Known limitations:

- raw OCR character differences alone are not product mismatches;
- multilingual packaging may need later category or locale support.

### 3. Product Quantity

Purpose:

Check whether the candidate changes the number of represented products or units when that count appears identity-relevant.

What is compared:

- visible primary product count;
- bundle/unit configuration when clearly comparable;
- duplicated or missing product units.

Mismatch examples:

- one bottle becomes two bottles;
- pack of 3 becomes pack of 4;
- accessory count changes when clearly part of the product.

Acceptable variation examples:

- intentional lifestyle composition;
- reflection that looks like duplication;
- partial crop that hides duplicate context;
- decorative background items clearly not the product.

`not_observable` conditions:

- unit boundaries are unclear;
- candidate composition intentionally changes scene;
- reference does not establish expected unit configuration.

Default severity:

- `review` by default;
- `high` only when unit configuration is clearly comparable and identity-relevant;
- `critical` only for obvious wrong pack size or SKU-defining quantity.

Known limitations:

- M0 should avoid automatically failing intentional multi-product compositions.

### 4. Dominant Product Color

Purpose:

Check semantic product color, not raw pixel/RGB equality.

What is compared:

- dominant package or product color;
- SKU-defining shade/color;
- major color family.

Mismatch examples:

- black bottle becomes red;
- blue package becomes green;
- shade-indicating color visibly changes.

Acceptable variation examples:

- lighting;
- shadow;
- white balance;
- reflection;
- minor saturation or exposure differences;
- background color changes.

`not_observable` conditions:

- color is distorted by heavy glare, shadow, blur, or occlusion;
- candidate uses monochrome/stylized treatment that prevents semantic color comparison.

Default severity:

- `high` for confirmed SKU-defining color mismatch;
- `review` for lighting-sensitive differences.

Known limitations:

- model should compare semantic color names/families, not raw RGB values.

### 5. Major Product Components

Purpose:

Check discrete visible components that materially identify the product.

Examples:

- cap;
- pump;
- handle;
- lid;
- nozzle;
- straw;
- applicator;
- accessory;
- label panel.

What is compared:

- presence, absence, or extra major components visible in both images.

Mismatch examples:

- pump removed;
- cap missing;
- handle added;
- accessory included or omitted when reference makes it clearly part of the product.

Acceptable variation examples:

- component hidden by angle;
- minor perspective shift;
- small occlusion;
- component present but partially cropped.

`not_observable` conditions:

- relevant component is not visible due to angle, occlusion, crop, or blur;
- reference does not establish the component clearly.

Default severity:

- `high` for confirmed missing/extra identity-relevant component;
- `review` when visibility or intentional configuration is uncertain.

Known limitations:

- avoid overlap with shape / packaging identity; components are discrete parts, not overall geometry.

### 6. Major Shape / Packaging Identity

Purpose:

Check overall product/container geometry and packaging proportions.

What is compared:

- bottle, jar, tube, box, pouch, carton, or package silhouette;
- major proportions;
- container type;
- packaging identity.

Mismatch examples:

- bottle becomes box;
- tube becomes jar;
- tall slim bottle becomes short wide bottle;
- package geometry substantially changes.

Acceptable variation examples:

- perspective;
- camera angle;
- scale;
- small crop;
- minor lens distortion.

`not_observable` conditions:

- product is heavily cropped, occluded, blurred, or shown from a non-comparable angle;
- reference/candidate does not show enough of the container.

Default severity:

- `critical` for confirmed major packaging identity mismatch;
- `high` for likely shape mismatch;
- `review` for angle-sensitive cases.

Known limitations:

- do not double-count discrete component differences here unless the component changes the overall product identity.

## M0 Risk Policy

Version: `m0-risk-policy-001`

Model output must not directly determine final `PASS` / `REVIEW` / `FAIL`. The model reports observations, comparisons, confidence, and observability. A deterministic RiskPolicy decides the verdict.

### FAIL

Return `FAIL` for confirmed high-confidence critical product identity mismatch.

Examples:

- wrong brand/logo;
- critical visible text mismatch;
- major packaging identity mismatch.

### REVIEW

Return `REVIEW` for:

- uncertain mismatch;
- low observability;
- potentially important attribute not observable;
- moderate mismatch;
- reference quality insufficient;
- candidate quality insufficient;
- intentional quantity variation cannot be established;
- insufficient coverage to pass safely.

### PASS

Return `PASS` only when:

- no meaningful mismatch is detected;
- sufficient identity attributes are observable;
- no analysis/input limitation materially affects selected checks.

Never return `PASS` merely because the model found no issue.

## Observability / Coverage

M0 must track coverage across the six selected checks:

- selected checks count;
- sufficiently observable checks count;
- partially observable checks count;
- insufficient checks count.

Coverage is sufficient only when enough identity-bearing attributes are observable to justify the verdict. Exact coverage thresholds can be tuned during evaluation, but low coverage defaults to `REVIEW`, not `PASS`.

## Evaluation Protocol

### Round A: Controlled Evaluation

Create synthetic or controlled cases with seeded errors:

- logo altered;
- `500 ml` -> `550 ml`;
- product count changed;
- black -> red;
- cap removed;
- package geometry altered.

Create hard negatives that should not be treated as fidelity failures:

- background change;
- lighting change;
- shadow;
- scale;
- camera angle;
- reflection;
- repositioning.

Add `not_observable` cases:

- text too small;
- logo occluded;
- component hidden by angle;
- cropped package identity.

### Round B: Natural Failure Evaluation

Use real AI-generated or edited product imagery containing naturally occurring fidelity failures.

Do not rely only on synthetic examples.

### Round C: Early User Validation

Test with real ecommerce users or agencies.

Do not use user enthusiasm as a substitute for technical evaluation.

## Provisional Quantitative Gates

These are founder-review thresholds, not commercial SLAs.

- Critical seeded-error recall >= 85%
- Critical false-pass rate <= 10%
- Hard-negative false-alarm rate <= 20%
- Not-observable handling accuracy >= 90%
- Verdict repeatability >= 90%

Track additionally:

- issue-type agreement across repeat runs;
- median and P95 latency;
- estimated cost per check;
- review rate by check type.

## Repeatability Testing

The same Reference + Candidate pair should be runnable multiple times.

Measure:

- verdict agreement;
- issue-type agreement;
- limitation agreement.

Model or prompt changes must run regression evaluation before promotion.

## Result Design

Show:

1. Verdict
2. Critical product issues
3. Review reasons and limitations
4. Passed observable checks
5. Technical issues/details
6. Feedback

Never lead with a generic AI score.

## Progress States

- Reading product identity
- Checking visible text
- Comparing branding
- Checking product details
- Evaluating differences

Do not fake progress percentages.

## Required Data Capture

Every analysis stores:

- analysis ID;
- one reference asset ID;
- candidate asset ID;
- selected checks;
- observations;
- product issues;
- technical issues;
- limitations;
- coverage;
- final verdict;
- QA engine version;
- risk policy version;
- model policy version;
- model call records;
- latency;
- estimated cost;
- feedback if submitted.

## Founder Review Checklist

- M0 scope is still limited to reference + candidate.
- Category is limited to consumer packaged products with stable visible identity.
- `not_observable` is implemented as observability, not an issue.
- False Pass is tracked as primary risk.
- Eval rounds A/B/C are defined.
- Quantitative gates are accepted or explicitly revised.
- Product language avoids guaranteed marketplace acceptance.
- Data retention and third-party model processing are disclosed.
