#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm, readdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { evaluateReferenceViewShadow as evaluate, POLICY, POLICY_SHA256 } from './evaluate-reference-view-shadow.mjs';
import { fixture, bind, sha256 } from './reference-view-shadow/synthetic-fixture.mjs';

const checks = [];
function test(name, fn) { fn(); checks.push({ name, status: 'PASS' }); }
function accept(name, mutate, verify) { test(name, () => { const input = fixture(); mutate(input); const report = evaluate(...bind(input)); assert.equal(report.status, 'VALID'); assert.equal(report.qualityEvidence, false); verify?.(report); }); }
function reject(name, mutate, code) { test(name, () => { const input = fixture(); mutate(input); assert.throws(() => evaluate(...bind(input)), error => error.message === code, name); }); }
const input = fixture(), raw = bind(input), original = evaluate(...raw);
test('split counts and full outcome partitions retain REVIEW and insufficient samples', () => {
  assert.equal(original.splits.development.sampleCount, 4); assert.equal(original.splits.holdout.sampleCount, 4);
  assert.equal(original.splits.development.decidableDenominator, 3); assert.equal(original.splits.holdout.decidableDenominator, 2);
  for (const split of Object.values(original.splits)) for (const run of Object.values(split.runs)) { assert.equal(run.sampleDenominator, 4); assert.equal(['correctMatch', 'wrongMatch', 'correctNoMatch', 'wrongNoMatch', 'abstain', 'unevaluable'].reduce((n, k) => n + run.counts[k], 0), 4); }
  assert.deepEqual(original.splits.development.runs.baseline.declaredCorrectRate, { numerator: 1, denominator: 3, value: 1 / 3, reason: null });
  assert.deepEqual(original.splits.development.runs.candidate.declaredCorrectRate, { numerator: 2, denominator: 3, value: 2 / 3, reason: null });
  assert.equal(original.splits.development.runs.candidate.counts.abstain, 2);
});
test('independent critical truth counts both observable and partial defects; REVIEW is separate', () => {
  for (const split of Object.values(original.splits)) { assert.equal(split.criticalDenominator, 1); assert.equal(split.runs.baseline.counts.criticalAllowed, 1); assert.equal(split.runs.candidate.counts.criticalAllowed, 0); }
  assert.equal(original.splits.development.runs.candidate.counts.criticalQualityReview, 1);
  assert.equal(original.splits.holdout.runs.candidate.counts.criticalBlocked, 1);
});
test('multi solution retains sorted candidate set and never selects unique by order', () => { const r = original.samples[1].recommendation; assert.equal(r.reason, 'MULTIPLE_COMPATIBLE_REFERENCES'); assert.equal(r.candidateReferenceIds.length, 2); assert.equal(r.uniqueReferenceId, null); assert.equal(r.confirmedMatch, false); });
test('unknown, low visibility, no_match and invalidated references never recommend a match', () => {
  for (const n of [2, 3, 6, 7]) { assert.deepEqual(original.samples[n].recommendation.candidateReferenceIds, []); assert.equal(original.samples[n].recommendation.uniqueReferenceId, null); }
  assert.equal(original.samples[2].recommendation.reason, 'UNKNOWN_OBSERVED_VIEW');
  assert.equal(original.samples[6].recommendation.reason, 'LOW_OBSERVABILITY');
  assert.equal(original.samples[3].recommendation.reason, 'DECLARED_NO_MATCH');
  assert.equal(original.splits.development.runs.baseline.counts.unsafeMatchOnInsufficient, 1);
  assert.equal(original.splits.holdout.runs.candidate.counts.unsafeMatchOnInsufficient, 1);
});
test('same frozen samples compare changed output and correctness without headline', () => { const d = original.splits.development.differences; assert.equal(d.comparedSampleCount, 4); assert.equal(d.becameCorrect, 2); assert.equal(d.ceasedCorrect, 1); assert.equal(original.overall, undefined); assert.equal(original.splits.development.rankings, 'NOT_SUPPORTED'); });
test('byte hashes bind all three files and fixed policy manifest', () => { assert.equal(original.inputHashes.datasetSha256, sha256(raw[0])); assert.equal(original.inputHashes.extensionSha256, sha256(raw[1])); assert.equal(original.inputHashes.predictionsSha256, sha256(raw[2])); assert.equal(original.policy.sha256, POLICY_SHA256); assert.equal(original.policy.version, POLICY.version); });
accept('false synthetic declaration does not certify real provenance or quality', d => { d.dataset.synthetic = false; d.dataset.samples.forEach(s => s.synthetic = false); d.dataset.authorizationRecords[0].recordRef = 'record:' + '1'.repeat(32); d.extension.synthetic = false; d.predictions.synthetic = false; }, r => { assert.equal(r.evidenceKind, 'unverified_declared_input'); assert.equal(r.realQualityStatus, 'BLOCKED'); assert.equal(r.inputDeclarations.independentHumanLabels, 'UNVERIFIED'); });
accept('no critical examples has null missed-error rate, never success zero', d => { d.dataset.samples.forEach(s => s.annotations.forEach(a => { a.label = { verdict: 'match', defectType: 'none', severity: 'none', observability: 'observable' }; })); }, r => { for (const s of Object.values(r.splits)) { assert.equal(s.criticalDenominator, 0); assert.equal(s.runs.baseline.criticalMissedAllowRate.value, null); assert.equal(s.runs.baseline.criticalMissedAllowRate.reason, 'EMPTY_DENOMINATOR'); } });
accept('only development yields explicit zero holdout and null denominators', d => { d.dataset.samples = d.dataset.samples.slice(0, 4); d.extension.samples = d.extension.samples.slice(0, 4); for (const role of ['baseline', 'candidate']) d.predictions[role].samples = d.predictions[role].samples.slice(0, 4); }, r => { assert.equal(r.splits.holdout.sampleCount, 0); assert.equal(r.splits.holdout.runs.candidate.coverage.value, null); assert.equal(r.splits.holdout.runs.candidate.declaredCorrectRate.reason, 'EMPTY_DENOMINATOR'); });
accept('all view truth insufficient leaves zero decidable denominator with abstentions retained', d => { d.extension.samples.forEach(s => { s.annotations.forEach(a => a.label = { observedView: 'unknown', observability: 'unobservable', conclusion: 'insufficient', acceptableReferenceIds: [] }); s.adjudication = null; }); }, r => { for (const s of Object.values(r.splits)) { assert.equal(s.decidableDenominator, 0); assert.equal(s.runs.candidate.declaredCorrectRate.value, null); } });
accept('distinct external run policy versions and hashes are declared, never inferred', d => { d.predictions.baseline.metadata.policyVersion = 'legacy-policy-009'; d.predictions.baseline.metadata.policySha256 = 'a'.repeat(64); d.predictions.candidate.metadata.model.modelId = 'declared-model-v2'; }, r => { assert.equal(r.runMetadata.baseline.policyVersion, 'legacy-policy-009'); assert.equal(r.inputDeclarations.runOrigins, 'UNVERIFIED'); });
accept('same-source frozen reference can be reused by distinct observations within one split', d => {
  const s = d.dataset.samples[1], first = d.dataset.samples[0];
  s.skuId = first.skuId; s.packagingVersionId = first.packagingVersionId; s.referenceImageSha256 = first.referenceImageSha256;
  const ext = d.extension.samples[1]; ext.references[0] = structuredClone(d.extension.samples[0].references[0]);
  ext.references.forEach(r => { r.source.skuId = s.skuId; r.source.packagingVersionId = s.packagingVersionId; });
  ext.annotations.forEach(a => a.label.acceptableReferenceIds = ext.references.filter(r => r.view === 'front').map(r => r.id));
}, r => assert.equal(r.splits.development.skuSampleCounts['sku_0000000000000001'], 2));
accept('adjudicated decision can resolve to no_match while keeping original two labels', d => { d.extension.samples[5].adjudication.label = { observedView: 'back', observability: 'observable', conclusion: 'no_match', acceptableReferenceIds: [] }; }, r => { assert.equal(r.samples[5].recommendation.reason, 'DECLARED_NO_MATCH'); assert.equal(r.samples[5].predictions.candidate.outcome, 'wrongMatch'); });
accept('acceptable-ID set order agreement requires no arbitration', d => d.extension.samples[1].annotations[1].label.acceptableReferenceIds.reverse(), r => assert.equal(r.samples[1].truth.acceptableReferenceIds.length, 2));
accept('semantic diagnostics invariant under sample, reference, annotation and acceptable-ID order', d => { d.dataset.samples.reverse(); d.extension.samples.reverse(); for (const s of d.extension.samples) { s.references.reverse(); s.annotations.reverse(); s.annotations.forEach(a => a.label.acceptableReferenceIds.reverse()); } for (const role of ['baseline', 'candidate']) d.predictions[role].samples.reverse(); }, r => { assert.deepEqual(r.samples, original.samples); assert.deepEqual(r.splits, original.splits); });

