import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { PricingPlanAction } from "@/app/pricing/PricingPlanAction";
import { PricingPackAction } from "@/app/pricing/PricingPackAction";
import { PricingActivationPanel } from "@/app/pricing/PricingActivationPanel";
import { PLAN_CODES, PLAN_ENTITLEMENTS } from "@/lib/billing/plans";
import { CHECK_PACK_CODES, CHECK_PACKS } from "@/lib/billing/packs";
import { absoluteUrl, getSeoPage, pageMetadata } from "@/lib/seo/content-registry";

const page = getSeoPage("/pricing");

export const metadata: Metadata = pageMetadata(page);

const planDescriptions = {
  free: "Try Pairvu and keep a small monthly review workflow.",
  starter: "For regular product-image review and small batches.",
  growth: "For growing content operations that need more checks and priority processing.",
  agency: "For high-volume client work across repeated product-image reviews.",
} as const;

function pricingServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(page.route)}#service`,
    name: "Pairvu product image QA",
    description: page.description,
    serviceType: "AI product image quality assurance",
    provider: { "@id": `${absoluteUrl("/")}#organization` },
    areaServed: "Worldwide",
    offers: [...PLAN_CODES.map((code) => {
      const plan = PLAN_ENTITLEMENTS[code];
      return {
        "@type": "Offer",
        name: `${plan.name} plan`,
        url: absoluteUrl(`/pricing#${code}`),
        price: (plan.monthlyPriceCents / 100).toFixed(2),
        priceCurrency: "USD",
        category: "Monthly SaaS subscription",
        description: `${plan.includedMonthlyCredits} product checks per month and ${plan.retentionDays}-day image retention`,
      };
    }), ...CHECK_PACK_CODES.map((code) => {
      const pack = CHECK_PACKS[code];
      return {
        "@type": "Offer",
        name: pack.name,
        url: absoluteUrl(`/pricing#${code}`),
        price: (pack.priceCents / 100).toFixed(2),
        priceCurrency: "USD",
        category: "One-time check pack",
        description: `${pack.credits} product checks valid for ${pack.validityDays} days`,
      };
    })],
  };
}

