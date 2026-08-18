import type { Queue } from "@/lib/cloudflare/bindings";

export interface BatchAnalysisQueueMessage {
  version: 1;
  batchId: string;
  batchItemId: string;
  workspaceId: string;
  enqueuedAt: string;
}
export async function enqueueBatchItems(
  queue: Queue<BatchAnalysisQueueMessage>,
  input: { batchId: string; workspaceId: string; itemIds: string[] },
) {
  const enqueuedAt = new Date().toISOString();
  await queue.sendBatch(
    input.itemIds.map((batchItemId) => ({
      body: {
        version: 1,
        batchId: input.batchId,
        batchItemId,
        workspaceId: input.workspaceId,
        enqueuedAt,
      },
      contentType: "json" as const,
    })),
  );
}

export function isBatchAnalysisQueueMessage(value: unknown): value is BatchAnalysisQueueMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<BatchAnalysisQueueMessage>;
  return message.version === 1 && Boolean(message.batchId && message.batchItemId && message.workspaceId);
}
