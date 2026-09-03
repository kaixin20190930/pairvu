import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/use-cases/amazon-product-image-qa");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Amazon Sellers", href: page.route },
];

export const metadata: Metadata = pageMetadata(page);

export default function AmazonProductImageQaPage() {
  return (
    <main className="content-page">
      <StructuredData data={articleSchema(page)} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Platform workflow</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            First ask whether the candidate still depicts the approved product. Then perform Amazon&apos;s separate
            listing, category, technical, and content checks.
          </p>
          <p className="platform-disclaimer">
            Pairvu is an independent product and is not affiliated with, endorsed by, or certified by Amazon.
          </p>
        </header>

        <section className="article-section" aria-labelledby="two-checks">
          <p className="section-label">Scope boundary</p>
          <h2 id="two-checks">How Pairvu differs from an Amazon image validator</h2>
          <p>
            If by an Amazon image validator you mean a tool that checks marketplace image rules, it answers a
            different question from Pairvu. Pairvu checks whether the visible product in a candidate image remains
            consistent with a real or approved reference image.
          </p>
          <div className="comparison-table">
            <div>
              <span>Pairvu product-fidelity check</span>
              <p>Did the final image change observable logo, label text, quantity, color, components, or packaging?</p>
            </div>
            <div>
              <span>Amazon image and listing validation</span>
              <p>Does the image meet current Amazon and category-specific requirements for its intended placement?</p>
            </div>
          </div>
          <p>
            Pairvu does not certify Amazon compliance, approve a listing, or predict marketplace acceptance. A Pairvu
            PASS means the observable product evidence matched the approved reference; the same image can still fail
            a separate Amazon requirement.
          </p>
        </section>

        <CaseComparison
          original={{
            src: "/examples/label-value-change/original.jpg",
            alt: "Approved NOVA FIZZ sparkling water can with a printed 330 mL capacity",
            label: "Approved original",
            detail: "NOVA FIZZ · 330 mL",
          }}
          candidate={{
            src: "/examples/label-value-change/candidate.jpg",
            alt: "Controlled NOVA FIZZ candidate with the printed capacity changed to 500 mL",
            label: "Candidate image",
            detail: "NOVA FIZZ · 500 mL",
          }}
        />

        <section className="article-section" aria-labelledby="controlled-comparison">
          <p className="section-label">Controlled comparison</p>
          <h2 id="controlled-comparison">The package looked familiar, but the printed capacity changed</h2>
          <div className="case-fact-grid">
            <div><span>Expected verdict</span><strong>FAIL</strong></div>
            <div><span>Observed verdict</span><strong>FAIL</strong></div>
            <div><span>Confirmed change</span><strong>330 mL to 500 mL</strong></div>
          </div>
          <p>
            This founder-reviewed controlled comparison is not a customer case study or a statistical performance
            claim. The logo, can design, flavor wording, color, and visible product count remain stable, while the
            corresponding printed capacity changes. That is enough to stop the candidate for correction before a
            seller begins the separate Amazon listing review.
          </p>
          <p>
            <Link className="text-link" href="/examples/label-value-change-ai-product-image">
              Review the complete 330 mL-to-500 mL comparison
            </Link>
            , including what changed and what remained stable.
          </p>
        </section>

        <section className="article-section" aria-labelledby="visible-attributes">
          <p className="section-label">Visible evidence</p>
          <h2 id="visible-attributes">Review the product attributes before marketplace validation</h2>
          <p>
            Start with the attributes that identify the approved product. Use the benchmark when you need examples of
            confirmed changes, harmless presentation changes, and evidence that should be routed to REVIEW.
          </p>
          <div className="link-grid">
            <Link href="/checks/product-logo"><strong>Product logo</strong><span>Compare visible brand-mark identity</span></Link>
            <Link href="/checks/product-label-text"><strong>Label text</strong><span>Check wording, variants, and printed values</span></Link>
            <Link href="/checks/product-quantity"><strong>Product quantity</strong><span>Verify counts and pack configuration</span></Link>
            <Link href="/examples/controlled-visual-qa-benchmark"><strong>Controlled benchmark</strong><span>See FAIL, PASS, and REVIEW evidence</span></Link>
          </div>
        </section>

        <section className="article-section" aria-labelledby="seller-workflow">
          <h2 id="seller-workflow">Suggested seller workflow</h2>
          <ol className="workflow-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Confirm the ASIN or product variant</strong>
                <p>Choose an approved original that represents the exact product being listed.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Compare the AI-assisted candidate</strong>
                <p>Review product identity, printed values, count, components, color, and packaging shape.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Apply current Amazon requirements</strong>
                <p>Check the latest general and category-specific image rules in Seller Central.</p>
              </div>
            </li>
            <li>
              <span>4</span>
              <div>
                <strong>Complete listing review</strong>
                <p>Confirm that the images, title, variation, product details, and offer describe the same product.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="article-section" aria-labelledby="official-sources">
          <h2 id="official-sources">Official Amazon sources</h2>
          <p>
            Amazon explains that product-detail pages include images and other product information, and that images
            should give customers an accurate view of what is being sold. Requirements can change and can vary by
            category, so always verify the current rules directly.
          </p>
          <ul className="source-list">
            <li>
              <a href="https://sell.amazon.com/blog/amazon-product-listings" rel="noreferrer">
                Amazon: How to create product listings
              </a>
            </li>
            <li>
              <a
                href="https://sellercentral.amazon.com/seller-forums/discussions/t/4b3c4c39-6f8c-4312-aa0e-99982eb8f5e1/"
                rel="noreferrer"
              >
                Amazon Seller Central: Product image requirements overview
              </a>
            </li>
          </ul>
          <p className="content-updated">Sources reviewed July 30, 2026.</p>
        </section>

        <section className="article-section article-cta">
          <h2>Check product fidelity first</h2>
          <p>Compare the approved product with the final candidate, then apply the current channel requirements.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">
              Check image
            </Link>
            <Link className="text-link" href="/examples">Explore controlled examples</Link>
            <Link className="text-link" href="/ai-product-photography">Review the AI product photography workflow</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
