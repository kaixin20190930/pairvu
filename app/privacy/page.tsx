import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/privacy");

export const metadata: Metadata = pageMetadata(page);

export default function PrivacyPage() {
  return (
    <main className="checker-shell">
      <article className="checker-surface privacy-content">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Privacy", href: page.route },
          ]}
        />
        <p className="eyebrow">Pairvu public beta</p>
        <h1>Privacy</h1>
        <p>
          Pairvu is designed for product images that may be confidential or not yet released. This page describes
          the current anonymous public beta behavior.
        </p>

        <h2>Image retention</h2>
        <p>
          Anonymous original uploads and any analysis derivatives are retained for no more than 24 hours. An
          automated deletion job removes the image objects and records a metadata tombstone and deletion audit.
        </p>

        <h2>OpenAI processing</h2>
        <p>
          The reference and candidate images are sent to OpenAI only to perform the requested visual comparison.
          Pairvu records provider, model, prompt version, latency and usage telemetry for the analysis.
        </p>

        <h2>Evaluation and training</h2>
        <p>
          Uploaded product images are not added to Pairvu evaluation fixtures or training data by default.
          Production data may only enter a separately controlled evaluation set after explicit review and permission.
        </p>

        <h2>Anonymous sessions</h2>
        <p>
          A random session identifier is stored in your browser so your result and feedback remain bound to the
          session that created the analysis. It is also used for anonymous journey measurement and acquisition
          attribution.
        </p>

        <p>
          <Link href="/">Return to the checker</Link>
        </p>
      </article>
    </main>
  );
}
