import assert from "node:assert/strict";
import {
  buildInstructions,
  estimateOpenAICostUsd,
} from "@/lib/ai/providers/openai-vision-provider";
import { M0QAEngine } from "@/lib/qa/engine";
import { M0RiskPolicy } from "@/lib/qa/m0-policy";
import type { M0CheckFamily, VisionObservation } from "@/lib/qa/types";
import type { DifferenceKind } from "@/lib/domain/semantics";

async function main() {
const policy = new M0RiskPolicy();

const componentShapeLeak = policy.decide({
  analysisId: "component-shape-leak",
  selectedChecks: ["major_components"],
  observations: [mismatch("major_components", "shape_changed")],
  limitations: [],
});

assert.equal(componentShapeLeak.productIssues.length, 0);
assert.equal(componentShapeLeak.limitations[0]?.type, "provider_output_invalid");
assert.equal(componentShapeLeak.verdict, "review");

const textColorLeak = policy.decide({
  analysisId: "text-color-leak",
  selectedChecks: ["visible_text"],
  observations: [mismatch("visible_text", "color_changed")],
  limitations: [],
});

assert.equal(textColorLeak.productIssues.length, 0);
assert.equal(textColorLeak.limitations[0]?.type, "provider_output_invalid");
assert.equal(textColorLeak.verdict, "review");

const validShapeChange = policy.decide({
  analysisId: "valid-shape-change",
  selectedChecks: ["major_shape_packaging"],
  observations: [mismatch("major_shape_packaging", "shape_changed")],
  limitations: [],
});

assert.equal(validShapeChange.productIssues[0]?.type, "packaging_mismatch");
assert.equal(validShapeChange.verdict, "fail");

const differentPackageFace = policy.decide({
  analysisId: "different-package-face",
  selectedChecks: ["visible_text"],
  observations: [
    {
      checkType: "visible_text",
      status: "not_observable",
      differenceKind: "not_visible",
      observability: {
        reference: "observable",
        candidate: "not_observable",
        coverage: "insufficient",
      },
      confidence: "high",
      explanation: "Reference front label and candidate back label are not corresponding surfaces.",
      evidence: {
        referenceObservation: "Front label visible",
        candidateObservation: "Back label visible",
        uncertainReason: "Corresponding front label is not visible in the candidate.",
      },
    },
  ],
  limitations: [],
});

assert.equal(differentPackageFace.verdict, "review");
assert.equal(differentPackageFace.productIssues.length, 0);
assert.equal(differentPackageFace.limitations[0]?.type, "attribute_not_observable");

const correspondenceInstructions = buildInstructions({
  analysisId: "prompt-contract",
  reference: { assetId: "reference", mimeType: "image/png", r2Key: "reference" },
  candidate: { assetId: "candidate", mimeType: "image/png", r2Key: "candidate" },
  selectedChecks: ["logo", "visible_text"],
});

assert.match(correspondenceInstructions, /same corresponding package face/);
assert.match(correspondenceInstructions, /front label and candidate back label/);
assert.match(correspondenceInstructions, /Never report text_changed or value_changed solely because different package faces/);
assert.match(correspondenceInstructions, /Occlusion is not evidence of a product change/);
assert.match(correspondenceInstructions, /sticker, mask, crop, hand, glare, reflection/);
assert.match(correspondenceInstructions, /A mismatch requires the changed or replacement identity content itself/);
assert.match(correspondenceInstructions, /CANDIDATE independently before using the reference/);
assert.match(correspondenceInstructions, /Never use readable reference content to autocomplete/);
assert.match(correspondenceInstructions, /If the image boundary cuts through the product/);
assert.match(correspondenceInstructions, /If the product silhouette exits the image frame/);

assert.equal(
  estimateOpenAICostUsd("gpt-4.1-mini", {
    inputTokens: 6_000,
    cachedInputTokens: 1_000,
    outputTokens: 1_500,
  }),
  0.0045,
);
assert.equal(
  estimateOpenAICostUsd("unsupported-model", {
    inputTokens: 6_000,
    outputTokens: 1_500,
  }),
  undefined,
);

const normalizedMatch = await new M0QAEngine({
  name: "consistency-test-provider",
  async analyzeProductFidelity() {
    return {
      observations: [
        {
          checkType: "visible_text",
          status: "match",
          differenceKind: "text_changed",
          observability: {
            reference: "observable",
            candidate: "observable",
            coverage: "sufficient",
          },
          confidence: "high",
          explanation: "Visible wording and values match.",
          evidence: {
            differenceKind: "text_changed",
            referenceObservation: "Same text",
            candidateObservation: "Same text",
          },
        },
      ],
      limitations: [],
      modelCall: {
        provider: "consistency-test-provider",
        model: "test",
        promptVersion: "test",
        latencyMs: 0,
      },
    };
  },
}).analyze({
  analysisId: "match-difference-kind-normalization",
  reference: {
    assetId: "reference",
    mimeType: "image/png",
    r2Key: "reference",
  },
  candidate: {
    assetId: "candidate",
    mimeType: "image/png",
    r2Key: "candidate",
  },
  selectedChecks: ["visible_text"],
});

assert.equal(normalizedMatch.verdict, "pass");
assert.equal(normalizedMatch.observations[0]?.differenceKind, "none");
assert.equal(normalizedMatch.observations[0]?.evidence.differenceKind, "none");
assert.deepEqual(normalizedMatch.observations[0]?.evidence.raw, {
  normalizationReason: "match_requires_none",
  providerObservationDifferenceKind: "text_changed",
  providerEvidenceDifferenceKind: "text_changed",
});

console.log("M0 policy boundary checks passed.");
}

function mismatch(checkType: M0CheckFamily, differenceKind: DifferenceKind): VisionObservation {
  return {
    checkType,
    status: "mismatch",
    differenceKind,
    observability: {
      reference: "observable",
      candidate: "observable",
      coverage: "sufficient",
    },
    confidence: "high",
    explanation: `${checkType} mismatch`,
    evidence: {
      differenceKind,
      referenceVisible: true,
      candidateVisible: true,
    },
  };
}

void main();
