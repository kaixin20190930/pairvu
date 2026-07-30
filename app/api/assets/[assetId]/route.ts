import { NextRequest, NextResponse } from "next/server";
import { getAssetMetadataById } from "@/lib/assets/repository";
import { isValidAnonymousSessionId } from "@/lib/assets/validation";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ assetId: string }> }) {
  const anonymousSessionId = request.headers.get("x-anonymous-session-id");
  if (!isValidAnonymousSessionId(anonymousSessionId)) {
    return NextResponse.json({ error: "anonymous_session_required" }, { status: 400 });
  }

  const { assetId } = await context.params;
  const env = getVisualQAEnv();
  const asset = await getAssetMetadataById(env.VISUALQA_DB, assetId);

  if (
    !asset ||
    asset.workspaceId !== null ||
    asset.anonymousSessionId !== anonymousSessionId ||
    asset.status === "deleted" ||
    asset.status === "failed" ||
    isExpired(asset.retentionExpiresAt)
  ) {
    return NextResponse.json({ error: "asset_not_found" }, { status: 404 });
  }

  const object = await env.VISUALQA_ASSETS.get(asset.r2KeyOriginal);
  if (!object) {
    return NextResponse.json({ error: "asset_not_found" }, { status: 404 });
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
}

function isExpired(retentionExpiresAt: string | null) {
  if (!retentionExpiresAt) return true;
  const expiresAt = Date.parse(retentionExpiresAt);
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
}
