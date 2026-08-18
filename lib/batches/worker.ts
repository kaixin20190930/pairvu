import { fetchPersistedAnalysis, runRealAnalysis, getDefaultSelectedChecks } from "@/lib/analysis/service";
import type { VisualQACloudflareEnv } from "@/lib/cloudflare/bindings";
import {
  getReservedCreditReservationForBatchItem,
  releaseCreditReservation,
  settleCreditReservation,
} from "@/lib/credits/repository";
import type { BatchAnalysisQueueMessage } from "@/lib/batches/queue";
import { claimQueuedBatchItem } from "@/lib/batches/claim";

interface ExecutableItem {
  id: string;
  batchId: string;
  workspaceId: string;
  referenceAssetId: string;
  candidateAssetId: string;
  status: string;
  analysisId: string | null;
}

export async function processBatchAnalysisMessage(env: VisualQACloudflareEnv, message: BatchAnalysisQueueMessage) {
  const item = await loadItem(env, message);
  if (!item || item.status === "completed" || item.status === "canceled") return;

  const reservation = await getReservedCreditReservationForBatchItem(env.VISUALQA_DB, item.workspaceId, item.id);
  if (reservation?.status === "settled" && item.analysisId) {
    const persisted = await fetchPersistedAnalysis(env.VISUALQA_DB, item.analysisId);
    if (persisted?.status === "completed") {
      await markItemCompletedAndRefreshBatch(env, item.id, item.batchId, item.workspaceId);
      return;
    }
  }
  if (!reservation || reservation.status !== "reserved") {
    throw new Error("Batch item does not have an active credit reservation.");
  }

  const analysisId = item.analysisId ?? batchAnalysisId(item.id);
  const timestamp = new Date().toISOString();
  const claimedByThisDelivery = await claimQueuedBatchItem(env.VISUALQA_DB, {
    itemId: item.id,
    batchId: item.batchId,
    workspaceId: item.workspaceId,
    timestamp,
  });
  if (!claimedByThisDelivery) return;
  const claimed = await loadItem(env, message);
  if (!claimed || claimed.status !== "processing") return;
  await env.VISUALQA_DB
    .prepare("update batches set status = 'processing', started_at = coalesce(started_at, ?), updated_at = ? where id = ? and status = 'queued'")
    .bind(timestamp, timestamp, item.batchId)
    .run();

  const existingAttempts = await env.VISUALQA_DB
    .prepare("select attempt_count as attemptCount from batch_items where id = ?")
    .bind(item.id)
    .first<{ attemptCount: number }>();
  const retrying = Number(existingAttempts?.attemptCount ?? 1) > 1;
  try {
    const analysis = await runRealAnalysis(env.VISUALQA_DB, env.VISUALQA_ASSETS, {
      analysisId,
      idempotencyKey: `batch-item:${item.id}`,
      workspaceId: item.workspaceId,
      referenceAssetId: item.referenceAssetId,
      candidateAssetId: item.candidateAssetId,
      selectedChecks: getDefaultSelectedChecks(),
      executionTrigger: retrying ? "retry" : "batch_queue",
      batchItemId: item.id,
      allowFailedRetry: retrying,
    }, env);
    if (analysis.status !== "completed") throw new Error("Batch analysis did not reach a persisted verdict.");

    await linkAnalysisToItem(env, item.id, item.batchId, item.workspaceId, analysis.id);
    await settleCreditReservation(env.VISUALQA_DB, reservation.id);
    await markItemCompletedAndRefreshBatch(env, item.id, item.batchId, item.workspaceId);
  } catch (error) {
    await linkAnalysisToItem(env, item.id, item.batchId, item.workspaceId, analysisId);
    await markItemRetryable(env, item.id, item.batchId, item.workspaceId);
    throw error;
  }
}

export async function terminallyFailBatchMessage(
  env: VisualQACloudflareEnv,
  message: BatchAnalysisQueueMessage,
  reason = "The product check could not be completed after retries.",
) {
  const item = await loadItem(env, message);
  if (!item || item.status === "completed" || item.status === "canceled") return;
  const reservation = await getReservedCreditReservationForBatchItem(env.VISUALQA_DB, item.workspaceId, item.id);
  if (reservation) await releaseCreditReservation(env.VISUALQA_DB, reservation.id);
  const timestamp = new Date().toISOString();
  await env.VISUALQA_DB
    .prepare(
      `update batch_items set status = 'failed', terminal_error_code = 'batch_retry_exhausted',
        terminal_error_message = ?, completed_at = ?, updated_at = ?
       where id = ? and batch_id = ? and workspace_id = ? and status != 'completed'`,
    )
    .bind(reason, timestamp, timestamp, item.id, item.batchId, item.workspaceId)
    .run();
  await refreshBatchTerminalState(env, item.batchId, item.workspaceId);
}

