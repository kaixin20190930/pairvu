# Pairvu Product Documentation

This is the working documentation baseline for Pairvu.

Current status reconciled on 2026-10-10:
[Production verification and prioritized remaining tasks](04-roadmap/production-status-and-backlog-2026-10-10.md).
Use this report for deployment evidence and open acceptance items; old sprint
and M0 launch snapshots preserve historical decisions.

## Recommended Reading Order

1. [Business Analysis](05-business/product-analysis.md)
2. [Product Thesis](00-foundation/product-thesis.md)
3. [Product Boundaries](00-foundation/product-boundaries.md)
4. [QA Taxonomy](00-foundation/qa-taxonomy.md)
5. [Error Taxonomy](00-foundation/error-taxonomy.md)
6. [Domain Semantics](00-foundation/domain-semantics.md)
7. [Evaluation Strategy](00-foundation/evaluation-strategy.md)
8. [System Design](01-architecture/system-design.md)
9. [D1 Schema Design](01-architecture/data-model.md)
10. [QA Engine Contracts](01-architecture/engine-contracts.md)
11. [M0 Validation Protocol](02-product/m0-requirements.md)
12. [M1 Accounts, Credits, And Batch QA](02-product/m1-batch-commercial-definition.md)
13. [Implementation Plan And Timeline](04-roadmap/implementation-plan.md)
14. [M1 Batch Commercial Plan](04-roadmap/m1-batch-commercial-plan.md)
15. [Pairvu Product Expansion Roadmap](04-roadmap/product-expansion-roadmap.md)
16. [M1 Stripe Test Mode Setup](01-architecture/m1-stripe-test-setup.md)
17. [Founder Review: M0 Specification And Architecture](04-roadmap/founder-review-m0-spec.md)
18. [M0 Public Beta Launch Plan](04-roadmap/m0-public-beta-launch-plan.md)
19. [M0 Public Beta Live Tracker](04-roadmap/m0-public-beta-tracker.md)
20. [Public Beta Telemetry Operations](04-roadmap/public-beta-telemetry-operations.md)
21. [Pairvu SEO And GEO Strategy](03-growth/seo-geo-strategy.md)
22. [SEO And GEO Implementation Plan](04-roadmap/seo-geo-implementation-plan.md)
23. [Keyword Evidence Baseline](03-growth/keyword-evidence-baseline-2026-07-29.md)
24. [Keyword Ownership And Cannibalization Audit](03-growth/keyword-ownership-and-cannibalization-audit-2026-08-17.md)
25. [External Distribution And Backlink Plan](03-growth/external-distribution-plan-2026-08-17.md)
26. [Subcategory Evidence Generation Plan](03-growth/subcategory-evidence-generation-plan-2026-08-17.md)

## Current Decision

M0 and M1 are implemented, with founder production acceptance recorded by
2026-08-14 and public paid beta approved on 2026-08-15. M2 Saved Products and
M2.1 explicit reference views have production schema and usage evidence.
Commercial validation and complete M2 production walkthroughs remain open.

The 2026-10-10 read-only audit confirmed production migrations 0001–0019,
Worker version `3117176b-e5d1-410b-88e6-b071fb8d1208`, healthy billing audit
queries, and 66 sitemap entries. The exact Worker-to-Git-SHA mapping remains
unverified. Current subscriptions are two Free workspaces; historical live
subscription events exist, but the paid-beta success gate is not established.

Execution and current status:

- [Production verification and prioritized remaining tasks](04-roadmap/production-status-and-backlog-2026-10-10.md)
- [M1 paid-beta acceptance](04-roadmap/m1-paid-beta-release-checklist.md)
- [M1 implementation](04-roadmap/m1-batch-commercial-plan.md)
- [Approved product expansion roadmap](04-roadmap/product-expansion-roadmap.md)
- [SEO and GEO implementation](04-roadmap/seo-geo-implementation-plan.md)

M0's six-family checker boundary remains fixed. Custom rules, ranking,
auto-fix, integrations, and monitoring require their separate evidence gates.

## Core Product Rule

The product is not successful because a model can compare two images. It is successful when a business can safely avoid a large share of manual reviews without increasing unacceptable false passes.

## Current Founder Review Questions

- Is the historical credential-rotation requirement closed with evidence?
- Can the production Worker be traced to its exact pushed release commit?
- Have M2 reference views, version promotion, archive/restore, reuse, and expiry
  passed a recorded signed-in production walkthrough?
- Has a real standard Check Pack purchase and Live Customer Portal flow passed?
- Do external users repeat batches and saved references, and pay for that value?
- Are operational alerts and acquisition-to-completion reporting actionable?

## Current Organic Acquisition Decision

- Pairvu is the brand.
- `AI product image checker` is the product category and is owned by `/`.
- `AI product photography` is the market topic and is owned by
  `/ai-product-photography`.
- Ecommerce, Amazon, and Shopify are acquisition use cases, not the complete
  product identity.
- SEO and GEO use the same crawlable, source-backed, evidence-first pages.
- New pages require distinct intent, current product support, unique evidence,
  internal links, and recorded demand.

## Next Implementation Step

Follow R01–R07 in the [prioritized backlog](04-roadmap/production-status-and-backlog-2026-10-10.md):
close safety and release-provenance evidence, finish existing-feature acceptance,
and review paid use, saved-reference reuse, operations, and search conversion.
Search Console/Bing setup and migrations 0016–0019 are no longer unstarted tasks.
Do not expand later product stages solely because calendar time has elapsed.

## 下一阶段升级与自动研发

- [2026-10-10 完整产品升级方案](04-roadmap/product-upgrade-plan-2026-10-10.md)：事实校正、SKU 真值、证据、人工审核、API、评测和商业验证。
- [自动开发与独立验收](../operations/README.md)：总控、开发/QA 任务、机器状态和发布边界。

- [2026-10-10 下一批开发任务](04-roadmap/next-development-batch-2026-10-10.md)：生产状态闭环、SKU版本化、结构化证据与人工审核。
- [2026-10-10 已完成生产发布证据](../operations/evidence/production-release-2026-10-10.json)：部署SHA、Worker版本、远端核验和独立生产验收。

## 2026-10-10 升级跟踪

- [项目整体进展](04-roadmap/project-progress-2026-10-10.md)
- [SKU版本化设计契约](01-architecture/sku-versioned-profile-contract.md)
- [SKU字段矩阵](02-product/sku-profile-field-matrix.md)
