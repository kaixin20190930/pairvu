import type { D1Database } from "@/lib/cloudflare/bindings";
import type { ProductEventInput } from "./types";

const CLIENT_EVENT_LIMIT_PER_MINUTE = 120;

export async function recordProductEvent(db: D1Database, input: ProductEventInput): Promise<void> {
  const now = new Date().toISOString();
  const eventId = crypto.randomUUID();
  const inserted = await db
    .prepare(
      `insert into product_events (
        id,
        idempotency_key,
        event_name,
        event_source,
        anonymous_session_id,
        analysis_id,
        occurred_at,
        page_path,
        referrer_domain,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        locale,
        device_class,
        properties_json,
        created_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(idempotency_key) do nothing
      returning id`,
    )
    .bind(
      eventId,
      input.idempotencyKey,
      input.eventName,
      input.eventSource,
      input.anonymousSessionId,
      input.analysisId ?? null,
      input.occurredAt,
      input.pagePath ?? null,
      input.attribution?.referrerDomain ?? null,
      input.attribution?.utmSource ?? null,
      input.attribution?.utmMedium ?? null,
      input.attribution?.utmCampaign ?? null,
      input.attribution?.utmContent ?? null,
      input.attribution?.utmTerm ?? null,
      input.locale ?? null,
      input.deviceClass ?? null,
      JSON.stringify(input.properties ?? {}),
      now,
    )
    .first<{ id: string }>();

  if (!inserted) return;

  await upsertAnonymousSession(db, input, now);
}

export async function clientEventRateLimitExceeded(db: D1Database, anonymousSessionId: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - 60_000).toISOString();
  const row = await db
    .prepare(
      `select count(*) as eventCount
       from product_events
       where anonymous_session_id = ?
         and event_source = 'client'
         and created_at >= ?`,
    )
    .bind(anonymousSessionId, windowStart)
    .first<Record<string, unknown>>();

  return Number(row?.eventCount ?? 0) >= CLIENT_EVENT_LIMIT_PER_MINUTE;
}

export async function analysisBelongsToEventActor(
  db: D1Database,
  analysisId: string,
  actor: { workspaceId: string | null; anonymousSessionId: string | null },
): Promise<boolean> {
  const row = await db
    .prepare(
      `select id
       from analyses
       where id = ?
         and (
           (workspace_id is not null and workspace_id = ?)
           or (anonymous_session_id is not null and anonymous_session_id = ?)
         )
       limit 1`,
    )
    .bind(analysisId, actor.workspaceId, actor.anonymousSessionId)
    .first<Record<string, unknown>>();

  return Boolean(row?.id);
}

async function upsertAnonymousSession(db: D1Database, input: ProductEventInput, now: string): Promise<void> {
  const attribution = input.attribution;
  const result = await db
    .prepare(
      `insert into anonymous_sessions (
        anonymous_session_id,
        first_seen_at,
        last_seen_at,
        first_touch_referrer_domain,
        first_touch_utm_source,
        first_touch_utm_medium,
        first_touch_utm_campaign,
        first_touch_utm_content,
        first_touch_utm_term,
        session_referrer_domain,
        session_utm_source,
        session_utm_medium,
        session_utm_campaign,
        session_utm_content,
        session_utm_term,
        created_at,
        updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(anonymous_session_id) do update set
        last_seen_at = excluded.last_seen_at,
        first_touch_referrer_domain = coalesce(anonymous_sessions.first_touch_referrer_domain, excluded.first_touch_referrer_domain),
        first_touch_utm_source = coalesce(anonymous_sessions.first_touch_utm_source, excluded.first_touch_utm_source),
        first_touch_utm_medium = coalesce(anonymous_sessions.first_touch_utm_medium, excluded.first_touch_utm_medium),
        first_touch_utm_campaign = coalesce(anonymous_sessions.first_touch_utm_campaign, excluded.first_touch_utm_campaign),
        first_touch_utm_content = coalesce(anonymous_sessions.first_touch_utm_content, excluded.first_touch_utm_content),
        first_touch_utm_term = coalesce(anonymous_sessions.first_touch_utm_term, excluded.first_touch_utm_term),
        session_referrer_domain = coalesce(excluded.session_referrer_domain, anonymous_sessions.session_referrer_domain),
        session_utm_source = coalesce(excluded.session_utm_source, anonymous_sessions.session_utm_source),
        session_utm_medium = coalesce(excluded.session_utm_medium, anonymous_sessions.session_utm_medium),
        session_utm_campaign = coalesce(excluded.session_utm_campaign, anonymous_sessions.session_utm_campaign),
        session_utm_content = coalesce(excluded.session_utm_content, anonymous_sessions.session_utm_content),
        session_utm_term = coalesce(excluded.session_utm_term, anonymous_sessions.session_utm_term),
        updated_at = excluded.updated_at`,
    )
    .bind(
      input.anonymousSessionId,
      input.occurredAt,
      input.occurredAt,
      attribution?.referrerDomain ?? null,
      attribution?.utmSource ?? null,
      attribution?.utmMedium ?? null,
      attribution?.utmCampaign ?? null,
      attribution?.utmContent ?? null,
      attribution?.utmTerm ?? null,
      attribution?.referrerDomain ?? null,
      attribution?.utmSource ?? null,
      attribution?.utmMedium ?? null,
      attribution?.utmCampaign ?? null,
      attribution?.utmContent ?? null,
      attribution?.utmTerm ?? null,
      now,
      now,
    )
    .run();

  if (!result.success) {
    throw new Error(result.error ?? "Failed to upsert anonymous session.");
  }
}
