# M1 Product Definition: Accounts, Credits, And Batch QA

Status: `FOUNDER_APPROVED`

Last updated: 2026-08-10

## 1. Decision Summary

M0 established that Pairvu can compare one approved product image with one
candidate and return evidence-backed `PASS`, `REVIEW`, or `FAIL` results.

M1 turns that single-image capability into a repeatable paid workflow without
turning Pairvu into a catalog system, an image generator, or a marketplace
compliance product.

M1 scope is:

```text
Account + workspace + credit entitlement
  -> explicit reference/candidate mapping
  -> asynchronous batch execution
  -> exception-first review and export
  -> subscription and top-up billing
```

The M0 checker remains available for a small anonymous first-use experience.
Batch processing, saved history, exports, and paid capacity require an account.

## 2. User Problem And Product Job

The primary job is not "upload many images." It is:

> Before publishing a set of AI-generated or edited product images, identify
> the few images whose visible product identity needs attention.

The product serves two distinct workflows.

### Workflow A: One approved product, many candidate images

A brand, creator, or agency has one approved packshot and a group of generated
or edited candidates for the same product. They need to know which candidates
preserve the product before selecting images for publishing.

M1 behavior:

- one reference image;
- 1 to 20 explicitly attached candidates;
- every candidate is compared independently to the same reference;
- each completed candidate comparison consumes one credit.

This is the default and recommended batch mode.

### Workflow B: Many explicit product pairs

A catalog or agency operator has multiple products, with a known reference and
candidate for each product. They need an exception queue rather than individual
browser submissions.

M1 behavior:

- up to 20 reference/candidate pairs per batch;
- each row is explicitly mapped before processing;
- one pair creates one independent analysis and consumes one credit when
  completed;
- CSV mapping is a planned convenience feature, not a requirement for the
  first usable batch UI.

## 3. Canonical Commercial Unit

### Product term

Use **product check** in the UI and commercial copy.

One product check is:

```text
one approved reference image + one explicitly mapped candidate image
-> one completed persisted Pairvu analysis
```

One reference used against 10 candidates is 10 product checks. Twenty mapped
reference/candidate rows are 20 product checks. Reference uploads do not consume
checks by themselves.

### Charging Rules

- Reserve the maximum required checks before a batch starts.
- Settle and permanently debit one check only after an analysis has a persisted
  product verdict (`PASS`, `REVIEW`, or `FAIL`).
- Release a reservation for provider, network, system, validation, cancellation,
  or duplicate/idempotent failures.
- Retrying a failed system execution of the same item is not a new product check.
- Never charge based on file upload attempts, queue attempts, raw model calls,
  or a batch's existence.
- Show the user the exact planned debit before processing, for example:
  `20 candidate images = 20 product checks`.

### Explicit Non-Rule

M1 never computes an all-to-all comparison. Twenty references and twenty
candidates must resolve to 20 explicit pairs, not 400 model calls. Pairvu must
not guess product correspondence.

## 4. M1 Experience

### Entry And Authentication

- Anonymous visitors retain a small, protected single-image trial: 2 completed
  product checks per rolling 24 hours and no batch creation.
- An authenticated free workspace receives 10 product checks per calendar month.
- Authentication uses Google sign-in and email magic link. No password-based
  account system is introduced in M1.
- Better Auth is self-hosted on the existing Cloudflare Worker and D1 database.
  Pairvu owns workspace membership and entitlements; authentication records do
  not become the product authorization model.
- Create the personal workspace when a user first signs in. M1 has one owner
  per workspace; invitations and team roles are deferred.
- Ask for sign-in only when the user chooses batch, history, export, or has
  exhausted anonymous capacity. Do not block the first single-image value
  moment.

### Create Batch

The user chooses one clear mode:

1. **One product, many images** (recommended): one reference plus up to 20
   candidates.
2. **Many product pairs**: up to 20 explicitly mapped rows.

Before submission, the UI validates file types, ownership, duplicate candidate
entries, required mappings, available credits, and the current plan's batch
limit. It then shows the item count, expected credit use, and retention period.

### Repeat Use Without Product Profiles

While an authenticated reference asset remains inside its retention period, the
owner may reuse that exact approved image when creating a new batch. The UI may
surface references from recent batches, but it does not create a named product,
store product attributes, or combine multiple references. This removes repeated
upload friction without introducing M2 Product Profiles early.

