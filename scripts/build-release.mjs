#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ensure, isMain } from './release-preflight.mjs';

export function run(command, args, { cwd, env = process.env } = {}) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  ensure(!result.error && result.status === 0, `${command} ${args[0]} failed; release stopped`);
}
export async function verifyBuild(repo, candidate) {
  const manifest = JSON.parse(await readFile(join(repo, '.next/required-server-files.json'), 'utf8'));
  ensure(manifest.config?.env?.PAIRVU_BUILD_SHA === candidate, 'Built SHA does not match release candidate');
}
export async function buildCloudRelease(repo, candidate, runner = run) {
  // Remove only generated output: old artifacts must never satisfy a new release.
  await rm(join(repo, '.next'), { recursive: true, force: true });
  await rm(join(repo, '.open-next'), { recursive: true, force: true });
  await runner('pnpm', ['exec', 'opennextjs-cloudflare', 'build'], { cwd: repo });
  await verifyBuild(repo, candidate);
}
if (await isMain(import.meta.url)) {
  try {
    ensure(process.argv.length === 2, 'Local build accepts no override flags');
    run('pnpm', ['exec', 'next', 'build'], { cwd: process.cwd() });
  } catch (error) { console.error(`build-release: ${error.message}`); process.exitCode = 1; }
}
