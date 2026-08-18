import { NextRequest, NextResponse } from "next/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { fetchPersistedAnalysis, runRealAnalysis } from "@/lib/analysis/service";
import { getDefaultSelectedChecks, isSupportedAnalysisCategory } from "@/lib/analysis/service";
import { isValidAnonymousSessionId } from "@/lib/assets/validation";
import { getAnalysisByIdempotencyKey } from "@/lib/analysis/repository";
import {
  enforceAuthenticatedAnalysisGuard,
  enforcePublicAnalysisGuard,
  PublicBetaAccessError,
} from "@/lib/public-beta/guards";
import { RequestAccessError, resolveRequestAccess } from "@/lib/auth/request-access";
import {
  InsufficientWorkspaceCreditsError,
  releaseCreditReservation,
  reserveWorkspaceCredits,
  settleCreditReservation,
  WorkspaceBillingInactiveError,
} from "@/lib/credits/repository";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const referenceAssetId = typeof body?.referenceAssetId === "string" ? body.referenceAssetId : null;
    const candidateAssetId = typeof body?.candidateAssetId === "string" ? body.candidateAssetId : null;
    const anonymousSessionCandidate = body?.anonymousSessionId;
    const turnstileToken = typeof body?.turnstileToken === "string" ? body.turnstileToken : undefined;
    const category = typeof body?.category === "string" ? body.category : undefined;
    const analysisId = isValidAnonymousSessionId(body?.analysisId) ? body.analysisId : undefined;
    const idempotencyKey = isValidAnonymousSessionId(body?.idempotencyKey) ? body.idempotencyKey : undefined;

    if (!referenceAssetId || !candidateAssetId || !analysisId || !idempotencyKey) {
      return NextResponse.json(
        {
          error: "invalid_analysis_request",
          message:
            "referenceAssetId, candidateAssetId, analysisId and idempotencyKey must be valid.",
        },
        { status: 400 },
      );
    }

    if (!isSupportedAnalysisCategory(category)) {
      return NextResponse.json(
        {
          error: "unsupported_category",
          message: "The selected category is not supported in M0.",
        },
        { status: 400 },
      );
    }

    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, anonymousSessionCandidate);
    const owner = {
      workspaceId: access.workspaceId ?? undefined,
      anonymousSessionId: access.workspaceId ? undefined : access.anonymousSessionId ?? undefined,
    };
    const existing = await getAnalysisByIdempotencyKey(env.VISUALQA_DB, owner, idempotencyKey);
    if (existing) {
      if (existing.referenceAssetId !== referenceAssetId || existing.candidateAssetId !== candidateAssetId) {
        return NextResponse.json(
          {
            error: "analysis_idempotency_conflict",
            message: "This analysis request key is already associated with different images.",
            analysisId: existing.id,
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { analysis: existing, resumed: true },
        { status: existing.status === "running" || existing.status === "queued" ? 202 : 200 },
      );
    }

    const existingById = await fetchPersistedAnalysis(env.VISUALQA_DB, analysisId);
    if (existingById) {
      return NextResponse.json(
        {
          error: "analysis_idempotency_conflict",
          message: "This analysis identifier is already in use.",
          analysisId,
        },
        { status: 409 },
      );
    }

    if (access.workspaceId) {
      await enforceAuthenticatedAnalysisGuard(env.VISUALQA_DB, env, {
        workspaceId: access.workspaceId,
      });
    } else {
      await enforcePublicAnalysisGuard(env.VISUALQA_DB, env, {
        anonymousSessionId: access.anonymousSessionId!,
        turnstileToken,
        clientIp: request.headers.get("cf-connecting-ip"),
      });
    }

    const reservation = access.workspaceId
      ? await reserveWorkspaceCredits({
          db: env.VISUALQA_DB,
          workspaceId: access.workspaceId,
          amount: 1,
          purpose: "single_product_image_check",
          sourceType: "analysis",
          sourceId: analysisId,
        })
      : null;
    let analysis;
    try {
      analysis = await runRealAnalysis(env.VISUALQA_DB, env.VISUALQA_ASSETS, {
        referenceAssetId,
        candidateAssetId,
        ...owner,
        analyticsAnonymousSessionId: access.anonymousSessionId ?? undefined,
        analysisId,
        idempotencyKey,
        selectedChecks: getDefaultSelectedChecks(),
        category,
      });
      if (reservation) await settleCreditReservation(env.VISUALQA_DB, reservation.id);
    } catch (error) {
      if (reservation) await releaseCreditReservation(env.VISUALQA_DB, reservation.id);
      throw error;
    }

    return NextResponse.json(
      { analysis },
      { status: analysis.status === "running" || analysis.status === "queued" ? 202 : 201 },
    );
  } catch (error) {
    if (error instanceof RequestAccessError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 400 });
    }

    if (error instanceof InsufficientWorkspaceCreditsError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 402 });
    }
    if (error instanceof WorkspaceBillingInactiveError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 402 });
    }
    if (error instanceof PublicBetaAccessError) {
      const headers = retryAfterHeaders(error.retryAfterSeconds);
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
          retryAfterSeconds: error.retryAfterSeconds ?? null,
        },
        headers ? { status: error.status, headers } : { status: error.status },
      );
    }

    const analysisId = error && typeof error === "object" && "analysisId" in error ? String((error as { analysisId?: unknown }).analysisId) : undefined;
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code) : "analysis_failed";
    const message = error instanceof Error ? error.message : "Analysis failed.";

    return NextResponse.json(
      {
        error: code,
        message,
        analysisId,
      },
      { status: analysisErrorStatus(code) },
    );
  }
}

function analysisErrorStatus(code: string) {
  if (
    code === "reference_asset_missing" ||
    code === "candidate_asset_missing" ||
    code === "asset_binary_missing" ||
    code === "asset_session_mismatch"
  ) {
    return 404;
  }

  if (code === "asset_deleted") {
    return 410;
  }

  return code === "openai_not_configured" ? 503 : 500;
}

function retryAfterHeaders(retryAfterSeconds?: number) {
  if (!retryAfterSeconds) return undefined;
  return {
    "Retry-After": String(retryAfterSeconds),
  };
}
