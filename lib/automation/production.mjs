import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const ensure = (v, message) => { if (!v) throw new Error(`Production evidence: ${message}`); };
const text = v => typeof v === 'string' && v.trim().length > 0 && !['unknown', 'FAIL', 'BLOCKED'].includes(v);
const sha = v => typeof v === 'string' && /^[a-f0-9]{40}$/.test(v);
const hash = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const uuid = v => typeof v === 'string' && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(v);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function object(v, keys, at) { ensure(v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k)), `${at}: missing/unknown fields`); }
function time(v) { ensure(typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().replace('.000Z', 'Z') === v.replace('.000Z', 'Z'), 'invalid UTC timestamp'); return Date.parse(v); }
function checks(v) { ensure(Array.isArray(v) && v.length > 0, 'QA requires checks'); const names = new Set(); for (const c of v) { object(c, ['name', 'status'], 'QA check'); ensure(text(c.name) && !names.has(c.name) && c.status === 'PASS', 'QA checks must be unique and all PASS'); names.add(c.name); } }
export function validateProductionRecord(p) {
  object(p, ['schemaVersion', 'path', 'digest', 'unitId', 'qaCandidateSha', 'releaseSha', 'platformVersion', 'references'], 'stored record');
  ensure(p.schemaVersion === 2 && text(p.path) && hash(p.digest) && text(p.unitId) && sha(p.qaCandidateSha) && sha(p.releaseSha) && uuid(p.platformVersion) && Array.isArray(p.references) && p.references.length >= 6, 'corrupt stored production record');
  for (const r of p.references) { object(r, ['kind', 'path', 'digest'], 'stored reference'); ensure(text(r.kind) && text(r.path) && hash(r.digest), 'corrupt stored reference'); }
}
export async function productionEvidence(s, u, file, verifyCandidate) {
  const path = resolve(file), bytes = await readFile(path), m = JSON.parse(bytes.toString('utf8'));
  object(m, ['schemaVersion', 'unitId', 'qaCandidateSha', 'releaseSha', 'platformVersion', 'environment', 'origin', 'recordedAt', 'authorization', 'migration', 'build', 'deployment', 'smoke', 'releaseQa', 'productionQa'], 'manifest');
  ensure(m.schemaVersion === 2 && m.unitId === u.id && m.qaCandidateSha === u.candidate && sha(m.releaseSha) && uuid(m.platformVersion) && m.environment === 'production', 'manifest identity/version mismatch');
  ensure(u.roles.qa && !u.roles.qa.pending && u.roles.qa.id !== u.roles.dev.id && u.roles.qa.id !== s.controller, 'independent resolved reviewer required');
  const origin = new URL(m.origin); ensure(origin.protocol === 'https:' && origin.origin === m.origin, 'origin must be an HTTPS origin only');
  verifyCandidate(s.repo, u.candidate, m.releaseSha);
  const references = [];
  async function load(kind) {
    const ref = m[kind]; object(ref, ['path', 'sha256'], `${kind} reference`); ensure(text(ref.path) && hash(ref.sha256), 'invalid evidence reference');
    const sourcePath = resolve(dirname(path), ref.path), sourceBytes = await readFile(sourcePath);
    ensure(digest(sourceBytes) === ref.sha256, `${kind} digest mismatch`);
    references.push({ kind, path: sourcePath, digest: ref.sha256 });
    return JSON.parse(sourceBytes.toString('utf8'));
  }
  function identity(e) { ensure(e.schemaVersion === 2 && e.unitId === u.id && e.releaseSha === m.releaseSha, 'source identity mismatch'); }
  function qa(e, production) {
    object(e, ['schemaVersion', 'unitId', 'qaCandidateSha', 'releaseSha', 'reviewerThreadId', 'result', 'reviewedAt', 'checks', ...(production ? ['platformVersion', 'scope'] : [])], 'QA');
    identity(e); ensure(e.qaCandidateSha === u.candidate && e.reviewerThreadId === u.roles.qa.id && e.result === 'PASS', 'QA identity/result mismatch'); checks(e.checks);
    if (production) ensure(e.platformVersion === m.platformVersion && e.scope === 'http', 'production QA version/scope mismatch');
    return time(e.reviewedAt);
  }
  const auth = await load('authorization');
  object(auth, ['schemaVersion', 'unitId', 'releaseSha', 'environment', 'origin', 'action', 'authorized', 'recordRef', 'authorizedAt'], 'authorization'); identity(auth);
  ensure(auth.environment === 'production' && auth.origin === m.origin && auth.action === 'deploy' && auth.authorized === true && text(auth.recordRef), 'explicit deployment authorization required');
  const authAt = time(auth.authorizedAt);
  let qaAt = 0;
  if (m.releaseQa !== null) qaAt = qa(await load('releaseQa'), false);
  else ensure(m.releaseSha === u.candidate, 'changed release requires independent release QA');
  const build = await load('build');
  object(build, ['schemaVersion', 'unitId', 'candidateSha', 'remoteSha', 'remote', 'branch', 'freshFetch', 'action', 'result', 'checkedAt', 'completedAt', 'artifactSha256'], 'build');
  ensure(build.schemaVersion === 2 && build.unitId === u.id && build.candidateSha === m.releaseSha && build.remoteSha === m.releaseSha && text(build.remote) && text(build.branch) && build.freshFetch === true && build.action === 'deploy' && build.result === 'PASS' && hash(build.artifactSha256), 'invalid build/fresh remote proof');
  const remoteAt = time(build.checkedAt), builtAt = time(build.completedAt);
  const migration = await load('migration');
  object(migration, ['schemaVersion', 'unitId', 'releaseSha', 'conclusion', 'result', 'migrationIds', 'recordRef', 'checkedAt'], 'migration'); identity(migration);
  ensure(migration.result === 'PASS' && ['not_required', 'applied'].includes(migration.conclusion) && text(migration.recordRef) && Array.isArray(migration.migrationIds) && migration.migrationIds.every(text) && new Set(migration.migrationIds).size === migration.migrationIds.length, 'invalid migration conclusion');
  ensure(migration.conclusion === 'applied' ? migration.migrationIds.length > 0 : migration.migrationIds.length === 0, 'migration IDs mismatch conclusion');
  const migrationAt = time(migration.checkedAt);
  const deployment = await load('deployment');
  object(deployment, ['schemaVersion', 'unitId', 'releaseSha', 'platformVersion', 'environment', 'origin', 'action', 'result', 'artifactSha256', 'completedAt'], 'deployment'); identity(deployment);
  ensure(deployment.platformVersion === m.platformVersion && deployment.environment === 'production' && deployment.origin === m.origin && deployment.action === 'deploy' && deployment.result === 'PASS' && deployment.artifactSha256 === build.artifactSha256, 'deployment mismatch; upload is not deploy');
  const deployedAt = time(deployment.completedAt);
  const smoke = await load('smoke');
  object(smoke, ['schemaVersion', 'unitId', 'releaseSha', 'platformVersion', 'scope', 'result', 'checkedAt', 'checks'], 'smoke'); identity(smoke);
  ensure(smoke.platformVersion === m.platformVersion && smoke.scope === 'http' && smoke.result === 'PASS' && Array.isArray(smoke.checks) && smoke.checks.length > 0, 'invalid smoke');
  let health = false; const urls = new Set();
  for (const c of smoke.checks) {
    object(c, c.kind === 'health' ? ['kind', 'url', 'status', 'body'] : ['kind', 'url', 'status'], 'smoke check');
    ensure(['health', 'http'].includes(c.kind) && typeof c.url === 'string' && Number.isInteger(c.status) && c.status >= 200 && c.status <= 299, 'smoke HTTP check failed');
    const url = new URL(c.url); ensure(url.origin === m.origin && !url.username && !url.password && !url.hash && !urls.has(c.url), 'smoke target mismatch/duplicate'); urls.add(c.url);
    if (c.kind === 'health') {
      ensure(!health && url.pathname === '/api/health' && !url.search && c.status === 200, 'invalid health target'); health = true;
      object(c.body, ['ok', 'service', 'release', 'buildSha', 'platformVersion'], 'health body');
      ensure(c.body.ok === true && c.body.service === 'pairvu' && c.body.release === 'public-beta' && c.body.buildSha === m.releaseSha && c.body.platformVersion === m.platformVersion, 'health provenance mismatch');
    }
  }
  ensure(health, 'health response required');
  const smokeAt = time(smoke.checkedAt), productionQaAt = qa(await load('productionQa'), true), recordedAt = time(m.recordedAt);
  ensure(authAt <= remoteAt && qaAt <= remoteAt && remoteAt <= builtAt && remoteAt <= migrationAt && builtAt <= deployedAt && migrationAt <= deployedAt && deployedAt <= smokeAt && smokeAt <= productionQaAt && productionQaAt <= recordedAt, 'evidence chronology mismatch');
  // Re-read every input to detect changes during validation, before the atomic state write.
  for (const r of [{ path, digest: digest(bytes) }, ...references]) ensure(digest(await readFile(r.path)) === r.digest, 'evidence changed during import');
  const record = { schemaVersion: 2, path, digest: digest(bytes), unitId: u.id, qaCandidateSha: u.candidate, releaseSha: m.releaseSha, platformVersion: m.platformVersion, references };
  validateProductionRecord(record); return record;
}
