create table if not exists stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  livemode integer not null default 0,
  status text not null check (status in ('processing', 'completed', 'failed')),
  payload_created_at text,
  error_message text,
  received_at text not null,
  processed_at text
);

create index if not exists idx_stripe_webhook_events_received
  on stripe_webhook_events (received_at);

create index if not exists idx_workspace_subscriptions_customer
  on workspace_subscriptions (provider_customer_id);
