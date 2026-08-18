import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/use-cases/amazon-product-image-qa");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Amazon Sellers", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function AmazonProductImageQaPage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Platform workflow</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            First ask whether the candidate still depicts the approved product. Then perform Amazon&apos;s separate
            listing, category, technical, and content checks.
          </p>
          <p className="platform-disclaimer">
            Pairvu is an independent product and is not affiliated with, endorsed by, or certified by Amazon.
          </p>
        </header>

        <section className="article-section" aria-labelledby="two-checks">
          <h2 id="two-checks">Two different checks</h2>
          <div className="comparison-table">
            <div>
              <span>Pairvu product-fidelity check</span>
              <p>Did the final image change the visible product compared with the approved original?</p>
            </div>
            <div>
              <span>Amazon listing and image review</span>
              <p>Does the image meet current Amazon and category-specific requirements for its intended placement?</p>
            </div>
          </div>
          <p>
            A Pairvu PASS does not mean that Amazon will accept or approve an image. A candidate can preserve product
            identity and still fail a marketplace-specific requirement.
          </p>
        </section>

        <section className="article-section" aria-labelledby="seller-workflow">
          <h2 id="seller-workflow">Suggested seller workflow</h2>
          <ol className="workflow-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Confirm the ASIN or product variant</strong>
                <p>Choose an approved original that represents the exact product being listed.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Compare the AI-assisted candidate</strong>
                <p>Review product identity, printed values, count, components, color, and packaging shape.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Apply current Amazon requirements</strong>
                <p>Check the latest general and category-specific image rules in Seller Central.</p>
              </div>
            </li>
            <li>
              <span>4</span>
              <div>
                <strong>Complete listing review</strong>
                <p>Confirm that the images, title, variation, product details, and offer describe the same product.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="article-section" aria-labelledby="official-sources">
          <h2 id="official-sources">Official Amazon sources</h2>
          <p>
            Amazon explains that product-detail pages include images and other product information, and that images
            should give customers an accurate view of what is being sold. Requirements can change and can vary by
            category, so always verify the current rules directly.
          </p>
          <ul className="source-list">
            <li>
              <a href="https://sell.amazon.com/blog/amazon-product-listings" rel="noreferrer">
                Amazon: How to create product listings
              </a>
            </li>
            <li>
              <a
                href="https://sellercentral.amazon.com/seller-forums/discussions/t/4b3c4c39-6f8c-4312-aa0e-99982eb8f5e1/"
                rel="noreferrer"
              >
                Amazon Seller Central: Product image requirements overview
              </a>
            </li>
          </ul>
          <p className="content-updated">Sources reviewed July 30, 2026.</p>
        </section>

        <section className="article-section article-cta">
          <h2>Check product fidelity first</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">
              Check image
            </Link>
            <Link className="text-link" href="/examples/logo-change-ai-product-image">
              See a logo-change example
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
