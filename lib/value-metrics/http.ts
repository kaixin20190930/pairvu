import {NextResponse} from "next/server";
import {resolveRequestAccess,RequestAccessError} from "@/lib/auth/request-access";
import {getVisualQAEnv} from "@/lib/cloudflare/bindings";
import {ValueMetricsError} from "./types";
import {valueMetricsEnabled} from "./validation";
import {requireValueOwner} from "./repository";
export const metricsHeaders={"Cache-Control":"private, no-store","Vary":"Cookie"};
export async function metricsAccess(request:Request) {
  const env=getVisualQAEnv(),access=await resolveRequestAccess(env,request.headers,undefined);
  if(!valueMetricsEnabled(env))throw new ValueMetricsError("value_metrics_disabled","Value metrics are currently unavailable.",404);
  await requireValueOwner(env.VISUALQA_DB,access);return {env,access};
}
export function metricsFailure(error:unknown) {
  if(error instanceof RequestAccessError)return NextResponse.json({error:"authentication_required",message:"Sign in to view metrics.",complete:false},{status:401,headers:metricsHeaders});
  if(error instanceof ValueMetricsError)return NextResponse.json({error:error.code,message:error.message,complete:false},{status:error.status,headers:metricsHeaders});
  return NextResponse.json({error:"value_metrics_unavailable",message:"Metrics could not be loaded. Try again.",complete:false},{status:503,headers:metricsHeaders});
}
