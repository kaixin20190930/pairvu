# Privacy Principles

## Product Position

Users may upload unreleased products. Privacy is a core product feature, not a footer detail.

## Baseline Commitments

From early commercial release:

- clear retention period;
- user-controlled delete;
- workspace-level asset deletion;
- explicit statement of third-party model processing;
- no use of customer assets for internal training by default;
- separate opt-in for improving QA;
- audit fields for deletion.

## Anonymous Uploads

Anonymous images should have short default retention unless the user creates an account.

Exact retention duration is a policy decision, but the architecture must support:

- automatic deletion jobs;
- original asset deletion;
- derivative deletion;
- metadata tombstoning or removal where required;
- analysis data deletion according to policy.

## Model Data Exposure

Record which asset was sent:

- to which provider;
- at what time;
- for what purpose;
- under which workspace;
- with which retention policy.

This enables privacy reporting, provider migration, and enterprise restrictions.

## Evaluation And Training Boundaries

Customer production assets must not silently become evaluation fixtures or training data.

Separate:

- Customer Production Data
- Evaluation Fixtures
- Training Data

Production feedback may only be promoted into evaluation or training datasets after explicit review, permission validation, and data-cleaning. If a customer deletes production assets, Golden Evaluation fixtures must not depend on those deletable assets unless the user has granted separate permission and the data has been copied into eval-controlled storage.

## Tenant Isolation

All customer-owned entities must be scoped by `workspace_id`.

Do not rely only on client-provided IDs. Add automated tenant-isolation tests before Business plan launch.
