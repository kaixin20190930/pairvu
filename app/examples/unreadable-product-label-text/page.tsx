import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/unreadable-product-label-text");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Unreadable Label Text", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function UnreadableProductLabelTextCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled observability example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The candidate preserves the GRAINLY box, color blocks, logo graphic, and package shape, but its identity
            text and printed value are too pixelated for a reliable direct comparison.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/product-count-change/original.jpg",
            alt: "Approved GRAINLY Honey Oat Bites box with readable product text",
            label: "Approved original",
            detail: "Label wording and 300 g are readable",
          }}
          candidate={{
            src: "/examples/unreadable-text/candidate.jpg",
            alt: "GRAINLY food box with pixelated unreadable label text",
            label: "Image to check",
            detail: "Primary label text is pixelated",
          }}
        />

        <section className="article-section" aria-labelledby="observed-result">
          <h2 id="observed-result">Why the result is REVIEW</h2>
          <div className="case-fact-grid">
            <div><span>Comparison limitation</span><strong>Text is unreadable</strong></div>
            <div><span>Observed Pairvu decision</span><strong>REVIEW</strong></div>
            <div><span>Why it matters</span><strong>Similarity is not verification</strong></div>
          </div>
          <p>
            The candidate still resembles the approved package, but the pixels do not support an exact reading of
            GRAINLY, HONEY OAT BITES, WHOLE GRAIN, or 300 g. Pairvu records the logo and visible-text checks as not
            sufficiently observable instead of assuming that blurred characters match.
          </p>
        </section>

        <section className="article-section" aria-labelledby="verified-details">
          <h2 id="verified-details">What can still be verified</h2>
          <ul className="check-list">
            <li>Both images show one rectangular food box with the same beige, orange, and dark green color blocks.</li>
            <li>The sun-and-grain symbol remains visible in the same location.</li>
            <li>The package count and overall box silhouette remain consistent.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check readable product artwork</h2>
          <p>Use a high-resolution candidate when exact brand names, claims, quantities, or regulatory text matter.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples/label-value-change-ai-product-image">See a confirmed printed-value change</Link>
            <Link className="text-link" href="/examples/partially-visible-product-image">See a partial-coverage REVIEW</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
