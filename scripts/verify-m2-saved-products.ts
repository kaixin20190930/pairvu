import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";
import { listAnalysisAssets, listBatchAssets } from "../lib/assets/repository";
import { createBatch } from "../lib/batches/repository";
import { BatchValidationError } from "../lib/batches/validation";
import type { D1Database, D1PreparedStatement } from "../lib/cloudflare/bindings";
import {
  createSavedProduct,
  getSavedProductById,
  listSelectableSavedProducts,
  promoteSavedProductReference,
  SavedProductError,
} from "../lib/products/repository";

const NOW = new Date("2026-09-01T08:00:00.000Z");
const WORKSPACE = "workspace-primary";
const OTHER_WORKSPACE = "workspace-other";

async function main() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("pragma foreign_keys = on");
  for (const migration of [
    "0001_foundation.sql", "0002_analysis_mvp.sql", "0007_identity_workspaces_credits.sql",
    "0010_batch_domain.sql", "0011_batch_retention.sql", "0012_asset_original_filename.sql",
    "0017_saved_products.sql",
  ]) sqlite.exec(await readFile(`migrations/${migration}`, "utf8"));
  seed(sqlite);
  const db = new SqliteD1(sqlite);

  const created = await createSavedProduct(db, {
    productId: "product-one", workspaceId: WORKSPACE, name: "  Foldwell   Fresh Linen  ",
    skuLabel: " FW-30 ", referenceAssetId: "ref-v1", now: NOW,
  });
  assert.equal(created.resumed, false);
  assert.equal(created.product.name, "Foldwell Fresh Linen");
  assert.equal(created.product.skuLabel, "FW-30");
  assert.equal(created.product.currentReference?.versionNumber, 1);
  assert.equal(created.product.currentReference?.imageAvailable, true);

  const resumed = await createSavedProduct(db, {
    productId: "product-one", workspaceId: WORKSPACE, name: "Foldwell Fresh Linen",
    skuLabel: "FW-30", referenceAssetId: "ref-v1", now: NOW,
  });
  assert.equal(resumed.resumed, true);
  assert.equal(count(sqlite, "select count(*) as count from products"), 1);

  await assert.rejects(
    createSavedProduct(db, {
      productId: "product-duplicate-sku", workspaceId: WORKSPACE, name: "Duplicate",
      skuLabel: "fw-30", referenceAssetId: "ref-v2", now: NOW,
    }),
    (error: unknown) => error instanceof SavedProductError && error.code === "duplicate_product_sku",
  );
  await assert.rejects(
    createSavedProduct(db, {
      productId: "product-cross-workspace", workspaceId: WORKSPACE, name: "Wrong owner",
      referenceAssetId: "other-ref", now: NOW,
    }),
    (error: unknown) => error instanceof SavedProductError && error.code === "reference_asset_not_found",
  );
  await assert.rejects(
    createSavedProduct(db, {
      productId: "product-candidate-reference", workspaceId: WORKSPACE, name: "Candidate reference",
      referenceAssetId: "candidate-a", now: NOW,
    }),
    (error: unknown) => error instanceof SavedProductError && error.code === "invalid_reference_asset",
  );
  await assert.rejects(
    createSavedProduct(db, {
      productId: "product-expired-reference", workspaceId: WORKSPACE, name: "Expired reference",
      referenceAssetId: "expired-ref", now: NOW,
    }),
    (error: unknown) => error instanceof SavedProductError && error.code === "reference_asset_unavailable",
  );

  const promoted = await promoteSavedProductReference(db, {
    productId: "product-one", workspaceId: WORKSPACE, referenceAssetId: "ref-v2", now: NOW,
  });
  assert.equal(promoted.resumed, false);
  assert.equal(promoted.product.currentReference?.versionNumber, 2);
  assert.deepEqual(promoted.product.referenceVersions.map((version) => version.status), ["current", "superseded"]);
  assert.equal(count(sqlite, "select count(*) as count from product_reference_versions where status = 'current'"), 1);
  assert.equal((await listSelectableSavedProducts(db, WORKSPACE, NOW)).length, 1);

  const batch = await createBatch(db, {
    batchId: "saved-product-batch", workspaceId: WORKSPACE, idempotencyKey: "saved-product-request",
    mappingMode: "one_reference_many_candidates", productId: "product-one", planBatchItemLimit: 20,
    items: [{ referenceAssetId: "ref-v2", candidateAssetId: "candidate-a" }], now: NOW,
  });
  assert.equal(batch.batch.productId, "product-one");
  assert.equal(batch.batch.productName, "Foldwell Fresh Linen");
  assert.equal((await getSavedProductById(db, "product-one", WORKSPACE, NOW))?.batchCount, 1);
  assert.deepEqual((await listBatchAssets(db, batch.batch.id, WORKSPACE)).map((asset) => asset.id), ["candidate-a"]);
  sqlite.prepare(
    `insert into analyses (
      id, workspace_id, reference_asset_id, candidate_asset_id, selected_checks_json, status, created_at, updated_at
     ) values ('saved-product-analysis', ?, 'ref-v2', 'candidate-a', '[]', 'completed', ?, ?)`,
  ).run(WORKSPACE, NOW.toISOString(), NOW.toISOString());
  assert.deepEqual(
    (await listAnalysisAssets(db, "saved-product-analysis", WORKSPACE)).map((asset) => asset.id),
    ["candidate-a"],
  );

  sqlite.prepare("update batches set status = 'completed' where id = ?").run(batch.batch.id);
  await assert.rejects(
    createBatch(db, {
      batchId: "stale-reference-batch", workspaceId: WORKSPACE, idempotencyKey: "stale-reference-request",
      mappingMode: "one_reference_many_candidates", productId: "product-one", planBatchItemLimit: 20,
      items: [{ referenceAssetId: "ref-v1", candidateAssetId: "candidate-b" }], now: NOW,
    }),
    (error: unknown) => error instanceof SavedProductError && error.code === "product_reference_changed",
  );
  await assert.rejects(
    createBatch(db, {
      batchId: "invalid-product-mode", workspaceId: WORKSPACE, idempotencyKey: "invalid-product-mode-request",
      mappingMode: "explicit_pairs", productId: "product-one", planBatchItemLimit: 20,
      items: [{ referenceAssetId: "ref-v2", candidateAssetId: "candidate-b" }], now: NOW,
    }),
    (error: unknown) => error instanceof BatchValidationError && error.code === "product_mapping_mode_invalid",
  );

  sqlite.prepare("update assets set retention_expires_at = ? where id = 'ref-v2'").run("2026-08-31T08:00:00.000Z");
  const expiredProduct = await getSavedProductById(db, "product-one", WORKSPACE, NOW);
  assert.equal(expiredProduct?.currentReference?.imageAvailable, false);
  assert.equal((await listSelectableSavedProducts(db, WORKSPACE, NOW)).length, 0);

  sqlite.close();
  console.log("M2 Saved Product verification passed.");
  console.log("Verified ownership, idempotency, SKU uniqueness, reference versions, expiry, batch reuse, and deletion protection.");
}

