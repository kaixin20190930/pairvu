#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ID = { workspace: /^ws_[a-f0-9]{16}$/, sku: /^sku_[a-f0-9]{16}$/, packaging: /^pkg_[a-f0-9]{16}$/, annotator: /^ann_[a-f0-9]{16}$/, sample: /^sample_[a-f0-9]{16}$/, authorization: /^auth_[a-f0-9]{16}$/, dataset: /^dataset_[a-f0-9]{16}$/ };
const HASH = /^[a-f0-9]{64}$/;
const fail = message => { throw new Error(message); };
const check = (condition, message) => { if (!condition) fail(message); };
function object(value, keys, location) {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), `${location}: expected object`);
  check(Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)), `${location}: missing or unknown fields`);
}
function id(value, type, location) { check(typeof value === 'string' && ID[type].test(value), `${location}: invalid anonymous ${type} ID`); }
function one(value, values, location) { check(values.includes(value), `${location}: invalid value`); }
function unique(set, value, location) { check(!set.has(value), `${location}: duplicate`); set.add(value); }
const labelKeys = ['verdict', 'defectType', 'severity', 'observability'];
function label(value, location) {
  object(value, labelKeys, location);
  one(value.verdict, ['match', 'mismatch', 'unobservable'], location);
  one(value.defectType, ['none', 'identity', 'packaging', 'text', 'color', 'other', 'unknown'], location);
  one(value.severity, ['none', 'minor', 'major', 'critical', 'unknown'], location);
  one(value.observability, ['observable', 'partial', 'unobservable'], location);
  if (value.verdict === 'match') check(value.defectType === 'none' && value.severity === 'none' && value.observability === 'observable', `${location}: match must be fully observable with no defect`);
  if (value.verdict === 'mismatch') check(!['none', 'unknown'].includes(value.defectType) && ['minor', 'major', 'critical'].includes(value.severity) && value.observability !== 'unobservable', `${location}: mismatch requires visible defect and severity`);
  if (value.verdict === 'unobservable') check(value.defectType === 'unknown' && value.severity === 'unknown' && value.observability !== 'observable', `${location}: unknown truth must not imply a match or severity`);
}
const equalLabel = (a, b) => labelKeys.every(key => a[key] === b[key]);