const negatives = [
  ['UPG02 dataset validation is reused for ownership and labels', d => d.dataset.samples[0].annotations[0].independent = false, 'UPG02_DATASET_INVALID'],
  ['extension dataset ID mismatch', d => d.extension.datasetId = 'dataset_9999999999999999', 'DATASET_BINDING_MISMATCH'],
  ['prediction dataset ID mismatch', d => d.predictions.datasetId = 'dataset_9999999999999999', 'DATASET_BINDING_MISMATCH'],
  ['wrong extension schema', d => d.extension.schemaVersion = 2, 'UNSUPPORTED_SCHEMA_VERSION'],
  ['wrong prediction schema', d => d.predictions.schemaVersion = 2, 'UNSUPPORTED_SCHEMA_VERSION'],
  ['mixed extension provenance', d => d.extension.synthetic = false, 'MIXED_PROVENANCE'],
  ['mixed predictions provenance', d => d.predictions.synthetic = false, 'MIXED_PROVENANCE'],
  ['unsupported strategy version', d => d.extension.policyVersion = 'other', 'UNSUPPORTED_POLICY'],
  ['unsupported strategy hash', d => d.predictions.policySha256 = 'f'.repeat(64), 'UNSUPPORTED_POLICY'],
  ['missing extension sample', d => d.extension.samples.pop(), 'EXTENSION_SAMPLE_SET_MISMATCH'],
  ['extra extension sample', d => d.extension.samples.push(structuredClone(d.extension.samples[0])), 'EXTENSION_SAMPLE_SET_MISMATCH'],
  ['duplicate extension sample', d => d.extension.samples[1].sampleId = d.extension.samples[0].sampleId, 'EXTENSION_SAMPLE_SET_MISMATCH'],
  ['unknown extension sample', d => d.extension.samples[0].sampleId = 'sample_9999999999999999', 'EXTENSION_SAMPLE_SET_MISMATCH'],
  ['original reference cannot be omitted', d => d.extension.samples[1].references.shift(), 'ORIGINAL_REFERENCE_MISSING'],
  ['empty reference set', d => d.extension.samples[0].references = [], 'INVALID_REFERENCE_SET'],
  ['reference set bounded at 16', d => d.extension.samples[0].references = Array(17).fill(d.extension.samples[0].references[0]), 'INVALID_REFERENCE_SET'],
  ['observed cannot be own reference', d => d.extension.samples[0].references[0].imageSha256 = d.dataset.samples[0].observedImageSha256, 'OBSERVED_AS_OWN_REFERENCE'],
  ['reference image crossed holdout split', d => { const r = structuredClone(d.extension.samples[0].references[0]); r.id = 'ref_9999999999999999'; r.imageSha256 = d.dataset.samples[4].referenceImageSha256; d.extension.samples[0].references.push(r); }, 'REFERENCE_IMAGE_SPLIT_LEAK'],
  ['new reference crossed holdout observed role', d => { const r = structuredClone(d.extension.samples[0].references[0]); r.id = 'ref_9999999999999999'; r.imageSha256 = d.dataset.samples[4].observedImageSha256; d.extension.samples[0].references.push(r); }, 'REFERENCE_IMAGE_SPLIT_LEAK'],
  ['two newly added images leak across split', d => { for (const n of [0, 4]) { const r = structuredClone(d.extension.samples[n].references[0]); r.id = `ref_${String(n + 90).padStart(16, '0')}`; r.imageSha256 = 'f'.repeat(64); d.extension.samples[n].references.push(r); } }, 'REFERENCE_IMAGE_SPLIT_LEAK'],
  ['image content reused under different SKU within split', d => { const r = structuredClone(d.extension.samples[0].references[0]); r.id = 'ref_9999999999999999'; r.imageSha256 = d.dataset.samples[1].referenceImageSha256; d.extension.samples[0].references.push(r); }, 'IMAGE_SOURCE_CONFLICT'],
  ['reference ID conflicting metadata', d => d.extension.samples[1].references[0].id = d.extension.samples[0].references[0].id, 'REFERENCE_ID_CONFLICT'],
  ['duplicate reference ID', d => d.extension.samples[1].references[1].id = d.extension.samples[1].references[0].id, 'DUPLICATE_REFERENCE'],
  ['duplicate reference hash', d => d.extension.samples[1].references[1].imageSha256 = d.extension.samples[1].references[0].imageSha256, 'DUPLICATE_REFERENCE'],
  ['reference hash malformed', d => d.extension.samples[0].references[0].imageSha256 = 'secret-personal-value', 'INVALID_REFERENCE_HASH'],
  ['arbitrary view not supported', d => d.extension.samples[0].references[0].view = 'secret-angle', 'INVALID_REFERENCE_VIEW'],
  ['reference state unknown', d => d.extension.samples[0].references[0].status = 'expired', 'INVALID_REFERENCE_STATUS'],
  ['same view annotator', d => d.extension.samples[0].annotations[1].annotatorId = d.extension.samples[0].annotations[0].annotatorId, 'VIEW_ANNOTATORS_IDENTICAL'],
  ['view labeling not independent', d => d.extension.samples[0].annotations[0].independent = false, 'VIEW_ANNOTATION_NOT_INDEPENDENT_BLIND'],
  ['view labeling not blind', d => d.extension.samples[0].annotations[0].blind = false, 'VIEW_ANNOTATION_NOT_INDEPENDENT_BLIND'],
  ['only one view annotation', d => d.extension.samples[0].annotations.pop(), 'TWO_VIEW_ANNOTATIONS_REQUIRED'],
  ['missing required adjudication', d => d.extension.samples[5].adjudication = null, 'VIEW_ADJUDICATION_REQUIRED'],
  ['arbitration not third person', d => d.extension.samples[5].adjudication.adjudicatorId = d.extension.samples[5].annotations[0].annotatorId, 'VIEW_ADJUDICATOR_NOT_THIRD_PERSON'],
  ['unexpected adjudication removes original agreement', d => d.extension.samples[0].adjudication = d.extension.samples[5].adjudication, 'UNNECESSARY_VIEW_ADJUDICATION'],
  ['unknown acceptable reference', d => d.extension.samples[0].annotations[0].label.acceptableReferenceIds = ['ref_9999999999999999'], 'INVALID_ACCEPTABLE_REFERENCE'],
  ['wrong-view acceptable reference', d => d.extension.samples[1].annotations[0].label.acceptableReferenceIds = [d.extension.samples[1].references[2].id], 'INVALID_ACCEPTABLE_REFERENCE'],
  ['invalidated reference cannot be acceptable', d => d.extension.samples[0].references[0].status = 'invalidated', 'INVALID_ACCEPTABLE_REFERENCE'],
  ['partial reference cannot be acceptable', d => d.extension.samples[0].references[0].observability = 'partial', 'INVALID_ACCEPTABLE_REFERENCE'],
  ['unknown view cannot assert compatible truth', d => { d.extension.samples[2].annotations[0].label.conclusion = 'compatible'; }, 'UNCONFIRMABLE_VIEW_TRUTH'],
  ['partial observed view cannot assert compatible truth', d => { d.extension.samples[6].annotations[0].label.conclusion = 'compatible'; }, 'UNCONFIRMABLE_VIEW_TRUTH'],
  ['unknown view cannot assert no_match truth', d => d.extension.samples[2].annotations[0].label.conclusion = 'no_match', 'UNCONFIRMABLE_NO_MATCH_TRUTH'],
  ['duplicate acceptable reference', d => d.extension.samples[0].annotations[0].label.acceptableReferenceIds.push(d.extension.samples[0].references[0].id), 'INVALID_ACCEPTABLE_REFERENCE'],
  ['run ID not independent', d => d.predictions.candidate.metadata.runId = d.predictions.baseline.metadata.runId, 'RUN_IDS_MUST_DIFFER'],
  ['abbreviated code SHA not accepted', d => d.predictions.baseline.metadata.codeSha = '1234567', 'INVALID_RUN_CODE_SHA'],
  ['unidentified model cannot be guessed', d => d.predictions.candidate.metadata.model.modelId = 'unknown', 'INVALID_MODEL_ID'],
  ['unidentified prompt cannot be guessed', d => d.predictions.baseline.metadata.promptVersion = 'unknown', 'INVALID_PROMPT_VERSION'],
  ['run policy hash malformed', d => d.predictions.candidate.metadata.policySha256 = 'short', 'INVALID_RUN_POLICY_HASH'],
];
for (const [name, mutate, code] of negatives) reject(name, mutate, code);
for (const k of ['workspaceId', 'skuId', 'packagingVersionId', 'authorizationId']) reject(`reference source ${k} mismatch`, d => d.extension.samples[0].references[0].source[k] = 'other', 'REFERENCE_SOURCE_MISMATCH');
for (const role of ['baseline', 'candidate']) {
  reject(`${role} missing prediction cannot vanish from denominator`, d => d.predictions[role].samples.pop(), 'PREDICTION_SAMPLE_SET_MISMATCH');
  reject(`${role} extra prediction`, d => d.predictions[role].samples.push(d.predictions[role].samples[0]), 'PREDICTION_SAMPLE_SET_MISMATCH');
  reject(`${role} duplicate prediction`, d => d.predictions[role].samples[1].sampleId = d.predictions[role].samples[0].sampleId, 'PREDICTION_SAMPLE_SET_MISMATCH');
  reject(`${role} unknown sample prediction`, d => d.predictions[role].samples[0].sampleId = 'sample_9999999999999999', 'PREDICTION_SAMPLE_SET_MISMATCH');
  reject(`${role} cross-SKU reference prediction`, d => { d.predictions[role].samples[0].selection = d.extension.samples[1].references[0].id; d.predictions[role].samples[0].matchDecision = 'MATCH'; }, 'INVALID_PREDICTION_REFERENCE');
  reject(`${role} unknown reference prediction`, d => { d.predictions[role].samples[0].selection = 'ref_9999999999999999'; d.predictions[role].samples[0].matchDecision = 'MATCH'; }, 'INVALID_PREDICTION_REFERENCE');
  reject(`${role} arbitrary match decision`, d => d.predictions[role].samples[0].matchDecision = 'PASS', 'INVALID_MATCH_DECISION');
  reject(`${role} arbitrary quality decision`, d => d.predictions[role].samples[0].qualityDecision = 'PASS', 'INVALID_QUALITY_DECISION');
  reject(`${role} invalidated reference prediction`, d => { d.predictions[role].samples[7] = { sampleId: d.dataset.samples[7].id, selection: d.extension.samples[7].references[0].id, matchDecision: 'MATCH', qualityDecision: 'BLOCK' }; }, 'INVALID_PREDICTION_REFERENCE');
  reject(`${role} unsupported REVIEW/ALLOW`, d => d.predictions[role].samples[7].qualityDecision = 'ALLOW', 'UNSUPPORTED_PREDICTION_COMBINATION');
  reject(`${role} MATCH without selection`, d => { d.predictions[role].samples[0].matchDecision = 'MATCH'; d.predictions[role].samples[0].selection = null; }, 'MATCH_REQUIRES_SELECTION');
  reject(`${role} NO_MATCH with selection`, d => { d.predictions[role].samples[0].matchDecision = 'NO_MATCH'; d.predictions[role].samples[0].qualityDecision = 'BLOCK'; d.predictions[role].samples[0].selection = d.extension.samples[0].references[0].id; }, 'NO_MATCH_HAS_SELECTION');
}
for (const [name, path, code] of [
  ['extension', d => d.extension, 'INVALID_EXTENSION_FIELDS'], ['prediction root', d => d.predictions, 'INVALID_PREDICTION_FIELDS'], ['view sample', d => d.extension.samples[0], 'INVALID_EXTENSION_SAMPLE_FIELDS'], ['reference', d => d.extension.samples[0].references[0], 'INVALID_REFERENCE_FIELDS'], ['reference source', d => d.extension.samples[0].references[0].source, 'INVALID_REFERENCE_SOURCE_FIELDS'], ['view annotation', d => d.extension.samples[0].annotations[0], 'INVALID_VIEW_ANNOTATION_FIELDS'], ['view truth', d => d.extension.samples[0].annotations[0].label, 'INVALID_VIEW_LABEL_FIELDS'], ['adjudication', d => d.extension.samples[5].adjudication, 'VIEW_ADJUDICATION_REQUIRED'], ['run', d => d.predictions.baseline, 'INVALID_RUN_FIELDS'], ['run metadata', d => d.predictions.baseline.metadata, 'INVALID_RUN_METADATA_FIELDS'], ['model metadata', d => d.predictions.baseline.metadata.model, 'INVALID_MODEL_METADATA'], ['prediction sample', d => d.predictions.baseline.samples[0], 'INVALID_PREDICTION_SAMPLE_FIELDS'],
]) {
  reject(`${name} unknown fields rejected (including qualityEvidence override)`, d => path(d).qualityEvidence = true, code);
  for (const key of Object.keys(path(fixture()))) reject(`${name} missing ${key}`, d => { delete path(d)[key]; }, key === 'sampleId' ? name === 'view sample' ? 'EXTENSION_SAMPLE_SET_MISMATCH' : 'PREDICTION_SAMPLE_SET_MISMATCH' : code);
}
test('raw dataset whitespace tampering invalidates binding even if parsed meaning is same', () => assert.throws(() => evaluate(Buffer.concat([raw[0], Buffer.from(' ')]), raw[1], raw[2]), /DATASET_BINDING_MISMATCH/));
test('raw view whitespace tampering invalidates prediction binding', () => assert.throws(() => evaluate(raw[0], Buffer.concat([raw[1], Buffer.from(' ')]), raw[2]), /EXTENSION_BINDING_MISMATCH/));
test('wrong dataset byte hash is rejected', () => { const p = JSON.parse(raw[2]); p.datasetSha256 = 'f'.repeat(64); assert.throws(() => evaluate(raw[0], raw[1], Buffer.from(JSON.stringify(p))), /DATASET_BINDING_MISMATCH/); });
test('duplicate JSON keys including escaped aliases are rejected before overwrite', () => { const duplicate = Buffer.from(raw[1].toString().replace('"schemaVersion": 1', '"schemaVersion": 1, "schemaVersion": 1')); assert.throws(() => evaluate(raw[0], duplicate, raw[2]), /DUPLICATE_JSON_FIELD/); const escaped = Buffer.from(raw[0].toString().replace('"synthetic": true', '"synthetic": true, "synth\\u0065tic": true')); assert.throws(() => evaluate(escaped, raw[1], raw[2]), /DUPLICATE_JSON_FIELD/); });

