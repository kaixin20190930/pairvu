import { M0RiskPolicy } from "./m0-policy";
import type {
  AnalysisLimitation,
  M0AnalysisInput,
  QAEngine,
  QAEngineResult,
  RiskPolicy,
  VisionObservation,
  VisionProvider,
} from "./types";

export class M0QAEngine implements QAEngine {
  readonly version = "m0-qa-engine-005";

  constructor(
    private readonly visionProvider: VisionProvider,
    private readonly riskPolicy: RiskPolicy = new M0RiskPolicy(),
    private readonly modelPolicyVersion = "m0-model-policy-002",
  ) {}

  async analyze(input: M0AnalysisInput): Promise<QAEngineResult> {
    const startedAt = Date.now();
    const fidelity = await this.visionProvider.analyzeProductFidelity(input);
    const validation = validateProviderResult(input, fidelity.observations);
    const risk = this.riskPolicy.decide({
      analysisId: input.analysisId,
      selectedChecks: input.selectedChecks,
      observations: validation.observations,
      limitations: [...fidelity.limitations, ...validation.limitations],
    });
    const latencyMs = Date.now() - startedAt;

    return {
      analysisId: input.analysisId,
      observations: validation.observations,
      ...risk,
      versions: {
        qaEngineVersion: this.version,
        riskPolicyVersion: this.riskPolicy.version,
        modelPolicyVersion: this.modelPolicyVersion,
      },
      modelCalls: [fidelity.modelCall],
      latencyMs,
      estimatedCostUsd: fidelity.modelCall.estimatedCostUsd,
    };
  }
}

function validateProviderResult(input: M0AnalysisInput, observations: VisionObservation[]) {
  const selectedChecks = new Set(input.selectedChecks);
  const observationsByCheck = new Map<string, VisionObservation[]>();

  for (const observation of observations) {
    const existing = observationsByCheck.get(observation.checkType) ?? [];
    existing.push(observation);
    observationsByCheck.set(observation.checkType, existing);
  }

  const normalizedObservations: VisionObservation[] = [];
  const limitations: AnalysisLimitation[] = [];

  for (const checkType of input.selectedChecks) {
    const items = observationsByCheck.get(checkType) ?? [];

    if (items.length === 0) {
      limitations.push({
        kind: "limitation",
        type: "missing_requested_check",
        sourceCheckType: checkType,
        confidence: "high",
        message: `Provider did not return an observation for ${checkType}.`,
        evidence: {
          raw: {
            selectedCheck: checkType,
            observedChecks: observations.map((observation) => observation.checkType),
          },
        },
      });
      continue;
    }

    if (items.length > 1) {
      limitations.push({
        kind: "limitation",
        type: "provider_output_invalid",
        sourceCheckType: checkType,
        confidence: "high",
        message: `Provider returned ${items.length} observations for ${checkType}; expected exactly one.`,
        evidence: {
          raw: {
            selectedCheck: checkType,
            count: items.length,
          },
        },
      });
    }

    normalizedObservations.push(normalizeObservationConsistency(items[0]));
  }

  for (const observation of observations) {
    if (!selectedChecks.has(observation.checkType)) {
      limitations.push({
        kind: "limitation",
        type: "provider_output_invalid",
        sourceCheckType: observation.checkType as never,
        confidence: "high",
        message: `Provider returned an unexpected observation for ${observation.checkType}.`,
        evidence: {
          raw: {
            unexpectedCheck: observation.checkType,
          },
        },
      });
    }
  }

  return {
    observations: normalizedObservations,
    limitations,
  };
}

function normalizeObservationConsistency(observation: VisionObservation): VisionObservation {
  if ((observation.status === "match" || observation.status === "mismatch") && !hasSufficientObservability(observation)) {
    const providerStatus = observation.status;
    const providerDifferenceKind = observation.differenceKind;
    const providerEvidenceDifferenceKind = observation.evidence.differenceKind;

    return {
      ...observation,
      status: "not_observable",
      differenceKind: "not_visible",
      evidence: {
        ...observation.evidence,
        differenceKind: "not_visible",
        uncertainReason:
          observation.evidence.uncertainReason ??
          `The provider reported a ${providerStatus} without sufficient corresponding coverage.`,
        raw: {
          ...normalizeEvidenceRaw(observation.evidence.raw),
          normalizationReason: `${providerStatus}_requires_sufficient_observability`,
          providerStatus,
          providerObservationDifferenceKind: providerDifferenceKind ?? null,
          providerEvidenceDifferenceKind: providerEvidenceDifferenceKind ?? null,
          providerObservability: observation.observability,
        },
      },
    };
  }

  if (observation.status !== "match") {
    return observation;
  }

  const providerObservationDifferenceKind = observation.differenceKind;
  const providerEvidenceDifferenceKind = observation.evidence.differenceKind;
  const hasContradiction =
    (providerObservationDifferenceKind !== undefined && providerObservationDifferenceKind !== "none") ||
    (providerEvidenceDifferenceKind !== undefined && providerEvidenceDifferenceKind !== "none");

  return {
    ...observation,
    differenceKind: "none",
    evidence: {
      ...observation.evidence,
      differenceKind: "none",
      raw: hasContradiction
        ? {
            ...normalizeEvidenceRaw(observation.evidence.raw),
            normalizationReason: "match_requires_none",
            providerObservationDifferenceKind: providerObservationDifferenceKind ?? null,
            providerEvidenceDifferenceKind: providerEvidenceDifferenceKind ?? null,
          }
        : observation.evidence.raw,
    },
  };
}

function hasSufficientObservability(observation: VisionObservation) {
  return (
    observation.observability.coverage === "sufficient" &&
    observation.observability.reference === "observable" &&
    observation.observability.candidate === "observable" &&
    observation.evidence.referenceVisible !== false &&
    observation.evidence.candidateVisible !== false
  );
}

function normalizeEvidenceRaw(raw: VisionObservation["evidence"]["raw"]): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw;
  }

  return raw ? { providerRaw: raw } : {};
}
