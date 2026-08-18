create table if not exists batches (
  id text primary key,
  workspace_id text not null references workspaces (id) on delete cascade,
  mapping_mode text not null check (mapping_mode in ('one_reference_many_candidates', 'explicit_pairs')),
  status text not null check (status in ('queued', 'processing', 'completed', 'completed_with_errors', 'failed', 'canceled')),
  idempotency_key text not null,
  request_fingerprint text not null,
  item_count integer not null check (item_count between 1 and 20),
  completed_item_count integer not null default 0 check (completed_item_count >= 0),
  failed_item_count integer not null default 0 check (failed_item_count >= 0),
  created_at text not null,
  updated_at text not null,
  started_at text,
  completed_at text,
  unique (workspace_id, idempotency_key)
);

create index if not exists idx_batches_workspace_created
  on batches (workspace_id, created_at desc);

create index if not exists idx_batches_status_created
  on batches (status, created_at);

create unique index if not exists idx_batches_one_active_per_workspace
  on batches (workspace_id)
  where status in ('queued', 'processing');

create table if not exists batch_items (
  id text primary key,
  batch_id text not null references batches (id) on delete cascade,
  workspace_id text not null references workspaces (id) on delete cascade,
  position integer not null check (position >= 0),
  reference_asset_id text not null references assets (id),
  candidate_asset_id text not null references assets (id),
  client_label text,
  status text not null check (status in ('queued', 'processing', 'completed', 'failed', 'canceled')),
  analysis_id text references analyses (id) on delete set null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  terminal_error_code text,
  terminal_error_message text,
  created_at text not null,
  updated_at text not null,
  started_at text,
  completed_at text,
  unique (batch_id, position),
  unique (batch_id, candidate_asset_id)
);

create index if not exists idx_batch_items_batch_position
  on batch_items (batch_id, position);

create index if not exists idx_batch_items_status_created
  on batch_items (status, created_at);

create table if not exists analysis_execution_attempts (
  id text primary key,
  workspace_id text,
  analysis_id text not null references analyses (id) on delete cascade,
  batch_item_id text references batch_items (id) on delete set null,
  attempt_number integer not null check (attempt_number > 0),
  status text not null check (status in ('running', 'completed', 'failed')),
  trigger_kind text not null check (trigger_kind in ('interactive', 'batch_queue', 'retry')),
  error_code text,
  error_message text,
  started_at text not null,
  completed_at text,
  created_at text not null,
  updated_at text not null,
  unique (analysis_id, attempt_number)
);

create index if not exists idx_execution_attempts_analysis
  on analysis_execution_attempts (analysis_id, attempt_number);

create index if not exists idx_execution_attempts_batch_item
  on analysis_execution_attempts (batch_item_id, attempt_number);
