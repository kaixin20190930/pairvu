import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/household-cleaner-background-change");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Household Background Change", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function HouseholdCleanerBackgroundChangePage() {
  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled household product example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The approved cleaner moves from a neutral studio into a bright kitchen. Its bottle, label, 750 mL value,
            trigger, liquid color, and product count remain visibly faithful, so the scene change does not create a
            product issue.
          </p>
        </header>

        <CaseComparison
          original={{
            src: "/examples/household-background-change/original.jpg",
            alt: "Approved BRIGHTLEAF kitchen cleaner bottle on a neutral studio background",
            label: "Approved original",
            detail: "Neutral studio setting",
          }}
          candidate={{
            src: "/examples/household-background-change/candidate.jpg",
            alt: "The same BRIGHTLEAF kitchen cleaner bottle on a bright kitchen counter",
            label: "Image to check",
            detail: "Bright kitchen setting",
          }}
        />

        <section className="article-section" aria-labelledby="household-background-result">
          <h2 id="household-background-result">Why the result is PASS</h2>
          <div className="case-fact-grid">
            <div><span>Changed attribute</span><strong>Environment only</strong></div>
            <div><span>Observed Pairvu decision</span><strong>PASS</strong></div>
            <div><span>Verified product</span><strong>All six check families matched</strong></div>
          </div>
          <p>
            This is a household-product hard negative. A checker should allow useful creative variation when the
            product remains accurate. Pairvu found no confirmed fidelity issue and no observability limitation, even
            though the background, countertop, plant, daylight, and natural contact shadow differ.
          </p>
        </section>

        <section className="article-section" aria-labelledby="household-background-stable">
          <h2 id="household-background-stable">What was verified</h2>
          <ul className="check-list">
            <li>The leaf-and-sparkle logo, BRIGHTLEAF name, KITCHEN CLEANER, CITRUS, and 750 mL all match.</li>
            <li>One complete bottle remains visible with the same white trigger, ribbed neck, and internal dip tube.</li>
            <li>The light-blue liquid, transparent container, front label, and package silhouette remain consistent.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Change the scene without changing the product</h2>
          <p>Use an approved original to distinguish harmless creative treatment from product drift.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/categories/household-packaged-goods-image-qa">Use the household workflow</Link>
            <Link className="text-link" href="/examples/household-cleaner-capacity-change">See the capacity failure</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
