"use client";

import { ActivationLink, ActivationView } from "@/components/ActivationAnalytics";
import { useBillingContext } from "@/lib/billing/client-context";

export function PricingActivationPanel() {
  const context = useBillingContext();
  const reason = typeof window === "undefined" ? "direct" : new URLSearchParams(window.location.search).get("reason") ?? "direct";

  return (
    <>
      <ActivationView
        eventName="pricing_viewed"
        idempotencyPrefix="pricing-viewed"
        properties={{ entryReason: reason === "no-checks" ? "no_checks" : "direct" }}
      />
      {context?.authenticated && context.available === 0 ? (
        <aside className="pricing-zero-banner" aria-labelledby="pricing-zero-title">
          <ActivationView
            eventName="zero_allowance_viewed"
            idempotencyPrefix="zero-allowance:pricing"
            properties={{ surface: "pricing", planCode: context.planCode }}
          />
          <div>
            <p className="eyebrow">No checks available</p>
            <h2 id="pricing-zero-title">Add checks now or change your monthly capacity</h2>
            <p>
              A one-time pack is the fastest way to continue without changing your current plan. Packs last for 365
              days and are used after monthly checks.
            </p>
          </div>
          <div className="pricing-zero-actions">
            <ActivationLink
              className="primary-link-button"
              eventName="zero_allowance_cta_clicked"
              href="#check-packs"
              properties={{ surface: "pricing", action: "buy_pack", planCode: context.planCode }}
            >
              Choose a check pack
            </ActivationLink>
            <ActivationLink
              className="text-link"
              eventName="zero_allowance_cta_clicked"
              href="#starter"
              properties={{ surface: "pricing", action: "compare_plans", planCode: context.planCode }}
            >
              Compare monthly plans
            </ActivationLink>
          </div>
        </aside>
      ) : null}
    </>
  );
}
