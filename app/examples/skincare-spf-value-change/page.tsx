import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/skincare-spf-value-change");
export const metadata: Metadata = pageMetadata(page);

export default function SkincareSpfValueChangePage() {
  return <main className="content-page"><StructuredData data={articleSchema(page)} /><div className="content-container">
    <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Examples",href:"/examples"},{label:"SPF value change",href:page.route}]} />
    <header className="content-hero content-hero-compact"><p className="eyebrow">Controlled skincare example</p><h1>{page.h1}</h1><p className="content-deck">The candidate preserves the SOLVANE package, logo, product name, broad-spectrum wording, 20 g weight, colors, and shape, but changes the approval-critical protection value from SPF 50+ to SPF 30.</p></header>
    <CaseComparison original={{src:"/examples/skincare-spf-change/original.png",alt:"Approved SOLVANE sun stick labeled SPF 50+",label:"Approved original",detail:"SOLVANE Clear Sun Stick, SPF 50+"}} candidate={{src:"/examples/skincare-spf-change/candidate.png",alt:"Candidate SOLVANE sun stick with SPF changed to 30",label:"Image to check",detail:"Same package, SPF 30"}} />
    <section className="article-section"><h2>Why the result is FAIL</h2><div className="case-fact-grid"><div><span>Changed attribute</span><strong>Printed SPF value</strong></div><div><span>Observed decision</span><strong>FAIL</strong></div><div><span>Evidence</span><strong>50+ became 30</strong></div></div><p>SPF is identity-bearing customer information, not decorative copy. A visually convincing candidate can represent the wrong sellable product when that number changes. The candidate must be corrected and checked again before publication.</p></section>
    <section className="article-section"><h2>What stayed stable</h2><ul className="check-list"><li>The SOLVANE name and sun symbol remain visible and aligned.</li><li>CLEAR SUN STICK, BROAD SPECTRUM, and 20 g remain readable.</li><li>The yellow body, white cap, lower twist control, product count, and package silhouette remain stable.</li></ul></section>
    <section className="article-section article-cta"><h2>Check skincare values before publishing</h2><p>Compare the approved SKU with the final candidate so a plausible image does not advertise the wrong strength, volume, shade, or variant.</p><div className="content-actions"><Link className="primary-link-button" href="/#checker">Check image</Link><Link className="text-link" href="/categories/skincare-product-image-qa">Use the skincare workflow</Link></div></section>
  </div></main>;
}
