import type { Metadata } from "next";
import Link from "next/link";
import { ProductChecker } from "@/components/ProductChecker";
import { StructuredData } from "@/components/StructuredData";
import { getSeoPage, pageMetadata, websiteSchema, webApplicationSchema } from "@/lib/seo/content-registry";

const page = getSeoPage("/");

export const metadata: Metadata = pageMetadata(page);

export default function HomePage() {
  return (
    <>
      <StructuredData data={[websiteSchema(), webApplicationSchema()]} />
      <main>
        <div className="checker-shell">
          <section className="checker-surface" aria-labelledby="headline">
            <ProductChecker />
          </section>
        </div>

        <section className="content-band" aria-labelledby="how-it-works">
          <div className="content-container">
            <p className="eyebrow">Reference-based visual QA</p>
            <h2 id="how-it-works">Check the product, not just the picture</h2>
            <p className="section-intro">
              Pairvu compares an AI-generated or edited product image with an approved original. It looks for
              visible changes that can make a product image inaccurate before the image is published.
            </p>
            <ol className="process-grid">
              <li>
                <span>1</span>
                <strong>Add the approved original</strong>
                <p>Use a clear image that represents the product you intend to show.</p>
              </li>
              <li>
                <span>2</span>
                <strong>Add the image to check</strong>
                <p>Upload the generated, edited, or otherwise proposed product image.</p>
              </li>
              <li>
                <span>3</span>
                <strong>Review visible differences</strong>
                <p>Get a PASS, REVIEW, or FAIL with evidence and observability limits.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="content-band content-band-muted" aria-labelledby="what-pairvu-checks">
          <div className="content-container">
            <p className="eyebrow">Product fidelity checks</p>
            <h2 id="what-pairvu-checks">What Pairvu checks</h2>
            <div className="feature-list">
              <article>
                <h3>Logo and visible text</h3>
                <p>Brand marks, product names, label wording, and printed values such as size or capacity.</p>
              </article>
              <article>
                <h3>Product count and components</h3>
                <p>Visible product units and major parts that are missing, added, or materially changed.</p>
              </article>
              <article>
                <h3>Main color and packaging</h3>
                <p>Semantic product colors, container shape, packaging silhouette, and major structural changes.</p>
              </article>
              <article>
                <h3>What cannot be verified</h3>
                <p>Occlusion, unreadable text, incomplete coverage, and viewpoint differences are kept in review.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="content-band" aria-labelledby="market-context">
          <div className="content-container split-content">
            <div>
              <p className="eyebrow">AI product photography</p>
              <h2 id="market-context">Create faster without losing product truth</h2>
            </div>
            <div>
              <p>
                AI can change a scene quickly, but it can also alter a label, logo, color, count, component, or
                package. Pairvu adds a reference-based quality-control step between image creation and publishing.
              </p>
              <Link className="text-link" href="/ai-product-photography">
                Learn about quality control for AI product photography
              </Link>
            </div>
          </div>
        </section>

        <section className="content-band content-band-muted" aria-labelledby="explore-pairvu">
          <div className="content-container">
            <p className="eyebrow">Learn from real failure modes</p>
            <h2 id="explore-pairvu">Build a safer pre-publish workflow</h2>
            <div className="link-grid">
              <Link href="/examples">
                <strong>Comparison examples</strong>
                <span>See the visible changes Pairvu is designed to catch.</span>
              </Link>
              <Link href="/guides/ai-product-photography-checklist">
                <strong>Pre-publish checklist</strong>
                <span>Review product fidelity before an image goes live.</span>
              </Link>
              <Link href="/how-pairvu-works">
                <strong>How Pairvu works</strong>
                <span>Understand the comparison method, verdicts, and visible-evidence limits.</span>
              </Link>
              <Link href="/use-cases">
                <strong>Use cases</strong>
                <span>Fit Pairvu into brand, creative, and commerce workflows.</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="content-band" aria-labelledby="home-faq">
          <div className="content-container narrow-content">
            <p className="eyebrow">Common questions</p>
            <h2 id="home-faq">About the checker</h2>
            <div className="faq-list">
              <details>
                <summary>Does Pairvu generate product images?</summary>
                <p>No. Pairvu checks an existing candidate image against an approved original.</p>
              </details>
              <details>
                <summary>Does a PASS guarantee marketplace approval?</summary>
                <p>
                  No. A PASS means the supported, sufficiently visible product checks matched. Marketplace,
                  regulatory, and legal decisions remain outside Pairvu.
                </p>
              </details>
              <details>
                <summary>What happens when a detail is hidden or unreadable?</summary>
                <p>
                  Pairvu should return REVIEW or a limitation for that detail rather than treating non-visibility as
                  proof that the product matches.
                </p>
              </details>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
