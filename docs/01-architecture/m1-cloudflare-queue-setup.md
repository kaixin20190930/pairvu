# M1 Cloudflare Queue Setup

Status: `PROVISIONED_AND_PRODUCTION_SMOKE_PASSED`

Last updated: 2026-08-12

## Why `CLOUDFLARE_API_TOKEN` Exists

Pairvu does not read this token at runtime. It authenticates Wrangler when an
engineer or CI job provisions queues, applies D1 migrations, deploys the Worker,
or runs a read-only operational audit. Browser users and the deployed Worker do
not need this token.

Use a scoped token, not the Global API Key. Restrict it to the Pairvu account
and, where a zone permission is required, only `pairvu.com`.

Recommended implementation permissions:

- Account / Workers Scripts / Edit
- Account / D1 / Edit
- Account / Queues / Edit
- Zone / Workers Routes / Edit, only when Wrangler manages Pairvu routes
- Zone / Zone / Read, only for `pairvu.com`

Create it in Cloudflare Dashboard under **My Profile -> API Tokens -> Create
Token -> Create Custom Token**. The secret is displayed only once.

For local use, keep it outside the repository:

```bash
export CLOUDFLARE_API_TOKEN='your-scoped-token'
export CLOUDFLARE_ACCOUNT_ID='your-account-id'
```

Put those exports in `~/.zshrc` if persistence is needed, then run `source
~/.zshrc`. Do not place the token in `wrangler.jsonc`, commit it, expose it as a
public variable, or add it as a Pairvu Worker runtime secret.

Verify without printing the token:

```bash
pnpm exec wrangler whoami
```

## One-Time Queue Provisioning

Run these before deploying the queue bindings:

```bash
pnpm exec wrangler queues create pairvu-batch-analysis
pnpm exec wrangler queues create pairvu-batch-priority-analysis
pnpm exec wrangler queues create pairvu-batch-dead-letter
```

The standard and priority queues each process at most one item concurrently.
The separate HTTP path remains available for interactive single checks. A
message receives two normal retries before Cloudflare forwards it to the dead
letter queue, where Pairvu releases its reserved credit and records a terminal
item failure. Queue redelivery reuses the batch-item idempotency key, so a
Worker restart can resume a `processing` item without issuing a second provider
call or settling a credit twice.

## Production Order

The order is mandatory because code using the new tables and bindings must not
run before they exist:

1. Create all three queues.
2. Run `pnpm run db:migrate:remote` to apply `0010_batch_domain.sql` and
   `0011_batch_retention.sql`.
3. Run `pnpm run deploy`.
4. Create a signed-in Free batch of two items and confirm two credits reserve,
   then settle independently.
5. Confirm the interactive single checker remains usable while the batch runs.

Do not expose the batch creation UI until the remote migration, queue bindings,
retry behavior, and per-item credit reconciliation have all passed.

Each newly created batch snapshots the earliest `retention_expires_at` among
its mapped assets as `assetRetentionExpiresAt`. The owner API returns that exact
timestamp. The shared scheduled deletion job remains the source of truth: it
deletes and audits every original, normalized image, and thumbnail object for
expired anonymous, Free, and paid workspace assets.

## Production Smoke Evidence

The remote resources are active:

- `pairvu-batch-analysis`
- `pairvu-batch-priority-analysis`
- `pairvu-batch-dead-letter`

On 2026-08-12, batch `a85dca27-2a41-4927-9d68-13f4a38e5a90` completed one
candidate through the standard production queue. Item
`a9c03825-4b00-4a5c-a2ee-ac8a39510c07` completed in one attempt and linked to
analysis `batch-analysis-a9c03825-4b00-4a5c-a2ee-ac8a39510c07`. Refreshing the
batch restored `Completed`, and its result link restored the complete persisted
analysis and feedback controls.

Credit settlement was exact: the workspace moved from `149 available / 1 used /
0 reserved` to `148 available / 2 used / 0 reserved`. A preceding forced retry
exhaustion reached the dead-letter consumer and returned to `0 reserved`
without increasing usage.

Two defects discovered by production smoke are now covered by implementation
and regression checks:

1. `batch_items.analysis_id` is linked only after the referenced analysis row
   exists, preserving the foreign-key contract.
2. Queue consumers pass their Cloudflare runtime environment explicitly into
   the analysis service, so OpenAI configuration does not depend on a Next.js
   request context.

Remaining operational gate: run one interactive single check while a multi-item
batch is processing and confirm the queue concurrency caps preserve acceptable
interactive behavior.
