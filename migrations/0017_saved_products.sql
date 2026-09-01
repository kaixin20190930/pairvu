create table if not exists products (
  id text primary key,
  workspace_id text not null references workspaces (id) on delete cascade,
  name text not null,
  sku_label text,
  sku_key text,
  created_at text not null,
  updated_at text not null
);

create unique index if not exists idx_products_workspace_sku_key
  on products (workspace_id, sku_key)
  where sku_key is not null;

create index if not exists idx_products_workspace_updated
  on products (workspace_id, updated_at desc);

create table if not exists product_reference_versions (
  id text primary key,
  workspace_id text not null references workspaces (id) on delete cascade,
  product_id text not null references products (id) on delete cascade,
  asset_id text not null references assets (id),
  version_number integer not null check (version_number > 0),
  status text not null check (status in ('current', 'superseded')),
  created_at text not null,
  promoted_at text not null,
  unique (product_id, version_number),
  unique (product_id, asset_id)
);

create unique index if not exists idx_product_reference_current
  on product_reference_versions (product_id)
  where status = 'current';

create index if not exists idx_product_reference_workspace_product
  on product_reference_versions (workspace_id, product_id, version_number desc);

alter table batches add column product_id text references products (id) on delete set null;

create index if not exists idx_batches_product_created
  on batches (product_id, created_at desc)
  where product_id is not null;
