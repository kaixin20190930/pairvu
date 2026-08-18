import type { D1Database, D1PreparedStatement } from "@/lib/cloudflare/bindings";
import { ensureCurrentCreditPeriod, getCalendarMonthPeriod } from "@/lib/accounts/repository";

export type CreditReservationStatus = "reserved" | "settled" | "released";

export interface CreditReservation {
  id: string;
  workspaceId: string;
  amount: number;
  status: CreditReservationStatus;
  sourceType: string;
  sourceId: string;
  expiresAt: string;
}

export class InsufficientWorkspaceCreditsError extends Error {
  readonly code = "workspace_quota_exceeded";

  constructor() {
    super("This workspace has no checks remaining in the current billing period.");
    this.name = "InsufficientWorkspaceCreditsError";
  }
}

export class WorkspaceBillingInactiveError extends Error {
  readonly code = "workspace_billing_inactive";

  constructor() {
    super("Billing for this workspace needs attention before another check can start.");
    this.name = "WorkspaceBillingInactiveError";
  }
}

interface ReservationRow {
  id: string;
  workspaceId: string;
  amount: number;
  status: CreditReservationStatus;
  sourceType: string;
  sourceId: string;
  expiresAt: string;
}

export async function reserveWorkspaceCredits(input: {
  db: D1Database;
  workspaceId: string;
  amount: number;
  purpose: string;
  sourceType: string;
  sourceId: string;
  ttlMinutes?: number;
  now?: Date;
}): Promise<CreditReservation> {
  const { db, workspaceId, purpose, sourceType, sourceId } = input;
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("Credit reservation amount must be a positive integer.");
  }

  const existing = await findReservation(db, workspaceId, sourceType, sourceId);
  if (existing) return existing;

  const subscription = await db
    .prepare(
      `select status
       from workspace_subscriptions
       where workspace_id = ?
       limit 1`,
    )
    .bind(workspaceId)
    .first<{ status: string }>();
  if (!subscription || (subscription.status !== "active" && subscription.status !== "trialing")) {
    throw new WorkspaceBillingInactiveError();
  }

  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const expiresAt = new Date(now.getTime() + (input.ttlMinutes ?? 30) * 60_000).toISOString();
  const periodId = await ensureCurrentCreditPeriod(db, workspaceId, now);
  const reservationId = crypto.randomUUID();
  const ledgerKey = `reserve:${workspaceId}:${sourceType}:${sourceId}`;
  const ledgerId = crypto.randomUUID();

  await db.batch([
    db
      .prepare(
        `insert into credit_reservations (
          id, workspace_id, credit_period_id, amount, status, purpose,
          source_type, source_id, expires_at, created_at, updated_at
        )
        select ?, ?, ?, ?, 'reserved', ?, ?, ?, ?, ?, ?
        from workspace_credit_periods
        where id = ?
          and (allowance + rollover_allowance - consumed - reserved) >= ?
        on conflict(workspace_id, source_type, source_id) do nothing`,
      )
      .bind(
        reservationId,
        workspaceId,
        periodId,
        input.amount,
        purpose,
        sourceType,
        sourceId,
        expiresAt,
        timestamp,
        timestamp,
        periodId,
        input.amount,
      ),
    db
      .prepare(
        `update workspace_credit_periods
         set reserved = reserved + ?, updated_at = ?
         where id = ?
           and exists (
             select 1 from credit_reservations r
             where r.id = ? and r.status = 'reserved'
           )
           and not exists (
             select 1 from usage_ledger where idempotency_key = ?
           )`,
      )
      .bind(input.amount, timestamp, periodId, reservationId, ledgerKey),
    db
      .prepare(
        `insert into usage_ledger (
          id, workspace_id, credit_period_id, reservation_id, event_type,
          available_delta, reserved_delta, consumed_delta,
          source_type, source_id, idempotency_key, metadata_json, created_at
        )
        select ?, ?, ?, ?, 'reserve', ?, ?, 0, ?, ?, ?, ?, ?
        from credit_reservations
        where id = ? and status = 'reserved'
        on conflict(idempotency_key) do nothing`,
      )
      .bind(
        ledgerId,
        workspaceId,
        periodId,
        reservationId,
        -input.amount,
        input.amount,
        sourceType,
        sourceId,
        ledgerKey,
        JSON.stringify({ purpose }),
        timestamp,
        reservationId,
      ),
  ]);

  const reservation = await findReservation(db, workspaceId, sourceType, sourceId);
  if (!reservation) {
    throw new InsufficientWorkspaceCreditsError();
  }
  return reservation;
}

export async function settleCreditReservation(
  db: D1Database,
  reservationId: string,
  now = new Date(),
): Promise<CreditReservation> {
  return transitionReservation(db, reservationId, "settled", now);
}

export async function releaseCreditReservation(
  db: D1Database,
  reservationId: string,
  now = new Date(),
): Promise<CreditReservation> {
  return transitionReservation(db, reservationId, "released", now);
}

