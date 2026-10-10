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

import { SavedProductError, type ProductBinding, type ProductProfileVersion, type ProductMutationResult, type ProductSnapshot } from "./types";
import { normalizeProductProfile, validateMutationIdentity, normalizeProductBinding, profileHash, requireProductProfilesEnabled } from "./profile-validation";
export { SavedProductError } from "./types";

interface ProductRow {
  revision: number;
  currentProfileJson: string | null;
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
  input: { productId: string; workspaceId: string; referenceAssetId: string; referenceRole?: SavedProductReferenceRole; requestId?: string; expectedVersion?: number; now?: Date },
): Promise<{ product: SavedProductDetail; resumed: boolean; mutationResult?: ProductMutationResult }> {
  const product = await getSavedProductById(db, input.productId, input.workspaceId, input.now);
  if (!product) throw new SavedProductError("product_not_found", "Saved Product not found.", 404);
  if (product.currentProfile && (input.requestId === undefined || input.expectedVersion === undefined)) throw new SavedProductError("product_version_required","Reload the product before changing its reference.",428);
  const changed = await mutateProduct(db, { ...input, action:"reference", requestId: input.requestId ?? crypto.randomUUID(), expectedVersion: input.expectedVersion ?? product.revision, actorId:"", referenceRole:normalizeReferenceRole(input.referenceRole) });
  const updated = await getSavedProductById(db,input.productId,input.workspaceId,input.now);
  if (!updated) throw storageUnavailable();
  return { product:updated, ...changed };
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
    return currentReferences.length ? [{ id: product.id, name: product.name, skuLabel: product.skuLabel, revision: product.revision, currentProfile: product.currentProfile, currentReferences }] : [];
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
  if (product.currentProfile) throw new SavedProductError("product_version_required","Edit the complete product standard or use a versioned status request.",428);
  const name = normalizeName(input.name);
  const { skuLabel, skuKey } = normalizeSku(input.skuLabel);
  const status = input.status ?? product.status;
  if (!(["active", "archived"] as const).includes(status)) {
    throw new SavedProductError("invalid_product_status", "Saved Product status is invalid.");
  }
  const timestamp = (input.now ?? new Date()).toISOString();
  const archivedAt = status === "archived" ? (product.archivedAt ?? timestamp) : null;
  const token=crypto.randomUUID(),last=crypto.randomUUID();
  try {
    await atomicProductBatch(db,[
      db.prepare("insert into product_write_guards(token,workspace_id,product_id,ok) select ?,?,?,case when exists(select 1 from products where id=? and workspace_id=? and revision=? and current_profile_version_id is null) then 1 else 0 end").bind(token,input.workspaceId,input.productId,input.productId,input.workspaceId,product.revision),
      db.prepare(`update products set name=?,sku_label=?,sku_key=?,status=?,archived_at=?,updated_at=?,revision=revision+1 where id=? and workspace_id=? and revision=? and current_profile_version_id is null`).bind(name,skuLabel,skuKey,status,archivedAt,timestamp,input.productId,input.workspaceId,product.revision),
      db.prepare("insert into product_write_guards(token,workspace_id,product_id,ok) select ?,?,?,case when exists(select 1 from products where id=? and workspace_id=? and revision=? and current_profile_version_id is null) then 1 else 0 end").bind(last,input.workspaceId,input.productId,input.productId,input.workspaceId,product.revision+1),
      db.prepare("delete from product_write_guards where token in (?,?)").bind(token,last),
    ]);
  } catch(error) {
    const latest=await getSavedProductById(db,input.productId,input.workspaceId,input.now);
    if(!latest)throw new SavedProductError("product_not_found","Product not found.",404);
    if(latest.currentProfile)throw new SavedProductError("product_version_required","Reload and edit the complete product standard.",428);
    if(latest.revision!==product.revision)throw new SavedProductError("product_version_conflict","Product information changed. Reload and review your changes.",409,latest.revision);
    if(error instanceof Error&&error.message.includes("products.workspace_id, products.sku_key"))throw new SavedProductError("duplicate_product_sku","A product with this SKU already exists.",409);
    throw storageUnavailable();
  }
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
    p.status, p.archived_at as archivedAt, p.revision,
    (select json_object('versionId',v.id,'versionNumber',v.version_number,'schemaVersion',v.schema_version,'source',v.source,'createdAt',v.created_at,'profile',json(v.profile_json)) from product_profile_versions v where v.id=p.current_profile_version_id and v.product_id=p.id and v.workspace_id=p.workspace_id) as currentProfileJson,
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
  const { currentProfileJson, ...product } = row;
  const currentProfile = currentProfileJson ? JSON.parse(currentProfileJson) as ProductProfileVersion : null;
  return {
    ...product,
    revision: Number(row.revision),
    profileState: currentProfile ? "versioned" : "legacy_unversioned",
    currentProfile,
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

function storageUnavailable() { return new SavedProductError("profile_storage_unavailable","Product information could not be saved safely. Retry with the same request.",503); }
type MutationInput = {
  action: "profile" | "reference" | "lifecycle";
  productId: string; workspaceId: string; requestId: string; expectedVersion: number;
  actorId: string; profile?: unknown; referenceAssetId?: string; referenceRole?: SavedProductReferenceRole;
  status?: SavedProductStatus; enabled?: boolean; now?: Date;
};
interface LedgerRow { request_id: string; product_id: string; fingerprint: string; result_revision: number; result_profile_version_id: string|null; result_reference_version_id:string|null; result_status:SavedProductStatus }
async function readMutation(db:D1Database,input:MutationInput,fingerprint:string) {
  const row=await db.prepare("select * from product_mutation_requests where workspace_id=? and product_id=? and request_id=?").bind(input.workspaceId,input.productId,input.requestId).first<LedgerRow>();
  if (!row) return null;
  if (row.fingerprint!==fingerprint) throw new SavedProductError("idempotency_conflict","This request key was used for different changes.",409);
  const version=row.result_profile_version_id ? await db.prepare("select version_number n from product_profile_versions where workspace_id=? and product_id=? and id=?").bind(input.workspaceId,input.productId,row.result_profile_version_id).first<{n:number}>() : null;
  const mutationResult:ProductMutationResult={requestId:row.request_id,productId:row.product_id,revision:Number(row.result_revision),profileVersionId:row.result_profile_version_id,profileVersionNumber:version?Number(version.n):null,referenceVersionId:row.result_reference_version_id,status:row.result_status};
  return mutationResult;
}
export async function saveProductProfile(db:D1Database,input:Omit<MutationInput,"action">) {
  return mutateProduct(db,{...input,action:"profile"});
}
export async function changeProductLifecycle(db:D1Database,input:Omit<MutationInput,"action">) {
  return mutateProduct(db,{...input,action:"lifecycle"});
}
async function mutateProduct(db:D1Database,input:MutationInput):Promise<{mutationResult:ProductMutationResult;resumed:boolean;created:boolean}> {
  validateMutationIdentity(input.requestId,input.expectedVersion);
  if (input.action==="profile") requireProductProfilesEnabled(input.enabled);
  const normalized=input.action==="profile" ? normalizeProductProfile(input.profile) : null;
  const role=input.referenceRole ?? "front";
  if(input.action==="reference") normalizeReferenceRole(role);
  if(input.action==="lifecycle" && input.status!=="active" && input.status!=="archived") throw new SavedProductError("invalid_product_status","Select active or archived.");
  const payload=normalized ?? (input.action==="reference" ? {assetId:input.referenceAssetId,role} : {status:input.status});
  const fingerprint=await profileHash(JSON.stringify({action:input.action,productId:input.productId,expectedVersion:input.expectedVersion,payload}));
  try {
    const replay=await readMutation(db,input,fingerprint);
    if(replay)return {mutationResult:replay,resumed:true,created:false};
    const product=await getSavedProductById(db,input.productId,input.workspaceId,input.now);
    if(!product)throw new SavedProductError("product_not_found","Product not found.",404);
    if(input.action==="reference")await assertReferenceAssetAvailable(db,input.workspaceId,input.referenceAssetId!,input.now);
    if(product.revision!==input.expectedVersion)throw new SavedProductError("product_version_conflict","Product information or reference changed. Reload and review your changes.",409,product.revision);
    if(input.action!=="lifecycle" && product.status!=="active")throw new SavedProductError("product_archived","Restore this product before making changes.",409);
    const now=(input.now ?? new Date()).toISOString(), token=crypto.randomUUID(), finalToken=crypto.randomUUID(), versionId=crypto.randomUUID();
    const prepare=(query:string,...params:unknown[])=>db.prepare(query).bind(...params);
    const json=normalized ? JSON.stringify(normalized) : null, digest=json ? await profileHash(json) : null;
    const currentReference=product.currentReferences.find(r=>r.assetId===input.referenceAssetId && r.referenceRole===role);
    const noop=input.action==="profile" ? !!product.currentProfile && JSON.stringify(product.currentProfile.profile)===json : input.action==="reference" ? !!currentReference : product.status===input.status;
    if(input.action==="reference" && !noop && product.referenceVersions.some(r=>r.assetId===input.referenceAssetId))throw new SavedProductError("reference_already_versioned","This image already has a reference version. Upload a new image for a new version.",409);
    let predicate="p.workspace_id=? and p.id=? and p.revision=? and p.status=? and (p.current_profile_version_id is null or exists(select 1 from product_profile_versions v where v.id=p.current_profile_version_id and v.workspace_id=p.workspace_id and v.product_id=p.id))";
    const args:unknown[]=[input.workspaceId,input.productId,input.expectedVersion,input.action==="lifecycle" ? product.status : "active"];
    if(input.action==="reference") {predicate+=" and exists(select 1 from assets a where a.id=? and a.workspace_id=p.workspace_id and a.kind='reference' and a.asset_type='image' and a.status not in ('deleted','failed') and a.retention_expires_at>?)";args.push(input.referenceAssetId,now);if(!input.now)predicate+=" and exists(select 1 from assets a where a.id=? and a.retention_expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now'))";if(!input.now)args.push(input.referenceAssetId);}
    if(noop && input.action==="profile") {predicate+=" and p.current_profile_version_id=? and exists(select 1 from product_profile_versions v where v.id=? and v.profile_sha256=?)";args.push(product.currentProfile!.versionId,product.currentProfile!.versionId,digest);}
    if(noop && input.action==="reference") {predicate+=" and exists(select 1 from product_reference_versions r where r.workspace_id=p.workspace_id and r.product_id=p.id and r.id=? and r.status='current' and r.asset_id=? and r.reference_role=?)";args.push(currentReference!.id,input.referenceAssetId,role);}
    const revision=input.expectedVersion+(noop?0:1);
    const resultProfileId=input.action==="profile" && !noop ? versionId : product.currentProfile?.versionId ?? null;
    const resultReferenceId=input.action==="reference" ? noop?currentReference!.id:versionId : null;
    const resultStatus=input.action==="lifecycle" ? input.status! : product.status;
    const statements=[prepare(`insert into product_write_guards(token,workspace_id,product_id,ok) select ?,?,?,case when exists(select 1 from products p where ${predicate}) then 1 else 0 end`,token,input.workspaceId,input.productId,...args),prepare("insert into product_mutation_requests(workspace_id,product_id,request_id,action,fingerprint,result_revision,result_profile_version_id,result_reference_version_id,result_status,created_at) values(?,?,?,?,?,?,?,?,?,?)",input.workspaceId,input.productId,input.requestId,input.action,fingerprint,revision,resultProfileId,resultReferenceId,resultStatus,now)];
    if(!noop) {
      if(input.action==="profile") {
        statements.push(prepare("insert into product_profile_versions(id,workspace_id,product_id,version_number,schema_version,profile_json,profile_sha256,source,created_at,created_by_user_id) select ?,?,?,coalesce(max(version_number),0)+1,1,?,?,'user_confirmed',?,? from product_profile_versions where workspace_id=? and product_id=?",versionId,input.workspaceId,input.productId,json,digest,now,input.actorId,input.workspaceId,input.productId));
        statements.push(prepare("update products set name=?,sku_label=?,sku_key=?,current_profile_version_id=?,revision=revision+1,updated_at=? where workspace_id=? and id=? and revision=?",normalized!.name,normalized!.skuLabel,normalized!.skuLabel?.toLocaleLowerCase("en-US")??null,versionId,now,input.workspaceId,input.productId,input.expectedVersion));
      } else if(input.action==="reference") {
        statements.push(prepare("update product_reference_versions set status='superseded' where workspace_id=? and product_id=? and reference_role=? and status='current'",input.workspaceId,input.productId,role));
        statements.push(prepare("insert into product_reference_versions(id,workspace_id,product_id,asset_id,version_number,status,reference_role,created_at,promoted_at) select ?,?,?,?,coalesce(max(version_number),0)+1,'current',?,?,? from product_reference_versions where workspace_id=? and product_id=?",versionId,input.workspaceId,input.productId,input.referenceAssetId,role,now,now,input.workspaceId,input.productId));
        statements.push(prepare("update products set revision=revision+1,updated_at=? where workspace_id=? and id=? and revision=?",now,input.workspaceId,input.productId,input.expectedVersion));
      } else statements.push(prepare("update products set status=?,archived_at=?,revision=revision+1,updated_at=? where workspace_id=? and id=? and revision=?",resultStatus,resultStatus==="archived"?now:null,now,input.workspaceId,input.productId,input.expectedVersion));
      const finalPredicate=input.action==="reference" ? " and exists(select 1 from product_reference_versions r where r.id=? and r.workspace_id=products.workspace_id and r.product_id=products.id and r.status='current')" : " and current_profile_version_id is ?";
      statements.push(prepare(`insert into product_write_guards(token,workspace_id,product_id,ok) select ?,?,?,case when exists(select 1 from products where workspace_id=? and id=? and revision=? and status=?${finalPredicate}) then 1 else 0 end`,finalToken,input.workspaceId,input.productId,input.workspaceId,input.productId,revision,resultStatus,input.action==="reference"?resultReferenceId:resultProfileId));
    }
    statements.push(prepare("delete from product_write_guards where token in (?,?)",token,finalToken));
    try { await atomicProductBatch(db,statements); }
    catch(error) {
      const completed=await readMutation(db,input,fingerprint);
      if(completed)return {mutationResult:completed,resumed:true,created:false};
      const current=await getSavedProductById(db,input.productId,input.workspaceId,input.now);
      if(!current)throw new SavedProductError("product_not_found","Product not found.",404);
      if(input.action==="reference")await assertReferenceAssetAvailable(db,input.workspaceId,input.referenceAssetId!,input.now);
      if(current.revision!==input.expectedVersion)throw new SavedProductError("product_version_conflict","Product information or reference changed. Reload and review your changes.",409,current.revision);
      if(input.action!=="lifecycle" && current.status!=="active")throw new SavedProductError("product_archived","Restore this product before making changes.",409);
      const message=error instanceof Error?error.message:String(error);
      if(message.includes("products.workspace_id, products.sku_key"))throw new SavedProductError("duplicate_product_sku","A product with this SKU already exists.",409);
      throw storageUnavailable();
    }
    const saved=await readMutation(db,input,fingerprint);
    if(!saved)throw storageUnavailable();
    return {mutationResult:saved,resumed:false,created:!noop};
  } catch(error) {if(error instanceof SavedProductError)throw error;throw storageUnavailable();}
}
export async function atomicProductBatch(db:D1Database,statements:ReturnType<D1Database["prepare"]>[]) {
  const results=await db.batch<{success?:boolean;error?:string}>(statements);
  const failure=results.find(r=>r.success===false);if(failure)throw new Error(failure.error??"D1 batch failed");
  return results;
}
export async function listProductProfiles(db:D1Database,workspaceId:string,productId:string,options:{beforeVersion?:number;limit?:number}={}) {
  try {
    if(!await getSavedProductById(db,productId,workspaceId))throw new SavedProductError("product_not_found","Product not found.",404);
    const limit=options.limit??20,before=options.beforeVersion??Number.MAX_SAFE_INTEGER;
    if(!Number.isSafeInteger(before)||before<1||!Number.isSafeInteger(limit)||limit<1||limit>50)throw new SavedProductError("invalid_profile","Invalid history cursor or page size.");
    const rows=await db.prepare("select id,version_number,created_at,profile_json from product_profile_versions where workspace_id=? and product_id=? and version_number<? order by version_number desc limit ?").bind(workspaceId,productId,before,limit).all<{id:string;version_number:number;created_at:string;profile_json:string}>();
    const profiles:ProductProfileVersion[]=rows.results.map(r=>({versionId:r.id,versionNumber:Number(r.version_number),createdAt:r.created_at,schemaVersion:1,source:"user_confirmed",profile:JSON.parse(r.profile_json)}));
    return {profiles,nextBeforeVersion:profiles.length===limit?profiles.at(-1)!.versionNumber:null};
  } catch(error) {if(error instanceof SavedProductError)throw error;throw storageUnavailable();}
}

export async function prepareProductSnapshot(db:D1Database,input:{workspaceId:string;binding:ProductBinding;referenceAssetId:string;candidateAssetId?:string;now?:Date}) {
  const binding=normalizeProductBinding(input.binding)!;
  try {
    const product=await getSavedProductById(db,binding.productId,input.workspaceId,input.now);
    if(!product)throw new SavedProductError("product_not_found","Product not found.",404);
    const profile=await db.prepare("select profile_json,profile_sha256,version_number from product_profile_versions where id=? and workspace_id=? and product_id=?").bind(binding.profileVersionId,input.workspaceId,binding.productId).first<{profile_json:string;profile_sha256:string;version_number:number}>();
    const reference=product.referenceVersions.find(r=>r.id===binding.referenceVersionId);
    if(!profile||!reference)throw new SavedProductError("reference_not_found","Product version or reference not found.",404);
    await assertReferenceAssetAvailable(db,input.workspaceId,input.referenceAssetId,input.now);
    if(input.candidateAssetId)await assertProductTaskAsset(db,input.workspaceId,input.candidateAssetId,input.now);
    if(product.status!=="active")throw new SavedProductError("product_archived","Restore this product before starting a task.",409);
    if(product.revision!==binding.expectedVersion||product.currentProfile?.versionId!==binding.profileVersionId)throw new SavedProductError("product_version_conflict","Product information changed. Reload the current versions.",409,product.revision);
    if(reference.status!=="current"||reference.assetId!==input.referenceAssetId||!reference.imageAvailable)throw new SavedProductError("product_reference_unavailable","Select a current, retained reference image.",409);
    const snapshot:ProductSnapshot={schemaVersion:1,productId:binding.productId,revision:binding.expectedVersion,profileVersionId:binding.profileVersionId,profileVersionNumber:Number(profile.version_number),profile:JSON.parse(profile.profile_json),referenceVersionId:reference.id,referenceVersionNumber:reference.versionNumber,referenceRole:reference.referenceRole,referenceAssetId:reference.assetId,boundAt:(input.now??new Date()).toISOString()};
    const json=JSON.stringify(snapshot);
    return {snapshot,json,hash:await profileHash(json),profileHash:profile.profile_sha256,timeOverride:!!input.now};
  } catch(error) {if(error instanceof SavedProductError)throw error;throw storageUnavailable();}
}
type PreparedSnapshot = Awaited<ReturnType<typeof prepareProductSnapshot>>;
export function snapshotWriteStatements(db:D1Database,input:{kind:"batch"|"analysis";id:string;workspaceId:string;prepared:PreparedSnapshot;candidateAssetIds?:string[]}) {
  const {snapshot:s,json,hash,profileHash:contentHash}=input.prepared,token=crypto.randomUUID(),last=crypto.randomUUID();
  const table=input.kind==="batch"?"batch_product_snapshots":"analysis_product_snapshots",key=input.kind==="batch"?"batch_id":"analysis_id",parent=input.kind==="batch"?"batches":"analyses";
  let predicate=`p.workspace_id=? and p.id=? and p.revision=? and p.status='active' and p.current_profile_version_id=? and exists(select 1 from product_profile_versions v where v.id=? and v.workspace_id=p.workspace_id and v.product_id=p.id and v.profile_sha256=?) and exists(select 1 from product_reference_versions r join assets a on a.id=r.asset_id where r.workspace_id=p.workspace_id and r.product_id=p.id and r.id=? and r.asset_id=? and r.reference_role=? and r.status='current' and a.workspace_id=p.workspace_id and a.kind='reference' and a.asset_type='image' and a.status not in ('deleted','failed') and a.retention_expires_at>?)`;
  const values=[input.workspaceId,s.productId,s.revision,s.profileVersionId,s.profileVersionId,contentHash,s.referenceVersionId,s.referenceAssetId,s.referenceRole,s.boundAt];
  if(!input.prepared.timeOverride)predicate+=" and exists(select 1 from assets a where a.id=? and a.retention_expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now'))";
  if(!input.prepared.timeOverride)values.push(s.referenceAssetId);
  for(const id of input.candidateAssetIds??[]) {predicate+=" and exists(select 1 from assets c where c.id=? and c.workspace_id=p.workspace_id and c.asset_type='image' and c.status not in ('deleted','failed') and c.retention_expires_at>?"+(!input.prepared.timeOverride?" and c.retention_expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now')":"")+")";values.push(id,s.boundAt);}
  const before=[db.prepare(`insert into product_write_guards(token,workspace_id,product_id,ok) select ?,?,?,case when exists(select 1 from products p where ${predicate}) then 1 else 0 end`).bind(token,input.workspaceId,s.productId,...values)];
  const after=[db.prepare(`insert into ${table}(${key},workspace_id,product_id,product_revision,profile_version_id,reference_version_id,snapshot_json,snapshot_sha256,bound_at) select ?,?,?,?,?,?,?,?,? where exists(select 1 from products p where ${predicate}) and exists(select 1 from ${parent} where id=? and workspace_id=?)`).bind(input.id,input.workspaceId,s.productId,s.revision,s.profileVersionId,s.referenceVersionId,json,hash,s.boundAt,...values,input.id,input.workspaceId),db.prepare(`insert into product_write_guards(token,workspace_id,product_id,ok) select ?,?,?,case when exists(select 1 from ${table} where ${key}=? and workspace_id=? and snapshot_sha256=?) then 1 else 0 end`).bind(last,input.workspaceId,s.productId,input.id,input.workspaceId,hash),db.prepare("delete from product_write_guards where token in (?,?)").bind(token,last)];
  return {before,after};
}
export async function readProductSnapshot(db:D1Database,kind:"batch"|"analysis",id:string,workspaceId:string):Promise<ProductSnapshot|null> {
  const table=kind==="batch"?"batch_product_snapshots":"analysis_product_snapshots",key=kind==="batch"?"batch_id":"analysis_id";
  try {
    const row=await db.prepare(`select snapshot_json from ${table} where ${key}=? and workspace_id=?`).bind(id,workspaceId).first<{snapshot_json:string}>();
    return row?JSON.parse(row.snapshot_json) as ProductSnapshot:null;
  } catch {throw storageUnavailable();}
}
export function sameProductBinding(snapshot:ProductSnapshot|null|undefined,binding:ProductBinding|null|undefined) {
  return !snapshot&&!binding || !!snapshot&&!!binding&&snapshot.productId===binding.productId&&snapshot.revision===binding.expectedVersion&&snapshot.profileVersionId===binding.profileVersionId&&snapshot.referenceVersionId===binding.referenceVersionId;
}

export async function assertProductTaskAsset(db:D1Database,workspaceId:string,assetId:string,now=new Date()) {
  const asset=await db.prepare("select asset_type,status,retention_expires_at from assets where id=? and workspace_id=?").bind(assetId,workspaceId).first<{asset_type:string;status:string;retention_expires_at:string|null}>();
  if(!asset)throw new SavedProductError("reference_not_found","One or more task images were not found.",404);
  if(asset.asset_type!=="image"||["deleted","failed"].includes(asset.status)||!asset.retention_expires_at||asset.retention_expires_at<=now.toISOString())throw new SavedProductError("product_reference_unavailable","One or more task images are no longer available.",409);
}
