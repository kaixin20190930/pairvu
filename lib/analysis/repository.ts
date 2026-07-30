import type { D1Database } from "@/lib/cloudflare/bindings";
import type {
  AnalysisCreateInput,
  AnalysisFeedbackInput,
  PersistedAnalysisFeedback,
  PersistedAnalysisIssue,
  PersistedAnalysisLimitation,
  PersistedAnalysisModelCall,
  PersistedAnalysisObservation,
  PersistedAnalysisResult,
  PersistedAnalysisSummary,
} from "./types";
import type { QAEngineResult } from "@/lib/qa/types";

type D1Row = Record<string, unknown>;

export async function createAnalysisRecord(db: D1Database, input: AnalysisCreateInput): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `insert or ignore into analyses (
        id,
        idempotency_key,
        workspace_id,
        anonymous_session_id,
        reference_asset_id,
        candidate_asset_id,
        selected_checks_json,
        category,
        status,
        started_at,
        created_at,
        updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.analysisId,
      input.idempotencyKey ?? null,
      input.workspaceId ?? null,
      input.anonymousSessionId ?? null,
      input.referenceAssetId,
      input.candidateAssetId,
      JSON.stringify(input.selectedChecks),
      input.category ?? null,
      "running",
      now,
      now,
      now,
    )
    .run();

  if (!result.success) {
    throw new Error(result.error ?? "Failed to create analysis record.");
  }

  const inserted = await db
    .prepare(`select created_at as createdAt from analyses where id = ? limit 1`)
    .bind(input.analysisId)
    .first<D1Row>();

  if (!inserted || inserted.createdAt !== now) {
    return false;
  }

  const referenceInsert = await db
    .prepare(
      `insert into analysis_references (
        id,
        workspace_id,
        analysis_id,
        asset_id,
        created_at
      ) values (?, ?, ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), input.workspaceId ?? null, input.analysisId, input.referenceAssetId, now)
    .run();

  if (!referenceInsert.success) {
    throw new Error(referenceInsert.error ?? "Failed to create analysis reference record.");
  }

  return true;
}

export async function persistCompletedAnalysis(
  db: D1Database,
  result: QAEngineResult,
  input: Pick<AnalysisCreateInput, "workspaceId" | "anonymousSessionId" | "referenceAssetId" | "candidateAssetId" | "selectedChecks" | "category">,
): Promise<void> {
  const now = new Date().toISOString();
  const summaryUpdate = await db
    .prepare(
      `update analyses set
        status = ?,
        verdict = ?,
        qa_engine_version = ?,
        risk_policy_version = ?,
        model_policy_version = ?,
        selected_checks_json = ?,
        category = ?,
        analysis_latency_ms = ?,
        openai_latency_ms = ?,
        estimated_cost_usd = ?,
        started_at = coalesce(started_at, ?),
        completed_at = ?,
        updated_at = ?
      where id = ?`,
    )
    .bind(
      "completed",
      result.verdict,
      result.versions.qaEngineVersion,
      result.versions.riskPolicyVersion,
      result.versions.modelPolicyVersion,
      JSON.stringify(input.selectedChecks),
      input.category ?? null,
      result.latencyMs,
      result.modelCalls[0]?.latencyMs ?? null,
      result.estimatedCostUsd ?? null,
      now,
      now,
      now,
      result.analysisId,
    )
    .run();

  if (!summaryUpdate.success) {
    throw new Error(summaryUpdate.error ?? "Failed to update analysis record.");
  }

  await insertAnalysisObservations(db, result.analysisId, input.workspaceId ?? null, result.observations);
  await insertAnalysisIssues(db, result.analysisId, input.workspaceId ?? null, result.productIssues);
  await insertAnalysisLimitations(db, result.analysisId, input.workspaceId ?? null, result.limitations);
  await insertAnalysisModelCalls(
    db,
    result.analysisId,
    input.workspaceId ?? null,
    result.modelCalls,
    result.versions.modelPolicyVersion,
  );
}

