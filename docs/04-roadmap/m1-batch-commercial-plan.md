# M1 Accounts, Credits, And Batch QA Plan

Status: `IN_PROGRESS`

Last updated: 2026-08-14

## Purpose

Implement the approved M1 definition in
[M1 Product Definition](../02-product/m1-batch-commercial-definition.md).

This plan replaces the old roadmap interpretation where M1 referred only to a
future single-image public MVP. That single-image capability is now part of the
live M0 public-product foundation. M1 is the commercial and batch layer built on
top of it.

## Operating Assumptions

- One focused engineer plus founder/product review.
- Existing M0 worker, D1, R2, OpenAI provider, analytics, retention system, and
  feedback system remain the foundation.
- Account provider and Stripe account are available before the billing phase.
- Target duration: 5 to 7 weeks, followed by a public paid beta. Dates are
  gates, not promises; do not launch paid plans before the acceptance criteria
  pass.

## Status Legend

- `PLANNED`
- `IN_PROGRESS`
- `BLOCKED`
- `READY_FOR_REVIEW`
- `DONE`
- `DEFERRED`

## Phase M1-0: Founder Decisions And Baseline

Target: 2 working days

Status: `DONE`

| ID | Item | Owner | Acceptance evidence |
| --- | --- | --- | --- |
| M1-0.1 | Approve plans, included checks, top-up price, and anonymous/free limits | Founder | `DONE`: pricing table locked in product definition |
| M1-0.2 | Confirm authenticated asset retention | Founder | `DONE`: Free 7 days; paid plans 30 days; anonymous remains 24 hours |
| M1-0.3 | Select auth provider and configure Google/email sign-in | Founder/Engineering | `DONE`: production Google OAuth login, refresh, account data, and logout verified; Resend magic link remains an optional fallback rather than a launch dependency |
| M1-0.4 | Configure Stripe products, prices, webhook secret, and test mode | Founder/Engineering | `DONE`: Test Mode products, prices, production webhook, Worker secrets, D1 migration, founder checkout, paid check, and portal walkthrough passed |
| M1-0.5 | Establish M1 baseline metrics | Engineering | Current M0 cost, latency, funnel, and external-user baseline documented |

Exit gate: no billing, retention, or authentication policy ambiguity remains.
Pricing, retention, authentication, production Stripe founder acceptance, and
the M1 operational baseline are complete.

## Phase M1-1: Identity, Workspace, And Entitlements

Target: Week 1

Status: `DONE`

| ID | Item | Owner | Acceptance evidence |
| --- | --- | --- | --- |
| M1-1.1 | Add users, personal workspaces, memberships, and session mapping | Engineering | `DONE`: D1 identity tables and deterministic owner workspace provisioning implemented |
| M1-1.2 | Attach new authenticated assets and analyses to workspace | Engineering | `DONE`: authenticated writes use workspace ownership, signed-in assets receive plan retention, and read/feedback APIs enforce workspace or matching anonymous ownership |
| M1-1.3 | Add plans, subscriptions, credit reservations, and immutable ledger | Engineering | `DONE`: schema, idempotent lifecycle, expiry release, and executable ledger-reconciliation fixture pass |
| M1-1.4 | Add entitlement service | Engineering | `DONE`: authenticated single checks reserve one workspace credit, completed verdicts settle it, execution failures release it, and exhausted workspaces receive a quota response |
| M1-1.5 | Build sign-in and account entry UX | Engineering/Product | `DONE`: Google/magic-link entry, account summary, and sign-out implemented without blocking anonymous checker |

Exit gate: a signed-in Free account receives exactly 10 monthly checks; anonymous
limits and workspace isolation still pass.

## Phase M1-2: Billing And Credit Safety

Target: Week 2

Status: `DONE`

