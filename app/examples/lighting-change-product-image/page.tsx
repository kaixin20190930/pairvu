import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/lighting-change-product-image");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Lighting Change", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function LightingChangeCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled comparison example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The MIREVA shampoo moves from neutral studio light to a warmer scene. The bottle, pump, label, logo,
            wording, and 500 mL value remain visibly consistent.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/packaging-shape-change/original.jpg",
            alt: "Approved MIREVA shampoo bottle in neutral studio lighting",
            label: "Approved original",
            detail: "Neutral studio light",
          }}
          candidate={{
            src: "/examples/lighting-change/candidate.jpg",
            alt: "Candidate MIREVA shampoo bottle in warmer lighting",
            label: "Image to check",
            detail: "Warmer ambient light",
          }}
        />

        <section className="article-section" aria-labelledby="observed-change">
          <h2 id="observed-change">What changed</h2>
          <div className="case-fact-grid">
            <div><span>Changed attribute</span><strong>Scene lighting</strong></div>
            <div><span>Observed Pairvu decision</span><strong>PASS</strong></div>
            <div><span>Why it matters</span><strong>Lighting is not product identity</strong></div>
          </div>
          <p>
            Pairvu treated the warmer illumination as a presentation change rather than a product-color mismatch.
            This is the intended behavior when the product remains sufficiently visible and its semantic colors stay
            consistent.
          </p>
        </section>

        <section className="article-section" aria-labelledby="stable-details">
          <h2 id="stable-details">What remains stable</h2>
          <ul className="check-list">
            <li>The MIREVA logo, DAILY BALANCE SHAMPOO wording, and 500 mL value remain unchanged.</li>
            <li>The amber bottle, black pump, cream label, and green accents remain consistent.</li>
            <li>The product count, components, and rounded bottle shape remain the same.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check a relit product image</h2>
          <p>Compare product identity separately from normal changes in illumination and presentation.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples/background-change-ai-product-image">See a background-change PASS</Link>
            <Link className="text-link" href="/examples">See all comparison examples</Link>
            <Link className="text-link" href="/checks/product-packaging">Separate lighting from packaging</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
