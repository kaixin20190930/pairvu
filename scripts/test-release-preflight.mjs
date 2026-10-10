#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, rename, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { preflight, parseOptions, git } from './release-preflight.mjs';
import { deployRelease } from './deploy-release.mjs';
const require = createRequire(import.meta.url), root = await mkdtemp(join(tmpdir(), 'pairvu-release-'));
const repo = join(root, 'repo'), remote = join(root, 'remote.git');
const source = resolve('.'), tsx = require.resolve('tsx');
let checks = 0;
const reject = async (name, fn) => { await assert.rejects(async () => fn(), undefined, name); checks++; };
const pass = (name, fn) => { assert.doesNotThrow(fn, name); checks++; };
const commit = message => { git(repo, 'add', '-A'); git(repo, 'commit', '-qm', message); return git(repo, 'rev-parse', 'HEAD'); };
const localGit = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function ts(code, cwd = repo, env = {}) {
  const result = spawnSync(process.execPath, ['--import', tsx, '--eval', code], { cwd, encoding: 'utf8', env: { ...process.env, ...env } });
  assert.equal(result.status, 0, result.stderr); return JSON.parse(result.stdout);
}
const logs = [], realLog = console.log;
console.log = (...values) => logs.push(values);
try {
  await mkdir(repo); localGit(root, 'init', '--bare', '-q', remote); localGit(repo, 'init', '-q', '-b', 'main'); git(repo, 'config', 'user.name', 'Offline Test'); git(repo, 'config', 'user.email', 'test@example.invalid');
  await writeFile(join(repo, '.gitignore'), '.next/\n.open-next/\n'); await writeFile(join(repo, 'source.txt'), 'baseline');
  const base = commit('baseline'); git(repo, 'remote', 'add', 'origin', remote);
  const options = { repo, candidate: base, remote: 'origin', branch: 'main', action: 'deploy' };
  await reject('unpublished candidate/missing remote branch', () => preflight(options));
  git(repo, 'push', '-q', 'origin', 'main'); pass('clean fetched candidate', () => assert.equal(preflight(options).remoteSha, base));
  assert.equal(git(repo, 'for-each-ref', '--format=%(refname)', 'refs/pairvu-preflight'), ''); checks++;
  await reject('short SHA', () => preflight({ ...options, candidate: base.slice(0, 8) })); await reject('nonexistent SHA', () => preflight({ ...options, candidate: '0'.repeat(40) }));
  await reject('unknown remote', () => preflight({ ...options, remote: 'absent' })); await reject('branch injection', () => preflight({ ...options, branch: '-x' }));
  for (const args of [[], ['--candidate', base, '--remote', 'origin', '--branch', 'main', '--skip'], ['--candidate', base, '--remote', 'origin', '--branch', 'main', '--candidate', base]]) await reject('invalid CLI options', () => parseOptions(args));
  await writeFile(join(repo, 'source.txt'), 'dirty'); await reject('unstaged', () => preflight(options)); git(repo, 'add', 'source.txt'); await reject('staged', () => preflight(options)); git(repo, 'reset', '--hard', base);
  await writeFile(join(repo, 'untracked.txt'), 'dirty'); await reject('untracked', () => preflight(options)); await rm(join(repo, 'untracked.txt'));
  await rm(join(repo, 'source.txt')); await reject('deleted', () => preflight(options)); git(repo, 'checkout', '--', 'source.txt');
  git(repo, 'commit', '--allow-empty', '-qm', 'not pushed'); const newer = git(repo, 'rev-parse', 'HEAD');
  await reject('HEAD changed', () => preflight(options)); await reject('unpushed local commit', () => preflight({ ...options, candidate: newer }));
  git(repo, 'push', '-q', 'origin', 'main'); git(repo, 'reset', '--hard', base); await reject('remote branch is ahead', () => preflight(options)); git(repo, 'reset', '--hard', newer); options.candidate = newer;
  // origin/main is valid but unreachable remote must still fail fresh fetch.
  await rename(remote, `${remote}.away`); await reject('fetch failure with stale tracking ref', () => preflight(options)); await rename(`${remote}.away`, remote);
  const configCode = `const {readBuildSha}=require(${JSON.stringify(join(source, 'next.config.ts'))}); console.log(JSON.stringify(readBuildSha()));`;
  assert.equal(ts(configCode, repo, { PAIRVU_BUILD_SHA: 'a'.repeat(40) }), newer); checks++;
  await writeFile(join(repo, 'dirty.txt'), 'dirty'); assert.equal(ts(configCode), 'unknown'); await rm(join(repo, 'dirty.txt')); checks++;
  assert.equal(ts(configCode, root), 'unknown'); checks++;
  const versionFile = JSON.stringify(join(source, 'lib/release-version.ts'));
  const uuid = '11111111-2222-3333-4444-555555555555';
  const metadata = ts(`const {releaseVersion}=require(${versionFile});console.log(JSON.stringify(releaseVersion({id:${JSON.stringify(uuid)},secret:'never-public',tag:'private'})));`, repo, { PAIRVU_BUILD_SHA: newer });
  assert.deepEqual(metadata, { buildSha: newer, platformVersion: uuid }); checks++;
  assert.deepEqual(ts(`const {releaseVersion}=require(${versionFile});console.log(JSON.stringify(releaseVersion({id:'secret-value'})));`, repo, { PAIRVU_BUILD_SHA: 'invalid' }), { buildSha: 'unknown', platformVersion: 'unknown' }); checks++;
  const calls = [];
  async function artifact(sha = options.candidate) { await mkdir(join(repo, '.next'), { recursive: true }); await mkdir(join(repo, '.open-next'), { recursive: true }); await writeFile(join(repo, '.next/required-server-files.json'), JSON.stringify({ config: { env: { PAIRVU_BUILD_SHA: sha } } })); await writeFile(join(repo, '.open-next/worker.js'), '// fixture artifact only'); }
  function runner(afterBuild = async () => {}) { return async (command, args) => { calls.push([command, ...args]); if (args.join(' ') === 'exec opennextjs-cloudflare build') { await artifact(); await afterBuild(); } }; }
  async function blocked(name, opts, run) { calls.length = 0; await reject(name, () => deployRelease(opts, run)); assert(!calls.some(c => c.includes('deploy') || c.includes('upload')), name); checks++; }
  await deployRelease(options, runner()); assert.equal(calls.length, 2); assert.deepEqual(calls[1], ['pnpm', 'exec', 'wrangler', 'deploy']); checks++;
  calls.length = 0; await deployRelease({ ...options, action: 'upload' }, runner()); assert.deepEqual(calls[1], ['pnpm', 'exec', 'opennextjs-cloudflare', 'upload', '--tag', newer]); checks++;
  await writeFile(join(repo, 'source.txt'), 'dirty');
  await blocked('dirty prevents even build', options, runner()); assert.equal(calls.length, 0); git(repo, 'checkout', '--', 'source.txt');
  await blocked('mismatched built SHA', options, runner(() => artifact(base)));
  await blocked('stale artifact cannot survive build', options, async () => {});
  await blocked('build process failed', options, async () => { throw new Error('simulated build failure'); });
  await blocked('uncommitted change during build', options, runner(() => writeFile(join(repo, 'source.txt'), 'drift'))); git(repo, 'checkout', '--', 'source.txt');
  await blocked('HEAD drift during build', options, runner(() => { git(repo, 'commit', '--allow-empty', '-qm', 'racing commit'); })); git(repo, 'reset', '--hard', newer);
  await blocked('remote drift during build', options, runner(() => { git(repo, 'push', '-q', '--force', 'origin', `${base}:refs/heads/main`); })); git(repo, 'push', '-q', 'origin', 'main');
  await blocked('fresh fetch fails after build', options, runner(() => rename(remote, `${remote}.away`))); await rename(`${remote}.away`, remote);
  await blocked('symlink artifact', options, runner(() => symlink(join(repo, 'source.txt'), join(repo, '.open-next/linked.js'))));
  const lockPath = join(repo, '.git/pairvu-release.lock'); await writeFile(lockPath, '{"pid":0}'); await blocked('existing lock is never stolen', options, runner()); assert.equal(await readFile(lockPath, 'utf8'), '{"pid":0}'); await rm(lockPath);
  let releaseBuild, startedBuild;
  const started = new Promise(resolve => startedBuild = resolve), paused = new Promise(resolve => releaseBuild = resolve);
  const first = deployRelease(options, runner(async () => { startedBuild(); await paused; })); await started;
  await reject('concurrent release rejected', () => deployRelease(options, runner())); releaseBuild(); await first;
  const cliAlias = join(root, 'preflight-alias.mjs'); await symlink(join(source, 'scripts/release-preflight.mjs'), cliAlias);
  const invocation = spawnSync(process.execPath, [cliAlias], { cwd: repo, encoding: 'utf8' }); assert.equal(invocation.status, 1); assert.match(invocation.stderr, /Required/); checks++;
  const pkg = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.deploy, 'node scripts/deploy-release.mjs deploy'); assert.equal(pkg.scripts.upload, 'node scripts/deploy-release.mjs upload'); checks++;
  assert(logs.some(([line]) => JSON.parse(line).event === 'release-prepared')); checks++;
} finally { console.log = realLog; await rm(root, { recursive: true, force: true }); }
console.log(`PASS: ${checks} offline release checks; Git fetch/push used temporary local bare remote only; cloud build/deploy/upload runners were simulated, never executed.`);
