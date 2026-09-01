import type { BatchMappingItemInput, BatchMappingMode } from "@/lib/batches/types";

export const M1_ABSOLUTE_BATCH_ITEM_LIMIT = 20;

export class BatchValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "BatchValidationError";
  }
}
export function validateAndNormalizeBatchMapping(input: {
  mappingMode: BatchMappingMode;
  items: BatchMappingItemInput[];
  planBatchItemLimit: number;
}) {
  const effectiveLimit = Math.min(
    M1_ABSOLUTE_BATCH_ITEM_LIMIT,
    Math.max(0, Math.floor(input.planBatchItemLimit)),
  );

  if (input.items.length < 1) {
    throw new BatchValidationError("batch_empty", "A batch must contain at least one product check.");
  }
  if (input.items.length > effectiveLimit) {
    throw new BatchValidationError(
      "batch_item_limit_exceeded",
      `This workspace can run at most ${effectiveLimit} product checks in one batch.`,
    );
  }

  const normalized = input.items.map((item, position) => {
    const referenceAssetId = item.referenceAssetId.trim();
    const candidateAssetId = item.candidateAssetId.trim();
    const clientLabel = item.clientLabel?.trim() || null;
    if (!referenceAssetId || !candidateAssetId) {
      throw new BatchValidationError(
        "batch_mapping_incomplete",
        `Product check ${position + 1} requires one reference and one candidate image.`,
      );
    }
    if (referenceAssetId === candidateAssetId) {
      throw new BatchValidationError(
        "batch_same_asset_pair",
        `Product check ${position + 1} cannot use the same asset as reference and candidate.`,
      );
    }
    return { referenceAssetId, candidateAssetId, clientLabel };
  });

  const candidateIds = new Set<string>();
  for (const item of normalized) {
    if (candidateIds.has(item.candidateAssetId)) {
      throw new BatchValidationError(
        "batch_duplicate_candidate",
        "Each candidate image can appear only once in a batch.",
      );
    }
    candidateIds.add(item.candidateAssetId);
  }

  if (input.mappingMode === "one_reference_many_candidates") {
    const referenceIds = new Set(normalized.map((item) => item.referenceAssetId));
    if (referenceIds.size !== 1) {
      throw new BatchValidationError(
        "batch_reference_mismatch",
        "One product, many images mode requires the same reference for every candidate.",
      );
    }
  }

  return normalized;
}

export async function fingerprintBatchMapping(
  mappingMode: BatchMappingMode,
  items: Array<{ referenceAssetId: string; candidateAssetId: string; clientLabel: string | null }>,
  productId: string | null = null,
) {
  const canonical = JSON.stringify({ mappingMode, productId, items });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
