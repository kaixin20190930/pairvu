"use client";

import { useState } from "react";
import type { PlanCode } from "@/lib/billing/plans";

interface BillingActionsProps {
  currentPlan: PlanCode;
  billingManaged: boolean;
  billingEnabled: boolean;
  subscriptionStatus: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
}

const paidPlans = [
  { code: "starter" as const, name: "Starter", price: 19, checks: 150, note: "For regular product-image review" },
  { code: "growth" as const, name: "Growth", price: 49, checks: 600, note: "For growing content operations" },
  { code: "agency" as const, name: "Agency", price: 99, checks: 1500, note: "For high-volume client work" },
];

export function BillingActions({ currentPlan, billingManaged, billingEnabled, subscriptionStatus }: BillingActionsProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openBilling(path: "checkout" | "portal", planCode?: PlanCode) {
    setPending(planCode ?? "portal");
    setError(null);
    try {
      const response = await fetch(`/api/billing/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planCode ? { planCode } : {}),
      });
      const result = await response.json() as { url?: string; message?: string };
      if (!response.ok || !result.url) throw new Error(result.message || "Billing could not be opened.");
      window.location.assign(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Billing could not be opened.");
      setPending(null);
    }
  }

  if (!billingEnabled && !billingManaged) {
    return (
      <div className="billing-manage-panel">
        <div>
          <strong>Checkout is temporarily unavailable</strong>
          <p>Your Free workspace remains available. Paid plans will return when billing is restored for this deployment.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {billingManaged ? (
        <div>
          <div className="billing-manage-panel">
            <div>
              <strong>{subscriptionStatus === "past_due" ? "Payment needs attention" : "Your subscription is managed by Stripe"}</strong>
              <p>Update payment details, view invoices, or cancel from the secure billing portal.</p>
            </div>
            <button className="secondary-button" disabled={pending !== null} onClick={() => openBilling("portal")} type="button">
              {pending === "portal" ? "Opening…" : "Manage billing"}
            </button>
          </div>
          {error ? <p className="billing-error" role="alert" aria-live="assertive">{error}</p> : null}
        </div>
      ) : null}
      <div className="billing-plan-grid">
        {paidPlans.map((plan) => (
          <article className={`billing-plan${currentPlan === plan.code ? " billing-plan-current" : ""}`} key={plan.code}>
            <span>{plan.name}</span>
            <strong>${plan.price}<small>/month</small></strong>
            <p>{plan.checks} checks per month · 30-day image retention</p>
            <small>{plan.note}</small>
            {billingManaged ? (
              <span className="billing-plan-status">
                {currentPlan === plan.code ? "Current plan" : "Plan switching is not yet available"}
              </span>
            ) : (
              <button disabled={pending !== null || currentPlan === plan.code} onClick={() => openBilling("checkout", plan.code)} type="button">
                {pending === plan.code ? "Opening…" : currentPlan === plan.code ? "Current plan" : `Choose ${plan.name}`}
              </button>
            )}
          </article>
        ))}
      </div>
      {!billingManaged && error ? <p className="billing-error" role="alert" aria-live="assertive">{error}</p> : null}
    </div>
  );
}