/** Pure structural validation. No image access, model execution, or quality scoring. */
export function validateDataset(data) {
  object(data, ['schemaVersion', 'datasetId', 'synthetic', 'authorizationRecords', 'samples'], 'dataset');
  check(data.schemaVersion === 1 && typeof data.synthetic === 'boolean', 'dataset: invalid schemaVersion/synthetic');
  id(data.datasetId, 'dataset', 'dataset');
  check(Array.isArray(data.authorizationRecords) && data.authorizationRecords.length > 0, 'authorizationRecords: required nonempty array');
  check(Array.isArray(data.samples) && data.samples.length > 0, 'samples: required nonempty array');
  const auths = new Map();
  for (const [i, auth] of data.authorizationRecords.entries()) {
    const at = `authorizationRecords[${i}]`;
    object(auth, ['id', 'workspaceId', 'recordRef', 'permittedUse', 'status'], at);
    id(auth.id, 'authorization', at); id(auth.workspaceId, 'workspace', at);
    check(!auths.has(auth.id), `${at}: duplicate authorization`);
    check(typeof auth.recordRef === 'string' && (data.synthetic ? /^synthetic:[a-f0-9]{32}$/ : /^record:[a-f0-9]{32}$/).test(auth.recordRef), `${at}: invalid authorization record reference`);
    check(auth.permittedUse === 'offline_evaluation' && auth.status === 'granted', `${at}: authorization not granted for offline evaluation`);
    auths.set(auth.id, auth);
  }
  const sampleIds = new Set(), observedHashes = new Set(), pairs = new Set(), skuSplits = new Map(), imageSplits = new Map(), usedAuths = new Set();
  const counts = { development: 0, holdout: 0, adjudicated: 0 };
  for (const [i, sample] of data.samples.entries()) {
    const at = `samples[${i}]`;
    object(sample, ['id', 'synthetic', 'workspaceId', 'skuId', 'packagingVersionId', 'authorizationId', 'split', 'referenceImageSha256', 'observedImageSha256', 'annotations', 'adjudication'], at);
    id(sample.id, 'sample', at); id(sample.workspaceId, 'workspace', at); id(sample.skuId, 'sku', at); id(sample.packagingVersionId, 'packaging', at); id(sample.authorizationId, 'authorization', at);
    check(sample.synthetic === data.synthetic, `${at}: mixed synthetic and real provenance`);
    unique(sampleIds, sample.id, `${at}.id`);
    one(sample.split, ['development', 'holdout'], `${at}.split`);
    const auth = auths.get(sample.authorizationId);
    check(auth && auth.workspaceId === sample.workspaceId, `${at}: missing or wrong-workspace authorization`); usedAuths.add(sample.authorizationId);
    for (const key of ['referenceImageSha256', 'observedImageSha256']) {
      check(typeof sample[key] === 'string' && HASH.test(sample[key]), `${at}.${key}: invalid SHA-256`);
      check(!imageSplits.has(sample[key]) || imageSplits.get(sample[key]) === sample.split, `${at}: image content leaks across splits`); imageSplits.set(sample[key], sample.split);
    }
    check(sample.referenceImageSha256 !== sample.observedImageSha256, `${at}: reference and observed image must differ`);
    unique(observedHashes, sample.observedImageSha256, `${at}.observedImageSha256`);
    unique(pairs, [sample.referenceImageSha256, sample.observedImageSha256].sort().join(':'), `${at}.imagePair`);
    check(!skuSplits.has(sample.skuId) || skuSplits.get(sample.skuId) === sample.split, `${at}: SKU leaks across splits (including packaging versions/workspaces)`); skuSplits.set(sample.skuId, sample.split);
    check(Array.isArray(sample.annotations) && sample.annotations.length === 2, `${at}: exactly two independent annotations required`);
    for (const [j, annotation] of sample.annotations.entries()) {
      object(annotation, ['annotatorId', 'independent', 'label'], `${at}.annotations[${j}]`);
      id(annotation.annotatorId, 'annotator', at); check(annotation.independent === true, `${at}: annotation independence must be attested`); label(annotation.label, at);
    }
    const [a, b] = sample.annotations;
    check(a.annotatorId !== b.annotatorId, `${at}: annotators must differ`);
    if (equalLabel(a.label, b.label)) check(sample.adjudication === null, `${at}: agreement must preserve original labels without adjudication`);
    else {
      const adj = sample.adjudication;
      object(adj, ['adjudicatorId', 'reason', 'label'], `${at}.adjudication`); id(adj.adjudicatorId, 'annotator', at);
      check(![a.annotatorId, b.annotatorId].includes(adj.adjudicatorId), `${at}: adjudicator must be a third person`);
      one(adj.reason, ['identity_resolution', 'packaging_resolution', 'text_resolution', 'color_resolution', 'severity_resolution', 'observability_resolution', 'multiple_disagreements'], `${at}.adjudication.reason`);
      label(adj.label, `${at}.adjudication.label`); counts.adjudicated++;
    }
    counts[sample.split]++;
  }
  check(usedAuths.size === auths.size, 'authorizationRecords: unused records forbidden');
  return { status: data.synthetic ? 'VALID_SYNTHETIC' : 'VALID_REAL_INPUT', schemaVersion: 1, datasetId: data.datasetId, synthetic: data.synthetic, sampleCount: data.samples.length, splits: counts, qualityEvidence: false, message: data.synthetic ? 'Synthetic fixture validates tooling only; real evaluation remains BLOCKED pending authorized real data and independent review.' : 'Input structure is valid; authorization, independent human labels, image integrity and benchmark quality remain unverified.' };
}
export async function main(args) {
  if (args.length === 1 && args[0] === '--help') {
    console.log('Usage: node scripts/verify-upgrade-dataset.mjs --input FILE\nRead-only offline JSON validation. Exit 0: structurally valid; 1: INVALID_INPUT; 2: BLOCKED (missing/unreadable input); 64: invalid CLI. No default fixture or benchmark score.'); return 0;
  }
  if (args.length === 0) { console.log(JSON.stringify({ status: 'BLOCKED', reason: 'Real input not supplied. Provide --input FILE; synthetic fixtures are tooling tests only.', qualityEvidence: false })); return 2; }
  if (args.length !== 2 || args[0] !== '--input' || !args[1] || args[1].startsWith('--')) { console.log(JSON.stringify({ status: 'INVALID_USAGE', reason: 'Expected --input FILE or --help' })); return 64; }
  let bytes;
  try { bytes = await readFile(resolve(args[1]), 'utf8'); }
  catch (error) { console.log(JSON.stringify({ status: 'BLOCKED', reason: 'Input unavailable; no validation performed.', code: error.code || 'READ_ERROR', qualityEvidence: false })); return 2; }
  try { console.log(JSON.stringify(validateDataset(JSON.parse(bytes)), null, 2)); return 0; }
  catch (error) { console.log(JSON.stringify({ status: 'INVALID_INPUT', reason: error.message, qualityEvidence: false })); return 1; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = await main(process.argv.slice(2));
