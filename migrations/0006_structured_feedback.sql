alter table analysis_feedback add column reason_code text;
alter table analysis_feedback add column check_family text;
alter table analysis_feedback add column issue_id text;

create index if not exists idx_analysis_feedback_reason
  on analysis_feedback (feedback_kind, reason_code, created_at);

create index if not exists idx_analysis_feedback_family
  on analysis_feedback (check_family, created_at);

create index if not exists idx_analysis_feedback_issue
  on analysis_feedback (issue_id, created_at);
