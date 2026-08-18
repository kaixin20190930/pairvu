import { ensureCurrentCreditPeriod, getCalendarMonthPeriod } from "@/lib/accounts/repository";
import type { D1Database } from "@/lib/cloudflare/bindings";
import { PLAN_ENTITLEMENTS, type PlanCode } from "./plans";
import type { StripeSubscriptionSnapshot, StripeWebhookEvent } from "./stripe";

export interface WorkspaceBillingRecord {
  workspaceId: string;
  planCode: PlanCode;
  provider: "internal" | "stripe";
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  customerId: string | null;
  subscriptionId: string | null;
}

export async function getWorkspaceBillingRecord(
  db: D1Database,
  workspaceId: string,
): Promise<WorkspaceBillingRecord | null> {
  return db
    .prepare(
      `select
         workspace_id as workspaceId,
         plan_code as planCode,
         provider,
         status,
         provider_customer_id as customerId,
         provider_subscription_id as subscriptionId
       from workspace_subscriptions
       where workspace_id = ?
       limit 1`,
    )
    .bind(workspaceId)
    .first<WorkspaceBillingRecord>();
}

export async function syncStripeSubscription(
  db: D1Database,
  subscription: StripeSubscriptionSnapshot,
  now = new Date(),
): Promise<string> {
  const workspaceId = await resolveStripeWorkspace(db, subscription);
  if (!workspaceId) throw new Error("Stripe subscription could not be mapped to a Pairvu workspace.");

  if (isTerminalStripeStatus(subscription.status)) {
    await downgradeWorkspaceToFree(db, workspaceId, subscription.customerId, now);
    return workspaceId;
  }
  if (!subscription.planCode || subscription.planCode === "free") {
    throw new Error(`Stripe subscription price ${subscription.priceId ?? "unknown"} is not mapped to a paid Pairvu plan.`);
  }

  const status = normalizeSubscriptionStatus(subscription.status);
  const timestamp = now.toISOString();
  await runOrThrow(
    db,
    `update workspace_subscriptions
     set plan_code = ?, provider = 'stripe', status = ?,
       provider_customer_id = ?, provider_subscription_id = ?,
       current_period_start = ?, current_period_end = ?, cancel_at_period_end = ?, updated_at = ?
     where workspace_id = ?`,
    subscription.planCode,
    status,
    subscription.customerId,
    subscription.id,
    subscription.currentPeriodStart,
    subscription.currentPeriodEnd,
    subscription.cancelAtPeriodEnd ? 1 : 0,
    timestamp,
    workspaceId,
  );
  await runOrThrow(
    db,
    `update workspaces
     set retention_policy_key = ?, updated_at = ?
     where id = ?`,
    PLAN_ENTITLEMENTS[subscription.planCode].retentionPolicyKey,
    timestamp,
    workspaceId,
  );
  if (status === "active" || status === "trialing") {
    await ensureCurrentCreditPeriod(db, workspaceId, now);
  }
  return workspaceId;
}

export async function beginStripeWebhookEvent(
  db: D1Database,
  event: StripeWebhookEvent,
  now = new Date(),
): Promise<boolean> {
  const receivedAt = now.toISOString();
  const result = await db
    .prepare(
      `insert or ignore into stripe_webhook_events (
        event_id, event_type, livemode, status, payload_created_at, received_at
      ) values (?, ?, ?, 'processing', ?, ?)`,
    )
    .bind(
      event.id,
      event.type,
      event.livemode ? 1 : 0,
      Number.isFinite(event.created) ? new Date(event.created * 1000).toISOString() : null,
      receivedAt,
    )
    .run();
  if (!result.success) throw new Error(result.error ?? "Unable to journal Stripe webhook event.");

  const row = await db
    .prepare(`select status from stripe_webhook_events where event_id = ? limit 1`)
    .bind(event.id)
    .first<{ status: string }>();
  if (row?.status === "completed") return false;

  await runOrThrow(
    db,
    `update stripe_webhook_events
     set status = 'processing', error_message = null
     where event_id = ?`,
    event.id,
  );
  return true;
}

export async function completeStripeWebhookEvent(
  db: D1Database,
  eventId: string,
  now = new Date(),
): Promise<void> {
  await runOrThrow(
    db,
    `update stripe_webhook_events
     set status = 'completed', processed_at = ?, error_message = null
     where event_id = ?`,
    now.toISOString(),
    eventId,
  );
}

export async function failStripeWebhookEvent(
  db: D1Database,
  eventId: string,
  error: unknown,
  now = new Date(),
): Promise<void> {
  const message = error instanceof Error ? error.message : "Stripe webhook processing failed.";
  await runOrThrow(
    db,
    `update stripe_webhook_events
     set status = 'failed', processed_at = ?, error_message = ?
     where event_id = ?`,
    now.toISOString(),
    message.slice(0, 500),
    eventId,
  );
}

async function resolveStripeWorkspace(
  db: D1Database,
  subscription: StripeSubscriptionSnapshot,
): Promise<string | null> {
  if (subscription.workspaceId) {
    const workspace = await db
      .prepare(`select id from workspaces where id = ? and status = 'active' limit 1`)
      .bind(subscription.workspaceId)
      .first<{ id: string }>();
    if (workspace) return workspace.id;
  }

  const row = await db
    .prepare(
      `select workspace_id as workspaceId
       from workspace_subscriptions
       where provider_subscription_id = ? or provider_customer_id = ?
       limit 1`,
    )
    .bind(subscription.id, subscription.customerId)
    .first<{ workspaceId: string }>();
  return row?.workspaceId ?? null;
}

async function downgradeWorkspaceToFree(
  db: D1Database,
  workspaceId: string,
  customerId: string,
  now: Date,
): Promise<void> {
  const period = getCalendarMonthPeriod(now);
  const timestamp = now.toISOString();
  await runOrThrow(
    db,
    `update workspace_subscriptions
     set plan_code = 'free', provider = 'internal', status = 'active',
       provider_customer_id = ?, provider_subscription_id = null,
       current_period_start = ?, current_period_end = ?, cancel_at_period_end = 0, updated_at = ?
     where workspace_id = ?`,
    customerId,
    period.startsAt,
    period.endsAt,
    timestamp,
    workspaceId,
  );
  await runOrThrow(
    db,
    `update workspaces
     set retention_policy_key = 'authenticated_7d', updated_at = ?
     where id = ?`,
    timestamp,
    workspaceId,
  );
  await ensureCurrentCreditPeriod(db, workspaceId, now);
}

function normalizeSubscriptionStatus(status: string): WorkspaceBillingRecord["status"] {
  if (status === "active" || status === "trialing" || status === "past_due" || status === "incomplete") {
    return status;
  }
  if (status === "unpaid" || status === "paused") return "past_due";
  return "canceled";
}

function isTerminalStripeStatus(status: string): boolean {
  return status === "canceled" || status === "incomplete_expired";
}

async function runOrThrow(db: D1Database, query: string, ...values: unknown[]): Promise<void> {
  const result = await db.prepare(query).bind(...values).run();
  if (!result.success) throw new Error(result.error ?? "Billing database operation failed.");
}
