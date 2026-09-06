import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PromoteReferenceClient } from "@/app/account/products/[productId]/PromoteReferenceClient";
import { SavedProductSettingsClient } from "@/app/account/products/[productId]/SavedProductSettingsClient";
import { getWorkspaceAccountSnapshot } from "@/lib/accounts/repository";
import { createPairvuAuth } from "@/lib/auth/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { getSavedProductById } from "@/lib/products/repository";
import { AccountBreadcrumbs } from "@/components/AccountBreadcrumbs";
import { AccountWorkspaceNav } from "@/components/AccountWorkspaceNav";
import { ActivationView } from "@/components/ActivationAnalytics";
import { SAVED_PRODUCT_REFERENCE_ROLE_LABELS } from "@/lib/products/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Saved Product", robots: { index: false, follow: false } };

export default async function SavedProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const env = getVisualQAEnv();
  const session = await createPairvuAuth(env).api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/sign-in?next=/account/products/${productId}`);
  const snapshot = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, session.user);
  const product = await getSavedProductById(env.VISUALQA_DB, productId, snapshot.workspaceId);
  if (!product) notFound();

  return <main className="account-page product-page"><div className="account-shell product-shell">
    <ActivationView eventName="product_history_viewed" idempotencyPrefix={`product-history:${product.id}`} properties={{ reference_versions: product.referenceVersionCount, batch_count: product.batchCount }} />
    <AccountWorkspaceNav />
    <AccountBreadcrumbs items={[{ href: "/account/products", label: "Products" }, { label: product.name }]} />
    <header className="batch-heading"><div><p className="eyebrow">Saved Product{product.status === "archived" ? " · Archived" : ""}</p><h1>{product.name}</h1><p>{product.skuLabel ? `SKU ${product.skuLabel} · ` : ""}{product.currentReferences.length} current approved view{product.currentReferences.length === 1 ? "" : "s"} · {product.referenceVersionCount} total version{product.referenceVersionCount === 1 ? "" : "s"}.</p></div>{product.status === "active" && product.currentReferences.some((reference) => reference.imageAvailable) ? <Link className="primary-link-button" href={`/account/batches/new?productId=${product.id}`}>Check new images</Link> : null}</header>

    <section className="account-section"><p className="eyebrow">Current approved reference set</p><h2>Use the view that corresponds to the candidate</h2><p>A front view cannot verify hidden back text, and a detail view cannot prove the complete package shape. Select one current view explicitly when starting a batch.</p>{product.currentReferences.length ? <div className="product-reference-grid">{product.currentReferences.map((reference) => <article className="product-reference-card" key={reference.id}>{reference.previewUrl ? <img alt={`${SAVED_PRODUCT_REFERENCE_ROLE_LABELS[reference.referenceRole]} approved reference for ${product.name}`} src={reference.previewUrl} /> : <div className="product-image-unavailable"><span>Reference image unavailable</span></div>}<div><span className="product-reference-role">{SAVED_PRODUCT_REFERENCE_ROLE_LABELS[reference.referenceRole]}</span><strong>Version {reference.versionNumber}</strong>{reference.imageAvailable ? <small>Available until {formatDate(reference.retentionExpiresAt!)}</small> : <small className="product-warning">Expired or deleted; replace this view before reuse.</small>}</div></article>)}</div> : <p className="product-warning">No current approved views are available. Restore the product and add a reference view before checking candidates.</p>}</section>

    {product.status === "active" ? <PromoteReferenceClient productId={product.id} retentionDays={snapshot.retentionDays} /> : null}

    <section className="account-section"><p className="eyebrow">Reference history</p><h2>Approved versions</h2><div className="product-version-list">
      {product.referenceVersions.map((version) => <article key={version.id}><div><strong>{SAVED_PRODUCT_REFERENCE_ROLE_LABELS[version.referenceRole]} · Version {version.versionNumber}</strong><span className={`product-version-status ${version.status}`}>{version.status}</span></div><p>{version.originalFileName ?? "Approved reference"} · promoted {formatDate(version.promotedAt)}</p><small>{version.imageAvailable ? `Image available until ${formatDate(version.retentionExpiresAt!)}` : "Image expired or deleted; metadata retained."}</small></article>)}
    </div></section>

    <section className="account-section"><p className="eyebrow">Product history</p><h2>Associated batches</h2>{product.batches.length === 0 ? <p>No batches have used this Saved Product yet.</p> : <div className="product-batch-list">{product.batches.map((batch) => <Link href={`/account/batches/new?batchId=${batch.id}`} key={batch.id}><strong>{formatStatus(batch.status)}</strong><span>{formatDate(batch.createdAt)} · {batch.itemCount} checks</span></Link>)}</div>}</section>
    <SavedProductSettingsClient initialName={product.name} initialSkuLabel={product.skuLabel} initialStatus={product.status} productId={product.id} />
  </div></main>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value)); }
function formatStatus(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
