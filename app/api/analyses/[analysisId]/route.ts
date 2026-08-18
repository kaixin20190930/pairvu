import { NextRequest, NextResponse } from "next/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { fetchPersistedAnalysis } from "@/lib/analysis/service";
import { canAccessOwnedResource, RequestAccessError, resolveRequestAccess } from "@/lib/auth/request-access";
import { deleteAssetsImmediately } from "@/lib/assets/deletion";
import { listAnalysisAssets } from "@/lib/assets/repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ analysisId: string }> }) {
  try {
    const { analysisId } = await context.params;
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, request.headers.get("x-anonymous-session-id"));
    const analysis = await fetchPersistedAnalysis(env.VISUALQA_DB, analysisId);

    if (!analysis || !canAccessOwnedResource(access, analysis)) {
      return NextResponse.json({ error: "analysis_not_found" }, { status: 404 });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    if (error instanceof RequestAccessError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ analysisId: string }> }) {
  try {
    const { analysisId } = await context.params;
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, undefined);
    if (!access.workspaceId) {
      return NextResponse.json({ error: "authentication_required", message: "Sign in to delete saved images." }, { status: 401 });
    }
    const analysis = await fetchPersistedAnalysis(env.VISUALQA_DB, analysisId);
    if (!analysis || analysis.workspaceId !== access.workspaceId) {
      return NextResponse.json({ error: "analysis_not_found" }, { status: 404 });
    }
    if (analysis.status === "queued" || analysis.status === "running") {
      return NextResponse.json(
        { error: "analysis_still_running", message: "Wait for this check to finish before deleting its images." },
        { status: 409 },
      );
    }
    const assets = await listAnalysisAssets(env.VISUALQA_DB, analysisId, access.workspaceId);
    const deletion = await deleteAssetsImmediately(env.VISUALQA_DB, env.VISUALQA_ASSETS, assets);
    return deletionResponse(deletion);
  } catch (error) {
    if (error instanceof RequestAccessError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 401 });
    }
    console.error("analysis_image_deletion_failed", error);
    return NextResponse.json(
      { error: "image_deletion_failed", message: "The saved images could not be fully deleted. Please retry." },
      { status: 500 },
    );
  }
}

function deletionResponse(deletion: { requested: number; deleted: number; failed: number }) {
  if (deletion.failed > 0) {
    return NextResponse.json(
      { error: "image_deletion_incomplete", message: "Some images could not be deleted. Please retry.", deletion },
      { status: 500 },
    );
  }
  return NextResponse.json({ deletion });
}
