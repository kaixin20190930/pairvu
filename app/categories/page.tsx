import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { collectionPageSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/categories");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Categories", href: page.route },
];

const publishedCategories = [
  {
    href: "/categories/skincare-product-image-qa",
    title: "Skincare",
    summary: "Check SPF, actives, variants, printed values, closures, applicators, package color, and complete product coverage.",
    original: "/examples/skincare-spf-change/original.png",
    candidate: "/examples/skincare-spf-change/candidate.png",
    alt: "Skincare sun stick SPF value comparison",
  },
  {
    href: "/categories/cosmetics-product-image-qa",
    title: "Cosmetics",
    summary: "Check logos, shade and label colors, printed values, droppers, applicators, and bottle identity.",
    original: "/examples/color-change/original.jpg",
    candidate: "/examples/color-change/candidate.jpg",
    alt: "Cosmetics serum packaging color comparison",
  },
  {
    href: "/categories/beverage-product-image-qa",
    title: "Beverages",
    summary: "Check capacity, flavor and formula text, unit count, multipack structure, reflections, and container identity.",
    original: "/examples/label-value-change/original.jpg",
    candidate: "/examples/label-value-change/candidate.jpg",
    alt: "Beverage can printed capacity comparison",
  },
  {
    href: "/categories/personal-care-product-image-qa",
    title: "Personal Care",
    summary: "Product line text, volume, pumps, caps, bottle shape, lighting, and complete package coverage.",
    original: "/examples/packaging-shape-change/original.jpg",
    candidate: "/examples/packaging-shape-change/candidate.jpg",
    alt: "Personal-care pump bottle packaging shape comparison",
  },
  {
    href: "/categories/packaged-food-product-image-qa",
    title: "Packaged food",
    summary: "Brand and flavor text, net weight, claims, product count, color blocks, and package silhouette.",
    original: "/examples/product-count-change/original.jpg",
    candidate: "/examples/product-count-change/candidate.jpg",
    alt: "One packaged-food box compared with two duplicated boxes",
  },
  {
    href: "/categories/household-packaged-goods-image-qa",
    title: "Household packaged goods",
    summary: "Check intended use, capacity, liquid and label colors, triggers, pumps, closures, components, and package form.",
    original: "/examples/household-capacity-change/original.jpg",
    candidate: "/examples/household-capacity-change/candidate.jpg",
    alt: "Household cleaner front-label capacity comparison",
  },
];

export const metadata: Metadata = pageMetadata(page);

export default function CategoriesPage() {
  return (
    <main className="content-page">
      <StructuredData data={collectionPageSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Product categories</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            Different packaged products expose different visual failure modes. Use the category workflows below to
            decide which visible attributes need approval and which image changes are only presentation differences.
          </p>
        </header>

        <section className="article-section wide-article-section" aria-labelledby="supported-categories">
          <h2 id="supported-categories">Evidence-backed category workflows</h2>
          <p>
            A category page becomes public only after it has category-specific decision rules, controlled evidence for
            PASS, REVIEW, and FAIL, input requirements, limitations, and founder review. The five accepted CPG
            families now meet that standard, with Skincare published as an evidence-backed specialist workflow inside
            the cosmetics boundary.
          </p>
          <div className="case-card-grid">
            {publishedCategories.map((category) => (
              <Link href={category.href} className="case-card" key={category.href}>
                <div className="case-card-images">
                  <Image src={category.original} alt="" width={1000} height={1000} sizes="220px" />
                  <Image src={category.candidate} alt={category.alt} width={1000} height={1000} sizes="220px" />
                </div>
                <div>
                  <span>Category workflow</span>
                  <h3>{category.title}</h3>
                  <p>{category.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="category-boundary">
          <h2 id="category-boundary">Current category boundary</h2>
          <p>
            These five CPG families remain the accepted product boundary; specialist workflows such as Skincare can
            deepen a supported family without silently expanding scope. New category pages require their own decision model,
            founder-reviewed PASS, REVIEW, and FAIL evidence, explicit limitations, and automated quality approval.
            Physical electronics remain deferred and are not implied by this hub.
          </p>
        </section>

        <section className="article-section" aria-labelledby="category-limits">
          <h2 id="category-limits">What these pages do not claim</h2>
          <p>
            Pairvu compares visible product fidelity. It does not certify marketplace compliance, legal claims,
            ingredient accuracy, barcode validity, print production, or the physical product behind the image.
            Electronics, fashion, and video remain outside the current product boundary.
          </p>
        </section>

        <section className="article-section article-cta">
          <h2>Compare your own packaged product</h2>
          <p>Use an approved image as the reference and inspect the final AI-generated or edited candidate.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples">See all comparison examples</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
