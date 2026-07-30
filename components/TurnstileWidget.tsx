"use client";

import { useEffect, useId, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        target: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  resetKey: number;
  onTokenChange: (token: string | null) => void;
}

export function TurnstileWidget({ siteKey, resetKey, onTokenChange }: TurnstileWidgetProps) {
  const containerId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  useEffect(() => {
    if (window.turnstile) {
      queueMicrotask(() => setScriptReady(true));
    }
  }, []);

  useEffect(() => {
    if (!scriptReady) return;

    const container = document.getElementById(containerId);
    if (!container || !window.turnstile) {
      queueMicrotask(() => setWidgetError("Security check could not load. Refresh the page and try again."));
      return;
    }

    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignore stale widget cleanup errors and re-render fresh.
      }
      widgetIdRef.current = null;
    }

    container.innerHTML = "";
    queueMicrotask(() => {
      setWidgetError(null);
      onTokenChange(null);
    });

    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: siteKey,
      theme: "auto",
      callback: (token: string) => {
        setWidgetError(null);
        onTokenChange(token);
      },
      "expired-callback": () => onTokenChange(null),
      "error-callback": () => {
        onTokenChange(null);
        setWidgetError("Security check failed. Refresh the page and try again.");
      },
    });
  }, [containerId, onTokenChange, resetKey, scriptReady, siteKey]);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors during navigation.
        }
      }
    };
  }, []);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setWidgetError("Security check could not load. Refresh the page and try again.")}
      />
      <div className="turnstile-wrap">
        {!scriptReady ? <p className="turnstile-status">Loading security check…</p> : null}
        <div id={containerId} />
        {widgetError ? <p className="turnstile-status error-text">{widgetError}</p> : null}
      </div>
    </>
  );
}
