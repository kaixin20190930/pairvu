create table if not exists workspace_credit_lots (
  id text primary key,
  workspace_id text not null references workspaces (id) on delete cascade,
  pack_code text not null,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  granted integer not null check (granted > 0),
  consumed integer not null default 0 check (consumed >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  status text not null default 'active' check (status in ('active', 'exhausted', 'refunded')),
  purchased_at text not null,
  expires_at text not null,
  refunded_at text,
  created_at text not null,
  updated_at text not null,
  check (consumed + reserved <= granted)
);

create index if not exists idx_credit_lots_workspace_expiry
  on workspace_credit_lots (workspace_id, status, expires_at, purchased_at);

create index if not exists idx_credit_lots_payment_intent
  on workspace_credit_lots (stripe_payment_intent_id);

create table if not exists credit_reservation_allocations (
  id text primary key,
  reservation_id text not null references credit_reservations (id) on delete cascade,
  bucket_type text not null check (bucket_type in ('period', 'pack')),
  credit_period_id text references workspace_credit_periods (id) on delete cascade,
  credit_lot_id text references workspace_credit_lots (id) on delete cascade,
  amount integer not null check (amount > 0),
  created_at text not null,
  check (
    (bucket_type = 'period' and credit_period_id is not null and credit_lot_id is null)
    or (bucket_type = 'pack' and credit_period_id is null and credit_lot_id is not null)
  ),
  unique (reservation_id, bucket_type, credit_period_id, credit_lot_id)
);

create index if not exists idx_credit_allocations_reservation
  on credit_reservation_allocations (reservation_id);

create table if not exists credit_lot_ledger (
  id text primary key,
  workspace_id text not null references workspaces (id) on delete cascade,
  credit_lot_id text not null references workspace_credit_lots (id) on delete cascade,
  reservation_id text references credit_reservations (id) on delete set null,
  event_type text not null check (event_type in ('grant', 'reserve', 'settle', 'release', 'refund')),
  available_delta integer not null,
  reserved_delta integer not null,
  consumed_delta integer not null,
  source_type text not null,
  source_id text not null,
  idempotency_key text not null unique,
  metadata_json text not null default '{}',
  created_at text not null
);

create index if not exists idx_credit_lot_ledger_workspace_created
  on credit_lot_ledger (workspace_id, created_at);

-- Preserve any in-flight reservations created before this migration. Settled and
-- released legacy reservations need no allocation because they will not transition again.
insert or ignore into credit_reservation_allocations (
  id, reservation_id, bucket_type, credit_period_id, credit_lot_id, amount, created_at
)
select
  'legacy-period-' || id,
  id,
  'period',
  credit_period_id,
  null,
  amount,
  created_at
from credit_reservations
where status = 'reserved';
