import type { D1Database } from "@/lib/cloudflare/bindings";
import { getPublicBetaConfig, type PublicBetaConfig } from "@/lib/config/public-beta";

export type PublicBetaLimitCode =
  | "analysis_paused"
  | "analysis_turnstile_required"
  | "analysis_turnstile_failed"
  | "upload_turnstile_failed"
  | "analysis_session_rate_limited"
  | "analysis_global_rate_limited"
  | "analysis_session_concurrency_limited"
  | "analysis_global_concurrency_limited"
  | "analysis_session_budget_limited"
  | "analysis_global_budget_limited"
  | "upload_session_rate_limited";

export class PublicBetaAccessError extends Error {
  constructor(
    public readonly code: PublicBetaLimitCode,
    message: string,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "PublicBetaAccessError";
  }
}

export interface PublicBetaAnalysisGuardInput {
  anonymousSessionId: string;
  turnstileToken?: string | null;
  clientIp?: string | null;
}

export interface PublicBetaUploadGuardInput {
  anonymousSessionId: string;
  turnstileToken?: string | null;
  clientIp?: string | null;
}

export async function enforcePublicAnalysisGuard(
  db: D1Database,
  env: Parameters<typeof getPublicBetaConfig>[0],
  input: PublicBetaAnalysisGuardInput,
): Promise<PublicBetaConfig> {
  const config = getPublicBetaConfig(env);

  if (!config.analysisAcceptingNewRequests) {
    throw new PublicBetaAccessError("analysis_paused", config.analysisPauseMessage, 503, 300);
  }

  await enforceTurnstile(config, input.turnstileToken, input.clientIp, "analysis");
  await enforceAnalysisSessionRateLimit(db, config, input.anonymousSessionId);
  await enforceAnalysisGlobalRateLimit(db, config);
  await enforceAnalysisConcurrencyLimit(db, config, input.anonymousSessionId);
  await enforceAnalysisBudgetLimit(db, config, input.anonymousSessionId);

  return config;
}

export async function enforcePublicUploadGuard(
  db: D1Database,
  env: Parameters<typeof getPublicBetaConfig>[0],
  input: PublicBetaUploadGuardInput,
): Promise<PublicBetaConfig> {
  const config = getPublicBetaConfig(env);

  if (config.turnstileValidateUploads) {
    await enforceTurnstile(config, input.turnstileToken, input.clientIp, "upload");
  }

  await enforceUploadSessionRateLimit(db, config, input.anonymousSessionId);
  return config;
}

async function enforceTurnstile(
  config: PublicBetaConfig,
  token: string | null | undefined,
  clientIp: string | null | undefined,
  action: "analysis" | "upload",
) {
  const secret = config.turnstileSecretKey;
  const siteKey = config.turnstileSiteKey;

  if (!secret || !siteKey) return;

  if (!token) {
    throw new PublicBetaAccessError(
      action === "analysis" ? "analysis_turnstile_required" : "upload_turnstile_failed",
      "Please complete the security check and retry.",
      403,
    );
  }

  const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret,
      response: token,
      remoteip: clientIp ?? undefined,
    }),
  });

  if (!verification.ok) {
    throw new PublicBetaAccessError(
      action === "analysis" ? "analysis_turnstile_failed" : "upload_turnstile_failed",
      "The security check service could not be reached.",
      503,
    );
  }

  const payload = (await verification.json()) as { success?: boolean; "error-codes"?: string[] };
  if (!payload.success) {
    throw new PublicBetaAccessError(
      action === "analysis" ? "analysis_turnstile_failed" : "upload_turnstile_failed",
      "The security check was not accepted. Please try again.",
      403,
    );
  }
}

async function enforceAnalysisSessionRateLimit(
  db: D1Database,
  config: PublicBetaConfig,
  anonymousSessionId: string,
) {
  const sinceMinute = new Date(Date.now() - 60_000).toISOString();
  const sinceDay = startOfUtcDayIso();
  const [minuteCount, dayCount] = await Promise.all([
    countAnalyses(db, anonymousSessionId, sinceMinute),
    countAnalyses(db, anonymousSessionId, sinceDay),
  ]);

  if (minuteCount >= config.analysisSessionMinuteLimit) {
    throw new PublicBetaAccessError(
      "analysis_session_rate_limited",
      "Too many analyses were started in a short time. Please wait a moment and retry.",
      429,
      60,
    );
  }

  if (dayCount >= config.analysisSessionDailyLimit) {
    throw new PublicBetaAccessError(
      "analysis_session_rate_limited",
      "This anonymous session has reached its daily analysis limit. Please retry later.",
      429,
      secondsUntilUtcDayEnd(),
    );
  }
}

async function enforceAnalysisGlobalRateLimit(db: D1Database, config: PublicBetaConfig) {
  const sinceDay = startOfUtcDayIso();
  const dayCount = await countGlobalAnalyses(db, sinceDay);

  if (dayCount >= config.analysisGlobalDailyLimit) {
    throw new PublicBetaAccessError(
      "analysis_global_rate_limited",
      "The service has reached its daily analysis cap. Please retry later.",
      429,
      secondsUntilUtcDayEnd(),
    );
  }
}

