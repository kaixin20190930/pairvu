import type {D1Database} from "@/lib/cloudflare/bindings";
import type {RequestAccessContext} from "@/lib/auth/request-access";
import {ValueMetricsError,type ValueWindow} from "./types";
import {MAX_COHORT} from "./validation";
import {calculateValueMetrics,type ValueRow} from "./calculate";
export async function requireValueOwner(db:D1Database,access:RequestAccessContext) {
  if(!access.authenticated||!access.userId||!access.workspaceId)throw new ValueMetricsError("authentication_required","Sign in to view metrics.",401);
  const found=await db.prepare("SELECT w.id FROM workspaces w JOIN workspace_memberships m ON m.workspace_id=w.id WHERE w.id=? AND w.status='active' AND m.user_id=? AND m.role='owner'").bind(access.workspaceId,access.userId).first();
  if(!found)throw new ValueMetricsError("workspace_not_found","Workspace not found.",404);
  return {workspaceId:access.workspaceId,userId:access.userId};
}
const bytes=(field:string)=>`COALESCE(length(CAST(${field} AS BLOB)),0)`;
const classificationValid=`c.classification IN ('business','test','unknown') AND c.revision>0 AND length(c.evidence_ref)=73 AND substr(c.evidence_ref,1,9)='evidence:' AND substr(c.evidence_ref,10) NOT GLOB '*[^a-f0-9]*' AND length(c.material_sha256)=64 AND c.material_sha256 NOT GLOB '*[^a-f0-9]*' AND length(c.verified_by) BETWEEN 1 AND 128 AND c.verified_by NOT GLOB '*[^a-zA-Z0-9_-]*' AND strftime('%Y-%m-%dT%H:%M:%fZ',c.verified_at) IS c.verified_at AND strftime('%Y-%m-%dT%H:%M:%fZ',c.created_at) IS c.created_at AND julianday(c.verified_at)<=julianday('now') AND julianday(c.created_at)<=julianday('now') AND NOT EXISTS(SELECT 1 FROM analysis_value_classifications vc WHERE vc.analysis_id=a.id AND vc.workspace_id IS NOT a.workspace_id)`;
const business=`c.classification='business' AND ${classificationValid}`;
const SQL=`WITH owner AS (
 SELECT w.id FROM workspaces w JOIN workspace_memberships m ON m.workspace_id=w.id WHERE w.id=? AND w.status='active' AND m.user_id=? AND m.role='owner'
),cohort AS (
 SELECT a.* FROM analyses a WHERE a.workspace_id=(SELECT id FROM owner) AND julianday(a.created_at)>=julianday(?) AND julianday(a.created_at)<julianday(?) ORDER BY a.created_at,a.id LIMIT ${MAX_COHORT+1}
),raw AS (
 SELECT a.id,a.status,a.verdict,a.completed_at AS completedAt,ROUND((julianday(a.created_at)-2440587.5)*86400000) AS createdMs,a.estimated_cost_usd AS cost,
 a.qa_engine_version AS qaEngineVersion,a.risk_policy_version AS riskPolicyVersion,a.model_policy_version AS modelPolicyVersion,a.reference_asset_id AS referenceAssetId,
 c.id AS classificationId,c.classification,c.revision AS classificationRevision,c.evidence_ref AS evidenceRef,c.verified_by AS verifiedBy,c.verified_at AS verifiedAt,c.material_sha256 AS materialHash,c.created_at AS classificationCreatedAt,
 (SELECT COUNT(*) FROM analysis_value_classifications vc WHERE vc.analysis_id=a.id AND vc.workspace_id IS NOT a.workspace_id) AS foreignClassifications,
 (SELECT COUNT(*) FROM analysis_value_classifications vc WHERE vc.analysis_id=a.id) AS classificationCount,
 (${business}) AS businessValid,
 CASE WHEN ${business} THEN ${bytes('s.snapshot_json')}+COALESCE((SELECT SUM(${bytes('machine_snapshot_json')}) FROM review_events WHERE analysis_id=a.id AND workspace_id=a.workspace_id),0) ELSE 0 END AS sourceBytes,
 CASE WHEN ${business} THEN max(${bytes('s.snapshot_json')}>32768,COALESCE((SELECT MAX(${bytes('machine_snapshot_json')})>262144 FROM review_events WHERE analysis_id=a.id AND workspace_id=a.workspace_id),0)) ELSE 0 END AS byteOverflow,
 CASE WHEN ${business} AND ${bytes('s.snapshot_json')}<=32768 THEN s.snapshot_json ELSE NULL END AS rawSnapshot,s.snapshot_sha256 AS snapshotHash,s.product_id AS productId,s.product_revision AS productRevision,s.profile_version_id AS profileVersionId,s.reference_version_id AS referenceVersionId,s.bound_at AS boundAt,s.source_batch_id AS sourceBatchId,
 CASE WHEN ${business} AND ${bytes('s.snapshot_json')}<=32768 AND EXISTS(SELECT 1 FROM product_profile_versions pv JOIN product_reference_versions rv ON rv.product_id=pv.product_id AND rv.workspace_id=pv.workspace_id JOIN products p ON p.id=pv.product_id AND p.workspace_id=pv.workspace_id
 WHERE pv.workspace_id=a.workspace_id AND pv.product_id=s.product_id AND pv.id=s.profile_version_id AND rv.id=s.reference_version_id AND rv.asset_id=a.reference_asset_id AND pv.schema_version=1 AND pv.source='user_confirmed'
 AND CASE WHEN json_valid(s.snapshot_json) THEN pv.version_number=json_extract(s.snapshot_json,'$.profileVersionNumber') AND rv.version_number=json_extract(s.snapshot_json,'$.referenceVersionNumber') AND rv.reference_role=json_extract(s.snapshot_json,'$.referenceRole') AND json(pv.profile_json)=json_extract(s.snapshot_json,'$.profile') ELSE 0 END) THEN 1 ELSE 0 END AS snapshotBindingsValid,
 (SELECT COUNT(DISTINCT bi.batch_id) FROM batch_items bi JOIN batches b ON b.id=bi.batch_id AND b.workspace_id=bi.workspace_id WHERE bi.analysis_id=a.id AND bi.workspace_id=a.workspace_id) AS batchCount,
 (SELECT MIN(bi.batch_id) FROM batch_items bi JOIN batches b ON b.id=bi.batch_id AND b.workspace_id=bi.workspace_id WHERE bi.analysis_id=a.id AND bi.workspace_id=a.workspace_id) AS batchId,
 (SELECT snapshot_sha256 FROM batch_product_snapshots bs WHERE bs.batch_id=s.source_batch_id AND bs.workspace_id=a.workspace_id) AS batchSnapshotHash,
 CASE WHEN EXISTS(SELECT 1 FROM batch_product_snapshots bs WHERE bs.batch_id=s.source_batch_id AND bs.workspace_id=a.workspace_id AND bs.product_id=s.product_id AND bs.product_revision=s.product_revision AND bs.profile_version_id=s.profile_version_id AND bs.reference_version_id=s.reference_version_id AND bs.bound_at=s.bound_at AND bs.snapshot_sha256=s.snapshot_sha256 AND bs.snapshot_json=s.snapshot_json) THEN 1 ELSE 0 END AS batchSnapshotValid,
 (SELECT COUNT(*) FROM batch_items WHERE analysis_id=a.id AND workspace_id IS NOT a.workspace_id) AS foreignBatches,
 (SELECT COUNT(*) FROM batch_items WHERE analysis_id=a.id) AS batchRawCount,
 CASE WHEN ${business} THEN (SELECT COUNT(*) FROM review_events WHERE analysis_id=a.id AND workspace_id=a.workspace_id) ELSE 0 END AS eventCount,
 (SELECT COUNT(*) FROM review_events WHERE analysis_id=a.id AND workspace_id IS NOT a.workspace_id) AS foreignReviews,
 h.revision AS headRevision,h.latest_event_id AS headEventId
 FROM cohort a LEFT JOIN analysis_value_classifications c ON c.analysis_id=a.id AND c.workspace_id=a.workspace_id AND c.revision=(SELECT MAX(vc.revision) FROM analysis_value_classifications vc WHERE vc.analysis_id=a.id AND vc.workspace_id=a.workspace_id)
 LEFT JOIN analysis_product_snapshots s ON s.analysis_id=a.id AND s.workspace_id=a.workspace_id LEFT JOIN review_heads h ON h.analysis_id=a.id AND h.workspace_id=a.workspace_id
),budget AS (SELECT COALESCE(SUM(sourceBytes),0) AS totalBytes,COALESCE(MAX(byteOverflow),0) AS byteOverflow,COALESCE(MAX(eventCount),0) AS eventCount,COALESCE(MAX(classificationCount),0) AS classificationCount,COALESCE(MAX(batchRawCount),0) AS batchRawCount FROM raw)
SELECT raw.id,raw.status,raw.verdict,raw.completedAt,raw.createdMs,raw.cost,raw.qaEngineVersion,raw.riskPolicyVersion,raw.modelPolicyVersion,raw.referenceAssetId,
 raw.classificationId,raw.classification,raw.classificationRevision,raw.evidenceRef,raw.verifiedBy,raw.verifiedAt,raw.materialHash,raw.classificationCreatedAt,raw.foreignClassifications,
 CASE WHEN raw.businessValid AND budget.totalBytes<=16777216 AND budget.byteOverflow=0 THEN raw.rawSnapshot ELSE NULL END AS snapshotJson,
 raw.snapshotHash,raw.productId,raw.productRevision,raw.profileVersionId,raw.referenceVersionId,raw.boundAt,raw.sourceBatchId,raw.snapshotBindingsValid,raw.batchCount,raw.batchId,raw.batchSnapshotHash,raw.batchSnapshotValid,raw.foreignBatches,raw.foreignReviews,raw.headRevision,raw.headEventId,
 CASE WHEN raw.businessValid AND budget.totalBytes<=16777216 AND budget.byteOverflow=0 AND budget.eventCount<=100 THEN (SELECT json_group_array(json_object('id',e.id,'revision',e.revision,'previousId',e.previous_decision_id,'action',e.action,'createdAt',e.created_at,'snapshot',e.machine_snapshot_json,'hash',e.machine_sha256)) FROM (SELECT * FROM review_events WHERE analysis_id=raw.id AND workspace_id=(SELECT id FROM owner) ORDER BY revision LIMIT 101) e) ELSE '[]' END AS events,
 budget.totalBytes,budget.byteOverflow,budget.eventCount,budget.classificationCount,budget.batchRawCount,
 (SELECT COUNT(*) FROM owner) AS ownerCount,strftime('%Y-%m-%dT%H:%M:%fZ','now') AS sourceAsOf,
 (SELECT COUNT(*) FROM analyses WHERE workspace_id=(SELECT id FROM owner) AND julianday(created_at) IS NULL) AS unwindowable
 FROM budget LEFT JOIN raw ON 1=1`;
export async function readValueMetrics(db:D1Database,access:RequestAccessContext,window:ValueWindow) {
  const owner=await requireValueOwner(db,access);
  const result=await db.prepare(SQL).bind(owner.workspaceId,owner.userId,window.start,window.end).all<ValueRow>();
  if(!result.success||!result.results.length)throw new Error("Metrics read failed");
  const first=result.results[0];if(first.ownerCount!==1)throw new ValueMetricsError("workspace_not_found","Workspace not found.",404);
  const rows=result.results.filter(row=>row.id!==null);
  if(rows.length>MAX_COHORT||Number(first.totalBytes)>16777216||first.byteOverflow===1||Number(first.eventCount)>100||Number(first.classificationCount)>100||Number(first.batchRawCount)>100)throw new ValueMetricsError("metrics_budget_exceeded","This window exceeds the metrics budget. Select a smaller window or request a controlled data review.",422);
  return calculateValueMetrics(rows,window,String(first.sourceAsOf),Number(first.unwindowable));
}
