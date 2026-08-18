import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { getCheckPageContent } from "@/lib/seo/check-content";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/checks/product-quantity";
const page = getSeoPage(route);
const content = getCheckPageContent(route);
if (!content) throw new Error(`Missing check content for ${route}`);
const approvedContent = content;

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Checks", href: "/checks" },
  { label: "Product Quantity", href: route },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: approvedContent.faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

const evidenceRoleLabels = {
  product_change: "Quantity changed",
  hard_negative: "Quantity preserved",
  observability: "Quantity not verifiable",
};

export const metadata: Metadata = pageMetadata(page);

export default function ProductQuantityCheckPage() {
  return (
    <main className="content-page check-detail-page">
      <StructuredData data={[articleSchema(page), faqSchema]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero check-detail-hero">
          <p className="eyebrow">Product quantity check</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{approvedContent.deck}</p>
          <p className="category-audience">Built for {approvedContent.audience}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check product quantity</Link>
            <Link className="text-link" href="#quantity-decisions">See the decision rules</Link>
          </div>
        </header>

        <section className="article-section check-direct-answer" aria-labelledby="quantity-answer">
          <p className="section-label">Direct answer</p>
          <h2 id="quantity-answer">How should product quantity be checked?</h2>
          <p>{approvedContent.directAnswer}</p>
          <p>{approvedContent.scopeDistinction}</p>
        </section>

        <section className="article-section" aria-labelledby="quantity-model">
          <p className="section-label">Quantity model</p>
          <h2 id="quantity-model">Five layers of visible quantity evidence</h2>
          <p>
            Name the layer before choosing a verdict. The wrong abstraction can hide a changed printed value, treat a
            harmless reposition as duplication, or confuse a detached component with another sellable package.
          </p>
          <div className="check-dimension-list">
            {approvedContent.dimensions.map((dimension, index) => (
              <article key={dimension.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{dimension.title}</h3><p>{dimension.definition}</p><strong>Example: {dimension.example}</strong></div>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="quantity-diagnostics">
          <p className="section-label">Diagnostic questions</p>
          <h2 id="quantity-diagnostics">Ask these questions before approving the image</h2>
          <div className="use-case-list">
            {approvedContent.diagnosticQuestions.map((item) => (
              <article key={item.question}><h3>{item.question}</h3><p>{item.reason}</p></article>
            ))}
          </div>
        </section>

        <section className="article-section wide-article-section" id="quantity-decisions" aria-labelledby="quantity-decision-heading">
          <p className="section-label">Decision matrix</p>
          <h2 id="quantity-decision-heading">Product quantity PASS, REVIEW, and FAIL rules</h2>
          <p>
            Apply the row that matches the quantity layer under review. The matrix does not override the approved
            offer or current RiskPolicy; it makes the evidence and human decision point explicit.
          </p>
          <div className="decision-table-wrap">
            <table className="decision-table category-decision-table">
              <thead><tr><th scope="col">Condition</th><th scope="col">PASS</th><th scope="col">REVIEW</th><th scope="col">FAIL</th></tr></thead>
              <tbody>{approvedContent.decisionRules.map((rule) => <tr key={rule.condition}><th scope="row">{rule.condition}</th><td>{rule.pass}</td><td>{rule.review}</td><td>{rule.fail}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="quantity-evidence">
          <p className="section-label">Controlled evidence</p>
          <h2 id="quantity-evidence">Four quantity cases, three honest verdicts</h2>
          <p>
            These cases cover exact printed-value drift, changed package count, harmless composition, and unreadable
            quantity text. They demonstrate the decision model without treating one fixture as a benchmark.
          </p>
          <div className="category-evidence-grid">
            {approvedContent.evidence.map((evidence) => (
              <article className="category-evidence-card" key={evidence.href}>
                <div className="case-card-images">
                  <Image src={evidence.original} alt="" width={1000} height={1000} sizes="(max-width: 760px) 50vw, 220px" />
                  <Image src={evidence.candidate} alt={evidence.alt} width={1000} height={1000} sizes="(max-width: 760px) 50vw, 220px" />
                </div>
                <div className="category-evidence-content">
                  <div className="category-evidence-meta"><span>{evidenceRoleLabels[evidence.role]}</span><strong data-decision={evidence.decision}>{evidence.decision}</strong></div>
                  <h3>{evidence.title}</h3>
                  <p><b>Observed:</b> {evidence.observation}</p>
                  <p><b>Why this verdict:</b> {evidence.whyThisDecision}</p>
                  <p><b>Next action:</b> {evidence.nextAction}</p>
                  <Link className="text-link" href={evidence.href}>Open the controlled example</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="quantity-failures">
          <p className="section-label">Failure patterns</p>
          <h2 id="quantity-failures">How AI quantity errors appear in otherwise polished images</h2>
          <div className="category-risk-list">
            {approvedContent.failureModes.map((mode) => (
              <article key={mode.title}><h3>{mode.title}</h3><p>{mode.mechanism}</p><p><strong>Operational consequence:</strong> {mode.consequence}</p></article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="quantity-workflow">
          <p className="section-label">Resolution workflow</p>
          <h2 id="quantity-workflow">A five-step quantity approval process</h2>
          <ol className="numbered-checklist">
            {approvedContent.workflow.map((step) => <li key={step.title}><strong>{step.title}</strong><p>{step.detail}</p></li>)}
          </ol>
        </section>

        <section className="article-section category-boundary" aria-labelledby="quantity-limits">
          <p className="section-label">Scope boundary</p>
          <h2 id="quantity-limits">What this quantity check cannot prove</h2>
          <ul className="check-list">{approvedContent.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="article-section" aria-labelledby="quantity-faq">
          <p className="section-label">Questions</p>
          <h2 id="quantity-faq">Product quantity image QA FAQ</h2>
          <div className="category-faq-list">{approvedContent.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </section>

        <section className="article-section article-cta">
          <h2>Check every quantity layer before the image defines the wrong offer</h2>
          <p>Compare the approved image with the final candidate, then correct confirmed changes or collect better evidence for REVIEW findings.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/checks">See all product checks</Link>
            <Link className="text-link" href="/categories/packaged-food-product-image-qa">Use the Packaged Food workflow</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the pre-publish checklist</Link>
          </div>
        </section>

        <p className="content-updated">Evidence and decision model reviewed {approvedContent.founderApprovedAt}.</p>
      </div>
    </main>
  );
}
