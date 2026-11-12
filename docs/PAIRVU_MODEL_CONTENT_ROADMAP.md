# Pairvu model-content roadmap and evidence rules

## Product position

Pairvu is an evidence-linked model comparison publication. It explains versioned model facts, prices, and benchmark results without manufacturing a universal score. Pages are useful only when a reader can reach the model owner, API provider, or benchmark owner that supports each material claim.

## Data and comparison rules

- Record the exact model version, provider, source URL, access date, region, currency, and billing mode.
- Convert currencies only with a dated, cited snapshot while preserving the original amount. Do not build live FX behavior.
- Show a direct quality comparison only when one source and one harness cover every exact version in the table. Otherwise state that no directly comparable result exists.
- Keep benchmark-owner baselines separate from vendor reports and disclose configurations that materially affect scores.
- Treat “no current model-specific public hosted price” as unknown—not free and not permission to substitute a successor model.
- Deduplicate sources by URL and keep model, comparison, and relevant benchmark pages mutually reachable.

## Controlled expansion gate

Do not scale comparison inventory until all conditions hold: at least 20 sourced public model profiles; every public model has at least one reasonable comparison inbound link; each release batch reaches at least 80% GSC indexing; and there is no concentrated canonical or soft-404 problem. Without connected GSC evidence, the indexing gate is BLOCKED and the decision is **do not scale**.

## Qwen4 preview lifecycle

Qwen4-Max-Preview is a paired model/comparison release. Alibaba documents Token Plan-only access, no pay-as-you-go price, and retirement at 2026-11-25 24:00 UTC+8. On expiry, mark availability as a retired preview and reassess current-list placement; preserve the historical URLs rather than silently deleting them.

## Observation cadence

- Weekly: check official price/model availability, Qwen4 lifecycle, broken sources, orphaned profiles, sitemap, and status codes.
- Weekly GSC reminder: report data only when connected; otherwise request a manual export and never infer submission or indexing.
- Monthly: review model count, comparison coverage, staleness, and batch indexing. If any expansion gate is unmet, record **do not scale**.
