import {ReleaseError,type ReleasePage} from "./types";
/** Excel/Sheets formula prefixes may follow invisible whitespace or Unicode forms. */
export function csvCell(value:unknown):string {
  const raw=String(value??""),probe=raw.normalize("NFKC").replace(/^[\s\p{Cf}\p{Cc}]+/u,"");
  const safe=/^[=+\-@]/u.test(probe)||/^[\t\r\n]/u.test(raw)?`'${raw}`:raw;
  return `"${safe.replaceAll('"','""')}"`;
}
export function releaseCsv(page:ReleasePage) {
  if(page.rows.some(row=>!row.machine.sourceComplete))throw new ReleaseError("export_source_incomplete","A full original source could not be read safely for this page. Refine the search or review the blocked records; a partial original snapshot cannot be exported.",409);
  const header=["analysis_id","batch_id","created_at","machine_status","machine_verdict","qa_engine_version","risk_policy_version","model_policy_version","machine_source_hash","machine_source_complete","machine_source_snapshot_json","human_action","human_category","human_reason","human_revision","human_decided_at","human_machine_snapshot_hash","release_policy_version","release_policy_hash","eligibility","reason_codes","reason_messages","evaluated_at","reference_available","candidate_available","product_id","frozen_sku","frozen_product_name","profile_version_id","profile_version_number","reference_version_id","reference_version_number","product_bound_at","product_snapshot_hash","product_snapshot_json"];
  const rows=page.rows.map(r=>[r.analysisId,r.batchId,r.createdAt,r.machine.status,r.machine.verdict,r.machine.qaEngineVersion,r.machine.riskPolicyVersion,r.machine.modelPolicyVersion,r.machine.sourceHash,r.machine.sourceComplete,r.machine.sourceSnapshotJson,r.human.action,r.human.category,r.human.reason,r.human.revision,r.human.createdAt,r.human.machineHash,r.policyVersion,r.policyHash,r.eligibility,r.reasons.map(v=>v.code).join("; "),r.reasons.map(v=>v.message).join("; "),r.evaluatedAt,r.assets.referenceAvailable,r.assets.candidateAvailable,r.productSnapshot?.productId,r.productSnapshot?.profile.skuLabel,r.productSnapshot?.profile.name,r.productSnapshot?.profileVersionId,r.productSnapshot?.profileVersionNumber,r.productSnapshot?.referenceVersionId,r.productSnapshot?.referenceVersionNumber,r.productSnapshot?.boundAt,r.productSnapshotHash,r.productSnapshotJson]);
  return [header,...rows].map(row=>row.map(csvCell).join(",")).join("\r\n");
}
