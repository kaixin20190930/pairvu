# M0 Controlled Evaluation

This directory contains reproducible M0 controlled evaluation fixtures and reports.

## Commands

Generate the approved controlled fixture set:

```bash
pnpm fixtures:m0
```

Run evaluation against predictions:

```bash
pnpm eval:m0 -- --predictions eval/m0/sample-predictions.json
```

The sample predictions are expected-aligned and only verify evaluator math. Sprint 5 must replace them with QA Engine output.

## Required Metrics

- critical recall
- false-pass rate
- hard-negative false alarms
- not-observable accuracy
- verdict repeatability
- issue agreement
- latency
- estimated cost

## M0 Gates

These are internal promotion gates, not commercial SLAs:

- Critical seeded-error recall >= 85%
- Critical false-pass rate <= 10%
- Hard-negative false-alarm rate <= 20%
- Not-observable handling accuracy >= 90%
- Verdict repeatability >= 90%
