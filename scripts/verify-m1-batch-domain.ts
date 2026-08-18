import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";
import { finishAnalysisExecutionAttempt, startAnalysisExecutionAttempt } from "../lib/analysis/attempts";
import {
  ActiveBatchExistsError,
  BatchIdempotencyConflictError,
  cancelQueuedBatchItems,
  createBatch,
  requeueFailedBatchItem,
  restoreFailedBatchItem,
} from "../lib/batches/repository";
import { BatchValidationError } from "../lib/batches/validation";
import type { D1Database, D1PreparedStatement } from "../lib/cloudflare/bindings";

const NOW = new Date("2026-08-11T08:00:00.000Z");
const WORKSPACE_ID = "batch-workspace";

async function main() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("pragma foreign_keys = on");
  for (const migration of ["0001_foundation.sql", "0002_analysis_mvp.sql", "0007_identity_workspaces_credits.sql", "0010_batch_domain.sql", "0011_batch_retention.sql"]) {
    sqlite.exec(await readFile(`migrations/${migration}`, "utf8"));
  }
  seed(sqlite);
  const db = new SqliteD1(sqlite);

  const first = await createBatch(db, {
    batchId: "batch-one-many",
    workspaceId: WORKSPACE_ID,
    idempotencyKey: "request-one-many",
    mappingMode: "one_reference_many_candidates",
    planBatchItemLimit: 20,
    items: [pair("ref-a", "candidate-a"), pair("ref-a", "candidate-b")],
    now: NOW,
  });
  assert.equal(first.resumed, false);
  assert.equal(first.batch.itemCount, 2);
  assert.equal(first.batch.assetRetentionExpiresAt, "2026-08-18T08:00:00.000Z");
  assert.deepEqual(first.batch.items.map((item) => item.position), [0, 1]);

  const resumed = await createBatch(db, {
    batchId: "ignored-on-resume",
    workspaceId: WORKSPACE_ID,
    idempotencyKey: "request-one-many",
    mappingMode: "one_reference_many_candidates",
    planBatchItemLimit: 20,
    items: [pair("ref-a", "candidate-a"), pair("ref-a", "candidate-b")],
    now: NOW,
  });
  assert.equal(resumed.resumed, true);
  assert.equal(resumed.batch.id, first.batch.id);
  assert.equal(count(sqlite, "select count(*) as count from batches"), 1);

  await assert.rejects(
    createBatch(db, {
      batchId: "conflicting-idempotency",
      workspaceId: WORKSPACE_ID,
      idempotencyKey: "request-one-many",
      mappingMode: "one_reference_many_candidates",
      planBatchItemLimit: 20,
      items: [pair("ref-a", "candidate-c")],
    }),
    BatchIdempotencyConflictError,
  );
  await assert.rejects(
    createBatch(db, {
      batchId: "parallel-batch",
      workspaceId: WORKSPACE_ID,
      idempotencyKey: "parallel-request",
      mappingMode: "explicit_pairs",
      planBatchItemLimit: 20,
      items: [pair("ref-b", "candidate-c")],
    }),
    ActiveBatchExistsError,
  );

  sqlite.prepare("update batches set status = 'completed', completed_at = ? where id = ?").run(NOW.toISOString(), first.batch.id);
  const paired = await createBatch(db, {
    batchId: "batch-explicit-pairs",
    workspaceId: WORKSPACE_ID,
    idempotencyKey: "request-explicit-pairs",
    mappingMode: "explicit_pairs",
    planBatchItemLimit: 20,
    items: [pair("ref-a", "candidate-a"), pair("ref-b", "candidate-c")],
    now: NOW,
  });
  assert.equal(paired.batch.itemCount, 2);

  const claimItemId = paired.batch.items[0].id;
  sqlite.prepare(
    `update batch_items set status = 'processing', attempt_count = attempt_count + 1,
      started_at = ?, updated_at = ? where id = ?`,
  ).run(NOW.toISOString(), NOW.toISOString(), claimItemId);
  const claimedItem = sqlite.prepare(
    "select status, attempt_count as attemptCount, analysis_id as analysisId from batch_items where id = ?",
  ).get(claimItemId) as Record<string, unknown>;
  assert.deepEqual({ ...claimedItem }, { status: "processing", attemptCount: 1, analysisId: null });

  await assert.rejects(
    createBatch(db, {
      batchId: "duplicate-candidate",
      workspaceId: "other-workspace",
      idempotencyKey: "duplicate-candidate-request",
      mappingMode: "explicit_pairs",
      planBatchItemLimit: 20,
      items: [pair("other-ref-a", "other-candidate-a"), pair("other-ref-b", "other-candidate-a")],
    }),
    (error: unknown) => error instanceof BatchValidationError && error.code === "batch_duplicate_candidate",
  );
  await assert.rejects(
    createBatch(db, {
      batchId: "wrong-shared-reference",
      workspaceId: "other-workspace",
      idempotencyKey: "wrong-shared-reference-request",
      mappingMode: "one_reference_many_candidates",
      planBatchItemLimit: 20,
      items: [pair("other-ref-a", "other-candidate-a"), pair("other-ref-b", "other-candidate-b")],
    }),
    (error: unknown) => error instanceof BatchValidationError && error.code === "batch_reference_mismatch",
  );
  await assert.rejects(
    createBatch(db, {
      batchId: "free-too-large",
      workspaceId: "other-workspace",
      idempotencyKey: "free-too-large-request",
      mappingMode: "one_reference_many_candidates",
      planBatchItemLimit: 5,
      items: Array.from({ length: 6 }, (_, index) => pair("other-ref-a", `other-candidate-${index}`)),
    }),
    (error: unknown) => error instanceof BatchValidationError && error.code === "batch_item_limit_exceeded",
  );

  const analysisId = "batch-analysis";
  sqlite.prepare(
    `insert into analyses (
      id, workspace_id, reference_asset_id, candidate_asset_id, selected_checks_json,
      status, created_at, updated_at
    ) values (?, ?, ?, ?, '[]', 'running', ?, ?)`,
  ).run(analysisId, WORKSPACE_ID, "ref-b", "candidate-c", NOW.toISOString(), NOW.toISOString());
  sqlite.prepare("update batch_items set analysis_id = ? where id = ?").run(analysisId, claimItemId);
  assert.equal(
    sqlite.prepare("select analysis_id as analysisId from batch_items where id = ?").get(claimItemId)?.analysisId,
    analysisId,
    "A batch item must link the analysis only after the analysis row exists",
  );
  const attempt = await startAnalysisExecutionAttempt({
    db,
    attemptId: "attempt-one",
    analysisId,
    workspaceId: WORKSPACE_ID,
    batchItemId: paired.batch.items[1].id,
    triggerKind: "batch_queue",
    now: NOW,
  });
  assert.equal(attempt?.attemptNumber, 1);
  assert.equal(attempt?.status, "running");
  const completed = await finishAnalysisExecutionAttempt({ db, attemptId: "attempt-one", status: "completed", now: NOW });
  assert.equal(completed?.status, "completed");

  sqlite.prepare(
    `update batch_items set status = 'failed', terminal_error_code = 'provider_error',
      terminal_error_message = 'Provider failed', completed_at = ? where id = ?`,
  ).run(NOW.toISOString(), claimItemId);
  sqlite.prepare("update batch_items set status = 'completed', completed_at = ? where id = ?")
    .run(NOW.toISOString(), paired.batch.items[1].id);
  sqlite.prepare(
    `update batches set status = 'completed_with_errors', completed_item_count = 1,
      failed_item_count = 1, completed_at = ? where id = ?`,
  ).run(NOW.toISOString(), paired.batch.id);

  const retry = await requeueFailedBatchItem(db, paired.batch.id, claimItemId, WORKSPACE_ID, NOW);
  assert.equal(retry?.itemId, claimItemId);
  assert.deepEqual(
    { ...sqlite.prepare("select status, terminal_error_code as errorCode from batch_items where id = ?").get(claimItemId) },
    { status: "queued", errorCode: null },
  );
  assert.equal(
    await requeueFailedBatchItem(db, paired.batch.id, claimItemId, WORKSPACE_ID, NOW),
    null,
    "A failed item may be requeued only once until that retry reaches a terminal state",
  );
  await restoreFailedBatchItem(db, paired.batch.id, claimItemId, WORKSPACE_ID, "Retry enqueue failed", NOW);
  assert.equal(sqlite.prepare("select status from batch_items where id = ?").get(claimItemId)?.status, "failed");
  assert.equal(sqlite.prepare("select status from batches where id = ?").get(paired.batch.id)?.status, "completed_with_errors");

  sqlite.prepare("update batch_items set status = 'queued', completed_at = null where id = ?").run(claimItemId);
  sqlite.prepare("update batches set status = 'processing', completed_at = null where id = ?").run(paired.batch.id);
  const canceled = await cancelQueuedBatchItems(db, paired.batch.id, WORKSPACE_ID, NOW);
  assert.deepEqual(canceled?.canceledItemIds, [claimItemId]);
  assert.equal(canceled?.batch?.status, "canceled");

  sqlite.close();
  console.log("M1 batch domain verification passed.");
  console.log("Verified mapping, idempotency, ownership, limits, execution attempts, cancellation, and single-claim failed-item retry state.");
}

