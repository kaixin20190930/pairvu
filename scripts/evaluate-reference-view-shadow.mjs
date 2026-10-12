#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDataset } from './verify-upgrade-dataset.mjs';

const HASH = /^[a-f0-9]{64}$/;
const ID = { reference: /^ref_[a-f0-9]{16}$/, annotator: /^ann_[a-f0-9]{16}$/, run: /^run_[a-f0-9]{16}$/ };
const VIEWS = ['front', 'back', 'side', 'top', 'bottom', 'detail', 'unknown'];
const OBSERVABILITY = ['observable', 'partial', 'unobservable'];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v;
const freeze = v => { if (v && typeof v === 'object') { Object.values(v).forEach(freeze); Object.freeze(v); } return v; };
export const POLICY = freeze({
  version: 'reference-view-conservative-001',
  views: VIEWS,
  observability: OBSERVABILITY,
  maxReferencesPerSample: 16,
  candidateRule: 'resolved-compatible-truth;known-observable-view;same-view;available-observable-reference;same-source',
  ambiguityRule: 'sorted-set;never-choose-unique-by-order',
  qualityEvidence: 'always-false;external-declarations-not-authenticated',
  externalRunPolicyRule: 'explicit-version-and-hash;declarations-only;no-inferred-provenance',
  criticalRule: 'UPG02-resolved-critical-and-observability-not-unobservable;quality-ALLOW-is-missed',
  predictionCombinations: { MATCH: ['ALLOW', 'REVIEW', 'BLOCK'], REVIEW: ['REVIEW', 'BLOCK'], NO_MATCH: ['BLOCK'] },
});
export const POLICY_SHA256 = sha256(JSON.stringify(canonical(POLICY)));
class ShadowInputError extends Error {}
const check = (condition, code) => { if (!condition) throw new ShadowInputError(code); };
function parse(bytes) {
  const text = bytes.toString('utf8');
  let result;
  try { result = JSON.parse(text); } catch { throw new ShadowInputError('INVALID_JSON'); }
  // JSON.parse silently overwrites duplicate keys. Scan the already syntax-checked text,
  // decoding key escapes so e.g. "view" and "v\\u0069ew" cannot disagree invisibly.
  let at = 0;
  const space = () => { while (/\s/.test(text[at] || '') && at < text.length) at++; };
  function string() { const start = at++; while (text[at] !== '"') { if (text[at] === '\\') at++; at++; } at++; return JSON.parse(text.slice(start, at)); }
  function value() {
    space();
    if (text[at] === '{') {
      at++; space(); const keys = new Set();
      while (text[at] !== '}') { const key = string(); check(!keys.has(key), 'DUPLICATE_JSON_FIELD'); keys.add(key); space(); at++; value(); space(); if (text[at] === ',') { at++; space(); } else break; }
      at++;
    } else if (text[at] === '[') { at++; space(); while (text[at] !== ']') { value(); space(); if (text[at] === ',') { at++; space(); } else break; } at++; }
    else if (text[at] === '"') string();
    else { while (at < text.length && !/[\s,\]}]/.test(text[at])) at++; }
  }
  value(); return result;
}
function object(value, keys, code) {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), code);
  check(Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k)), code);
}
function array(value, code, minimum = 0, maximum = 100000) { check(Array.isArray(value) && value.length >= minimum && value.length <= maximum, code); }
function one(value, values, code) { check(values.includes(value), code); }
function id(value, type, code) { check(typeof value === 'string' && ID[type].test(value), code); }
function hash(value, code) { check(typeof value === 'string' && HASH.test(value), code); }
function token(value, code) { check(typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/.test(value) && !['unknown', 'unspecified', 'null', 'none'].includes(value.toLowerCase()), code); }
function uniqueMap(records, field, expected, code) {
  array(records, code, expected.size, expected.size);
  const map = new Map();
  for (const record of records) {
    check(record && expected.has(record[field]) && !map.has(record[field]), code);
    map.set(record[field], record);
  }
  return map;
}
const sourceKeys = ['workspaceId', 'skuId', 'packagingVersionId', 'authorizationId'];
const sourceKey = s => sourceKeys.map(k => s[k]).join(':');
function binding(data, dataset, datasetSha) {
  check(data.schemaVersion === 1, 'UNSUPPORTED_SCHEMA_VERSION');
  check(data.datasetId === dataset.datasetId && data.datasetSha256 === datasetSha, 'DATASET_BINDING_MISMATCH');
  check(data.synthetic === dataset.synthetic, 'MIXED_PROVENANCE');
  check(data.policyVersion === POLICY.version && data.policySha256 === POLICY_SHA256, 'UNSUPPORTED_POLICY');
}
function compatibleRefs(refs, label) {
  if (label.conclusion !== 'compatible' || label.observedView === 'unknown' || label.observability !== 'observable') return [];
  return refs.filter(r => r.status === 'available' && r.observability === 'observable' && r.view === label.observedView).map(r => r.id).sort();
}
const truthKeys = ['observedView', 'observability', 'conclusion', 'acceptableReferenceIds'];
function validateTruth(label, refs) {
  object(label, truthKeys, 'INVALID_VIEW_LABEL_FIELDS');
  one(label.observedView, VIEWS, 'INVALID_VIEW');
  one(label.observability, OBSERVABILITY, 'INVALID_OBSERVABILITY');
  one(label.conclusion, ['compatible', 'no_match', 'insufficient'], 'INVALID_VIEW_CONCLUSION');
  array(label.acceptableReferenceIds, 'INVALID_ACCEPTABLE_REFERENCES', 0, POLICY.maxReferencesPerSample);
  const seen = new Set(), eligible = new Set(compatibleRefs(refs, label));
  for (const ref of label.acceptableReferenceIds) {
    check(eligible.has(ref) && !seen.has(ref), 'INVALID_ACCEPTABLE_REFERENCE'); seen.add(ref);
  }
  if (label.conclusion === 'compatible') check(seen.size > 0 && label.observedView !== 'unknown' && label.observability === 'observable', 'UNCONFIRMABLE_VIEW_TRUTH');
  else check(seen.size === 0, 'NONMATCH_HAS_ACCEPTABLE_REFERENCES');
  if (label.conclusion === 'no_match') check(label.observedView !== 'unknown' && label.observability === 'observable', 'UNCONFIRMABLE_NO_MATCH_TRUTH');
}
const equalTruth = (a, b) => JSON.stringify(canonical({ ...a, acceptableReferenceIds: [...a.acceptableReferenceIds].sort() })) === JSON.stringify(canonical({ ...b, acceptableReferenceIds: [...b.acceptableReferenceIds].sort() }));
function extensionSamples(extension, dataset, datasetSha) {
  object(extension, ['schemaVersion', 'datasetId', 'datasetSha256', 'synthetic', 'policyVersion', 'policySha256', 'samples'], 'INVALID_EXTENSION_FIELDS');
  binding(extension, dataset, datasetSha);
  const ids = new Set(dataset.samples.map(s => s.id)), samples = uniqueMap(extension.samples, 'sampleId', ids, 'EXTENSION_SAMPLE_SET_MISMATCH');
  const imageSplits = new Map(), imageSources = new Map(), referenceIds = new Map();
  // Seed the entire original dataset before checking any added references (including cross-role leakage).
  function image(hashValue, sample) {
    check(!imageSplits.has(hashValue) || imageSplits.get(hashValue) === sample.split, 'REFERENCE_IMAGE_SPLIT_LEAK');
    check(!imageSources.has(hashValue) || imageSources.get(hashValue) === sourceKey(sample), 'IMAGE_SOURCE_CONFLICT');
    imageSplits.set(hashValue, sample.split); imageSources.set(hashValue, sourceKey(sample));
  }
  for (const s of dataset.samples) { image(s.referenceImageSha256, s); image(s.observedImageSha256, s); }
  for (const s of dataset.samples) {
    const ext = samples.get(s.id);
    object(ext, ['sampleId', 'references', 'annotations', 'adjudication'], 'INVALID_EXTENSION_SAMPLE_FIELDS');
    array(ext.references, 'INVALID_REFERENCE_SET', 1, POLICY.maxReferencesPerSample);
    const localIds = new Set(), localHashes = new Set();
    for (const ref of ext.references) {
      object(ref, ['id', 'imageSha256', 'view', 'observability', 'status', 'source'], 'INVALID_REFERENCE_FIELDS');
      id(ref.id, 'reference', 'INVALID_REFERENCE_ID'); hash(ref.imageSha256, 'INVALID_REFERENCE_HASH');
      one(ref.view, VIEWS, 'INVALID_REFERENCE_VIEW'); one(ref.observability, OBSERVABILITY, 'INVALID_REFERENCE_OBSERVABILITY');
      one(ref.status, ['available', 'invalidated'], 'INVALID_REFERENCE_STATUS');
      object(ref.source, sourceKeys, 'INVALID_REFERENCE_SOURCE_FIELDS');
      check(sourceKeys.every(k => ref.source[k] === s[k]), 'REFERENCE_SOURCE_MISMATCH');
      check(!localIds.has(ref.id) && !localHashes.has(ref.imageSha256), 'DUPLICATE_REFERENCE');
      localIds.add(ref.id); localHashes.add(ref.imageSha256);
      check(ref.imageSha256 !== s.observedImageSha256, 'OBSERVED_AS_OWN_REFERENCE');
      image(ref.imageSha256, s);
      const identity = JSON.stringify(canonical(ref));
      check(!referenceIds.has(ref.id) || referenceIds.get(ref.id) === identity, 'REFERENCE_ID_CONFLICT');
      referenceIds.set(ref.id, identity);
    }
    check(localHashes.has(s.referenceImageSha256), 'ORIGINAL_REFERENCE_MISSING');
    array(ext.annotations, 'TWO_VIEW_ANNOTATIONS_REQUIRED', 2, 2);
    for (const ann of ext.annotations) {
      object(ann, ['annotatorId', 'independent', 'blind', 'label'], 'INVALID_VIEW_ANNOTATION_FIELDS');
      id(ann.annotatorId, 'annotator', 'INVALID_VIEW_ANNOTATOR');
      check(ann.independent === true && ann.blind === true, 'VIEW_ANNOTATION_NOT_INDEPENDENT_BLIND');
      validateTruth(ann.label, ext.references);
    }
    const [a, b] = ext.annotations;
    check(a.annotatorId !== b.annotatorId, 'VIEW_ANNOTATORS_IDENTICAL');
    if (equalTruth(a.label, b.label)) check(ext.adjudication === null, 'UNNECESSARY_VIEW_ADJUDICATION');
    else {
      const adj = ext.adjudication;
      object(adj, ['adjudicatorId', 'reason', 'label'], 'VIEW_ADJUDICATION_REQUIRED');
      id(adj.adjudicatorId, 'annotator', 'INVALID_VIEW_ADJUDICATOR');
      check(![a.annotatorId, b.annotatorId].includes(adj.adjudicatorId), 'VIEW_ADJUDICATOR_NOT_THIRD_PERSON');
      one(adj.reason, ['view_resolution', 'reference_resolution', 'observability_resolution', 'multiple_disagreements'], 'INVALID_VIEW_ADJUDICATION_REASON');
      validateTruth(adj.label, ext.references);
    }
  }
  return samples;
}
function predictionRuns(predictions, dataset, datasetSha, extensionSha, extensions) {
  object(predictions, ['schemaVersion', 'datasetId', 'datasetSha256', 'extensionSha256', 'synthetic', 'policyVersion', 'policySha256', 'baseline', 'candidate'], 'INVALID_PREDICTION_FIELDS');
  binding(predictions, dataset, datasetSha);
  check(predictions.extensionSha256 === extensionSha, 'EXTENSION_BINDING_MISMATCH');
  const ids = new Set(dataset.samples.map(s => s.id)), runs = {};
  for (const role of ['baseline', 'candidate']) {
    const run = predictions[role];
    object(run, ['metadata', 'samples'], 'INVALID_RUN_FIELDS');
    const m = run.metadata;
    object(m, ['runId', 'codeSha', 'model', 'promptVersion', 'policyVersion', 'policySha256'], 'INVALID_RUN_METADATA_FIELDS');
    id(m.runId, 'run', 'INVALID_RUN_ID');
    check(typeof m.codeSha === 'string' && /^[a-f0-9]{40}$/.test(m.codeSha), 'INVALID_RUN_CODE_SHA');
    object(m.model, ['provider', 'modelId'], 'INVALID_MODEL_METADATA');
    token(m.model.provider, 'INVALID_MODEL_PROVIDER'); token(m.model.modelId, 'INVALID_MODEL_ID'); token(m.promptVersion, 'INVALID_PROMPT_VERSION');
    token(m.policyVersion, 'INVALID_RUN_POLICY_VERSION'); hash(m.policySha256, 'INVALID_RUN_POLICY_HASH');
    const records = uniqueMap(run.samples, 'sampleId', ids, 'PREDICTION_SAMPLE_SET_MISMATCH');
    for (const [sampleId, prediction] of records) {
      object(prediction, ['sampleId', 'selection', 'matchDecision', 'qualityDecision'], 'INVALID_PREDICTION_SAMPLE_FIELDS');
      one(prediction.matchDecision, ['MATCH', 'REVIEW', 'NO_MATCH'], 'INVALID_MATCH_DECISION');
      one(prediction.qualityDecision, ['ALLOW', 'REVIEW', 'BLOCK'], 'INVALID_QUALITY_DECISION');
      check(POLICY.predictionCombinations[prediction.matchDecision].includes(prediction.qualityDecision), 'UNSUPPORTED_PREDICTION_COMBINATION');
      const ref = extensions.get(sampleId).references.find(r => r.id === prediction.selection);
      if (prediction.selection !== null) check(ref && ref.status === 'available' && ref.observability === 'observable' && ref.view !== 'unknown', 'INVALID_PREDICTION_REFERENCE');
      if (prediction.matchDecision === 'MATCH') check(prediction.selection !== null, 'MATCH_REQUIRES_SELECTION');
      if (prediction.matchDecision === 'NO_MATCH') check(prediction.selection === null, 'NO_MATCH_HAS_SELECTION');
    }
    runs[role] = { metadata: m, records };
  }
  check(runs.baseline.metadata.runId !== runs.candidate.metadata.runId, 'RUN_IDS_MUST_DIFFER');
  return runs;
}
function recommendation(ext, truth) {
  const candidates = compatibleRefs(ext.references, truth);
  let reason = 'SINGLE_COMPATIBLE_REFERENCE';
  if (truth.observedView === 'unknown') reason = 'UNKNOWN_OBSERVED_VIEW';
  else if (truth.observability !== 'observable') reason = 'LOW_OBSERVABILITY';
  else if (truth.conclusion === 'no_match') reason = 'DECLARED_NO_MATCH';
  else if (truth.conclusion === 'insufficient') reason = 'INSUFFICIENT_EVIDENCE';
  else if (!candidates.length) reason = 'NO_COMPATIBLE_REFERENCE';
  else if (candidates.length > 1) reason = 'MULTIPLE_COMPATIBLE_REFERENCES';
  return { candidateReferenceIds: candidates, uniqueReferenceId: candidates.length === 1 ? candidates[0] : null, reason, confirmedMatch: false };
}
function outcome(prediction, truth) {
  if (prediction.matchDecision === 'REVIEW') return 'abstain';
  if (truth.conclusion === 'insufficient') return 'unevaluable';
  if (prediction.matchDecision === 'NO_MATCH') return truth.conclusion === 'no_match' ? 'correctNoMatch' : 'wrongNoMatch';
  return truth.conclusion === 'compatible' && truth.acceptableReferenceIds.includes(prediction.selection) ? 'correctMatch' : 'wrongMatch';
}
const rate = (numerator, denominator) => ({ numerator, denominator, value: denominator ? numerator / denominator : null, reason: denominator ? null : 'EMPTY_DENOMINATOR' });
const correct = o => ['correctMatch', 'correctNoMatch'].includes(o);
function splitReport(rows, runs) {
  const count = rows.length, decidable = rows.filter(r => r.truth.conclusion !== 'insufficient').length, critical = rows.filter(r => r.critical).length;
  const report = { sampleCount: count, decidableDenominator: decidable, criticalDenominator: critical, runs: {}, differences: { comparedSampleCount: count, selectionChanged: 0, matchDecisionChanged: 0, qualityDecisionChanged: 0, becameCorrect: 0, ceasedCorrect: 0 }, skuSampleCounts: {}, defectTypeSampleCounts: {}, rankings: 'NOT_SUPPORTED' };
  for (const row of rows) {
    report.skuSampleCounts[row.skuId] = (report.skuSampleCounts[row.skuId] || 0) + 1;
    report.defectTypeSampleCounts[row.defectType] = (report.defectTypeSampleCounts[row.defectType] || 0) + 1;
    const b = row.predictions.baseline, c = row.predictions.candidate, d = report.differences;
    d.selectionChanged += b.selection !== c.selection; d.matchDecisionChanged += b.matchDecision !== c.matchDecision; d.qualityDecisionChanged += b.qualityDecision !== c.qualityDecision;
    if (row.truth.conclusion !== 'insufficient') { d.becameCorrect += !correct(b.outcome) && correct(c.outcome); d.ceasedCorrect += correct(b.outcome) && !correct(c.outcome); }
  }
  for (const role of Object.keys(runs)) {
    const counts = { correctMatch: 0, wrongMatch: 0, correctNoMatch: 0, wrongNoMatch: 0, abstain: 0, unevaluable: 0, match: 0, review: 0, noMatch: 0, unsafeMatchOnInsufficient: 0, criticalAllowed: 0, criticalQualityReview: 0, criticalBlocked: 0, criticalMatchReview: 0, qualityAllow: 0, qualityReview: 0, qualityBlock: 0 };
    for (const row of rows) {
      const p = row.predictions[role]; counts[p.outcome]++;
      counts[{ MATCH: 'match', REVIEW: 'review', NO_MATCH: 'noMatch' }[p.matchDecision]]++;
      counts[{ ALLOW: 'qualityAllow', REVIEW: 'qualityReview', BLOCK: 'qualityBlock' }[p.qualityDecision]]++;
      if (row.truth.conclusion === 'insufficient' && p.matchDecision === 'MATCH') counts.unsafeMatchOnInsufficient++;
      if (row.critical) { counts[{ ALLOW: 'criticalAllowed', REVIEW: 'criticalQualityReview', BLOCK: 'criticalBlocked' }[p.qualityDecision]]++; if (p.matchDecision === 'REVIEW') counts.criticalMatchReview++; }
    }
    report.runs[role] = { sampleDenominator: count, counts, declaredCorrectRate: rate(counts.correctMatch + counts.correctNoMatch, decidable), coverage: rate(count - counts.review, count), reviewRate: rate(counts.review, count), criticalMissedAllowRate: rate(counts.criticalAllowed, critical), criticalQualityReviewRate: rate(counts.criticalQualityReview, critical) };
  }
  return report;
}

