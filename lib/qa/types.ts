import type {
  AnalysisLimitationType,
  Confidence,
  DifferenceKind,
  Observability,
  Observation,
  ObservationEvidence,
  ObservationStatus,
  ProductIssueType,
  Severity,
  Verdict,
} from "@/lib/domain/semantics";

export type M0CheckFamily =
  | "logo"
  | "visible_text"
  | "quantity"
  | "dominant_color"
  | "major_components"
  | "major_shape_packaging";

export interface AssetRef {
  assetId: string;
  mimeType: string;
  r2Key: string;
  dataUrl?: string;
}

export interface M0AnalysisInput {
  analysisId: string;
  reference: AssetRef;
  candidate: AssetRef;
  selectedChecks: M0CheckFamily[];
  category?: string;
}

export interface VisionObservation extends Observation {
  checkType: M0CheckFamily;
  differenceKind?: DifferenceKind;
  explanation: string;
}

export interface AnalysisLimitation {
  kind: "limitation";
  type: AnalysisLimitationType;
  sourceCheckType?: M0CheckFamily;
  confidence: Confidence;
  message: string;
  evidence: ObservationEvidence;
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

export interface FidelityResult {
  observations: VisionObservation[];
  limitations: AnalysisLimitation[];
  modelCall: ModelCallMetadata;
}

export interface VisionProvider {
  name: string;
  analyzeProductFidelity(input: M0AnalysisInput): Promise<FidelityResult>;
}

export interface ProductIssue {
  kind: "product";
  type: ProductIssueType;
  sourceCheckType: M0CheckFamily;
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

export interface RiskPolicyInput {
  analysisId: string;
  selectedChecks: M0CheckFamily[];
  observations: VisionObservation[];
  limitations: AnalysisLimitation[];
}

export interface RiskPolicyResult {
  verdict: Verdict;
  productIssues: ProductIssue[];
  limitations: AnalysisLimitation[];
  passedObservations: VisionObservation[];
  reviewReasons: Array<ProductIssue | AnalysisLimitation>;
  failedReasons: ProductIssue[];
  coverage: {
    selectedChecks: number;
    sufficientlyObservableChecks: number;
    insufficientChecks: number;
  };
}

export interface RiskPolicy {
  version: string;
  decide(input: RiskPolicyInput): RiskPolicyResult;
}

export interface QAEngineResult extends RiskPolicyResult {
  analysisId: string;
  observations: VisionObservation[];
  versions: {
    qaEngineVersion: string;
    riskPolicyVersion: string;
    modelPolicyVersion: string;
  };
  modelCalls: ModelCallMetadata[];
  latencyMs: number;
  estimatedCostUsd?: number;
}

export interface QAEngine {
  version: string;
  analyze(input: M0AnalysisInput): Promise<QAEngineResult>;
}

export interface ObservationDraft {
  checkType: M0CheckFamily;
  status: ObservationStatus;
  differenceKind?: DifferenceKind;
  referenceObservability: Observability;
  candidateObservability: Observability;
  coverage: "sufficient" | "partial" | "insufficient";
  confidence: Confidence;
  explanation: string;
  evidence: ObservationEvidence;
}
