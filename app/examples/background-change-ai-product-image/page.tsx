import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/background-change-ai-product-image");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Background Change", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function BackgroundChangeCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled comparison example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The ELARA serum keeps the same bottle, crescent logo, wording, and 30 mL value. The only intended
            difference is the setting: a neutral studio background becomes a bright countertop scene.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/background-change/original.jpg",
            alt: "Original ELARA vitamin C serum on a neutral studio background",
            label: "Approved original",
            detail: "Neutral studio background",
          }}
          candidate={{
            src: "/examples/background-change/candidate.jpg",
            alt: "Candidate ELARA vitamin C serum on a bright countertop background",
            label: "Image to check",
            detail: "Bright countertop scene",
          }}
        />

        <section className="article-section" aria-labelledby="observed-change">
          <h2 id="observed-change">What changed</h2>
          <div className="case-fact-grid">
            <div>
              <span>Changed attribute</span>
              <strong>Background scene</strong>
            </div>
            <div>
              <span>Observed Pairvu decision</span>
              <strong>PASS</strong>
            </div>
            <div>
              <span>Why it matters</span>
              <strong>Product identity stayed stable</strong>
            </div>
          </div>
          <p>
            This is a hard-negative comparison: the background changes, but the product remains visibly faithful to
            the approved original. A useful product-image checker should preserve a PASS when only the scene changes.
          </p>
        </section>

        <section className="article-section" aria-labelledby="stable-details">
          <h2 id="stable-details">What remains stable</h2>
          <ul className="check-list">
            <li>The ELARA brand name, crescent symbol, product wording, and 30 mL value remain visible.</li>
            <li>The frosted bottle, white dropper, and single-product count remain the same.</li>
            <li>The product and label colors remain stable; only the environment behind the product changes.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check a background change</h2>
          <p>Use an approved original and the final candidate image before publishing a new product visual.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">
              Check image
            </Link>
            <Link className="text-link" href="/examples">
              See all comparison examples
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
