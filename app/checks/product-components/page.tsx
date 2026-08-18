import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { getCheckPageContent } from "@/lib/seo/check-content";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/checks/product-components";
const page = getSeoPage(route);
const content = getCheckPageContent(route);
if (!content) throw new Error(`Missing check content for ${route}`);
const approvedContent = content;

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Checks", href: "/checks" },
  { label: "Product Components", href: route },
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
  product_change: "Visible set changed",
  hard_negative: "Complete set preserved",
  observability: "Component not fully observable",
};

export const metadata: Metadata = pageMetadata(page);

export default function ProductComponentsCheckPage() {
  return (
    <main className="content-page check-detail-page">
      <StructuredData data={[articleSchema(page), faqSchema]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero check-detail-hero">
          <p className="eyebrow">Product components check</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{approvedContent.deck}</p>
          <p className="category-audience">Built for {approvedContent.audience}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check product components</Link>
            <Link className="text-link" href="#component-decisions">See the decision rules</Link>
          </div>
        </header>

        <section className="article-section check-direct-answer" aria-labelledby="component-answer">
          <p className="section-label">Direct answer</p>
          <h2 id="component-answer">How should product components be checked?</h2>
          <p>{approvedContent.directAnswer}</p>
          <p>{approvedContent.scopeDistinction}</p>
        </section>

        <section className="article-section" aria-labelledby="component-model">
          <p className="section-label">Component evidence model</p>
          <h2 id="component-model">Six layers that define the visible product set</h2>
          <p>Start with the primary body, then inventory attached hardware and separate accessories. The final layer asks whether the candidate actually exposes enough of the approved set to support a decision.</p>
          <div className="check-dimension-list">
            {approvedContent.dimensions.map((dimension, index) => (
              <article key={dimension.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{dimension.title}</h3><p>{dimension.definition}</p><strong>Example: {dimension.example}</strong></div>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="component-diagnostics">
          <p className="section-label">Diagnostic questions</p>
          <h2 id="component-diagnostics">Questions that separate absence from uncertainty</h2>
          <div className="use-case-list">
            {approvedContent.diagnosticQuestions.map((item) => <article key={item.question}><h3>{item.question}</h3><p>{item.reason}</p></article>)}
          </div>
        </section>

        <section className="article-section wide-article-section" id="component-decisions" aria-labelledby="component-decision-heading">
          <p className="section-label">Decision matrix</p>
          <h2 id="component-decision-heading">Product component PASS, REVIEW, and FAIL rules</h2>
          <p>PASS a complete observable set. REVIEW additions whose intent is unknown and any part hidden by crop or occlusion. Use FAIL only when critical identity evidence or an approved policy confirms an unacceptable set difference.</p>
          <div className="decision-table-wrap">
            <table className="decision-table category-decision-table">
              <thead><tr><th scope="col">Condition</th><th scope="col">PASS</th><th scope="col">REVIEW</th><th scope="col">FAIL</th></tr></thead>
              <tbody>{approvedContent.decisionRules.map((rule) => <tr key={rule.condition}><th scope="row">{rule.condition}</th><td>{rule.pass}</td><td>{rule.review}</td><td>{rule.fail}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="component-evidence">
          <p className="section-label">Production evidence</p>
          <h2 id="component-evidence">Removal, scene change, missing coverage, and addition</h2>
          <p>These four founder-approved EMBERNOOK comparisons were run through the real production Pairvu flow. Together they show why a checker must distinguish what changed from what could not be observed.</p>
          <div className="category-evidence-grid">
            {approvedContent.evidence.map((evidence) => (
              <article className="category-evidence-card" key={evidence.href}>
                <div className="case-card-images">
                  <Image src={evidence.original} alt="" width={1536} height={1536} sizes="(max-width: 760px) 50vw, 220px" />
                  <Image src={evidence.candidate} alt={evidence.alt} width={1536} height={1536} sizes="(max-width: 760px) 50vw, 220px" />
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

        <section className="article-section" aria-labelledby="component-failures">
          <p className="section-label">Failure patterns</p>
          <h2 id="component-failures">How AI changes what the image says is included</h2>
          <div className="category-risk-list">
            {approvedContent.failureModes.map((mode) => <article key={mode.title}><h3>{mode.title}</h3><p>{mode.mechanism}</p><p><strong>Operational consequence:</strong> {mode.consequence}</p></article>)}
          </div>
        </section>

        <section className="article-section" aria-labelledby="component-workflow">
          <p className="section-label">Resolution workflow</p>
          <h2 id="component-workflow">A seven-step component approval process</h2>
          <ol className="numbered-checklist">
            {approvedContent.workflow.map((step) => <li key={step.title}><strong>{step.title}</strong><p>{step.detail}</p></li>)}
          </ol>
        </section>

        <section className="article-section category-boundary" aria-labelledby="component-limits">
          <p className="section-label">Scope boundary</p>
          <h2 id="component-limits">What visible component QA cannot certify</h2>
          <ul className="check-list">{approvedContent.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="article-section" aria-labelledby="component-faq">
          <p className="section-label">Questions</p>
          <h2 id="component-faq">Product component image QA FAQ</h2>
          <div className="category-faq-list">{approvedContent.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </section>

        <section className="article-section article-cta">
          <h2>Approve the complete visible set</h2>
          <p>Inventory required parts, confirm candidate coverage, and keep additions or omissions in REVIEW until the visible evidence and product intent support a stronger decision.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/checks">See all product checks</Link>
            <Link className="text-link" href="/categories/household-packaged-goods-image-qa">Use the Household workflow</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the pre-publish checklist</Link>
          </div>
        </section>

        <p className="content-updated">Evidence and decision model reviewed {approvedContent.founderApprovedAt}.</p>
      </div>
    </main>
  );
}
