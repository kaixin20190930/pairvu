#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

export const FULL_SHA = /^[a-f0-9]{40}$/;
export function ensure(value, message) { if (!value) throw new Error(message); }
export function git(repo, ...args) {
  try { return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch { throw new Error(`Git check failed (${args[0]}); release blocked`); }
}
export function assertLocalCandidate({ repo, candidate }) {
  ensure(typeof candidate === 'string' && FULL_SHA.test(candidate), 'A full lowercase 40-character candidate SHA is required');
  ensure(git(repo, 'rev-parse', '--verify', `${candidate}^{commit}`) === candidate, 'Candidate is not a commit');
  ensure(git(repo, 'rev-parse', 'HEAD') === candidate, 'HEAD does not match candidate');
  ensure(git(repo, 'status', '--porcelain=v1', '--untracked-files=all', '--ignore-submodules=none') === '', 'Working tree/index must be completely clean');
}
export function preflight(options) {
  const { repo, candidate, remote, branch } = options;
  ensure(typeof remote === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(remote), 'Specify a configured remote name');
  ensure(typeof branch === 'string' && !branch.startsWith('-'), 'Specify a branch');
  git(repo, 'check-ref-format', `refs/heads/${branch}`);
  ensure(git(repo, 'remote').split('\n').includes(remote), 'Remote is not configured');
  assertLocalCandidate(options);
  // A unique ref prevents stale FETCH_HEAD or remote-tracking refs from being accepted.
  const ref = `refs/pairvu-preflight/${randomUUID()}`;
  let remoteSha;
  try {
    git(repo, 'fetch', '--no-tags', '--no-recurse-submodules', '--no-write-fetch-head', remote, `refs/heads/${branch}:${ref}`);
    remoteSha = git(repo, 'rev-parse', '--verify', `${ref}^{commit}`);
    ensure(remoteSha === candidate, 'Fresh remote branch tip does not equal candidate');
    assertLocalCandidate(options);
  } finally { git(repo, 'update-ref', '-d', ref); }
  return { candidateSha: candidate, remote, branch, remoteSha, checkedAt: new Date().toISOString() };
}
export function parseOptions(args, withAction = false) {
  const options = { repo: process.cwd() };
  if (withAction) { options.action = args.shift(); ensure(['deploy', 'upload'].includes(options.action), 'Expected deploy or upload'); }
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.slice(2);
    ensure(args[i]?.startsWith('--') && ['candidate', 'remote', 'branch'].includes(key) && !Object.hasOwn(options, key) && args[i + 1] && !args[i + 1].startsWith('--'), 'Expected --candidate SHA --remote NAME --branch BRANCH; no extra flags permitted');
    options[key] = args[i + 1];
  }
  ensure(options.candidate && options.remote && options.branch, 'Required: --candidate SHA --remote NAME --branch BRANCH');
  return options;
}
export async function isMain(url) {
  return !!process.argv[1] && await realpath(fileURLToPath(url)) === await realpath(resolve(process.argv[1]));
}
if (await isMain(import.meta.url)) {
  try { console.log(JSON.stringify(preflight(parseOptions(process.argv.slice(2))), null, 2)); }
  catch (error) { console.error(`release-preflight: ${error.message}`); process.exitCode = 1; }
}
