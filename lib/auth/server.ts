import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { ensurePersonalWorkspace } from "@/lib/accounts/repository";
import { getVisualQAEnv, type VisualQACloudflareEnv } from "@/lib/cloudflare/bindings";
import { sendPairvuMagicLink } from "@/lib/auth/email";

export interface AuthMethodAvailability {
  google: boolean;
  magicLink: boolean;
}

export function getAuthMethodAvailability(env = getVisualQAEnv()): AuthMethodAvailability {
  return {
    google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    magicLink: Boolean(env.RESEND_API_KEY && env.AUTH_EMAIL_FROM),
  };
}

export function createPairvuAuth(env: VisualQACloudflareEnv = getVisualQAEnv()) {
  const baseURL = env.BETTER_AUTH_URL || "https://pairvu.com";
  const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be configured with at least 32 characters.");
  }

  return betterAuth({
    appName: "Pairvu",
    baseURL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    database: env.VISUALQA_DB as never,
    trustedOrigins: trustedOrigins(env, baseURL),
    socialProviders: googleConfigured
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : {},
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 20,
    },
    plugins: [
      magicLink({
        expiresIn: 10 * 60,
        storeToken: "hashed",
        rateLimit: { window: 60, max: 5 },
        sendMagicLink: async ({ email, url }) => {
          await sendPairvuMagicLink(env, { email, url });
        },
      }),
    ],
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await ensurePersonalWorkspace(env.VISUALQA_DB, {
              id: user.id,
              name: user.name,
              email: user.email,
            });
          },
        },
      },
    },
  });
}

function trustedOrigins(env: VisualQACloudflareEnv, baseURL: string): string[] {
  const configured = (env.AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return Array.from(new Set([baseURL, ...configured]));
}
