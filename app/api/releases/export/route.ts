import {NextResponse} from "next/server";
import {getWorkspaceBatchEntitlement} from "@/lib/accounts/repository";
import {releaseAccess,releaseFailure,releaseHeaders} from "@/lib/releases/http";
import {listReleases,parseReleaseFilters} from "@/lib/releases/repository";
import {releaseCsv} from "@/lib/releases/csv";
import {ReleaseError} from "@/lib/releases/types";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
  try {
    const {env,access}=await releaseAccess(request);const filters=parseReleaseFilters(new URL(request.url).searchParams,true);
    let allowed=false;try{allowed=(await getWorkspaceBatchEntitlement(env.VISUALQA_DB,access.workspaceId!)).csvExportEnabled;}catch{/* Fail closed for invalid subscription. */}
    if(!allowed)throw new ReleaseError("csv_export_upgrade_required","CSV export is included with active paid plans.",403);
    const page=await listReleases(env.VISUALQA_DB,access,filters);
    return new NextResponse(releaseCsv(page),{headers:{...releaseHeaders,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=pairvu-release-page.csv","X-Release-Row-Count":String(page.rows.length),"X-Release-Has-More":String(page.pagination.hasMore),"X-Release-Next-Cursor":page.pagination.nextCursor??"","X-Release-Scan-Limit":String(page.pagination.scanLimit),"X-Release-Scanned":String(page.pagination.scanned),"X-Release-Policy-Hash":page.policy.hash}});
  }catch(error){return releaseFailure(error);}
}
