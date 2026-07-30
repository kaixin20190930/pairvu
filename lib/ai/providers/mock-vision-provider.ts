import type { FidelityResult, M0AnalysisInput, VisionObservation, VisionProvider } from "@/lib/qa/types";

export class MockVisionProvider implements VisionProvider {
  readonly name = "mock";

  async analyzeProductFidelity(input: M0AnalysisInput): Promise<FidelityResult> {
    const observations: VisionObservation[] = input.selectedChecks.map((checkType) => ({
      checkType,
      status: "match",
      differenceKind: "none",
      observability: {
        reference: "observable",
        candidate: "observable",
        coverage: "sufficient",
      },
      confidence: "high",
      explanation: `${checkType} appears consistent in the controlled mock provider.`,
      evidence: {
        referenceObservation: `${checkType} appears unchanged.`,
        candidateObservation: `${checkType} appears unchanged.`,
        differenceKind: "none",
        comparisonSummary: "Mock provider reported a match.",
        visibleEvidence: ["mock"],
        referenceVisible: true,
        candidateVisible: true,
        raw: {
          source: "mock",
        },
      },
    }));

    return {
      observations,
      limitations: [],
      modelCall: {
        provider: this.name,
        model: "mock-m0",
        promptVersion: "mock",
        latencyMs: 0,
        estimatedCostUsd: 0,
      },
    };
  }
}
