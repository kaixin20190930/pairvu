// @ts-expect-error OpenNext generates this module before Wrangler bundles the worker.
import nextWorker from "./.open-next/worker.js";
import { deleteExpiredAssets } from "./lib/assets/deletion";
import type { VisualQACloudflareEnv } from "./lib/cloudflare/bindings";
import type { QueueMessageBatch } from "./lib/cloudflare/bindings";
import { releaseExpiredCreditReservations } from "./lib/credits/repository";
import { isBatchAnalysisQueueMessage, type BatchAnalysisQueueMessage } from "./lib/batches/queue";
import { processBatchAnalysisMessage, terminallyFailBatchMessage } from "./lib/batches/worker";

interface ScheduledController {
  scheduledTime: number;
  cron: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

const worker = {
  fetch(request: Request, env: VisualQACloudflareEnv, context: ExecutionContext) {
    const url = new URL(request.url);

    if (url.hostname === "www.pairvu.com") {
      url.hostname = "pairvu.com";
      return Response.redirect(url.toString(), 308);
    }

    return nextWorker.fetch(request, env, context);
  },

  scheduled(
    controller: ScheduledController,
    env: VisualQACloudflareEnv,
    context: ExecutionContext,
  ) {
    context.waitUntil(runScheduledMaintenance(controller, env));
  },

  async queue(batch: QueueMessageBatch<unknown>, env: VisualQACloudflareEnv) {
    const deadLetter = batch.queue === "pairvu-batch-dead-letter";
    for (const message of batch.messages) {
      if (!isBatchAnalysisQueueMessage(message.body)) {
        console.error("batch_queue_invalid_message", { queue: batch.queue, messageId: message.id });
        message.ack();
        continue;
      }

      try {
        if (deadLetter) {
          await terminallyFailBatchMessage(env, message.body as BatchAnalysisQueueMessage);
        } else {
          await processBatchAnalysisMessage(env, message.body as BatchAnalysisQueueMessage);
        }
        message.ack();
      } catch (error) {
        console.error("batch_queue_item_failed", {
          queue: batch.queue,
          messageId: message.id,
          attempts: message.attempts,
          error: error instanceof Error ? error.message : String(error),
        });
        if (deadLetter) message.ack();
        else message.retry({ delaySeconds: 30 });
      }
    }
  },
};

export default worker;

async function runScheduledMaintenance(
  controller: ScheduledController,
  env: VisualQACloudflareEnv,
) {
  const now = new Date(controller.scheduledTime);
  const [retention, releasedCreditReservations] = await Promise.all([
    deleteExpiredAssets(env.VISUALQA_DB, env.VISUALQA_ASSETS, { now }),
    releaseExpiredCreditReservations(env.VISUALQA_DB, now),
  ]);

  console.log("scheduled_maintenance_completed", {
    cron: controller.cron,
    retention,
    releasedCreditReservations,
  });
}

// @ts-expect-error OpenNext generates these exports before Wrangler bundles the worker.
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
