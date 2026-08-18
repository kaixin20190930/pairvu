import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseComparison } from "@/components/CaseComparison";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/cold-brew-flavor-volume-change");
export const metadata: Metadata = pageMetadata(page);

export default function ColdBrewFlavorVolumeChangePage() {
  return <main className="content-page"><StructuredData data={articleSchema(page)} /><div className="content-container">
    <Breadcrumbs items={[{label:"Home",href:"/"},{label:"Examples",href:"/examples"},{label:"Cold-brew flavor and volume",href:page.route}]} />
    <header className="content-hero content-hero-compact"><p className="eyebrow">Controlled beverage example</p><h1>{page.h1}</h1><p className="content-deck">The candidate keeps the MORROW brand, sun mark, maroon can, cream label, single-unit count, and slim-can silhouette, but changes two sellable-product attributes: VANILLA OAT becomes MOCHA OAT and 250 mL becomes 330 mL.</p></header>
    <CaseComparison original={{src:"/examples/cold-brew-flavor-volume-change/original.png",alt:"Approved MORROW Vanilla Oat cold brew labeled 250 mL",label:"Approved original",detail:"VANILLA OAT, 250 mL"}} candidate={{src:"/examples/cold-brew-flavor-volume-change/candidate.png",alt:"Candidate MORROW Mocha Oat cold brew labeled 330 mL",label:"Image to check",detail:"MOCHA OAT, 330 mL"}} />
    <section className="article-section"><h2>Why the result is FAIL</h2><div className="case-fact-grid"><div><span>Changed attributes</span><strong>Flavor and printed volume</strong></div><div><span>Observed decision</span><strong>FAIL</strong></div><div><span>Visible evidence</span><strong>VANILLA OAT 250 mL became MOCHA OAT 330 mL</strong></div></div><p>A familiar brand system does not make two variants the same product. Flavor wording identifies the beverage variant, while the printed volume identifies the package size. Either confirmed change is enough to stop publication; together they clearly represent a different commercial SKU.</p></section>
    <section className="article-section"><h2>What stayed stable</h2><ul className="check-list"><li>The MORROW name and rising-sun mark remain visible and aligned.</li><li>Both images show one complete slim aluminum can.</li><li>The maroon body, cream label, top and bottom metal bands, and overall silhouette remain consistent.</li></ul></section>
    <section className="article-section"><h2>How to review beverage candidates</h2><p>Compare corresponding package faces and treat each identity attribute separately. Check brand and logo first, then product or flavor name, formulation claims, printed capacity, visible unit count, container and closure, and only then the semantic color system. Background, reflections, droplets, and position are presentation changes unless they hide the evidence needed for approval.</p><div className="content-actions"><Link className="text-link" href="/checks/product-label-text">Review label-text checks</Link><Link className="text-link" href="/checks/product-quantity">Review quantity checks</Link><Link className="text-link" href="/categories/beverage-product-image-qa">Use the beverage workflow</Link></div></section>
    <section className="article-section article-cta"><h2>Check beverage variants before publishing</h2><p>Compare the approved SKU with the final image so a plausible can does not advertise the wrong flavor, formula, size, or offer.</p><div className="content-actions"><Link className="primary-link-button" href="/#checker">Check image</Link><Link className="text-link" href="/examples">See all comparison examples</Link></div></section>
  </div></main>;
}
