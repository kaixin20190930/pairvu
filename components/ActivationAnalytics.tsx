"use client";

import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { useEffect } from "react";
import {
  captureAcquisitionContext,
  getAnonymousSessionId,
  trackProductEvent,
} from "@/lib/analytics/client";
import type { ClientProductEventName, ProductEventProperty } from "@/lib/analytics/types";

type EventProperties = Record<string, ProductEventProperty>;

export function ActivationView({
  eventName,
  idempotencyPrefix,
  properties,
}: {
  eventName: ClientProductEventName;
  idempotencyPrefix: string;
  properties?: EventProperties;
}) {
  const propertiesKey = JSON.stringify(properties ?? {});

  useEffect(() => {
    const context = captureAcquisitionContext();
    void trackProductEvent({
      eventName,
      anonymousSessionId: getAnonymousSessionId(),
      attribution: context.attribution,
      idempotencyKey: `${idempotencyPrefix}:${context.pageViewId}`,
      properties: JSON.parse(propertiesKey) as EventProperties,
    }).catch(logActivationEventFailure);
  }, [eventName, idempotencyPrefix, propertiesKey]);

  return null;
}

export function ActivationLink({
  href,
  className,
  eventName,
  properties,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  eventName: ClientProductEventName;
  properties?: EventProperties;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      className={className}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        const context = captureAcquisitionContext();
        void trackProductEvent({
          eventName,
          anonymousSessionId: getAnonymousSessionId(),
          attribution: context.attribution,
          properties,
        }).catch(logActivationEventFailure);
      }}
    >
      {children}
    </Link>
  );
}

export function logActivationEventFailure(error: unknown) {
  console.warn("activation_event_failed", error);
}
