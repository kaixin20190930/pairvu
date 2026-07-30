import type {
  AnalysisLimitation,
  Confidence,
  DifferenceKind,
  Observability,
  ProductIssue,
  Verdict,
} from "@/lib/domain/semantics";
import type { ModelCallMetadata, M0CheckFamily, VisionObservation } from "@/lib/qa/types";

export type AnalysisStatus = "queued" | "running" | "completed" | "failed";

export type FeedbackKind = "correct" | "false_alarm" | "missed_something";

export interface AnalysisCreateInput {
  analysisId: string;
  idempotencyKey?: string;
  workspaceId?: string;
  anonymousSessionId?: string;
  referenceAssetId: string;
  candidateAssetId: string;
  selectedChecks: M0CheckFamily[];
  category?: string;
}

export interface PersistedAnalysisSummary {
  id: string;
  status: AnalysisStatus;
  verdict: Verdict | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  workspaceId: string | null;
  anonymousSessionId: string | null;
  referenceAssetId: string;
  candidateAssetId: string;
  category: string | null;
  selectedChecks: M0CheckFamily[];
  qaEngineVersion: string | null;
  riskPolicyVersion: string | null;
  modelPolicyVersion: string | null;
  analysisLatencyMs: number | null;
  openaiLatencyMs: number | null;
  estimatedCostUsd: number | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface PersistedAnalysisObservation extends VisionObservation {
  id: string;
}

export interface PersistedAnalysisIssue extends ProductIssue {
  id: string;
  observationId: string | null;
}

export interface PersistedAnalysisLimitation extends AnalysisLimitation {
  id: string;
  observationId: string | null;
}

export interface PersistedAnalysisModelCall extends ModelCallMetadata {
  id: string;
  purpose: string;
  modelPolicyVersion: string | null;
  status: "completed" | "failed";
  errorCode: string | null;
  errorMessage: string | null;
  inputAssetIds: string[];
}

export interface PersistedAnalysisFeedback {
  id: string;
  analysisId: string;
  feedbackKind: FeedbackKind;
  reasonCode: string | null;
  checkFamily: string | null;
  issueId: string | null;
  comment: string | null;
  createdAt: string;
}

export interface PersistedAnalysisResult extends PersistedAnalysisSummary {
  observations: PersistedAnalysisObservation[];
  productIssues: PersistedAnalysisIssue[];
  limitations: PersistedAnalysisLimitation[];
  modelCalls: PersistedAnalysisModelCall[];
  feedback: PersistedAnalysisFeedback | null;
}

export interface AnalysisResultEnvelope extends PersistedAnalysisResult {
  modelCalls: PersistedAnalysisModelCall[];
}

export interface AnalysisFeedbackInput {
  analysisId: string;
  anonymousSessionId: string;
  feedbackKind: FeedbackKind;
  reasonCode?: string;
  checkFamily?: string;
  issueId?: string;
  comment?: string;
}

export interface AnalysisExecutionTelemetry {
  provider: string;
  model: string;
  promptVersion: string;
  qaEngineVersion: string;
  riskPolicyVersion: string;
  modelPolicyVersion: string;
  analysisLatencyMs: number;
  openaiLatencyMs: number;
  estimatedCostUsd?: number | null;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface AnalysisViewModel extends PersistedAnalysisResult {
  verdictLabel: string;
  productIssueGroups: Array<{
    type: string;
    severity: string;
    confidence: Confidence;
    checkType: string;
    explanation: string;
    evidence: {
      referenceObservation?: string;
      candidateObservation?: string;
      differenceKind?: DifferenceKind;
      comparisonSummary?: string;
      visibleEvidence?: string[];
      uncertainReason?: string;
      referenceVisible?: boolean;
      candidateVisible?: boolean;
      observability: {
        reference: Observability;
        candidate: Observability;
        coverage: "sufficient" | "partial" | "insufficient";
      };
    };
  }>;
}
