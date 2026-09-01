import { NextRequest, NextResponse } from "next/server";
import { isValidAnonymousSessionId } from "@/lib/assets/validation";
import { RequestAccessError, resolveRequestAccess } from "@/lib/auth/request-access";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { getSavedProductById, SavedProductError } from "@/lib/products/repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ productId: string }> }) {
  try {
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, undefined);
    if (!access.workspaceId) return authenticationRequired();
    const { productId } = await context.params;
    if (!isValidAnonymousSessionId(productId)) {
      return NextResponse.json({ error: "invalid_product_id", message: "A valid productId is required." }, { status: 400 });
    }
    const product = await getSavedProductById(env.VISUALQA_DB, productId, access.workspaceId);
    if (!product) return NextResponse.json({ error: "product_not_found", message: "Saved Product not found." }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof RequestAccessError) return authenticationRequired();
    if (error instanceof SavedProductError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    }
    console.error("saved_product_read_failed", error);
    return NextResponse.json({ error: "saved_product_failed", message: "The Saved Product could not be loaded." }, { status: 500 });
  }
}

function authenticationRequired() {
  return NextResponse.json({ error: "authentication_required", message: "Sign in to view Saved Products." }, { status: 401 });
}
