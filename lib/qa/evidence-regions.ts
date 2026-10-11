import type { ImageEvidenceLocation, ObservationEvidence, PairedEvidenceRegions, RegionUnavailableReason } from "@/lib/domain/semantics";

export const REGION_COORDINATE_SPACE = "analysis_image_normalized" as const;
const reasons = new Set<RegionUnavailableReason>(["not_recorded", "not_visible", "insufficient_evidence", "not_present", "cannot_locate", "uncertain_location", "invalid_region"]);
type Assets = { referenceAssetId: string; candidateAssetId: string };
type Visibility = { reference?: boolean; candidate?: boolean };

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function exactKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
export function unavailableRegion(assetId: string, reason: RegionUnavailableReason): ImageEvidenceLocation {
  return { coordinateSpace: REGION_COORDINATE_SPACE, assetId, region: null, reason, confidence: null };
}

/** Reject rather than clamp. Provider IDs are forbidden; stored IDs must match the task. */
export function normalizeImageRegion(value: unknown, assetId: string, visible?: boolean, provider = false): ImageEvidenceLocation {
  const keys = ["coordinateSpace", "region", "reason", "confidence", ...(provider ? [] : ["assetId"])];
  if (!record(value) || !exactKeys(value, keys) || value.coordinateSpace !== REGION_COORDINATE_SPACE || (!provider && value.assetId !== assetId)) {
    return unavailableRegion(assetId, "invalid_region");
  }
  if (value.region === null) {
    return typeof value.reason === "string" && reasons.has(value.reason as RegionUnavailableReason) && value.confidence === null
      ? unavailableRegion(assetId, visible === false ? "not_visible" : value.reason as RegionUnavailableReason)
      : unavailableRegion(assetId, "invalid_region");
  }
  const box = value.region;
  if (!record(box) || !exactKeys(box, ["x", "y", "width", "height"]) || !Object.values(box).every(n => typeof n === "number" && Number.isFinite(n))) {
    return unavailableRegion(assetId, "invalid_region");
  }
  const { x, y, width, height } = box as { x: number; y: number; width: number; height: number };
  if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1 || y + height > 1 || value.reason !== null || (typeof value.confidence !== "string" || !["high", "medium", "low"].includes(value.confidence))) {
    return unavailableRegion(assetId, "invalid_region");
  }
  if (visible === false) return unavailableRegion(assetId, "not_visible");
  if (value.confidence === "low") return unavailableRegion(assetId, "uncertain_location");
  return { coordinateSpace: REGION_COORDINATE_SPACE, assetId, region: { x, y, width, height }, reason: null, confidence: value.confidence as "high" | "medium" };
}

export function normalizeRegionPair(value: unknown, assets: Assets, visibility: Visibility = {}, provider = false): PairedEvidenceRegions {
  if (!record(value) || !exactKeys(value, ["schemaVersion", "reference", "candidate"]) || value.schemaVersion !== 1) {
    return { schemaVersion: 1, reference: unavailableRegion(assets.referenceAssetId, "invalid_region"), candidate: unavailableRegion(assets.candidateAssetId, "invalid_region") };
  }
  return {
    schemaVersion: 1,
    reference: normalizeImageRegion(value.reference, assets.referenceAssetId, visibility.reference, provider),
    candidate: normalizeImageRegion(value.candidate, assets.candidateAssetId, visibility.candidate, provider),
  };
}

/** Numeric validity and model confidence do not verify what the box contains.
 * No independent locator is currently available, so retain proposals only in regionRaw.
 */
export function suppressUnverifiedRegions(pair: PairedEvidenceRegions): PairedEvidenceRegions {
  const suppress = (location: ImageEvidenceLocation) => location.region
    ? unavailableRegion(location.assetId, "uncertain_location")
    : location;
  return { ...pair, reference: suppress(pair.reference), candidate: suppress(pair.candidate) };
}

export function preserveRegionRaw(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "number" && !Number.isFinite(item) ? { nonFiniteNumber: String(item) } : item));
  } catch {
    return "Unserializable region payload";
  }
}

export function normalizeBoundEvidence(value: unknown, assets: Assets, visibility: Visibility = {}): ObservationEvidence {
  const evidence = record(value) ? value : {};
  // Historical boundingRegions has no declared space. Preserve it without inferring boxes.
  if (!Object.hasOwn(evidence, "regions")) return evidence as ObservationEvidence;
  return {
    ...evidence,
    regionRaw: Object.hasOwn(evidence, "regionRaw") ? evidence.regionRaw : preserveRegionRaw(evidence.regions),
    regions: suppressUnverifiedRegions(normalizeRegionPair(evidence.regions, assets, visibility)),
  };
}
