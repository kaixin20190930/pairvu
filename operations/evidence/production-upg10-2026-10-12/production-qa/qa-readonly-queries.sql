SELECT name,applied_at FROM d1_migrations WHERE name='0022_value_metrics_classifications.sql';
SELECT COUNT(*) classification_records FROM analysis_value_classifications WHERE workspace_id=(SELECT workspace_id FROM analyses WHERE id='batch-analysis-d79c71c7-417e-4ce9-8601-3353185d2001');
SELECT COUNT(*) cohort FROM analyses WHERE workspace_id=(SELECT workspace_id FROM analyses WHERE id='batch-analysis-d79c71c7-417e-4ce9-8601-3353185d2001') AND julianday(created_at)>=julianday('2026-09-01T00:00:00.000Z') AND julianday(created_at)<julianday('2026-10-12T00:00:00.000Z');
SELECT COUNT(*) total_analyses, SUM(julianday(created_at) IS NULL) invalid_creation FROM analyses WHERE workspace_id=(SELECT workspace_id FROM analyses WHERE id='batch-analysis-d79c71c7-417e-4ce9-8601-3353185d2001');
SELECT status,verdict,qa_engine_version,risk_policy_version,model_policy_version,updated_at FROM analyses WHERE id='batch-analysis-d79c71c7-417e-4ce9-8601-3353185d2001';
SELECT revision,action,machine_sha256,created_at FROM review_events WHERE analysis_id='batch-analysis-d79c71c7-417e-4ce9-8601-3353185d2001' ORDER BY revision;
SELECT revision,latest_event_id FROM review_heads WHERE analysis_id='batch-analysis-d79c71c7-417e-4ce9-8601-3353185d2001';
SELECT allowance,rollover_allowance,consumed,reserved FROM workspace_credit_periods WHERE workspace_id=(SELECT workspace_id FROM analyses WHERE id='batch-analysis-d79c71c7-417e-4ce9-8601-3353185d2001') ORDER BY ends_at DESC LIMIT 1;
SELECT check_type,status,evidence_json FROM analysis_observations WHERE analysis_id='batch-analysis-d79c71c7-417e-4ce9-8601-3353185d2001' ORDER BY check_type;
