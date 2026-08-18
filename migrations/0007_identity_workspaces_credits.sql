create table if not exists user (
  id text primary key not null,
  name text not null,
  email text not null unique,
  emailVerified integer not null default 0,
  image text,
  createdAt integer not null,
  updatedAt integer not null
);

create table if not exists session (
  id text primary key not null,
  expiresAt integer not null,
  token text not null unique,
  createdAt integer not null,
  updatedAt integer not null,
  ipAddress text,
  userAgent text,
  userId text not null references user (id) on delete cascade
);

create index if not exists idx_session_user_id on session (userId);

create table if not exists account (
  id text primary key not null,
  accountId text not null,
  providerId text not null,
  userId text not null references user (id) on delete cascade,
  accessToken text,
  refreshToken text,
  idToken text,
  accessTokenExpiresAt integer,
  refreshTokenExpiresAt integer,
  scope text,
  password text,
  createdAt integer not null,
  updatedAt integer not null
);

create index if not exists idx_account_user_id on account (userId);
create unique index if not exists idx_account_provider_identity on account (providerId, accountId);

create table if not exists verification (
  id text primary key not null,
  identifier text not null,
  value text not null,
  expiresAt integer not null,
  createdAt integer not null,
  updatedAt integer not null
);

create index if not exists idx_verification_identifier on verification (identifier);

create table if not exists rateLimit (
  id text primary key not null,
  key text not null unique,
  count integer not null,
  lastRequest integer not null
);

create table if not exists workspaces (
  id text primary key,
  workspace_type text not null check (workspace_type in ('personal')),
  name text not null,
  status text not null check (status in ('active', 'deleting', 'deleted')),
  retention_policy_key text not null check (retention_policy_key in ('authenticated_7d', 'paid_30d')),
  created_at text not null,
  updated_at text not null
);

create table if not exists workspace_memberships (
  id text primary key,
  workspace_id text not null references workspaces (id) on delete cascade,
  user_id text not null references user (id) on delete cascade,
  role text not null check (role in ('owner')),
  created_at text not null,
  updated_at text not null,
  unique (workspace_id, user_id)
);

create unique index if not exists idx_personal_membership_user on workspace_memberships (user_id);

create table if not exists plans (
  code text primary key,
  name text not null,
  monthly_price_cents integer not null,
  included_monthly_credits integer not null,
  batch_item_limit integer not null,
  csv_export_enabled integer not null default 0,
  priority_queue_enabled integer not null default 0,
  retention_policy_key text not null check (retention_policy_key in ('authenticated_7d', 'paid_30d')),
  active integer not null default 1,
  created_at text not null,
  updated_at text not null
);

insert into plans (
  code, name, monthly_price_cents, included_monthly_credits, batch_item_limit,
  csv_export_enabled, priority_queue_enabled, retention_policy_key, active,
  created_at, updated_at
) values
  ('free', 'Free', 0, 10, 5, 0, 0, 'authenticated_7d', 1, datetime('now'), datetime('now')),
  ('starter', 'Starter', 1900, 150, 20, 1, 0, 'paid_30d', 1, datetime('now'), datetime('now')),
  ('growth', 'Growth', 4900, 600, 20, 1, 1, 'paid_30d', 1, datetime('now'), datetime('now')),
  ('agency', 'Agency', 9900, 1500, 20, 1, 1, 'paid_30d', 1, datetime('now'), datetime('now'))
on conflict(code) do update set
  name = excluded.name,
  monthly_price_cents = excluded.monthly_price_cents,
  included_monthly_credits = excluded.included_monthly_credits,
  batch_item_limit = excluded.batch_item_limit,
  csv_export_enabled = excluded.csv_export_enabled,
  priority_queue_enabled = excluded.priority_queue_enabled,
  retention_policy_key = excluded.retention_policy_key,
  active = excluded.active,
  updated_at = excluded.updated_at;

create table if not exists workspace_subscriptions (
  id text primary key,
  workspace_id text not null unique references workspaces (id) on delete cascade,
  plan_code text not null references plans (code),
  provider text not null check (provider in ('internal', 'stripe')),
  provider_customer_id text,
  provider_subscription_id text unique,
  status text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  current_period_start text not null,
  current_period_end text not null,
  cancel_at_period_end integer not null default 0,
  created_at text not null,
  updated_at text not null
);

create index if not exists idx_workspace_subscriptions_plan on workspace_subscriptions (plan_code, status);

create table if not exists workspace_credit_periods (
  id text primary key,
  workspace_id text not null references workspaces (id) on delete cascade,
  subscription_id text not null references workspace_subscriptions (id) on delete cascade,
  plan_code text not null references plans (code),
  period_key text not null,
  starts_at text not null,
  ends_at text not null,
  allowance integer not null check (allowance >= 0),
  rollover_allowance integer not null default 0 check (rollover_allowance >= 0),
  consumed integer not null default 0 check (consumed >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  created_at text not null,
  updated_at text not null,
  unique (workspace_id, period_key)
);

create index if not exists idx_credit_period_workspace_end on workspace_credit_periods (workspace_id, ends_at);

create table if not exists credit_reservations (
  id text primary key,
  workspace_id text not null references workspaces (id) on delete cascade,
  credit_period_id text not null references workspace_credit_periods (id) on delete cascade,
  amount integer not null check (amount > 0),
  status text not null check (status in ('reserved', 'settled', 'released')),
  purpose text not null,
  source_type text not null,
  source_id text not null,
  expires_at text not null,
  created_at text not null,
  updated_at text not null,
  unique (workspace_id, source_type, source_id)
);

create index if not exists idx_credit_reservations_expiry on credit_reservations (status, expires_at);

create table if not exists usage_ledger (
  id text primary key,
  workspace_id text not null references workspaces (id) on delete cascade,
  credit_period_id text references workspace_credit_periods (id) on delete set null,
  reservation_id text references credit_reservations (id) on delete set null,
  event_type text not null check (event_type in ('period_grant', 'reserve', 'settle', 'release', 'adjustment')),
  available_delta integer not null,
  reserved_delta integer not null,
  consumed_delta integer not null,
  source_type text not null,
  source_id text not null,
  idempotency_key text not null unique,
  metadata_json text not null default '{}',
  created_at text not null
);

create index if not exists idx_usage_ledger_workspace_created on usage_ledger (workspace_id, created_at);
