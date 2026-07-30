create table if not exists assets (
  id text primary key,
  workspace_id text,
  anonymous_session_id text,
  kind text not null check (kind in ('reference', 'candidate', 'derived', 'report')),
  asset_type text not null check (asset_type in ('image')),
  mime_type text not null,
  file_size_bytes integer not null,
  width integer,
  height integer,
  sha256 text not null,
  r2_key_original text not null,
  r2_key_normalized text,
  r2_key_thumbnail text,
  status text not null check (status in ('uploaded', 'normalized', 'analyzed', 'deleted', 'failed')),
  retention_expires_at text,
  deleted_at text,
  created_at text not null,
  updated_at text not null
);

create index if not exists idx_assets_workspace_sha256 on assets (workspace_id, sha256);
create index if not exists idx_assets_anonymous_created on assets (anonymous_session_id, created_at);
create index if not exists idx_assets_retention_expires_at on assets (retention_expires_at);
