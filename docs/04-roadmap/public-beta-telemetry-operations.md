# Public Beta Telemetry Operations

Last updated: 2026-07-30

## Purpose

This document defines the first-party measurement loop for Pairvu public beta.
It is intentionally aggregate-first: it supports product and acquisition decisions
without exporting uploaded images, filenames, OCR text, visual evidence, notes, or
anonymous session identifiers.

## Event And Feedback Flow

```text
Landing view
  -> Checker started
  -> Reference upload started/completed/failed
  -> Candidate upload started/completed/failed
  -> Analysis started/completed/failed (server authoritative)
  -> Result viewed
  -> Feedback submitted
  -> Second check started
```

Upload failures include a stable error code, HTTP status when available, MIME type,
and a file-size bucket. They never include the uploaded file or its filename.

Feedback is stored in `analysis_feedback` and is joined to its analysis by
`analysis_id`.

- `correct`: one-click confirmation.
- `false_alarm`: requires a reason and the specific detected finding that was wrong.
- `missed_something`: requires one M0 check family and may include a short note.

## Daily Report

Run the production report locally:

```bash
pnpm run beta:daily-report -- --date 2026-07-30
```

Omit `--date` to use the current date in `Asia/Shanghai`. The script is read-only
and queries production D1 through Wrangler. It prints:

1. product funnel and step conversion;
2. acquisition sources, UTM campaign, referrer, and completed-check rate;
3. verdict, latency, and reliable estimated-cost aggregates;
4. feedback reason and check-family distribution;
5. feedback joined to verdict, finding family, provider/model/prompt, and source;
6. upload and analysis failures by stable error code.

Rates based on fewer than 20 completed analyses are directional, not evidence for a
model or commercial decision.

## Daily Operating Routine

During the first seven public days, run the report once each morning and record:

- sessions, completed analyses, and completed-analysis rate;
- source/campaign that produced completed analyses rather than clicks only;
- provider/analysis failure rate and p95 latency once there is enough volume;
- PASS/REVIEW/FAIL distribution;
- feedback count and false-alarm/missed-something patterns;
- total cost and average cost where OpenAI usage supports calculation.

Escalate immediately when analysis failures exceed 5% in a day, a previously stable
source develops upload failures, or a single false-alarm/missed family repeats three
times. Do not change prompts or RiskPolicy on one isolated feedback item.

## Boundaries

- This is first-party D1 telemetry, not GA4.
- GA4 remains deferred until consent and data-sharing decisions are explicit.
- Do not add image content, file names, OCR, findings evidence, or user notes to
  client analytics or third-party tools.
- The report is an operator command, not a public endpoint or dashboard.
