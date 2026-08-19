import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceAccountSnapshot } from "@/lib/accounts/repository";
import { createPairvuAuth } from "@/lib/auth/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { getWorkspaceCreditPackPurchase } from "@/lib/credits/packs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const env = getVisualQAEnv();
  const session = await createPairvuAuth(env).api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }

  const checkoutSessionId = request.nextUrl.searchParams.get("session_id") ?? "";
  if (!/^cs_(?:live|test)_[A-Za-z0-9]+$/.test(checkoutSessionId)) {
    return NextResponse.json({ error: "invalid_checkout_session" }, { status: 400 });
  }

  const account = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, {
    id: String(session.user.id),
    name: String(session.user.name ?? ""),
    email: String(session.user.email),
  });
  const purchase = await getWorkspaceCreditPackPurchase(
    env.VISUALQA_DB,
    account.workspaceId,
    checkoutSessionId,
  );

  if (!purchase) {
    return NextResponse.json(
      { state: "pending" },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  // The webhook may commit the credit lot between the first account read and the
  // purchase lookup. Re-read the balance before returning a fulfilled state so
  // the confirmation never displays a stale allowance.
  const refreshedAccount = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, {
    id: String(session.user.id),
    name: String(session.user.name ?? ""),
    email: String(session.user.email),
  });

  return NextResponse.json({
    state: "fulfilled",
    creditsAdded: purchase.granted,
    packAvailable: refreshedAccount.packAvailable,
    totalAvailable: refreshedAccount.available,
    expiresAt: purchase.expiresAt,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
