import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/use-cases/ecommerce-product-image-qa");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Ecommerce", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function EcommerceProductImageQaPage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Use case</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            Pairvu adds a narrow product-fidelity check between creative production and publishing. It can support an
            ecommerce workflow without making ecommerce the limit of the product.
          </p>
        </header>

        <section className="article-section" aria-labelledby="workflow">
          <h2 id="workflow">A small checkpoint in the content workflow</h2>
          <ol className="workflow-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Select the approved original</strong>
                <p>Use a real or approved image that clearly shows the product attributes that must remain stable.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Generate or edit the campaign image</strong>
                <p>Finish the creative work first. Pairvu is a comparison step, not an image generator.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Review the final candidate</strong>
                <p>Check logo, visible text, color, count, components, and packaging before publishing.</p>
              </div>
            </li>
            <li>
              <span>4</span>
              <div>
                <strong>Route the result</strong>
                <p>Publish a PASS, inspect a REVIEW, and return a FAIL to the creative workflow.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="article-section" aria-labelledby="common-risks">
          <h2 id="common-risks">Product changes worth catching</h2>
          <div className="feature-list">
            <article>
              <h3>Wrong variant or printed value</h3>
              <p>A candidate can preserve the overall design while changing flavor, size, weight, or capacity.</p>
            </article>
            <article>
              <h3>Changed brand identity</h3>
              <p>A logo symbol or identity-bearing word can drift even when the product still looks plausible.</p>
            </article>
            <article>
              <h3>Missing or extra parts</h3>
              <p>Applicators, pumps, caps, handles, or included accessories can disappear or be introduced.</p>
            </article>
            <article>
              <h3>Packaging drift</h3>
              <p>A bottle, box, pouch, or label can change shape or semantic color during AI-assisted production.</p>
            </article>
          </div>
        </section>

        <section className="article-section" aria-labelledby="not-replaced">
          <h2 id="not-replaced">What this check does not replace</h2>
          <p>
            Pairvu does not replace merchandising approval, legal review, accessibility work, marketplace rules,
            product-data governance, or a final human decision. It reports supported visible fidelity differences and
            observability limits.
          </p>
        </section>

        <section className="article-section article-cta">
          <h2>Review a final ecommerce image</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">
              Check image
            </Link>
            <Link className="text-link" href="/examples/label-value-change-ai-product-image">
              See a printed-value example
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
