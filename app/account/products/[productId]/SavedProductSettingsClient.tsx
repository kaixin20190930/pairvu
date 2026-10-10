"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedProductStatus } from "@/lib/products/types";

export function SavedProductSettingsClient({
  revision, versioned,
  productId,
  initialName,
  initialSkuLabel,
  initialStatus,
}: {
  revision:number; versioned:boolean;
  productId: string;
  initialName: string;
  initialSkuLabel: string | null;
  initialStatus: SavedProductStatus;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [skuLabel, setSkuLabel] = useState(initialSkuLabel ?? "");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentRevision,setCurrentRevision]=useState(revision),[conflict,setConflict]=useState(false);
  const pending=useRef<{key:string;body:string}|null>(null);
  useEffect(()=>{if(!pending.current&&!conflict)setCurrentRevision(revision);},[revision,conflict]);
  async function reviewLatest(){const response=await fetch(`/api/products/${productId}`,{cache:"no-store"});const data=await response.json();if(response.ok&&data.product){setCurrentRevision(data.product.revision);setConflict(false);pending.current=null;setMessage("Latest product loaded. Confirm the status change before submitting again.");}else setError(data.message??"Unable to load product.");}
  async function update(status = initialStatus) {
    const key=JSON.stringify({name,skuLabel,status,currentRevision});
    if(pending.current?.key!==key)pending.current={key,body:JSON.stringify(versioned?{requestId:crypto.randomUUID(),expectedVersion:currentRevision,status}:{name,skuLabel,status})};
    setWorking(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: pending.current.body,
      });
      const payload = await response.json() as { product?: { status?: SavedProductStatus }; message?: string };
      if(response.status===409)setConflict(true);
      if (!response.ok || !payload.product) throw new Error(payload.message ?? "The Saved Product could not be updated.");
      pending.current=null;
      setMessage(status === "archived" ? "Saved Product archived. Its references and history were preserved." : status === "active" && initialStatus === "archived" ? "Saved Product restored." : "Product details updated.");
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "The Saved Product could not be updated.");
    } finally {
      setWorking(false);
    }
  }

  return <section className="account-section product-settings-section">
    <div><p className="eyebrow">Product settings</p><h2>Name, SKU, and lifecycle</h2><p>Archiving removes this product from new batch selection without deleting its references or history.</p></div>
    <div className="product-settings-grid">
      <label><span>Product name</span><input disabled={working||versioned} maxLength={120} onChange={(event) => setName(event.target.value)} value={name} /></label>
      <label><span>SKU (optional)</span><input disabled={working||versioned} maxLength={80} onChange={(event) => setSkuLabel(event.target.value)} value={skuLabel} /></label>
    </div>
    {versioned?<p>Edit the name and SKU in the product standard above.</p>:null}
    {conflict?<button type="button" onClick={()=>void reviewLatest()}>Load latest before confirming</button>:null}
    {error ? <p className="batch-error" role="alert">{error}</p> : null}
    {message ? <p className="product-success" role="status">{message}</p> : null}
    <div className="product-settings-actions">
      {!versioned?<button className="secondary-link-button" disabled={working || conflict || !name.trim()} onClick={() => void update()} type="button">{working ? "Saving..." : "Save details"}</button>:null}
      {initialStatus === "active" ? <button className="product-archive-button" disabled={working||conflict} onClick={() => void update("archived")} type="button">Archive product</button> : <button className="primary-link-button" disabled={working||conflict} onClick={() => void update("active")} type="button">Restore product</button>}
    </div>
  </section>;
}
