import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/use-cases/shopify-product-image-qa");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Shopify Stores", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function ShopifyProductImageQaPage() {
  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Platform workflow</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            Add a reference comparison before the final image enters Shopify product media. This separates visual
            product fidelity from theme presentation, file handling, and storefront publishing.
          </p>
          <p className="platform-disclaimer">
            Pairvu is an independent product and is not affiliated with, endorsed by, or certified by Shopify.
          </p>
        </header>

        <section className="article-section" aria-labelledby="workflow">
          <h2 id="workflow">A pre-upload quality-control step</h2>
          <ol className="workflow-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Match the product and variant</strong>
                <p>Select the approved image for the exact product, size, color, or package being updated.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Check the final AI-assisted image</strong>
                <p>Compare product identity and visible details before uploading the asset to the store.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Add approved media in Shopify</strong>
                <p>Upload the final image to the relevant product and confirm which media item should be featured.</p>
              </div>
            </li>
            <li>
              <span>4</span>
              <div>
                <strong>Review storefront presentation</strong>
                <p>Check theme crop, aspect ratio, responsive display, alt text, and the published product page.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="article-section" aria-labelledby="separate-concerns">
          <h2 id="separate-concerns">What Pairvu checks, and what Shopify handles</h2>
          <div className="comparison-table">
            <div>
              <span>Pairvu</span>
              <p>Reference-based comparison of visible product logo, text, color, count, components, and packaging.</p>
            </div>
            <div>
              <span>Shopify and your theme</span>
              <p>Product media storage, ordering, featured media, rendering, responsive presentation, and publishing.</p>
            </div>
          </div>
        </section>

        <section className="article-section" aria-labelledby="official-sources">
          <h2 id="official-sources">Official Shopify sources</h2>
          <p>
            Shopify documents how product media is added to product pages, how a featured media item is selected, and
            how images are used across store surfaces. Confirm current file and theme guidance before publishing.
          </p>
          <ul className="source-list">
            <li>
              <a href="https://help.shopify.com/en/manual/products/product-media" rel="noreferrer">
                Shopify Help Center: Product media
              </a>
            </li>
            <li>
              <a href="https://help.shopify.com/en/manual/products/product-media/add-media" rel="noreferrer">
                Shopify Help Center: Adding product media
              </a>
            </li>
            <li>
              <a href="https://help.shopify.com/en/manual/products/product-media/product-media-types" rel="noreferrer">
                Shopify Help Center: Product media types
              </a>
            </li>
          </ul>
          <p className="content-updated">Sources reviewed July 30, 2026.</p>
        </section>

        <section className="article-section article-cta">
          <h2>Check the final image before upload</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">
              Check image
            </Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">
              Use the pre-publish checklist
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