| ID | Item | Owner | Acceptance evidence |
| --- | --- | --- | --- |
| M1-2.1 | Implement Stripe checkout, customer portal, and webhook handling | Engineering | `DONE`: Test Mode checkout, replay-safe webhook processing, subscription activation, customer portal, and founder purchase walkthrough passed in production |
| M1-2.2 | Implement plan/top-up credit grants | Engineering | `DONE` for M1 subscription grants: Stripe periods grant the exact plan allowance idempotently. One-time top-ups are explicitly deferred until paid batch usage demonstrates demand and are not required for the M1-2 exit gate |
| M1-2.3 | Implement reserve/settle/release lifecycle | Engineering | `DONE`: system/provider failure releases credits, completed verdict settles exactly once, and abandoned reservations expire through scheduled maintenance |
| M1-2.4 | Build quota/upgrade states | Engineering/Product | `DONE`: plan comparison, current-plan state, remaining/used/reserved checks, payment-attention state, accurate retention copy, checkout, and portal actions implemented. Founder verified a paid Starter check at `149 available / 1 used / 0 reserved` |
| M1-2.5 | Add billing and credit audit tooling | Engineering | `DONE`: immutable usage ledger and webhook journal plus read-only `pnpm run audit:m1:billing` report for ledger mismatches, expired reservations, subscription-period mismatches, webhook failures, and plan totals |

Exit gate: all billing state transitions are idempotent and a credit balance can
be reconstructed from ledger rows. Passed through automated reconciliation and
Stripe lifecycle tests plus the production Starter check described above.

M1-2 does not enable public live-mode billing yet. Stripe remains in Test Mode
and restricted to founder-approved test accounts until Batch and export benefits
exist and the public billing checkpoint is accepted. Self-serve plan switching,
annual billing, and one-time top-ups remain later commercial increments.

## Phase M1-3: Batch Domain And Queue

Target: Weeks 3-4

Status: `DONE`

| ID | Item | Owner | Acceptance evidence |
| --- | --- | --- | --- |
| M1-3.1 | Add batches, batch items, and execution-attempt persistence | Engineering | `DONE`: migration and persistence keep analysis, execution attempt, and model call distinct |
| M1-3.2 | Implement explicit mapping validation and idempotency | Engineering | `DONE`: both mapping modes, request fingerprint, ownership, duplicate candidate, and incomplete mapping fixtures pass |
| M1-3.3 | Provision Cloudflare Queue and terminal failure path | Engineering | `DONE`: all three production queues are provisioned; retry exhaustion reached the DLQ, released its reserved credit, and persisted a terminal item failure without charging usage |
| M1-3.4 | Queue worker with fair concurrency | Engineering | `DONE`: standard and priority queues each cap analysis concurrency at one. Interactive admission excludes `batch_queue` and batch retry attempts from the workspace cap while retaining interactive-retry protection and the global safety cap. Founder confirmed interactive work can run while a batch is active. Browser-to-Worker uploads use a separate bounded concurrency of three without increasing model-call concurrency. Interactive `403 Network connection lost` receives one explicit bounded retry with a fresh provider client; batch retries remain Queue-owned. The OpenAI client now has a 120-second request ceiling and no hidden SDK retries. |
| M1-3.5 | Implement 20-item batch safety cap and workspace active-batch cap | Engineering | `DONE`: absolute/plan limits and one-active-batch constraint reject before reservation; API reserves one credit per item before enqueue |
| M1-3.6 | Extend 7-day Free and 30-day paid retention/deletion to batch assets and derivatives | Engineering | `DONE`: each batch snapshots and returns its earliest mapped-asset expiry. Scheduled and immediate deletion share the same audited R2 path and remove original, normalized, and thumbnail keys. Signed-in users can delete one result's images, all images mapped to a terminal batch, or all workspace images while retaining URL-free result metadata. |

Exit gate: both supported mapping modes finish without request-timeout dependence
and without duplicate charges.

Production Queue smoke on 2026-08-12 completed batch
`a85dca27-2a41-4927-9d68-13f4a38e5a90` in one execution attempt. Its
analysis `batch-analysis-a9c03825-4b00-4a5c-a2ee-ac8a39510c07` persisted and
restored from the result link. Credit state moved from `149 available / 1 used /
0 reserved` to `148 available / 2 used / 0 reserved`. Two production-only
integration defects were found and fixed before this pass: linking a batch item
to an analysis before the analysis row existed, and reading OpenAI configuration
from the Next.js request context inside a Queue consumer.

The smoke pair returned `PASS` even though its intended fixture represents a
product-count change. This does not invalidate the Queue transport and credit
gate, but it is recorded as a semantic false-negative candidate for the next
real-image regression review rather than being hidden inside infrastructure
status.

