import assert from "node:assert/strict";
import { getDefaultAnalysisConfig } from "../lib/analysis/service";
import { enqueueBatchItems, isBatchAnalysisQueueMessage } from "../lib/batches/queue";
import { claimQueuedBatchItem } from "../lib/batches/claim";
import type { D1Database, Queue } from "../lib/cloudflare/bindings";

async function main() {
  const sent: unknown[][] = [];
  const queue: Queue = {
    async send() {},
    async sendBatch(messages) { sent.push(messages); },
  };

  await enqueueBatchItems(queue, {
    batchId: "batch-a",
    workspaceId: "workspace-a",
    itemIds: ["item-a", "item-b"],
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].length, 2);
  const bodies = sent[0].map((entry) => (entry as { body: unknown }).body);
  assert.ok(bodies.every(isBatchAnalysisQueueMessage));
  assert.deepEqual(
    bodies.map((body) => body.batchItemId),
    ["item-a", "item-b"],
  );
  assert.equal(isBatchAnalysisQueueMessage({ version: 2 }), false);
  assert.equal(isBatchAnalysisQueueMessage(null), false);

  const queueRuntimeConfig = getDefaultAnalysisConfig({
    OPENAI_API_KEY: "queue-test-key",
    OPENAI_MODEL: "queue-test-model",
    OPENAI_PROMPT_VERSION: "queue-test-prompt",
  });
  assert.deepEqual(queueRuntimeConfig, {
    apiKey: "queue-test-key",
    model: "queue-test-model",
    promptVersion: "queue-test-prompt",
    requestTimeoutMs: 120_000,
  });

  assert.equal(
    getDefaultAnalysisConfig({
      OPENAI_API_KEY: "queue-test-key",
      OPENAI_MODEL: "queue-test-model",
      OPENAI_PROMPT_VERSION: "queue-test-prompt",
      OPENAI_REQUEST_TIMEOUT_MS: "90000",
    }).requestTimeoutMs,
    90_000,
  );
  assert.equal(
    getDefaultAnalysisConfig({
      OPENAI_API_KEY: "queue-test-key",
      OPENAI_MODEL: "queue-test-model",
      OPENAI_PROMPT_VERSION: "queue-test-prompt",
      OPENAI_REQUEST_TIMEOUT_MS: "invalid",
    }).requestTimeoutMs,
    120_000,
  );

  const claimChanges = [1, 0];
  const claimQueries: string[] = [];
  const claimDb = {
    prepare(query: string) {
      claimQueries.push(query);
      return {
        bind(...values: unknown[]) {
          assert.deepEqual(values, [
            "2026-08-14T00:00:00.000Z",
            "2026-08-14T00:00:00.000Z",
            "item-a",
            "batch-a",
            "workspace-a",
          ]);
          return {
            async run() {
              return { success: true, meta: { changes: claimChanges.shift() ?? 0 } };
            },
          };
        },
      };
    },
  } as unknown as D1Database;
  const claimInput = {
    itemId: "item-a",
    batchId: "batch-a",
    workspaceId: "workspace-a",
    timestamp: "2026-08-14T00:00:00.000Z",
  };
  assert.equal(await claimQueuedBatchItem(claimDb, claimInput), true);
  assert.equal(await claimQueuedBatchItem(claimDb, claimInput), false);
  assert.equal(claimQueries.length, 2);
  assert.ok(claimQueries.every((query) => query.includes("status = 'queued'")));

  console.log("M1 batch queue contract verification passed.");
  console.log("Verified versioned JSON messages, one message per item, invalid-message rejection, bounded runtime configuration, and single-claim queue delivery.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
