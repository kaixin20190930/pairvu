import type { D1Database } from "@/lib/cloudflare/bindings";
import { PLAN_ENTITLEMENTS, isPlanCode, type PlanCode } from "@/lib/billing/plans";

export interface AuthUserIdentity {
  id: string;
  name: string;
  email: string;
}

export interface WorkspaceAccountSnapshot {
  workspaceId: string;
  workspaceName: string;
  planCode: PlanCode;
  planName: string;
  retentionDays: number;
  batchItemLimit: number;
  csvExportEnabled: boolean;
  periodStartsAt: string;
  periodEndsAt: string;
  allowance: number;
  consumed: number;
  reserved: number;
  available: number;
  subscriptionStatus: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  billingManaged: boolean;
}

export interface RecentWorkspaceAnalysis {
  id: string;
  verdict: "PASS" | "REVIEW" | "FAIL";
  category: string | null;
  completedAt: string;
  issueCount: number;
  limitationCount: number;
  imagesAvailable: boolean;
}

interface WorkspaceRow {
  workspaceId: string;
  workspaceName: string;
  planCode: string;
  periodStartsAt: string;
  periodEndsAt: string;
  allowance: number;
  rolloverAllowance: number;
  consumed: number;
  reserved: number;
  subscriptionStatus: WorkspaceAccountSnapshot["subscriptionStatus"];
  subscriptionProvider: string;
}

interface SubscriptionRow {
  id: string;
  planCode: string;
  provider: "internal" | "stripe";
  status: WorkspaceAccountSnapshot["subscriptionStatus"];
  periodStartsAt: string;
  periodEndsAt: string;
}

