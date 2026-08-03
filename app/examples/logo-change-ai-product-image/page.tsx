import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/logo-change-ai-product-image");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Logo Change", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function LogoChangeCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled comparison example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The cosmetics bottle, label wording, capacity, colors, and package shape remain stable. The intended
            difference is the brand symbol above ELARA: a crescent moon becomes a sun.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/logo-change/original.jpg",
            alt: "Original ELARA vitamin C serum bottle with a crescent moon logo",
            label: "Approved original",
            detail: "Crescent moon logo",
          }}
          candidate={{
            src: "/examples/logo-change/candidate.jpg",
            alt: "Candidate ELARA vitamin C serum bottle with a sun logo",
            label: "Image to check",
            detail: "Sun logo",
          }}
        />

        <section className="article-section" aria-labelledby="observed-change">
          <h2 id="observed-change">What changed</h2>
          <div className="case-fact-grid">
            <div>
              <span>Changed attribute</span>
              <strong>Visible logo symbol</strong>
            </div>
            <div>
              <span>Expected decision</span>
              <strong>FAIL</strong>
            </div>
            <div>
              <span>Why it matters</span>
              <strong>Brand identity changed</strong>
            </div>
          </div>
          <p>
            This is not a lighting, placement, or perspective difference. Both symbols are clearly visible in
            corresponding positions, so the logo can be compared directly.
          </p>
        </section>

        <section className="article-section" aria-labelledby="stable-details">
          <h2 id="stable-details">What should remain verified</h2>
          <ul className="check-list">
            <li>The ELARA brand name and product wording remain the same.</li>
            <li>The 30 mL printed value remains the same.</li>
            <li>The bottle, dropper, label layout, and main colors remain stable.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check your own product logo</h2>
          <p>Use an approved original and the final candidate image before publishing.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">
              Check image
            </Link>
            <Link className="text-link" href="/examples">
              See all comparison examples
            </Link>
            <Link className="text-link" href="/checks/product-logo">
              Use the Product Logo check
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
