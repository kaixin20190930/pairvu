# PIVOT-06-COPY developer handoff

- Scope: only `app/best/chinese-models/page.tsx`; Qwen3.5 list item now says `view its Pairvu model profile` and links through `href={`/models/${qwen35Candidate.slug}`}`. Bold model name and official source are retained.
- Exact diff: one old sentence replaced by the Next `Link` phrase/link. No other runtime files changed by this role. Existing unrelated worktree changes remain: `operations/backlog.json`, `operations/task-registry.json`, and untracked `operations/contracts/PIVOT-06-COPY.md`.
- SSR: `NODE_PATH='/Users/liukai/Documents/Product Visual QA Platform/node_modules' pnpm exec tsx /private/tmp/pairvu-pivot06-copy/ssr-probe.tsx` — PASS. It uses `renderToStaticMarkup`, with `globalThis.React` set in the temporary probe. Assertions: target href `/models/qwen3-5-397b-a17b`, natural profile link text present, old claim absent, exactly 8 candidate `<li>` entries, Qwen official source retained, and slug present in `modelMap`.
- Evidence: `/private/tmp/pairvu-pivot06-copy/ssr-probe.tsx` and `/private/tmp/pairvu-pivot06-copy/ssr-evidence.json`.
- Minimal QA rerun: `NODE_PATH='/Users/liukai/Documents/Product Visual QA Platform/node_modules' pnpm exec tsx /private/tmp/pairvu-pivot06-copy/ssr-probe.tsx` from the repo root.
- No commit, push, deployment, service, or test asset created. No deployment authorization inferred.
