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

const amazonFaq = [
  {
    question: "Does Pairvu validate Amazon image requirements?",
    answer:
      "No. Pairvu compares visible product fidelity against an approved reference. Amazon requirements, category rules, listing data, and marketplace decisions must be reviewed separately using current Amazon guidance.",
  },
  {
    question: "Does a Pairvu PASS mean an image is ready to publish on Amazon?",
    answer:
      "No. PASS means the observable product attributes supported a fidelity match. The image can still require technical, content, category, or listing review before publication.",
  },
  {
    question: "Which approved original should an Amazon seller use?",
    answer:
      "Use a current, approved image of the exact product and variant represented by the listing. Prefer a comparable package face and view that clearly exposes every attribute the candidate must preserve.",
  },
  {
    question: "Can a lifestyle background change still receive PASS?",
    answer:
      "Yes. A scene change can pass product-fidelity review when the observable logo, text, quantity, color, components, and packaging remain consistent. Amazon suitability remains a separate decision.",
  },
  {
    question: "Why can a back-of-package candidate receive REVIEW instead of FAIL?",
    answer:
      "A front reference and back candidate may not expose corresponding logo, label, or quantity evidence. REVIEW records that those attributes could not be verified; it does not claim that the product changed.",
  },
] as const;

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: amazonFaq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export const metadata: Metadata = pageMetadata(page);

export default function AmazonProductImageQaPage() {
  return (
    <main className="content-page">
      <StructuredData data={[articleSchema(page), faqSchema]} />
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

        <section className="article-section" aria-labelledby="reference-selection">
          <p className="section-label">Reference selection</p>
          <h2 id="reference-selection">Choose evidence for the exact product and image role</h2>
          <p>
            The comparison is only as useful as its approved original. An image for a related size, flavor, scent,
            bundle, or package generation can make a real product difference look acceptable. Before checking a
            candidate, connect it to the exact product represented by the listing and record which visible attributes
            the creative is allowed to change.
          </p>
          <div className="feature-list">
            <article>
              <h3>Match the exact variant</h3>
              <p>Confirm product identity, size, color, flavor, scent, pack count, and packaging generation instead of relying on a similar-looking family image.</p>
            </article>
            <article>
              <h3>Compare corresponding package faces</h3>
              <p>Use a front reference for a front candidate and an approved rear or side view when that package face contains the evidence being reviewed.</p>
            </article>
            <article>
              <h3>Require sufficient product coverage</h3>
              <p>A crop must expose the logo, printed values, closure, included parts, and silhouette needed for the intended decision.</p>
            </article>
            <article>
              <h3>Use a current approved source</h3>
              <p>Replace obsolete references when packaging artwork or physical configuration changes, and do not treat an old approval as the current product truth.</p>
            </article>
          </div>
        </section>

        <section className="article-section" aria-labelledby="image-role-observability">
          <p className="section-label">Image roles and observability</p>
          <h2 id="image-role-observability">A changed scene and a changed package face are not the same problem</h2>
          <div className="comparison-table">
            <div>
              <span>Studio or front-facing image</span>
              <p>Use a corresponding approved front view to compare identity-bearing logo, label wording, printed values, color, and package structure.</p>
            </div>
            <div>
              <span>Lifestyle or contextual image</span>
              <p>The environment, surface, lighting, and composition may change while the observable product itself should remain faithful.</p>
            </div>
            <div>
              <span>Rear, side, or alternate view</span>
              <p>Use an approved view of the same face. A front-only reference cannot establish that hidden rear or side details match.</p>
            </div>
          </div>
          <p>
            The controlled <Link className="text-link" href="/examples/laundry-sheets-background-change">FOLDWELL background-change example</Link>
            {" "}shows a PASS when a laundry-room scene changes but the product remains stable. The
            {" "}<Link className="text-link" href="/examples/laundry-sheets-back-view-review">FOLDWELL back-view example</Link>
            {" "}shows why non-corresponding package faces should produce REVIEW for attributes that are no longer
            observable. Neither verdict determines whether Amazon accepts the image.
          </p>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="verdict-actions">
          <p className="section-label">Publishing decision</p>
          <h2 id="verdict-actions">Route each Pairvu verdict before the Amazon review</h2>
          <div className="decision-table-wrap">
            <table className="decision-table">
              <thead>
                <tr><th>Pairvu verdict</th><th>What the evidence means</th><th>Recommended next action</th></tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">FAIL</th>
                  <td>A corresponding visible product attribute changed, such as the controlled NOVA FIZZ capacity change.</td>
                  <td>Return the candidate for correction and compare the corrected export before marketplace review.</td>
                </tr>
                <tr>
                  <th scope="row">PASS</th>
                  <td>Observable product identity and approval-critical details remained consistent despite permitted presentation changes.</td>
                  <td>Continue to current Amazon image, category, listing, and technical checks. Do not interpret PASS as Amazon approval.</td>
                </tr>
                <tr>
                  <th scope="row">REVIEW</th>
                  <td>A required attribute is hidden, unreadable, shown on a different face, or its intended change is unresolved.</td>
                  <td>Collect a corresponding approved view, a clearer candidate, or human confirmation before deciding whether to publish.</td>
                </tr>
              </tbody>
            </table>
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

        <section className="article-section" aria-labelledby="amazon-faq">
          <p className="section-label">Questions</p>
          <h2 id="amazon-faq">Amazon product image QA FAQ</h2>
          <div className="category-faq-list">
            {amazonFaq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
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
