# PIVOT-04 Stage D developer report

Date: 2026-11-15  
Baseline: `7daa548307ac3c21b33dbf6cfa03424ee1fb6258`  
Role: `/root/pivot01_developer`, inherited GPT-6.1 Sol/high  
State: development complete; pending parent-created fixed candidate SHA and independent QA

## Gate and frozen scope

Stage C passed independent production acceptance at release `7daa548307ac3c21b33dbf6cfa03424ee1fb6258`, Cloudflare version `1679090a-dc7d-466f-9736-8c3202a82431`. The original receipt is preserved at `operations/evidence/PIVOT-04/production-2026-11-15/stage-c-production-qa.json`.

Stage D adds exactly four pages:

- `/models/claude-sonnet-5-5`
- `/compare/claude-sonnet-5-5-vs-claude-opus-5-5`
- `/models/muse-wonder`
- `/compare/muse-wonder-vs-gpt-5-2`

Final inventory is 43 sitemap URLs, 16 model profiles, and 15 comparison pages including the fixed three-model page. All 16 models have at least one comparison inbound link. No remaining candidate model, new benchmark, or bulk page was added.

## Facts and implementation

- Claude Sonnet 5.5 uses Anthropic's owner sources for model ID `claude-sonnet-5-5`, 2026-09-28 launch, 1M context, Claude API availability, multimodal input, and USD 2/M input plus USD 10/M output.
- Claude Opus 5.5's reused record now links its own Anthropic model page rather than the Fable page, and exposes exact ID, availability, modality, access, and USD 4/M plus USD 20/M pricing.
- Muse Wonder uses Meta owner sources for the 2026-10-12 launch, model ID `muse-wonder-1.0`, 1,048,576-token context, preview state, input modalities, Model API / Muse Code availability, and Standard-mode USD 4/M input plus USD 20/M output. The page explicitly states that max reasoning effort does not select Muse Wonder Full.
- The initially inspected Cursor model page described a 300K Cursor routing window and channel billing. That conflicted with Meta's model-owner context and preview facts, so it was not retained as the model specification or price source. Cursor remains only the owner of the cited CursorBench harness.
- Sonnet vs Opus uses the approved canonical slug and provides a pair-specific price/workload decision. It notes that CursorBench covers both exact models but remains harness-specific.
- Muse Wonder vs GPT-5.2 is explicit that preview acceptance, API surface, multimodality, and context are the decision boundaries; no cited common exact-version harness means no direct quality score.
- Shared model and comparison templates received only finite fields for model ID, availability status, and optional maximum context. Source-check dates now derive from each page's records.

The full first-party fact map is in `stage-d-source-inventory.md`.

## Validation

After the Meta-owner correction and approved Sonnet slug correction:

| Command | Result |
|---|---|
| `pnpm run test:model-pivot` | PASS: 16 models, 43 sitemap URLs, 15 comparisons, no orphan model |
| `pnpm typecheck` | PASS |
| `git diff --check` | PASS |
| `pnpm build` | PASS: Next 16.2.12 compiled, typed, and generated 115 static pages; existing middleware deprecation warning only |

Targeted production-build HTTP:

| Path | Result |
|---|---|
| Four Stage D paths listed above | 200 |
| `/models/claude-opus-5-5`, `/models/gpt-5-2` | 200; new comparison backlinks visible through shared data |
| `/compare/claude-sonnet-5-5-vs-opus-5-5` | 404; unapproved alternate slug is not published |
| `/api/health` | 200 |
| `/guides`, `/guides/` | 410 / 410 |
| `/examples` | 301 to `/` |
| `/checks` | 301 to `/leaderboard` |
| `/unknown-pivot04-stage-d` | 404 |

Content extraction confirmed Sonnet and Opus profile links, price/workload verdict and CursorBench qualification; Muse ID, release, preview, Meta API price, Full-variant boundary, profile links, and no-common-harness warning.

## Boundaries and next action

No account, Stripe, API data, customer data, database, GSC, production, push, deploy, CMS, crawler, live FX, new benchmark row, or remaining-model work occurred. No temporary test account or asset was created.

The parent should confirm temporary local server cleanup, inspect the complete tree, create the fixed candidate commit including the Stage C production receipt and Stage D evidence, and dispatch independent Stage D QA. Production release remains subject to the repository's GitHub-first rule and exact-SHA verification.
