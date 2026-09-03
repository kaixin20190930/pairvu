import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { getCheckPageContent } from "@/lib/seo/check-content";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/checks/product-logo";
const page = getSeoPage(route);
const content = getCheckPageContent(route);
if (!content) throw new Error(`Missing check content for ${route}`);
const approvedContent = content;

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Checks", href: "/checks" },
  { label: "Product Logo", href: route },
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
  product_change: "Logo identity changed",
  hard_negative: "Logo identity preserved",
  observability: "Logo not fully verifiable",
};

export const metadata: Metadata = pageMetadata(page);

export default function ProductLogoCheckPage() {
  return (
    <main className="content-page check-detail-page">
      <StructuredData data={[articleSchema(page), faqSchema]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero check-detail-hero">
          <p className="eyebrow">Product logo check</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{approvedContent.deck}</p>
          <p className="category-audience">Built for {approvedContent.audience}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check a product logo</Link>
            <Link className="text-link" href="#logo-decisions">See the decision rules</Link>
          </div>
        </header>

        <section className="article-section check-direct-answer" aria-labelledby="logo-answer">
          <p className="section-label">Direct answer</p>
          <h2 id="logo-answer">Compare the approved logo with the AI candidate</h2>
          <p>{approvedContent.directAnswer}</p>
          <p>{approvedContent.scopeDistinction}</p>
        </section>

        <section className="article-section" aria-labelledby="logo-model">
          <p className="section-label">Brand identity evidence model</p>
          <h2 id="logo-model">Seven layers that distinguish a logo from nearby artwork</h2>
          <p>
            A brand mark can contain a symbol, wordmark, and approved arrangement. Inspect each layer independently,
            then evaluate the lockup as a whole so matching label copy cannot hide a replaced mark and colored light
            cannot manufacture a false identity change.
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

        <section className="article-section" aria-labelledby="logo-diagnostics">
          <p className="section-label">Diagnostic questions</p>
          <h2 id="logo-diagnostics">Questions that separate identity from presentation</h2>
          <div className="use-case-list">
            {approvedContent.diagnosticQuestions.map((item) => (
              <article key={item.question}><h3>{item.question}</h3><p>{item.reason}</p></article>
            ))}
          </div>
        </section>

        <section className="article-section wide-article-section" id="logo-decisions" aria-labelledby="logo-decision-heading">
          <p className="section-label">Decision matrix</p>
          <h2 id="logo-decision-heading">Product logo PASS, REVIEW, and FAIL rules</h2>
          <p>
            Apply each rule to identity-bearing evidence. Confirmed visible replacement can fail; hidden identity must
            review; background, shadow, reflection, and ordinary product movement should not become logo alarms.
          </p>
          <div className="decision-table-wrap">
            <table className="decision-table category-decision-table">
              <thead><tr><th scope="col">Condition</th><th scope="col">PASS</th><th scope="col">REVIEW</th><th scope="col">FAIL</th></tr></thead>
              <tbody>{approvedContent.decisionRules.map((rule) => <tr key={rule.condition}><th scope="row">{rule.condition}</th><td>{rule.pass}</td><td>{rule.review}</td><td>{rule.fail}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="logo-evidence">
          <p className="section-label">Controlled evidence</p>
          <h2 id="logo-evidence">Replacement, harmless scene changes, and incomplete visibility</h2>
          <p>
            These controlled pairs isolate four decision paths: a confirmed symbol replacement, a background-only
            change, stronger shadow and reflection, and an obstruction that prevents full wordmark verification.
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

        <section className="article-section" aria-labelledby="logo-related-decisions">
          <p className="section-label">Related decisions</p>
          <h2 id="logo-related-decisions">Connect logo evidence to wording and color</h2>
          <p>
            A familiar mark does not prove that the rest of the product stayed faithful. Continue with the
            {" "}<Link className="text-link" href="/checks/product-label-text">label-text check</Link> when brand or
            variant wording carries identity, and use the {" "}
            <Link className="text-link" href="/checks/product-color">product-color check</Link> when color distinguishes
            a product variant. Browse the <Link className="text-link" href="/examples">controlled example library</Link>
            {" "}or use the <Link className="text-link" href="/examples/controlled-visual-qa-benchmark">controlled benchmark</Link>
            {" "}to compare FAIL, PASS, and REVIEW evidence across attributes.
          </p>
        </section>

        <section className="article-section" aria-labelledby="logo-failures">
          <p className="section-label">Failure patterns</p>
          <h2 id="logo-failures">How AI can alter identity while preserving the package</h2>
          <div className="category-risk-list">
            {approvedContent.failureModes.map((mode) => (
              <article key={mode.title}><h3>{mode.title}</h3><p>{mode.mechanism}</p><p><strong>Operational consequence:</strong> {mode.consequence}</p></article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="logo-workflow">
          <p className="section-label">Resolution workflow</p>
          <h2 id="logo-workflow">A seven-step logo approval process</h2>
          <ol className="numbered-checklist">
            {approvedContent.workflow.map((step) => <li key={step.title}><strong>{step.title}</strong><p>{step.detail}</p></li>)}
          </ol>
        </section>

        <section className="article-section category-boundary" aria-labelledby="logo-limits">
          <p className="section-label">Scope boundary</p>
          <h2 id="logo-limits">What this visible logo check cannot certify</h2>
          <ul className="check-list">{approvedContent.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="article-section" aria-labelledby="logo-faq">
          <p className="section-label">Questions</p>
          <h2 id="logo-faq">Product logo image QA FAQ</h2>
          <div className="category-faq-list">{approvedContent.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </section>

        <section className="article-section article-cta">
          <h2>Approve the identity, not only a familiar package</h2>
          <p>Compare the approved mark with the final export, correct confirmed replacements, and request a clear brand-area view when required identity evidence is hidden.</p>
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
