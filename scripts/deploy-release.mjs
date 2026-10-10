#!/usr/bin/env node
import { open, unlink, readFile, readdir, lstat, realpath, readlink } from 'node:fs/promises';
import { join, resolve, isAbsolute, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { preflight, assertLocalCandidate, parseOptions, isMain, ensure, git } from './release-preflight.mjs';
import { buildCloudRelease, verifyBuild, run } from './build-release.mjs';

export async function artifactDigest(repo) {
  const root = join(await realpath(repo), '.open-next');
  ensure((await lstat(root)).isDirectory(), 'Artifact root must be a real directory');
  const hash = createHash('sha256');
  async function statOrMissing(path) {
    try { return await lstat(path); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  // Resolve components in filesystem order: normalizing a/../ first could hide an
  // escaping symlink at a. Missing internal components are permitted, never read.
  async function resolveLink(path, parts, active = new Set()) {
    ensure(!active.has(path) && active.size < 128, 'Cyclic or excessive artifact symlink chain');
    const chain = new Set(active).add(path);
    const target = await readlink(path);
    let cursor = [...parts];
    let suffix = target;
    if (isAbsolute(target)) {
      ensure(target === root || target.startsWith(root + sep), 'Absolute artifact symlink escapes root');
      cursor = [];
      suffix = target.slice(root.length);
    }
    for (const component of suffix.split(sep)) {
      if (!component || component === '.') continue;
      const parent = await statOrMissing(join(root, ...cursor));
      ensure(!parent || parent.isDirectory(), 'Artifact symlink traverses a non-directory');
      if (component === '..') {
        ensure(cursor.length > 0, 'Artifact symlink escapes root');
        cursor.pop();
      } else {
        const next = join(root, ...cursor, component);
        const stat = await statOrMissing(next);
        if (stat?.isSymbolicLink()) cursor = await resolveLink(next, cursor, chain);
        else cursor.push(component);
      }
    }
    return cursor;
  }
  async function visit(path, parts) {
    const relative = ['.open-next', ...parts].join('/');
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) {
      const target = await readlink(path);
      await resolveLink(path, parts.slice(0, -1));
      hash.update(JSON.stringify(['symlink', relative, target]));
    } else if (stat.isDirectory()) {
      hash.update(JSON.stringify(['directory', relative]));
      for (const name of (await readdir(path)).sort()) await visit(join(path, name), [...parts, name]);
    } else {
      ensure(stat.isFile(), 'Unexpected artifact file type');
      const bytes = await readFile(path);
      hash.update(JSON.stringify(['file', relative, bytes.length])); hash.update(bytes);
    }
  }
  // Never walk through symlinks. Actual target files are hashed at their tree paths.
  await visit(root, []);
  await readFile(join(root, 'worker.js'));
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
