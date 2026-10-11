import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { M0QAEngine } from "../../../lib/qa/engine";
import { normalizeBoundEvidence } from "../../../lib/qa/evidence-regions";
import type { M0AnalysisInput, VisionObservation } from "../../../lib/qa/types";

async function main() {
  const root = "fixtures/structured-evidence/production-repair/";
  const fixture = JSON.parse(await readFile(root + "counterexamples.json", "utf8"));
  const observations = fixture.observations as VisionObservation[];
  const input: M0AnalysisInput = {
    analysisId: "synthetic-production-counterexample",
    reference: {assetId: fixture.assets.referenceAssetId, mimeType: "image/png", r2Key: "synthetic/reference"},
    candidate: {assetId: fixture.assets.candidateAssetId, mimeType: "image/png", r2Key: "synthetic/candidate"},
    selectedChecks: ["logo", "visible_text"],
  };
  const cases: Array<{name: string; status: string; failure?: string}> = [];
  async function test(name: string, fn: () => unknown | Promise<unknown>) {
    try { await fn(); cases.push({name, status: "PASS"}); }
    catch (error) { cases.push({name, status: "FAIL", failure: String(error)}); }
  }
  await test("reported logo box on empty background is never treated as verified location", () => {
    const normalized = normalizeBoundEvidence(observations[0].evidence, fixture.assets);
    assert.equal(normalized.regions!.reference.region, null);
    assert.equal(normalized.regions!.candidate.region, null);
    assert.deepEqual(normalized.regionRaw, observations[0].evidence.regions);
  });
  const engine = new M0QAEngine({name: "synthetic-replay", analyzeProductFidelity: async () => ({
    observations, limitations: [], modelCall: {provider: "synthetic-replay", model: "none", promptVersion: "DOM-replay", latencyMs: 0},
  })});
  const result = await engine.analyze(input);
  await test("explicit absence of readable text cannot contribute PASS", () => {
    assert.equal(result.verdict, "review");
    assert.equal(result.observations.find(o => o.checkType === "visible_text")!.status, "not_observable");
    assert.equal(result.passedObservations.some(o => o.checkType === "visible_text"), false);
    assert.ok(result.limitations.some(l => l.sourceCheckType === "visible_text"));
  });
  await test("generic rectangular bar does not establish logo identity", () => {
    assert.equal(result.observations.find(o => o.checkType === "logo")!.status, "not_observable");
    assert.equal(result.passedObservations.some(o => o.checkType === "logo"), false);
  });
  const status = cases.some(c => c.status === "FAIL") ? "FAIL" : "PASS";
  const report = {unitId: "UPG-04", sourceKind: fixture.sourceKind, synthetic: true, status, cases, result};
  const reportPath = process.argv[2] ?? root + "counterexample-results.json";
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(`${status}: ${cases.length} production counterexample replays; ${reportPath}`);
  if (status === "FAIL") process.exitCode = 1;
}
void main();
