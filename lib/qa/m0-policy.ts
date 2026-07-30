import type {
  AnalysisLimitation,
  M0CheckFamily,
  ProductIssue,
  RiskPolicy,
  RiskPolicyInput,
  RiskPolicyResult,
  VisionObservation,
} from "./types";
import type { DifferenceKind, ObservationEvidence } from "@/lib/domain/semantics";

const CRITICAL_ISSUES = new Set(["logo_mismatch", "text_mismatch", "packaging_mismatch", "major_shape_mismatch"]);
const MISMATCH_DIFFERENCE_KINDS: Record<M0CheckFamily, ReadonlySet<DifferenceKind>> = {
  logo: new Set(["brand_changed"]),
  visible_text: new Set(["text_changed", "value_changed"]),
  quantity: new Set(["count_changed"]),
  dominant_color: new Set(["color_changed"]),
  major_components: new Set(["component_missing", "component_extra"]),
  major_shape_packaging: new Set(["shape_changed"]),
};

export class M0RiskPolicy implements RiskPolicy {
  readonly version = "m0-risk-policy-003";

  decide(input: RiskPolicyInput): RiskPolicyResult {
    const productIssues: ProductIssue[] = [];
    const limitations: AnalysisLimitation[] = [...input.limitations];
    const reviewReasons: Array<ProductIssue | AnalysisLimitation> = [...input.limitations];
    const passedObservations: VisionObservation[] = [];

    for (const selectedCheck of input.selectedChecks) {
      const observations = input.observations.filter((observation) => observation.checkType === selectedCheck);

      if (observations.length === 0) {
        const missingCheckLimitation = limitationForProviderOutput(selectedCheck, "missing_requested_check", {
          selectedCheck,
        });
        limitations.push(missingCheckLimitation);
        reviewReasons.push(missingCheckLimitation);
        continue;
      }

      if (observations.length > 1) {
        const duplicateLimitation = limitationForProviderOutput(selectedCheck, "provider_output_invalid", {
          selectedCheck,
          reason: "duplicate_or_repeated_observation",
          count: observations.length,
        });
        limitations.push(duplicateLimitation);
        reviewReasons.push(duplicateLimitation);
      }

      const observation = observations[0];

      if (observation.status === "not_applicable") {
        continue;
      }

      if (observation.status === "uncertain") {
        const uncertainLimitation = limitationForObservation(observation, "uncertain_observation", {
          uncertainReason: observation.evidence.uncertainReason ?? "Provider marked the observation as uncertain.",
        });
        limitations.push(uncertainLimitation);
        reviewReasons.push(uncertainLimitation);
        continue;
      }

      if (observation.status === "not_observable") {
        const notObservableLimitation = limitationForObservation(observation, "attribute_not_observable", {
          uncertainReason: observation.evidence.uncertainReason ?? "Relevant attribute is not observable.",
        });
        limitations.push(notObservableLimitation);
        reviewReasons.push(notObservableLimitation);
        continue;
      }

      const fullyObservable = isSufficientlyObservable(observation);

      if (observation.status === "match") {
        if (fullyObservable) {
          passedObservations.push(observation);
        } else {
          const coverageLimitation = limitationForObservation(observation, "coverage_insufficient", {
            reason: "match_without_sufficient_coverage",
          });
          limitations.push(coverageLimitation);
          reviewReasons.push(coverageLimitation);
        }
        continue;
      }

      if (observation.status === "mismatch") {
        const issueType = mapDifferenceToIssueType(selectedCheck, observation);

        if (!issueType) {
          const unclassified = limitationForObservation(observation, "provider_output_invalid", {
            reason: "unclassified_mismatch",
            differenceKind: observation.differenceKind ?? null,
          });
          limitations.push(unclassified);
          reviewReasons.push(unclassified);
          continue;
        }

        const issue: ProductIssue = {
          kind: "product",
          type: issueType,
          sourceCheckType: selectedCheck,
          sourceDifferenceKind: observation.differenceKind,
          sourceObservability: observation.observability,
          severity: severityFor(selectedCheck, issueType),
          confidence: observation.confidence,
          message: observation.explanation,
          evidence: observation.evidence,
        };

        productIssues.push(issue);

        if (isCriticalFail(issue, observation)) {
          continue;
        }

        reviewReasons.push(issue);
      }
    }

    const failedReasons = productIssues.filter((issue) => isCriticalFail(issue, findObservationForIssue(input.observations, issue)));
    const reviewOnlyIssues = productIssues.filter((issue) => !failedReasons.includes(issue));
    const sufficientlyObservableChecks = input.selectedChecks.filter((checkType) => {
      const observation = input.observations.find((item) => item.checkType === checkType);
      return observation ? isSufficientlyObservable(observation) : false;
    }).length;
    const insufficientChecks = input.selectedChecks.length - sufficientlyObservableChecks;

    const verdict: RiskPolicyResult["verdict"] =
      failedReasons.length > 0
        ? "fail"
        : reviewReasons.length > 0 || reviewOnlyIssues.length > 0 || sufficientlyObservableChecks < input.selectedChecks.length
          ? "review"
          : "pass";

    return {
      verdict,
      productIssues,
      limitations,
      passedObservations,
      reviewReasons: [...reviewReasons, ...reviewOnlyIssues],
      failedReasons,
      coverage: {
        selectedChecks: input.selectedChecks.length,
        sufficientlyObservableChecks,
        insufficientChecks,
      },
    };
  }
}

