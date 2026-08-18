import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/product-repositioning-perspective-change");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Position and Perspective", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function ProductRepositioningPerspectiveCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Controlled comparison example</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            Two GRAINLY candidates change presentation without changing the product. One adds a slight perspective;
            the other moves and scales the box within the frame.
          </p>
        </header>

        <section className="article-section wide-article-section" aria-labelledby="perspective-comparison">
          <h2 id="perspective-comparison">Minor perspective change</h2>
          <p>The candidate reveals a small side edge while preserving the same front panel, wording, colors, and box.</p>
          <CaseComparison
            original={{
              src: "/examples/product-count-change/original.jpg",
              alt: "Approved front-facing GRAINLY Honey Oat Bites box",
              label: "Approved original",
              detail: "Front-facing product box",
            }}
            candidate={{
              src: "/examples/reposition-perspective/perspective.jpg",
              alt: "GRAINLY Honey Oat Bites box shown from a minor angle",
              label: "Image to check",
              detail: "Same box at a slight angle",
            }}
          />
        </section>

        <section className="article-section wide-article-section" aria-labelledby="repositioning-comparison">
          <h2 id="repositioning-comparison">Product repositioning</h2>
          <p>The product becomes smaller and moves left, but its visible identity and package design remain unchanged.</p>
          <CaseComparison
            original={{
              src: "/examples/product-count-change/original.jpg",
              alt: "Approved centered GRAINLY Honey Oat Bites box",
              label: "Approved original",
              detail: "Centered product box",
            }}
            candidate={{
              src: "/examples/reposition-perspective/repositioned.jpg",
              alt: "GRAINLY Honey Oat Bites box moved left and shown smaller in the frame",
              label: "Image to check",
              detail: "Same box moved within the frame",
            }}
          />
        </section>

        <section className="article-section" aria-labelledby="observed-result">
          <h2 id="observed-result">Why both comparisons pass</h2>
          <div className="case-fact-grid">
            <div><span>Changed attribute</span><strong>Position and viewpoint</strong></div>
            <div><span>Observed Pairvu decision</span><strong>PASS</strong></div>
            <div><span>Why it matters</span><strong>Presentation is not identity</strong></div>
          </div>
          <p>
            Pairvu preserved the match because GRAINLY, HONEY OAT BITES, WHOLE GRAIN, 300 g, the color blocks, product
            count, and rectangular packaging remain observable and consistent. A useful checker should not report a
            product error merely because a creative places the same item elsewhere in the composition.
          </p>
        </section>

        <section className="article-section article-cta">
          <h2>Check a recomposed product image</h2>
          <p>Compare the product itself while allowing normal changes in framing, scale, and camera angle.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples/lighting-change-product-image">See a lighting-change PASS</Link>
            <Link className="text-link" href="/examples">See all comparison examples</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
