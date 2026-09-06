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

export default async function SavedProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const params = await searchParams;
  const env = getVisualQAEnv();
  const session = await createPairvuAuth(env).api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?next=/account/products");
  const snapshot = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, session.user);
  const products = await listSavedProducts(env.VISUALQA_DB, snapshot.workspaceId, new Date(), { includeArchived: true });
  const query = params.q?.trim().toLocaleLowerCase("en-US") ?? "";
  const status = params.status === "archived" ? "archived" : "active";
  const visibleProducts = products.filter((product) => product.status === status && (!query || product.name.toLocaleLowerCase("en-US").includes(query) || product.skuLabel?.toLocaleLowerCase("en-US").includes(query)));

  return <main className="account-page product-page"><div className="account-shell product-shell">
    <AccountWorkspaceNav />
    <header className="batch-heading"><div><p className="eyebrow">Saved Products</p><h1>Reuse approved product reference views</h1><p>Keep corresponding front, back, side, and detail views together, preserve their version history, and choose the right evidence for each batch.</p></div><Link className="primary-link-button" href="/account/products/new">Save a product</Link></header>
    <section className="account-section">
      <form className="product-search" method="get"><label><span>Search active Saved Products</span><input defaultValue={params.q ?? ""} name="q" placeholder="Product name or SKU" type="search" /></label><input name="status" type="hidden" value={status} /><button className="secondary-link-button" type="submit">Search</button><Link className="text-link" href={status === "active" ? "/account/products?status=archived" : "/account/products"}>{status === "active" ? "View archived" : "View active"}</Link></form>
      {visibleProducts.length === 0 ? <div className="product-empty"><h2>{query ? "No matching Saved Products" : status === "archived" ? "No archived Saved Products" : "No Saved Products yet"}</h2><p>{query ? "Try another product name or SKU." : status === "archived" ? "Archived products remain available here until restored." : "Save an approved reference to reduce repeated uploads and preserve a clear version trail."}</p>{!query && status === "active" ? <Link className="secondary-link-button" href="/account/products/new">Save your first product</Link> : null}</div> : <div className="product-card-grid">
        {visibleProducts.map((product) => <article className="product-card" key={product.id}>
          {product.currentReference?.previewUrl ? <img alt={`Current approved reference for ${product.name}`} src={product.currentReference.previewUrl} /> : <div className="product-image-unavailable"><span>Reference image unavailable</span></div>}
          <div className="product-card-copy"><div><h2>{product.name}</h2>{product.skuLabel ? <p>SKU {product.skuLabel}</p> : null}</div>
            <dl><div><dt>Current views</dt><dd>{product.currentReferences.length}</dd></div><div><dt>Batches</dt><dd>{product.batchCount}</dd></div></dl>
            {!product.currentReferences.some((reference) => reference.imageAvailable) ? <p className="product-warning">Upload a new approved reference before reuse.</p> : null}
            <Link href={`/account/products/${product.id}`}>View product and history</Link>
          </div>
        </article>)}
      </div>}
    </section>
  </div></main>;
}
