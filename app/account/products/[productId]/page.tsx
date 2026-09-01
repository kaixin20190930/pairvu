import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PromoteReferenceClient } from "@/app/account/products/[productId]/PromoteReferenceClient";
import { getWorkspaceAccountSnapshot } from "@/lib/accounts/repository";
import { createPairvuAuth } from "@/lib/auth/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { getSavedProductById } from "@/lib/products/repository";
import { AccountBreadcrumbs } from "@/components/AccountBreadcrumbs";
import { AccountWorkspaceNav } from "@/components/AccountWorkspaceNav";
import { ActivationView } from "@/components/ActivationAnalytics";

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
    <header className="batch-heading"><div><p className="eyebrow">Saved Product</p><h1>{product.name}</h1><p>{product.skuLabel ? `SKU ${product.skuLabel} · ` : ""}{product.referenceVersionCount} approved reference version{product.referenceVersionCount === 1 ? "" : "s"}.</p></div>{product.currentReference?.imageAvailable ? <Link className="primary-link-button" href={`/account/batches/new?productId=${product.id}`}>Check new images</Link> : null}</header>

    <section className="account-section product-current-reference">
      <div><p className="eyebrow">Current approved reference</p><h2>{product.currentReference ? `Version ${product.currentReference.versionNumber}` : "No current reference"}</h2>
        {product.currentReference?.imageAvailable ? <p>Available until {formatDate(product.currentReference.retentionExpiresAt!)}</p> : <p className="product-warning">The image is no longer available under your retention policy. Promote a new approved image to reuse this product.</p>}
      </div>
      {product.currentReference?.previewUrl ? <img alt={`Current approved reference for ${product.name}`} src={product.currentReference.previewUrl} /> : <div className="product-image-unavailable"><span>Reference image unavailable</span></div>}
    </section>

    <PromoteReferenceClient productId={product.id} retentionDays={snapshot.retentionDays} />

    <section className="account-section"><p className="eyebrow">Reference history</p><h2>Approved versions</h2><div className="product-version-list">
      {product.referenceVersions.map((version) => <article key={version.id}><div><strong>Version {version.versionNumber}</strong><span className={`product-version-status ${version.status}`}>{version.status}</span></div><p>{version.originalFileName ?? "Approved reference"} · promoted {formatDate(version.promotedAt)}</p><small>{version.imageAvailable ? `Image available until ${formatDate(version.retentionExpiresAt!)}` : "Image expired or deleted; metadata retained."}</small></article>)}
    </div></section>

    <section className="account-section"><p className="eyebrow">Product history</p><h2>Associated batches</h2>{product.batches.length === 0 ? <p>No batches have used this Saved Product yet.</p> : <div className="product-batch-list">{product.batches.map((batch) => <Link href={`/account/batches/new?batchId=${batch.id}`} key={batch.id}><strong>{formatStatus(batch.status)}</strong><span>{formatDate(batch.createdAt)} · {batch.itemCount} checks</span></Link>)}</div>}</section>
  </div></main>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value)); }
function formatStatus(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
