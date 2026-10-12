// Test construction only. No real images, people, authorizations or model runs.
import { createHash } from 'node:crypto';
import { POLICY, POLICY_SHA256 } from '../evaluate-reference-view-shadow.mjs';
const anonymous = (prefix, n) => `${prefix}_${n.toString(16).padStart(16, '0')}`;
const imageHash = n => n.toString(16).padStart(64, '0');
export const bytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export function fixture() {
  const dataset = { schemaVersion: 1, datasetId: anonymous('dataset', 7), synthetic: true, authorizationRecords: [{ id: anonymous('auth', 1), workspaceId: anonymous('ws', 1), recordRef: 'synthetic:' + '1'.repeat(32), permittedUse: 'offline_evaluation', status: 'granted' }], samples: [] };
  const extension = { schemaVersion: 1, datasetId: dataset.datasetId, datasetSha256: '', synthetic: true, policyVersion: POLICY.version, policySha256: POLICY_SHA256, samples: [] };
  const predictions = { schemaVersion: 1, datasetId: dataset.datasetId, datasetSha256: '', extensionSha256: '', synthetic: true, policyVersion: POLICY.version, policySha256: POLICY_SHA256 };
  for (const [role, n] of [['baseline', 1], ['candidate', 2]]) predictions[role] = { metadata: { runId: anonymous('run', n), codeSha: String(n).repeat(40), model: { provider: 'synthetic-provider', modelId: 'synthetic-no-model' }, promptVersion: `synthetic-prompt-${n}`, policyVersion: `synthetic-external-policy-${n}`, policySha256: String(n).repeat(64) }, samples: [] };
  const label = (view, observability, conclusion, refs = []) => ({ observedView: view, observability, conclusion, acceptableReferenceIds: refs });
  for (let n = 1; n <= 8; n++) {
    const critical = [2, 6].includes(n);
    const machineTruth = critical ? { verdict: 'mismatch', defectType: 'packaging', severity: 'critical', observability: n === 6 ? 'partial' : 'observable' } : { verdict: 'match', defectType: 'none', severity: 'none', observability: 'observable' };
    const sample = { id: anonymous('sample', n), synthetic: true, workspaceId: anonymous('ws', 1), skuId: anonymous('sku', n), packagingVersionId: anonymous('pkg', n), authorizationId: anonymous('auth', 1), split: n <= 4 ? 'development' : 'holdout', referenceImageSha256: imageHash(n * 10), observedImageSha256: imageHash(n * 10 + 1), annotations: [1, 2].map(a => ({ annotatorId: anonymous('ann', a), independent: true, label: { ...machineTruth } })), adjudication: null };
    dataset.samples.push(sample);
    const source = Object.fromEntries(['workspaceId', 'skuId', 'packagingVersionId', 'authorizationId'].map(k => [k, sample[k]]));
    const ref = (offset, view, status = 'available') => ({ id: anonymous('ref', n * 10 + offset), imageSha256: imageHash(n * 10 + offset), view, observability: 'observable', status, source: { ...source } });
    const refs = [ref(0, n === 5 ? 'side' : n === 6 ? 'back' : n === 7 ? 'bottom' : 'front', n >= 7 ? 'invalidated' : 'available')];
    if (n === 2) refs.push(ref(2, 'front'), ref(3, 'back'));
    if (n === 6) refs.push(ref(2, 'front'));
    if (n === 7) refs.push(ref(2, 'top'));
    let truth = label(refs[0].view, 'observable', 'compatible', refs.filter(r => r.view === refs[0].view).map(r => r.id));
    if (n === 3) truth = label('unknown', 'partial', 'insufficient');
    if (n === 4) truth = label('front', 'observable', 'no_match');
    if (n === 7) truth = label('bottom', 'partial', 'insufficient');
    if (n === 8) truth = label('front', 'observable', 'insufficient');
    const annotations = [1, 2].map(a => ({ annotatorId: anonymous('ann', a), independent: true, blind: true, label: structuredClone(truth) }));
    let adjudication = null;
    if (n === 6) { annotations[0].label = label('front', 'observable', 'compatible', [refs[1].id]); adjudication = { adjudicatorId: anonymous('ann', 3), reason: 'view_resolution', label: structuredClone(truth) }; }
    extension.samples.push({ sampleId: sample.id, references: refs, annotations, adjudication });
    const p = (selection, matchDecision, qualityDecision) => ({ sampleId: sample.id, selection, matchDecision, qualityDecision });
    const baseline = [null, p(refs[0].id, 'MATCH', 'ALLOW'), p(refs[2]?.id, 'MATCH', 'ALLOW'), p(refs[0].id, 'MATCH', 'ALLOW'), p(refs[0].id, 'MATCH', 'BLOCK'), p(null, 'NO_MATCH', 'BLOCK'), p(refs[1]?.id, 'MATCH', 'ALLOW'), p(null, 'REVIEW', 'REVIEW'), p(null, 'REVIEW', 'BLOCK')][n];
    const candidate = [null, p(null, 'REVIEW', 'REVIEW'), p(refs[1]?.id, 'MATCH', 'REVIEW'), p(null, 'REVIEW', 'REVIEW'), p(null, 'NO_MATCH', 'BLOCK'), p(refs[0].id, 'MATCH', 'ALLOW'), p(refs[0].id, 'MATCH', 'BLOCK'), p(refs[1]?.id, 'MATCH', 'BLOCK'), p(null, 'REVIEW', 'REVIEW')][n];
    predictions.baseline.samples.push(baseline); predictions.candidate.samples.push(candidate);
  }
  return { dataset, extension, predictions };
}
// Tests explicitly rebind mutated data. The production CLI never synthesizes or repairs bindings.
export function bind(input) {
  const datasetBytes = bytes(input.dataset);
  if (Object.hasOwn(input.extension, 'datasetSha256')) input.extension.datasetSha256 = sha256(datasetBytes);
  if (Object.hasOwn(input.predictions, 'datasetSha256')) input.predictions.datasetSha256 = sha256(datasetBytes);
  const extensionBytes = bytes(input.extension);
  if (Object.hasOwn(input.predictions, 'extensionSha256')) input.predictions.extensionSha256 = sha256(extensionBytes);
  return [datasetBytes, extensionBytes, bytes(input.predictions)];
}
