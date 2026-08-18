import { NextRequest, NextResponse } from "next/server";
import {
  beginStripeWebhookEvent,
  completeStripeWebhookEvent,
  failStripeWebhookEvent,
  syncStripeSubscription,
} from "@/lib/billing/repository";
import {
  normalizeStripeSubscription,
  retrieveStripeSubscription,
  StripeSignatureError,
  subscriptionIdFromEventObject,
  verifyStripeWebhook,
  type StripeWebhookEvent,
} from "@/lib/billing/stripe";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";

export const dynamic = "force-dynamic";

const DIRECT_SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);
const RETRIEVE_SUBSCRIPTION_EVENTS = new Set([
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
]);

export async function POST(request: NextRequest) {
  const env = getVisualQAEnv();
  const payload = await request.text();
  let event: StripeWebhookEvent;
  try {
    event = await verifyStripeWebhook(payload, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const message = error instanceof StripeSignatureError ? error.message : "Stripe webhook verification failed.";
    return NextResponse.json({ error: "stripe_signature_invalid", message }, { status: 400 });
  }

  try {
    const shouldProcess = await beginStripeWebhookEvent(env.VISUALQA_DB, event);
    if (!shouldProcess) return NextResponse.json({ received: true, duplicate: true });

    if (DIRECT_SUBSCRIPTION_EVENTS.has(event.type)) {
      await syncStripeSubscription(env.VISUALQA_DB, normalizeStripeSubscription(env, event.data.object));
    } else if (RETRIEVE_SUBSCRIPTION_EVENTS.has(event.type)) {
      const subscriptionId = subscriptionIdFromEventObject(event.data.object);
      if (!subscriptionId) throw new Error(`${event.type} did not contain a subscription identifier.`);
      const subscription = await retrieveStripeSubscription(env, subscriptionId);
      await syncStripeSubscription(env.VISUALQA_DB, normalizeStripeSubscription(env, subscription));
    }

    await completeStripeWebhookEvent(env.VISUALQA_DB, event.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    await failStripeWebhookEvent(env.VISUALQA_DB, event.id, error).catch((journalError) => {
      console.error("stripe_webhook_journal_failed", journalError);
    });
    console.error("stripe_webhook_failed", event.id, event.type, error);
    return NextResponse.json({ error: "stripe_webhook_failed", message: "Webhook processing failed." }, { status: 500 });
  }
}
