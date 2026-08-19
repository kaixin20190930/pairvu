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
  creditPeriodId: string;
  amount: number;
  status: CreditReservationStatus;
  sourceType: string;
  sourceId: string;
  expiresAt: string;
}

interface ReservationAllocationRow {
  id: string;
  bucketType: "period" | "pack";
  creditPeriodId: string | null;
  creditLotId: string | null;
  amount: number;
}

interface CreditLotRow {
  id: string;
  available: number;
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
  const periodBalance = await db
    .prepare(
      `select max(0, allowance + rollover_allowance - consumed - reserved) as available
       from workspace_credit_periods where id = ? limit 1`,
    )
    .bind(periodId)
    .first<{ available: number }>();
  const periodAmount = Math.min(input.amount, Number(periodBalance?.available ?? 0));
  let remaining = input.amount - periodAmount;
  const lots = await db
    .prepare(
      `select id, granted - consumed - reserved as available
       from workspace_credit_lots
       where workspace_id = ? and status = 'active' and expires_at > ?
         and granted - consumed - reserved > 0
       order by expires_at asc, purchased_at asc, id asc`,
    )
    .bind(workspaceId, timestamp)
    .all<CreditLotRow>();
  const lotAllocations: Array<{ lotId: string; amount: number }> = [];
  for (const lot of lots.results) {
    if (remaining <= 0) break;
    const amount = Math.min(remaining, Number(lot.available));
    if (amount > 0) lotAllocations.push({ lotId: lot.id, amount });
    remaining -= amount;
  }
  if (remaining > 0) throw new InsufficientWorkspaceCreditsError();

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `insert into credit_reservations (
          id, workspace_id, credit_period_id, amount, status, purpose,
          source_type, source_id, expires_at, created_at, updated_at
        )
        select ?, ?, ?, ?, 'reserved', ?, ?, ?, ?, ?, ?
        from workspace_credit_periods cp
        where cp.id = ?
          and (
            cp.allowance + cp.rollover_allowance - cp.consumed - cp.reserved
            + coalesce((
              select sum(l.granted - l.consumed - l.reserved)
              from workspace_credit_lots l
              where l.workspace_id = ? and l.status = 'active' and l.expires_at > ?
            ), 0)
          ) >= ?
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
        workspaceId,
        timestamp,
        input.amount,
      ),
  ];

  if (periodAmount > 0) {
    const ledgerKey = `reserve:${reservationId}:period`;
    statements.push(
      db
        .prepare(
          `insert into credit_reservation_allocations (
            id, reservation_id, bucket_type, credit_period_id, credit_lot_id, amount, created_at
          )
          select ?, id, 'period', ?, null, ?, ? from credit_reservations
          where id = ? and status = 'reserved'
          on conflict do nothing`,
        )
        .bind(`${reservationId}:period`, periodId, periodAmount, timestamp, reservationId),
      db
        .prepare(
          `update workspace_credit_periods
           set reserved = reserved + ?, updated_at = ?
           where id = ?
             and allowance + rollover_allowance - consumed - reserved >= ?
             and exists (select 1 from credit_reservation_allocations where id = ?)
             and not exists (select 1 from usage_ledger where idempotency_key = ?)`
        )
        .bind(periodAmount, timestamp, periodId, periodAmount, `${reservationId}:period`, ledgerKey),
      db
        .prepare(
          `insert into usage_ledger (
            id, workspace_id, credit_period_id, reservation_id, event_type,
            available_delta, reserved_delta, consumed_delta,
            source_type, source_id, idempotency_key, metadata_json, created_at
          )
          select ?, ?, ?, ?, 'reserve', ?, ?, 0, ?, ?, ?, ?, ?
          from credit_reservation_allocations where id = ?
          on conflict(idempotency_key) do nothing`,
        )
        .bind(
          crypto.randomUUID(), workspaceId, periodId, reservationId,
          -periodAmount, periodAmount, sourceType, sourceId, ledgerKey,
          JSON.stringify({ purpose, bucketType: "period" }), timestamp, `${reservationId}:period`,
        ),
    );
  }

  for (const allocation of lotAllocations) {
    const allocationId = `${reservationId}:pack:${allocation.lotId}`;
    const ledgerKey = `reserve:${reservationId}:pack:${allocation.lotId}`;
    statements.push(
      db
        .prepare(
          `insert into credit_reservation_allocations (
            id, reservation_id, bucket_type, credit_period_id, credit_lot_id, amount, created_at
          )
          select ?, ?, 'pack', null, id, ?, ? from workspace_credit_lots
          where id = ? and status = 'active' and expires_at > ?
            and granted - consumed - reserved >= ?
            and exists (select 1 from credit_reservations where id = ? and status = 'reserved')
          on conflict do nothing`,
        )
        .bind(allocationId, reservationId, allocation.amount, timestamp, allocation.lotId, timestamp, allocation.amount, reservationId),
      db
        .prepare(
          `update workspace_credit_lots
           set reserved = reserved + ?, updated_at = ?
           where id = ? and exists (select 1 from credit_reservation_allocations where id = ?)
             and not exists (select 1 from credit_lot_ledger where idempotency_key = ?)`
        )
        .bind(allocation.amount, timestamp, allocation.lotId, allocationId, ledgerKey),
      db
        .prepare(
          `insert into credit_lot_ledger (
            id, workspace_id, credit_lot_id, reservation_id, event_type,
            available_delta, reserved_delta, consumed_delta,
            source_type, source_id, idempotency_key, metadata_json, created_at
          )
          select ?, ?, credit_lot_id, ?, 'reserve', ?, ?, 0, ?, ?, ?, ?, ?
          from credit_reservation_allocations where id = ?
          on conflict(idempotency_key) do nothing`,
        )
        .bind(
          crypto.randomUUID(), workspaceId, reservationId, -allocation.amount, allocation.amount,
          sourceType, sourceId, ledgerKey, JSON.stringify({ purpose, bucketType: "pack" }), timestamp, allocationId,
        ),
    );
  }

  // D1 batches are transactional. Force the batch to fail and roll back if a
  // concurrent reservation changed a bucket after allocation was calculated.
  // The deliberate zero amount violates the allocation table constraint only
  // when the reservation is not fully backed by real bucket allocations.
  statements.push(
    db
      .prepare(
        `insert into credit_reservation_allocations (
          id, reservation_id, bucket_type, credit_period_id, credit_lot_id, amount, created_at
        )
        select 'invalid:' || r.id, r.id, 'period', r.credit_period_id, null, 0, ?
        from credit_reservations r
        where r.id = ?
          and coalesce((
            select sum(a.amount) from credit_reservation_allocations a where a.reservation_id = r.id
          ), 0) <> r.amount`,
      )
      .bind(timestamp, reservationId),
  );

  await db.batch(statements);

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
      `select id, workspace_id as workspaceId, credit_period_id as creditPeriodId, amount, status,
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

