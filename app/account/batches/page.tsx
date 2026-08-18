import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getWorkspaceAccountSnapshot } from "@/lib/accounts/repository";
import { createPairvuAuth } from "@/lib/auth/server";
import { listWorkspaceBatches } from "@/lib/batches/repository";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { DeleteImagesButton } from "@/app/account/DeleteImagesButton";
import { AccountWorkspaceNav } from "@/components/AccountWorkspaceNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Batch history", robots: { index: false, follow: false } };

export default async function BatchHistoryPage() {
  const env = getVisualQAEnv();
  const session = await createPairvuAuth(env).api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?next=/account/batches");
  const snapshot = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  });
  const batches = await listWorkspaceBatches(env.VISUALQA_DB, snapshot.workspaceId, 50);

  return <main className="account-page batch-page"><div className="account-shell batch-shell">
    <AccountWorkspaceNav />
    <header className="batch-heading"><div><p className="eyebrow">Batch history</p><h1>Your batch product checks</h1><p>Return to a saved batch, review exceptions, or export its persisted results.</p></div><Link className="primary-link-button" href="/account/batches/new">New batch</Link></header>
    <section className="account-section">
      {batches.length === 0 ? <div className="batch-history-empty"><h2>No batches yet</h2><p>Start with one approved product and a group of candidate images.</p></div> : <div className="batch-history-list">
        {batches.map((batch) => <article className="batch-history-row" key={batch.id}>
          <Link className="batch-history-main" href={`/account/batches/new?batchId=${batch.id}`}>
            <div><strong>{formatStatus(batch.status)}</strong><small>{formatDateTime(batch.createdAt)} · {batch.itemCount} check{batch.itemCount === 1 ? "" : "s"}</small></div>
            <div className="batch-history-counts"><span className="verdict-fail">{batch.failCount} FAIL</span><span className="verdict-review">{batch.reviewCount} REVIEW</span><span className="verdict-pass">{batch.passCount} PASS</span>{batch.failedItemCount > 0 ? <span>{batch.failedItemCount} error</span> : null}</div>
          </Link>
          {!isActive(batch.status) ? <DeleteImagesButton endpoint={`/api/batches/${batch.id}`} label="Delete batch images" confirmMessage="Permanently delete all originals, candidates, analysis derivatives, and thumbnails used by this batch? Batch result metadata and CSV evidence will remain." /> : null}
        </article>)}
      </div>}
    </section>
  </div></main>;
}

function formatStatus(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function isActive(value: string) { return value === "queued" || value === "processing"; }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" }).format(new Date(value)); }
