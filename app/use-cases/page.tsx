import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/use-cases");

export const metadata: Metadata = pageMetadata(page);

const useCases = [
  {
    id: "ecommerce",
    href: "/use-cases/ecommerce-product-image-qa",
    title: "Ecommerce teams",
    copy: "Compare final product imagery with approved source assets before it reaches a catalog, campaign, or product-detail page.",
  },
  {
    id: "amazon",
    href: "/use-cases/amazon-product-image-qa",
    title: "Amazon sellers",
    copy: "Check visible product fidelity before applying Amazon's separate image and listing requirements. Pairvu is not affiliated with Amazon and does not guarantee listing acceptance.",
  },
  {
    id: "shopify",
    href: "/use-cases/shopify-product-image-qa",
    title: "Shopify stores",
    copy: "Add a consistent reference check between creative production and publishing product media in the store.",
  },
  {
    id: "brands",
    href: "/use-cases#brands",
    title: "Brands",
    copy: "Protect brand marks, label wording, variants, package shape, and product identity across generated campaign assets.",
  },
  {
    id: "agencies",
    href: "/use-cases#agencies",
    title: "Creative agencies",
    copy: "Use client-approved originals as the comparison source before delivering AI-assisted product visuals.",
  },
];

export default function UseCasesPage() {
  return (
    <main className="content-page">
      <div className="content-container">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Use Cases", href: page.route },
          ]}
        />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Pre-publish workflows</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            Pairvu is a product-image quality-control step, not a publishing platform. Teams use it after generation
            or editing and before the final marketplace, store, campaign, or client approval process.
          </p>
        </header>

        <section className="article-section" aria-labelledby="workflow">
          <h2 id="workflow">One comparison pattern, different workflows</h2>
          <div className="use-case-list">
            {useCases.map((useCase) => (
              <article key={useCase.id} id={useCase.id}>
                <h3>{useCase.title}</h3>
                <p>{useCase.copy}</p>
                <Link className="text-link" href={useCase.href}>
                  {useCase.href.includes("#") ? "View workflow fit" : "Open workflow"}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="boundary">
          <h2 id="boundary">What Pairvu does not replace</h2>
          <p>
            Pairvu does not replace creative approval, legal review, marketplace policy checks, accessibility review,
            or product-data governance. It reports supported visible differences and honest observability limits.
          </p>
        </section>

        <section className="article-section article-cta">
          <h2>Add Pairvu before publishing</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">
              Check image
            </Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">
              Use the checklist
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