const cli = fileURLToPath(new URL('./evaluate-reference-view-shadow.mjs', import.meta.url));
const root = await mkdtemp(join(tmpdir(), 'pairvu-reference-view-shadow-'));
let invocations = 0;
function command(args, exit, status, entry = cli) {
  const r = spawnSync(process.execPath, [entry, ...args], { cwd: root, encoding: 'utf8' }); invocations++;
  assert.equal(r.status, exit, r.stderr || r.stdout); assert.equal(r.stderr, ''); const report = JSON.parse(r.stdout); assert.equal(report.status, status); assert.equal(report.qualityEvidence, false); assert.equal(report.realQualityStatus, 'BLOCKED'); return report;
}
try {
  const paths = ['dataset.json', 'views.json', 'predictions.json'].map(n => join(root, n));
  for (let n = 0; n < 3; n++) await writeFile(paths[n], raw[n]);
  const args = ['--dataset', paths[0], '--views', paths[1], '--predictions', paths[2]];
  const fileLink = join(root, 'alias.mjs'), dirLink = join(root, 'scripts-alias'); await symlink(cli, fileLink); await symlink(dirname(cli), dirLink, 'dir');
  const before = await readdir(root);
  for (const entry of [cli, fileLink, join(dirLink, basename(cli))]) {
    test('CLI entry ' + (entry === cli ? 'direct' : entry === fileLink ? 'file symlink' : 'parent symlink'), () => { const report = command(args, 0, 'VALID', entry); assert.deepEqual(report, original); command([], 2, 'BLOCKED', entry); command(['--network'], 64, 'INVALID_USAGE', entry); });
  }
  await writeFile(paths[0], '{}');
  for (const entry of [fileLink, join(dirLink, basename(cli))]) test('invalid input executes through linked CLI ' + basename(entry), () => { const report = command(args, 1, 'INVALID_INPUT', entry); assert.equal(report.reason, 'UPG02_DATASET_INVALID'); });
  await writeFile(paths[0], raw[0]);
  test('missing file blocks without path or content echo', () => { const report = command(['--dataset', '/absent/secret-person@example.invalid', ...args.slice(2)], 2, 'BLOCKED'); assert.doesNotMatch(JSON.stringify(report), /secret-person/); });
  test('partial flags invalid and do not fall back to fixtures', () => command(args.slice(0, 4), 64, 'INVALID_USAGE'));
  test('directory input blocks', () => command(['--dataset', root, ...args.slice(2)], 2, 'BLOCKED'));
  for (const malformed of ['{secret-person@example.invalid', 'null', '[]', '{}']) {
    await writeFile(paths[0], malformed);
    test('invalid JSON/UPG02 input sanitized ' + malformed.slice(0, 1), () => { const report = command(args, 1, 'INVALID_INPUT'); assert.doesNotMatch(JSON.stringify(report), /secret-person/); });
  }
  await writeFile(paths[0], raw[0]);
  const sensitive = structuredClone(input); sensitive.extension.samples[0].references[0].imageSha256 = 'secret-person@example.invalid'; const bad = bind(sensitive); await writeFile(paths[1], bad[1]); await writeFile(paths[2], bad[2]);
  test('semantic errors never echo arbitrary input values', () => { const report = command(args, 1, 'INVALID_INPUT'); assert.equal(report.reason, 'INVALID_REFERENCE_HASH'); assert.doesNotMatch(JSON.stringify(report), /secret-person/); });
  for (let n = 0; n < 3; n++) await writeFile(paths[n], raw[n]);
  command(args, 0, 'VALID');
  const afterBytes = await Promise.all(paths.map(path => readFile(path))), afterNames = await readdir(root);
  test('CLI creates no files and preserves input byte contents', () => { for (let n = 0; n < 3; n++) assert.deepEqual(afterBytes[n], raw[n]); assert.deepEqual(afterNames, before); });
  const help = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' }); invocations++;
  test('help states engineering/real-quality distinction and exit codes', () => { assert.equal(help.status, 0); assert.match(help.stdout, /real quality still BLOCKED/); assert.match(help.stdout, /64: INVALID_USAGE/); });
} finally { await rm(root, { recursive: true, force: true }); }
const fixtureRoot = fileURLToPath(new URL('../fixtures/reference-view-shadow/synthetic/', import.meta.url));
const committed = await Promise.all(['dataset.json', 'views.json', 'predictions.json'].map(n => readFile(join(fixtureRoot, n))));
test('explicit committed fixtures replay exactly, without overwriting them', () => assert.deepEqual(evaluate(...committed), original));

