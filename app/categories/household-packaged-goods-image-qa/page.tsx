import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { getCategoryPageContent } from "@/lib/seo/category-content";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/categories/household-packaged-goods-image-qa";
const page = getSeoPage(route);
const content = getCategoryPageContent(route);
if (!content) throw new Error(`Missing category content for ${route}`);
const approvedContent = content;

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Categories", href: "/categories" },
  { label: "Household Packaged Goods", href: route },
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
  hard_negative: "Scene-only change",
  observability: "Human verification needed",
};

const dispensingChain = [
  { part: "Outlet", detail: "Nozzle, spray opening, spout, or pump mouth" },
  { part: "Actuator", detail: "Trigger lever, pump head, button, or dosing action" },
  { part: "Closure", detail: "Threaded collar, cap, neck interface, or pouch fitment" },
  { part: "Fluid path", detail: "Dip tube, internal channel, or visible connection" },
  { part: "Container", detail: "Bottle, jug, pouch, can, tub, handle, and base" },
];

export const metadata: Metadata = pageMetadata(page);

export default function HouseholdPackagedGoodsImageQaPage() {
  return (
    <main className="content-page household-category-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page), faqSchema]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />

        <header className="content-hero household-category-hero">
          <p className="eyebrow">Household packaged goods image QA</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{approvedContent.deck}</p>
          <p className="category-audience">Built for {approvedContent.audience}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check a household product image</Link>
            <Link className="text-link" href="#household-decisions">Use the decision matrix</Link>
          </div>
        </header>

        <section className="article-section" aria-labelledby="dispensing-chain-heading">
          <p className="section-label">Functional package model</p>
          <h2 id="dispensing-chain-heading">A household package must form a credible dispensing chain</h2>
          <p>
            A polished label cannot compensate for missing hardware. Review the visible route from the outlet to the
            container so a trigger cleaner, pump soap, refill, or dosing pack still represents the approved product.
          </p>
          <div className="packaged-food-offer-grid">
            {dispensingChain.map((item, index) => (
              <article key={item.part}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.part}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="household-identity">
          <p className="section-label">Household product identity</p>
          <h2 id="household-identity">What defines the approved home-care product?</h2>
          <p>
            Start with brand and intended job, then verify formula and quantity, dispensing hardware, container form,
            color layers, components, and the visible offer. Familiar blue liquid is not enough evidence by itself.
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

        <section className="article-section wide-article-section" id="household-decisions" aria-labelledby="household-decision-heading">
          <p className="section-label">Decision matrix</p>
          <h2 id="household-decision-heading">Household product PASS, REVIEW, and FAIL rules</h2>
          <p>
            PASS means the required product evidence matches. REVIEW means the pair cannot prove an attribute or a
            material component needs human confirmation. FAIL means a critical visible identity or value changed.
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

        <section className="article-section wide-article-section" aria-labelledby="household-evidence">
          <p className="section-label">Controlled evidence</p>
          <h2 id="household-evidence">Capacity, setting, components, and viewpoint require different actions</h2>
          <p>
            These founder-reviewed BRIGHTLEAF cases cover a confirmed printed-value failure, a clean background PASS,
            an observable missing trigger, and a front-versus-back evidence limitation.
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

        <section className="article-section" aria-labelledby="household-risks">
          <p className="section-label">Category-specific risks</p>
          <h2 id="household-risks">Where AI household product images become misleading</h2>
          <div className="category-risk-list">
            {approvedContent.failureModes.map((risk) => (
              <article key={risk.title}>
                <h3>{risk.title}</h3><p>{risk.detail}</p><p><strong>Business risk:</strong> {risk.businessRisk}</p>
              </article>
            ))}
          </div>
        </section>

        {approvedContent.uniqueInsights.map((insight) => (
          <section className="article-section category-insight" key={insight.title}>
            <p className="section-label">Household packaging field note</p>
            <h2>{insight.title}</h2>
            {insight.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}

        <section className="article-section" aria-labelledby="household-formats">
          <p className="section-label">Packaging formats</p>
          <h2 id="household-formats">Household package images this workflow can review</h2>
          <p>
            The pair must expose the package face, functional components, values, color layers, and complete form that
            matter for the approval decision. Support does not imply chemical, safety, or regulatory validation.
          </p>
          <ul className="category-format-list">
            {approvedContent.packagingFormats.map((format) => <li key={format}>{format}</li>)}
          </ul>
        </section>

        <section className="article-section" aria-labelledby="household-inputs">
          <p className="section-label">Input requirements</p>
          <h2 id="household-inputs">What a useful household-product comparison must show</h2>
          <div className="use-case-list">
            {approvedContent.inputRequirements.map((requirement) => (
              <article key={requirement.title}><h3>{requirement.title}</h3><p>{requirement.detail}</p></article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="household-workflow">
          <p className="section-label">Pre-publish workflow</p>
          <h2 id="household-workflow">A six-step household package approval process</h2>
          <ol className="numbered-checklist">
            {approvedContent.workflow.map((step) => (
              <li key={step.title}><strong>{step.title}</strong><p>{step.detail}</p></li>
            ))}
          </ol>
        </section>

        <section className="article-section category-boundary" aria-labelledby="household-limits">
          <p className="section-label">Scope boundary</p>
          <h2 id="household-limits">What Pairvu does not validate</h2>
          <ul className="check-list">{approvedContent.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="article-section" aria-labelledby="household-faq">
          <p className="section-label">Questions</p>
          <h2 id="household-faq">Household packaged goods image QA FAQ</h2>
          <div className="category-faq-list">
            {approvedContent.faq.map((item) => (
              <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>
            ))}
          </div>
        </section>

        <section className="article-section article-cta">
          <h2>Check the household package, not only the room around it</h2>
          <p>
            Upload the approved package first and the final AI-generated or edited candidate second. Fix confirmed
            identity and value changes, confirm functional component changes, and request a better view when evidence
            is hidden.
          </p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples">See all controlled examples</Link>
            <Link className="text-link" href="/checks/product-packaging">Review packaging checks</Link>
          </div>
        </section>

        <p className="content-updated">Evidence and workflow reviewed {approvedContent.founderApprovedAt}.</p>
      </div>
    </main>
  );
}
