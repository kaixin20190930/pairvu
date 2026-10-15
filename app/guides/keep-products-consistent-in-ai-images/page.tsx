import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/guides/keep-products-consistent-in-ai-images");

export const metadata: Metadata = pageMetadata(page);

export default function KeepProductsConsistentInAiImagesPage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container narrow-content">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: "Product Consistency", href: page.route }]} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Consistency workflow</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            AI-assisted imagery can change context without changing the product. The operational goal is to protect
            the details that identify the product while allowing intended scene, background, and composition changes.
          </p>
        </header>

        <section className="article-section" aria-labelledby="stable">
          <h2 id="stable">Define what must remain stable</h2>
          <div className="feature-list">
            <article><h3>Identity</h3><p>Protect the brand symbol and wordmark with the <Link className="text-link" href="/checks/product-logo">product-logo check</Link>. Compare the approved mark rather than trusting a familiar label layout.</p></article>
            <article><h3>Variant details</h3><p>Use the <Link className="text-link" href="/checks/product-label-text">label-text check</Link> for product names, flavor, shade, claims, digits, and units. Verify printed capacity and visible pack count with the <Link className="text-link" href="/checks/product-quantity">quantity check</Link>.</p></article>
            <article><h3>Physical form</h3><p>Keep required caps, pumps, and applicators in the <Link className="text-link" href="/checks/product-components">component review</Link>, then compare the full silhouette with the <Link className="text-link" href="/checks/product-packaging">packaging check</Link>.</p></article>
            <article><h3>Semantic color</h3><p>Use the <Link className="text-link" href="/checks/product-color">product-color check</Link> for a color that distinguishes a real variant. A temporary lighting cast alone does not establish a new product color.</p></article>
          </div>
        </section>

        <section className="article-section" aria-labelledby="allow">
          <h2 id="allow">Separate allowed creative variation from product drift</h2>
          <div className="decision-table-wrap">
            <table className="decision-table">
              <thead><tr><th>Usually allowed</th><th>Needs a product comparison</th></tr></thead>
              <tbody>
                <tr><td>Background, scene, props, or layout</td><td>Logo, label text, size, color, count, components, or package form</td></tr>
                <tr><td>Lighting and shadow treatment</td><td>A semantic variant color that changes the product being represented</td></tr>
                <tr><td>Perspective that retains corresponding details</td><td>A crop or view that prevents direct confirmation of identity-bearing details</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="article-section" aria-labelledby="background">
          <h2 id="background">Change the background without changing the product</h2>
          <ol className="numbered-checklist">
            <li><strong>Freeze the approved reference.</strong><p>Confirm the exact SKU, variant, package version, and view. For repeated work, keep named views and reference history in <Link className="text-link" href="/account/products">Saved Products (sign-in required)</Link>.</p></li>
            <li><strong>Limit the edit to the scene.</strong><p>In your image editor, preserve the product region and specify which background, props, or lighting may change. Pairvu compares the exported images; it does not generate or repair them.</p></li>
            <li><strong>Inspect the final export.</strong><p>Read the logo and label, compare color-bearing surfaces, count units, and inspect required parts and packaging edges. Do this after resizing and cropping, because those steps can hide evidence.</p></li>
            <li><strong>Resolve missing evidence.</strong><p>Use the <Link className="text-link" href="/checks/product-image-observability">observability guidance</Link> to request a clearer or corresponding view. An unreadable label or hidden component needs REVIEW, not an assumed match.</p></li>
          </ol>
          <p>Follow the <Link className="text-link" href="/guides/compare-original-and-ai-product-images">original-to-candidate comparison workflow</Link> for each final asset, and use the <Link className="text-link" href="/guides/ai-product-photography-checklist">pre-publish checklist</Link> to keep the required checks consistent across variations.</p>
        </section>

        <section className="article-section" aria-labelledby="examples">
          <h2 id="examples">Separate a changed scene from changed product evidence</h2>
          <p>These are controlled examples, not customer case studies or an overall accuracy measurement. The <Link className="text-link" href="/examples/background-change-ai-product-image">background-only PASS example</Link> preserves the visible product. The <Link className="text-link" href="/examples/logo-change-ai-product-image">logo-replacement FAIL example</Link> changes identity despite a plausible package. The <Link className="text-link" href="/examples/partially-hidden-product-logo">covered-logo REVIEW example</Link> lacks enough evidence to verify the complete mark.</p>
        </section>

        <section className="article-section" aria-labelledby="review">
          <h2 id="review">Make the comparison a release checkpoint</h2>
          <p>
            Use the same approved reference for each final variation. A PASS can continue normal review, a FAIL should
            return to the creative workflow, and a REVIEW should lead to a clearer image or human confirmation. This
            makes consistency a repeatable decision rather than a final visual guess. A machine result is separate
            from a human approval and from release eligibility; see <Link className="text-link" href="/how-pairvu-works">how Pairvu handles those decisions</Link> before using results in a delivery workflow.
          </p>
        </section>

        <section className="article-section article-cta">
          <h2>Check a final image against its approved reference</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples/packaging-shape-change-ai-product-image">See a packaging example</Link>
          </div>
        </section>
        <p className="content-updated">Last updated: October 15, 2026</p>
      </div>
    </main>
  );
}
