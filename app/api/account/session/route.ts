import { NextResponse } from "next/server";
import { createPairvuAuth } from "@/lib/auth/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const env = getVisualQAEnv();
    const session = await createPairvuAuth(env).api.getSession({ headers: request.headers });

    return NextResponse.json(
      { authenticated: Boolean(session?.user) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("account_session_status_failed", error);
    return NextResponse.json(
      { authenticated: false },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
