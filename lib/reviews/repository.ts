import type {D1Database} from "@/lib/cloudflare/bindings";
import type {RequestAccessContext} from "@/lib/auth/request-access";
import {getAnalysisById} from "@/lib/analysis/repository";
import {ReviewError, type ReviewEvent, type ReviewInput, type ReviewState} from "./types";
import {normalizeReview, reviewHash} from "./validation";

type Row = Record<string, unknown>;
function identity(access: RequestAccessContext): {workspaceId:string; actorId:string} {
  if (!access.authenticated || !access.workspaceId || !access.userId) throw new ReviewError("authentication_required","Sign in to review this analysis.",401);
  return {workspaceId:access.workspaceId, actorId:access.userId};
}
async function requireAnalysis(db:D1Database, analysisId:string, access:RequestAccessContext) {
  const owner=identity(access);
  const analysis=await db.prepare(`SELECT a.id,a.status FROM analyses a JOIN workspaces w ON w.id=a.workspace_id JOIN workspace_memberships m ON m.workspace_id=w.id WHERE a.id=? AND a.workspace_id=? AND w.status='active' AND m.user_id=? AND m.role='owner'`).bind(analysisId,owner.workspaceId,owner.actorId).first<{id:string;status:string}>();
  if (!analysis) throw new ReviewError("analysis_not_found","Analysis not found.",404);
  if (analysis.status!=="completed") throw new ReviewError("analysis_not_completed","Only completed analyses can be reviewed.",409);
  return owner;
}
function event(row:Row):ReviewEvent {
  return {id:String(row.id),analysisId:String(row.analysis_id),workspaceId:String(row.workspace_id),actorId:String(row.actor_id),requestId:String(row.request_id),expectedRevision:Number(row.expected_revision),revision:Number(row.revision),previousDecisionId:row.previous_decision_id as string|null,action:row.action as ReviewEvent["action"],category:row.category as ReviewEvent["category"],reason:String(row.reason),note:row.note as string|null,createdAt:String(row.created_at),machineSnapshot:JSON.parse(String(row.machine_snapshot_json)),machineSha256:String(row.machine_sha256)};
}
async function state(db:D1Database, analysisId:string, workspaceId:string):Promise<ReviewState> {
  const rows=await db.prepare("SELECT * FROM review_events WHERE analysis_id=? AND workspace_id=? ORDER BY revision DESC LIMIT 100").bind(analysisId,workspaceId).all<Row>();
  if(!rows.success) throw new Error("Review read failed");
  const history=rows.results.map(event).reverse(),latest=history.at(-1)??null;
  return {revision:latest?.revision??0, latest, currentDecision:latest?.action==="revoke"?null:latest, history, historyLimit:100};
}
export async function readReviews(db:D1Database, analysisId:string, access:RequestAccessContext) {
  const owner=await requireAnalysis(db,analysisId,access); return state(db,analysisId,owner.workspaceId);
}
export async function submitReview(db:D1Database, analysisId:string, access:RequestAccessContext, value:unknown) {
  const input=normalizeReview(value),owner=await requireAnalysis(db,analysisId,access);
  const fingerprint=await reviewHash(JSON.stringify({analysisId,...owner,...input}));
  async function replay() {
    const row=await db.prepare("SELECT * FROM review_events WHERE analysis_id=? AND workspace_id=? AND request_id=?").bind(analysisId,owner.workspaceId,input.requestId).first<Row>();
    if(!row) return null;
    if(row.fingerprint!==fingerprint) throw new ReviewError("review_request_conflict","This request ID was used for different decision content.",409);
    return {event:event(row),state:await state(db,analysisId,owner.workspaceId),resumed:true};
  }
  const prior=await replay(); if(prior) return prior;
  const current=await state(db,analysisId,owner.workspaceId);
  if(current.revision!==input.expectedRevision) throw new ReviewError("review_revision_conflict","A newer decision exists. Keep your draft, load the latest decision and explicitly confirm again.",409);
  if(input.action==="revoke"&&!current.currentDecision) throw new ReviewError("review_no_current_decision","There is no current decision to revoke.",409);
  const analysis=await getAnalysisById(db,analysisId);
  if(!analysis || analysis.workspaceId!==owner.workspaceId || analysis.status!=="completed") throw new ReviewError("analysis_not_found","Analysis not found.",404);
  const snapshot=JSON.stringify({analysisId,verdict:analysis.verdict,qaEngineVersion:analysis.qaEngineVersion,riskPolicyVersion:analysis.riskPolicyVersion,modelPolicyVersion:analysis.modelPolicyVersion,completedAt:analysis.completedAt,observations:analysis.observations,productIssues:analysis.productIssues,limitations:analysis.limitations,modelCalls:analysis.modelCalls});
  const machineHash=await reviewHash(snapshot),id=crypto.randomUUID(),token=crypto.randomUUID(),finalToken=crypto.randomUUID();
  const sql=reviewStatements({analysisId,...owner,input,fingerprint,snapshot,machineHash,id,token,finalToken});
  try {
    const results=await db.batch<{success:boolean}>(sql.map(s=>db.prepare(s.sql).bind(...s.params)));
    if(results.some(r=>r.success===false)) throw new Error("Review batch failed");
  } catch {
    // A lost response or a concurrent identical request may already have committed.
    await requireAnalysis(db,analysisId,access);
    const recovered=await replay(); if(recovered) return recovered;
    const latest=await state(db,analysisId,owner.workspaceId);
    if(latest.revision!==input.expectedRevision) throw new ReviewError("review_revision_conflict","A newer decision exists. Load it and confirm your preserved draft again.",409);
    throw new ReviewError("review_storage_unavailable","Decision status is uncertain. Retry this exact request; do not create a new decision.",503);
  }
  const committed=await replay();
  if(!committed) throw new ReviewError("review_storage_unavailable","Decision status is uncertain. Retry the same request.",503);
  return {...committed,resumed:false};
}
export function reviewStatements(p:{analysisId:string;workspaceId:string;actorId:string;input:ReviewInput;fingerprint:string;snapshot:string;machineHash:string;id:string;token:string;finalToken:string}) {
  const {analysisId,workspaceId,actorId,input,fingerprint,snapshot,machineHash,id,token,finalToken}=p, revision=input.expectedRevision+1;
  return [
    {sql:`INSERT INTO review_write_guards(token,analysis_id,workspace_id,ok) SELECT ?,?,?,CASE WHEN EXISTS(SELECT 1 FROM analyses a JOIN workspaces w ON w.id=a.workspace_id JOIN workspace_memberships m ON m.workspace_id=w.id WHERE a.id=? AND a.workspace_id=? AND a.status='completed' AND w.status='active' AND m.user_id=? AND m.role='owner') AND COALESCE((SELECT revision FROM review_heads WHERE analysis_id=? AND workspace_id=?),0)=? THEN 1 ELSE 0 END`,params:[token,analysisId,workspaceId,analysisId,workspaceId,actorId,analysisId,workspaceId,input.expectedRevision]},
    {sql:`INSERT INTO review_events(id,analysis_id,workspace_id,actor_id,request_id,fingerprint,expected_revision,revision,previous_decision_id,action,category,reason,note,machine_snapshot_json,machine_sha256) VALUES(?,?,?,?,?,?,?,?,(SELECT latest_event_id FROM review_heads WHERE analysis_id=? AND workspace_id=?),?,?,?,?,?,?)`,params:[id,analysisId,workspaceId,actorId,input.requestId,fingerprint,input.expectedRevision,revision,analysisId,workspaceId,input.action,input.category,input.reason,input.note,snapshot,machineHash]},
    {sql:`INSERT INTO review_heads(analysis_id,workspace_id,revision,latest_event_id) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM review_heads WHERE analysis_id=?)`,params:[analysisId,workspaceId,revision,id,analysisId]},
    {sql:`UPDATE review_heads SET revision=?,latest_event_id=? WHERE analysis_id=? AND workspace_id=? AND revision=?`,params:[revision,id,analysisId,workspaceId,input.expectedRevision]},
    {sql:`INSERT INTO review_write_guards(token,analysis_id,workspace_id,ok) SELECT ?,?,?,CASE WHEN EXISTS(SELECT 1 FROM review_heads WHERE analysis_id=? AND workspace_id=? AND revision=? AND latest_event_id=?) THEN 1 ELSE 0 END`,params:[finalToken,analysisId,workspaceId,analysisId,workspaceId,revision,id]},
    {sql:`DELETE FROM review_write_guards WHERE token IN (?,?)`,params:[token,finalToken]},
  ];
}
