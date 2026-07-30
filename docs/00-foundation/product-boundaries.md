# Product Boundaries

## Initial Claims

Use language such as:

- pre-publish QA;
- automated visual review;
- potential issue detected;
- likely mismatch;
- requires review;
- marketplace readiness check.

Avoid claiming:

- guaranteed marketplace acceptance;
- legal compliance;
- 100% image accuracy;
- complete product authenticity;
- perfect visual verification.

Marketplace acceptance is controlled by the marketplace. Pairvu can only
report apparent visible readiness against supported and versioned checks.

## SEO And GEO Claim Boundary

Organic acquisition does not expand product scope.

- Pairvu may describe itself as an `AI product image checker`.
- `AI product photography` is the market context, not a claim that Pairvu
  generates product photography.
- Ecommerce, Amazon, Shopify, brands, and creative agencies are use cases, not
  exclusive product boundaries.
- Platform pages must not imply official affiliation, approval, certification,
  or guaranteed compliance.
- Public examples must use founder-owned or approved static assets and must not
  expose provider, model, prompt, policy, identifiers, or private telemetry.
- Physical electronics remain deferred even if related keywords show demand.
- A keyword can justify research or content only when the current product
  genuinely supports the promise.

The complete organic acquisition boundary is defined in
[Pairvu SEO And GEO Strategy](../03-growth/seo-geo-strategy.md).

## MVP Non-Scope

Do not build in M0/M1:

- proprietary foundation model;
- mobile app;
- browser extension;
- many marketplaces;
- many categories;
- video QA;
- automatic fixing;
- complex role hierarchy;
- SSO;
- DAM or PIM integrations;
- realtime collaboration;
- elaborate dashboards;
- AI score gamification.

## Decision Principles

- Trust before automation rate.
- `REVIEW` beats fake certainty.
- Never infer absence from non-visibility.
- Do not let GPT directly decide final verdict.
- Do not make UI depend on raw model output.
- Store engine, risk, model policy, and rule versions for every analysis; store provider/model/prompt details on model-call records.
- Keep user-facing billing units independent from provider tokens.
- Treat data privacy as a product feature.

## Edge Cases To Respect

- Candidate angle differs greatly: mark details as `not_observable`, not missing.
- Poor reference image: return reference quality insufficient.
- Multiple conflicting references: return reference conflict.
- Intentional background change: do not penalize product fidelity unless selected rule requires it.
- Product variants: require separate profiles or explicit allowed variation.
- Tiny text: return `not_observable`, not `PASS`.
- Reflection changes apparent color: prefer `REVIEW` over false mismatch.
- Occlusion: treat as a visibility problem.
