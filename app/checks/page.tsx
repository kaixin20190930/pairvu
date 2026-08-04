import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/checks");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Product Checks", href: page.route },
];

const checkFamilies = [
  {
    title: "Product quantity",
    status: "Published",
    href: "/checks/product-quantity",
    detail: "Separate printed amount, primary package count, included units, and commercial pack configuration.",
  },
  {
    title: "Product label text",
    status: "Published",
    href: "/checks/product-label-text",
    detail: "Distinguish confirmed wording changes from unreadable, hidden, or non-corresponding text regions.",
  },
  {
    title: "Product packaging",
    status: "Published",
    href: "/checks/product-packaging",
    detail: "Evaluate container form, closures, major components, package coverage, and harmless lighting changes.",
  },
  {
    title: "Logo and brand mark",
    status: "Published",
    href: "/checks/product-logo",
    detail: "Compare logo identity while separating a confirmed replacement from partial occlusion or insufficient resolution.",
  },
  {
    title: "Product color",
    status: "Published",
    href: "/checks/product-color",
    detail: "Separate deliberate package recoloring from scene light, reflection, shadow, transparency, and white balance.",
  },
  {
    title: "Observability",
    status: "Planned",
    detail: "Identify exactly which crop, viewpoint, occlusion, reflection, or resolution problem prevents a reliable answer.",
  },
];

export const metadata: Metadata = pageMetadata(page);

export default function ProductChecksPage() {
  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Attribute-level product QA</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            Each check answers one approval question across product categories. Use these pages when you need more
            than a single example: a precise attribute model, evidence requirements, decision rules, and next action.
          </p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check your image pair</Link>
            <Link className="text-link" href="/examples">Browse controlled examples</Link>
          </div>
        </header>

        <section className="article-section" aria-labelledby="checks-difference">
          <p className="section-label">Choose the right content</p>
          <h2 id="checks-difference">A check page is a decision method, not another example</h2>
          <div className="comparison-table check-family-model">
            <div><span>Example</span><h3>One controlled pair</h3><p>Shows what changed, what stayed stable, and the observed or expected result.</p></div>
            <div><span>Category</span><h3>One product domain</h3><p>Explains which attributes define cosmetics, beverages, personal care, or packaged food.</p></div>
            <div><span>Check</span><h3>One attribute across products</h3><p>Defines the evidence and verdict rules for quantity, label text, packaging, color, or another visible attribute.</p></div>
          </div>
        </section>

        <section className="article-section" aria-labelledby="published-checks">
          <p className="section-label">Quality-gated library</p>
          <h2 id="published-checks">Visible product checks</h2>
          <p>
            A detailed page becomes public only after it has four controlled cases, complete PASS / REVIEW / FAIL
            guidance, diagnostic questions, limitations, founder approval, and an automated content-quality pass.
          </p>
          <div className="check-topic-list">
            {checkFamilies.map((check) => {
              const content = <><div><h3>{check.title}</h3><p>{check.detail}</p></div><span>{check.status}</span></>;
              return check.href ? <Link href={check.href} key={check.title}>{content}</Link> : <article key={check.title}>{content}</article>;
            })}
          </div>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="quantity-preview">
          <p className="section-label">Featured flagship check</p>
          <h2 id="quantity-preview">Product quantity is more than the number printed on a label</h2>
          <p>
            The first detailed check separates a printed amount from primary package count and pack configuration.
            These controlled comparisons show why a 330 mL to 500 mL edit, one box becoming two, and a harmless
            perspective change require different decisions.
          </p>
          <div className="case-card-grid">
            <Link className="case-card" href="/examples/label-value-change-ai-product-image">
              <div className="case-card-images">
                <Image src="/examples/label-value-change/original.jpg" alt="" width={1000} height={1000} sizes="220px" />
                <Image src="/examples/label-value-change/candidate.jpg" alt="NOVA FIZZ capacity changed from 330 mL to 500 mL" width={1000} height={1000} sizes="220px" />
              </div>
              <div><span>Printed amount</span><h3>330 mL became 500 mL</h3><p>One package remains visible, but its customer-facing capacity changes.</p></div>
            </Link>
            <Link className="case-card" href="/examples/product-count-change-ai-image">
              <div className="case-card-images">
                <Image src="/examples/product-count-change/original.jpg" alt="" width={1000} height={1000} sizes="220px" />
                <Image src="/examples/product-count-change/candidate.jpg" alt="One GRAINLY box became two boxes" width={1000} height={1000} sizes="220px" />
              </div>
              <div><span>Primary package count</span><h3>One box became two</h3><p>Each package still says 300 g, but the represented offer is no longer one box.</p></div>
            </Link>
            <Link className="case-card" href="/examples/product-repositioning-perspective-change">
              <div className="case-card-images">
                <Image src="/examples/product-count-change/original.jpg" alt="" width={1000} height={1000} sizes="220px" />
                <Image src="/examples/reposition-perspective/perspective.jpg" alt="The same GRAINLY box at a slight angle" width={1000} height={1000} sizes="220px" />
              </div>
              <div><span>Hard negative</span><h3>Position changed, quantity did not</h3><p>One readable package remains one readable package after ordinary recomposition.</p></div>
            </Link>
          </div>
          <div className="content-actions"><Link className="primary-link-button" href="/checks/product-quantity">Open the Product Quantity check</Link></div>
        </section>

        <section className="article-section" aria-labelledby="verdict-ladder">
          <p className="section-label">Shared decision language</p>
          <h2 id="verdict-ladder">The result depends on evidence, not visual surprise</h2>
          <div className="case-fact-grid">
            <div><span>PASS</span><strong>Required attributes are observable and match</strong></div>
            <div><span>REVIEW</span><strong>A required fact is uncertain, hidden, or needs intent confirmation</strong></div>
            <div><span>FAIL</span><strong>An approval-critical visible attribute is confirmed changed</strong></div>
          </div>
          <p>
            Provider errors and system failures remain execution failures rather than product verdicts. A check page
            never replaces the approved reference, invents hidden facts, or turns an unreadable region into a mismatch.
          </p>
        </section>

        <section className="article-section article-cta">
          <h2>Start with the attribute that could change the customer&apos;s understanding</h2>
          <p>Use the approved image as the source of truth and inspect the final candidate before publishing.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/guides/ai-product-photography-checklist">Use the pre-publish checklist</Link>
            <Link className="text-link" href="/categories">Browse category workflows</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
