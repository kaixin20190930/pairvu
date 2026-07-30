# Founder MVP Checkpoint: Real Two-Image Product Visual QA

Date: 2026-07-28

Decision: `NOT_READY_FOR_EARLY_USERS`

Product capability status: `READY_FOR_PRODUCTION_HARDENING`

## 1. Preview And Test Instructions

Local preview:

- `http://localhost:3002`

Test flow:

1. Upload one approved product image as the reference.
2. Upload one generated or edited image as the candidate.
3. Select `Check image` and wait for the persisted result.
4. Confirm the verdict, product differences, limitations, and verified checks.
5. Submit `Correct`, `False alarm`, or `Missed something`.
6. Use `Check another image` for the next pair.

The production flow uses:

`R2 -> Analysis -> OpenAIVisionProvider -> QAEngine -> M0RiskPolicy -> D1 -> Result UI -> Feedback`

It does not use `MockVisionProvider`.

## 2. Real OpenAI Smoke-Test Results

All 16 final accepted runs matched founder ground truth.

| Case | Tested behavior | Expected | Final | Result |
| --- | --- | --- | --- | --- |
| T01 | Printed net-volume value changed | FAIL | FAIL | Correct |
| T02 | Logo changed | FAIL | FAIL | Correct |
| T03 | Package/container shape changed | FAIL | FAIL | Correct after prompt `003` |
| T04 | Major package color changed | Not PASS | REVIEW | Correct |
| T05 | Trigger sprayer missing | Not PASS | REVIEW | Correct after prompt `004` |
| T06 | Extra applicator component | Not PASS | REVIEW | Correct |
| T07 | Primary product count changed | Not PASS | REVIEW | Correct |
| T08 | Identical image control | PASS | PASS | Correct |
| T09 | Background-only change | PASS | PASS | Correct |
| T10 | Lighting-only change | PASS | PASS | Correct |
| T11 | Moderate shadow/reflection change | PASS | PASS | Correct |
| T12 | Product repositioning/reframing | PASS | PASS | Correct |
| T13 | Large front-to-back viewpoint change | REVIEW | REVIEW | Correct after prompt `005` |
| T14 | Brand text partially obscured | REVIEW | REVIEW | Correct after prompt `006` |
| T15 | Deterministically degraded/unreadable text | REVIEW | REVIEW | Correct |
| T16 | Product partially cropped by frame | REVIEW | REVIEW | Correct after prompt `007` |

Final verdict distribution:

- `FAIL`: 3
- `REVIEW`: 8
- `PASS`: 5

This is a smoke-test matrix, not a statistically representative accuracy
benchmark. It establishes that the complete production decision path works
across the six M0 check families and the main hard-negative/observability
conditions.

## 3. Obvious False Positives

The following false positives appeared during the matrix and were fixed before
the final accepted runs:

- T03: the shape change leaked into false component and color findings.
- T13: front-label text was incorrectly compared with back-label text and
  reported as changed.
- T14: an occluding mask was incorrectly interpreted as changed Logo/text.

No obvious false positive remains in the final accepted 16-run set.

## 4. Obvious False Negatives

The following false negatives appeared during the matrix and were fixed before
the final accepted runs:

- T05: a clearly missing trigger sprayer initially returned `PASS`.
- T16: the model initially completed cropped candidate evidence from the
  reference and returned `PASS`.

T15's first `PASS` was rejected as an invalid fixture rather than classified as
a product false negative: the original candidate file retained readable text.
The deterministically degraded replacement correctly returned `REVIEW`.

## 5. REVIEW Behavior

Eight of 16 final runs returned `REVIEW`. This is not excessive in this matrix:

- four were intentional non-critical product changes under the approved M0
  policy: color, missing component, extra component, and product count;
- four were intentional observability cases: viewpoint, occlusion, unreadable
  text, and crop.

The current policy is conservative. Early users may still perceive `REVIEW` as
too frequent because this smoke set deliberately over-represents ambiguous and
non-critical change cases. Natural user traffic is required to measure the real
review rate.

## 6. Observability And OCR Weaknesses

- The model can incorrectly reuse readable reference details when candidate
  evidence is cropped or degraded unless the prompt requires independent
  candidate evidence.
