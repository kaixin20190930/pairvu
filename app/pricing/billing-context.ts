"use client";

import { useEffect, useState } from "react";
import type { PlanCode } from "@/lib/billing/plans";

export type PricingBillingContext =
  | { authenticated: false }
  | {
      authenticated: true;
      planCode: PlanCode;
      billingManaged: boolean;
      subscriptionStatus: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
      cancelAtPeriodEnd: boolean;
      available: number;
      billingEnabled: boolean;
      packsEnabled: boolean;
    };

let contextRequest: Promise<PricingBillingContext> | null = null;

function loadBillingContext(): Promise<PricingBillingContext> {
  contextRequest ??= fetch("/api/billing/context", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Billing status could not be loaded.");
      return response.json() as Promise<PricingBillingContext>;
    })
    .catch((error) => {
      contextRequest = null;
      throw error;
    });
  return contextRequest;
}

export function usePricingBillingContext() {
  const [context, setContext] = useState<PricingBillingContext | null>(null);
  useEffect(() => {
    let active = true;
    void loadBillingContext().then((value) => {
      if (active) setContext(value);
    }).catch(() => {
      if (active) setContext(null);
    });
    return () => { active = false; };
  }, []);
  return context;
}
