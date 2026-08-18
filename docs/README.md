# Pairvu Product Documentation

This is the working documentation baseline for Pairvu.

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

M0 has passed the core technical-hypothesis checkpoint. The project is now in
real-behavior and public-beta readiness validation.

Execution and current status:

- [M0 Public Beta Launch Plan](04-roadmap/m0-public-beta-launch-plan.md)
- [M0 Public Beta Live Tracker](04-roadmap/m0-public-beta-tracker.md)
- [Pairvu SEO And GEO Strategy](03-growth/seo-geo-strategy.md)
- [SEO And GEO Implementation Plan](04-roadmap/seo-geo-implementation-plan.md)
- [Keyword Ownership And Cannibalization Audit](03-growth/keyword-ownership-and-cannibalization-audit-2026-08-17.md)
- [External Distribution And Backlink Plan](03-growth/external-distribution-plan-2026-08-17.md)

M0's checker boundary remains fixed. New commercial and batch work must follow
the approved [M1 Accounts, Credits, And Batch QA](02-product/m1-batch-commercial-definition.md)
definition rather than expanding M0 opportunistically.
Product work after M1 must follow the evidence gates and boundaries in the
[Pairvu Product Expansion Roadmap](04-roadmap/product-expansion-roadmap.md).

## Core Product Rule

The product is not successful because a model can compare two images. It is successful when a business can safely avoid a large share of manual reviews without increasing unacceptable false passes.

## Current Founder Review Questions

- Does the 16-case real single-variable matrix meet the approved quality gates?
- Are any real failures caused by prompt interpretation, taxonomy overlap, or
  RiskPolicy?
- Is the unfamiliar-user journey usable without onboarding or explanation?
- Are acquisition, product behavior, model behavior, and feedback traceable?
- Is 24-hour anonymous deletion verified for originals and derivatives?
- Do limited public-beta results support broader SEO/social distribution?

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

Complete production indexing and public-beta hardening in the
[SEO And GEO Implementation Plan](04-roadmap/seo-geo-implementation-plan.md):

- deploy and run production crawl, mobile, accessibility, schema, and link QA;
- verify Google Search Console and Bing Webmaster Tools, then submit the
  sitemap;
- export country/language-specific Keyword Planner evidence when account access
  is available;
- keep public-beta feedback, guardrail, and operations gates separate from SEO
  publication progress.
