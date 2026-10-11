import {NextResponse} from "next/server";
import {releaseAccess,releaseFailure,releaseHeaders} from "@/lib/releases/http";
import {listReleases,parseReleaseFilters} from "@/lib/releases/repository";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
  try {const {env,access}=await releaseAccess(request);const filters=parseReleaseFilters(new URL(request.url).searchParams);return NextResponse.json(await listReleases(env.VISUALQA_DB,access,filters),{headers:releaseHeaders});}
  catch(error){return releaseFailure(error);}
}
