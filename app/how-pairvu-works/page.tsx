import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/how-pairvu-works");

export const metadata: Metadata = pageMetadata(page);

export default function HowPairvuWorksPage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container narrow-content">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "How Pairvu Works", href: page.route }]} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Method</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            Pairvu compares a final AI-generated or edited product image with an approved original. It reports visible
            product differences and keeps uncertain or incomplete evidence in REVIEW.
          </p>
        </header>

        <section className="article-section" aria-labelledby="comparison">
          <h2 id="comparison">A reference-to-candidate comparison</h2>
          <ol className="workflow-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Start with an approved original</strong>
                <p>Choose a clear image of the product and variant you intend to represent.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Add the final image to check</strong>
                <p>Use the generated, edited, or candidate image that is about to enter a publishing workflow.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Compare supported visible details</strong>
                <p>Pairvu checks logo, visible text, product count, main color, major components, and packaging shape.</p>
              </div>
            </li>
            <li>
              <span>4</span>
              <div>
                <strong>Route the outcome</strong>
                <p>Use PASS for matching observable details, REVIEW for insufficient coverage, and FAIL for confirmed changes.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="article-section" aria-labelledby="verdicts">
          <h2 id="verdicts">What the verdicts mean</h2>
          <div className="decision-table-wrap">
            <table className="decision-table">
              <thead>
                <tr><th>Verdict</th><th>Meaning</th><th>Recommended action</th></tr>
              </thead>
              <tbody>
                <tr><td>PASS</td><td>Supported details were sufficiently visible and no meaningful change was confirmed.</td><td>Continue your normal review process.</td></tr>
                <tr><td>REVIEW</td><td>A detail is hidden, unreadable, cropped, or not shown on a comparable product face.</td><td>Request a better image or involve a human reviewer.</td></tr>
                <tr><td>FAIL</td><td>A meaningful visible product change was confirmed.</td><td>Correct the candidate before publishing and check again.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="article-section" aria-labelledby="boundaries">
          <h2 id="boundaries">What Pairvu does not decide</h2>
          <p>
            Pairvu does not determine image provenance, authenticity, legal rights, regulatory compliance, marketplace
            approval, or facts that are not visible in the two images. It is a visible product-fidelity checkpoint,
            not a replacement for creative approval or human judgment.
          </p>
        </section>

        <section className="article-section article-cta">
          <h2>See the method on real comparisons</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples">Explore comparison examples</Link>
          </div>
        </section>
        <p className="content-updated">Last updated: July 31, 2026</p>
      </div>
    </main>
  );
}
