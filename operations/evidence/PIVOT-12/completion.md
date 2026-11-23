# PIVOT-12 — CursorBench historical-source repair

Implementation, independent candidate acceptance, production deployment and independent production acceptance are complete. Publicly enabled on existing routes, with no migration or feature flag.

## Delivered scope

- Existing `/benchmarks/cursorbench`, `/benchmarks`, `/leaderboard` and `/compare/claude-haiku-5-5-vs-claude-opus-5-5` now distinguish the retained4.0 historical snapshot from current official4.1 methodology, including its November18 task/time changes.
- All four original4.0 rows/configurations/prices and November16 collection date remain unchanged. No4.1 scores or cross-version comparison introduced.
- A downloadable factual JSON transcription links immutable old Git catalog and independent-review evidence. Original owner raw temporary captures are unavailable: this is explicitly retained Pairvu data, not recovered official archived HTML or newly verified current scores. November23 packaging is distinct from November16 collection.
- Titles/H1/canonicals/robots and prior links retained. Sitemap remains54URLs; only four changed pages' lastmods advance. No new HTML page, dependency, account/payment/DB work, GSC operation or automation edit.

## Release and independent acceptance

- Pushed/deployed SHA: `9ad36381b2140c647c0144e2d99dc266b525e5ae`.
- Cloudflare version: `9fe9ce87-9495-4db1-94dd-7cc21b5b1d7d`.
- Independent online confirmation: **November23,2026 10:39:01.868–10:39:05.240 Asia/Shanghai** (`02:39:01.868Z–02:39:05.240Z`). This is not an exact traffic-switch claim.
- [Original candidate review](qa-original.json):21assertionsPASS, all six frozen acceptance groups, one SSR invocation and one unchanged BrowseComp counterexample.
- [Original production review](qa-production-original.json):12assertionsPASS, exactly7GETs all200; exact actual SHA/version, four complete accepted rendered page bodies/metadata, byte-identical public JSON and54URL sitemap.
- [Release record](release-record.json) records fresh exact-remote/clean-tree/artifact gates. Formal historical controller lock/state remains untouched; registry records evidence, not an overridden lifecycle transition.

## Preserved diagnostics and actual execution

[Developer original](developer-original.json) retains a source-slice assertion failure caused by including an appended import. The rendered/data checks passed; moving imports to the top required only a [structural recheck](developer-structural-recheck.json), not another SSR. Do not relabel the original diagnostic as PASS.

An extra separator in the first deployment invocation was rejected before build/upload. The first correctly guarded build and TypeScript passed but uploader stopped before upload because the existing Cloudflare token was not exported. Loading only that key into the child environment and retrying the unchanged same-SHA guarded command necessarily rebuilt: **two successful production builds total, one upload**. Fresh release gates passed again; no release-tool/runtime fix, new credentials, framework or expanded suite. No further test/build/deployment is needed for evidence archival.

## Remaining / next action

1. Commit and push final documentation/evidence only; no second production release.
2. Existing **November25,2026 Wednesday10:00 Asia/Shanghai** read-only GSC review remains scheduled automatically with its original checks. It depends on a usable authenticated session/export; login needs user handoff. No GSC submission or task change was made by this repair, and no claim is made that this repair was separately added to that prompt.
3. Ingesting4.1 results or obtaining a separate owner-hosted historical archive is outside this completed repair. Any4.1 content implementation requires separate user authorization; nothing expands automatically.
