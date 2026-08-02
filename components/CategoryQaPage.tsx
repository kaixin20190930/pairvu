import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage } from "@/lib/seo/content-registry";

type CategoryRisk = {
  title: string;
  detail: string;
};

type CategoryExample = {
  href: string;
  title: string;
  summary: string;
  original: string;
  candidate: string;
  alt: string;
};

type CategoryQaPageProps = {
  route: string;
  breadcrumbLabel: string;
  deck: string;
  checks: string[];
  risks: CategoryRisk[];
  examples: CategoryExample[];
  workflow: Array<{ title: string; detail: string }>;
  boundary: string;
  ctaTitle: string;
  ctaBody: string;
};

export function CategoryQaPage({
  route,
  breadcrumbLabel,
  deck,
  checks,
  risks,
  examples,
  workflow,
  boundary,
  ctaTitle,
  ctaBody,
}: CategoryQaPageProps) {
  const page = getSeoPage(route);
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Product Categories", href: "/categories" },
    { label: breadcrumbLabel, href: route },
  ];

  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Product category workflow</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{deck}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples">See controlled comparisons</Link>
          </div>
        </header>

        <section className="article-section" aria-labelledby="category-checks">
          <h2 id="category-checks">What to compare before publishing</h2>
          <ul className="check-list">
            {checks.map((check) => <li key={check}>{check}</li>)}
          </ul>
        </section>

        <section className="article-section" aria-labelledby="category-risks">
          <h2 id="category-risks">Common product-fidelity risks</h2>
          <div className="example-grid">
            {risks.map((risk) => (
              <article key={risk.title}>
                <h3>{risk.title}</h3>
                <p>{risk.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="category-evidence">
          <h2 id="category-evidence">Evidence from controlled comparisons</h2>
          <p>
            These examples use founder-approved image pairs from Pairvu&apos;s M0 validation work. They show both
            product changes that require action and presentation changes that should not create a false alarm.
          </p>
          <div className="case-card-grid">
            {examples.map((example) => (
              <Link href={example.href} className="case-card" key={example.href}>
                <div className="case-card-images">
                  <Image src={example.original} alt="" width={1000} height={1000} sizes="220px" />
                  <Image src={example.candidate} alt={example.alt} width={1000} height={1000} sizes="220px" />
                </div>
                <div>
                  <span>Controlled example</span>
                  <h3>{example.title}</h3>
                  <p>{example.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="category-workflow">
          <h2 id="category-workflow">Recommended review workflow</h2>
          <ol className="numbered-checklist">
            {workflow.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="article-section" aria-labelledby="category-boundary">
          <h2 id="category-boundary">Current scope and limits</h2>
          <p>{boundary}</p>
        </section>

        <section className="article-section article-cta">
          <h2>{ctaTitle}</h2>
          <p>{ctaBody}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/categories">Explore product categories</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the pre-publish checklist</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
