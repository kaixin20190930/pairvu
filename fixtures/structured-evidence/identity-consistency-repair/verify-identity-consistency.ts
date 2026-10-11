import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { FidelityResponseSchema, mapFidelityObservations } from "../../../lib/ai/providers/openai-vision-provider";
import { M0QAEngine } from "../../../lib/qa/engine";
import type { M0AnalysisInput } from "../../../lib/qa/types";

async function main() {
  const root = "fixtures/structured-evidence/identity-consistency-repair/";
  const cases: Array<{name: string; status: string; failure?: string; result?: unknown}> = [];
  const input: M0AnalysisInput = {analysisId: "identity-consistency-replay", reference: {assetId: "qa-ref", mimeType: "image/png", r2Key: "synthetic/reference"}, candidate: {assetId: "qa-cand", mimeType: "image/png", r2Key: "synthetic/candidate"}, selectedChecks: ["logo"]};
  async function run(payload: unknown, strict = true) {
    const parsed = strict ? FidelityResponseSchema.parse(payload) : payload as Parameters<typeof mapFidelityObservations>[0];
    const observations = mapFidelityObservations(parsed, input);
    return new M0QAEngine({name: "controlled-replay", analyzeProductFidelity: async () => ({observations, limitations: [], modelCall: {provider: "controlled", model: "none", promptVersion: "typed-controlled+regions-003", latencyMs: 0}})}).analyze({...input, selectedChecks: [observations[0].checkType]});
  }
  for (const name of ["qa-contradictory-logo.json", "qa-contradictory-visible_text.json", "qa-zero-width-identity.json", "qa-generic-cap-identity.json"]) {
    const source = JSON.parse(await readFile(root + name, "utf8"));
    // Exact archived payload through the mapper, including old schema missing types.
    const result = await run(source.input, false);
    try {
      assert.equal(result.verdict, "review");
      assert.equal(result.passedObservations.length, 0);
      assert.ok(result.observations[0].evidence.raw);
      cases.push({name, status: "PASS", result});
    } catch (error) { cases.push({name, status: "FAIL", failure: String(error), result}); }
  }
  const fixture = JSON.parse(await readFile(root + "provider-response.json", "utf8"));
  async function test(name: string, fn: () => unknown | Promise<unknown>) {
    try { await fn(); cases.push({name, status: "PASS"}); }
    catch (error) { cases.push({name, status: "FAIL", failure: String(error)}); }
  }
  function pair(family: "logo" | "visible_text", reference: string | null, candidate: string | null, kind = family === "logo" ? "brand_name" : "readable_text") {
    const payload = structuredClone(fixture), o = payload.observations[0];
    Object.assign(o, {checkType: family, status: "match", differenceKind: "none", referenceObservation: "The reference shows directly observed identity content.", candidateObservation: "Corresponding identity content is visible on the candidate.", comparisonSummary: "Model claims an identity match.", visibleEvidence: [reference, candidate].filter(Boolean)});
    Object.assign(o.evidence, {referenceObservation: o.referenceObservation, candidateObservation: o.candidateObservation, comparisonSummary: o.comparisonSummary, visibleEvidence: o.visibleEvidence, differenceKind: "none", referenceIdentity: reference, candidateIdentity: candidate, referenceIdentityKind: kind, candidateIdentityKind: kind});
    return payload;
  }
  for (const [family, a, b] of [["logo", "ALPHA", "BETA"], ["visible_text", "ALPHA 100 ml", "ALPHA 200 ml"]] as const) {
    await test(`typed ${family} direct contradiction requires REVIEW without inventing invisibility`, async () => {
      const result = await run(pair(family, a, b));
      assert.equal(result.verdict, "review"); assert.equal(result.observations[0].status, "uncertain");
      assert.equal(result.observations[0].evidence.referenceVisible, true);
      assert.equal(result.passedObservations.length, 0);
      assert.equal(result.observations[0].evidence.identityEvidence!.reference, a);
      assert.equal(result.observations[0].evidence.identityEvidence!.candidate, b);
      assert.equal((result.observations[0].evidence.raw as Record<string, unknown>).providerStatus, "match");
    });
  }
  for (const value of ["\u200b", "\u200c\u200d", "\u202e\u2069", "\u00ad\ufeff", "\u2060", "\u3164", "\u0301", "\ufe0f", "\u0000\u001f", " \t\n", "™", "///"]) {
    await test(`invisible/non-identity-only Unicode ${JSON.stringify(value)} is insufficient`, async () => assert.equal((await run(pair("visible_text", value, value))).verdict, "review"));
  }
  for (const kind of ["geometry", "symbol", "unknown", "absent", "unreadable", "not_applicable", "readable_text"]) {
    await test(`${kind} cannot establish a logo regardless of free-form shape wording`, async () => assert.equal((await run(pair("logo", "black rectangular cap", "black rectangular cap", kind))).verdict, "review"));
  }
  await test("typed symbol synonyms do not falsely become identified brands", async () => assert.equal((await run(pair("logo", "red star emblem", "scarlet star symbol", "symbol"))).verdict, "review"));
  await test("schema requires both kinds and rejects fabricated kind", () => { const p = pair("logo", "ALPHA", "ALPHA"); delete p.observations[0].evidence.referenceIdentityKind; assert.equal(FidelityResponseSchema.safeParse(p).success, false); p.observations[0].evidence.referenceIdentityKind = "verified"; assert.equal(FidelityResponseSchema.safeParse(p).success, false); });
  const compatible: Array<["logo" | "visible_text", string, string]> = [
    ["logo", "ALPHA", "alpha"], ["logo", "ＡＬＰＨＡ ®", "Alpha"], ["logo", "ALPHA\u200b", "ALPHA"],
    ["visible_text", "ALPHA 100 ml", "alpha 0.1 litre"], ["visible_text", "ALPHA 100ML", "alpha 100 millilitres"],
    ["visible_text", "ALPHA 1000 ml", "ALPHA 1 liter"], ["visible_text", "ALPHA .5 L", "ALPHA 500 ml"],
    ["visible_text", "ALPHA 250 g", "alpha 0.25 kilograms"], ["visible_text", "ALPHA 0.1 g", "ALPHA 100 mg"],
    ["visible_text", "ALPHA 30 cm", "ALPHA 0.3 m"], ["visible_text", "ALPHA 6 pcs", "ALPHA 6 pieces"],
    ["visible_text", "ALPHA 100 ml 6 pcs", "ALPHA 0.1 litres 6 pieces"], ["visible_text", "ALPHA 10%", "ALPHA 10 percent"],
  ];
  for (const [family, a, b] of compatible) await test(`compatible ${JSON.stringify([a,b])} supports a match`, async () => assert.equal((await run(pair(family, a, b))).verdict, "pass"));
  const conflicts: Array<[string,string]> = [["ALPHA 100 ml","ALPHA 200 ml"],["ALPHA 100 ml","ALPHA 100 g"],["ALPHA 6 pcs","ALPHA 7 pcs"],["ALPHA -100 ml","ALPHA 100 ml"],["ALPHA -100","ALPHA 100"],["ALPHA 10%","ALPHA 10"],["ALPHA 100","BETA 100"],["ALPHA 0.3 L","ALPHA 300.0001 ml"],["ALPHA 001","ALPHA 1"],["ALPHA 6 × 100 ml","ALPHA 6 100 ml"],["ALPHA 100 ml","ALPHA quantityvolumepositive1over10"],["ALPHA 1,000 ml","ALPHA 1 0 ml"],["ALPHA 100 ml 200 ml","ALPHA 200 ml 100 ml"]];
  for (const [a,b] of conflicts) await test(`conflicting ${JSON.stringify([a,b])} cannot support a match`, async () => assert.equal((await run(pair("visible_text", a, b))).verdict, "review"));
  for (const family of ["logo", "visible_text"] as const) await test(`explicit sufficient ${family} mismatch remains critical FAIL`, async () => { const p = pair(family, family === "logo" ? "ALPHA" : "ALPHA 100 ml", family === "logo" ? "BETA" : "ALPHA 200 ml"), o=p.observations[0]; o.status="mismatch"; o.differenceKind=family==="logo"?"brand_changed":"value_changed";o.evidence.differenceKind=o.differenceKind;const result=await run(p);assert.equal(result.verdict,"fail");assert.equal(result.productIssues[0].severity,"critical");});
  const status = cases.some(c => c.status === "FAIL") ? "FAIL" : "PASS";
  await writeFile(process.argv[2] ?? root + "original-counterexample-results.json", JSON.stringify({unitId: "UPG-04", synthetic: true, status, inputKind: "Exact archived synthetic QA payload, not new SDK traffic", cases}, null, 2) + "\n");
  console.log(`${status}: ${cases.length} identity consistency cases including 4 original counterexamples`);
  if (status === "FAIL") process.exitCode = 1;
}
void main();
