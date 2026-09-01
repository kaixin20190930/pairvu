"use client";

import { useEffect, useState } from "react";
import type { PlanCode } from "@/lib/billing/plans";

export type BillingContext =
  | { authenticated: false }
  | {
      authenticated: true;
      planCode: PlanCode;
      billingManaged: boolean;
      subscriptionStatus: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
      cancelAtPeriodEnd: boolean;
      periodEndsAt: string;
      available: number;
      billingEnabled: boolean;
      packsEnabled: boolean;
    };

let contextRequest: Promise<BillingContext> | null = null;

function loadBillingContext(): Promise<BillingContext> {
  contextRequest ??= fetch("/api/billing/context", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Billing status could not be loaded.");
      return response.json() as Promise<BillingContext>;
    })
    .catch((error) => {
      contextRequest = null;
      throw error;
    });
  return contextRequest;
}

export function useBillingContext() {
  const [context, setContext] = useState<BillingContext | null>(null);

  useEffect(() => {
    let active = true;
    void loadBillingContext()
      .then((value) => {
        if (active) setContext(value);
      })
      .catch(() => {
        if (active) setContext(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return context;
}
