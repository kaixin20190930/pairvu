import { NextRequest, NextResponse } from "next/server";
import { isValidAnonymousSessionId } from "@/lib/assets/validation";
import { RequestAccessError, resolveRequestAccess } from "@/lib/auth/request-access";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { promoteSavedProductReference, SavedProductError } from "@/lib/products/repository";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ productId: string }> }) {
  try {
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, undefined);
    if (!access.workspaceId) return authenticationRequired();
    const { productId } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    if (!isValidAnonymousSessionId(productId) || !isValidAnonymousSessionId(body.referenceAssetId)) {
      return NextResponse.json(
        { error: "invalid_reference_request", message: "A valid productId and referenceAssetId are required." },
        { status: 400 },
      );
    }
    const promoted = await promoteSavedProductReference(env.VISUALQA_DB, {
      productId,
      workspaceId: access.workspaceId,
      referenceAssetId: body.referenceAssetId,
    });
    return NextResponse.json(promoted, { status: promoted.resumed ? 200 : 201 });
  } catch (error) {
    if (error instanceof RequestAccessError) return authenticationRequired();
    if (error instanceof SavedProductError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    }
    console.error("saved_product_reference_promotion_failed", error);
    return NextResponse.json({ error: "reference_promotion_failed", message: "The new reference could not be promoted." }, { status: 500 });
  }
}

function authenticationRequired() {
  return NextResponse.json({ error: "authentication_required", message: "Sign in to update Saved Products." }, { status: 401 });
}
