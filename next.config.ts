import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig: NextConfig = {
  poweredByHeader: false,
};

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

export default function config(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    initOpenNextCloudflareForDev();
  }

  return nextConfig;
}