  const allocations = await db
    .prepare(
      `select id, bucket_type as bucketType, credit_period_id as creditPeriodId,
        credit_lot_id as creditLotId, amount
       from credit_reservation_allocations where reservation_id = ? order by id`,
    )
    .bind(reservationId)
    .all<ReservationAllocationRow>();
  if (allocations.results.length > 0) {
    await transitionAllocatedReservation(db, current, allocations.results, targetStatus, now);
    const transitioned = await getReservationById(db, reservationId);
    if (!transitioned) throw new Error("Credit reservation disappeared during transition.");
    return transitioned;
  }

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

async function transitionAllocatedReservation(
  db: D1Database,
  current: CreditReservation,
  allocations: ReservationAllocationRow[],
  targetStatus: Exclude<CreditReservationStatus, "reserved">,
  now: Date,
): Promise<void> {
  const timestamp = now.toISOString();
  const eventType = targetStatus === "settled" ? "settle" : "release";
  const statements: D1PreparedStatement[] = [];

  for (const allocation of allocations) {
    const ledgerKey = `${eventType}:${current.id}:${allocation.bucketType}:${allocation.creditPeriodId ?? allocation.creditLotId}`;
    if (allocation.bucketType === "period" && allocation.creditPeriodId) {
      const periodSql = targetStatus === "settled"
        ? "reserved = reserved - ?, consumed = consumed + ?"
        : "reserved = reserved - ?";
      const periodValues = targetStatus === "settled"
        ? [allocation.amount, allocation.amount, timestamp, allocation.creditPeriodId, ledgerKey]
        : [allocation.amount, timestamp, allocation.creditPeriodId, ledgerKey];
      statements.push(
        db.prepare(
          `update workspace_credit_periods set ${periodSql}, updated_at = ?
           where id = ? and not exists (select 1 from usage_ledger where idempotency_key = ?)`,
        ).bind(...periodValues),
        db.prepare(
          `insert into usage_ledger (
            id, workspace_id, credit_period_id, reservation_id, event_type,
            available_delta, reserved_delta, consumed_delta,
            source_type, source_id, idempotency_key, metadata_json, created_at
          ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          on conflict(idempotency_key) do nothing`,
        ).bind(
          crypto.randomUUID(), current.workspaceId, allocation.creditPeriodId, current.id, eventType,
          targetStatus === "released" ? allocation.amount : 0,
          -allocation.amount,
          targetStatus === "settled" ? allocation.amount : 0,
          current.sourceType, current.sourceId, ledgerKey, JSON.stringify({ bucketType: "period" }), timestamp,
        ),
      );
    }

    if (allocation.bucketType === "pack" && allocation.creditLotId) {
      const lotSql = targetStatus === "settled"
        ? `reserved = reserved - ?, consumed = consumed + ?,
           status = case when consumed + ? >= granted then 'exhausted' else status end`
        : "reserved = reserved - ?";
      const lotValues = targetStatus === "settled"
        ? [allocation.amount, allocation.amount, allocation.amount, timestamp, allocation.creditLotId, ledgerKey]
        : [allocation.amount, timestamp, allocation.creditLotId, ledgerKey];
      statements.push(
        db.prepare(
          `update workspace_credit_lots set ${lotSql}, updated_at = ?
           where id = ? and not exists (select 1 from credit_lot_ledger where idempotency_key = ?)`,
        ).bind(...lotValues),
        db.prepare(
          `insert into credit_lot_ledger (
            id, workspace_id, credit_lot_id, reservation_id, event_type,
            available_delta, reserved_delta, consumed_delta,
            source_type, source_id, idempotency_key, metadata_json, created_at
          ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          on conflict(idempotency_key) do nothing`,
        ).bind(
          crypto.randomUUID(), current.workspaceId, allocation.creditLotId, current.id, eventType,
          targetStatus === "released" ? allocation.amount : 0,
          -allocation.amount,
          targetStatus === "settled" ? allocation.amount : 0,
          current.sourceType, current.sourceId, ledgerKey, JSON.stringify({ bucketType: "pack" }), timestamp,
        ),
      );
    }
  }

  statements.push(
    db.prepare(
      `update credit_reservations set status = ?, updated_at = ? where id = ? and status = 'reserved'`,
    ).bind(targetStatus, timestamp, current.id),
  );
  await db.batch(statements);
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
         credit_period_id as creditPeriodId,
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
         credit_period_id as creditPeriodId,
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
