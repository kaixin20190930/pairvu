import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples");

export const metadata: Metadata = pageMetadata(page);

const examples = [
  {
    title: "Main color changes",
    expected: "REVIEW or FAIL when the product or packaging changes semantic color.",
    detail: "Lighting and reflections should not be treated automatically as a different product color.",
  },
  {
    title: "Missing or extra components",
    expected: "REVIEW or FAIL when a major visible part is absent or added.",
    detail: "A component must be observable before Pairvu can distinguish missing from hidden.",
  },
  {
    title: "Packaging and shape changes",
    expected: "FAIL for a material container or packaging-identity change.",
    detail: "Viewpoint and crop differences should not become shape mismatches by themselves.",
  },
  {
    title: "Product count changes",
    expected: "REVIEW or FAIL when the visible number of primary product units changes.",
    detail: "Product count is separate from a printed capacity or weight value.",
  },
];

const featuredCases = [
  {
    href: "/examples/logo-change-ai-product-image",
    title: "Logo changed",
    summary: "A crescent moon becomes a sun while the cosmetics bottle and label remain stable.",
    original: "/examples/logo-change/original.jpg",
    candidate: "/examples/logo-change/candidate.jpg",
    alt: "Cosmetics bottle logo change comparison",
  },
  {
    href: "/examples/label-value-change-ai-product-image",
    title: "Printed value changed",
    summary: "The same beverage design changes from 330 mL to 500 mL.",
    original: "/examples/label-value-change/original.jpg",
    candidate: "/examples/label-value-change/candidate.jpg",
    alt: "Beverage capacity label change comparison",
  },
  {
    href: "/examples/packaging-shape-change-ai-product-image",
    title: "Packaging shape changed",
    summary: "A rounded shampoo bottle becomes rectangular while the label remains stable.",
    original: "/examples/packaging-shape-change/original.jpg",
    candidate: "/examples/packaging-shape-change/candidate.jpg",
    alt: "Shampoo bottle shape change comparison",
  },
  {
    href: "/examples/color-change-ai-product-image",
    title: "Main color changed",
    summary: "An ELARA serum label changes from cream and orange to dark green while its wording stays stable.",
    original: "/examples/color-change/original.jpg",
    candidate: "/examples/color-change/candidate.jpg",
    alt: "Serum label main color change comparison",
  },
  {
    href: "/examples/background-change-ai-product-image",
    title: "Background changed, product matched",
    summary: "An ELARA serum moves into a new setting while the visible product remains faithful to the original.",
    original: "/examples/background-change/original.jpg",
    candidate: "/examples/background-change/candidate.jpg",
    alt: "Serum background change comparison with product unchanged",
  },
  {
    href: "/examples/identical-product-images-pass",
    title: "Identical images passed",
    summary: "The exact same NOVA FIZZ can image is checked against itself without producing a false alarm.",
    original: "/examples/label-value-change/original.jpg",
    candidate: "/examples/label-value-change/original.jpg",
    alt: "Identical NOVA FIZZ product image comparison",
  },
  {
    href: "/examples/lighting-change-product-image",
    title: "Lighting changed, product matched",
    summary: "A MIREVA shampoo moves into warmer light while its visible product identity remains stable.",
    original: "/examples/packaging-shape-change/original.jpg",
    candidate: "/examples/lighting-change/candidate.jpg",
    alt: "Shampoo lighting change comparison with product unchanged",
  },
  {
    href: "/examples/shadow-reflection-change-product-image",
    title: "Shadows and reflections changed",
    summary: "A NOVA FIZZ can gains stronger highlights and window shadows without changing the product.",
    original: "/examples/label-value-change/original.jpg",
    candidate: "/examples/shadow-reflection-change/candidate.jpg",
    alt: "Beverage can shadow and reflection change comparison",
  },
  {
    href: "/examples/product-repositioning-perspective-change",
    title: "Position and perspective changed",
    summary: "A GRAINLY box moves within the frame or turns slightly while the product remains faithful.",
    original: "/examples/product-count-change/original.jpg",
    candidate: "/examples/reposition-perspective/perspective.jpg",
    alt: "Food box position and minor perspective change comparison",
  },
  {
    href: "/examples/missing-product-component-ai-image",
    title: "Spray trigger missing",
    summary: "A BRIGHTLEAF cleaner bottle loses its white trigger sprayer while the bottle and label remain visible.",
    original: "/examples/missing-component/original.jpg",
    candidate: "/examples/missing-component/candidate.jpg",
    alt: "Kitchen cleaner missing spray trigger comparison",
  },
  {
    href: "/examples/extra-product-component-ai-image",
    title: "Extra applicator appeared",
    summary: "An ELARA serum candidate adds a separate white applicator while the approved bottle stays stable.",
    original: "/examples/color-change/original.jpg",
    candidate: "/examples/extra-component/candidate.jpg",
    alt: "Cosmetics serum comparison with an extra applicator",
  },
  {
    href: "/examples/product-count-change-ai-image",
    title: "Product count changed",
    summary: "One GRAINLY food box becomes two matching boxes in the candidate image.",
    original: "/examples/product-count-change/original.jpg",
    candidate: "/examples/product-count-change/candidate.jpg",
    alt: "Food product count change from one box to two comparison",
  },
  {
    href: "/examples/large-viewpoint-difference-product-image",
    title: "Different package face needs review",
    summary: "A cleaner bottle turns from front to back, leaving front-label identity details unverified.",
    original: "/examples/missing-component/original.jpg",
    candidate: "/examples/large-viewpoint/candidate.jpg",
    alt: "Cleaner bottle front and back viewpoint comparison",
  },
  {
    href: "/examples/partially-hidden-product-logo",
    title: "Brand area partially hidden",
    summary: "A sticker covers part of the NOVA FIZZ logo and brand name, so direct verification needs review.",
    original: "/examples/label-value-change/original.jpg",
    candidate: "/examples/partially-hidden-logo/candidate.jpg",
    alt: "Beverage can logo partially hidden by a sticker",
  },
  {
    href: "/examples/unreadable-product-label-text",
    title: "Label text is unreadable",
    summary: "A GRAINLY package keeps its visual design, but pixelated identity text cannot be verified.",
    original: "/examples/product-count-change/original.jpg",
    candidate: "/examples/unreadable-text/candidate.jpg",
    alt: "Readable and pixelated food package label comparison",
  },
  {
    href: "/examples/partially-visible-product-image",
    title: "Product is only partly visible",
    summary: "A close crop preserves the upper bottle but hides label details and the full packaging silhouette.",
    original: "/examples/packaging-shape-change/original.jpg",
    candidate: "/examples/partial-product-coverage/candidate.jpg",
    alt: "Complete and partially cropped shampoo bottle comparison",
  },
];