export default function PricingPage() {
  return (
    <main className="content-page">
      <StructuredData data={pricingServiceSchema()} />
      <div className="content-container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Pricing", href: page.route }]} />
        <header className="content-hero content-hero-compact">
          <p className="eyebrow">Public paid beta</p>
          <h1>{page.h1}</h1>
          <p className="content-deck">
            Start free, then choose the monthly capacity that fits your product-image workflow. No invitation is
            required. Paid plans include batch checking, CSV export, and 30-day image retention.
          </p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/account">Open your workspace</Link>
            <Link className="text-link" href="/#checker">Try one image pair</Link>
          </div>
        </header>

        <PricingActivationPanel />

        <section className="pricing-grid" aria-label="Pairvu plans">
          {PLAN_CODES.map((code) => {
            const plan = PLAN_ENTITLEMENTS[code];
            return (
              <article className={`pricing-plan${code === "starter" ? " pricing-plan-featured" : ""}`} id={code} key={code}>
                <div>
                  <p className="eyebrow">{code === "starter" ? "Popular starting point" : `${plan.name} plan`}</p>
                  <h2>{plan.name}</h2>
                  <p className="pricing-price">
                    <strong>${plan.monthlyPriceCents / 100}</strong><span>/month</span>
                  </p>
                  <p>{planDescriptions[code]}</p>
                </div>
                <ul>
                  <li>{plan.includedMonthlyCredits} checks each month</li>
                  <li>Up to {plan.batchItemLimit} images in one batch</li>
                  <li>{plan.csvExportEnabled ? "CSV export included" : "Result review in your workspace"}</li>
                  <li>{plan.priorityQueueEnabled ? "Priority batch processing" : "Standard processing"}</li>
                  <li>{plan.retentionDays}-day image retention</li>
                </ul>
                <PricingPlanAction planCode={code} planName={plan.name} />
              </article>
            );
          })}
        </section>

        <section className="article-section" id="check-packs" aria-labelledby="check-packs-title">
          <p className="eyebrow">One-time capacity</p>
          <h2 id="check-packs-title">Buy extra checks without changing your plan</h2>
          <p>
            Check packs are one-time purchases for occasional spikes. They can be used with Free or paid workspaces,
            remain available across monthly renewals for 365 days, and are consumed only after monthly checks run out.
            A pack adds checks only; plan features and image retention still follow your current plan.
          </p>
          <div className="pricing-pack-grid" aria-label="One-time check packs">
            {CHECK_PACK_CODES.map((code) => {
              const pack = CHECK_PACKS[code];
              return (
                <article className="pricing-pack" id={code} key={code}>
                  <p className="eyebrow">One-time purchase</p>
                  <h3>{pack.credits} checks</h3>
                  <p className="pricing-price"><strong>${pack.priceCents / 100}</strong><span> once</span></p>
                  <ul>
                    <li>Valid for {pack.validityDays} days</li>
                    <li>Used after monthly checks</li>
                    <li>No automatic overage charges</li>
                  </ul>
                  <PricingPackAction packCode={code} />
                </article>
              );
            })}
          </div>
        </section>

        <section className="article-section" aria-labelledby="billing-details">
          <h2 id="billing-details">How billing and checks work</h2>
          <div className="decision-table-wrap">
            <table className="decision-table">
              <thead><tr><th>Policy</th><th>What to expect</th></tr></thead>
              <tbody>
                <tr><td>Monthly allowance</td><td>Included checks reset each billing period and do not carry forward.</td></tr>
                <tr><td>Extra check packs</td><td>One-time packs remain separate from monthly checks, last for 365 days, and are used only after the monthly allowance.</td></tr>
                <tr><td>Completed checks</td><td>A check is charged only after Pairvu returns PASS, REVIEW, or FAIL. Provider and system failures are not charged.</td></tr>
                <tr><td>Image retention</td><td>Free images are retained for 7 days. Paid-plan images and analysis derivatives are retained for 30 days.</td></tr>
                <tr><td>Billing management</td><td>Stripe handles payment details, invoices, and cancellation through its secure billing portal.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="article-section" aria-labelledby="beta-boundaries">
          <h2 id="beta-boundaries">Public beta boundaries</h2>
          <p>
            These are introductory public-beta plans. A batch currently supports at most 20 candidates, and plan
            switching is handled securely through Stripe after a subscription starts. Pairvu provides visible product QA, not
            marketplace certification, regulatory approval, or an enterprise service-level agreement.
          </p>
        </section>

        <section className="article-section" aria-labelledby="pricing-faq">
          <h2 id="pricing-faq">Pricing questions</h2>
          <div className="faq-list">
            <details><summary>Do I need an invitation?</summary><p>No. Create an account, use the Free plan, or choose a paid plan here. If you are signed out, Pairvu asks you to sign in before opening Stripe Checkout.</p></details>
            <details><summary>Do the 10 Free checks add to a paid plan?</summary><p>No. Upgrading replaces the Free monthly allowance with the paid plan allowance for the active billing period.</p></details>
            <details><summary>Can I cancel?</summary><p>Yes. Open Manage billing in your workspace to cancel through Stripe. Access follows the subscription state shown in your account.</p></details>
            <details><summary>Can I buy checks without a subscription?</summary><p>Yes. A one-time check pack works on a Free workspace and does not start a subscription. It adds checks only, so retention and workflow features continue to follow the current plan.</p></details>
            <details><summary>What happens when an image expires?</summary><p>The retained image and derivatives stop restoring. Result metadata may remain available so the decision is still auditable.</p></details>
          </div>
        </section>

        <section className="article-section article-cta">
          <h2>Check product images before publishing</h2>
          <p>Use one approved reference with a single candidate or review up to 20 candidate images in a paid batch.</p>
          <div className="content-actions">
            <Link className="primary-link-button" href="/account">Create your workspace</Link>
            <Link className="text-link" href="/how-pairvu-works">See how Pairvu works</Link>
          </div>
        </section>
        <p className="content-updated">Last updated: August 19, 2026</p>
      </div>
    </main>
  );
}
