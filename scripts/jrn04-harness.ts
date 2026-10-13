import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { NextRequest } from "next/server.js";
import { createPairvuAuth } from "../lib/auth/server";
import { getWorkspaceAccountSnapshot } from "../lib/accounts/repository";
import type { D1Database, D1PreparedStatement, R2Bucket, VisualQACloudflareEnv } from "../lib/cloudflare/bindings";

const require = createRequire(resolve("package.json"));
const wr = createRequire(require.resolve("wrangler/package.json"));
const { Miniflare } = wr("miniflare");
const esbuild = wr("esbuild");
export type Row = Record<string, unknown>;
export type Alias = "A" | "B";
export interface Identity { email: string; cookie: string; userId: string; workspaceId: string }
export interface ManifestAsset {
  id: string; owner: Alias; workspaceId: string; label: string; kind: "reference" | "candidate";
  keys: string[]; sha256: string; expiresAt: string | null; initialStatus: string;
}
type Handler = (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<Response>;
interface Builder {
  onResolve(options: { filter: RegExp }, callback: () => { path: string; namespace?: string; external?: boolean }): void;
  onLoad(options: { filter: RegExp; namespace: string }, callback: () => { contents: string; loader: string }): void;
}

export function hash(value: string | Uint8Array) { return createHash("sha256").update(value).digest("hex"); }
function sqlStatements(source: string) {
  const out: string[] = []; let buffer = "", quote = false, comment = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (comment) { if (c === "\n") { comment = false; buffer += "\n"; } continue; }
    if (!quote && c === "-" && source[i + 1] === "-") { comment = true; i++; continue; }
    buffer += c;
    if (c === "'") { if (quote && source[i + 1] === "'") { buffer += source[++i]; continue; } quote = !quote; }
    if (c === ";" && !quote && (!/^\s*create\s+trigger/i.test(buffer) || /\bend\s*;$/i.test(buffer))) { out.push(buffer.trim()); buffer = ""; }
  }
  if (buffer.trim()) out.push(buffer.trim()); return out;
}

