import {getVisualQAEnv} from "@/lib/cloudflare/bindings";
import {RequestAccessError, resolveRequestAccess} from "@/lib/auth/request-access";
import {handleReviews} from "@/lib/reviews/http";

export const dynamic="force-dynamic";
async function handle(request:Request, context:{params:Promise<{analysisId:string}>}) {
  const {analysisId}=await context.params,env=getVisualQAEnv();
  return handleReviews(request,analysisId,env.VISUALQA_DB,async()=>{
    try {return await resolveRequestAccess(env,request.headers,undefined);} catch(error) {
      if(error instanceof RequestAccessError) return {authenticated:false,userId:null,workspaceId:null,anonymousSessionId:null,retentionDays:null};
      throw error;
    }
  });
}
export const GET=handle;
export const POST=handle;
