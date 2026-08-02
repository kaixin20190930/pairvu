import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/large-viewpoint-difference-product-image");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Large Viewpoint Difference", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function LargeViewpointDifferenceCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled observability example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The approved BRIGHTLEAF image shows the front label, while the candidate shows the back. The bottle and
            sprayer can be compared, but front-facing logo and product text cannot.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/missing-component/original.jpg",
            alt: "Approved front view of a BRIGHTLEAF kitchen cleaner bottle",
            label: "Approved original",
            detail: "Front label and logo visible",
          }}
          candidate={{
            src: "/examples/large-viewpoint/candidate.jpg",
            alt: "Back view of the same BRIGHTLEAF kitchen cleaner bottle",
            label: "Image to check",
            detail: "Back label visible instead",
          }}
        />

        <section className="article-section" aria-labelledby="observed-result">
          <h2 id="observed-result">Why the result is REVIEW</h2>
          <div className="case-fact-grid">
            <div><span>Comparison limitation</span><strong>Different package faces</strong></div>
            <div><span>Observed Pairvu decision</span><strong>REVIEW</strong></div>
            <div><span>Why it matters</span><strong>Missing evidence is not a mismatch</strong></div>
          </div>
          <p>
            Pairvu should not claim that front-label text changed merely because the candidate shows another side of
            the package. REVIEW is the honest result: quantity, color, major components, and overall bottle shape can
            still match, while logo and front-label fidelity remain unverified.
          </p>
        </section>

        <section className="article-section" aria-labelledby="verified-details">
          <h2 id="verified-details">What can still be verified</h2>
          <ul className="check-list">
            <li>Both images show one translucent blue cleaner bottle with a white trigger sprayer.</li>
            <li>The major components and overall curved bottle silhouette remain consistent.</li>
            <li>The front logo, product name, and front-label values need a corresponding front view.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check comparable product views</h2>
          <p>Use corresponding package faces when logo or label fidelity must be verified before publishing.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples/partially-hidden-product-logo">See a partial-occlusion REVIEW</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the pre-publish checklist</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
