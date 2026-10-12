import {NextResponse} from "next/server";
import {metricsAccess,metricsHeaders} from "@/lib/value-metrics/http";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{await metricsAccess(request);return NextResponse.json({enabled:true},{headers:metricsHeaders});}catch{return NextResponse.json({enabled:false},{headers:metricsHeaders});}}
