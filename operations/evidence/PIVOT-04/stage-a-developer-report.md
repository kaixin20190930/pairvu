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

No push, deploy, GSC write, database, account, Stripe, API, or customer-data operation was performed. Existing read-only observation tasks were updated by the controller; the roadmap records their cadence and Qwen4 check at 2026-11-26 09:00 Asia/Shanghai. Candidate SHA is supplied after commit.
