-- Pairvu M1 billing audit. Read-only: every statement is a SELECT.
-- Healthy output has zero rows for the first four reports.

-- 1. Credit-period balances must reconstruct from immutable ledger deltas.
with ledger_totals as (
  select
    credit_period_id,
    coalesce(sum(available_delta), 0) as ledger_available,
    coalesce(sum(reserved_delta), 0) as ledger_reserved,
    coalesce(sum(consumed_delta), 0) as ledger_consumed
  from usage_ledger
  where credit_period_id is not null
  group by credit_period_id
)
select
  cp.workspace_id,
  cp.id as credit_period_id,
  cp.plan_code,
  cp.allowance + cp.rollover_allowance - cp.consumed - cp.reserved as stored_available,
  coalesce(lt.ledger_available, 0) as ledger_available,
  cp.reserved as stored_reserved,
  coalesce(lt.ledger_reserved, 0) as ledger_reserved,
  cp.consumed as stored_consumed,
  coalesce(lt.ledger_consumed, 0) as ledger_consumed
from workspace_credit_periods cp
left join ledger_totals lt on lt.credit_period_id = cp.id
where cp.allowance + cp.rollover_allowance - cp.consumed - cp.reserved != coalesce(lt.ledger_available, 0)
   or cp.reserved != coalesce(lt.ledger_reserved, 0)
   or cp.consumed != coalesce(lt.ledger_consumed, 0)
order by cp.updated_at desc;

-- 2. Purchased-credit lots must reconstruct from their immutable ledger.
with lot_ledger_totals as (
  select
    credit_lot_id,
    coalesce(sum(available_delta), 0) as ledger_available,
    coalesce(sum(reserved_delta), 0) as ledger_reserved,
    coalesce(sum(consumed_delta), 0) as ledger_consumed
  from credit_lot_ledger
  group by credit_lot_id
)
select
  l.workspace_id,
  l.id as credit_lot_id,
  l.pack_code,
  l.status,
  case when l.status = 'refunded' then 0 else l.granted - l.consumed - l.reserved end as stored_available,
  coalesce(lt.ledger_available, 0) as ledger_available,
  l.reserved as stored_reserved,
  coalesce(lt.ledger_reserved, 0) as ledger_reserved,
  l.consumed as stored_consumed,
  coalesce(lt.ledger_consumed, 0) as ledger_consumed
from workspace_credit_lots l
left join lot_ledger_totals lt on lt.credit_lot_id = l.id
where (case when l.status = 'refunded' then 0 else l.granted - l.consumed - l.reserved end) != coalesce(lt.ledger_available, 0)
   or l.reserved != coalesce(lt.ledger_reserved, 0)
   or l.consumed != coalesce(lt.ledger_consumed, 0)
order by l.updated_at desc;

-- 3. Reserved credits older than their expiry require release/reconciliation.
select
  workspace_id,
  id as reservation_id,
  amount,
  purpose,
  source_type,
  source_id,
  expires_at
from credit_reservations
where status = 'reserved' and julianday(expires_at) <= julianday('now')
order by expires_at asc;

-- 4. Active/trialing subscriptions and their current plan period must agree.
select
  s.workspace_id,
  s.provider,
  s.status,
  s.plan_code as subscription_plan,
  cp.plan_code as credit_plan,
  cp.period_key,
  cp.ends_at
from workspace_subscriptions s
left join workspace_credit_periods cp
  on cp.id = (
    select current_cp.id
    from workspace_credit_periods current_cp
    where current_cp.workspace_id = s.workspace_id
      and current_cp.period_key = case
        when s.provider = 'stripe' then 'stripe-' || s.current_period_start
        else substr(s.current_period_start, 1, 7)
      end
    limit 1
  )
where s.status in ('active', 'trialing')
  and (cp.id is null or cp.plan_code != s.plan_code);

-- 5. Failed events or processing events older than ten minutes need attention.
select
  event_id,
  event_type,
  status,
  error_message,
  received_at,
  processed_at
from stripe_webhook_events
where status = 'failed'
   or (status = 'processing' and julianday(received_at) <= julianday('now', '-10 minutes'))
order by received_at asc;

-- 6. Operational summary. This report always returns rows.
select
  s.plan_code,
  s.status,
  count(*) as workspaces,
  coalesce(sum(cp.allowance + cp.rollover_allowance), 0) as granted,
  coalesce(sum(cp.consumed), 0) as consumed,
  coalesce(sum(cp.reserved), 0) as reserved,
  coalesce(sum(cp.allowance + cp.rollover_allowance - cp.consumed - cp.reserved), 0) as monthly_available,
  coalesce(sum((
    select coalesce(sum(l.granted - l.consumed - l.reserved), 0)
    from workspace_credit_lots l
    where l.workspace_id = s.workspace_id and l.status = 'active' and julianday(l.expires_at) > julianday('now')
  )), 0) as extra_available
from workspace_subscriptions s
left join workspace_credit_periods cp
  on cp.id = (
    select latest_cp.id
    from workspace_credit_periods latest_cp
    where latest_cp.workspace_id = s.workspace_id
      and latest_cp.period_key = case
        when s.provider = 'stripe' then 'stripe-' || s.current_period_start
        else substr(s.current_period_start, 1, 7)
      end
    limit 1
  )
group by s.plan_code, s.status
order by s.plan_code, s.status;