async function enforceAnalysisConcurrencyLimit(
  db: D1Database,
  config: PublicBetaConfig,
  anonymousSessionId: string,
) {
  const [sessionActive, globalActive] = await Promise.all([
    countActiveAnalyses(db, anonymousSessionId),
    countGlobalActiveAnalyses(db),
  ]);

  if (sessionActive >= config.analysisSessionConcurrentLimit) {
    throw new PublicBetaAccessError(
      "analysis_session_concurrency_limited",
      "Another analysis is already running for this session. Please wait and retry.",
      429,
      30,
    );
  }

  if (globalActive >= config.analysisGlobalConcurrentLimit) {
    throw new PublicBetaAccessError(
      "analysis_global_concurrency_limited",
      "The service is busy right now. Please retry in a moment.",
      429,
      30,
    );
  }
}

async function enforceAnalysisBudgetLimit(
  db: D1Database,
  config: PublicBetaConfig,
  anonymousSessionId: string,
) {
  const sinceDay = startOfUtcDayIso();
  const [sessionSpend, globalSpend] = await Promise.all([
    sumAnalysisSpend(db, anonymousSessionId, sinceDay),
    sumGlobalAnalysisSpend(db, sinceDay),
  ]);

  if (sessionSpend >= config.analysisSessionDailySpendLimitUsd) {
    throw new PublicBetaAccessError(
      "analysis_session_budget_limited",
      "This anonymous session has reached its daily spend limit. Please retry tomorrow.",
      429,
      secondsUntilUtcDayEnd(),
    );
  }

  if (globalSpend >= config.analysisGlobalDailySpendLimitUsd) {
    throw new PublicBetaAccessError(
      "analysis_global_budget_limited",
      "The daily spend cap has been reached. Please retry later.",
      429,
      secondsUntilUtcDayEnd(),
    );
  }
}

async function enforceUploadSessionRateLimit(
  db: D1Database,
  config: PublicBetaConfig,
  anonymousSessionId: string,
) {
  const sinceMinute = new Date(Date.now() - 60_000).toISOString();
  const sinceDay = startOfUtcDayIso();
  const [minuteCount, dayCount] = await Promise.all([
    countUploads(db, anonymousSessionId, sinceMinute),
    countUploads(db, anonymousSessionId, sinceDay),
  ]);

  if (minuteCount >= config.uploadSessionMinuteLimit) {
    throw new PublicBetaAccessError(
      "upload_session_rate_limited",
      "Too many uploads were started in a short time. Please wait a moment and retry.",
      429,
      60,
    );
  }

  if (dayCount >= config.uploadSessionDailyLimit) {
    throw new PublicBetaAccessError(
      "upload_session_rate_limited",
      "This anonymous session has reached its daily upload limit. Please retry later.",
      429,
      secondsUntilUtcDayEnd(),
    );
  }
}

async function countAnalyses(db: D1Database, anonymousSessionId: string, sinceIso: string) {
  const row = await db
    .prepare(
      `select count(*) as count
       from analyses
       where anonymous_session_id = ?
         and created_at >= ?
         and status in ('running', 'completed')`,
    )
    .bind(anonymousSessionId, sinceIso)
    .first<Record<string, unknown>>();

  return Number(row?.count ?? 0);
}

async function countGlobalAnalyses(db: D1Database, sinceIso: string) {
  const row = await db
    .prepare(
      `select count(*) as count
       from analyses
       where created_at >= ?
         and status in ('running', 'completed')`,
    )
    .bind(sinceIso)
    .first<Record<string, unknown>>();

  return Number(row?.count ?? 0);
}

async function countActiveAnalyses(db: D1Database, anonymousSessionId: string) {
  const row = await db
    .prepare(
      `select count(*) as count
       from analyses
       where anonymous_session_id = ?
         and status = 'running'`,
    )
    .bind(anonymousSessionId)
    .first<Record<string, unknown>>();

  return Number(row?.count ?? 0);
}

async function countGlobalActiveAnalyses(db: D1Database) {
  const row = await db
    .prepare(
      `select count(*) as count
       from analyses
       where status = 'running'`,
    )
    .first<Record<string, unknown>>();

  return Number(row?.count ?? 0);
}

async function sumAnalysisSpend(db: D1Database, anonymousSessionId: string, sinceIso: string) {
  const row = await db
    .prepare(
      `select coalesce(sum(coalesce(estimated_cost_usd, 0)), 0) as total
       from analyses
       where anonymous_session_id = ?
         and created_at >= ?
         and status = 'completed'`,
    )
    .bind(anonymousSessionId, sinceIso)
    .first<Record<string, unknown>>();

  return Number(row?.total ?? 0);
}

async function sumGlobalAnalysisSpend(db: D1Database, sinceIso: string) {
  const row = await db
    .prepare(
      `select coalesce(sum(coalesce(estimated_cost_usd, 0)), 0) as total
       from analyses
       where created_at >= ?
         and status = 'completed'`,
    )
    .bind(sinceIso)
    .first<Record<string, unknown>>();

  return Number(row?.total ?? 0);
}

async function countUploads(db: D1Database, anonymousSessionId: string, sinceIso: string) {
  const row = await db
    .prepare(
      `select count(*) as count
       from assets
       where anonymous_session_id = ?
         and created_at >= ?
         and kind in ('reference', 'candidate')`,
    )
    .bind(anonymousSessionId, sinceIso)
    .first<Record<string, unknown>>();

  return Number(row?.count ?? 0);
}

function startOfUtcDayIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

function secondsUntilUtcDayEnd() {
  const now = new Date();
  const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(60, Math.ceil((nextMidnight.getTime() - now.getTime()) / 1000));
}
