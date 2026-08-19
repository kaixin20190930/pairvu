import { NextRequest, NextResponse } from "next/server";
import {
  beginStripeWebhookEvent,
  completeStripeWebhookEvent,
  failStripeWebhookEvent,
  syncStripeSubscription,
} from "@/lib/billing/repository";
import {
  checkPackPurchaseFromSession,
  isStripeWebhookModeAllowed,
  normalizeStripeSubscription,
  retrieveStripeSubscription,
  StripeSignatureError,
  subscriptionIdFromWebhookEvent,
  verifyStripeWebhook,
  type StripeWebhookEvent,
} from "@/lib/billing/stripe";
import { grantWorkspaceCreditPack } from "@/lib/credits/packs";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";

export const dynamic = "force-dynamic";

const DIRECT_SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);
const RETRIEVE_SUBSCRIPTION_EVENTS = new Set([
  "invoice.paid",
  "invoice.payment_failed",
]);
const CHECKOUT_SESSION_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
]);
const SUBSCRIPTION_EVENTS = new Set([
  ...DIRECT_SUBSCRIPTION_EVENTS,
  ...RETRIEVE_SUBSCRIPTION_EVENTS,
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

  if (!isStripeWebhookModeAllowed(env, event)) {
    return NextResponse.json(
      { error: "stripe_mode_invalid", message: "Test-mode Stripe events are not accepted by live billing." },
      { status: 400 },
    );
  }

  try {
    const shouldProcess = await beginStripeWebhookEvent(env.VISUALQA_DB, event);
    if (!shouldProcess) return NextResponse.json({ received: true, duplicate: true });

    if (CHECKOUT_SESSION_EVENTS.has(event.type)) {
      const purchase = checkPackPurchaseFromSession(event.data.object);
      if (purchase) {
        if (event.type !== "checkout.session.async_payment_failed" && purchase.paid) {
          await grantWorkspaceCreditPack({ db: env.VISUALQA_DB, ...purchase });
        }
      } else {
        const subscriptionId = subscriptionIdFromWebhookEvent(event);
        if (!subscriptionId) throw new Error(`${event.type} did not contain a subscription or check-pack purchase.`);
        const subscription = await retrieveStripeSubscription(env, subscriptionId);
        await syncStripeSubscription(env.VISUALQA_DB, normalizeStripeSubscription(env, subscription));
      }
    } else if (SUBSCRIPTION_EVENTS.has(event.type)) {
      const subscriptionId = subscriptionIdFromWebhookEvent(event);
      if (!subscriptionId) throw new Error(`${event.type} did not contain a subscription identifier.`);
      // Stripe does not guarantee webhook ordering. Always synchronize from the
      // current Subscription instead of applying a potentially stale event snapshot.
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
