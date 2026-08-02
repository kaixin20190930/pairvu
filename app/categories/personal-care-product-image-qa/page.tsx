import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { getCategoryPageContent } from "@/lib/seo/category-content";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/categories/personal-care-product-image-qa";
const page = getSeoPage(route);
const content = getCategoryPageContent(route);

if (!content) throw new Error(`Missing category content for ${route}`);
const approvedContent = content;

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Categories", href: "/categories" },
  { label: "Personal Care", href: route },
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
  product_change: "Confirmed package change",
  hard_negative: "Presentation-only change",
  observability: "More package coverage needed",
};

const packagingSystem = [
  { part: "Primary vessel", question: "Did the bottle, tube, jar, or stick body change?" },
  { part: "Closure", question: "Is the cap, collar, or neck still the approved design?" },
  { part: "Dispenser", question: "Does the pump, actuator, trigger, or nozzle remain intact?" },
  { part: "Label coverage", question: "Are all identity-bearing label regions still visible?" },
  { part: "Complete silhouette", question: "Can the full shoulders, sides, and base be verified?" },
];

export const metadata: Metadata = pageMetadata(page);

export default function PersonalCareProductImageQaPage() {
  return (
    <main className="content-page personal-care-category-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page), faqSchema]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />

        <header className="content-hero personal-care-category-hero">
          <p className="eyebrow">Personal care product image QA</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{approvedContent.deck}</p>
          <p className="category-audience">Built for {approvedContent.audience}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check a personal care image</Link>
            <Link className="text-link" href="#personal-care-decisions">Use the decision matrix</Link>
          </div>
        </header>

        <section className="article-section" aria-labelledby="package-system-heading">
          <p className="section-label">Packaging system</p>
          <h2 id="package-system-heading">A pump bottle is more than one silhouette</h2>
          <p>
            Personal-care packaging combines a vessel, closure, dispensing mechanism, label, and complete outer form.
            A candidate can preserve the brand artwork while quietly changing the part customers hold or operate.
          </p>
          <div className="personal-care-system-grid">
            {packagingSystem.map((item, index) => (
              <article key={item.part}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{item.part}</h3><p>{item.question}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="personal-care-identity">
          <p className="section-label">Approval hierarchy</p>
          <h2 id="personal-care-identity">What must stay faithful across the image pair?</h2>
          <p>
            Review the package in layers. Matching typography is not enough when a sibling product name, printed
            volume, dispenser, or lower package region differs from the approved reference.
          </p>
          <div className="identity-hierarchy-list">
            {approvedContent.identityHierarchy.map((item) => (
              <article key={item.priority}>
                <span>{item.priority}</span>
                <div><h3>{item.attribute}</h3><p>{item.reason}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section wide-article-section" id="personal-care-decisions" aria-labelledby="personal-care-decision-heading">
          <p className="section-label">Decision matrix</p>
          <h2 id="personal-care-decision-heading">Personal care PASS, REVIEW, and FAIL rules</h2>
          <p>
            PASS requires corresponding visible evidence. REVIEW means an approval-critical region cannot be checked.
            FAIL requires a confirmed change to the product or package, not simply a new background or warmer light.
          </p>
          <div className="decision-table-wrap">
            <table className="decision-table category-decision-table">
              <thead><tr><th scope="col">Attribute</th><th scope="col">PASS</th><th scope="col">REVIEW</th><th scope="col">FAIL</th></tr></thead>
              <tbody>
                {approvedContent.decisionRules.map((rule) => (
                  <tr key={rule.attribute}>
                    <th scope="row">{rule.attribute}</th><td>{rule.pass}</td><td>{rule.review}</td><td>{rule.fail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="personal-care-evidence">
          <p className="section-label">Controlled evidence</p>
          <h2 id="personal-care-evidence">The same shampoo, three different approval outcomes</h2>
          <p>
            These founder-reviewed comparisons isolate container drift, lighting variation, and incomplete coverage.
            Together they show why every visual difference should not be forced into the same verdict.
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

        <section className="article-section" aria-labelledby="personal-care-risks">
          <p className="section-label">Category-specific risks</p>
          <h2 id="personal-care-risks">Where AI personal-care images become misleading</h2>
          <div className="category-risk-list">
            {approvedContent.failureModes.map((risk) => (
              <article key={risk.title}><h3>{risk.title}</h3><p>{risk.detail}</p><p><strong>Business risk:</strong> {risk.businessRisk}</p></article>
            ))}
          </div>
        </section>

        {approvedContent.uniqueInsights.map((insight) => (
          <section className="article-section category-insight" key={insight.title}>
            <p className="section-label">Personal care field note</p>
            <h2>{insight.title}</h2>
            {insight.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}

        <section className="article-section" aria-labelledby="personal-care-formats">
          <p className="section-label">Packaging formats</p>
          <h2 id="personal-care-formats">Personal-care images this workflow can review</h2>
          <p>
            Pairvu can compare these formats when both images expose the same identity-bearing face, required label
            regions, dispensing parts, and package geometry needed for the approval decision.
          </p>
          <ul className="category-format-list">
            {approvedContent.packagingFormats.map((format) => <li key={format}>{format}</li>)}
          </ul>
        </section>

        <section className="article-section" aria-labelledby="personal-care-inputs">
          <p className="section-label">Input requirements</p>
          <h2 id="personal-care-inputs">What a useful personal-care comparison must show</h2>
          <div className="use-case-list">
            {approvedContent.inputRequirements.map((requirement) => (
              <article key={requirement.title}><h3>{requirement.title}</h3><p>{requirement.detail}</p></article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="personal-care-workflow">
          <p className="section-label">Pre-publish workflow</p>
          <h2 id="personal-care-workflow">A five-step package approval process</h2>
          <ol className="numbered-checklist">
            {approvedContent.workflow.map((step) => (
              <li key={step.title}><strong>{step.title}</strong><p>{step.detail}</p></li>
            ))}
          </ol>
        </section>

        <section className="article-section category-boundary" aria-labelledby="personal-care-limits">
          <p className="section-label">Scope boundary</p>
          <h2 id="personal-care-limits">What Pairvu does not validate</h2>
          <ul className="check-list">{approvedContent.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="article-section" aria-labelledby="personal-care-faq">
          <p className="section-label">Questions</p>
          <h2 id="personal-care-faq">Personal care product image QA FAQ</h2>
          <div className="category-faq-list">
            {approvedContent.faq.map((item) => (
              <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>
            ))}
          </div>
        </section>

        <section className="article-section article-cta">
          <h2>Check the complete personal-care package before publishing</h2>
          <p>
            Upload the approved package first, then the final AI-generated or edited candidate. Correct confirmed
            package changes and collect a clearer image for any closure, label, volume, or silhouette that needs review.
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
