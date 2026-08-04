import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { articleSchema, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/guides/ai-product-photography-checklist");

export const metadata: Metadata = pageMetadata(page);

const checklist = [
  ["Reference", "Use the correct approved product image and variant."],
  ["Logo", "Confirm the brand mark, brand name, and visible placement."],
  ["Visible text", "Read the product name, variant, claims, and printed values."],
  ["Product count", "Count visible primary products or packages."],
  ["Main color", "Check product and packaging color, allowing for lighting and reflection."],
  ["Major components", "Confirm important caps, pumps, applicators, handles, and attachments."],
  ["Shape and packaging", "Compare the container form, silhouette, and package structure."],
  ["Observability", "Send hidden, cropped, tiny, or unreadable details to human review."],
];

export default function ChecklistPage() {
  return (
    <>
      <StructuredData data={articleSchema(page)} />
      <main className="content-page">
        <div className="content-container narrow-content">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Guides", href: "/guides" },
              { label: "Pre-Publish Checklist", href: page.route },
            ]}
          />
          <header className="content-hero content-hero-compact">
            <p className="eyebrow">Pre-publish workflow</p>
            <h1>{page.h1}</h1>
            <p className="content-deck">
              Compare the final AI-generated or edited image with an approved original. Check visible product
              identity first, then decide whether the image can pass, needs review, or should be stopped.
            </p>
          </header>

          <section className="article-section" aria-labelledby="checklist">
            <h2 id="checklist">Eight checks before publishing</h2>
            <ol className="numbered-checklist">
              {checklist.map(([title, detail]) => (
                <li key={title}>
                  <strong>{title}</strong>
                  <p>{detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="article-section" aria-labelledby="decision">
            <h2 id="decision">PASS, REVIEW, or FAIL</h2>
            <div className="decision-table-wrap">
              <table className="decision-table">
                <thead>
                  <tr>
                    <th>Decision</th>
                    <th>Use it when</th>
                    <th>Next action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>PASS</td>
                    <td>Supported details are visible and show no meaningful product change.</td>
                    <td>Continue the normal approval workflow.</td>
                  </tr>
                  <tr>
                    <td>REVIEW</td>
                    <td>A detail is uncertain, hidden, unreadable, or not shown on corresponding views.</td>
                    <td>Ask a human or obtain a better candidate image.</td>
                  </tr>
                  <tr>
                    <td>FAIL</td>
                    <td>A meaningful visible product difference is confirmed.</td>
                    <td>Do not publish until the candidate is corrected and checked again.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="article-section" aria-labelledby="limits">
            <h2 id="limits">Keep marketplace and legal checks separate</h2>
            <p>
              This checklist covers visible product fidelity. It does not guarantee marketplace acceptance,
              regulatory compliance, legal rights, or product authenticity. Apply the relevant publishing rules
              separately.
            </p>
          </section>

          <section className="article-section article-cta">
            <h2>Run the visual comparison</h2>
            <p>Upload the approved original and the final image to check.</p>
            <div className="content-actions">
              <Link className="primary-link-button" href="/#checker">
                Check image
              </Link>
              <Link className="text-link" href="/examples">
                Review failure modes
              </Link>
              <Link className="text-link" href="/checks/product-components">
                Check included components
              </Link>
            </div>
          </section>
          <p className="content-updated">Last updated: August 4, 2026</p>
        </div>
      </main>
    </>
  );
}
