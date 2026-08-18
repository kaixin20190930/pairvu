create unique index if not exists idx_analyses_workspace_idempotency
  on analyses (workspace_id, idempotency_key)
  where workspace_id is not null and idempotency_key is not null;
