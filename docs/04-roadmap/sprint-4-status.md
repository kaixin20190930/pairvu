# Sprint 4 Status: QA Engine + OpenAI VisionProvider

Status: Done

## Approved Scope

- QAEngine domain orchestration.
- M0 RiskPolicy.
- VisionProvider interface.
- OpenAI VisionProvider boundary.
- Mock VisionProvider for controlled tests.
- Preserve observation vs policy separation.

## Explicit Non-Scope

- Product UI.
- Batch/API product surface.
- Marketplace checks.
- Persistent Product Profiles.
- Natural failure evaluation.
- Early user validation.

## Implementation Notes

- `OpenAIVisionProvider` uses OpenAI Responses API structured output parsing.
- Provider returns observations and limitations only.
- `M0RiskPolicy` owns severity normalization and verdict.
- Mock provider enables Sprint 5 evaluator integration without requiring real OpenAI calls.

## Completed

- Added QAEngine domain interface and M0 implementation.
- Added M0 RiskPolicy implementation.
- Added VisionProvider interface.
- Added MockVisionProvider.
- Added OpenAIVisionProvider using OpenAI Responses API structured output parsing.
- Added provider output schema and prompt boundary.
- Preserved observation vs policy separation.

## Deviations

None currently.

## Unresolved Decisions

- Production model name for M0 baseline.
- Whether to add model-call persistence in Sprint 4 or defer until analysis persistence.
- How fixture image binaries will be attached to generated controlled cases.

## New Risks

- Real OpenAI calls are not executed in Sprint 4 without an API key and image data URLs.
- Prompt behavior must be measured in Sprint 5 before any user-facing claims.
- OpenAI provider compiles and bundles, but visual accuracy is unmeasured until real image fixtures are available.

## Verification

- `pnpm run lint`: passed.
- `pnpm run typecheck`: passed.
- `pnpm run build`: passed.
- `pnpm opennextjs-cloudflare build`: passed with escalated local execution.

## Next Sprint

Sprint 5: Controlled M0 Evaluation.
