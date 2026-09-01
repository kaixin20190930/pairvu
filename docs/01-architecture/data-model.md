# D1 Schema Design

This document records the durable schema direction. The active implementation is defined by versioned files in `migrations/`; later sections may still describe evidence-gated extension points.

## Design Rules

- Every customer data table includes `workspace_id` unless it is global, identity-only, or lookup-only.
- Database reads and writes must scope by `workspace_id`.
- Store image binaries in R2, never in D1.
- Store immutable usage ledger rows; do not infer billing from analysis count.
- Store engine, risk, model policy, and ruleset versions on every analysis.
- Store actual provider, model, prompt, latency, and cost on model-call records because one analysis may use multiple model calls.
- Design batch, API, telemetry, feedback, and evaluation now, even if not all are active in M0.

## Identity

### users

- `id` primary key
- `email` unique
- `name`
- `avatar_url`
- `created_at`
- `updated_at`

### workspaces

- `id` primary key
- `name`
- `slug`
- `plan_key`
- `retention_policy_key`
- `created_at`
- `updated_at`

### memberships

- `id` primary key
- `workspace_id`
- `user_id`
- `role` (`owner`, `admin`, `member`, `viewer`)
- `created_at`
- `updated_at`

Unique index: `workspace_id, user_id`.

## Assets

### assets

- `id` primary key
- `workspace_id` nullable for anonymous assets
- `anonymous_session_id` nullable
- `kind` (`reference`, `candidate`, `derived`, `report`)
- `asset_type` (`image`, future `video`)
- `mime_type`
- `file_size_bytes`
- `width`
- `height`
- `sha256`
- `r2_key_original`
- `r2_key_normalized`
- `r2_key_thumbnail`
- `status` (`uploaded`, `normalized`, `analyzed`, `deleted`, `failed`)
- `retention_expires_at`
- `deleted_at`
- `created_at`
- `updated_at`

Indexes:

- `workspace_id, sha256`
- `anonymous_session_id, created_at`
- `retention_expires_at`

## Products

### products

- `id` primary key
- `workspace_id`
- `name`
- `sku_label` nullable, display value
- `sku_key` nullable, normalized workspace-unique value
- `created_at`
- `updated_at`

### product_reference_versions

- `id` primary key
- `workspace_id`
- `product_id`
- `asset_id`
- `version_number`
- `status` (`current`, `superseded`)
- `created_at`
- `promoted_at`

The initial M2 pilot permits one current reference per product. A partial
unique index enforces that invariant, while superseded version metadata remains
available for audit history. Reference binaries still follow the workspace
retention policy; an expired or deleted current image makes the product
temporarily unavailable for reuse until a new reference is promoted.

`batches.product_id` is nullable and is populated only for the
`one_reference_many_candidates` workflow. Batch creation revalidates product
ownership, current-reference identity, asset status, and retention expiry on
the server.

### product_attributes

- `id` primary key
- `workspace_id`
- `product_id`
- `attribute_key`
- `value_json`
- `source` (`user_confirmed`, `ai_suggested`, `imported`)
- `allowed_variation_json`
- `forbidden_variation_json`
- `created_at`
- `updated_at`

AI-extracted attributes are not automatically authoritative.

## Analysis

### analyses

- `id` primary key
- `workspace_id` nullable for anonymous
- `anonymous_session_id` nullable
- `product_id` nullable
- `candidate_asset_id`
- `status` (`queued`, `running`, `completed`, `failed`, `canceled`)
- `verdict` (`pass`, `review`, `fail`) nullable until completed
- `qa_engine_version`
- `risk_policy_version`
- `model_policy_version`
- `rule_set_version` nullable
- `cost_estimate_usd`
- `latency_ms`
- `started_at`
- `completed_at`
- `created_at`
- `updated_at`

Indexes:

- `workspace_id, created_at`
- `anonymous_session_id, created_at`
- `status, created_at`

Execution attempt note:

M0 Sprint 1 does not require an `analysis_execution_attempts` table. Preserve the domain distinction between Analysis, Execution Attempt, and Model Call. Add a dedicated execution-attempt table when retries, queues, or asynchronous execution require it.

### analysis_references

- `id` primary key
- `workspace_id` nullable
- `analysis_id`
- `asset_id`
- `created_at`

### analysis_observations

- `id` primary key
- `workspace_id` nullable
- `analysis_id`
- `check_type`
- `status` (`match`, `mismatch`, `uncertain`, `not_applicable`)
- `reference_observability` (`observable`, `partially_observable`, `not_observable`)
- `candidate_observability` (`observable`, `partially_observable`, `not_observable`)
- `coverage` (`sufficient`, `partial`, `insufficient`)
- `confidence` (`high`, `medium`, `low`)
- `evidence_json`
- `explanation`
- `created_at`

### analysis_issues

