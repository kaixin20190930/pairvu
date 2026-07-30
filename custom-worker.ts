// @ts-expect-error OpenNext generates this module before Wrangler bundles the worker.
import nextWorker from "./.open-next/worker.js";
import { deleteExpiredAnonymousAssets } from "./lib/assets/deletion";
import type { VisualQACloudflareEnv } from "./lib/cloudflare/bindings";

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
    context.waitUntil(runRetentionDeletion(controller, env));
  },
};

export default worker;

async function runRetentionDeletion(
  controller: ScheduledController,
  env: VisualQACloudflareEnv,
) {
  const summary = await deleteExpiredAnonymousAssets(env.VISUALQA_DB, env.VISUALQA_ASSETS, {
    now: new Date(controller.scheduledTime),
  });

  console.log("anonymous_asset_retention_completed", {
    cron: controller.cron,
    ...summary,
  });
}

// @ts-expect-error OpenNext generates these exports before Wrangler bundles the worker.
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
