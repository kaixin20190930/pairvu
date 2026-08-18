import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCalendarMonthPeriod } from "../lib/accounts/repository";
import { PLAN_ENTITLEMENTS } from "../lib/billing/plans";

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

  console.log("M1 account foundation verification passed.");
  console.log(`Verified ${requiredTables.length + 1} tables, 4 plans, UTC periods, credit constraints, and the Stripe event journal.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
