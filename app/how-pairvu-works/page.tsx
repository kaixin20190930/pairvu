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

        <section className="article-section" aria-labelledby="single-batch">
          <h2 id="single-batch">Start with one pair or a batch of final candidates</h2>
          <p>Use the single-image checker for one approved original and one final candidate. For multiple variations, <Link className="text-link" href="/account/batches/new">start a batch in your account (sign-in required)</Link> and review each candidate against the selected reference. Pairvu checks images you supply; generation and repair happen in your image editor.</p>
          <p>For repeat work, <Link className="text-link" href="/account/products">Saved Products</Link> keep a product name, optional SKU, named front, back, side, or detail views, and reference-version history. Confirm the exact variant and packaging version, then explicitly select a corresponding approved view. A bound batch freezes the selected product-text and reference versions so later changes do not silently replace its standard. Product declarations provide context; they do not rewrite the image checks or prove facts absent from the pixels.</p>
          <p>Follow the <Link className="text-link" href="/guides/compare-original-and-ai-product-images">comparison preparation guide</Link> before running a batch. A front reference and a rear candidate cannot verify the same front-label details merely because they belong to the same SKU.</p>
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

        <section className="article-section" aria-labelledby="evidence">
          <h2 id="evidence">Read the evidence behind the machine result</h2>
          <p>Use the <Link className="text-link" href="/checks/product-logo">logo check</Link> for the approved symbol and wordmark, and the <Link className="text-link" href="/checks/product-label-text">label-text check</Link> for readable names, variants, digits, and units. The <Link className="text-link" href="/checks/product-image-observability">observability rules</Link> explain when crop, blur, or a different package face prevents a decision. A viewpoint change alone is not proof of a product change.</p>
          <p>Compare the controlled <Link className="text-link" href="/examples/logo-change-ai-product-image">logo FAIL</Link>, <Link className="text-link" href="/examples/background-change-ai-product-image">background-only PASS</Link>, and <Link className="text-link" href="/examples/unreadable-product-label-text">unreadable-text REVIEW</Link> examples. They illustrate specific evidence paths, not customer outcomes or an independent accuracy measurement.</p>
        </section>

        <section className="article-section" aria-labelledby="human-release">
          <h2 id="human-release">Keep three decisions distinct</h2>
          <ol className="numbered-checklist">
            <li><strong>Machine result.</strong><p>The original PASS, REVIEW, or FAIL describes supported visible evidence and limitations. An execution error is an error, not a product verdict.</p></li>
            <li><strong>Human decision.</strong><p>In the account review workflow, a reviewer can approve, reject, or revoke a prior decision with a recorded reason. The audit history remains separate from the original machine result; approval does not change that verdict.</p></li>
            <li><strong>Release eligibility.</strong><p>The <Link className="text-link" href="/account/releases">release workbench (sign-in required)</Link> evaluates its versioned rule against machine evidence and the current human decision. Complete supported evidence, available images, and a current approval bound to that evidence are required. High or critical differences, unresolved limitations, incomplete or unsupported evidence, and human rejection block eligibility. No current approval, including after revocation, cannot be eligible.</p></li>
          </ol>
          <p>A machine PASS alone does not authorize release, and a human approval cannot bypass the rule&apos;s evidence requirements. Eligibility is a review status: it does not send images to an ad network, ecommerce platform, or client, and it does not replace your final publishing approval.</p>
        </section>

        <section className="article-section" aria-labelledby="csv">
          <h2 id="csv">Export a record for the next handoff</h2>
          <p>Batch CSV exports provide persisted batch results. Release-workbench CSV exports include machine, human-decision, rule, and eligibility fields plus frozen product/reference versions where bound. That export re-evaluates current decisions for the bounded search page, up to 20 matches; later pages require separate exports. Neither export performs external publication.</p>
          <p>CSV access requires an active paid plan. Review <Link className="text-link" href="/pricing">pricing and batch allowances</Link>, then use the <Link className="text-link" href="/use-cases/creative-agencies">agency delivery workflow</Link> or <Link className="text-link" href="/guides/keep-products-consistent-in-ai-images">consistency guide</Link> to fit the record into your process.</p>
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
          <h2>Compare a final image with its approved reference</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples">Explore comparison examples</Link>
          </div>
        </section>
        <p className="content-updated">Last updated: October 15, 2026</p>
      </div>
    </main>
  );
}
