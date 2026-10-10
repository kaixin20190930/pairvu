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
Absent explicit user authorization for a release, runtime units stop at
RELEASE_READY. Explicit authorization permits the release only through the
Production Deployment Rule above. Never treat local QA as production verification.
The Production Deployment Rule above remains mandatory.

## Task-specific Model Selection

Follow `operations/model-selection-policy.md` before creating or reusing a
development or acceptance task. Choose model and reasoning effort according to
actual complexity, risk, and required capability; never default to the most
expensive model or choose the cheapest solely to save cost. Record each role's
choice, rationale, and escalation condition in the task registry and contract.
Reassess each unit without weakening independent acceptance.

## Controller Completion Report

Every controller completion report must include an explicit next action, its
dependency or blocker, and whether it will proceed automatically or needs user input.
Distinguish implementation, deployment, feature enablement, and acceptance.
