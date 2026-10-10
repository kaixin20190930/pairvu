# Pairvu Repository Constitution

These rules are mandatory for every contributor and coding agent working in
this repository.

## Production Deployment Rule

Production must only receive code that is already committed to Git and pushed
to the project's GitHub repository. There is no emergency or convenience
bypass for this rule.

The required release order is:

1. Inspect the complete working tree and preserve unrelated user changes.
2. Run the validation appropriate to the change and resolve every blocking
   failure.
3. Commit every file that will affect the production release.
4. Push the release commit to the intended GitHub branch.
5. Fetch the remote branch and verify that the exact local release commit is
   present on that remote branch. The production-related working tree must be
   clean.
6. Apply any required production database migrations from that pushed commit.
7. Deploy that same commit to production.
8. Run a targeted production smoke test and record the deployed commit and
   platform version or deployment identifier.

Do not run a production deployment command from uncommitted code, from a local
commit that has not been pushed, or while the remote-commit check is
inconclusive. Stop and report the blocker instead.

## Upgrade Development and Independent Acceptance

For automated upgrade work, read `operations/README.md`,
`operations/controller-prompt.md`, and the active unit contract first.
Use one controller, one developer, and an independent reviewer. Bind acceptance
to the exact candidate commit and preserve the original review evidence.
The local controller has no deployment authority: runtime units stop at
RELEASE_READY. Never treat local QA as production verification.
The Production Deployment Rule above remains mandatory.
