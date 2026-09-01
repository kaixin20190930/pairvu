# M1 Public Paid Beta Release Checklist

Status: `GO FOR PUBLIC PAID BETA`

Purpose: make the public-beta decision reproducible without turning normal
release work into a new benchmark project.

## A. Automated Engineering Gate

Run:

```bash
pnpm test:m1:release-gates
pnpm typecheck
```

Expected evidence:

- all six product-check families retain their approved semantic boundaries;
- provider/system failure never becomes PASS, REVIEW, or FAIL;
- deleted originals, normalized derivatives, and thumbnails are removed and no
  longer appear in workspace asset listings;
- reservations settle or release idempotently, including batch-item retries;
- one failed item can enter one explicit retry cycle at a time;
- duplicate Queue delivery cannot claim the same queued item twice.

Engineering result on 2026-08-14: `PASS`.

## B. Founder Walkthrough: Failed-Item Retry

1. Open `/account/batches` and choose a batch containing a failed item. If none
   exists, create a small batch and use a genuine provider failure; do not invent
   a product verdict.
2. Record `Available`, `Used`, and `Reserved` from `/account`.
3. Select `Retry failed check` once. Confirm the item becomes queued/processing
   and the UI prevents a second simultaneous retry.
4. Refresh or leave and reopen the batch. Confirm persisted progress restores.
5. After completion, confirm exactly one additional check is used. If it fails
   terminally, confirm the reservation is released and no check is charged.
6. Record batch ID, item ID, before/after balances, terminal status, and date in
   the M1 roadmap checkpoint note.

Acceptance: one retry cycle, at most one provider execution at a time, and at
most one settled charge for the completed retry.

## C. Founder Walkthrough: Immediate Deletion

1. Open a completed result from `/account` and confirm both retained previews
   are visible.
2. Select `Delete images` and accept the permanent-deletion confirmation.
3. Refresh the result. Confirm verdict and text evidence remain, while original,
   candidate, normalized derivative, and thumbnail previews no longer restore.
4. Return to `/account`. Confirm the deleted images are not offered as recent
   retained references.
5. Repeat with `Delete batch images` for one terminal batch, or use `Delete all
   workspace images` only when intentionally testing workspace-wide deletion.
6. Record the result/batch ID, deletion scope, visible outcome, and date in the
   M1 roadmap checkpoint note.

Acceptance: no deleted image URL returns image bytes, no deleted asset can be
reused or listed, and non-image result metadata remains interpretable.

## Production Evidence: 2026-08-14

### Failed-item retry

- batch: `7c9202d1-885c-41c4-959c-21a872113aed`;
- completed retry result: `batch-analysis-e64a0242-b271-4d6a-a8d8-aa40fa0f63dc`;
- terminal outcome: `PASS`;
- before: 120 available / 30 used / 0 reserved;
- after: 119 available / 31 used / 0 reserved;
- persisted after refresh and consumed exactly one check.

Result: `PASS`.

### Immediate deletion

- deletion scope: images belonging to result
  `batch-analysis-e64a0242-b271-4d6a-a8d8-aa40fa0f63dc`;
- before deletion: both retained previews were visible;
- after deletion: account status is `Images deleted or expired`, neither preview
  restores, and the deleted reference is absent from the retained-reference
  selector;
- retained metadata: PASS, observations, evidence, and feedback controls remain
  available and interpretable;
- quota remained 119 available / 31 used / 0 reserved.

Result: `PASS`.

## D. Public-Beta Decision

Decision updated on 2026-08-15: `GO FOR PUBLIC PAID BETA`. B and C passed in
production. Registration, Free accounts, and paid subscriptions are
self-service; no invitation or founder-approved user list is required. The
approved plan allowances, 20-item paid batch cap, retention policies, and M1
scope remain unchanged. Do not begin Rank, Custom Rules, Auto-fix,
integrations, or monitoring during this checkpoint.

During the first 30 days and first 10 paying workspaces, whichever takes
longer, measure separately:

- sign-up to first completed check and first completed batch;
- repeat batch, reference reuse, recheck, exception review, and export behavior;
- qualitative evidence that exception review changes or saves time in a real
  publishing or product-content workflow;
- paid conversion, cancellation, refund, support, and pricing-objection reasons;
- cost per settled check and provider failure rate.

These are market-validation and expansion gates, not prerequisites for public
self-service access and not commercial SLA claims.
# Stripe production presentation and portal

- [ ] Stripe live-mode public business name is `Pairvu`; support URL and support email point to Pairvu.
- [ ] Stripe live-mode branding uses the Pairvu logo, icon, and brand color.
- [ ] Stripe live-mode Customer Portal is activated with payment-method updates, invoices, and cancellation enabled.
- [ ] Every production `provider_customer_id` belongs to the same live Stripe account as `STRIPE_SECRET_KEY`.
- [ ] `Manage billing` opens the portal for a live subscriber and shows a visible actionable error if Stripe rejects the request.

## E. One-time Check Packs and Pricing Recovery

Implementation completed on 2026-08-19:

- Pricing no longer sends an existing paid subscriber to an Account dead end.
  The current plan is identified in place, other plans open Stripe's
  `subscription_update` flow, and payment problems open the standard portal.
