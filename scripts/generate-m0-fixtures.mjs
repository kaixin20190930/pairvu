import { mkdir, writeFile } from "node:fs/promises";

const outDir = new URL("../eval/m0/", import.meta.url);
const now = "2026-07-26T00:00:00.000Z";

const checkFamilies = [
  "logo",
  "visible_text",
  "quantity",
  "dominant_color",
  "major_components",
  "major_shape_packaging",
];

const categories = [
  "cosmetics",
  "beverages",
  "personal_care",
  "packaged_food",
  "household_packaged_goods",
];

const seededFailures = [
  ["logo", "logo_mismatch", "critical", "Brand mark changed to a similar but incorrect mark."],
  ["visible_text", "text_mismatch", "critical", "Identity-bearing package value changed."],
  ["quantity", "quantity_mismatch", "high", "Comparable unit count changed."],
  ["dominant_color", "color_mismatch", "high", "SKU-defining package color changed."],
  ["major_components", "missing_component", "high", "Identity-relevant cap, lid, pump, or handle removed."],
  ["major_shape_packaging", "packaging_mismatch", "critical", "Package/container geometry changed."],
];

const hardNegatives = [
  "background_change",
  "lighting_change",
  "shadow_change",
  "scale_change",
  "camera_angle_shift",
  "reflection_change",
  "repositioning",
  "minor_crop",
  "white_balance_shift",
  "exposure_change",
];

const notObservable = [
  ["logo", "attribute_not_observable", "Logo is occluded or too small."],
  ["visible_text", "attribute_not_observable", "Identity-bearing text is too small or blurred."],
  ["quantity", "attribute_not_observable", "Unit boundaries are unclear."],
  ["dominant_color", "attribute_not_observable", "Color is distorted by glare or monochrome treatment."],
  ["major_components", "attribute_not_observable", "Component is hidden by angle or crop."],
  ["major_shape_packaging", "attribute_not_observable", "Container shape is cropped or non-comparable."],
];

const insufficientInputs = [
  ["reference_insufficient", "Reference is too blurred, cropped, or low information."],
  ["candidate_insufficient", "Candidate is too blurred, cropped, or low information."],
];

function categoryAt(index) {
  return categories[index % categories.length];
}

function difficultyAt(index) {
  return ["easy", "medium", "hard", "adversarial"][index % 4];
}

function makeCase(input) {
  return {
    id: input.id,
    round: "controlled",
    sourceType: "synthetic",
    category: input.category,
    difficulty: input.difficulty,
    reference: {
      fixtureId: `${input.id}_reference`,
      description: `Controlled reference image placeholder for ${input.category}.`,
    },
    candidate: {
      fixtureId: `${input.id}_candidate`,
      description: input.description,
    },
    selectedChecks: checkFamilies,
    expected: {
      verdict: input.verdict,
      issueTypes: input.issueTypes ?? [],
      limitations: input.limitations ?? [],
      observability: input.observability ?? {
        reference: "observable",
        candidate: "observable",
        coverage: "sufficient",
      },
      critical: input.critical ?? false,
      hardNegative: input.hardNegative ?? false,
    },
    provenance: {
      createdAt: now,
      createdBy: "fixture-generator",
      reviewer: "founder",
      reviewStatus: "approved_for_m0_controlled_eval",
      notes: input.notes,
    },
  };
}

const cases = [];

for (let i = 0; i < 35; i += 1) {
  const [check, issueType, severity, description] = seededFailures[i % seededFailures.length];
  cases.push(
    makeCase({
      id: `m0_seeded_${String(i + 1).padStart(3, "0")}`,
      category: categoryAt(i),
      difficulty: difficultyAt(i),
      description,
      verdict: severity === "critical" ? "fail" : "review",
      issueTypes: [issueType],
      critical: severity === "critical",
      notes: `Seeded ${check} product identity failure.`,
    }),
  );
}

for (let i = 0; i < 20; i += 1) {
  const variation = hardNegatives[i % hardNegatives.length];
  cases.push(
    makeCase({
      id: `m0_hard_negative_${String(i + 1).padStart(3, "0")}`,
      category: categoryAt(i + 35),
      difficulty: difficultyAt(i + 35),
      description: `Candidate changes ${variation} without changing product identity.`,
      verdict: "pass",
      hardNegative: true,
      notes: `Hard negative: ${variation}.`,
    }),
  );
}

for (let i = 0; i < 15; i += 1) {
  const [check, limitation, description] = notObservable[i % notObservable.length];
  cases.push(
    makeCase({
      id: `m0_not_observable_${String(i + 1).padStart(3, "0")}`,
      category: categoryAt(i + 55),
      difficulty: difficultyAt(i + 55),
      description,
      verdict: "review",
      limitations: [limitation],
      observability: {
        reference: i % 2 === 0 ? "observable" : "partially_observable",
        candidate: "not_observable",
        coverage: "insufficient",
      },
      notes: `Not-observable case for ${check}.`,
    }),
  );
}

for (let i = 0; i < 10; i += 1) {
  const [limitation, description] = insufficientInputs[i % insufficientInputs.length];
  cases.push(
    makeCase({
      id: `m0_input_insufficient_${String(i + 1).padStart(3, "0")}`,
      category: categoryAt(i + 70),
      difficulty: difficultyAt(i + 70),
      description,
      verdict: "review",
      limitations: [limitation],
      observability: {
        reference: limitation === "reference_insufficient" ? "not_observable" : "observable",
        candidate: limitation === "candidate_insufficient" ? "not_observable" : "observable",
        coverage: "insufficient",
      },
      notes: `Input-quality limitation: ${limitation}.`,
    }),
  );
}

for (let i = 0; i < 10; i += 1) {
  const [failureCheck, issueType] = seededFailures[(i + 1) % seededFailures.length];
  const [hiddenCheck, limitation] = notObservable[(i + 2) % notObservable.length];
  cases.push(
    makeCase({
      id: `m0_mixed_hard_${String(i + 1).padStart(3, "0")}`,
      category: categoryAt(i + 80),
      difficulty: "adversarial",
      description: `Mixed case with a possible ${failureCheck} mismatch and non-observable ${hiddenCheck}.`,
      verdict: "review",
      issueTypes: i % 2 === 0 ? [issueType] : [],
      limitations: [limitation],
      observability: {
        reference: "partially_observable",
        candidate: "partially_observable",
        coverage: "partial",
      },
      notes: "Mixed/harder case for coverage and conservative REVIEW behavior.",
    }),
  );
}

const predictions = cases.map((testCase, index) => ({
  caseId: testCase.id,
  verdict: testCase.expected.verdict,
  issueTypes: testCase.expected.issueTypes,
  limitations: testCase.expected.limitations,
  observability: testCase.expected.observability,
  latencyMs: 1200 + (index % 9) * 100,
  estimatedCostUsd: 0.01,
  repeatabilityGroupId: index < 10 ? `repeat_${String(index + 1).padStart(3, "0")}` : undefined,
}));

await mkdir(outDir, { recursive: true });
await writeFile(new URL("controlled-cases.json", outDir), `${JSON.stringify(cases, null, 2)}\n`);
await writeFile(new URL("sample-predictions.json", outDir), `${JSON.stringify(predictions, null, 2)}\n`);

console.log(`Generated ${cases.length} M0 controlled evaluation cases.`);
