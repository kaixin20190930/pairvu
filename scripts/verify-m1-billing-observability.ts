import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";
import { ensurePersonalWorkspace, getWorkspaceAccountSnapshot } from "../lib/accounts/repository";
import { auditBillingIntegrity, type BillingIntegrityAlertCode } from "../lib/billing/audit";
import type { D1Database, D1PreparedStatement } from "../lib/cloudflare/bindings";
import { grantWorkspaceCreditPack } from "../lib/credits/packs";
import { releaseCreditReservation, reserveWorkspaceCredits } from "../lib/credits/repository";

const NOW = new Date("2026-08-20T08:00:00.000Z");
const USER = { id: "billing-observability-user", name: "Billing Audit", email: "billing-audit@pairvu.com" };

async function main(): Promise<void> {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("pragma foreign_keys = on");
  for (const migration of [
    "migrations/0007_identity_workspaces_credits.sql",
    "migrations/0009_stripe_billing.sql",
    "migrations/0013_check_packs.sql",
    "migrations/0014_billing_observability.sql",
  ]) {
    sqlite.exec(await readFile(migration, "utf8"));
  }
  const db = new SqliteD1(sqlite);

  sqlite
    .prepare(
      `insert into user (id, name, email, emailVerified, createdAt, updatedAt)
       values (?, ?, ?, 1, ?, ?)`,
    )
    .run(USER.id, USER.name, USER.email, NOW.getTime(), NOW.getTime());
  const workspaceId = await ensurePersonalWorkspace(db, USER, NOW);
  await getWorkspaceAccountSnapshot(db, USER, NOW);

  await grantWorkspaceCreditPack({
    db,
    workspaceId,
    packCode: "pack_50",
    checkoutSessionId: "cs_test_audit_granted",
    paymentIntentId: "pi_test_audit_granted",
    now: NOW,
  });
  assert.equal((await auditBillingIntegrity(db, NOW)).healthy, true, "A reconciled workspace must be healthy");

  const old = new Date(NOW.getTime() - 20 * 60_000).toISOString();
  sqlite.prepare(
    `insert into stripe_webhook_events (
       event_id, event_type, livemode, status, received_at, processed_at,
       source_object_id, workspace_id, purchase_type, payment_status
     ) values (?, 'checkout.session.completed', 1, 'failed', ?, ?, ?, ?, 'credit_pack', 'paid')`,
  ).run("evt_failed", old, old, "cs_live_failed", workspaceId);
  sqlite.prepare(
    `insert into stripe_webhook_events (
       event_id, event_type, livemode, status, received_at, processed_at,
       source_object_id, workspace_id, purchase_type, payment_status
     ) values (?, 'checkout.session.completed', 1, 'completed', ?, ?, ?, ?, 'credit_pack', 'paid')`,
  ).run("evt_missing_grant", old, old, "cs_live_missing_grant", workspaceId);
  sqlite.prepare(
    `update credit_lot_ledger set available_delta = 49
     where source_id = 'cs_test_audit_granted' and event_type = 'grant'`,
  ).run();

  const expiredReservation = await reserveWorkspaceCredits({
    db,
    workspaceId,
    amount: 1,
    purpose: "billing_audit_test",
    sourceType: "analysis",
    sourceId: "billing-audit-expired-reservation",
    now: NOW,
  });
  sqlite.prepare("update credit_reservations set expires_at = ? where id = ?")
    .run(new Date(NOW.getTime() - 60_000).toISOString(), expiredReservation.id);
  sqlite.prepare("update workspace_subscriptions set plan_code = 'starter' where workspace_id = ?")
    .run(workspaceId);

  const report = await auditBillingIntegrity(db, NOW);
  assert.equal(report.healthy, false);
  assert.deepEqual(
    new Set(report.alerts.map((alert) => alert.code)),
    new Set<BillingIntegrityAlertCode>([
      "stripe_webhook_unhealthy",
      "paid_pack_missing_grant",
      "credit_lot_ledger_mismatch",
      "expired_credit_reservation",
      "subscription_period_mismatch",
    ]),
    "The scheduled audit must detect all five billing integrity failure classes",
  );

  sqlite.prepare("delete from stripe_webhook_events").run();
  sqlite.prepare(
    `update credit_lot_ledger set available_delta = 50
     where source_id = 'cs_test_audit_granted' and event_type = 'grant'`,
  ).run();
  await releaseCreditReservation(db, expiredReservation.id, NOW);
  sqlite.prepare("update workspace_subscriptions set plan_code = 'free' where workspace_id = ?")
    .run(workspaceId);
  assert.equal((await auditBillingIntegrity(db, NOW)).healthy, true, "Resolved anomalies must clear the audit");

  sqlite.close();
  console.log("M1 billing observability verification passed.");
  console.log("Verified read-only detection for webhook, pack grant, ledger, reservation, and subscription anomalies.");
}

class SqliteD1 implements D1Database {
  constructor(private readonly db: DatabaseSync) {}

  prepare(query: string): D1PreparedStatement {
    return new SqliteStatement(this.db.prepare(query));
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]> {
    this.db.exec("begin immediate");
    try {
      const results: T[] = [];
      for (const statement of statements) results.push((await statement.run()) as T);
      this.db.exec("commit");
      return results;
    } catch (error) {
      this.db.exec("rollback");
      throw error;
    }
  }
}

class SqliteStatement implements D1PreparedStatement {
  private values: unknown[] = [];

  constructor(private readonly statement: StatementSync) {}

  bind(...values: unknown[]): D1PreparedStatement {
    this.values = values;
    return this;
  }

  async all<T = Record<string, unknown>>() {
    try {
      return { results: this.statement.all(...sqliteValues(this.values)) as T[], success: true };
    } catch (error) {
      return { results: [], success: false, error: message(error) };
    }
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    return (this.statement.get(...sqliteValues(this.values)) as T | undefined) ?? null;
  }

  async run() {
    try {
      this.statement.run(...sqliteValues(this.values));
      return { success: true };
    } catch (error) {
      return { success: false, error: message(error) };
    }
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sqliteValues(values: unknown[]): SQLInputValue[] {
  return values.map((value) => {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "bigint" ||
      value instanceof Uint8Array
    ) {
      return value;
    }
    if (typeof value === "boolean") return value ? 1 : 0;
    throw new TypeError(`Unsupported SQLite verification value: ${typeof value}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
