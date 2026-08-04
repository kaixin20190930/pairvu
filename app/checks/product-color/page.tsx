import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { getCheckPageContent } from "@/lib/seo/check-content";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/checks/product-color";
const page = getSeoPage(route);
const content = getCheckPageContent(route);
if (!content) throw new Error(`Missing check content for ${route}`);
const approvedContent = content;

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Checks", href: "/checks" },
  { label: "Product Color", href: route },
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
  product_change: "Product color changed",
  hard_negative: "Product color preserved",
  observability: "Color not fully verifiable",
};

export const metadata: Metadata = pageMetadata(page);

export default function ProductColorCheckPage() {
  return (
    <main className="content-page check-detail-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page), faqSchema]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero check-detail-hero">
          <p className="eyebrow">Product color check</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{approvedContent.deck}</p>
          <p className="category-audience">Built for {approvedContent.audience}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check product color</Link>
            <Link className="text-link" href="#color-decisions">See the decision rules</Link>
          </div>
        </header>

        <section className="article-section check-direct-answer" aria-labelledby="color-answer">
          <p className="section-label">Direct answer</p>
          <h2 id="color-answer">How should product color be checked?</h2>
          <p>{approvedContent.directAnswer}</p>
          <p>{approvedContent.scopeDistinction}</p>
        </section>

        <section className="article-section" aria-labelledby="color-model">
          <p className="section-label">Semantic color evidence model</p>
          <h2 id="color-model">Seven layers that separate product color from scene color</h2>
          <p>
            Compare corresponding product regions and preserve their commercial meaning. Raw pixel difference is not
            enough: color may identify a variant, respond to material and light, or be unavailable because the
            relevant surface is outside the candidate frame.
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

        <section className="article-section" aria-labelledby="color-diagnostics">
          <p className="section-label">Diagnostic questions</p>
          <h2 id="color-diagnostics">Questions that prevent false color alarms</h2>
          <div className="use-case-list">
            {approvedContent.diagnosticQuestions.map((item) => (
              <article key={item.question}><h3>{item.question}</h3><p>{item.reason}</p></article>
            ))}
          </div>
        </section>

        <section className="article-section wide-article-section" id="color-decisions" aria-labelledby="color-decision-heading">
          <p className="section-label">Decision matrix</p>
          <h2 id="color-decision-heading">Product color PASS, REVIEW, and FAIL rules</h2>
          <p>
            PASS a stable observable palette, REVIEW an intent-dependent recoloring or missing color evidence, and
            reserve FAIL for confirmed approval-critical identity drift. A label crop cannot prove a pouch body color.
          </p>
          <div className="decision-table-wrap">
            <table className="decision-table category-decision-table">
              <thead><tr><th scope="col">Condition</th><th scope="col">PASS</th><th scope="col">REVIEW</th><th scope="col">FAIL</th></tr></thead>
              <tbody>{approvedContent.decisionRules.map((rule) => <tr key={rule.condition}><th scope="row">{rule.condition}</th><td>{rule.pass}</td><td>{rule.review}</td><td>{rule.fail}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="color-evidence">
          <p className="section-label">Controlled evidence</p>
          <h2 id="color-evidence">Variant changes, harmless light, and missing coverage</h2>
          <p>
            These real controlled pairs cover the four decisions a production reviewer needs: confirmed variant
            drift, a color-only edit needing intent confirmation, a harmless lighting change, and a crop that removes
            the product surface required for a color verdict.
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

        <section className="article-section" aria-labelledby="color-failures">
          <p className="section-label">Failure patterns</p>
          <h2 id="color-failures">How AI creates color drift and false color evidence</h2>
          <div className="category-risk-list">
            {approvedContent.failureModes.map((mode) => (
              <article key={mode.title}><h3>{mode.title}</h3><p>{mode.mechanism}</p><p><strong>Operational consequence:</strong> {mode.consequence}</p></article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="color-workflow">
          <p className="section-label">Resolution workflow</p>
          <h2 id="color-workflow">A seven-step product color approval process</h2>
          <ol className="numbered-checklist">
            {approvedContent.workflow.map((step) => <li key={step.title}><strong>{step.title}</strong><p>{step.detail}</p></li>)}
          </ol>
        </section>

        <section className="article-section category-boundary" aria-labelledby="color-limits">
          <p className="section-label">Scope boundary</p>
          <h2 id="color-limits">What this visible color check cannot certify</h2>
          <ul className="check-list">{approvedContent.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="article-section" aria-labelledby="color-faq">
          <p className="section-label">Questions</p>
          <h2 id="color-faq">Product color image QA FAQ</h2>
          <div className="category-faq-list">{approvedContent.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </section>

        <section className="article-section article-cta">
          <h2>Approve the product color, not the lighting effect</h2>
          <p>Compare corresponding package regions, confirm variant meaning, and request complete coverage when the required product surface is outside the frame.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/checks">See all product checks</Link>
            <Link className="text-link" href="/categories/cosmetics-product-image-qa">Use the Cosmetics workflow</Link>
            <Link className="text-link" href="/categories/household-packaged-goods-image-qa">Use the Household workflow</Link>
          </div>
        </section>

        <p className="content-updated">Evidence and decision model reviewed {approvedContent.founderApprovedAt}.</p>
      </div>
    </main>
  );
}
