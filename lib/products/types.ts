export type SavedProductReferenceStatus = "current" | "superseded";

export interface SavedProductReferenceVersion {
  id: string;
  assetId: string;
  versionNumber: number;
  status: SavedProductReferenceStatus;
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
  currentReference: SavedProductReferenceVersion | null;
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
  currentReference: SavedProductReferenceVersion;
}
