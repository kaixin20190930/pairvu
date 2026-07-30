# Error Taxonomy

Use stable canonical IDs. Never use display text as the canonical issue identifier.

## Canonical Issue Types

Product issues:

- `logo_mismatch`
- `text_mismatch`
- `quantity_mismatch`
- `color_mismatch`
- `major_shape_mismatch`
- `missing_component`
- `extra_component`
- `packaging_mismatch`
- `variant_mismatch`

Technical issues:

- `resolution_too_low`
- `unsupported_file_type`
- `file_too_large`
- `image_decode_failed`
- `blur_detected`
- `crop_risk`
- `background_noncompliant`
- `watermark_detected`
- `transparency_detected`

Analysis / input limitations:

- `reference_insufficient`
- `candidate_insufficient`
- `reference_conflict`
- `attribute_not_observable`
- `coverage_insufficient`

System limitations:

- `model_error`
- `analysis_timeout`
- `unknown`

## Severity

- `critical`: likely publication blocker or identity mismatch.
- `high`: important issue that normally requires correction or review.
- `medium`: meaningful issue but may be acceptable depending on context.
- `low`: advisory issue.

## Observation Status

- `pass`
- `match`
- `mismatch`
- `uncertain`
- `not_applicable`

## Observability

- `observable`
- `partially_observable`
- `not_observable`

## Analysis Verdict

- `pass`
- `review`
- `fail`

`not_observable` is an observability state, not a product defect. RiskPolicy may convert important insufficient observability into a `review` verdict.
