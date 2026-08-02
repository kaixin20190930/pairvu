import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { getCategoryPageContent } from "@/lib/seo/category-content";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/categories/beverage-product-image-qa";
const page = getSeoPage(route);
const content = getCategoryPageContent(route);

if (!content) throw new Error(`Missing category content for ${route}`);
const approvedContent = content;

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Categories", href: "/categories" },
  { label: "Beverages", href: route },
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
  product_change: "Confirmed beverage change",
  hard_negative: "Presentation-only change",
  observability: "More visual evidence needed",
};

export const metadata: Metadata = pageMetadata(page);

export default function BeverageProductImageQaPage() {
  return (
    <main className="content-page beverage-category-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page), faqSchema]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />

        <header className="content-hero beverage-category-hero">
          <p className="eyebrow">Beverage product image QA</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{approvedContent.deck}</p>
          <p className="category-audience">Built for {approvedContent.audience}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check a beverage image</Link>
            <Link className="text-link" href="#beverage-decisions">Use the decision matrix</Link>
          </div>
        </header>

        <section className="article-section" aria-labelledby="beverage-quantity-model">
          <p className="section-label">Quantity model</p>
          <h2 id="beverage-quantity-model">Capacity, product count, and pack count are not interchangeable</h2>
          <p>
            Beverage approval has three separate quantity questions. Combining them into one generic quantity score
            can hide an incorrect label value or an AI-duplicated product.
          </p>
          <div className="comparison-table beverage-quantity-model">
            <div>
              <span>Printed capacity</span>
              <h3>How much is in each package?</h3>
              <p>Examples include 330 mL, 500 mL, and 12 fl oz printed on a can, bottle, or carton.</p>
            </div>
            <div>
              <span>Visible product count</span>
              <h3>How many primary units are shown?</h3>
              <p>One can becoming two cans changes the presented offer even when both labels remain correct.</p>
            </div>
            <div>
              <span>Multipack structure</span>
              <h3>What sellable pack is represented?</h3>
              <p>A loose can, a six-pack carton, and a shrink-wrapped tray are different commercial units.</p>
            </div>
          </div>
        </section>

        <section className="article-section" aria-labelledby="beverage-identity">
          <p className="section-label">Beverage identity</p>
          <h2 id="beverage-identity">What must stay faithful across the image pair?</h2>
          <p>
            Review the identity layers in order. A familiar can silhouette or color is not enough when the flavor,
            formula, capacity, count, or multipack presentation has changed.
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

        <section className="article-section wide-article-section" id="beverage-decisions" aria-labelledby="beverage-decision-heading">
          <p className="section-label">Decision matrix</p>
          <h2 id="beverage-decision-heading">Beverage PASS, REVIEW, and FAIL rules</h2>
          <p>
            PASS requires visible matching evidence. REVIEW means a required area cannot be compared. FAIL requires a
            confirmed product, package, value, or offer change rather than a presentation difference.
          </p>
          <div className="decision-table-wrap">
            <table className="decision-table category-decision-table">
              <thead>
                <tr><th scope="col">Attribute</th><th scope="col">PASS</th><th scope="col">REVIEW</th><th scope="col">FAIL</th></tr>
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

        <section className="article-section wide-article-section" aria-labelledby="beverage-evidence">
          <p className="section-label">Controlled evidence</p>
          <h2 id="beverage-evidence">Three beverage cases with three different actions</h2>
          <p>
            These founder-reviewed comparisons show why “different” is not one verdict. A changed capacity requires
            correction, a reflection-only edit can pass, and hidden brand text requires another candidate image.
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
                  <p><b>Next action:</b> {evidence.lesson}</p>
                  <Link className="text-link" href={evidence.href}>Open the full comparison</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="beverage-risks">
          <p className="section-label">Category-specific risks</p>
          <h2 id="beverage-risks">Where AI beverage images commonly become misleading</h2>
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
            <p className="section-label">Beverage field note</p>
            <h2>{insight.title}</h2>
            {insight.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}

        <section className="article-section" aria-labelledby="beverage-formats">
          <p className="section-label">Packaging formats</p>
          <h2 id="beverage-formats">Beverage images this workflow can review</h2>
          <p>
            Pairvu can compare these formats when both images expose the corresponding identity-bearing face,
            complete unit count, and packaging geometry needed for the requested decision.
          </p>
          <ul className="category-format-list">
            {approvedContent.packagingFormats.map((format) => <li key={format}>{format}</li>)}
          </ul>
        </section>

        <section className="article-section" aria-labelledby="beverage-inputs">
          <p className="section-label">Input requirements</p>
          <h2 id="beverage-inputs">What a useful beverage comparison must show</h2>
          <div className="use-case-list">
            {approvedContent.inputRequirements.map((requirement) => (
              <article key={requirement.title}>
                <h3>{requirement.title}</h3>
                <p>{requirement.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="beverage-workflow">
          <p className="section-label">Pre-publish workflow</p>
          <h2 id="beverage-workflow">A five-step beverage image approval process</h2>
          <ol className="numbered-checklist">
            {approvedContent.workflow.map((step) => (
              <li key={step.title}><strong>{step.title}</strong><p>{step.detail}</p></li>
            ))}
          </ol>
        </section>

        <section className="article-section category-boundary" aria-labelledby="beverage-limits">
          <p className="section-label">Scope boundary</p>
          <h2 id="beverage-limits">What Pairvu does not validate</h2>
          <ul className="check-list">
            {approvedContent.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
          </ul>
        </section>

        <section className="article-section" aria-labelledby="beverage-faq">
          <p className="section-label">Questions</p>
          <h2 id="beverage-faq">Beverage image QA FAQ</h2>
          <div className="category-faq-list">
            {approvedContent.faq.map((item) => (
              <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>
            ))}
          </div>
        </section>

        <section className="article-section article-cta">
          <h2>Check the final beverage image before it represents the wrong product</h2>
          <p>
            Upload the approved beverage image first, then the final AI-generated or edited candidate. Correct
            confirmed value, flavor, count, color, or package changes and collect a clearer image for REVIEW findings.
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
