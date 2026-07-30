# Sprint 3 Status: M0 Evaluation Infrastructure

Status: Done

## Approved Scope

- Reproducible controlled fixture generation.
- M0 evaluation metrics.
- Report output.
- Internal promotion gates.
- Repeatability measurement.
- Fixture provenance metadata.

## Explicit Non-Scope

- OpenAI calls.
- QA Engine prediction generation.
- Natural failure evaluation.
- Early user validation.
- Public claims or commercial SLA reporting.

## Implementation Notes

- `pnpm fixtures:m0` generates the controlled fixture set.
- `pnpm eval:m0` evaluates predictions against the fixture set.
- Sample predictions verify evaluator math only; Sprint 5 must replace them with QA Engine output.

## Completed

- Added reproducible M0 fixture generator.
- Generated 90 controlled M0 cases.
- Added sample prediction file for evaluator verification.
- Added M0 evaluator.
- Added JSON report output under `eval/m0/reports/`.
- Added internal gate calculation.
- Added latency and estimated-cost reporting.

## Deviations

None currently.

## Unresolved Decisions

- Whether the founder wants to manually edit generated controlled cases before Sprint 5.
- Whether to add a second reviewer before Natural Failure Evaluation.

## New Risks

- Generated fixture descriptions are placeholders until actual image fixtures are added.
- Metrics are only meaningful once predictions come from the QA Engine rather than the sample aligned predictions.

## Verification

- `pnpm fixtures:m0`: passed, generated 90 cases.
- `pnpm eval:m0 -- --predictions eval/m0/sample-predictions.json`: passed evaluator gates using sample aligned predictions.
- `pnpm run lint`: passed.
- `pnpm run typecheck`: passed.
- `pnpm run build`: passed.

## Next Sprint

Sprint 4: QA Engine + OpenAI VisionProvider.
