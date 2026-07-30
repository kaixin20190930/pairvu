"use client";

import type {
  AcquisitionAttribution,
  ClientProductEventName,
  ProductEventProperty,
} from "./types";

const FIRST_TOUCH_KEY = "visualqa.firstTouch";
const SESSION_ATTRIBUTION_KEY = "visualqa.sessionAttribution";
const PAGE_VIEW_KEY = "visualqa.pageViewId";

export interface ClientAcquisitionContext {
  attribution: AcquisitionAttribution;
  pageViewId: string;
}

export function captureAcquisitionContext(): ClientAcquisitionContext {
  const incoming = readIncomingAttribution();
  const existingSession = readStoredAttribution(SESSION_ATTRIBUTION_KEY);
  const sessionAttribution = hasAttribution(incoming) ? incoming : existingSession;
  const firstTouch = readStoredAttribution(FIRST_TOUCH_KEY);

  if (!hasAttribution(firstTouch)) {
    storeAttribution(FIRST_TOUCH_KEY, sessionAttribution);
  }

  storeAttribution(SESSION_ATTRIBUTION_KEY, sessionAttribution);

  let pageViewId = window.sessionStorage.getItem(PAGE_VIEW_KEY);
  if (!pageViewId) {
    pageViewId = crypto.randomUUID();
    window.sessionStorage.setItem(PAGE_VIEW_KEY, pageViewId);
  }

  return {
    attribution: sessionAttribution,
    pageViewId,
  };
}

export async function trackProductEvent(input: {
  eventName: ClientProductEventName;
  anonymousSessionId: string;
  analysisId?: string;
  attribution?: AcquisitionAttribution;
  idempotencyKey?: string;
  properties?: Record<string, ProductEventProperty>;
}) {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: true,
    body: JSON.stringify({
      idempotencyKey: input.idempotencyKey ?? crypto.randomUUID(),
      eventName: input.eventName,
      anonymousSessionId: input.anonymousSessionId,
      analysisId: input.analysisId,
      occurredAt: new Date().toISOString(),
      pagePath: `${window.location.pathname}${window.location.search}`,
      attribution: input.attribution,
      locale: window.navigator.language,
      deviceClass: deviceClass(),
      properties: input.properties,
    }),
  });

  if (!response.ok) {
    throw new Error(`Product event failed with status ${response.status}.`);
  }
}

export function sizeBucket(bytes: number) {
  if (bytes < 1_000_000) return "under_1mb";
  if (bytes < 5_000_000) return "1mb_to_5mb";
  return "5mb_to_10mb";
}

function readIncomingAttribution(): AcquisitionAttribution {
  const params = new URLSearchParams(window.location.search);
  const referrerDomain = externalReferrerDomain();

  return compactAttribution({
    referrerDomain,
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
  });
}

function externalReferrerDomain() {
  if (!document.referrer) return undefined;

  try {
    const referrer = new URL(document.referrer);
    return referrer.hostname === window.location.hostname ? undefined : referrer.hostname;
  } catch {
    return undefined;
  }
}

function readStoredAttribution(key: string): AcquisitionAttribution {
  const stored = window.localStorage.getItem(key);
  if (!stored) return {};

  try {
    return compactAttribution(JSON.parse(stored) as AcquisitionAttribution);
  } catch {
    return {};
  }
}

function storeAttribution(key: string, attribution: AcquisitionAttribution) {
  window.localStorage.setItem(key, JSON.stringify(compactAttribution(attribution)));
}

function compactAttribution(attribution: AcquisitionAttribution): AcquisitionAttribution {
  return Object.fromEntries(
    Object.entries(attribution).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ) as AcquisitionAttribution;
}

function hasAttribution(attribution: AcquisitionAttribution) {
  return Object.values(attribution).some(Boolean);
}

function deviceClass() {
  if (window.innerWidth <= 767) return "mobile";
  if (window.innerWidth <= 1024) return "tablet";
  return "desktop";
}
