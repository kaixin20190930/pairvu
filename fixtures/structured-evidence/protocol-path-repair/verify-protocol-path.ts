import assert from "node:assert/strict";
import {readFile, writeFile} from "node:fs/promises";
import {FidelityResponseSchema, mapFidelityObservations} from "../../../lib/ai/providers/openai-vision-provider";
import {M0QAEngine} from "../../../lib/qa/engine";
import type {M0AnalysisInput} from "../../../lib/qa/types";

async function main() {
  const root = "fixtures/structured-evidence/protocol-path-repair/";
  const original = JSON.parse(await readFile(root + "original-counterexample.json", "utf8"));
  const input: M0AnalysisInput = {analysisId: "protocol-path-replay", reference: {assetId: "qa-ref", mimeType: "image/png", r2Key: "synthetic/reference"}, candidate: {assetId: "qa-cand", mimeType: "image/png", r2Key: "synthetic/candidate"}, selectedChecks: ["logo"]};
  async function run(payload: unknown) {
    const observations = mapFidelityObservations(FidelityResponseSchema.parse(payload), input);
    return new M0QAEngine({name: "controlled-path-replay", analyzeProductFidelity: async () => ({observations, limitations: [], modelCall: {provider: "controlled", model: "none", promptVersion: "controlled+regions-003", latencyMs: 0}})}).analyze({...input, selectedChecks: [observations[0].checkType]});
  }
  const cases: Array<{name: string; status: string; failure?: string}> = [];
  async function test(name: string, check: () => Promise<void>) {try {await check(); cases.push({name, status: "PASS"});} catch(error) {cases.push({name, status: "FAIL", failure: String(error)});}}
  const originalResult = await run(original.input);
  await test("exact independent qualified-field failure now requires REVIEW", async () => {
    assert.equal(originalResult.verdict, "review"); assert.equal(originalResult.passedObservations.length, 0);
    assert.equal(originalResult.observations[0].evidence.identityEvidence!.reference, original.input.observations[0].evidence.referenceIdentity);
    assert.equal((originalResult.observations[0].evidence.raw as Record<string, unknown>).providerRaw, original.input.observations[0].evidence.rawJson);
    assert.match(originalResult.observations[0].evidence.uncertainReason!, /Protocol metadata/);
  });
  function pair(value: string, family: "logo" | "visible_text" = "logo") {
    const payload = structuredClone(original.input), observation = payload.observations[0];
    observation.checkType = family;
    Object.assign(observation.evidence, {referenceIdentity: value, candidateIdentity: value, referenceIdentityKind: family === "logo" ? "brand_name" : "readable_text", candidateIdentityKind: family === "logo" ? "brand_name" : "readable_text"});
    return payload;
  }
  if (!process.argv.includes("--original-only")) {
    const paths = ["evidence.referenceIdentity", "observations[0].evidence.candidateIdentity", "$.observations[0]['evidence'][\"referenceIdentity\"]", "evidence[referenceIdentity]", "unknownRoot['candidateIdentity']", "unknownRoot.unknownField", "evidence.unknownField", "evidence/referenceIdentity", "#/observations/0/evidence/referenceIdentity", "evidence\\referenceIdentity", "evidence::referenceIdentity", "evidence->referenceIdentity", "'evidence.referenceIdentity'", "(evidence.referenceIdentity)", "[evidence][referenceIdentity]", "Reference Identity"];
    for (const path of paths) for (const operator of [":", "=", ":=", "=>"]) for (const family of ["logo", "visible_text"] as const) {
      const literal = `${path} ${operator} ALPHA`;
      await test(`${family} path assignment ${literal}`, async () => {
        const result = await run(pair(literal, family)); assert.equal(result.verdict, "review"); assert.equal(result.passedObservations.length, 0);
        assert.equal(result.observations[0].evidence.identityEvidence!.reference, literal); assert.equal(result.observations[0].evidence.identityEvidence!.candidate, literal);
        assert.equal((result.observations[0].evidence.raw as Record<string, unknown>).providerRaw, original.input.observations[0].evidence.rawJson);
      });
    }
    for (const literal of ["ＥＶＩＤＥＮＣＥ．ＲＥＦＥＲＥＮＣＥＩＤＥＮＴＩＴＹ： ＡＬＰＨＡ", "evi\u200bdence . Reference_Identity : ALPHA", "{unknownField: ALPHA}", '{"unknownField":"ALPHA"}', "[\"ALPHA\"]", "evidence[referenceIdentity: ALPHA", "evidence..referenceIdentity: ALPHA", "evidence[\"referenceIdentity\": ALPHA", JSON.stringify("evidence.referenceIdentity: ALPHA"), '"\\u0065vidence.referenceIdentity: ALPHA"', JSON.stringify('{"unknownField":"ALPHA"}')]) await test(`normalized or unknown structure ${JSON.stringify(literal)}`, async () => assert.equal((await run(pair(literal))).verdict, "review"));
    for (const side of ["referenceIdentity", "candidateIdentity"] as const) await test(`one protocol side ${side} blocks match`, async () => {const payload=pair("ALPHA"); payload.observations[0].evidence[side]="unknownRoot.referenceIdentity: ALPHA"; assert.equal((await run(payload)).verdict,"review");});
    for (const literal of ["ALPHA Reference", "Reference Goods", "ALPHA Evidence", "ALPHA.Reference", "ALPHA: Edition", "Acme Goods", "ALPHA 100 ml"]) await test(`literal entity ${literal} still matches`, async () => assert.equal((await run(pair(literal, literal.includes("ml") ? "visible_text" : "logo"))).verdict, "pass"));
  }
  const status = cases.some(c => c.status === "FAIL") ? "FAIL" : "PASS";
  await writeFile(process.argv.find(v => v.endsWith(".json")) ?? root + "results.json", JSON.stringify({unitId: "UPG-04", synthetic: true, status, cases, originalResult, limitations: ["Actual strict schema/mapper/engine with controlled provider; no model traffic or visual accuracy claim."]}, null, 2) + "\n");
  console.log(`${status}: ${cases.length} protocol path cases`); if(status === "FAIL") process.exitCode = 1;
}
void main();
