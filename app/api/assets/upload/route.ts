import { NextRequest, NextResponse } from "next/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { insertAssetMetadata } from "@/lib/assets/repository";
import { storeUploadedAsset } from "@/lib/assets/storage";
import type { AssetKind } from "@/lib/assets/types";
import { AssetValidationError } from "@/lib/assets/validation";
import {
  enforceAuthenticatedUploadGuard,
  enforcePublicUploadGuard,
  PublicBetaAccessError,
} from "@/lib/public-beta/guards";
import { RequestAccessError, resolveRequestAccess } from "@/lib/auth/request-access";

export const dynamic = "force-dynamic";

const UPLOAD_KINDS = new Set<AssetKind>(["reference", "candidate"]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = formData.get("kind");
    const anonymousSessionId = formData.get("anonymousSessionId");
    const turnstileToken = formData.get("turnstileToken");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (typeof kind !== "string" || !UPLOAD_KINDS.has(kind as AssetKind)) {
      return NextResponse.json({ error: "kind must be reference or candidate" }, { status: 400 });
    }

    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, anonymousSessionId);
    if (access.workspaceId) {
      await enforceAuthenticatedUploadGuard(env.VISUALQA_DB, env, {
        workspaceId: access.workspaceId,
      });
    } else {
      await enforcePublicUploadGuard(env.VISUALQA_DB, env, {
        anonymousSessionId: access.anonymousSessionId!,
        turnstileToken: typeof turnstileToken === "string" ? turnstileToken : undefined,
        clientIp: request.headers.get("cf-connecting-ip"),
      });
    }
    const asset = await storeUploadedAsset(env.VISUALQA_ASSETS, {
      file,
      kind: kind as "reference" | "candidate",
      workspaceId: access.workspaceId ?? undefined,
      anonymousSessionId: access.workspaceId ? undefined : access.anonymousSessionId ?? undefined,
      retentionDays: access.retentionDays ?? undefined,
    });

    await insertAssetMetadata(env.VISUALQA_DB, asset);

    return NextResponse.json(
      {
        asset: {
          id: asset.id,
          kind: asset.kind,
          mimeType: asset.mimeType,
          fileSizeBytes: asset.fileSizeBytes,
          sha256: asset.sha256,
          status: asset.status,
          retentionExpiresAt: asset.retentionExpiresAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof RequestAccessError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 400 });
    }

    if (error instanceof PublicBetaAccessError) {
      const headers = retryAfterHeaders(error.retryAfterSeconds);
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
          retryAfterSeconds: error.retryAfterSeconds ?? null,
        },
        headers ? { status: error.status, headers } : { status: error.status },
      );
    }

    if (error instanceof AssetValidationError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 400 });
    }

    console.error("asset_upload_failed", error);
    return NextResponse.json({ error: "asset_upload_failed" }, { status: 500 });
  }
}

function retryAfterHeaders(retryAfterSeconds?: number) {
  if (!retryAfterSeconds) return undefined;
  return {
    "Retry-After": String(retryAfterSeconds),
  };
}
