import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/cold-brew-condensation-change");
export const metadata: Metadata = pageMetadata(page);

export default function ColdBrewCondensationChangePage() {
  return <main className="content-page"><StructuredData data={articleSchema(page)} /><div className="content-container">
    <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Examples",href:"/examples"},{label:"Condensation change",href:page.route}]} />
    <header className="content-hero content-hero-compact"><p className="eyebrow">Beverage hard-negative example</p><h1>{page.h1}</h1><p className="content-deck">The candidate adds realistic condensation and stronger surface highlights. Those changes make the photograph feel colder, but they do not change the observable MORROW product.</p></header>
    <CaseComparison original={{src:"/examples/cold-brew-condensation-change/original.png",alt:"Approved MORROW Vanilla Oat cold-brew can without condensation",label:"Approved original",detail:"Clean studio can"}} candidate={{src:"/examples/cold-brew-condensation-change/candidate.png",alt:"Same MORROW Vanilla Oat cold-brew can with condensation droplets",label:"Image to check",detail:"Same can with condensation"}} />
    <section className="article-section"><h2>Why the result is PASS</h2><div className="case-fact-grid"><div><span>Changed attribute</span><strong>Surface moisture and highlights</strong></div><div><span>Observed decision</span><strong>PASS</strong></div><div><span>Reason</span><strong>Product identity remained observable</strong></div></div><p>Condensation belongs to the photographic presentation, not the packaged product definition. A useful image checker must ignore realistic droplets when the brand, variant, capacity, count, color system, components, and package shape can still be compared directly.</p></section>
    <section className="article-section"><h2>What Pairvu verified</h2><ul className="check-list"><li>The MORROW name and rising-sun logo remain unchanged.</li><li>COLD BREW, VANILLA OAT, and 250 mL remain readable.</li><li>One complete maroon-and-cream can is present in both images.</li><li>The aluminum top, bottom, label panel, proportions, and silhouette remain consistent.</li></ul></section>
    <section className="article-section"><h2>When condensation should become REVIEW</h2><p>Surface effects are harmless only while the approval evidence remains visible. REVIEW is the honest result when dense droplets, frost, specular glare, colored reflections, or a tight crop hide a flavor name, printed value, logo, closure, color-bearing package region, or full product contour. Hidden evidence is not proof of either a match or a mismatch.</p><div className="content-actions"><Link className="text-link" href="/checks/product-image-observability">Understand image observability</Link><Link className="text-link" href="/categories/beverage-product-image-qa">Use the beverage workflow</Link></div></section>
    <section className="article-section article-cta"><h2>Separate product changes from photo treatments</h2><p>Use an approved reference to catch meaningful beverage changes without rejecting every new lighting, condensation, shadow, or scene treatment.</p><div className="content-actions"><Link className="primary-link-button" href="/#checker">Check image</Link><Link className="text-link" href="/examples">See all comparison examples</Link></div></section>
  </div></main>;
}
