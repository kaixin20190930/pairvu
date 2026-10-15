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
          <h2 id="handoff">From the client brief to a recorded delivery decision</h2>
          <div className="feature-list">
            <article><h3>1. Freeze the brief and reference</h3><p>Confirm the client-approved SKU, variant, packaging version, required views, and allowed scene changes. Keep named approved views and reference history in <Link className="text-link" href="/account/products">Saved Products (sign-in required)</Link>.</p></article>
            <article><h3>2. Generate or edit outside Pairvu</h3><p>Create campaign variations in your creative tools. Use the <Link className="text-link" href="/guides/keep-products-consistent-in-ai-images">product-consistency guide</Link> to protect identity while changing backgrounds, props, or composition. Check the final resized export.</p></article>
            <article><h3>3. Run batch QA</h3><p>Open <Link className="text-link" href="/account/batches/new">a batch check (sign-in required)</Link> with the approved reference and candidate variations. Choose the corresponding reference view and selected checks. Prioritize the <Link className="text-link" href="/checks/product-logo">logo</Link> and <Link className="text-link" href="/checks/product-label-text">label-text checks</Link> when small identity details carry approval risk.</p></article>
            <article><h3>4. Resolve and review</h3><p>Inspect individual results and limitations. Correct confirmed changes, request missing evidence for REVIEW, and rerun corrected assets. Record human approval or rejection; revoke a prior decision when it is no longer valid. These decisions preserve the original machine evidence.</p></article>
            <article><h3>5. Prepare the delivery record</h3><p>Review <Link className="text-link" href="/account/releases">release eligibility in the account workbench</Link> separately from the machine verdict and human decision. Export available CSV records on an active paid plan, and attach the relevant record to your client handoff.</p></article>
          </div>
        </section>

        <section className="article-section" aria-labelledby="example">
          <h2 id="example">Why packaging still needs a direct check</h2>
          <p>
            A final candidate can preserve the label wording, capacity, color, and pump while changing the bottle from
            a rounded cylinder to a rectangular container. That change may not be obvious when a team is reviewing a
            large set of campaign images for composition alone. This is a controlled comparison, not a customer delivery claim.
          </p>
          <Link className="text-link" href="/examples/packaging-shape-change-ai-product-image">View the packaging comparison example</Link>
          <p>For a successful scene-only change, compare the <Link className="text-link" href="/examples/background-change-ai-product-image">controlled background PASS example</Link>. A <Link className="text-link" href="/examples/unreadable-product-label-text">blurred label needs REVIEW</Link> even when the composition is ready for the client.</p>
        </section>

        <section className="article-section" aria-labelledby="limit">
          <h2 id="limit">Keep eligibility, client approval, and publication separate</h2>
          <p>
            Pairvu does not approve creative work, confirm a client&apos;s product data, or replace legal, accessibility,
            or rights review. It reports supported visible differences between the supplied reference and candidate.
            A machine PASS alone does not establish release eligibility. Current human approval is required, and
            high or critical differences, missing evidence, or unresolved limitations cannot be cleared by that approval.
            Eligibility does not substitute for client sign-off or automatically publish to advertising or ecommerce platforms.
          </p>
          <p>Batch CSV and release-workbench CSV serve different records. The release export re-evaluates the current decisions for the bounded search page (up to 20 matches); export later pages separately. CSV is a handoff record, not a platform publishing integration. Check <Link className="text-link" href="/pricing">plan allowances and CSV access</Link>, and read <Link className="text-link" href="/how-pairvu-works">how machine results, human decisions, and eligibility fit together</Link>.</p>
        </section>
        <section className="article-section article-cta">
          <h2>Compare a delivery candidate with the approved source</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/guides/compare-original-and-ai-product-images">Follow the comparison workflow</Link>
          </div>
        </section>
        <p className="content-updated">Last updated: October 15, 2026</p>
      </div>
    </main>
  );
}
