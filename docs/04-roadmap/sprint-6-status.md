# Sprint 6 Status: Real M0 Product MVP

Status: Founder MVP Checkpoint complete; production release gates pending

Last updated: 2026-07-28

## Delivered

- Real two-image checker UI.
- Reference upload and candidate upload.
- Real analysis execution path through `OpenAIVisionProvider -> M0QAEngine -> M0RiskPolicy`.
- Analysis persistence in D1.
- Result UI grouped as Verdict / Product differences / Needs review / Verified / Feedback.
- Retryable execution-error state.
- Feedback capture for `correct`, `false_alarm`, and `missed_something`.
- First-party anonymous journey events with first-touch and session attribution.
- Server-authoritative analysis started/completed/failed events.
- Validated, idempotent, rate-limited client event ingestion.
- Automatic 24-hour anonymous asset deletion through a 15-minute Cloudflare
  scheduled handler.
- Original, normalized, and thumbnail deletion with D1 tombstone and audit.
- Anonymous result, feedback, and input-asset ownership checks.
- Pre-upload retention/provider disclosure and a dedicated `/privacy` page.
- Server-side image signature, decode, corruption, MIME, size, empty-file and
  pixel-limit validation before R2 persistence.
- Real smoke-test manifest and runner scaffold under `eval/real-m0`.
- Real OpenAI credentials configured in the local development environment.
- First real Reference/Candidate pair completed through the production analysis
  path.
- Idempotent analysis creation with a client-stable Analysis ID and request key.
- Refresh recovery that polls and restores the same persisted analysis instead
  of starting another OpenAI call.
- Session-protected recovery of both original image previews after refresh.
- Public result UI no longer exposes provider, model, prompt-policy version,
  internal latency, or cost telemetry.
- Reliable GPT-4.1 mini cost estimation now records input, cached-input, output,
  and estimated cost when provider usage is available.

