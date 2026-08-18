import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceBatchEntitlement } from "@/lib/accounts/repository";
import { resolveRequestAccess } from "@/lib/auth/request-access";
import { getBatchById } from "@/lib/batches/repository";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ batchId: string }> }) {
  try {
    const env = getVisualQAEnv();
    const access = await resolveRequestAccess(env, request.headers, undefined);
    if (!access.workspaceId) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    const entitlement = await getWorkspaceBatchEntitlement(env.VISUALQA_DB, access.workspaceId);
    if (!entitlement.csvExportEnabled) {
      return NextResponse.json(
        { error: "csv_export_upgrade_required", message: "CSV export is included with paid plans." },
        { status: 403 },
      );
    }
    const { batchId } = await context.params;
    const batch = await getBatchById(env.VISUALQA_DB, batchId, access.workspaceId);
    if (!batch) return NextResponse.json({ error: "batch_not_found" }, { status: 404 });

    const header = [
      "batch_id", "position", "candidate_label", "status", "verdict", "product_difference_count",
      "review_item_count", "product_difference_types", "review_item_types", "completed_at", "result_url",
      "error_code", "error_message",
    ];
    const rows = batch.items.map((item) => [
      batch.id,
      item.position + 1,
      item.clientLabel ?? `Candidate ${item.position + 1}`,
      item.status,
      item.verdict?.toUpperCase() ?? "",
      item.issueCount,
      item.limitationCount,
      item.issueTypes ?? "",
      item.limitationTypes ?? "",
      item.completedAt ?? "",
      item.analysisId ? `https://pairvu.com/?analysis=${item.analysisId}` : "",
      item.terminalErrorCode ?? "",
      item.terminalErrorMessage ?? "",
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Disposition": `attachment; filename="pairvu-batch-${batch.id}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("batch_csv_export_failed", error);
    return NextResponse.json({ error: "csv_export_failed", message: "The CSV export could not be created." }, { status: 500 });
  }
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
