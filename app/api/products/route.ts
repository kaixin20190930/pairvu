import { NextRequest, NextResponse } from "next/server";
import { isValidAnonymousSessionId } from "@/lib/assets/validation";
import { RequestAccessError, resolveRequestAccess } from "@/lib/auth/request-access";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { createSavedProduct, listSavedProducts, SavedProductError } from "@/lib/products/repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, undefined);
    if (!access.workspaceId) return authenticationRequired();
    return NextResponse.json({ products: await listSavedProducts(env.VISUALQA_DB, access.workspaceId) });
  } catch (error) {
    return productErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, undefined);
    if (!access.workspaceId) return authenticationRequired();
    const body = await request.json() as Record<string, unknown>;
    if (!isValidAnonymousSessionId(body.productId) || !isValidAnonymousSessionId(body.referenceAssetId)) {
      return NextResponse.json(
        { error: "invalid_product_request", message: "A valid productId and referenceAssetId are required." },
        { status: 400 },
      );
    }
    const created = await createSavedProduct(env.VISUALQA_DB, {
      productId: body.productId,
      workspaceId: access.workspaceId,
      name: typeof body.name === "string" ? body.name : "",
      skuLabel: typeof body.skuLabel === "string" ? body.skuLabel : null,
      referenceAssetId: body.referenceAssetId,
    });
    return NextResponse.json(created, { status: created.resumed ? 200 : 201 });
  } catch (error) {
    return productErrorResponse(error);
  }
}

function authenticationRequired() {
  return NextResponse.json({ error: "authentication_required", message: "Sign in to manage Saved Products." }, { status: 401 });
}

export function productErrorResponse(error: unknown) {
  if (error instanceof RequestAccessError) return authenticationRequired();
  if (error instanceof SavedProductError) {
    if (error.status >= 500) console.error("saved_product_request_failed", error);
    return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
  }
  console.error("saved_product_request_failed", error);
  return NextResponse.json({ error: "saved_product_failed", message: "The Saved Product request could not be completed." }, { status: 500 });
}
