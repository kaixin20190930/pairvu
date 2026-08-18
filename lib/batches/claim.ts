import type { D1Database } from "@/lib/cloudflare/bindings";

interface BatchItemClaimInput {
  itemId: string;
  batchId: string;
  workspaceId: string;
  timestamp: string;
}

export async function claimQueuedBatchItem(db: D1Database, input: BatchItemClaimInput): Promise<boolean> {
  const claim = await db
    .prepare(
      `update batch_items set status = 'processing', attempt_count = attempt_count + 1,
        started_at = coalesce(started_at, ?), updated_at = ?
       where id = ? and batch_id = ? and workspace_id = ? and status = 'queued'`,
    )
    .bind(input.timestamp, input.timestamp, input.itemId, input.batchId, input.workspaceId)
    .run();
  if (!claim.success) throw new Error(claim.error ?? "Unable to claim batch item.");
  return Number(claim.meta?.changes ?? 0) > 0;
}
