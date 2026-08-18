import { NextRequest, NextResponse } from "next/server";
import { resolveRequestAccess } from "@/lib/auth/request-access";
import { listRetainedBatchReferences } from "@/lib/batches/repository";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, undefined);
    if (!access.workspaceId) {
      return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    }
    return NextResponse.json({ references: await listRetainedBatchReferences(env.VISUALQA_DB, access.workspaceId) });
  } catch (error) {
    console.error("batch_reference_list_failed", error);
    return NextResponse.json({ error: "reference_list_failed", message: "Saved references could not be loaded." }, { status: 500 });
  }
}
