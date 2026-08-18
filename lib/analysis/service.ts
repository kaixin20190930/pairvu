import type { D1Database, R2Bucket, VisualQACloudflareEnv } from "@/lib/cloudflare/bindings";
import { getAssetMetadataById } from "@/lib/assets/repository";
import { M0_SUPPORTED_CATEGORIES } from "@/lib/config/product";
import {
  DEFAULT_OPENAI_MODEL,
  DEFAULT_OPENAI_PROMPT_VERSION,
  DEFAULT_OPENAI_REQUEST_TIMEOUT_MS,
} from "@/lib/config/openai";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { M0QAEngine } from "@/lib/qa/engine";
import type { M0AnalysisInput, M0CheckFamily, VisionProvider } from "@/lib/qa/types";
import { OpenAIVisionProvider } from "@/lib/ai/providers/openai-vision-provider";
import { M0RiskPolicy } from "@/lib/qa/m0-policy";
import { recordProductEvent } from "@/lib/analytics/repository";
import { canAccessOwnedResource } from "@/lib/auth/request-access";
import type { ProductEventProperty } from "@/lib/analytics/types";
import type { AnalysisCreateInput, AnalysisFeedbackInput, PersistedAnalysisResult } from "./types";
import { finishAnalysisExecutionAttempt, startAnalysisExecutionAttempt } from "./attempts";
import {
  createAnalysisRecord,
  getAnalysisById,
  getAnalysisByIdempotencyKey,
  persistCompletedAnalysis,
  persistFailedAnalysis,
  prepareFailedAnalysisRetry,
  recordAnalysisFeedback,
} from "./repository";
import { runWithInteractiveNetworkRetry } from "./transient-retry";

const DEFAULT_SELECTED_CHECKS: M0CheckFamily[] = [
  "logo",
  "visible_text",
  "quantity",
  "dominant_color",
  "major_components",
  "major_shape_packaging",
];

export type AnalysisRuntimeEnv = Pick<
  VisualQACloudflareEnv,
  "OPENAI_API_KEY" | "OPENAI_MODEL" | "OPENAI_PROMPT_VERSION" | "OPENAI_REQUEST_TIMEOUT_MS"
>;

export function getDefaultAnalysisConfig(runtimeEnv?: AnalysisRuntimeEnv) {
  const env = runtimeEnv ?? getVisualQAEnv();
  return {
    model: env.OPENAI_MODEL ?? process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL,
    promptVersion: env.OPENAI_PROMPT_VERSION ?? process.env.OPENAI_PROMPT_VERSION ?? DEFAULT_OPENAI_PROMPT_VERSION,
    apiKey: env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY,
    requestTimeoutMs: parsePositiveInteger(
      env.OPENAI_REQUEST_TIMEOUT_MS ?? process.env.OPENAI_REQUEST_TIMEOUT_MS,
      DEFAULT_OPENAI_REQUEST_TIMEOUT_MS,
    ),
  };
}

export function getDefaultSelectedChecks(): M0CheckFamily[] {
  return [...DEFAULT_SELECTED_CHECKS];
}

