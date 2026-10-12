import {profileHash} from "@/lib/products/profile-validation";
import {safeId,strictUtc} from "./validation";
import {ValueMetricsError} from "./types";
const fail=(code="invalid_classification_material"):never=>{throw new ValueMetricsError(code,"Classification material is incomplete, conflicting or outside the frozen ownership inventory.");};
function object(value:unknown,keys:string[]):Record<string,unknown>{if(!value||typeof value!=="object"||Array.isArray(value)||Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))fail();return value as Record<string,unknown>;}
export function parseClassificationJson(bytes:string):unknown {
  let result:unknown;try{result=JSON.parse(bytes);}catch{fail();}
  let at=0;const space=()=>{while(at<bytes.length&&/\s/.test(bytes[at]))at++;};
  function string(){const start=at++;while(bytes[at]!=='"'){if(bytes[at]==='\\')at++;at++;}at++;return JSON.parse(bytes.slice(start,at)) as string;}
  function value(){space();if(bytes[at]==='{'){at++;space();const keys=new Set<string>();while(bytes[at]!=='}'){const k=string();if(keys.has(k))fail();keys.add(k);space();at++;value();space();if(bytes[at]===','){at++;space();}else break;}at++;}else if(bytes[at]==='['){at++;space();while(bytes[at]!==']'){value();space();if(bytes[at]===','){at++;space();}else break;}at++;}else if(bytes[at]==='"')string();else while(at<bytes.length&&!/[\s,\]}]/.test(bytes[at]))at++;}
  value();return result;
}
export async function prepareClassification(input:unknown,inventoryInput:unknown,inputHash:string,inventoryHash:string,now=new Date().toISOString()) {
  const m=object(input,["schemaVersion","workspaceId","inventorySha256","records"]),inventory=object(inventoryInput,["schemaVersion","workspaceId","asOf","analyses"]);
  if(m.schemaVersion!==1||inventory.schemaVersion!==1||!safeId(m.workspaceId)||m.workspaceId!==inventory.workspaceId||m.inventorySha256!==inventoryHash||!/^[a-f0-9]{64}$/.test(inputHash)||!strictUtc(inventory.asOf)||Date.parse(inventory.asOf)>Date.parse(now)||!Array.isArray(inventory.analyses)||inventory.analyses.length>10000||!Array.isArray(m.records)||!m.records.length||m.records.length>500)fail();
  const owned=new Map<string,number>();
  for(const source of inventory.analyses as unknown[]){const a=object(source,["analysisId","workspaceId","classificationRevision"]);if(!safeId(a.analysisId)||a.workspaceId!==m.workspaceId||owned.has(a.analysisId)||!Number.isSafeInteger(a.classificationRevision)||Number(a.classificationRevision)<0)fail();owned.set(a.analysisId as string,Number(a.classificationRevision));}
  const used=new Set<string>(),statements:Array<{sql:string;params:unknown[]}>=[];
  for(const record of m.records as unknown[]){const r=object(record,["analysisId","classification","evidenceRef","verifiedBy","verifiedAt","expectedRevision"]);
    if(!safeId(r.analysisId)||!owned.has(r.analysisId)||used.has(r.analysisId)||!["business","test","unknown"].includes(String(r.classification))||typeof r.evidenceRef!=="string"||!/^evidence:[a-f0-9]{64}$/.test(r.evidenceRef)||!safeId(r.verifiedBy)||!strictUtc(r.verifiedAt)||Date.parse(r.verifiedAt)>Date.parse(inventory.asOf as string)||!Number.isSafeInteger(r.expectedRevision)||Number(r.expectedRevision)<0||Number(r.expectedRevision)>=Number.MAX_SAFE_INTEGER||r.expectedRevision!==owned.get(r.analysisId))fail();used.add(r.analysisId as string);
    const id="vc_"+await profileHash(JSON.stringify([inputHash,r.analysisId]));
    statements.push({sql:"INSERT INTO analysis_value_classifications(id,analysis_id,workspace_id,revision,classification,evidence_ref,verified_by,verified_at,material_sha256) VALUES(?,?,?,?,?,?,?,?,?)",params:[id,r.analysisId,m.workspaceId,Number(r.expectedRevision)+1,r.classification,r.evidenceRef,r.verifiedBy,r.verifiedAt,inputHash]});
  }
  return {status:"VALID_PREPARATION",preparationOnly:true,valueEvidence:false,qualityEvidence:false,workspaceId:m.workspaceId,inputSha256:inputHash,inventorySha256:inventoryHash,recordCount:statements.length,executionRequirement:"Only a separately authorized operator may execute all statements atomically with D1Database.batch after reviewing original evidence. This tool never imports.",statements};
}
