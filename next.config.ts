import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export function readBuildSha(): string {
  try {
    const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    const sha = git("rev-parse", "HEAD");
    if (/^[a-f0-9]{40}$/.test(sha) && git("status", "--porcelain=v1", "--untracked-files=all", "--ignore-submodules=none") === "") return sha;
  } catch {
    // A local build without verifiable Git provenance must remain unknown.
  }
  return "unknown";
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
};

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

export default function config(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    initOpenNextCloudflareForDev();
  }

  return { ...nextConfig, env: { PAIRVU_BUILD_SHA: phase === PHASE_DEVELOPMENT_SERVER ? "unknown" : readBuildSha() } };
}
