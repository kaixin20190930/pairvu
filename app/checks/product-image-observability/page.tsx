import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { getCheckPageContent } from "@/lib/seo/check-content";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/checks/product-image-observability";
const page = getSeoPage(route);
const content = getCheckPageContent(route);
if (!content) throw new Error(`Missing check content for ${route}`);
const approvedContent = content;

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Checks", href: "/checks" },
  { label: "Product Image Observability", href: route },
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
  product_change: "Confirmed difference with complete evidence",
  hard_negative: "Presentation changed, evidence preserved",
  observability: "Required evidence unavailable",
};

export const metadata: Metadata = pageMetadata(page);

export default function ProductImageObservabilityCheckPage() {
  return (
    <main className="content-page check-detail-page">
      <StructuredData data={[articleSchema(page), faqSchema]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero check-detail-hero">
          <p className="eyebrow">Product image evidence check</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{approvedContent.deck}</p>
          <p className="category-audience">Built for {approvedContent.audience}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check an image pair</Link>
            <Link className="text-link" href="#observability-decisions">See the decision rules</Link>
          </div>
        </header>

        <section className="article-section check-direct-answer" aria-labelledby="observability-answer">
          <p className="section-label">Direct answer</p>
          <h2 id="observability-answer">When is a product image observable enough to verify?</h2>
          <p>{approvedContent.directAnswer}</p>
          <p>{approvedContent.scopeDistinction}</p>
        </section>

        <section className="article-section" aria-labelledby="recognition-verification">
          <p className="section-label">Core distinction</p>
          <h2 id="recognition-verification">Recognition is not verification</h2>
          <div className="comparison-table check-family-model">
            <div><span>Recognizable</span><h3>The product looks familiar</h3><p>Brand colors, package category, or part of a label may identify the likely product without exposing every approval-critical detail.</p></div>
            <div><span>Observable</span><h3>The required evidence is available</h3><p>Corresponding regions, complete boundaries, readable information, and sufficient lighting support a direct attribute-level comparison.</p></div>
            <div><span>Verified</span><h3>The observable evidence was compared</h3><p>Each required attribute can then match, require review, or contain a confirmed difference without guessing about missing pixels.</p></div>
          </div>
        </section>

        <section className="article-section" aria-labelledby="observability-model">
          <p className="section-label">Evidence model</p>
          <h2 id="observability-model">Seven conditions for reliable product comparison</h2>
          <p>Evaluate observability for the approval question at hand. The same candidate may fully expose its logo while hiding the package body, closure, printed quantity, or included accessory.</p>
          <div className="check-dimension-list">
            {approvedContent.dimensions.map((dimension, index) => (
              <article key={dimension.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{dimension.title}</h3><p>{dimension.definition}</p><strong>Example: {dimension.example}</strong></div>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="observability-diagnostics">
          <p className="section-label">Diagnostic questions</p>
          <h2 id="observability-diagnostics">Questions to ask before trusting a verdict</h2>
          <div className="use-case-list">
            {approvedContent.diagnosticQuestions.map((item) => <article key={item.question}><h3>{item.question}</h3><p>{item.reason}</p></article>)}
          </div>
        </section>

        <section className="article-section wide-article-section" id="observability-decisions" aria-labelledby="observability-decision-heading">
          <p className="section-label">Decision matrix</p>
          <h2 id="observability-decision-heading">Observability-aware PASS, REVIEW, and FAIL rules</h2>
          <p>Use REVIEW for missing evidence, not as a softer word for a confirmed difference. Use FAIL only when corresponding visible evidence establishes an approval-critical change.</p>
          <div className="decision-table-wrap">
            <table className="decision-table category-decision-table observability-decision-table">
              <thead><tr><th scope="col">Condition</th><th scope="col">PASS</th><th scope="col">REVIEW</th><th scope="col">FAIL</th></tr></thead>
              <tbody>{approvedContent.decisionRules.map((rule) => <tr key={rule.condition}><th scope="row">{rule.condition}</th><td data-label="PASS">{rule.pass}</td><td data-label="REVIEW">{rule.review}</td><td data-label="FAIL">{rule.fail}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="observability-evidence">
          <p className="section-label">Controlled evidence</p>
          <h2 id="observability-evidence">Complete evidence, harmless presentation, and honest limitations</h2>
          <p>These pairs demonstrate four different evidence states: a confirmed visible difference, a visual treatment that preserves verifiability, a non-corresponding viewpoint, and a crop that supports only part of the product model.</p>
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

        <section className="article-section" aria-labelledby="attribute-coverage">
          <p className="section-label">Attribute-level outcome</p>
          <h2 id="attribute-coverage">One pair can verify some checks and limit others</h2>
          <p>A useful result does not flatten the whole image into observable or unobservable. It records the strongest supported conclusion for every required attribute.</p>
          <div className="case-fact-grid">
            <div><span>Logo and visible text</span><strong>May pass from a corresponding readable label crop</strong></div>
            <div><span>Color, packaging, and components</span><strong>May review when the product body or boundaries are outside frame</strong></div>
            <div><span>Confirmed visible difference</span><strong>Can fail while separate hidden attributes remain limitations</strong></div>
          </div>
        </section>

        <section className="article-section" aria-labelledby="observability-failures">
          <p className="section-label">Failure patterns</p>
          <h2 id="observability-failures">How unreliable conclusions are created</h2>
          <div className="category-risk-list">
            {approvedContent.failureModes.map((mode) => <article key={mode.title}><h3>{mode.title}</h3><p>{mode.mechanism}</p><p><strong>Operational consequence:</strong> {mode.consequence}</p></article>)}
          </div>
        </section>

        <section className="article-section" aria-labelledby="observability-workflow">
          <p className="section-label">Resolution workflow</p>
          <h2 id="observability-workflow">A seven-step evidence approval process</h2>
          <ol className="numbered-checklist">
            {approvedContent.workflow.map((step) => <li key={step.title}><strong>{step.title}</strong><p>{step.detail}</p></li>)}
          </ol>
        </section>

        <section className="article-section category-boundary" aria-labelledby="observability-limits">
          <p className="section-label">Scope boundary</p>
          <h2 id="observability-limits">What image observability cannot certify</h2>
          <ul className="check-list">{approvedContent.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="article-section" aria-labelledby="observability-faq">
          <p className="section-label">Questions</p>
          <h2 id="observability-faq">Product image observability FAQ</h2>
          <div className="category-faq-list">{approvedContent.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </section>

        <section className="article-section article-cta">
          <h2>Request evidence instead of guessing</h2>
          <p>Use a corresponding view, complete crop, readable export, and unobstructed product region before approving an attribute that the current pair cannot prove.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/checks">See all product checks</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the pre-publish checklist</Link>
            <Link className="text-link" href="/examples">Browse controlled examples</Link>
          </div>
        </section>

        <p className="content-updated">Evidence and decision model reviewed {approvedContent.founderApprovedAt}.</p>
      </div>
    </main>
  );
}
