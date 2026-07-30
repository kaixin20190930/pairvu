import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/label-value-change-ai-product-image");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Label Value Change", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function LabelValueChangeCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled comparison example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The beverage can, NOVA FIZZ identity, flavor wording, and visual design remain stable. The intended
            difference is the printed capacity at the bottom of the can.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/label-value-change/original.jpg",
            alt: "Original NOVA FIZZ sparkling water can labeled 330 mL",
            label: "Approved original",
            detail: "330 mL",
          }}
          candidate={{
            src: "/examples/label-value-change/candidate.jpg",
            alt: "Candidate NOVA FIZZ sparkling water can labeled 500 mL",
            label: "Image to check",
            detail: "500 mL",
          }}
        />

        <section className="article-section" aria-labelledby="observed-change">
          <h2 id="observed-change">What changed</h2>
          <div className="case-fact-grid">
            <div>
              <span>Changed attribute</span>
              <strong>Printed capacity value</strong>
            </div>
            <div>
              <span>Expected decision</span>
              <strong>FAIL</strong>
            </div>
            <div>
              <span>Why it matters</span>
              <strong>330 mL became 500 mL</strong>
            </div>
          </div>
          <p>
            The visible package value is part of the product information. This case is a label-value change, not a
            change in the number of cans shown.
          </p>
        </section>

        <section className="article-section" aria-labelledby="stable-details">
          <h2 id="stable-details">What should remain verified</h2>
          <ul className="check-list">
            <li>The NOVA FIZZ brand and star symbol remain the same.</li>
            <li>LIME SPARKLING WATER and ZERO SUGAR remain unchanged.</li>
            <li>The can count, shape, main color, and packaging pattern remain stable.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check printed product values</h2>
          <p>Compare the final candidate with the approved package image before publishing.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">
              Check image
            </Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">
              Use the pre-publish checklist
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
