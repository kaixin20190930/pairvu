import type {Metadata} from "next";
import {headers} from "next/headers";
import {notFound,redirect} from "next/navigation";
import {getVisualQAEnv} from "@/lib/cloudflare/bindings";
import {resolveRequestAccess,RequestAccessError} from "@/lib/auth/request-access";
import {requireValueOwner} from "@/lib/value-metrics/repository";
import {valueMetricsEnabled} from "@/lib/value-metrics/validation";
import {ValueMetricsError} from "@/lib/value-metrics/types";
import {AccountWorkspaceNav} from "@/components/AccountWorkspaceNav";
import {ValueMetricsClient} from "./ValueMetricsClient";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Value metrics",robots:{index:false,follow:false}};
export default async function ValueMetricsPage(){const env=getVisualQAEnv();let access;
  try{access=await resolveRequestAccess(env,await headers(),undefined);}catch(e){if(e instanceof RequestAccessError)redirect("/sign-in?next=/account/value-metrics");throw e;}
  if(!valueMetricsEnabled(env))notFound();
  try{await requireValueOwner(env.VISUALQA_DB,access);}catch(e){if(e instanceof ValueMetricsError)notFound();throw e;}
  return <main className="account-page"><div className="account-shell"><AccountWorkspaceNav/><ValueMetricsClient/></div></main>;
}
