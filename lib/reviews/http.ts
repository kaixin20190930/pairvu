import type {RequestAccessContext} from "@/lib/auth/request-access";
import type {D1Database} from "@/lib/cloudflare/bindings";
import {ReviewError} from "./types";
import {readReviews, submitReview} from "./repository";
import {readReviewRequest, requireSameOrigin} from "./validation";

export async function handleReviews(request:Request, analysisId:string, db:D1Database, resolveAccess:()=>Promise<RequestAccessContext>) {
  const headers={"Cache-Control":"no-store"};
  try {
    if(request.method!=="GET"&&request.method!=="POST") return Response.json({error:"method_not_allowed"},{status:405,headers});
    if(request.method==="POST") requireSameOrigin(request);
    const access=await resolveAccess();
    if(!access.authenticated || !access.userId || !access.workspaceId) throw new ReviewError("authentication_required","Sign in to review this analysis.",401);
    if(request.method==="GET") return Response.json({state:await readReviews(db,analysisId,access)},{headers});
    const result=await submitReview(db,analysisId,access,await readReviewRequest(request));
    return Response.json(result,{headers});
  } catch(error) {
    if(error instanceof ReviewError) return Response.json({error:error.code,message:error.message},{status:error.status,headers});
    // Never log notes, reasons, identity or underlying query/binding contents.
    return Response.json({error:"review_storage_unavailable",message:"Review status is unavailable. Retry the same request ID if a decision was submitted."},{status:503,headers});
  }
}
