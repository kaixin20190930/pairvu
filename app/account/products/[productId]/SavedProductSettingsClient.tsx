"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedProductStatus } from "@/lib/products/types";

export function SavedProductSettingsClient({
  productId,
  initialName,
  initialSkuLabel,
  initialStatus,
}: {
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

  async function update(status = initialStatus) {
    setWorking(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, skuLabel, status }),
      });
      const payload = await response.json() as { product?: { status?: SavedProductStatus }; message?: string };
      if (!response.ok || !payload.product) throw new Error(payload.message ?? "The Saved Product could not be updated.");
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
      <label><span>Product name</span><input disabled={working} maxLength={120} onChange={(event) => setName(event.target.value)} value={name} /></label>
      <label><span>SKU (optional)</span><input disabled={working} maxLength={80} onChange={(event) => setSkuLabel(event.target.value)} value={skuLabel} /></label>
    </div>
    {error ? <p className="batch-error" role="alert">{error}</p> : null}
    {message ? <p className="product-success" role="status">{message}</p> : null}
    <div className="product-settings-actions">
      <button className="secondary-link-button" disabled={working || !name.trim()} onClick={() => void update()} type="button">{working ? "Saving..." : "Save details"}</button>
      {initialStatus === "active" ? <button className="product-archive-button" disabled={working} onClick={() => void update("archived")} type="button">Archive product</button> : <button className="primary-link-button" disabled={working} onClick={() => void update("active")} type="button">Restore product</button>}
    </div>
  </section>;
}
