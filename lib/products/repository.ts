import type { D1Database } from "@/lib/cloudflare/bindings";
import type {
  SavedProductBatchHistory,
  SavedProductDetail,
  SavedProductOption,
  SavedProductReferenceRole,
  SavedProductReferenceVersion,
  SavedProductStatus,
  SavedProductSummary,
} from "@/lib/products/types";
import { SAVED_PRODUCT_REFERENCE_ROLES } from "@/lib/products/types";

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
  status: SavedProductStatus;
  archivedAt: string | null;
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
  referenceRole: SavedProductReferenceRole;
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
    referenceRole?: SavedProductReferenceRole;
    now?: Date;
  },
): Promise<{ product: SavedProductDetail; resumed: boolean }> {
  const name = normalizeName(input.name);
  const referenceRole = normalizeReferenceRole(input.referenceRole);
  const { skuLabel, skuKey } = normalizeSku(input.skuLabel);
  const existing = await getSavedProductById(db, input.productId, input.workspaceId, input.now);
  if (existing) {
    if (
      existing.name === name &&
      existing.skuLabel === skuLabel &&
      existing.currentReferences.some((reference) => reference.referenceRole === referenceRole && reference.assetId === input.referenceAssetId)
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
        id, workspace_id, product_id, asset_id, version_number, status, created_at, promoted_at, reference_role
       ) values (?, ?, ?, ?, 1, 'current', ?, ?, ?)`,
    ).bind(crypto.randomUUID(), input.workspaceId, input.productId, input.referenceAssetId, timestamp, timestamp, referenceRole),
  ]);
  assertBatchSucceeded(results, "product_create_failed");

  const product = await getSavedProductById(db, input.productId, input.workspaceId, input.now);
  if (!product) throw new Error("Saved Product was created but could not be reloaded.");
  return { product, resumed: false };
}

export async function promoteSavedProductReference(
  db: D1Database,
  input: { productId: string; workspaceId: string; referenceAssetId: string; referenceRole?: SavedProductReferenceRole; now?: Date },
): Promise<{ product: SavedProductDetail; resumed: boolean }> {
  const product = await getSavedProductById(db, input.productId, input.workspaceId, input.now);
  if (!product) throw new SavedProductError("product_not_found", "Saved Product not found.", 404);
  if (product.status === "archived") throw new SavedProductError("product_archived", "Restore this Saved Product before updating its references.", 409);
  const referenceRole = normalizeReferenceRole(input.referenceRole);
  const currentForRole = product.currentReferences.find((reference) => reference.referenceRole === referenceRole);
  if (currentForRole?.assetId === input.referenceAssetId) return { product, resumed: true };

  await assertReferenceAssetAvailable(db, input.workspaceId, input.referenceAssetId, input.now);
  const timestamp = (input.now ?? new Date()).toISOString();
  const nextVersion = Math.max(0, ...product.referenceVersions.map((version) => version.versionNumber)) + 1;
  const results = await runProductBatch(db, [
    db.prepare(
      `update product_reference_versions set status = 'superseded'
       where product_id = ? and workspace_id = ? and reference_role = ? and status = 'current'`,
    ).bind(input.productId, input.workspaceId, referenceRole),
    db.prepare(
      `insert into product_reference_versions (
        id, workspace_id, product_id, asset_id, version_number, status, created_at, promoted_at, reference_role
       ) values (?, ?, ?, ?, ?, 'current', ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(), input.workspaceId, input.productId, input.referenceAssetId,
      nextVersion, timestamp, timestamp, referenceRole,
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
  options: { includeArchived?: boolean } = {},
): Promise<SavedProductSummary[]> {
  const where = options.includeArchived ? "p.workspace_id = ?" : "p.workspace_id = ? and p.status = 'active'";
  const rows = await db.prepare(productSelect(where) + " order by p.status asc, p.updated_at desc")
    .bind(workspaceId).all<ProductRow>();
  const products: SavedProductSummary[] = [];
  for (const row of rows.results) {
    const versions = await listReferenceVersions(db, row.id, workspaceId, now);
    products.push(mapProduct(row, versions));
  }
  return products;
}

export async function listSelectableSavedProducts(
  db: D1Database,
  workspaceId: string,
  now = new Date(),
): Promise<SavedProductOption[]> {
  const products = await listSavedProducts(db, workspaceId, now);
  return products.flatMap((product) => {
    const currentReferences = product.currentReferences.filter((reference) => reference.imageAvailable);
    return currentReferences.length ? [{ id: product.id, name: product.name, skuLabel: product.skuLabel, currentReferences }] : [];
  });
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
    ...mapProduct(row, referenceVersions),
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
  if (product.status === "archived") {
    throw new SavedProductError("product_archived", "Restore this Saved Product before starting a new batch.", 409);
  }
  const current = product.currentReferences.find((reference) => reference.assetId === input.referenceAssetId);
  if (!current) {
    throw new SavedProductError(
      "product_reference_changed",
      "The approved reference view changed. Reload this batch setup and select the current version.",
      409,
    );
  }
  if (!current.imageAvailable) {
    throw new SavedProductError(
      "product_reference_unavailable",
      "Select a current, retained approved reference view before starting this batch.",
      409,
    );
  }
  return current;
}

export async function updateSavedProduct(
  db: D1Database,
  input: { productId: string; workspaceId: string; name: string; skuLabel?: string | null; status?: SavedProductStatus; now?: Date },
) {
  const product = await getSavedProductById(db, input.productId, input.workspaceId, input.now);
  if (!product) throw new SavedProductError("product_not_found", "Saved Product not found.", 404);
  const name = normalizeName(input.name);
  const { skuLabel, skuKey } = normalizeSku(input.skuLabel);
  const status = input.status ?? product.status;
  if (!(["active", "archived"] as const).includes(status)) {
    throw new SavedProductError("invalid_product_status", "Saved Product status is invalid.");
  }
  const timestamp = (input.now ?? new Date()).toISOString();
  const archivedAt = status === "archived" ? (product.archivedAt ?? timestamp) : null;
  const results = await runProductBatch(db, [
    db.prepare(
      `update products set name = ?, sku_label = ?, sku_key = ?, status = ?, archived_at = ?, updated_at = ?
       where id = ? and workspace_id = ?`,
    ).bind(name, skuLabel, skuKey, status, archivedAt, timestamp, input.productId, input.workspaceId),
  ]);
  assertBatchSucceeded(results, "product_update_failed");
  const updated = await getSavedProductById(db, input.productId, input.workspaceId, input.now);
  if (!updated) throw new Error("Saved Product was updated but could not be reloaded.");
  return updated;
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
      prv.reference_role as referenceRole,
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
      referenceRole: row.referenceRole,
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
    p.status, p.archived_at as archivedAt,
    p.created_at as createdAt, p.updated_at as updatedAt,
    (select count(*) from product_reference_versions prv where prv.product_id = p.id) as referenceVersionCount,
    (select count(*) from batches b where b.product_id = p.id) as batchCount,
    (select max(b.created_at) from batches b where b.product_id = p.id) as lastBatchAt
   from products p where ${where}`;
}

function mapProduct(row: ProductRow, referenceVersions: SavedProductReferenceVersion[]): SavedProductSummary {
  const currentReferences = referenceVersions
    .filter((version) => version.status === "current")
    .sort((a, b) => SAVED_PRODUCT_REFERENCE_ROLES.indexOf(a.referenceRole) - SAVED_PRODUCT_REFERENCE_ROLES.indexOf(b.referenceRole));
  const currentReference = currentReferences.find((version) => version.referenceRole === "front") ?? currentReferences[0] ?? null;
  return {
    ...row,
    referenceVersionCount: Number(row.referenceVersionCount),
    batchCount: Number(row.batchCount),
    currentReference,
    currentReferences,
  };
}

function normalizeReferenceRole(value?: SavedProductReferenceRole) {
  const role = value ?? "front";
  if (!SAVED_PRODUCT_REFERENCE_ROLES.includes(role)) {
    throw new SavedProductError("invalid_reference_role", "Choose a supported approved reference view.");
  }
  return role;
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
  if (message.includes("idx_product_reference_current_role") || message.includes("product_reference_versions.product_id")) {
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
