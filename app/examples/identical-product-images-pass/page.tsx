import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/identical-product-images-pass");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Identical Images", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function IdenticalProductImagesCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled comparison example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The same NOVA FIZZ beverage image is used as both the approved original and the candidate. This baseline
            checks whether the system can preserve a clean PASS without inventing differences.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/label-value-change/original.jpg",
            alt: "Approved NOVA FIZZ lime sparkling water can showing 330 mL",
            label: "Approved original",
            detail: "NOVA FIZZ can, 330 mL",
          }}
          candidate={{
            src: "/examples/label-value-change/original.jpg",
            alt: "Identical candidate NOVA FIZZ lime sparkling water can showing 330 mL",
            label: "Image to check",
            detail: "Exact same image file",
          }}
        />

        <section className="article-section" aria-labelledby="observed-change">
          <h2 id="observed-change">What changed</h2>
          <div className="case-fact-grid">
            <div><span>Changed attribute</span><strong>None</strong></div>
            <div><span>Observed Pairvu decision</span><strong>PASS</strong></div>
            <div><span>Why it matters</span><strong>Baseline false alarms stayed clear</strong></div>
          </div>
          <p>
            The controlled fixture uses the exact same file on both sides. Pairvu returned PASS and verified the
            visible logo, wording, printed value, product count, color, components, and package shape.
          </p>
        </section>

        <section className="article-section" aria-labelledby="stable-details">
          <h2 id="stable-details">What remains stable</h2>
          <ul className="check-list">
            <li>The NOVA FIZZ brand and star symbol are identical.</li>
            <li>LIME SPARKLING WATER, ZERO SUGAR, and 330 mL are unchanged.</li>
            <li>The can color, quantity, structure, and silhouette match exactly.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check an unchanged product image</h2>
          <p>A product-image checker should confirm a faithful image without manufacturing reasons to stop publishing.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples">See all comparison examples</Link>
            <Link className="text-link" href="/how-pairvu-works">How Pairvu reaches a verdict</Link>
            <Link className="text-link" href="/checks/product-label-text">Use the Product Label Text check</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
