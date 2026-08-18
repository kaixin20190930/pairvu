import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceAccountSnapshot } from "@/lib/accounts/repository";
import { createPairvuAuth } from "@/lib/auth/server";
import { getWorkspaceBillingRecord } from "@/lib/billing/repository";
import { isLiveStripeBillingConfigured } from "@/lib/billing/access";
import { isPlanCode, type PlanCode } from "@/lib/billing/plans";
import {
  createStripeCheckoutSession,
  StripeApiError,
  StripeConfigurationError,
} from "@/lib/billing/stripe";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const env = getVisualQAEnv();
    const session = await createPairvuAuth(env).api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "authentication_required", message: "Sign in to choose a plan." }, { status: 401 });
    }
    if (!isLiveStripeBillingConfigured(env)) {
      return NextResponse.json(
        { error: "billing_not_configured", message: "Paid checkout is temporarily unavailable." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const planCode = typeof body?.planCode === "string" ? body.planCode : "";
    if (!isPaidPlan(planCode)) {
      return NextResponse.json({ error: "invalid_plan", message: "Choose a supported paid plan." }, { status: 400 });
    }

    const account = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, {
      id: String(session.user.id),
      name: String(session.user.name ?? ""),
      email: String(session.user.email),
    });
    const billing = await getWorkspaceBillingRecord(env.VISUALQA_DB, account.workspaceId);
    if (billing?.provider === "stripe" && billing.subscriptionId) {
      return NextResponse.json(
        { error: "subscription_exists", message: "Manage your existing subscription before choosing another plan." },
        { status: 409 },
      );
    }

    const checkout = await createStripeCheckoutSession({
      env,
      workspaceId: account.workspaceId,
      email: String(session.user.email),
      planCode,
      customerId: billing?.customerId,
      returnBaseUrl: publicBaseUrl(env.BETTER_AUTH_URL),
    });
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    return billingErrorResponse(error);
  }
}

function isPaidPlan(value: string): value is Exclude<PlanCode, "free"> {
  return isPlanCode(value) && value !== "free";
}

function publicBaseUrl(value: string | undefined): string {
  return (value || "https://pairvu.com").replace(/\/$/, "");
}

function billingErrorResponse(error: unknown) {
  if (error instanceof StripeConfigurationError) {
    return NextResponse.json({ error: error.code, message: "Billing is not available yet." }, { status: 503 });
  }
  if (error instanceof StripeApiError) {
    return NextResponse.json({ error: error.code, message: error.message }, { status: 502 });
  }
  console.error("stripe_checkout_failed", error);
  return NextResponse.json({ error: "checkout_failed", message: "Checkout could not be started. Please try again." }, { status: 500 });
}