export default function ExamplesPage() {
  return (
    <main className="content-page">
      <div className="content-container">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Examples", href: page.route },
          ]}
        />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Comparison examples</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            AI product-image errors are not one generic category. The useful question is which visible product
            attribute changed, whether it was observable in both images, and whether that change should stop
            publishing.
          </p>
        </header>

        <section className="article-section wide-article-section" aria-labelledby="real-comparisons">
          <h2 id="real-comparisons">Original and candidate comparisons</h2>
          <p>
            Each public example uses a founder-approved controlled pair with one intended test condition. Open a case
            to see what changed, what stayed stable, and why the observed result was PASS, REVIEW, or FAIL.
          </p>
          <div className="case-card-grid">
            {featuredCases.map((caseItem) => (
              <Link href={caseItem.href} className="case-card" key={caseItem.href}>
                <div className="case-card-images">
                  <Image src={caseItem.original} alt="" width={1000} height={1000} sizes="220px" />
                  <Image src={caseItem.candidate} alt={caseItem.alt} width={1000} height={1000} sizes="220px" />
                </div>
                <div>
                  <span>Controlled example</span>
                  <h3>{caseItem.title}</h3>
                  <p>{caseItem.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="failure-modes">
          <h2 id="failure-modes">Other product fidelity failure modes</h2>
          <div className="example-grid">
            {examples.map((example) => (
              <article key={example.title}>
                <h3>{example.title}</h3>
                <p>
                  <strong>{example.expected}</strong>
                </p>
                <p>{example.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="hard-negatives">
          <h2 id="hard-negatives">Changes that should not automatically fail</h2>
          <p>
            A new background, lighting adjustment, reflection, shadow, repositioning, or minor perspective change can
            leave the product faithful. These hard negatives matter because a useful checker must preserve unchanged
            product attributes instead of reporting every pixel difference.
          </p>
        </section>

        <section className="article-section" aria-labelledby="review-cases">
          <h2 id="review-cases">When REVIEW is the honest result</h2>
          <p>
            Large viewpoint differences, a partially hidden logo, tiny text, incomplete product coverage, or a
            reflection that changes apparent color may prevent a reliable comparison. In these cases, REVIEW is safer
            than pretending the images match or asserting a difference that cannot be observed.
          </p>
        </section>

        <section className="article-section article-cta">
          <h2>Compare your own image pair</h2>
          <p>Use the approved original as the reference and check the final candidate before it is published.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">
              Check image
            </Link>
            <Link className="text-link" href="/ai-product-photography">
              Learn about AI product photography QA
            </Link>
            <Link className="text-link" href="/categories">
              Explore product categories
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
