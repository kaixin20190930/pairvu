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
12. [Implementation Plan And Timeline](04-roadmap/implementation-plan.md)
13. [Founder Review: M0 Specification And Architecture](04-roadmap/founder-review-m0-spec.md)
14. [M0 Public Beta Launch Plan](04-roadmap/m0-public-beta-launch-plan.md)
15. [M0 Public Beta Live Tracker](04-roadmap/m0-public-beta-tracker.md)
16. [Public Beta Telemetry Operations](04-roadmap/public-beta-telemetry-operations.md)
17. [Pairvu SEO And GEO Strategy](03-growth/seo-geo-strategy.md)
18. [SEO And GEO Implementation Plan](04-roadmap/seo-geo-implementation-plan.md)
19. [Keyword Evidence Baseline](03-growth/keyword-evidence-baseline-2026-07-29.md)

## Current Decision

M0 has passed the core technical-hypothesis checkpoint. The project is now in
real-behavior and public-beta readiness validation.

Execution and current status:

- [M0 Public Beta Launch Plan](04-roadmap/m0-public-beta-launch-plan.md)
- [M0 Public Beta Live Tracker](04-roadmap/m0-public-beta-tracker.md)
- [Pairvu SEO And GEO Strategy](03-growth/seo-geo-strategy.md)
- [SEO And GEO Implementation Plan](04-roadmap/seo-geo-implementation-plan.md)

Do not expand M0 product scope.

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
