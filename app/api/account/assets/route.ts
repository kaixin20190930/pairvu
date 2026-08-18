import { NextRequest, NextResponse } from "next/server";
import { deleteAssetsImmediately } from "@/lib/assets/deletion";
import { listWorkspaceAssets } from "@/lib/assets/repository";
import { RequestAccessError, resolveRequestAccess } from "@/lib/auth/request-access";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, undefined);
    if (!access.workspaceId) {
      return NextResponse.json({ error: "authentication_required", message: "Sign in to delete workspace images." }, { status: 401 });
    }
    const active = await env.VISUALQA_DB.prepare(
      `select
        (select count(*) from analyses where workspace_id = ? and status in ('queued', 'running')) +
        (select count(*) from batches where workspace_id = ? and status in ('queued', 'processing')) as count`,
    ).bind(access.workspaceId, access.workspaceId).first<{ count: number }>();
    if (Number(active?.count ?? 0) > 0) {
      return NextResponse.json(
        { error: "workspace_checks_running", message: "Wait for active checks to finish before deleting all workspace images." },
        { status: 409 },
      );
    }
    const assets = await listWorkspaceAssets(env.VISUALQA_DB, access.workspaceId);
    const deletion = await deleteAssetsImmediately(env.VISUALQA_DB, env.VISUALQA_ASSETS, assets);
    if (deletion.failed > 0) {
      return NextResponse.json(
        { error: "image_deletion_incomplete", message: "Some workspace images could not be deleted. Please retry.", deletion },
        { status: 500 },
      );
    }
    return NextResponse.json({ deletion });
  } catch (error) {
    if (error instanceof RequestAccessError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 401 });
    }
    console.error("workspace_image_deletion_failed", error);
    return NextResponse.json(
      { error: "image_deletion_failed", message: "Workspace images could not be fully deleted. Please retry." },
      { status: 500 },
    );
  }
}
