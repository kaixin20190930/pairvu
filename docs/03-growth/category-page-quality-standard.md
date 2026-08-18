# Pairvu Category Page Quality Standard

Status: `ACTIVE`

Owner: Founder / Product / Growth

Effective date: 2026-08-03

## Purpose

Category pages must help a real reviewer make better product-image approval decisions. They are not route-count assets, keyword substitutions, or lightly rewritten versions of the generic checker page.

Every new category route defaults to `planned` and `indexable: false`. It can become `published` and indexable only after satisfying this document, passing `pnpm run test:category-content`, and receiving founder approval.

## Required Search Role

Each page must own a distinct category decision intent:

- who performs the review and where the image will be used;
- which visible attributes define a sellable product in that category;
- which presentation changes are harmless;
- which missing evidence requires REVIEW;
- which visible product changes require FAIL.

The page must support the homepage category `AI product image checker`. It must not compete with the homepage through a generic synonym page.

## Mandatory Content

| Requirement | Minimum |
| --- | ---: |
| Explicit audience definition | 1 |
| Search-intent justification | 1 |
| Relevant packaging or product formats | 5 |
| Category identity hierarchy | 6 attributes |
| PASS / REVIEW / FAIL decision rows | 8 |
| Controlled visual cases | 3 |
| Evidence cases not reused by another category | 2 |
| Confirmed product-change evidence | 1 |
| Harmless hard-negative evidence | 1 |
| Observability evidence | 1 |
| Category-specific failure modes | 5 |
| Category-specific insight sections | 3 |
| Input requirements | 5 |
| Operational workflow steps | 5 |
| Explicit limitations | 6 |
| Category-specific FAQs | 5 |
| Structured English content | 1,500 words |

The word threshold is a guardrail, not a writing target. Repetition, filler, generic AI explanations, and keyword padding do not satisfy the standard.

Published category manifests must also remain below 55% pairwise lexical overlap, may share at most one controlled evidence case, and may not reuse category-insight titles. These automated checks make noun substitution and lightly rewritten template pages fail the normal SEO test.

## Evidence Standard

The three required evidence roles are different:

1. `product_change`: a founder-reviewed pair with a visible material product change and a justified FAIL or REVIEW.
2. `hard_negative`: a scene, light, shadow, background, crop, or position change that preserves observable product identity and should PASS.
3. `observability`: an image pair where a required attribute cannot be verified and the honest outcome is REVIEW.

Every evidence item must use an existing public comparison page and checked local image assets. It must explain the observed facts and the decision lesson. Reusing one case to imply several independent facts is not acceptable.

## Page Structure

Published pages use this order unless a category requires a documented exception:

1. Category promise, audience, and checker action.
2. Category identity hierarchy.
3. Attribute-level PASS / REVIEW / FAIL matrix.
4. Controlled visual evidence covering all three roles.
5. Category-specific failure modes and business risk.
6. Original field notes or category insights.
7. Supported formats and input requirements.
8. Operational pre-publish workflow.
9. Explicit product and compliance boundaries.
10. Category-specific FAQ and final checker action.

## Non-Negotiable Boundaries

- Do not publish a page because a route and keyword exist.
- Do not swap category nouns into a shared template and call it unique content.
- Do not claim support outside the approved product boundary.
- Do not claim legal, marketplace, regulatory, barcode, ingredient, physical-product, or calibrated-color certification.
- Do not use generated statistics, unverified cost savings, or unsupported customer outcomes.
- Do not index a page while required evidence, founder approval, or automated checks are missing.
- Do not create platform-plus-category combinations until the parent category page has proven demand and sufficient unique evidence.

## Publication Workflow

1. Register the proposed route as `planned` and `indexable: false`.
2. Record audience, search intent, and the category identity model in `lib/seo/category-content.ts`.
3. Select founder-approved controlled evidence for product change, hard negative, and observability.
4. Build the page from the structured manifest and add genuinely category-specific insights.
5. Run `pnpm run test:category-content`, `pnpm run test:seo`, and `pnpm run build`.
6. Complete desktop and mobile visual QA, including image loading, overflow, table behavior, and structured data.
7. Obtain founder approval and record `founderApprovedAt`.
8. Change the registry entry to `published` and `indexable: true`.
9. Deploy, inspect the canonical and sitemap, then request indexing.

## Current Status

| Category | Public status | Reason |
| --- | --- | --- |
| Cosmetics | `PUBLISHED` | First flagship page meeting the standard |
| Beverages | `PUBLISHED` | Second flagship with capacity, count, reflection, and observability guidance |
| Personal care | `PUBLISHED` | Third flagship with packaging-system, dispenser, lighting, and coverage guidance |
| Packaged food | `PUBLISHED` | Fourth flagship with sellable-offer, package-count, perspective, and text-readability guidance |
| Household packaged goods | `PUBLISHED` | Founder-reviewed FOLDWELL scent-and-count FAIL, laundry-room PASS, and front-versus-back REVIEW evidence now form the primary three-role workflow; earlier cleaner evidence remains available as supporting cases |
| Skincare | `PUBLISHED` | Founder-reviewed sunscreen-stick FAIL, PASS, and REVIEW evidence; flagship workflow and scope-layer model completed on 2026-08-17 |

## Coverage Language Standard

Category pages must distinguish three different layers of product-image quality instead of implying that one visual comparison certifies an asset for publication:

1. **Product fidelity (available now):** visible logo and identity text, printed values, primary product count, main semantic color, major components, package shape, and observability.
2. **Creative and brand rules (future configurable capability):** composition, product occupancy, approved backgrounds and props, safe areas, typography, brand palette, and channel-specific presentation rules.
3. **Technical, marketplace, and compliance review (outside the current checker):** dimensions, file format, compression, color profile, accessibility, platform policy, claims, warnings, ingredients, and legal or regulatory approval.

No page may use “complete,” “all-in-one,” “guaranteed,” “100% accurate,” or equivalent language for the current checker. The correct promise is evidence-based product fidelity review, with REVIEW used when the supplied image cannot establish a required fact.
