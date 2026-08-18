import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { getCategoryPageContent } from "@/lib/seo/category-content";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const route = "/categories/skincare-product-image-qa";
const page = getSeoPage(route);
const content = getCategoryPageContent(route);
if (!content) throw new Error(`Missing category content for ${route}`);
const approvedContent = content;

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
  product_change: "Confirmed SKU change",
  hard_negative: "Creative-only change",
  observability: "Evidence limitation",
};

const releaseLayers = [
  {
    title: "Product fidelity",
    status: "Available in Pairvu",
    detail:
      "Compare logo, identity text and printed values, product count, semantic color, major components, packaging shape, and whether the evidence is observable.",
  },
  {
    title: "Image integrity",
    status: "Expansion layer",
    detail:
      "Inspect deformation, malformed text, broken edges, texture artifacts, implausible reflections, perspective errors, and impossible product geometry.",
  },
  {
    title: "Brand and channel rules",
    status: "Future configurable rules",
    detail:
      "Apply approved logo treatment, palette, product occupancy, crop, background, props, aspect ratio, and channel-specific composition rules.",
  },
  {
    title: "Release and compliance",
    status: "Separate specialist review",
    detail:
      "Validate file specifications, listing-to-SKU mapping, marketplace policy, claims, disclaimers, localization, legal requirements, and regulated labeling.",
  },
];

export const metadata: Metadata = pageMetadata(page);

