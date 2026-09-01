import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountWorkspaceNav } from "@/components/AccountWorkspaceNav";
import { getWorkspaceAccountSnapshot } from "@/lib/accounts/repository";
import { createPairvuAuth } from "@/lib/auth/server";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { listSavedProducts } from "@/lib/products/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Saved Products", robots: { index: false, follow: false } };

export default async function SavedProductsPage() {
  const env = getVisualQAEnv();
  const session = await createPairvuAuth(env).api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?next=/account/products");
  const snapshot = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, session.user);
  const products = await listSavedProducts(env.VISUALQA_DB, snapshot.workspaceId);

  return <main className="account-page product-page"><div className="account-shell product-shell">
    <AccountWorkspaceNav />
    <header className="batch-heading"><div><p className="eyebrow">Saved Products</p><h1>Reuse one approved product reference</h1><p>Name a product once, keep its reference history, and start future batch checks from the current approved image.</p></div><Link className="primary-link-button" href="/account/products/new">Save a product</Link></header>
    <section className="account-section">
      {products.length === 0 ? <div className="product-empty"><h2>No Saved Products yet</h2><p>Save an approved reference to reduce repeated uploads and preserve a clear version trail.</p><Link className="secondary-link-button" href="/account/products/new">Save your first product</Link></div> : <div className="product-card-grid">
        {products.map((product) => <article className="product-card" key={product.id}>
          {product.currentReference?.previewUrl ? <img alt={`Current approved reference for ${product.name}`} src={product.currentReference.previewUrl} /> : <div className="product-image-unavailable"><span>Reference image unavailable</span></div>}
          <div className="product-card-copy"><div><h2>{product.name}</h2>{product.skuLabel ? <p>SKU {product.skuLabel}</p> : null}</div>
            <dl><div><dt>Reference</dt><dd>{product.currentReference ? `Version ${product.currentReference.versionNumber}` : "Missing"}</dd></div><div><dt>Batches</dt><dd>{product.batchCount}</dd></div></dl>
            {!product.currentReference?.imageAvailable ? <p className="product-warning">Upload a new approved reference before reuse.</p> : null}
            <Link href={`/account/products/${product.id}`}>View product and history</Link>
          </div>
        </article>)}
      </div>}
    </section>
  </div></main>;
}
