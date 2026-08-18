import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceAccountSnapshot } from "@/lib/accounts/repository";
import { createPairvuAuth } from "@/lib/auth/server";
import { getWorkspaceBillingRecord } from "@/lib/billing/repository";
import { createStripePortalSession, StripeApiError, StripeConfigurationError } from "@/lib/billing/stripe";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const env = getVisualQAEnv();
    const session = await createPairvuAuth(env).api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "authentication_required", message: "Sign in to manage billing." }, { status: 401 });
    }
    const account = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, {
      id: String(session.user.id),
      name: String(session.user.name ?? ""),
      email: String(session.user.email),
    });
    const billing = await getWorkspaceBillingRecord(env.VISUALQA_DB, account.workspaceId);
    if (!billing?.customerId) {
      return NextResponse.json({ error: "billing_account_missing", message: "No billing account is linked yet." }, { status: 400 });
    }
    const portal = await createStripePortalSession({
      env,
      customerId: billing.customerId,
      returnBaseUrl: (env.BETTER_AUTH_URL || "https://pairvu.com").replace(/\/$/, ""),
    });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return NextResponse.json({ error: error.code, message: "Billing is not available yet." }, { status: 503 });
    }
    if (error instanceof StripeApiError) {
      const normalized = error.message.toLowerCase();
      if (normalized.includes("no such customer") || normalized.includes("similar object exists in test mode")) {
        return NextResponse.json(
          {
            error: "billing_account_mismatch",
            message: "This subscription is linked to an earlier billing setup. Contact Pairvu support to reconnect billing without changing your saved results.",
          },
          { status: 409 },
        );
      }
      if (normalized.includes("portal") && (normalized.includes("configuration") || normalized.includes("configured"))) {
        return NextResponse.json(
          {
            error: "billing_portal_not_configured",
            message: "The secure billing portal is not enabled yet. Please try again after Pairvu finishes billing setup.",
          },
          { status: 503 },
        );
      }
      console.error("stripe_portal_api_failed", { status: error.status, message: error.message });
      return NextResponse.json(
        { error: error.code, message: "Stripe could not open billing management. Please try again shortly." },
        { status: 502 },
      );
    }
    console.error("stripe_portal_failed", error);
    return NextResponse.json({ error: "portal_failed", message: "Billing management could not be opened." }, { status: 500 });
  }
}
