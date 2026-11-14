# PIVOT-04 Stage A developer report

Only Stage A was implemented. Stages B, C, and D remain gated by independent QA and production verification of Stage A.

## Validation

- `pnpm run test:model-pivot`: PASS — 14 models, 35 sitemap URLs, 9 comparisons; explicit open-source target assertions, six SEO records, price-boundary and Qwen4 lifecycle assertions.
- `pnpm exec tsc --noEmit`: PASS.
- `pnpm run lint`: PASS with zero errors and 16 pre-existing warnings.
- `pnpm build`: PASS; 107 routes generated.
- Targeted production-server HTTP: `/models`, open-source page, six priority comparisons, and Qwen 4 model page all 200; `/guides` and `/guides/` 410; `/examples` 301 to `/`; `/checks` 301 to `/leaderboard`; `/api/health` 200; unknown route 404.
- Rendered checks: `/models`, open-source page, and Claude/GPT page expose expected unique title, H1, and self-canonical. Temporary server stopped.

After the controller corrected the six-page SEO set, the “open source LLMs” target, and “Qwen 4 Max Preview” spacing, the focused inventory test passed again. A first `next dev` rendering attempt was stopped after the environment hit `EMFILE` watcher exhaustion plus sandbox-denied Wrangler log/registry writes and served 404 fallback pages; those 404s are not claimed as a product PASS. A clean production build then passed, including its internal TypeScript phase, and `next start` returned 200 with the expected Title/H1 for all six priority comparisons, the open-source page, and Qwen 4 profile. The production server was stopped. A separate post-build `tsc --noEmit` invocation reports a generated `.next/types/validator.ts` `Route`/`never` error even though the exact-current Next build TypeScript phase passes; this remains explicit for independent QA rather than being relabelled PASS.

## QA typecheck repair

The original Stage A QA FAIL is preserved in `operations/evidence/PIVOT-04/qa/stage-a/qa.json`. Root cause was `tsconfig.json` compiling both production `.next/types` and temporary `.next/dev/types`: the production route declarations define the root layout, while the failed dev artifact declared an empty route set and global `LayoutRoutes = never`. Removing the redundant dev-generated include leaves the `next-env.d.ts`-referenced production type directory as the single route declaration source. After this minimal configuration repair, `pnpm typecheck`, `pnpm run test:model-pivot`, and `git diff --check` all pass. No runtime route, content, middleware, dependency, or Stage B file changed.

### Stable build-compatible repair

The first repair candidate was correctly blocked at release because Next restored its default `.next/dev/types/**/*.ts` include during build, making the committed tree dirty. The stable repair keeps both Next-managed include entries so Next no longer rewrites `tsconfig.json`, and adds `.next/dev/types/**/*.ts` to TypeScript `exclude`. A full `pnpm build` preserved the exact `tsconfig.json` checksum before and after (`5ab72107d0aa1fa6e60fccb99789687520bce72f`), completed all 107 routes and its TypeScript phase, and was followed by a passing `pnpm typecheck`. The original QA and blocked-release records remain unchanged. No release gate was bypassed or weakened.

No push, deploy, GSC write, database, account, Stripe, API, or customer-data operation was performed. Existing read-only observation tasks were updated by the controller; the roadmap records their cadence and Qwen4 check at 2026-11-26 09:00 Asia/Shanghai. Candidate SHA is supplied after commit.
