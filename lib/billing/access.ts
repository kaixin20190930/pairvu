import type { VisualQACloudflareEnv } from "@/lib/cloudflare/bindings";

export function isLiveStripeBillingConfigured(env: VisualQACloudflareEnv): boolean {
  return Boolean(
    env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
      && env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")
      && env.STRIPE_PRICE_STARTER
      && env.STRIPE_PRICE_GROWTH
      && env.STRIPE_PRICE_AGENCY,
  );
}