The interactive-plus-batch overlap smoke later completed two queued candidates
while analysis `98b090b8-0ece-4dad-ba69-49edfdbcd20a` ran independently. That
interactive attempt received one upstream `403 Network connection lost`, was
persisted as a failed execution attempt, produced no verdict, and released its
reserved credit. Because the queued work continued to completion, this is
classified as a retryable provider connection incident, not queue starvation.
The interactive path now performs one explicit bounded retry for the exact
connection-loss signature. Batch retry ownership remains with Cloudflare Queue,
so the SDK does not silently create additional attempts or duplicate the
platform's retry policy.

## Phase M1-4: Batch User Experience

Target: Week 5

Status: `DONE`

| ID | Item | Owner | Acceptance evidence |
| --- | --- | --- | --- |
| M1-4.1 | Build batch creation modes and preflight | Engineering/Product | `DONE`: both mapping modes, exact item/credit/retention preflight, local previews, candidate append/dedupe/remove/clear controls, and production behavior passed founder review on 2026-08-12. Repeated file selection appended `2 + 2 = 4`, removal left 3, and Clear all removed the full selection |
| M1-4.1a | Add retained reference reuse from recent batches | Engineering/Product | `DONE`: founder production review confirmed the retained reference thumbnail, original file name/date, and retention expiry are visible. Historic rows retain the dated fallback because their original filename was not persisted |
| M1-4.2 | Build truthful progress and restore-on-refresh state | Engineering | `DONE`: refresh restores persisted batch status and polling without fake percentages or request-timeout dependence. The account page now exposes the active batch and links back to its live persisted progress. |
| M1-4.3 | Build exception-first batch result list and filtering | Engineering/Product | `DONE`: FAIL/REVIEW/error filters, all-result fallback for all-PASS batches, result links, and batch history are implemented |
| M1-4.4 | Add CSV export | Engineering | `DONE`: founder export for batch `fff176ff-a60c-42b2-bc54-9259b0ab015c` contained both persisted REVIEW items and limitation types with workspace authorization |
| M1-4.5 | Add individual feedback to batch detail flow | Engineering/Product | `DONE`: batch result links open the existing persisted analysis and its analysis-linked feedback controls |
| M1-4.6 | Accessibility/mobile QA | Engineering | `DONE`: candidate counts use live regions, workflow/filter controls expose pressed state, batch progress exposes a progressbar, and cancel/retry controls have truthful busy states. Account overview, batch creation, history, and live-batch restoration share persistent workspace navigation and semantic breadcrumbs. Mobile controls have 44px targets, visible keyboard focus, wrapping navigation, and overflow-safe file/status text. Founder accepted `/account`, `/account/batches`, and `/account/batches/new` at a 390px viewport with no horizontal overflow and completed the keyboard navigation, upload, creation, cancellation, and retry walkthrough with visible focus on 2026-08-14. |
| M1-4.7 | Add terminal batch cancel/retry controls | Engineering/Product | `DONE`: queued items can be canceled with reserved credits released, failed items can be explicitly retried with a fresh reservation, and terminal batch state is recomputed without double charging. Founder canceled a partially completed 20-item production batch and confirmed unused checks were returned. |

Exit gate: a non-technical user can submit and interpret a 10-item batch without
operator assistance.

Founder functional acceptance on 2026-08-12 confirmed batch creation, Queue
completion, refresh restoration, exception filters, result restoration, CSV
export, retained-reference identity, additive candidate selection, individual
removal, and Clear all. Founder acceptance on 2026-08-14 also passed the 390px
narrow-viewport and keyboard walkthrough. M1-4 engineering and founder
usability acceptance are complete.

## Phase M1-5: Verification And Public Paid Beta

Target: Weeks 6-7

Status: `IN_PROGRESS`

