import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Jimp } from "jimp";
import { canAccessOwnedResource } from "../lib/auth/request-access";
import { storeUploadedAsset } from "../lib/assets/storage";
import type { R2Bucket, R2Object, R2ObjectBody } from "../lib/cloudflare/bindings";

async function main(): Promise<void> {
  const bucket = new MemoryR2();
  const image = new Jimp({ width: 8, height: 8, color: 0xffffffff });
  const bytes = await image.getBuffer("image/png");
  const file = new File([toArrayBuffer(bytes)], "product.png", { type: "image/png" });
  const before = Date.now();

  const workspaceAsset = await storeUploadedAsset(bucket, {
    file,
    kind: "reference",
    workspaceId: "personal_test-user",
    retentionDays: 7,
  });
  assert.equal(workspaceAsset.workspaceId, "personal_test-user");
  assert.equal(workspaceAsset.anonymousSessionId, undefined);
  assert.match(workspaceAsset.r2KeyOriginal, /^workspaces\/personal_test-user\/m0\/uploads\/reference\//);
  assertRetentionNear(workspaceAsset.retentionExpiresAt, before + 7 * 24 * 60 * 60 * 1000);

  const anonymousAsset = await storeUploadedAsset(bucket, {
    file,
    kind: "candidate",
    anonymousSessionId: "00000000-0000-4000-8000-000000000001",
  });
  assert.equal(anonymousAsset.workspaceId, undefined);
  assert.match(anonymousAsset.r2KeyOriginal, /^anonymous\/00000000-0000-4000-8000-000000000001\/candidate\//);
  assertRetentionNear(anonymousAsset.retentionExpiresAt, before + 24 * 60 * 60 * 1000);

  const signedInAccess = {
    workspaceId: "personal_test-user",
    anonymousSessionId: "00000000-0000-4000-8000-000000000001",
    retentionDays: 7,
    authenticated: true,
  };
  assert.equal(canAccessOwnedResource(signedInAccess, { workspaceId: "personal_test-user", anonymousSessionId: null }), true);
  assert.equal(canAccessOwnedResource(signedInAccess, { workspaceId: "personal_other", anonymousSessionId: null }), false);
  assert.equal(
    canAccessOwnedResource(signedInAccess, {
      workspaceId: null,
      anonymousSessionId: "00000000-0000-4000-8000-000000000001",
    }),
    true,
  );

  const migration = await readFile(join(process.cwd(), "migrations/0008_workspace_analysis_idempotency.sql"), "utf8");
  assert.match(migration, /unique index[\s\S]+workspace_id, idempotency_key/);

  const analysisRoute = await readFile(join(process.cwd(), "app/api/analyses/route.ts"), "utf8");
  assert.match(analysisRoute, /reserveWorkspaceCredits/);
  assert.match(analysisRoute, /settleCreditReservation/);
  assert.match(analysisRoute, /releaseCreditReservation/);
  assert.match(analysisRoute, /workspace_quota_exceeded|InsufficientWorkspaceCreditsError/);

  console.log("M1 workspace analysis verification passed.");
  console.log("Verified workspace ownership, anonymous isolation, retention, idempotency, and credit lifecycle wiring.");
}

function assertRetentionNear(actual: string | undefined, expected: number): void {
  assert.ok(actual, "Expected retention expiry");
  assert.ok(Math.abs(Date.parse(actual) - expected) < 5_000, `Unexpected retention expiry: ${actual}`);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

class MemoryR2 implements R2Bucket {
  readonly objects = new Map<string, ArrayBuffer>();

  async put(key: string, value: ArrayBuffer | Blob | string): Promise<R2Object> {
    const buffer = value instanceof ArrayBuffer
      ? value
      : value instanceof Blob
        ? await value.arrayBuffer()
        : new TextEncoder().encode(value).buffer;
    this.objects.set(key, buffer);
    return { key, size: buffer.byteLength, etag: "test", uploaded: new Date() };
  }

  async get(): Promise<R2ObjectBody | null> {
    return null;
  }

  async delete(keys: string | string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) this.objects.delete(key);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
