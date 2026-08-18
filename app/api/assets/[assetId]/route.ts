import { NextRequest, NextResponse } from "next/server";
import { getAssetMetadataById } from "@/lib/assets/repository";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { canAccessOwnedResource, RequestAccessError, resolveRequestAccess } from "@/lib/auth/request-access";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await context.params;
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, request.headers.get("x-anonymous-session-id"));
    const asset = await getAssetMetadataById(env.VISUALQA_DB, assetId);

    if (!asset || !canAccessOwnedResource(access, asset)) {
      return assetError("asset_not_found", "This saved image is not available to this account.", 404);
    }

    if (asset.status === "deleted") {
      return assetError("asset_deleted", "This saved image was deleted.", 410);
    }

    if (asset.status === "failed") {
      return assetError("asset_unavailable", "This image was not stored successfully.", 409);
    }

    if (isExpired(asset.retentionExpiresAt)) {
      return assetError("asset_expired", "This saved image reached the end of its retention period.", 410);
    }

    const object = await env.VISUALQA_ASSETS.get(asset.r2KeyOriginal);
    if (!object) {
      return assetError("asset_binary_missing", "The saved image could not be read from storage.", 503);
    }

    return new Response(await object.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(object.size),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof RequestAccessError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 400 });
    }
    throw error;
  }
}

function assetError(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status });
}

function isExpired(retentionExpiresAt: string | null) {
  if (!retentionExpiresAt) return true;
  const expiresAt = Date.parse(retentionExpiresAt);
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
}