| ID | Item | Owner | Acceptance evidence |
| --- | --- | --- | --- |
| M1-5.1 | Regression suite for M0 single-image behavior | Engineering | `DONE`: the focused release suite now exercises all six check families and their issue/verdict boundaries, plus invalid taxonomy, observability, normalization, retention, workspace ownership, credit reconciliation, batch domain, Queue, and interactive-priority behavior. Founder accepted a normal real production single-image check on 2026-08-14. The provider request ceiling remains 120 seconds with no hidden SDK retry. Run `pnpm test:m1:release-gates` to reproduce the focused gate. |
| M1-5.2 | Batch controlled integration suite | Engineering | `DONE`: production batches, refresh, history, CSV, retained reference, additive selection/removal, failure persistence, cancellation, the 20-item cap, and unused-credit rollback are evidenced. Automated verification proves a failed item can be requeued only once before returning to a terminal state, retry credit reservation/settlement is idempotent, and duplicate Queue delivery cannot claim the same queued item twice. On 2026-08-14 the founder retried failed batch `7c9202d1-885c-41c4-959c-21a872113aed`; result `batch-analysis-e64a0242-b271-4d6a-a8d8-aa40fa0f63dc` completed PASS and the balance moved from 120 available / 30 used / 0 reserved to 119 available / 31 used / 0 reserved. |
| M1-5.3 | Billing and privacy adversarial tests | Engineering | `DONE`: replay-safe webhook, workspace ownership, quota, reserve/settle/release, automatic deletion retry, immediate original/derivative deletion, and exclusion of deleted assets from workspace listings pass automated verification. On 2026-08-14 the founder permanently deleted the images for result `batch-analysis-e64a0242-b271-4d6a-a8d8-aa40fa0f63dc`; PASS and all text evidence remained, both previews stopped restoring, the account changed to `Images deleted or expired`, the deleted reference was absent from retained-reference choices, and quota stayed at 119 available / 31 used / 0 reserved. |
| M1-5.4 | Cost and queue-load smoke test | Engineering | `DONE`: the 2026-08-12 20-item smoke uploaded candidates across 123.9 seconds, then completed 14 analyses before cancellation. Thirteen normal items took 10.8-29.9 seconds each; observed per-analysis cost was `$0.00334-$0.00542`. A suspected nine-minute persistence delay was audited to the execution-attempt level: attempt 1 occupied the provider for 479.9 seconds and ended with no parsed observations; Queue retried after about 31 seconds and attempt 2 completed in 26.8 seconds. Persistence was not stuck. The deployed provider now has a 120-second request ceiling and explicit retry ownership, and the founder accepted a subsequent real single-image production completion on 2026-08-14. |
| M1-5.5 | Founder acceptance walkthrough | Founder | `DONE`: batch functional, 390px mobile, keyboard, real single-image/provider-timeout, semantic regression, failed-item retry, credit accounting, and immediate deletion walkthroughs passed in production by 2026-08-14. Pairvu is technically cleared for a public paid beta; this does not claim product-market fit. |
| M1-5.6 | Public paid beta observation window | Founder/Product | `IN_PROGRESS`: self-service registration and paid plans are open without invitations. Review the first 30 days and first 10 paying workspaces, whichever takes longer. Record activation, first batch completion, repeat use, workflow value, paid conversion, cancellation/support reasons, provider reliability, and settled-check cost. |

Entry gate decision updated on 2026-08-15: `GO FOR PUBLIC PAID BETA`. Technical
gates 1-6 in the product definition and all founder production walkthroughs are
evidenced. Rolling market evidence controls price, limit, and scope expansion;
it no longer blocks self-service access. See
`m1-paid-beta-release-checklist.md` for the executable decision record.

## Metrics To Review Weekly

| Metric | Why it matters | Initial decision use |
| --- | --- | --- |
| Account sign-up after free limit | Whether account gate follows value | Improve sign-in moment, not homepage copy blindly |
| Batch create -> first item completion | Batch usability and queue health | Fix mapping/preflight or execution reliability |
| Batch completion rate | Whether users receive all planned work | Diagnose queue/provider/upload failures |
| Checks per reference | Validates 1-to-many workflow | Tune default 10/20 capacity |
| PASS/REVIEW/FAIL mix | Detects over-review or incorrect use cases | Inspect evidence, not verdict totals alone |
| Recheck and next-batch rate | Core retention signal | Indicates repeated publishing workflow value |
| Export rate after exception | Whether result enters user workflow | Prioritize integrations only if proven |
| Cost per settled check | Unit economics and plan safety | Adjust limits before public scale |
| Paid conversion / explicit objection | Pricing signal | Avoid changing price from intuition |

## Deferred Backlog After M1

Do not start these until M1 public-beta evidence supports them:

1. CSV and ZIP intake.
2. Product profiles and multiple approved references.
3. Teams and approval roles.
4. Shopify/PIM/DAM/API integrations.
5. Image-set-level QA and marketplace packs.
6. More than 20 items per batch or concurrent batches per workspace.
