import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/extra-product-component-ai-image");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Extra Component", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function ExtraProductComponentCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled comparison example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The candidate keeps the ELARA serum bottle, crescent logo, label wording, and 30 mL value, but adds a
            separate white applicator beside the product.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/color-change/original.jpg",
            alt: "Approved ELARA vitamin C serum bottle without a separate applicator",
            label: "Approved original",
            detail: "One serum bottle with dropper",
          }}
          candidate={{
            src: "/examples/extra-component/candidate.jpg",
            alt: "Candidate ELARA serum image with an extra white applicator beside the bottle",
            label: "Image to check",
            detail: "Serum bottle plus separate applicator",
          }}
        />

        <section className="article-section" aria-labelledby="observed-change">
          <h2 id="observed-change">What changed</h2>
          <div className="case-fact-grid">
            <div><span>Changed attribute</span><strong>Major component</strong></div>
            <div><span>Observed Pairvu decision</span><strong>REVIEW</strong></div>
            <div><span>Why it matters</span><strong>The visible product set changed</strong></div>
          </div>
          <p>
            Pairvu identified the additional applicator without treating the bottle, logo, text, color, or packaging
            as changed. REVIEW is appropriate because a separate accessory may be intentional, but it should not be
            published as faithful to a single-product reference without confirmation.
          </p>
        </section>

        <section className="article-section" aria-labelledby="stable-details">
          <h2 id="stable-details">What remains stable</h2>
          <ul className="check-list">
            <li>The ELARA crescent logo and brand name remain unchanged.</li>
            <li>VITAMIN C SERUM, BRIGHTENING, and 30 mL remain visible.</li>
            <li>The frosted bottle, white dropper, label layout, and main colors remain consistent.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check for extra product components</h2>
          <p>Compare an approved image with the final candidate before an added accessory reaches a listing or campaign.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples">See all comparison examples</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the pre-publish checklist</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