## Verified

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm run build`: passed.
- Real OpenAI request completed with structured output.
- The system correctly detected a visible capacity change from
  `550 ml / 18.6 fl oz` to `500 ml / 16.9 fl oz`.
- Unchanged logo, dominant color, major components, and major packaging shape
  were preserved at M0 semantic level.
- Final verdict was `FAIL`, which matched founder ground truth.
- Prompt-boundary regression passed with `m0-real-mvp-003`.
- Capacity is now reported only by `visible_text`; quantity correctly reports one
  visible product in both images.
- Evidence visibility is persisted and rendered as `true` for this fully
  observable pair.
- One complete local real-image journey persisted 11 ordered client/server
  events, attribution, result view, feedback, and second-check intent.
- A forced missing-asset analysis persisted as failed with a null verdict and
  emitted `analysis_failed`.
- Real local D1/R2 retention verification deleted all three object variants and
  persisted a completed audit.
- Cross-session result reads, feedback writes, and asset reuse are rejected.
- Repeating a completed analysis POST with the same idempotency key returns the
  original result without creating another analysis.
- Repeating a running analysis POST returns HTTP 202 and the original running
  Analysis; the ownership-protected GET endpoint supports recovery polling.
- Failed executions no longer consume the anonymous completed/running analysis
  quota.
- T03 cross-family policy regression passed: `shape_changed` from
  `major_components` is rejected as invalid provider output instead of becoming
  `missing_component`.
- Correct-session asset preview read returned the complete private image; wrong
  session and missing session were rejected.

## Measured First Real Case

- Provider: OpenAI
- Model: `gpt-4.1-mini`
- Prompt: `m0-real-mvp-001`
- OpenAI latency: 22,851 ms
- Total recorded engine latency: 22,851 ms
- Input tokens: 5,709
- Output tokens: 1,464
- Estimated cost: not persisted
- Founder review: correct core detection and verdict

## Findings Resolved In This Iteration

- Capacity/weight is now owned by `visible_text`; quantity means visible
  product/pack count.
- All six check-family boundaries are explicit in prompt version
  `m0-real-mvp-003`.
- Missing visibility data is no longer rendered as `false`.
- The checker uses generic CPG instead of hard-coded packaged food.
- Match language is constrained to cautious visual claims.
- Refreshing during analysis no longer requires a second paid analysis request;
  the pending Analysis ID and image metadata survive in local storage.
- Refresh recovery now restores both images through an ownership-protected asset
  endpoint while keeping R2 object keys private.
- Mismatch difference kinds are allow-listed per check family by
  `m0-risk-policy-003`; cross-family output becomes a review limitation rather
  than a fabricated product issue.
- `visible_text` now owns wording and values, not typography or font color;
  `dominant_color` owns material body/package palette changes; `major_components`
  owns part presence, not container shape.

## Remaining Product Findings

- Finding consolidation is intentionally deferred until the real 16-case matrix
  reveals a systematic overlap pattern.
- T03 rerun passed: exactly one packaging-shape issue, no component or color
  false positive, and no limitation.
- Regenerated T04 passed founder review: a large package-color change produced
  one high-confidence color issue and `REVIEW`, with all unchanged families
  cleanly verified.
- T05 prompt `004` rerun passed: the exposed threaded bottle neck produced one
  grounded `missing_component` issue and `REVIEW`; the original critical false
  PASS is resolved.
- T05 exposed a provider inconsistency that repeated in T08: `visible_text` was
  a match while its difference kind was `text_changed`. QA engine `003` now
  normalizes this deterministically while preserving raw audit evidence.
- T06 passed cleanly: one additional applicator spoon produced one grounded
  `extra_component` and `REVIEW`; quantity correctly remained one primary
  product and all other families matched.
- T07 passed cleanly: one-to-two primary product quantity produced one grounded
  quantity issue without component or package-shape duplication.
- T08 identical-image baseline passed: no issues or limitations and all six
  check families matched at high confidence.
- T09 background-only hard negative passed: the bathroom scene, plants, marble,
  and distant accessories caused no product issue or limitation; all six
  product families matched at high confidence.
- T10 lighting hard negative passed: warmer lighting, exposure, and background
  tone caused no product-color issue or limitation; all six product families
  matched at high confidence.
- T11 moderate shadow/reflection hard negative passed: window-grid shadows,
  floor shadows, and can highlights caused no issue or limitation; severe
  label-obscuring glare remains an observability case.
- T12 real-world reframing hard negative passed: the product moved left and was
  substantially smaller without causing an issue or limitation. The scale
  change is a documented fixture confound, accepted for smoke-test purposes.
- T13 large-viewpoint rerun passed with `REVIEW`, no product issue, and separate
  high-confidence Logo/text observability limitations. Prompt
  `m0-real-mvp-005` resolved the front-versus-back false FAIL; RiskPolicy remains
  unchanged.
- T14 occlusion rerun passed with `REVIEW`, no product issue, one visible-text
  observability limitation, and five verified families. The mask primarily
  covered brand text while the star Logo remained observable; dedicated severe
  Logo-occlusion coverage remains a documented non-blocking fixture gap.
- T15 deterministic text-degradation rerun passed with `REVIEW`, no product
  issue, Logo/text observability limitations, and four verified structural
  families. The checker did not infer unreadable candidate text from the
  reference.
- T16 partial-product rerun passed with `REVIEW`, no product issue, text/shape
  coverage limitations, and four verified families. Prompt
  `m0-real-mvp-007` resolved reference-based candidate completion; the 16-case
  real-image matrix is complete.
- QA engine `m0-qa-engine-003` now canonicalizes any match observation to
  `differenceKind = none` and preserves contradictory provider values in raw
  audit evidence; Prompt and RiskPolicy remain unchanged.
- Historical T01-T16 cost was not persisted, but was retrospectively estimated
  from recorded usage. New supported-model analyses persist a reliable estimate;
  unsupported or incomplete usage remains unset.
- Preview D1 now has migrations `0001` through `0005`; production deployment is
  still pending.
- Detailed false-alarm and missed-item feedback is still pending.
- Real Turnstile keys and production configuration are still needed before
  inviting public traffic.

## Prompt Boundary Regression

- Report: `eval/real-m0/reports/real-pair-latest.json`
- Verdict: FAIL
- Product issues: one `text_mismatch`
- Quantity: match
- Category: generic CPG
- OpenAI latency: 25,408 ms
- Input/output tokens: 5,974 / 1,269
- Historical measured prompt: `m0-real-mvp-002`
- `pnpm typecheck`: passed
- `pnpm lint`: passed
- `pnpm run build`: passed
- Browser upload and result rendering: passed

The real result uses cautious match wording and no longer displays missing
visibility evidence as `false`.

## Unresolved Decisions

- Keep `gpt-4.1-mini` as the M0 baseline until the real controlled matrix is
  complete.
- Use local, single-variable fixtures for the release gate.
- Keep Wikimedia/different-product cases for later natural-failure testing.
- Do not redesign taxonomy or RiskPolicy before the controlled matrix shows a
  systematic need.

## New Risks

- Public users cannot be acquired safely before analytics, automatic deletion,
  access control, abuse controls, and spend limits exist.
- Existing real smoke cases sometimes compare different products and therefore
  confound multiple change families.
- The current result UI can display technically contradictory evidence.
- Public SEO/social traffic would be unmeasurable with the current event system.
- A real OpenAI key was found in `.dev.vars.example`. The example file has been
  sanitized and the real value remains only in ignored `.dev.vars`; rotate the
  affected key before public beta.
- Public Turnstile keys and production validation of session/day/global caps
  and the emergency stop control remain pending.
- Browser automation could not complete the native file chooser step for the
  live refresh test. Founder confirmed result polling survives refresh; the new
  double-preview restoration still needs one founder browser recheck.

## Next Step

Stop at the Founder MVP Checkpoint:

- [M0 Public Beta Launch Plan](m0-public-beta-launch-plan.md)
- [M0 Public Beta Live Tracker](m0-public-beta-tracker.md)
- [Founder MVP Checkpoint](founder-mvp-checkpoint-2026-07-28.md)

The real 16-case matrix is complete. Do not invite public traffic until the
checkpoint's production migration, key rotation, real guardrail, telemetry,
feedback-detail, and P0 privacy/security verification sequence is complete.

## 2026-07-28 T03/T04 Integrity Fix

- Current prompt: `m0-real-mvp-003`
- Current RiskPolicy: `m0-risk-policy-003`
- Added secure `GET /api/assets/[assetId]` preview restoration.
- Correct-session preview verification: HTTP 200, `image/png`, complete
  1,629,772-byte response.
- Wrong-session verification: HTTP 404.
- Missing-session verification: HTTP 400.
- `pnpm run test:m0:policy-boundaries`: passed.
- `pnpm run eval:m0`: 90/90 cases, all promotion gates passed.
- `pnpm run typecheck`: passed.
- `pnpm run lint`: passed.
- `pnpm run build`: passed.

Retest order:

1. Complete the Founder MVP Checkpoint from the 16-case matrix and real telemetry.

## 2026-07-28 T03 Founder Rerun

- Verdict: `FAIL`, matching expected behavior.
- Product issues: one `packaging_mismatch`, critical/high.
- Difference kind: `shape_changed`.
- Limitations: none.
- Verified: logo, visible text, quantity, dominant color, and major components.
- Previous false `missing_component`: resolved.
- Previous contradictory color finding: resolved.
- Finding duplication: none.
- Refresh recovery: both images visible after reload.
- Public telemetry hiding: verified.
- Review record: `eval/real-m0/manual-review-log.md`.

## 2026-07-28 T04 Founder Rerun

- Expected behavior: Not PASS.
- Verdict: `REVIEW`, matching expected behavior.
- Product issues: one `color_mismatch`, high/high.
- Difference kind: `color_changed`.
- Limitations: none.
- Verified: logo, visible text, quantity, major components, and major
  shape/packaging.
- Duplicate Logo/Text finding: none.
- RiskPolicy deviation: none; color remains a review-level family in M0.
- Review record: `eval/real-m0/manual-review-log.md`.

## 2026-07-28 T05 Missing-Component Failure

- Expected behavior: Not PASS.
- Actual behavior before fix: `PASS`.
- Candidate visibly lacks the reference trigger sprayer.
- Provider evidence incorrectly claimed the candidate sprayer was present.
- Classification: critical false PASS at the Vision observation layer.
- RiskPolicy deviation: none; no component mismatch reached the policy.
- Remediation: `m0-real-mvp-004`, explicit image labels, high-detail image
  inputs, independent component inventories, and exposed-neck rules.
- Controlled regression after remediation: 90/90, all gates passed.
- Real T05 rerun: passed with `REVIEW`, one high/high `missing_component`, and
  grounded exposed-neck evidence.
- Unchanged families: logo, visible wording/value, quantity, dominant color, and
  bottle shape/packaging.
- Remaining observation inconsistency: visible-text match carried
  `text_changed`; no verdict impact.
- Review record: `eval/real-m0/manual-review-log.md`.

## 2026-07-28 T06 Extra-Component Review

- Expected behavior: Not PASS.
- Verdict: `REVIEW`, matching expected behavior.
- Product issues: one `extra_component`, high/high.
- Difference kind: `component_extra`.
- Limitations: none.
- Verified: logo, visible text/value, primary-product quantity, dominant color,
  and major bottle shape/packaging.
- Quantity/component boundary: correct; the accessory was not treated as a
  second primary product.
- Duplicate findings: none.
- Review record: `eval/real-m0/manual-review-log.md`.

## 2026-07-28 T07 Quantity Review

- Expected behavior: Not PASS.
- Verdict: `REVIEW`, matching expected behavior.
- Product issues: one `quantity_mismatch`, high/high.
- Difference kind: `count_changed`.
- Limitations: none.
- Verified: logo, visible text/value, dominant color, component types, and
  package shape.
- Quantity/component boundary: correct; the second identical box was not
  reported as an extra component.
- Duplicate findings: none.
- Review record: `eval/real-m0/manual-review-log.md`.
