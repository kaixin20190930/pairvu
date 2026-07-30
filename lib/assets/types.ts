export type AssetKind = "reference" | "candidate" | "derived" | "report";

export type AssetType = "image";

export type AssetStatus = "uploaded" | "normalized" | "analyzed" | "deleted" | "failed";

export interface StoredAsset {
  id: string;
  workspaceId?: string;
  anonymousSessionId?: string;
  kind: AssetKind;
  assetType: AssetType;
  mimeType: string;
  fileSizeBytes: number;
  sha256: string;
  r2KeyOriginal: string;
  status: AssetStatus;
  retentionExpiresAt?: string;
  createdAt: string;
}

export interface AssetUploadInput {
  file: File;
  kind: Extract<AssetKind, "reference" | "candidate">;
  workspaceId?: string;
  anonymousSessionId?: string;
}
