# PIVOT-04 Stage C developer report

Date: 2026-11-15  
Baseline: `baea0b1b2e0cc656605bdfa783a7644d6399481e`  
Role: `/root/pivot01_developer`, inherited GPT-6.1 Sol/high  
State: development complete; pending parent-created fixed candidate SHA and independent QA

## Gate and scope

Stage B passed production acceptance at release `baea0b1b2e0cc656605bdfa783a7644d6399481e`, Cloudflare version `b61e69ae-9e1e-483c-9601-dca6e61372a9`. The original acceptance receipt is preserved at `operations/evidence/PIVOT-04/production-2026-11-15/stage-b-production-qa.json`.

This change is Stage C only. It changes no sitemap route, model, comparison, or benchmark count: 39 sitemap URLs, 14 model profiles, 13 comparison pages, two benchmark detail pages.

## Implementation

- `/benchmarks`: visible coverage matrix with version/date, Pairvu coverage, configuration/cost semantics, and limitations; explicitly rejects a composite score across unrelated harnesses.
- `/benchmarks/cursorbench`: owner method, version 4.0, snapshot date, three-row coverage boundary, exact named effort configurations, owner-reported run cost, catalog/profile coverage, limitations, and links to both covered model profiles and their comparison.
- `/benchmarks/browsecomp`: OpenAI 2025 original release and Z.ai 2026 vendor report remain in separate tables. Both show configuration, cost-reporting state, catalog/profile coverage, date, method, and limitations. The OpenAI 51.5% row is corrected from the unsupported “64 trials” label to the release-table label “Deep research.”
- `lib/models/catalog.ts`: finite benchmark metadata only; no new system, model, score synthesis, or collection architecture.
- `scripts/verify-model-pivot.ts`: Stage C assertions for method/version/date/coverage/configuration/cost state, source separation, composite-score boundary, and unchanged inventory.
- Product roadmap and task registry now record the Stage B production gate, Stage C result, and Stage D block.

Owner-source details and claim boundaries are in `stage-c-source-and-coverage-inventory.md`.

## Validation

| Command | Result |
|---|---|
| `pnpm run test:model-pivot` | PASS: 14 models, 39 sitemap URLs, 13 comparisons, two benchmark detail pages |
| `pnpm typecheck` | PASS |
| `git diff --check` | PASS |
| `pnpm build` | PASS: Next 16.2.12 compiled, typed, and generated 111 static pages; existing middleware deprecation warning only |

Targeted `pnpm start` HTTP:

| Path | Result |
|---|---|
| `/benchmarks` | 200; coverage matrix and no-composite statement visible |
| `/benchmarks/cursorbench` | 200; method, snapshot date, config, cost, coverage, and model links visible |
| `/benchmarks/browsecomp` | 200; separate 2025 owner / 2026 vendor tables, exact context strategies, unreported cost, and warning visible |
| `/models/glm-5`, `/models/fable-5-2`, `/compare/minimax-m2-1-vs-glm-5` | 200 |
| `/api/health` | 200 |
| `/guides`, `/guides/` | 410 / 410 |
| `/examples` | 301 to `/` |
| `/checks` | 301 to `/leaderboard` |
| `/unknown-pivot04-stage-c` | 404 |

The temporary Next server was stopped. One content-extraction command initially lost `rg` from PATH because the zsh loop variable was named `path`; the HTTP matrix itself used absolute `curl` and completed. Content extraction was immediately rerun with the absolute bundled `rg` path and passed. This was a shell-harness issue, not a product failure.

## Boundaries and next action

No account, Stripe, API data, customer data, database, GSC, production, push, deploy, CMS, crawler, live FX, new URL, or Stage D change occurred. No temporary test asset or account was created. The parent should inspect the whole tree, create the fixed candidate commit including the Stage B production receipt and Stage C evidence, and dispatch independent Stage C QA. Stage D must wait for Stage C production acceptance.
