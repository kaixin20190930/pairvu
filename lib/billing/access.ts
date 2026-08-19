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

export function areLiveStripeCheckPacksConfigured(env: VisualQACloudflareEnv): boolean {
  return Boolean(
    isLiveStripeBillingConfigured(env)
      && env.STRIPE_PRICE_PACK_50
      && env.STRIPE_PRICE_PACK_200
      && env.STRIPE_PRICE_PACK_500,
  );
}
