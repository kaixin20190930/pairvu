create table if not exists analyses (
  id text primary key,
  workspace_id text,
  anonymous_session_id text,
  reference_asset_id text not null,
  candidate_asset_id text not null,
  selected_checks_json text not null,
  category text,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  verdict text check (verdict in ('pass', 'review', 'fail')),
  qa_engine_version text,
  risk_policy_version text,
  model_policy_version text,
  analysis_latency_ms integer,
  openai_latency_ms integer,
  estimated_cost_usd real,
  error_code text,
  error_message text,
  started_at text,
  completed_at text,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create index if not exists idx_analyses_workspace_created on analyses (workspace_id, created_at);
create index if not exists idx_analyses_anonymous_created on analyses (anonymous_session_id, created_at);
create index if not exists idx_analyses_status_created on analyses (status, created_at);

create table if not exists analysis_references (
  id text primary key,
  workspace_id text,
  analysis_id text not null,
  asset_id text not null,
  created_at text not null
);

create index if not exists idx_analysis_references_analysis on analysis_references (analysis_id);

create table if not exists analysis_observations (
  id text primary key,
  workspace_id text,
  analysis_id text not null,
  check_type text not null,
  status text not null check (status in ('match', 'mismatch', 'uncertain', 'not_observable', 'not_applicable')),
  difference_kind text,
  reference_observability text not null check (reference_observability in ('observable', 'partially_observable', 'not_observable')),
  candidate_observability text not null check (candidate_observability in ('observable', 'partially_observable', 'not_observable')),
  coverage text not null check (coverage in ('sufficient', 'partial', 'insufficient')),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  evidence_json text not null,
  explanation text not null,
  created_at text not null
);

create index if not exists idx_analysis_observations_analysis on analysis_observations (analysis_id, created_at);

create table if not exists analysis_issues (
  id text primary key,
  workspace_id text,
  analysis_id text not null,
  observation_id text,
  issue_kind text not null check (issue_kind in ('product', 'technical')),
  issue_type text not null,
  source_check_type text not null,
  source_difference_kind text,
  source_reference_observability text not null,
  source_candidate_observability text not null,
  source_coverage text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  message text not null,
  evidence_json text not null,
  created_at text not null
);

create index if not exists idx_analysis_issues_analysis on analysis_issues (analysis_id, created_at);

create table if not exists analysis_limitations (
  id text primary key,
  workspace_id text,
  analysis_id text not null,
  observation_id text,
  limitation_type text not null,
  source_check_type text,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  message text not null,
  evidence_json text not null,
  created_at text not null
);

create index if not exists idx_analysis_limitations_analysis on analysis_limitations (analysis_id, created_at);

create table if not exists analysis_model_calls (
  id text primary key,
  workspace_id text,
  analysis_id text not null,
  execution_attempt_id text,
  provider text not null,
  model text not null,
  prompt_version text not null,
  model_policy_version text,
  purpose text not null,
  input_asset_ids_json text not null,
  input_usage_json text,
  output_usage_json text,
  latency_ms integer not null,
  estimated_cost_usd real,
  status text not null check (status in ('completed', 'failed')),
  error_code text,
  error_message text,
  created_at text not null
);

create index if not exists idx_analysis_model_calls_analysis on analysis_model_calls (analysis_id, created_at);

create table if not exists analysis_feedback (
  id text primary key,
  analysis_id text not null,
  feedback_kind text not null check (feedback_kind in ('correct', 'false_alarm', 'missed_something')),
  comment text,
  created_at text not null,
  updated_at text not null
);

create index if not exists idx_analysis_feedback_analysis on analysis_feedback (analysis_id, created_at);