export async function persistFailedAnalysis(
  db: D1Database,
  input: Pick<AnalysisCreateInput, "analysisId" | "workspaceId" | "anonymousSessionId" | "referenceAssetId" | "candidateAssetId" | "selectedChecks" | "category">,
  error: { code: string; message: string },
): Promise<void> {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `update analyses set
        status = ?,
        error_code = ?,
        error_message = ?,
        selected_checks_json = ?,
        category = ?,
        completed_at = ?,
        updated_at = ?
      where id = ?`,
    )
    .bind(
      "failed",
      error.code,
      error.message,
      JSON.stringify(input.selectedChecks),
      input.category ?? null,
      now,
      now,
      input.analysisId,
    )
    .run();

  if (!result.success) {
    throw new Error(result.error ?? "Failed to mark analysis as failed.");
  }
}

export async function recordAnalysisFeedback(db: D1Database, input: AnalysisFeedbackInput): Promise<void> {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `insert into analysis_feedback (
        id,
        analysis_id,
        feedback_kind,
        reason_code,
        check_family,
        issue_id,
        comment,
        created_at,
        updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      input.analysisId,
      input.feedbackKind,
      input.reasonCode ?? null,
      input.checkFamily ?? null,
      input.issueId ?? null,
      input.comment ?? null,
      now,
      now,
    )
    .run();

  if (!result.success) {
    throw new Error(result.error ?? "Failed to insert analysis feedback.");
  }
}

export async function getAnalysisById(db: D1Database, analysisId: string): Promise<PersistedAnalysisResult | null> {
  const analysis = await db
    .prepare(
      `select
        id,
        workspace_id as workspaceId,
        anonymous_session_id as anonymousSessionId,
        reference_asset_id as referenceAssetId,
        candidate_asset_id as candidateAssetId,
        selected_checks_json as selectedChecksJson,
        category,
        status,
        verdict,
        qa_engine_version as qaEngineVersion,
        risk_policy_version as riskPolicyVersion,
        model_policy_version as modelPolicyVersion,
        analysis_latency_ms as analysisLatencyMs,
        openai_latency_ms as openaiLatencyMs,
        estimated_cost_usd as estimatedCostUsd,
        started_at as startedAt,
        completed_at as completedAt,
        created_at as createdAt,
        updated_at as updatedAt,
        error_code as errorCode,
        error_message as errorMessage
      from analyses where id = ? limit 1`,
    )
    .bind(analysisId)
    .first<D1Row>();

  if (!analysis) {
    return null;
  }

  const observations = await loadObservations(db, analysisId);
  const productIssues = await loadIssues(db, analysisId);
  const limitations = await loadLimitations(db, analysisId);
  const modelCalls = await loadModelCalls(db, analysisId);
  const feedback = await loadFeedback(db, analysisId);

  return {
    id: String(analysis.id),
    workspaceId: (analysis.workspaceId as string | null) ?? null,
    anonymousSessionId: (analysis.anonymousSessionId as string | null) ?? null,
    referenceAssetId: String(analysis.referenceAssetId),
    candidateAssetId: String(analysis.candidateAssetId),
    selectedChecks: parseJsonArray(analysis.selectedChecksJson) as PersistedAnalysisSummary["selectedChecks"],
    category: (analysis.category as string | null) ?? null,
    status: analysis.status as PersistedAnalysisSummary["status"],
    verdict: (analysis.verdict as PersistedAnalysisSummary["verdict"]) ?? null,
    qaEngineVersion: (analysis.qaEngineVersion as string | null) ?? null,
    riskPolicyVersion: (analysis.riskPolicyVersion as string | null) ?? null,
    modelPolicyVersion: (analysis.modelPolicyVersion as string | null) ?? null,
    analysisLatencyMs: coerceNumber(analysis.analysisLatencyMs),
    openaiLatencyMs: coerceNumber(analysis.openaiLatencyMs),
    estimatedCostUsd: coerceNumber(analysis.estimatedCostUsd),
    errorCode: (analysis.errorCode as string | null) ?? null,
    errorMessage: (analysis.errorMessage as string | null) ?? null,
    createdAt: String(analysis.createdAt),
    updatedAt: String(analysis.updatedAt),
    startedAt: (analysis.startedAt as string | null) ?? null,
    completedAt: (analysis.completedAt as string | null) ?? null,
    observations,
    productIssues,
    limitations,
    modelCalls,
    feedback,
  };
}

export async function getAnalysisByIdempotencyKey(
  db: D1Database,
  anonymousSessionId: string,
  idempotencyKey: string,
): Promise<PersistedAnalysisResult | null> {
  const row = await db
    .prepare(
      `select id
       from analyses
       where anonymous_session_id = ?
         and idempotency_key = ?
       limit 1`,
    )
    .bind(anonymousSessionId, idempotencyKey)
    .first<D1Row>();

  return row?.id ? getAnalysisById(db, String(row.id)) : null;
}

async function insertAnalysisObservations(
  db: D1Database,
  analysisId: string,
  workspaceId: string | null,
  observations: QAEngineResult["observations"],
) {
  for (const observation of observations) {
    const result = await db
      .prepare(
        `insert into analysis_observations (
          id,
          workspace_id,
          analysis_id,
          check_type,
          status,
          difference_kind,
          reference_observability,
          candidate_observability,
          coverage,
          confidence,
          evidence_json,
          explanation,
          created_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        workspaceId,
        analysisId,
        observation.checkType,
        observation.status,
        observation.differenceKind ?? null,
        observation.observability.reference,
        observation.observability.candidate,
        observation.observability.coverage,
        observation.confidence,
        JSON.stringify(observation.evidence),
        observation.explanation,
        new Date().toISOString(),
      )
      .run();

    if (!result.success) {
      throw new Error(result.error ?? "Failed to insert analysis observation.");
    }
  }
}

