import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { getCategoryPageContent } from "@/lib/seo/category-content";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/categories/cosmetics-product-image-qa";
const page = getSeoPage(route);
const content = getCategoryPageContent(route);

if (!content) throw new Error(`Missing category content for ${route}`);
const approvedContent = content;

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Categories", href: "/categories" },
  { label: "Cosmetics", href: route },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: approvedContent.faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const evidenceRoleLabels = {
  product_change: "Confirmed product change",
  hard_negative: "Harmless scene change",
  observability: "Insufficient visual evidence",
};

export const metadata: Metadata = pageMetadata(page);

export default function CosmeticsProductImageQaPage() {
  return (
    <main className="content-page cosmetics-category-page">
      <StructuredData data={[articleSchema(page), faqSchema]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />

        <header className="content-hero cosmetics-category-hero">
          <p className="eyebrow">Cosmetics product image QA</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{approvedContent.deck}</p>
          <p className="category-audience">Built for {approvedContent.audience}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check a cosmetics image</Link>
            <Link className="text-link" href="#decision-matrix">Use the decision matrix</Link>
          </div>
        </header>

        <section className="article-section" aria-labelledby="identity-hierarchy">
          <p className="section-label">Approval model</p>
          <h2 id="identity-hierarchy">What makes a cosmetics SKU visually identifiable?</h2>
          <p>
            Cosmetics identity is layered. A candidate may preserve the parent brand while changing the sellable
            variant, strength, quantity, container, or included applicator. Review these attributes in order instead
            of relying on one overall similarity score.
          </p>
          <div className="identity-hierarchy-list">
            {approvedContent.identityHierarchy.map((item) => (
              <article key={item.priority}>
                <span>{item.priority}</span>
                <div>
                  <h3>{item.attribute}</h3>
                  <p>{item.reason}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section wide-article-section" id="decision-matrix" aria-labelledby="decision-heading">
          <p className="section-label">Decision matrix</p>
          <h2 id="decision-heading">When to PASS, REVIEW, or FAIL</h2>
          <p>
            A verdict must follow observable evidence. PASS means the required visible attribute matches; REVIEW means
            the supplied views cannot establish it; FAIL means a material product change is visible.
          </p>
          <div className="decision-table-wrap">
            <table className="decision-table category-decision-table">
              <thead>
                <tr>
                  <th scope="col">Attribute</th>
                  <th scope="col">PASS</th>
                  <th scope="col">REVIEW</th>
                  <th scope="col">FAIL</th>
                </tr>
              </thead>
              <tbody>
                {approvedContent.decisionRules.map((rule) => (
                  <tr key={rule.attribute}>
                    <th scope="row">{rule.attribute}</th>
                    <td>{rule.pass}</td>
                    <td>{rule.review}</td>
                    <td>{rule.fail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="controlled-evidence">
          <p className="section-label">Controlled evidence</p>
          <h2 id="controlled-evidence">Three different outcomes, not three versions of “different”</h2>
          <p>
            Pairvu needs to detect material product changes without flagging every scene edit, and it must avoid PASS
            when a required attribute is not observable. These founder-approved cases exercise all three paths.
          </p>
          <div className="category-evidence-grid">
            {approvedContent.evidence.map((evidence) => (
              <article className="category-evidence-card" key={evidence.href}>
                <div className="case-card-images">
                  <Image src={evidence.original} alt="" width={1000} height={1000} sizes="(max-width: 760px) 50vw, 220px" />
                  <Image src={evidence.candidate} alt={evidence.alt} width={1000} height={1000} sizes="(max-width: 760px) 50vw, 220px" />
                </div>
                <div className="category-evidence-content">
                  <div className="category-evidence-meta">
                    <span>{evidenceRoleLabels[evidence.role]}</span>
                    <strong data-decision={evidence.decision}>{evidence.decision}</strong>
                  </div>
                  <h3>{evidence.title}</h3>
                  <p><b>Observed:</b> {evidence.observation}</p>
                  <p><b>Why it matters:</b> {evidence.lesson}</p>
                  <Link className="text-link" href={evidence.href}>Open the full comparison</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="cosmetics-failure-modes">
          <p className="section-label">Category-specific risks</p>
          <h2 id="cosmetics-failure-modes">Where AI cosmetics images commonly drift</h2>
          <div className="category-risk-list">
            {approvedContent.failureModes.map((risk) => (
              <article key={risk.title}>
                <h3>{risk.title}</h3>
                <p>{risk.detail}</p>
                <p><strong>Business risk:</strong> {risk.businessRisk}</p>
              </article>
            ))}
          </div>
        </section>

        {approvedContent.uniqueInsights.map((insight) => (
          <section className="article-section category-insight" key={insight.title}>
            <p className="section-label">Field note</p>
            <h2>{insight.title}</h2>
            {insight.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}

        <section className="article-section" aria-labelledby="packaging-formats">
          <p className="section-label">Supported visual formats</p>
          <h2 id="packaging-formats">Packaging this workflow can compare</h2>
          <p>
            The same approval logic applies across these visible pack formats when the corresponding identity-bearing
            face, closure, and required components are present in both images.
          </p>
          <ul className="category-format-list">
            {approvedContent.packagingFormats.map((format) => <li key={format}>{format}</li>)}
          </ul>
        </section>

        <section className="article-section" aria-labelledby="input-requirements">
          <p className="section-label">Input quality</p>
          <h2 id="input-requirements">What the image pair must show</h2>
          <div className="use-case-list">
            {approvedContent.inputRequirements.map((requirement) => (
              <article key={requirement.title}>
                <h3>{requirement.title}</h3>
                <p>{requirement.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="cosmetics-workflow">
          <p className="section-label">Operational workflow</p>
          <h2 id="cosmetics-workflow">A five-step pre-publish cosmetics review</h2>
          <ol className="numbered-checklist">
            {approvedContent.workflow.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="article-section category-boundary" aria-labelledby="cosmetics-boundary">
          <p className="section-label">Scope boundary</p>
          <h2 id="cosmetics-boundary">What Pairvu does not verify</h2>
          <ul className="check-list">
            {approvedContent.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
          </ul>
        </section>

        <section className="article-section" aria-labelledby="cosmetics-faq">
          <p className="section-label">Questions</p>
          <h2 id="cosmetics-faq">Cosmetics image QA FAQ</h2>
          <div className="category-faq-list">
            {approvedContent.faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="article-section article-cta">
          <h2>Check the final cosmetics creative against the approved pack</h2>
          <p>
            Upload the approved SKU image first, then the AI-generated or edited candidate. Correct confirmed product
            changes and collect better visual evidence for anything Pairvu cannot verify.
          </p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples">See all controlled examples</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the full checklist</Link>
          </div>
        </section>

        <p className="content-updated">Evidence and workflow reviewed {approvedContent.founderApprovedAt}.</p>
      </div>
    </main>
  );
}
