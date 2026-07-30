# QA Engine TypeScript Contracts

These contracts define the domain boundary. They are intentionally provider-neutral and should be implemented before any OpenAI call is wired.

The model/provider observes. Product policy decides.

```ts
export type Verdict = "pass" | "review" | "fail";

export type ObservationStatus =
  | "match"
  | "mismatch"
  | "uncertain"
  | "not_observable"
  | "not_applicable";

export type Observability =
  | "observable"
  | "partially_observable"
  | "not_observable";

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

export type IssueType = ProductIssueType | TechnicalIssueType;

export interface AssetRef {
  assetId: string;
  workspaceId?: string;
  r2Key: string;
  mimeType: string;
  width?: number;
  height?: number;
  sha256?: string;
}

export interface ProductContext {
  productId?: string;
  categoryKey?: string;
  name?: string;
  approvedAttributes?: ProductAttribute[];
  allowedVariation?: Record<string, unknown>;
}

export interface ProductAttribute {
  key: string;
  value: unknown;
  source: "user_confirmed" | "ai_suggested" | "imported";
}

export interface CheckInput {
  analysisId: string;
  workspaceId?: string;
  references: [AssetRef]; // M0 uses exactly one reference image.
  candidate: AssetRef;
  product?: ProductContext;
}

export interface EvidenceRegion {
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObservationEvidence {
  referenceFacts?: string[];
  candidateFacts?: string[];
  comparisonSummary?: string;
  visibleEvidence?: string[];
  uncertainReason?: string;
  boundingRegions?: EvidenceRegion[];
  raw?: Record<string, unknown>;
}

export interface Observation {
  checkType: string;
  status: ObservationStatus;
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
  severity: Severity;
  confidence: Confidence;
  message: string;
  evidence: ObservationEvidence;
}

export interface TechnicalIssue {
  kind: "technical";
  type: TechnicalIssueType;
  severity: Severity;
  confidence: Confidence;
  message: string;
  evidence: ObservationEvidence;
}

export interface AnalysisLimitation {
  kind: "limitation";
  type: AnalysisLimitationType;
  confidence: Confidence;
  message: string;
  evidence: ObservationEvidence;
}

export type RiskInputItem = Observation | ProductIssue | TechnicalIssue | AnalysisLimitation;

export interface Check {
  key: string;
  version: string;
  run(input: CheckInput): Promise<Observation | TechnicalIssue | AnalysisLimitation>;
}

export interface FidelityInput extends CheckInput {
  requestedChecks: Array<
    | "logo"
    | "visible_text"
    | "quantity"
    | "dominant_color"
    | "major_components"
    | "major_shape_packaging"
  >;
}

export interface FidelityResult {
  observations: Observation[];
  limitations: AnalysisLimitation[];
  providerMetadata: ModelCallMetadata;
}

export interface ModelCallMetadata {
  provider: string;
  model: string;
  promptVersion: string;
  latencyMs: number;
  estimatedCostUsd?: number;
  inputUsage?: Record<string, unknown>;
  outputUsage?: Record<string, unknown>;
}

export interface VisionProvider {
  name: string;
  analyzeProductFidelity(input: FidelityInput): Promise<FidelityResult>;
}

export interface RuleSet {
  id: string;
  marketplace?: string;
  region?: string;
  assetType: "image" | "video";
  version: string;
  rules: Rule[];
}

export interface Rule {
  ruleId: string;
  ruleVersion: string;
  ruleType: "deterministic" | "vision" | "hybrid" | "manual_only";
  evaluate(input: CheckInput): Promise<Observation | TechnicalIssue | AnalysisLimitation>;
}

export interface RiskPolicy {
  version: string;
  decide(input: RiskInput): RiskResult;
}

export interface RiskInput {
  analysisId: string;
  observations: Observation[];
  productIssues: ProductIssue[];
  technicalIssues: TechnicalIssue[];
  limitations: AnalysisLimitation[];
}

export interface RiskResult {
  verdict: Verdict;
  productIssues: ProductIssue[];
  technicalIssues: TechnicalIssue[];
  limitations: AnalysisLimitation[];
  passedObservations: Observation[];
  reviewReasons: Array<ProductIssue | TechnicalIssue | AnalysisLimitation>;
  failedReasons: Array<ProductIssue | TechnicalIssue>;
  coverage: {
    selectedChecks: number;
    sufficientlyObservableChecks: number;
    insufficientChecks: number;
  };
}

export interface QAEngineInput {
  analysisId: string;
  workspaceId?: string;
  references: [AssetRef]; // M0 only.
  candidate: AssetRef;
  product?: ProductContext;
  ruleSet?: RuleSet;
}

export interface QAEngineResult {
  analysisId: string;
  verdict: Verdict;
  observations: Observation[];
  productIssues: ProductIssue[];
  technicalIssues: TechnicalIssue[];
  limitations: AnalysisLimitation[];
  versions: {
    qaEngineVersion: string;
    riskPolicyVersion: string;
    modelPolicyVersion: string;
    ruleSetVersion?: string;
  };
  modelCalls: ModelCallMetadata[];
  latencyMs: number;
  estimatedCostUsd?: number;
}

export interface QAEngine {
  version: string;
  analyze(input: QAEngineInput): Promise<QAEngineResult>;
}
```

## Responsibility Boundary

- `VisionProvider`: observable facts, comparison status, observability, confidence, evidence, and limitations.
- `Check`: deterministic or domain-specific observations and technical issues.
- `RiskPolicy`: severity normalization, issue derivation, review/failed reasons, coverage evaluation, final verdict.
- `QAEngine`: domain orchestration across checks, observations, issue derivation, risk evaluation, and result normalization.
- Application/infrastructure services: R2, D1, queues, persistence, provider transport, operational telemetry persistence, auth, billing, API responses.

## M0 Risk Policy Baseline

Version: `m0-risk-policy-001`

FAIL:

- confirmed high-confidence critical product identity mismatch;
- wrong brand/logo when sufficiently visible;
- critical visible identity text mismatch such as size, volume, weight, flavor, shade, model, or variant;
- major packaging identity mismatch.

REVIEW:

- uncertain mismatch;
- low observability;
- potentially important attribute is not observable;
- moderate mismatch;
- reference insufficient;
- candidate insufficient;
- intentional quantity variation cannot be established;
- coverage is insufficient to safely pass.

PASS:

- no meaningful mismatch is detected;
- selected identity attributes have sufficient observability;
- no analysis limitation materially affects the selected checks.

Never return `PASS` merely because the model found no issue.
