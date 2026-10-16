"use client";

import { usePathname } from "next/navigation";
import { ActivationView } from "@/components/ActivationAnalytics";
import { contentLandingProperties } from "@/lib/analytics/client";

export function ContentLandingAnalytics({ publishedRoutes }: { publishedRoutes: string[] }) {
  const pathname = usePathname();
  const properties = contentLandingProperties(pathname, publishedRoutes);
  if (!properties) return null;

  return <ActivationView eventName="landing_view" idempotencyPrefix={`content-landing:${pathname}`} properties={properties} />;
}
