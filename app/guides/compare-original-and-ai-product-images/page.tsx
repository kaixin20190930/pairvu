import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/guides/compare-original-and-ai-product-images");

export const metadata: Metadata = pageMetadata(page);

export default function CompareOriginalAndAiProductImagesPage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container narrow-content">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: "Compare Images", href: page.route }]} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Comparison workflow</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            Compare the approved product image with the final candidate, not with a rough draft. This keeps the
            question specific: did the image intended for publication visibly change the product?
          </p>
        </header>

        <section className="article-section" aria-labelledby="prepare">
          <h2 id="prepare">Prepare images that can be compared</h2>
          <ul className="check-list">
            <li>Use the approved image for the exact product, label, variant, and package you want to publish.</li>
            <li>Use the final candidate after background, lighting, composition, and creative edits are complete.</li>
            <li>Keep identity-bearing details large enough to read and avoid comparing unrelated package faces.</li>
            <li>Send a hidden or cropped detail to human review instead of assuming it matches.</li>
          </ul>
        </section>

        <section className="article-section" aria-labelledby="order">
          <h2 id="order">Review in an order that prevents false confidence</h2>
          <ol className="numbered-checklist">
            <li><strong>Identity first.</strong><p>Check the brand mark, brand name, product name, and printed value.</p></li>
            <li><strong>Physical product next.</strong><p>Compare the count, main color, major parts, and container form.</p></li>
            <li><strong>Coverage last.</strong><p>Confirm both corresponding details are actually visible before calling them a match.</p></li>
          </ol>
        </section>

        <section className="article-section" aria-labelledby="examples">
          <h2 id="examples">Why an overall match is not enough</h2>
          <p>
            A candidate may keep the bottle, can, or box plausible while changing one small but meaningful detail. In
            Pairvu&apos;s public examples, a logo changes while the label remains stable, and a capacity changes while the
            product design remains stable. These are exactly the differences an image-only visual impression can miss.
          </p>
          <div className="content-actions">
            <Link className="text-link" href="/examples/logo-change-ai-product-image">View the logo comparison</Link>
            <Link className="text-link" href="/examples/label-value-change-ai-product-image">View the printed-value comparison</Link>
          </div>
        </section>

        <section className="article-section article-cta">
          <h2>Compare the final candidate before publishing</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the checklist</Link>
          </div>
        </section>
        <p className="content-updated">Last updated: July 31, 2026</p>
      </div>
    </main>
  );
}
