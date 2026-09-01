import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { BENCHMARK_STATS, CONTROLLED_BENCHMARK } from "../lib/benchmarks/controlled-visual-qa";
import { getSeoPage } from "../lib/seo/content-registry";

async function main() {
  const root = process.cwd();
  const cases = CONTROLLED_BENCHMARK.cases;

  assert.equal(CONTROLLED_BENCHMARK.version, "1.0", "Unexpected public benchmark version");
  assert.ok(cases.length >= 18, "The public benchmark needs at least 18 controlled comparisons");
  assert.equal(new Set(cases.map((item) => item.caseId)).size, cases.length, "Benchmark case IDs must be unique");
  assert.equal(new Set(cases.map((item) => item.caseRoute)).size, cases.length, "Benchmark case routes must be unique");
  assert.equal(BENCHMARK_STATS.matched, BENCHMARK_STATS.total, "Every frozen case must match its founder-reviewed expected verdict");

  for (const verdict of ["PASS", "FAIL", "REVIEW"] as const) {
    assert.ok(cases.some((item) => item.observedVerdict === verdict), `${verdict} must be represented`);
  }

  for (const role of ["product_change", "hard_negative", "observability"] as const) {
    assert.ok(cases.some((item) => item.evidenceRole === role), `${role} must be represented`);
  }

  for (const item of cases) {
    assert.match(item.caseRoute, /^\/examples\/[a-z0-9-]+$/, `${item.caseId} has an invalid route`);
    assert.equal(item.expectedVerdict, item.observedVerdict, `${item.caseId} does not match its approved verdict`);
    await access(path.join(root, "app", item.caseRoute, "page.tsx"));
    await access(path.join(root, "public", item.originalImage));
    await access(path.join(root, "public", item.candidateImage));
  }

  const benchmarkRoute = "/examples/controlled-visual-qa-benchmark";
  const registryPage = getSeoPage(benchmarkRoute);
  assert.equal(registryPage.family, "benchmark");
  assert.equal(registryPage.parentRoute, "/examples");
  assert.equal(registryPage.indexable, true);

  const pageSource = await readFile(path.join(root, "app/examples/controlled-visual-qa-benchmark/page.tsx"), "utf8");
  const examplesSource = await readFile(path.join(root, "app/examples/page.tsx"), "utf8");
  for (const required of ["Dataset", "methodology", "limitations", "Version history", "pairvu-controlled-visual-qa-v1.csv", "pairvu-controlled-visual-qa-v1.json"]) {
    assert.ok(pageSource.includes(required), `Benchmark page is missing ${required}`);
  }
  assert.ok(examplesSource.includes(`href="${benchmarkRoute}"`), "Examples must contain a static benchmark link");

  const jsonPath = path.join(root, "public/benchmarks/controlled-visual-qa/pairvu-controlled-visual-qa-v1.json");
  const csvPath = path.join(root, "public/benchmarks/controlled-visual-qa/pairvu-controlled-visual-qa-v1.csv");
  const json = JSON.parse(await readFile(jsonPath, "utf8")) as { version: string; cases: Array<{ caseId: string }> };
  const csv = (await readFile(csvPath, "utf8")).trim().split("\n");
  assert.equal(json.version, CONTROLLED_BENCHMARK.version, "JSON version is stale");
  assert.deepEqual(json.cases.map((item) => item.caseId), cases.map((item) => item.caseId), "JSON case order is stale");
  assert.equal(csv.length, cases.length + 1, "CSV row count is stale");

  console.log(`Controlled benchmark verified: ${cases.length} cases, ${BENCHMARK_STATS.productFamilies} product families, ${BENCHMARK_STATS.attributes} attributes.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