- Free and paid workspaces can buy one-time packs of 50 / 200 / 500 checks for
  USD 9 / 29 / 59. Packs expire after 365 days and do not change retention,
  batch, priority, or export entitlements.
- Reservations consume the monthly allowance first, then active pack lots by
  earliest expiry. Reserve, settle, release, Checkout replay, and account
  totals have separate auditable ledgers.
- Quota errors link directly to the Check Pack section and Account. The Account
  page separately reports monthly and extra checks plus the next pack expiry.
- Public refunds remain a product boundary. Founder-issued Stripe refunds and
  any corresponding credit adjustment remain manual operations.

Test Mode evidence on 2026-08-19:

- all three one-time prices are active with `livemode=false`;
- a USD 9 `mode=payment` Checkout Session was generated with the expected
  `workspace_id`, `purchase_type=credit_pack`, and `pack_code=pack_50` metadata;
- the default Pairvu Test Portal accepted a deep-linked
  `subscription_update` session for the existing Starter subscription;
- TypeScript, production build, local D1 migration, account foundation, credit
  reconciliation, Stripe billing, and batch domain checks passed.

Production checklist before release:

- [x] Create and record the three Live Check Pack prices in the same Stripe
  account as the existing Pairvu Live monthly prices: `pack_50`
  (`price_1U65lwGlvseBpI4PVQ7aKUNH`), `pack_200`
  (`price_1U65mZGlvseBpI4PwdicWZ8g`), and `pack_500`
  (`price_1U65nqGlvseBpI4PqxwtBMGA`).
- [x] Add all three Live Price IDs to Worker variables.
- [x] Enable Live Portal price switching for the three existing monthly prices.
- [x] Add `checkout.session.async_payment_succeeded` and
  `checkout.session.async_payment_failed` to the existing Live webhook without
  removing its six current events.
- [x] Applied `0013_check_packs.sql`, deployed Worker version
  `fc0530e8-8930-4a24-860d-b7b0e733d3c0`, and completed a no-purchase
  production smoke test on 2026-08-19. Health, public pricing, signed-out
  billing context, Checkout authentication, and production billing-ledger
  reconciliation passed. A real Check Pack purchase remains a separate founder
  action.

Operational hardening completed on 2026-08-20:

- The two asynchronous Checkout events are enabled on the Live webhook, and
  Customer Portal price switching is enabled for Starter, Growth, and Agency.
- A successful Check Pack Checkout returns to Account with its `session_id`.
  Account polls a workspace-scoped, no-store status endpoint and shows the
  webhook-created lot, credited checks, total available checks, and expiry once
  fulfillment is durable. The return endpoint never grants credits and never
  treats a browser redirect as payment proof.
- Stripe webhook rows now retain the source object, workspace, purchase type,
  and payment status required to diagnose a paid Checkout that did not create a
  credit lot. No raw Checkout payload or customer email is added to this audit
  journal.
- The existing 15-minute maintenance cron performs a read-only billing
  integrity audit after releasing expired reservations. It emits structured
  alerts for failed or stale webhooks, paid packs missing a grant, lot/ledger
  disagreement, expired reservations still held, and active subscriptions with
  no matching credit period. The audit never repairs or changes balances.
- Operational response remains manual: inspect the sampled identifiers and
  Stripe/D1 records, correct the underlying event or data issue, then verify the
  next audit is healthy. Refund credit adjustment remains founder-operated.
- Applied `0014_billing_observability.sql` and deployed Worker version
  `ed7228d9-3221-4e92-9d2e-c38646e17e1a`. The production health and Pricing
  routes returned 200, the signed-out pack-status route correctly returned 401,
  and the production billing audit reported no reconciliation or processing
  exceptions. No real purchase was made for this verification.

Verification commands:

```bash
pnpm test:m1:account-foundation
pnpm test:m1:credit-reconciliation
pnpm test:m1:billing-observability
pnpm typecheck
```

Activation and quota-recovery hardening implemented on 2026-09-01:

- The homepage now explains the first comparison in three steps and links
  directly to controlled FOLDWELL PASS, REVIEW, and FAIL examples before the
  longer educational content. These are identified as controlled comparisons,
  not customer case studies or performance claims.
- Signed-in workspaces with zero available checks are warned before upload.
  Checker and Account provide a direct one-time-pack route plus a separate plan
  comparison route; Pricing explains both choices without automatically
  selecting a purchase or redirecting to Account.
- First-party events now cover example entry, zero-allowance exposure and CTA,
  Pricing views, Checkout intent, and successful redirect to Stripe. Event
  properties use safe enums only; payment completion continues to rely on the
  existing replay-safe Stripe webhook rather than a browser-side success claim.
- `0016_activation_conversion_events.sql` extends the existing D1 event-name
  constraint while preserving all historical rows. The daily aggregate report
  now includes activation and purchase-intent conversion plus offer breakdowns.
- No detector, prompt, QA policy, entitlement, Stripe price, or webhook behavior
  changed. Production rollout still requires applying migration `0016` before
  deploying the application build.
