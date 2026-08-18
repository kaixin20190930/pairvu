import type { D1Database } from "@/lib/cloudflare/bindings";
import type { StoredAsset } from "./types";

export interface AssetMetadataRecord {
  id: string;
  originalFileName: string | null;
  workspaceId: string | null;
  anonymousSessionId: string | null;
  kind: StoredAsset["kind"];
  assetType: StoredAsset["assetType"];
  mimeType: string;
  fileSizeBytes: number;
  sha256: string;
  r2KeyOriginal: string;
  r2KeyNormalized: string | null;
  r2KeyThumbnail: string | null;
  status: StoredAsset["status"];
  retentionExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function insertAssetMetadata(db: D1Database, asset: StoredAsset): Promise<void> {
  const result = await db
    .prepare(
      `insert into assets (
        id,
        original_file_name,
        workspace_id,
        anonymous_session_id,
        kind,
        asset_type,
        mime_type,
        file_size_bytes,
        sha256,
        r2_key_original,
        status,
        retention_expires_at,
        created_at,
        updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      asset.id,
      asset.originalFileName ?? null,
      asset.workspaceId ?? null,
      asset.anonymousSessionId ?? null,
      asset.kind,
      asset.assetType,
      asset.mimeType,
      asset.fileSizeBytes,
      asset.sha256,
      asset.r2KeyOriginal,
      asset.status,
      asset.retentionExpiresAt ?? null,
      asset.createdAt,
      asset.createdAt,
    )
    .run();

  if (!result.success) {
    throw new Error(result.error ?? "Failed to insert asset metadata.");
  }
}

export async function getAssetMetadataById(db: D1Database, assetId: string): Promise<AssetMetadataRecord | null> {
  const row = await db
    .prepare(
      `select
        id,
        original_file_name as originalFileName,
        workspace_id as workspaceId,
        anonymous_session_id as anonymousSessionId,
        kind,
        asset_type as assetType,
        mime_type as mimeType,
        file_size_bytes as fileSizeBytes,
        sha256,
        r2_key_original as r2KeyOriginal,
        r2_key_normalized as r2KeyNormalized,
        r2_key_thumbnail as r2KeyThumbnail,
        status,
        retention_expires_at as retentionExpiresAt,
        created_at as createdAt,
        updated_at as updatedAt
      from assets
      where id = ?
      limit 1`,
    )
    .bind(assetId)
    .first<Record<string, unknown>>();

  if (!row) {
    return null;
  }

  return mapAssetMetadata(row);
}

export async function listWorkspaceAssets(db: D1Database, workspaceId: string): Promise<AssetMetadataRecord[]> {
  return listOwnedAssets(db, "a.workspace_id = ?", workspaceId);
}

export async function listAnalysisAssets(
  db: D1Database,
  analysisId: string,
  workspaceId: string,
): Promise<AssetMetadataRecord[]> {
  return listOwnedAssets(
    db,
    `a.workspace_id = ? and a.id in (
      select reference_asset_id from analyses where id = ? and workspace_id = ?
      union
      select candidate_asset_id from analyses where id = ? and workspace_id = ?
    )`,
    workspaceId,
    analysisId,
    workspaceId,
    analysisId,
    workspaceId,
  );
}

export async function listBatchAssets(
  db: D1Database,
  batchId: string,
  workspaceId: string,
): Promise<AssetMetadataRecord[]> {
  return listOwnedAssets(
    db,
    `a.workspace_id = ? and a.id in (
      select reference_asset_id from batch_items where batch_id = ? and workspace_id = ?
      union
      select candidate_asset_id from batch_items where batch_id = ? and workspace_id = ?
    )`,
    workspaceId,
    batchId,
    workspaceId,
    batchId,
    workspaceId,
  );
}

export async function listExpiredAssets(
  db: D1Database,
  expiresBefore: Date,
  limit = 100,
): Promise<AssetMetadataRecord[]> {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 500));
  const result = await db
    .prepare(
      `select
        id,
        original_file_name as originalFileName,
        workspace_id as workspaceId,
        anonymous_session_id as anonymousSessionId,
        kind,
        asset_type as assetType,
        mime_type as mimeType,
        file_size_bytes as fileSizeBytes,
        sha256,
        r2_key_original as r2KeyOriginal,
        r2_key_normalized as r2KeyNormalized,
        r2_key_thumbnail as r2KeyThumbnail,
        status,
        retention_expires_at as retentionExpiresAt,
        created_at as createdAt,
        updated_at as updatedAt
      from assets
      where retention_expires_at is not null
        and retention_expires_at <= ?
        and status <> 'deleted'
      order by retention_expires_at asc
      limit ?`,
    )
    .bind(expiresBefore.toISOString(), safeLimit)
    .all<Record<string, unknown>>();

  if (!result.success) {
    throw new Error(result.error ?? "Failed to list expired anonymous assets.");
  }

  return result.results.map(mapAssetMetadata);
}

async function listOwnedAssets(
  db: D1Database,
  predicate: string,
  ...values: unknown[]
): Promise<AssetMetadataRecord[]> {
  const result = await db
    .prepare(
      `select
        a.id,
        a.original_file_name as originalFileName,
        a.workspace_id as workspaceId,
        a.anonymous_session_id as anonymousSessionId,
        a.kind,
        a.asset_type as assetType,
        a.mime_type as mimeType,
        a.file_size_bytes as fileSizeBytes,
        a.sha256,
        a.r2_key_original as r2KeyOriginal,
        a.r2_key_normalized as r2KeyNormalized,
        a.r2_key_thumbnail as r2KeyThumbnail,
        a.status,
        a.retention_expires_at as retentionExpiresAt,
        a.created_at as createdAt,
        a.updated_at as updatedAt
      from assets a
      where ${predicate}
        and a.status <> 'deleted'
      order by a.created_at asc`,
    )
    .bind(...values)
    .all<Record<string, unknown>>();

  if (!result.success) {
    throw new Error(result.error ?? "Failed to list workspace assets.");
  }

  return result.results.map(mapAssetMetadata);
}

function mapAssetMetadata(row: Record<string, unknown>): AssetMetadataRecord {
  return {
    id: String(row.id),
    originalFileName: (row.originalFileName as string | null) ?? null,
    workspaceId: (row.workspaceId as string | null) ?? null,
    anonymousSessionId: (row.anonymousSessionId as string | null) ?? null,
    kind: row.kind as AssetMetadataRecord["kind"],
    assetType: row.assetType as AssetMetadataRecord["assetType"],
    mimeType: String(row.mimeType ?? ""),
    fileSizeBytes: Number(row.fileSizeBytes ?? 0),
    sha256: String(row.sha256 ?? ""),
    r2KeyOriginal: String(row.r2KeyOriginal ?? ""),
    r2KeyNormalized: (row.r2KeyNormalized as string | null) ?? null,
    r2KeyThumbnail: (row.r2KeyThumbnail as string | null) ?? null,
    status: row.status as AssetMetadataRecord["status"],
    retentionExpiresAt: (row.retentionExpiresAt as string | null) ?? null,
    createdAt: String(row.createdAt ?? ""),
    updatedAt: String(row.updatedAt ?? ""),
  };
}
