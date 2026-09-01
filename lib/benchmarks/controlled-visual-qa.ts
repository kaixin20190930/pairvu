export type BenchmarkVerdict = "PASS" | "FAIL" | "REVIEW";
export type BenchmarkEvidenceRole = "product_change" | "hard_negative" | "observability";
export type BenchmarkAttribute = "label_text" | "logo" | "printed_value" | "product_count" | "color" | "components" | "packaging" | "observability";

export interface ControlledBenchmarkCase {
  caseId: string;
  caseRoute: string;
  title: string;
  productFamily: string;
  evidenceRole: BenchmarkEvidenceRole;
  controlledCondition: string;
  expectedVerdict: BenchmarkVerdict;
  observedVerdict: BenchmarkVerdict;
  primaryAttribute: BenchmarkAttribute;
  changedAttributes: string[];
  stableAttributes: string[];
  unobservableAttributes: string[];
  originalImage: string;
  candidateImage: string;
  reviewedAt: string;
}

export const CONTROLLED_BENCHMARK = {
  name: "Pairvu Controlled Visual QA Benchmark",
  version: "1.0",
  publishedAt: "2026-08-20",
  updatedAt: "2026-08-20",
  methodology: "Founder-reviewed controlled original-versus-candidate product image comparisons.",
  cases: [
    benchmarkCase("foldwell-scent-count", "/examples/laundry-sheets-scent-count-change", "Laundry-sheet scent and count changed", "Household packaged goods", "product_change", "FRESH LINEN 30 SHEETS became UNSCENTED 20 SHEETS", "FAIL", "label_text", ["Scent wording", "Printed sheet count"], ["Brand", "Logo", "Carton color", "UP TO 60 LOADS", "Package shape"], [], "/examples/foldwell-scent-count-change/original.png", "/examples/foldwell-scent-count-change/candidate.png"),
    benchmarkCase("foldwell-background", "/examples/laundry-sheets-background-change", "Laundry-room setting changed, product matched", "Household packaged goods", "hard_negative", "Studio background became a laundry-room scene", "PASS", "observability", [], ["Brand", "Logo", "FRESH LINEN", "30 SHEETS", "UP TO 60 LOADS", "Carton structure"], [], "/examples/foldwell-background-change/original.png", "/examples/foldwell-background-change/candidate.png"),
    benchmarkCase("foldwell-back-view", "/examples/laundry-sheets-back-view-review", "Front label turned away", "Household packaged goods", "observability", "Candidate showed the rear package face", "REVIEW", "observability", [], ["Main color", "Rigid carton form", "Single package"], ["Front logo", "Scent", "Sheet count", "Load claim"], "/examples/foldwell-back-view/original.png", "/examples/foldwell-back-view/candidate.png"),
    benchmarkCase("solvane-spf", "/examples/skincare-spf-value-change", "SPF value changed", "Skincare", "product_change", "SPF 50+ became SPF 30", "FAIL", "printed_value", ["Printed SPF value"], ["Brand", "Logo", "Product name", "20 g", "Color", "Package shape"], [], "/examples/skincare-spf-change/original.png", "/examples/skincare-spf-change/candidate.png"),
    benchmarkCase("solvane-background", "/examples/skincare-product-background-change", "Beach scene changed, product matched", "Skincare", "hard_negative", "Studio pack shot became a beach lifestyle scene", "PASS", "observability", [], ["Brand", "Logo", "SPF 50+", "20 g", "Color", "Cap", "Package shape"], [], "/examples/skincare-background-change/original.png", "/examples/skincare-background-change/candidate.png"),
    benchmarkCase("solvane-crop", "/examples/skincare-package-crop-review", "Lower package was outside the crop", "Skincare", "observability", "Candidate excluded the lower package and twist control", "REVIEW", "observability", [], ["Logo", "Visible front text", "Upper package color"], ["Lower component", "Complete silhouette"], "/examples/skincare-crop-observability/original.png", "/examples/skincare-crop-observability/candidate.png"),
    benchmarkCase("morrow-flavor-volume", "/examples/cold-brew-flavor-volume-change", "Flavor and volume changed", "Beverage", "product_change", "VANILLA OAT 250 mL became MOCHA OAT 330 mL", "FAIL", "label_text", ["Flavor wording", "Printed volume"], ["Brand", "Can color", "Single-unit count", "Can shape"], [], "/examples/cold-brew-flavor-volume-change/original.png", "/examples/cold-brew-flavor-volume-change/candidate.png"),
    benchmarkCase("morrow-condensation", "/examples/cold-brew-condensation-change", "Condensation changed, product matched", "Beverage", "hard_negative", "Surface droplets and highlights changed", "PASS", "color", [], ["Brand", "Flavor", "Volume", "Count", "Can color", "Can shape"], [], "/examples/cold-brew-condensation-change/original.png", "/examples/cold-brew-condensation-change/candidate.png"),
    benchmarkCase("brightleaf-capacity", "/examples/household-cleaner-capacity-change", "Cleaner capacity changed", "Household packaged goods", "product_change", "750 mL became 500 mL", "FAIL", "printed_value", ["Printed capacity"], ["Brand", "Bottle", "Trigger", "Color", "Package shape"], [], "/examples/household-capacity-change/original.jpg", "/examples/household-capacity-change/candidate.jpg"),
    benchmarkCase("brightleaf-background", "/examples/household-cleaner-background-change", "Kitchen setting changed, product matched", "Household packaged goods", "hard_negative", "Studio background became a kitchen scene", "PASS", "observability", [], ["Brand", "Label text", "750 mL", "Trigger", "Color", "Bottle shape"], [], "/examples/household-background-change/original.jpg", "/examples/household-background-change/candidate.jpg"),
    benchmarkCase("brightleaf-back-view", "/examples/large-viewpoint-difference-product-image", "Different package face needed review", "Household packaged goods", "observability", "Front-facing reference became a rear-facing candidate", "REVIEW", "observability", [], ["Bottle family", "Trigger", "Main color"], ["Front logo", "Front label text", "Capacity"], "/examples/missing-component/original.jpg", "/examples/large-viewpoint/candidate.jpg"),
    benchmarkCase("embernook-component", "/examples/candle-set-component-removed", "Candle-set accessory and wording changed", "Home fragrance", "product_change", "Wick trimmer disappeared and SET wording was removed", "FAIL", "components", ["Included accessory", "Product-name wording"], ["Brand", "Jar", "Lid", "220 g", "Color", "Jar shape"], [], "/examples/candle-components/original.jpg", "/examples/candle-components/missing-trimmer.jpg"),
    benchmarkCase("embernook-scene", "/examples/candle-set-scene-change", "Candle set was preserved in a new scene", "Home fragrance", "hard_negative", "Studio scene became a textured stone composition", "PASS", "components", [], ["Jar", "Lid", "Wick trimmer", "Logo", "Text", "220 g", "Color"], [], "/examples/candle-components/original.jpg", "/examples/candle-components/scene-change.jpg"),
    benchmarkCase("embernook-crop", "/examples/candle-accessory-outside-crop", "Included accessory was outside the crop", "Home fragrance", "observability", "Candidate excluded the approved accessory area", "REVIEW", "components", [], ["Jar", "Lid", "Logo", "Text", "220 g"], ["Wick trimmer"], "/examples/candle-components/original.jpg", "/examples/candle-components/trimmer-crop.jpg"),
    benchmarkCase("elara-logo", "/examples/logo-change-ai-product-image", "Visible logo changed", "Cosmetics", "product_change", "Crescent mark became a sun mark", "FAIL", "logo", ["Logo identity"], ["Bottle", "Label text", "Color", "Package shape"], [], "/examples/logo-change/original.jpg", "/examples/logo-change/candidate.jpg"),
    benchmarkCase("nova-value", "/examples/label-value-change-ai-product-image", "Printed capacity changed", "Beverage", "product_change", "330 mL became 500 mL", "FAIL", "printed_value", ["Printed capacity"], ["Brand", "Can design", "Color", "Can shape"], [], "/examples/label-value-change/original.jpg", "/examples/label-value-change/candidate.jpg"),
    benchmarkCase("mireva-shape", "/examples/packaging-shape-change-ai-product-image", "Packaging shape changed", "Personal care", "product_change", "Rounded bottle became rectangular", "FAIL", "packaging", ["Container shape"], ["Brand", "Label", "Main color"], [], "/examples/packaging-shape-change/original.jpg", "/examples/packaging-shape-change/candidate.jpg"),
    benchmarkCase("grainly-count", "/examples/product-count-change-ai-image", "Visible product count changed", "Packaged food", "product_change", "One primary package became two", "REVIEW", "product_count", ["Visible primary product count"], ["Brand", "Label", "Color", "Package shape"], [], "/examples/product-count-change/original.jpg", "/examples/product-count-change/candidate.jpg"),
    benchmarkCase("nova-identical", "/examples/identical-product-images-pass", "Identical product images matched", "Beverage", "hard_negative", "The same approved file appeared on both sides", "PASS", "observability", [], ["All observable product attributes"], [], "/examples/label-value-change/original.jpg", "/examples/label-value-change/original.jpg"),
  ] satisfies ControlledBenchmarkCase[],
} as const;

