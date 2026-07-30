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

export interface ObservationEvidence {
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
