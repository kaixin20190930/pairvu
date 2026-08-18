import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/use-cases/brands");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Brands", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function BrandsUseCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Use case</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            Brand teams can use an approved packshot or product image as a visual source of truth, then compare the
            final AI-assisted asset before it reaches campaign, catalog, or channel approval.
          </p>
        </header>

        <section className="article-section" aria-labelledby="workflow">
          <h2 id="workflow">A reference-based brand review step</h2>
          <ol className="workflow-steps">
            <li><span>1</span><div><strong>Choose the approved product reference</strong><p>Use the correct SKU, visible label, package, and variant for the asset being produced.</p></div></li>
            <li><span>2</span><div><strong>Finish the creative variation</strong><p>Allow the intended scene, setting, and composition work to happen before the final check.</p></div></li>
            <li><span>3</span><div><strong>Check product identity</strong><p>Compare logo, text, printed values, color, components, and packaging against the approved source.</p></div></li>
            <li><span>4</span><div><strong>Keep exceptions explicit</strong><p>Route a confirmed change or incomplete coverage to the appropriate brand or creative reviewer.</p></div></li>
          </ol>
        </section>

        <section className="article-section" aria-labelledby="risk">
          <h2 id="risk">Small identity changes can matter</h2>
          <p>
            A product image can retain the same bottle, label layout, and overall visual style while its brand symbol
            changes. The published logo example shows a crescent moon changed to a sun on the same serum label. That
            is a product-identity difference, not a harmless scene variation.
          </p>
          <Link className="text-link" href="/examples/logo-change-ai-product-image">View the logo comparison example</Link>
        </section>

        <section className="article-section" aria-labelledby="boundary">
          <h2 id="boundary">What remains outside this check</h2>
          <p>
            Pairvu does not replace brand governance, trademark clearance, legal approval, accessibility review, or
            copy approval. It helps surface visible product changes in an image pair before those separate processes.
          </p>
        </section>

        <section className="article-section article-cta">
          <h2>Check the final brand asset</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the pre-publish checklist</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
