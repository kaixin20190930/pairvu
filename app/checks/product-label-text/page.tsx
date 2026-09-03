import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { getCheckPageContent } from "@/lib/seo/check-content";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/checks/product-label-text";
const page = getSeoPage(route);
const content = getCheckPageContent(route);
if (!content) throw new Error(`Missing check content for ${route}`);
const approvedContent = content;

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Checks", href: "/checks" },
  { label: "Product Label Text", href: route },
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
  product_change: "Readable text changed",
  hard_negative: "Readable text preserved",
  observability: "Text not fully verifiable",
};

export const metadata: Metadata = pageMetadata(page);

export default function ProductLabelTextCheckPage() {
  return (
    <main className="content-page check-detail-page">
      <StructuredData data={[articleSchema(page), faqSchema]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero check-detail-hero">
          <p className="eyebrow">Product label text check</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{approvedContent.deck}</p>
          <p className="category-audience">Built for {approvedContent.audience}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check product label text</Link>
            <Link className="text-link" href="#label-text-decisions">See the decision rules</Link>
          </div>
        </header>

        <section className="article-section check-direct-answer" aria-labelledby="label-text-answer">
          <p className="section-label">Direct answer</p>
          <h2 id="label-text-answer">How should product label text be checked?</h2>
          <p>{approvedContent.directAnswer}</p>
          <p>{approvedContent.scopeDistinction}</p>
        </section>

        <section className="article-section" aria-labelledby="label-text-model">
          <p className="section-label">Text evidence model</p>
          <h2 id="label-text-model">Five label-text layers with different approval risk</h2>
          <p>
            Read the package by semantic block instead of treating all lettering as one texture. This reveals whether
            AI changed identity, a variant, a claim, an exact value, or only the photographic appearance of unchanged words.
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

        <section className="article-section" aria-labelledby="label-text-diagnostics">
          <p className="section-label">Diagnostic questions</p>
          <h2 id="label-text-diagnostics">Questions that prevent both missed changes and false alarms</h2>
          <div className="use-case-list">
            {approvedContent.diagnosticQuestions.map((item) => (
              <article key={item.question}><h3>{item.question}</h3><p>{item.reason}</p></article>
            ))}
          </div>
        </section>

        <section className="article-section wide-article-section" id="label-text-decisions" aria-labelledby="label-text-decision-heading">
          <p className="section-label">Decision matrix</p>
          <h2 id="label-text-decision-heading">Product label text PASS, REVIEW, and FAIL rules</h2>
          <p>
            Use FAIL only for confirmed readable differences on corresponding package regions. REVIEW is the required
            result when the pixels or viewpoint cannot support an exact comparison; it is not a softer name for a mismatch.
          </p>
          <div className="decision-table-wrap">
            <table className="decision-table category-decision-table">
              <thead><tr><th scope="col">Condition</th><th scope="col">PASS</th><th scope="col">REVIEW</th><th scope="col">FAIL</th></tr></thead>
              <tbody>{approvedContent.decisionRules.map((rule) => <tr key={rule.condition}><th scope="row">{rule.condition}</th><td>{rule.pass}</td><td>{rule.review}</td><td>{rule.fail}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="label-text-evidence">
          <p className="section-label">Controlled evidence</p>
          <h2 id="label-text-evidence">Readable change, clean match, and two kinds of missing evidence</h2>
          <p>
            The four cases deliberately separate a confirmed value change from an identical baseline, non-corresponding
            package faces, and incomplete crop coverage. Together they show why text appearance alone cannot determine a verdict.
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

        <section className="article-section" aria-labelledby="label-text-related-decisions">
          <p className="section-label">Related decisions</p>
          <h2 id="label-text-related-decisions">Connect readable wording to identity and quantity</h2>
          <p>
            Use the <Link className="text-link" href="/checks/product-logo">product-logo check</Link> when a wordmark or
            symbol carries the identity decision, and use the {" "}
            <Link className="text-link" href="/checks/product-quantity">quantity check</Link> when text describes pack
            count, volume, or included units. Open the {" "}
            <Link className="text-link" href="/examples">controlled example library</Link> for individual cases or the
            {" "}<Link className="text-link" href="/examples/controlled-visual-qa-benchmark">controlled benchmark</Link>
            {" "}for the complete evidence matrix.
          </p>
        </section>

        <section className="article-section" aria-labelledby="label-text-failures">
          <p className="section-label">Failure patterns</p>
          <h2 id="label-text-failures">How packaging copy fails while the design still looks convincing</h2>
          <div className="category-risk-list">
            {approvedContent.failureModes.map((mode) => (
              <article key={mode.title}><h3>{mode.title}</h3><p>{mode.mechanism}</p><p><strong>Operational consequence:</strong> {mode.consequence}</p></article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="label-text-workflow">
          <p className="section-label">Resolution workflow</p>
          <h2 id="label-text-workflow">A five-step label-text approval process</h2>
          <ol className="numbered-checklist">
            {approvedContent.workflow.map((step) => <li key={step.title}><strong>{step.title}</strong><p>{step.detail}</p></li>)}
          </ol>
        </section>

        <section className="article-section category-boundary" aria-labelledby="label-text-limits">
          <p className="section-label">Scope boundary</p>
          <h2 id="label-text-limits">What this visible-text check cannot certify</h2>
          <ul className="check-list">{approvedContent.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="article-section" aria-labelledby="label-text-faq">
          <p className="section-label">Questions</p>
          <h2 id="label-text-faq">Product label text image QA FAQ</h2>
          <div className="category-faq-list">{approvedContent.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </section>

        <section className="article-section article-cta">
          <h2>Approve the words, not just the look of the label</h2>
          <p>Compare the approved package image with the final export, then correct readable drift or request the exact view needed to resolve uncertain text.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/checks">See all product checks</Link>
            <Link className="text-link" href="/categories/cosmetics-product-image-qa">Use the Cosmetics workflow</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the pre-publish checklist</Link>
          </div>
        </section>

        <p className="content-updated">Evidence and decision model reviewed {approvedContent.founderApprovedAt}.</p>
      </div>
    </main>
  );
}
