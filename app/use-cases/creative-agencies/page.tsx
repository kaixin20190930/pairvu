import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/use-cases/creative-agencies");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Creative Agencies", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function CreativeAgenciesUseCasePage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Use case</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            Agencies can use client-approved originals as the reference before delivering AI-assisted product visuals.
            Pairvu adds a focused fidelity checkpoint without changing the agency&apos;s creative or approval process.
          </p>
        </header>

        <section className="article-section" aria-labelledby="handoff">
          <h2 id="handoff">Use the approved source at the delivery handoff</h2>
          <div className="feature-list">
            <article><h3>Brief</h3><p>Capture the approved product reference and the visible details that must remain stable.</p></article>
            <article><h3>Production</h3><p>Create or edit campaign variations without treating the draft as the final source of truth.</p></article>
            <article><h3>Final QA</h3><p>Compare the delivery candidate with the approved original before sending it for client review.</p></article>
            <article><h3>Resolution</h3><p>Send a FAIL back for correction and a REVIEW to the person who can confirm incomplete coverage.</p></article>
          </div>
        </section>

        <section className="article-section" aria-labelledby="example">
          <h2 id="example">Why packaging still needs a direct check</h2>
          <p>
            A final candidate can preserve the label wording, capacity, color, and pump while changing the bottle from
            a rounded cylinder to a rectangular container. That change may not be obvious when a team is reviewing a
            large set of campaign images for composition alone.
          </p>
          <Link className="text-link" href="/examples/packaging-shape-change-ai-product-image">View the packaging comparison example</Link>
        </section>

        <section className="article-section" aria-labelledby="limit">
          <h2 id="limit">A delivery check, not a client-approval substitute</h2>
          <p>
            Pairvu does not approve creative work, confirm a client&apos;s product data, or replace legal, accessibility,
            or rights review. It reports supported visible differences between the supplied reference and candidate.
          </p>
        </section>

        <section className="article-section article-cta">
          <h2>Compare a delivery candidate with the approved source</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/guides/compare-original-and-ai-product-images">Follow the comparison workflow</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
