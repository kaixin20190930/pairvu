create table if not exists asset_deletion_attempts (
  id text primary key,
  asset_id text not null,
  status text not null check (status in ('started', 'completed', 'failed')),
  object_keys_json text not null,
  error_message text,
  attempted_at text not null,
  completed_at text,
  created_at text not null,
  updated_at text not null
);

create index if not exists idx_asset_deletion_attempts_asset_time
  on asset_deletion_attempts (asset_id, attempted_at);

create index if not exists idx_asset_deletion_attempts_status_time
  on asset_deletion_attempts (status, attempted_at);
