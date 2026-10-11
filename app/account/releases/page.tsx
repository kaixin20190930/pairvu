import type {Metadata} from "next";
import {headers} from "next/headers";
import {redirect,notFound} from "next/navigation";
import {getVisualQAEnv} from "@/lib/cloudflare/bindings";
import {resolveRequestAccess,RequestAccessError} from "@/lib/auth/request-access";
import {releasesEnabled,requireReleaseOwner} from "@/lib/releases/repository";
import {ReleaseError} from "@/lib/releases/types";
import {AccountWorkspaceNav} from "@/components/AccountWorkspaceNav";
import {ReleaseWorkbenchClient} from "./ReleaseWorkbenchClient";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Release workbench",robots:{index:false,follow:false}};
export default async function ReleaseWorkbenchPage() {
  const env=getVisualQAEnv();let access;
  try {access=await resolveRequestAccess(env,await headers(),undefined);}catch(error){if(error instanceof RequestAccessError)redirect("/sign-in?next=/account/releases");throw error;}
  if(!releasesEnabled(env))notFound();
  try{await requireReleaseOwner(env.VISUALQA_DB,access);}catch(error){if(error instanceof ReleaseError)notFound();throw error;}
  return <main className="account-page"><div className="account-shell"><AccountWorkspaceNav/><ReleaseWorkbenchClient/></div></main>;
}
