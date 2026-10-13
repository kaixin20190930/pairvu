import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createAnalysisRecord, persistCompletedAnalysis } from "../lib/analysis/repository";
import { createBatch } from "../lib/batches/repository";
import { getSavedProductById } from "../lib/products/repository";
import { deleteExpiredAssets } from "../lib/assets/deletion";
import { M0RiskPolicy } from "../lib/qa/m0-policy";
import { unavailableRegion } from "../lib/qa/evidence-regions";
import type { M0CheckFamily, VisionObservation } from "../lib/qa/types";
import type { ProductBinding } from "../lib/products/types";
import type { ReleasePage, ReleaseRow } from "../lib/releases/types";
import { createHarness, hash, type Alias, type Harness, type ManifestAsset, type Row } from "./jrn04-harness";

const checks: M0CheckFamily[] = ["logo", "visible_text", "quantity", "dominant_color", "major_components", "major_shape_packaging"];
interface Pair { reference: ManifestAsset; candidate: ManifestAsset; analysisId: string }
interface OwnerFixture extends Pair {
  sentinel: ManifestAsset; productId: string; batchId: string; batchCandidate: ManifestAsset;
  replacementReference: ManifestAsset;
  activeAnalysisId: string; activeBatchId: string;
}
interface CaseResult { name: string; status: "PASS" | "FAIL"; artifact: string }
function observation(checkType: M0CheckFamily, ref: string, cand: string): VisionObservation {
  const identityEvidence = checkType === "logo" ? {
    reference: "Northstar", candidate: "Northstar", referenceKind: "brand_name" as const,
    candidateKind: "brand_name" as const, validationVersion: "identity-evidence-004",
  } : checkType === "visible_text" ? {
    reference: "NORTHSTAR 500 ML", candidate: "NORTHSTAR 500 ML", referenceKind: "readable_text" as const,
    candidateKind: "readable_text" as const, validationVersion: "identity-evidence-004",
  } : undefined;
  return {
    checkType, status: "match", differenceKind: "none", confidence: "high",
    observability: { reference: "observable", candidate: "observable", coverage: "sufficient" },
    explanation: "JRN-04 synthetic visible comparison; no model executed.",
    evidence: {
      referenceObservation: "Northstar label and complete product are visible.",
      candidateObservation: "Northstar label and complete product are visible.",
      comparisonSummary: "Synthetic matching product view.", visibleEvidence: ["Readable Northstar brand and visible product."], identityEvidence,
      regions: { schemaVersion: 1, reference: unavailableRegion(ref, "uncertain_location"), candidate: unavailableRegion(cand, "uncertain_location") },
    },
  };
}
function deletion(response: { status: number; body: Row }) {
  assert(response.body.deletion && typeof response.body.deletion === "object");
  return response.body.deletion as { requested: number; deleted: number; failed: number };
}
async function completed(h: Harness, alias: Alias, reference: ManifestAsset, candidate: ManifestAsset, binding?: ProductBinding): Promise<Pair> {
  const analysisId = randomUUID(), workspaceId = h.identities[alias].workspaceId;
  assert(await createAnalysisRecord(h.db, { analysisId, workspaceId, referenceAssetId: reference.id, candidateAssetId: candidate.id,
    selectedChecks: checks, ...(binding ? { productBinding: binding, profilesEnabled: true } : {}) }));
  const observations = checks.map(check => observation(check, reference.id, candidate.id));
  const risk = new M0RiskPolicy().decide({ analysisId, selectedChecks: checks, observations, limitations: [] }); assert.equal(risk.verdict, "pass");
  await persistCompletedAnalysis(h.db, {
    ...risk, analysisId, observations, versions: { qaEngineVersion: "m0-qa-engine-008", riskPolicyVersion: "m0-risk-policy-003", modelPolicyVersion: "m0-model-policy-002" },
    modelCalls: [{ provider: "openai", model: "gpt-4.1-mini", promptVersion: "m0-real-mvp-009+regions-003", latencyMs: 1 }], latencyMs: 1,
  }, { workspaceId, referenceAssetId: reference.id, candidateAssetId: candidate.id, selectedChecks: checks });
  return { reference, candidate, analysisId };
}
async function releaseRow(h: Harness, alias: Alias, id: string): Promise<ReleaseRow> {
  const response = await h.call("releases", "GET", "releases?limit=50", alias); assert.equal(response.status, 200);
  const page = await response.json() as ReleasePage, row = page.rows.find(row => row.analysisId === id); assert(row); return row;
}
async function assertRead(h: Harness, asset: ManifestAsset, alias: Alias | null, status: number) {
  const response = await h.call("asset", "GET", `assets/${asset.id}`, alias); assert.equal(response.status, status);
  if (status === 200) {
    assert.equal(hash(new Uint8Array(await response.arrayBuffer())), asset.sha256);
    assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
    assert.equal(response.headers.get("content-type"), "image/png");
  } else assert(response.headers.get("content-type")?.includes("json"));
}
function deletionOnly(before: Awaited<ReturnType<Harness["storageSnapshot"]>>, after: Awaited<ReturnType<Harness["storageSnapshot"]>>) {
  for (const [table, digest] of Object.entries(before.tableHashes)) if (!["assets", "asset_deletion_attempts"].includes(table)) assert.equal(after.tableHashes[table], digest, `deletion changed ${table}`);
}
function targetsOnly(h: Harness, before: Awaited<ReturnType<Harness["storageSnapshot"]>>, after: Awaited<ReturnType<Harness["storageSnapshot"]>>, targets: ManifestAsset[]) {
  const ids = new Set(targets.map(asset => asset.id)), keys = new Set(targets.flatMap(asset => asset.keys));
  for (const asset of h.manifest) if (!ids.has(asset.id)) assert.equal(after.assetHashes[asset.id], before.assetHashes[asset.id], `nontarget asset row changed: ${asset.id}`);
  for (const [key, digest] of Object.entries(before.objects)) if (!keys.has(key)) assert.equal(after.objects[key], digest, `nontarget R2 object changed: ${key}`);
}
async function deletedAsset(h: Harness, asset: ManifestAsset) {
  const row = await h.one("select status,deleted_at from assets where id=?", asset.id);
  assert.equal(row.status, "deleted"); assert(typeof row.deleted_at === "string" && Number.isFinite(Date.parse(row.deleted_at)));
  assert((await h.objectState(asset)).every(object => !object.present));
  await assertRead(h, asset, asset.owner, 410); await assertRead(h, asset, asset.owner === "A" ? "B" : "A", 404);
}

