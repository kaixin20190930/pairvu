import type { D1Database } from "@/lib/cloudflare/bindings";
import { CHECK_PACKS, type CheckPackCode } from "@/lib/billing/packs";

export interface WorkspacePackBalance {
  granted: number;
  consumed: number;
  reserved: number;
  available: number;
  nextExpiryAt: string | null;
}

export async function grantWorkspaceCreditPack(input: {
  db: D1Database;
  workspaceId: string;
  packCode: CheckPackCode;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  now?: Date;
}): Promise<string> {
  const pack = CHECK_PACKS[input.packCode];
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const expiresAt = new Date(now.getTime() + pack.validityDays * 24 * 60 * 60 * 1000).toISOString();
  const lotId = `pack_${input.checkoutSessionId}`;

  await input.db.batch([
    input.db
      .prepare(
        `insert into workspace_credit_lots (
          id, workspace_id, pack_code, stripe_checkout_session_id, stripe_payment_intent_id,
          granted, consumed, reserved, status, purchased_at, expires_at, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, 0, 0, 'active', ?, ?, ?, ?)
        on conflict(stripe_checkout_session_id) do nothing`,
      )
      .bind(
        lotId,
        input.workspaceId,
        pack.code,
        input.checkoutSessionId,
        input.paymentIntentId,
        pack.credits,
        timestamp,
        expiresAt,
        timestamp,
        timestamp,
      ),
    input.db
      .prepare(
        `insert into credit_lot_ledger (
          id, workspace_id, credit_lot_id, reservation_id, event_type,
          available_delta, reserved_delta, consumed_delta,
          source_type, source_id, idempotency_key, metadata_json, created_at
        )
        select ?, workspace_id, id, null, 'grant', granted, 0, 0,
          'stripe_checkout', stripe_checkout_session_id, ?, ?, ?
        from workspace_credit_lots
        where stripe_checkout_session_id = ?
        on conflict(idempotency_key) do nothing`,
      )
      .bind(
        crypto.randomUUID(),
        `pack_grant:${input.checkoutSessionId}`,
        JSON.stringify({ packCode: pack.code, credits: pack.credits, validityDays: pack.validityDays }),
        timestamp,
        input.checkoutSessionId,
      ),
  ]);

  const lot = await input.db
    .prepare(`select id from workspace_credit_lots where stripe_checkout_session_id = ? limit 1`)
    .bind(input.checkoutSessionId)
    .first<{ id: string }>();
  if (!lot) throw new Error("The purchased check pack could not be recorded.");
  return lot.id;
}

export async function getWorkspacePackBalance(
  db: D1Database,
  workspaceId: string,
  now = new Date(),
): Promise<WorkspacePackBalance> {
  const row = await db
    .prepare(
      `select
         coalesce(sum(granted), 0) as granted,
         coalesce(sum(consumed), 0) as consumed,
         coalesce(sum(reserved), 0) as reserved,
         coalesce(sum(granted - consumed - reserved), 0) as available,
         min(case when granted - consumed - reserved > 0 then expires_at end) as nextExpiryAt
       from workspace_credit_lots
       where workspace_id = ?
         and status = 'active'
         and expires_at > ?`,
    )
    .bind(workspaceId, now.toISOString())
    .first<Record<string, unknown>>();

  return {
    granted: Number(row?.granted ?? 0),
    consumed: Number(row?.consumed ?? 0),
    reserved: Number(row?.reserved ?? 0),
    available: Number(row?.available ?? 0),
    nextExpiryAt: typeof row?.nextExpiryAt === "string" ? row.nextExpiryAt : null,
  };
}