function seed(db: DatabaseSync) {
  for (const id of [WORKSPACE, OTHER_WORKSPACE]) db.prepare(
    `insert into workspaces (id, workspace_type, name, status, retention_policy_key, created_at, updated_at)
     values (?, 'personal', ?, 'active', 'paid_30d', ?, ?)`,
  ).run(id, id, NOW.toISOString(), NOW.toISOString());
  const assets = [
    ["ref-v1", WORKSPACE, "reference", "2026-10-01T08:00:00.000Z"],
    ["ref-v2", WORKSPACE, "reference", "2026-10-01T08:00:00.000Z"],
    ["expired-ref", WORKSPACE, "reference", "2026-08-31T08:00:00.000Z"],
    ["candidate-a", WORKSPACE, "candidate", "2026-10-01T08:00:00.000Z"],
    ["candidate-b", WORKSPACE, "candidate", "2026-10-01T08:00:00.000Z"],
    ["other-ref", OTHER_WORKSPACE, "reference", "2026-10-01T08:00:00.000Z"],
  ];
  for (const [id, workspaceId, kind, expiry] of assets) db.prepare(
    `insert into assets (
      id, original_file_name, workspace_id, kind, asset_type, mime_type, file_size_bytes, sha256,
      r2_key_original, status, retention_expires_at, created_at, updated_at
     ) values (?, ?, ?, ?, 'image', 'image/png', 100, ?, ?, 'uploaded', ?, ?, ?)`,
  ).run(id, `${id}.png`, workspaceId, kind, id, `test/${id}`, expiry, NOW.toISOString(), NOW.toISOString());
}

function count(db: DatabaseSync, sql: string) { return Number(db.prepare(sql).get()?.count ?? 0); }

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
      this.db.exec("commit"); return results;
    } catch (error) { this.db.exec("rollback"); throw error; }
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
