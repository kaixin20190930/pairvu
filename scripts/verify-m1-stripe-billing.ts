import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";
import { ensurePersonalWorkspace, getWorkspaceAccountSnapshot } from "../lib/accounts/repository";
import {
  beginStripeWebhookEvent,
  completeStripeWebhookEvent,
  syncStripeSubscription,
} from "../lib/billing/repository";
import { reserveWorkspaceCredits, WorkspaceBillingInactiveError } from "../lib/credits/repository";
import {
  checkPackPurchaseFromSession,
  isStripeWebhookModeAllowed,
  normalizeStripeSubscription,
  StripeSignatureError,
  subscriptionIdFromWebhookEvent,
  verifyStripeWebhook,
  type StripeWebhookEvent,
} from "../lib/billing/stripe";
import type { D1Database, D1PreparedStatement, VisualQACloudflareEnv } from "../lib/cloudflare/bindings";

const NOW = new Date("2026-08-10T08:00:00.000Z");
const RENEWAL_NOW = new Date("2026-09-10T08:00:00.000Z");
const RENEWAL_PERIOD_START = 1788998400;
const RENEWAL_PERIOD_END = 1791590400;
const USER = { id: "stripe-test-user", name: "Stripe Test", email: "stripe-test@pairvu.com" };
const ENV = {
  STRIPE_PRICE_STARTER: "price_starter_test",
  STRIPE_PRICE_GROWTH: "price_growth_test",
  STRIPE_PRICE_AGENCY: "price_agency_test",
  STRIPE_PRICE_PACK_50: "price_pack_50_test",
  STRIPE_PRICE_PACK_200: "price_pack_200_test",
  STRIPE_PRICE_PACK_500: "price_pack_500_test",
} as VisualQACloudflareEnv;

