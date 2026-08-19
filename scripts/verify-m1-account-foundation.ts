import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCalendarMonthPeriod } from "../lib/accounts/repository";
import { PLAN_ENTITLEMENTS } from "../lib/billing/plans";
import { CHECK_PACKS } from "../lib/billing/packs";

const requiredTables = [
  "user",
  "session",
  "account",
  "verification",
  "rateLimit",
  "workspaces",
  "workspace_memberships",
  "plans",
  "workspace_subscriptions",
  "workspace_credit_periods",
  "credit_reservations",
  "usage_ledger",
] as const;

async function main(): Promise<void> {
  const migration = await readFile(
    join(process.cwd(), "migrations/0007_identity_workspaces_credits.sql"),
    "utf8",
  );
  const stripeMigration = await readFile(
    join(process.cwd(), "migrations/0009_stripe_billing.sql"),
    "utf8",
  );
  const packMigration = await readFile(
    join(process.cwd(), "migrations/0013_check_packs.sql"),
    "utf8",
  );
  const billingObservabilityMigration = await readFile(
    join(process.cwd(), "migrations/0014_billing_observability.sql"),
    "utf8",
  );

  for (const table of requiredTables) {
    assert.match(migration, new RegExp(`create table if not exists ${table}\\b`), `Missing ${table} table`);
  }

  assert.deepEqual(
    Object.fromEntries(
      Object.values(PLAN_ENTITLEMENTS).map((plan) => [plan.code, {
        price: plan.monthlyPriceCents,
        credits: plan.includedMonthlyCredits,
        batch: plan.batchItemLimit,
        retention: plan.retentionDays,
      }]),
    ),
    {
      free: { price: 0, credits: 10, batch: 5, retention: 7 },
      starter: { price: 1900, credits: 150, batch: 20, retention: 30 },
      growth: { price: 4900, credits: 600, batch: 20, retention: 30 },
      agency: { price: 9900, credits: 1500, batch: 20, retention: 30 },
    },
    "Plan entitlements drifted from the founder-approved M1 definition",
  );
  assert.deepEqual(
    Object.fromEntries(Object.values(CHECK_PACKS).map((pack) => [pack.code, {
      price: pack.priceCents,
      credits: pack.credits,
      validityDays: pack.validityDays,
    }])),
    {
      pack_50: { price: 900, credits: 50, validityDays: 365 },
      pack_200: { price: 2900, credits: 200, validityDays: 365 },
      pack_500: { price: 5900, credits: 500, validityDays: 365 },
    },
  );

  const january = getCalendarMonthPeriod(new Date("2026-01-31T23:59:59.000Z"));
  assert.deepEqual(january, {
    periodKey: "2026-01",
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: "2026-02-01T00:00:00.000Z",
  });

  const december = getCalendarMonthPeriod(new Date("2026-12-15T12:00:00.000Z"));
  assert.equal(december.periodKey, "2026-12");
  assert.equal(december.endsAt, "2027-01-01T00:00:00.000Z");

  assert.match(migration, /unique \(workspace_id, source_type, source_id\)/);
  assert.match(migration, /idempotency_key text not null unique/);
  assert.match(migration, /status text not null check \(status in \('reserved', 'settled', 'released'\)\)/);
  assert.match(stripeMigration, /create table if not exists stripe_webhook_events\b/);
  assert.match(stripeMigration, /event_id text primary key/);
  assert.match(stripeMigration, /status text not null check \(status in \('processing', 'completed', 'failed'\)\)/);
  assert.match(packMigration, /create table if not exists workspace_credit_lots\b/);
  assert.match(packMigration, /create table if not exists credit_reservation_allocations\b/);
  assert.match(packMigration, /create table if not exists credit_lot_ledger\b/);
  assert.match(billingObservabilityMigration, /add column source_object_id text/);
  assert.match(billingObservabilityMigration, /add column workspace_id text/);
  assert.match(billingObservabilityMigration, /add column purchase_type text/);
  assert.match(billingObservabilityMigration, /add column payment_status text/);
  assert.match(billingObservabilityMigration, /idx_stripe_webhook_events_purchase_status/);

  console.log("M1 account foundation verification passed.");
  console.log(`Verified ${requiredTables.length + 1} tables, 4 plans, UTC periods, credit constraints, and the Stripe event audit journal.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
