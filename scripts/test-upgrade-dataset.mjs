#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm, readdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateDataset } from './verify-upgrade-dataset.mjs';
const fixture = fileURLToPath(new URL('../fixtures/upgrade-dataset/synthetic-valid.json', import.meta.url));
const cli = fileURLToPath(new URL('./verify-upgrade-dataset.mjs', import.meta.url));
const original = await readFile(fixture, 'utf8'), valid = JSON.parse(original);
let checks = 0;
function reject(name, mutate) {
  const input = structuredClone(valid); mutate(input);
  assert.throws(() => validateDataset(input), undefined, name); checks++;
}
function accept(name, mutate) { const input = structuredClone(valid); mutate(input); assert.doesNotThrow(() => validateDataset(input), name); checks++; }
assert.equal(validateDataset(valid).status, 'VALID_SYNTHETIC'); assert.equal(validateDataset(valid).qualityEvidence, false); checks++;
accept('same SKU and reference may be reused within one split for distinct observations', d => { d.samples[2].skuId = d.samples[1].skuId; d.samples[2].referenceImageSha256 = d.samples[1].referenceImageSha256; });
accept('observable mismatch severity', d => { d.samples[1].adjudication.label.severity = 'critical'; });
// Exercise real-schema parsing with generated metadata only; this is NOT real data/evidence.
const simulatedReal = structuredClone(valid); simulatedReal.synthetic = false; simulatedReal.samples.forEach(s => s.synthetic = false); simulatedReal.authorizationRecords[0].recordRef = 'record:' + '1'.repeat(32);
assert.equal(validateDataset(simulatedReal).status, 'VALID_REAL_INPUT'); assert.equal(validateDataset(simulatedReal).qualityEvidence, false); checks++;
for (const key of Object.keys(valid)) reject(`missing dataset ${key}`, d => { delete d[key]; });
for (const key of Object.keys(valid.samples[0])) reject(`missing sample ${key}`, d => { delete d.samples[0][key]; });
for (const key of Object.keys(valid.authorizationRecords[0])) reject(`missing authorization ${key}`, d => { delete d.authorizationRecords[0][key]; });
for (const key of Object.keys(valid.samples[0].annotations[0])) reject(`missing annotation ${key}`, d => { delete d.samples[0].annotations[0][key]; });
for (const key of Object.keys(valid.samples[0].annotations[0].label)) reject(`missing label ${key}`, d => { delete d.samples[0].annotations[0].label[key]; });
for (const key of Object.keys(valid.samples[1].adjudication)) reject(`missing adjudication ${key}`, d => { delete d.samples[1].adjudication[key]; });
const negatives = [
  ['schema version', d => d.schemaVersion = 2], ['empty samples', d => d.samples = []], ['non-array samples', d => d.samples = {}], ['null sample', d => d.samples[0] = null],
  ['unknown dataset field', d => d.customerEmail = 'forbidden'], ['unknown sample field', d => d.samples[0].url = 'forbidden'], ['unknown label field', d => d.samples[0].annotations[0].label.score = 1],
  ['empty authorizations', d => d.authorizationRecords = []], ['unknown auth', d => d.samples[0].authorizationId = 'auth_9999999999999999'], ['authorization workspace', d => d.authorizationRecords[0].workspaceId = 'ws_9999999999999999'], ['authorization revoked', d => d.authorizationRecords[0].status = 'revoked'], ['authorization scope', d => d.authorizationRecords[0].permittedUse = 'training'], ['authorization ref', d => d.authorizationRecords[0].recordRef = ''], ['synthetic claims real authorization', d => d.authorizationRecords[0].recordRef = 'record:' + '1'.repeat(32)], ['duplicate auth', d => d.authorizationRecords.push(d.authorizationRecords[0])], ['unused auth', d => d.authorizationRecords.push({ ...d.authorizationRecords[0], id: 'auth_9999999999999999' })],
  ['nonboolean synthetic', d => d.synthetic = 'true'], ['mixed provenance', d => d.samples[0].synthetic = false], ['workspace personal name', d => d.samples[0].workspaceId = 'customer@example.invalid'], ['noncanonical sku', d => d.samples[0].skuId = 'SKU-A'], ['blank packaging version', d => d.samples[0].packagingVersionId = ''], ['nonstring hash', d => d.samples[0].observedImageSha256 = 5], ['invalid hash', d => d.samples[0].referenceImageSha256 = 'short'], ['same input images', d => d.samples[0].observedImageSha256 = d.samples[0].referenceImageSha256],
  ['duplicate sample', d => d.samples.push(structuredClone(d.samples[0]))], ['duplicate sample id', d => d.samples[1].id = d.samples[0].id], ['duplicate observed content within split', d => d.samples[2].observedImageSha256 = d.samples[1].observedImageSha256], ['reversed pair', d => { d.samples[2].referenceImageSha256 = d.samples[1].observedImageSha256; d.samples[2].observedImageSha256 = d.samples[1].referenceImageSha256; }],
  ['same sku across split with different packaging', d => { d.samples[1].skuId = d.samples[0].skuId; d.samples[1].packagingVersionId = 'pkg_9999999999999999'; }], ['cross-workspace sku leakage', d => { const s = d.samples[1]; s.skuId = d.samples[0].skuId; s.workspaceId = 'ws_9999999999999999'; s.authorizationId = 'auth_9999999999999999'; d.authorizationRecords.push({ ...d.authorizationRecords[0], id: s.authorizationId, workspaceId: s.workspaceId }); }],
  ['reference image leakage', d => d.samples[1].referenceImageSha256 = d.samples[0].referenceImageSha256], ['cross-role image leakage', d => d.samples[1].referenceImageSha256 = d.samples[0].observedImageSha256], ['invalid split', d => d.samples[0].split = 'test'],
  ['one annotator', d => d.samples[0].annotations.pop()], ['three annotators', d => d.samples[0].annotations.push(d.samples[0].annotations[0])], ['same annotator', d => d.samples[0].annotations[1].annotatorId = d.samples[0].annotations[0].annotatorId], ['not independent', d => d.samples[0].annotations[0].independent = false], ['missing arbitration', d => d.samples[1].adjudication = null], ['arbitrator is annotator', d => d.samples[1].adjudication.adjudicatorId = d.samples[1].annotations[0].annotatorId], ['invalid arbitration reason', d => d.samples[1].adjudication.reason = ''], ['unnecessary arbitration', d => d.samples[0].adjudication = d.samples[1].adjudication],
  ['invalid verdict', d => d.samples[0].annotations[0].label.verdict = 'PASS'], ['invalid defect', d => d.samples[0].annotations[0].label.defectType = 'fake'], ['invalid severity', d => d.samples[0].annotations[0].label.severity = 4], ['invalid visibility', d => d.samples[0].annotations[0].label.observability = 'maybe'], ['match with partial visibility', d => d.samples[0].annotations[0].label.observability = 'partial'], ['mismatch no severity', d => d.samples[1].adjudication.label.severity = 'none'], ['invisible mismatch', d => d.samples[1].adjudication.label.observability = 'unobservable'], ['unknown with known severity', d => d.samples[2].annotations[0].label.severity = 'critical'], ['fully observable unknown', d => d.samples[2].annotations[0].label.observability = 'observable'],
];
for (const [name, mutate] of negatives) reject(name, mutate);
const root = await mkdtemp(join(tmpdir(), 'pairvu-upgrade-dataset-'));
function command(args, exit, status, entry = cli) { const r = spawnSync(process.execPath, [entry, ...args], { encoding: 'utf8', cwd: root }); assert.equal(r.status, exit, r.stderr || r.stdout); const output = JSON.parse(r.stdout); assert.equal(output.status, status); checks++; return output; }
try {
  const input = join(root, 'input.json'); await writeFile(input, original);
  const before = await readdir(root);
  const result = command(['--input', input], 0, 'VALID_SYNTHETIC'); assert.equal(result.qualityEvidence, false); assert.equal(result.sampleCount, 3); assert.equal(result.splits.adjudicated, 1);
  assert.equal(await readFile(input, 'utf8'), original); assert.deepEqual(await readdir(root), before); checks++;
  command([], 2, 'BLOCKED'); command(['--input', join(root, 'absent.json')], 2, 'BLOCKED'); command(['--input', root], 2, 'BLOCKED'); command(['--network'], 64, 'INVALID_USAGE'); command(['--input', input, '--extra'], 64, 'INVALID_USAGE');
  for (const bytes of ['', '{broken', 'null', '[]', '{}', JSON.stringify({ ...valid, synthetic: false })]) { await writeFile(input, bytes); command(['--input', input], 1, 'INVALID_INPUT'); }
  // Explicit aliases reproduce both a linked script and /tmp-style parent-directory links.
  const fileAlias = join(root, 'validator-alias.mjs'), directoryAlias = join(root, 'scripts-alias');
  await symlink(cli, fileAlias, 'file'); await symlink(dirname(cli), directoryAlias, 'dir');
  for (const entry of [fileAlias, join(directoryAlias, basename(cli))]) {
    command([], 2, 'BLOCKED', entry);
    await writeFile(input, original); command(['--input', input], 0, 'VALID_SYNTHETIC', entry);
    await writeFile(input, '{}'); command(['--input', input], 1, 'INVALID_INPUT', entry);
  }
  const help = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' }); assert.equal(help.status, 0); assert.match(help.stdout, /BLOCKED/); checks++;
} finally { await rm(root, { recursive: true, force: true }); }
assert.equal(await readFile(fixture, 'utf8'), original);
console.log(`PASS: ${checks} offline positive/negative checks. All samples and identities are synthetic; no real quality evidence, network, images, training, or production writes.`);
