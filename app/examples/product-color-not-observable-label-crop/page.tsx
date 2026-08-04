import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/product-color-not-observable-label-crop");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Color Outside the Crop", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function ProductColorNotObservableLabelCropPage() {
  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled observability example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The candidate preserves the readable TIDORA label but crops away the color-bearing pouch body, closure,
            outer boundaries, and complete silhouette. Recognition remains possible; complete product verification does not.
          </p>
        </header>

        <CaseComparison
          original={{ src: "/examples/product-color-label-crop/original.png", alt: "Complete orange TIDORA laundry pods pouch", label: "Approved original", detail: "Complete pouch and orange body visible" }}
          candidate={{ src: "/examples/product-color-label-crop/candidate.png", alt: "Close crop showing only the white TIDORA label", label: "Image to check", detail: "Label close-up; package body outside frame" }}
        />

        <section className="article-section" aria-labelledby="crop-observation">
          <h2 id="crop-observation">What can and cannot be verified</h2>
          <div className="case-fact-grid">
            <div><span>Verified</span><strong>Logo and visible label text</strong></div>
            <div><span>Observed Pairvu decision</span><strong>REVIEW</strong></div>
            <div><span>Not observable</span><strong>Main color, major components, and package shape</strong></div>
          </div>
          <p>
            Prompt version m0-real-mvp-008 and QA Engine m0-qa-engine-004 prevent missing coverage from becoming a
            false color or component mismatch. The candidate supplies enough corresponding label evidence to verify
            TIDORA, LAUNDRY PODS, CLEAN COTTON, and 24 PODS, but not enough product-body evidence to verify the
            dominant orange color or complete pouch construction.
          </p>
        </section>

        <section className="article-section" aria-labelledby="crop-not-change">
          <h2 id="crop-not-change">Why this is not a confirmed color change</h2>
          <p>
            The white area is the same front label visible in the approved original. Comparing that label with the
            reference&apos;s orange pouch body would compare different product regions. The correct response is to
            identify the missing color-bearing region and request a complete candidate, not to claim that orange became white.
          </p>
        </section>

        <section className="article-section article-cta">
          <h2>Request the missing product coverage</h2>
          <p>Use a candidate that shows the complete color-bearing package region before approving product-color fidelity.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/checks/product-color">Use the Product Color method</Link>
            <Link className="text-link" href="/examples/laundry-pouch-color-change">See a confirmed color change</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