async function main() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("pragma foreign_keys = on");
  sqlite.exec(await readFile("migrations/0007_identity_workspaces_credits.sql", "utf8"));
  sqlite.exec(await readFile("migrations/0009_stripe_billing.sql", "utf8"));
  sqlite.exec(await readFile("migrations/0013_check_packs.sql", "utf8"));
  sqlite.exec(await readFile("migrations/0014_billing_observability.sql", "utf8"));
  const db = new SqliteD1(sqlite);

  sqlite.prepare(`insert into user (id, name, email, emailVerified, createdAt, updatedAt) values (?, ?, ?, 1, ?, ?)`).run(
    USER.id, USER.name, USER.email, NOW.getTime(), NOW.getTime(),
  );
  const workspaceId = await ensurePersonalWorkspace(db, USER, NOW);

  const starter = normalizeStripeSubscription(ENV, subscriptionPayload({
    priceId: ENV.STRIPE_PRICE_STARTER!, workspaceId, status: "active",
  }));
  await syncStripeSubscription(db, starter, NOW);
  let snapshot = await getWorkspaceAccountSnapshot(db, USER, NOW);
  assert.equal(snapshot.planCode, "starter");
  assert.equal(snapshot.allowance, 150);
  assert.equal(snapshot.retentionDays, 30);
  assert.equal(snapshot.billingManaged, true);
  assert.equal(snapshot.cancelAtPeriodEnd, false);

  const scheduledCancellation = normalizeStripeSubscription(ENV, subscriptionPayload({
    priceId: ENV.STRIPE_PRICE_STARTER!, workspaceId, status: "active", cancelAtPeriodEnd: true,
  }));
  await syncStripeSubscription(db, scheduledCancellation, NOW);
  snapshot = await getWorkspaceAccountSnapshot(db, USER, NOW);
  assert.equal(snapshot.planCode, "starter", "A scheduled cancellation keeps paid access through period end");
  assert.equal(snapshot.cancelAtPeriodEnd, true);
  assert.equal(scalar(sqlite, "select cancel_at_period_end from workspace_subscriptions"), 1);

  const pastDue = normalizeStripeSubscription(ENV, subscriptionPayload({
    priceId: ENV.STRIPE_PRICE_STARTER!, workspaceId, status: "past_due",
  }));
  await syncStripeSubscription(db, pastDue, NOW);
  snapshot = await getWorkspaceAccountSnapshot(db, USER, NOW);
  assert.equal(snapshot.subscriptionStatus, "past_due");
  await assert.rejects(
    reserveWorkspaceCredits({
      db,
      workspaceId,
      amount: 1,
      purpose: "past-due-check",
      sourceType: "verification",
      sourceId: "past-due-check",
      now: NOW,
    }),
    WorkspaceBillingInactiveError,
    "Past-due subscriptions must not start new paid checks",
  );

  const recovered = normalizeStripeSubscription(ENV, subscriptionPayload({
    priceId: ENV.STRIPE_PRICE_STARTER!, workspaceId, status: "active",
  }));
  await syncStripeSubscription(db, recovered, NOW);
  snapshot = await getWorkspaceAccountSnapshot(db, USER, NOW);
  assert.equal(snapshot.subscriptionStatus, "active");

  const renewed = normalizeStripeSubscription(ENV, subscriptionPayload({
    priceId: ENV.STRIPE_PRICE_STARTER!,
    workspaceId,
    status: "active",
    currentPeriodStart: RENEWAL_PERIOD_START,
    currentPeriodEnd: RENEWAL_PERIOD_END,
  }));
  await syncStripeSubscription(db, renewed, RENEWAL_NOW);
  snapshot = await getWorkspaceAccountSnapshot(db, USER, RENEWAL_NOW);
  assert.equal(snapshot.planCode, "starter");
  assert.equal(snapshot.allowance, 150);
  assert.equal(count(sqlite, "select count(*) as count from workspace_credit_periods where period_key like 'stripe-%'"), 2);

  const event = webhookEvent("evt_pairvu_once");
  assert.equal(await beginStripeWebhookEvent(db, event, NOW), true);
  await completeStripeWebhookEvent(db, event.id, NOW);
  assert.equal(await beginStripeWebhookEvent(db, event, NOW), false, "Completed event replay must be ignored");

  const packEvent: StripeWebhookEvent = {
    id: "evt_pack_audit",
    type: "checkout.session.completed",
    livemode: true,
    created: Math.floor(NOW.getTime() / 1000),
    data: {
      object: {
        id: "cs_live_pack_audit",
        payment_status: "paid",
        metadata: { purchase_type: "credit_pack", workspace_id: workspaceId, pack_code: "pack_50" },
      },
    },
  };
  assert.equal(await beginStripeWebhookEvent(db, packEvent, NOW), true);
  const packAudit = sqlite.prepare(
    `select source_object_id, workspace_id, purchase_type, payment_status
     from stripe_webhook_events where event_id = ?`,
  ).get(packEvent.id);
  assert.deepEqual(packAudit ? { ...packAudit } : null, {
    source_object_id: "cs_live_pack_audit",
    workspace_id: workspaceId,
    purchase_type: "credit_pack",
    payment_status: "paid",
  });

  assert.equal(isStripeWebhookModeAllowed({ STRIPE_SECRET_KEY: "sk_live_pairvu" } as VisualQACloudflareEnv, event), false);
  assert.equal(isStripeWebhookModeAllowed({ STRIPE_SECRET_KEY: "sk_live_pairvu" } as VisualQACloudflareEnv, { ...event, livemode: true }), true);
  assert.equal(isStripeWebhookModeAllowed({ STRIPE_SECRET_KEY: "sk_test_pairvu" } as VisualQACloudflareEnv, event), true);
  assert.equal(subscriptionIdFromWebhookEvent(event), "sub_pairvu_test");
  assert.equal(subscriptionIdFromWebhookEvent({
    ...event,
    type: "customer.subscription.deleted",
  }), "sub_pairvu_test");
  assert.equal(subscriptionIdFromWebhookEvent({
    ...event,
    type: "checkout.session.completed",
    data: { object: { subscription: "sub_from_checkout" } },
  }), "sub_from_checkout");
  assert.equal(subscriptionIdFromWebhookEvent({
    ...event,
    type: "invoice.paid",
    data: { object: { parent: { subscription_details: { subscription: "sub_from_invoice" } } } },
  }), "sub_from_invoice");
  assert.deepEqual(checkPackPurchaseFromSession({
    id: "cs_pack_test",
    mode: "payment",
    payment_status: "paid",
    payment_intent: "pi_pack_test",
    metadata: { purchase_type: "credit_pack", workspace_id: workspaceId, pack_code: "pack_50" },
  }), {
    workspaceId,
    packCode: "pack_50",
    checkoutSessionId: "cs_pack_test",
    paymentIntentId: "pi_pack_test",
    paid: true,
  });

  const growth = normalizeStripeSubscription(ENV, subscriptionPayload({
    priceId: ENV.STRIPE_PRICE_GROWTH!,
    workspaceId,
    status: "active",
    currentPeriodStart: RENEWAL_PERIOD_START,
    currentPeriodEnd: RENEWAL_PERIOD_END,
  }));
  await syncStripeSubscription(db, growth, RENEWAL_NOW);
  snapshot = await getWorkspaceAccountSnapshot(db, USER, RENEWAL_NOW);
  assert.equal(snapshot.planCode, "growth");
  assert.equal(snapshot.allowance, 600);
  assert.equal(count(sqlite, "select count(*) as count from usage_ledger where event_type = 'adjustment'"), 1);

  const canceled = normalizeStripeSubscription(ENV, subscriptionPayload({
    priceId: ENV.STRIPE_PRICE_GROWTH!,
    workspaceId,
    status: "canceled",
    currentPeriodStart: RENEWAL_PERIOD_START,
    currentPeriodEnd: RENEWAL_PERIOD_END,
  }));
  await syncStripeSubscription(db, canceled, RENEWAL_NOW);
  snapshot = await getWorkspaceAccountSnapshot(db, USER, RENEWAL_NOW);
  assert.equal(snapshot.planCode, "free");
  assert.equal(snapshot.allowance, 10);
  assert.equal(snapshot.retentionDays, 7);
  assert.equal(snapshot.billingManaged, false);
  assert.equal(textScalar(sqlite, `
    select cp.plan_code
    from workspace_subscriptions s
    join workspace_credit_periods cp
      on cp.workspace_id = s.workspace_id
     and cp.period_key = case
       when s.provider = 'stripe' then 'stripe-' || s.current_period_start
       else substr(s.current_period_start, 1, 7)
     end
  `), "free", "Billing audit must select the subscription's current Free period after cancellation");

  await verifySignatureBehavior();
  sqlite.close();
  console.log("M1 Stripe billing verification passed.");
  console.log("Verified signed webhooks, replay idempotency, paid grants, plan adjustment, cancellation downgrade, and retention.");
}

