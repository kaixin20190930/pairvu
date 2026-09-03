import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { getCheckPageContent } from "@/lib/seo/check-content";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/checks/product-packaging";
const page = getSeoPage(route);
const content = getCheckPageContent(route);
if (!content) throw new Error(`Missing check content for ${route}`);
const approvedContent = content;

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Checks", href: "/checks" },
  { label: "Product Packaging", href: route },
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
  product_change: "Packaging changed",
  hard_negative: "Packaging preserved",
  observability: "Packaging not fully verifiable",
};

export const metadata: Metadata = pageMetadata(page);

export default function ProductPackagingCheckPage() {
  return (
    <main className="content-page check-detail-page">
      <StructuredData data={[articleSchema(page), faqSchema]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero check-detail-hero">
          <p className="eyebrow">Product packaging check</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{approvedContent.deck}</p>
          <p className="category-audience">Built for {approvedContent.audience}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check product packaging</Link>
            <Link className="text-link" href="#packaging-decisions">See the decision rules</Link>
          </div>
        </header>

        <section className="article-section check-direct-answer" aria-labelledby="packaging-answer">
          <p className="section-label">Direct answer</p>
          <h2 id="packaging-answer">How should product packaging be checked?</h2>
          <p>{approvedContent.directAnswer}</p>
          <p>{approvedContent.scopeDistinction}</p>
        </section>

        <section className="article-section" aria-labelledby="packaging-model">
          <p className="section-label">Packaging evidence model</p>
          <h2 id="packaging-model">Six structural layers that make a package recognizable</h2>
          <p>
            Packaging is an assembly, not a single outline. Review the body, closure, attached parts, artwork carrier,
            surface cues, and coverage independently so an accurate label cannot hide a rebuilt container.
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

        <section className="article-section" aria-labelledby="packaging-diagnostics">
          <p className="section-label">Diagnostic questions</p>
          <h2 id="packaging-diagnostics">Questions that separate structure from presentation</h2>
          <div className="use-case-list">
            {approvedContent.diagnosticQuestions.map((item) => (
              <article key={item.question}><h3>{item.question}</h3><p>{item.reason}</p></article>
            ))}
          </div>
        </section>

        <section className="article-section wide-article-section" id="packaging-decisions" aria-labelledby="packaging-decision-heading">
          <p className="section-label">Decision matrix</p>
          <h2 id="packaging-decision-heading">Product packaging PASS, REVIEW, and FAIL rules</h2>
          <p>
            Apply the rule to the exact package feature under review. Confirmed corresponding structure can fail;
            absent evidence must review; photographic change alone should not create a packaging alarm.
          </p>
          <div className="decision-table-wrap">
            <table className="decision-table category-decision-table">
              <thead><tr><th scope="col">Condition</th><th scope="col">PASS</th><th scope="col">REVIEW</th><th scope="col">FAIL</th></tr></thead>
              <tbody>{approvedContent.decisionRules.map((rule) => <tr key={rule.condition}><th scope="row">{rule.condition}</th><td>{rule.pass}</td><td>{rule.review}</td><td>{rule.fail}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="packaging-evidence">
          <p className="section-label">Controlled evidence</p>
          <h2 id="packaging-evidence">Shape, components, harmless light, and incomplete coverage</h2>
          <p>
            These controlled pairs isolate four different decision paths: a confirmed body change, a missing component
            that needs intent confirmation, faithful packaging under new light, and a crop that cannot support a full match.
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

        <section className="article-section" aria-labelledby="packaging-related-decisions">
          <p className="section-label">Related decisions</p>
          <h2 id="packaging-related-decisions">Separate package structure from components and color</h2>
          <p>
            Use the <Link className="text-link" href="/checks/product-components">components check</Link> when a cap,
            pump, handle, or included part may be missing or added. Use the {" "}
            <Link className="text-link" href="/checks/product-color">product-color check</Link> when structure remains
            stable but a surface or variant color changes. The {" "}
            <Link className="text-link" href="/examples">controlled example library</Link> shows each outcome in context,
            and the <Link className="text-link" href="/examples/controlled-visual-qa-benchmark">controlled benchmark</Link>
            {" "}maps packaging evidence across FAIL, PASS, and REVIEW.
          </p>
        </section>

        <section className="article-section" aria-labelledby="packaging-failures">
          <p className="section-label">Failure patterns</p>
          <h2 id="packaging-failures">How an AI image can keep the brand but alter the package</h2>
          <div className="category-risk-list">
            {approvedContent.failureModes.map((mode) => (
              <article key={mode.title}><h3>{mode.title}</h3><p>{mode.mechanism}</p><p><strong>Operational consequence:</strong> {mode.consequence}</p></article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="packaging-workflow">
          <p className="section-label">Resolution workflow</p>
          <h2 id="packaging-workflow">A six-step packaging approval process</h2>
          <ol className="numbered-checklist">
            {approvedContent.workflow.map((step) => <li key={step.title}><strong>{step.title}</strong><p>{step.detail}</p></li>)}
          </ol>
        </section>

        <section className="article-section category-boundary" aria-labelledby="packaging-limits">
          <p className="section-label">Scope boundary</p>
          <h2 id="packaging-limits">What this visible packaging check cannot certify</h2>
          <ul className="check-list">{approvedContent.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="article-section" aria-labelledby="packaging-faq">
          <p className="section-label">Questions</p>
          <h2 id="packaging-faq">Product packaging image QA FAQ</h2>
          <div className="category-faq-list">{approvedContent.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </section>

        <section className="article-section article-cta">
          <h2>Approve the package assembly, not only its artwork</h2>
          <p>Compare the approved package with the final export, then correct confirmed structure changes or collect the missing view needed to resolve uncertainty.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/checks">See all product checks</Link>
            <Link className="text-link" href="/categories/personal-care-product-image-qa">Use the Personal Care workflow</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the pre-publish checklist</Link>
          </div>
        </section>

        <p className="content-updated">Evidence and decision model reviewed {approvedContent.founderApprovedAt}.</p>
      </div>
    </main>
  );
}
