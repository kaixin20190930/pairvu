import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceBatchEntitlement } from "@/lib/accounts/repository";
import { isValidAnonymousSessionId } from "@/lib/assets/validation";
import { enqueueBatchItems } from "@/lib/batches/queue";
import {
  ActiveBatchExistsError,
  BatchIdempotencyConflictError,
  createBatch,
  getBatchById,
  listWorkspaceBatches,
  markBatchFailedBeforeExecution,
} from "@/lib/batches/repository";
import { BATCH_MAPPING_MODES, type BatchMappingItemInput, type BatchMappingMode } from "@/lib/batches/types";
import { BatchValidationError } from "@/lib/batches/validation";
import { RequestAccessError, resolveRequestAccess } from "@/lib/auth/request-access";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import {
  InsufficientWorkspaceCreditsError,
  releaseCreditReservation,
  reserveWorkspaceCredits,
  WorkspaceBillingInactiveError,
} from "@/lib/credits/repository";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const reservations: string[] = [];
  let createdBatch: { id: string; workspaceId: string } | null = null;
  try {
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, undefined);
    if (!access.workspaceId) return authenticationRequired();

    const body = await request.json();
    const batchId = isValidAnonymousSessionId(body?.batchId) ? body.batchId : null;
    const idempotencyKey = isValidAnonymousSessionId(body?.idempotencyKey) ? body.idempotencyKey : null;
    const mappingMode = isBatchMappingMode(body?.mappingMode) ? body.mappingMode : null;
    const items = normalizeItems(body?.items);
    if (!batchId || !idempotencyKey || !mappingMode || !items) {
      return NextResponse.json(
        { error: "invalid_batch_request", message: "batchId, idempotencyKey, mappingMode, and items must be valid." },
        { status: 400 },
      );
    }

    const entitlement = await getWorkspaceBatchEntitlement(env.VISUALQA_DB, access.workspaceId);
    const created = await createBatch(env.VISUALQA_DB, {
      batchId,
      workspaceId: access.workspaceId,
      idempotencyKey,
      mappingMode,
      items,
      planBatchItemLimit: entitlement.batchItemLimit,
    });
    if (created.resumed) {
      return NextResponse.json({ batch: created.batch, resumed: true }, { status: 200 });
    }

    createdBatch = { id: created.batch.id, workspaceId: access.workspaceId };
    for (const item of created.batch.items) {
      const reservation = await reserveWorkspaceCredits({
        db: env.VISUALQA_DB,
        workspaceId: access.workspaceId,
        amount: 1,
        purpose: "batch_product_image_check",
        sourceType: "batch_item",
        sourceId: item.id,
        ttlMinutes: 360,
      });
      reservations.push(reservation.id);
    }

    const queue = entitlement.priorityQueueEnabled
      ? env.BATCH_PRIORITY_ANALYSIS_QUEUE
      : env.BATCH_ANALYSIS_QUEUE;
    await enqueueBatchItems(queue, {
      batchId: created.batch.id,
      workspaceId: access.workspaceId,
      itemIds: created.batch.items.map((item) => item.id),
    });
    const queued = await getBatchById(env.VISUALQA_DB, created.batch.id, access.workspaceId);
    return NextResponse.json({ batch: queued, resumed: false }, { status: 202 });
  } catch (error) {
    const env = getVisualQAEnv();
    for (const reservationId of reservations) {
      try {
        await releaseCreditReservation(env.VISUALQA_DB, reservationId);
      } catch (releaseError) {
        console.error("batch_reservation_release_failed", { reservationId, releaseError });
      }
    }
    if (createdBatch) {
      await markBatchFailedBeforeExecution(
        env.VISUALQA_DB,
        createdBatch.id,
        createdBatch.workspaceId,
        "batch_enqueue_failed",
        "The batch could not be queued. No checks were charged.",
      );
    }
    return batchErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, undefined);
    if (!access.workspaceId) return authenticationRequired();
    const batchId = request.nextUrl.searchParams.get("batchId");
    if (!batchId) {
      const batches = await listWorkspaceBatches(env.VISUALQA_DB, access.workspaceId);
      return NextResponse.json({ batches });
    }
    if (!isValidAnonymousSessionId(batchId)) {
      return NextResponse.json({ error: "invalid_batch_id", message: "A valid batchId is required." }, { status: 400 });
    }
    const batch = await getBatchById(env.VISUALQA_DB, batchId, access.workspaceId);
    if (!batch) return NextResponse.json({ error: "batch_not_found", message: "Batch not found." }, { status: 404 });
    return NextResponse.json({ batch });
  } catch (error) {
    return batchErrorResponse(error);
  }
}

function normalizeItems(value: unknown): BatchMappingItemInput[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((item) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      referenceAssetId: typeof row.referenceAssetId === "string" ? row.referenceAssetId : "",
      candidateAssetId: typeof row.candidateAssetId === "string" ? row.candidateAssetId : "",
      clientLabel: typeof row.clientLabel === "string" ? row.clientLabel : undefined,
    };
  });
}

function isBatchMappingMode(value: unknown): value is BatchMappingMode {
  return typeof value === "string" && (BATCH_MAPPING_MODES as readonly string[]).includes(value);
}

function authenticationRequired() {
  return NextResponse.json({ error: "authentication_required", message: "Sign in to create or view a batch." }, { status: 401 });
}

function batchErrorResponse(error: unknown) {
  if (error instanceof RequestAccessError) return authenticationRequired();
  if (error instanceof BatchValidationError) return NextResponse.json({ error: error.code, message: error.message }, { status: 400 });
  if (error instanceof BatchIdempotencyConflictError || error instanceof ActiveBatchExistsError) {
    return NextResponse.json({ error: error.code, message: error.message }, { status: 409 });
  }
  if (error instanceof InsufficientWorkspaceCreditsError || error instanceof WorkspaceBillingInactiveError) {
    return NextResponse.json({ error: error.code, message: error.message }, { status: 402 });
  }
  const code = error instanceof Error && error.message === "workspace_billing_inactive" ? "workspace_billing_inactive" : "batch_failed";
  if (code === "workspace_billing_inactive") {
    return NextResponse.json({ error: code, message: "Billing for this workspace needs attention." }, { status: 402 });
  }
  console.error("batch_request_failed", error);
  return NextResponse.json({ error: code, message: "The batch could not be started. Please try again." }, { status: 500 });
}