function pair(referenceAssetId: string, candidateAssetId: string) {
  return { referenceAssetId, candidateAssetId };
}

function seed(db: DatabaseSync) {
  for (const workspaceId of [WORKSPACE_ID, "other-workspace"]) {
    db.prepare(
      `insert into workspaces (id, workspace_type, name, status, retention_policy_key, created_at, updated_at)
       values (?, 'personal', ?, 'active', 'authenticated_7d', ?, ?)`,
    ).run(workspaceId, workspaceId, NOW.toISOString(), NOW.toISOString());
  }
  const assets = [
    [WORKSPACE_ID, "ref-a"], [WORKSPACE_ID, "ref-b"], [WORKSPACE_ID, "candidate-a"],
    [WORKSPACE_ID, "candidate-b"], [WORKSPACE_ID, "candidate-c"],
    ["other-workspace", "other-ref-a"], ["other-workspace", "other-ref-b"],
    ...Array.from({ length: 6 }, (_, index) => ["other-workspace", `other-candidate-${index}`]),
    ["other-workspace", "other-candidate-a"], ["other-workspace", "other-candidate-b"],
  ];
  for (const [workspaceId, id] of assets) {
    db.prepare(
      `insert or ignore into assets (
        id, workspace_id, kind, asset_type, mime_type, file_size_bytes, sha256,
        r2_key_original, status, retention_expires_at, created_at, updated_at
      ) values (?, ?, ?, 'image', 'image/png', 100, ?, ?, 'uploaded', ?, ?, ?)`,
    ).run(
      id,
      workspaceId,
      id.startsWith("ref") || id.includes("ref-") ? "reference" : "candidate",
      id,
      `test/${id}`,
      "2026-08-18T08:00:00.000Z",
      NOW.toISOString(),
      NOW.toISOString(),
    );
  }
}

