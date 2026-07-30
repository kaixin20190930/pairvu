import { NextRequest, NextResponse } from "next/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { saveAnalysisFeedback } from "@/lib/analysis/service";
import { isValidAnonymousSessionId } from "@/lib/assets/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await context.params;

  try {
    const body = await request.json();
    const feedbackKind = body?.feedbackKind;
    const comment = typeof body?.comment === "string" ? body.comment : undefined;
    const anonymousSessionId = isValidAnonymousSessionId(body?.anonymousSessionId)
      ? body.anonymousSessionId
      : null;

    if (!anonymousSessionId) {
      return NextResponse.json({ error: "anonymous_session_required" }, { status: 400 });
    }

    if (feedbackKind !== "correct" && feedbackKind !== "false_alarm" && feedbackKind !== "missed_something") {
      return NextResponse.json({ error: "invalid_feedback_kind" }, { status: 400 });
    }

    const env = getVisualQAEnv();
    const analysis = await saveAnalysisFeedback(env.VISUALQA_DB, {
      analysisId,
      anonymousSessionId,
      feedbackKind,
      comment,
    });

    if (!analysis) {
      return NextResponse.json({ error: "analysis_not_found" }, { status: 404 });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("analysis_feedback_failed", error);
    return NextResponse.json({ error: "analysis_feedback_failed" }, { status: 500 });
  }
}
