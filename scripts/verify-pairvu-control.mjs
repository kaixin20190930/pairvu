#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = await mkdtemp(join(tmpdir(), 'pairvu-control-test-'));
const cli = resolve('scripts/pairvu-control.mjs');
const repo = join(root, 'repo'), state = join(root, 'state'), plan = join(root, 'plan.json');
let assertions = 0;
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
const common = ['--state-dir', state, '--plan', plan, '--repo', repo, '--controller', 'controller'];
function run(args, ok = true, extra = []) {
  try {
    const out = execFileSync(process.execPath, [cli, ...common, ...extra, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    assert(ok, `Expected rejection: ${args.join(' ')}`); assertions++; return JSON.parse(out);
  } catch (e) { if (e instanceof assert.AssertionError) throw e; assert(!ok, `${args.join(' ')}: ${e.stderr}`); assertions++; return e.stderr.toString(); }
}
const unit = (id, overrides = {}) => ({ id, title: id, priority: 1, dependsOn: [], mode: 'local_only', autoEligible: true, requiredEvidence: ['boundary'], ...overrides });
const read = () => JSON.parse(execFileSync(process.execPath, [cli, ...common, 'status'], { encoding: 'utf8' }));
async function proof(id, candidate, result = 'PASS', overrides = {}) {
  const path = join(root, `evidence-${id}.json`);
  await writeFile(path, JSON.stringify({ unitId: id, candidateSha: candidate, reviewerThreadId: 'qa', result, checks: [{ name: 'boundary', status: result }], ...overrides })); return path;
}
function parallelClaim(id) {
  return new Promise(resolve => { const p = spawn(process.execPath, [cli, ...common, 'claim', id], { stdio: 'pipe' }); let err = ''; p.stderr.on('data', b => err += b); p.on('close', code => resolve({ code, err })); });
}
try {
  await mkdir(repo); git('init', '-q'); git('config', 'user.email', 'fixture@example.invalid'); git('config', 'user.name', 'Offline Fixture');
  await writeFile(join(repo, 'file'), 'base'); git('add', 'file'); git('commit', '-qm', 'baseline'); const base = git('rev-parse', 'HEAD');
  git('checkout', '-q', '--orphan', 'unrelated'); git('commit', '-qm', 'unrelated'); const unrelated = git('rev-parse', 'HEAD'); git('checkout', '-q', '--detach', base);
  await writeFile(plan, JSON.stringify({ schemaVersion: 1, units: [unit('a'), unit('b'), unit('dependent', { dependsOn: ['a'] }), unit('human', { mode: 'human' }), unit('held', { autoEligible: false }), unit('runtime', { mode: 'runtime' })] }));
  run(['init']); const initial = await readFile(join(state, 'state.json'), 'utf8'); run(['init']); assert.equal(await readFile(join(state, 'state.json'), 'utf8'), initial);
  run(['claim', 'dependent'], false); run(['claim', 'human'], false); run(['claim', 'held'], false);
  assert.equal(run(['next']).length, 3);
  const race = await Promise.all([parallelClaim('a'), parallelClaim('b')]); assert.equal(race.filter(r => r.code === 0).length, 1); assertions++;
  assert.equal(read().events.filter(e => e.action === 'claim').length, 1);
  const current = read().units.find(u => u.status === 'DEV_ACTIVE').id;
  run(['claim', current]); assert.deepEqual(run(['next']), []);
  run(['close', current], false); run(['candidate', base], false);
  run(['bind-role', 'dev', 'pending-dev', '--client-id']); run(['bind-role', 'dev', 'pending-dev', '--client-id']);
  run(['bind-role', 'dev', 'other', '--client-id'], false); run(['bind-role', 'qa', 'pending-dev', '--client-id'], false); run(['candidate', base], false);
  run(['bind-role', 'dev', 'dev', '--resolve-client-id', 'wrong'], false);
  run(['bind-role', 'dev', 'dev', '--resolve-client-id', 'pending-dev']); run(['bind-role', 'dev', 'dev', '--resolve-client-id', 'pending-dev']);
  run(['bind-role', 'qa', 'dev'], false); run(['bind-role', 'qa', 'controller'], false);
  run(['candidate', '0'.repeat(40)], false); run(['candidate', base.slice(0, 8)], false); run(['candidate', unrelated], false);
  run(['candidate', base]); run(['start-qa'], false);
  run(['bind-role', 'qa', 'pending-qa', '--client-id']); run(['start-qa'], false); run(['bind-role', 'qa', 'qa', '--resolve-client-id', 'pending-qa']);
  const path = await proof(current, base);
  run(['qa', 'PASS', base, path], false); run(['start-qa']); run(['start-qa']);
  for (const overrides of [{ unitId: 'wrong' }, { candidateSha: unrelated }, { reviewerThreadId: 'dev' }, { result: 'FAIL' }, { checks: [] }, { checks: [{ name: 'boundary', status: 'FAIL' }] }, { checks: [{ name: 'boundary', status: 'NOT_RUN' }] }, { checks: [{ name: 'boundary', status: 'BLOCKED' }] }, { checks: [{ name: 'wrong', status: 'PASS' }] }]) {
    await proof(current, base, 'PASS', overrides); run(['qa', 'PASS', base, path], false);
  }
  run(['qa', 'PASS', base, join(root, 'missing.json')], false);
  await writeFile(path, 'nonempty fake PASS'); run(['qa', 'PASS', base, path], false);
  await proof(current, base, 'FAIL'); run(['qa', 'FAIL', base, path]); run(['qa', 'FAIL', base, path]); run(['close', current], false); run(['start-qa'], false);
  run(['rework']); run(['rework']); run(['qa', 'PASS', base, path], false); run(['candidate', base]); run(['start-qa']);
  await proof(current, base); run(['qa', 'PASS', base, path]); run(['qa', 'PASS', base, path]);
  await writeFile(join(repo, 'file'), 'candidate2'); git('add', 'file'); git('commit', '-qm', 'candidate2'); const candidate = git('rev-parse', 'HEAD');
  run(['candidate', candidate]); assert.equal(read().units.find(u => u.id === current).qa, null); run(['close', current], false); run(['start-qa']); run(['qa', 'PASS', base, path], false);
  await proof(current, candidate); run(['qa', 'PASS', candidate, path]);
  await writeFile(path, (await readFile(path, 'utf8')) + '\n'); run(['close', current], false);
  await proof(current, candidate); run(['close', current]); run(['close', current]);
  if (current === 'b') { run(['claim', 'a']); run(['bind-role', 'dev', 'dev']); run(['bind-role', 'qa', 'qa']); run(['candidate', candidate]); run(['start-qa']); const a = await proof('a', candidate); run(['qa', 'PASS', candidate, a]); run(['close', 'a']); }
  assert(run(['next']).some(u => u.id === 'dependent'));
  run(['claim', 'runtime']); run(['bind-role', 'dev', 'dev']); run(['bind-role', 'qa', 'qa']); run(['candidate', candidate]); run(['release-ready'], false); run(['start-qa']);
  const r = await proof('runtime', candidate); run(['qa', 'PASS', candidate, r]); run(['close', 'runtime'], false); run(['release-ready']); run(['release-ready']); run(['candidate', base], false); run(['deploy'], false); assert.equal(read().units.find(u => u.id === 'runtime').status, 'RELEASE_READY');
  const saved = await readFile(join(state, 'state.json'), 'utf8'); const events = read().events; assert.deepEqual(events.map(e => e.seq), events.map((_, i) => i + 1)); assert(events.some(e => e.action === 'qa' && e.details.digest));
  await writeFile(join(state, 'lock'), '{"pid":0,"at":"1900-01-01"}'); run(['status'], false); assert.equal(await readFile(join(state, 'state.json'), 'utf8'), saved); await rm(join(state, 'lock'));
  await writeFile(join(state, 'state.json'), '{broken'); run(['status'], false); run(['init'], false); await writeFile(join(state, 'state.json'), saved.replace('RELEASE_READY', 'CLOSED')); run(['status'], false);
  const malformed = JSON.parse(saved); malformed.state.units.find(u => u.id === 'runtime').roles.qa.id = 'dev'; malformed.digest = createHash('sha256').update(JSON.stringify(malformed.state)).digest('hex'); await writeFile(join(state, 'state.json'), JSON.stringify(malformed)); run(['status'], false);
  console.log(`PASS: ${assertions} CLI assertions plus state/event checks; offline temporary Git repository; no network or production operations.`);
} finally { await rm(root, { recursive: true, force: true }); }
