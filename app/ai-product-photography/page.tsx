import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/ai-product-photography");

export const metadata: Metadata = pageMetadata(page);

export default function AiProductPhotographyPage() {
  return (
    <>
      <StructuredData data={articleSchema(page)} />
      <main className="content-page">
        <div className="content-container">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "AI Product Photography", href: page.route },
            ]}
          />
          <header className="content-hero">
            <p className="eyebrow">Market guide</p>
            <h1>{page.h1}</h1>
            <p className="content-deck">
              AI product photography uses generative or editing systems to create new product scenes, backgrounds,
              and campaign images. It can accelerate production, but the output still needs to preserve the real
              product&apos;s visible identity. A reference-based check helps teams find drift before publishing.
            </p>
            <div className="content-actions">
              <Link className="primary-link-button" href="/#checker">
                Check an AI product photo
              </Link>
              <Link className="secondary-link-button" href="/examples">
                See product change examples
              </Link>
            </div>
          </header>

          <section className="article-section" aria-labelledby="what-it-is">
            <h2 id="what-it-is">What AI product photography changes</h2>
            <p>
              A common workflow starts with an approved packshot or product photo, then asks an AI tool to place the
              product in a new environment, change the background, create campaign variations, or adjust the
              composition. The intended change may be visual context, but generation can also modify pixels that
              belong to the product itself.
            </p>
            <div className="decision-table-wrap">
              <table className="decision-table">
                <thead>
                  <tr>
                    <th>Intended change</th>
                    <th>Unintended product risk</th>
                    <th>Review action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>New background or scene</td>
                    <td>Logo, label text, or product edge is regenerated</td>
                    <td>Compare identity-bearing details with the original</td>
                  </tr>
                  <tr>
                    <td>Lighting or color treatment</td>
                    <td>Product or package color becomes a different variant</td>
                    <td>Separate lighting effects from semantic color changes</td>
                  </tr>
                  <tr>
                    <td>Composition or crop</td>
                    <td>A component becomes hidden or the package is incomplete</td>
                    <td>Require enough coverage before calling it a match</td>
                  </tr>
                  <tr>
                    <td>Scale campaign production</td>
                    <td>Different outputs contain inconsistent counts or packaging</td>
                    <td>Check each candidate against the same approved reference</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="article-section" aria-labelledby="why-reference">
            <h2 id="why-reference">Why an approved reference matters</h2>
            <p>
              An isolated image-quality score can judge composition or sharpness, but it cannot establish whether a
              label, logo, count, or package is faithful to the actual product. Pairvu uses the original and candidate
              as a pair so the question stays concrete: did the candidate visibly change the approved product?
            </p>
            <p>
              This is different from detecting whether an image was made by AI. Provenance detection asks where an
              image came from. Product fidelity checking asks whether the visible product still matches its approved
              reference.
            </p>
          </section>

          <section className="article-section" aria-labelledby="checks">
            <h2 id="checks">Six visible fidelity checks</h2>
            <ul className="check-list">
              <li>
                <strong>Logo:</strong> brand mark, identity, and visible placement.
              </li>
              <li>
                <strong>Visible text:</strong> product name, label claims, and printed values.
              </li>
              <li>
                <strong>Product count:</strong> visible primary units or packages.
              </li>
              <li>
                <strong>Main color:</strong> semantic product and packaging color families.
              </li>
              <li>
                <strong>Major components:</strong> important parts that are missing or added.
              </li>
              <li>
                <strong>Shape and packaging:</strong> container form, silhouette, and major structural identity.
              </li>
            </ul>
          </section>

          <section className="article-section" aria-labelledby="limits">
            <h2 id="limits">What a visual check cannot confirm</h2>
            <p>
              Pairvu checks visible evidence. It cannot prove regulatory compliance, legal rights, product
              authenticity, marketplace acceptance, or details that are hidden, too small, or shown on a different
              package face. Those conditions should remain in REVIEW rather than becoming a false PASS.
            </p>
          </section>

          <section className="article-section article-cta" aria-labelledby="next-step">
            <h2 id="next-step">Add a pre-publish quality-control step</h2>
            <p>
              Start with the approved original, compare the final candidate, and send uncertain details to a human
              reviewer.
            </p>
            <div className="content-actions">
              <Link className="primary-link-button" href="/#checker">
                Check image
              </Link>
              <Link className="text-link" href="/guides/ai-product-photography-checklist">
                Follow the pre-publish checklist
              </Link>
            </div>
          </section>

          <p className="content-updated">Last updated: July 29, 2026</p>
        </div>
      </main>
    </>
  );
}