// Opt-in exact boundary regression. Large generated JSON and actual CLI stdout remain
// in /tmp; the small proof (counts, byte hashes, statuses) is the only delivery artifact.
if (process.argv.includes('--count-boundary')) {
  const boundaryRoot = await mkdtemp(join(tmpdir(), 'pairvu-upg07a-count-boundary-'));
  const boundaryProof = { unitId: 'UPG-07A', findingId: 'UPG07A-QA-01', qualityEvidence: false, realQualityStatus: 'BLOCKED', generatedInputsDirectory: boundaryRoot, cases: [] };
  for (const count of [100000, 100001]) {
    const seed = fixture(), d = seed.dataset, v = seed.extension, p = seed.predictions;
    const originalSample = structuredClone(d.samples[0]), originalView = structuredClone(v.samples[0]);
    d.samples = []; v.samples = []; p.baseline.samples = []; p.candidate.samples = [];
    const validPrediction = { selection: originalView.references[0].id, matchDecision: 'MATCH', qualityDecision: 'ALLOW' };
    for (let n = 1; n <= count; n++) {
      const sampleId = `sample_${n.toString(16).padStart(16, '0')}`;
      // All observations differ; one consistently owned reference is legitimately reused.
      d.samples.push({ ...originalSample, id: sampleId, observedImageSha256: (n + 1000).toString(16).padStart(64, '0') });
      v.samples.push({ ...originalView, sampleId });
      for (const role of ['baseline', 'candidate']) p[role].samples.push({ sampleId, ...validPrediction });
    }
    const datasetBytes = Buffer.from(JSON.stringify(d));
    v.datasetSha256 = p.datasetSha256 = sha256(datasetBytes);
    const viewBytes = Buffer.from(JSON.stringify(v)); p.extensionSha256 = sha256(viewBytes);
    const predictionBytes = Buffer.from(JSON.stringify(p));
    const caseDirectory = join(boundaryRoot, String(count));
    await import('node:fs/promises').then(fs => fs.mkdir(caseDirectory));
    const caseBytes = [datasetBytes, viewBytes, predictionBytes], names = ['dataset.json', 'views.json', 'predictions.json'];
    const paths = names.map(name => join(caseDirectory, name));
    for (let n = 0; n < paths.length; n++) await writeFile(paths[n], caseBytes[n]);
    const proof = { sampleCount: count, inputCounts: { dataset: d.samples.length, extension: v.samples.length, baseline: p.baseline.samples.length, candidate: p.candidate.samples.length }, rawInputs: caseBytes.map((b, n) => ({ file: names[n], bytes: b.length, sha256: sha256(b) })) };
    const started = Date.now();
    test(`actual evaluator exact ${count} sample boundary`, () => {
      if (count === 100000) {
        const report = evaluate(...caseBytes);
        assert.equal(report.status, 'VALID'); assert.equal(report.samples.length, count);
        assert.equal(report.splits.development.sampleCount, count);
        for (const role of ['baseline', 'candidate']) assert.equal(report.splits.development.runs[role].sampleDenominator, count);
        assert.equal(report.qualityEvidence, false); assert.equal(report.realQualityStatus, 'BLOCKED');
        proof.evaluator = { status: report.status, reportedSampleCount: report.samples.length, developmentCount: report.splits.development.sampleCount, baselineDenominator: report.splits.development.runs.baseline.sampleDenominator, candidateDenominator: report.splits.development.runs.candidate.sampleDenominator, qualityEvidence: report.qualityEvidence, realQualityStatus: report.realQualityStatus };
      } else {
        assert.throws(() => evaluate(...caseBytes), error => error.message === 'EXTENSION_SAMPLE_SET_MISMATCH');
        proof.evaluator = { status: 'REJECTED', reason: 'EXTENSION_SAMPLE_SET_MISMATCH' };
      }
    });
    proof.evaluatorElapsedMs = Date.now() - started;
    // File descriptors keep the genuine full CLI stdout out of spawnSync's buffers.
    const fs = await import('node:fs');
    const stdoutPath = join(caseDirectory, 'cli-stdout.json'), stderrPath = join(caseDirectory, 'cli-stderr.txt');
    const out = fs.openSync(stdoutPath, 'w'), err = fs.openSync(stderrPath, 'w');
    let execution;
    try { execution = spawnSync(process.execPath, [cli, '--dataset', paths[0], '--views', paths[1], '--predictions', paths[2]], { stdio: ['ignore', out, err], timeout: 60000 }); invocations++; }
    finally { fs.closeSync(out); fs.closeSync(err); }
    const stdout = await readFile(stdoutPath), stderr = await readFile(stderrPath, 'utf8');
    const actual = JSON.parse(stdout.toString('utf8'));
    test(`actual CLI exact ${count} sample boundary`, () => {
      assert.equal(execution.error, undefined); assert.equal(stderr, ''); assert.equal(execution.status, count === 100000 ? 0 : 1);
      assert.equal(actual.status, count === 100000 ? 'VALID' : 'INVALID_INPUT');
      assert.equal(actual.qualityEvidence, false); assert.equal(actual.realQualityStatus, 'BLOCKED');
      if (count === 100000) { assert.equal(actual.samples.length, count); assert.equal(actual.splits.development.sampleCount, count); for (const role of ['baseline', 'candidate']) assert.equal(actual.splits.development.runs[role].sampleDenominator, count); }
      else assert.equal(actual.reason, 'EXTENSION_SAMPLE_SET_MISMATCH');
    });
    proof.cli = { exitCode: execution.status, status: actual.status, reason: actual.reason || null, reportedSampleCount: actual.samples?.length ?? null, qualityEvidence: actual.qualityEvidence, realQualityStatus: actual.realQualityStatus, stdoutFile: stdoutPath, stdoutBytes: stdout.length, stdoutSha256: createHash('sha256').update(stdout).digest('hex'), stderrFile: stderrPath };
    boundaryProof.cases.push(proof);
  }
  await writeFile(join(boundaryRoot, 'boundary-proof.json'), JSON.stringify(boundaryProof, null, 2) + '\n');
  console.log(JSON.stringify({ boundaryProof }, null, 2));
}
console.log(JSON.stringify({ status: 'PASS', unitId: 'UPG-07A', qualityEvidence: false, realQualityStatus: 'BLOCKED', checkCount: checks.length, cliInvocations: invocations, checks }, null, 2));
