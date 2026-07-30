import { readFile, writeFile, mkdir } from "node:fs/promises";
const args = parseArgs(process.argv.slice(2));
const casesPath = args.cases ?? "eval/m0/controlled-cases.json";
const predictionsPath = args.predictions ?? "eval/m0/sample-predictions.json";
const reportPath = args.report ?? "eval/m0/reports/latest.json";

const cases = JSON.parse(await readFile(casesPath, "utf8"));
const predictions = JSON.parse(await readFile(predictionsPath, "utf8"));
const predictionByCase = new Map(predictions.map((prediction) => [prediction.caseId, prediction]));

const evaluated = cases.map((testCase) => {
  const prediction = predictionByCase.get(testCase.id);

  if (!prediction) {
    return {
      caseId: testCase.id,
      missingPrediction: true,
      expected: testCase.expected,
    };
  }

  const verdictMatches = prediction.verdict === testCase.expected.verdict;
  const issueAgreement = jaccard(testCase.expected.issueTypes, prediction.issueTypes ?? []);
  const limitationAgreement = jaccard(testCase.expected.limitations, prediction.limitations ?? []);
  const observabilityMatches =
    prediction.observability?.reference === testCase.expected.observability.reference &&
    prediction.observability?.candidate === testCase.expected.observability.candidate &&
    prediction.observability?.coverage === testCase.expected.observability.coverage;

  return {
    caseId: testCase.id,
    category: testCase.category,
    difficulty: testCase.difficulty,
    expected: testCase.expected,
    prediction,
    verdictMatches,
    issueAgreement,
    limitationAgreement,
    observabilityMatches,
    falsePass: testCase.expected.verdict !== "pass" && prediction.verdict === "pass",
    hardNegativeFalseAlarm: testCase.expected.hardNegative && prediction.verdict !== "pass",
    criticalSeededDetected:
      testCase.expected.critical && prediction.verdict !== "pass" && issueAgreement > 0,
  };
});

const casesWithPredictions = evaluated.filter((item) => !item.missingPrediction);
const criticalCases = evaluated.filter((item) => item.expected?.critical);
const nonPassCases = evaluated.filter((item) => item.expected?.verdict !== "pass");
const hardNegatives = evaluated.filter((item) => item.expected?.hardNegative);
const notObservableCases = evaluated.filter((item) =>
  item.expected?.limitations?.includes("attribute_not_observable"),
);

const metrics = {
  generatedAt: new Date().toISOString(),
  casesPath,
  predictionsPath,
  totalCases: cases.length,
  predictedCases: casesWithPredictions.length,
  criticalRecall: ratio(criticalCases.filter((item) => item.criticalSeededDetected).length, criticalCases.length),
  falsePassRate: ratio(nonPassCases.filter((item) => item.falsePass).length, nonPassCases.length),
  hardNegativeFalseAlarmRate: ratio(
    hardNegatives.filter((item) => item.hardNegativeFalseAlarm).length,
    hardNegatives.length,
  ),
  notObservableAccuracy: ratio(
    notObservableCases.filter((item) => item.observabilityMatches && item.limitationAgreement > 0).length,
    notObservableCases.length,
  ),
  verdictRepeatability: computeRepeatability(predictions, "verdict"),
  issueAgreement: average(casesWithPredictions.map((item) => item.issueAgreement)),
  limitationAgreement: average(casesWithPredictions.map((item) => item.limitationAgreement)),
  medianLatencyMs: median(casesWithPredictions.map((item) => item.prediction.latencyMs).filter(Number.isFinite)),
  estimatedCostUsd: sum(casesWithPredictions.map((item) => item.prediction.estimatedCostUsd ?? 0)),
};

const gates = {
  criticalRecall: metrics.criticalRecall >= 0.85,
  falsePassRate: metrics.falsePassRate <= 0.1,
  hardNegativeFalseAlarmRate: metrics.hardNegativeFalseAlarmRate <= 0.2,
  notObservableAccuracy: metrics.notObservableAccuracy >= 0.9,
  verdictRepeatability: metrics.verdictRepeatability >= 0.9,
};

const report = {
  metrics,
  gates,
  passed: Object.values(gates).every(Boolean),
  failures: evaluated.filter(
    (item) =>
      item.missingPrediction ||
      item.falsePass ||
      item.hardNegativeFalseAlarm ||
      item.verdictMatches === false ||
      item.observabilityMatches === false,
  ),
};

await mkdir(new URL(`../${dirname(reportPath)}/`, import.meta.url), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`M0 evaluation report: ${reportPath}`);
console.log(`Cases: ${metrics.predictedCases}/${metrics.totalCases}`);
console.log(`Critical recall: ${formatPercent(metrics.criticalRecall)}`);
console.log(`False-pass rate: ${formatPercent(metrics.falsePassRate)}`);
console.log(`Hard-negative false alarms: ${formatPercent(metrics.hardNegativeFalseAlarmRate)}`);
console.log(`Not-observable accuracy: ${formatPercent(metrics.notObservableAccuracy)}`);
console.log(`Verdict repeatability: ${formatPercent(metrics.verdictRepeatability)}`);
console.log(`Issue agreement: ${formatPercent(metrics.issueAgreement)}`);
console.log(`Median latency: ${metrics.medianLatencyMs}ms`);
console.log(`Estimated cost: $${metrics.estimatedCostUsd.toFixed(4)}`);
console.log(`Gates: ${report.passed ? "PASS" : "FAIL"}`);

function parseArgs(rawArgs) {
  const parsed = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === "--cases") {
      parsed.cases = rawArgs[index + 1];
      index += 1;
    } else if (arg === "--predictions") {
      parsed.predictions = rawArgs[index + 1];
      index += 1;
    } else if (arg === "--report") {
      parsed.report = rawArgs[index + 1];
      index += 1;
    }
  }

  return parsed;
}

function ratio(numerator, denominator) {
  if (denominator === 0) {
    return 1;
  }

  return numerator / denominator;
}

function jaccard(expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const union = new Set([...expectedSet, ...actualSet]);

  if (union.size === 0) {
    return 1;
  }

  const intersection = [...expectedSet].filter((value) => actualSet.has(value));
  return intersection.length / union.size;
}

function computeRepeatability(predictions, field) {
  const groups = new Map();

  for (const prediction of predictions) {
    if (!prediction.repeatabilityGroupId) {
      continue;
    }

    const existing = groups.get(prediction.repeatabilityGroupId) ?? [];
    existing.push(prediction[field]);
    groups.set(prediction.repeatabilityGroupId, existing);
  }

  if (groups.size === 0) {
    return 1;
  }

  const agreements = [...groups.values()].map((values) => (new Set(values).size === 1 ? 1 : 0));
  return average(agreements);
}

function median(values) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[midpoint - 1] + sorted[midpoint]) / 2);
  }

  return sorted[midpoint];
}

function average(values) {
  if (values.length === 0) {
    return 0;
  }

  return sum(values) / values.length;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function dirname(path) {
  return path.split("/").slice(0, -1).join("/");
}