function benchmarkCase(
  caseId: string,
  caseRoute: string,
  title: string,
  productFamily: string,
  evidenceRole: BenchmarkEvidenceRole,
  controlledCondition: string,
  verdict: BenchmarkVerdict,
  primaryAttribute: BenchmarkAttribute,
  changedAttributes: string[],
  stableAttributes: string[],
  unobservableAttributes: string[],
  originalImage: string,
  candidateImage: string,
): ControlledBenchmarkCase {
  return {
    caseId,
    caseRoute,
    title,
    productFamily,
    evidenceRole,
    controlledCondition,
    expectedVerdict: verdict,
    observedVerdict: verdict,
    primaryAttribute,
    changedAttributes,
    stableAttributes,
    unobservableAttributes,
    originalImage,
    candidateImage,
    reviewedAt: "2026-08-20",
  };
}

export const BENCHMARK_STATS = (() => {
  const cases = CONTROLLED_BENCHMARK.cases;
  return {
    total: cases.length,
    matched: cases.filter((item) => item.expectedVerdict === item.observedVerdict).length,
    verdicts: Object.fromEntries(["PASS", "FAIL", "REVIEW"].map((verdict) => [verdict, cases.filter((item) => item.observedVerdict === verdict).length])) as Record<BenchmarkVerdict, number>,
    productFamilies: new Set(cases.map((item) => item.productFamily)).size,
    attributes: new Set(cases.map((item) => item.primaryAttribute)).size,
  };
})();
