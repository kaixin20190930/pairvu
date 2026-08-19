"use client";

import Link from "next/link";
import { useState } from "react";
import type { PlanCode } from "@/lib/billing/plans";
import { usePricingBillingContext } from "@/app/pricing/billing-context";

interface PricingPlanActionProps {
  planCode: PlanCode;
  planName: string;
}

export function PricingPlanAction({ planCode, planName }: PricingPlanActionProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const context = usePricingBillingContext();

  if (planCode === "free") {
    return <Link className="secondary-link-button" href="/account">Start free</Link>;
  }

  async function openPortal(flow?: "subscription_update") {
    const response = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flow ? { flow } : {}),
    });
    const result = await response.json() as { message?: string; url?: string };
    if (!response.ok || !result.url) throw new Error(result.message || "Billing management could not be opened.");
    window.location.assign(result.url);
  }

  async function choosePlan() {
    setPending(true);
    setError(null);
    try {
      if (context?.authenticated && context.billingManaged) {
        await openPortal(context.subscriptionStatus === "past_due" || context.subscriptionStatus === "incomplete"
          ? undefined
          : "subscription_update");
        return;
      }
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });
      const result = await response.json() as { error?: string; message?: string; url?: string };

      if (response.status === 401) {
        window.location.assign(`/sign-in?next=${encodeURIComponent(`/pricing?plan=${planCode}`)}`);
        return;
      }
      if (response.status === 409 && result.error === "subscription_exists") {
        await openPortal("subscription_update");
        return;
      }
      if (!response.ok || !result.url) {
        throw new Error(result.message || "Checkout could not be opened.");
      }
      window.location.assign(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout could not be opened.");
      setPending(false);
    }
  }

  const paidContext = context?.authenticated ? context : null;
  const needsAttention = paidContext?.billingManaged
    && (paidContext.subscriptionStatus === "past_due" || paidContext.subscriptionStatus === "incomplete");
  const isCurrent = paidContext?.billingManaged && paidContext.planCode === planCode;

  if (isCurrent && !needsAttention) {
    return (
      <div className="pricing-plan-action">
        <button className="secondary-button" disabled type="button">Current plan</button>
        <a className="pricing-action-link" href="#check-packs">Need more checks? Buy a pack</a>
      </div>
    );
  }

  return (
    <div className="pricing-plan-action">
      <button className="primary-link-button" disabled={pending} onClick={choosePlan} type="button">
        {pending
          ? "Opening secure billing…"
          : needsAttention
            ? "Fix billing"
            : paidContext?.billingManaged
              ? `Change to ${planName}`
              : `Choose ${planName}`}
      </button>
      {error ? <p className="billing-error" role="alert">{error}</p> : null}
    </div>
  );
}
