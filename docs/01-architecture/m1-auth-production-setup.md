# M1 Authentication Production Setup

Status: `GOOGLE_PRODUCTION_VERIFIED`

Last updated: 2026-08-10

## Architecture Decision

Pairvu uses Better Auth on the existing Cloudflare Worker and D1 database.
Authentication methods are Google OAuth and email magic link. Pairvu does not
store passwords in M1.

The ownership boundary is:

```text
Better Auth user and session
  -> Pairvu personal workspace and owner membership
  -> plan, retention, and credit entitlements
```

The public single-image checker remains available without authentication.
Sign-in is required for account history, batch checking, export, and paid
capacity. Authentication does not replace Pairvu's workspace authorization
checks.

## Production Credentials

### Google OAuth

Create a Google OAuth 2.0 Web application with:

- Authorized JavaScript origin: `https://pairvu.com`
- Authorized redirect URI: `https://pairvu.com/api/auth/callback/google`

Store the resulting client ID and client secret as Worker secrets.

### Email Magic Link

Verify a Pairvu sending domain in Resend and create an API key. The configured
sender must be authorized by Resend. The default application value is:

```text
Pairvu <sign-in@pairvu.com>
```

Magic links expire after 10 minutes, are stored hashed, and are rate limited.

### Better Auth Secret

Generate a random secret with at least 32 characters. Do not reuse an OpenAI,
Cloudflare, Google, or Stripe secret.

## Cloudflare Configuration

Run each secret command from the repository root and paste the value only when
Wrangler prompts for it:

```bash
pnpm exec wrangler secret put BETTER_AUTH_SECRET
pnpm exec wrangler secret put GOOGLE_CLIENT_ID
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
pnpm exec wrangler secret put RESEND_API_KEY
```

The non-secret production values are defined in `wrangler.jsonc`:

```text
BETTER_AUTH_URL=https://pairvu.com
AUTH_EMAIL_FROM=Pairvu <sign-in@pairvu.com>
AUTH_TRUSTED_ORIGINS=https://pairvu.com,https://www.pairvu.com
```

## Release Sequence

1. Configure Google OAuth. Configure Resend only when email fallback is needed.
2. Set Better Auth and Google Worker secrets; add Resend secrets only when enabled.
3. Apply the D1 migration with `pnpm run db:migrate:remote`.
4. Deploy with `pnpm run deploy`.
5. Verify Google sign-in, sign-out, and session restoration. Verify email magic links only when Resend is enabled.
6. Confirm a first-time account has one personal workspace and exactly 10 Free
   checks for the current UTC calendar month.
7. Confirm the anonymous checker still works without sign-in.

Do not enable a visible production sign-in method until its provider credentials
and callback configuration are complete. Do not run the remote migration against
an unconfirmed D1 binding.

## Local Verification

Local development reads `.dev.vars`. Never commit that file. Run:

```bash
pnpm run db:migrate:local
pnpm run test:m1:account-foundation
pnpm run typecheck
pnpm run build
```

The local sign-in page intentionally reports that authentication is being
configured when neither Google nor Resend credentials are present. The public
checker remains usable in that state.
## Production Verification Status

Google OAuth is the primary M1 sign-in method and has been verified on the production domain, including account data, page refresh, and logout. Resend magic links remain supported by the implementation but are optional and are not a launch dependency while Google sign-in is healthy.

Authenticated uploads are owned by the user's personal workspace. Free workspaces retain image assets for 7 days; paid plan definitions retain them for 30 days. Anonymous assets remain isolated and expire after 24 hours. A signed-in single analysis reserves one monthly check, settles it only after a completed verdict, and releases it on provider or system failure.

The existing 15-minute scheduled maintenance releases abandoned credit reservations as well as deleting expired anonymous and workspace assets. `pnpm run test:m1:credit-reconciliation` reconstructs the balance from ledger deltas and verifies replay-safe grant, reserve, settle, release, exhaustion, and expiry behavior.