function isSufficientlyObservable(observation: VisionObservation) {
  return (
    observation.status !== "uncertain" &&
    observation.status !== "not_observable" &&
    observation.observability.coverage === "sufficient" &&
    observation.observability.reference === "observable" &&
    observation.observability.candidate === "observable"
  );
}

function isCriticalFail(issue: ProductIssue, observation?: VisionObservation) {
  if (!observation) {
    return false;
  }

  return (
    issue.confidence === "high" &&
    issue.severity === "critical" &&
    observation.status === "mismatch" &&
    isSufficientlyObservable(observation)
  );
}

function findObservationForIssue(observations: VisionObservation[], issue: ProductIssue) {
  return observations.find((observation) => observation.checkType === issue.sourceCheckType);
}

function severityFor(checkType: M0CheckFamily, issueType: ProductIssue["type"]): ProductIssue["severity"] {
  if (CRITICAL_ISSUES.has(issueType)) {
    return "critical";
  }

  if (checkType === "quantity") {
    return "high";
  }

  return "high";
}

function mapDifferenceToIssueType(
  checkType: M0CheckFamily,
  observation: VisionObservation,
): ProductIssue["type"] | null {
  if (!observation.differenceKind || !MISMATCH_DIFFERENCE_KINDS[checkType].has(observation.differenceKind)) {
    return null;
  }

  switch (checkType) {
    case "logo":
      return "logo_mismatch";
    case "visible_text":
      return "text_mismatch";
    case "quantity":
      return "quantity_mismatch";
    case "dominant_color":
      return "color_mismatch";
    case "major_components":
      if (observation.differenceKind === "component_extra") {
        return "extra_component";
      }

      if (observation.differenceKind === "component_missing") {
        return "missing_component";
      }

      return null;
    case "major_shape_packaging":
      return "packaging_mismatch";
    default:
      return null;
  }
}

function limitationForObservation(
  observation: VisionObservation,
  type: AnalysisLimitation["type"],
  extraEvidence: Record<string, unknown>,
): AnalysisLimitation {
  const baseRaw = normalizeEvidenceRaw(observation.evidence.raw);
  return {
    kind: "limitation",
    type,
    sourceCheckType: observation.checkType,
    confidence: observation.confidence,
    message: limitationMessage(type, observation.checkType),
    evidence: {
      ...observation.evidence,
      raw: {
        ...baseRaw,
        ...extraEvidence,
      },
    },
  };
}

function limitationForProviderOutput(
  selectedCheck: M0CheckFamily,
  type: AnalysisLimitation["type"],
  extraEvidence: Record<string, unknown>,
): AnalysisLimitation {
  return {
    kind: "limitation",
    type,
    sourceCheckType: selectedCheck,
    confidence: "high",
    message: limitationMessage(type, selectedCheck),
    evidence: {
      raw: {
        ...extraEvidence,
      },
    },
  };
}

function normalizeEvidenceRaw(raw: ObservationEvidence["raw"]): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw;
  }

  if (typeof raw === "string" && raw.length > 0) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { rawText: raw };
    }
  }

  return {};
}

function limitationMessage(type: AnalysisLimitation["type"], checkType: M0CheckFamily) {
  switch (type) {
    case "attribute_not_observable":
      return `${checkType} is not sufficiently observable.`;
    case "coverage_insufficient":
      return `${checkType} does not have sufficient coverage to support a PASS.`;
    case "uncertain_observation":
      return `${checkType} is uncertain and requires review.`;
    case "provider_output_invalid":
      return `${checkType} provider output was invalid or unclassifiable.`;
    case "missing_requested_check":
      return `${checkType} was not returned by the provider.`;
    default:
      return `${checkType} requires review.`;
  }
}