- Different package faces must not be compared as corresponding text surfaces.
- Occlusion must be treated as lack of evidence, not evidence of replacement.
- High-detail vision can still read text that appears tiny in the browser
  preview; unreadable-text fixtures must degrade source pixels, not only scale
  the product down in the composition.
- Severe glare, severe Logo occlusion, curved-label OCR, dense ingredient text,
  and multilingual microcopy are not yet covered.
- Bounding boxes and pixel-level localization are outside M0.

## 7. Latency

For the 16 final accepted runs:

- average total analysis latency: `37.8 s`
- median total analysis latency: `33.6 s`
- fastest: `23.1 s`
- slowest: `60.3 s`
- approximate p90: `60.3 s`

The experience is usable for a controlled early workflow but slow for a broad,
high-frequency public tool. Latency optimization was explicitly deferred during
this test round.

## 8. Estimated Cost

Historical accepted-run usage:

- input tokens: `104,315`
- output tokens: `21,294`
- retro-estimated total model cost: `$0.0758`
- retro-estimated average model cost per analysis: `$0.00474`
- observed estimated range per analysis: `$0.00435-$0.00527`

The retrospective estimate uses the published GPT-4.1 mini standard rates of
`$0.40 / 1M` input tokens, `$0.10 / 1M` cached input tokens, and `$1.60 / 1M`
output tokens. Historical records did not preserve cached-token counts, so the
retrospective calculation conservatively prices all historical input as
uncached.

From the next real analysis onward, the provider persists input, cached-input,
output, and estimated cost when the model and usage data support a reliable
calculation. Unsupported models remain unset rather than receiving an invented
cost.

Pricing reference:

- https://developers.openai.com/api/docs/models/gpt-4.1-mini

## 9. Feedback And Telemetry

Implemented and verified:

- analysis started/completed/failed events;
- upload, result-view, retry, and second-check journey events;
- first-touch and session attribution;
- persisted `Correct`, `False alarm`, and `Missed something` feedback;
- provider, model, prompt version, latency, usage, and cost fields kept in
  internal telemetry and hidden from the public result UI;
- retryable provider/network/system failure state that cannot become a product
  verdict.

Current local data includes 27 completed real analyses and 9 persisted feedback
submissions: 8 `Correct` and 1 `Missed something`. This is sufficient to verify
the feedback plumbing, not to estimate user satisfaction or model accuracy.

Detailed issue-level false-alarm reasons and missed-family comments remain
unimplemented.

## 10. Known Product Limitations

- One reference image and one candidate image only.
- CPG categories only; physical electronics remain deferred.
- Semantic visual comparison, not pixel-perfect diffing or legal compliance.
- No bounding boxes or automatic correction.
- No batch, API, teams, billing, Product Profiles, video, or marketplace rules.
- Prompt fixes were validated on a small founder-created matrix and may
  overfit these visual patterns.
- Repeatability was not measured by three independent real-model runs for the
  anchor cases.
- Production D1/R2 migrations, real Turnstile settings, cap/stop controls, and
  monitoring have not yet been validated end to end.
- The OpenAI key previously exposed in an example environment file must be
  rotated before external traffic.

## 11. Recommendation

`NOT READY FOR EARLY USERS`

Reason:

- the core product loop and the final 16-case behavior matrix are ready;
- the remaining blockers are production-release controls, not evidence that the
  core comparison concept failed;
- sending an external link before production migration, credential rotation,
  real abuse-control validation, and production telemetry checks would create
  avoidable privacy, cost, and operational risk.

Minimum release sequence:

1. Rotate the affected OpenAI key.
2. Deploy and verify production D1/R2 migrations and retention cron.
3. Configure real Turnstile keys, public limits, global spend cap, and emergency
   stop control.
4. Verify production success/failure telemetry and cost persistence.
5. Add issue-level false-alarm and missed-item feedback detail.
6. Run one production smoke pair and the P0 privacy/security regression.
7. Return for a short release GO/NO-GO review.

The conditional limited-beta target of 2026-08-10 to 2026-08-14 remains
reasonable if these P0 release controls pass. SEO expansion, batch, API,
marketplace, and Enterprise work remain out of scope until that decision.