export function getCalendarMonthPeriod(now = new Date()): {
  periodKey: string;
  startsAt: string;
  endsAt: string;
} {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const startsAt = new Date(Date.UTC(year, month, 1));
  const endsAt = new Date(Date.UTC(year, month + 1, 1));

  return {
    periodKey: `${year}-${String(month + 1).padStart(2, "0")}`,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

export async function ensurePersonalWorkspace(
  db: D1Database,
  user: AuthUserIdentity,
  now = new Date(),
): Promise<string> {
  const workspaceId = `personal_${user.id}`;
  const membershipId = `owner_${user.id}`;
  const subscriptionId = `free_${workspaceId}`;
  const period = getCalendarMonthPeriod(now);
  const timestamp = now.toISOString();
  const workspaceName = personalWorkspaceName(user);

  await runOrThrow(
    db,
    `insert into workspaces (
      id, workspace_type, name, status, retention_policy_key, created_at, updated_at
    ) values (?, 'personal', ?, 'active', 'authenticated_7d', ?, ?)
    on conflict(id) do update set
      name = excluded.name,
      updated_at = excluded.updated_at`,
    workspaceId,
    workspaceName,
    timestamp,
    timestamp,
  );

  await runOrThrow(
    db,
    `insert into workspace_memberships (
      id, workspace_id, user_id, role, created_at, updated_at
    ) values (?, ?, ?, 'owner', ?, ?)
    on conflict(workspace_id, user_id) do nothing`,
    membershipId,
    workspaceId,
    user.id,
    timestamp,
    timestamp,
  );

  await runOrThrow(
    db,
    `insert into workspace_subscriptions (
      id, workspace_id, plan_code, provider, status,
      current_period_start, current_period_end, cancel_at_period_end,
      created_at, updated_at
    ) values (?, ?, 'free', 'internal', 'active', ?, ?, 0, ?, ?)
    on conflict(workspace_id) do nothing`,
    subscriptionId,
    workspaceId,
    period.startsAt,
    period.endsAt,
    timestamp,
    timestamp,
  );

  await ensureCurrentCreditPeriod(db, workspaceId, now);
  return workspaceId;
}

export async function ensureCurrentCreditPeriod(
  db: D1Database,
  workspaceId: string,
  now = new Date(),
): Promise<string> {
  const timestamp = now.toISOString();
  const subscription = await db
    .prepare(
      `select
         id,
         plan_code as planCode,
         provider,
         status,
         current_period_start as periodStartsAt,
         current_period_end as periodEndsAt
       from workspace_subscriptions
       where workspace_id = ?
       limit 1`,
    )
    .bind(workspaceId)
    .first<SubscriptionRow>();

  if (!subscription || !isPlanCode(subscription.planCode)) {
    throw new Error("Workspace does not have an active supported plan.");
  }

  if (subscription.status !== "active" && subscription.status !== "trialing") {
    const latest = await db
      .prepare(
        `select id
         from workspace_credit_periods
         where workspace_id = ?
         order by ends_at desc
         limit 1`,
      )
      .bind(workspaceId)
      .first<{ id: string }>();
    if (latest) return latest.id;
    throw new Error("Workspace subscription is not active.");
  }

  const plan = PLAN_ENTITLEMENTS[subscription.planCode];
  const period = subscription.provider === "stripe"
    ? {
        periodKey: `stripe-${subscription.periodStartsAt}`,
        startsAt: subscription.periodStartsAt,
        endsAt: subscription.periodEndsAt,
      }
    : getCalendarMonthPeriod(now);
  const periodId = `${workspaceId}_${period.periodKey}`;
  await runOrThrow(
    db,
    `insert into workspace_credit_periods (
      id, workspace_id, subscription_id, plan_code, period_key,
      starts_at, ends_at, allowance, rollover_allowance, consumed, reserved,
      created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
    on conflict(workspace_id, period_key) do nothing`,
    periodId,
    workspaceId,
    subscription.id,
    plan.code,
    period.periodKey,
    period.startsAt,
    period.endsAt,
    plan.includedMonthlyCredits,
    timestamp,
    timestamp,
  );

  await runOrThrow(
    db,
    `insert into usage_ledger (
      id, workspace_id, credit_period_id, reservation_id, event_type,
      available_delta, reserved_delta, consumed_delta,
      source_type, source_id, idempotency_key, metadata_json, created_at
    ) values (?, ?, ?, null, 'period_grant', ?, 0, 0, 'subscription_period', ?, ?, '{}', ?)
    on conflict(idempotency_key) do nothing`,
    `ledger_grant_${periodId}`,
    workspaceId,
    periodId,
    plan.includedMonthlyCredits,
    periodId,
    `period_grant:${periodId}`,
    timestamp,
  );

  const existing = await db
    .prepare(
      `select plan_code as planCode, allowance
       from workspace_credit_periods
       where id = ?
       limit 1`,
    )
    .bind(periodId)
    .first<{ planCode: string; allowance: number }>();

  if (existing && (existing.planCode !== plan.code || existing.allowance !== plan.includedMonthlyCredits)) {
    const allowanceDelta = plan.includedMonthlyCredits - existing.allowance;
    await runOrThrow(
      db,
      `update workspace_credit_periods
       set subscription_id = ?, plan_code = ?, starts_at = ?, ends_at = ?, allowance = ?, updated_at = ?
       where id = ?`,
      subscription.id,
      plan.code,
      period.startsAt,
      period.endsAt,
      plan.includedMonthlyCredits,
      timestamp,
      periodId,
    );
    await runOrThrow(
      db,
      `insert into usage_ledger (
        id, workspace_id, credit_period_id, reservation_id, event_type,
        available_delta, reserved_delta, consumed_delta,
        source_type, source_id, idempotency_key, metadata_json, created_at
      ) values (?, ?, ?, null, 'adjustment', ?, 0, 0, 'plan_change', ?, ?, ?, ?)
      on conflict(idempotency_key) do nothing`,
      crypto.randomUUID(),
      workspaceId,
      periodId,
      allowanceDelta,
      plan.code,
      `plan_allowance:${periodId}:${plan.code}:${plan.includedMonthlyCredits}`,
      JSON.stringify({ previousAllowance: existing.allowance, allowance: plan.includedMonthlyCredits }),
      timestamp,
    );
  }

  return periodId;
}

export async function getWorkspaceAccountSnapshot(
  db: D1Database,
  user: AuthUserIdentity,
  now = new Date(),
): Promise<WorkspaceAccountSnapshot> {
  const workspaceId = await ensurePersonalWorkspace(db, user, now);
  const periodId = await ensureCurrentCreditPeriod(db, workspaceId, now);
  const row = await db
    .prepare(
      `select
         w.id as workspaceId,
         w.name as workspaceName,
         s.plan_code as planCode,
         cp.starts_at as periodStartsAt,
         cp.ends_at as periodEndsAt,
         cp.allowance as allowance,
         cp.rollover_allowance as rolloverAllowance,
         cp.consumed as consumed,
         cp.reserved as reserved
         ,s.status as subscriptionStatus
         ,s.provider as subscriptionProvider
       from workspaces w
       join workspace_memberships m on m.workspace_id = w.id
       join workspace_subscriptions s on s.workspace_id = w.id
       join workspace_credit_periods cp on cp.workspace_id = w.id
       where m.user_id = ?
         and w.id = ?
         and cp.id = ?
       limit 1`,
    )
    .bind(user.id, workspaceId, periodId)
    .first<WorkspaceRow>();

  if (!row || !isPlanCode(row.planCode)) {
    throw new Error("Unable to load workspace entitlements.");
  }

  const plan = PLAN_ENTITLEMENTS[row.planCode];
  const available = Math.max(0, row.allowance + row.rolloverAllowance - row.consumed - row.reserved);

  return {
    workspaceId: row.workspaceId,
    workspaceName: row.workspaceName,
    planCode: plan.code,
    planName: plan.name,
    retentionDays: plan.retentionDays,
    batchItemLimit: plan.batchItemLimit,
    csvExportEnabled: plan.csvExportEnabled,
    periodStartsAt: row.periodStartsAt,
    periodEndsAt: row.periodEndsAt,
    allowance: row.allowance + row.rolloverAllowance,
    consumed: row.consumed,
    reserved: row.reserved,
    available,
    subscriptionStatus: row.subscriptionStatus,
    billingManaged: row.subscriptionProvider === "stripe",
  };
}

export async function getWorkspaceBatchEntitlement(db: D1Database, workspaceId: string) {
  const row = await db
    .prepare(
      `select p.code as planCode, p.batch_item_limit as batchItemLimit,
        p.priority_queue_enabled as priorityQueueEnabled, p.csv_export_enabled as csvExportEnabled,
        s.status as subscriptionStatus
       from workspace_subscriptions s
       join plans p on p.code = s.plan_code
       where s.workspace_id = ? and p.active = 1
       limit 1`,
    )
    .bind(workspaceId)
    .first<{
      planCode: string;
      batchItemLimit: number;
      priorityQueueEnabled: number;
      csvExportEnabled: number;
      subscriptionStatus: string;
    }>();
  if (!row || (row.subscriptionStatus !== "active" && row.subscriptionStatus !== "trialing")) {
    throw new Error("workspace_billing_inactive");
  }
  return {
    planCode: row.planCode,
    batchItemLimit: Number(row.batchItemLimit),
    priorityQueueEnabled: Boolean(row.priorityQueueEnabled),
    csvExportEnabled: Boolean(row.csvExportEnabled),
  };
}

export async function listRecentWorkspaceAnalyses(
  db: D1Database,
  workspaceId: string,
  options: { limit?: number; now?: Date } = {},
): Promise<RecentWorkspaceAnalysis[]> {
  const limit = Math.min(50, Math.max(1, options.limit ?? 12));
  const now = (options.now ?? new Date()).toISOString();
  const rows = await db
    .prepare(
      `select
         a.id,
         a.verdict,
         a.category,
         coalesce(a.completed_at, a.updated_at) as completedAt,
         (select count(*) from analysis_issues i where i.analysis_id = a.id) as issueCount,
         (select count(*) from analysis_limitations l where l.analysis_id = a.id) as limitationCount,
         case when
           r.status != 'deleted' and c.status != 'deleted'
           and r.retention_expires_at > ? and c.retention_expires_at > ?
         then 1 else 0 end as imagesAvailable
       from analyses a
       join assets r on r.id = a.reference_asset_id
       join assets c on c.id = a.candidate_asset_id
       where a.workspace_id = ?
         and a.status = 'completed'
         and lower(a.verdict) in ('pass', 'review', 'fail')
       order by coalesce(a.completed_at, a.updated_at) desc
       limit ?`,
    )
    .bind(now, now, workspaceId, limit)
    .all<Record<string, unknown>>();

  return rows.results.map((row) => ({
    id: String(row.id),
    verdict: String(row.verdict).toUpperCase() as RecentWorkspaceAnalysis["verdict"],
    category: (row.category as string | null) ?? null,
    completedAt: String(row.completedAt),
    issueCount: Number(row.issueCount ?? 0),
    limitationCount: Number(row.limitationCount ?? 0),
    imagesAvailable: Number(row.imagesAvailable) === 1,
  }));
}

function personalWorkspaceName(user: AuthUserIdentity): string {
  const preferredName = user.name.trim() || user.email.split("@")[0] || "Personal";
  return `${preferredName}'s workspace`.slice(0, 120);
}

async function runOrThrow(db: D1Database, query: string, ...values: unknown[]): Promise<void> {
  const result = await db.prepare(query).bind(...values).run();
  if (!result.success) {
    throw new Error(result.error ?? "Database operation failed.");
  }
}
