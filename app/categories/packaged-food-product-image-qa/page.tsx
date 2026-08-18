import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { getCategoryPageContent } from "@/lib/seo/category-content";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/categories/packaged-food-product-image-qa";
const page = getSeoPage(route);
const content = getCategoryPageContent(route);

if (!content) throw new Error(`Missing category content for ${route}`);
const approvedContent = content;

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Categories", href: "/categories" },
  { label: "Packaged Food", href: route },
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
  product_change: "Sellable offer changed",
  hard_negative: "Composition-only change",
  observability: "Readable evidence needed",
};

const offerLayers = [
  {
    label: "Contents per package",
    example: "300 g printed on one box",
    question: "Did the visible weight, volume, or count statement change?",
  },
  {
    label: "Packages in the scene",
    example: "One box versus two boxes",
    question: "Did AI duplicate or remove a primary sellable package?",
  },
  {
    label: "Commercial configuration",
    example: "Single unit, bundle, or multipack",
    question: "Does the image imply a different offer structure?",
  },
  {
    label: "Package face evidence",
    example: "Front panel, side panel, or back panel",
    question: "Can the required identity wording be compared directly?",
  },
];

export const metadata: Metadata = pageMetadata(page);

export default function PackagedFoodProductImageQaPage() {
  return (
    <main className="content-page packaged-food-category-page">
      <StructuredData data={[articleSchema(page), faqSchema]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />

        <header className="content-hero packaged-food-category-hero">
          <p className="eyebrow">Packaged food product image QA</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{approvedContent.deck}</p>
          <p className="category-audience">Built for {approvedContent.audience}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check a packaged food image</Link>
            <Link className="text-link" href="#packaged-food-decisions">Use the decision matrix</Link>
          </div>
        </header>

        <section className="article-section" aria-labelledby="sellable-offer-heading">
          <p className="section-label">Sellable offer model</p>
          <h2 id="sellable-offer-heading">Four quantity questions that should not be collapsed</h2>
          <p>
            A food package can keep the correct 300 g label while AI duplicates the box. It can also show one package
            that belongs to a multipack, or turn away the front panel needed to verify flavor and quantity. Each layer
            needs a separate answer.
          </p>
          <div className="packaged-food-offer-grid">
            {offerLayers.map((item, index) => (
              <article key={item.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.label}</h3>
                <strong>{item.example}</strong>
                <p>{item.question}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="packaged-food-identity">
          <p className="section-label">Pack identity hierarchy</p>
          <h2 id="packaged-food-identity">What defines the approved packaged-food product?</h2>
          <p>
            Review the package in commercial order. A familiar carton color is not enough when the product name,
            flavor, printed quantity, package count, closure, or approval-critical text cannot be confirmed.
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

        <section className="article-section wide-article-section" id="packaged-food-decisions" aria-labelledby="packaged-food-decision-heading">
          <p className="section-label">Decision matrix</p>
          <h2 id="packaged-food-decision-heading">Packaged food PASS, REVIEW, and FAIL rules</h2>
          <p>
            PASS requires readable matching evidence. REVIEW means the supplied image cannot prove an attribute.
            FAIL requires a confirmed change to the food identity, visible offer, printed value, or package structure.
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

        <section className="article-section wide-article-section" aria-labelledby="packaged-food-evidence">
          <p className="section-label">Controlled evidence</p>
          <h2 id="packaged-food-evidence">Count, composition, and readability lead to different decisions</h2>
          <p>
            These founder-reviewed GRAINLY comparisons isolate one material offer change, one harmless recomposition,
            and one image that looks plausible but lacks readable text evidence.
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

        <section className="article-section" aria-labelledby="packaged-food-risks">
          <p className="section-label">Category-specific risks</p>
          <h2 id="packaged-food-risks">Where AI packaged-food images become misleading</h2>
          <div className="category-risk-list">
            {approvedContent.failureModes.map((risk) => (
              <article key={risk.title}><h3>{risk.title}</h3><p>{risk.detail}</p><p><strong>Business risk:</strong> {risk.businessRisk}</p></article>
            ))}
          </div>
        </section>

        {approvedContent.uniqueInsights.map((insight) => (
          <section className="article-section category-insight" key={insight.title}>
            <p className="section-label">Packaged food field note</p>
            <h2>{insight.title}</h2>
            {insight.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}

        <section className="article-section" aria-labelledby="packaged-food-formats">
          <p className="section-label">Packaging formats</p>
          <h2 id="packaged-food-formats">Food package images this workflow can review</h2>
          <p>
            Pairvu can compare these formats when the pair exposes corresponding identity-bearing faces, readable
            product and quantity wording, complete primary package boundaries, and the structure required for approval.
          </p>
          <ul className="category-format-list">
            {approvedContent.packagingFormats.map((format) => <li key={format}>{format}</li>)}
          </ul>
        </section>

        <section className="article-section" aria-labelledby="packaged-food-inputs">
          <p className="section-label">Input requirements</p>
          <h2 id="packaged-food-inputs">What a useful packaged-food comparison must show</h2>
          <div className="use-case-list">
            {approvedContent.inputRequirements.map((requirement) => (
              <article key={requirement.title}><h3>{requirement.title}</h3><p>{requirement.detail}</p></article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="packaged-food-workflow">
          <p className="section-label">Pre-publish workflow</p>
          <h2 id="packaged-food-workflow">A five-step food package approval process</h2>
          <ol className="numbered-checklist">
            {approvedContent.workflow.map((step) => (
              <li key={step.title}><strong>{step.title}</strong><p>{step.detail}</p></li>
            ))}
          </ol>
        </section>

        <section className="article-section category-boundary" aria-labelledby="packaged-food-limits">
          <p className="section-label">Scope boundary</p>
          <h2 id="packaged-food-limits">What Pairvu does not validate</h2>
          <ul className="check-list">{approvedContent.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="article-section" aria-labelledby="packaged-food-faq">
          <p className="section-label">Questions</p>
          <h2 id="packaged-food-faq">Packaged food product image QA FAQ</h2>
          <div className="category-faq-list">
            {approvedContent.faq.map((item) => (
              <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>
            ))}
          </div>
        </section>

        <section className="article-section article-cta">
          <h2>Check the final food package before it changes the visible offer</h2>
          <p>
            Upload the approved pack first, then the final AI-generated or edited candidate. Correct confirmed brand,
            variant, value, count, configuration, or structural changes and request a clearer image for unreadable text.
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
