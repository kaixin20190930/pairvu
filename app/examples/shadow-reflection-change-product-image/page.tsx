import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/shadow-reflection-change-product-image");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Shadow and Reflection", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function ShadowReflectionChangeCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled comparison example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            Window-like shadows and a stronger highlight are added around the NOVA FIZZ can. The product design,
            visible wording, 330 mL value, and package structure remain unchanged.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/label-value-change/original.jpg",
            alt: "Approved NOVA FIZZ can under neutral studio light",
            label: "Approved original",
            detail: "Neutral shadows and reflections",
          }}
          candidate={{
            src: "/examples/shadow-reflection-change/candidate.jpg",
            alt: "Candidate NOVA FIZZ can with stronger highlights and window shadows",
            label: "Image to check",
            detail: "Added shadow and surface highlight",
          }}
        />

        <section className="article-section" aria-labelledby="observed-change">
          <h2 id="observed-change">What changed</h2>
          <div className="case-fact-grid">
            <div><span>Changed attribute</span><strong>Shadow and reflection</strong></div>
            <div><span>Observed Pairvu decision</span><strong>PASS</strong></div>
            <div><span>Why it matters</span><strong>Presentation changed, product did not</strong></div>
          </div>
          <p>
            Pairvu preserved a PASS because the stronger highlight and environmental shadow did not create a
            meaningful product difference. Reflections become a REVIEW concern only when they prevent reliable color,
            logo, text, or shape comparison.
          </p>
        </section>

        <section className="article-section" aria-labelledby="stable-details">
          <h2 id="stable-details">What remains stable</h2>
          <ul className="check-list">
            <li>The NOVA FIZZ logo and white star symbol remain unchanged.</li>
            <li>LIME SPARKLING WATER, ZERO SUGAR, and 330 mL remain readable and identical.</li>
            <li>The turquoise can, one-product count, components, and silhouette remain consistent.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check shadows and reflections</h2>
          <p>Verify whether a visual treatment changed the product itself or only the environment around it.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples/lighting-change-product-image">See a lighting-change PASS</Link>
            <Link className="text-link" href="/checks/product-logo">Check logo identity under reflections</Link>
            <Link className="text-link" href="/examples">See all comparison examples</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