### Execution

- Creating a batch returns immediately with a batch resource.
- Items execute asynchronously through a durable queue.
- Browser progress reflects persisted item states only: `0 of 20 completed`,
  not invented progress percentages.
- Interactive single-image checks reserve capacity ahead of batch jobs.
- M1 limits each batch to 20 items and limits a workspace to one active batch.
  These are operational safety limits, not permanent commercial limits.
- A failed item remains visible with a retryable error. Completed items remain
  readable while the rest of the batch continues.

### Results And Review

The batch result is an exception-review surface:

- summary counts for `PASS`, `REVIEW`, `FAIL`, and system failures;
- filters for `FAIL`, `REVIEW`, and failed execution;
- one row per candidate, linked to its full evidence-backed result;
- CSV export containing mapped label/SKU (when supplied), file names, verdict,
  issue family, confidence, limitations, and completion time;
- feedback on individual results;
- no automatic publishing decision, automatic fix, or marketplace claim.

## 5. Pricing And Entitlements

All launch pricing is in USD and should be presented as introductory pricing
until 30 days of paid-usage evidence exists.

| Plan | Price | Included checks / month | Intended user | Batch entitlement |
| --- | ---: | ---: | --- | --- |
| Anonymous trial | $0 | 2 / 24h | First-use evaluation | Single check only |
| Free account | $0 | 10 | New repeat user | Up to 5 items / batch; no CSV export |
| Starter | $19 / month | 150 | Independent brand or creator | Up to 20 items / batch; history and export |
| Growth | $49 / month | 600 | Small operations team | Up to 20 items / batch; priority queue |
| Agency | $99 / month | 1,500 | Agency or multi-brand operator | Up to 20 items / batch; priority queue |
| Top-up (later increment) | $15 / 100 checks | Never expires | Variable-volume user | Deferred until paid batch demand is observed |

Subscription checks expire at the end of the billing period. M1-2 launches
without rollover or paid top-ups; both require a separate commercial checkpoint
after paid batch demand is observed. The proposed future top-up is $15 per 100
non-expiring checks. Annual pricing, discounts, and enterprise invoicing are
also deferred.

This pricing is intentionally based on a check rather than image generation.
The product's value is the review decision and its evidence, not volume of image
uploads. Production M0 evidence measured an average provider estimate of
approximately $0.005 per completed check across 20 calls on 2026-08-08; pricing
must be revalidated against actual M1 queue, storage, payment, support, and
failure costs before public billing is enabled.

## 6. Retention, Privacy, And Trust

Anonymous asset policy remains unchanged: originals, normalized analysis images,
and thumbnails are deleted within 24 hours.

For authenticated workspaces, M1 uses plan-based retention:

- Free account image binaries and derivatives retained for 7 days;
- Starter, Growth, and Agency image binaries and derivatives retained for 30 days;
- result metadata retained for 12 months;
- immediate user-initiated deletion available for a batch, result, or workspace;
- automatic deletion applies to original and all analysis derivatives;
- retained result metadata must not expose an asset URL after assets are deleted.

The exact deletion time must be stated before upload, in batch preflight, in
account history, and on the pricing/plan surface. Product copy must say that
retention covers uploaded originals and analysis derivatives, and must not use
vague language such as "stored temporarily."

Longer image history is a paid entitlement, not a change to result quality.
M1 has only two authenticated retention policies (`7 days` and `30 days`). A
future 90-day entitlement may be added through `retention_policy_key` after paid
usage demonstrates demand; it is not part of M1.

Images remain private, are used only to perform the requested check, and are not
added to evaluation data unless the user gives a separate explicit permission.

## 7. Domain And Technical Contract

M1 extends, rather than changes, M0 semantics:

```text
Batch -> Batch item -> Analysis -> Execution attempt -> Model call
```

- A **batch** is a user-visible collection and progress aggregate.
- A **batch item** is one explicit reference/candidate mapping.
- An **analysis** is the immutable domain request for that mapping.
- An **execution attempt** is one attempt to complete an analysis; M1 introduces
  this persistence model because queue retries require it.
- A **model call** is one provider invocation within an execution attempt.

Required new persistence concepts:

- `users`, `workspaces`, `memberships`;
- `batches`, `batch_items`, `analysis_execution_attempts`;
- `plans`, `subscriptions`, immutable `usage_ledger`, `credit_reservations`;
- payment webhook events and idempotency records;
- workspace-level retention policy and deletion audit linkage.