async function verifySignatureBehavior() {
  const secret = "whsec_pairvu_verification";
  const timestamp = Math.floor(NOW.getTime() / 1000);
  const event = webhookEvent("evt_signature");
  const payload = JSON.stringify(event);
  const digest = await hmac(secret, `${timestamp}.${payload}`);
  const verified = await verifyStripeWebhook(payload, `t=${timestamp},v1=${digest}`, secret, NOW);
  assert.equal(verified.id, event.id);
  await assert.rejects(
    verifyStripeWebhook(payload, `t=${timestamp},v1=${"0".repeat(64)}`, secret, NOW),
    StripeSignatureError,
  );
}

function subscriptionPayload(input: {
  priceId: string;
  workspaceId: string;
  status: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
}): Record<string, unknown> {
  return {
    id: "sub_pairvu_test",
    customer: "cus_pairvu_test",
    status: input.status,
    current_period_start: input.currentPeriodStart ?? 1786320000,
    current_period_end: input.currentPeriodEnd ?? 1788998400,
    cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
    metadata: { workspace_id: input.workspaceId },
    items: { data: [{ price: { id: input.priceId } }] },
  };
}

function webhookEvent(id: string): StripeWebhookEvent {
  return {
    id,
    type: "customer.subscription.updated",
    livemode: false,
    created: Math.floor(NOW.getTime() / 1000),
    data: { object: { id: "sub_pairvu_test" } },
  };
}

async function hmac(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const result = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(result)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function count(db: DatabaseSync, sql: string): number {
  return Number(db.prepare(sql).get()?.count ?? 0);
}

function scalar(db: DatabaseSync, sql: string): number {
  const row = db.prepare(sql).get();
  return Number(row ? Object.values(row)[0] : 0);
}

function textScalar(db: DatabaseSync, sql: string): string | null {
  const row = db.prepare(sql).get();
  return row ? String(Object.values(row)[0]) : null;
}

class SqliteD1 implements D1Database {
  constructor(private readonly db: DatabaseSync) {}
  prepare(query: string): D1PreparedStatement { return new SqliteStatement(this.db.prepare(query)); }
  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]> {
    const results: T[] = [];
    for (const statement of statements) results.push((await statement.run()) as T);
    return results;
  }
}

class SqliteStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly statement: StatementSync) {}
  bind(...values: unknown[]): D1PreparedStatement { this.values = values; return this; }
  async all<T = Record<string, unknown>>() {
    try { return { results: this.statement.all(...sqliteValues(this.values)) as T[], success: true }; }
    catch (error) { return { results: [], success: false, error: message(error) }; }
  }
  async first<T = Record<string, unknown>>(): Promise<T | null> {
    return (this.statement.get(...sqliteValues(this.values)) as T | undefined) ?? null;
  }
  async run() {
    try { this.statement.run(...sqliteValues(this.values)); return { success: true }; }
    catch (error) { return { success: false, error: message(error) }; }
  }
}

function sqliteValues(values: unknown[]): SQLInputValue[] {
  return values.map((value) => {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "bigint" || value instanceof Uint8Array) return value;
    if (typeof value === "boolean") return value ? 1 : 0;
    throw new TypeError(`Unsupported SQLite verification value: ${typeof value}`);
  });
}

function message(error: unknown) { return error instanceof Error ? error.message : String(error); }
main().catch((error) => { console.error(error); process.exitCode = 1; });
