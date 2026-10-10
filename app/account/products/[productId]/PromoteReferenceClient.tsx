"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { captureAcquisitionContext, getAnonymousSessionId, trackProductEvent } from "@/lib/analytics/client";
import { SAVED_PRODUCT_REFERENCE_ROLES, SAVED_PRODUCT_REFERENCE_ROLE_LABELS, type SavedProductReferenceRole } from "@/lib/products/types";

export function PromoteReferenceClient({ revision, productId, retentionDays, initialRole = "front" }: { revision:number; productId: string; retentionDays: number; initialRole?: SavedProductReferenceRole }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [referenceRole, setReferenceRole] = useState<SavedProductReferenceRole>(initialRole);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentRevision,setCurrentRevision]=useState(revision),[conflict,setConflict]=useState(false);
  const pending=useRef<{file:File;role:SavedProductReferenceRole;assetId:string;body:string}|null>(null);
  useEffect(()=>{if(!pending.current&&!conflict)setCurrentRevision(revision);},[revision,conflict]);
  async function reviewLatest(){const response=await fetch(`/api/products/${productId}`,{cache:"no-store"});const data=await response.json();if(response.ok&&data.product){setCurrentRevision(data.product.revision);setConflict(false);if(pending.current)pending.current.body=JSON.stringify({referenceAssetId:pending.current.assetId,referenceRole,requestId:crypto.randomUUID(),expectedVersion:data.product.revision});setError("Latest product loaded. Your image was kept. Confirm the view before submitting again.");}else setError(data.message??"Unable to load product.");}
  async function promote() {
    if (!file) return;
    setWorking(true); setError(null);
    try {
      if(pending.current?.file!==file||pending.current.role!==referenceRole) {
        const formData=new FormData();formData.append("file",file);formData.append("kind","reference");
        const upload=await fetch("/api/assets/upload",{method:"POST",body:formData});const uploaded=await upload.json();
        if(!upload.ok||!uploaded.asset?.id)throw new Error(uploaded.message??"The approved image could not be uploaded.");
        pending.current={file,role:referenceRole,assetId:uploaded.asset.id,body:JSON.stringify({referenceAssetId:uploaded.asset.id,referenceRole,requestId:crypto.randomUUID(),expectedVersion:currentRevision})};
      }
      const response = await fetch(`/api/products/${productId}/references`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: pending.current!.body,
      });
      const payload = await response.json() as { product?: { referenceVersionCount?: number }; message?: string };
      if(response.status===409)setConflict(true);
      if (!response.ok || !payload.product) throw new Error(payload.message ?? "The approved image could not be promoted.");
      const context = captureAcquisitionContext();
      void trackProductEvent({
        eventName: "reference_version_promoted", anonymousSessionId: getAnonymousSessionId(), attribution: context.attribution,
        properties: { reference_version: payload.product.referenceVersionCount ?? null, reference_role: referenceRole },
      }).catch(() => undefined);
      pending.current=null;setFile(null); router.refresh();
    } catch (promoteError) {
      setError(promoteError instanceof Error ? promoteError.message : "The approved image could not be promoted.");
    } finally { setWorking(false); }
  }

  return <section className="account-section product-promote-section"><div><p className="eyebrow">Approved reference views</p><h2>Add or replace a corresponding view</h2><p>Select the face or detail this image represents. Replacing a view preserves its previous version in history. The image follows your {retentionDays}-day retention period.</p></div><label><span>Reference view</span><select disabled={working} onChange={(event) => setReferenceRole(event.target.value as SavedProductReferenceRole)} value={referenceRole}>{SAVED_PRODUCT_REFERENCE_ROLES.map((role) => <option key={role} value={role}>{SAVED_PRODUCT_REFERENCE_ROLE_LABELS[role]}</option>)}</select></label><label><span>New approved reference</span><input accept="image/jpeg,image/png,image/webp" disabled={working} onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" /><small>{file?.name ?? "No image selected"}</small></label>{conflict?<button disabled={working} type="button" onClick={()=>void reviewLatest()}>Load latest and keep image</button>:null}{error ? <p className="batch-error" role="alert">{error}</p> : null}<button className="secondary-link-button" disabled={!file || working||conflict} onClick={() => void promote()} type="button">{working ? "Saving view..." : "Save approved view"}</button></section>;
}
