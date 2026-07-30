create table if not exists anonymous_sessions (
  anonymous_session_id text primary key,
  first_seen_at text not null,
  last_seen_at text not null,
  first_touch_referrer_domain text,
  first_touch_utm_source text,
  first_touch_utm_medium text,
  first_touch_utm_campaign text,
  first_touch_utm_content text,
  first_touch_utm_term text,
  session_referrer_domain text,
  session_utm_source text,
  session_utm_medium text,
  session_utm_campaign text,
  session_utm_content text,
  session_utm_term text,
  created_at text not null,
  updated_at text not null
);

create index if not exists idx_anonymous_sessions_last_seen
  on anonymous_sessions (last_seen_at);

create table if not exists product_events (
  id text primary key,
  idempotency_key text not null unique,
  event_name text not null check (
    event_name in (
      'landing_view',
      'checker_started',
      'reference_upload_started',
      'reference_upload_completed',
      'reference_upload_failed',
      'candidate_upload_started',
      'candidate_upload_completed',
      'candidate_upload_failed',
      'analysis_started',
      'analysis_completed',
      'analysis_failed',
      'result_viewed',
      'issue_expanded',
      'feedback_submitted',
      'retry_clicked',
      'second_check_started',
      'contact_opt_in'
    )
  ),
  event_source text not null check (event_source in ('client', 'server')),
  anonymous_session_id text not null,
  analysis_id text,
  occurred_at text not null,
  page_path text,
  referrer_domain text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  locale text,
  device_class text,
  properties_json text not null default '{}',
  created_at text not null
);

create index if not exists idx_product_events_session_time
  on product_events (anonymous_session_id, occurred_at);

create index if not exists idx_product_events_analysis_time
  on product_events (analysis_id, occurred_at);

create index if not exists idx_product_events_name_time
  on product_events (event_name, occurred_at);

create index if not exists idx_product_events_campaign_time
  on product_events (utm_campaign, occurred_at);
