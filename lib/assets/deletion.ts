import type { D1Database, R2Bucket } from "@/lib/cloudflare/bindings";
import { listExpiredAssets, type AssetMetadataRecord } from "./repository";

const DEFAULT_BATCH_SIZE = 100;

export interface RetentionDeletionSummary {
  scanned: number;
  deleted: number;
  failed: number;
  hasMore: boolean;
}

export interface ImmediateDeletionSummary {
  requested: number;
  deleted: number;
  failed: number;
}

export async function deleteAssetObjects(
  bucket: R2Bucket,
  asset: Pick<AssetMetadataRecord, "r2KeyOriginal" | "r2KeyNormalized" | "r2KeyThumbnail">,
) {
  const keys = assetObjectKeys(asset);
  if (keys.length > 0) {
    await bucket.delete(keys);
  }
}

export async function markAssetDeleted(db: D1Database, assetId: string, deletedAt = new Date()) {
  const result = await db
    .prepare("update assets set status = ?, deleted_at = ?, updated_at = ? where id = ?")
    .bind("deleted", deletedAt.toISOString(), deletedAt.toISOString(), assetId)
    .run();

  if (!result.success) {
    throw new Error(result.error ?? "Failed to mark asset deleted.");
  }
}

export async function deleteExpiredAssets(
  db: D1Database,
  bucket: R2Bucket,
  options: {
    now?: Date;
    batchSize?: number;
  } = {},
): Promise<RetentionDeletionSummary> {
  const now = options.now ?? new Date();
  const batchSize = Math.max(1, Math.min(Math.trunc(options.batchSize ?? DEFAULT_BATCH_SIZE), 500));
  const assets = await listExpiredAssets(db, now, batchSize);
  let deleted = 0;
  let failed = 0;

  for (const asset of assets) {
    const attemptId = crypto.randomUUID();
    const objectKeys = assetObjectKeys(asset);
    await recordDeletionAttempt(db, attemptId, asset.id, objectKeys, now);

    try {
      await deleteAssetObjects(bucket, asset);
      await markAssetDeleted(db, asset.id, now);
      await completeDeletionAttempt(db, attemptId, now);
      deleted += 1;
    } catch (error) {
      failed += 1;
      await failDeletionAttempt(db, attemptId, error, now);
    }
  }

  return {
    scanned: assets.length,
    deleted,
    failed,
    hasMore: assets.length === batchSize,
  };
}

export async function deleteAssetsImmediately(
  db: D1Database,
  bucket: R2Bucket,
  assets: AssetMetadataRecord[],
  now = new Date(),
): Promise<ImmediateDeletionSummary> {
  let deleted = 0;
  let failed = 0;

  for (const asset of assets) {
    const attemptId = crypto.randomUUID();
    await recordDeletionAttempt(db, attemptId, asset.id, assetObjectKeys(asset), now);
    try {
      await deleteAssetObjects(bucket, asset);
      await markAssetDeleted(db, asset.id, now);
      await completeDeletionAttempt(db, attemptId, now);
      deleted += 1;
    } catch (error) {
      failed += 1;
      await failDeletionAttempt(db, attemptId, error, now);
    }
  }

  return { requested: assets.length, deleted, failed };
}

// Compatibility alias for the existing retention verification and operations command.
export const deleteExpiredAnonymousAssets = deleteExpiredAssets;

function assetObjectKeys(
  asset: Pick<AssetMetadataRecord, "r2KeyOriginal" | "r2KeyNormalized" | "r2KeyThumbnail">,
): string[] {
  return [...new Set([asset.r2KeyOriginal, asset.r2KeyNormalized, asset.r2KeyThumbnail].filter(isObjectKey))];
}

function isObjectKey(value: string | null): value is string {
  return typeof value === "string" && value.length > 0;
}

async function recordDeletionAttempt(
  db: D1Database,
  attemptId: string,
  assetId: string,
  objectKeys: string[],
  attemptedAt: Date,
) {
  const timestamp = attemptedAt.toISOString();
  const result = await db
    .prepare(
      `insert into asset_deletion_attempts (
        id,
        asset_id,
        status,
        object_keys_json,
        attempted_at,
        created_at,
        updated_at
      ) values (?, ?, 'started', ?, ?, ?, ?)`,
    )
    .bind(attemptId, assetId, JSON.stringify(objectKeys), timestamp, timestamp, timestamp)
    .run();

  if (!result.success) {
    throw new Error(result.error ?? "Failed to record asset deletion attempt.");
  }
}

async function completeDeletionAttempt(db: D1Database, attemptId: string, completedAt: Date) {
  const timestamp = completedAt.toISOString();
  const result = await db
    .prepare(
      `update asset_deletion_attempts
       set status = 'completed', completed_at = ?, updated_at = ?
       where id = ?`,
    )
    .bind(timestamp, timestamp, attemptId)
    .run();

  if (!result.success) {
    throw new Error(result.error ?? "Failed to complete asset deletion attempt.");
  }
}

async function failDeletionAttempt(db: D1Database, attemptId: string, error: unknown, failedAt: Date) {
  const timestamp = failedAt.toISOString();
  const message = error instanceof Error ? error.message.slice(0, 1000) : "Unknown deletion failure";
  const result = await db
    .prepare(
      `update asset_deletion_attempts
       set status = 'failed', error_message = ?, completed_at = ?, updated_at = ?
       where id = ?`,
    )
    .bind(message, timestamp, timestamp, attemptId)
    .run();

  if (!result.success) {
    console.error("asset_deletion_audit_failed", {
      attemptId,
      message: result.error ?? "Failed to record deletion failure.",
    });
  }
}
