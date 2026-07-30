alter table analyses add column idempotency_key text;

create unique index if not exists idx_analyses_anonymous_idempotency
  on analyses (anonymous_session_id, idempotency_key)
  where anonymous_session_id is not null and idempotency_key is not null;
