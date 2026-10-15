import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { absoluteUrl, articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/examples/coca-cola-can-background-edit");
const sourcePage = "https://commons.wikimedia.org/wiki/File:Coca-Cola_330ml_can.jpg";
const license = "https://creativecommons.org/licenses/by-sa/4.0/";
const assetRoot = "/examples/coca-cola-can-background-edit";
const images = [
  {
    file: "original.jpg", label: "Original photograph · May 1, 2018", width: 2740, height: 2095,
    alt: "Historical red Coca-Cola 330 mL can with a referee figurine beside a glass on a wooden table",
    detail: "Ossewa’s unmodified Commons photograph. The glass, paper, table, and distant objects surround the can.",
  },
  {
    file: "candidate.png", label: "Only AI edit output · October 15, 2026", width: 1434, height: 1097,
    alt: "Only AI edit output showing the red Coca-Cola can and referee figurine on a pale gray studio surface",
    detail: "The requested studio background appears, with changes to composition, highlights, and surface rendering.",
  },
];

export const metadata: Metadata = pageMetadata(page);

const imageSchemas = images.map((image, index) => ({
  "@type": "ImageObject",
  contentUrl: absoluteUrl(`${assetRoot}/${image.file}`),
  caption: image.detail,
  width: image.width,
  height: image.height,
  creditText: index === 0 ? "Ossewa / Wikimedia Commons" : "AI background adaptation by Pairvu of Ossewa’s photograph",
  creator: { "@type": index === 0 ? "Person" : "Organization", name: index === 0 ? "Ossewa" : "Pairvu" },
  license,
  acquireLicensePage: sourcePage,
  isBasedOn: sourcePage,
}));

export default function CocaColaBackgroundEditPage() {
  return (
    <main className="content-page">
      <StructuredData data={{ ...articleSchema(page), image: imageSchemas }} />
      <div className="content-container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Examples", href: "/examples" }, { label: "Real background edit", href: page.route }]} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">One licensed photograph · One edit · One local comparison</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">A background edit can leave recognizable label details while changing the product’s presentation. We edited one historical Coca-Cola can photograph once, then ran Pairvu once. The final result was REVIEW: five of six selected checks were sufficiently observable.</p>
        </header>

        <figure className="case-comparison">
          <div className="case-comparison-grid">
            {images.map((image) => (
              <div className="case-image-panel" key={image.file}>
                <div className="case-image-heading"><span>{image.label}</span><p>{image.detail}</p></div>
                <Image src={`${assetRoot}/${image.file}`} alt={image.alt} width={image.width} height={image.height} style={{ aspectRatio: "auto", objectFit: "contain" }} sizes="(max-width: 720px) 100vw, 50vw" priority />
              </div>
            ))}
          </div>
          <figcaption>Original photo by Ossewa, via <a className="text-link" href={sourcePage}>Wikimedia Commons</a>, licensed <a className="text-link" href={license}>CC BY-SA 4.0</a>. The only candidate is an AI adaptation under the same license. Both files are shown without corrective editing or selection from alternatives.</figcaption>
        </figure>

        <section className="article-section" aria-labelledby="edit-method">
          <h2 id="edit-method">What we asked the editor to preserve</h2>
          <p>On October 15, 2026, we used Codex’s built-in imagegen for one call producing one output. The instruction was to replace the glass, paper, wooden table, and distant objects with a pale neutral-gray studio tabletop and seamless background. It asked to retain the red 330 mL can, every visible word and logo, silhouette, opened top, referee figurine, viewing angle, position, and scale, without added text, products, or watermarks.</p>
          <p>The original is 2740 × 2095 pixels; the sole candidate is 1434 × 1097 pixels. This report retains that actual output, including deviations from the brief. No additional candidate was generated or selected.</p>
        </section>

        <section className="article-section" aria-labelledby="machine-result">
          <h2 id="machine-result">Pairvu’s single local result: REVIEW</h2>
          <div className="case-fact-grid">
            <div><span>Final machine verdict</span><strong>REVIEW</strong></div>
            <div><span>Sufficiently observable</span><strong>5 of 6 selected checks</strong></div>
            <div><span>Actual comparisons</span><strong>1 local run</strong></div>
          </div>
          <p>The two explicit local files were compared once on October 15, 2026, without a production upload or customer data. The recorded model was OpenAI gpt-4.1-mini, using prompt m0-real-mvp-009+regions-003, QA engine m0-qa-engine-008, and risk policy m0-risk-policy-003.</p>
          <div className="decision-table-wrap">
            <table className="decision-table">
              <thead><tr><th scope="col">Selected check</th><th scope="col">Machine status</th><th scope="col">Recorded scope</th></tr></thead>
              <tbody>
                <tr><th scope="row">Logo</th><td>match</td><td>Recognizable Coca-Cola identity; no meaningful visible difference reported.</td></tr>
                <tr><th scope="row">Visible label text</th><td>match</td><td>The model reported matching ORIGINAL TASTE, Las Vegas promotion, and 330 mL wording.</td></tr>
                <tr><th scope="row">Product quantity</th><td>match</td><td>One primary can in each image.</td></tr>
                <tr><th scope="row">Dominant color</th><td>match</td><td>Red package body with white text.</td></tr>
                <tr><th scope="row">Major components</th><td>match</td><td>Can body, opened pull-tab area, and small referee figurine.</td></tr>
                <tr><th scope="row">Major shape / packaging</th><td>not_observable</td><td>Partial coverage; framing and occlusion limited a complete silhouette and proportions comparison.</td></tr>
              </tbody>
            </table>
          </div>
          <p>Five reported matches do not make the final verdict PASS. The packaging check lacked sufficient comparable evidence. These machine observations are not a character-by-character transcription or proof that every printed glyph is identical.</p>
        </section>

        <section className="article-section" aria-labelledby="human-observation">
          <h2 id="human-observation">Human observation: the background changed, and so did presentation</h2>
          <p>The glass, paper, wooden table, and distant objects were replaced by the requested studio setting. The red can, opened top, referee figurine, Coca-Cola mark, ORIGINAL TASTE line, Las Vegas promotion, and 330 mL marking remain recognizable at the displayed scale.</p>
          <p>The recorded human review also noted that the candidate enlarged the can and moved it from the lower-right composition toward the center, despite the instruction to keep its position and scale. Lighting, highlights, and some surface details were rendered again. Those are material deviations from the editing brief even when identity checks report match.</p>
          <p>Unaided visual inspection cannot prove character-level identity. The machine’s partial-coverage explanation and the human’s composition observations are separate findings; neither establishes that the complete packaging shape was preserved. REVIEW remains unresolved here, with no human approval or release decision implied.</p>
        </section>

        <section className="article-section" aria-labelledby="practical-next-step">
          <h2 id="practical-next-step">What to inspect before using a background edit</h2>
          <p>Check the exported label against the corresponding original region, including digits and units. Compare product scale, placement, and surface detail against the brief, then obtain a view that supports the complete packaging comparison. A recognizable label alone does not establish that the edit preserved the product.</p>
          <p>Use the <Link className="text-link" href="/checks/product-label-text">product label-text check</Link>, the <Link className="text-link" href="/checks/product-image-observability">observability guidance</Link>, and the <Link className="text-link" href="/guides/keep-products-consistent-in-ai-images">background-edit consistency workflow</Link> for those decisions.</p>
        </section>

        <section className="article-section" aria-labelledby="rights-and-limits">
          <h2 id="rights-and-limits">Source, modifications, and limits of this case</h2>
          <p>The source is <a className="text-link" href={sourcePage}>Coca-Cola 330ml can.jpg by Ossewa on Wikimedia Commons</a>, photographed May 1, 2018 and published as the photographer’s own work under <a className="text-link" href={license}>Creative Commons Attribution-ShareAlike 4.0</a>. This is historical 2018 packaging; it does not describe the current product or packaging.</p>
          <p>The original photograph retains that license. Pairvu’s candidate adapts the photograph by replacing the surroundings and changing composition, lighting, and surface rendering, as disclosed above; the adapted image is offered under CC BY-SA 4.0. The license applies to the original photograph and this derivative image, rather than granting a blanket license to the website, software, or unrelated page material. Retain attribution, the license link, and an indication of changes when reusing the images.</p>
          <p>Packaging artwork and trademarks remain subject to their respective rights. This use does not imply Coca-Cola’s endorsement, an official collaboration, or brand approval. The brand is the subject of this example.</p>
          <p>One edit and one local Pairvu run support only the process and observations reported here. This is not a customer case study, a traffic or demand claim, a tool ranking, a statistical accuracy result, or a broader quality benchmark.</p>
          <details style={{ overflowWrap: "anywhere" }}><summary>File integrity: SHA-256</summary><p>Original: <code>88e32149a0c6d97d519edd24f5179f0bbf5d1fe14308358c9d7617db8b563924</code></p><p>Only candidate: <code>95509d417dc34aa96695cddf65e8b7a5bfc740cb729891e82c83c6ef6d93be05</code></p></details>
        </section>
        <p className="content-updated">Case performed and reported: October 15, 2026.</p>
      </div>
    </main>
  );
}
