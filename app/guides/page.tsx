import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { collectionPageSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/guides");

export const metadata: Metadata = pageMetadata(page);

export default function GuidesPage() {
  return (
    <main className="content-page">
      <StructuredData data={collectionPageSchema(page)} />
      <div className="content-container">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Guides", href: page.route },
          ]}
        />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Practical workflows</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            These guides focus on one operational question: how to use AI product imagery without publishing a
            visibly different product.
          </p>
        </header>

        <section className="article-section">
          <div className="link-grid">
            <Link href="/guides/ai-product-photography-checklist">
              <strong>AI product photography pre-publish checklist</strong>
              <span>Review visible identity, count, components, color, packaging, and coverage.</span>
            </Link>
            <Link href="/guides/compare-original-and-ai-product-images">
              <strong>How to compare original and AI product images</strong>
              <span>Use an approved original and final candidate in a clear review order.</span>
            </Link>
            <Link href="/guides/keep-products-consistent-in-ai-images">
              <strong>How to keep products consistent in AI images</strong>
              <span>Separate intended creative variation from meaningful product drift.</span>
            </Link>
            <Link href="/how-pairvu-works">
              <strong>How Pairvu works</strong>
              <span>Understand the comparison method, verdicts, and observability limits.</span>
            </Link>
            <Link href="/examples">
              <strong>Product-change examples</strong>
              <span>Learn which differences should pass, fail, or require human review.</span>
            </Link>
          </div>
        </section>

        <section className="article-section article-cta">
          <h2>Start with the final candidate</h2>
          <p>Run the check after generation and editing, before the image enters a publishing workflow.</p>
          <Link className="primary-link-button" href="/#checker">
            Check image
          </Link>
        </section>
      </div>
    </main>
  );
}
