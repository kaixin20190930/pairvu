#!/usr/bin/env node
import { open, unlink, readFile, readdir, lstat, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { preflight, assertLocalCandidate, parseOptions, isMain, ensure, git } from './release-preflight.mjs';
import { buildCloudRelease, verifyBuild, run } from './build-release.mjs';

export async function artifactDigest(repo) {
  const hash = createHash('sha256');
  async function visit(path, relative) {
    const stat = await lstat(path);
    ensure(!stat.isSymbolicLink(), 'Symlink in release artifact');
    if (stat.isDirectory()) for (const name of (await readdir(path)).sort()) await visit(join(path, name), `${relative}/${name}`);
    else { ensure(stat.isFile(), 'Unexpected artifact file type'); const bytes = await readFile(path); hash.update(JSON.stringify([relative, bytes.length])); hash.update(bytes); }
  }
  await readFile(join(repo, '.open-next/worker.js'));
  await visit(join(repo, '.open-next'), '.open-next');
  return hash.digest('hex');
}
// runner injection is a programmatic test seam only. CLI has no skip/test/runner/env bypass.
export async function deployRelease(options, runner = run) {
  ensure(['deploy', 'upload'].includes(options.action), 'Invalid release action');
  const repo = await realpath(options.repo);
  ensure(repo === await realpath(git(repo, 'rev-parse', '--show-toplevel')), 'Run release from repository root');
  options = { ...options, repo };
  const lockPath = resolve(repo, git(repo, 'rev-parse', '--git-common-dir'), 'pairvu-release.lock');
  const lock = await open(lockPath, 'wx').catch(() => { throw new Error('Release lock unavailable; inspect owner, never automatically reclaim'); });
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, candidate: options.candidate, action: options.action }));
    const initial = preflight(options);
    await buildCloudRelease(repo, options.candidate, runner);
    const digest = await artifactDigest(repo);
    const final = preflight(options);
    await verifyBuild(repo, options.candidate);
    ensure(await artifactDigest(repo) === digest, 'Artifacts changed after build');
    assertLocalCandidate(options);
    const record = { ...final, action: options.action, artifactSha256: digest, initialCheckedAt: initial.checkedAt };
    console.log(JSON.stringify({ event: 'release-prepared', ...record }));
    // No automatic push, migration, retries, or arbitrary passthrough arguments.
    if (options.action === 'deploy') await runner('pnpm', ['exec', 'wrangler', 'deploy'], { cwd: repo, env: { ...process.env, OPEN_NEXT_DEPLOY: 'true' } });
    else await runner('pnpm', ['exec', 'opennextjs-cloudflare', 'upload', '--tag', options.candidate], { cwd: repo });
    console.log(JSON.stringify({ event: 'release-command-completed', ...record, platformVersion: 'unknown', smoke: 'required' }));
    return record;
  } finally { await lock.close(); await unlink(lockPath); }
}
if (await isMain(import.meta.url)) {
  try { await deployRelease(parseOptions(process.argv.slice(2), true)); }
  catch (error) { console.error(`deploy-release: ${error.message}`); process.exitCode = 1; }
}
