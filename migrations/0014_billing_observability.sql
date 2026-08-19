alter table stripe_webhook_events add column source_object_id text;
alter table stripe_webhook_events add column workspace_id text;
alter table stripe_webhook_events add column purchase_type text;
alter table stripe_webhook_events add column payment_status text;

create index if not exists idx_stripe_webhook_events_source_object
  on stripe_webhook_events (source_object_id);

create index if not exists idx_stripe_webhook_events_purchase_status
  on stripe_webhook_events (purchase_type, payment_status, status, received_at);
