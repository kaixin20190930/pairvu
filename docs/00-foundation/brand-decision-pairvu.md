# Brand Decision: Pairvu

Status: Accepted

Decision date: 2026-07-29

## Brand

- Name: Pairvu
- Pronunciation: "Pair-view"
- Name origin: "Pair" for the reference/candidate image pair and "vu" for view, visual, and seen.
- Product role: A product visual assurance brand, not a marketplace-specific or SKU-specific checker.

## Core Expression

Primary product descriptor:

> AI product image checker

Market category:

> AI product photography

Positioning:

> Quality control for AI product photography

Primary value proposition:

> See what changed. Keep products true.

The existing checker headline remains:

> Did AI change your product?

Primary action:

> Check AI product photos before publishing

Ecommerce is an initial acquisition use case, not the full brand definition.

## Product Architecture

- Pairvu: master brand
- Pairvu Check: current two-image checker
- Pairvu Batch: deferred
- Pairvu API: deferred
- Pairvu Monitor: deferred

Deferred product names do not expand the approved M0 scope.

## Domain

Preferred domain: `pairvu.com`

Domain registration: Completed by founder on 2026-07-29.

Production Worker: `pairvu`

Production D1: `pairvu-production`

Production R2: `pairvu-assets-production`

Application binding: Completed. The production application is available at:

> `https://pairvu.com`

Production Worker version verified on 2026-07-29:

> `2d4e97bc-4423-483c-9ad9-1ef7a312e050`

Cloudflare is authoritative for the domain. The apex and `www` hostnames are
bound to the production Worker. Production D1/R2 bindings, scheduled retention
trigger, `/api/health`, `/api/runtime-config`, `robots.txt`, and `sitemap.xml`
were verified during production setup.

Formal trademark clearance remains a founder-owned launch action. Domain ownership is not a substitute for legal
clearance.

## Migration Rules

- Replace user-visible VisualQA branding with Pairvu.
- Remove internal milestone labels such as M0 from public-facing copy.
- Keep existing database names, storage keys, environment types, and infrastructure identifiers stable until a
  separately planned technical migration is justified.
- Do not expose provider, model, prompt version, or other internal execution metadata in the public result UI.
- Keep the homepage as the sole owner of the `AI product image checker`
  category. Organic content architecture is governed by
  [Pairvu SEO And GEO Strategy](../03-growth/seo-geo-strategy.md).
