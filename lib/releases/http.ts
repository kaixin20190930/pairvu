import {NextResponse} from "next/server";
import {resolveRequestAccess,RequestAccessError} from "@/lib/auth/request-access";
import {getVisualQAEnv} from "@/lib/cloudflare/bindings";
import {ReleaseError} from "./types";
import {releasesEnabled,requireReleaseOwner} from "./repository";
export const releaseHeaders={"Cache-Control":"private, no-store","Vary":"Cookie"};
export async function releaseAccess(request:Request) {
  const env=getVisualQAEnv(),access=await resolveRequestAccess(env,request.headers,undefined);
  if(!releasesEnabled(env))throw new ReleaseError("release_workbench_disabled","Release workbench is currently unavailable.",404);
  await requireReleaseOwner(env.VISUALQA_DB,access);return {env,access};
}
export function releaseFailure(error:unknown) {
  if(error instanceof RequestAccessError)return NextResponse.json({error:"authentication_required",message:"Sign in to use the release workbench."},{status:401,headers:releaseHeaders});
  if(error instanceof ReleaseError)return NextResponse.json({error:error.code,message:error.message},{status:error.status,headers:releaseHeaders});
  console.error("release_workbench_read_failed",error);
  return NextResponse.json({error:"release_workbench_unavailable",message:"The release workbench could not be loaded. Try again."},{status:503,headers:releaseHeaders});
}
