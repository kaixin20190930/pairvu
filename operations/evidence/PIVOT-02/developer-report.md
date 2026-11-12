# PIVOT-02 developer report

Implemented the contracted 12-model public inventory, structured provider/region/currency/mode/date pricing, Qwen alias redirect, four-comparison endpoint links, benchmark interlinks, BrowseComp split tables, two eight-candidate source-backed lists, privacy rewrite, `/legacy`, sitemap and focused verification.

No accounts, API customer data, Stripe, GSC, database, production deployment, new comparison combinations, crawler, CMS, or scheduler were changed. `/legacy` is not present in the main header navigation.

## Validation

- `pnpm run test:model-pivot`: PASS (12 models, 26 sitemap URLs, two eight-candidate lists).
- `pnpm exec tsc --noEmit`: PASS.
- `pnpm run lint`: PASS with 16 pre-existing warnings, zero errors.
- `pnpm build`: PASS, 98 static/dynamic routes generated.
- `pnpm exec opennextjs-cloudflare build`: PASS; `.open-next/worker.js` generated.
- Next production server targeted HTTP: canonical Qwen/profile/compare/benchmark/best/privacy/legacy 200; both alias shapes 301 single-hop; both `/guides` shapes 410; `/examples` and `/checks` retain 301; `/api/health` 200; unknown route 404.
- `/api/runtime-config` reached its handler but returned 500 under `next start` because Cloudflare development context was not initialized. This is an environment-specific negative result, not a middleware redirect or rewrite; the OpenNext production bundle itself passed.

Candidate SHA is recorded in the controller handoff after commit creation.

## QA attempt-1 repair

The original FAIL evidence in `qa/attempt-1` is preserved. The BrowseComp vendor section now shows the 2026-02-12 report date and the source-defined context policies: latest-five-turn retention without context management, and discard-all with context management. OpenNext evidence is reused because middleware and dependencies did not change.
