import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/household-cleaner-capacity-change");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Cleaner Capacity Change", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function HouseholdCleanerCapacityChangePage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled household product example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The candidate preserves the BRIGHTLEAF bottle, trigger, logo, product wording, liquid color, and package
            shape. One approval-critical value changes: the front label says 500 mL instead of 750 mL.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/household-capacity-change/original.jpg",
            alt: "Approved BRIGHTLEAF kitchen cleaner bottle with 750 mL printed on the front label",
            label: "Approved original",
            detail: "BRIGHTLEAF cleaner, 750 mL",
          }}
          candidate={{
            src: "/examples/household-capacity-change/candidate.jpg",
            alt: "Candidate BRIGHTLEAF kitchen cleaner bottle with the capacity changed to 500 mL",
            label: "Image to check",
            detail: "Same cleaner, 500 mL",
          }}
        />

        <section className="article-section" aria-labelledby="household-capacity-result">
          <h2 id="household-capacity-result">Why the result is FAIL</h2>
          <div className="case-fact-grid">
            <div><span>Changed attribute</span><strong>Printed capacity</strong></div>
            <div><span>Observed Pairvu decision</span><strong>FAIL</strong></div>
            <div><span>Confirmed evidence</span><strong>750 mL became 500 mL</strong></div>
          </div>
          <p>
            Capacity is customer-facing product information, not a decorative label detail. Pairvu confirmed the
            readable value change while verifying that the package system remained stable. The image should not be
            published for the approved 750 mL product until the label value is corrected.
          </p>
        </section>

        <section className="article-section" aria-labelledby="household-capacity-stable">
          <h2 id="household-capacity-stable">What remains stable</h2>
          <ul className="check-list">
            <li>The BRIGHTLEAF logo, KITCHEN CLEANER wording, and CITRUS variant remain readable and unchanged.</li>
            <li>The translucent blue bottle, white trigger, neck, dip tube, and one-product count remain present.</li>
            <li>The main color family, complete silhouette, camera view, and neutral studio background remain stable.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Check household label values before publishing</h2>
          <p>Compare the approved pack with the final candidate before a wrong volume or count reaches a product page.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/categories/household-packaged-goods-image-qa">Use the household workflow</Link>
            <Link className="text-link" href="/checks/product-quantity">Review quantity rules</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