function count(db: DatabaseSync, sql: string) {
  return Number(db.prepare(sql).get()?.count ?? 0);
}

class SqliteD1 implements D1Database {
  constructor(private readonly db: DatabaseSync) {}
  prepare(query: string): D1PreparedStatement { return new SqliteStatement(this.db.prepare(query)); }
  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]> {
    this.db.exec("begin immediate");
    try {
      const results: T[] = [];
      for (const statement of statements) {
        const result = await statement.run();
        if (!result.success) throw new Error(result.error);
        results.push(result as T);
      }
      this.db.exec("commit");
      return results;
    } catch (error) {
      this.db.exec("rollback");
      throw error;
    }
  }
}

class SqliteStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly statement: StatementSync) {}
  bind(...values: unknown[]): D1PreparedStatement { this.values = values; return this; }
  async all<T = Record<string, unknown>>() {
    try { return { results: this.statement.all(...sqliteValues(this.values)) as T[], success: true }; }
    catch (error) { return { results: [], success: false, error: message(error) }; }
  }
  async first<T = Record<string, unknown>>(): Promise<T | null> {
    return (this.statement.get(...sqliteValues(this.values)) as T | undefined) ?? null;
  }
  async run() {
    try { this.statement.run(...sqliteValues(this.values)); return { success: true }; }
    catch (error) { return { success: false, error: message(error) }; }
  }
}

function sqliteValues(values: unknown[]): SQLInputValue[] {
  return values.map((value) => {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "bigint" || value instanceof Uint8Array) return value;
    if (typeof value === "boolean") return value ? 1 : 0;
    throw new TypeError(`Unsupported SQLite verification value: ${typeof value}`);
  });
}

function message(error: unknown) { return error instanceof Error ? error.message : String(error); }

main().catch((error) => { console.error(error); process.exitCode = 1; });
