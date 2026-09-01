import type { D1Database } from "@/lib/cloudflare/bindings";
import type {
  SavedProductBatchHistory,
  SavedProductDetail,
  SavedProductOption,
  SavedProductReferenceVersion,
  SavedProductSummary,
} from "@/lib/products/types";

export class SavedProductError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "SavedProductError";
  }
}

interface ProductRow {
  id: string;
  workspaceId: string;
  name: string;
  skuLabel: string | null;
  createdAt: string;
  updatedAt: string;
  referenceVersionCount: number;
  batchCount: number;
  lastBatchAt: string | null;
}

interface ReferenceRow {
  id: string;
  assetId: string;
  versionNumber: number;
  status: "current" | "superseded";
  originalFileName: string | null;
  retentionExpiresAt: string | null;
  assetStatus: string;
  createdAt: string;
  promotedAt: string;
}

export async function createSavedProduct(
  db: D1Database,
  input: {
    productId: string;
    workspaceId: string;
    name: string;
    skuLabel?: string | null;
    referenceAssetId: string;
    now?: Date;
  },
): Promise<{ product: SavedProductDetail; resumed: boolean }> {
  const name = normalizeName(input.name);
  const { skuLabel, skuKey } = normalizeSku(input.skuLabel);
  const existing = await getSavedProductById(db, input.productId, input.workspaceId, input.now);
  if (existing) {
    if (
      existing.name === name &&
      existing.skuLabel === skuLabel &&
      existing.currentReference?.assetId === input.referenceAssetId
    ) {
      return { product: existing, resumed: true };
    }
    throw new SavedProductError(
      "product_idempotency_conflict",
      "This product request key is already associated with different product details.",
      409,
    );
  }

  await assertReferenceAssetAvailable(db, input.workspaceId, input.referenceAssetId, input.now);
  const timestamp = (input.now ?? new Date()).toISOString();
  const results = await runProductBatch(db, [
    db.prepare(
      `insert into products (id, workspace_id, name, sku_label, sku_key, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(input.productId, input.workspaceId, name, skuLabel, skuKey, timestamp, timestamp),
    db.prepare(
      `insert into product_reference_versions (
        id, workspace_id, product_id, asset_id, version_number, status, created_at, promoted_at
       ) values (?, ?, ?, ?, 1, 'current', ?, ?)`,
    ).bind(crypto.randomUUID(), input.workspaceId, input.productId, input.referenceAssetId, timestamp, timestamp),
  ]);
  assertBatchSucceeded(results, "product_create_failed");

  const product = await getSavedProductById(db, input.productId, input.workspaceId, input.now);
  if (!product) throw new Error("Saved Product was created but could not be reloaded.");
  return { product, resumed: false };
}

export async function promoteSavedProductReference(
  db: D1Database,
  input: { productId: string; workspaceId: string; referenceAssetId: string; now?: Date },
): Promise<{ product: SavedProductDetail; resumed: boolean }> {
  const product = await getSavedProductById(db, input.productId, input.workspaceId, input.now);
  if (!product) throw new SavedProductError("product_not_found", "Saved Product not found.", 404);
  if (product.currentReference?.assetId === input.referenceAssetId) return { product, resumed: true };

  await assertReferenceAssetAvailable(db, input.workspaceId, input.referenceAssetId, input.now);
  const timestamp = (input.now ?? new Date()).toISOString();
  const nextVersion = Math.max(0, ...product.referenceVersions.map((version) => version.versionNumber)) + 1;
  const results = await runProductBatch(db, [
    db.prepare(
      `update product_reference_versions set status = 'superseded'
       where product_id = ? and workspace_id = ? and status = 'current'`,
    ).bind(input.productId, input.workspaceId),
    db.prepare(
      `insert into product_reference_versions (
        id, workspace_id, product_id, asset_id, version_number, status, created_at, promoted_at
       ) values (?, ?, ?, ?, ?, 'current', ?, ?)`,
    ).bind(
      crypto.randomUUID(), input.workspaceId, input.productId, input.referenceAssetId,
      nextVersion, timestamp, timestamp,
    ),
    db.prepare(`update products set updated_at = ? where id = ? and workspace_id = ?`)
      .bind(timestamp, input.productId, input.workspaceId),
  ]);
  assertBatchSucceeded(results, "reference_promotion_failed");

  const updated = await getSavedProductById(db, input.productId, input.workspaceId, input.now);
  if (!updated) throw new Error("Saved Product reference was promoted but could not be reloaded.");
  return { product: updated, resumed: false };
}

export async function listSavedProducts(
  db: D1Database,
  workspaceId: string,
  now = new Date(),
): Promise<SavedProductSummary[]> {
  const rows = await db.prepare(productSelect("p.workspace_id = ?") + " order by p.updated_at desc")
    .bind(workspaceId).all<ProductRow>();
  const products: SavedProductSummary[] = [];
  for (const row of rows.results) {
    const versions = await listReferenceVersions(db, row.id, workspaceId, now);
    products.push(mapProduct(row, versions.find((version) => version.status === "current") ?? null));
  }
  return products;
}

export async function listSelectableSavedProducts(
  db: D1Database,
  workspaceId: string,
  now = new Date(),
): Promise<SavedProductOption[]> {
  const products = await listSavedProducts(db, workspaceId, now);
  return products.flatMap((product) => product.currentReference?.imageAvailable
    ? [{ id: product.id, name: product.name, skuLabel: product.skuLabel, currentReference: product.currentReference }]
    : []);
}

export async function getSavedProductById(
  db: D1Database,
  productId: string,
  workspaceId: string,
  now = new Date(),
): Promise<SavedProductDetail | null> {
  const row = await db.prepare(productSelect("p.id = ? and p.workspace_id = ?") + " limit 1")
    .bind(productId, workspaceId).first<ProductRow>();
  if (!row) return null;
  const referenceVersions = await listReferenceVersions(db, productId, workspaceId, now);
  const batchRows = await db.prepare(
    `select id, status, item_count as itemCount, completed_item_count as completedItemCount,
      failed_item_count as failedItemCount, created_at as createdAt
     from batches where product_id = ? and workspace_id = ? order by created_at desc limit 25`,
  ).bind(productId, workspaceId).all<SavedProductBatchHistory>();
  return {
    ...mapProduct(row, referenceVersions.find((version) => version.status === "current") ?? null),
    referenceVersions,
    batches: batchRows.results.map((batch) => ({
      ...batch,
      itemCount: Number(batch.itemCount),
      completedItemCount: Number(batch.completedItemCount),
      failedItemCount: Number(batch.failedItemCount),
    })),
  };
}

export async function assertSavedProductBatchReference(
  db: D1Database,
  input: { productId: string; workspaceId: string; referenceAssetId: string; now?: Date },
) {
  const product = await getSavedProductById(db, input.productId, input.workspaceId, input.now);
  if (!product) throw new SavedProductError("product_not_found", "Saved Product not found.", 404);
  const current = product.currentReference;
  if (!current?.imageAvailable) {
    throw new SavedProductError(
      "product_reference_unavailable",
      "This Saved Product needs a new approved reference before it can be reused.",
      409,
    );
  }
  if (current.assetId !== input.referenceAssetId) {
    throw new SavedProductError(
      "product_reference_changed",
      "The approved reference changed while this batch was being prepared. Review the current version and try again.",
      409,
    );
  }
  return current;
}

async function assertReferenceAssetAvailable(
  db: D1Database,
  workspaceId: string,
  assetId: string,
  now = new Date(),
) {
  const asset = await db.prepare(
    `select id, kind, asset_type as assetType, status, retention_expires_at as retentionExpiresAt
     from assets where id = ? and workspace_id = ? limit 1`,
  ).bind(assetId, workspaceId).first<{
    id: string; kind: string; assetType: string; status: string; retentionExpiresAt: string | null;
  }>();
  if (!asset) throw new SavedProductError("reference_asset_not_found", "Approved reference image not found.", 404);
  if (asset.kind !== "reference" || asset.assetType !== "image") {
    throw new SavedProductError("invalid_reference_asset", "Saved Products require an approved reference image.");
  }
  if (["deleted", "failed"].includes(asset.status) || !asset.retentionExpiresAt || asset.retentionExpiresAt <= now.toISOString()) {
    throw new SavedProductError("reference_asset_unavailable", "This reference image is no longer available.", 409);
  }
  return asset;
}

async function listReferenceVersions(
  db: D1Database,
  productId: string,
  workspaceId: string,
  now: Date,
) {
  const rows = await db.prepare(
    `select prv.id, prv.asset_id as assetId, prv.version_number as versionNumber, prv.status,
      a.original_file_name as originalFileName, a.retention_expires_at as retentionExpiresAt,
      a.status as assetStatus, prv.created_at as createdAt, prv.promoted_at as promotedAt
     from product_reference_versions prv join assets a on a.id = prv.asset_id
     where prv.product_id = ? and prv.workspace_id = ? order by prv.version_number desc`,
  ).bind(productId, workspaceId).all<ReferenceRow>();
  const timestamp = now.toISOString();
  return rows.results.map<SavedProductReferenceVersion>((row) => {
    const imageAvailable = !["deleted", "failed"].includes(row.assetStatus)
      && Boolean(row.retentionExpiresAt)
      && row.retentionExpiresAt! > timestamp;
    return {
      id: row.id,
      assetId: row.assetId,
      versionNumber: Number(row.versionNumber),
      status: row.status,
      originalFileName: row.originalFileName,
      retentionExpiresAt: row.retentionExpiresAt,
      imageAvailable,
      previewUrl: imageAvailable ? `/api/assets/${row.assetId}` : null,
      createdAt: row.createdAt,
      promotedAt: row.promotedAt,
    };
  });
}

function productSelect(where: string) {
  return `select p.id, p.workspace_id as workspaceId, p.name, p.sku_label as skuLabel,
    p.created_at as createdAt, p.updated_at as updatedAt,
    (select count(*) from product_reference_versions prv where prv.product_id = p.id) as referenceVersionCount,
    (select count(*) from batches b where b.product_id = p.id) as batchCount,
    (select max(b.created_at) from batches b where b.product_id = p.id) as lastBatchAt
   from products p where ${where}`;
}

function mapProduct(row: ProductRow, currentReference: SavedProductReferenceVersion | null): SavedProductSummary {
  return {
    ...row,
    referenceVersionCount: Number(row.referenceVersionCount),
    batchCount: Number(row.batchCount),
    currentReference,
  };
}

function normalizeName(value: string) {
  const name = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!name || name.length > 120) {
    throw new SavedProductError("invalid_product_name", "Product name must be between 1 and 120 characters.");
  }
  return name;
}

function normalizeSku(value?: string | null) {
  const skuLabel = value?.normalize("NFKC").trim().replace(/\s+/g, " ") || null;
  if (skuLabel && skuLabel.length > 80) {
    throw new SavedProductError("invalid_product_sku", "SKU must be 80 characters or fewer.");
  }
  return { skuLabel, skuKey: skuLabel?.toLocaleLowerCase("en-US") ?? null };
}

function assertBatchSucceeded(results: Array<{ success?: boolean; error?: string }>, fallbackCode: string) {
  const failed = results.find((result) => result && result.success === false);
  if (!failed) return;
  const message = String(failed.error ?? "unknown D1 error");
  if (message.includes("idx_products_workspace_sku_key") || message.includes("products.workspace_id, products.sku_key")) {
    throw new SavedProductError("duplicate_product_sku", "A Saved Product with this SKU already exists.", 409);
  }
  if (message.includes("idx_product_reference_current") || message.includes("product_reference_versions.product_id")) {
    throw new SavedProductError("reference_promotion_conflict", "The approved reference changed. Reload and try again.", 409);
  }
  throw new SavedProductError(fallbackCode, `Saved Product persistence failed: ${message}`, 500);
}

async function runProductBatch(db: D1Database, statements: ReturnType<D1Database["prepare"]>[]) {
  try {
    return await db.batch<{ success?: boolean; error?: string }>(statements);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assertBatchSucceeded([{ success: false, error: message }], "saved_product_persistence_failed");
    throw error;
  }
}
