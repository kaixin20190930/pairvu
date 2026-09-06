alter table products add column status text not null default 'active'
  check (status in ('active', 'archived'));

alter table products add column archived_at text;

alter table product_reference_versions add column reference_role text not null default 'front'
  check (reference_role in ('front', 'back', 'left_side', 'right_side', 'detail', 'other'));

drop index if exists idx_product_reference_current;

create unique index idx_product_reference_current_role
  on product_reference_versions (product_id, reference_role)
  where status = 'current';

create index idx_product_reference_role_history
  on product_reference_versions (product_id, reference_role, version_number desc);

create index idx_products_workspace_status_updated
  on products (workspace_id, status, updated_at desc);
