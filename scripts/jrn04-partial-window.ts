import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createAnalysisRecord, persistCompletedAnalysis } from "../lib/analysis/repository";
import { getSavedProductById } from "../lib/products/repository";
import { M0RiskPolicy } from "../lib/qa/m0-policy";
import { unavailableRegion } from "../lib/qa/evidence-regions";
import type { M0CheckFamily, VisionObservation } from "../lib/qa/types";
import type { ProductBinding } from "../lib/products/types";
import type { ReleasePage, ReleaseRow } from "../lib/releases/types";
import { createHarness, type Alias, type Harness, type ManifestAsset } from "./jrn04-harness";

const selectedChecks: M0CheckFamily[] = ["logo", "visible_text", "quantity", "dominant_color", "major_components", "major_shape_packaging"];
interface Source { analysisId: string; reference: ManifestAsset; candidate: ManifestAsset; original: ReleaseRow }
function observations(ref: string, cand: string): VisionObservation[] {
  return selectedChecks.map(checkType => ({
    checkType, status: "match", differenceKind: "none", confidence: "high",
    observability: { reference: "observable", candidate: "observable", coverage: "sufficient" },
    explanation: "JRN-04 explicit synthetic partial-window evidence; no model executed.",
    evidence: {
      referenceObservation: "Readable Northstar label and whole product.", candidateObservation: "Readable Northstar label and whole product.",
      comparisonSummary: "Synthetic matching pair.", visibleEvidence: ["Northstar label and whole product are visible."],
      identityEvidence: checkType === "logo" ? { reference: "Northstar", candidate: "Northstar", referenceKind: "brand_name", candidateKind: "brand_name", validationVersion: "identity-evidence-004" }
        : checkType === "visible_text" ? { reference: "NORTHSTAR 500 ML", candidate: "NORTHSTAR 500 ML", referenceKind: "readable_text", candidateKind: "readable_text", validationVersion: "identity-evidence-004" } : undefined,
      regions: { schemaVersion: 1, reference: unavailableRegion(ref, "uncertain_location"), candidate: unavailableRegion(cand, "uncertain_location") },
    },
  }));
}
async function row(h: Harness, alias: Alias, analysisId: string) {
  const response = await h.call("releases", "GET", "releases?limit=50", alias); assert.equal(response.status, 200);
  const page = await response.json() as ReleasePage, found = page.rows.find(item => item.analysisId === analysisId); assert(found); return found;
}
async function approved(h: Harness, alias: Alias, reference: ManifestAsset, binding: ProductBinding, label: string): Promise<Source> {
  const candidate = await h.makeAsset(alias, label, { derivatives: "distinct" }), analysisId = randomUUID(), workspaceId = h.identities[alias].workspaceId;
  assert(await createAnalysisRecord(h.db, { analysisId, workspaceId, referenceAssetId: reference.id, candidateAssetId: candidate.id, selectedChecks, productBinding: binding, profilesEnabled: true }));
  const source = observations(reference.id, candidate.id), risk = new M0RiskPolicy().decide({ analysisId, selectedChecks, observations: source, limitations: [] }); assert.equal(risk.verdict, "pass");
  await persistCompletedAnalysis(h.db, {
    ...risk, analysisId, observations: source, versions: { qaEngineVersion: "m0-qa-engine-008", riskPolicyVersion: "m0-risk-policy-003", modelPolicyVersion: "m0-model-policy-002" },
    modelCalls: [{ provider: "openai", model: "gpt-4.1-mini", promptVersion: "m0-real-mvp-009+regions-003", latencyMs: 1 }], latencyMs: 1,
  }, { workspaceId, referenceAssetId: reference.id, candidateAssetId: candidate.id, selectedChecks });
  const review = await h.jsonCall("reviews", "POST", `analyses/${analysisId}/reviews`, alias, { requestId: randomUUID(), expectedRevision: 0, action: "approve", category: "other", reason: "JRN-04 synthetic deletion-window regression; no quality claim." }); assert.equal(review.status, 200);
  const original = await row(h, alias, analysisId); assert.equal(original.eligibility, "eligible"); return { analysisId, reference, candidate, original };
}
function sourceUnchanged(source: Source, current: ReleaseRow) {
  assert.deepEqual(current.machine, source.original.machine); assert.deepEqual(current.human, source.original.human);
  assert.deepEqual(current.productSnapshot, source.original.productSnapshot); assert.equal(current.productSnapshotHash, source.original.productSnapshotHash);
  assert.equal(current.assets.referenceAvailable, true, "protected SKU reference stays available");
}
async function isolated(h: Harness, before: Awaited<ReturnType<Harness["storageSnapshot"]>>, source: Source) {
  const after = await h.storageSnapshot(), targetKeys = new Set(source.candidate.keys);
  for (const [table, digest] of Object.entries(before.tableHashes)) if (!["assets", "asset_deletion_attempts"].includes(table)) assert.equal(after.tableHashes[table], digest, table);
  for (const asset of h.manifest) if (asset.id !== source.candidate.id) assert.equal(after.assetHashes[asset.id], before.assetHashes[asset.id], asset.label);
  for (const [key, digest] of Object.entries(before.objects)) if (!targetKeys.has(key)) assert.equal(after.objects[key], digest, key);
  return after.sha256;
}
async function main() {
  const h = await createHarness(), cases: Array<{ name: string; status: string; artifact: string }> = [];
  const retries: Array<{ label: string; response: unknown; release: ReleaseRow }> = [];
  let setupFailure: string | null = null;
  const test = async (name: string, fn: () => Promise<unknown>) => {
    try { const detail = await fn(), artifact = await h.writeArtifact(`partial-case-${cases.length + 1}-pass.json`, { name, status: "PASS", detail }); cases.push({ name, status: "PASS", artifact }); console.log(`PASS ${name}`); }
    catch (error) { const artifact = await h.writeArtifact(`partial-case-${cases.length + 1}-fail.json`, { name, status: "FAIL", error: error instanceof Error ? error.stack : String(error) }); cases.push({ name, status: "FAIL", artifact }); console.error(`FAIL ${name} (${artifact})`); }
  };
  try {
    const references = {} as Record<Alias, ManifestAsset>, bindings = {} as Record<Alias, ProductBinding>;
    const profile = { profileSchemaVersion: 1, name: "JRN-04 synthetic protected partial-window product", skuLabel: "JRN04-PARTIAL", brand: "Northstar", variant: null, capacity: null, packagingVersion: null, criticalAttributes: [], allowedChanges: [] };
    for (const alias of ["A", "B"] as const) {
      const reference = await h.makeAsset(alias, `${alias}-protected-reference`, { kind: "reference", derivatives: "distinct" }), productId = randomUUID(); references[alias] = reference;
      assert.equal((await h.jsonCall("products", "POST", "products", alias, { productId, referenceAssetId: reference.id, name: profile.name, skuLabel: profile.skuLabel })).status, 201);
      assert.equal((await h.jsonCall("profile", "PUT", `products/${productId}/profile`, alias, { expectedVersion: 0, requestId: randomUUID(), profile })).status, 201);
      const product = await getSavedProductById(h.db, productId, h.identities[alias].workspaceId); assert(product?.currentProfile && product.currentReferences[0]);
      bindings[alias] = { productId, expectedVersion: product.revision, profileVersionId: product.currentProfile.versionId, referenceVersionId: product.currentReferences[0].id };
    }
    const normalA = await approved(h, "A", references.A, bindings.A, "A-normal-no-deletion-intent"), normalB = await approved(h, "B", references.B, bindings.B, "B-normal-no-deletion-intent");
    const started = await approved(h, "A", references.A, bindings.A, "A-started-window"), r2Failed = await approved(h, "A", references.A, bindings.A, "A-r2-failed-window"), markFailed = await approved(h, "A", references.A, bindings.A, "A-mark-failed-window");
    await h.writeArtifact("partial-manifest-before-deletion.json", { unitId: "JRN-04", runId: h.runId, assets: h.manifest, sources: { normalA, normalB, started, r2Failed, markFailed }, syntheticMachineEvidence: true, qualityEvidence: false, modelCallsExecuted: 0 });
    const normalUnchanged = async () => { for (const [alias, source] of [["A", normalA], ["B", normalB]] as const) { const current = await row(h, alias, source.analysisId); assert.equal(current.eligibility, "eligible"); assert.deepEqual(current.machine, source.original.machine); assert.deepEqual(current.human, source.original.human); assert.deepEqual(current.assets, source.original.assets); } };
    const retry = async (label: string, source: Source) => {
      const response = await h.jsonCall("analysis", "DELETE", `analyses/${source.analysisId}`, "A"), current = await row(h, "A", source.analysisId);
      await h.writeArtifact(`partial-${label}-retry-original.json`, { response, release: current, metadata: await h.one("select status,deleted_at from assets where id=?", source.candidate.id), audit: await h.rows("select * from asset_deletion_attempts where asset_id=? order by attempted_at,id", source.candidate.id), objects: await h.objectState(source.candidate) });
      assert.equal(response.status, 200); assert.deepEqual(response.body.deletion, { requested: 1, deleted: 1, failed: 0 }); assert.equal(current.eligibility, "blocked"); assert.equal(current.assets.candidateAvailable, false); sourceUnchanged(source, current); retries.push({ label, response, release: current });
    };
    await test("normal future A/B approved sources without deletion intent remain ELIGIBLE", async () => {
      await normalUnchanged(); for (const source of [normalA, normalB]) assert((await h.objectState(source.candidate)).every(object => object.present));
      return { A: await row(h, "A", normalA.analysisId), B: await row(h, "B", normalB.analysisId) };
    });
    await test("actual recorded started intent blocks release before candidate R2 deletion", async () => {
      const before = await h.storageSnapshot(), bucket = h.env.VISUALQA_ASSETS;
      let signal!: () => void, resume!: () => void;
      const reached = new Promise<void>(resolve => { signal = resolve; }), gate = new Promise<void>(resolve => { resume = resolve; });
      h.env.VISUALQA_ASSETS = { put: bucket.put.bind(bucket), get: bucket.get.bind(bucket), async delete(keys) { signal(); await gate; await bucket.delete(keys); } };
      const pending = h.jsonCall("analysis", "DELETE", `analyses/${started.analysisId}`, "A");
      try {
        await reached; const audit = await h.rows("select * from asset_deletion_attempts where asset_id=?", started.candidate.id); assert.equal(audit.length, 1); assert.equal(audit[0].status, "started");
        const image = await h.call("asset", "GET", `assets/${started.candidate.id}`, "A"), current = await row(h, "A", started.analysisId);
        const artifact = await h.writeArtifact("partial-started-window-original.json", { runId: h.runId, before: started.original, release: current, imageHTTP: image.status, objects: await h.objectState(started.candidate), audit });
        assert.equal(image.status, 200); assert((await h.objectState(started.candidate)).every(object => object.present)); assert.equal(current.eligibility, "blocked"); assert.equal(current.assets.candidateAvailable, false); assert(current.reasons.some(reason => reason.code === "assets_unavailable")); sourceUnchanged(started, current); await isolated(h, before, started); await normalUnchanged(); return { artifact, release: current };
      } finally { resume(); const response = await pending; h.env.VISUALQA_ASSETS = bucket; await h.writeArtifact("partial-started-completion-original.json", response); assert.equal(response.status, 200); }
    });
    await test("actual R2 failure keeps readable bytes but failed deletion intent blocks eligibility until retry", async () => {
      const before = await h.storageSnapshot(); h.faults.r2Key = r2Failed.candidate.keys[0];
      try {
        const response = await h.jsonCall("analysis", "DELETE", `analyses/${r2Failed.analysisId}`, "A"), image = await h.call("asset", "GET", `assets/${r2Failed.candidate.id}`, "A"), current = await row(h, "A", r2Failed.analysisId);
        const audit = await h.rows("select * from asset_deletion_attempts where asset_id=?", r2Failed.candidate.id);
        const artifact = await h.writeArtifact("partial-r2-failure-original.json", { before: r2Failed.original, response, imageHTTP: image.status, release: current, audit, metadata: await h.one("select status,deleted_at from assets where id=?", r2Failed.candidate.id), objects: await h.objectState(r2Failed.candidate) });
        assert.equal(response.status, 500); assert.deepEqual(response.body.deletion, { requested: 1, deleted: 0, failed: 1 }); assert.equal(image.status, 200); assert.equal(audit[0].status, "failed"); assert((await h.objectState(r2Failed.candidate)).every(object => object.present)); assert.equal(current.eligibility, "blocked"); assert.equal(current.assets.candidateAvailable, false); sourceUnchanged(r2Failed, current); await isolated(h, before, r2Failed); await normalUnchanged(); return { artifact, release: current };
      } finally { await retry("r2", r2Failed); }
    });
    await test("protected reference plus R2-success/D1-mark-failure candidate is unavailable and BLOCKED before retry", async () => {
      const before = await h.storageSnapshot(); h.faults.markAssetId = markFailed.candidate.id;
      try {
        const response = await h.jsonCall("analysis", "DELETE", `analyses/${markFailed.analysisId}`, "A"), image = await h.jsonCall("asset", "GET", `assets/${markFailed.candidate.id}`, "A"), current = await row(h, "A", markFailed.analysisId);
        const audit = await h.rows("select * from asset_deletion_attempts where asset_id=?", markFailed.candidate.id), metadata = await h.one("select status,deleted_at from assets where id=?", markFailed.candidate.id);
        const artifact = await h.writeArtifact("partial-mark-failure-original.json", { before: markFailed.original, response, image, release: current, audit, metadata, objects: await h.objectState(markFailed.candidate) });
        assert.equal(response.status, 500); assert.deepEqual(response.body.deletion, { requested: 1, deleted: 0, failed: 1 }); assert.equal(image.status, 503); assert.equal(image.body.error, "asset_binary_missing"); assert.equal(metadata.status, "analyzed"); assert.equal(metadata.deleted_at, null); assert.equal(audit[0].status, "failed"); assert((await h.objectState(markFailed.candidate)).every(object => !object.present)); assert.equal(current.eligibility, "blocked"); assert.equal(current.assets.candidateAvailable, false); sourceUnchanged(markFailed, current); await isolated(h, before, markFailed); await normalUnchanged(); return { artifact, release: current };
      } finally { await retry("mark", markFailed); }
    });
    await test("all deletion retries converge; original machine/review/frozen hashes and A/B controls remain", async () => {
      assert.equal(retries.length, 2); await normalUnchanged();
      for (const source of [started, r2Failed, markFailed]) { const current = await row(h, "A", source.analysisId); assert.equal(current.eligibility, "blocked"); sourceUnchanged(source, current); assert((await h.objectState(source.candidate)).every(object => !object.present)); }
      assert.equal((await h.rows("select id from asset_deletion_attempts where asset_id=?", normalB.candidate.id)).length, 0); assert.equal(h.queueCount(), 0); assert.equal(h.outboundCount(), 0); return { retries };
    });
    await test("fresh manifest-scoped environment cleaned without same-ID restoration", async () => {
      for (const alias of ["A", "B"] as const) assert.equal((await h.jsonCall("account", "DELETE", "account/assets", alias)).status, 200);
      assert((await Promise.all(h.manifest.map(h.objectState))).flat().every(object => !object.present)); assert.equal((await h.rows("pragma foreign_key_check")).length, 0); return { assets: h.manifest.length, objectsRemaining: 0 };
    });
  } catch (error) { setupFailure = await h.writeArtifact("partial-setup-failure-original.json", { error: error instanceof Error ? error.stack : String(error) }); }
  finally {
    const storage = await h.storageSnapshot(); await h.dispose(); const status = setupFailure || cases.some(item => item.status === "FAIL") ? "FAIL" : "PASS";
    const path = await h.writeArtifact("partial-final-report.json", { unitId: "JRN-04", runtimeUnitId: "JRN-04-FIX", regression: "approved partial deletion availability", status, runId: h.runId, baselineSha: "94a818b835b62170ea484be177f7b1ee7a97b72a", temporaryDirectory: h.root, cases, setupFailure, storage, manifest: h.manifest, injections: h.injections, servicesStopped: true, productionLifecycleCovered: false, syntheticMachineEvidence: true, qualityEvidence: false, modelCallsExecuted: 0 });
    console.log(JSON.stringify({ status, reportPath: path, runId: h.runId, cases: cases.length })); if (status === "FAIL") process.exitCode = 1;
  }
}
main().catch(error => { console.error(JSON.stringify({ status: "BOOTSTRAP_FAIL", error: error instanceof Error ? error.message : String(error) })); process.exitCode = 1; });
