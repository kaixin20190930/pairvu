import { ANONYMOUS_ASSET_RETENTION_HOURS } from "@/lib/config/product";
import type { R2Bucket } from "@/lib/cloudflare/bindings";
import { sha256Hex } from "./checksum";
import type { AssetUploadInput, StoredAsset } from "./types";
import { validateAnonymousSession, validateM0ImageContent, validateM0ImageFile } from "./validation";

export async function storeUploadedAsset(bucket: R2Bucket, input: AssetUploadInput): Promise<StoredAsset> {
  validateM0ImageFile(input.file);

  if (!input.workspaceId) {
    validateAnonymousSession(input.anonymousSessionId);
  }

  const assetId = crypto.randomUUID();
  const createdAt = new Date();
  const buffer = await input.file.arrayBuffer();
  await validateM0ImageContent(buffer, input.file.type);
  const sha256 = await sha256Hex(buffer);
  const retentionExpiresAt = input.workspaceId
    ? undefined
    : new Date(createdAt.getTime() + ANONYMOUS_ASSET_RETENTION_HOURS * 60 * 60 * 1000).toISOString();
  const r2KeyOriginal = buildOriginalAssetKey({
    assetId,
    kind: input.kind,
    workspaceId: input.workspaceId,
    anonymousSessionId: input.anonymousSessionId,
  });

  await bucket.put(r2KeyOriginal, buffer, {
    httpMetadata: {
      contentType: input.file.type,
      cacheControl: "private, max-age=0",
    },
    customMetadata: {
      assetId,
      kind: input.kind,
      sha256,
      retentionExpiresAt: retentionExpiresAt ?? "",
    },
  });

  return {
    id: assetId,
    workspaceId: input.workspaceId,
    anonymousSessionId: input.anonymousSessionId,
    kind: input.kind,
    assetType: "image",
    mimeType: input.file.type,
    fileSizeBytes: input.file.size,
    sha256,
    r2KeyOriginal,
    status: "uploaded",
    retentionExpiresAt,
    createdAt: createdAt.toISOString(),
  };
}

function buildOriginalAssetKey(input: {
  assetId: string;
  kind: "reference" | "candidate";
  workspaceId?: string;
  anonymousSessionId?: string;
}) {
  if (input.workspaceId) {
    return `workspaces/${input.workspaceId}/m0/uploads/${input.kind}/${input.assetId}/original`;
  }

  return `anonymous/${input.anonymousSessionId}/${input.kind}/${input.assetId}/original`;
}