Use Cloudflare Queues for item messages containing IDs only, never image bytes.
The worker must make all queue handlers idempotent, record retries, retain a
terminal failed state, and prevent a batch from consuming all global model
concurrency.

## 8. Firm M1 Boundaries

M1 does not include:

- product profiles or multiple reference consensus;
- automatic product pairing or all-to-all matching;
- teams, invitations, or role management beyond the personal owner workspace;
- public API, webhooks, PIM, DAM, Shopify, Amazon, or marketplace integrations;
- ZIP ingestion, bulk CSV import, or SKU synchronization as a launch blocker;
- marketplace certification, compliance guarantees, automatic fixes, or image
  generation;
- categories outside current CPG support;
- video analysis.

These are intentionally deferred because M1's question is narrower: do users
return and pay to review product-image candidates more efficiently than they can
with the free single-image checker?

## 9. Expansion Path Without Rework

The authoritative post-M1 sequence and evidence gates are maintained in
[Pairvu Product Expansion Roadmap](../04-roadmap/product-expansion-roadmap.md).
The table below records architectural extension points, not an approved order
or permission to add these capabilities during M1.

| Later capability | Builds on M1 |
| --- | --- |
| Product profiles | `product_id` and approved reference assets on batch items |
| Teams | memberships and workspace-scoped assets, batches, ledger rows |
| CSV / PIM import | explicit mapping manifest creates batch items |
| API | create batch and item resources using the same mapping contract |
| Webhooks | terminal batch/item/analysis states |
| Image-set QA | grouping completed analyses under a set-level evaluator |
| Marketplace packs | additional versioned evaluation after core product QA |
| Higher volume | larger entitlements and queue concurrency, not new billing logic |

The architecture must not add these features speculatively in M1. It must only
preserve their natural extension points.

## 10. M1 Success Gates

M1 uses two different decisions. They must not be collapsed into one gate.

### 10.1 Public Paid Beta Entry Gates

Pairvu may open self-service Free and paid plans to the public when gates 1-6 pass:

1. A 20-item one-reference batch and a 20-pair batch complete with accurate
   mapping, progress, and terminal item states.
2. No provider/system failure creates a verdict or a permanent credit debit.
3. The credit ledger reconciles to completed analyses and subscription events.
4. Batch retry is idempotent and does not duplicate model calls or charges.
5. Account isolation prevents cross-workspace asset, result, feedback, export,
   and billing access.
6. Asset deletion covers originals and derivatives under both retention policies.

These are product, reliability, billing, isolation, and privacy gates. They are
the prerequisites for exposing M1 publicly with the approved plan allowances,
20-item batch cap, and retention policies. They do not claim product-market fit
or general availability.

### 10.2 Public Paid Beta Validation Gates

The following gates are measured as rolling public-beta evidence. Review the
first 30 days and the first 10 paying workspaces, whichever takes longer,
before changing price, limits, or M1 scope:

7. Track sign-up to first completed check, first completed batch, repeat
   batch/recheck behavior, and exception-review usage by acquisition source.
8. Record paid conversion, cancellation/refund/support reasons, explicit pricing
   objections, provider failure rate, and cost per settled check.
9. Require qualitative evidence from real users that exception review changes
   or saves time in a publishing or product-content workflow before expanding
   into Rank, Custom Rules, Auto-fix, integrations, or monitoring.

Weak validation evidence means Pairvu should continue discovery or revise the
offer. It does not require closing technically sound self-service plans and does
not retroactively invalidate the technical beta entry decision.

## 11. Risks And Controls

| Risk | Control |
| --- | --- |
| Batch cost spikes | preflight credit reservation, global spend cap, one active batch per workspace, queue concurrency cap |
| Long perceived waits | immediate batch creation, item-level completion, truthful progress, exception-first review |
| Wrong mapping | explicit mapping only; no automatic correspondence inference |
| Billing dispute | immutable ledger, provider/attempt audit, settle only terminal product verdicts |
| Users treat PASS as a guarantee | persistent "visible product QA, not marketplace certification" language |
| History conflicts with privacy promise | explicit 24-hour, 7-day, and 30-day policies plus deletion audit |
| Feature creep | M1 boundaries above are release blockers, not suggestions |
