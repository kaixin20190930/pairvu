import { NextRequest, NextResponse } from "next/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { saveAnalysisFeedback } from "@/lib/analysis/service";
import { isValidAnonymousSessionId } from "@/lib/assets/validation";

export const dynamic = "force-dynamic";

const REASON_CODES = new Set([
  "no_real_change",
  "background_only",
  "lighting_or_reflection",
  "viewpoint_or_position",
  "text_read_incorrectly",
  "attribute_not_visible",
  "other",
]);

const CHECK_FAMILIES = new Set([
  "logo",
  "visible_text",
  "quantity",
  "dominant_color",
  "major_components",
  "major_shape_packaging",
  "not_observable",
  "other",
]);

export async function POST(request: NextRequest, context: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await context.params;

  try {
    const body = await request.json();
    const feedbackKind = body?.feedbackKind;
    const comment = typeof body?.comment === "string" ? body.comment : undefined;
    const reasonCode = typeof body?.reasonCode === "string" ? body.reasonCode : undefined;
    const checkFamily = typeof body?.checkFamily === "string" ? body.checkFamily : undefined;
    const issueId = typeof body?.issueId === "string" ? body.issueId : undefined;
    const anonymousSessionId = isValidAnonymousSessionId(body?.anonymousSessionId)
      ? body.anonymousSessionId
      : null;

    if (!anonymousSessionId) {
      return NextResponse.json({ error: "anonymous_session_required" }, { status: 400 });
    }

    if (feedbackKind !== "correct" && feedbackKind !== "false_alarm" && feedbackKind !== "missed_something") {
      return NextResponse.json({ error: "invalid_feedback_kind" }, { status: 400 });
    }

    if (comment && comment.length > 500) {
      return NextResponse.json({ error: "feedback_comment_too_long" }, { status: 400 });
    }

    if (reasonCode && !REASON_CODES.has(reasonCode)) {
      return NextResponse.json({ error: "invalid_feedback_reason" }, { status: 400 });
    }

    if (checkFamily && !CHECK_FAMILIES.has(checkFamily)) {
      return NextResponse.json({ error: "invalid_feedback_check_family" }, { status: 400 });
    }

    if (feedbackKind === "false_alarm" && (!reasonCode || !issueId)) {
      return NextResponse.json({ error: "false_alarm_requires_reason_and_issue" }, { status: 400 });
    }

    if (feedbackKind === "missed_something" && !checkFamily) {
      return NextResponse.json({ error: "missed_something_requires_check_family" }, { status: 400 });
    }

    const env = getVisualQAEnv();
    const analysis = await saveAnalysisFeedback(env.VISUALQA_DB, {
      analysisId,
      anonymousSessionId,
      feedbackKind,
      reasonCode,
      checkFamily,
      issueId,
      comment,
    });

    if (!analysis) {
      return NextResponse.json({ error: "analysis_not_found" }, { status: 404 });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    if (error instanceof Error && error.message === "feedback_issue_not_found") {
      return NextResponse.json({ error: "feedback_issue_not_found" }, { status: 400 });
    }
    console.error("analysis_feedback_failed", error);
    return NextResponse.json({ error: "analysis_feedback_failed" }, { status: 500 });
  }
}
