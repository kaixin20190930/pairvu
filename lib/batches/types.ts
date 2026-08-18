export const BATCH_MAPPING_MODES = [
  "one_reference_many_candidates",
  "explicit_pairs",
] as const;

export type BatchMappingMode = (typeof BATCH_MAPPING_MODES)[number];

export type BatchStatus =
  | "queued"
  | "processing"
  | "completed"
  | "completed_with_errors"
  | "failed"
  | "canceled";

export type BatchItemStatus = "queued" | "processing" | "completed" | "failed" | "canceled";

export interface BatchMappingItemInput {
  referenceAssetId: string;
  candidateAssetId: string;
  clientLabel?: string;
}

export interface CreateBatchInput {
  batchId: string;
  workspaceId: string;
  idempotencyKey: string;
  mappingMode: BatchMappingMode;
  items: BatchMappingItemInput[];
  planBatchItemLimit: number;
  now?: Date;
}

export interface PersistedBatch {
  id: string;
  workspaceId: string;
  mappingMode: BatchMappingMode;
  status: BatchStatus;
  idempotencyKey: string;
  requestFingerprint: string;
  itemCount: number;
  completedItemCount: number;
  failedItemCount: number;
  assetRetentionExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface PersistedBatchItem {
  id: string;
  batchId: string;
  workspaceId: string;
  position: number;
  referenceAssetId: string;
  candidateAssetId: string;
  clientLabel: string | null;
  status: BatchItemStatus;
  analysisId: string | null;
  attemptCount: number;
  terminalErrorCode: string | null;
  terminalErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  verdict: "pass" | "review" | "fail" | null;
  issueCount: number;
  limitationCount: number;
  issueTypes: string | null;
  limitationTypes: string | null;
}

export interface PersistedBatchWithItems extends PersistedBatch {
  items: PersistedBatchItem[];
}

export interface BatchHistoryItem extends PersistedBatch {
  passCount: number;
  reviewCount: number;
  failCount: number;
}

export interface RetainedBatchReference {
  assetId: string;
  label: string;
  previewUrl: string;
  lastUsedAt: string;
  retentionExpiresAt: string;
}
