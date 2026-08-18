import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/color-change-ai-product-image");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Color Change", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function ColorChangeCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled comparison example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The ELARA serum keeps the same bottle, crescent logo, wording, and 30 mL value. The intended difference
            is the prominent label color: cream and orange become dark green with white text.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/color-change/original.jpg",
            alt: "Original ELARA vitamin C serum bottle with a cream label and orange details",
            label: "Approved original",
            detail: "Cream label with orange details",
          }}
          candidate={{
            src: "/examples/color-change/candidate.jpg",
            alt: "Candidate ELARA vitamin C serum bottle with a dark green label",
            label: "Image to check",
            detail: "Dark green label with white details",
          }}
        />

        <section className="article-section" aria-labelledby="observed-change">
          <h2 id="observed-change">What changed</h2>
          <div className="case-fact-grid">
            <div>
              <span>Changed attribute</span>
              <strong>Main label color</strong>
            </div>
            <div>
              <span>Observed Pairvu decision</span>
              <strong>REVIEW</strong>
            </div>
            <div>
              <span>Why it matters</span>
              <strong>Visible variant identity changed</strong>
            </div>
          </div>
          <p>
            This is a broad packaging-color change, not a background, shadow, or reflection change. The product stays
            visible in both images, but the candidate should not be treated as automatically faithful to the approved
            original.
          </p>
        </section>

        <section className="article-section" aria-labelledby="stable-details">
          <h2 id="stable-details">What remains stable</h2>
          <ul className="check-list">
            <li>The ELARA brand name, crescent symbol, product wording, and 30 mL value remain visible.</li>
            <li>The frosted bottle and white dropper remain the same.</li>
            <li>The label layout is stable even though its dominant color changes.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check a product-color change</h2>
          <p>Use an approved original and the final candidate image before publishing a new product variant or visual.</p>
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