export async function createHarness() {
  const runId = randomUUID(), root = await mkdtemp(join(tmpdir(), "pairvu-jrn04-"));
  const mf = new Miniflare({
    host: "127.0.0.1", port: 0, modules: true,
    script: 'export default {fetch(){return new Response("JRN-04 local only")}}',
    compatibilityDate: "2026-07-26", d1Databases: { DB: "jrn04-fresh" }, r2Buckets: { ASSETS: "jrn04-fresh" },
    d1Persist: join(root, "d1"), r2Persist: join(root, "r2"),
    outboundService: async () => new Response("Outbound denied", { status: 403 }),
  });
  const originalFetch = globalThis.fetch;
  const mail = new Map<string, string>();
  const manifest: ManifestAsset[] = [], deleteCalls: string[][] = [], injections: Row[] = [];
  const faults: { r2Key: string | null; markAssetId: string | null } = { r2Key: null, markAssetId: null };
  let blockedOutbound = 0, migrationCount = 0, queueWrites = 0;
  const origin = "http://127.0.0.1:3110";
  try {
    const db = await mf.getD1Database("DB") as D1Database, bucket = await mf.getR2Bucket("ASSETS") as R2Bucket;
    for (const file of (await readdir("migrations")).filter(name => name.endsWith(".sql")).sort()) {
      await db.batch(sqlStatements(await readFile(join("migrations", file), "utf8")).map(sql => db.prepare(sql))); migrationCount++;
    }
    // Pass-through wrappers inject only one named failure. All successful operations use real local storage.
    class FaultStatement implements D1PreparedStatement {
      constructor(readonly query: string, readonly values: unknown[] = []) {}
      bind(...values: unknown[]) { return new FaultStatement(this.query, values); }
      private underlying() { return db.prepare(this.query).bind(...this.values); }
      all<T>() { return this.underlying().all<T>(); }
      first<T>() { return this.underlying().first<T>(); }
      async run() {
        if (faults.markAssetId && /^update assets set status = \?/i.test(this.query) && this.values.at(-1) === faults.markAssetId) {
          injections.push({ layer: "D1 markAssetDeleted before real statement execution", assetId: faults.markAssetId });
          faults.markAssetId = null; return { success: false, error: "jrn04_injected_mark_failure" };
        }
        return this.underlying().run();
      }
    }
    const routeDb: D1Database = new Proxy(db, {
      get(target, property) {
        if (property === "prepare") return (query: string) => new FaultStatement(query);
        if (property === "batch") return (statements: D1PreparedStatement[]) => db.batch(statements.map(statement => {
          assert(statement instanceof FaultStatement); return db.prepare(statement.query).bind(...statement.values);
        }));
        // Better Auth detects native D1 through exec/batch/prepare; preserve the complete real API.
        const value = Reflect.get(target, property); return typeof value === "function" ? value.bind(target) : value;
      },
    });
    const routeBucket: R2Bucket = {
      put: (key, value, options) => bucket.put(key, value, options),
      get: key => bucket.get(key),
      async delete(keys) {
        const values = typeof keys === "string" ? [keys] : keys;
        const permitted = new Set(manifest.flatMap(asset => asset.keys));
        assert(values.every(key => permitted.has(key)), "delete outside this run's asset manifest");
        assert.equal(new Set(values).size, values.length, "duplicate object key in a deletion call");
        deleteCalls.push([...values]);
        if (faults.r2Key && values.includes(faults.r2Key)) {
          injections.push({ layer: "R2 delete before real bucket operation", key: faults.r2Key }); faults.r2Key = null;
          throw new Error("jrn04_injected_r2_delete_failure");
        }
        await bucket.delete(keys);
      },
    };
    const env = {
      VISUALQA_DB: routeDb, VISUALQA_ASSETS: routeBucket, PRODUCT_PROFILES_ENABLED: "true", RELEASE_WORKBENCH_ENABLED: "true",
      BETTER_AUTH_URL: origin, AUTH_TRUSTED_ORIGINS: origin, BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
      RESEND_API_KEY: "local-capture-only", AUTH_EMAIL_FROM: "no-reply@local.invalid",
      BATCH_ANALYSIS_QUEUE: { send: async () => { queueWrites++; }, sendBatch: async (messages: unknown[]) => { queueWrites += messages.length; } },
      BATCH_PRIORITY_ANALYSIS_QUEUE: { send: async () => { queueWrites++; }, sendBatch: async (messages: unknown[]) => { queueWrites += messages.length; } },
    } as VisualQACloudflareEnv;
    (globalThis as typeof globalThis & { __jrn04Env?: VisualQACloudflareEnv }).__jrn04Env = env;
    const routes: Record<string, Record<string, Handler>> = {};
    for (const [key, path] of Object.entries({
      asset: "app/api/assets/[assetId]/route.ts", account: "app/api/account/assets/route.ts",
      analysis: "app/api/analyses/[analysisId]/route.ts", batch: "app/api/batches/[batchId]/route.ts",
      products: "app/api/products/route.ts", profile: "app/api/products/[productId]/profile/route.ts",
      reference: "app/api/products/[productId]/references/route.ts",
      reviews: "app/api/analyses/[analysisId]/reviews/route.ts", releases: "app/api/releases/route.ts",
    })) {
      const output = join(root, `${key}.cjs`);
      await esbuild.build({ entryPoints: [resolve(path)], bundle: true, platform: "node", format: "cjs", outfile: output,
        plugins: [{ name: "jrn04-env-only", setup(build: Builder) {
          build.onResolve({ filter: /^@\/lib\/cloudflare\/bindings$/ }, () => ({ path: "bindings", namespace: "jrn04" }));
          build.onLoad({ filter: /.*/, namespace: "jrn04" }, () => ({ contents: "export const getVisualQAEnv=()=>globalThis.__jrn04Env;", loader: "js" }));
          build.onResolve({ filter: /^next\/server$/ }, () => ({ path: require.resolve("next/server.js"), external: true }));
        } }],
      });
      routes[key] = require(output) as Record<string, Handler>;
    }
    globalThis.fetch = (async (target: RequestInfo | URL, init?: RequestInit) => {
      if (String(target) !== "https://api.resend.com/emails") { blockedOutbound++; throw new Error("jrn04_outbound_blocked"); }
      const body = JSON.parse(String(init?.body)) as { to: string[]; text: string };
      assert(body.to.length === 1 && body.to[0].match(new RegExp(`^jrn04-[ab]-${runId}@example\\.test$`)), "synthetic mail recipient");
      const link = body.text.match(/http:\/\/127\.0\.0\.1:3110\/api\/auth\/magic-link\/verify\?[^\s]+/)?.[0];
      assert(link); mail.set(body.to[0], link); return Response.json({ id: "jrn04-local-capture" });
    }) as typeof fetch;
    const identities = {} as Record<Alias, Identity>, auth = createPairvuAuth(env);
    for (const alias of ["A", "B"] as const) {
      const email = `jrn04-${alias.toLowerCase()}-${runId}@example.test`;
      const sent = await auth.handler(new Request(`${origin}/api/auth/sign-in/magic-link`, { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ email, callbackURL: "/account" }) }));
      assert.equal(sent.status, 200); const link = mail.get(email); assert(link);
      const verified = await auth.handler(new Request(link, { headers: { origin } })); assert([200, 302].includes(verified.status));
      const cookie = verified.headers.getSetCookie().map(value => value.split(";")[0]).join("; "); assert(cookie.includes("session_token"));
      const session = await auth.api.getSession({ headers: new Headers({ cookie }) }); assert(session?.user); assert.equal(session.user.email, email);
      const account = await getWorkspaceAccountSnapshot(db, { id: String(session.user.id), name: String(session.user.name ?? ""), email });
      assert.equal(account.planCode, "free"); identities[alias] = { email, cookie, userId: String(session.user.id), workspaceId: account.workspaceId }; mail.delete(email);
    }
    assert.notEqual(identities.A.workspaceId, identities.B.workspaceId);
    const rows = async (query: string, ...values: unknown[]) => (await db.prepare(query).bind(...values).all<Row>()).results;
    const one = async (query: string, ...values: unknown[]) => { const row = await db.prepare(query).bind(...values).first<Row>(); assert(row, query); return row; };
    const call = async (key: string, method: "GET" | "POST" | "PUT" | "DELETE", path: string, alias: Alias | null, body?: unknown, anonymousSessionId?: string) => {
      // NextRequest normalizes 127.0.0.1 to localhost; align same-origin headers with its effective URL.
      const routeOrigin = "http://localhost:3110", headers: Record<string, string> = { origin: routeOrigin, "content-type": "application/json" };
      if (alias) headers.cookie = identities[alias].cookie;
      if (anonymousSessionId) headers["x-anonymous-session-id"] = anonymousSessionId;
      const params = Object.fromEntries(["asset", "analysis", "batch", "product"].map(name => {
        const plural = name === "analysis" ? "analyses" : name === "batch" ? "batches" : name + "s";
        const id = path.match(new RegExp(`${plural}/([^/?]+)`))?.[1]; return [`${name}Id`, id ?? ""];
      }));
      return routes[key][method](new NextRequest(`${routeOrigin}/api/${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }), { params: Promise.resolve(params) });
    };
    const jsonCall = async (...args: Parameters<typeof call>) => { const response = await call(...args); return { status: response.status, body: await response.json() as Row }; };
    const png = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==", "base64"));
    const makeAsset = async (owner: Alias, label: string, options: { kind?: "reference" | "candidate"; expiresAt?: string | null; status?: string; derivatives?: "same" | "distinct" } = {}) => {
      const id = randomUUID(), original = `jrn04/${runId}/${id}/original.png`, normalized = options.derivatives === "same" ? original : options.derivatives === "distinct" ? `jrn04/${runId}/${id}/normalized.png` : null;
      const thumbnail = options.derivatives === "same" ? original : options.derivatives === "distinct" ? `jrn04/${runId}/${id}/thumbnail.png` : null;
      const keys = [...new Set([original, normalized, thumbnail].filter((v): v is string => v !== null))];
      const asset: ManifestAsset = { id, owner, workspaceId: identities[owner].workspaceId, label, kind: options.kind ?? "candidate", keys, sha256: hash(png), expiresAt: options.expiresAt === undefined ? "2099-12-31T00:00:00.000Z" : options.expiresAt, initialStatus: options.status ?? "analyzed" };
      for (const key of keys) await bucket.put(key, png.buffer as ArrayBuffer, { httpMetadata: { contentType: "image/png" } });
      const now = new Date().toISOString();
      await db.prepare("insert into assets(id,workspace_id,original_file_name,kind,asset_type,mime_type,file_size_bytes,sha256,r2_key_original,r2_key_normalized,r2_key_thumbnail,status,retention_expires_at,created_at,updated_at) values(?,?,?,?,'image','image/png',?,?,?,?,?,?,?,?,?)")
        .bind(id, asset.workspaceId, `JRN04-SYNTHETIC-${label}.png`, asset.kind, png.length, asset.sha256, original, normalized, thumbnail, asset.initialStatus, asset.expiresAt, now, now).run();
      manifest.push(asset); return asset;
    };
    const storageSnapshot = async () => {
      const tables = await rows("select name from sqlite_master where type='table' and name not like 'sqlite_%' and name not like '_cf_%' order by name");
      const excluded = new Set(["user", "session", "account", "verification", "rateLimit"]);
      const tableHashes: Record<string, string> = {};
      for (const table of tables) {
        const name = String(table.name);
        if (!excluded.has(name)) {
          const values = await rows(`select * from "${name.replaceAll('"', '""')}"`);
          // Actual request access touches this timestamp on every authenticated request; retain all ownership/status fields.
          tableHashes[name] = hash(JSON.stringify(values.map(row => JSON.stringify(name === "workspaces" ? { ...row, updated_at: "authenticated-touch-excluded" } : row)).sort()));
        }
      }
      const objects: Record<string, string | null> = {};
      for (const key of [...new Set(manifest.flatMap(asset => asset.keys))].sort()) { const object = await bucket.get(key); objects[key] = object ? hash(new Uint8Array(await object.arrayBuffer())) : null; }
      const assetHashes = Object.fromEntries((await rows("select * from assets order by id")).map(row => [String(row.id), hash(JSON.stringify(row))]));
      return { tableHashes, objects, assetHashes, sha256: hash(JSON.stringify({ tableHashes, objects })), excludedAuthenticationMetadata: ["user", "session", "account", "verification", "rateLimit", "workspaces.updated_at"] };
    };
    const objectState = async (asset: ManifestAsset) => Promise.all(asset.keys.map(async key => ({ key, present: (await bucket.get(key)) !== null })));
    const writeArtifact = async (name: string, value: unknown) => { const path = join(root, name); await writeFile(path, JSON.stringify(value, null, 2) + "\n", { flag: "wx" }); return path; };
    return { runId, root, db, bucket, routeDb, routeBucket, env, identities, manifest, faults, injections, deleteCalls,
      migrationCount, png, rows, one, call, jsonCall, makeAsset, storageSnapshot, objectState, writeArtifact,
      outboundCount: () => blockedOutbound,
      queueCount: () => queueWrites,
      async dispose() { globalThis.fetch = originalFetch; mail.clear(); delete (globalThis as typeof globalThis & { __jrn04Env?: unknown }).__jrn04Env; await mf.dispose(); },
    };
  } catch (error) {
    globalThis.fetch = originalFetch; mail.clear(); await mf.dispose();
    const path = join(root, "bootstrap-failure-original.json");
    await writeFile(path, JSON.stringify({ unitId: "JRN-04", runId, error: error instanceof Error ? error.stack : String(error), servicesStopped: true }, null, 2) + "\n", { flag: "wx" });
    console.error(JSON.stringify({ status: "BOOTSTRAP_FAIL", originalReport: path })); throw error;
  }
}
export type Harness = Awaited<ReturnType<typeof createHarness>>;
