import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceAccountSnapshot } from "@/lib/accounts/repository";
import { createPairvuAuth } from "@/lib/auth/server";
import { areLiveStripeCheckPacksConfigured } from "@/lib/billing/access";
import { isCheckPackCode } from "@/lib/billing/packs";
import { getWorkspaceBillingRecord } from "@/lib/billing/repository";
import { createStripePackCheckoutSession, StripeApiError, StripeConfigurationError } from "@/lib/billing/stripe";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const env = getVisualQAEnv();
    const session = await createPairvuAuth(env).api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "authentication_required", message: "Sign in to buy a check pack." }, { status: 401 });
    }
    if (!areLiveStripeCheckPacksConfigured(env)) {
      return NextResponse.json({ error: "packs_not_configured", message: "Check packs are temporarily unavailable." }, { status: 503 });
    }
    const body = await request.json();
    const packCode = typeof body?.packCode === "string" ? body.packCode : "";
    if (!isCheckPackCode(packCode)) {
      return NextResponse.json({ error: "invalid_pack", message: "Choose a supported check pack." }, { status: 400 });
    }

    const account = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, {
      id: String(session.user.id),
      name: String(session.user.name ?? ""),
      email: String(session.user.email),
    });
    if (account.subscriptionStatus === "past_due" || account.subscriptionStatus === "incomplete") {
      return NextResponse.json({ error: "billing_attention_required", message: "Resolve the current billing issue before buying extra checks." }, { status: 409 });
    }
    const billing = await getWorkspaceBillingRecord(env.VISUALQA_DB, account.workspaceId);
    const checkout = await createStripePackCheckoutSession({
      env,
      workspaceId: account.workspaceId,
      email: String(session.user.email),
      packCode,
      customerId: billing?.customerId,
      returnBaseUrl: (env.BETTER_AUTH_URL || "https://pairvu.com").replace(/\/$/, ""),
    });
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return NextResponse.json({ error: error.code, message: "Check packs are not available yet." }, { status: 503 });
    }
    if (error instanceof StripeApiError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 502 });
    }
    console.error("stripe_pack_checkout_failed", error);
    return NextResponse.json({ error: "pack_checkout_failed", message: "Check-pack checkout could not be started." }, { status: 500 });
  }
}
