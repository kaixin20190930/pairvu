import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/guides/compare-original-and-ai-product-images");

export const metadata: Metadata = pageMetadata(page);

export default function CompareOriginalAndAiProductImagesPage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container narrow-content">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: "Compare Images", href: page.route }]} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Comparison workflow</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            Compare the approved product image with the final candidate, not with a rough draft. This keeps the
            question specific: did the image intended for publication visibly change the product?
          </p>
        </header>

        <section className="article-section" aria-labelledby="prepare">
          <h2 id="prepare">Prepare images that can be compared</h2>
          <ul className="check-list">
            <li>Use the approved image for the exact SKU, label, variant, and package version you want to publish. A similar product or an older label is not the same reference.</li>
            <li>Use the final candidate after background, lighting, composition, and creative edits are complete.</li>
            <li>Keep identity-bearing details large enough to read and avoid comparing unrelated package faces.</li>
            <li>Send a hidden or cropped detail to human review instead of assuming it matches.</li>
          </ul>
          <p>For repeat checks, <Link className="text-link" href="/account/products">Saved Products (sign-in required)</Link> retain named approved views and reference history. Select the corresponding view explicitly when starting a batch; the batch records the selected version. A different viewpoint alone does not prove that the product changed. See <Link className="text-link" href="/checks/product-image-observability">what makes two views comparable</Link>.</p>
        </section>

        <section className="article-section" aria-labelledby="order">
          <h2 id="order">Review in an order that prevents false confidence</h2>
          <ol className="numbered-checklist">
            <li><strong>Identity first.</strong><p>Compare the <Link className="text-link" href="/checks/product-logo">logo and wordmark</Link>, then check the <Link className="text-link" href="/checks/product-label-text">product name, variant wording, and printed values</Link> on corresponding regions. Do not infer unreadable characters.</p></li>
            <li><strong>Physical product next.</strong><p>Compare the count, main color, major parts, and container form. Use the <Link className="text-link" href="/guides/ai-product-photography-checklist">product photography checklist</Link> to record the required attributes.</p></li>
            <li><strong>Coverage last.</strong><p>Confirm both corresponding details are actually visible before calling them a match.</p></li>
          </ol>
        </section>

        <section className="article-section" aria-labelledby="examples">
          <h2 id="examples">Why an overall match is not enough</h2>
          <p>
            A candidate may keep the bottle, can, or box plausible while changing one small but meaningful detail. In
            Pairvu&apos;s controlled public examples, a logo changes while the label remains stable, and a capacity changes while the
            product design remains stable. These examples illustrate specific decisions; they are not customer cases or an accuracy estimate.
          </p>
          <div className="content-actions">
            <Link className="text-link" href="/examples/logo-change-ai-product-image">View the logo comparison</Link>
            <Link className="text-link" href="/examples/label-value-change-ai-product-image">View the printed-value comparison</Link>
            <Link className="text-link" href="/examples/large-viewpoint-difference-product-image">See why front-to-back views need REVIEW</Link>
          </div>
        </section>

        <section className="article-section" aria-labelledby="decision">
          <h2 id="decision">Review the findings before deciding to release</h2>
          <p>Read each observation and limitation, not just the overall verdict. Correct confirmed changes and rerun the final export. For REVIEW, request the missing view or clearer text; a human approval does not make absent machine evidence complete.</p>
          <p>In the account workflow, a reviewer can approve, reject, or revoke a prior decision without rewriting the original machine result. The release workbench evaluates eligibility separately: a machine PASS alone is insufficient, and human approval cannot override high or critical differences, missing evidence, or unresolved limitations. Eligibility does not publish an image externally. See <Link className="text-link" href="/how-pairvu-works">the product method and release boundaries</Link>.</p>
          <p>Pairvu compares supplied visible product evidence. It does not determine whether an image is AI-generated, prove provenance or authenticity, or certify platform compliance. To reduce drift during editing, follow the <Link className="text-link" href="/guides/keep-products-consistent-in-ai-images">product-consistency guide</Link>.</p>
        </section>

        <section className="article-section article-cta">
          <h2>Compare the final candidate before publishing</h2>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the checklist</Link>
          </div>
        </section>
        <p className="content-updated">Last updated: October 15, 2026</p>
      </div>
    </main>
  );
}
