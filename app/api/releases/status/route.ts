import {NextResponse} from "next/server";
import {getWorkspaceBatchEntitlement} from "@/lib/accounts/repository";
import {releaseAccess,releaseFailure,releaseHeaders} from "@/lib/releases/http";
import {releasePolicy} from "@/lib/releases/policy";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
  try {const {env,access}=await releaseAccess(request);let csvExportEnabled=false;try{csvExportEnabled=(await getWorkspaceBatchEntitlement(env.VISUALQA_DB,access.workspaceId!)).csvExportEnabled;}catch{/* Invalid/inactive billing state never grants export. */}return NextResponse.json({enabled:true,csvExportEnabled,policy:await releasePolicy()},{headers:releaseHeaders});}
  catch(error){return releaseFailure(error);}
}
