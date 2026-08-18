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

const familyCases: Array<{
  checkType: M0CheckFamily;
  differenceKind: DifferenceKind;
  issueType: string;
  verdict: "fail" | "review";
}> = [
  { checkType: "logo", differenceKind: "brand_changed", issueType: "logo_mismatch", verdict: "fail" },
  { checkType: "visible_text", differenceKind: "value_changed", issueType: "text_mismatch", verdict: "fail" },
  { checkType: "quantity", differenceKind: "count_changed", issueType: "quantity_mismatch", verdict: "review" },
  { checkType: "dominant_color", differenceKind: "color_changed", issueType: "color_mismatch", verdict: "review" },
  { checkType: "major_components", differenceKind: "component_missing", issueType: "missing_component", verdict: "review" },
  { checkType: "major_shape_packaging", differenceKind: "shape_changed", issueType: "packaging_mismatch", verdict: "fail" },
];

for (const testCase of familyCases) {
  const result = policy.decide({
    analysisId: `family-${testCase.checkType}`,
    selectedChecks: [testCase.checkType],
    observations: [mismatch(testCase.checkType, testCase.differenceKind)],
    limitations: [],
  });
  assert.equal(result.productIssues[0]?.type, testCase.issueType, `${testCase.checkType} must keep its canonical issue type`);
  assert.equal(result.verdict, testCase.verdict, `${testCase.checkType} must keep its M0 verdict boundary`);
}

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
assert.match(correspondenceInstructions, /isolated label panel as partial product coverage/);
assert.match(correspondenceInstructions, /do not compare the reference's full package body color/);
assert.match(correspondenceInstructions, /candidate shows only a label or interior package region/);
assert.match(correspondenceInstructions, /matching logo or readable text on a close-up label may be observable/);
assert.match(correspondenceInstructions, /directly visible corresponding color-bearing regions/);
assert.match(correspondenceInstructions, /crop shows only a label panel/);
assert.match(correspondenceInstructions, /close-up label or partial package fragment does not establish/);
assert.match(correspondenceInstructions, /never infer candidate count from the reference/);

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

const normalizedPartialMismatch = await new M0QAEngine({
  name: "partial-mismatch-test-provider",
  async analyzeProductFidelity() {
    return {
      observations: [
        {
          checkType: "dominant_color",
          status: "mismatch",
          differenceKind: "color_changed",
          observability: {
            reference: "observable",
            candidate: "partially_observable",
            coverage: "partial",
          },
          confidence: "high",
          explanation: "Candidate shows only a label close-up; package body color is omitted.",
          evidence: {
            differenceKind: "color_changed",
            referenceObservation: "Full orange pouch body",
            candidateObservation: "White label close-up with package body outside the frame",
          },
        },
      ],
      limitations: [],
      modelCall: {
        provider: "partial-mismatch-test-provider",
        model: "test",
        promptVersion: "test",
        latencyMs: 0,
      },
    };
  },
}).analyze({
  analysisId: "partial-mismatch-normalization",
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
  selectedChecks: ["dominant_color"],
});

assert.equal(normalizedPartialMismatch.verdict, "review");
assert.equal(normalizedPartialMismatch.productIssues.length, 0);
assert.equal(normalizedPartialMismatch.observations[0]?.status, "not_observable");
assert.equal(normalizedPartialMismatch.observations[0]?.differenceKind, "not_visible");
assert.equal(normalizedPartialMismatch.limitations[0]?.type, "attribute_not_observable");
assert.deepEqual(normalizedPartialMismatch.observations[0]?.evidence.raw, {
  normalizationReason: "mismatch_requires_sufficient_observability",
  providerStatus: "mismatch",
  providerObservationDifferenceKind: "color_changed",
  providerEvidenceDifferenceKind: "color_changed",
  providerObservability: {
    reference: "observable",
    candidate: "partially_observable",
    coverage: "partial",
  },
});

const normalizedUnsupportedMatch = await new M0QAEngine({
  name: "unsupported-match-test-provider",
  async analyzeProductFidelity() {
    return {
      observations: [
        {
          checkType: "quantity",
          status: "match",
          differenceKind: "none",
          observability: {
            reference: "observable",
            candidate: "observable",
            coverage: "sufficient",
          },
          confidence: "high",
          explanation: "Candidate shows only a label crop, so one product was assumed from the reference.",
          evidence: {
            differenceKind: "none",
            referenceObservation: "One complete pouch",
            candidateObservation: "Label detail only",
            referenceVisible: true,
            candidateVisible: false,
          },
        },
      ],
      limitations: [],
      modelCall: {
        provider: "unsupported-match-test-provider",
        model: "test",
        promptVersion: "test",
        latencyMs: 0,
      },
    };
  },
}).analyze({
  analysisId: "unsupported-match-normalization",
  reference: { assetId: "reference", mimeType: "image/png", r2Key: "reference" },
  candidate: { assetId: "candidate", mimeType: "image/png", r2Key: "candidate" },
  selectedChecks: ["quantity"],
});

assert.equal(normalizedUnsupportedMatch.verdict, "review");
assert.equal(normalizedUnsupportedMatch.productIssues.length, 0);
assert.equal(normalizedUnsupportedMatch.observations[0]?.status, "not_observable");
assert.equal(normalizedUnsupportedMatch.observations[0]?.differenceKind, "not_visible");
assert.equal(normalizedUnsupportedMatch.limitations[0]?.type, "attribute_not_observable");
assert.deepEqual(normalizedUnsupportedMatch.observations[0]?.evidence.raw, {
  normalizationReason: "match_requires_sufficient_observability",
  providerStatus: "match",
  providerObservationDifferenceKind: "none",
  providerEvidenceDifferenceKind: "none",
  providerObservability: {
    reference: "observable",
    candidate: "observable",
    coverage: "sufficient",
  },
});

const normalizedUncertainMatch = await new M0QAEngine({
  name: "uncertain-match-test-provider",
  async analyzeProductFidelity() {
    return {
      observations: [
        {
          checkType: "visible_text",
          status: "match",
          differenceKind: "none",
          observability: {
            reference: "observable",
            candidate: "observable",
            coverage: "sufficient",
          },
          confidence: "high",
          explanation: "The visible wording matches, but the printed volume cannot be verified.",
          evidence: {
            differenceKind: "none",
            referenceObservation: "VANILLA OAT, 250 mL",
            candidateObservation: "VANILLA OAT; volume hidden by glare",
            referenceVisible: true,
            candidateVisible: true,
            uncertainReason: "Candidate volume text is obscured by glare, preventing full visible_text comparison.",
          },
        },
      ],
      limitations: [],
      modelCall: {
        provider: "uncertain-match-test-provider",
        model: "test",
        promptVersion: "test",
        latencyMs: 0,
      },
    };
  },
}).analyze({
  analysisId: "uncertain-match-normalization",
  reference: { assetId: "reference", mimeType: "image/png", r2Key: "reference" },
  candidate: { assetId: "candidate", mimeType: "image/png", r2Key: "candidate" },
  selectedChecks: ["visible_text"],
});

assert.equal(normalizedUncertainMatch.verdict, "review");
assert.equal(normalizedUncertainMatch.productIssues.length, 0);
assert.equal(normalizedUncertainMatch.observations[0]?.status, "not_observable");
assert.equal(normalizedUncertainMatch.observations[0]?.differenceKind, "not_visible");
assert.equal(normalizedUncertainMatch.limitations[0]?.type, "attribute_not_observable");
assert.equal(
  normalizedUncertainMatch.observations[0]?.evidence.uncertainReason,
  "Candidate volume text is obscured by glare, preventing full visible_text comparison.",
);

console.log("M0 policy boundary checks passed.");
console.log("Verified all six check families plus invalid taxonomy, observability, and normalization boundaries.");
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
