import { mkdir, writeFile } from "node:fs/promises";
import { CONTROLLED_BENCHMARK } from "../lib/benchmarks/controlled-visual-qa";

const destination = "public/benchmarks/controlled-visual-qa";

async function main() {
  await mkdir(destination, { recursive: true });
  const payload = {
    name: CONTROLLED_BENCHMARK.name,
    version: CONTROLLED_BENCHMARK.version,
    publishedAt: CONTROLLED_BENCHMARK.publishedAt,
    updatedAt: CONTROLLED_BENCHMARK.updatedAt,
    methodology: CONTROLLED_BENCHMARK.methodology,
    license: "Dataset metadata may be reused with attribution. Product images remain all rights reserved.",
    cases: CONTROLLED_BENCHMARK.cases,
  };
  await writeFile(`${destination}/pairvu-controlled-visual-qa-v1.json`, `${JSON.stringify(payload, null, 2)}\n`);

  const columns = [
    "case_id", "case_url", "title", "product_family", "evidence_role", "controlled_condition",
    "expected_verdict", "observed_verdict", "verdict_matched", "primary_attribute",
    "changed_attributes", "stable_attributes", "unobservable_attributes", "reviewed_at",
  ];
  const rows = CONTROLLED_BENCHMARK.cases.map((item) => [
    item.caseId,
    `https://pairvu.com${item.caseRoute}`,
    item.title,
    item.productFamily,
    item.evidenceRole,
    item.controlledCondition,
    item.expectedVerdict,
    item.observedVerdict,
    String(item.expectedVerdict === item.observedVerdict),
    item.primaryAttribute,
    item.changedAttributes.join(" | "),
    item.stableAttributes.join(" | "),
    item.unobservableAttributes.join(" | "),
    item.reviewedAt,
  ]);
  const csv = [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  await writeFile(`${destination}/pairvu-controlled-visual-qa-v1.csv`, `${csv}\n`);
  console.log(`Generated ${CONTROLLED_BENCHMARK.cases.length} benchmark records.`);
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
