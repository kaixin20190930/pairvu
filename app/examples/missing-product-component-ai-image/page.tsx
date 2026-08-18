import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/missing-product-component-ai-image");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Missing Component", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function MissingProductComponentCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled comparison example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The BRIGHTLEAF kitchen cleaner keeps the same bottle, front label, blue liquid, and 750 mL value. The
            intended difference is that the candidate has no white trigger sprayer on the threaded bottle neck.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/missing-component/original.jpg",
            alt: "Original BRIGHTLEAF kitchen cleaner with a white trigger sprayer",
            label: "Approved original",
            detail: "White trigger sprayer attached",
          }}
          candidate={{
            src: "/examples/missing-component/candidate.jpg",
            alt: "Candidate BRIGHTLEAF kitchen cleaner without a trigger sprayer",
            label: "Image to check",
            detail: "Open threaded neck without sprayer",
          }}
        />

        <section className="article-section" aria-labelledby="observed-change">
          <h2 id="observed-change">What changed</h2>
          <div className="case-fact-grid">
            <div>
              <span>Changed attribute</span>
              <strong>White trigger sprayer</strong>
            </div>
            <div>
              <span>Observed Pairvu decision</span>
              <strong>REVIEW</strong>
            </div>
            <div>
              <span>Why it matters</span>
              <strong>Major functional component is absent</strong>
            </div>
          </div>
          <p>
            This is not a crop, reflection, or lighting difference. The sprayer is clearly present on the approved
            original and the candidate has an open bottle neck, so the component can be compared directly.
          </p>
        </section>

        <section className="article-section" aria-labelledby="stable-details">
          <h2 id="stable-details">What remains stable</h2>
          <ul className="check-list">
            <li>The BRIGHTLEAF name, product wording, citrus variant, and 750 mL value remain visible.</li>
            <li>The translucent blue bottle and front-label layout remain stable.</li>
            <li>The visible product count remains one bottle in both images.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check a major product component</h2>
          <p>Use an approved original and the final candidate image before publishing an AI-assisted product visual.</p>
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
            <Link className="text-link" href="/checks/product-packaging">
              Review packaging components
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
