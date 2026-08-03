import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/product-count-change-ai-image");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Product Count Change", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function ProductCountChangeCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled comparison example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The GRAINLY Honey Oat Bites packaging, wording, colors, and 300 g value remain stable. The intended
            difference is visible product count: the approved original has one box and the candidate has two.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/product-count-change/original.jpg",
            alt: "Original GRAINLY Honey Oat Bites packaging with one box",
            label: "Approved original",
            detail: "One product box",
          }}
          candidate={{
            src: "/examples/product-count-change/candidate.jpg",
            alt: "Candidate GRAINLY Honey Oat Bites packaging with two boxes",
            label: "Image to check",
            detail: "Two matching product boxes",
          }}
        />

        <section className="article-section" aria-labelledby="observed-change">
          <h2 id="observed-change">What changed</h2>
          <div className="case-fact-grid">
            <div>
              <span>Changed attribute</span>
              <strong>Visible primary product count</strong>
            </div>
            <div>
              <span>Observed Pairvu decision</span>
              <strong>REVIEW</strong>
            </div>
            <div>
              <span>Why it matters</span>
              <strong>Candidate represents a different package quantity</strong>
            </div>
          </div>
          <p>
            Product count is separate from a printed capacity or weight value. Both boxes are clear in the candidate,
            so the candidate should not automatically pass as the same single-product composition.
          </p>
        </section>

        <section className="article-section" aria-labelledby="stable-details">
          <h2 id="stable-details">What remains stable</h2>
          <ul className="check-list">
            <li>The GRAINLY logo, HONEY OAT BITES wording, and WHOLE GRAIN text remain the same.</li>
            <li>The 300 g printed value remains the same on each visible box.</li>
            <li>The orange, cream, and dark-green packaging design remains stable.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check the visible product count</h2>
          <p>Use an approved original and the final candidate image before publishing a catalog or campaign visual.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">
              Check image
            </Link>
            <Link className="text-link" href="/examples">
              See all comparison examples
            </Link>
            <Link className="text-link" href="/checks/product-quantity">
              Learn the full quantity decision model
            </Link>
            <Link className="text-link" href="/ai-product-photography">
              Learn about AI product photography
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
