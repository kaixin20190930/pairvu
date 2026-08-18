import type { D1Database } from "@/lib/cloudflare/bindings";

export type ExecutionAttemptTrigger = "interactive" | "batch_queue" | "retry";

export interface AnalysisExecutionAttempt {
  id: string;
  workspaceId: string | null;
  analysisId: string;
  batchItemId: string | null;
  attemptNumber: number;
  status: "running" | "completed" | "failed";
  triggerKind: ExecutionAttemptTrigger;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}
export async function startAnalysisExecutionAttempt(input: {
  db: D1Database;
  attemptId: string;
  analysisId: string;
  workspaceId?: string;
  batchItemId?: string;
  triggerKind: ExecutionAttemptTrigger;
  now?: Date;
}) {
  const timestamp = (input.now ?? new Date()).toISOString();
  const next = await input.db
    .prepare(
      `select coalesce(max(attempt_number), 0) + 1 as attemptNumber
       from analysis_execution_attempts where analysis_id = ?`,
    )
    .bind(input.analysisId)
    .first<{ attemptNumber: number }>();
  const attemptNumber = Number(next?.attemptNumber ?? 1);
  const result = await input.db
    .prepare(
      `insert into analysis_execution_attempts (
        id, workspace_id, analysis_id, batch_item_id, attempt_number, status,
        trigger_kind, started_at, created_at, updated_at
      ) values (?, ?, ?, ?, ?, 'running', ?, ?, ?, ?)`
    )
    .bind(
      input.attemptId,
      input.workspaceId ?? null,
      input.analysisId,
      input.batchItemId ?? null,
      attemptNumber,
      input.triggerKind,
      timestamp,
      timestamp,
      timestamp,
    )
    .run();
  if (!result.success) throw new Error(`Execution attempt persistence failed: ${result.error ?? "unknown D1 error"}`);
  return getAnalysisExecutionAttempt(input.db, input.attemptId);
}

export async function finishAnalysisExecutionAttempt(input: {
  db: D1Database;
  attemptId: string;
  status: "completed" | "failed";
  errorCode?: string;
  errorMessage?: string;
  now?: Date;
}) {
  const timestamp = (input.now ?? new Date()).toISOString();
  const result = await input.db
    .prepare(
      `update analysis_execution_attempts
       set status = ?, error_code = ?, error_message = ?, completed_at = ?, updated_at = ?
       where id = ? and status = 'running'`,
    )
    .bind(
      input.status,
      input.errorCode ?? null,
      input.errorMessage ?? null,
      timestamp,
      timestamp,
      input.attemptId,
    )
    .run();
  if (!result.success) throw new Error(`Execution attempt update failed: ${result.error ?? "unknown D1 error"}`);
  return getAnalysisExecutionAttempt(input.db, input.attemptId);
}

export async function getAnalysisExecutionAttempt(db: D1Database, attemptId: string) {
  return db
    .prepare(
      `select id, workspace_id as workspaceId, analysis_id as analysisId,
        batch_item_id as batchItemId, attempt_number as attemptNumber, status,
        trigger_kind as triggerKind, error_code as errorCode, error_message as errorMessage,
        started_at as startedAt, completed_at as completedAt
       from analysis_execution_attempts where id = ? limit 1`,
    )
    .bind(attemptId)
    .first<AnalysisExecutionAttempt>();
}
