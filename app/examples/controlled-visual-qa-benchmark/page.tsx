import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { BENCHMARK_STATS, CONTROLLED_BENCHMARK, type BenchmarkVerdict } from "@/lib/benchmarks/controlled-visual-qa";
import { absoluteUrl, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/controlled-visual-qa-benchmark");
export const metadata: Metadata = pageMetadata(page);

const verdictOrder: BenchmarkVerdict[] = ["FAIL", "PASS", "REVIEW"];
const featured = CONTROLLED_BENCHMARK.cases.slice(0, 6);

export default function ControlledVisualQaBenchmarkPage() {
  return (
    <main className="content-page benchmark-page">
      <StructuredData data={datasetSchema()} />
      <div className="content-container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Examples", href: "/examples" }, { label: "Controlled benchmark", href: page.route }]} />

        <header className="content-hero benchmark-hero">
          <p className="eyebrow">Version {CONTROLLED_BENCHMARK.version} · Published {CONTROLLED_BENCHMARK.publishedAt}</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">A public, versioned set of founder-reviewed original-versus-candidate comparisons showing when visible product evidence supports FAIL, PASS, or REVIEW.</p>
          <p className="benchmark-boundary">This controlled dataset is not a customer case study, certification, marketplace approval, or estimate of performance on all product images.</p>
          <div className="content-actions">
            <a className="primary-link-button" download href="/benchmarks/controlled-visual-qa/pairvu-controlled-visual-qa-v1.csv">Download CSV</a>
            <a className="text-link" download href="/benchmarks/controlled-visual-qa/pairvu-controlled-visual-qa-v1.json">Download JSON</a>
            <a className="text-link" href="#methodology">Read the methodology</a>
          </div>
        </header>

        <section className="benchmark-stat-grid" aria-label="Benchmark summary">
          <div><strong>{BENCHMARK_STATS.total}</strong><span>controlled comparisons</span></div>
          <div><strong>{BENCHMARK_STATS.productFamilies}</strong><span>product families</span></div>
          <div><strong>{BENCHMARK_STATS.attributes}</strong><span>evidence attributes</span></div>
          <div><strong>{BENCHMARK_STATS.matched}/{BENCHMARK_STATS.total}</strong><span>expected overall verdicts observed</span></div>
        </section>

        <section className="article-section" aria-labelledby="verdict-framework">
          <p className="section-label">Decision framework</p>
          <h2 id="verdict-framework">Changed, matched, and not verifiable are different outcomes</h2>
          <div className="benchmark-verdict-grid">
            <article><span className="benchmark-verdict benchmark-verdict-fail">FAIL</span><h3>Confirmed product change</h3><p>Corresponding evidence is visible and establishes an approval-critical difference.</p></article>
            <article><span className="benchmark-verdict benchmark-verdict-pass">PASS</span><h3>Product remained faithful</h3><p>Presentation may change, while observable identity-bearing product attributes still match.</p></article>
            <article><span className="benchmark-verdict benchmark-verdict-review">REVIEW</span><h3>Evidence is insufficient or intent is unresolved</h3><p>REVIEW does not prove a defect. It prevents an unsupported PASS or FAIL.</p></article>
          </div>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="featured-evidence">
          <p className="section-label">Controlled evidence</p>
          <h2 id="featured-evidence">Two products, all three verdict paths</h2>
          <p>FOLDWELL laundry sheets and SOLVANE sunscreen each contribute a material product change, a harmless scene change, and an observability limitation.</p>
          <div className="case-card-grid benchmark-feature-grid">
            {featured.map((item) => (
              <Link className="case-card" href={item.caseRoute} key={item.caseId}>
                <div className="case-card-images">
                  <Image src={item.originalImage} alt="" width={1000} height={1000} sizes="(max-width: 760px) 45vw, 180px" />
                  <Image src={item.candidateImage} alt={`${item.title} candidate comparison`} width={1000} height={1000} sizes="(max-width: 760px) 45vw, 180px" />
                </div>
                <div><span>{item.observedVerdict} · {roleLabel(item.evidenceRole)}</span><h3>{item.title}</h3><p>{item.controlledCondition}</p></div>
              </Link>
            ))}
          </div>
        </section>

        <section className="article-section" id="methodology" aria-labelledby="methodology-title">
          <p className="section-label">Methodology</p>
          <h2 id="methodology-title">How a comparison enters the benchmark</h2>
          <ol className="workflow-steps benchmark-method">
            <li><span>1</span><div><h3>Anchor the comparison</h3><p>Select one real or approved original and one candidate image.</p></div></li>
            <li><span>2</span><div><h3>Define the controlled condition</h3><p>Record the intended product change, hard negative, or observability limitation and its expected overall verdict.</p></div></li>
            <li><span>3</span><div><h3>Run Pairvu</h3><p>Compare the images through the same visible product-fidelity workflow used by the public checker.</p></div></li>
            <li><span>4</span><div><h3>Founder review</h3><p>Verify the image pair, observed verdict, evidence language, public rights, and scope boundaries before inclusion.</p></div></li>
          </ol>
          <p>The cases are deliberately constructed or selected to exercise known decision boundaries. They are not a random market sample. The {BENCHMARK_STATS.matched} of {BENCHMARK_STATS.total} agreement shown here describes only this frozen controlled set and must not be presented as Pairvu&apos;s general accuracy.</p>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="coverage-title">
          <p className="section-label">Coverage</p>
          <h2 id="coverage-title">Evidence roles and visible attributes</h2>
          <div className="decision-table-wrap">
            <table className="decision-table benchmark-table">
              <thead><tr><th>Attribute</th><th>Product change</th><th>Hard negative</th><th>Observability</th></tr></thead>
              <tbody>{attributeRows().map((row) => <tr key={row.attribute}><th scope="row">{row.attribute}</th>{row.roles.map((covered, index) => <td key={index}>{covered ? "Covered" : "—"}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="article-section" aria-labelledby="results-title">
          <p className="section-label">Results snapshot</p>
          <h2 id="results-title">Overall verdict distribution in v{CONTROLLED_BENCHMARK.version}</h2>
          <div className="benchmark-result-list">
            {verdictOrder.map((verdict) => <div key={verdict}><span className={`benchmark-verdict benchmark-verdict-${verdict.toLowerCase()}`}>{verdict}</span><strong>{BENCHMARK_STATS.verdicts[verdict]} cases</strong></div>)}
          </div>
          <p>Counts describe the composition of this dataset, not the prevalence of errors in real production traffic. No customer images, private telemetry, or billing data are included.</p>
        </section>

        <section className="article-section wide-article-section" aria-labelledby="case-index-title">
          <p className="section-label">Dataset index</p>
          <h2 id="case-index-title">All controlled comparisons</h2>
          <div className="decision-table-wrap">
            <table className="decision-table benchmark-table benchmark-index-table">
              <thead><tr><th>Case</th><th>Family</th><th>Role</th><th>Attribute</th><th>Expected</th><th>Observed</th></tr></thead>
              <tbody>{CONTROLLED_BENCHMARK.cases.map((item) => <tr key={item.caseId}><th scope="row"><Link href={item.caseRoute}>{item.title}</Link></th><td>{item.productFamily}</td><td>{roleLabel(item.evidenceRole)}</td><td>{attributeLabel(item.primaryAttribute)}</td><td>{item.expectedVerdict}</td><td><strong>{item.observedVerdict}</strong></td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="article-section" aria-labelledby="limitations-title">
          <p className="section-label">Limitations</p>
          <h2 id="limitations-title">What this benchmark does not establish</h2>
          <ul className="check-list">
            <li>It does not measure performance on a random or representative sample of all product images.</li>
            <li>It does not verify advertising claims, ingredients, barcode data, physical authenticity, legal compliance, or marketplace acceptance.</li>
            <li>PASS applies to observable product fidelity, not every creative, technical, or channel-specific requirement.</li>
            <li>REVIEW means evidence or intent is unresolved; it is not proof that the product changed.</li>
            <li>Future changes to cases or decision methodology require a dated version update and change log.</li>
          </ul>
        </section>

        <section className="article-section" aria-labelledby="version-history-title">
          <p className="section-label">Version history</p>
          <h2 id="version-history-title">A frozen, traceable release</h2>
          <div className="decision-table-wrap">
            <table className="decision-table benchmark-table">
              <thead><tr><th>Version</th><th>Date</th><th>Change</th></tr></thead>
              <tbody><tr><th scope="row">1.0</th><td>August 20, 2026</td><td>Initial public release with 19 controlled comparisons.</td></tr></tbody>
            </table>
          </div>
          <p>Later edits to cases, labels, or methodology will ship under a new version instead of silently changing this release.</p>
        </section>

        <section className="article-section benchmark-citation" aria-labelledby="citation-title">
          <p className="section-label">Citation and reuse</p>
          <h2 id="citation-title">Reference the frozen v{CONTROLLED_BENCHMARK.version} dataset</h2>
          <blockquote>Pairvu. “Pairvu Controlled Visual QA Benchmark v{CONTROLLED_BENCHMARK.version}.” 2026. {absoluteUrl(page.route)}</blockquote>
          <p>Dataset metadata may be reused with attribution. Product images remain all rights reserved unless a specific asset states otherwise.</p>
          <div className="content-actions"><a className="text-link" download href="/benchmarks/controlled-visual-qa/pairvu-controlled-visual-qa-v1.csv">CSV distribution</a><a className="text-link" download href="/benchmarks/controlled-visual-qa/pairvu-controlled-visual-qa-v1.json">JSON distribution</a></div>
        </section>

        <section className="article-section" aria-labelledby="interpretation-title">
          <p className="section-label">Interpretation guides</p>
          <h2 id="interpretation-title">Connect the dataset to specific QA decisions</h2>
          <div className="link-grid">
            <Link href="/checks/product-label-text"><strong>Label text</strong><span>Identity wording and printed values</span></Link>
            <Link href="/checks/product-logo"><strong>Product logo</strong><span>Visible brand-mark identity</span></Link>
            <Link href="/checks/product-quantity"><strong>Product quantity</strong><span>Visible primary-unit count</span></Link>
            <Link href="/checks/product-components"><strong>Components</strong><span>Missing, added, or hidden parts</span></Link>
            <Link href="/checks/product-packaging"><strong>Packaging</strong><span>Container structure and silhouette</span></Link>
            <Link href="/checks/product-image-observability"><strong>Observability</strong><span>When evidence supports REVIEW</span></Link>
          </div>
        </section>

        <section className="article-section article-cta"><h2>Compare your own product image pair</h2><p>Use an approved original as the reference, then review the final candidate before publication.</p><div className="content-actions"><Link className="primary-link-button" href="/#checker">Check image</Link><Link className="text-link" href="/examples">Explore every example</Link><Link className="text-link" href="/how-pairvu-works">How Pairvu works</Link></div></section>
      </div>
    </main>
  );
}

function datasetSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${absoluteUrl(page.route)}#dataset`,
    name: CONTROLLED_BENCHMARK.name,
    description: page.description,
    url: absoluteUrl(page.route),
    version: CONTROLLED_BENCHMARK.version,
    datePublished: CONTROLLED_BENCHMARK.publishedAt,
    dateModified: CONTROLLED_BENCHMARK.updatedAt,
    creator: { "@id": "https://pairvu.com/#organization" },
    publisher: { "@id": "https://pairvu.com/#organization" },
    isAccessibleForFree: true,
    measurementTechnique: "Founder-reviewed controlled original-versus-candidate visual comparison",
    license: absoluteUrl(`${page.route}#citation-title`),
    variableMeasured: ["Expected verdict", "Observed verdict", "Evidence role", "Visible product attribute"],
    distribution: [
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: absoluteUrl("/benchmarks/controlled-visual-qa/pairvu-controlled-visual-qa-v1.csv") },
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: absoluteUrl("/benchmarks/controlled-visual-qa/pairvu-controlled-visual-qa-v1.json") },
    ],
  };
}

function roleLabel(role: string) { return role === "product_change" ? "Product change" : role === "hard_negative" ? "Hard negative" : "Observability"; }
function attributeLabel(attribute: string) { return attribute.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "); }
function attributeRows() {
  const roles = ["product_change", "hard_negative", "observability"] as const;
  return [...new Set(CONTROLLED_BENCHMARK.cases.map((item) => item.primaryAttribute))].map((attribute) => ({
    attribute: attributeLabel(attribute),
    roles: roles.map((role) => CONTROLLED_BENCHMARK.cases.some((item) => item.primaryAttribute === attribute && item.evidenceRole === role)),
  }));
}
