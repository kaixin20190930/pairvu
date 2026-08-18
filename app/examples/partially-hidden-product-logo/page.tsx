import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/partially-hidden-product-logo");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Partially Hidden Logo", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function PartiallyHiddenProductLogoCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled observability example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            A white sticker covers much of the NOVA FIZZ brand area. The can, colors, capacity, and lower product text
            remain visible, but the full brand mark cannot be compared directly.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/label-value-change/original.jpg",
            alt: "Approved NOVA FIZZ can with the complete logo and brand name visible",
            label: "Approved original",
            detail: "Complete brand area visible",
          }}
          candidate={{
            src: "/examples/partially-hidden-logo/candidate.jpg",
            alt: "NOVA FIZZ can with a white sticker covering part of the logo and brand name",
            label: "Image to check",
            detail: "Brand area partially covered",
          }}
        />

        <section className="article-section" aria-labelledby="observed-result">
          <h2 id="observed-result">Why the result is REVIEW</h2>
          <div className="case-fact-grid">
            <div><span>Comparison limitation</span><strong>Brand area occluded</strong></div>
            <div><span>Observed Pairvu decision</span><strong>REVIEW</strong></div>
            <div><span>Why it matters</span><strong>Hidden is not changed</strong></div>
          </div>
          <p>
            The visible portion of the white star mark remains consistent, but the sticker prevents a full comparison
            of the NOVA FIZZ brand text. Pairvu records an observability limitation instead of reporting a fabricated
            logo or text mismatch.
          </p>
        </section>

        <section className="article-section" aria-labelledby="verified-details">
          <h2 id="verified-details">What remains observable</h2>
          <ul className="check-list">
            <li>The turquoise can, white lower gradient, dotted pattern, and silver can edges remain consistent.</li>
            <li>LIME SPARKLING WATER, ZERO SUGAR, and 330 mL remain visible outside the covered area.</li>
            <li>One product can and the same packaging silhouette are visible in both images.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check whether brand details are visible</h2>
          <p>Use a candidate with an unobstructed brand area when logo and identity fidelity must be confirmed.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples/large-viewpoint-difference-product-image">See a viewpoint REVIEW</Link>
            <Link className="text-link" href="/examples/logo-change-ai-product-image">See a confirmed logo change</Link>
            <Link className="text-link" href="/checks/product-logo">Use the Product Logo check</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
