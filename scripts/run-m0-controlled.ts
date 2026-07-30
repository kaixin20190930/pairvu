import { mkdir, readFile, writeFile } from "node:fs/promises";
import { M0QAEngine } from "@/lib/qa/engine";
import type { FidelityResult, M0AnalysisInput, M0CheckFamily, VisionObservation, VisionProvider } from "@/lib/qa/types";

interface ControlledCase {
  id: string;
  category: string;
  selectedChecks: M0CheckFamily[];
  expected: {
    verdict: "pass" | "review" | "fail";
    issueTypes: string[];
    limitations: string[];
    observability: {
      reference: "observable" | "partially_observable" | "not_observable";
      candidate: "observable" | "partially_observable" | "not_observable";
      coverage: "sufficient" | "partial" | "insufficient";
    };
  };
}

class ControlledFixtureVisionProvider implements VisionProvider {
  readonly name = "controlled-fixture";

  constructor(private readonly testCase: ControlledCase) {}

  async analyzeProductFidelity(input: M0AnalysisInput): Promise<FidelityResult> {
    const issueQueue = [...this.testCase.expected.issueTypes];
    const primaryIssue = issueQueue.shift();
    const primaryCheck = primaryIssue ? checkForIssue(primaryIssue) : undefined;
    const firstLimitation = this.testCase.expected.limitations[0];
    const observations: VisionObservation[] = input.selectedChecks.map((checkType, index) => {
      const isPrimaryMismatch = primaryCheck === checkType;
      const useLimitation = index === 0 && firstLimitation === "attribute_not_observable";
      const observationStatus = useLimitation ? "not_observable" : isPrimaryMismatch ? "mismatch" : "match";
      const usesExpectedObservability = index === 0 || isPrimaryMismatch;
      const differenceKind = isPrimaryMismatch ? mapIssueToDifferenceKind(primaryIssue) : "none";

      return {
        checkType,
        status: observationStatus,
        differenceKind,
        observability: usesExpectedObservability
          ? this.testCase.expected.observability
          : {
              reference: "observable",
              candidate: "observable",
              coverage: "sufficient",
            },
        confidence: "high",
        explanation: isPrimaryMismatch
          ? `Controlled fixture reports ${primaryIssue}.`
          : useLimitation
            ? `Controlled fixture reports ${checkType} as not observable.`
          : `Controlled fixture reports ${checkType} as matching.`,
        evidence: {
          referenceObservation: isPrimaryMismatch
            ? `${checkType} shows a controlled difference.`
            : useLimitation
              ? `${checkType} is not clearly visible.`
              : `${checkType} appears unchanged.`,
          candidateObservation: isPrimaryMismatch
            ? `${checkType} shows the seeded mismatch.`
            : useLimitation
              ? `${checkType} is not clearly visible in the candidate.`
              : `${checkType} appears unchanged.`,
          differenceKind,
          comparisonSummary: isPrimaryMismatch
            ? `Controlled fixture reports ${primaryIssue}.`
            : useLimitation
              ? "Controlled fixture reports the observation as not observable."
              : "Controlled fixture reported a match.",
          visibleEvidence: [this.testCase.id, checkType],
          uncertainReason: useLimitation ? "Seeded not-observable fixture." : undefined,
          referenceVisible: !useLimitation,
          candidateVisible: !useLimitation,
          raw: {
            caseId: this.testCase.id,
            source: "controlled_fixture",
          },
        },
      };
    });

    return {
      observations,
      limitations: this.testCase.expected.limitations.map((limitation) => ({
        kind: "limitation",
        type: limitation as FidelityResult["limitations"][number]["type"],
        confidence: "high",
        message: `Controlled fixture reports ${limitation}.`,
        evidence: {
          comparisonSummary: `Controlled fixture reports ${limitation}.`,
          raw: {
            caseId: this.testCase.id,
            source: "controlled_fixture",
            limitation,
          },
        },
      })),
      modelCall: {
        provider: this.name,
        model: "controlled-fixture-v1",
        promptVersion: "fixture",
        latencyMs: 0,
        estimatedCostUsd: 0,
      },
    };
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const casesPath = "eval/m0/controlled-cases.json";
  const predictionsPath = "eval/m0/controlled-predictions.json";
  const cases = JSON.parse(await readFile(casesPath, "utf8")) as ControlledCase[];
  const predictions = [];

  for (const [index, testCase] of cases.entries()) {
    const runs = index < 10 ? 2 : 1;

    for (let run = 0; run < runs; run += 1) {
      const startedAt = Date.now();
      const engine = new M0QAEngine(new ControlledFixtureVisionProvider(testCase));
      const result = await engine.analyze({
        analysisId: `${testCase.id}_run_${run + 1}`,
        reference: {
          assetId: `${testCase.id}_reference`,
          mimeType: "image/png",
          r2Key: `eval/${testCase.id}/reference.png`,
        },
        candidate: {
          assetId: `${testCase.id}_candidate`,
          mimeType: "image/png",
          r2Key: `eval/${testCase.id}/candidate.png`,
        },
        selectedChecks: testCase.selectedChecks,
        category: testCase.category,
      });

      predictions.push({
        caseId: testCase.id,
        verdict: result.verdict,
        issueTypes: result.productIssues.map((issue) => issue.type),
        limitations: result.limitations.map((limitation) => limitation.type),
        observability: aggregateObservability(result.observations),
        latencyMs: Date.now() - startedAt,
        estimatedCostUsd: result.estimatedCostUsd ?? 0,
        repeatabilityGroupId: index < 10 ? `repeat_${String(index + 1).padStart(3, "0")}` : undefined,
      });
    }
  }

  await mkdir("eval/m0", { recursive: true });
  await writeFile(predictionsPath, `${JSON.stringify(predictions, null, 2)}\n`);

  console.log(`Generated ${predictions.length} controlled predictions at ${predictionsPath}.`);
}

function checkForIssue(issueType: string): M0CheckFamily {
  if (issueType === "logo_mismatch") return "logo";
  if (issueType === "text_mismatch") return "visible_text";
  if (issueType === "quantity_mismatch") return "quantity";
  if (issueType === "color_mismatch") return "dominant_color";
  if (issueType === "missing_component" || issueType === "extra_component") return "major_components";
  return "major_shape_packaging";
}

function mapIssueToDifferenceKind(issueType?: string): VisionObservation["differenceKind"] {
  if (issueType === "logo_mismatch") return "brand_changed";
  if (issueType === "text_mismatch") return "value_changed";
  if (issueType === "quantity_mismatch") return "count_changed";
  if (issueType === "color_mismatch") return "color_changed";
  if (issueType === "missing_component") return "component_missing";
  if (issueType === "extra_component") return "component_extra";
  if (issueType === "major_shape_mismatch") return "shape_changed";
  if (issueType === "packaging_mismatch") return "shape_changed";

  return "unknown";
}

function aggregateObservability(observations: VisionObservation[]) {
  const insufficient = observations.find((observation) => observation.observability.coverage === "insufficient");
  const partial = observations.find((observation) => observation.observability.coverage === "partial");
  const selected = insufficient ?? partial ?? observations[0];

  return selected.observability;
}
