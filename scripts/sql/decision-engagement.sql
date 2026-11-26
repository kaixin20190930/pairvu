-- Read-only aggregate over the last 28 days in UTC.
-- Add the verified production enablement lower bound for the first observation.
-- Rows are page summaries finalized during this window, not all page starts.
-- Browser shutdown/lost transport can undercount; source clicks are engagement proxies.
-- Session IDs group only an open document lifetime; new documents generate new IDs.
-- Report eligible summaries and task-group exposures (/compare) as denominators.
with views as (
  select page_path, anonymous_session_id, properties_json
  from product_events
  where event_name = 'landing_view'
    and json_extract(properties_json, '$.purpose') = 'model_decision_v1'
    and occurred_at >= strftime('%Y-%m-%dT%H:%M:%fZ','now','-28 days')
    and occurred_at < strftime('%Y-%m-%dT%H:%M:%fZ','now')
)
select page_path,
  count(*) as finalized_page_views,
  count(distinct anonymous_session_id) as document_sessions,
  sum(json_extract(properties_json, '$.model_click')) as views_with_model_click,
  sum(json_extract(properties_json, '$.comparison_click')) as views_with_comparison_click,
  sum(json_extract(properties_json, '$.task_coding')) as views_with_coding_candidate_click,
  sum(json_extract(properties_json, '$.task_context')) as views_with_context_candidate_click,
  sum(json_extract(properties_json, '$.task_batch')) as views_with_batch_candidate_click,
  sum(json_extract(properties_json, '$.source_pricing')) as views_with_pricing_source_click,
  sum(json_extract(properties_json, '$.source_specification')) as views_with_specification_source_click,
  sum(json_extract(properties_json, '$.source_evaluation')) as views_with_evaluation_source_click,
  sum(json_extract(properties_json, '$.source_availability')) as views_with_availability_source_click
from views group by page_path order by finalized_page_views desc;
