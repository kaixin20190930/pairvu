export type Verdict = "pass" | "review" | "fail";

export type ObservationStatus =
  | "match"
  | "mismatch"
  | "uncertain"
  | "not_observable"
  | "not_applicable";

export type Observability = "observable" | "partially_observable" | "not_observable";

export type DifferenceKind =
  | "none"
  | "brand_changed"
  | "text_changed"
  | "value_changed"
  | "count_changed"
  | "color_changed"
  | "component_missing"
  | "component_extra"
  | "shape_changed"
  | "unreadable"
  | "not_visible"
  | "uncertain"
  | "unknown";

export type Confidence = "high" | "medium" | "low";

export type Severity = "critical" | "high" | "medium" | "low";

export type ProductIssueType =
  | "logo_mismatch"
  | "text_mismatch"
  | "quantity_mismatch"
  | "color_mismatch"
  | "major_shape_mismatch"
  | "missing_component"
  | "extra_component"
  | "packaging_mismatch"
  | "variant_mismatch";

export type TechnicalIssueType =
  | "resolution_too_low"
  | "unsupported_file_type"
  | "file_too_large"
  | "image_decode_failed"
  | "blur_detected"
  | "crop_risk"
  | "background_noncompliant"
  | "watermark_detected"
  | "transparency_detected";

export type AnalysisLimitationType =
  | "reference_insufficient"
  | "candidate_insufficient"
  | "reference_conflict"
  | "attribute_not_observable"
  | "coverage_insufficient"
  | "uncertain_observation"
  | "missing_requested_check"
  | "provider_output_invalid"
  | "unknown";

export interface EvidenceRegion {
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NormalizedEvidenceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type RegionUnavailableReason =
  | "not_recorded"
  | "not_visible"
  | "insufficient_evidence"
  | "not_present"
  | "cannot_locate"
  | "uncertain_location"
  | "invalid_region";

export interface ImageEvidenceLocation {
  coordinateSpace: "analysis_image_normalized";
  assetId: string;
  region: NormalizedEvidenceBox | null;
  reason: RegionUnavailableReason | null;
  confidence: Confidence | null;
}

export interface PairedEvidenceRegions {
  schemaVersion: 1;
  reference: ImageEvidenceLocation;
  candidate: ImageEvidenceLocation;
}

export type IdentityEvidenceKind = "readable_text" | "brand_name" | "symbol" | "geometry" | "absent" | "unreadable" | "unknown" | "not_applicable";

export interface ObservationEvidence {
  /** Model-reported readable transcription or distinctive logo identity; not independently verified. */
  identityEvidence?: {
    reference: string | null;
    candidate: string | null;
    referenceKind?: IdentityEvidenceKind;
    candidateKind?: IdentityEvidenceKind;
    /** Application-controlled guard version, independent of model-reported content. */
    validationVersion?: string;
  };
  regions?: PairedEvidenceRegions;
  /** Original region payload, kept independently of normalized display coordinates. */
  regionRaw?: unknown;
  referenceObservation?: string;
  candidateObservation?: string;
  differenceKind?: DifferenceKind;
  comparisonSummary?: string;
  visibleEvidence?: string[];
  uncertainReason?: string;
  referenceVisible?: boolean;
  candidateVisible?: boolean;
  boundingRegions?: EvidenceRegion[];
  raw?: Record<string, unknown> | string;
}

export interface Observation {
  checkType: string;
  status: ObservationStatus;
  differenceKind?: DifferenceKind;
  observability: {
    reference: Observability;
    candidate: Observability;
    coverage: "sufficient" | "partial" | "insufficient";
  };
  confidence: Confidence;
  evidence: ObservationEvidence;
}

export interface ProductIssue {
  kind: "product";
  type: ProductIssueType;
  sourceCheckType: string;
  sourceDifferenceKind?: DifferenceKind;
  sourceObservability: {
    reference: Observability;
    candidate: Observability;
    coverage: "sufficient" | "partial" | "insufficient";
  };
  severity: Severity;
  confidence: Confidence;
  message: string;
  evidence: ObservationEvidence;
}

export interface TechnicalIssue {
  kind: "technical";
  type: TechnicalIssueType;
  sourceCheckType?: string;
  severity: Severity;
  confidence: Confidence;
  message: string;
  evidence: ObservationEvidence;
}

export interface AnalysisLimitation {
  kind: "limitation";
  type: AnalysisLimitationType;
  sourceCheckType?: string;
  confidence: Confidence;
  message: string;
  evidence: ObservationEvidence;
}
