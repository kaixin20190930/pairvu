import type {D1Database} from "@/lib/cloudflare/bindings";
import type {RequestAccessContext} from "@/lib/auth/request-access";
import {evaluateRelease,releasePolicy,sha256,canonical,type StoredReleaseRow} from "./policy";
import {ReleaseError,type ReleaseFilters,type ReleasePage,type ReleaseRow} from "./types";

export const RELEASE_SCAN_LIMIT=100;
const safeId=/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;
export function parseReleaseFilters(params:URLSearchParams,exporting=false):ReleaseFilters {
  const allowed=["sku","productId","batchId","state","limit","cursor",...(exporting?["scope"]:[])];
  for(const key of params.keys())if(!allowed.includes(key)||params.getAll(key).length!==1)throw new ReleaseError("invalid_filter","Unsupported or repeated search parameter.");
  if(exporting&&params.get("scope")!=="page")throw new ReleaseError("export_scope_required","Export requires scope=page to acknowledge its bounded search window.");
  const sku=params.get("sku")??"",productId=params.get("productId")??"",batchId=params.get("batchId")??"",state=params.get("state")??"all",limitText=params.get("limit")??"20",cursor=params.get("cursor")??"";
  if(sku.length>80||/[\u0000-\u001f\u007f-\u009f]/u.test(sku)||sku&&sku.trim()!==sku||[productId,batchId].some(id=>id!==""&&!safeId.test(id))||!["all","pending_review","blocked","decided"].includes(state)||!/^([1-9]|[1-4][0-9]|50)$/.test(limitText)||cursor.length>2048)throw new ReleaseError("invalid_filter","Use exact SKU, bounded identifiers, a supported state and limit 1–50.");
  return {sku,productId,batchId,state:state as ReleaseFilters["state"],limit:Number(limitText),cursor};
}
export function releasesEnabled(env:{RELEASE_WORKBENCH_ENABLED?:string}){return env.RELEASE_WORKBENCH_ENABLED==="true";}
export async function requireReleaseOwner(db:D1Database,access:RequestAccessContext) {
  if(!access.authenticated||!access.workspaceId||!access.userId)throw new ReleaseError("authentication_required","Sign in to use the release workbench.",401);
  const owner=await db.prepare("SELECT w.id FROM workspaces w JOIN workspace_memberships m ON m.workspace_id=w.id WHERE w.id=? AND w.status='active' AND m.user_id=? AND m.role='owner'").bind(access.workspaceId,access.userId).first();
  if(!owner)throw new ReleaseError("workspace_not_found","Workspace not found.",404);
  return {workspaceId:access.workspaceId,userId:access.userId};
}
const observationFields={id:"id",checkType:"check_type",status:"status",differenceKind:"difference_kind",referenceObservability:"reference_observability",candidateObservability:"candidate_observability",coverage:"coverage",confidence:"confidence",evidenceJson:"evidence_json",explanation:"explanation"};
const issueFields={id:"id",observationId:"observation_id",kind:"issue_kind",type:"issue_type",sourceCheckType:"source_check_type",sourceDifferenceKind:"source_difference_kind",sourceReferenceObservability:"source_reference_observability",sourceCandidateObservability:"source_candidate_observability",sourceCoverage:"source_coverage",severity:"severity",confidence:"confidence",message:"message",evidenceJson:"evidence_json"};
const limitationFields={id:"id",observationId:"observation_id",type:"limitation_type",sourceCheckType:"source_check_type",confidence:"confidence",message:"message",evidenceJson:"evidence_json"};
const modelFields={id:"id",provider:"provider",purpose:"purpose",model:"model",promptVersion:"prompt_version",modelPolicyVersion:"model_policy_version",status:"status",errorCode:"error_code",errorMessage:"error_message",inputAssetIdsJson:"input_asset_ids_json",inputUsageJson:"input_usage_json",outputUsageJson:"output_usage_json",latencyMs:"latency_ms",estimatedCostUsd:"estimated_cost_usd"};
const children=["analysis_observations","analysis_issues","analysis_limitations","analysis_model_calls"];
// Exactly one SELECT binds each row's machine, human revision and frozen sources.
function aggregate(table:string,fields:Record<string,string>){return `(SELECT json_group_array(json_object(${Object.entries(fields).map(([key,col])=>`'${key}',c.${col}`).join(",")})) FROM (SELECT * FROM ${table} WHERE analysis_id=a.id AND workspace_id=a.workspace_id ORDER BY created_at ASC,rowid ASC LIMIT 24) c)`;}
// SQLite length(TEXT) counts characters (and stops at NUL); BLOB length counts
// the actual UTF-8 bytes. Use the same expression in every budget and projection.
const utf8Bytes=(column:string)=>`length(CAST(${column} AS BLOB))`;
const evidenceBytes=["analysis_observations","analysis_issues","analysis_limitations"].map(table=>`COALESCE((SELECT SUM(${utf8Bytes("evidence_json")}) FROM ${table} WHERE analysis_id=a.id),0)`).join("+");
const modelBytes=`COALESCE((SELECT SUM(${["input_usage_json","output_usage_json","input_asset_ids_json"].map(column=>`COALESCE(${utf8Bytes(column)},0)`).join("+")}) FROM analysis_model_calls WHERE analysis_id=a.id),0)`;
const tooLarge=children.map(t=>`(SELECT COUNT(*)>24 FROM ${t} WHERE analysis_id=a.id)`).join(" OR ")+` OR ${evidenceBytes}+${modelBytes}>65536`;
const selectedChecksBytes=utf8Bytes("a.selected_checks_json"),productSnapshotBytes=utf8Bytes("s.snapshot_json"),reviewSnapshotBytes=utf8Bytes("e.machine_snapshot_json");
const bounded=(table:string,fields:Record<string,string>)=>`CASE WHEN ${tooLarge} THEN '[]' ELSE ${aggregate(table,fields)} END`;
const foreignChildren=children.map(t=>`(SELECT COUNT(*) FROM ${t} WHERE analysis_id=a.id AND workspace_id IS NOT a.workspace_id)`).join("+");
// Deletion intent is durable before R2 removal. Metadata may still look available
// while deletion is started or failed, so any recorded permanent deletion excludes the asset.
const available=(alias:string,kind:string)=>`CASE WHEN ${alias}.id IS NOT NULL AND ${alias}.kind='${kind}' AND ${alias}.asset_type='image' AND ${alias}.status IN ('uploaded','normalized','analyzed') AND ${alias}.deleted_at IS NULL AND NOT EXISTS(SELECT 1 FROM asset_deletion_attempts d WHERE d.asset_id=${alias}.id) AND ${alias}.retention_expires_at IS NOT NULL AND julianday(${alias}.retention_expires_at)>julianday('now') THEN 1 ELSE 0 END`;
const projection=`SELECT a.id,a.created_at AS createdAt,a.status,a.verdict,a.reference_asset_id AS referenceAssetId,a.candidate_asset_id AS candidateAssetId,CASE WHEN ${selectedChecksBytes}<=1024 THEN a.selected_checks_json ELSE NULL END AS selectedChecksJson,a.qa_engine_version AS qaEngineVersion,a.risk_policy_version AS riskPolicyVersion,a.model_policy_version AS modelPolicyVersion,a.completed_at AS completedAt,
 ${bounded("analysis_observations",observationFields)} AS observations,${bounded("analysis_issues",issueFields)} AS issues,${bounded("analysis_limitations",limitationFields)} AS limitations,${bounded("analysis_model_calls",modelFields)} AS modelCalls,(${foreignChildren}) AS foreignChildren,CASE WHEN ${tooLarge} OR ${selectedChecksBytes}>1024 OR ${productSnapshotBytes}>32768 OR ${reviewSnapshotBytes}>262144 THEN 1 ELSE 0 END AS overflow,
 ${available("ra","reference")} AS referenceAvailable,${available("ca","candidate")} AS candidateAvailable,
 CASE WHEN ${productSnapshotBytes}<=32768 THEN s.snapshot_json ELSE NULL END AS snapshotJson,s.snapshot_sha256 AS snapshotHash,s.product_id AS productId,s.product_revision AS productRevision,s.profile_version_id AS profileVersionId,s.reference_version_id AS referenceVersionId,s.bound_at AS boundAt,s.source_batch_id AS sourceBatchId,
 CASE WHEN s.analysis_id IS NULL THEN 1 WHEN EXISTS(SELECT 1 FROM product_profile_versions pv JOIN product_reference_versions rv ON rv.product_id=pv.product_id AND rv.workspace_id=pv.workspace_id JOIN products p ON p.id=pv.product_id AND p.workspace_id=pv.workspace_id WHERE pv.workspace_id=a.workspace_id AND pv.product_id=s.product_id AND pv.id=s.profile_version_id AND rv.id=s.reference_version_id AND rv.asset_id=a.reference_asset_id AND pv.schema_version=1 AND pv.source='user_confirmed' AND CASE WHEN json_valid(s.snapshot_json) THEN pv.version_number=json_extract(s.snapshot_json,'$.profileVersionNumber') AND rv.version_number=json_extract(s.snapshot_json,'$.referenceVersionNumber') AND rv.reference_role=json_extract(s.snapshot_json,'$.referenceRole') AND json(pv.profile_json)=json_extract(s.snapshot_json,'$.profile') ELSE 0 END) THEN 1 ELSE 0 END AS snapshotBindingsValid,
 (SELECT MIN(bi.batch_id) FROM batch_items bi JOIN batches b ON b.id=bi.batch_id AND b.workspace_id=bi.workspace_id WHERE bi.analysis_id=a.id AND bi.workspace_id=a.workspace_id) AS batchId,
 (SELECT COUNT(*) FROM batch_items bi JOIN batches b ON b.id=bi.batch_id AND b.workspace_id=bi.workspace_id WHERE bi.analysis_id=a.id AND bi.workspace_id=a.workspace_id) AS batchCount,
 CASE WHEN EXISTS(SELECT 1 FROM batch_items bi JOIN batches b ON b.id=bi.batch_id AND b.workspace_id=bi.workspace_id WHERE bi.analysis_id=a.id AND bi.workspace_id=a.workspace_id AND b.product_id IS NOT NULL) THEN 1 ELSE 0 END AS legacyBound,
 ((SELECT COUNT(*) FROM analysis_product_snapshots WHERE analysis_id=a.id AND workspace_id IS NOT a.workspace_id)+(SELECT COUNT(*) FROM review_heads WHERE analysis_id=a.id AND workspace_id IS NOT a.workspace_id)+(SELECT COUNT(*) FROM review_events WHERE analysis_id=a.id AND workspace_id IS NOT a.workspace_id)+(SELECT COUNT(*) FROM batch_items WHERE analysis_id=a.id AND workspace_id IS NOT a.workspace_id)) AS foreignBindings,
 h.revision AS reviewRevision,e.id AS reviewEventId,e.revision AS eventRevision,e.action,e.category AS reviewCategory,substr(e.reason,1,1000) AS reason,e.created_at AS reviewCreatedAt,CASE WHEN ${reviewSnapshotBytes}<=262144 THEN e.machine_snapshot_json ELSE NULL END AS reviewSnapshot,e.machine_sha256 AS reviewMachineHash,
 (SELECT COUNT(*) FROM review_events WHERE analysis_id=a.id AND workspace_id=a.workspace_id) AS reviewEventCount
 FROM analyses a JOIN workspaces w ON w.id=a.workspace_id JOIN workspace_memberships m ON m.workspace_id=w.id
 LEFT JOIN assets ra ON ra.id=a.reference_asset_id AND ra.workspace_id=a.workspace_id
 LEFT JOIN assets ca ON ca.id=a.candidate_asset_id AND ca.workspace_id=a.workspace_id
 LEFT JOIN analysis_product_snapshots s ON s.analysis_id=a.id AND s.workspace_id=a.workspace_id
 LEFT JOIN review_heads h ON h.analysis_id=a.id AND h.workspace_id=a.workspace_id
 LEFT JOIN review_events e ON e.id=h.latest_event_id AND e.analysis_id=a.id AND e.workspace_id=a.workspace_id`;
