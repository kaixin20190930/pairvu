import type { VisualQACloudflareEnv } from "@/lib/cloudflare/bindings";
import { isPlanCode, type PlanCode } from "./plans";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const WEBHOOK_TOLERANCE_SECONDS = 300;

export interface StripeSubscriptionSnapshot {
  id: string;
  customerId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
  planCode: PlanCode | null;
  workspaceId: string | null;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  livemode: boolean;
  created: number;
  data: { object: Record<string, unknown> };
}

export function isStripeWebhookModeAllowed(
  env: VisualQACloudflareEnv,
  event: Pick<StripeWebhookEvent, "livemode">,
): boolean {
  return !env.STRIPE_SECRET_KEY?.startsWith("sk_live_") || event.livemode;
}

export function subscriptionIdFromWebhookEvent(event: StripeWebhookEvent): string | null {
  if (event.type.startsWith("customer.subscription.")) {
    return typeof event.data.object.id === "string" ? event.data.object.id : null;
  }
  return subscriptionIdFromEventObject(event.data.object);
}

export function stripePriceId(env: VisualQACloudflareEnv, planCode: Exclude<PlanCode, "free">): string {
  const value = {
    starter: env.STRIPE_PRICE_STARTER,
    growth: env.STRIPE_PRICE_GROWTH,
    agency: env.STRIPE_PRICE_AGENCY,
  }[planCode];
  if (!value) throw new StripeConfigurationError(`Stripe price is not configured for ${planCode}.`);
  return value;
}

export function stripePlanForPrice(env: VisualQACloudflareEnv, priceId: string | null): PlanCode | null {
  if (!priceId) return null;
  if (priceId === env.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === env.STRIPE_PRICE_GROWTH) return "growth";
  if (priceId === env.STRIPE_PRICE_AGENCY) return "agency";
  return null;
}

export async function createStripeCheckoutSession(input: {
  env: VisualQACloudflareEnv;
  workspaceId: string;
  email: string;
  planCode: Exclude<PlanCode, "free">;
  customerId?: string | null;
  returnBaseUrl: string;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": stripePriceId(input.env, input.planCode),
    "line_items[0][quantity]": "1",
    success_url: `${input.returnBaseUrl}/account?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.returnBaseUrl}/account?billing=canceled`,
    client_reference_id: input.workspaceId,
    "metadata[workspace_id]": input.workspaceId,
    "metadata[plan_code]": input.planCode,
    "subscription_data[metadata][workspace_id]": input.workspaceId,
    "subscription_data[metadata][plan_code]": input.planCode,
  });
  if (input.customerId) body.set("customer", input.customerId);
  else body.set("customer_email", input.email);

  const session = await stripeRequest<Record<string, unknown>>(input.env, "/checkout/sessions", body);
  if (typeof session.id !== "string" || typeof session.url !== "string") {
    throw new StripeApiError("Stripe did not return a usable Checkout Session.", 502);
  }
  return { id: session.id, url: session.url };
}

export async function createStripePortalSession(input: {
  env: VisualQACloudflareEnv;
  customerId: string;
  returnBaseUrl: string;
}): Promise<{ url: string }> {
  const session = await stripeRequest<Record<string, unknown>>(
    input.env,
    "/billing_portal/sessions",
    new URLSearchParams({ customer: input.customerId, return_url: `${input.returnBaseUrl}/account` }),
  );
  if (typeof session.url !== "string") {
    throw new StripeApiError("Stripe did not return a customer portal URL.", 502);
  }
  return { url: session.url };
}

