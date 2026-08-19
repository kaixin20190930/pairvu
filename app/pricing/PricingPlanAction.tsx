"use client";

import Link from "next/link";
import { useState } from "react";
import type { PlanCode } from "@/lib/billing/plans";

interface PricingPlanActionProps {
  planCode: PlanCode;
  planName: string;
}

export function PricingPlanAction({ planCode, planName }: PricingPlanActionProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (planCode === "free") {
    return <Link className="secondary-link-button" href="/account">Start free</Link>;
  }

  async function choosePlan() {
    setPending(true);
    setError(null);
    try {
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
        window.location.assign("/account?billing=existing");
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

  return (
    <div className="pricing-plan-action">
      <button className="primary-link-button" disabled={pending} onClick={choosePlan} type="button">
        {pending ? "Opening secure checkout…" : `Choose ${planName}`}
      </button>
      {error ? <p className="billing-error" role="alert">{error}</p> : null}
    </div>
  );
}
