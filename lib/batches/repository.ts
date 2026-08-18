import type { D1Database } from "@/lib/cloudflare/bindings";
import type {
  CreateBatchInput,
  PersistedBatch,
  PersistedBatchItem,
  PersistedBatchWithItems,
  BatchHistoryItem,
  RetainedBatchReference,
} from "@/lib/batches/types";
import {
  BatchValidationError,
  fingerprintBatchMapping,
  validateAndNormalizeBatchMapping,
} from "@/lib/batches/validation";

export class BatchIdempotencyConflictError extends Error {
  readonly code = "batch_idempotency_conflict";
  constructor() {
    super("This batch request key is already associated with a different image mapping.");
    this.name = "BatchIdempotencyConflictError";
  }
}

export class ActiveBatchExistsError extends Error {
  readonly code = "active_batch_exists";
  constructor() {
    super("This workspace already has an active batch.");
    this.name = "ActiveBatchExistsError";
  }
}

export async function createBatch(
  db: D1Database,
  input: CreateBatchInput,
): Promise<{ batch: PersistedBatchWithItems; resumed: boolean }> {
  const items = validateAndNormalizeBatchMapping(input);
  const fingerprint = await fingerprintBatchMapping(input.mappingMode, items);
  const existing = await getBatchByIdempotencyKey(db, input.workspaceId, input.idempotencyKey);
  if (existing) {
    if (existing.requestFingerprint !== fingerprint) throw new BatchIdempotencyConflictError();
    return { batch: existing, resumed: true };
  }

  const active = await getActiveBatchForWorkspace(db, input.workspaceId);
  if (active) throw new ActiveBatchExistsError();

  const assetRetentionExpiresAt = await assertAssetsBelongToWorkspace(db, input.workspaceId, items);

  const timestamp = (input.now ?? new Date()).toISOString();
  const statements = [
    db
      .prepare(
        `insert into batches (
          id, workspace_id, mapping_mode, status, idempotency_key, request_fingerprint,
          item_count, completed_item_count, failed_item_count, asset_retention_expires_at,
          created_at, updated_at
        ) values (?, ?, ?, 'queued', ?, ?, ?, 0, 0, ?, ?, ?)`,
      )
      .bind(
        input.batchId,
        input.workspaceId,
        input.mappingMode,
        input.idempotencyKey,
        fingerprint,
        items.length,
        assetRetentionExpiresAt,
        timestamp,
        timestamp,
      ),
    ...items.map((item, position) =>
      db
        .prepare(
          `insert into batch_items (
            id, batch_id, workspace_id, position, reference_asset_id, candidate_asset_id,
            client_label, status, attempt_count, created_at, updated_at
          ) values (?, ?, ?, ?, ?, ?, ?, 'queued', 0, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          input.batchId,
          input.workspaceId,
          position,
          item.referenceAssetId,
          item.candidateAssetId,
          item.clientLabel,
          timestamp,
          timestamp,
        ),
    ),
  ];

  const results = await db.batch<{ success?: boolean; error?: string }>(statements);
  const failed = results.find((result) => result && result.success === false);
  if (failed) {
    if (String(failed.error).includes("idx_batches_one_active_per_workspace")) {
      throw new ActiveBatchExistsError();
    }
    throw new Error(`Batch persistence failed: ${failed.error ?? "unknown D1 error"}`);
  }

  const created = await getBatchById(db, input.batchId, input.workspaceId);
  if (!created) throw new Error("Batch was created but could not be reloaded.");
  return { batch: created, resumed: false };
}

export async function getBatchById(
  db: D1Database,
  batchId: string,
  workspaceId: string,
): Promise<PersistedBatchWithItems | null> {
  const batch = await db.prepare(batchSelect("id = ? and workspace_id = ?")).bind(batchId, workspaceId).first<PersistedBatch>();
  if (!batch) return null;
  return { ...batch, items: await listBatchItems(db, batch.id, workspaceId) };
}

export async function listWorkspaceBatches(
  db: D1Database,
  workspaceId: string,
  limit = 25,
): Promise<BatchHistoryItem[]> {
  const rows = await db.prepare(
    `select b.id, b.workspace_id as workspaceId, b.mapping_mode as mappingMode, b.status,
      b.idempotency_key as idempotencyKey, b.request_fingerprint as requestFingerprint,
      b.item_count as itemCount, b.completed_item_count as completedItemCount,
      b.failed_item_count as failedItemCount, b.asset_retention_expires_at as assetRetentionExpiresAt,
      b.created_at as createdAt, b.updated_at as updatedAt, b.started_at as startedAt,
      b.completed_at as completedAt,
      (select count(*) from batch_items bi join analyses a on a.id = bi.analysis_id
        where bi.batch_id = b.id and lower(a.verdict) = 'pass') as passCount,
      (select count(*) from batch_items bi join analyses a on a.id = bi.analysis_id
        where bi.batch_id = b.id and lower(a.verdict) = 'review') as reviewCount,
      (select count(*) from batch_items bi join analyses a on a.id = bi.analysis_id
        where bi.batch_id = b.id and lower(a.verdict) = 'fail') as failCount
     from batches b where b.workspace_id = ? order by b.created_at desc limit ?`,
  ).bind(workspaceId, Math.min(100, Math.max(1, limit))).all<BatchHistoryItem>();
  return rows.results.map((row) => ({
    ...row,
    itemCount: Number(row.itemCount),
    completedItemCount: Number(row.completedItemCount),
    failedItemCount: Number(row.failedItemCount),
    passCount: Number(row.passCount),
    reviewCount: Number(row.reviewCount),
    failCount: Number(row.failCount),
  }));
}

export async function listRetainedBatchReferences(
  db: D1Database,
  workspaceId: string,
  now = new Date(),
): Promise<RetainedBatchReference[]> {
  const rows = await db.prepare(
    `select bi.reference_asset_id as assetId, max(b.created_at) as lastUsedAt,
      a.retention_expires_at as retentionExpiresAt,
      coalesce(nullif(a.original_file_name, ''), 'Reference from ' || substr(max(b.created_at), 1, 10)) as label
     from batch_items bi
     join batches b on b.id = bi.batch_id
     join assets a on a.id = bi.reference_asset_id
     where bi.workspace_id = ? and a.status != 'deleted' and a.retention_expires_at > ?
     group by bi.reference_asset_id, a.retention_expires_at, a.original_file_name
     order by lastUsedAt desc limit 10`,
  ).bind(workspaceId, now.toISOString()).all<Omit<RetainedBatchReference, "previewUrl">>();
  return rows.results.map((row) => ({ ...row, previewUrl: `/api/assets/${row.assetId}` }));
}

export async function getBatchByIdempotencyKey(
  db: D1Database,
  workspaceId: string,
  idempotencyKey: string,
): Promise<PersistedBatchWithItems | null> {
  const batch = await db
    .prepare(batchSelect("workspace_id = ? and idempotency_key = ?"))
    .bind(workspaceId, idempotencyKey)
    .first<PersistedBatch>();
  if (!batch) return null;
  return { ...batch, items: await listBatchItems(db, batch.id, workspaceId) };
}

export async function markBatchFailedBeforeExecution(
  db: D1Database,
  batchId: string,
  workspaceId: string,
  errorCode: string,
  errorMessage: string,
) {
  const timestamp = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `update batch_items set status = 'failed', terminal_error_code = ?, terminal_error_message = ?,
          completed_at = ?, updated_at = ? where batch_id = ? and workspace_id = ? and status = 'queued'`,
      )
      .bind(errorCode, errorMessage, timestamp, timestamp, batchId, workspaceId),
    db
      .prepare(
        `update batches set status = 'failed', failed_item_count = item_count,
          completed_at = ?, updated_at = ? where id = ? and workspace_id = ? and status = 'queued'`,
      )
      .bind(timestamp, timestamp, batchId, workspaceId),
  ]);
}

export async function cancelQueuedBatchItems(
  db: D1Database,
  batchId: string,
  workspaceId: string,
  now = new Date(),
) {
  const batch = await getBatchById(db, batchId, workspaceId);
  if (!batch) return null;
  if (!['queued', 'processing'].includes(batch.status)) return { batch, canceledItemIds: [] as string[] };

  const timestamp = now.toISOString();
  await db
    .prepare(
      `update batch_items set status = 'canceled', completed_at = ?, updated_at = ?
       where batch_id = ? and workspace_id = ? and status = 'queued'`,
    )
    .bind(timestamp, timestamp, batchId, workspaceId)
    .run();
  const canceled = await db
    .prepare(
      `select id from batch_items
       where batch_id = ? and workspace_id = ? and status = 'canceled' and updated_at = ?`,
    )
    .bind(batchId, workspaceId, timestamp)
    .all<{ id: string }>();
  const active = await db
    .prepare(
      `select count(*) as count from batch_items
       where batch_id = ? and workspace_id = ? and status = 'processing'`,
    )
    .bind(batchId, workspaceId)
    .first<{ count: number }>();
  await db
    .prepare(
      `update batches set status = ?, completed_at = case when ? = 0 then ? else completed_at end,
        updated_at = ? where id = ? and workspace_id = ?`,
    )
    .bind(Number(active?.count ?? 0) > 0 ? 'processing' : 'canceled', Number(active?.count ?? 0), timestamp, timestamp, batchId, workspaceId)
    .run();
  return {
    batch: await getBatchById(db, batchId, workspaceId),
    canceledItemIds: canceled.results.map((item) => item.id),
  };
}

export async function requeueFailedBatchItem(
  db: D1Database,
  batchId: string,
  batchItemId: string,
  workspaceId: string,
  now = new Date(),
) {
  const item = await db
    .prepare(
      `select id, attempt_count as attemptCount from batch_items
       where id = ? and batch_id = ? and workspace_id = ? and status = 'failed' limit 1`,
    )
    .bind(batchItemId, batchId, workspaceId)
    .first<{ id: string; attemptCount: number }>();
  if (!item) return null;
  const active = await getActiveBatchForWorkspace(db, workspaceId);
  if (active && active.id !== batchId) throw new ActiveBatchExistsError();
  const timestamp = now.toISOString();
  const result = await db
    .prepare(
      `update batch_items set status = 'queued', terminal_error_code = null,
        terminal_error_message = null, completed_at = null, updated_at = ?
       where id = ? and batch_id = ? and workspace_id = ? and status = 'failed'`,
    )
    .bind(timestamp, batchItemId, batchId, workspaceId)
    .run();
  if (!result.success) throw new Error(result.error ?? 'Unable to retry the failed batch item.');
  await db
    .prepare(
      `update batches set status = 'processing', failed_item_count = case when failed_item_count > 0 then failed_item_count - 1 else 0 end,
        completed_at = null, updated_at = ? where id = ? and workspace_id = ?`,
    )
    .bind(timestamp, batchId, workspaceId)
    .run();
  return { itemId: item.id };
}

export async function restoreFailedBatchItem(
  db: D1Database,
  batchId: string,
  batchItemId: string,
  workspaceId: string,
  errorMessage: string,
  now = new Date(),
) {
  const timestamp = now.toISOString();
  await db.batch([
    db.prepare(
      `update batch_items set status = 'failed', terminal_error_code = 'batch_retry_enqueue_failed',
        terminal_error_message = ?, completed_at = ?, updated_at = ?
       where id = ? and batch_id = ? and workspace_id = ? and status = 'queued'`,
    ).bind(errorMessage, timestamp, timestamp, batchItemId, batchId, workspaceId),
    db.prepare(
      `update batches set status = case when completed_item_count > 0 then 'completed_with_errors' else 'failed' end,
        failed_item_count = failed_item_count + 1,
        completed_at = ?, updated_at = ? where id = ? and workspace_id = ?`,
    ).bind(timestamp, timestamp, batchId, workspaceId),
  ]);
}

async function getActiveBatchForWorkspace(db: D1Database, workspaceId: string) {
  return db
    .prepare(batchSelect("workspace_id = ? and status in ('queued', 'processing')"))
    .bind(workspaceId)
    .first<PersistedBatch>();
}

async function listBatchItems(db: D1Database, batchId: string, workspaceId: string) {
  const rows = await db
    .prepare(
      `select id, batch_id as batchId, workspace_id as workspaceId, position,
        reference_asset_id as referenceAssetId, candidate_asset_id as candidateAssetId,
        client_label as clientLabel, status, analysis_id as analysisId,
        attempt_count as attemptCount, terminal_error_code as terminalErrorCode,
        terminal_error_message as terminalErrorMessage, created_at as createdAt,
        updated_at as updatedAt, started_at as startedAt, completed_at as completedAt,
        (select lower(a.verdict) from analyses a where a.id = batch_items.analysis_id) as verdict,
        (select count(*) from analysis_issues i where i.analysis_id = batch_items.analysis_id) as issueCount,
        (select count(*) from analysis_limitations l where l.analysis_id = batch_items.analysis_id) as limitationCount,
        (select group_concat(issue_type, '; ') from analysis_issues i where i.analysis_id = batch_items.analysis_id) as issueTypes,
        (select group_concat(limitation_type, '; ') from analysis_limitations l where l.analysis_id = batch_items.analysis_id) as limitationTypes
       from batch_items where batch_id = ? and workspace_id = ? order by position asc`,
    )
    .bind(batchId, workspaceId)
    .all<PersistedBatchItem>();
  return rows.results.map((row) => ({
    ...row,
    issueCount: Number(row.issueCount),
    limitationCount: Number(row.limitationCount),
  }));
}

async function assertAssetsBelongToWorkspace(
  db: D1Database,
  workspaceId: string,
  items: Array<{ referenceAssetId: string; candidateAssetId: string }>,
) {
  const ids = [...new Set(items.flatMap((item) => [item.referenceAssetId, item.candidateAssetId]))];
  const retentionExpiries: string[] = [];
  for (const assetId of ids) {
    const asset = await db
      .prepare(
        `select id, retention_expires_at as retentionExpiresAt
         from assets
         where id = ? and workspace_id = ? and status != 'deleted'
         limit 1`,
      )
      .bind(assetId, workspaceId)
      .first<{ id: string; retentionExpiresAt: string | null }>();
    if (!asset) {
      throw new BatchValidationError("batch_asset_not_found", "One or more mapped assets were not found in this workspace.");
    }
    if (!asset.retentionExpiresAt) {
      throw new BatchValidationError(
        "batch_asset_retention_missing",
        "One or more mapped assets do not have a retention expiry.",
      );
    }
    retentionExpiries.push(asset.retentionExpiresAt);
  }
  return retentionExpiries.sort()[0];
}

function batchSelect(where: string) {
  return `select id, workspace_id as workspaceId, mapping_mode as mappingMode, status,
    idempotency_key as idempotencyKey, request_fingerprint as requestFingerprint,
    item_count as itemCount, completed_item_count as completedItemCount,
    failed_item_count as failedItemCount,
    asset_retention_expires_at as assetRetentionExpiresAt,
    created_at as createdAt, updated_at as updatedAt, started_at as startedAt,
    completed_at as completedAt from batches where ${where} limit 1`;
}
