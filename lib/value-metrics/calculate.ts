import {normalizeProductProfile,profileHash} from "@/lib/products/profile-validation";
import type {ProductSnapshot} from "@/lib/products/types";
import {strictUtc,safeId,VALUE_METRICS_VERSION} from "./validation";
import {ValueMetricsError,type ValueWindow,type ValueReport} from "./types";
export type ValueRow=Record<string,unknown>;
const canonical=(v:unknown):string=>JSON.stringify(sort(v));
function sort(v:unknown):unknown {if(Array.isArray(v))return v.map(sort);if(v&&typeof v==="object")return Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,sort(v)]));return v;}
const ratio=(numerator:number,denominator:number)=>({numerator,denominator,value:denominator?numerator/denominator:null});
function classification(row:ValueRow,asOf:string) {
  if(!row.classificationId)return {kind:"unknown",reason:"unclassified"};
  const valid=Number.isSafeInteger(row.classificationRevision)&&Number(row.classificationRevision)>0&&/^evidence:[a-f0-9]{64}$/.test(String(row.evidenceRef))&&safeId(row.verifiedBy)&&/^[a-f0-9]{64}$/.test(String(row.materialHash))&&strictUtc(row.verifiedAt)&&strictUtc(row.classificationCreatedAt)&&Date.parse(row.verifiedAt)<=Date.parse(asOf)&&Date.parse(row.classificationCreatedAt)<=Date.parse(asOf)&&Number(row.foreignClassifications)===0;
  return valid&&["business","test","unknown"].includes(String(row.classification))?{kind:String(row.classification),reason:null}:{kind:"unknown",reason:"invalid"};
}
async function frozen(row:ValueRow):Promise<ProductSnapshot|null> {
  if(!row.snapshotJson||row.snapshotBindingsValid!==1||row.sourceBatchId&&row.batchSnapshotValid!==1)return null;
  try {const p=JSON.parse(String(row.snapshotJson)) as ProductSnapshot;
    if(p.schemaVersion!==1||p.productId!==row.productId||p.profileVersionId!==row.profileVersionId||p.referenceVersionId!==row.referenceVersionId||p.revision!==row.productRevision||p.boundAt!==row.boundAt||p.referenceAssetId!==row.referenceAssetId||![p.revision,p.profileVersionNumber,p.referenceVersionNumber].every(n=>Number.isSafeInteger(n)&&n>0)||!["front","back","left_side","right_side","detail","other"].includes(p.referenceRole)||canonical(normalizeProductProfile(p.profile))!==canonical(p.profile)||await profileHash(String(row.snapshotJson))!==row.snapshotHash)return null;
    return p;
  }catch{return null;}
}
function workflow(row:ValueRow) {if(Number(row.foreignBatches)>0)return null;if(row.batchCount===0&&!row.sourceBatchId)return `single:${row.id}`;if(row.batchCount===1&&row.batchId===row.sourceBatchId&&row.batchSnapshotValid===1)return `batch:${row.batchId}`;return null;}
async function audit(row:ValueRow,asOf:string) {
  const events=JSON.parse(String(row.events)) as Array<Record<string,unknown>>;
  if(!events.length)return {kind:row.headRevision?"invalid":"none",action:null,first:null};
  let previous:Record<string,unknown>|null=null;
  for(let i=0;i<events.length;i++) {
    const e=events[i];let snapshot:Record<string,unknown>;
    try{snapshot=JSON.parse(String(e.snapshot));}catch{return {kind:"invalid",action:null,first:null};}
    if(e.revision!==i+1||e.previousId!==(previous?.id??null)||!["approve","reject","revoke"].includes(String(e.action))||e.action==="revoke"&&!previous||e.action==="revoke"&&previous?.action==="revoke"||await profileHash(String(e.snapshot))!==e.hash||snapshot.analysisId!==row.id||snapshot.verdict!==row.verdict||snapshot.qaEngineVersion!==row.qaEngineVersion||snapshot.riskPolicyVersion!==row.riskPolicyVersion||snapshot.modelPolicyVersion!==row.modelPolicyVersion||snapshot.completedAt!==row.completedAt||![snapshot.observations,snapshot.productIssues,snapshot.limitations,snapshot.modelCalls].every(Array.isArray)||!strictUtc(e.createdAt)||Date.parse(e.createdAt)>Date.parse(asOf))return {kind:"invalid",action:null,first:null};
    previous=e;
  }
  if(row.headRevision!==previous?.revision||row.headEventId!==previous?.id||Number(row.foreignReviews)>0)return {kind:"invalid",action:null,first:null};
  return {kind:"covered",action:String(previous?.action),first:events.find(e=>e.action==="approve"||e.action==="reject")??null};
}
export async function calculateValueMetrics(rows:ValueRow[],window:ValueWindow,asOf:string,unwindowable:number):Promise<ValueReport> {
  const report:ValueReport={version:VALUE_METRICS_VERSION,complete:true,generatedAt:window.generatedAt,sourceAsOf:asOf,window:{start:window.start,end:window.end},valueEvidence:false,qualityEvidence:false,scope:{cohort:rows.length,unwindowable,business:0,test:0,unknown:0,unclassified:0,invalidClassification:0,classificationCoverage:ratio(0,rows.length)},usage:{total:0,completed:0,failed:0,pending:0,completedTimeInvalid:0,unknownStatus:0},machine:{pass:0,review:0,fail:0,unknown:0,reviewRate:ratio(0,0)},sku:{linked:0,missing:0,coverage:ratio(0,0),workflowMissing:0,invocations:0,reuses:0,groups:[]},reviews:{covered:0,none:0,invalid:0,approve:0,reject:0,revoke:0,coverage:ratio(0,0),wait:{count:0,meanMs:null,missing:0,noDecision:0,invalidOrNegative:0}},detectionCost:{known:0,missing:0,sumUsd:null,coverage:ratio(0,0)},workflow:{single:0,batch:0,unknown:0},generationModel:{unknown:0},limitations:["Controlled business classifications only; test and unknown excluded from every business metric. Zero included business does not prove zero actual business.","Creation-time cohort; completion and reviews are current at sourceAsOf, including events after the window end. No historical status reconstruction.","SKU reuse is subsequent distinct workflow invocations inside this window; batch items are not separate reuse. No ranking.","First-decision waiting time is not actual human effort; time saved and ROI are not evaluated.","Detection estimates are not invoices, profit or revenue. Generation model source is unknown.","Source classification does not establish verified business value or visual quality. Low sample counts do not prove improvement."]};
  let classified=0,costSum=0,waitSum=0;
  const groups=new Map<string,{productId:string;referenceVersionId:string;labels:Set<string|null>;analyses:number;uses:Set<string>}>();
  for(const row of rows) {
    const c=classification(row,asOf);report.scope[c.kind as "business"|"test"|"unknown"]++;
    if(c.reason==="unclassified")report.scope.unclassified++;else if(c.reason==="invalid")report.scope.invalidClassification++;else classified++;
    if(c.kind!=="business")continue;
    report.usage.total++;report.generationModel.unknown++;
    const invocation=workflow(row);report.workflow[invocation?.startsWith("single:")?"single":invocation?.startsWith("batch:")?"batch":"unknown"]++;
    if(typeof row.cost==="number"&&Number.isFinite(row.cost)&&row.cost>=0){report.detectionCost.known++;costSum+=row.cost;}else report.detectionCost.missing++;
    if(row.status==="failed"){report.usage.failed++;continue;}if(row.status==="queued"||row.status==="running"){report.usage.pending++;continue;}
    if(row.status!=="completed"){report.usage.unknownStatus++;continue;}
    if(!strictUtc(row.completedAt)||Date.parse(row.completedAt)<Number(row.createdMs)||Date.parse(row.completedAt)>Date.parse(asOf)){report.usage.completedTimeInvalid++;continue;}
    report.usage.completed++;
    report.machine[["pass","review","fail"].includes(String(row.verdict))?row.verdict as "pass"|"review"|"fail":"unknown"]++;
    const snapshot=await frozen(row);
    if(snapshot){report.sku.linked++;const key=JSON.stringify([snapshot.productId,snapshot.referenceVersionId]);let group=groups.get(key);if(!group){group={productId:snapshot.productId,referenceVersionId:snapshot.referenceVersionId,labels:new Set(),analyses:0,uses:new Set()};groups.set(key,group);}group.analyses++;group.labels.add(snapshot.profile.skuLabel);if(invocation)group.uses.add(invocation);else report.sku.workflowMissing++;}else report.sku.missing++;
    const review=await audit(row,asOf);report.reviews[review.kind as "covered"|"none"|"invalid"]++;
    if(review.kind==="covered"&&review.action)report.reviews[review.action as "approve"|"reject"|"revoke"]++;
    if(review.kind!=="covered"||!review.first){report.reviews.wait.missing++;report.reviews.wait.noDecision++;}
    else {const wait=Date.parse(String(review.first.createdAt))-Date.parse(row.completedAt);if(!Number.isFinite(wait)||wait<0){report.reviews.wait.missing++;report.reviews.wait.invalidOrNegative++;}else{report.reviews.wait.count++;waitSum+=wait;}}
  }
  if(!Number.isFinite(costSum)||!Number.isFinite(waitSum))throw new ValueMetricsError("metrics_numeric_overflow","Metrics exceed the numeric budget.",422);
  report.scope.classificationCoverage=ratio(classified,rows.length);report.machine.reviewRate=ratio(report.machine.review,report.machine.pass+report.machine.review+report.machine.fail);
  report.sku.coverage=ratio(report.sku.linked,report.usage.completed);report.reviews.coverage=ratio(report.reviews.covered,report.usage.completed);
  report.reviews.wait.meanMs=report.reviews.wait.count?waitSum/report.reviews.wait.count:null;
  report.detectionCost.sumUsd=report.detectionCost.known?costSum:null;report.detectionCost.coverage=ratio(report.detectionCost.known,report.usage.total);
  report.sku.groups=[...groups].sort(([a],[b])=>a.localeCompare(b)).map(([,g])=>({productId:g.productId,referenceVersionId:g.referenceVersionId,skuLabels:[...g.labels].sort((a,b)=>(a??"").localeCompare(b??"")),analyses:g.analyses,invocations:g.uses.size,reuses:Math.max(0,g.uses.size-1)}));
  report.sku.invocations=report.sku.groups.reduce((n,g)=>n+g.invocations,0);report.sku.reuses=report.sku.groups.reduce((n,g)=>n+g.reuses,0);
  return report;
}