export async function retrieveStripeSubscription(
  env: VisualQACloudflareEnv,
  subscriptionId: string,
): Promise<Record<string, unknown>> {
  return stripeRequest<Record<string, unknown>>(env, `/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export function normalizeStripeSubscription(
  env: VisualQACloudflareEnv,
  value: Record<string, unknown>,
): StripeSubscriptionSnapshot {
  const items = asRecord(value.items);
  const firstItem = Array.isArray(items?.data) ? asRecord(items.data[0]) : null;
  const price = asRecord(firstItem?.price);
  const metadata = asRecord(value.metadata);
  const currentPeriodStart = unixTimestamp(value.current_period_start ?? firstItem?.current_period_start);
  const currentPeriodEnd = unixTimestamp(value.current_period_end ?? firstItem?.current_period_end);
  const priceId = typeof price?.id === "string" ? price.id : null;
  const metadataPlan = typeof metadata?.plan_code === "string" && isPlanCode(metadata.plan_code)
    ? metadata.plan_code
    : null;

  if (typeof value.id !== "string" || !currentPeriodStart || !currentPeriodEnd) {
    throw new StripeApiError("Stripe subscription payload is missing its identifier or billing period.", 400);
  }

  return {
    id: value.id,
    customerId: idFromExpandable(value.customer),
    status: typeof value.status === "string" ? value.status : "incomplete",
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: value.cancel_at_period_end === true,
    priceId,
    planCode: stripePlanForPrice(env, priceId) ?? metadataPlan,
    workspaceId: typeof metadata?.workspace_id === "string" ? metadata.workspace_id : null,
  };
}

export async function verifyStripeWebhook(
  payload: string,
  signatureHeader: string | null,
  secret: string | undefined,
  now = new Date(),
): Promise<StripeWebhookEvent> {
  if (!secret) throw new StripeConfigurationError("STRIPE_WEBHOOK_SECRET is not configured.");
  const signature = parseSignatureHeader(signatureHeader);
  if (Math.abs(now.getTime() / 1000 - signature.timestamp) > WEBHOOK_TOLERANCE_SECONDS) {
    throw new StripeSignatureError("Stripe webhook timestamp is outside the allowed tolerance.");
  }

  const expected = await hmacSha256Hex(secret, `${signature.timestamp}.${payload}`);
  if (!signature.values.some((value) => constantTimeEqual(value, expected))) {
    throw new StripeSignatureError("Stripe webhook signature is invalid.");
  }

  const event = JSON.parse(payload) as StripeWebhookEvent;
  if (!event.id || !event.type || !event.data?.object) {
    throw new StripeSignatureError("Stripe webhook payload is malformed.");
  }
  return event;
}

export function subscriptionIdFromEventObject(value: Record<string, unknown>): string | null {
  const direct = idFromExpandableOptional(value.subscription);
  if (direct) return direct;
  const parent = asRecord(value.parent);
  const details = asRecord(parent?.subscription_details);
  return idFromExpandableOptional(details?.subscription);
}

async function stripeRequest<T>(
  env: VisualQACloudflareEnv,
  path: string,
  body?: URLSearchParams,
): Promise<T> {
  if (!env.STRIPE_SECRET_KEY) throw new StripeConfigurationError("STRIPE_SECRET_KEY is not configured.");
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
  });
  const payload = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    const error = asRecord(payload.error);
    throw new StripeApiError(
      typeof error?.message === "string" ? error.message : "Stripe API request failed.",
      response.status,
    );
  }
  return payload as T;
}

function parseSignatureHeader(value: string | null): { timestamp: number; values: string[] } {
  if (!value) throw new StripeSignatureError("Stripe-Signature header is missing.");
  let timestamp = 0;
  const values: string[] = [];
  for (const part of value.split(",")) {
    const [key, entry] = part.split("=", 2);
    if (key === "t") timestamp = Number(entry);
    if (key === "v1" && entry) values.push(entry);
  }
  if (!Number.isFinite(timestamp) || timestamp <= 0 || values.length === 0) {
    throw new StripeSignatureError("Stripe-Signature header is malformed.");
  }
  return { timestamp, values };
}

async function hmacSha256Hex(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function idFromExpandable(value: unknown): string {
  const id = idFromExpandableOptional(value);
  if (!id) throw new StripeApiError("Stripe payload is missing a customer identifier.", 400);
  return id;
}

function idFromExpandableOptional(value: unknown): string | null {
  if (typeof value === "string") return value;
  const record = asRecord(value);
  return typeof record?.id === "string" ? record.id : null;
}

function unixTimestamp(value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000).toISOString()
    : null;
}

export class StripeConfigurationError extends Error {
  readonly code = "stripe_not_configured";
}

export class StripeSignatureError extends Error {
  readonly code = "stripe_signature_invalid";
}

export class StripeApiError extends Error {
  readonly code = "stripe_api_error";

  constructor(message: string, public readonly status: number) {
    super(message);
  }
}
