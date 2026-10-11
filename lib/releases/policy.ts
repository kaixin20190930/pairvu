import {mapStoredObservation,mapStoredIssue,mapStoredLimitation,mapStoredModelCall} from "@/lib/analysis/repository";
import {normalizeBoundEvidence,normalizeRegionPair} from "@/lib/qa/evidence-regions";
import {identityEvidenceProblem} from "@/lib/qa/identity-evidence";
import {M0RiskPolicy} from "@/lib/qa/m0-policy";
import {normalizeProductProfile} from "@/lib/products/profile-validation";
import type {M0CheckFamily} from "@/lib/qa/types";
import type {ProductSnapshot} from "@/lib/products/types";
import type {ReleaseRow} from "./types";

// Changing any accepted version or priority requires a new built-in rule version.
const MANIFEST_JSON='{"version":"release-policy-001","engine":"m0-qa-engine-008","risk":"m0-risk-policy-003","modelPolicy":"m0-model-policy-002","provider":"openai","model":"gpt-4.1-mini","prompt":"m0-real-mvp-009+regions-003","identityGuard":"identity-evidence-004","regions":1,"priority":["integrity_or_incomplete","reject","high_or_critical","missing_current_approve","eligible"],"completeness":"unique selected checks; fully observable match/mismatch; supported identity and asset-bound region schemas; matching risk derivation; supported successful model calls; no limitations; available images; frozen product integrity; source-matching review"}';
const manifest=JSON.parse(MANIFEST_JSON) as Record<string,string>;
export async function sha256(text:string){const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));return Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,"0")).join("");}
export function canonical(value:unknown):string {
  if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
  if(value&&typeof value==="object")return `{${Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value)??"null";
}
export async function releasePolicy(){return {version:manifest.version,hash:await sha256(canonical(JSON.parse(MANIFEST_JSON))),description:"Complete supported machine evidence, available images and a current source-matching human approval are required. High/critical differences and limitations block eligibility. Eligibility does not publish externally."};}
export type StoredReleaseRow=Record<string,unknown>;
function parsed(value:unknown):unknown {try{return JSON.parse(String(value));}catch{return null;}}
function records(value:unknown):Record<string,unknown>[] {const p=parsed(value);return Array.isArray(p)?p.filter(v=>!!v&&typeof v==="object"&&!Array.isArray(v)):[];}
function text(value:unknown):value is string{return typeof value==="string"&&value.trim().length>0;}
function date(value:unknown){return text(value)&&Number.isFinite(Date.parse(value));}
const checks=["logo","visible_text","quantity","dominant_color","major_components","major_shape_packaging"];
export async function evaluateRelease(row:StoredReleaseRow,evaluatedAt:string):Promise<ReleaseRow> {
  const policy=await releasePolicy(),reasons:ReleaseRow["reasons"]=[];
  const add=(code:string,message:string)=>{if(!reasons.some(r=>r.code===code))reasons.push({code,message});};
  const sourceComplete=Number(row.overflow)===0&&Number(row.foreignChildren)===0;
  const raw={sourceComplete,analysisId:row.id,status:row.status,verdict:row.verdict,qaEngineVersion:row.qaEngineVersion,riskPolicyVersion:row.riskPolicyVersion,modelPolicyVersion:row.modelPolicyVersion,completedAt:row.completedAt,selectedChecks:parsed(row.selectedChecksJson),referenceAssetId:row.referenceAssetId,candidateAssetId:row.candidateAssetId,observations:records(row.observations),productIssues:records(row.issues),limitations:records(row.limitations),modelCalls:records(row.modelCalls)};
  const assets={referenceAssetId:String(row.referenceAssetId),candidateAssetId:String(row.candidateAssetId)};
  const observations=raw.observations.map(mapStoredObservation),issues=raw.productIssues.map(mapStoredIssue),limitations=raw.limitations.map(mapStoredLimitation),calls=raw.modelCalls.map(mapStoredModelCall);
  const currentSnapshot={analysisId:String(row.id),verdict:row.verdict,qaEngineVersion:row.qaEngineVersion,riskPolicyVersion:row.riskPolicyVersion,modelPolicyVersion:row.modelPolicyVersion,completedAt:row.completedAt,observations:observations.map(o=>({...o,evidence:normalizeBoundEvidence(o.evidence,assets,{reference:o.observability.reference==="not_observable"?false:o.evidence.referenceVisible,candidate:o.observability.candidate==="not_observable"?false:o.evidence.candidateVisible})})),productIssues:issues.map(i=>({...i,evidence:normalizeBoundEvidence(i.evidence,assets,{reference:i.sourceObservability.reference==="not_observable"?false:i.evidence.referenceVisible,candidate:i.sourceObservability.candidate==="not_observable"?false:i.evidence.candidateVisible})})),limitations:limitations.map(l=>({...l,evidence:normalizeBoundEvidence(l.evidence,assets,{reference:l.evidence.referenceVisible,candidate:l.evidence.candidateVisible})})),modelCalls:calls};
  if(row.status!=="completed")add("analysis_not_completed","Analysis is not completed; queued, running and failed results cannot release.");
  if(!date(row.completedAt)||!["pass","review","fail"].includes(String(row.verdict)))add("machine_summary_invalid","Machine verdict or completion timestamp is missing or invalid.");
  if(row.qaEngineVersion!==manifest.engine||row.riskPolicyVersion!==manifest.risk||row.modelPolicyVersion!==manifest.modelPolicy)add("machine_version_unsupported","Original detection versions are missing or unsupported by this release rule.");
  if(Number(row.foreignChildren)>0)add("source_ownership_invalid","Analysis evidence has an inconsistent ownership binding.");
  if(Number(row.overflow)>0)add("machine_source_over_limit","Machine source exceeds the supported bounded evidence size.");
  const selected=Array.isArray(raw.selectedChecks)?raw.selectedChecks:[];
  if(!selected.length||selected.length>6||new Set(selected).size!==selected.length||selected.some(c=>typeof c!=="string"||!checks.includes(c))||observations.length!==selected.length||selected.some(c=>observations.filter(o=>o.checkType===c).length!==1))add("selected_checks_incomplete","Every unique selected check needs exactly one supported observation.");
  for(const o of observations) {
    if(!["match","mismatch"].includes(o.status)||o.observability.reference!=="observable"||o.observability.candidate!=="observable"||o.observability.coverage!=="sufficient")add("observation_insufficient","Uncertain, not-applicable or insufficiently observable evidence cannot support eligibility.");
    if(!["high","medium","low"].includes(o.confidence)||!text(o.explanation)||!text(o.evidence.referenceObservation)||!text(o.evidence.candidateObservation)||!text(o.evidence.comparisonSummary)||!Array.isArray(o.evidence.visibleEvidence)||!o.evidence.visibleEvidence.length||o.evidence.visibleEvidence.some(v=>!text(v))||(o.status==="match"&&o.differenceKind!=="none")||!o.differenceKind)add("observation_invalid","Observation structure, explanation or comparison evidence is incomplete.");
    if(o.evidence.referenceVisible===false||o.evidence.candidateVisible===false)add("observation_insufficient","Evidence reports an unavailable view of the requested attribute.");
    if(["logo","visible_text"].includes(o.checkType)) {
      let valid=false;try{valid=o.evidence.identityEvidence?.validationVersion===manifest.identityGuard&&identityEvidenceProblem(o)===null;}catch{/* Malformed historical evidence is blocked. */}
      if(!valid)add("identity_evidence_invalid","Logo/text identity evidence or its application guard version is unsupported.");
    }
    const pair=normalizeRegionPair(o.evidence.regions,assets);
    if(!o.evidence.regions||pair.reference.reason==="invalid_region"||pair.candidate.reason==="invalid_region")add("region_schema_invalid","Evidence regions must use the supported schema and original input asset identities.");
  }
  if(!calls.length||calls.some(c=>c.status!=="completed"||c.provider!==manifest.provider||c.model!==manifest.model||c.promptVersion!==manifest.prompt||c.modelPolicyVersion!==manifest.modelPolicy||c.purpose!=="analysis"||c.inputAssetIds.length!==2||!c.inputAssetIds.includes(assets.referenceAssetId)||!c.inputAssetIds.includes(assets.candidateAssetId)||c.errorCode||c.errorMessage))add("model_source_unsupported","Successful model provenance bound to both original images is missing or unsupported.");
  if(limitations.length)add("machine_limitations_present","Machine limitations remain unresolved and block this conservative release rule.");
  // Independently verify persisted product issue severity against the original risk policy.
  try {
    const derived=new M0RiskPolicy().decide({analysisId:String(row.id),selectedChecks:selected as M0CheckFamily[],observations,limitations:[]});
    const tuple=(i:{type:string;sourceCheckType:string;severity:string;confidence:string;sourceDifferenceKind?:string})=>[i.type,i.sourceCheckType,i.sourceDifferenceKind,i.severity,i.confidence];
    if(derived.limitations.length>0||derived.verdict!==row.verdict||canonical(derived.productIssues.map(tuple))!==canonical(issues.map(tuple))||issues.some(i=>i.kind!=="product"||!text(i.message)||!observations.some(o=>(i.observationId===null||o.id===i.observationId)&&o.checkType===i.sourceCheckType&&canonical(o.observability)===canonical(i.sourceObservability)&&canonical(o.evidence)===canonical(i.evidence))))add("machine_derivation_invalid","Stored verdict or product differences do not match the supported risk derivation.");
  } catch {add("machine_derivation_invalid","Stored machine evidence cannot be validated safely.");}
  if(issues.some(i=>["high","critical"].includes(i.severity)))add("high_risk_difference","High or critical machine differences remain blocked even after human approval.");
  const referenceAvailable=row.referenceAvailable===1,candidateAvailable=row.candidateAvailable===1;
  if(!referenceAvailable||!candidateAvailable)add("assets_unavailable","Original reference or candidate image is deleted, failed, expired or unavailable.");
  let productSnapshot:ProductSnapshot|null=null;
  if(row.snapshotJson!==null) {
    try {
      const p=parsed(row.snapshotJson) as ProductSnapshot;
      if(!p||p.schemaVersion!==1||p.productId!==row.productId||p.profileVersionId!==row.profileVersionId||p.referenceVersionId!==row.referenceVersionId||p.revision!==row.productRevision||p.boundAt!==row.boundAt||p.referenceAssetId!==assets.referenceAssetId||![p.revision,p.profileVersionNumber,p.referenceVersionNumber].every(n=>Number.isSafeInteger(n)&&n>0)||!["front","back","left_side","right_side","detail","other"].includes(p.referenceRole)||canonical(normalizeProductProfile(p.profile))!==canonical(p.profile)||await sha256(String(row.snapshotJson))!==row.snapshotHash)throw new Error("Invalid frozen snapshot");
      productSnapshot=p;
      if(row.snapshotBindingsValid!==1)add("product_snapshot_binding_invalid","Frozen profile/reference versions are missing or do not belong to this workspace and product.");
    } catch {add("product_snapshot_invalid","Frozen product standard integrity or version binding is invalid.");}
  } else if(row.legacyBound===1)add("product_snapshot_missing","This bound product/batch has no immutable product standard snapshot.");
  if(Number(row.batchCount)>1||Number(row.foreignBindings)>0||(row.sourceBatchId&&row.sourceBatchId!==row.batchId))add("batch_binding_invalid","Batch source is inconsistent or ambiguous.");
  const revision=Number(row.reviewRevision??0),action=row.action as string|null;
  if(!Number.isSafeInteger(revision)||revision<0||(revision>0&&(Number(row.eventRevision)!==revision||!text(row.reviewEventId)||!["approve","reject","revoke"].includes(String(action))||!text(row.reason)||!date(row.reviewCreatedAt)))||(revision===0&&row.reviewEventId)||Number(row.reviewEventCount)!==revision)add("review_source_invalid","Current review head and audit event are inconsistent.");
  if(revision>0) {
    const approved=parsed(row.reviewSnapshot);
    if(!approved||await sha256(String(row.reviewSnapshot))!==row.reviewMachineHash)add("review_snapshot_invalid","Current human decision has invalid original machine snapshot integrity.");
    else if(canonical(approved)!==canonical(currentSnapshot))add("review_source_changed","Machine source changed after this decision; review the current source again.");
  }
  if(action==="reject")add("human_rejected","Current human decision rejects this analysis.");
  const blocked=reasons.length>0;
  if(action!=="approve")add("human_approval_required",action==="revoke"?"Approval was revoked; a new explicit decision is required.":"No current human approval exists; machine PASS alone cannot release.");
  if(!blocked&&action==="approve")add("complete_source_approved","Complete supported evidence and a current source-matching human approval satisfy this rule.");
  return {analysisId:String(row.id),createdAt:String(row.createdAt),batchId:row.batchId as string|null,productSnapshot,productSnapshotJson:row.snapshotJson as string|null,productSnapshotHash:row.snapshotHash as string|null,machine:{status:String(row.status),verdict:row.verdict as string|null,qaEngineVersion:row.qaEngineVersion as string|null,riskPolicyVersion:row.riskPolicyVersion as string|null,modelPolicyVersion:row.modelPolicyVersion as string|null,completedAt:row.completedAt as string|null,issueCount:issues.length,limitations:limitations.map(l=>({type:l.type,message:l.message})),sourceHash:sourceComplete?await sha256(canonical(raw)):null,sourceComplete,sourceSnapshotJson:JSON.stringify(raw)},assets:{referenceAvailable,candidateAvailable},human:{action:action??null,category:row.reviewCategory as string|null,reason:row.reason as string|null,revision,createdAt:row.reviewCreatedAt as string|null,machineHash:row.reviewMachineHash as string|null},eligibility:blocked?"blocked":action==="approve"?"eligible":"needs_review",reasons,evaluatedAt,policyVersion:policy.version,policyHash:policy.hash};
}
