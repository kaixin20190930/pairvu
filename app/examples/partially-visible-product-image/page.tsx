import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/partially-visible-product-image");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Partially Visible Product", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function PartiallyVisibleProductImageCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled observability example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The candidate is a close crop of the approved MIREVA shampoo. Its logo, pump, and upper label remain
            visible, but the lower label and complete bottle silhouette are outside the frame.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/packaging-shape-change/original.jpg",
            alt: "Approved full view of a MIREVA Daily Balance Shampoo bottle",
            label: "Approved original",
            detail: "Full bottle and label visible",
          }}
          candidate={{
            src: "/examples/partial-product-coverage/candidate.jpg",
            alt: "Close crop showing only the upper portion of a MIREVA shampoo bottle",
            label: "Image to check",
            detail: "Lower bottle and label cropped out",
          }}
        />

        <section className="article-section" aria-labelledby="observed-result">
          <h2 id="observed-result">Why the result is REVIEW</h2>
          <div className="case-fact-grid">
            <div><span>Comparison limitation</span><strong>Incomplete product coverage</strong></div>
            <div><span>Observed Pairvu decision</span><strong>REVIEW</strong></div>
            <div><span>Why it matters</span><strong>A crop can hide real changes</strong></div>
          </div>
          <p>
            Pairvu can verify the MIREVA logo, amber bottle, black pump, cream label, and visible upper wording. It
            cannot verify the full label text, 500 mL value, bottle base, or complete packaging silhouette because
            those regions are absent from the candidate image.
          </p>
        </section>

        <section className="article-section" aria-labelledby="coverage-needed">
          <h2 id="coverage-needed">What a publishable comparison needs</h2>
          <ul className="check-list">
            <li>Show the complete product boundary when packaging shape must be checked.</li>
            <li>Keep identity-bearing wording and printed values inside the frame at readable resolution.</li>
            <li>Use a crop only when the omitted areas are explicitly outside the approval scope.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check complete product coverage</h2>
          <p>Upload a candidate that includes every product region that must be verified before publishing.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples/unreadable-product-label-text">See an unreadable-text REVIEW</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the pre-publish checklist</Link>
            <Link className="text-link" href="/checks/product-label-text">Review incomplete label coverage</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