export default function SkincareProductImageQaPage() {
  return (
    <main className="content-page skincare-category-page">
      <StructuredData data={[articleSchema(page), faqSchema]} />
      <div className="content-container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Product Categories", href: "/categories" }, { label: "Skincare", href: route }]} />

        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Skincare product image QA</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{approvedContent.deck}</p>
          <p className="category-audience">Built for {approvedContent.audience}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check a skincare image</Link>
            <Link className="text-link" href="#skincare-decisions">Use the decision matrix</Link>
          </div>
        </header>

        <section className="article-section" aria-labelledby="release-model">
          <p className="section-label">A complete release model</p>
          <h2 id="release-model">One product image needs four different kinds of QA</h2>
          <p>
            A reference comparison answers an important but bounded question: does the candidate still show the
            approved product? Near-release confidence requires additional image-quality, brand-rule, technical, and
            compliance controls. Pairvu currently owns the first layer and will expand only where real workflows
            justify it.
          </p>
          <div className="packaged-food-offer-grid">
            {releaseLayers.map((layer, index) => (
              <article key={layer.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{layer.title}</h3>
                <p><strong>{layer.status}</strong></p>
                <p>{layer.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="skincare-identity">
          <p className="section-label">SKU identity hierarchy</p>
          <h2 id="skincare-identity">What makes the skincare product the approved SKU?</h2>
          <p>
            Skincare variants can share the same mold, typography, and artwork system. Review commercial identity in
            priority order so a tiny SPF, percentage, shade, formula, or quantity change is not hidden by overall
            visual similarity.
          </p>
          <div className="identity-hierarchy-list">
            {approvedContent.identityHierarchy.map((item) => (
              <article key={item.priority}><span>{item.priority}</span><div><h3>{item.attribute}</h3><p>{item.reason}</p></div></article>
            ))}
          </div>
        </section>

        <section className="article-section wide-article-section" id="skincare-decisions" aria-labelledby="skincare-decision-heading">
          <p className="section-label">Decision matrix</p>
          <h2 id="skincare-decision-heading">Skincare image PASS, REVIEW, and FAIL rules</h2>
          <p>
            PASS confirms observable product fidelity. REVIEW means the pair lacks enough corresponding evidence.
            FAIL means a visible approval-critical attribute changed. None of these decisions certifies claims,
            ingredients, SPF efficacy, or marketplace compliance.
          </p>
          <div className="decision-table-wrap">
            <table className="decision-table category-decision-table">
              <thead><tr><th scope="col">Attribute</th><th scope="col">PASS</th><th scope="col">REVIEW</th><th scope="col">FAIL</th></tr></thead>
              <tbody>{approvedContent.decisionRules.map((rule) => <tr key={rule.attribute}><th scope="row">{rule.attribute}</th><td>{rule.pass}</td><td>{rule.review}</td><td>{rule.fail}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="skincare-evidence">
          <p className="section-label">Founder-reviewed evidence</p>
          <h2 id="skincare-evidence">The same sunscreen needs three different decisions</h2>
          <p>
            A changed SPF is a product failure, a new beach scene is harmless creative variation, and a close crop is
            incomplete evidence. These cases demonstrate why a useful checker cannot reduce every visual difference
            to one generic mismatch score.
          </p>
          <div className="category-evidence-grid">
            {approvedContent.evidence.map((evidence) => (
              <article className="category-evidence-card" key={evidence.href}>
                <div className="case-card-images">
                  <Image src={evidence.original} alt="" width={1254} height={1254} sizes="(max-width: 760px) 50vw, 220px" />
                  <Image src={evidence.candidate} alt={evidence.alt} width={1254} height={1254} sizes="(max-width: 760px) 50vw, 220px" />
                </div>
                <div className="category-evidence-content">
                  <div className="category-evidence-meta"><span>{evidenceRoleLabels[evidence.role]}</span><strong data-decision={evidence.decision}>{evidence.decision}</strong></div>
                  <h3>{evidence.title}</h3>
                  <p><b>Observed:</b> {evidence.observation}</p>
                  <p><b>Next action:</b> {evidence.lesson}</p>
                  <Link className="text-link" href={evidence.href}>Open the full comparison</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="article-section" aria-labelledby="skincare-risks">
          <p className="section-label">Category-specific risks</p>
          <h2 id="skincare-risks">Where AI skincare images become commercially misleading</h2>
          <div className="category-risk-list">
            {approvedContent.failureModes.map((risk) => <article key={risk.title}><h3>{risk.title}</h3><p>{risk.detail}</p><p><strong>Business risk:</strong> {risk.businessRisk}</p></article>)}
          </div>
        </section>

        {approvedContent.uniqueInsights.map((insight) => (
          <section className="article-section category-insight" key={insight.title}>
            <p className="section-label">Skincare QA field note</p><h2>{insight.title}</h2>
            {insight.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}

        <section className="article-section" aria-labelledby="skincare-formats">
          <p className="section-label">Packaging formats</p><h2 id="skincare-formats">Skincare products this workflow can compare</h2>
          <p>Support means visible reference-based comparison. It does not mean formula, ingredient, clinical, or regulatory validation.</p>
          <ul className="category-format-list">{approvedContent.packagingFormats.map((format) => <li key={format}>{format}</li>)}</ul>
        </section>

        <section className="article-section" aria-labelledby="skincare-inputs">
          <p className="section-label">Input requirements</p><h2 id="skincare-inputs">What a useful skincare comparison must show</h2>
          <div className="use-case-list">{approvedContent.inputRequirements.map((item) => <article key={item.title}><h3>{item.title}</h3><p>{item.detail}</p></article>)}</div>
        </section>

        <section className="article-section" aria-labelledby="skincare-workflow">
          <p className="section-label">Pre-publish workflow</p><h2 id="skincare-workflow">A layered skincare image approval process</h2>
          <ol className="numbered-checklist">{approvedContent.workflow.map((step) => <li key={step.title}><strong>{step.title}</strong><p>{step.detail}</p></li>)}</ol>
        </section>

        <section className="article-section category-boundary" aria-labelledby="skincare-limits">
          <p className="section-label">Scope boundary</p><h2 id="skincare-limits">What a Pairvu PASS does not guarantee</h2>
          <ul className="check-list">{approvedContent.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="article-section" aria-labelledby="skincare-faq">
          <p className="section-label">Questions</p><h2 id="skincare-faq">Skincare product image QA FAQ</h2>
          <div className="category-faq-list">{approvedContent.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </section>

        <section className="article-section article-cta">
          <h2>Check the skincare SKU, not only the attractive picture</h2>
          <p>Use the approved package as the reference, inspect the final candidate, and request better evidence whenever the image cannot support a complete product decision.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/examples">See controlled examples</Link>
            <Link className="text-link" href="/checks/product-label-text">Review label text checks</Link>
            <Link className="text-link" href="/checks/product-image-observability">Review observability</Link>
          </div>
        </section>

        <p className="content-updated">Evidence and workflow reviewed {approvedContent.founderApprovedAt}.</p>
      </div>
    </main>
  );
}