export async function runRealAnalysis(
  db: D1Database,
  assets: R2Bucket,
  input: Omit<AnalysisCreateInput, "analysisId"> & { analysisId?: string; analyticsAnonymousSessionId?: string },
  runtimeEnv?: AnalysisRuntimeEnv,
): Promise<PersistedAnalysisResult> {
  const analysisId = input.analysisId ?? crypto.randomUUID();
  const selectedChecks = input.selectedChecks.length > 0 ? input.selectedChecks : getDefaultSelectedChecks();
  const analysisInput = {
    analysisId,
    idempotencyKey: input.idempotencyKey,
    workspaceId: input.workspaceId,
    anonymousSessionId: input.anonymousSessionId,
    referenceAssetId: input.referenceAssetId,
    candidateAssetId: input.candidateAssetId,
    selectedChecks,
    category: input.category,
  };

  const created = await createAnalysisRecord(db, analysisInput);
  if (!created) {
    const existing = input.idempotencyKey
      ? await getAnalysisByIdempotencyKey(
          db,
          { workspaceId: input.workspaceId, anonymousSessionId: input.anonymousSessionId },
          input.idempotencyKey,
        )
      : await getAnalysisById(db, analysisId);

    if (
      existing &&
      existing.workspaceId === (input.workspaceId ?? null) &&
      existing.anonymousSessionId === (input.anonymousSessionId ?? null) &&
      existing.referenceAssetId === input.referenceAssetId &&
      existing.candidateAssetId === input.candidateAssetId
    ) {
      if (input.allowFailedRetry && existing.status === "failed") {
        await prepareFailedAnalysisRetry(db, existing.id);
      } else {
        return existing;
      }
    } else {
      throw Object.assign(new Error("The analysis request conflicts with an existing request."), {
        code: "analysis_idempotency_conflict",
        analysisId,
      });
    }
  }
  await recordAnalysisEventSafely(db, {
    eventName: "analysis_started",
    analysisId,
    anonymousSessionId: input.analyticsAnonymousSessionId ?? input.anonymousSessionId,
    properties: {
      selectedCheckCount: selectedChecks.length,
      category: input.category ?? "generic_cpg",
    },
  });

  const executionAttemptId = crypto.randomUUID();
  await startAnalysisExecutionAttempt({
    db,
    attemptId: executionAttemptId,
    analysisId,
    workspaceId: input.workspaceId,
    batchItemId: input.batchItemId,
    triggerKind: input.executionTrigger ?? "interactive",
  });

  try {
    const analysis = await buildAnalysisInput(db, assets, analysisInput);
    const result = await runWithInteractiveNetworkRetry(
      () => {
        // A dropped provider connection can leave its client unusable. Build a
        // fresh provider for the single bounded interactive retry.
        const provider = buildOpenAIProvider(runtimeEnv);
        return new M0QAEngine(provider, new M0RiskPolicy()).analyze(analysis);
      },
      input.executionTrigger ?? "interactive",
    );

    await persistCompletedAnalysis(db, result, { ...analysisInput, executionAttemptId });
    await finishAnalysisExecutionAttempt({
      db,
      attemptId: executionAttemptId,
      status: "completed",
    });
    await recordAnalysisEventSafely(db, {
      eventName: "analysis_completed",
      analysisId,
      anonymousSessionId: input.analyticsAnonymousSessionId ?? input.anonymousSessionId,
      properties: {
        verdict: result.verdict,
        provider: result.modelCalls[0]?.provider ?? "unknown",
        model: result.modelCalls[0]?.model ?? "unknown",
        promptVersion: result.modelCalls[0]?.promptVersion ?? "unknown",
        openaiLatencyMs: result.modelCalls[0]?.latencyMs ?? null,
        analysisLatencyMs: result.latencyMs,
        estimatedCostUsd: result.estimatedCostUsd ?? null,
      },
    });

    const persisted = await getAnalysisById(db, analysisId);
    if (!persisted) {
      throw new Error("Analysis completed but could not be reloaded from persistence.");
    }

    return persisted;
  } catch (error) {
    const { code, message } = normalizeExecutionError(error);
    await persistFailedAnalysis(db, analysisInput, { code, message });
    await finishAnalysisExecutionAttempt({
      db,
      attemptId: executionAttemptId,
      status: "failed",
      errorCode: code,
      errorMessage: message,
    });
    await recordAnalysisEventSafely(db, {
      eventName: "analysis_failed",
      analysisId,
      anonymousSessionId: input.analyticsAnonymousSessionId ?? input.anonymousSessionId,
      properties: {
        errorCode: code,
      },
    });
    throw Object.assign(new Error(message), { code, analysisId });
  }
}

export async function fetchPersistedAnalysis(db: D1Database, analysisId: string): Promise<PersistedAnalysisResult | null> {
  return getAnalysisById(db, analysisId);
}

export async function saveAnalysisFeedback(db: D1Database, input: AnalysisFeedbackInput): Promise<PersistedAnalysisResult | null> {
  const existing = await getAnalysisById(db, input.analysisId);
  if (
    !existing ||
    !canAccessOwnedResource(
      {
        workspaceId: input.workspaceId ?? null,
        anonymousSessionId: input.anonymousSessionId ?? null,
        retentionDays: null,
        authenticated: Boolean(input.workspaceId),
      },
      existing,
    )
  ) {
    return null;
  }

  if (input.issueId && !existing.productIssues.some((issue) => issue.id === input.issueId)) {
    throw new Error("feedback_issue_not_found");
  }

  await recordAnalysisFeedback(db, input);
  return getAnalysisById(db, input.analysisId);
}

