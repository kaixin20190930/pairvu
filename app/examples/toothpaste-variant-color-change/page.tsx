import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/toothpaste-variant-color-change");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Toothpaste Color and Variant", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function ToothpasteVariantColorChangePage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled product-color example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The ORVENA tube keeps its logo, 100 g value, white cap, tube form, and label position. Its body changes
            from pale mint to charcoal while the readable variant changes from FRESH MINT to CHARCOAL CLEAN.
          </p>
        </header>

        <CaseComparison
          original={{ src: "/examples/toothpaste-color-variant/original.png", alt: "Pale mint ORVENA FRESH MINT toothpaste tube", label: "Approved original", detail: "Pale mint tube, FRESH MINT" }}
          candidate={{ src: "/examples/toothpaste-color-variant/candidate.png", alt: "Charcoal ORVENA CHARCOAL CLEAN toothpaste tube", label: "Image to check", detail: "Charcoal tube, CHARCOAL CLEAN" }}
        />

        <section className="article-section" aria-labelledby="toothpaste-change">
          <h2 id="toothpaste-change">What changed</h2>
          <div className="case-fact-grid">
            <div><span>Changed attributes</span><strong>Main body color and variant wording</strong></div>
            <div><span>Observed Pairvu decision</span><strong>FAIL</strong></div>
            <div><span>Stable evidence</span><strong>Logo, count, components, and tube shape</strong></div>
          </div>
          <p>
            Pairvu recorded a high-confidence text mismatch for FRESH MINT versus CHARCOAL CLEAN and a
            high-confidence main-color difference from muted light green to dark gray. The visible variant wording is
            approval-critical identity evidence, so the combined result fails even though the package construction is
            unchanged. This case must not be described as proof that color alone creates a FAIL.
          </p>
        </section>

        <section className="article-section" aria-labelledby="toothpaste-stable">
          <h2 id="toothpaste-stable">What remains stable</h2>
          <ul className="check-list">
            <li>The circular ORVENA leaf logo and brand name remain in the same white label region.</li>
            <li>Both images show one soft toothpaste tube with one white flip cap.</li>
            <li>The printed 100 g value, package proportions, and front-facing studio composition remain stable.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check color together with visible variant identity</h2>
          <p>When color encodes flavor, shade, scent, or formula, compare readable variant text before approving the candidate as the same product.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/checks/product-color">Use the Product Color method</Link>
            <Link className="text-link" href="/examples">See all controlled examples</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
