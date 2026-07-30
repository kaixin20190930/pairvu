import type { VisualQACloudflareEnv } from "@/lib/cloudflare/bindings";

const DEFAULTS = {
  analysisAcceptingNewRequests: true,
  analysisSessionMinuteLimit: 3,
  analysisSessionDailyLimit: 4,
  analysisGlobalDailyLimit: 50,
  analysisSessionConcurrentLimit: 1,
  analysisGlobalConcurrentLimit: 3,
  analysisSessionDailySpendLimitUsd: 5,
  analysisGlobalDailySpendLimitUsd: 25,
  uploadSessionMinuteLimit: 10,
  uploadSessionDailyLimit: 20,
  turnstileValidateUploads: false,
} as const;

export interface PublicBetaConfig {
  analysisAcceptingNewRequests: boolean;
  analysisPauseMessage: string;
  analysisSessionMinuteLimit: number;
  analysisSessionDailyLimit: number;
  analysisGlobalDailyLimit: number;
  analysisSessionConcurrentLimit: number;
  analysisGlobalConcurrentLimit: number;
  analysisSessionDailySpendLimitUsd: number;
  analysisGlobalDailySpendLimitUsd: number;
  uploadSessionMinuteLimit: number;
  uploadSessionDailyLimit: number;
  turnstileSiteKey: string | null;
  turnstileSecretKey: string | null;
  turnstileValidateUploads: boolean;
}

export interface PublicRuntimeConfig {
  analysisAcceptingNewRequests: boolean;
  analysisPauseMessage: string;
  turnstileEnabled: boolean;
  turnstileSiteKey: string | null;
  guardrails: {
    analysisSessionMinuteLimit: number;
    analysisSessionDailyLimit: number;
    analysisGlobalDailyLimit: number;
    analysisSessionConcurrentLimit: number;
    analysisGlobalConcurrentLimit: number;
    uploadSessionMinuteLimit: number;
    uploadSessionDailyLimit: number;
  };
}

export function getPublicBetaConfig(env: VisualQACloudflareEnv): PublicBetaConfig {
  return {
    analysisAcceptingNewRequests: readBoolean(env.PUBLIC_ANALYSIS_ACCEPTING_NEW_REQUESTS, DEFAULTS.analysisAcceptingNewRequests),
    analysisPauseMessage:
      env.PUBLIC_ANALYSIS_PAUSE_MESSAGE?.trim() || "New analyses are temporarily paused.",
    analysisSessionMinuteLimit: readPositiveInteger(env.PUBLIC_ANALYSIS_SESSION_MINUTE_LIMIT, DEFAULTS.analysisSessionMinuteLimit),
    analysisSessionDailyLimit: readPositiveInteger(env.PUBLIC_ANALYSIS_SESSION_DAILY_LIMIT, DEFAULTS.analysisSessionDailyLimit),
    analysisGlobalDailyLimit: readPositiveInteger(env.PUBLIC_ANALYSIS_GLOBAL_DAILY_LIMIT, DEFAULTS.analysisGlobalDailyLimit),
    analysisSessionConcurrentLimit: readPositiveInteger(
      env.PUBLIC_ANALYSIS_SESSION_CONCURRENT_LIMIT,
      DEFAULTS.analysisSessionConcurrentLimit,
    ),
    analysisGlobalConcurrentLimit: readPositiveInteger(
      env.PUBLIC_ANALYSIS_GLOBAL_CONCURRENT_LIMIT,
      DEFAULTS.analysisGlobalConcurrentLimit,
    ),
    analysisSessionDailySpendLimitUsd: readPositiveNumber(
      env.PUBLIC_ANALYSIS_SESSION_DAILY_SPEND_LIMIT_USD,
      DEFAULTS.analysisSessionDailySpendLimitUsd,
    ),
    analysisGlobalDailySpendLimitUsd: readPositiveNumber(
      env.PUBLIC_ANALYSIS_GLOBAL_DAILY_SPEND_LIMIT_USD,
      DEFAULTS.analysisGlobalDailySpendLimitUsd,
    ),
    uploadSessionMinuteLimit: readPositiveInteger(env.PUBLIC_UPLOAD_SESSION_MINUTE_LIMIT, DEFAULTS.uploadSessionMinuteLimit),
    uploadSessionDailyLimit: readPositiveInteger(env.PUBLIC_UPLOAD_SESSION_DAILY_LIMIT, DEFAULTS.uploadSessionDailyLimit),
    turnstileSiteKey: env.TURNSTILE_SITE_KEY?.trim() || null,
    turnstileSecretKey: env.TURNSTILE_SECRET_KEY?.trim() || null,
    turnstileValidateUploads: readBoolean(env.PUBLIC_VALIDATE_UPLOADS_WITH_TURNSTILE, DEFAULTS.turnstileValidateUploads),
  };
}

export function getPublicRuntimeConfig(env: VisualQACloudflareEnv): PublicRuntimeConfig {
  const config = getPublicBetaConfig(env);

  return {
    analysisAcceptingNewRequests: config.analysisAcceptingNewRequests,
    analysisPauseMessage: config.analysisPauseMessage,
    turnstileEnabled: Boolean(config.turnstileSiteKey && config.turnstileSecretKey),
    turnstileSiteKey: config.turnstileSiteKey,
    guardrails: {
      analysisSessionMinuteLimit: config.analysisSessionMinuteLimit,
      analysisSessionDailyLimit: config.analysisSessionDailyLimit,
      analysisGlobalDailyLimit: config.analysisGlobalDailyLimit,
      analysisSessionConcurrentLimit: config.analysisSessionConcurrentLimit,
      analysisGlobalConcurrentLimit: config.analysisGlobalConcurrentLimit,
      uploadSessionMinuteLimit: config.uploadSessionMinuteLimit,
      uploadSessionDailyLimit: config.uploadSessionDailyLimit,
    },
  };
}

export function getTurnstileVerificationSecret(env: VisualQACloudflareEnv): string | null {
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  return secret && secret.length > 0 ? secret : null;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readPositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
