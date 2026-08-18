"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

export function AccountNav({ onNavigate }: { onNavigate?: () => void }) {
  const { data: session, isPending } = authClient.useSession();
  const [serverAuthenticated, setServerAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/account/session", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as { authenticated?: unknown };
        setServerAuthenticated(payload.authenticated === true);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("account_nav_session_failed", error);
        }
      });

    return () => controller.abort();
  }, []);

  const authenticated = Boolean(session?.user) || serverAuthenticated === true;
  const pending = isPending && serverAuthenticated === null;
  const href = authenticated || pending ? "/account" : "/sign-in";
  const label = authenticated || pending ? "Account" : "Sign in";

  return (
    <Link className="header-account-link" href={href} aria-busy={pending} onClick={onNavigate}>
      {label}
    </Link>
  );
}
