import {NextResponse} from "next/server";
import {metricsAccess,metricsFailure,metricsHeaders} from "@/lib/value-metrics/http";
import {parseValueWindow} from "@/lib/value-metrics/validation";
import {readValueMetrics} from "@/lib/value-metrics/repository";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
  try{const {env,access}=await metricsAccess(request);return NextResponse.json(await readValueMetrics(env.VISUALQA_DB,access,parseValueWindow(new URL(request.url).searchParams)),{headers:metricsHeaders});}
  catch(error){return metricsFailure(error);}
}
