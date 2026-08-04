import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, breadcrumbSchema, getSeoPage } from "@/lib/seo/content-registry";

type ComponentCasePageProps = {
  route: string;
  eyebrow: string;
  deck: string;
  originalAlt: string;
  candidateAlt: string;
  candidateImage: string;
  candidateDetail: string;
  changedAttribute: string;
  decision: "PASS" | "REVIEW" | "FAIL";
  decisionReason: string;
  analysis: string;
  stable: string[];
  nextAction: string;
};

export function ComponentCasePage(props: ComponentCasePageProps) {
  const page = getSeoPage(props.route);
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Examples", href: "/examples" },
    { label: page.h1, href: page.route },
  ];

  return (
    <main className="content-page">
      <StructuredData data={[breadcrumbSchema(breadcrumbs), articleSchema(page)]} />
      <div className="content-container">
        <Breadcrumbs items={breadcrumbs} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">{props.eyebrow}</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">{props.deck}</p>
        </header>

        <section className="article-section wide-article-section" aria-labelledby="component-comparison">
          <h2 id="component-comparison">Approved set and candidate image</h2>
          <div className="case-comparison-grid">
            <figure>
              <figcaption><span>Approved original</span><strong>Candle jar, lid, and wick trimmer</strong></figcaption>
              <Image src="/examples/candle-components/original.jpg" alt={props.originalAlt} width={1536} height={1536} sizes="(max-width: 760px) 100vw, 520px" priority />
            </figure>
            <figure>
              <figcaption><span>Image to check</span><strong>{props.candidateDetail}</strong></figcaption>
              <Image src={props.candidateImage} alt={props.candidateAlt} width={1536} height={1536} sizes="(max-width: 760px) 100vw, 520px" priority />
            </figure>
          </div>
          <p className="case-caption">Founder-approved controlled images tested through the production Pairvu comparison flow on August 4, 2026.</p>
        </section>

        <section className="article-section" aria-labelledby="component-result">
          <p className="section-label">Observed production result</p>
          <h2 id="component-result">What the evidence supports</h2>
          <div className="case-fact-grid">
            <div><span>Comparison condition</span><strong>{props.changedAttribute}</strong></div>
            <div><span>Observed Pairvu decision</span><strong>{props.decision}</strong></div>
            <div><span>Decision basis</span><strong>{props.decisionReason}</strong></div>
          </div>
          <p>{props.analysis}</p>
        </section>

        <section className="article-section" aria-labelledby="component-stable">
          <h2 id="component-stable">What remained stable</h2>
          <ul className="check-list">{props.stable.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="article-section article-cta">
          <h2>Next approval action</h2>
          <p>{props.nextAction}</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/#checker">Check image</Link>
            <Link className="text-link" href="/checks/product-components">Use the Product Components method</Link>
            <Link className="text-link" href="/examples">See all controlled examples</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
