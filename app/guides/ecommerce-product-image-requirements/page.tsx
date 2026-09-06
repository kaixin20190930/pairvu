import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/guides/ecommerce-product-image-requirements");
const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Guides", href: "/guides" },
  { label: "Ecommerce image requirements", href: page.route },
];

const faq = [
  {
    question: "Does one product image satisfy every ecommerce platform?",
    answer: "No. Requirements vary by platform, category, placement, region, and date. Treat the approved product reference as stable evidence, then validate each export against the current rules for its destination.",
  },
  {
    question: "Does Pairvu certify Amazon, Shopify, Google, eBay, or TikTok compliance?",
    answer: "No. Pairvu compares observable product fidelity against an approved reference. It does not certify platform compliance, approve listings, or replace current marketplace guidance and human review.",
  },
  {
    question: "Which reference view should be used for a back-of-package image?",
    answer: "Use a current approved back view of the exact product and variant. A front reference cannot verify rear instructions, warnings, ingredients, or other face-specific artwork that is turned away.",
  },
  {
    question: "Can a lifestyle background pass product-image QA?",
    answer: "Yes. A scene can change while the observable logo, label text, count, color, components, and package remain faithful. Platform rules for that placement must still be checked separately.",
  },
] as const;

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export const metadata: Metadata = pageMetadata(page);

