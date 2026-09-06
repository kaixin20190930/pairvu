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
  id: string;
  name: string;
  skuLabel: string | null;
  currentReferences: SavedProductReferenceVersion[];
}
