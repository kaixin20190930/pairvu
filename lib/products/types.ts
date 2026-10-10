export type SavedProductReferenceStatus = "current" | "superseded";
export const SAVED_PRODUCT_REFERENCE_ROLES = [
  "front",
  "back",
  "left_side",
  "right_side",
  "detail",
  "other",
] as const;
export type SavedProductReferenceRole = (typeof SAVED_PRODUCT_REFERENCE_ROLES)[number];
export type SavedProductStatus = "active" | "archived";

export const SAVED_PRODUCT_REFERENCE_ROLE_LABELS: Record<SavedProductReferenceRole, string> = {
  front: "Front",
  back: "Back",
  left_side: "Left side",
  right_side: "Right side",
  detail: "Detail",
  other: "Other",
};

export interface SavedProductReferenceVersion {
  id: string;
  assetId: string;
  versionNumber: number;
  status: SavedProductReferenceStatus;
  referenceRole: SavedProductReferenceRole;
  originalFileName: string | null;
  retentionExpiresAt: string | null;
  imageAvailable: boolean;
  previewUrl: string | null;
  createdAt: string;
  promotedAt: string;
}

export interface SavedProductSummary {
  revision: number;
  profileState: "legacy_unversioned" | "versioned";
  currentProfile: ProductProfileVersion | null;
  id: string;
  workspaceId: string;
  name: string;
  skuLabel: string | null;
  status: SavedProductStatus;
  archivedAt: string | null;
  currentReference: SavedProductReferenceVersion | null;
  currentReferences: SavedProductReferenceVersion[];
  referenceVersionCount: number;
  batchCount: number;
  lastBatchAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedProductBatchHistory {
  id: string;
  status: string;
  itemCount: number;
  completedItemCount: number;
  failedItemCount: number;
  createdAt: string;
}

export interface SavedProductDetail extends SavedProductSummary {
  referenceVersions: SavedProductReferenceVersion[];
  batches: SavedProductBatchHistory[];
}

export interface SavedProductOption {
  revision: number;
  currentProfile: ProductProfileVersion | null;
  id: string;
  name: string;
  skuLabel: string | null;
  currentReferences: SavedProductReferenceVersion[];
}

export class SavedProductError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400, public readonly currentRevision?: number) {
    super(message);
    this.name = "SavedProductError";
  }
}

export interface ProductProfile {
  profileSchemaVersion: 1;
  name: string;
  skuLabel: string | null;
  brand: string | null;
  variant: string | null;
  capacity: { value: string; unit: "ml" | "l" | "g" | "kg" | "count" } | null;
  packagingVersion: string | null;
  criticalAttributes: Array<{ key: string; value: string; visibility: "visible_required" | "view_dependent" | "not_visually_verifiable" }>;
  allowedChanges: Array<{ key: "background" | "lighting" | "shadow" | "placement" | "camera_angle"; note: string | null }>;
}
export interface ProductProfileVersion {
  versionId: string;
  versionNumber: number;
  schemaVersion: 1;
  source: "user_confirmed";
  createdAt: string;
  profile: ProductProfile;
}
export interface ProductBinding {
  productId: string;
  expectedVersion: number;
  profileVersionId: string;
  referenceVersionId: string;
}
export interface ProductSnapshot {
  schemaVersion: 1;
  productId: string;
  revision: number;
  profileVersionId: string;
  profileVersionNumber: number;
  profile: ProductProfile;
  referenceVersionId: string;
  referenceVersionNumber: number;
  referenceRole: SavedProductReferenceRole;
  referenceAssetId: string;
  boundAt: string;
}
export interface ProductMutationResult {
  requestId: string;
  productId: string;
  revision: number;
  profileVersionId: string | null;
  profileVersionNumber: number | null;
  referenceVersionId: string | null;
  status: SavedProductStatus;
}
