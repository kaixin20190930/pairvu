"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountBreadcrumbs } from "@/components/AccountBreadcrumbs";
import { AccountWorkspaceNav } from "@/components/AccountWorkspaceNav";
import { captureAcquisitionContext, getAnonymousSessionId, trackProductEvent } from "@/lib/analytics/client";
import type { RetainedBatchReference } from "@/lib/batches/types";

export function NewSavedProductClient({ recentReferences, retentionDays }: { recentReferences: RetainedBatchReference[]; retentionDays: number }) {
  const router = useRouter();
  const productId = useRef(crypto.randomUUID());
  const [name, setName] = useState("");
  const [skuLabel, setSkuLabel] = useState("");
  const [reference, setReference] = useState<File | null>(null);
  const [recentReferenceId, setRecentReferenceId] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim() || (!reference && !recentReferenceId)) return;
    setWorking(true); setError(null);
    try {
      const referenceAssetId = recentReferenceId || await uploadReference(reference!);
      const response = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: productId.current, name, skuLabel, referenceAssetId }),
      });
      const payload = await response.json() as { product?: { id: string }; message?: string };
      if (!response.ok || !payload.product) throw new Error(payload.message ?? "The product could not be saved.");
      const context = captureAcquisitionContext();
      void trackProductEvent({
        eventName: "product_created", anonymousSessionId: getAnonymousSessionId(), attribution: context.attribution,
        properties: { reference_source: recentReferenceId ? "recent_reference" : "new_upload" },
      }).catch(() => undefined);
      router.push(`/account/products/${payload.product.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The product could not be saved.");
      setWorking(false);
    }
  }

  return <div className="account-shell product-shell">
    <AccountWorkspaceNav />
    <AccountBreadcrumbs items={[{ href: "/account/products", label: "Products" }, { label: "Save product" }]} />
    <header className="batch-heading"><div><p className="eyebrow">New Saved Product</p><h1>Save one approved reference</h1><p>This pilot stores a named product and one current approved reference. Images still follow your {retentionDays}-day retention period.</p></div></header>
    <section className="account-section product-form">
      <label><strong>Product name</strong><span>A clear internal name, such as “Foldwell Fresh Linen 30 Sheets”.</span><input autoComplete="off" maxLength={120} onChange={(event) => setName(event.target.value)} value={name} /></label>
      <label><strong>SKU (optional)</strong><span>Used to prevent duplicate Saved Products in this workspace.</span><input autoComplete="off" maxLength={80} onChange={(event) => setSkuLabel(event.target.value)} value={skuLabel} /></label>
      <label><strong>Approved reference image</strong><span>Upload a front-facing image that represents what should remain stable.</span><input accept="image/jpeg,image/png,image/webp" onChange={(event) => { setReference(event.target.files?.[0] ?? null); setRecentReferenceId(""); }} type="file" /><small>{reference?.name ?? "No new image selected"}</small></label>
      {recentReferences.length > 0 ? <label><strong>Or reuse a recent retained reference</strong><select onChange={(event) => { setRecentReferenceId(event.target.value); if (event.target.value) setReference(null); }} value={recentReferenceId}><option value="">Choose a recent reference</option>{recentReferences.map((item) => <option key={item.assetId} value={item.assetId}>{item.label}</option>)}</select></label> : null}
      <p className="product-retention-note">The product name and version record persist. The image expires with your account retention policy and can then be replaced with a new approved reference.</p>
      {error ? <p className="batch-error" role="alert">{error}</p> : null}
      <button className="batch-primary-button" disabled={working || !name.trim() || (!reference && !recentReferenceId)} onClick={() => void submit()} type="button">{working ? "Saving product..." : "Save product"}</button>
    </section>
  </div>;
}

async function uploadReference(file: File) {
  const formData = new FormData(); formData.append("file", file); formData.append("kind", "reference");
  const response = await fetch("/api/assets/upload", { method: "POST", body: formData });
  const payload = await response.json() as { asset?: { id?: string }; message?: string };
  if (!response.ok || !payload.asset?.id) throw new Error(payload.message ?? `Could not upload ${file.name}.`);
  return payload.asset.id;
}
