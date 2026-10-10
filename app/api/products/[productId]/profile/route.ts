import { NextRequest, NextResponse } from "next/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { resolveRequestAccess, RequestAccessError } from "@/lib/auth/request-access";
import { createPairvuAuth } from "@/lib/auth/server";
import { isValidAnonymousSessionId } from "@/lib/assets/validation";
import { saveProductProfile, SavedProductError } from "@/lib/products/repository";
import { readProfileRequest, validateMutationIdentity, productProfilesEnabled } from "@/lib/products/profile-validation";
export const dynamic="force-dynamic";
export async function PUT(request:NextRequest,context:{params:Promise<{productId:string}>}) {
  try {
    const env=getVisualQAEnv(),access=await resolveRequestAccess(env,request.headers,undefined);
    if(!access.workspaceId)return NextResponse.json({error:"authentication_required",message:"Sign in to save product standards."},{status:401});
    const {productId}=await context.params;
    if(!isValidAnonymousSessionId(productId))throw new SavedProductError("invalid_product_id","A valid product identifier is required.");
    const body=await readProfileRequest(request),identity=validateMutationIdentity(body.requestId,body.expectedVersion);
    const session=await createPairvuAuth(env).api.getSession({headers:request.headers});
    if(!session?.user)return NextResponse.json({error:"authentication_required"},{status:401});
    const result=await saveProductProfile(env.VISUALQA_DB,{...identity,productId,workspaceId:access.workspaceId,actorId:session.user.id,profile:body.profile,enabled:productProfilesEnabled(env)});
    return NextResponse.json({mutationResult:result.mutationResult,resumed:result.resumed},{status:result.created?201:200});
  } catch(error) {
    if(error instanceof RequestAccessError)return NextResponse.json({error:"authentication_required",message:"Sign in to save product standards."},{status:401});
    if(error instanceof SavedProductError)return NextResponse.json({error:error.code,message:error.message,...(error.currentRevision===undefined?{}:{currentRevision:error.currentRevision})},{status:error.status});
    console.error("product_profile_save_failed",error);
    return NextResponse.json({error:"profile_storage_unavailable",message:"Product standard could not be saved safely. Retry with the same request."},{status:503});
  }
}
