import type { D1Database } from "@/lib/cloudflare/bindings";

export type BillingIntegrityAlertCode =
  | "stripe_webhook_unhealthy"
  | "paid_pack_missing_grant"
  | "credit_lot_ledger_mismatch"
  | "expired_credit_reservation"
  | "subscription_period_mismatch";

export interface BillingIntegrityAlert {
  code: BillingIntegrityAlertCode;
  count: number;
  sampleIds: string[];
}

export interface BillingIntegrityReport {
  checkedAt: string;
  healthy: boolean;
  alerts: BillingIntegrityAlert[];
}

export async function auditBillingIntegrity(
  db: D1Database,
  now = new Date(),
): Promise<BillingIntegrityReport> {
  const staleWebhookCutoff = new Date(now.getTime() - 10 * 60_000).toISOString();
  const missingGrantCutoff = new Date(now.getTime() - 5 * 60_000).toISOString();

  const [webhooks, missingGrants, lotMismatches, expiredReservations, subscriptionMismatches] = await Promise.all([
    queryIds(
      db,
      `select event_id as id
       from stripe_webhook_events
       where status = 'failed'
          or (status = 'processing' and received_at <= ?)
       order by received_at asc
       limit 20`,
      staleWebhookCutoff,
    ),
    queryIds(
      db,
      `select e.source_object_id as id
       from stripe_webhook_events e
       left join workspace_credit_lots l
         on l.stripe_checkout_session_id = e.source_object_id
       where e.status = 'completed'
         and e.purchase_type = 'credit_pack'
         and e.payment_status in ('paid', 'no_payment_required')
         and e.received_at <= ?
         and l.id is null
       order by e.received_at asc
       limit 20`,
      missingGrantCutoff,
    ),
    queryIds(
      db,
      `with ledger_totals as (
         select
           credit_lot_id,
           coalesce(sum(available_delta), 0) as available,
           coalesce(sum(reserved_delta), 0) as reserved,
           coalesce(sum(consumed_delta), 0) as consumed
         from credit_lot_ledger
         group by credit_lot_id
       )
       select l.id
       from workspace_credit_lots l
       left join ledger_totals t on t.credit_lot_id = l.id
       where (case when l.status = 'refunded' then 0 else l.granted - l.consumed - l.reserved end) != coalesce(t.available, 0)
          or l.reserved != coalesce(t.reserved, 0)
          or l.consumed != coalesce(t.consumed, 0)
       order by l.updated_at asc
       limit 20`,
    ),
    queryIds(
      db,
      `select id
       from credit_reservations
       where status = 'reserved' and expires_at <= ?
       order by expires_at asc
       limit 20`,
      now.toISOString(),
    ),
    queryIds(
      db,
      `select s.workspace_id as id
       from workspace_subscriptions s
       left join workspace_credit_periods cp
         on cp.id = (
           select current_cp.id
           from workspace_credit_periods current_cp
           where current_cp.workspace_id = s.workspace_id
             and current_cp.period_key = case
               when s.provider = 'stripe' then 'stripe-' || s.current_period_start
               else substr(s.current_period_start, 1, 7)
             end
           limit 1
         )
       where s.status in ('active', 'trialing')
         and (cp.id is null or cp.plan_code != s.plan_code)
       order by s.workspace_id asc
       limit 20`,
    ),
  ]);

  const alerts = [
    alert("stripe_webhook_unhealthy", webhooks),
    alert("paid_pack_missing_grant", missingGrants),
    alert("credit_lot_ledger_mismatch", lotMismatches),
    alert("expired_credit_reservation", expiredReservations),
    alert("subscription_period_mismatch", subscriptionMismatches),
  ].filter((value): value is BillingIntegrityAlert => value !== null);

  return { checkedAt: now.toISOString(), healthy: alerts.length === 0, alerts };
}

function alert(code: BillingIntegrityAlertCode, ids: string[]): BillingIntegrityAlert | null {
  return ids.length > 0 ? { code, count: ids.length, sampleIds: ids.slice(0, 5) } : null;
}

async function queryIds(db: D1Database, sql: string, ...bindings: unknown[]): Promise<string[]> {
  const result = await db.prepare(sql).bind(...bindings).all<{ id: string | null }>();
  if (!result.success) throw new Error(result.error ?? "Billing integrity query failed.");
  return result.results.flatMap((row) => typeof row.id === "string" && row.id ? [row.id] : []);
}