- `id` primary key
- `workspace_id` nullable
- `analysis_id`
- `observation_id` nullable
- `issue_kind` (`product`, `technical`)
- `issue_type`
- `severity`
- `confidence`
- `message`
- `evidence_json`
- `created_at`

### analysis_limitations

- `id` primary key
- `workspace_id` nullable
- `analysis_id`
- `observation_id` nullable
- `limitation_type`
- `confidence`
- `message`
- `evidence_json`
- `created_at`

### analysis_model_calls

- `id` primary key
- `workspace_id` nullable
- `analysis_id`
- `execution_attempt_id` nullable
- `provider`
- `model`
- `prompt_version`
- `model_policy_version`
- `purpose`
- `input_asset_ids_json`
- `input_usage_json`
- `output_usage_json`
- `latency_ms`
- `estimated_cost_usd`
- `status`
- `error_code`
- `created_at`

## Rules

### rule_sets

- `id` primary key
- `marketplace`
- `region`
- `asset_type`
- `version`
- `source`
- `source_updated_at`
- `effective_from`
- `status` (`draft`, `active`, `retired`)
- `created_at`

### rules

- `id` primary key
- `rule_set_id`
- `rule_id`
- `rule_version`
- `severity`
- `rule_type` (`deterministic`, `vision`, `hybrid`, `manual_only`)
- `implementation_key`
- `description`
- `created_at`

## Batch

### batches

- `id` primary key
- `workspace_id`
- `name`
- `status`
- `total_items`
- `pass_count`
- `review_count`
- `fail_count`
- `failed_count`
- `created_at`
- `updated_at`

### batch_items

- `id` primary key
- `workspace_id`
- `batch_id`
- `product_id` nullable
- `candidate_asset_id`
- `analysis_id` nullable
- `status`
- `attempt_count`
- `last_error`
- `created_at`
- `updated_at`

## Billing And Usage

### plans

- `key` primary key
- `name`
- `price_monthly_cents`
- `included_image_checks`
- `entitlements_json`
- `status`

### subscriptions

- `id` primary key
- `workspace_id`
- `plan_key`
- `provider`
- `provider_subscription_id`
- `status`
- `current_period_start`
- `current_period_end`
- `created_at`
- `updated_at`

### usage_ledger

- `id` primary key
- `workspace_id`
- `analysis_id` nullable
- `usage_type` (`image_check`, `model_call`, `storage`, `api_call`)
- `quantity`
- `billable_quantity`
- `provider_cost_usd`
- `created_at`

Usage ledger rows are immutable.

## API And Webhooks

### api_keys

- `id` primary key
- `workspace_id`
- `name`
- `key_prefix`
- `key_hash`
- `scopes_json`
- `status`
- `last_used_at`
- `created_at`
- `revoked_at`

Store only hashes, never raw API keys.

### webhook_endpoints

- `id` primary key
- `workspace_id`
- `url`
- `event_types_json`
- `secret_hash`
- `status`
- `created_at`
- `updated_at`

### webhook_deliveries

- `id` primary key
- `workspace_id`
- `endpoint_id`
- `event_type`
- `payload_json`
- `status`
- `attempt_count`
- `last_error`
- `created_at`
- `updated_at`

## Quality

### feedback

- `id` primary key
- `workspace_id` nullable
- `analysis_id`
- `issue_id` nullable
- `feedback_type` (`correct`, `missed_something`, `false_alarm`, `accept_issue`, `dismiss_issue`)
- `notes`
- `reviewed_for_eval`
- `created_at`

### eval_cases

- `id` primary key
- `category_key`
- `difficulty`
- `expected_verdict`
- `expected_issue_types_json`
- `expected_limitations_json`
- `expected_observability_json`
- `severity`
- `eval_reference_asset_ids_json`
- `eval_candidate_asset_id`
- `source_type` (`synthetic`, `controlled`, `natural_failure`, `promoted_feedback`)
- `permission_status`
- `ground_truth_notes`
- `created_at`
- `updated_at`

### eval_runs

- `id` primary key
- `qa_engine_version`
- `risk_policy_version`
- `provider`
- `model`
- `prompt_version`
- `model_policy_version`
- `started_at`
- `completed_at`
- `metrics_json`

### eval_results

- `id` primary key
- `eval_run_id`
- `eval_case_id`
- `actual_verdict`
- `actual_issue_types_json`
- `actual_limitations_json`
- `observability_accuracy`
- `false_pass`
- `false_fail`
- `hard_negative_false_alarm`
- `repeatability_group_id` nullable
- `latency_ms`
- `cost_estimate_usd`
- `created_at`

## Governance

### audit_events

- `id` primary key
- `workspace_id` nullable
- `actor_user_id` nullable
- `event_type`
- `entity_type`
- `entity_id`
- `metadata_json`
- `created_at`

### deletion_jobs

- `id` primary key
- `workspace_id` nullable
- `asset_id` nullable
- `scope`
- `status`
- `requested_by_user_id` nullable
- `started_at`
- `completed_at`
- `error`
- `created_at`
