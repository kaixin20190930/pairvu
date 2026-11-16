# PIVOT-05 stage 2 developer handoff

2026-11-16. Fixed application candidate: `dd93fab3bcd3ece4cc7e32f8d18c025ebcb51d20`, based on `a70d6fd`. Implementation and local verification are complete; independent acceptance, deployment and public enablement remain pending. This report is intentionally untracked for the controller to archive with QA evidence. No push/deploy, account/API/DB/customer/GSC writes, extra model/comparison URLs, or new benchmark/framework were performed.

## Exact diff

Seven committed paths: `lib/models/catalog.ts`, `app/models/[slug]/page.tsx`, `app/compare/[slug]/page.tsx`, `app/benchmarks/page.tsx`, `app/benchmarks/[bench]/page.tsx`, `app/sitemap.ts`, `scripts/verify-model-pivot.ts`.

Exactly two new URLs: `/models/claude-haiku-5-5` and `/compare/claude-haiku-5-5-vs-claude-opus-5-5`. The new profile and comparison use the approved Title/H1/Description. Existing directories derive their entries from the catalog; Haiku/Opus/Sonnet 5.5 profiles reuse each other through family links, with no additional family comparison. The existing CursorBench snapshot gains one Haiku Max row. The comparison shows only the two exact Max rows, their cost/date/harness limitations, and workload-specific guidance without a speed claim. Pricing preserves both prompt-length tiers on the profile and comparison; matrix first quotes retain the threshold. Sitemap remains free of legacy directories and now has 45 URLs / 17 models / 16 comparisons, with no orphan model. `/compare` lastmod advances to the actual 2026-11-16 update; no first-publication date is reset.

## Official facts checked on 2026-11-16

- [Anthropic exact Haiku 5.5 overview](https://platform.claude.com/docs/en/models/haiku-5-5/overview): model ID `claude-haiku-5-5`; released 2026-10-07; 1M context; active/latest; text/image inputs and text output. Standard Claude API prompts <=100,000 input tokens cost USD 0.10 input / 0.50 output per million; prompts >100,000 cost 0.50 / 2.50. The prompt-length threshold governs both rates. Cache and batch billing differ; the headline “From” value is not treated as a universal price. Other documented cloud offerings do not imply identical cloud billing.
- [Anthropic exact Opus 5.5 overview](https://platform.claude.com/docs/en/models/opus-5-5/overview): rechecked `claude-opus-5-5`, 2026-09-22 release, 1M context, active/latest, standard USD 4 / 20 per million and long-running coding/knowledge-work guidance. Existing accepted catalog values remain unchanged.
- [CursorBench owner leaderboard](https://cursor.com/cursorbench): version 4.0; Haiku 5.5 Max 48.4%, USD 1.12/task; Opus 5.5 Max 57.8%, USD 13.43/task. Both use the owner's Max effort label and Cursor harness. Named effort does not establish identical token use or compute. Costs describe observed task runs, not token rates or speed. Collection/check date is 2026-11-16; version introduction remains 2026-09-10. Individual result publication dates are not stated and remain unknown.

No required exact-model fact is missing. Unchanged earlier source snapshots, the old-version comparisons and other prices are reused from independently accepted stage 1; they were not broadly re-audited.

## Actual validation and provenance

- `pnpm test:model-pivot`: PASS, exit 0, 45/17/16 and no orphan model. Existing script expectations updated only for the approved inventory and relevant new facts. Its first run before updating the old inventory assertion returned `17 !== 16`; after the contracted expectation update the check passed. No product failure was inferred from that expected assertion change.
- `pnpm typecheck`: PASS, exit 0. `git diff --check`: PASS.
- Developer's first precise `git add` was denied creating `.git/index.lock`; the required escalated retry waited 293.9 seconds and was aborted by the user. This permission wait was reported to the controller and is not a product failure. The controller then committed exactly the seven paths above. No further developer Git writes were attempted.
- The tree was completely clean at candidate build start. Exactly one `pnpm build` passed, exit 0: Next.js 16.2.12, compile 4.8s, TypeScript 9.6s, static generation 562ms. Raw log: `/private/tmp/pivot05-stage2-build.log`. Existing middleware deprecation / experimental-edge warnings were non-blocking. Both `.next/required-server-files.json` and actual `/api/health` bind `buildSha` to the exact candidate above. Local platformVersion remains `unknown`; this is not production evidence.
- Raw HTTP result: `/private/tmp/pivot05-stage2-http-result.json`; saved response HTML and sitemap: `/private/tmp/pivot05-stage2-http/`; temporary bounded checker: `/private/tmp/pivot05-stage2-http.py`. Ten targets returned 200 with exactly one Title/H1/self canonical: new two pages, Opus/Sonnet profiles, model/comparison directories, CursorBench detail/hub, pricing, and one old comparison counterexample. New descriptions also match the approved text. Tier prices, same-Max rows/cost/date limits, directory/bidirectional/family links passed. The new Max table is absent from Claude-vs-GPT. Sitemap parses as 45 unique URLs / 17 models / 16 comparisons with no old directory.
- HTTP route probes passed: `/guides` and `/guides/` 410; `/examples` 301 directly to `/`; `/checks` 301 directly to `/leaderboard`; unknown route 404; health 200 with candidate SHA. No full 43-page or business/account regression was repeated; unchanged complete legacy/business evidence is reused from the frozen earlier acceptance.
- Initial temporary HTTP assertion failed because React text boundaries produce whitespace between `USD` and the number. Inspection confirmed the right rendered values. Normalized whitespace in the temporary checker and reran successfully; no application change or rebuild followed. Original diagnostic remains in the tool transcript.

Network/build waits completed without retry loops. The isolated Git permission wait above is recorded separately from product validation; no source investigation or diagnostic expansion exceeded the frozen stage scope.

## QA reuse and cleanup

The retained server is `pnpm exec next start --hostname 127.0.0.1 --port 3216`, started with `tty:true`. Tool session **59606**, listener PID **40633**, URL `http://127.0.0.1:3216`.

QA should bind its acceptance to the fixed candidate, compare the actual diff and official facts independently, and reuse this build/service. Optional targeted checker: `python3 /private/tmp/pivot05-stage2-http.py`. After QA, close the controlled PTY through `write_stdin({session_id:59606, chars:"\u0003"})`, then verify port 3216 has no listener. Do not request a cross-sandbox process kill. No test accounts, uploads or database assets exist to clean up. Preserve the report and necessary raw evidence.

Next action: controller dispatches independent QA automatically with the fixed SHA and retained PTY. Deployment/public enablement wait for QA and the GitHub-first production gates. No further application work or page expansion starts automatically.
