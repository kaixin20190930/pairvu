import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { zodTextFormat } from "openai/helpers/zod";
import { FidelityResponseSchema, mapFidelityObservations } from "../../../lib/ai/providers/openai-vision-provider";
import { M0QAEngine } from "../../../lib/qa/engine";
import type { M0AnalysisInput } from "../../../lib/qa/types";

async function main() {
  const root = "fixtures/structured-evidence/protocol-identity-repair/";
  const original = JSON.parse(await readFile(root + "original-replay.json", "utf8"));
  const input: M0AnalysisInput = {analysisId: "protocol-identity-replay", reference: {assetId: "qa-ref", mimeType: "image/png", r2Key: "synthetic/reference"}, candidate: {assetId: "qa-candidate", mimeType: "image/png", r2Key: "synthetic/candidate"}, selectedChecks: ["logo"]};
  const run = async (payload: unknown) => {
    const parsed = FidelityResponseSchema.parse(payload), observations = mapFidelityObservations(parsed, input);
    return new M0QAEngine({name: "controlled-protocol-replay", analyzeProductFidelity: async () => ({observations, limitations: [], modelCall: {provider: "controlled", model: "none", promptVersion: "controlled+regions-003", latencyMs: 0}})}).analyze({...input, selectedChecks: [observations[0].checkType]});
  };
  const cases: Array<{name: string; status: string; failure?: string}> = [];
  let originalResult: unknown;
  async function test(name: string, fn: () => unknown | Promise<unknown>) { try { await fn(); cases.push({name, status: "PASS"}); } catch (error) { cases.push({name, status: "FAIL", failure: String(error)}); } }
  await test("exact production DOM reconstruction cannot pass a protocol enum as identity", async () => { const result = await run(original.input); originalResult = result; assert.equal(result.verdict, "review"); assert.equal(result.passedObservations.length, 0); assert.equal(result.observations[0].evidence.identityEvidence!.reference, "brand_name"); assert.ok(result.observations[0].evidence.uncertainReason); });
  const fixture = JSON.parse(await readFile("fixtures/structured-evidence/identity-consistency-repair/provider-response.json", "utf8"));
  // Registry is derived from actual SDK schema and stable application output keys.
  const tokens = new Set<string>(["none", "n/a"]), fields = new Set<string>();
  function schema(node: unknown) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { for (const item of node) schema(item); return; }
    for (const [key, value] of Object.entries(node)) {
      tokens.add(key);
      if (key === "properties" && value && typeof value === "object") for (const field of Object.keys(value)) fields.add(field);
      if (["enum", "const", "type", "name"].includes(key)) for (const literal of Array.isArray(value) ? value : [value]) if (typeof literal === "string") tokens.add(literal);
      if (typeof value === "boolean") tokens.add(String(value));
      schema(value);
    }
  }
  schema(zodTextFormat(FidelityResponseSchema, "fidelity"));
  function keys(node: unknown) { if (!node || typeof node !== "object") return; if (Array.isArray(node)) { for (const item of node) keys(item); return; } for (const [key,value] of Object.entries(node)) { fields.add(key); tokens.add(key); keys(value); } }
  const stable = await run(fixture); keys(stable);
  const versions = [...Object.values(stable.versions), stable.observations[0].evidence.identityEvidence!.validationVersion!, "regions-003"];
  for (const version of versions) tokens.add(version);
  const catalog = {generatedFrom: "Actual zodTextFormat fidelity schema, stable mapped engine output property names and application protocol versions; no entity exclusion vocabulary", tokens: [...tokens].sort(), fields: [...fields].sort(), versionPrefixes: versions.map(v=>v.replace(/-\d+$/, "")).sort()};
  if (process.argv.includes("--generate")) { await writeFile("lib/qa/identity-protocol-catalog.json", JSON.stringify(catalog,null,2)+"\n"); console.log(`Generated ${tokens.size} protocol tokens`); return; }
  if (!process.argv.includes("--original-only")) {
    await test("protocol registry cannot drift from the actual provider and application protocol", async () => assert.deepEqual(JSON.parse(await readFile("lib/qa/identity-protocol-catalog.json","utf8")), catalog));
    function pair(value: string, family: "logo" | "visible_text" = "logo") { const p = structuredClone(fixture), o=p.observations[0]; Object.assign(o,{checkType:family,status:"match",differenceKind:"none",referenceObservation:"Directly observed identity content.",candidateObservation:"Directly observed corresponding identity content.",comparisonSummary:"Model reports same identity",visibleEvidence:[value]});Object.assign(o.evidence,{referenceIdentity:value,candidateIdentity:value,referenceIdentityKind:family==="logo"?"brand_name":"readable_text",candidateIdentityKind:family==="logo"?"brand_name":"readable_text",referenceObservation:o.referenceObservation,candidateObservation:o.candidateObservation,comparisonSummary:o.comparisonSummary,visibleEvidence:o.visibleEvidence,differenceKind:"none"});return p; }
    for (const token of tokens) for (const value of [token, token.toUpperCase(), token.replace(/[_-]/g," "), token.split("").join("\u200b"), Array.from(token,c=>c.charCodeAt(0)>=33&&c.charCodeAt(0)<=126?String.fromCharCode(c.charCodeAt(0)+65248):c).join("")]) {
      await test(`metadata ${JSON.stringify(value)} is not entity identity`, async () => {const r=await run(pair(value));assert.equal(r.verdict,"review");assert.equal(r.passedObservations.length,0);assert.equal(r.observations[0].evidence.identityEvidence!.reference,value);});
    }
    for (const value of ["referenceIdentity:brand_name",'{"referenceIdentity":"ALPHA"}', '["brand_name","ALPHA"]', '"\\u0062rand_name"', "<YOUR_BRAND>", "{{任意身份}}", "${identity}", "brand_name / readable_text", "identity-evidence-999"]) await test(`protocol wrapper or placeholder ${JSON.stringify(value)} is insufficient`,async()=>assert.equal((await run(pair(value))).verdict,"review"));
    for (const value of ["ALPHA", "BETA", "Acme Goods", "ALPHA Reference", "ALPHA 100 ml"]) await test(`normal entity ${value} still supports a match`,async()=>assert.equal((await run(pair(value,value.includes("ml")?"visible_text":"logo"))).verdict,"pass"));
    await test("text protocol enum cannot masquerade as a readable transcription",async()=>assert.equal((await run(pair("readable_text","visible_text"))).verdict,"review"));
  }
  const status = cases.some(c=>c.status==="FAIL") ? "FAIL" : "PASS";
  const report = {unitId:"UPG-04",synthetic:true,status,cases,sourceKind:original.sourceKind,originalResult,limitations:["Controlled schema/mapper/engine only; no model traffic or independent visual verification. Protocol-occupied entity spellings conservatively require review."]};
  await writeFile(process.argv.find(v=>v.endsWith(".json"))??root+"results.json",JSON.stringify(report,null,2)+"\n");
  console.log(`${status}: ${cases.length} protocol identity cases`);if(status==="FAIL")process.exitCode=1;
}
void main();
