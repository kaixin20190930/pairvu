# Sprint 2 Status: Asset / Upload Pipeline

Status: Done

## Approved Scope

- M0 image validation.
- Anonymous upload retention fixed at 24 hours.
- R2 original asset storage.
- D1 metadata insertion.
- Basic deletion primitives.
- Local-safe API route scaffolding.

## Explicit Non-Scope

- Product checker UI.
- Image normalization/thumbnail generation.
- Vision/model calls.
- Analysis creation.
- Batch upload.
- Authenticated workspace upload.
- Public API product surface.

## Implementation Notes

- Anonymous uploads require an `anonymousSessionId`.
- Supported image MIME types: JPEG, PNG, WebP.
- M0 max image size: 10 MB.
- R2 object keys follow the documented anonymous/workspace layout.
- D1 migration `0001_foundation.sql` creates the minimal `assets` table needed for Sprint 2.

## Completed

- Added asset domain types.
- Added M0 image validation.
- Added SHA-256 checksum generation.
- Added R2 original asset storage service.
- Added D1 metadata repository.
- Added asset deletion primitives.
- Added `/api/assets/upload` route.
- Added D1 migration for the `assets` table.
- Added local/remote D1 migration scripts.

## Deviations

None currently.

## Unresolved Decisions

- Whether Sprint 2 should include thumbnail/normalization now or leave it to analysis preprocessing.
- Whether execution attempts need persistence before Sprint 4.

## New Risks

- The upload route requires local D1/R2 bindings through OpenNext/Cloudflare runtime; plain `next dev` without binding simulation may not fully exercise storage writes.

## Verification

- `pnpm run lint`: passed.
- `pnpm run typecheck`: passed.
- `pnpm run build`: passed.
- `pnpm opennextjs-cloudflare build`: passed with escalated local execution.

## Next Sprint

Sprint 3: M0 Evaluation Infrastructure.
