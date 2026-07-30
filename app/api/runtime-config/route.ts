import { NextResponse } from "next/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { getPublicRuntimeConfig } from "@/lib/config/public-beta";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = getVisualQAEnv();
  return NextResponse.json(getPublicRuntimeConfig(env), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
