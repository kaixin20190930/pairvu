import { NextRequest, NextResponse } from "next/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { fetchPersistedAnalysis } from "@/lib/analysis/service";
import { isValidAnonymousSessionId } from "@/lib/assets/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await context.params;
  const anonymousSessionId = request.headers.get("x-anonymous-session-id");
  if (!isValidAnonymousSessionId(anonymousSessionId)) {
    return NextResponse.json({ error: "anonymous_session_required" }, { status: 400 });
  }

  const env = getVisualQAEnv();
  const analysis = await fetchPersistedAnalysis(env.VISUALQA_DB, analysisId);

  if (!analysis || analysis.anonymousSessionId !== anonymousSessionId) {
    return NextResponse.json({ error: "analysis_not_found" }, { status: 404 });
  }

  return NextResponse.json({ analysis });
}
