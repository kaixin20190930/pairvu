import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/laundry-pouch-color-change");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Laundry Pouch Color", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function LaundryPouchColorChangePage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled product-color example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            The TIDORA pouch keeps the same logo, wording, 24 PODS value, zipper, label, and silhouette, but its
            package body changes from matte reddish orange to glossy pale pink.
          </p>
        </header>

        <CaseComparison
          original={{ src: "/examples/laundry-pouch-color-change/original.png", alt: "Matte orange TIDORA laundry pods pouch", label: "Approved original", detail: "Matte reddish-orange pouch" }}
          candidate={{ src: "/examples/laundry-pouch-color-change/candidate.png", alt: "Glossy pale pink TIDORA laundry pods pouch", label: "Image to check", detail: "Glossy pale-pink pouch" }}
        />

        <section className="article-section" aria-labelledby="pouch-color-change">
          <h2 id="pouch-color-change">What changed</h2>
          <div className="case-fact-grid">
            <div><span>Changed attribute</span><strong>Main package-body color</strong></div>
            <div><span>Observed Pairvu decision</span><strong>REVIEW</strong></div>
            <div><span>Why human intent matters</span><strong>The same artwork may belong to a new approved variant</strong></div>
          </div>
          <p>
            Pairvu recorded a high-confidence color difference while verifying the logo, wording, one-product count,
            resealable-pouch components, and package shape. Under the current M0 policy, a color-only mismatch is a
            high-impact REVIEW rather than an automatic FAIL because the image cannot determine whether the new
            palette is an approved product variant or an unintended generation error.
          </p>
        </section>

        <section className="article-section" aria-labelledby="pouch-color-action">
          <h2 id="pouch-color-action">How to resolve the review</h2>
          <ul className="check-list">
            <li>If the approved product is orange, restore that package body color and rerun the comparison.</li>
            <li>If pale pink is an authorized variant, compare it with an approved pale-pink reference rather than the orange SKU.</li>
            <li>Do not treat identical label wording as proof that a materially different package palette is approved.</li>
          </ul>
        </section>

        <section className="article-section article-cta">
          <h2>Separate a visible color change from its approval intent</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/checks/product-color">Use the Product Color method</Link>
            <Link className="text-link" href="/categories/household-packaged-goods-image-qa">Open the Household workflow</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