function matches(row:ReleaseRow,state:ReleaseFilters["state"]){return state==="all"||(state==="pending_review"&&row.eligibility==="needs_review")||(state==="blocked"&&row.eligibility==="blocked")||(state==="decided"&&["approve","reject"].includes(row.human.action??""));}
export async function listReleases(db:D1Database,access:RequestAccessContext,filters:ReleaseFilters):Promise<ReleasePage> {
  const owner=await requireReleaseOwner(db,access),evaluatedAt=new Date().toISOString();
  const filterHash=await sha256(canonical({workspaceId:owner.workspaceId,sku:filters.sku,productId:filters.productId,batchId:filters.batchId,state:filters.state}));
  let cursor:{createdAt:string;id:string}|null=null;
  if(filters.cursor) {
    try {if(!/^[A-Za-z0-9_-]+$/.test(filters.cursor))throw new Error();const c=JSON.parse(atob(filters.cursor.replaceAll("-","+").replaceAll("_","/")));if(c.version!==1||c.filterHash!==filterHash||Object.keys(c).length!==4||typeof c.createdAt!=="string"||c.createdAt.length>64||!Number.isFinite(Date.parse(c.createdAt))||typeof c.id!=="string"||!safeId.test(c.id))throw new Error();cursor=c;}
    catch {throw new ReleaseError("invalid_cursor","Cursor is invalid or belongs to another search.");}
  }
  const clauses=["a.workspace_id=?","w.status='active'","m.user_id=?","m.role='owner'"],values:unknown[]=[owner.workspaceId,owner.userId];
  if(filters.sku){clauses.push("CASE WHEN json_valid(s.snapshot_json) THEN json_extract(s.snapshot_json,'$.profile.skuLabel') ELSE NULL END=?");values.push(filters.sku);}
  if(filters.productId){clauses.push("s.product_id=?");values.push(filters.productId);}
  if(filters.batchId){clauses.push("EXISTS(SELECT 1 FROM batch_items bi JOIN batches b ON b.id=bi.batch_id AND b.workspace_id=bi.workspace_id WHERE bi.analysis_id=a.id AND bi.workspace_id=a.workspace_id AND bi.batch_id=?)");values.push(filters.batchId);}
  if(cursor){clauses.push("(a.created_at<? OR (a.created_at=? AND a.id<?))");values.push(cursor.createdAt,cursor.createdAt,cursor.id);}
  const result=await db.prepare(`${projection} WHERE ${clauses.join(" AND ")} ORDER BY a.created_at DESC,a.id DESC LIMIT ?`).bind(...values,RELEASE_SCAN_LIMIT+1).all<StoredReleaseRow>();
  if(!result.success)throw new Error("Release snapshot read failed");
  const rows:ReleaseRow[]=[];let consumed=0;
  for(const source of result.results.slice(0,RELEASE_SCAN_LIMIT)){const row=await evaluateRelease(source,evaluatedAt);consumed++;if(matches(row,filters.state))rows.push(row);if(rows.length===filters.limit)break;}
  const hasMore=result.results.length>consumed,last=result.results[consumed-1];
  const nextCursor=hasMore&&last?btoa(JSON.stringify({version:1,filterHash,createdAt:last.createdAt,id:last.id})).replaceAll("+","-").replaceAll("/","_").replace(/=+$/u,""):null;
  return {rows,policy:await releasePolicy(),evaluatedAt,pagination:{limit:filters.limit,scanLimit:RELEASE_SCAN_LIMIT,scanned:consumed,scanWindowExhausted:consumed===RELEASE_SCAN_LIMIT&&hasMore,hasMore,nextCursor,order:"created_at DESC, id DESC"}};
}
