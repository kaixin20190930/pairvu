"use client";

import { useState } from "react";
import Link from "next/link";
import type { PlanCode } from "@/lib/billing/plans";

interface BillingActionsProps {
  currentPlan: PlanCode;
  billingManaged: boolean;
  billingEnabled: boolean;
  subscriptionStatus: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  cancelAtPeriodEnd: boolean;
  periodEndsOn: string;
}

export function BillingActions({
  currentPlan,
  billingManaged,
  billingEnabled,
  subscriptionStatus,
  cancelAtPeriodEnd,
  periodEndsOn,
}: BillingActionsProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openBilling() {
    setPending("portal");
    setError(null);
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = await response.json() as { url?: string; message?: string };
      if (!response.ok || !result.url) throw new Error(result.message || "Billing could not be opened.");
      window.location.assign(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Billing could not be opened.");
      setPending(null);
    }
  }

  if (billingManaged) {
    const needsAttention = subscriptionStatus === "past_due" || subscriptionStatus === "incomplete";
    return (
      <div>
        <div className={`billing-manage-panel${needsAttention ? " billing-manage-attention" : ""}`}>
          <div>
            <strong>
              {needsAttention
                ? "Payment needs attention"
                : cancelAtPeriodEnd
                  ? `${currentPlanName(currentPlan)} ends on ${periodEndsOn}`
                  : `${currentPlanName(currentPlan)} renews on ${periodEndsOn}`}
            </strong>
            <p>
              {cancelAtPeriodEnd
                ? "Your checks and paid retention remain available until this date. Reactivate in Stripe before the subscription ends."
                : "Update payment details, view invoices, or cancel from Stripe's secure billing portal."}
            </p>
          </div>
          <button className="secondary-button" disabled={pending !== null} onClick={openBilling} type="button">
            {pending === "portal" ? "Opening…" : cancelAtPeriodEnd ? "Reactivate or manage billing" : "Manage billing"}
          </button>
        </div>
        <p className="billing-secondary-action"><Link href="/pricing">Compare all plans</Link></p>
        {error ? <p className="billing-error" role="alert" aria-live="assertive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="billing-manage-panel">
      <div>
        <strong>{billingEnabled ? "Your Free workspace is active" : "Paid checkout is temporarily unavailable"}</strong>
        <p>
          {billingEnabled
            ? "Compare monthly capacity on Pricing. Paid checkout starts there after you choose a plan."
            : "You can keep using the Free workspace while paid billing is restored."}
        </p>
      </div>
      <Link className="primary-link-button" href="/pricing">{billingEnabled ? "View plans" : "View pricing"}</Link>
    </div>
  );
}

function currentPlanName(planCode: PlanCode): string {
  return planCode.charAt(0).toUpperCase() + planCode.slice(1);
}
