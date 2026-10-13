import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { NextRequest } from "next/server";

type FailureStage = "env" | "session" | "account" | "entitlement" | "batch";
interface Fixture {
  signedIn: boolean;
  workspaceId: string | null;
  paid: boolean;
  failureAt?: FailureStage;
  failure?: Error;
  events: string[];
  batch: Record<string, unknown>;
}

async function main() {
  const require = createRequire(resolve("package.json"));
  const wranglerRequire = createRequire(require.resolve("wrangler/package.json"));
  const esbuild = wranglerRequire("esbuild");
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "pairvu-batch-export-auth-"));
  const reportPath = resolve(process.argv[2] ?? join(temporaryDirectory, "results.json"));
  const globals = globalThis as unknown as { __batchExportAuthFixture?: Fixture };
  const checks: Array<{ name: string; status: string; events?: string[]; failure?: string }> = [];
  const sources = ["app/api/batches/[batchId]/export/route.ts", "lib/auth/request-access.ts", "lib/releases/csv.ts", "scripts/verify-batch-export-auth.ts"];
  const stubs: Record<string, string> = {
    "@/lib/cloudflare/bindings": `export function getVisualQAEnv(){const f=globalThis.__batchExportAuthFixture;f.events.push('env');if(f.failureAt==='env')throw f.failure;return {VISUALQA_DB:{}};}`,
    "@/lib/auth/server": `export function createPairvuAuth(){return {api:{async getSession(){const f=globalThis.__batchExportAuthFixture;f.events.push('session');if(f.failureAt==='session')throw f.failure;return f.signedIn?{user:{id:'synthetic-user',name:'Synthetic',email:'synthetic@example.test'}}:null;}}};}`,
    "@/lib/accounts/repository": `export async function getWorkspaceAccountSnapshot(){const f=globalThis.__batchExportAuthFixture;f.events.push('account');if(f.failureAt==='account')throw f.failure;return {workspaceId:f.workspaceId,retentionDays:7};}export async function getWorkspaceBatchEntitlement(db,workspaceId){const f=globalThis.__batchExportAuthFixture;f.events.push('entitlement:'+workspaceId);if(f.failureAt==='entitlement')throw f.failure;return {csvExportEnabled:f.paid};}`,
    "@/lib/batches/repository": `export async function getBatchById(db,id,workspaceId){const f=globalThis.__batchExportAuthFixture;f.events.push('batch:'+id+':'+workspaceId);if(f.failureAt==='batch')throw f.failure;return id===f.batch.id&&workspaceId===f.batch.workspaceId?f.batch:null;}`,
  };
  let status = "FAIL";
  let failure: string | null = null;
  function reset(options: Partial<Fixture> = {}) {
    globals.__batchExportAuthFixture = {
      signedIn: true, workspaceId: "workspace-owner", paid: true, events: [],
      batch: {
        id: "owned-batch", workspaceId: "workspace-owner", profileState: "no_profile",
        productSnapshot: null,
        items: [{ position: 0, clientLabel: '=SUM(A1) "quoted"\nline', status: "completed", verdict: "pass", issueCount: 0, limitationCount: 0, completedAt: "2026-10-12T00:00:00.000Z", analysisId: "synthetic-analysis" }],
      },
      ...options,
    };
    return globals.__batchExportAuthFixture;
  }
  async function call(batchId = "owned-batch") {
    let errorLogs = 0;
    const originalError = console.error;
    console.error = () => { errorLogs++; };
    try {
      const context = { get params() { globals.__batchExportAuthFixture!.events.push("params"); return Promise.resolve({ batchId }); } };
      const response = await route.GET(new NextRequest(`https://synthetic.pairvu.test/api/batches/${batchId}/export`), context);
      return { response, errorLogs };
    } finally { console.error = originalError; }
  }
  async function jsonError(expectedStatus: number, code: string) {
    const result = await call();
    assert.equal(result.response.status, expectedStatus);
    assert.match(result.response.headers.get("content-type") ?? "", /^application\/json/);
    assert.equal(result.response.headers.get("content-disposition"), null);
    assert.equal((await result.response.json()).error, code);
    return result;
  }
  async function test(name: string, run: () => Promise<void>) {
    try {
      await run();
      checks.push({ name, status: "PASS", events: [...globals.__batchExportAuthFixture!.events] });
      console.log(`PASS ${name}`);
    } catch (error) {
      checks.push({ name, status: "FAIL", failure: String(error) });
      throw error;
    }
  }
  let route: { GET: (request: NextRequest, context: { params: Promise<{ batchId: string }> }) => Promise<Response> };
  try {
    const generated = join(temporaryDirectory, "route.cjs");
    await esbuild.build({
      entryPoints: [resolve(sources[0])], bundle: true, platform: "node", format: "cjs", outfile: generated,
      plugins: [{ name: "isolated-external-dependencies", setup(builder: {
        onResolve: (options: { filter: RegExp }, callback: (args: { path: string }) => unknown) => void;
        onLoad: (options: { filter: RegExp; namespace: string }, callback: (args: { path: string }) => unknown) => void;
      }) {
        builder.onResolve({ filter: /^@\// }, args => stubs[args.path] ? { path: args.path, namespace: "fixture" } : undefined);
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: stubs[args.path], loader: "js", resolveDir: resolve(".") }));
      } }],
    });
    route = require(generated);
    await test("no Cookie/session uses real identity resolver; 401 before entitlement or batch lookup", async () => {
      const f = reset({ signedIn: false });
      const result = await jsonError(401, "authentication_required");
      assert.equal(result.errorLogs, 0);
      assert.deepEqual(f.events, ["env", "session"]);
    });
    await test("signed-in identity without workspace remains 401 before entitlement", async () => {
      const f = reset({ workspaceId: null });
      await jsonError(401, "authentication_required");
      assert.deepEqual(f.events, ["env", "session", "account"]);
    });
    await test("Free stays 403; batch params and repository are not read", async () => {
      const f = reset({ paid: false });
      const result = await jsonError(403, "csv_export_upgrade_required");
      assert.equal(result.errorLogs, 0);
      assert.deepEqual(f.events, ["env", "session", "account", "entitlement:workspace-owner"]);
    });
    await test("synthetic paid foreign workspace gets 404 with server-derived workspace", async () => {
      const f = reset({ workspaceId: "workspace-other" });
      await jsonError(404, "batch_not_found");
      assert.deepEqual(f.events, ["env", "session", "account", "entitlement:workspace-other", "params", "batch:owned-batch:workspace-other"]);
    });
    await test("synthetic paid owner gets existing private CSV with formula/quote/newline protection", async () => {
      const f = reset();
      const { response, errorLogs } = await call();
      assert.equal(response.status, 200);
      assert.equal(errorLogs, 0);
      assert.equal(response.headers.get("content-type"), "text/csv; charset=utf-8");
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal(response.headers.get("content-disposition"), 'attachment; filename="pairvu-batch-owned-batch.csv"');
      const body = await response.text();
      assert(body.startsWith('"batch_id","position","candidate_label","status","verdict",'));
      assert(body.includes('"owned-batch","1","\'=SUM(A1) ""quoted""\nline","completed","PASS","0","0",'));
      assert(body.includes("https://pairvu.com/?analysis=synthetic-analysis"));
      assert(body.includes("\r\n"));
      assert.deepEqual(f.events, ["env", "session", "account", "entitlement:workspace-owner", "params", "batch:owned-batch:workspace-owner"]);
    });
    for (const stage of ["env", "session", "account", "entitlement", "batch"] as const) {
      await test(`unknown ${stage} failure stays generic 500 with no CSV`, async () => {
        const f = reset({ failureAt: stage, failure: new Error("Synthetic dependency failure") });
        const result = await jsonError(500, "csv_export_failed");
        assert.equal(result.errorLogs, 1);
        const order = ["env", "session", "account", "entitlement:workspace-owner", "params", "batch:owned-batch:workspace-owner"];
        const expectedLast = stage === "entitlement" ? order[3] : stage === "batch" ? order[5] : stage;
        assert.deepEqual(f.events, order.slice(0, order.indexOf(expectedLast) + 1));
      });
    }
    await test("error name alone cannot masquerade as RequestAccessError", async () => {
      reset({ failureAt: "session", failure: Object.assign(new Error("Synthetic named infrastructure error"), { name: "RequestAccessError" }) });
      const result = await jsonError(500, "csv_export_failed");
      assert.equal(result.errorLogs, 1);
    });
    status = "PASS";
  } catch (error) { failure = String(error); process.exitCode = 1; }
  finally {
    delete globals.__batchExportAuthFixture;
    const sourceHashes = Object.fromEntries(await Promise.all(sources.map(async file => [file, createHash("sha256").update(await readFile(file)).digest("hex")])));
    await writeFile(reportPath, JSON.stringify({ unitId: "JRN-01-EXPORT-FIX", role: "developer", status, checks, sourceHashes, temporaryDirectory, synthetic: true, productionVerified: false, limitations: ["Actual route, NextRequest/NextResponse, RequestAccessError and resolveRequestAccess; session/account/entitlement/batch dependency fixtures only.", "No production, real paid identity, database, model or payment calls; independent fixed-SHA and later authorized production verification remain required."], failure }, null, 2) + "\n");
    console.log(`Report: ${reportPath}`);
    if (failure) console.error(failure);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
