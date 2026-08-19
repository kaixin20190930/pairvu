import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";
import { ensureCurrentCreditPeriod, ensurePersonalWorkspace, getWorkspaceAccountSnapshot } from "../lib/accounts/repository";
import {
  InsufficientWorkspaceCreditsError,
  releaseCreditReservation,
  releaseExpiredCreditReservations,
  reserveWorkspaceCredits,
  settleCreditReservation,
} from "../lib/credits/repository";
import {
  getWorkspaceCreditPackPurchase,
  getWorkspacePackBalance,
  grantWorkspaceCreditPack,
} from "../lib/credits/packs";
import type { D1Database, D1PreparedStatement } from "../lib/cloudflare/bindings";

const NOW = new Date("2026-08-10T08:00:00.000Z");
const USER = { id: "credit-test-user", name: "Credit Test", email: "credit-test@pairvu.com" };
const PACK_USER = { id: "pack-test-user", name: "Pack Test", email: "pack-test@pairvu.com" };

async function main() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("pragma foreign_keys = on");
  sqlite.exec(await readFile("migrations/0007_identity_workspaces_credits.sql", "utf8"));
  sqlite.exec(await readFile("migrations/0013_check_packs.sql", "utf8"));
  const db = new SqliteD1(sqlite);

  sqlite
    .prepare(
      `insert into user (id, name, email, emailVerified, createdAt, updatedAt)
       values (?, ?, ?, 1, ?, ?)`,
    )
    .run(USER.id, USER.name, USER.email, NOW.getTime(), NOW.getTime());

  const workspaceId = await ensurePersonalWorkspace(db, USER, NOW);
  await ensureCurrentCreditPeriod(db, workspaceId, NOW);
  await ensureCurrentCreditPeriod(db, workspaceId, NOW);

  let snapshot = await getWorkspaceAccountSnapshot(db, USER, NOW);
  assert.deepEqual(pickBalance(snapshot), { allowance: 10, consumed: 0, reserved: 0, available: 10 });
  assert.equal(count(sqlite, "select count(*) as count from usage_ledger where event_type = 'period_grant'"), 1);

  const first = await reserve(db, workspaceId, "analysis-first", 1, NOW);
  const duplicate = await reserve(db, workspaceId, "analysis-first", 1, NOW);
  assert.equal(duplicate.id, first.id, "Duplicate source must return the original reservation");
  snapshot = await getWorkspaceAccountSnapshot(db, USER, NOW);
  assert.deepEqual(pickBalance(snapshot), { allowance: 10, consumed: 0, reserved: 1, available: 9 });

  await settleCreditReservation(db, first.id, NOW);
  await settleCreditReservation(db, first.id, NOW);
  snapshot = await getWorkspaceAccountSnapshot(db, USER, NOW);
  assert.deepEqual(pickBalance(snapshot), { allowance: 10, consumed: 1, reserved: 0, available: 9 });
  assert.equal(count(sqlite, "select count(*) as count from usage_ledger where event_type = 'settle'"), 1);

  const released = await reserve(db, workspaceId, "analysis-release", 1, NOW);
  await releaseCreditReservation(db, released.id, NOW);
  await releaseCreditReservation(db, released.id, NOW);
  snapshot = await getWorkspaceAccountSnapshot(db, USER, NOW);
  assert.deepEqual(pickBalance(snapshot), { allowance: 10, consumed: 1, reserved: 0, available: 9 });

  const exhausted = await reserve(db, workspaceId, "analysis-exhaust", 9, NOW);
  await assert.rejects(
    reserve(db, workspaceId, "analysis-over-limit", 1, NOW),
    InsufficientWorkspaceCreditsError,
  );
  await releaseCreditReservation(db, exhausted.id, NOW);

  const expiring = await reserve(db, workspaceId, "analysis-expiring", 1, NOW);
  const releasedExpired = await releaseExpiredCreditReservations(
    db,
    new Date(NOW.getTime() + 31 * 60_000),
  );
  assert.equal(releasedExpired, 1);
  assert.equal(
    String(sqlite.prepare("select status from credit_reservations where id = ?").get(expiring.id)?.status),
    "released",
  );

  sqlite
    .prepare(
      `insert into user (id, name, email, emailVerified, createdAt, updatedAt)
       values (?, ?, ?, 1, ?, ?)`,
    )
    .run(PACK_USER.id, PACK_USER.name, PACK_USER.email, NOW.getTime(), NOW.getTime());
  const packWorkspaceId = await ensurePersonalWorkspace(db, PACK_USER, NOW);

  const packLotId = await grantWorkspaceCreditPack({
    db,
    workspaceId: packWorkspaceId,
    packCode: "pack_50",
    checkoutSessionId: "cs_pack_once",
    paymentIntentId: "pi_pack_once",
    now: NOW,
  });
  const duplicatePackLotId = await grantWorkspaceCreditPack({
    db,
    workspaceId: packWorkspaceId,
    packCode: "pack_50",
    checkoutSessionId: "cs_pack_once",
    paymentIntentId: "pi_pack_once",
    now: NOW,
  });
  assert.equal(duplicatePackLotId, packLotId, "Checkout replay must not grant a pack twice");
  assert.equal(count(sqlite, "select count(*) as count from workspace_credit_lots"), 1);
  assert.equal(count(sqlite, "select count(*) as count from credit_lot_ledger where event_type = 'grant'"), 1);
  const confirmedPackPurchase = await getWorkspaceCreditPackPurchase(
    db,
    packWorkspaceId,
    "cs_pack_once",
  );
  assert.deepEqual(
    confirmedPackPurchase ? { ...confirmedPackPurchase } : null,
    {
      checkoutSessionId: "cs_pack_once",
      packCode: "pack_50",
      granted: 50,
      available: 50,
      purchasedAt: NOW.toISOString(),
      expiresAt: "2027-08-10T08:00:00.000Z",
    },
    "The Checkout return status must resolve only a webhook-created credit lot",
  );
  assert.equal(
    await getWorkspaceCreditPackPurchase(db, workspaceId, "cs_pack_once"),
    null,
    "A Checkout session from another workspace must never be disclosed",
  );

  const packSnapshot = await getWorkspaceAccountSnapshot(db, PACK_USER, NOW);
  assert.equal(packSnapshot.monthlyAvailable, 10);
  assert.equal(packSnapshot.packAvailable, 50);
  assert.equal(packSnapshot.available, 60);

  const mixed = await reserve(db, packWorkspaceId, "analysis-mixed-balance", 12, NOW);
  assert.equal(
    count(sqlite, `select count(*) as count from credit_reservation_allocations where reservation_id = '${mixed.id}'`),
    2,
    "A check can allocate monthly credits first and then a pack",
  );
  await settleCreditReservation(db, mixed.id, NOW);
  const packAfterSettle = await getWorkspaceAccountSnapshot(db, PACK_USER, NOW);
  assert.equal(packAfterSettle.monthlyAvailable, 0);
  assert.equal(packAfterSettle.packConsumed, 2);
  assert.equal(packAfterSettle.packAvailable, 48);
  assert.equal(packAfterSettle.available, 48);

  const packRelease = await reserve(db, packWorkspaceId, "analysis-pack-release", 3, NOW);
  await releaseCreditReservation(db, packRelease.id, NOW);
  assert.equal((await getWorkspacePackBalance(db, packWorkspaceId, NOW)).available, 48);
  assert.equal(
    (await getWorkspacePackBalance(db, packWorkspaceId, new Date("2027-08-11T08:00:01.000Z"))).available,
    0,
    "Purchased checks expire after the disclosed 365-day validity",
  );

  snapshot = await getWorkspaceAccountSnapshot(db, USER, NOW);
  assert.deepEqual(pickBalance(snapshot), { allowance: 10, consumed: 1, reserved: 0, available: 9 });

  const ledger = sqlite
    .prepare(
      `select
         coalesce(sum(available_delta), 0) as available,
         coalesce(sum(reserved_delta), 0) as reserved,
         coalesce(sum(consumed_delta), 0) as consumed
       from usage_ledger where workspace_id = ?`,
    )
    .get(workspaceId) as Record<string, number>;
  assert.deepEqual(
    { available: Number(ledger.available), reserved: Number(ledger.reserved), consumed: Number(ledger.consumed) },
    { available: 9, reserved: 0, consumed: 1 },
    "Ledger deltas must reconstruct the current balance",
  );

  const retrySourceId = "batch-item-a:retry-attempt-a";
  const retryReservation = await reserveWorkspaceCredits({
    db,
    workspaceId,
    amount: 1,
    purpose: "batch_item_retry",
    sourceType: "batch_item_retry",
    sourceId: retrySourceId,
    now: NOW,
  });
  const duplicateRetryReservation = await reserveWorkspaceCredits({
    db,
    workspaceId,
    amount: 1,
    purpose: "batch_item_retry",
    sourceType: "batch_item_retry",
    sourceId: retrySourceId,
    now: NOW,
  });
  assert.equal(duplicateRetryReservation.id, retryReservation.id, "A repeated retry request must reuse one reservation");
  await settleCreditReservation(db, retryReservation.id, NOW);
  await settleCreditReservation(db, retryReservation.id, NOW);
  snapshot = await getWorkspaceAccountSnapshot(db, USER, NOW);
  assert.deepEqual(pickBalance(snapshot), { allowance: 10, consumed: 2, reserved: 0, available: 8 });
  assert.equal(
    count(sqlite, `select count(*) as count from usage_ledger where source_type = 'batch_item_retry' and event_type = 'settle'`),
    1,
    "One retry source must create one settled charge",
  );

  sqlite.close();
  console.log("M1 credit reconciliation verification passed.");
  console.log("Verified monthly grants, check-pack grants, monthly-first allocation, expiry, idempotent transitions, and ledger reconstruction.");
}

function reserve(db: D1Database, workspaceId: string, sourceId: string, amount: number, now: Date) {
  return reserveWorkspaceCredits({
    db,
    workspaceId,
    amount,
    purpose: "verification",
    sourceType: "analysis",
    sourceId,
    now,
  });
}

function pickBalance(snapshot: Awaited<ReturnType<typeof getWorkspaceAccountSnapshot>>) {
  return {
    allowance: snapshot.allowance,
    consumed: snapshot.consumed,
    reserved: snapshot.reserved,
    available: snapshot.available,
  };
}

function count(db: DatabaseSync, sql: string): number {
  return Number(db.prepare(sql).get()?.count ?? 0);
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

function message(error: unknown) {
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
