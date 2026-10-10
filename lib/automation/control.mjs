import { readFile, mkdir, open, rename, unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const usage = `Usage: pairvu-control [--state-dir PATH] [--plan PATH] [--repo PATH] [--controller ID] COMMAND
  init                         initialize from plan (idempotent; requires controller)
  status | next                inspect state or eligible units
  claim UNIT                   claim one eligible unit; baseline is repository HEAD
  bind-role dev|qa ID [--client-id] [--resolve-client-id PENDING_ID]
  candidate FULL_SHA           set descendant candidate; changes invalidate QA
  start-qa                     begin independent review of DEV_READY candidate
  qa PASS|FAIL FULL_SHA FILE    record structured JSON evidence
  rework                       return QA_FAIL to DEV_ACTIVE
  release-ready                move runtime QA_PASS to RELEASE_READY
  close UNIT                   close local_only QA_PASS after evidence recheck
Pending identities occupy their role until explicitly resolved. No deployment commands.
Evidence: {unitId,candidateSha,reviewerThreadId,result,checks:[{name,status}]};
check status is PASS, FAIL, BLOCKED, or NOT_RUN; every requiredEvidence name must appear.`;
const digest = value => createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };
const text = value => typeof value === 'string' && value.trim().length > 0;
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const states = ['BACKLOG', 'DEV_ACTIVE', 'DEV_READY', 'QA_ACTIVE', 'QA_FAIL', 'QA_PASS', 'RELEASE_READY', 'CLOSED'];
function validatePlan(plan) {
  assert(plan?.schemaVersion === 1 && Array.isArray(plan.units), 'Invalid plan schema');
  const ids = new Set();
  for (const u of plan.units) {
    assert(text(u.id) && !ids.has(u.id) && text(u.title) && Number.isFinite(u.priority), 'Invalid/duplicate unit');
    ids.add(u.id);
    assert(['local_only', 'runtime', 'human'].includes(u.mode) && typeof u.autoEligible === 'boolean', 'Invalid eligibility');
    for (const key of ['dependsOn', 'requiredEvidence']) assert(Array.isArray(u[key]) && u[key].every(text) && new Set(u[key]).size === u[key].length, `Invalid ${key}`);
  }
  for (const u of plan.units) assert(u.dependsOn.every(id => ids.has(id) && id !== u.id), 'Unknown/self dependency');
  const visiting = new Set(), visited = new Set();
  function visit(id) { assert(!visiting.has(id), 'Dependency cycle'); if (visited.has(id)) return; visiting.add(id); plan.units.find(u => u.id === id).dependsOn.forEach(visit); visiting.delete(id); visited.add(id); }
  plan.units.forEach(u => visit(u.id));
}
function validateState(s) {
  validatePlan(s);
  assert(text(s.controller) && text(s.repo) && Array.isArray(s.events) && s.events.length > 0, 'Corrupt state');
  let active = 0;
  for (const u of s.units) {
    assert(states.includes(u.status) && u.roles && typeof u.roles === 'object', 'Corrupt unit state');
    if (!['BACKLOG', 'CLOSED'].includes(u.status)) active++;
    if (u.status !== 'BACKLOG') assert(sha(u.baseline) && u.dependsOn.every(id => s.units.find(v => v.id === id).status === 'CLOSED'), 'Corrupt baseline/dependencies');
    const roles = Object.entries(u.roles);
    assert(roles.every(([key, r]) => ['dev', 'qa'].includes(key) && text(r.id) && typeof r.pending === 'boolean' && r.id !== s.controller), 'Corrupt role');
    assert(new Set(roles.map(([, r]) => r.id)).size === roles.length, 'Roles must be independent');
    if (u.candidate !== null) assert(sha(u.candidate), 'Corrupt candidate');
    if (['DEV_READY', 'QA_ACTIVE', 'QA_FAIL', 'QA_PASS', 'RELEASE_READY', 'CLOSED'].includes(u.status)) assert(u.candidate && u.roles.dev && !u.roles.dev.pending, 'Missing candidate/developer');
    if (['QA_ACTIVE', 'QA_FAIL', 'QA_PASS', 'RELEASE_READY', 'CLOSED'].includes(u.status)) assert(u.roles.qa && !u.roles.qa.pending, 'Missing reviewer');
    if (['QA_FAIL', 'QA_PASS', 'RELEASE_READY', 'CLOSED'].includes(u.status)) assert(u.qa && u.qa.candidateSha === u.candidate && u.qa.reviewerThreadId === u.roles.qa.id && /^[a-f0-9]{64}$/.test(u.qa.digest) && text(u.qa.path) && u.qa.result === (u.status === 'QA_FAIL' ? 'FAIL' : 'PASS'), 'Corrupt QA record');
    if (u.status === 'CLOSED') assert(u.mode === 'local_only', 'Runtime cannot close');
    if (u.status === 'RELEASE_READY') assert(u.mode === 'runtime', 'Invalid release mode');
  }
  assert(active <= 1, 'Multiple active units');
  s.events.forEach((e, i) => assert(e.seq === i + 1 && text(e.at) && text(e.action), 'Corrupt event history'));
}
function git(repo, ...args) { try { return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); } catch { fail(`Git verification failed: ${args.join(' ')}`); } }
function verifyCandidate(repo, baseline, candidate) {
  assert(sha(candidate), 'Candidate must be a full lowercase 40-character SHA');
  assert(git(repo, 'rev-parse', '--verify', `${candidate}^{commit}`) === candidate, 'Candidate must identify a commit');
  git(repo, 'merge-base', '--is-ancestor', baseline, candidate);
}
async function evidence(u, result, candidate, path) {
  const bytes = await readFile(path);
  let e; try { e = JSON.parse(bytes.toString('utf8')); } catch { fail('Evidence must be JSON'); }
  assert(e.unitId === u.id && e.candidateSha === candidate && e.reviewerThreadId === u.roles.qa.id && e.result === result, 'Evidence identity/result mismatch');
  assert(Array.isArray(e.checks) && e.checks.length > 0 && e.checks.every(c => text(c.name) && ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'].includes(c.status)), 'Invalid evidence checks');
  assert(new Set(e.checks.map(c => c.name)).size === e.checks.length, 'Duplicate checks');
  assert(u.requiredEvidence.every(name => e.checks.some(c => c.name === name)), 'Missing required evidence');
  if (result === 'PASS') assert(e.checks.every(c => c.status === 'PASS'), 'PASS requires every check to pass');
  return { path, digest: digest(bytes), candidateSha: candidate, reviewerThreadId: e.reviewerThreadId, result };
}
async function recheck(s, u) {
  verifyCandidate(s.repo, u.baseline, u.candidate);
  const record = await evidence(u, 'PASS', u.candidate, u.qa.path);
  assert(record.digest === u.qa.digest, 'Evidence changed since review');
}
export async function main(argv) {
  const opts = {}, args = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--client-id') { assert(!opts.clientId, 'Duplicate option'); opts.clientId = true; }
    else if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2); assert(['state-dir', 'plan', 'repo', 'controller', 'resolve-client-id'].includes(key) && !Object.hasOwn(opts, key) && text(argv[i + 1]) && !argv[i + 1].startsWith('--'), 'Invalid option'); opts[key] = argv[++i];
    } else args.push(argv[i]);
  }
  const [command, ...rest] = args;
  if (!command || command === 'help') { console.log(usage); return; }
  const arities = { init: 0, status: 0, next: 0, claim: 1, 'bind-role': 2, candidate: 1, 'start-qa': 0, qa: 3, rework: 0, 'release-ready': 0, close: 1 };
  assert(Object.hasOwn(arities, command) && rest.length === arities[command], usage);
  assert(command === 'bind-role' || (!opts.clientId && !opts['resolve-client-id']), 'Role options only valid for bind-role');
  const dir = resolve(opts['state-dir'] || '.pairvu-control');
  await mkdir(dir, { recursive: true });
  const lockPath = join(dir, 'lock');
  let lock; try { lock = await open(lockPath, 'wx'); } catch (e) { if (e.code === 'EEXIST') fail('State locked; inspect owner before manual recovery (never auto-expired)'); throw e; }
  const statePath = join(dir, 'state.json');
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
    let s;
    try {
      const envelope = JSON.parse(await readFile(statePath, 'utf8'));
      assert(envelope.digest === digest(JSON.stringify(envelope.state)), 'State checksum mismatch'); s = envelope.state; validateState(s);
    } catch (e) { if (e.code !== 'ENOENT') throw e; assert(command === 'init', 'State absent; run init'); }
    let changed = false;
    if (s && opts.controller) assert(opts.controller === s.controller, 'Controller identity mismatch');
    if (s && opts.repo) assert(resolve(opts.repo) === s.repo, 'Repository mismatch');
    if (!s) {
      assert(text(opts.controller), 'init requires --controller ID');
      const plan = JSON.parse(await readFile(resolve(opts.plan || 'operations/backlog.json'), 'utf8')); validatePlan(plan);
      const repo = resolve(opts.repo || '.'); git(repo, 'rev-parse', '--show-toplevel');
      s = { schemaVersion: 1, controller: opts.controller, repo, units: plan.units.map(u => ({ ...u, status: 'BACKLOG', roles: {}, baseline: null, candidate: null, qa: null })), events: [] }; changed = true;
    }
    const active = () => { const u = s.units.find(u => !['BACKLOG', 'CLOSED'].includes(u.status)); assert(u, 'No active unit'); return u; };
    const eligible = u => u.status === 'BACKLOG' && u.autoEligible && u.mode !== 'human' && u.dependsOn.every(id => s.units.find(v => v.id === id).status === 'CLOSED');
    if (command === 'claim') {
      const u = s.units.find(u => u.id === rest[0]); assert(u, 'Unknown unit');
      const current = s.units.find(v => !['BACKLOG', 'CLOSED'].includes(v.status));
      if (current?.id !== u.id) { assert(!current, 'Another unit is active'); assert(eligible(u), 'Unit ineligible or dependencies not closed'); u.baseline = git(s.repo, 'rev-parse', 'HEAD'); u.status = 'DEV_ACTIVE'; changed = true; }
    } else if (command === 'bind-role') {
      const u = active(), [role, id] = rest; assert(['dev', 'qa'].includes(role) && text(id), 'Invalid role/id');
      assert(id !== s.controller && id !== u.roles[role === 'dev' ? 'qa' : 'dev']?.id, 'Developer, reviewer, controller must differ');
      const old = u.roles[role];
      if (opts['resolve-client-id']) {
        assert(!opts.clientId, 'Resolution must bind a real thread');
        if (!(old?.id === id && old?.resolvedFrom === opts['resolve-client-id'])) { assert(old?.pending && old.id === opts['resolve-client-id'], 'Pending identity mismatch'); u.roles[role] = { id, pending: false, resolvedFrom: old.id }; changed = true; }
      } else if (old) assert(old.id === id && old.pending === !!opts.clientId, 'Role already occupied');
      else { assert(['DEV_ACTIVE', 'DEV_READY'].includes(u.status), 'Cannot bind role in this state'); u.roles[role] = { id, pending: !!opts.clientId }; changed = true; }
    } else if (command === 'candidate') {
      const u = active(); assert(['DEV_ACTIVE', 'DEV_READY', 'QA_ACTIVE', 'QA_FAIL', 'QA_PASS'].includes(u.status), 'Candidate frozen');
      assert(u.roles.dev && !u.roles.dev.pending, 'Bind resolved developer first'); verifyCandidate(s.repo, u.baseline, rest[0]);
      if (u.candidate !== rest[0] || u.status === 'DEV_ACTIVE') { u.candidate = rest[0]; u.qa = null; u.status = 'DEV_READY'; changed = true; }
    } else if (command === 'start-qa') {
      const u = active(); assert(['DEV_READY', 'QA_ACTIVE'].includes(u.status) && u.roles.qa && !u.roles.qa.pending, 'QA requires ready candidate and resolved independent reviewer');
      if (u.status !== 'QA_ACTIVE') { u.status = 'QA_ACTIVE'; changed = true; }
    } else if (command === 'qa') {
      const u = active(), [result, candidate, file] = rest; assert(['PASS', 'FAIL'].includes(result) && sha(candidate) && candidate === u.candidate, 'Invalid/stale QA candidate');
      assert(['QA_ACTIVE', `QA_${result}`].includes(u.status), 'Start QA before recording review');
      const record = await evidence(u, result, candidate, resolve(file));
      if (u.status === `QA_${result}`) assert(JSON.stringify(record) === JSON.stringify(u.qa), 'Review already recorded; rework required');
      else { u.qa = record; u.status = `QA_${result}`; changed = true; }
    } else if (command === 'rework') {
      const u = active(); assert(['QA_FAIL', 'DEV_ACTIVE'].includes(u.status), 'Rework requires QA_FAIL');
      if (u.status === 'QA_FAIL') { u.status = 'DEV_ACTIVE'; u.qa = null; changed = true; }
    } else if (command === 'close' || command === 'release-ready') {
      const u = command === 'close' ? s.units.find(u => u.id === rest[0]) : active();
      const end = command === 'close' ? 'CLOSED' : 'RELEASE_READY';
      assert(u && u.mode === (command === 'close' ? 'local_only' : 'runtime') && ['QA_PASS', end].includes(u.status), 'Completion requires matching mode and QA_PASS');
      await recheck(s, u); if (u.status !== end) { u.status = end; changed = true; }
    }
    if (changed) {
      s.events.push({ seq: s.events.length + 1, at: new Date().toISOString(), action: command, args: rest, unitId: s.units.find(u => !['BACKLOG', 'CLOSED'].includes(u.status))?.id || (command === 'close' ? rest[0] : null), details: command === 'qa' ? active().qa : null });
      validateState(s);
      const temp = join(dir, `state.${randomUUID()}.tmp`);
      try {
        const file = await open(temp, 'wx', 0o600);
        try { await file.writeFile(JSON.stringify({ state: s, digest: digest(JSON.stringify(s)) }, null, 2) + '\n'); await file.sync(); } finally { await file.close(); }
        await rename(temp, statePath);
        const directory = await open(dir, 'r'); try { await directory.sync(); } finally { await directory.close(); }
      } finally { await unlink(temp).catch(e => { if (e.code !== 'ENOENT') throw e; }); }
    }
    console.log(JSON.stringify(command === 'next' ? (s.units.some(u => !['BACKLOG', 'CLOSED'].includes(u.status)) ? [] : s.units.filter(eligible).sort((a, b) => a.priority - b.priority)) : s, null, 2));
  } finally { await lock.close(); await unlink(lockPath); }
}
