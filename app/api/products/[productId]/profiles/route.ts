import { NextRequest, NextResponse } from "next/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { resolveRequestAccess, RequestAccessError } from "@/lib/auth/request-access";
import { listProductProfiles, SavedProductError } from "@/lib/products/repository";
import { isValidAnonymousSessionId } from "@/lib/assets/validation";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,context:{params:Promise<{productId:string}>}) {
  try {
    const env=getVisualQAEnv(),access=await resolveRequestAccess(env,request.headers,undefined);
    if(!access.workspaceId)return NextResponse.json({error:"authentication_required"},{status:401});
    const {productId}=await context.params;
    if(!isValidAnonymousSessionId(productId))throw new SavedProductError("invalid_product_id","A valid product identifier is required.");
    const cursor=request.nextUrl.searchParams.get("beforeVersion"),limit=request.nextUrl.searchParams.get("limit");
    if([cursor,limit].some(v=>v!==null&&!/^[1-9][0-9]*$/.test(v)))throw new SavedProductError("invalid_profile","Invalid history cursor or page size.");
    return NextResponse.json(await listProductProfiles(env.VISUALQA_DB,access.workspaceId,productId,{beforeVersion:cursor===null?undefined:Number(cursor),limit:limit===null?undefined:Number(limit)}));
  } catch(error) {
    if(error instanceof RequestAccessError)return NextResponse.json({error:"authentication_required"},{status:401});
    if(error instanceof SavedProductError)return NextResponse.json({error:error.code,message:error.message},{status:error.status});
    return NextResponse.json({error:"profile_storage_unavailable",message:"Product history could not be loaded."},{status:503});
  }
}