export default function EcommerceProductImageRequirementsPage() {
  return <main className="content-page">
    <StructuredData data={[articleSchema(page), faqSchema]} />
    <div className="content-container">
      <Breadcrumbs items={breadcrumbs} />
      <header className="content-hero content-hero-compact">
        <p className="eyebrow">Platform requirements guide</p>
        <h1>{page.h1}</h1>
        <p className="content-deck">A publishable ecommerce image must pass two different gates: it must depict the approved product faithfully, and it must meet the current rules for the platform, category, and placement where it will appear.</p>
        <p className="platform-disclaimer">Pairvu is independent of Amazon, Google, eBay, Shopify, and TikTok. It does not certify marketplace compliance or guarantee listing acceptance.</p>
      </header>

      <section className="article-section check-direct-answer" aria-labelledby="direct-answer">
        <p className="section-label">Direct answer</p>
        <h2 id="direct-answer">What should an ecommerce product-image review cover?</h2>
        <p>Start by confirming the exact product and variant, then compare corresponding approved and candidate views for logo, readable label text, printed quantity, semantic color, major components, and package shape. After product fidelity is resolved, apply the destination platform&apos;s file, background, composition, content, category, and listing requirements.</p>
        <p>Do not collapse those checks into one “approved” badge. A faithful product can still violate a marketplace rule, while a technically valid file can still show the wrong scent, count, accessory, or package artwork.</p>
      </section>

      <section className="article-section" aria-labelledby="two-gates">
        <p className="section-label">Review model</p>
        <h2 id="two-gates">Separate product truth from channel eligibility</h2>
        <div className="comparison-table">
          <div><span>Gate 1 · Product fidelity</span><h3>Is this still the approved product?</h3><p>Compare the candidate with a corresponding approved reference. Record confirmed differences, stable attributes, and anything that cannot be observed.</p></div>
          <div><span>Gate 2 · Platform requirements</span><h3>Can this asset be used in this placement?</h3><p>Check current technical, content, category, listing, and placement rules in the platform&apos;s official documentation.</p></div>
        </div>
        <p>Pairvu supports the first gate. The merchant or publishing team remains responsible for the second gate and the final decision.</p>
      </section>

      <section className="article-section wide-article-section" aria-labelledby="platform-matrix">
        <p className="section-label">Comparison matrix</p>
        <h2 id="platform-matrix">How the review changes by platform</h2>
        <div className="decision-table-wrap">
          <table className="decision-table">
            <thead><tr><th scope="col">Channel</th><th scope="col">Platform-side review</th><th scope="col">Product-fidelity review</th><th scope="col">Operational note</th></tr></thead>
            <tbody>
              <tr><th scope="row">Amazon</th><td>Current image, category, placement, and listing requirements.</td><td>Exact product and variant; corresponding face; logo, printed values, count, components, color, and packaging.</td><td>Run fidelity review before treating an export as a candidate for listing review.</td></tr>
              <tr><th scope="row">Google Merchant Center</th><td>Product-data specification, image-link rules, quality, content, and any applicable automated-image disclosure requirements.</td><td>The product shown should agree with the approved product and the submitted offer data.</td><td>Recheck the specification when feeds, policies, or image-processing guidance change.</td></tr>
              <tr><th scope="row">eBay</th><td>Picture policy and listing accuracy requirements.</td><td>Confirm that the visible item, variation, included parts, and package claims match the approved evidence.</td><td>Do not use a visually similar variation as proof of the item being sold.</td></tr>
              <tr><th scope="row">Shopify</th><td>Media upload, ordering, theme crop, responsive presentation, accessibility, and storefront QA.</td><td>Check product truth before the asset enters product media.</td><td>Shopify hosts and renders media; store operators define the approval workflow.</td></tr>
              <tr><th scope="row">TikTok Shop and ads</th><td>Current listing or advertising creative requirements and review processes.</td><td>Review every generated or automatically varied creative that visibly depicts the product.</td><td>Automation can multiply variants; it does not remove the need to inspect product accuracy.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="article-section" aria-labelledby="reference-views">
        <p className="section-label">Corresponding evidence</p>
        <h2 id="reference-views">Use approved views as a reference set, not as interchangeable pictures</h2>
        <p>A front, back, side, and detail image answer different approval questions. Save named approved views for the exact product and variant, then explicitly select the view that corresponds to the candidate. Pairvu keeps one current version per view role and preserves earlier versions in history.</p>
        <div className="feature-list">
          <article><h3>Front</h3><p>Best for brand identity, hero artwork, variant wording, prominent printed values, and front-facing components.</p></article>
          <article><h3>Back</h3><p>Use for rear instructions, warnings, ingredients, claims, icons, and face-specific layout.</p></article>
          <article><h3>Left or right side</h3><p>Use when side labels, closures, handles, depth, or construction details are approval-critical.</p></article>
          <article><h3>Detail</h3><p>Use for a bounded region such as a seal, applicator, texture, label value, or included accessory; do not use it to prove the complete silhouette.</p></article>
        </div>
        <p>If the corresponding view does not exist, request it or route the unsupported attributes to REVIEW. Do not infer hidden artwork from a recognizable package.</p>
      </section>

      <section className="article-section" aria-labelledby="controlled-examples">
        <p className="section-label">Controlled evidence</p>
        <h2 id="controlled-examples">Three outcomes from one laundry-sheets product</h2>
        <p>These founder-reviewed controlled comparisons are not customer case studies or statistical claims. Together, they show why product truth and image presentation must be evaluated separately.</p>
        <div className="link-grid">
          <Link href="/examples/laundry-sheets-scent-count-change"><strong>FAIL · Scent and sheet count changed</strong><span>FRESH LINEN became UNSCENTED and 30 SHEETS became 20 SHEETS while the overall carton remained familiar.</span></Link>
          <Link href="/examples/laundry-sheets-background-change"><strong>PASS · Background changed, product matched</strong><span>The laundry-room scene changed while the observable brand, front text, count, color, components, and package remained stable.</span></Link>
          <Link href="/examples/laundry-sheets-back-view-review"><strong>REVIEW · Front details could not be verified</strong><span>The candidate showed the rear panel, so a front-only reference could not prove the logo, scent, sheet count, or load claim.</span></Link>
        </div>
      </section>

      <section className="article-section" aria-labelledby="workflow">
        <p className="section-label">Operational checklist</p>
        <h2 id="workflow">A repeatable pre-publish workflow</h2>
        <ol className="workflow-steps">
          <li><span>1</span><div><strong>Identify the exact offer</strong><p>Confirm product, variant, package revision, region, and destination placement before selecting evidence.</p></div></li>
          <li><span>2</span><div><strong>Select the corresponding approved view</strong><p>Use the same package face or bounded detail that the candidate exposes. Record when required evidence is missing.</p></div></li>
          <li><span>3</span><div><strong>Compare the final export</strong><p>Run the check after generation, retouching, compositing, cropping, and copy changes—not only on an intermediate draft.</p></div></li>
          <li><span>4</span><div><strong>Route PASS, REVIEW, and FAIL</strong><p>Continue a supported match, collect evidence for a limitation, and correct a confirmed product change.</p></div></li>
          <li><span>5</span><div><strong>Apply current platform rules</strong><p>Use the official source for the platform, category, placement, and market. Preserve the date and reviewer when the asset is approved.</p></div></li>
          <li><span>6</span><div><strong>Inspect the published surface</strong><p>Confirm storefront crop, responsive rendering, image order, alt text, and agreement with listing data after upload.</p></div></li>
        </ol>
      </section>

      <section className="article-section" aria-labelledby="official-sources">
        <p className="section-label">Primary sources</p>
        <h2 id="official-sources">Check current rules at the source</h2>
        <p>Platform rules change. The summaries above define a review workflow, not a permanent substitute for official documentation.</p>
        <ul className="source-list">
          <li><a href="https://sellercentral.amazon.com/seller-forums/discussions/t/4b3c4c39-6f8c-4312-aa0e-99982eb8f5e1/" rel="noreferrer">Amazon Seller Central: product image requirements overview</a></li>
          <li><a href="https://support.google.com/merchants/answer/7052112?hl=en" rel="noreferrer">Google Merchant Center: product data specification</a></li>
          <li><a href="https://support.google.com/merchants/answer/16989427?hl=en" rel="noreferrer">Google Merchant Center: image and AI-related product data updates</a></li>
          <li><a href="https://www.ebay.com/help/listing-policies/policies/picture-policy?id=4370" rel="noreferrer">eBay: picture policy</a></li>
          <li><a href="https://help.shopify.com/en/manual/products/product-media" rel="noreferrer">Shopify Help Center: product media</a></li>
          <li><a href="https://seller-us.tiktok.com/university/essay?course_type=1&from=search&identity=1&knowledge_id=3196690250417921&role=1" rel="noreferrer">TikTok Shop Academy: product listing image guidance</a></li>
        </ul>
        <p className="content-updated">Primary sources and product workflow reviewed September 6, 2026.</p>
      </section>

      <section className="article-section category-boundary" aria-labelledby="limits">
        <p className="section-label">Scope boundary</p>
        <h2 id="limits">What this process cannot certify</h2>
        <ul className="check-list">
          <li>A Pairvu verdict does not certify legal, regulatory, accessibility, marketplace, or advertising compliance.</li>
          <li>Hidden or unreadable attributes cannot be approved from inference; collect corresponding evidence.</li>
          <li>Platform documentation can change after this guide is reviewed; verify the live requirement before publishing.</li>
          <li>Automated comparison does not replace the merchant&apos;s product data, rights, claims, and final human approval responsibilities.</li>
        </ul>
      </section>

      <section className="article-section" aria-labelledby="faq">
        <p className="section-label">Questions</p>
        <h2 id="faq">Ecommerce product image requirements FAQ</h2>
        <div className="category-faq-list">{faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
      </section>

      <section className="article-section article-cta">
        <h2>Check product truth before channel eligibility</h2>
        <p>Compare the final candidate with the corresponding approved view, resolve supported product differences, then apply the current requirements for its publishing destination.</p>
        <div className="content-actions">
          <Link className="primary-link-button" href="/#checker">Check image</Link>
          <Link className="text-link" href="/checks/product-image-observability">Review observability</Link>
          <Link className="text-link" href="/examples/controlled-visual-qa-benchmark">Explore the benchmark</Link>
          <Link className="text-link" href="/use-cases/ecommerce-product-image-qa">See the ecommerce workflow</Link>
        </div>
      </section>
    </div>
  </main>;
}