async function insertAnalysisIssues(
  db: D1Database,
  analysisId: string,
  workspaceId: string | null,
  issues: QAEngineResult["productIssues"],
) {
  for (const issue of issues) {
    const result = await db
      .prepare(
        `insert into analysis_issues (
          id,
          workspace_id,
          analysis_id,
          observation_id,
          issue_kind,
          issue_type,
          source_check_type,
          source_difference_kind,
          source_reference_observability,
          source_candidate_observability,
          source_coverage,
          severity,
          confidence,
          message,
          evidence_json,
          created_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        workspaceId,
        analysisId,
        null,
        issue.kind,
        issue.type,
        issue.sourceCheckType,
        issue.sourceDifferenceKind ?? null,
        issue.sourceObservability.reference,
        issue.sourceObservability.candidate,
        issue.sourceObservability.coverage,
        issue.severity,
        issue.confidence,
        issue.message,
        JSON.stringify(issue.evidence),
        new Date().toISOString(),
      )
      .run();

    if (!result.success) {
      throw new Error(result.error ?? "Failed to insert analysis issue.");
    }
  }
}

async function insertAnalysisLimitations(
  db: D1Database,
  analysisId: string,
  workspaceId: string | null,
  limitations: QAEngineResult["limitations"],
) {
  for (const limitation of limitations) {
    const result = await db
      .prepare(
        `insert into analysis_limitations (
          id,
          workspace_id,
          analysis_id,
          observation_id,
          limitation_type,
          source_check_type,
          confidence,
          message,
          evidence_json,
          created_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        workspaceId,
        analysisId,
        null,
        limitation.type,
        limitation.sourceCheckType ?? null,
        limitation.confidence,
        limitation.message,
        JSON.stringify(limitation.evidence),
        new Date().toISOString(),
      )
      .run();

    if (!result.success) {
      throw new Error(result.error ?? "Failed to insert analysis limitation.");
    }
  }
}

async function insertAnalysisModelCalls(
  db: D1Database,
  analysisId: string,
  workspaceId: string | null,
  modelCalls: QAEngineResult["modelCalls"],
  modelPolicyVersion: string,
) {
  for (const modelCall of modelCalls) {
    const result = await db
      .prepare(
        `insert into analysis_model_calls (
          id,
          workspace_id,
          analysis_id,
          execution_attempt_id,
          provider,
          model,
          prompt_version,
          model_policy_version,
          purpose,
          input_asset_ids_json,
          input_usage_json,
          output_usage_json,
          latency_ms,
          estimated_cost_usd,
          status,
          error_code,
          error_message,
          created_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        workspaceId,
        analysisId,
        null,
        modelCall.provider,
        modelCall.model,
        modelCall.promptVersion,
        modelPolicyVersion,
        "analysis",
        JSON.stringify(modelCall.inputUsage ?? {}),
        modelCall.inputUsage ? JSON.stringify(modelCall.inputUsage) : null,
        modelCall.outputUsage ? JSON.stringify(modelCall.outputUsage) : null,
        modelCall.latencyMs,
        modelCall.estimatedCostUsd ?? null,
        "completed",
        null,
        null,
        new Date().toISOString(),
      )
      .run();

    if (!result.success) {
      throw new Error(result.error ?? "Failed to insert analysis model call.");
    }
  }
}

async function loadObservations(db: D1Database, analysisId: string): Promise<PersistedAnalysisObservation[]> {
  const result = await db
    .prepare(
      `select
        id,
        check_type as checkType,
        status,
        difference_kind as differenceKind,
        reference_observability as referenceObservability,
        candidate_observability as candidateObservability,
        coverage,
        confidence,
        evidence_json as evidenceJson,
        explanation
      from analysis_observations
      where analysis_id = ?
      order by created_at asc`,
    )
    .bind(analysisId)
    .all<D1Row>();

  return (result.results ?? []).map((row) => ({
    id: String(row.id),
    checkType: row.checkType as PersistedAnalysisObservation["checkType"],
    status: row.status as PersistedAnalysisObservation["status"],
    differenceKind: (row.differenceKind as PersistedAnalysisObservation["differenceKind"]) ?? undefined,
    observability: {
      reference: row.referenceObservability as PersistedAnalysisObservation["observability"]["reference"],
      candidate: row.candidateObservability as PersistedAnalysisObservation["observability"]["candidate"],
      coverage: row.coverage as PersistedAnalysisObservation["observability"]["coverage"],
    },
    confidence: row.confidence as PersistedAnalysisObservation["confidence"],
    evidence: parseJsonObject(row.evidenceJson),
    explanation: String(row.explanation ?? ""),
  }));
}

async function loadIssues(db: D1Database, analysisId: string): Promise<PersistedAnalysisIssue[]> {
  const result = await db
    .prepare(
      `select
        id,
        observation_id as observationId,
        issue_kind as kind,
        issue_type as type,
        source_check_type as sourceCheckType,
        source_difference_kind as sourceDifferenceKind,
        source_reference_observability as sourceReferenceObservability,
        source_candidate_observability as sourceCandidateObservability,
        source_coverage as sourceCoverage,
        severity,
        confidence,
        message,
        evidence_json as evidenceJson
      from analysis_issues
      where analysis_id = ?
      order by created_at asc`,
    )
    .bind(analysisId)
    .all<D1Row>();

  return (result.results ?? []).map((row) => ({
    id: String(row.id),
    observationId: (row.observationId as string | null) ?? null,
    kind: row.kind as PersistedAnalysisIssue["kind"],
    type: row.type as PersistedAnalysisIssue["type"],
    sourceCheckType: String(row.sourceCheckType ?? ""),
    sourceDifferenceKind: (row.sourceDifferenceKind as PersistedAnalysisIssue["sourceDifferenceKind"]) ?? undefined,
    sourceObservability: {
      reference: row.sourceReferenceObservability as PersistedAnalysisIssue["sourceObservability"]["reference"],
      candidate: row.sourceCandidateObservability as PersistedAnalysisIssue["sourceObservability"]["candidate"],
      coverage: row.sourceCoverage as PersistedAnalysisIssue["sourceObservability"]["coverage"],
    },
    severity: row.severity as PersistedAnalysisIssue["severity"],
    confidence: row.confidence as PersistedAnalysisIssue["confidence"],
    message: String(row.message ?? ""),
    evidence: parseJsonObject(row.evidenceJson),
  }));
}

async function loadLimitations(db: D1Database, analysisId: string): Promise<PersistedAnalysisLimitation[]> {
  const result = await db
    .prepare(
      `select
        id,
        observation_id as observationId,
        limitation_type as type,
        source_check_type as sourceCheckType,
        confidence,
        message,
        evidence_json as evidenceJson
      from analysis_limitations
      where analysis_id = ?
      order by created_at asc`,
    )
    .bind(analysisId)
    .all<D1Row>();

  return (result.results ?? []).map((row) => ({
    id: String(row.id),
    observationId: (row.observationId as string | null) ?? null,
    kind: "limitation",
    type: row.type as PersistedAnalysisLimitation["type"],
    sourceCheckType: (row.sourceCheckType as string | null) ?? undefined,
    confidence: row.confidence as PersistedAnalysisLimitation["confidence"],
    message: String(row.message ?? ""),
    evidence: parseJsonObject(row.evidenceJson),
  }));
}

async function loadModelCalls(db: D1Database, analysisId: string): Promise<PersistedAnalysisModelCall[]> {
  const result = await db
    .prepare(
      `select
        id,
        provider,
        model,
        prompt_version as promptVersion,
        model_policy_version as modelPolicyVersion,
        status,
        error_code as errorCode,
        error_message as errorMessage,
        input_asset_ids_json as inputAssetIdsJson,
        input_usage_json as inputUsageJson,
        output_usage_json as outputUsageJson,
        latency_ms as latencyMs,
        estimated_cost_usd as estimatedCostUsd
      from analysis_model_calls
      where analysis_id = ?
      order by created_at asc`,
    )
    .bind(analysisId)
    .all<D1Row>();

  return (result.results ?? []).map((row) => ({
    id: String(row.id),
    provider: String(row.provider),
    model: String(row.model),
    promptVersion: String(row.promptVersion),
    latencyMs: coerceNumber(row.latencyMs) ?? 0,
    estimatedCostUsd: coerceNumber(row.estimatedCostUsd) ?? undefined,
    inputUsage: row.inputUsageJson ? parseJsonObject(row.inputUsageJson) : undefined,
    outputUsage: row.outputUsageJson ? parseJsonObject(row.outputUsageJson) : undefined,
    modelPolicyVersion: (row.modelPolicyVersion as string | null) ?? null,
    purpose: String(row.purpose ?? "analysis"),
    status: row.status as PersistedAnalysisModelCall["status"],
    errorCode: (row.errorCode as string | null) ?? null,
    errorMessage: (row.errorMessage as string | null) ?? null,
    inputAssetIds: parseJsonArray(row.inputAssetIdsJson) as string[],
  }));
}

async function loadFeedback(db: D1Database, analysisId: string): Promise<PersistedAnalysisFeedback | null> {
  const row = await db
    .prepare(
      `select
         id,
         analysis_id as analysisId,
         feedback_kind as feedbackKind,
         reason_code as reasonCode,
         check_family as checkFamily,
         issue_id as issueId,
         comment,
         created_at as createdAt
       from analysis_feedback
       where analysis_id = ?
       order by created_at desc
       limit 1`,
    )
    .bind(analysisId)
    .first<D1Row>();

  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    analysisId: String(row.analysisId),
    feedbackKind: row.feedbackKind as PersistedAnalysisFeedback["feedbackKind"],
    reasonCode: (row.reasonCode as string | null) ?? null,
    checkFamily: (row.checkFamily as string | null) ?? null,
    issueId: (row.issueId as string | null) ?? null,
    comment: (row.comment as string | null) ?? null,
    createdAt: String(row.createdAt),
  };
}

function parseJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string" || value.length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value !== "string" || value.length === 0) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
