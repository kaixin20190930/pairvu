import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/app/account/SignOutButton";
import { BillingActions } from "@/app/account/BillingActions";
import { DeleteImagesButton } from "@/app/account/DeleteImagesButton";
import { AccountWorkspaceNav } from "@/components/AccountWorkspaceNav";
import { getWorkspaceAccountSnapshot, listRecentWorkspaceAnalyses } from "@/lib/accounts/repository";
import { createPairvuAuth } from "@/lib/auth/server";
import { listWorkspaceBatches } from "@/lib/batches/repository";
import { isLiveStripeBillingConfigured } from "@/lib/billing/access";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your Pairvu workspace and product check allowance.",
  robots: { index: false, follow: false },
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ billing?: string }> }) {
  const env = getVisualQAEnv();
  const session = await createPairvuAuth(env).api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const snapshot = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  });
  const usagePercent = snapshot.allowance === 0
    ? 0
    : Math.min(100, ((snapshot.consumed + snapshot.reserved) / snapshot.allowance) * 100);
  const [recentAnalyses, recentBatches] = await Promise.all([
    listRecentWorkspaceAnalyses(env.VISUALQA_DB, snapshot.workspaceId),
    listWorkspaceBatches(env.VISUALQA_DB, snapshot.workspaceId, 10),
  ]);
  const activeBatch = recentBatches.find((batch) => batch.status === "queued" || batch.status === "processing");
  const billingState = (await searchParams).billing;
  return (
    <main className="account-page">
      <div className="account-shell">
        <AccountWorkspaceNav />
        {billingState === "success" ? (
          <p className="account-banner account-banner-success">Payment received. Your plan will update as soon as Stripe confirms the subscription.</p>
        ) : null}
        {billingState === "canceled" ? (
          <p className="account-banner">Checkout was canceled. Your current plan has not changed.</p>
        ) : null}
        {billingState === "existing" ? (
          <p className="account-banner">You already have a subscription. Review its status or manage it below.</p>
        ) : null}
        {billingState === "pack-success" ? (
          <p className="account-banner account-banner-success">Payment received. Extra checks will appear as soon as Stripe confirms the purchase.</p>
        ) : null}
        {billingState === "plan-updated" ? (
          <p className="account-banner account-banner-success">Your plan change is being confirmed by Stripe.</p>
        ) : null}
        <header className="account-heading">
          <div>
            <p className="eyebrow">Personal workspace</p>
            <h1>{snapshot.workspaceName}</h1>
            <p>{session.user.email}</p>
          </div>
          <SignOutButton />
        </header>

        <section className="account-metric-grid" aria-label="Plan and usage">
          <article className="account-metric">
            <span>Current plan</span>
            <strong>{snapshot.planName}</strong>
            <small>{planStatusLabel(snapshot)}</small>
          </article>
          <article className="account-metric">
            <span>Checks available</span>
            <strong>{snapshot.available}</strong>
            <small>{snapshot.monthlyAvailable} monthly · {snapshot.packAvailable} extra</small>
          </article>
          <article className="account-metric">
            <span>Image retention</span>
            <strong>{snapshot.retentionDays} days</strong>
            <small>Originals and analysis derivatives</small>
          </article>
        </section>

        <section className="account-section" aria-labelledby="billing-title">
          <p className="eyebrow">Subscription and billing</p>
          <h2 id="billing-title">Your subscription</h2>
          <p className="account-period-copy">
            Review the current billing period here. Stripe securely handles payment methods, invoices, cancellation, and reactivation.
          </p>
          <BillingActions
            billingEnabled={isLiveStripeBillingConfigured(env)}
            billingManaged={snapshot.billingManaged}
            currentPlan={snapshot.planCode}
            subscriptionStatus={snapshot.subscriptionStatus}
            cancelAtPeriodEnd={snapshot.cancelAtPeriodEnd}
            periodEndsOn={formatDate(snapshot.periodEndsAt)}
          />
        </section>

        <section className="account-section" aria-labelledby="usage-title">
          <div className="account-section-heading">
            <div>
              <p className="eyebrow">Monthly allowance</p>
              <h2 id="usage-title">Product checks</h2>
            </div>
            <span>{snapshot.consumed} used · {snapshot.reserved} reserved</span>
          </div>
          <div className="credit-progress" aria-label={`${usagePercent.toFixed(0)} percent of allowance used`}>
            <span style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="account-period-copy">
            Current period ends {formatDate(snapshot.periodEndsAt)}. Unused checks do not carry forward to the next billing period.
          </p>
          <div className="account-pack-balance">
            <div>
              <strong>Extra check packs</strong>
              <p>
                {snapshot.packAvailable > 0
                  ? `${snapshot.packAvailable} extra checks available${snapshot.packNextExpiryAt ? ` · next expiry ${formatDate(snapshot.packNextExpiryAt)}` : ""}.`
                  : "No extra checks are currently available."}
              </p>
            </div>
            <Link className="secondary-link-button" href="/pricing#check-packs">Buy extra checks</Link>
          </div>
        </section>

        <section className="account-section account-retention" aria-labelledby="retention-title">
          <p className="eyebrow">Privacy and retention</p>
          <h2 id="retention-title">New uploaded images are retained for {snapshot.retentionDays} days</h2>
          <p>
            This includes uploaded originals, normalized analysis images, and thumbnails. Images uploaded before a plan change keep the deletion date assigned when they were uploaded. Result metadata may be retained for up to 12 months without exposing deleted image URLs.
          </p>
          <DeleteImagesButton
            endpoint="/api/account/assets"
            label="Delete all workspace images"
            confirmMessage="Permanently delete every uploaded original, analysis derivative, and thumbnail in this workspace? Result metadata and your account will remain. This cannot be undone."
          />
        </section>

        {activeBatch ? (
          <section className="account-section account-active-batch" aria-labelledby="active-batch-title">
            <div className="account-section-heading">
              <div>
                <p className="eyebrow">Batch in progress</p>
                <h2 id="active-batch-title">Your candidate images are still being checked</h2>
              </div>
              <strong>{activeBatch.completedItemCount + activeBatch.failedItemCount} of {activeBatch.itemCount} finished</strong>
            </div>
            <p>
              The saved batch continues if you leave the page. Return to its live status to review progress or cancel checks that have not started.
            </p>
            <Link className="primary-link-button account-batch-link" href={`/account/batches/new?batchId=${activeBatch.id}`}>
              View batch progress
            </Link>
          </section>
        ) : null}

        <section className="account-section" aria-labelledby="history-title">
          <div className="account-section-heading">
            <div>
              <p className="eyebrow">Recent checks</p>
              <h2 id="history-title">Your product image results</h2>
            </div>
            <Link href="/">New check</Link>
          </div>
          {recentAnalyses.length === 0 ? (
            <p className="account-history-empty">Completed checks will appear here after you run them while signed in.</p>
          ) : (
            <div className="account-history-list">
              {recentAnalyses.map((analysis) => (
                <article className="account-history-row" key={analysis.id}>
                  <Link className="account-history-main" href={`/?analysis=${analysis.id}`}>
                    <span className={`account-history-verdict verdict-${analysis.verdict.toLowerCase()}`}>
                      {analysis.verdict}
                    </span>
                    <span className="account-history-summary">
                      <strong>{historySummary(analysis.issueCount, analysis.limitationCount)}</strong>
                      <small>{formatDateTime(analysis.completedAt)}{analysis.category ? ` · ${formatCategory(analysis.category)}` : ""}</small>
                    </span>
                    <span className="account-history-availability">
                      {analysis.imagesAvailable ? "Images available" : "Images deleted or expired"}
                    </span>
                  </Link>
                  {analysis.imagesAvailable ? (
                    <DeleteImagesButton
                      endpoint={`/api/analyses/${analysis.id}`}
                      confirmMessage="Permanently delete the original, candidate, and analysis derivatives for this result? The verdict and text evidence will remain."
                    />
                  ) : null}
                </article>
              ))}
            </div>
          )}
          <p className="account-history-note">
            Images follow your {snapshot.retentionDays}-day retention period. Result metadata may remain available after images expire.
          </p>
        </section>

        <section className="account-section account-coming-next" aria-labelledby="next-title">
          <p className="eyebrow">Batch workflow</p>
          <h2 id="next-title">Check multiple candidate images</h2>
          <p>
            Compare one approved product image with multiple candidate images. Each candidate uses one check, and the batch continues if you leave or refresh the page.
          </p>
          <div className="account-batch-actions">
            <Link className="primary-link-button account-batch-link" href="/account/batches/new">Start a batch check</Link>
            <Link href="/account/batches">View batch history</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

function historySummary(issueCount: number, limitationCount: number): string {
  if (issueCount === 0 && limitationCount === 0) return "No product differences confirmed";
  const parts: string[] = [];
  if (issueCount > 0) parts.push(`${issueCount} product ${issueCount === 1 ? "difference" : "differences"}`);
  if (limitationCount > 0) parts.push(`${limitationCount} ${limitationCount === 1 ? "review item" : "review items"}`);
  return parts.join(" · ");
}

function formatCategory(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function planStatusLabel(snapshot: Awaited<ReturnType<typeof getWorkspaceAccountSnapshot>>): string {
  if (!snapshot.billingManaged) return "Free workspace";
  if (snapshot.subscriptionStatus === "past_due" || snapshot.subscriptionStatus === "incomplete") {
    return "Payment needs attention";
  }
  if (snapshot.cancelAtPeriodEnd) return `Access ends ${formatDate(snapshot.periodEndsAt)}`;
  return `Renews ${formatDate(snapshot.periodEndsAt)}`;
}
