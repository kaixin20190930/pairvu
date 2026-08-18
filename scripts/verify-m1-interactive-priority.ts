import assert from "node:assert/strict";
import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";
import { enforceAuthenticatedAnalysisGuard, PublicBetaAccessError } from "../lib/public-beta/guards";
import type { D1Database, D1PreparedStatement, VisualQACloudflareEnv } from "../lib/cloudflare/bindings";
import { runWithInteractiveNetworkRetry } from "../lib/analysis/transient-retry";

const WORKSPACE_ID = "workspace-priority";

async function main() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    create table analyses (
      id text primary key,
      workspace_id text,
      anonymous_session_id text,
      status text not null,
      created_at text not null,
      estimated_cost_usd real
    );
    create table analysis_execution_attempts (
      id text primary key,
      analysis_id text not null,
      batch_item_id text,
      status text not null,
      trigger_kind text not null
    );
  `);
  const db = new SqliteD1(sqlite);
  const env = {
    PUBLIC_ANALYSIS_GLOBAL_DAILY_LIMIT: "50",
    PUBLIC_ANALYSIS_GLOBAL_CONCURRENT_LIMIT: "3",
    PUBLIC_ANALYSIS_SESSION_CONCURRENT_LIMIT: "1",
    PUBLIC_ANALYSIS_GLOBAL_DAILY_SPEND_LIMIT_USD: "25",
  } as VisualQACloudflareEnv;

  insertRunning(sqlite, "batch-analysis", "batch_queue", WORKSPACE_ID, "batch-item-1");
  await enforceAuthenticatedAnalysisGuard(db, env, { workspaceId: WORKSPACE_ID });

  insertRunning(sqlite, "interactive-retry", "retry");
  await assert.rejects(
    enforceAuthenticatedAnalysisGuard(db, env, { workspaceId: WORKSPACE_ID }),
    (error) => error instanceof PublicBetaAccessError && error.code === "analysis_session_concurrency_limited",
  );
  sqlite.prepare("delete from analysis_execution_attempts where analysis_id = 'interactive-retry'").run();
  sqlite.prepare("delete from analyses where id = 'interactive-retry'").run();

  insertRunning(sqlite, "interactive-analysis", "interactive");
  await assert.rejects(
    enforceAuthenticatedAnalysisGuard(db, env, { workspaceId: WORKSPACE_ID }),
    (error) => error instanceof PublicBetaAccessError && error.code === "analysis_session_concurrency_limited",
  );

  sqlite.prepare("update analyses set workspace_id = 'another-workspace' where id = 'interactive-analysis'").run();
  insertRunning(sqlite, "global-third-analysis", "batch_queue", "another-workspace", "batch-item-2");
  await assert.rejects(
    enforceAuthenticatedAnalysisGuard(db, env, { workspaceId: WORKSPACE_ID }),
    (error) => error instanceof PublicBetaAccessError && error.code === "analysis_global_concurrency_limited",
  );

  let interactiveCalls = 0;
  const retryWaits: number[] = [];
  const recovered = await runWithInteractiveNetworkRetry(
    async () => {
      interactiveCalls += 1;
      if (interactiveCalls === 1) {
        throw Object.assign(new Error("403 Network connection lost."), { status: 403 });
      }
      return "completed";
    },
    "interactive",
    async (milliseconds) => { retryWaits.push(milliseconds); },
  );
  assert.equal(recovered, "completed");
  assert.equal(interactiveCalls, 2);
  assert.deepEqual(retryWaits, [1_000]);

  let batchCalls = 0;
  await assert.rejects(
    runWithInteractiveNetworkRetry(
      async () => {
        batchCalls += 1;
        throw Object.assign(new Error("403 Network connection lost."), { status: 403 });
      },
      "batch_queue",
      async () => undefined,
    ),
    /Network connection lost/,
  );
  assert.equal(batchCalls, 1);

  let authorizationCalls = 0;
  await assert.rejects(
    runWithInteractiveNetworkRetry(
      async () => {
        authorizationCalls += 1;
        throw Object.assign(new Error("403 Invalid API credentials."), { status: 403 });
      },
      "interactive",
      async () => undefined,
    ),
    /Invalid API credentials/,
  );
  assert.equal(authorizationCalls, 1);

  console.log("M1 interactive-priority verification passed.");
  console.log("Verified batch isolation, bounded interactive network retry, workspace protection, and the retained global cap.");
}

function insertRunning(
  sqlite: DatabaseSync,
  id: string,
  triggerKind: string,
  workspaceId = WORKSPACE_ID,
  batchItemId: string | null = null,
) {
  sqlite.prepare(
    "insert into analyses (id, workspace_id, status, created_at, estimated_cost_usd) values (?, ?, 'running', ?, 0)",
  ).run(id, workspaceId, new Date().toISOString());
  sqlite.prepare(
    "insert into analysis_execution_attempts (id, analysis_id, batch_item_id, status, trigger_kind) values (?, ?, ?, 'running', ?)",
  ).run(`attempt-${id}`, id, batchItemId, triggerKind);
}

class SqliteD1 implements D1Database {
  constructor(private readonly db: DatabaseSync) {}
  prepare(query: string): D1PreparedStatement { return new SqliteStatement(this.db.prepare(query)); }
  async batch<T = unknown>(): Promise<T[]> { throw new Error("Not implemented for this verification."); }
}

class SqliteStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly statement: StatementSync) {}
  bind(...values: unknown[]): D1PreparedStatement { this.values = values; return this; }
  async first<T = Record<string, unknown>>(): Promise<T | null> {
    return (this.statement.get(...sqliteValues(this.values)) as T | undefined) ?? null;
  }
  async all<T = Record<string, unknown>>() {
    return { results: this.statement.all(...sqliteValues(this.values)) as T[], success: true };
  }
  async run() { this.statement.run(...sqliteValues(this.values)); return { success: true }; }
}

function sqliteValues(values: unknown[]): SQLInputValue[] {
  return values as SQLInputValue[];
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
