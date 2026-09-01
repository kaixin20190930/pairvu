create table product_events_next (
  id text primary key,
  idempotency_key text not null unique,
  event_name text not null check (
    event_name in (
      'landing_view',
      'example_cta_clicked',
      'zero_allowance_viewed',
      'zero_allowance_cta_clicked',
      'pricing_viewed',
      'checkout_started',
      'checkout_redirected',
      'checker_started',
      'reference_upload_started',
      'reference_upload_completed',
      'reference_upload_failed',
      'candidate_upload_started',
      'candidate_upload_completed',
      'candidate_upload_failed',
      'analysis_submit_attempted',
      'analysis_submit_blocked',
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

insert into product_events_next (
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
)
select
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
from product_events;

drop table product_events;
alter table product_events_next rename to product_events;

create index idx_product_events_session_time
  on product_events (anonymous_session_id, occurred_at);

create index idx_product_events_analysis_time
  on product_events (analysis_id, occurred_at);

create index idx_product_events_name_time
  on product_events (event_name, occurred_at);

create index idx_product_events_campaign_time
  on product_events (utm_campaign, occurred_at);
