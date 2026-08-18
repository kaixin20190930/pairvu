import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { deleteAssetsImmediately, deleteExpiredAssets } from "../lib/assets/deletion";
import { listWorkspaceAssets } from "../lib/assets/repository";
import type {
  D1Database,
  D1PreparedStatement,
  R2Bucket,
  R2Object,
  R2ObjectBody,
} from "../lib/cloudflare/bindings";

const REPORT_PATH = "eval/real-m0/reports/retention-verification-latest.json";
const NOW = new Date("2026-07-27T15:00:00.000Z");

async function main() {
  const db = new FakeD1();
  const bucket = new FakeR2();
  const successful = createAsset("retention-success");
  const retryable = createAsset("retention-retry");
  const workspace = createAsset("retention-workspace", "workspace-retention-verification");

  db.assets.set(successful.id, successful);
  db.assets.set(retryable.id, retryable);
  db.assets.set(workspace.id, workspace);
  for (const key of objectKeys(successful).concat(objectKeys(retryable), objectKeys(workspace))) {
    bucket.objects.add(key);
  }
  bucket.failOnceForAsset = retryable.id;

  const firstRun = await deleteExpiredAssets(db, bucket, { now: NOW, batchSize: 10 });
  assert.deepEqual(firstRun, { scanned: 3, deleted: 2, failed: 1, hasMore: false });
  assert.equal(db.assets.get(successful.id)?.status, "deleted");
  assert.equal(db.assets.get(retryable.id)?.status, "uploaded");
  assert.equal(db.assets.get(workspace.id)?.status, "deleted");
  assert.equal(objectKeys(successful).some((key) => bucket.objects.has(key)), false);
  assert.equal(objectKeys(retryable).every((key) => bucket.objects.has(key)), true);
  assert.equal(objectKeys(workspace).some((key) => bucket.objects.has(key)), false);
  assert.deepEqual(
    await listWorkspaceAssets(db, "workspace-retention-verification"),
    [],
    "Deleted assets must not be returned by retained-reference or preview listings",
  );

  const secondRun = await deleteExpiredAssets(db, bucket, { now: NOW, batchSize: 10 });
  assert.deepEqual(secondRun, { scanned: 1, deleted: 1, failed: 0, hasMore: false });
  assert.equal(db.assets.get(retryable.id)?.status, "deleted");
  assert.equal(objectKeys(retryable).some((key) => bucket.objects.has(key)), false);

  const thirdRun = await deleteExpiredAssets(db, bucket, { now: NOW, batchSize: 10 });
  assert.deepEqual(thirdRun, { scanned: 0, deleted: 0, failed: 0, hasMore: false });

  const immediate = createAsset("retention-user-deletion", "workspace-retention-verification");
  immediate.retentionExpiresAt = "2030-01-01T00:00:00.000Z";
  db.assets.set(immediate.id, immediate);
  objectKeys(immediate).forEach((key) => bucket.objects.add(key));
  const immediateRun = await deleteAssetsImmediately(db, bucket, [immediate], NOW);
  assert.deepEqual(immediateRun, { requested: 1, deleted: 1, failed: 0 });
  assert.equal(db.assets.get(immediate.id)?.status, "deleted");
  assert.equal(objectKeys(immediate).some((key) => bucket.objects.has(key)), false);

  const attempts = [...db.attempts.values()];
  assert.equal(attempts.filter((attempt) => attempt.status === "completed").length, 4);
  assert.equal(attempts.filter((attempt) => attempt.status === "failed").length, 1);

  const report = {
    generatedAt: new Date().toISOString(),
    firstRun,
    secondRun,
    thirdRun,
    immediateRun,
    originalAndDerivativesUnavailable: true,
    retryPreservedUntilSuccess: true,
    workspaceAssetDeleted: true,
    deletedAssetsExcludedFromListings: true,
    completedAttempts: 4,
    failedAttempts: 1,
  };

  await mkdir("eval/real-m0/reports", { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Retention verification passed: ${REPORT_PATH}`);
}

interface FakeAsset {
  id: string;
  originalFileName: string | null;
  workspaceId: string | null;
  anonymousSessionId: string | null;
  kind: "reference";
  assetType: "image";
  mimeType: string;
  fileSizeBytes: number;
  sha256: string;
  r2KeyOriginal: string;
  r2KeyNormalized: string;
  r2KeyThumbnail: string;
  status: "uploaded" | "deleted";
  retentionExpiresAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface FakeAttempt {
  id: string;
  assetId: string;
  status: "started" | "completed" | "failed";
  objectKeysJson: string;
  errorMessage: string | null;
}

function createAsset(id: string, workspaceId: string | null = null): FakeAsset {
  const prefix = workspaceId
    ? `workspace/${workspaceId}/reference/${id}`
    : `anonymous/retention-verification/reference/${id}`;
  return {
    id,
    originalFileName: `${id}.jpg`,
    workspaceId,
    anonymousSessionId: workspaceId ? null : "retention-verification",
    kind: "reference",
    assetType: "image",
    mimeType: "image/jpeg",
    fileSizeBytes: 10,
    sha256: id,
    r2KeyOriginal: `${prefix}/original`,
    r2KeyNormalized: `${prefix}/normalized`,
    r2KeyThumbnail: `${prefix}/thumbnail`,
    status: "uploaded",
    retentionExpiresAt: "2020-01-01T00:00:00.000Z",
    createdAt: "2020-01-01T00:00:00.000Z",
    updatedAt: "2020-01-01T00:00:00.000Z",
    deletedAt: null,
  };
}

function objectKeys(asset: FakeAsset): string[] {
  return [asset.r2KeyOriginal, asset.r2KeyNormalized, asset.r2KeyThumbnail];
}

class FakeR2 implements R2Bucket {
  readonly objects = new Set<string>();
  failOnceForAsset: string | null = null;

  async put(): Promise<R2Object | null> {
    throw new Error("Not implemented for retention verification.");
  }

  async get(key: string): Promise<R2ObjectBody | null> {
    if (!this.objects.has(key)) {
      return null;
    }
    throw new Error("Body reads are not implemented for retention verification.");
  }

  async delete(keys: string | string[]): Promise<void> {
    const values = Array.isArray(keys) ? keys : [keys];
    if (this.failOnceForAsset && values.some((key) => key.includes(this.failOnceForAsset!))) {
      this.failOnceForAsset = null;
      throw new Error("Injected R2 deletion failure");
    }
    values.forEach((key) => this.objects.delete(key));
  }
}

class FakeD1 implements D1Database {
  readonly assets = new Map<string, FakeAsset>();
  readonly attempts = new Map<string, FakeAttempt>();

  prepare(query: string): D1PreparedStatement {
    return new FakeStatement(this, query);
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]> {
    return Promise.all(statements.map((statement) => statement.run())) as Promise<T[]>;
  }
}

class FakeStatement implements D1PreparedStatement {
  private values: unknown[] = [];

  constructor(
    private readonly db: FakeD1,
    private readonly query: string,
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    this.values = values;
    return this;
  }

  async all<T = Record<string, unknown>>(): Promise<{
    results: T[];
    success: boolean;
    error?: string;
    meta?: Record<string, unknown>;
  }> {
    if (!this.query.includes("from assets")) {
      return { results: [], success: false, error: "Unexpected all() query" };
    }
    if (this.query.includes("from assets a")) {
      const workspaceId = String(this.values[0]);
      const rows = [...this.db.assets.values()].filter(
        (asset) => asset.workspaceId === workspaceId && asset.status !== "deleted",
      );
      return { results: rows as T[], success: true };
    }
    const expiresBefore = String(this.values[0]);
    const limit = Number(this.values[1]);
    const rows = [...this.db.assets.values()]
      .filter(
        (asset) =>
          asset.retentionExpiresAt <= expiresBefore &&
          asset.status !== "deleted",
      )
      .slice(0, limit);
    return { results: rows as T[], success: true };
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    return null;
  }

  async run(): Promise<{ success: boolean; error?: string; meta?: Record<string, unknown> }> {
    const normalized = this.query.replace(/\s+/g, " ").trim().toLowerCase();

    if (normalized.startsWith("insert into asset_deletion_attempts")) {
      const [id, assetId, objectKeysJson] = this.values.map(String);
      this.db.attempts.set(id, {
        id,
        assetId,
        status: "started",
        objectKeysJson,
        errorMessage: null,
      });
      return { success: true };
    }

    if (normalized.startsWith("update assets set status")) {
      const [status, deletedAt, updatedAt, assetId] = this.values.map(String);
      const asset = this.db.assets.get(assetId);
      if (!asset) {
        return { success: false, error: "Asset missing" };
      }
      asset.status = status as FakeAsset["status"];
      asset.deletedAt = deletedAt;
      asset.updatedAt = updatedAt;
      return { success: true };
    }

    if (normalized.includes("set status = 'completed'")) {
      const attemptId = String(this.values[2]);
      const attempt = this.db.attempts.get(attemptId);
      if (!attempt) {
        return { success: false, error: "Attempt missing" };
      }
      attempt.status = "completed";
      return { success: true };
    }

    if (normalized.includes("set status = 'failed'")) {
      const attemptId = String(this.values[3]);
      const attempt = this.db.attempts.get(attemptId);
      if (!attempt) {
        return { success: false, error: "Attempt missing" };
      }
      attempt.status = "failed";
      attempt.errorMessage = String(this.values[0]);
      return { success: true };
    }

    return { success: false, error: "Unexpected run() query" };
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Retention verification failed.");
  process.exitCode = 1;
});
