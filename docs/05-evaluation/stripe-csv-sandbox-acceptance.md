# JRN-02 Stripe Test Mode, CSV, and workspace isolation

This is a **local-only** acceptance run. It used Stripe Test Mode and a fresh
loopback workerd/D1 database. It did not deploy application code, call a
production database, send an email, call a model, or charge a real card.
Account labels A and B refer to the two private test identities; their email
addresses and authentication artifacts are absent from this repository.

## Scope and limitations

- The production checkout route deliberately requires `sk_live_` and returns
  `503 billing_not_configured` with a test key. The test-only loopback adapter
  uses the real Better Auth session, account and billing repositories, and
  `createStripeCheckoutSession`. Thus `testCheckoutAdapter=true` and
  `productionCheckoutRouteCovered=false`.
- Authentication used actual Better Auth magic-link issuance, local-only mail
  capture, link verification, session cookies, and two distinct personal
  workspaces. Google OAuth was not configured locally and is not covered.
- The browser's final payment click was performed by the user in Stripe
  Sandbox. The only checkout session for the run became `complete` and `paid`
  with `livemode=false`; no real financial transaction occurred.
- The existing Stripe Test Mode webhook targeting the public site was left
  unchanged. Production's live-key mode gate rejects test events before its
  journal write. The controller's separate read-only before/after production
  billing-table evidence is under `operations/evidence/JRN-02/`.

## Observed run

Run ID: `JRN-02-28996f3d-891b-4cf0-9528-3142197d92d7`.

| Check | Result |
| --- | --- |
| Test key, active recurring test price, private input, loopback and rejection guards | Pass |
| Formal checkout route with test key | Expected 503, before account or Stripe access |
| Real Better Auth A/B isolation and Free baseline | Pass, separate workspaces, 10 Free credits each |
| Stripe Sandbox Checkout | Complete, paid, `livemode=false`, one session |
| Actual CLI-signed webhook to unchanged route and local D1 | `checkout.session.completed` and `customer.subscription.updated` completed in journal |
| A entitlement after paid event | Starter, 150 monthly credits, CSV enabled |
| B entitlement after paid event | Free, 10 monthly credits, CSV disabled |
| Actual batch CSV route | A own 200; A→B 404; B own 403; anonymous 401 |
| Actual workbench CSV route | A own 200 with review/source fields; A→B zero rows; B own 403; anonymous 401 |
| CSV encoding | Download and content-type headers; quote, newline and spreadsheet-formula escaping |
| Unsigned webhook | 400, with no journal entry |
| Real provider event ordering on separate fresh D1 | `invoice.paid` before `checkout.session.completed` still grants Starter once; signed replay is ignored |

The event-order check fetches the **real** Test Mode invoice and checkout
events from Stripe and feeds them to the actual webhook handler in a separate
fresh D1 using a locally generated signing secret. Its workspace identity is
synthetic and bound to the real subscription workspace ID. This proves
out-of-order synchronization and replay behavior at the webhook/repository
layer, not a second browser payment or an original CLI signature replay.
The main run separately records the genuine CLI-forwarded signed webhook.

The synthetic CSV records exist only in local D1. They deliberately include a
formula-prefixed label, a quote, a newline, and a human review reason; no
production customer records or images were copied. The workbench export
correctly retains its blocked review eligibility for this synthetic analysis;
CSV access does not imply a publishable release.

## Reproduction and evidence

The scripts accept only the exact private keys
`PAIRVU_TEST_EMAIL_A`, `PAIRVU_TEST_EMAIL_B`, `STRIPE_SECRET_KEY`, and
`STRIPE_PRICE_STARTER` from
`/private/tmp/pairvu-stripe-sandbox-input.json` (mode 0600). They reject live
keys, live price/session objects, and non-loopback origin. Do not print the
private input or commit runtime artifacts.

```sh
node scripts/jrn02-preflight.mjs selftest
node scripts/jrn02-preflight.mjs check
pnpm exec tsx scripts/jrn02-auth-smoke.ts /private/tmp/pairvu-jrn02-auth-results.json
node scripts/jrn02-checkout-gate.mjs /private/tmp/pairvu-jrn02-checkout-gate.json
```

For a **new** run, `pnpm exec tsx scripts/jrn02-local-server.ts` creates a
fresh D1 and prints its run ID and private report path. It starts a separate
Stripe CLI listener with a process-env allowlist and no existing webhook
changes. Opening `http://127.0.0.1:3107/jrn02/a` uses the actual local A
session and creates one test Checkout Session; the adapter adds the unique run
tag to the session **and subscription metadata in the creation request**.
The final Stripe Sandbox payment click requires user handoff. Never rerun that
click or create another Checkout Session to retry verification.

The observed run's local D1 directory is
`/private/var/folders/kq/603dhp110dl8931c2gp1j1dc0000gn/T/pairvu-jrn02-run-C8AkZn`.
The runner can reopen that directory with
`pnpm exec tsx scripts/jrn02-local-server.ts <run-directory>`; it checks for
exactly one existing test session, preserves prior event evidence, and locks
checkout on resume. It does not create a new session or resend magic links.
Stop the
runner before invoking `jrn02-csv-check.ts`, which opens the same D1:

```sh
pnpm exec tsx scripts/jrn02-csv-check.ts <run-directory>
pnpm exec tsx scripts/jrn02-event-order-check.ts
node scripts/jrn02-tag-test-objects.mjs inspect
node scripts/jrn02-cleanup-test-subscription.mjs inspect
```

Sanitized runtime results are in the run directory's `report.json` and
`csv-results.json`, plus `/private/tmp/pairvu-jrn02-order-results.json`,
`/private/tmp/pairvu-jrn02-tag-results.json`, and the preflight/auth/gate
reports. The private handoff file contains the checkout URL and screenshot;
it must not enter Git.

The test subscription is intentionally still **active for independent QA** to
verify the paid routes and entitlement. After QA, cancel only this run's
verified Test Mode subscription and stop its listener. Recheck Stripe status,
local D1 downgrade behavior, and the controller's production before/after
summary before closing JRN-02. There is no production release in this unit.
The guarded cleanup command is
`node scripts/jrn02-cleanup-test-subscription.mjs cancel`; it must run only
after independent QA has finished its active-plan checks.
