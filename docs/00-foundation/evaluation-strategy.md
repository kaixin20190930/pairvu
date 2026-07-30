# Evaluation Strategy

## Why Evaluation Is Mandatory

The product is not trustworthy because it can compare two images once. It is trustworthy only if behavior can be measured across stable cases and regressions can be caught before production changes.

Evaluation starts at M0.

## Golden Evaluation Dataset

Create dedicated `eval_cases` with:

- one reference image for M0;
- candidate image;
- expected verdict;
- expected detected issue types;
- expected limitations;
- expected observability;
- severity;
- category;
- difficulty;
- notes;
- human-reviewed ground truth.

Difficulty values:

- `easy`
- `medium`
- `hard`
- `adversarial`

## Required Metrics

- overall precision;
- overall recall;
- false pass rate;
- false fail rate;
- critical seeded-error recall;
- critical false-pass rate;
- hard-negative false-alarm rate;
- not-observable handling accuracy;
- verdict repeatability;
- issue-type repeatability;
- per-error performance;
- per-category performance;
- cost per case;
- latency per case;
- review rate.

False Pass Rate is the most important release-blocking metric.

## M0 Evaluation Rounds

### Round A: Controlled Evaluation

Create synthetic or controlled cases with intentionally seeded errors:

- logo altered;
- `500 ml` -> `550 ml`;
- product count changed;
- black -> red;
- cap removed;
- package geometry altered.

Also create hard negatives that should not be treated as fidelity failures:

- background change;
- lighting change;
- shadow;
- scale;
- camera angle;
- reflection;
- repositioning.

Add unobservable cases:

- logo occluded;
- text too small;
- component hidden by angle;
- candidate shows non-comparable view;
- reference quality insufficient.

### Round B: Natural Failure Evaluation

Use real AI-generated or edited product imagery containing naturally occurring fidelity failures.

### Round C: Early User Validation

Test with real ecommerce users or agencies.

Do not use user enthusiasm as a substitute for technical evaluation.

## Provisional M0 Gates

These are founder-review thresholds, not commercial SLAs:

- Critical seeded-error recall >= 85%
- Critical false-pass rate <= 10%
- Hard-negative false-alarm rate <= 20%
- Not-observable handling accuracy >= 90%
- Verdict repeatability >= 90%

Challenge or revise these thresholds during founder review, but do not launch M0 with only subjective success criteria.

## Repeatability

The same Reference + Candidate pair should be runnable multiple times.

Measure:

- verdict agreement;
- issue-type agreement;
- limitation agreement.

Model or prompt changes must run regression evaluation before promotion.

## Release Rule

Every change to model, prompt, image preprocessing, scoring, rule logic, or risk policy must be evaluable against the same dataset.

A new model or prompt cannot silently replace production behavior. Every analysis stores:

- `qa_engine_version`
- `risk_policy_version`
- `model_policy_version`
- `rule_set_version`

Every model call stores:

- `provider`
- `model`
- `prompt_version`
- usage;
- latency;
- estimated cost.

## Feedback Loop

Result pages should collect:

- Correct
- Missed something
- False alarm

For `REVIEW` and `FAIL` issues:

- Accept issue
- Dismiss issue

Do not immediately use raw feedback as training data. Store it as `human_feedback`. Only reviewed, permitted, and cleaned samples become evaluation or training data.

## Data Boundaries

Customer Production Data is not the same thing as Evaluation Fixtures or Training Data.

```text
Customer Production Data != Evaluation Fixtures != Training Data
```

Production feedback may only become evaluation or training data through an explicit reviewed and permitted promotion process.

Golden Evaluation assets should live in dedicated eval storage or be copied into eval-controlled fixtures with permission. Do not create long-term Golden Dataset dependencies on deletable customer assets.
