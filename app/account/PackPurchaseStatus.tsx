"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PurchaseState =
  | { state: "confirming" }
  | { state: "fulfilled"; creditsAdded: number; totalAvailable: number; expiresAt: string }
  | { state: "delayed" }
  | { state: "invalid" };

const POLL_DELAYS_MS = [0, 1_000, 2_000, 3_000, 5_000, 8_000];

export function PackPurchaseStatus({ checkoutSessionId }: { checkoutSessionId: string | null }) {
  const router = useRouter();
  const [purchase, setPurchase] = useState<PurchaseState>(
    checkoutSessionId ? { state: "confirming" } : { state: "invalid" },
  );

  useEffect(() => {
    if (!checkoutSessionId) return;
    let active = true;
    const controller = new AbortController();

    async function confirmPurchase() {
      for (const delay of POLL_DELAYS_MS) {
        if (delay > 0) await wait(delay, controller.signal);
        const response = await fetch(
          `/api/billing/packs/status?session_id=${encodeURIComponent(checkoutSessionId!)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (response.status === 400) {
          if (active) setPurchase({ state: "invalid" });
          return;
        }
        if (!response.ok) continue;
        const result = await response.json() as {
          state?: string;
          creditsAdded?: number;
          totalAvailable?: number;
          expiresAt?: string;
        };
        if (
          result.state === "fulfilled" &&
          typeof result.creditsAdded === "number" &&
          typeof result.expiresAt === "string"
        ) {
          if (active) {
            setPurchase({
              state: "fulfilled",
              creditsAdded: result.creditsAdded,
              totalAvailable: Number(result.totalAvailable ?? 0),
              expiresAt: result.expiresAt,
            });
            router.refresh();
          }
          return;
        }
      }
      if (active) setPurchase({ state: "delayed" });
    }

    void confirmPurchase().catch((error) => {
      if (active && !(error instanceof DOMException && error.name === "AbortError")) {
        setPurchase({ state: "delayed" });
      }
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [checkoutSessionId, router]);

  if (purchase.state === "fulfilled") {
    return (
      <p className="account-banner account-banner-success" role="status">
        Payment confirmed. {purchase.creditsAdded} extra checks were added and expire on {formatDate(purchase.expiresAt)}. {purchase.totalAvailable} checks are now available.
      </p>
    );
  }
  if (purchase.state === "delayed") {
    return (
      <p className="account-banner" role="status">
        Checkout returned, but Stripe confirmation is taking longer than expected. Refresh this page shortly; no duplicate purchase is needed.
      </p>
    );
  }
  if (purchase.state === "invalid") {
    return <p className="account-banner">Checkout returned without a valid confirmation reference. Your balance will still update after Stripe confirms payment.</p>;
  }
  return <p className="account-banner account-banner-success" role="status">Confirming payment with Stripe and updating your extra checks…</p>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(resolve, milliseconds);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}
