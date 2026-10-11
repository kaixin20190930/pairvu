import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { StructuredEvidence } from "../../../components/StructuredEvidence";
import { ProductChecker } from "../../../components/ProductChecker";
import type { PersistedAnalysisResult } from "../../../lib/analysis/types";
import type { ObservationEvidence } from "../../../lib/domain/semantics";
import { unavailableRegion } from "../../../lib/qa/evidence-regions";

(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT: boolean}).IS_REACT_ACT_ENVIRONMENT = true;
const nativeFetch = globalThis.fetch.bind(globalThis);
const mode = new URLSearchParams(location.search).get("mode") ?? "desktop";
const gallery = document.getElementById("gallery")!, checker = document.getElementById("checker")!;
const galleryRoot = createRoot(gallery);
let checkerRoot = createRoot(checker), epoch = 0;
const cases: Array<{name: string; status: string; detail?: unknown}> = [], errors: string[] = [];
window.addEventListener("error", event => errors.push(event.message));
const wait = () => new Promise(resolve => setTimeout(resolve, 20));
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function svg(width: number, height: number) { return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#f3eadb"/><text x="8" y="24">Synthetic QA</text></svg>`; }

async function main() {
  const saved: PersistedAnalysisResult = await (await nativeFetch("/result.json")).json();
  const counter: PersistedAnalysisResult = await (await nativeFetch("/counterexample.json")).json();
  let live = saved;
  const evidence = saved.observations[0].evidence;
  const assets = {referenceAssetId: saved.referenceAssetId, candidateAssetId: saved.candidateAssetId};
  const referenceSvg = svg(320, 160), candidateSvg = svg(120, 240);
  const reference = {assetId: assets.referenceAssetId, previewUrl: `data:image/svg+xml,${encodeURIComponent(referenceSvg)}`};
  const candidate = {assetId: assets.candidateAssetId, previewUrl: `data:image/svg+xml,${encodeURIComponent(candidateSvg)}`};
  globalThis.fetch = async input => {
    const url = String(input);
    if (url.startsWith("/api/analyses/")) return new Response(JSON.stringify({analysis: live}));
    if (url.startsWith("/api/assets/")) return new Response(url.includes(assets.referenceAssetId) ? referenceSvg : candidateSvg, {headers: {"Content-Type": "image/svg+xml"}});
    if (url === "/api/runtime-config") return new Response(JSON.stringify({turnstileEnabled: false, analysisAcceptingNewRequests: true}));
    throw new Error(`Unplanned synthetic request: ${url}`);
  };
  async function render(next: ObservationEvidence = evidence, previews = {reference, candidate}) {
    await act(async () => { galleryRoot.render(<StructuredEvidence key={++epoch} evidence={next} {...assets} {...previews}/>); await wait(); });
    await act(async () => { await wait(); });
  }
  async function restore(result: PersistedAnalysisResult) {
    live = result;
    await act(async () => checkerRoot.unmount());
    checkerRoot = createRoot(checker);
    history.replaceState(null, "", `?mode=${mode}&analysis=${result.id}`);
    await act(async () => { checkerRoot.render(<ProductChecker/>); await wait(); });
    for (let n = 0; n < 30 && !checker.querySelector(".result-stack"); n++) await act(async () => { await wait(); });
    check(checker.querySelector(".result-stack"), "Actual ProductChecker restoration");
  }
  const boxes = () => gallery.querySelectorAll(".structured-evidence-box");
  async function test(name: string, fn: () => unknown | Promise<unknown>) {
    const detail = await fn(); cases.push({name, status: "PASS", ...(detail ? {detail} : {})});
  }
  let failure: string | undefined;
  try {
    await render({...evidence, regions: evidence.regionRaw as ObservationEvidence["regions"]});
    // Provider raw is an unbound proposal; exercise a shape-valid stored proposal too.
    const proposed = {...evidence, regions: {schemaVersion: 1 as const, reference: {...unavailableRegion(assets.referenceAssetId, "uncertain_location"), region: {x: .1, y: .2, width: .4, height: .3}, reason: null, confidence: "high" as const}, candidate: {...unavailableRegion(assets.candidateAssetId, "uncertain_location"), region: {x: .25, y: .4, width: .5, height: .2}, reason: null, confidence: "medium" as const}}};
    await render(proposed);
    await test("high and medium model proposals are withheld with explicit unverified explanation", () => { check(boxes().length === 0, "No unverified boxes"); check(gallery.textContent?.includes("not been independently verified"), "Honest location reason"); });
    await test("distinct image aspect ratios remain correct without artificial full-image boxes", () => {
      return Array.from(gallery.querySelectorAll("img")).map((image, i) => { const bounds = image.getBoundingClientRect(); check(Math.abs(bounds.width / bounds.height - (i === 0 ? 2 : .5)) < .01, "Intrinsic aspect ratio"); return {natural: [image.naturalWidth, image.naturalHeight], display: [bounds.width, bounds.height]}; });
    });
    await test("native 150 percent zoom does not manufacture a location", async () => {
      await act(async () => { for (const slider of gallery.querySelectorAll<HTMLInputElement>('input[type="range"]')) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(slider, "150"); slider.dispatchEvent(new Event("input", {bubbles: true})); } });
      check(gallery.textContent?.includes("150%") && boxes().length === 0, "Zoom and no box");
    });
    await test("legacy coordinates remain unrecorded rather than inferred", async () => { await render({boundingRegions: [{assetId: assets.referenceAssetId, x: 20, y: 10, width: 50, height: 50}]}); check(boxes().length === 0 && gallery.textContent?.includes("Region not recorded"), "Legacy fallback"); });
    await test("malformed structure and foreign asset IDs remain safe", async () => { await render({...proposed, regions: {...proposed.regions, reference: {...proposed.regions.reference, assetId: "foreign"}}}); check(boxes().length === 0 && gallery.textContent?.includes("Region data is invalid"), "Malformed fallback"); });
    await test("absent/invisible region has explicit cause", async () => { await render({...evidence, regions: {schemaVersion: 1, reference: unavailableRegion(assets.referenceAssetId, "not_visible"), candidate: unavailableRegion(assets.candidateAssetId, "not_present")}}); check(boxes().length === 0 && gallery.textContent?.includes("not visible") && gallery.textContent?.includes("not present"), "Absence explanation"); });
    await test("mismatched or missing preview never renders unrelated images", async () => { await render(proposed, {reference: {...reference, assetId: "foreign"}, candidate: {...candidate, previewUrl: ""}}); check(gallery.querySelectorAll("img").length === 0 && boxes().length === 0, "Preview binding"); });
    await render(proposed);
    await test("real desktop and narrow frame viewport use correct columns", () => { const columns = getComputedStyle(gallery.querySelector(".structured-evidence-grid")!).gridTemplateColumns.trim().split(/\s+/).length; check(columns === (mode === "narrow" ? 1 : 2), "Responsive columns"); return {viewport: [innerWidth, innerHeight], columns}; });
    await restore(saved);
    await test("sufficient brand mismatch still renders critical FAIL and model evidence without boxes", () => { check(checker.textContent?.includes("FAIL") && checker.textContent?.includes("Critical"), "Critical FAIL retained"); check(checker.textContent?.includes("ALPHA") && checker.textContent?.includes("BETA"), "Identity preserved"); check(checker.textContent?.includes("regions-002") && checker.textContent?.includes("m0-qa-engine-008"), "New versions"); check(checker.querySelectorAll(".structured-evidence-box").length === 0, "No result overlays"); });
    await restore(counter);
    await test("persisted production contradiction renders REVIEW, limitations and no verified text", () => { check(checker.textContent?.includes("REVIEW") && checker.textContent?.includes("not sufficiently observable"), "Review limitation"); check(!checker.textContent?.includes("Visible text · Model reports a match"), "Absent text excluded from matches"); check(checker.querySelectorAll(".structured-evidence-box").length === 0, "No fictional coordinates"); });
    await restore({...saved, qaEngineVersion: "m0-qa-engine-007", verdict: "pass", productIssues: []});
    await test("historical machine verdict is retained with explicit safeguard and unverified-region disclosure", () => { check(checker.textContent?.includes("PASS") && checker.textContent?.includes("Historical result"), "Historical verdict retained explicitly"); check(checker.textContent?.includes("does not rerun analysis or revise its stored verdict"), "No silent reanalysis claim"); });
    await restore(counter);
    await test("actual React components do not crash under malformed or absent region inputs", () => check(errors.length === 0, errors.join(";")));
  } catch (error) { failure = error instanceof Error ? error.stack : String(error); }
  const report = {unitId: "UPG-04", synthetic: true, mode, status: failure ? "FAIL" : "PASS", cases, failure, limitations: ["Actual React components with controlled fetch/auth/billing; no real model or production journey; no location accuracy claim."], completedAt: new Date().toISOString()};
  document.getElementById("summary")!.textContent = `${report.status}: ${cases.length} ${mode} component cases`;
  await nativeFetch("/__results", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(report)});
  if (mode === "desktop") { const frame = document.createElement("iframe"); frame.title = "Narrow viewport repair verification"; frame.width = "375"; frame.height = "1500"; frame.src = "/?mode=narrow"; document.getElementById("narrow")!.append(frame); }
}
void main();
