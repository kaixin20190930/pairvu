alter table batches add column asset_retention_expires_at text;

create index if not exists idx_batches_asset_retention_expires
  on batches (asset_retention_expires_at)
  where asset_retention_expires_at is not null;
