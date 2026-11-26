"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function DecisionAnalytics({ paths, sourceRoles }: { paths: string[]; sourceRoles: Record<string, string> }) {
  const pathname = usePathname();
  const session = useRef<string | null>(null);
  useEffect(() => {
    if (!paths.includes(pathname) || navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
    try { if (sessionStorage.getItem("pairvu.metrics.optout") === "1") return; } catch { return; }
    session.current ??= crypto.randomUUID();
    const id = crypto.randomUUID();
    const flags: Record<string, boolean> = {
      model_click: false, comparison_click: false,
      task_coding: false, task_context: false, task_batch: false,
      source_specification: false, source_pricing: false, source_evaluation: false, source_availability: false,
    };
    let sent = false;
    function finish() {
      if (sent) return;
      try { if (sessionStorage.getItem("pairvu.metrics.optout") === "1") return; } catch { return; }
      sent = true;
      const payload = JSON.stringify({ eventName: "landing_view", idempotencyKey: id, anonymousSessionId: session.current, pagePath: pathname, properties: { purpose: "model_decision_v1", ...flags } });
      void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true, credentials: "omit" }).catch(() => {});
    }
    function click(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!target) return;
      const url = new URL(target.href, location.href);
      if (url.origin === location.origin && paths.includes(url.pathname)) {
        if (url.pathname.startsWith("/models/")) flags.model_click = true;
        if (url.pathname.startsWith("/compare/")) flags.comparison_click = true;
        const task = target.closest<HTMLElement>("[data-decision-task]")?.dataset.decisionTask;
        if (task && ["coding", "context", "batch"].includes(task) && url.pathname.startsWith("/models/")) flags[`task_${task}`] = true;
      } else {
        const knownRole = sourceRoles[url.origin + url.pathname.replace(/\/$/, "")];
        const declaredRole = target.dataset.sourceRole;
        const role = knownRole && declaredRole && ["specification", "pricing", "evaluation", "availability"].includes(declaredRole) ? declaredRole : knownRole;
        if (role) flags[`source_${role}`] = true;
      }
    }
    document.addEventListener("click", click, true);
    window.addEventListener("pagehide", finish);
    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener("pagehide", finish);
      finish();
    };
  }, [pathname, paths, sourceRoles]);
  return null;
}

export function DecisionPrivacyControl() {
  return <button type="button" onClick={event => {
    try {
      sessionStorage.setItem("pairvu.metrics.optout", "1");
      event.currentTarget.textContent = "Measurement paused for this tab. Reload to apply.";
    } catch {
      event.currentTarget.textContent = "Enable Do Not Track in your browser to pause measurement.";
    }
  }}>Pause decision measurement for this tab</button>;
}
