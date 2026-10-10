#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { productionEvidence } from '../lib/automation/production.mjs';
const root = await mkdtemp(join(tmpdir(), 'pairvu-production-'));
const cli = resolve('scripts/pairvu-control.mjs'), repo = join(root, 'repo'), dir = join(root, 'state'), planPath = join(root, 'plan.json'), manifestPath = join(root, 'manifest.json');
const hash = b => createHash('sha256').update(b).digest('hex');
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const common = ['--state-dir', dir, '--repo', repo, '--plan', planPath, '--controller', 'controller'];
let calls = 0;
function run(args, ok = true, entry = cli) {
  try { const out = execFileSync(process.execPath, [entry, ...common, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); assert(ok, `Should reject ${args}`); calls++; return JSON.parse(out); }
  catch (e) { if (e instanceof assert.AssertionError) throw e; assert(!ok, `${args}: ${e.stderr}`); calls++; return e.stderr.toString(); }
}
const stateBytes = () => readFile(join(dir, 'state.json'), 'utf8');
async function rejected(args) { const before = await stateBytes(); run(args, false); assert.equal(await stateBytes(), before, 'Failed command must not change state/events'); }
const unit = (id, mode = 'local_only') => ({ id, title: id, priority: 1, dependsOn: [], mode, autoEligible: true, requiredEvidence: ['check'] });
let plan = { schemaVersion: 1, units: [unit('runtime', 'runtime'), { ...unit('next'), dependsOn: ['runtime'] }] };
const at = n => `2026-01-01T00:00:${String(n).padStart(2, '0')}Z`, version = '11111111-2222-3333-4444-555555555555';
let manifest, sources, baseline, release;
async function writeEvidence(mutate = () => {}) {
  const m = structuredClone(manifest), docs = structuredClone(sources); mutate(m, docs);
  for (const [kind, doc] of Object.entries(docs)) { const bytes = JSON.stringify(doc); await writeFile(join(root, `${kind}.json`), bytes); if (m[kind] !== null) m[kind] = { path: `${kind}.json`, sha256: hash(bytes) }; }
  await writeFile(manifestPath, JSON.stringify(m));
}
try {
  await mkdir(repo); git('init', '-q'); git('config', 'user.name', 'Offline Test'); git('config', 'user.email', 'test@example.invalid'); git('commit', '--allow-empty', '-qm', 'baseline'); baseline = git('rev-parse', 'HEAD');
  await writeFile(planPath, JSON.stringify(plan));
  // Load the actual pre-AUTO-02 implementation to create an unchanged v1 state/history.
  const oldSource = execFileSync('git', ['show', '44c362b6fd96df8e51aa2d5314f7a80953b7f742:lib/automation/control.mjs'], { encoding: 'utf8' });
  await writeFile(join(root, 'old-control.mjs'), oldSource); const oldCli = join(root, 'old-cli.mjs'); await writeFile(oldCli, "import {main} from './old-control.mjs'; await main(process.argv.slice(2));");
  const old = args => run(args, true, oldCli);
  old(['init']); old(['claim', 'runtime']); old(['bind-role', 'dev', 'dev']); old(['bind-role', 'qa', 'qa']); old(['candidate', baseline]); old(['start-qa']);
  const qaPath = join(root, 'original-qa.json'), originalQa = JSON.stringify({ unitId: 'runtime', candidateSha: baseline, reviewerThreadId: 'qa', result: 'PASS', checks: [{ name: 'check', status: 'PASS' }] }); await writeFile(qaPath, originalQa);
  old(['qa', 'PASS', baseline, qaPath]); old(['release-ready']);
  const beforeUpgrade = await stateBytes(); run(['status']); run(['init']); assert.equal(await stateBytes(), beforeUpgrade);
  git('commit', '--allow-empty', '-qm', 'release fix'); release = git('rev-parse', 'HEAD');
  const ident = { schemaVersion: 2, unitId: 'runtime', releaseSha: release };
  const qa = { ...ident, qaCandidateSha: baseline, reviewerThreadId: 'qa', result: 'PASS', reviewedAt: at(2), checks: [{ name: 'independent fixture review', status: 'PASS' }] };
  sources = {
    authorization: { ...ident, environment: 'production', origin: 'https://example.invalid', action: 'deploy', authorized: true, recordRef: 'synthetic-user-authorization', authorizedAt: at(1) },
    releaseQa: qa,
    build: { schemaVersion: 2, unitId: 'runtime', candidateSha: release, remoteSha: release, remote: 'origin', branch: 'main', freshFetch: true, action: 'deploy', result: 'PASS', checkedAt: at(3), completedAt: at(4), artifactSha256: 'a'.repeat(64) },
    migration: { ...ident, conclusion: 'not_required', result: 'PASS', migrationIds: [], recordRef: 'synthetic-no-pending-migrations', checkedAt: at(5) },
    deployment: { ...ident, platformVersion: version, environment: 'production', origin: 'https://example.invalid', action: 'deploy', result: 'PASS', artifactSha256: 'a'.repeat(64), completedAt: at(6) },
    smoke: { ...ident, platformVersion: version, scope: 'http', result: 'PASS', checkedAt: at(7), checks: [{ kind: 'health', url: 'https://example.invalid/api/health', status: 200, body: { ok: true, service: 'pairvu', release: 'public-beta', buildSha: release, platformVersion: version } }, { kind: 'http', url: 'https://example.invalid/', status: 200 }] },
    productionQa: { ...qa, platformVersion: version, scope: 'http', reviewedAt: at(8) },
  };
  manifest = { schemaVersion: 2, unitId: 'runtime', qaCandidateSha: baseline, releaseSha: release, platformVersion: version, environment: 'production', origin: 'https://example.invalid', recordedAt: at(9), ...Object.fromEntries(Object.keys(sources).map(k => [k, {}])) };
  const validateFixture = () => productionEvidence({ repo, controller: 'controller' }, { id: 'runtime', candidate: baseline, roles: { dev: { id: 'dev', pending: false }, qa: { id: 'qa', pending: false } } }, manifestPath, (r, base, sha) => { assert.equal(git('rev-parse', `${sha}^{commit}`), sha); git('merge-base', '--is-ancestor', base, sha); });
  await writeEvidence((m,d) => { d.migration.conclusion = 'applied'; d.migration.migrationIds = ['001-fixture']; }); await validateFixture(); calls++;
  await writeEvidence((m,d) => { m.releaseSha = baseline; m.releaseQa = null; for (const source of Object.values(d)) if ('releaseSha' in source) source.releaseSha = baseline; d.build.candidateSha = baseline; d.build.remoteSha = baseline; d.smoke.checks[0].body.buildSha = baseline; }); await validateFixture(); calls++;
  await writeEvidence(); await rejected(['verify-production', 'runtime', manifestPath]); await rejected(['close', 'runtime']);
  const negative = [
    (m,d) => m.schemaVersion = 1, (m,d) => m.unitId = 'other', (m,d) => m.qaCandidateSha = release, (m,d) => m.platformVersion = 'unknown',
    (m,d) => d.authorization.origin = 'https://wrong.invalid', (m,d) => d.deployment.origin = 'https://wrong.invalid', (m,d) => d.authorization.authorized = false, (m,d) => d.authorization.recordRef = '', (m,d) => d.authorization.action = 'upload', (m,d) => d.authorization.releaseSha = baseline,
    (m,d) => d.build.remoteSha = baseline, (m,d) => d.build.freshFetch = false, (m,d) => d.build.candidateSha = baseline, (m,d) => d.build.action = 'upload',
    (m,d) => m.releaseQa = null, (m,d) => d.releaseQa.result = 'FAIL', (m,d) => d.releaseQa.releaseSha = baseline, (m,d) => d.releaseQa.qaCandidateSha = release, (m,d) => d.releaseQa.reviewerThreadId = 'dev', (m,d) => d.releaseQa.checks = [], (m,d) => d.releaseQa.checks[0].status = 'BLOCKED',
    (m,d) => d.deployment.action = 'upload', (m,d) => d.deployment.artifactSha256 = 'b'.repeat(64), (m,d) => d.deployment.platformVersion = '22222222-2222-3333-4444-555555555555',
    (m,d) => d.migration.conclusion = 'unknown', (m,d) => d.migration.result = 'FAIL', (m,d) => d.migration.conclusion = 'applied',
    (m,d) => d.smoke.checks[0].body.buildSha = baseline, (m,d) => d.smoke.checks[0].body.platformVersion = 'unknown', (m,d) => d.smoke.checks[0].status = 500, (m,d) => d.smoke.checks[0].url = 'https://wrong.invalid/api/health', (m,d) => d.smoke.checks.shift(), (m,d) => d.smoke.scope = 'payments',
    (m,d) => d.productionQa.reviewerThreadId = 'controller', (m,d) => d.productionQa.platformVersion = 'unknown', (m,d) => d.productionQa.checks[0].status = 'NOT_RUN', (m,d) => d.productionQa.result = 'FAIL', (m,d) => d.productionQa.reviewedAt = at(1),
  ];
  for (const mutate of negative) { await writeEvidence(mutate); await rejected(['record-deployment', 'runtime', manifestPath]); }
  for (const key of Object.keys(manifest)) { await writeEvidence(); const m = JSON.parse(await readFile(manifestPath)); delete m[key]; await writeFile(manifestPath, JSON.stringify(m)); await rejected(['record-deployment', 'runtime', manifestPath]); }
  for (const kind of Object.keys(sources)) { await writeEvidence(); await writeFile(join(root, `${kind}.json`), '{}'); await rejected(['record-deployment', 'runtime', manifestPath]); }
  git('checkout', '-q', '--orphan', 'unrelated'); git('commit', '--allow-empty', '-qm', 'unrelated'); const unrelated = git('rev-parse', 'HEAD'); git('checkout', '-q', '--detach', release);
  await writeEvidence(m => m.releaseSha = unrelated); await rejected(['record-deployment', 'runtime', manifestPath]);
  await writeEvidence(); await writeFile(qaPath, originalQa + '\n'); await rejected(['record-deployment', 'runtime', manifestPath]); await writeFile(qaPath, originalQa);
  const originalHistory = run(['status']).events;
  run(['record-deployment', 'runtime', manifestPath]); const deployed = await stateBytes(); run(['record-deployment', 'runtime', manifestPath]); assert.equal(await stateBytes(), deployed); assert.deepEqual(run(['next']), []); await rejected(['close', 'runtime']);
  await writeEvidence((m,d) => d.authorization.recordRef = 'different valid receipt'); await rejected(['record-deployment', 'runtime', manifestPath]); await rejected(['verify-production', 'runtime', manifestPath]);
  await writeEvidence(); await writeFile(join(root, 'smoke.json'), '{}'); await rejected(['verify-production', 'runtime', manifestPath]); await writeEvidence();
  run(['verify-production', 'runtime', manifestPath]); const verified = await stateBytes(); run(['verify-production', 'runtime', manifestPath]); assert.equal(await stateBytes(), verified);
  await writeFile(manifestPath, (await readFile(manifestPath, 'utf8')) + '\n'); await rejected(['close', 'runtime']); await writeEvidence();
  run(['close', 'runtime']); const closed = await stateBytes(); run(['close', 'runtime']); run(['record-deployment', 'runtime', manifestPath]); run(['verify-production', 'runtime', manifestPath]); assert.equal(await stateBytes(), closed);
  assert.deepEqual(run(['status']).events.slice(0, originalHistory.length), originalHistory); assert.equal(run(['next'])[0].id, 'next');
  const sync = async p => { await writeFile(planPath, JSON.stringify(p)); return ['plan-sync', planPath]; };
  await rejected(await sync({ ...plan, units: [plan.units[1]] }));
  const altered = structuredClone(plan); altered.units[0].title = 'rewrite history'; await rejected(await sync(altered));
  const cycle = structuredClone(plan); cycle.units[1].dependsOn = ['added']; cycle.units.push({ ...unit('added'), dependsOn: ['next'] }); await rejected(await sync(cycle));
  const injected = structuredClone(plan); injected.units[1].status = 'CLOSED'; await rejected(await sync(injected));
  const missing = structuredClone(plan); missing.units[1].dependsOn = ['missing']; await rejected(await sync(missing));
  plan.units[1].priority = 9; plan.units.push({ ...unit('added'), dependsOn: ['runtime'] }); run(await sync(plan));
  const synced = await stateBytes(); run(['plan-sync', planPath]); assert.equal(await stateBytes(), synced);
  const state = run(['status']); assert.equal(state.units.find(u => u.id === 'added').status, 'BACKLOG'); assert(state.events.at(-1).details.digest); assert.equal(state.events.at(-1).details.changes.length, 2);
  run(['claim', 'next']); await rejected(['plan-sync', planPath]); await rejected(['record-deployment', 'next', manifestPath]);
  console.log(`PASS: ${calls} production/control CLI assertions plus immutable-state checks; all receipts synthetic; no network, cloud, real state or real receipts accessed.`);
} finally { await rm(root, { recursive: true, force: true }); }
