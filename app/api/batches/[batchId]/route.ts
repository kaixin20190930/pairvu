import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceBatchEntitlement } from "@/lib/accounts/repository";
import { resolveRequestAccess } from "@/lib/auth/request-access";
import { enqueueBatchItems } from "@/lib/batches/queue";
import {
  cancelQueuedBatchItems,
  getBatchById,
  requeueFailedBatchItem,
  restoreFailedBatchItem,
} from "@/lib/batches/repository";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import {
  getReservedCreditReservationForBatchItem,
  releaseCreditReservation,
  reserveWorkspaceCredits,
} from "@/lib/credits/repository";
import { deleteAssetsImmediately } from "@/lib/assets/deletion";
import { listBatchAssets } from "@/lib/assets/repository";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: { params: Promise<{ batchId: string }> }) {
  try {
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, undefined);
    if (!access.workspaceId) return response("authentication_required", "Sign in to update a batch.", 401);
    const { batchId } = await context.params;
    const body = await request.json() as { action?: unknown; batchItemId?: unknown };

    if (body.action === "cancel") {
      const canceled = await cancelQueuedBatchItems(env.VISUALQA_DB, batchId, access.workspaceId);
      if (!canceled?.batch) return response("batch_not_found", "Batch not found.", 404);
      for (const itemId of canceled.canceledItemIds) {
        const reservation = await getReservedCreditReservationForBatchItem(env.VISUALQA_DB, access.workspaceId, itemId);
        if (reservation) await releaseCreditReservation(env.VISUALQA_DB, reservation.id);
      }
      return NextResponse.json({ batch: await getBatchById(env.VISUALQA_DB, batchId, access.workspaceId) });
    }

    if (body.action === "retry" && typeof body.batchItemId === "string") {
      const retry = await requeueFailedBatchItem(
        env.VISUALQA_DB,
        batchId,
        body.batchItemId,
        access.workspaceId,
      );
      if (!retry) return response("batch_item_not_retryable", "This failed item is no longer available to retry.", 409);

      let reservationId: string | null = null;
      try {
        const entitlement = await getWorkspaceBatchEntitlement(env.VISUALQA_DB, access.workspaceId);
        const reservation = await reserveWorkspaceCredits({
          db: env.VISUALQA_DB,
          workspaceId: access.workspaceId,
          amount: 1,
          purpose: "batch_product_image_check_retry",
          sourceType: "batch_item_retry",
          sourceId: `${retry.itemId}:${crypto.randomUUID()}`,
          ttlMinutes: 360,
        });
        reservationId = reservation.id;
        await enqueueBatchItems(
          entitlement.priorityQueueEnabled ? env.BATCH_PRIORITY_ANALYSIS_QUEUE : env.BATCH_ANALYSIS_QUEUE,
          { batchId, workspaceId: access.workspaceId, itemIds: [retry.itemId] },
        );
      } catch (error) {
        if (reservationId) await releaseCreditReservation(env.VISUALQA_DB, reservationId);
        await restoreFailedBatchItem(
          env.VISUALQA_DB,
          batchId,
          retry.itemId,
          access.workspaceId,
          "The retry could not be queued. No check was charged.",
        );
        throw error;
      }
      return NextResponse.json({ batch: await getBatchById(env.VISUALQA_DB, batchId, access.workspaceId) }, { status: 202 });
    }

    return response("invalid_batch_action", "Use cancel or retry with a failed batch item.", 400);
  } catch (error) {
    console.error("batch_update_failed", error);
    const code = error instanceof Error && "code" in error ? String(error.code) : "batch_update_failed";
    const status = code === "workspace_quota_exceeded" || code === "workspace_billing_inactive" ? 402 : 500;
    const message = error instanceof Error ? error.message : "The batch could not be updated.";
    return response(code, message, status);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ batchId: string }> }) {
  try {
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, undefined);
    if (!access.workspaceId) return response("authentication_required", "Sign in to delete batch images.", 401);
    const { batchId } = await context.params;
    const batch = await getBatchById(env.VISUALQA_DB, batchId, access.workspaceId);
    if (!batch) return response("batch_not_found", "Batch not found.", 404);
    if (batch.status === "queued" || batch.status === "processing") {
      return response("batch_still_running", "Cancel or finish this batch before deleting its images.", 409);
    }
    const assets = await listBatchAssets(env.VISUALQA_DB, batchId, access.workspaceId);
    const deletion = await deleteAssetsImmediately(env.VISUALQA_DB, env.VISUALQA_ASSETS, assets);
    if (deletion.failed > 0) {
      return NextResponse.json(
        { error: "image_deletion_incomplete", message: "Some batch images could not be deleted. Please retry.", deletion },
        { status: 500 },
      );
    }
    return NextResponse.json({ deletion });
  } catch (error) {
    console.error("batch_image_deletion_failed", error);
    return response("image_deletion_failed", "The batch images could not be fully deleted. Please retry.", 500);
  }
}

function response(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status });
}
