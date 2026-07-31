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
            <article><h3>Identity</h3><p>Brand mark, brand name, product name, and identity-bearing label text.</p></article>
            <article><h3>Variant details</h3><p>Printed size, capacity, flavor, shade, quantity, and visible claims.</p></article>
            <article><h3>Physical form</h3><p>Product count, major caps, pumps, applicators, and package silhouette.</p></article>
            <article><h3>Semantic color</h3><p>The product or package color that distinguishes a real variant, not a temporary lighting cast.</p></article>
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

        <section className="article-section" aria-labelledby="review">
          <h2 id="review">Make the comparison a release checkpoint</h2>
          <p>
            Use the same approved reference for each final variation. A PASS can continue normal review, a FAIL should
            return to the creative workflow, and a REVIEW should lead to a clearer image or human confirmation. This
            makes consistency a repeatable decision rather than a final visual guess.
          </p>
        </section>

        <section className="article-section article-cta">
          <h2>Check a final image against its approved reference</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples/packaging-shape-change-ai-product-image">See a packaging example</Link>
          </div>
        </section>
        <p className="content-updated">Last updated: July 31, 2026</p>
      </div>
    </main>
  );
}