async function buildAnalysisInput(
  db: D1Database,
  assets: R2Bucket,
  input: AnalysisCreateInput,
): Promise<M0AnalysisInput> {
  const reference = await getAssetMetadataById(db, input.referenceAssetId);
  const candidate = await getAssetMetadataById(db, input.candidateAssetId);

  if (!reference) {
    throw new AnalysisExecutionError("reference_asset_missing", "Reference asset was not found.");
  }

  if (!candidate) {
    throw new AnalysisExecutionError("candidate_asset_missing", "Candidate asset was not found.");
  }

  if (
    (input.workspaceId &&
      (reference.workspaceId !== input.workspaceId || candidate.workspaceId !== input.workspaceId)) ||
    (!input.workspaceId &&
      (!input.anonymousSessionId ||
        reference.anonymousSessionId !== input.anonymousSessionId ||
        candidate.anonymousSessionId !== input.anonymousSessionId))
  ) {
    throw new AnalysisExecutionError("asset_session_mismatch", "One or more assets were not found.");
  }

  if (reference.status === "deleted" || candidate.status === "deleted") {
    throw new AnalysisExecutionError("asset_deleted", "One or more assets were deleted before analysis.");
  }

  const referenceDataUrl = await loadAssetDataUrl(assets, reference.r2KeyOriginal, reference.mimeType);
  const candidateDataUrl = await loadAssetDataUrl(assets, candidate.r2KeyOriginal, candidate.mimeType);

  return {
    analysisId: input.analysisId,
    reference: {
      assetId: reference.id,
      mimeType: reference.mimeType,
      r2Key: reference.r2KeyOriginal,
      dataUrl: referenceDataUrl,
    },
    candidate: {
      assetId: candidate.id,
      mimeType: candidate.mimeType,
      r2Key: candidate.r2KeyOriginal,
      dataUrl: candidateDataUrl,
    },
    selectedChecks: input.selectedChecks,
    category: input.category ?? undefined,
  };
}

async function loadAssetDataUrl(bucket: R2Bucket, key: string, mimeType: string): Promise<string> {
  const object = await bucket.get(key);

  if (!object) {
    throw new AnalysisExecutionError("asset_binary_missing", `Asset binary not found for ${key}.`);
  }

  const buffer = await object.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

function buildOpenAIProvider(runtimeEnv?: AnalysisRuntimeEnv): VisionProvider {
  const config = getDefaultAnalysisConfig(runtimeEnv);

  if (!config.apiKey) {
    throw new AnalysisExecutionError(
      "openai_not_configured",
      "OPENAI_API_KEY is not configured for real image analysis.",
    );
  }

  return new OpenAIVisionProvider({
    apiKey: config.apiKey,
    model: config.model,
    promptVersion: config.promptVersion,
    requestTimeoutMs: config.requestTimeoutMs,
  });
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeExecutionError(error: unknown) {
  if (error instanceof AnalysisExecutionError) {
    return { code: error.code, message: error.message };
  }

  if (error && typeof error === "object" && "code" in error && typeof (error as { code?: unknown }).code === "string") {
    return {
      code: (error as { code: string }).code,
      message: error instanceof Error ? error.message : "Analysis execution failed.",
    };
  }

  if (error instanceof Error) {
    return { code: "analysis_execution_failed", message: error.message };
  }

  return { code: "analysis_execution_failed", message: "Analysis execution failed." };
}

class AnalysisExecutionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AnalysisExecutionError";
  }
}

export function isSupportedAnalysisCategory(category: string | undefined) {
  return !category || M0_SUPPORTED_CATEGORIES.includes(category as (typeof M0_SUPPORTED_CATEGORIES)[number]);
}

async function recordAnalysisEventSafely(
  db: D1Database,
  input: {
    eventName: "analysis_started" | "analysis_completed" | "analysis_failed";
    analysisId: string;
    anonymousSessionId?: string;
    properties: Record<string, ProductEventProperty>;
  },
) {
  if (!input.anonymousSessionId) return;

  try {
    await recordProductEvent(db, {
      idempotencyKey: `analysis:${input.analysisId}:${input.eventName}`,
      eventName: input.eventName,
      eventSource: "server",
      anonymousSessionId: input.anonymousSessionId,
      analysisId: input.analysisId,
      occurredAt: new Date().toISOString(),
      properties: input.properties,
    });
  } catch (error) {
    console.error("analysis_event_failed", {
      analysisId: input.analysisId,
      eventName: input.eventName,
      error,
    });
  }
}