async function loadItem(env: VisualQACloudflareEnv, message: BatchAnalysisQueueMessage) {
  return env.VISUALQA_DB
    .prepare(
      `select id, batch_id as batchId, workspace_id as workspaceId,
        reference_asset_id as referenceAssetId, candidate_asset_id as candidateAssetId,
        status, analysis_id as analysisId
       from batch_items where id = ? and batch_id = ? and workspace_id = ? limit 1`,
    )
    .bind(message.batchItemId, message.batchId, message.workspaceId)
    .first<ExecutableItem>();
}

function batchAnalysisId(itemId: string) {
  return `batch-analysis-${itemId}`;
}

async function linkAnalysisToItem(
  env: VisualQACloudflareEnv,
  itemId: string,
  batchId: string,
  workspaceId: string,
  analysisId: string,
) {
  const timestamp = new Date().toISOString();
  const result = await env.VISUALQA_DB
    .prepare(
      `update batch_items set analysis_id = ?, updated_at = ?
       where id = ? and batch_id = ? and workspace_id = ?
         and exists (select 1 from analyses where id = ?)`,
    )
    .bind(analysisId, timestamp, itemId, batchId, workspaceId, analysisId)
    .run();
  if (!result.success) throw new Error(result.error ?? "Unable to link the batch analysis.");
}

async function markItemCompletedAndRefreshBatch(env: VisualQACloudflareEnv, itemId: string, batchId: string, workspaceId: string) {
  const timestamp = new Date().toISOString();
  await env.VISUALQA_DB
    .prepare(
      `update batch_items set status = 'completed', completed_at = ?, updated_at = ?
       where id = ? and batch_id = ? and workspace_id = ? and status = 'processing'`,
    )
    .bind(timestamp, timestamp, itemId, batchId, workspaceId)
    .run();
  await refreshBatchTerminalState(env, batchId, workspaceId);
}

async function markItemRetryable(env: VisualQACloudflareEnv, itemId: string, batchId: string, workspaceId: string) {
  const timestamp = new Date().toISOString();
  await env.VISUALQA_DB
    .prepare(
      `update batch_items set status = 'queued', updated_at = ?
       where id = ? and batch_id = ? and workspace_id = ? and status = 'processing'`,
    )
    .bind(timestamp, itemId, batchId, workspaceId)
    .run();
}

async function refreshBatchTerminalState(env: VisualQACloudflareEnv, batchId: string, workspaceId: string) {
  const counts = await env.VISUALQA_DB
    .prepare(
      `select count(*) as total,
        sum(case when status = 'completed' then 1 else 0 end) as completed,
        sum(case when status = 'failed' then 1 else 0 end) as failed,
        sum(case when status = 'canceled' then 1 else 0 end) as canceled,
        sum(case when status in ('queued', 'processing') then 1 else 0 end) as active
       from batch_items where batch_id = ? and workspace_id = ?`,
    )
    .bind(batchId, workspaceId)
    .first<{ total: number; completed: number; failed: number; canceled: number; active: number }>();
  if (!counts) return;
  const completed = Number(counts.completed ?? 0);
  const failed = Number(counts.failed ?? 0);
  const canceled = Number(counts.canceled ?? 0);
  const active = Number(counts.active ?? 0);
  const status = active > 0
    ? "processing"
    : canceled > 0
      ? "canceled"
      : failed > 0 && completed > 0
        ? "completed_with_errors"
        : failed > 0
          ? "failed"
          : "completed";
  const timestamp = new Date().toISOString();
  await env.VISUALQA_DB
    .prepare(
      `update batches set status = ?, completed_item_count = ?, failed_item_count = ?,
        completed_at = case when ? = 0 then ? else completed_at end, updated_at = ?
       where id = ? and workspace_id = ?`,
    )
    .bind(status, completed, failed, active, timestamp, timestamp, batchId, workspaceId)
    .run();
}
