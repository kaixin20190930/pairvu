import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/packaging-shape-change-ai-product-image");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Packaging Shape Change", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function PackagingShapeChangeCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled comparison example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The MIREVA brand, shampoo label, 500 mL value, amber color, and pump remain stable. The intended difference
            is the bottle body, which changes from rounded to rectangular.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/packaging-shape-change/original.jpg",
            alt: "Original MIREVA shampoo in a rounded cylindrical pump bottle",
            label: "Approved original",
            detail: "Rounded cylindrical bottle",
          }}
          candidate={{
            src: "/examples/packaging-shape-change/candidate.jpg",
            alt: "Candidate MIREVA shampoo in a rectangular pump bottle",
            label: "Image to check",
            detail: "Rectangular bottle",
          }}
        />

        <section className="article-section" aria-labelledby="observed-change">
          <h2 id="observed-change">What changed</h2>
          <div className="case-fact-grid">
            <div>
              <span>Changed attribute</span>
              <strong>Container shape</strong>
            </div>
            <div>
              <span>Expected decision</span>
              <strong>FAIL</strong>
            </div>
            <div>
              <span>Why it matters</span>
              <strong>Packaging identity changed</strong>
            </div>
          </div>
          <p>
            The candidate has straight sides and sharper corners. Both bottles are shown front-on with sufficient
            coverage, so this is not merely a crop or viewpoint difference.
          </p>
        </section>

        <section className="article-section" aria-labelledby="stable-details">
          <h2 id="stable-details">What should remain verified</h2>
          <ul className="check-list">
            <li>The MIREVA logo, product name, and label wording remain the same.</li>
            <li>The 500 mL value and amber packaging color remain stable.</li>
            <li>The black pump remains present in both images.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check package shape before publishing</h2>
          <p>Use a sufficiently visible approved original so shape can be compared honestly.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">
              Check image
            </Link>
            <Link className="text-link" href="/examples">
              See all comparison examples
            </Link>
            <Link className="text-link" href="/checks/product-packaging">
              Use the Product Packaging check
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
