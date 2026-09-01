"use client";

import { useState } from "react";
import type { CheckPackCode } from "@/lib/billing/packs";
import { usePricingBillingContext } from "@/app/pricing/billing-context";
import { captureAcquisitionContext, getAnonymousSessionId, trackProductEvent } from "@/lib/analytics/client";
import { logActivationEventFailure } from "@/components/ActivationAnalytics";

export function PricingPackAction({ packCode }: { packCode: CheckPackCode }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const context = usePricingBillingContext();
  const needsAttention = context?.authenticated
    && (context.subscriptionStatus === "past_due" || context.subscriptionStatus === "incomplete");

  async function buyPack() {
    if (needsAttention) {
      window.location.assign("/account");
      return;
    }
    setPending(true);
    setError(null);
    trackCheckoutEvent("checkout_started", packCode);
    try {
      const response = await fetch("/api/billing/packs/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packCode }),
      });
      const result = await response.json() as { message?: string; url?: string };
      if (response.status === 401) {
        window.location.assign(`/sign-in?next=${encodeURIComponent(`/pricing?pack=${packCode}#check-packs`)}`);
        return;
      }
      if (response.status === 409) {
        window.location.assign("/account");
        return;
      }
      if (!response.ok || !result.url) throw new Error(result.message || "Check-pack checkout could not be opened.");
      trackCheckoutEvent("checkout_redirected", packCode);
      window.location.assign(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Check-pack checkout could not be opened.");
      setPending(false);
    }
  }

  return (
    <div className="pricing-plan-action">
      <button className="primary-link-button" disabled={pending || (context?.authenticated === true && !context.packsEnabled)} onClick={buyPack} type="button">
        {pending ? "Opening secure checkout…" : needsAttention ? "Fix billing first" : "Buy check pack"}
      </button>
      {context?.authenticated === true && !context.packsEnabled ? <p className="billing-error">Check packs are temporarily unavailable.</p> : null}
      {error ? <p className="billing-error" role="alert">{error}</p> : null}
    </div>
  );
}

function trackCheckoutEvent(eventName: "checkout_started" | "checkout_redirected", packCode: CheckPackCode) {
  const context = captureAcquisitionContext();
  void trackProductEvent({
    eventName,
    anonymousSessionId: getAnonymousSessionId(),
    attribution: context.attribution,
    properties: { surface: "pricing", purchaseType: "pack", packCode },
  }).catch(logActivationEventFailure);
}
