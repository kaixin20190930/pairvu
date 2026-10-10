import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { releaseVersion } from "@/lib/release-version";

export const dynamic = "force-dynamic";

export function GET() {
  let metadata: unknown;
  try {
    metadata = (getCloudflareContext().env as unknown as { PAIRVU_VERSION_METADATA?: unknown }).PAIRVU_VERSION_METADATA;
  } catch {
    // Local Next.js and historical deployments may not have a platform binding.
  }
  return NextResponse.json({
    ok: true,
    service: "pairvu",
    release: "public-beta",
    ...releaseVersion(metadata),
  });
}