export async function releaseExpiredCreditReservations(db: D1Database, now = new Date()): Promise<number> {
  const rows = await db
    .prepare(
      `select id
       from credit_reservations
       where status = 'reserved' and expires_at <= ?
       order by expires_at asc
       limit 100`,
    )
    .bind(now.toISOString())
    .all<{ id: string }>();

  for (const row of rows.results) {
    await releaseCreditReservation(db, row.id, now);
  }
  return rows.results.length;
}

export async function getCreditReservationForSource(
  db: D1Database,
  workspaceId: string,
  sourceType: string,
  sourceId: string,
) {
  return findReservation(db, workspaceId, sourceType, sourceId);
}

export async function getReservedCreditReservationForBatchItem(
  db: D1Database,
  workspaceId: string,
  batchItemId: string,
) {
  const row = await db
    .prepare(
      `select id, workspace_id as workspaceId, amount, status,
        source_type as sourceType, source_id as sourceId, expires_at as expiresAt
       from credit_reservations
       where workspace_id = ?
         and (
           (source_type = 'batch_item' and source_id = ?)
           or (source_type = 'batch_item_retry' and source_id like ?)
         )
       order by created_at desc limit 1`,
    )
    .bind(workspaceId, batchItemId, `${batchItemId}:%`)
    .first<ReservationRow>();
  return row ?? null;
}

async function transitionReservation(
  db: D1Database,
  reservationId: string,
  targetStatus: Exclude<CreditReservationStatus, "reserved">,
  now: Date,
): Promise<CreditReservation> {
  const current = await getReservationById(db, reservationId);
  if (!current) throw new Error("Credit reservation was not found.");
  if (current.status !== "reserved") return current;

  const timestamp = now.toISOString();
  const eventType = targetStatus === "settled" ? "settle" : "release";
  const ledgerKey = `${eventType}:${reservationId}`;
  const periodDeltaSql =
    targetStatus === "settled"
      ? "reserved = reserved - ?, consumed = consumed + ?"
      : "reserved = reserved - ?";
  const periodBindings =
    targetStatus === "settled"
      ? [current.amount, current.amount, timestamp, reservationId, ledgerKey]
      : [current.amount, timestamp, reservationId, ledgerKey];
  const availableDelta = targetStatus === "released" ? current.amount : 0;
  const consumedDelta = targetStatus === "settled" ? current.amount : 0;

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `update workspace_credit_periods
         set ${periodDeltaSql}, updated_at = ?
         where id = (select credit_period_id from credit_reservations where id = ? and status = 'reserved')
           and not exists (select 1 from usage_ledger where idempotency_key = ?)`,
      )
      .bind(...periodBindings),
    db
      .prepare(
        `insert into usage_ledger (
          id, workspace_id, credit_period_id, reservation_id, event_type,
          available_delta, reserved_delta, consumed_delta,
          source_type, source_id, idempotency_key, metadata_json, created_at
        )
        select ?, workspace_id, credit_period_id, id, ?, ?, ?, ?, source_type, source_id, ?, '{}', ?
        from credit_reservations
        where id = ? and status = 'reserved'
        on conflict(idempotency_key) do nothing`,
      )
      .bind(
        crypto.randomUUID(),
        eventType,
        availableDelta,
        -current.amount,
        consumedDelta,
        ledgerKey,
        timestamp,
        reservationId,
      ),
    db
      .prepare(
        `update credit_reservations
         set status = ?, updated_at = ?
         where id = ? and status = 'reserved'`,
      )
      .bind(targetStatus, timestamp, reservationId),
  ];

  await db.batch(statements);
  const transitioned = await getReservationById(db, reservationId);
  if (!transitioned) throw new Error("Credit reservation disappeared during transition.");
  return transitioned;
}

async function findReservation(
  db: D1Database,
  workspaceId: string,
  sourceType: string,
  sourceId: string,
): Promise<CreditReservation | null> {
  const row = await db
    .prepare(
      `select
         id,
         workspace_id as workspaceId,
         amount,
         status,
         source_type as sourceType,
         source_id as sourceId,
         expires_at as expiresAt
       from credit_reservations
       where workspace_id = ? and source_type = ? and source_id = ?
       limit 1`,
    )
    .bind(workspaceId, sourceType, sourceId)
    .first<ReservationRow>();
  return row ?? null;
}

async function getReservationById(db: D1Database, reservationId: string): Promise<CreditReservation | null> {
  const row = await db
    .prepare(
      `select
         id,
         workspace_id as workspaceId,
         amount,
         status,
         source_type as sourceType,
         source_id as sourceId,
         expires_at as expiresAt
       from credit_reservations
       where id = ?
       limit 1`,
    )
    .bind(reservationId)
    .first<ReservationRow>();
  return row ?? null;
}

export function currentCreditPeriodKey(now = new Date()): string {
  return getCalendarMonthPeriod(now).periodKey;
}