/** Offline replay of external declarations. The raw three-file bytes are the frozen input identity. */
export function evaluateReferenceViewShadow(datasetBytes, extensionBytes, predictionBytes) {
  const dataset = parse(datasetBytes), extension = parse(extensionBytes), predictions = parse(predictionBytes);
  // UPG02's fixed structural error messages are deliberately not forwarded to the CLI.
  try { validateDataset(dataset); } catch { throw new ShadowInputError('UPG02_DATASET_INVALID'); }
  const datasetSha = sha256(datasetBytes), extensionSha = sha256(extensionBytes);
  const extensions = extensionSamples(extension, dataset, datasetSha), runs = predictionRuns(predictions, dataset, datasetSha, extensionSha, extensions);
  const rows = [...dataset.samples].sort((a, b) => a.id.localeCompare(b.id)).map(s => {
    const ext = extensions.get(s.id), truth = ext.adjudication?.label || ext.annotations[0].label, originalTruth = s.adjudication?.label || s.annotations[0].label;
    return { sampleId: s.id, split: s.split, skuId: s.skuId, defectType: originalTruth.defectType, critical: originalTruth.severity === 'critical' && originalTruth.observability !== 'unobservable', truth: { ...truth, acceptableReferenceIds: [...truth.acceptableReferenceIds].sort() }, recommendation: recommendation(ext, truth), predictions: Object.fromEntries(Object.entries(runs).map(([role, run]) => { const p = run.records.get(s.id); return [role, { ...p, outcome: outcome(p, truth) }]; })) };
  });
  return { status: 'VALID', schemaVersion: 1, unitId: 'UPG-07A', qualityEvidence: false, realQualityStatus: 'BLOCKED', evidenceKind: dataset.synthetic ? 'synthetic_test' : 'unverified_declared_input', message: 'Engineering validation and declaration diagnostics only. No authorization, human provenance, model execution, image integrity or real benchmark quality has been verified.', inputDeclarations: { synthetic: dataset.synthetic, authorization: 'UNVERIFIED', independentHumanLabels: 'UNVERIFIED', imageIntegrityAndNearDuplicates: 'UNVERIFIED', runOrigins: 'UNVERIFIED' }, inputHashes: { datasetSha256: datasetSha, extensionSha256: extensionSha, predictionsSha256: sha256(predictionBytes) }, policy: { version: POLICY.version, sha256: POLICY_SHA256, manifest: POLICY }, runMetadata: { baseline: runs.baseline.metadata, candidate: runs.candidate.metadata }, splits: Object.fromEntries(['development', 'holdout'].map(split => [split, splitReport(rows.filter(r => r.split === split), runs)])), samples: rows, limitations: ['No combined development/holdout headline, quality thresholds, statistical significance or SKU/category rankings.', 'Declarations of blind annotation and authorization are not identity or consent verification.', 'Known-view same-view reference sets are conservative diagnostics, never confirmed visual matches.', 'Coverage counts all non-REVIEW outputs, including incorrect and unevaluable outputs. REVIEW is never scored correct.', 'UPG02 critical truth is independent of view truth; partial visible critical defects remain in the critical denominator.'] };
}
export async function main(args) {
  if (args.length === 1 && args[0] === '--help') {
    console.log('Usage: node scripts/evaluate-reference-view-shadow.mjs --dataset FILE --views FILE --predictions FILE\nRead-only offline three-file replay. No default fixture. Exit 0: engineering VALID (real quality still BLOCKED); 1: INVALID_INPUT; 2: BLOCKED (missing/unreadable input); 64: INVALID_USAGE. JSON results to stdout; errors never echo input values.'); return 0;
  }
  const result = (status, reason) => console.log(JSON.stringify({ status, reason, qualityEvidence: false, realQualityStatus: 'BLOCKED' }));
  if (!args.length) { result('BLOCKED', 'EXPLICIT_THREE_FILE_INPUT_REQUIRED'); return 2; }
  if (args.length !== 6 || args[0] !== '--dataset' || args[2] !== '--views' || args[4] !== '--predictions' || [args[1], args[3], args[5]].some(v => !v || v.startsWith('--'))) { result('INVALID_USAGE', 'EXPECTED_DATASET_VIEWS_PREDICTIONS'); return 64; }
  let bytes;
  try { bytes = await Promise.all([args[1], args[3], args[5]].map(path => readFile(resolve(path)))); }
  catch { result('BLOCKED', 'INPUT_UNAVAILABLE'); return 2; }
  try { console.log(JSON.stringify(evaluateReferenceViewShadow(...bytes), null, 2)); return 0; }
  catch (error) { result('INVALID_INPUT', error instanceof ShadowInputError ? error.message : 'MALFORMED_INPUT'); return 1; }
}
// ESM resolves script symlinks; normalize both entry paths just as the UPG02 CLI does.
if (process.argv[1] && await realpath(fileURLToPath(import.meta.url)) === await realpath(resolve(process.argv[1]))) process.exitCode = await main(process.argv.slice(2));
