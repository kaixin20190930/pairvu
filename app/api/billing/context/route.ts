import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceAccountSnapshot } from "@/lib/accounts/repository";
import { createPairvuAuth } from "@/lib/auth/server";
import { areLiveStripeCheckPacksConfigured, isLiveStripeBillingConfigured } from "@/lib/billing/access";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const env = getVisualQAEnv();
  const session = await createPairvuAuth(env).api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
  }
  const account = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, {
    id: String(session.user.id),
    name: String(session.user.name ?? ""),
    email: String(session.user.email),
  });
  return NextResponse.json({
    authenticated: true,
    planCode: account.planCode,
    billingManaged: account.billingManaged,
    subscriptionStatus: account.subscriptionStatus,
    cancelAtPeriodEnd: account.cancelAtPeriodEnd,
    periodEndsAt: account.periodEndsAt,
    available: account.available,
    billingEnabled: isLiveStripeBillingConfigured(env),
    packsEnabled: areLiveStripeCheckPacksConfigured(env),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