async function run() {
  const h = await createHarness(), cases: CaseResult[] = [], expectedFailures: string[] = [];
  const anchor = Date.now(), now = new Date(anchor), startedAt = new Date().toISOString();
  let setupFailure: string | null = null;
  const test = async (name: string, fn: () => Promise<unknown>) => {
    const index = cases.length + 1;
    try {
      const detail = await fn(); const artifact = await h.writeArtifact(`case-${String(index).padStart(2, "0")}-pass.json`, { name, status: "PASS", detail });
      cases.push({ name, status: "PASS", artifact }); console.log(`PASS ${name}`);
    } catch (error) {
      const artifact = await h.writeArtifact(`case-${String(index).padStart(2, "0")}-fail.json`, {
        name, status: "FAIL", error: error instanceof Error ? error.stack : String(error), storage: await h.storageSnapshot(),
      }); cases.push({ name, status: "FAIL", artifact }); console.error(`FAIL ${name} (${artifact})`);
    }
  };
  const fixtures = {} as Record<Alias, OwnerFixture>;
  let faultR2: Pair, faultMark: Pair;
  try {
    const profile = { profileSchemaVersion: 1, name: "JRN-04 synthetic Northstar", skuLabel: "JRN04-SYNTHETIC", brand: "Northstar", variant: null, capacity: null, packagingVersion: null, criticalAttributes: [], allowedChanges: [] };
    for (const alias of ["A", "B"] as const) {
      const sentinel = await h.makeAsset(alias, `${alias}-future-sentinel`, { derivatives: "distinct" });
      const reference = await h.makeAsset(alias, `${alias}-protected-sku-reference`, { kind: "reference", derivatives: "distinct" });
      const candidate = await h.makeAsset(alias, `${alias}-reviewed-analysis-candidate`, { derivatives: "distinct" });
      const productId = randomUUID();
      let response = await h.jsonCall("products", "POST", "products", alias, { productId, referenceAssetId: reference.id, name: profile.name, skuLabel: profile.skuLabel }); assert.equal(response.status, 201);
      response = await h.jsonCall("profile", "PUT", `products/${productId}/profile`, alias, { requestId: randomUUID(), expectedVersion: 0, profile }); assert.equal(response.status, 201);
      const product = await getSavedProductById(h.db, productId, h.identities[alias].workspaceId); assert(product?.currentProfile); assert(product.currentReferences[0]);
      const binding = { productId, expectedVersion: product.revision, profileVersionId: product.currentProfile.versionId, referenceVersionId: product.currentReferences[0].id };
      const pair = await completed(h, alias, reference, candidate, binding);
      response = await h.jsonCall("reviews", "POST", `analyses/${pair.analysisId}/reviews`, alias, { requestId: randomUUID(), expectedRevision: 0, action: "approve", category: "other", reason: "JRN-04 synthetic lifecycle approval; no quality claim." }); assert.equal(response.status, 200);
      assert.equal((await releaseRow(h, alias, pair.analysisId)).eligibility, "eligible");
      const batchCandidate = await h.makeAsset(alias, `${alias}-completed-batch-candidate`, { derivatives: "distinct" }), batchId = randomUUID();
      await createBatch(h.db, { batchId, workspaceId: h.identities[alias].workspaceId, idempotencyKey: randomUUID(), mappingMode: "one_reference_many_candidates", productId, productBinding: binding, profilesEnabled: true, items: [{ referenceAssetId: reference.id, candidateAssetId: batchCandidate.id }], planBatchItemLimit: 20 });
      // Only the terminal status is seeded; no worker/provider is run in this synthetic deletion fixture.
      await h.db.prepare("update batches set status='completed',completed_item_count=1 where id=?").bind(batchId).run();
      await h.db.prepare("update batch_items set status='completed' where batch_id=?").bind(batchId).run();
      const replacementReference = await h.makeAsset(alias, `${alias}-new-current-sku-reference`, { kind: "reference", derivatives: "distinct" });
      response = await h.jsonCall("reference", "POST", `products/${productId}/references`, alias, { referenceAssetId: replacementReference.id, referenceRole: "front", expectedVersion: product.revision, requestId: randomUUID() }); assert.equal(response.status, 201);
      assert.equal((await h.one("select status from product_reference_versions where asset_id=?", reference.id)).status, "superseded");
      assert.equal((await releaseRow(h, alias, pair.analysisId)).eligibility, "eligible");
      const activeRef = await h.makeAsset(alias, `${alias}-active-reference`, { kind: "reference" }), activeCand = await h.makeAsset(alias, `${alias}-active-candidate`), activeAnalysisId = randomUUID(), activeBatchId = randomUUID();
      await createAnalysisRecord(h.db, { analysisId: activeAnalysisId, workspaceId: h.identities[alias].workspaceId, referenceAssetId: activeRef.id, candidateAssetId: activeCand.id, selectedChecks: checks });
      await createBatch(h.db, { batchId: activeBatchId, workspaceId: h.identities[alias].workspaceId, idempotencyKey: randomUUID(), mappingMode: "explicit_pairs", items: [{ referenceAssetId: activeRef.id, candidateAssetId: activeCand.id }], planBatchItemLimit: 20 });
      fixtures[alias] = { ...pair, sentinel, productId, batchId, batchCandidate, replacementReference, activeAnalysisId, activeBatchId };
    }
    faultR2 = await completed(h, "A", await h.makeAsset("A", "fault-r2-reference", { kind: "reference", derivatives: "distinct" }), await h.makeAsset("A", "fault-r2-candidate", { derivatives: "distinct" }));
    faultMark = await completed(h, "A", await h.makeAsset("A", "fault-mark-reference", { kind: "reference", derivatives: "distinct" }), await h.makeAsset("A", "fault-mark-candidate", { derivatives: "distinct" }));
    const boundary = await h.makeAsset("A", "expiry-boundary", { expiresAt: now.toISOString(), derivatives: "same" });
    const expiredA = await h.makeAsset("A", "expired-A", { expiresAt: new Date(anchor - 1000).toISOString(), derivatives: "distinct" });
    const expiredB = await h.makeAsset("B", "expired-B", { expiresAt: new Date(anchor - 2000).toISOString(), derivatives: "distinct" });
    const noExpiry = await h.makeAsset("A", "null-expiry", { expiresAt: null });
    const nullExpiryPair = await completed(h, "A", await h.makeAsset("A", "null-expiry-analysis-reference", { kind: "reference" }), noExpiry);
    const invalidExpiry = await h.makeAsset("B", "invalid-expiry", { expiresAt: "not-a-date" });
    const expiredPair = await completed(h, "A", await h.makeAsset("A", "expired-release-reference", { kind: "reference" }), expiredA);
    const invalidPair = await completed(h, "B", await h.makeAsset("B", "invalid-release-reference", { kind: "reference" }), invalidExpiry);
    const alreadyDeleted = await h.makeAsset("A", "already-deleted-retention-sentinel", { expiresAt: new Date(anchor - 3000).toISOString(), status: "deleted" });
    await h.writeArtifact("manifest-before-deletion.json", {
      unitId: "JRN-04", runId: h.runId, clock: { anchor: now.toISOString(), routeBoundary: "Date.now overridden only during boundary GETs", sweeper: "explicit options.now" },
      identities: Object.fromEntries((["A", "B"] as const).map(alias => [alias, { email: h.identities[alias].email, workspaceId: h.identities[alias].workspaceId }])),
      assets: h.manifest, relations: fixtures, faultAnalyses: { r2: faultR2, mark: faultMark }, expiryAnalyses: { null: nullExpiryPair, expired: expiredPair, invalid: invalidPair },
      expectedScope: { retention: [boundary.id, expiredA.id, expiredB.id], analysisDeletePreservesSkuReferences: [fixtures.A.reference.id, fixtures.B.reference.id], accountDelete: "all remaining nondeleted assets only in the authenticated workspace" },
      syntheticMachineEvidence: true, qualityEvidence: false, modelCallsExecuted: 0,
    });

    await test("real A/B sessions, own private image bytes, foreign and anonymous read denial", async () => {
      for (const alias of ["A", "B"] as const) {
        await assertRead(h, fixtures[alias].sentinel, alias, 200); await assertRead(h, fixtures[alias].sentinel, alias === "A" ? "B" : "A", 404);
        await assertRead(h, fixtures[alias].sentinel, null, 400);
        const anonymous = await h.call("asset", "GET", `assets/${fixtures[alias].sentinel.id}`, null, undefined, randomUUID());
        assert.equal(anonymous.status, 404, "valid anonymous identity must not access workspace image");
      }
      return { actualBetterAuth: true, separateFreeWorkspaces: true, migrations: h.migrationCount, digest: hash(h.png) };
    });
    await test("expiry boundary revokes GET while objects remain; null and invalid dates fail closed", async () => {
      const originalNow = Date.now;
      try {
        Date.now = () => anchor - 1; await assertRead(h, boundary, "A", 200);
        Date.now = () => anchor; await assertRead(h, boundary, "A", 410);
        Date.now = () => anchor + 1; await assertRead(h, boundary, "A", 410);
      } finally { Date.now = originalNow; }
      for (const asset of [boundary, expiredA, expiredB, noExpiry, invalidExpiry]) { await assertRead(h, asset, asset.owner, 410); assert((await h.objectState(asset)).every(object => object.present)); }
      return { boundaryMilliseconds: [-1, 0, 1], noR2Deletion: true };
    });
    await test("null-expiry source rejected by asset GET cannot become ELIGIBLE after actual approval", async () => {
      const before = await releaseRow(h, "A", nullExpiryPair.analysisId);
      const review = await h.jsonCall("reviews", "POST", `analyses/${nullExpiryPair.analysisId}/reviews`, "A", { requestId: randomUUID(), expectedRevision: 0, action: "approve", category: "other", reason: "JRN-04 synthetic null-expiry counterexample." });
      assert.equal(review.status, 200); const image = await h.jsonCall("asset", "GET", `assets/${noExpiry.id}`, "A"), after = await releaseRow(h, "A", nullExpiryPair.analysisId);
      await h.writeArtifact("null-expiry-release-original.json", { before, review, image, after, analysisId: nullExpiryPair.analysisId, assetId: noExpiry.id });
      assert.equal(image.status, 410); assert.equal(after.eligibility, "blocked", "asset GET rejects null expiry; release must not allow ELIGIBLE");
      assert(after.reasons.some(reason => reason.code === "assets_unavailable")); return { before, after };
    });
    await test("release availability keeps valid future source and blocks expired/invalid dates", async () => {
      const future = await releaseRow(h, "A", fixtures.A.analysisId); assert.equal(future.eligibility, "eligible");
      await assertRead(h, fixtures.A.candidate, "A", 200); const details = [];
      for (const [alias, pair] of [["A", expiredPair], ["B", invalidPair]] as const) {
        const review = await h.jsonCall("reviews", "POST", `analyses/${pair.analysisId}/reviews`, alias, { requestId: randomUUID(), expectedRevision: 0, action: "approve", category: "other", reason: "JRN-04 synthetic expiry matrix." }); assert.equal(review.status, 200);
        const image = await h.jsonCall("asset", "GET", `assets/${pair.candidate.id}`, alias), release = await releaseRow(h, alias, pair.analysisId);
        assert.equal(image.status, 410); assert.equal(release.eligibility, "blocked"); assert(release.reasons.some(reason => reason.code === "assets_unavailable")); details.push({ alias, expiry: pair.candidate.expiresAt, image, release });
      }
      return { future, blocked: details };
    });
    await test("small-page real retention cleanup deduplicates keys, audits and preserves nontargets", async () => {
      const before = await h.storageSnapshot(), summaries = [];
      for (let i = 0; i < 10; i++) { const summary = await deleteExpiredAssets(h.routeDb, h.routeBucket, { now, batchSize: 2 }); summaries.push(summary); if (!summary.hasMore) break; }
      assert.equal(summaries.reduce((count, value) => count + value.deleted, 0), 3); assert(summaries.every(value => value.failed === 0));
      for (const asset of [boundary, expiredA, expiredB]) { await deletedAsset(h, asset); assert.equal((await h.one("select deleted_at from assets where id=?", asset.id)).deleted_at, now.toISOString()); }
      for (const asset of [fixtures.A.sentinel, fixtures.B.sentinel, noExpiry, invalidExpiry, alreadyDeleted]) assert((await h.objectState(asset)).every(object => object.present));
      const boundaryAttempt = await h.one("select object_keys_json,status from asset_deletion_attempts where asset_id=?", boundary.id);
      assert.equal(boundaryAttempt.status, "completed"); assert.deepEqual(JSON.parse(String(boundaryAttempt.object_keys_json)), boundary.keys); assert.equal(boundary.keys.length, 1);
      const after = await h.storageSnapshot(); deletionOnly(before, after); targetsOnly(h, before, after, [boundary, expiredA, expiredB]);
      const calls = h.deleteCalls.length, stable = after.sha256;
      const repeat = await deleteExpiredAssets(h.routeDb, h.routeBucket, { now, batchSize: 2 }); assert.deepEqual(repeat, { scanned: 0, deleted: 0, failed: 0, hasMore: false });
      assert.equal(h.deleteCalls.length, calls); assert.equal((await h.storageSnapshot()).sha256, stable);
      return { summaries, repeat, before: before.sha256, after: after.sha256, attempts: await h.rows("select asset_id,status,object_keys_json,attempted_at,completed_at from asset_deletion_attempts order by asset_id") };
    });
    await test("anonymous analysis/account/batch DELETE returns authentication denial without storage change", async () => {
      const before = await h.storageSnapshot(), responses = [];
      for (const [key, path] of [["analysis", `analyses/${fixtures.A.analysisId}`], ["account", "account/assets"], ["batch", `batches/${fixtures.A.batchId}`]]) {
        const response = await h.jsonCall(key, "DELETE", path, null); responses.push({ key, ...response }); assert.equal((await h.storageSnapshot()).sha256, before.sha256);
      }
      await h.writeArtifact("anonymous-delete-responses.json", responses);
      for (const response of responses) assert.equal(response.status, 401, `${response.key}: ${JSON.stringify(response)}`);
      return responses;
    });
    await test("A/B bidirectional valid foreign analysis and batch deletion deny with full storage unchanged", async () => {
      const responses = [];
      for (const [actor, target] of [["A", "B"], ["B", "A"]] as const) {
        for (const [key, path] of [["analysis", `analyses/${fixtures[target].analysisId}`], ["batch", `batches/${fixtures[target].batchId}`]]) {
          const before = await h.storageSnapshot(); const response = await h.jsonCall(key, "DELETE", path, actor, { workspaceId: h.identities[target].workspaceId, actorId: h.identities[target].userId });
          assert.equal(response.status, 404); assert.equal((await h.storageSnapshot()).sha256, before.sha256); responses.push({ actor, target, key, ...response });
        }
      }
      return responses;
    });
    await test("queued/running analysis and queued/processing batch delete protections return 409 unchanged", async () => {
      const responses = [];
      for (const alias of ["A", "B"] as const) {
        await h.db.prepare("update batches set status='canceled' where id=?").bind(fixtures[alias].activeBatchId).run();
        await h.db.prepare("update batch_items set status='canceled' where batch_id=?").bind(fixtures[alias].activeBatchId).run();
        for (const status of ["queued", "running"]) {
          await h.db.prepare("update analyses set status=? where id=?").bind(status, fixtures[alias].activeAnalysisId).run(); const before = await h.storageSnapshot();
          const response = await h.jsonCall("analysis", "DELETE", `analyses/${fixtures[alias].activeAnalysisId}`, alias); assert.equal(response.status, 409); assert.equal((await h.storageSnapshot()).sha256, before.sha256); responses.push({ alias, source: status, ...response });
          const account = await h.jsonCall("account", "DELETE", "account/assets", alias); assert.equal(account.status, 409); assert.equal((await h.storageSnapshot()).sha256, before.sha256); responses.push({ alias, source: `workspace with only ${status} analysis`, ...account });
        }
        await h.db.prepare("update analyses set status='failed' where id=?").bind(fixtures[alias].activeAnalysisId).run();
        await h.db.prepare("update batch_items set status='queued' where batch_id=?").bind(fixtures[alias].activeBatchId).run();
        for (const status of ["queued", "processing"]) {
          await h.db.prepare("update batches set status=? where id=?").bind(status, fixtures[alias].activeBatchId).run(); const before = await h.storageSnapshot();
          const response = await h.jsonCall("batch", "DELETE", `batches/${fixtures[alias].activeBatchId}`, alias); assert.equal(response.status, 409); assert.equal((await h.storageSnapshot()).sha256, before.sha256); responses.push({ alias, source: status, ...response });
          const account = await h.jsonCall("account", "DELETE", "account/assets", alias); assert.equal(account.status, 409); assert.equal((await h.storageSnapshot()).sha256, before.sha256); responses.push({ alias, source: `workspace with only ${status} batch`, ...account });
        }
        const before = await h.storageSnapshot(), response = await h.jsonCall("account", "DELETE", "account/assets", alias); assert.equal(response.status, 409); assert.equal((await h.storageSnapshot()).sha256, before.sha256); responses.push({ alias, source: "workspace active", ...response });
      }
      // Terminal fixture transitions remove active guards for subsequent deletion tests; they do not execute work.
      for (const alias of ["A", "B"] as const) {
        await h.db.prepare("update analyses set status='failed' where id=?").bind(fixtures[alias].activeAnalysisId).run();
        await h.db.prepare("update batches set status='canceled' where id=?").bind(fixtures[alias].activeBatchId).run();
        await h.db.prepare("update batch_items set status='canceled' where batch_id=?").bind(fixtures[alias].activeBatchId).run();
      }
      return responses;
    });
    await test("owner analysis DELETE preserves SKU reference, revokes candidate and ELIGIBLE without altering audit/source/credits", async () => {
      const details = [];
      for (const alias of ["A", "B"] as const) {
        const fixture = fixtures[alias], original = await releaseRow(h, alias, fixture.analysisId), before = await h.storageSnapshot(); assert.equal(original.eligibility, "eligible");
        const response = await h.jsonCall("analysis", "DELETE", `analyses/${fixture.analysisId}`, alias); assert.equal(response.status, 200); assert.deepEqual(deletion(response), { requested: 1, deleted: 1, failed: 0 });
        await deletedAsset(h, fixture.candidate); await assertRead(h, fixture.reference, alias, 200); assert((await h.objectState(fixture.reference)).every(object => object.present));
        const blocked = await releaseRow(h, alias, fixture.analysisId); assert.equal(blocked.eligibility, "blocked"); assert(blocked.reasons.some(reason => reason.code === "assets_unavailable"));
        assert.deepEqual(blocked.human, original.human); assert.deepEqual(blocked.machine, original.machine); assert.deepEqual(blocked.productSnapshot, original.productSnapshot); assert.equal(blocked.productSnapshotHash, original.productSnapshotHash);
        const detail = await h.jsonCall("analysis", "GET", `analyses/${fixture.analysisId}`, alias); assert.equal(detail.status, 200);
        const after = await h.storageSnapshot(); deletionOnly(before, after); targetsOnly(h, before, after, [fixture.candidate]);
        const repeatBefore = after.sha256, repeat = await h.jsonCall("analysis", "DELETE", `analyses/${fixture.analysisId}`, alias); assert.equal(repeat.status, 200); assert.deepEqual(deletion(repeat), { requested: 0, deleted: 0, failed: 0 }); assert.equal((await h.storageSnapshot()).sha256, repeatBefore);
        details.push({ alias, response, repeat, originalRelease: original, blockedRelease: blocked });
      }
      return details;
    });
    await test("owner batch DELETE preserves SKU reference, deletes candidate and is idempotent", async () => {
      const responses = [];
      for (const alias of ["A", "B"] as const) {
        const fixture = fixtures[alias], before = await h.storageSnapshot(); const response = await h.jsonCall("batch", "DELETE", `batches/${fixture.batchId}`, alias); assert.equal(response.status, 200); assert.deepEqual(deletion(response), { requested: 1, deleted: 1, failed: 0 });
        await deletedAsset(h, fixture.batchCandidate); await assertRead(h, fixture.reference, alias, 200); const after = await h.storageSnapshot(); deletionOnly(before, after); targetsOnly(h, before, after, [fixture.batchCandidate]);
        const repeat = await h.jsonCall("batch", "DELETE", `batches/${fixture.batchId}`, alias); assert.equal(repeat.status, 200); assert.deepEqual(deletion(repeat), { requested: 0, deleted: 0, failed: 0 }); assert.equal((await h.storageSnapshot()).sha256, after.sha256); responses.push({ alias, response, repeat });
      }
      return responses;
    });
    await test("real R2 deletion failure reports partial failure; route retry converges with audit preserved", async () => {
      const before = await h.storageSnapshot(); h.faults.r2Key = faultR2.reference.keys[0];
      const response = await h.jsonCall("analysis", "DELETE", `analyses/${faultR2.analysisId}`, "A");
      const failure = await h.writeArtifact("expected-r2-failure-original.json", { response, target: faultR2, objects: await h.objectState(faultR2.reference), asset: await h.one("select id,status,deleted_at from assets where id=?", faultR2.reference.id), attempts: await h.rows("select * from asset_deletion_attempts where asset_id in (?,?) order by attempted_at", faultR2.reference.id, faultR2.candidate.id) }); expectedFailures.push(failure);
      assert.equal(response.status, 500); assert.deepEqual(deletion(response), { requested: 2, deleted: 1, failed: 1 }); assert((await h.objectState(faultR2.reference)).every(object => object.present)); assert.equal((await h.one("select status from assets where id=?", faultR2.reference.id)).status, "analyzed");
      await deletedAsset(h, faultR2.candidate); await assertRead(h, fixtures.B.sentinel, "B", 200); const partial = await h.storageSnapshot(); deletionOnly(before, partial); targetsOnly(h, before, partial, [faultR2.reference, faultR2.candidate]);
      const retry = await h.jsonCall("analysis", "DELETE", `analyses/${faultR2.analysisId}`, "A"); assert.equal(retry.status, 200); assert.deepEqual(deletion(retry), { requested: 1, deleted: 1, failed: 0 }); await deletedAsset(h, faultR2.reference);
      targetsOnly(h, before, await h.storageSnapshot(), [faultR2.reference, faultR2.candidate]);
      const attempts = await h.rows("select status from asset_deletion_attempts where asset_id=? order by attempted_at,id", faultR2.reference.id); assert.equal(attempts.filter(row => row.status === "failed").length, 1); assert.equal(attempts.filter(row => row.status === "completed").length, 1);
      return { failure, retry, attempts, injection: h.injections.at(-1) };
    });
    await test("R2 success then D1 mark failure does not report success; retry completes without restoring same ID", async () => {
      const before = await h.storageSnapshot(); h.faults.markAssetId = faultMark.reference.id;
      const response = await h.jsonCall("analysis", "DELETE", `analyses/${faultMark.analysisId}`, "A");
      const failure = await h.writeArtifact("expected-d1-mark-failure-original.json", { response, target: faultMark, objects: await h.objectState(faultMark.reference), asset: await h.one("select id,status,deleted_at from assets where id=?", faultMark.reference.id), attempts: await h.rows("select * from asset_deletion_attempts where asset_id in (?,?) order by attempted_at", faultMark.reference.id, faultMark.candidate.id) }); expectedFailures.push(failure);
      assert.equal(response.status, 500); assert.deepEqual(deletion(response), { requested: 2, deleted: 1, failed: 1 }); assert((await h.objectState(faultMark.reference)).every(object => !object.present)); assert.equal((await h.one("select status from assets where id=?", faultMark.reference.id)).status, "analyzed");
      await assertRead(h, faultMark.reference, "A", 503); await assertRead(h, fixtures.B.sentinel, "B", 200); const partial = await h.storageSnapshot(); deletionOnly(before, partial); targetsOnly(h, before, partial, [faultMark.reference, faultMark.candidate]);
      const retry = await h.jsonCall("analysis", "DELETE", `analyses/${faultMark.analysisId}`, "A"); assert.equal(retry.status, 200); assert.deepEqual(deletion(retry), { requested: 1, deleted: 1, failed: 0 }); await deletedAsset(h, faultMark.reference); await deletedAsset(h, faultMark.candidate);
      targetsOnly(h, before, await h.storageSnapshot(), [faultMark.reference, faultMark.candidate]);
      const attempts = await h.rows("select status from asset_deletion_attempts where asset_id=?", faultMark.reference.id); assert.equal(attempts.filter(row => row.status === "failed").length, 1); assert.equal(attempts.filter(row => row.status === "completed").length, 1);
      return { failure, retry, attempts, injection: h.injections.at(-1) };
    });
    await test("account image DELETE ignores forged workspace and only deletes authenticated workspace; replay idempotent", async () => {
      const responses = [];
      for (const [actor, forged] of [["B", "A"], ["A", "B"]] as const) {
        await assertRead(h, fixtures[actor].sentinel, actor, 200); const before = await h.storageSnapshot();
        const targetIds = new Set((await h.rows("select id from assets where workspace_id=? and status<>'deleted'", h.identities[actor].workspaceId)).map(row => String(row.id)));
        const targets = h.manifest.filter(asset => targetIds.has(asset.id)); assert.equal(targetIds.size, targets.length);
        const response = await h.jsonCall("account", "DELETE", "account/assets", actor, { workspaceId: h.identities[forged].workspaceId, actorId: h.identities[forged].userId }); assert.equal(response.status, 200); assert.equal(deletion(response).failed, 0);
        for (const asset of targets) await deletedAsset(h, asset);
        const after = await h.storageSnapshot(); deletionOnly(before, after); targetsOnly(h, before, after, targets);
        for (const asset of h.manifest.filter(asset => asset.owner !== actor)) for (const key of asset.keys) assert.equal(after.objects[key], before.objects[key], `account deletion reached foreign ${key}`);
        const repeat = await h.jsonCall("account", "DELETE", "account/assets", actor); assert.equal(repeat.status, 200); assert.deepEqual(deletion(repeat), { requested: 0, deleted: 0, failed: 0 }); assert.equal((await h.storageSnapshot()).sha256, after.sha256);
        responses.push({ actor, forged, targetIds: targets.map(asset => asset.id), response, repeat });
      }
      return responses;
    });
    await test("final object accounting and retained machine/review audit; local fixture orphan cleanup", async () => {
      const remaining = [] as string[];
      for (const asset of h.manifest) for (const object of await h.objectState(asset)) if (object.present) remaining.push(object.key);
      assert.deepEqual(remaining, alreadyDeleted.keys, "only the intentionally predeleted orphan survives application deletion selectors");
      // Test-environment cleanup is explicitly separate from the application journey and manifest restricted.
      await h.routeBucket.delete(remaining); assert((await h.objectState(alreadyDeleted)).every(object => !object.present));
      assert.equal(h.outboundCount(), 0); assert.equal(h.queueCount(), 0); assert.equal((await h.rows("pragma foreign_key_check")).length, 0);
      for (const alias of ["A", "B"] as const) { const row = await releaseRow(h, alias, fixtures[alias].analysisId); assert.equal(row.machine.verdict, "pass"); assert.equal(row.human.action, "approve"); assert.equal(row.human.revision, 1); assert.equal(row.eligibility, "blocked"); }
      return { remainingBeforeFixtureCleanup: remaining, remainingAfter: [], manifestAssets: h.manifest.length, auditAttempts: await h.rows("select asset_id,status,object_keys_json,error_message,attempted_at,completed_at from asset_deletion_attempts order by asset_id,attempted_at,id") };
    });
  } catch (error) {
    setupFailure = await h.writeArtifact("setup-or-run-failure-original.json", { error: error instanceof Error ? error.stack : String(error) }); process.exitCode = 1;
  } finally {
    const finalStorage = await h.storageSnapshot(); await h.dispose();
    const result = { unitId: "JRN-04", runId: h.runId, status: setupFailure || cases.some(item => item.status === "FAIL") ? "FAIL" : "PASS",
      startedAt, finishedAt: new Date().toISOString(), temporaryDirectory: h.root, baselineSha: "463887050e4ba3fbd294fd45b59607b5d80ec31b", cases, setupFailure, expectedFailures,
      actualBetterAuth: true, localD1: true, localR2: true, actualRoutes: true, productionLifecycleCovered: false, qualityEvidence: false, syntheticMachineEvidence: true, modelCallsExecuted: 0,
      outboundCount: h.outboundCount(), queueWrites: h.queueCount(), injections: h.injections, deleteCalls: h.deleteCalls, finalStorage, servicesStopped: true,
      limitations: ["Image bytes, machine observations and model provenance rows are synthetic; no model ran.", "Fixture status transitions and expiry clock are explicit local inputs.", "Narrow pass-through faults sit around real D1/R2 operations; these are not production failure probes.", "Private D1/R2 storage stays only in the temporary directory; no browser E2E was required for this backend unit."],
    };
    const path = await h.writeArtifact("final-report.json", result); console.log(JSON.stringify({ status: result.status, runId: h.runId, reportPath: path, cases: cases.length, failures: cases.filter(item => item.status === "FAIL").length }));
    if (result.status === "FAIL") process.exitCode = 1;
  }
}
run().catch(error => { console.error(JSON.stringify({ status: "BOOTSTRAP_FAIL", error: error instanceof Error ? error.message : String(error) })); process.exitCode = 1; });
