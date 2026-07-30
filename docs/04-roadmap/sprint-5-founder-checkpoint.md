# Founder Checkpoint: Sprint 5 Controlled M0 Evaluation

Status: Completed; Founder Checkpoint Required

## What Sprint 5 Measures

Sprint 5 measures the controlled evaluation infrastructure wired through the implemented QAEngine and M0RiskPolicy.

Because controlled fixture image binaries are not yet attached, this checkpoint does not measure OpenAI visual accuracy. It measures:

- fixture generation;
- QAEngine orchestration;
- M0RiskPolicy verdict behavior;
- evaluator metric calculation;
- repeatability plumbing;
- report generation.

## Required Gate Metrics

- Critical seeded-error recall >= 85%
- Critical false-pass rate <= 10%
- Hard-negative false-alarm rate <= 20%
- Not-observable handling accuracy >= 90%
- Verdict repeatability >= 90%

## Commands

```bash
pnpm fixtures:m0
pnpm eval:m0:controlled
pnpm eval:m0 -- --predictions eval/m0/controlled-predictions.json --report eval/m0/reports/controlled-latest.json
```

## Capability Boundary

Passing this checkpoint does not mean the model can visually detect seeded errors in real images. That requires actual fixture images and real OpenAI VisionProvider execution.

## Measured Results

Source:

- cases: `eval/m0/controlled-cases.json`
- predictions: `eval/m0/controlled-predictions.json`
- report: `eval/m0/reports/controlled-latest.json`

Results:

- Controlled cases evaluated: 90 / 90
- Controlled predictions generated: 100, including repeat runs for the first 10 cases
- Critical seeded-error recall: 100.0%
- Critical false-pass rate: 0.0%
- Hard-negative false-alarm rate: 0.0%
- Not-observable handling accuracy: 100.0%
- Verdict repeatability: 100.0%
- Issue agreement: 100.0%
- Median latency: 0ms
- Estimated cost: $0.0000
- Internal gates: PASS

## Interpretation

This PASS confirms:

- fixture generation works;
- the evaluator computes the approved M0 metrics;
- predictions can be generated through the implemented QAEngine path;
- M0RiskPolicy handles seeded product issues, hard negatives, limitations, and repeatability as expected.

This PASS does not confirm:

- OpenAI visual accuracy;
- OCR reliability;
- real-image false-pass rate;
- prompt quality;
- preprocessing quality;
- production unit economics.

## Recommendation Criteria

READY for Sprint 6 internal demo only if founder accepts the fixture-binary limitation.

NOT READY for public M0 use until controlled evaluation is run against actual image fixtures and model outputs.

## Recommendation

STOP for Founder Checkpoint.

Recommended next decision:

- Accept this as a policy/evaluation-infrastructure checkpoint and proceed to Sprint 6 internal demo scaffolding; or
- Require actual controlled fixture images and real OpenAI VisionProvider predictions before Sprint 6.

I recommend the second path if the internal demo is meant to demonstrate real visual QA quality. I recommend the first path only if Sprint 6 is explicitly treated as an internal workflow demo with mocked/fixture-backed results.
